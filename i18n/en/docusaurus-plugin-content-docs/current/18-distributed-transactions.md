---
id: distributed-transactions
title: "Distributed transactions & saga"
sidebar_position: 18
slug: /distributed-transactions
description: "Keeping data correct across services: why ACID is not enough, 2PC, sagas, compensation, outbox/inbox, idempotency."
---

> Once data lives in several places, "all or nothing" is no longer free.

## Story

NoteNest sells a Pro plan. Minh's team has split out three services: **Order**, **Payment** and **Stock** (remaining storage slots). One purchase means three jobs: create the order, charge the card, reserve a slot. One night Payment charges a customer, then Stock says it is out of slots. The customer is billed and gets no Pro plan. With a single database Minh would just `ROLLBACK`; now there is no command that can do that.

## Core concepts

### Why ACID stops at the database boundary

A transaction's atomicity is guaranteed by one database, within its own walls. Three services means three databases, and nobody holds a "shared commit button". The network can drop mid-way and we cannot tell whether the other side finished. There are two directions: **force synchronization** (2PC), or **accept intermediate states and repair them** (saga).

### Two-phase commit (2PC)

1. **Prepare**: the coordinator asks every participant "can you commit?"; those who agree lock their data and promise they can commit.
2. **Commit/Abort**: if all say "yes" the coordinator orders a commit, otherwise an abort.

The weakness: if the coordinator dies after participants voted "yes", they may not decide alone and **hold their locks, waiting** (blocking). Each transaction also costs two network round trips and moves at the speed of the slowest party. 2PC suits small, tightly-held scopes (XA across a few databases) better than many microservices.

### Saga: local transactions with compensations

![Saga with compensation](/img/diagrams/distributed-transactions.svg)

*Diagram drawn from scratch for this project; idea referenced from [microservices.io: Saga pattern](https://microservices.io/patterns/data/saga.html).*

A saga splits the work into **local transactions**, each committing immediately. Every step has a **compensation**: a business-level inverse. If step 3 fails, run compensations backwards: refund, cancel the order. A compensation is not a rollback: the customer may briefly have seen "charged", so intermediate states (`PENDING`) must be designed explicitly.

Two ways to coordinate:

- **Choreography**: each service listens to others' events and reacts. Few central parts, but the flow is hard to follow as steps grow.
- **Orchestration**: an orchestrator commands each step and knows the saga's state. Easier to understand and observe; in exchange, one more component to run.

### Outbox and inbox

Each saga step changes the DB and sends a message. If these are two separate actions, they drift apart sometimes. A **transactional outbox** writes the event to an `outbox` table in the *same transaction* as the data; a relay reads the table and publishes to the queue. The relay may publish duplicates, so receivers use an **inbox** (a table of processed `message_id`s) or an idempotency key to skip them.

### Idempotency is mandatory

Every step and every compensation can be called again (retries, redelivery). Key them by `saga_id` plus step number so that running "refund" twice still refunds once.

### TCC, and when to keep one DB

**TCC** (Try–Confirm/Cancel) is a variant: *Try* reserves (puts a slot on "tentative hold"), then *Confirm* or *Cancel*. It is less messy than fixing afterwards, but each service must write two extra operations.

Before using any of the above, ask: do we really need to split? If the steps must always be right together and one DB can still carry them, **one local transaction** is cheaper and more correct than any distributed mechanism.

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| One DB, one transaction | Simple, fully correct | Ties modules to one DB |
| 2PC | Strong consistency | Blocking, slow, coordinator is a single point of failure |
| Saga choreography | Loose coupling, no central piece | Hard to trace the flow, risk of event loops |
| Saga orchestration | Clear flow, easy monitoring | An extra orchestrator; logic can pile up there |
| Sagas in general | No long locks, scales well | Eventual consistency; compensations and intermediate states to handle |

## Common mistakes

- Splitting into microservices and only then discovering a cross-service transaction is needed; boundaries should follow data that must be right together.
- Non-idempotent compensations: refunding twice.
- Writing the DB and publishing the event as two separate steps (no outbox).
- Forgetting some actions cannot be undone (a sent email); put them in the last step.
- Not persisting saga state, so after a crash nobody knows which step it was at.
- Showing users an intermediate state as if it were final.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Results are saved in this browser.

<Quiz lessonId="distributed-transactions" />

## Further reading

- [microservices.io: Saga pattern](https://microservices.io/patterns/data/saga.html)
- [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Microsoft: Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [Garcia-Molina & Salem: Sagas (1987)](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chapters 7 and 9

**Next:** nodes must agree on who the leader is. Lesson 19: [Consensus & leader election](./19-consensus.md).
