---
id: consensus
title: "Consensus & leader election"
sidebar_position: 19
slug: /consensus
description: "Many machines agreeing on one truth: quorums, split brain, Raft intuition, distributed locks with fencing tokens, unique IDs."
---

> When many machines must agree, a majority is the only thing you can trust.

## Story

NoteNest has a nightly cleanup job, and to survive failures Minh runs it on two servers, a primary and a standby. One night the network between them breaks: the standby assumes the primary is dead and promotes itself, while the primary is alive and still working. Two "primaries" delete and write at the same time, and the data diverges. This is **split brain**.

Minh needs a way for the whole cluster to agree on "who is the leader right now" so that there can never be two answers.

## Core concepts

### Quorum: the majority decides

![Consensus by majority](/img/diagrams/consensus.svg)

*Diagram drawn from scratch for this project; idea referenced from the [Raft visualization](https://raft.github.io/).*

A decision takes effect only when **more than half** of the nodes confirm it. Two disjoint groups cannot both hold a majority, so two leaders can never both commit. A 3-node cluster tolerates 1 failure, a 5-node cluster 2; use odd sizes because 4 nodes tolerate no more failures than 3.

### Raft, intuitively

- **Term**: an ever-increasing "term of office" number. Each term has at most one leader.
- **Leader election**: a follower that hears no heartbeat for a random interval becomes a candidate and asks for votes; whoever gets a majority becomes leader.
- **Log replication**: every write goes through the leader, which sends the entry to followers; once a majority has stored it, it is **committed** and only then acknowledged to the client.
- If the leader dies, a new term starts and a new election runs; committed entries are never lost because a majority holds them.

Paxos solves the same problem and is famously hard to understand; Raft was designed to be easier to learn. In practice you rarely implement it yourself: use **etcd**, **ZooKeeper** or **Consul**.

### When to use it

Consensus is expensive (each write needs a network round to a majority) and has low throughput. Use it for small amounts of data that need strong consistency: configuration, leader election, service discovery, metadata. Do not use it as the main database for bulk data.

### Distributed locks, leases and fencing tokens

Distributed locks usually carry a **lease** (auto-release on expiry) so a dead client cannot hold the lock forever. But a client may pause (GC, network) past its lease without noticing, and then still write. The correct defence is a **fencing token**: the lock hands out an increasing number, and the storage rejects writes carrying a token lower than one it has already seen. Martin Kleppmann argues that locks relying on clocks and timing (such as Redlock) are unsafe without fencing: fine as a performance optimization, but for correctness you need a consensus system plus tokens.

### Unique IDs

- **UUID v4**: 128 random bits, no coordination needed, but it fragments B-tree indexes.
- **Snowflake**: 64 bits = timestamp + machine id + sequence; generated locally and roughly time-ordered. Depends on the clock and on handing out unique machine ids.
- **ULID / UUID v7**: timestamp first, then randomness, so they sort by time.

### Clocks are not trustworthy

Machine clocks drift apart and can be stepped backwards (NTP). Do not use wall-clock time to decide "which is newer" across machines; use term/version numbers or logical clocks.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| One fixed leader, no consensus | Simple | Split brain on network faults |
| Consensus cluster (Raft/etcd) | A single leader, fault tolerant | Higher write latency, needs a live majority |
| 5 nodes instead of 3 | Tolerates 2 failures | More machines, slightly slower writes |
| Lock with a lease | No deadlock if the client dies | May expire mid-work: needs fencing |
| UUID v4 | No coordination | Fragmented index, 128 bits |
| Snowflake | Compact, time-ordered | Depends on clock and machine ids |

## Common mistakes

- Hand-rolling leader election as "ping failed, so I take over": the fastest route to split brain.
- Running a consensus cluster of 2 or 4 nodes, or putting all nodes in one rack/zone.
- Using a lease-based lock without a fencing token for important writes.
- Trusting system clocks to order events across machines.
- Using etcd/ZooKeeper as a database for large data.
- Snowflake that ignores a backwards clock, or two machines sharing a machine id.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear immediately. Your results are saved in this browser.

<Quiz lessonId="consensus" />

## Further reading

- [The Secret Lives of Data: Raft (visual explanation)](https://thesecretlivesofdata.com/raft/)
- [Raft Consensus Algorithm](https://raft.github.io/) and the paper "In Search of an Understandable Consensus Algorithm"
- [Martin Kleppmann: How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Twitter Engineering: Announcing Snowflake](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chapters 8 and 9

**Next:** the Operations & architecture part, starting with Lesson 20: Monolith vs microservices (coming soon).
