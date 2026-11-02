---
id: event-streaming
title: "Event streaming (Kafka)"
sidebar_position: 16
slug: /event-streaming
description: "Append-only log, partitions, offsets, consumer groups, retention, compaction, replay: when events are data you can read again."
---

> Don't throw events away after processing them: keep them, and let anyone who needs them read.

## Story

NoteNest already has a queue, and it works well: each job is handled by one worker and then disappears. But Minh now has more requests. The search team wants to hear every "note edited" event to update its index. The stats team wants exactly the same events. Last week the recommendations team found a bug and needs to re-run the last three days of data. With a queue, an acked message is gone; to let several parties listen you must duplicate the queue; to re-run, there is simply no way.

Minh changes how he thinks: an event is not "a job to do and discard" but a **fact that happened**, so it should be written into a notebook that only grows. Anyone who needs it takes a bookmark and reads from wherever they like.

## Core concepts

### A log: a notebook you can only append to

![Event streaming](/img/diagrams/event-streaming.svg)

*Diagram drawn from scratch for this project; idea referenced from [Apache Kafka: Introduction](https://kafka.apache.org/intro).*

- **Append-only log**: events are only added at the end, never edited in the middle. Each event gets a sequence number called an **offset**.
- A **topic** is a stream of events of one kind (`note.updated`). It is split into several **partitions**, each its own log.
- A **consumer** remembers for itself how far it has read. A traditional queue deletes a message on ack; a log keeps it and only the bookmark moves.

### Partitions and ordering

Partitions let writes and reads run in parallel beyond one machine's limits. The price: ordering is guaranteed only **within a partition**, not across the topic. The producer picks a partition by **key** (say `note_id`): the same key always lands in the same partition, so the events of one note stay in order while different notes are processed in parallel.

### Consumer groups

A **consumer group** is a set of workers sharing a topic: each partition is read by one consumer in the group at a time. Adding consumers increases parallelism, but only up to the number of partitions (extra consumers sit idle). Different groups (`search`, `stats`) read **independently**, each with its own offsets. This is the big difference from a queue: one event, many users, no interference.

### How long to keep it: retention and compaction

- **Retention by time or size**: keep 7 days or 1 TB, then drop the oldest segment.
- **Log compaction**: keep only the latest value per key. Good for storing "current state" (configs, user profiles) instead of the full history.

### Replay: reading the past

Because the log is still there, a consumer just moves its offset back to reprocess: fix a bug and re-run three days of data, build a new index, or let a new service catch up from the start. This is the main strength of event streaming. The condition: processing must be idempotent, because the same event may be read several times (see [Message queues](./06-message-queue.md)).

### Durability: replication and ISR

Each partition has a **leader** that takes writes and a few **followers** that copy it. The set of followers that are keeping up is the **ISR** (in-sync replicas). With `acks=all` a write counts as done only once the whole ISR has it: slightly slower, but a dead broker does not lose events. If the leader dies, a replica from the ISR is elected (how elections work: see [Consensus](./19-consensus.md)).

### Choosing partition count, and hot keys

The partition count sets the maximum parallelism and is hard to reduce later; adding partitions also changes the key-to-partition mapping, which shuffles per-key ordering. Estimate it as target throughput divided by one consumer's speed, then leave headroom. A **hot key** (one key carrying most of the traffic, like a "celebrity" account) piles into one partition and clogs it; the fix is to add a random suffix to the key, at the cost of strict ordering for that key.

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Log instead of queue | Independent groups, replay, high throughput | Heavier operations; no built-in per-message ack/retry |
| More partitions | High parallelism | Ordering only within a partition; hard to change later |
| Long retention | Deep replay, safety | Disk cost |
| Compaction | Compact, keeps latest state | Loses intermediate history |
| `acks=all` | No data loss when a broker dies | Higher write latency |
| Key per entity | Correct per-entity ordering | Hot-key risk |

## Common mistakes

- Using Kafka for a few small jobs a day: a simple queue is enough.
- Assuming ordering is global; it only exists inside one partition.
- Setting no key, so events of one entity land in different partitions and arrive out of order.
- More consumers than partitions: the extras do nothing.
- Non-idempotent consumers, then a replay: data gets double counted.
- Not watching **consumer lag** (the gap between the newest offset and the read offset); a consumer falls behind and nobody notices.
- Retention shorter than the time needed to fix an incident, so by the time you need a replay the data is gone.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="event-streaming" />

## Further reading

- [Apache Kafka: Introduction](https://kafka.apache.org/intro)
- [Apache Kafka: Documentation, Design](https://kafka.apache.org/documentation/#design)
- [Jay Kreps: The Log, what every software engineer should know](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- [Confluent: Kafka 101](https://developer.confluent.io/courses/apache-kafka/events/)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chapter 11 (Stream Processing)

**Next:** when events flow everywhere, failures spread everywhere too. Lesson 17: [Reliability patterns](./17-reliability-patterns.md).
