---
id: sql-vs-nosql
title: "SQL vs NoSQL"
sidebar_position: 12
slug: /sql-vs-nosql
description: "Relational, document, key-value and wide-column data models; ACID vs BASE; how to choose a database by access pattern instead of by fashion."
---

> Choose a database by how you read and write the data, not by its label.

## Story

NoteNest already has replicas and shards. Then the product team asks for three features at once: tagging notes, keeping edit history, and a "recent activity" feed that takes tens of thousands of events per second. A colleague tells Minh, "Move everything to MongoDB, NoSQL scales better." Another says the opposite: "Postgres can do it all." Minh pauses and asks a question worth more than both opinions: *how will this data be accessed?* This lesson helps you answer that question.

## Core concepts

### Four data models

![Four data models](/img/diagrams/sql-vs-nosql.svg)

*Diagram drawn for this project; the classification follows [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), chapter Data Models.*

- **Relational**: data lives in tables linked by foreign keys and queried with SQL. Strong at flexible queries, `JOIN`s, integrity constraints and transactions.
- **Document**: each record is a nested JSON document. One read returns a note with its tags and comments; a good fit when structure varies per record.
- **Key-value**: just `get/put/delete` by key. Extremely fast and easy to partition, but you cannot search by value.
- **Wide-column**: a row is identified by a key and its columns are kept in order (often by time). Built for huge write volumes and key-based queries.

There are also **graph** stores (deeply linked data such as social networks) and **time-series** stores (measurements over time). Each optimizes one access pattern; none is best at everything.

### ACID and BASE

**ACID** is the four-part guarantee of a relational transaction:

- **Atomicity**: the transaction happens completely or not at all.
- **Consistency**: it moves the data from one valid state to another (constraints always hold).
- **Isolation**: concurrent transactions do not see each other's half-finished state (stronger isolation is safer and slower).
- **Durability**: once committed, it survives, even a crash.

**BASE** (*Basically Available, Soft state, Eventually consistent*) is a shorthand for the opposite choice many NoSQL systems make: favor availability and scale, and tolerate replicas being temporarily out of sync. These are two ends of a spectrum, not two camps: many modern NoSQL systems offer transactions (document transactions, lightweight transactions), and many SQL systems scale out (Citus, Vitess, CockroachDB, Spanner).

### Normalize or denormalize

In the relational model we **normalize**: every fact is stored once and combined with a `JOIN`. In document and wide-column stores we usually **denormalize**: put data that is read together into one record so a single read is enough, at the price of updating several places. For a note:

```sql
-- relational: 3 tables, joined at read time
SELECT n.title, t.tag
FROM notes n JOIN note_tags t ON t.note_id = n.id
WHERE n.id = 42;
```

```json
// document: one read
{"_id": 42, "title": "Monday sync", "tags": ["work", "weekly"]}
```

### A selection process

1. List the main **queries** (by key? by range? search? aggregation? is a `JOIN` needed?).
2. Estimate the **load**: reads/writes per second, data size, read:write ratio (the Estimation lesson will cover this in depth).
3. Decide the **guarantees** you need: money, inventory and bookings need strict transactions; view counts and "seen" flags can tolerate lag.
4. Default to **one relational database** for core data. Add another store only for a measured reason.

For NoteNest, Minh keeps Postgres for users, notes and tags (constraints and `JOIN`s), uses a wide-column store for the "recent activity" stream (heavy writes, read by `user_id` and time), and Redis for login sessions. This is **polyglot persistence**: each kind of data in a store that suits it.

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Relational + SQL | Flexible queries, `JOIN`, ACID transactions, mature ecosystem | Scaling writes out is harder; schema changes need migrations |
| Document | Flexible schema, one read returns a whole cluster of data | Weaker `JOIN` and multi-document consistency; duplicated data |
| Key-value | Very fast, very easy to partition | Access by key only |
| Wide-column | Massive write volume, easy to partition | Tables are designed per query; no `JOIN`, little ad-hoc querying |
| Several databases | The right tool per kind of data | More to operate, data to keep in sync across stores |

## Common mistakes

- Choosing NoSQL "for scale" when a well-indexed Postgres is more than enough.
- Choosing NoSQL, then discovering you need `JOIN`s and transactions and rewriting them in application code.
- Treating "schemaless" as "no schema". The schema still exists; it just lives in your code and drifts easily.
- Designing wide-column tables like relational ones, then querying without the primary key.
- Adding a third or fourth data store with nobody owning its sync and backups.
- Picking what a famous company uses instead of what your own queries need.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Results are saved in this browser.

<Quiz lessonId="sql-vs-nosql" />

## Further reading

- [Designing Data-Intensive Applications](https://dataintensive.net/), chapters 2 (Data Models) and 7 (Transactions)
- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [MongoDB: Data Modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [Apache Cassandra: Data Modeling](https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/intro.html)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the SQL vs NoSQL section

**Next:** even with the right store, queries stay slow if the data is laid out badly. Lesson 13: [Indexing & storage engines](./13-indexing-storage-engines.md).
