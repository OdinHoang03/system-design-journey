---
id: load-balancer
title: "Load balancer & horizontal scaling"
sidebar_position: 3
slug: /load-balancer
description: "Vertical vs horizontal scaling, L4/L7 load balancers, balancing algorithms, health checks, sticky sessions."
---

> One server is no longer enough, so a second and third one join.

## Story

A famous blogger mentions NoteNest. Traffic jumps 20x in a single evening. The lone server's CPU hits 100% and requests start timing out. Minh doubles the machine's specs; that buys a few hours before it fills up again. Worse, every upgrade means shutting the machine down, and if it dies, *all* of NoteNest disappears.

## Core concepts

### Vertical vs horizontal scaling

- **Vertical scaling** (scale up): a bigger machine (more CPU, more RAM). Simple, but it has a ceiling, gets more expensive, and is still a *single point of failure*.
- **Horizontal scaling** (scale out): add more machines doing the same job. There's almost no ceiling and it tolerates failures better, but it's more complex: you need to spread requests around and keep any machine from holding "private state".

### Load balancer

A **load balancer** (LB) sits in front of your servers, receives requests, and forwards each one to a healthy server.

![Load balancer](/img/diagrams/load-balancer.svg)

*Diagram drawn from scratch for this project; idea referenced from [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) (CC BY-NC-ND 4.0; idea only, no figures copied).*

Two common layers:

| | L4 (transport) | L7 (application) |
|---|---|---|
| Sees | IP, port, TCP/UDP | URL, headers, cookies |
| Speed | Very fast, minimal processing | Slightly slower, much more capable |
| Can do | Forward connections | Route by path, terminate TLS, compress, rate-limit |
| Examples | Cloud network LBs, HAProxy in TCP mode | NGINX, HAProxy in HTTP mode, ALB |

### Server selection algorithms

- **Round robin**: each server in turn. Works well when requests cost about the same.
- **Weighted round robin**: stronger machines get more.
- **Least connections**: pick the server handling the fewest connections. Suits requests with uneven processing times.
- **IP hash / consistent hashing**: the same client (or key) always lands on the same server; useful for local caches.

### Health checks

The LB periodically calls `GET /healthz` on each server. A failing server (timeout, 5xx) is removed from the rotation; once it recovers, it's added back. That way a dead machine doesn't show up as errors to users.

### The prerequisite for scaling out: stateless

If server 1 keeps login sessions in RAM, the next request that lands on server 2 will "lose the login". Solutions:

1. **Push state out**: sessions in Redis or a database, uploaded files in object storage. Every server is identical, so any one can be replaced at any time.
2. **Sticky sessions**: the LB remembers client → server (via a cookie). A quick patch, but it skews the balance and you still lose the session if that server dies.

### The LB itself can die too

A single LB is a single point of failure again. In practice you use an active–passive pair of LBs (a virtual IP fails over during an incident) or a cloud-managed LB that is already replicated. DNS can also return multiple IPs for multiple LBs.

## Trade-offs

| Choice | What you gain | What you lose |
|---|---|---|
| Vertical scaling | Simple, no code changes | Has a ceiling, expensive, downtime on upgrade, single point of failure |
| Horizontal scaling | Almost no ceiling, fault tolerant | Must be stateless, more machines to operate |
| L4 LB | Fast, lightweight | No content-based routing |
| L7 LB | Flexible, TLS, routing | Uses more CPU, one more layer to configure |
| Sticky sessions | Quick, easy patch | Uneven load, lost sessions when a server dies |
| Sessions in a shared store | Servers are replaceable | One more component to operate, one more network call |

## Common mistakes

- Adding servers but still storing uploaded files on local disk; an image you just uploaded "vanishes" on the next request.
- A health check that only verifies "the process is alive" without checking the database connection, so the LB keeps sending requests to a broken server.
- A health check that is too heavy or too strict, so the LB ejects the whole fleet when the database is only briefly slow.
- Forgetting that the client's IP is now the LB's IP; you must read `X-Forwarded-For` (and only trust that header from your own LB).
- Scaling only the app tier and forgetting the database; all the new servers pile onto one database (lesson 5).
- Never testing what happens when you shut a server down; the first time you see how the system reacts shouldn't be a real incident.

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="load-balancer" />

## Further reading

- [NGINX: HTTP load balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [HAProxy: documentation](https://docs.haproxy.org/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Load balancer and Horizontal scaling sections
- [Google SRE Book](https://sre.google/sre-book/load-balancing-frontend/) (CC BY-NC 4.0): Load balancing at the frontend

**Next:** there are three servers now, but all three ask the database the same question millions of times. Lesson 4: [Caching](./04-cache.md).
