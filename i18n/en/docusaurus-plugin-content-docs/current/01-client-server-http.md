---
id: client-server-http
title: "Client–server & HTTP"
sidebar_position: 1
slug: /client-server-http
description: "The client–server model and the HTTP protocol: requests, responses, methods, status codes, and statelessness."
---

> Day one: the app runs on a single machine for a single user.

## Story

Minh has just finished **NoteNest**, a note-taking app you can share. On his laptop everything works great: he opens `localhost:3000` in the browser, clicks "Save", and the note shows up. He sends the link to his close friend Lan. She opens it and... nothing. Lan's `localhost` is Lan's own machine, not Minh's.

And so the first question of every system appears: **who talks to whom, and in what language?**

## Core concepts

### Client and server are roles, not types of machines

- **Client**: the side that initiates a request (a browser, a mobile app, another server).
- **Server**: the side that listens on an address and port, receives requests, and answers them.

The same machine can be a client of one service and a server for another. For example, the NoteNest API is a server to the mobile app, but a client when it calls the email-sending service.

![Client – Server](/img/diagrams/client-server.svg)

*Diagram drawn from scratch for this project; idea referenced from [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0).*

### What a request goes through

When Lan types in the NoteNest address, roughly four things happen, in order:

1. **Look up the IP address** of the domain name (DNS, covered in detail in the next lesson).
2. **Open a TCP connection** to that IP (the three-way handshake). With HTTPS, add a **TLS handshake** for encryption.
3. **Send the HTTP request**.
4. **Receive the HTTP response** and render it.

Each step costs network time (a round trip). That is why "put servers close to users" and "reuse connections" matter so much.

### Anatomy of HTTP

```http
GET /notes/42 HTTP/1.1
Host: notenest.example
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

{"id": 42, "title": "Buy milk"}
```

- **Method**: `GET` (read), `POST` (create), `PUT`/`PATCH` (update), `DELETE` (remove).
  `GET` must be *safe* (it doesn't change data); `GET`, `PUT`, and `DELETE` must be *idempotent* (calling them many times has the same effect as calling them once).
- **Status code**: `2xx` success, `3xx` redirect, `4xx` client error (`404`, `401`, `429`), `5xx` server error (`500`, `503`).
- **Header**: metadata such as `Content-Type`, `Authorization`, `Cache-Control`.

### Stateless: the server doesn't remember you

HTTP keeps **no state** between two requests. To "remember" that a user is logged in, the client attaches a **token** (a session cookie or a JWT) to every request. This sounds inconvenient, but it is hugely useful: any server can handle any request, so adding servers later is easy (lesson 3).

### HTTP versions

| Version | Key points |
|---|---|
| HTTP/1.1 | Text-based, keep-alive connections, but prone to head-of-line blocking |
| HTTP/2 | Binary, multiplexes many requests over a single connection |
| HTTP/3 | Runs on QUIC (UDP), cutting handshake cost and head-of-line blocking on packet loss |

## Trade-offs

| Choice | What you gain | What you lose |
|---|---|---|
| Stateless (token on every request) | Any server can handle it; easy to scale | Every request carries a token; it must be re-validated |
| Stateful (session stored on the server) | Lean requests, easy to revoke sessions | Ties a user to one server; harder to scale |
| Polling | Simple | Wasted empty requests, added latency |
| WebSocket / SSE | Instant data push | Long-lived connections, more complex infrastructure |
| REST (JSON) | Easy to debug, universally understood | Prone to over- and under-fetching |

## Common mistakes

- Using `GET` to change data (a browser or crawler that replays it will wipe your data).
- Returning `200 OK` with an error in the body; clients and monitoring can't tell success from failure.
- Keeping session state in one server's RAM, then wondering why logins "drop" once there are two servers.
- Not setting a timeout on outgoing requests; one slow dependency takes down the whole system.
- Confusing `401` (not authenticated) with `403` (authenticated but not allowed).

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="client-server-http" />

## Further reading

- [MDN: An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0), the introduction to distributed systems

**Next:** Lan can get in now, but her friend in Berlin finds the page slow. On to lesson 2: [DNS & CDN](./02-dns-cdn.md).
