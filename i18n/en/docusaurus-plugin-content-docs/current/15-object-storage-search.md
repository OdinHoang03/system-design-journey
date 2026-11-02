---
id: object-storage-search
title: "Object storage & search"
sidebar_position: 15
slug: /object-storage-search
description: "Storing large files in object storage (S3-style), presigned URLs, inverted indexes and full-text search: when a regular database is no longer the right place."
---

> Large files belong in object storage; text search belongs in an inverted index.

## Story

NoteNest users start attaching photos, PDFs and voice recordings to notes. At first Minh stored the files straight into a `BLOB` column; within weeks the database ballooned to terabytes, backups took a whole day, and replicas always lagged because they had to copy huge files. At the same time, the note-content search box used `LIKE '%keyword%'`, took ten seconds, and did not know that "running" matches "run". Two different problems, one cause: a relational database was not built for these two jobs.

## Core concepts

### Object storage

**Object storage** (Amazon S3, Google Cloud Storage, Azure Blob, MinIO) keeps data as **objects** in **buckets**: each object has a **key** (like the path `users/7/photo.jpg`), content (bytes) and some **metadata**. There are no real folders and no partial updates; to change an object you rewrite it whole. In return:

- **Cheap and practically unlimited**: data is split and spread across many machines.
- **Extremely durable** (S3 advertises 99.999999999%, "eleven nines"), through multiple **replicas** or **erasure coding** (split into data + parity pieces, so losing a few still recovers the object, with less overhead than full copies).
- **A simple HTTP API**: `PUT`, `GET`, `DELETE`, list by prefix.

The right pattern: **files in object storage, the database holds only metadata** (name, size, owner, object key).

![Object storage and inverted index](/img/diagrams/object-storage-search.svg)

*Diagram drawn for this project; ideas follow the [Amazon S3 documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) and [Elasticsearch: Inverted index](https://www.elastic.co/docs/manage-data/data-store/index-basics).*

### Uploading large files properly

Do not route files through the application server. The server issues a **presigned URL** (a signed URL that expires in minutes and allows one operation on one key), and the client `PUT`s straight to object storage. The app server only handles small requests. For big files use **multipart upload**: split into parts of tens of MB, upload in parallel, retry parts individually, then assemble. For fast downloads put a **CDN** (lesson 2) in front of the bucket.

A few things to remember: use well-spread key prefixes if your provider needs them; enable **versioning** against accidental deletes; use **lifecycle rules** to move cold data to cheaper storage classes; keep buckets **private** by default.

### Why `LIKE` is not enough for search

`LIKE '%abc%'` cannot use a regular index, so it scans the whole table. It also does not understand language: no word stems, no relevance ranking, no typo tolerance.

### The inverted index

An **inverted index** flips "document → words" into "word → list of documents containing it" (a **postings list**), like the lookup index at the back of a book.

1. **Analyze**: split text into **tokens**, lowercase, drop stop words, reduce to a root form (**stemming**) so "running" and "run" match.
2. **Index**: for each token, store the list of document IDs (plus positions and frequency).
3. **Query**: look up each token, then **intersect** (AND) or **union** (OR) the lists. "cache AND queue" is the intersection of two lists.
4. **Rank**: score relevance, classically with **TF-IDF** / **BM25** (a word that is frequent in this document but rare across the corpus scores high).

Elasticsearch/OpenSearch, Apache Solr, Meilisearch and PostgreSQL's full-text feature (`tsvector` + GIN index) all build on this idea. At scale the index is **sharded** (each shard holds part of the documents; a query goes to every shard and the results are merged) and **replicated** for fault tolerance and read capacity, just like lesson 5.

### Keeping the index in sync with the database

A search store is a **derived copy**, not the source of truth. The usual pattern: write to the primary database, then push an event through a **message queue** (lesson 6) or **change data capture (CDC)** so a consumer updates the index. Consequences: search is eventually consistent (lesson 14), and the index can always be rebuilt from the database.

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Files in object storage | Cheap, durable, near-unlimited scale, a small database | Higher latency than local storage; no partial edits; no querying content |
| Files in a BLOB column | One place, same transaction as the metadata | Database bloat, heavy backups and replicas, expensive storage |
| Presigned URLs | The server never relays the bytes | You manage expiry and must check permissions when issuing the URL |
| Inverted index / search engine | Fast search, ranking, language awareness | Another system to run; data lags behind the database |
| Full-text inside the database | Fewer parts, more consistent | Fewer features and less scale than a dedicated search engine |

## Common mistakes

- Stuffing files into the database, or routing files through the application server.
- Accidentally making a bucket public, exposing private photos to the Internet.
- Presigned URLs that live too long or do not restrict file type and size.
- Treating the search engine as the primary source of truth, then losing data when the index breaks.
- Forgetting that object-store consistency depends on the provider and the moment; read the consistency model instead of assuming.
- Using `LIKE '%x%'` for text search on a table with millions of rows.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Results are saved in this browser.

<Quiz lessonId="object-storage-search" />

## Further reading

- [Amazon S3 documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html), sections on presigned URLs and multipart upload
- [Elasticsearch Guide](https://www.elastic.co/guide/index.html), the parts on mapping, analyzers and relevance
- [PostgreSQL: Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Wikipedia: Inverted index](https://en.wikipedia.org/wiki/Inverted_index) and [Okapi BM25](https://en.wikipedia.org/wiki/Okapi_BM25)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**End of the Data batch.** Async and reliability come next; see the whole plan in the [Outline](/outline) or return to the [Roadmap](/roadmap).
