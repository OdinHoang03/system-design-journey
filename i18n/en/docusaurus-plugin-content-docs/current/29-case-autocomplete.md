---
id: case-autocomplete
title: "Case study: designing search autocomplete"
sidebar_position: 29
slug: /case-autocomplete
description: "Design type-ahead search suggestions: a trie storing top-k, popularity ranking, near-real-time updates, caching, and sub-100 ms latency."
---

> Answer before the user has finished asking.

## Story

NoteNest has a public note search box. Users type "nodejs ..." and must remember the whole phrase; many give up. Minh wants the box to **suggest as you type**: typing `no` shows `notion`, `node js`, `note taking`. It sounds simple, but every keystroke is a request, so a million users typing at once produces a huge volume of queries, and each suggestion must return before the next keystroke.

## Core concepts

### 1. Requirements

**Functional:** given a **prefix**, return the 5 most popular suggestions starting with it; support accented Vietnamese and multiple languages; (optional) personalization, spelling correction.

**Non-functional:** **very fast** (p99 under ~100 ms, since typing is continuous); highly available; suggestions reflect trends within minutes to hours (not instant); filter offensive content.

**Out of scope:** full-text search (lesson 15), ranking search results.

### 2. Estimation (see lesson 8)

- 10M daily active users, 10 searches each × on average 4 keystrokes that send a request ⇒ 400M requests/day ≈ **5,000/s**, peak ~**25,000/s**.
- 100M distinct queries at ~30 bytes ⇒ ≈ **3 GB** of raw data; a prefix tree is a few times larger but still **fits in the RAM** of a few machines.

Conclusion: **extremely read-heavy, small data**; data can live in memory and caching pays off hugely.

### 3. API

```http
GET /api/v1/suggest?q=no&lang=en&limit=5
→ 200 {"suggestions": ["notion", "node js", "note taking", "notebook", "nodemailer"]}
```

The browser sends only after the user pauses typing ~100–150 ms (**debounce**) and cancels the old request when a new key arrives.

### 4. High-level design

![Search autocomplete](/img/diagrams/case-autocomplete.svg)

*Original diagram drawn for this project.*

There are two separate paths:

- **Serving path (read, fast):** browser → cache (prefix → top 5) → trie servers. Most requests hit the cache.
- **Data path (write, slow):** query logs → aggregate counts → build a new trie → push to the trie servers.

Separating the two is the key point: the trie is not updated per query, so the read path is never disturbed.

### 5. Deep dive

**Trie (prefix tree).** Each edge is a character; the path from the root to a node is a prefix. Looking up a prefix of length `L` costs `O(L)`, independent of the number of queries.

```text
        (root)
          n
          o
        /   \
       d     t
       e     e → "note" (880)
       js    book (310), taking (640)
```

If each lookup had to walk the whole subtree to find the top 5, a node near the root (say `n`) has millions of descendants: far too slow. The fix: **precompute top-k at every node** (the 5 best suggestions of its subtree, with scores). A lookup is then `L` steps plus reading a ready list: `O(L)`. The cost is extra memory (reduce it by storing only query ids and pruning very rare branches).

**Ranking score.** The basics are query frequency over a recent window. In practice you mix in: recency (time-decayed weights, exponential decay), the click-through rate on suggestions, language/region, and a sensitive-content filter (a blocklist applied while building the trie).

**Near-real-time updates.** Rebuild the whole trie every few minutes to hours with a separate batch job from aggregated query logs, then **swap it in as a whole** (blue/green, lesson 22) so servers always read a consistent trie. For hot trends that must surface faster, add a small **overlay** updated from an event stream (lesson 16) and merged with trie results at serve time.

**Caching.** Short prefixes (1–3 characters) have few distinct values and are asked constantly: cache in the browser (`Cache-Control: max-age`), the CDN, and Redis (lessons 2, 4). Browser caching alone removes most repeated requests.

**Scaling.** The data is small, so each machine can hold the **entire trie**; just replicate and load-balance (lesson 3). If data outgrows RAM, **shard by prefix** (e.g. `a–f`, `g–m`…). Beware skew: popular letters are far heavier, so split by actual load, not evenly by alphabet.

**Other details.** Normalize input (lowercase, optional accent stripping, Unicode NFC), personalized suggestions (mix private history with the global top), spelling correction using edit distance.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Store top-k at each node | `O(L)` lookups, very fast | RAM; must rebuild when scores change |
| Walk the subtree at query time | Less memory, always fresh | Slow for short prefixes |
| Batch trie rebuilds | Simple, reads never locked | Suggestions lag by minutes to hours |
| Streaming overlay | Catches hot trends | One more data path to operate |
| Heavy browser/CDN caching | Large load cut, fast | Suggestions may be minutes stale |
| Every machine holds the whole trie | Simple, no cross calls | Bounded by one machine's RAM |
| Shard by prefix | Data can grow arbitrarily | Skewed load; more complex |
| Personalization | More relevant suggestions | Hard to cache; more sensitive data to protect |

## Common mistakes

- Sending a request on every keystroke with no debounce and no cancellation; the backend is hammered and responses arrive out of order.
- Updating the trie directly per query on the read path; locks and latency spike.
- Not storing top-k, walking the whole subtree per request.
- Not filtering sensitive content, or letting personal data in query logs (emails, phone numbers) turn into suggestions shown to others.
- Sharding evenly by alphabet so one shard (`s`, `t`, `n`...) carries many times the load.
- Forgetting Unicode normalization: the same accented word typed with two encodings returns two different results.
- Measuring p99 only on the server instead of from the user's side.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="case-autocomplete" />

## Further reading

- [Trie on Wikipedia](https://en.wikipedia.org/wiki/Trie)
- [Autocomplete on Wikipedia](https://en.wikipedia.org/wiki/Autocomplete)
- [Elasticsearch: Suggesters](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html)
- [Bloom filter on Wikipedia](https://en.wikipedia.org/wiki/Bloom_filter) (quickly filtering queries that have no suggestions)

**That completes the case studies and this batch of lessons.** See the whole journey in the [Outline](/outline).
