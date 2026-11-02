---
id: consistency-cap
title: "Consistency & CAP"
sidebar_position: 14
slug: /consistency-cap
description: "Strong, eventual and the levels in between; the CAP theorem and PACELC; quorums; choosing a consistency level per problem."
---

> When data has several copies, "what does a read return?" is a design choice, not a default.

## Story

NoteNest opens a second region in Singapore so Asian users get a faster app: each region has its own database, synchronized with the other. Lan edits a note on her phone in Hanoi, then opens her laptop (connected to the other region) and sees the old version. Worse, one night a submarine cable is cut and the two regions lose contact. Minh must decide: should the Singapore region *stop accepting writes* until the link returns, or keep accepting them and merge later? This is the classic problem the CAP theorem describes.

## Core concepts

### Consistency levels

"Consistency" here is about how replicas and clients *see* the data. From strict to loose:

- **Linearizable (strong)**: the system behaves as if there were a single copy; a read always sees the latest completed write. Easiest to reason about, but every operation must coordinate between nodes, so it is slower and less fault tolerant.
- **Sequential / causal**: everyone sees operations in the same order, or at least cause-and-effect is preserved (a "reply" never shows up before its "question").
- **Read-your-writes / monotonic reads**: *per-session* guarantees. You always see what you just wrote, and you never see data move "back in time".
- **Eventual**: if writes stop, replicas converge eventually. No promise about when, and in the meantime reads may be stale.

![Choice during a network partition](/img/diagrams/cap-partition.svg)

*Diagram drawn for this project; ideas follow [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), chapter Consistency and Consensus.*

### The CAP theorem

For a distributed system, three properties:

- **C**onsistency: every read sees the latest write (in the linearizable sense).
- **A**vailability: every request to a live node gets a response.
- **P**artition tolerance: the system keeps working when the network splits.

The theorem says that during a **network partition (P)** you must choose **C or A**. Real networks *do* break, so P is practically mandatory; the real choice is between:

- **CP**: the minority side rejects requests (giving up availability) rather than return wrong data. Examples: coordination stores such as etcd/ZooKeeper, Spanner.
- **AP**: every side keeps answering, accepting that replicas diverge and are reconciled later. Examples: Dynamo, Cassandra (default settings).

Two common misreadings: CAP does *not* say "you can only ever have 2 of 3" (with a healthy network you have both C and A), and "availability" in CAP is a narrow definition, not "99.99% uptime".

### PACELC: even when the network is fine

CAP only covers failures. **PACELC** adds: if there is a **P**artition, choose **A** or **C**; **E**lse (normally), choose **L**atency or **C**onsistency. Keeping replicas in sync always costs an extra network round trip. So a "CP" system is still slower in normal times, while an "AP" system is faster but its reads may be stale.

### Quorums: tuning consistency with numbers

In a leaderless system there are **N** replicas; a write must be acknowledged by **W** of them and a read asks **R**. If **R + W > N**, the read set and write set always overlap, so a read sees at least one fresh copy (pick the newest version). Example N=3, W=2, R=2: tolerates one node down. Lower W to 1 for faster writes and the overlap guarantee is gone. Quorums do not automatically give linearizability (clocks, concurrent writes and repair matter), so treat them as a *tuning tool*, not magic.

### Resolving conflicts when you choose AP

If two regions edit the same note while disconnected, you need a rule: **last-write-wins** (simple, but can lose data), **vector clocks** to detect concurrent edits, or **CRDTs** (data structures designed so merges always converge, such as counters, sets and collaborative text).

### Choosing per problem

| Problem | Level to choose | Why |
|---|---|---|
| Balances, final inventory, bookings | Strong (CP) | One mistake is real damage |
| NoteNest notes | Read-your-writes + eventual across regions | Users only need to see their own changes immediately |
| View counters, "likes" | Eventual | Nobody cares about a few seconds of drift |
| Leader election, distributed locks | Strong | Two leaders at once is a disaster (lesson 19) |

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Strong consistency | Easy to reason about, no stale data | Slower, unavailable during partitions, expensive across regions |
| Eventual consistency | Fast, always available, scales across regions | Reads may be stale; conflicts to handle |
| Quorum R+W>N | Tune consistency vs latency per query | Needs correct configuration; not automatically linearizable |
| Session guarantees | "Normal" user experience at low cost | Only holds within one session |

## Common mistakes

- Saying "we picked CA": a networked distributed system *will* partition, so CA does not exist for multi-node systems.
- Using eventual consistency for something that needs strictness (balances, inventory) because "that's how NoSQL works".
- Using strong consistency for everything and paying latency you do not need.
- Relying on machine clocks to decide "which write is newer". Clocks always drift between machines.
- Forgetting that read-your-writes breaks when the next request lands on a different replica.
- Not designing a conflict-resolution path, then discovering two regions hold two different versions.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Results are saved in this browser.

<Quiz lessonId="consistency-cap" />

## Further reading

- [Designing Data-Intensive Applications](https://dataintensive.net/), chapter 9 (Consistency and Consensus)
- [Wikipedia: CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem)
- [Abadi: Consistency Tradeoffs in Modern Distributed Database System Design (PACELC)](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf)
- [Jepsen: Consistency Models](https://jepsen.io/consistency)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Consistency patterns and CAP sections

**Next:** not all data lives in tables. Lesson 15: [Object storage & search](./15-object-storage-search.md).
