---
id: database-replication-sharding
title: "Database: replication & sharding"
sidebar_position: 5
slug: /database-replication-sharding
description: "Replication for read scale and fault tolerance, sharding for write scale and storage: trade-offs, replication lag, choosing a shard key."
---

> The database becomes the bottleneck; copy it and split it.

## Story

Thanks to the cache, NoteNest survived the traffic spike. But a few months later, two things happened at once: the number of notes grew into the hundreds of millions, and the volume of *writes* multiplied. One night, the primary database's disk failed. The service was down for 40 minutes while Minh restored from a backup, and the last 10 minutes of data were lost for good. That was when Minh understood: the database is the **hardest part to scale** because it holds state.

## Core concepts

### Step 0: optimize before you split

Before replicating or splitting anything, do the cheaper things first: add the right **indexes**, fix slow queries (`EXPLAIN`), use a connection pool, add a cache (lesson 4), upgrade the machine. Plenty of systems run happily at tens of thousands of queries per second on a single, well-tended database.

### Replication: multiple copies

![Primary–replica](/img/diagrams/db-replication.svg)

*Diagram drawn from scratch for this project; idea referenced from [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0).*

The most common model is **primary–replica** (leader–follower): every **write** goes to the primary, the primary ships its change log to the replicas, and **reads** are spread across the replicas.

- What it gives you: more read capacity, a standby for failover, and a place to run heavy reports without affecting users.
- What it doesn't help with: *write* capacity (every write still goes through one primary) or storage (each replica still holds all the data).

**Synchronous or asynchronous?**

| Type | How it works | Trade-off |
|---|---|---|
| Asynchronous | The primary acknowledges the write immediately; replicas catch up afterward | Fast, but replicas can **lag** (replication lag); if the primary dies, the last few transactions may be lost |
| Synchronous | The primary waits for the replica to acknowledge | No acknowledged data is lost, but writes are slower and a dead replica can block writes |
| Semi-synchronous | Waits for at least one replica | A middle ground between the two |

**Replication lag** causes a nasty class of bugs: Lan edits a note, reloads the page, reads from a replica that hasn't caught up yet, and sees the old version. The fixes: *read-your-writes* (read from the primary for a few seconds after a user writes), or send only reads that can tolerate slightly stale data to the replicas.

**Failover**: when the primary dies, a replica is **promoted** to be the new primary. You need reliable failure detection and a way to avoid **split brain** (two nodes both believing they are the primary).

Beyond primary–replica there are **multi-leader** setups (several nodes accept writes, so you must resolve conflicts) and **leaderless** ones (Dynamo/Cassandra style, with quorum reads and writes).

### Sharding: splitting the data

When one machine can no longer hold the data or absorb the writes, we **split** the data into several **shards**, each one a separate database holding a portion of it.

![Sharding](/img/diagrams/db-sharding.svg)

*Diagram drawn from scratch for this project; idea referenced from [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), the Partitioning chapter.*

The key decision is the **shard key**:

| Strategy | Example | Strengths | Weaknesses |
|---|---|---|---|
| Range | `user_id` 1–1M on shard 0 | Efficient range queries | Prone to **hot shards** (new users pile onto the last shard) |
| Hash | `hash(user_id) mod N` | Even distribution | Range queries must ask every shard; changing N moves almost all the data |
| Consistent hashing | A hash ring, each shard owns an arc | Adding or removing a shard moves only part of the data | More complex; needs virtual nodes to balance |
| Directory | A "key → shard" lookup table | The most flexible | The lookup table is one more component to protect and scale |

For NoteNest, `user_id` is the natural shard key: most queries involve a single user, so they stay inside one shard.

**The price of sharding:**

- **Cross-shard queries** (joins, system-wide aggregates) are slow and complicated.
- **Cross-shard transactions** need a protocol like two-phase commit or a saga; it's usually best to avoid them by designing the data so each transaction lives within one shard.
- **Resharding** (changing the number of shards) is a major project.
- **Hot keys**: one "famous" user can overload a shard even when the overall distribution is even.

In practice, each shard has its own replicas too; the two techniques complement each other.

### SQL or NoSQL?

The question isn't "which one scales better" but "what do your data model and queries need". Relational databases give you relationships, transactions, and flexible queries. Many NoSQL systems (key-value, document, wide-column) give up some features to make splitting and replicating easier. Both families can replicate and shard.

## Trade-offs

| Choice | What you gain | What you lose |
|---|---|---|
| Asynchronous replication | Fast writes, scalable reads | Replicas lag; the last transactions may be lost on failover |
| Synchronous replication | Data safety | Slow writes, lower availability |
| Hash sharding | Even distribution | No range queries |
| Range sharding | Good range queries | Hot shards |
| Sharding | Write and storage scale | Cross-shard queries and transactions, operational complexity, painful resharding |
| Normalizing | Less duplication, consistency | Many joins, hard to split |
| Denormalizing | Fast reads, easy to split | Updates must touch many places |

## Common mistakes

- Sharding too early, when an extra index and a replica would have been enough.
- Picking a shard key with low cardinality (e.g., country) or one that increases monotonically (e.g., a timestamp), which creates hot shards.
- Sending *every* read to a replica and then hitting the "I just saved it and it's gone" bug.
- Using `hash mod N` and then increasing N, so almost every key changes shards.
- Never testing failover; the first real run happens during a real incident.
- Treating replication as a backup. A `DROP TABLE` gets replicated too. You still need regular backups and tested restores.

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="database-replication-sharding" />

## Further reading

- [Designing Data-Intensive Applications](https://dataintensive.net/), chapters 5 (Replication) and 6 (Partitioning)
- [PostgreSQL: High availability, load balancing, and replication](https://www.postgresql.org/docs/current/high-availability.html)
- [MySQL: Replication](https://dev.mysql.com/doc/refman/8.4/en/replication.html)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Database section

**Next:** the system has grown, but some heavy work shouldn't happen inside the request. Lesson 6: [Message queues & asynchronous processing](./06-message-queue.md).
