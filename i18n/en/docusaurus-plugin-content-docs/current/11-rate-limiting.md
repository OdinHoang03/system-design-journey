---
id: rate-limiting
title: "Rate limiting"
sidebar_position: 11
slug: /rate-limiting
description: "Limiting request rates: token bucket, leaky bucket, fixed/sliding window; where to limit, by which key, and how to answer with 429."
---

> Nobody gets to take the whole table, not even a regular.

## Story

A partner wrote a note-sync script and accidentally called the API 3,000 times a second. There was no attack, yet all of NoteNest slowed down and real users timed out. Blocking the partner's IP made them complain; not blocking it meant the incident would repeat. What Minh needed was a fair rule: every customer gets a quota, and going over it gets a gentle refusal instead of dragging the whole system down.

## Core concepts

### Why limit rates

- **Protect** the system from overload caused by bugs or bad clients (including password brute-forcing and scraping).
- **Fairness**: one client cannot starve the others.
- **Cost control**: calls to a pay-per-call service, or giving different plans different quotas.

Rate limiting deliberately rejects *some* requests so the rest are still served well (intentional load shedding).

### The four main algorithms

| Algorithm | Idea | Pros | Cons |
|---|---|---|---|
| **Token bucket** | A bucket holds up to `b` tokens, refilled at `r` tokens/second; each request takes 1 | Allows short bursts (up to `b`) then holds average rate `r`; little memory | You must pick `b` and `r` |
| **Leaky bucket** | Requests join a queue that drains at a fixed rate | Smooth output | A burst fills the queue and new requests are dropped; added latency |
| **Fixed window** | Count requests in each fixed window (each minute) | Very simple, little memory | Boundary flaw: two adjacent windows can allow nearly double the quota around the boundary |
| **Sliding window** | Count over "the last N seconds" | More accurate, no boundary flaw | More memory (log) or an approximation (weighted counters) |

![Token bucket](/img/diagrams/rate-limiting.svg)

*Original diagram drawn for this project; idea referenced from [Stripe's post on rate limiters](https://stripe.com/blog/rate-limiters).*

A minimal token bucket:

```python
import time

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity = rate, capacity   # tokens/second, size
        self.tokens, self.last = capacity, time.monotonic()

    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

### Which key to limit by

The **key** decides who the fairness is for: by **IP** (easy, but many people share one IP behind NAT), by **user/API key** (most accurate, needs authentication first), by **endpoint** (heavy write routes limited tighter than reads), or a combination. Layered limits are common: a coarse global tier plus a strict tier for sensitive routes such as login.

### Where to limit

- **Gateway/proxy** (lesson 10): the natural place, rejecting early before resources are spent.
- **In the application**: when the rule depends on business data (plan, organization).
- **CDN/WAF** (lesson 2): cut raw traffic at the edge.
- **Client side**: self-limit when calling other services so you do not overload them.

### With many servers

If every server counts on its own, the real quota is `N × limit`. You need a shared counter, usually Redis with atomic operations (a Lua script or `INCR` + `EXPIRE`). The trade-off: an extra network call per request, and if Redis is slow or down you must decide between **fail-open** (let traffic through) and **fail-closed** (block). For a quota that matters but is not life-or-death, fail-open is common, with a local counter as a safety net. Lesson 24 goes deeper into designing a rate limiter.

### How to answer when blocked

Return `429 Too Many Requests` with `Retry-After` (seconds to wait) and, optionally, headers showing the remaining quota. Well-behaved clients will wait and retry with backoff and jitter (lesson 17).

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Token bucket | Allows short bursts, light | Parameters to tune; bursts still hit the backend |
| Leaky bucket | Smooth output | Latency when the queue is full; old requests wait |
| Fixed window | Simplest | Boundary flaw of nearly double the quota |
| Sliding window | Accurate | More memory/compute |
| Per-server local counting | No network cost, fast | Real quota drifts, grows with server count |
| Central counting (Redis) | Accurate quota | Added latency and a component that can fail |
| Fail-open | Service keeps running when the counter breaks | Protection vanishes exactly when risk is high |
| Fail-closed | Always protected | A broken counter rejects real users too |

## Common mistakes

- Limiting by IP without considering NAT/proxies: blocking a whole office, or only ever seeing the proxy's IP.
- One quota for every route, though `/login` needs to be far stricter than `/notes`.
- Not returning `Retry-After`; clients guess and retry in a burst, making things worse.
- Counting with a non-atomic read-then-write; two concurrent requests both slip through.
- Limiting only at the edge and forgetting internal services; a faulty service can still flatten another.
- Not monitoring how many requests are blocked, so you cannot tell whether the rule is too strict or you are under attack.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="rate-limiting" />

## Further reading

- [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585#section-4)
- [Cloudflare: What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)
- [Redis: Rate limiting patterns](https://redis.io/glossary/rate-limiting/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Next:** the "Scaling & performance" part is complete; the following lessons move into data. See the [Outline](/outline) for the remaining path.
