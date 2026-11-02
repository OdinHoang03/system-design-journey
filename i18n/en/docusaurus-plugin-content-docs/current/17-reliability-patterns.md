---
id: reliability-patterns
title: "Reliability patterns"
sidebar_position: 17
slug: /reliability-patterns
description: "Timeouts, retries with backoff and jitter, circuit breakers, bulkheads, fallbacks and load shedding: keep a partial failure from taking everything down."
---

> Failures are certain to happen; our job is to stop them from spreading.

## Story

NoteNest has queues now, but the signup flow still calls the email service synchronously to verify an address. One evening the email service slows down: each call takes 30 seconds instead of 50 ms. The API's threads sit waiting, and once they run out the API accepts no more requests, even for the home page that has nothing to do with email. Clients see errors and retry on their own, load triples, and the email service can never get back on its feet.

Minh realizes that a sick side service must never make all of NoteNest sick.

## Core concepts

### Timeouts: never wait forever

Every network call needs a **timeout** (set connect and read separately). Without one, a slow dependency holds your threads, connections and memory indefinitely. Base it on the dependency's p99 plus some headroom, and make sure the request's overall budget is larger than the sum of the inner timeouts (pass a **deadline** along the call chain).

### Retries, backoff and jitter

![Circuit breaker and bulkhead](/img/diagrams/reliability-patterns.svg)

*Diagram drawn from scratch for this project; ideas referenced from the [Microsoft Azure Architecture Center: Cloud design patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) and the [AWS Builders' Library: Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/).*

Transient errors (packet loss, a failover) often disappear on a second try. But retrying badly does harm:

- **Exponential backoff**: wait 100 ms, 200 ms, 400 ms... between attempts.
- **Jitter**: add randomness to the wait so thousands of clients do not retry in lockstep.
- A **cap on attempts** and a **retry budget** (for example, retries may be at most 10% of total requests) to avoid a **retry storm** when the dependency is already weak.
- Only retry **idempotent** operations (or ones carrying an idempotency key), and only errors likely to be transient (5xx, timeouts), never `400`/`404`.
- Retry in one layer only; three layers each trying 3 times means 27 calls for a single request.

### Circuit breaker

A breaker wraps a call and watches the error rate:

- **Closed**: normal, requests pass through, errors are counted.
- **Open**: errors crossed the threshold, so every request is rejected immediately (fail fast) for a while, giving the dependency room to recover.
- **Half-open**: after the wait, a few trial requests go through; success returns to Closed, failure goes back to Open.

Failing fast is far cheaper than waiting for a timeout and then failing.

### Bulkhead

Like the compartments of a ship: give each dependency its own resources (thread pool, connection pool, semaphore). A slow email service drains only the email pool; the notes pool still has threads. You can also isolate by customer tier or by critical flow.

### Fallback and graceful degradation

When a part breaks, return something worse but usable: show stale cached data, drop the recommendations, queue the email for later, say "we'll verify shortly". Decide in advance what is core and what is optional.

### Load shedding and health checks

- **Load shedding**: when overloaded, deliberately reject some work (favoring important requests, returning `503` + `Retry-After`) instead of accepting everything and being slow for everyone.
- **Health checks**: the load balancer removes broken instances from rotation. Distinguish *liveness* (the process is alive) from *readiness* (it can take traffic), and do not let a health check call heavy dependencies, or one dead side service will get the whole fleet pulled out.

### Hedged requests

To trim tail latency (p99): if a request has no answer after a threshold (say p95), send a second copy to another replica and take whichever returns first. Use it only for reads or idempotent operations, and remember it adds a little load.

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Short timeout | Frees resources quickly | May cut off calls that were merely a bit slow |
| Retries | Ride out transient errors | Multiplies load; can cause retry storms; needs idempotency |
| Circuit breaker | Fail fast, protects the dependency | May reject wrongly; thresholds need tuning and monitoring |
| Bulkhead | Contains incidents | Resources split up, less efficient than a shared pool |
| Fallback | Users can still get things done | Stale or reduced data; extra code paths to test |
| Load shedding | Keeps the system alive under overload | Some users are turned away |
| Hedged requests | Lower tail latency | More load; only for safe operations |

## Common mistakes

- No timeout, or relying on a library's infinite default.
- Retrying immediately with no backoff or jitter: you build your own retry storm.
- Stacking retries across several layers, multiplying calls exponentially.
- Retrying non-idempotent operations (creating an order, charging money) without an idempotency key.
- A circuit breaker with no metrics or alerts: the circuit is open and nobody knows.
- A fallback that has never been exercised; when you need it, it fails too.
- Health checks that are too deep (calling the database, email), so a minor outage removes the whole cluster from the load balancer.
- Testing only the happy path and never injecting faults on purpose (chaos / fault injection).

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="reliability-patterns" />

## Further reading

- [AWS Builders' Library: Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Microsoft: Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Microsoft: Bulkhead pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead)
- [Google SRE Book: Handling Overload](https://sre.google/sre-book/handling-overload/)
- [Google SRE Book: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

**Next:** what happens when one operation touches several services and a step fails halfway. Lesson 18: [Distributed transactions & saga](./18-distributed-transactions.md).
