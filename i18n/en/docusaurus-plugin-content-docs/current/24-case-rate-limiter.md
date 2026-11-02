---
id: case-rate-limiter
title: "Case study: designing a rate limiter"
sidebar_position: 24
slug: /case-rate-limiter
description: "Design a distributed rate limiter: requirements, estimation, atomic counting in Redis, accuracy vs cost, fail-open, multiple regions."
---

> Turn an algorithm on paper into a service that survives hundreds of thousands of checks per second.

## Story

In lesson 11, Minh learned token bucket and sliding window. Now NoteNest opens a public API to partners and he must build a real rate limiter: running on 20 gateway servers, applying different quotas per plan, not slowing normal requests, and not going down and taking the API with it. It is a classic interview question: *"Design a rate limiter."*

The usual flow: **requirements → estimation → API → high-level design → deep dive → trade-offs**.

## Core concepts

### 1. Requirements

**Functional:** limit requests by key (user, API key, IP) and by route; configurable rules (e.g. Free 60/min, Pro 600/min); reject with `429` plus `Retry-After`.

**Non-functional:** very low added latency per request (under ~2 ms), "good enough" accuracy, high availability (a broken limiter must not break the API), works across many servers.

**Out of scope:** network-layer DDoS protection (CDN/WAF's job, [lesson 2](./02-dns-cdn.md)).

### 2. Estimation

- Peak API 50,000 requests/second (lesson 8) ⇒ 50,000 checks/second.
- 5 million active keys; one ~100-byte counter each ⇒ ≈ **500 MB**, fits one Redis.
- 50,000 ops/second is light for a Redis node (hundreds of thousands of ops/s), but costs a ~0.5 ms network round trip per request.

Conclusion: the data is small; the bottleneck is **latency and atomicity**, not capacity.

### 3. API and placement

The limiter is a **middleware in the gateway** (lesson 10), not a public endpoint. The core function:

```
allow(key, rule) -> {allowed: bool, remaining: int, retry_after: seconds}
```

Response when blocked:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

### 4. High-level design

![Distributed rate limiter](/img/diagrams/case-rate-limiter.svg)

*Original diagram drawn for this project; idea referenced from [Stripe's post on rate limiters](https://stripe.com/blog/rate-limiters).*

The gateway derives the key (user + route) and asks Redis to check the counter; if allowed it forwards to the API servers, otherwise it returns `429`. Rules (quotas per plan) live in a config store and are cached locally in the gateway, refreshed periodically.

### 5. Deep dive: accurate distributed counting

**The race.** "GET then SET" is not atomic: two gateways both read `59`, both allow, and the quota is exceeded. The read-modify-write must be **one atomic operation**: `INCR` for a fixed window, or a **Lua script** (Redis runs the whole script with nothing interleaved).

A token bucket in Lua (abridged):

```lua
-- KEYS[1]=key; ARGV: rate, capacity, now(ms)
local s = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(s[1]) or tonumber(ARGV[2])
local ts = tonumber(s[2]) or tonumber(ARGV[3])
tokens = math.min(ARGV[2], tokens + (ARGV[3]-ts)/1000*ARGV[1])
local ok = tokens >= 1
if ok then tokens = tokens - 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[3])
redis.call('PEXPIRE', KEYS[1], 120000)  -- idle keys clean themselves up
return ok and 1 or 0
```

Use Redis time (or one agreed clock) rather than each gateway's clock to avoid skew.

**Choosing the algorithm.** Token bucket: little memory (two numbers per key), allows short bursts; a good default. Sliding window log: the most accurate but memory grows with request count. Sliding window counter: a cheap approximation with small error.

**Scaling Redis.** Shard keys by hash across nodes ([lesson 5](./05-database-replication-sharding.md)); each key lives on one node so counting stays correct. A "hot" key (one customer hammering) only heats one node.

**Cutting round trips.** The gateway keeps a **small local allowance** (reserve 10 tokens from Redis, spend them gradually). Accuracy drops a little in return.

**When Redis is slow or down.** Use a very short timeout (a few ms). On timeout, **fail-open** (let through, with a local counter as a safety net) for ordinary APIs, and **fail-closed** only for sensitive routes such as login. Raise an alert so operators know.

**Multiple regions.** Exact global counting needs a cross-region round trip (expensive, see lesson 8). Usually you split the quota per region (each gets 1/N) or sync asynchronously between regions and accept slight overshoot.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Central counting in Redis | Accurate quota across all gateways | Extra round trip, one more component that can fail |
| Local counting per gateway | No network cost | Real quota = N × limit |
| Reserving tokens in batches | Fewer Redis calls | Inaccuracy; unused tokens wasted if a gateway dies |
| Lua script | Atomic, one round trip | Logic lives in Redis; harder to test and upgrade |
| Fail-open | API keeps running if the limiter breaks | Protection vanishes when risk is high |
| Fail-closed | Always protected | A broken limiter stops the whole API |
| Per-region quotas | No cross-region round trip | A customer concentrated in one region is blocked early |

## Common mistakes

- Non-atomic read-then-write: quotas are exceeded under heavy load.
- Using each server's own clock; skew makes windows wrong.
- No TTL on counter keys, so Redis bloats forever.
- Making the limiter a single point of failure: Redis dies and the API dies with it.
- One global quota with no distinction between expensive and cheap routes.
- No metrics (blocked requests, check latency), so you cannot tell whether the rules make sense.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="case-rate-limiter" />

## Further reading

- [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)
- [RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585#section-4)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Next:** from guarding the entrance to a read-heavy problem with write fan-out. Lesson 25: [Designing a news feed](./25-case-news-feed.md).
