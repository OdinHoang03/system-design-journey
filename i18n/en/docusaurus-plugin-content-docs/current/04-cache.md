---
id: cache
title: "Caching"
sidebar_position: 4
slug: /cache
description: "Caches make responses fast and cut load: cache-aside, write-through, TTL, eviction, invalidation, cache stampede."
---

> The same question is asked a million times; stop answering it from scratch.

## Story

The NoteNest home page shows "Top 10 notes today". Every view runs a heavy aggregate query against the database, costing 200 ms. At 5,000 views per second, the database buckles, even though the query result is almost *identical* for a whole hour. Minh realizes that most of the work is being repeated for nothing.

## Core concepts

### What a cache is and why it works

A **cache** stores the result of expensive work in a place that's faster to reach. It works because of:

- **Locality**: a small slice of the data receives most of the accesses (the 80/20 rule).
- **The speed gap**: reading RAM takes on the order of a hundred nanoseconds, reading from a cache over the network takes under 1 ms, while a heavy database query can take tens or hundreds of ms.

The key metric is the **hit ratio** = hits / (hits + misses). A 95% hit ratio means only 5% of requests touch the database, cutting its load by roughly 20x.

### Where caches live

From closest to the user to closest to the data:

1. **Browser** (`Cache-Control`).
2. **CDN** (lesson 2).
3. **In-process cache** (a map in the app's memory): fastest, but each server has its own copy.
4. **Distributed cache** (Redis, Memcached): shared by all servers.
5. **Database cache** (buffer pool, query results).

### Read/write patterns

![Cache-aside](/img/diagrams/cache-aside.svg)

*Diagram drawn from scratch for this project; idea referenced from [Microsoft Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).*

| Pattern | How it works | Good for |
|---|---|---|
| **Cache-aside** | The app asks the cache; on a miss it reads the DB and writes the result into the cache itself | The common default, read-heavy workloads |
| **Read-through** | The cache itself reads the DB on a miss | Keeping app code tidy |
| **Write-through** | Write to the cache and the DB at the same time | When the cache must always be fresh; writes are slower |
| **Write-back** | Write to the cache, flush to the DB later | Very heavy writes; you accept the risk of data loss |

A minimal cache-aside snippet:

```python
def get_featured_notes():
    key = "featured:v1"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)          # hit
    notes = db.query_featured()            # miss: the expensive work
    redis.set(key, json.dumps(notes), ex=300)  # TTL 5 minutes
    return notes
```

### Expiry and eviction

- **TTL**: each entry expires on its own after N seconds; the simplest and safest option.
- **Eviction** when the cache is full: **LRU** (drop the least recently used), **LFU** (drop the least frequently used), FIFO.

### Invalidation

> There are only two hard things in computer science: cache invalidation and naming things. (A familiar joke, usually attributed to Phil Karlton.)

A note has just been edited, but the cache still holds the old version. Ways to deal with it: let the TTL run out; **delete the key on write** (`DEL` after updating the DB); put a **version in the key** (`featured:v2`); or publish a change event so caches evict themselves.

### Three classic ailments

- **Cache stampede (thundering herd)**: a hot key expires, and thousands of requests miss at once and flood the database. Remedies: a dedup lock (only one request recomputes), randomized TTLs (jitter), refreshing early, `stale-while-revalidate`.
- **Cache penetration**: queries for keys that *don't exist*, so they always miss. Remedies: cache the empty result with a short TTL, or use a Bloom filter.
- **Cache avalanche**: many keys expire at the same moment, or the cache goes down. Remedies: jittered TTLs, a replicated cache, rate limiting in front of the database.

## Trade-offs

| Choice | What you gain | What you lose |
|---|---|---|
| Having a cache | Speed, less DB load | Data may be stale; one more component to operate |
| Long TTL | High hit ratio | Stale data lingers |
| Short TTL | Fresher data | Low hit ratio, high DB load |
| Write-through | Cache consistent with the DB | Slower writes, and you write data nobody reads |
| Write-back | Extremely fast writes | Possible data loss if the cache crashes before flushing to the DB |
| In-process cache | Fastest | One copy per server; servers drift out of sync |
| Shared Redis | All servers see the same data | One more network call; the cache becomes a critical component |

## Common mistakes

- Caching before measuring: you don't know which query is slow, so you cache the wrong thing.
- No TTL; stale data lives forever and memory fills up.
- Treating the cache as the only place data is stored. A cache can vanish at any moment; the DB is the source of truth.
- Caching per-user data under a shared key (no `user_id` in the key), so one user sees another's data.
- Not tracking hit ratio and latency; you can't tell whether the cache is helping or just adding complexity.
- Restarting an empty cache at peak hours, so the whole herd of requests rushes to the database (a "cold cache").

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="cache" />

## Further reading

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)
- [Redis: documentation](https://redis.io/docs/latest/)
- [Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Cache section

**Next:** caching helps reads, but the data keeps growing and writes increase. Lesson 5: [Database: replication & sharding](./05-database-replication-sharding.md).
