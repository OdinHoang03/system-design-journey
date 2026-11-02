---
id: url-shortener
title: "Case study: designing a URL shortener"
sidebar_position: 7
slug: /url-shortener
description: "Designing a link-shortening service from requirements: capacity estimation, Base62 code generation, storage, caching, scaling, asynchronous analytics."
---

> Put every piece together into one complete system.

## Story

NoteNest users often share absurdly long links. Minh decides to build **notenest.link**: paste a long link, get back a short one like `notenest.link/aZ3x9Qk`. It's a classic interview question, and a chance to revisit the whole journey: HTTP, DNS/CDN, load balancers, caches, databases, queues.

The process for any design problem: **clarify requirements → estimate → API → high-level design → deep-dive on the hard parts → trade-offs**.

## Core concepts

### 1. Requirements

**Functional:** create a short link from a long one; visiting the short link redirects; (optional) custom aliases, expiry, click statistics.

**Non-functional:** low redirect latency (under ~100 ms), high availability (a dead link is a permanently broken link), hard-to-guess codes, ability to handle heavy read load.

**Out of scope (say so explicitly in an interview):** accounts, advanced spam/phishing protection.

### 2. Estimation (rounded so it's easy to do in your head)

- 100 million new links/month ≈ **40 writes/second**.
- Read:write ratio = 100:1 ⇒ ≈ **4,000 reads/second**, with peaks 5–10x higher.
- 5 years of storage: 100M × 12 × 5 = 6 billion records; at ~500 bytes each ⇒ ≈ **3 TB**.
- How many characters do we need? With Base62 (`a–z A–Z 0–9`): 62⁶ ≈ 5.7×10¹⁰, 62⁷ ≈ 3.5×10¹². **7 characters** is plenty for 6 billion links.

Conclusion: the system is **read-heavy**, the data isn't huge, and writes are light. Caches and replicas are the main tools.

### 3. API

```http
POST /api/v1/links
{"url": "https://example.com/very/long/path", "alias": "my-note", "expires_at": "2027-01-01"}
→ 201 {"short_url": "https://notenest.link/aZ3x9Qk"}

GET /aZ3x9Qk
→ 301 or 302, Location: https://example.com/very/long/path
```

**301 or 302?** `301` (permanent) lets browsers/CDNs cache the redirect: fast and light on load, but we can't count clicks and it's hard to change the destination. `302` (temporary) goes through the server every time: we can count clicks and change the destination, at a higher load cost. If you need statistics, use `302`.

### 4. Generating the short code: the hardest part

| Approach | Idea | Pros | Cons |
|---|---|---|---|
| Hash and truncate | MD5/SHA of the URL, take 7 characters | No counter needed | **Collisions**: you must check and retry |
| Counter + Base62 | Incrementing ID → convert to Base62 | No collisions, short | Codes are guessable; a single counter is a bottleneck |
| Block-allocated counter | Each app server requests a **block of IDs** (say 1,000 numbers) from a central service | Fast, little coordination | A few IDs are lost when a server dies (acceptable) |
| Random + check | Generate 7 random characters, insert if not already present | Hard to guess | More collisions as the table fills; needs a `UNIQUE` constraint |
| Snowflake-style ID | Timestamp + machine + sequence number | Distributed, no coordination | Longer than 7 characters in Base62 |

The practical choice: **block-allocated counter + Base62**, optionally **scrambling** the ID (bit permutation or light encryption) before converting to Base62 so codes are hard to guess. User-defined aliases share the same `UNIQUE` constraint.

```python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def to_base62(n: int) -> str:
    if n == 0:
        return ALPHABET[0]
    out = []
    while n:
        n, r = divmod(n, 62)
        out.append(ALPHABET[r])
    return "".join(reversed(out))
```

### 5. Storage

The data is simple and accessed by key: `short_code → long_url, created_at, expires_at, owner`. A key-value store or a relational table with `short_code` as the primary key both work fine. At 3 TB, **shard by `short_code`** (hash) when needed; each shard gets replicas (lesson 5). The query "all links for user X" needs a separate secondary index.

