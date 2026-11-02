---
id: dns-cdn
title: "DNS & CDN"
sidebar_position: 2
slug: /dns-cdn
description: "DNS resolves domain names to IPs and a CDN brings content closer to users: TTL, caching, edge servers, invalidation."
---

> A real domain name arrives, and far-away users start to feel the lag.

## Story

Minh buys the domain `notenest.example` and points it at his server in Singapore. Users in Vietnam find it fast. But Hana in Berlin complains: every page load takes more than 2 seconds, even though the server is nearly idle. Light travelling through fiber still takes time: a Berlin ↔ Singapore round trip is already around 150–200 ms, and loading a page takes *many* of those round trips.

Two problems, two tools: **DNS** helps users find the right address; a **CDN** puts copies of your content close to them.

## Core concepts

### DNS: the Internet's phone book

DNS turns `notenest.example` into an IP address. The recursive resolution process looks like this:

![DNS resolution](/img/diagrams/dns-resolution.svg)

*Diagram drawn from scratch for this project; idea referenced from [Cloudflare Learning: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/).*

1. The browser asks a **recursive resolver** (usually your ISP's, or `8.8.8.8` / `1.1.1.1`).
2. If the answer isn't cached, the resolver asks a **root server**: "who manages `.example`?"
3. It asks the **TLD server**: "who manages `notenest.example`?"
4. It asks the **authoritative server** (where Minh declared his records) and gets the IP.
5. The resolver returns the IP to the browser and **caches** it for the duration of the **TTL**.

Common record types:

| Record | Meaning |
|---|---|
| `A` / `AAAA` | Name → IPv4 / IPv6 |
| `CNAME` | Name → another name (alias) |
| `MX` | Mail server for the domain |
| `TXT` | Arbitrary text (domain verification, SPF) |
| `NS` | Name servers that manage the zone |

The **TTL** (time to live) decides how long an answer can be cached. A long TTL means fewer queries, but IP changes propagate slowly. A short TTL means fast changes, but more queries.

DNS is also a crude load-distribution tool: return several IPs, or return different IPs by location (GeoDNS).

### CDN: copies close to the user

A **CDN** (Content Delivery Network) is a network of **edge** servers spread across the world. Users are routed to the nearest edge, which holds a copy of your content.

![CDN edge](/img/diagrams/cdn-edge.svg)

*Diagram drawn from scratch for this project; idea referenced from [Cloudflare Learning: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/).*

- **Cache hit**: the edge has a copy and returns it immediately. The origin is never touched.
- **Cache miss**: the edge asks the **origin**, returns the response to the user, and keeps a copy.
- What suits a CDN? Static files (JS, CSS, images, video), and also public HTML pages that rarely change.
- The origin controls the edge through headers: `Cache-Control: public, max-age=86400`, `ETag`, `Vary`.

Two ways to route users to the nearest edge: **anycast** (the same IP is advertised from many locations) or DNS that returns an IP based on location.

### Refreshing content (invalidation)

You changed `app.js`, but the edge still serves the old one? There are three ways out:

1. **Name files by content** (`app.3f9a1c.js`): new file = new URL, so there's nothing to evict. The best approach for static assets.
2. **Purge** by URL or tag through the CDN's API.
3. **Short TTL** for pages that change often.

## Trade-offs

| Choice | What you gain | What you lose |
|---|---|---|
| Long DNS TTL | Fewer queries, faster | Slow server migration and failover |
| Short DNS TTL | Fast IP changes | More queries, greater dependence on DNS |
| CDN for static content | Fast worldwide, light origin, absorbs traffic spikes | Extra cost; cache to manage |
| CDN for dynamic/personal content | Even less load on the origin | Easy to leak one user's data to another if caching is wrong |
| Manual purge | Instant updates | Easy to forget, easy to miss something |
| Hashed file names | No purge needed | Needs a build step; HTML still needs a short TTL |

## Common mistakes

- Lowering the TTL *after* you already need to change the IP; old caches live on under the old TTL. Lower it first, change the IP later.
- Caching responses that carry cookies or personal data at the CDN (missing `Cache-Control: private` or `Vary`), so one user sees another's data.
- Putting a `CNAME` at the apex domain (`notenest.example`) when your DNS provider doesn't support it.
- Believing the CDN "handles everything": forgetting that cache misses still flow back to the origin, and a full purge can overload it (cache stampede).
- Having no DNS monitoring: when DNS breaks, everything behind it is "dead" even though your servers are healthy.

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="dns-cdn" />

## Further reading

- [Cloudflare Learning: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Cloudflare Learning: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/)
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [RFC 1035: Domain Names, Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035)

**Next:** users pour in from everywhere and one server can't take it. Lesson 3: [Load balancer & horizontal scaling](./03-load-balancer.md).
