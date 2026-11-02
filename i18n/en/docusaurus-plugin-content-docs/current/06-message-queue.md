---
id: message-queue
title: "Message queues & asynchronous processing"
sidebar_position: 6
slug: /message-queue
description: "Queues take heavy work out of the request: producers, consumers, at-least-once delivery, idempotency, retries, dead-letter queues, backpressure."
---

> Heavy work does not have to happen while the user waits.

## Story

NoteNest adds two features: "export notes to PDF" and "send reminder emails". When a user clicks export, the API does everything inline: renders the PDF (3 seconds), sends the email (1 second), updates the stats... and only then responds. At peak hours, thousands of people click at once, the servers are busy rendering PDFs, and they have nothing left for ordinary requests. If the email service slows down even a little, the whole flow hangs with it.

Minh realizes users only need to know "request received"; the PDF can arrive a few seconds later.

## Core concepts

### A queue: a mailbox between two parties

![Message queue](/img/diagrams/message-queue.svg)

*Diagram drawn from scratch for this project; idea referenced from [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0), the Asynchronism section.*

- The **producer** (the API) pushes a **message** (a job to be done) onto the queue and responds right away, for example with `202 Accepted`.
- The **queue** holds the message durably until someone processes it.
- The **consumer / worker** pulls messages off at its own pace, processes them, then **acknowledges** (acks).

Benefits:

1. **Decoupling in time**: users don't wait for heavy work.
2. **Smoothing traffic spikes**: the queue is a buffer; workers process at a steady rate.
3. **Decoupling dependencies**: if the email service is down, messages simply wait and the API keeps running.
4. **Independent scaling**: add workers when the queue grows, without touching the API.

### Queues vs. pub/sub

- **Queue (point-to-point)**: each message is handled by only one consumer in the group. Good for dividing up work.
- **Pub/sub (topic)**: each message is delivered to *every* subscribing group. Good for broadcasting events ("note created") to several services: search, analytics, notifications.
- **Distributed log** (Kafka style): messages are appended sequentially and retained for a long time; consumers track their own read position and can replay. Good for large event streams and reprocessing data.

### Delivery guarantees

| Level | Meaning | Consequence |
|---|---|---|
| At-most-once | Delivered at most one time | Messages can be lost |
| **At-least-once** | Delivered at least once, possibly duplicated | The most common; consumers must tolerate duplicates |
| Exactly-once | Delivered exactly one time | Very hard in a distributed system; the "effect" of once is usually achieved with at-least-once + idempotency |

Because duplicates can arrive, consumers must be **idempotent**: processing a message twice gives the same result as processing it once. How: attach a `message_id` or **idempotency key** and record what's been processed, or use naturally idempotent operations (`SET status = 'sent'`).

### Failures, retries, and dead letters

- If a worker fails before acking, the message is redelivered (after the visibility timeout).
- **Retry with exponential backoff + jitter** avoids hammering.
- A message that keeps failing (a **poison message**) is moved to a **dead-letter queue** (DLQ) for a human to inspect, instead of blocking the whole line.

### Ordering and backpressure

Queues usually guarantee order only within a partition/group (for example, the same `user_id`), not globally. If producers stay faster than consumers for long enough, the queue grows without bound: you need to monitor **queue length / lag**, auto-scale workers, and apply **backpressure** (reject or slow down producers) once a threshold is exceeded.

### Common patterns

- **Outbox**: write the event to a table in the *same transaction* as the data, and have a separate process forward it to the queue; this avoids the "DB write succeeded but the queue send failed" case.
- **Saga**: a chain of steps with compensating actions to undo them, in place of a distributed transaction.
- **Fan-out**: one event, many independent consumers.

## Trade-offs

| Choice | What you gain | What you lose |
|---|---|---|
| Synchronous | Simple, immediate result | Users wait; one slow part drags everything down |
| Asynchronous via a queue | Fast, absorbs spikes, decouples dependencies | Results arrive later; harder to debug; more infrastructure; you must design for duplicates and failures |
| At-least-once + idempotent | No lost work | Consumers must be written carefully |
| Strict ordering | Correct order | Less parallelism |
| Kafka-style log | Replay, high throughput | More complex to operate than a simple queue |

## Common mistakes

- Non-idempotent consumers: the email goes out twice, the payment is charged twice.
- No DLQ; one bad message makes a worker loop forever.
- Retrying immediately with no backoff, knocking over a downstream service that is already struggling.
- Using a queue for work that needs an immediate result (login, payments that need confirmation).
- Not monitoring lag and queue length; problems surface only when users complain.
- Writing to the DB and then sending to the queue as two separate steps; if either fails, the data drifts apart (use an outbox).
- Oversized messages: carry a reference (an ID, a URL), not the whole file.

## Exercises & interview questions

1. Design NoteNest's "export PDF" flow with a queue: how does the user get the result (polling, email, WebSocket)?
2. Why is exactly-once almost impossible to achieve, and what do we do instead?
3. Write an idempotent consumer for "send welcome email".
4. Explain DLQs, visibility timeouts, and backoff.
5. The queue keeps growing. List the possible causes and how to deal with them.
6. When would you pick Kafka (a log) over a RabbitMQ/SQS-style queue?

## Further reading

- [RabbitMQ: Tutorials](https://www.rabbitmq.com/tutorials)
- [Apache Kafka: Introduction](https://kafka.apache.org/intro)
- [Amazon SQS: Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Microsoft: Transactional Outbox pattern](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chapter 11 (Stream Processing)

**Next:** putting all the pieces together. Lesson 7: [Case study: designing a URL shortener](./07-url-shortener.md).