### 6. Overall architecture

![URL shortener architecture](/img/diagrams/url-shortener.svg)

*Diagram drawn from scratch for this project; idea referenced from [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0), the Pastebin/Bit.ly example.*

The read path (the hot path):

1. The client requests `notenest.link/aZ3x9Qk` ⇒ DNS (lesson 2) ⇒ CDN, which can answer directly if you use `301` or a short-lived cache.
2. An L7 load balancer (lesson 3) picks a **stateless** app server.
3. The app checks the **cache** (lesson 4); on a hit it responds immediately. On a miss it reads from a **database replica** (lesson 5), then writes the result back to the cache with a TTL.
4. It returns `302` and at the same time **pushes a click event onto a queue** (lesson 6); a worker batches and records the statistics, so the redirect isn't slowed down.

The write path: the app takes an ID from its allocated block, converts it to Base62, writes to the primary, and (optionally) puts it straight into the cache.

### 7. Deep-diving the hard parts

- **Hot keys**: a celebrity's link gets clicked millions of times. Cache + CDN handle it; avoid stampedes with locking/TTL jitter.
- **Expiry**: check `expires_at` at read time, and clean up in the background with a periodic job.
- **Availability**: multiple app servers, multiple replicas, a replicated cache; if the cache dies, the database must withstand the read load (or you rate-limit).
- **Abuse**: rate-limit by IP/API key, check destination URLs against a malicious list, block redirect loops.
- **Security**: allow only `http(s)` schemes; use non-sequential codes if you don't want to be scanned.
- **Analytics**: a click is an event that is processed *afterward*, asynchronously, and you accept a delay of a few seconds to a few minutes.

## Trade-offs

| Decision | Choice | Why | Cost |
|---|---|---|---|
| URL encoding | Block-allocated counter + Base62 | No collisions, fast | Needs a block-issuing service; scramble to make codes hard to guess |
| Redirect | `302` | Count clicks, change destinations | Every visit goes through the server |
| Statistics | Queue + worker | Doesn't slow the hot path | Numbers lag, may be slightly off |
| Storage | KV/relational, sharded by code | Simple key-based access | Per-user queries need a secondary index |
| Cache | Cache-aside, TTL | 99% of reads never touch the DB | Deleted links stay alive until the TTL expires |

## Common mistakes

- Jumping into drawing the architecture before asking about requirements and estimating.
- Truncating a hash and forgetting to handle collisions.
- An auto-increment counter in a single database, which becomes both a bottleneck and a single point of failure.
- Using `301` and only then realizing you can't count clicks.
- Sequential codes are easy to guess, so outsiders can scan every "private" link.
- Writing statistics synchronously inside the redirect path.
- Not rate-limiting link creation, so spam fills up the store.

## Exercises & interview questions

1. Redo the estimation with different numbers (1 billion links/month). Which component changes first?
2. Compare the three code-generation approaches; pick one and defend it.
3. Add a "self-destruct after N clicks" feature. What needs to change, and what concurrency problems come up?
4. Design the statistic "top links by country in the last 24 hours".
5. The system must survive the cache dying completely. What do you do?
6. Expand to multiple geographic regions: where do the data and the IDs live?
7. *Hands-on:* implement a minimal version (one server, SQLite, `to_base62`), then add a cache.

## Further reading

- [donnemartin/system-design-primer: Design Pastebin.com (or Bit.ly)](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md) (CC BY 4.0)
- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [RFC 9110, section 15.4: Redirection 3xx](https://www.rfc-editor.org/rfc/rfc9110#name-redirection-3xx)
- [Base62 / Base encoding on Wikipedia](https://en.wikipedia.org/wiki/Base62)

**End of part 1.** You've just taken NoteNest from a single laptop to a multi-tier system. Head back to the [Roadmap](/roadmap) to see the whole journey, or browse more [Resources](/resources).
