---
id: monolith-microservices
title: "Monolith vs microservices"
sidebar_position: 20
slug: /monolith-microservices
description: "When to split services and what it costs: modular monolith, domain boundaries, database per service, distributed monolith, strangler fig."
---

> Splitting services solves an organizational problem first, and a machine problem second.

## Story

NoteNest now has 40 developers in 6 teams, all working in one codebase. Every deploy is a meeting: the Payments team changes one line but has to wait for the Search team to fix a bug before it can ship. A memory leak in the PDF export module takes down the whole app, login page included.

Someone suggests "let's split everything into microservices". Minh asks back: which problem are we solving, and what are we willing to pay for it?

## Core concepts

### Two extremes and the middle

![From monolith to microservices](/img/diagrams/monolith-microservices.svg)

*Diagram drawn from scratch for this project; idea referenced from [microservices.io](https://microservices.io/) (Chris Richardson) and Martin Fowler's [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html).*

- **Monolith**: one unit to build and deploy. In-process function calls, one database, ACID transactions for free. Simple, and fast while the team is small.
- **Microservices**: many small services, each deployed independently, owning its own data, talking over the network.
- **Modular monolith**: still one deployable, but split into modules with clear boundaries that call each other only through public interfaces. Most teams should start here and stay a long time.

### Boundaries by domain, not by technical layer

Cut along **bounded contexts**: Notes, Sharing, Billing, Search. Do not cut by layer ("UI service", "logic service", "data service"): every feature then touches all three and every change still needs coordination. Conway's law: a system's structure mirrors the structure of the organization that builds it. A good service boundary usually matches the boundary of a team that owns it end to end.

### Database per service

Each service owns its data; others access it only through an API or events, never by reading its tables. That way a schema change does not break anyone else. The price: no more `JOIN`s or ACID transactions across services; cross-service data must be assembled through APIs, read models and eventual consistency (see lesson 18).

### Communication: sync or async

- **Synchronous** (HTTP/gRPC): easy to reason about, immediate result, but latency and failures chain together: A waits on B waits on C. You need timeouts, retries and circuit breakers (lesson 17).
- **Asynchronous** (queues/events, lessons 6 and 16): decouples time and dependencies, but flows are harder to follow and results arrive later.

### Operational costs the brochures skip

- **The network is unreliable**: every call can be slow, lost or half-successful.
- **Debugging and observability**: one request crosses many services; you need centralized logs and traces (lesson 21).
- **Versioning and compatibility**: services A and B deploy out of step, so APIs must stay backward compatible.
- **Infrastructure**: CI/CD, service discovery, configuration, service-to-service security, each multiplied by the number of services.

### The distributed monolith: the worst trap

You pay all the costs of microservices and get none of the benefits: services must change and deploy together, or share one database, or call each other in long chains. If two services always change together, they are one service.

### Migrating gradually: the strangler fig

Do not rewrite "big bang". Put a routing layer (a gateway) in front, then move **one** capability at a time to a new service and route its traffic there. The old monolith shrinks until it is empty. Each step is small, measurable and reversible.

### When to split

- Several teams step on each other during deploys, and the domain boundaries are already clear.
- One part needs very different scaling or technology (for example video processing).
- You need fault isolation for a critical part.
- Without these, adding a module inside the monolith is far cheaper.

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Monolith | Simplicity, ACID transactions, easy debugging, little infrastructure | Tight deploy coupling, failures spread, big teams collide |
| Modular monolith | Clear boundaries, still simple to run | Needs discipline to keep boundaries; still deploys together |
| Microservices | Independent deploy and scaling, fault isolation, autonomous teams | Network, eventual consistency, operational cost, harder debugging |
| Database per service | Schema autonomy | No cross-service JOIN/ACID |
| Synchronous calls | Simple, immediate result | Failures and latency cascade down the chain |

## Common mistakes

- Splitting too early, with a 5-person team and unclear boundaries.
- Cutting by technical layer instead of by domain.
- Several services sharing one database.
- Going too small ("nano-services"): one feature needs a dozen service calls.
- Long synchronous call chains with no timeouts and no circuit breakers.
- Splitting before there is centralized logging, tracing and automated CI/CD.
- A big-bang rewrite instead of a strangler fig.

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="monolith-microservices" />

## Further reading

- [Martin Fowler: MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)
- [Martin Fowler & James Lewis: Microservices](https://martinfowler.com/articles/microservices.html)
- [microservices.io: Pattern language](https://microservices.io/patterns/index.html)
- [Martin Fowler: Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Building Microservices, Sam Newman](https://samnewman.io/books/building_microservices_2nd_edition/)

**Next:** the system now has many parts; how do we know whether it is healthy or sick? Lesson 21: [Observability](./21-observability.md).
