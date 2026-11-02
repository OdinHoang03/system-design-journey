---
id: indexing-storage-engines
title: "Indexing & storage engines"
sidebar_position: 13
slug: /indexing-storage-engines
description: "How an index works, B-tree vs LSM-tree, composite indexes, write amplification: why some databases read fast and others write fast."
---

> An index trades write cost for read speed; the storage engine decides how that trade is made.

## Story

NoteNest's search-by-title ran smoothly at 10,000 notes. At 200 million, every search takes 8 seconds. Minh opens `EXPLAIN` and sees the dreaded line: `Seq Scan`, meaning the database reads *every row* of the table. He adds one index and the query drops to 3 ms. A week later, though, the "recent activity" feed with tens of thousands of writes per second chokes the database because of... too many indexes. This lesson explains both sides of that coin.

## Core concepts

### What an index is

Without an index, finding a value means a **full table scan** (O(n)). An **index** is an auxiliary structure that keeps a column's values in order with pointers to the real rows, like the index at the back of a book. A lookup costs O(log n), but every write must update the table *and* all of its indexes.

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);

EXPLAIN SELECT * FROM notes
WHERE user_id = 7 ORDER BY created_at DESC LIMIT 20;
-- Index Scan using idx_notes_user_created
```

### Using indexes well

- A **composite index** `(user_id, created_at)` serves queries on `user_id`, or `user_id` + `created_at`, but *not* queries on `created_at` alone (the **leftmost prefix** rule: column order matters).
- A **covering index** holds every column the query needs, so the table is never touched.
- **Selectivity**: an index on a column with a handful of values (say `is_deleted`) is nearly useless. An index on `email` is excellent.
- An index will **not** help `WHERE LOWER(title) = 'x'` or `LIKE '%abc'` (matching the middle or end of a string) unless you built it for that exact expression.
- Every index costs **space** and makes **writes slower**. Measure with `EXPLAIN` and drop unused ones.

### Two families of storage engine

![B-tree vs LSM-tree](/img/diagrams/btree-vs-lsm.svg)

*Diagram drawn for this project; ideas follow [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), chapter Storage and Retrieval.*

**B-tree** (PostgreSQL, MySQL/InnoDB, most relational databases): data is split into fixed-size **pages** (typically 4–16 KB) arranged in a shallow, wide tree. A write **modifies a page in place**; to survive a crash, it first appends to a **WAL** (write-ahead log). Reads are steady and predictable: a few page hops and you are there.

**LSM-tree** (Cassandra, RocksDB, LevelDB, HBase): writes go to a **memtable** in RAM (plus a WAL so nothing is lost); when it fills up, it is **flushed** to disk as an immutable sorted file called an **SSTable**. In the background, **compaction** merges files and drops stale versions. Every write is *sequential*, which is very fast. Reads must check the memtable and then several files; a **Bloom filter** (a probabilistic structure that says "definitely not here" or "maybe here") lets most files be skipped.

**Write amplification**: one logical write causes several physical writes (page + WAL in a B-tree; repeated compactions in an LSM-tree). It eats disk bandwidth and SSD lifetime, and is worth measuring when you pick an engine.

### Matching the engine to the workload

Rule of thumb: B-tree suits *read-heavy, range-query, steady-latency* workloads; LSM suits *write-heavy, time-ordered, append-style* data. Either can do anything; they just pay different costs. Also worth knowing: **hash indexes** (exact-match lookups only), **inverted indexes** (lesson 15) and **column stores** (stored by column, tuned for analytics).

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Add an index | Much faster reads and lookups | Slower writes, extra space, planner may misjudge |
| Composite index | One index serves several queries | Depends on column order; larger |
| B-tree | Fast, steady reads; good range queries | Random in-place writes, page fragmentation |
| LSM-tree | Very fast sequential writes, good compression | Reads may touch many files; compaction causes I/O spikes and tail latency |
| Hash index | Very fast exact-match lookups | No range queries, no ordering |

## Common mistakes

- Guessing instead of measuring: adding an index without running `EXPLAIN` / `EXPLAIN ANALYZE`.
- An index on every column "just in case", then writes slow down over time.
- Wrong column order in a composite index, so the real query cannot use it.
- Wrapping a column in a function (`WHERE DATE(created_at) = ...`), which disables the index.
- Pushing a huge write load into a B-tree store and being surprised by I/O, or using an LSM store for heavy range reads without tuning compaction.
- Building an index on a big live table without the non-locking mode (for example PostgreSQL's `CREATE INDEX CONCURRENTLY`), blocking writes to the whole table.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Results are saved in this browser.

<Quiz lessonId="indexing-storage-engines" />

## Further reading

- [Designing Data-Intensive Applications](https://dataintensive.net/), chapter 3 (Storage and Retrieval)
- [Use The Index, Luke](https://use-the-index-luke.com/): a free guide to SQL indexing
- [PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [RocksDB Wiki: Overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Database section

**Next:** once data lives on several machines, "what does a read return?" becomes a hard question. Lesson 14: [Consistency & CAP](./14-consistency-cap.md).
