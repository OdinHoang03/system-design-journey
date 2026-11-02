---
id: api-design
title: "API design"
sidebar_position: 9
slug: /api-design
description: "REST, gRPC, GraphQL; pagination, versioning, error codes and idempotency keys for APIs that are easy to use and safe to retry."
---

> An API is a contract: get it wrong and every client pays for years.

## Story

NoteNest ships a mobile app. The "Save" button calls `POST /notes`. On a weak connection the app waits too long, retries automatically, and the user sees the same note twice. That is not all: the note list returns all 40,000 items in one response, and when Minh renamed the field `title` to `name`, the old app version went blank. All three bugs are API design bugs, not coding bugs.

## Core concepts

### Choosing an API style

| Style | Idea | Fits | Watch out for |
|---|---|---|---|
| **REST** | Resources + HTTP verbs (`GET /notes/42`) | Public APIs, CRUD, easy caching | May need several calls to assemble data |
| **gRPC** | `.proto` contract, binary, HTTP/2 | Internal service-to-service calls, speed, streaming | Hard to call directly from browsers; hard to read by eye |
| **GraphQL** | Client picks fields through one endpoint | Apps with many screens needing different data | Harder caching; needs query depth/complexity limits |

There is no "best" style: REST at the edge and gRPC inside is a very common combination.

### Designing good REST

- **Nouns, not verbs**: `POST /notes`, `GET /notes/42`, `DELETE /notes/42`.
- Use verbs for what they mean: `GET` is safe and repeatable; `PUT` and `DELETE` are **idempotent** (calling many times has the same effect as once); `POST` is not.
- **Meaningful status codes**: `201` created, `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` rate limited (lesson 11), `5xx` server errors.
- **Structured errors**: a machine-readable code, a human message, which field was wrong.

### Pagination

Never return the whole list.

| Approach | How it works | Pros | Cons |
|---|---|---|---|
| **Offset/limit** | `?offset=100&limit=20` | Simple, jump to any page | Slow with large offsets; duplicates/gaps when data changes between calls |
| **Cursor (keyset)** | `?after=<cursor>&limit=20` | Fast, stable when new data arrives | Cannot jump to an arbitrary page |

For long, constantly changing lists (feeds, notes), prefer cursors.

### Versioning and backward compatibility

- Adding a field to a response is *compatible*; renaming, removing, or changing a type is *breaking*.
- Ways to version: in the path (`/v1/notes`), in a header, or not at all: only add (additive-only) and deprecate old fields gradually.
- Clients should **ignore unknown fields**; servers should **keep old fields** until measurements show nobody uses them.

### Idempotency keys

![Idempotency key](/img/diagrams/api-design.svg)

*Original diagram drawn for this project.*

The problem with `POST`: on a timeout the client cannot tell whether the request succeeded, so retrying is risky (two creations, two charges). The fix: the client generates a **unique key** per *intent* and sends it along (an `Idempotency-Key` header). The server stores the key with the result; when it sees the key again it returns the stored result instead of redoing the work.

```python
def create_note(req):
    key = req.headers["Idempotency-Key"]
    saved = key_store.get(key)
    if saved:
        return saved                       # retry: return the earlier result
    note = db.insert_note(req.json)        # runs only once per key
    resp = {"status": 201, "id": note.id}
    key_store.set(key, resp, ttl=24 * 3600)
    return resp
```

One detail matters: writing the note and recording the key must be atomic (same transaction, or a `UNIQUE` constraint on the key), otherwise two concurrent requests still slip through.

### Other details

- **Authenticate** with tokens; never put secrets in URLs.
- **Limit** body size and items per page.
- **Client-side timeout & retry** with backoff (lesson 17).
- **Document** with OpenAPI or `.proto`; the contract is the source of truth for generating client code.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| REST | Simple, cacheable, lots of tooling | Over/under-fetching, many round trips |
| gRPC | Fast, strict contract, streaming | Awkward from browsers, hard to debug by eye |
| GraphQL | Flexible clients, fewer round trips | Harder caching and load control |
| Offset | Easy to build | Slow and drifting with large or changing data |
| Cursor | Fast, stable | No page jumping, opaque tokens |
| Version in the path | Explicit, easy to route | Maintain several versions in parallel |
| Additive-only, never break | No versions needed | Carry old fields for a long time |

## Common mistakes

- Returning everything unpaginated and "letting the client deal with it".
- Renaming/removing fields without notice or a transition period.
- Returning `200` with `{"error": ...}` for every error, or `500` for every error.
- `POST` that creates a resource with no protection against duplicate sends.
- Leaking internals (table names, guessable sequential ids) in a public API.
- Using GraphQL for everything without limiting query depth.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="api-design" />

## Further reading

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (methods, status codes, idempotency)
- [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [gRPC: Introduction](https://grpc.io/docs/what-is-grpc/introduction/)
- [GraphQL: Learn](https://graphql.org/learn/)

**Next:** the API is clear; now put a shared "front door" in front of the services. Lesson 10: [Reverse proxy & API gateway](./10-proxy-api-gateway.md).
