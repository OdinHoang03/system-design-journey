---
id: deployment-release
title: "Deployment & safe releases"
sidebar_position: 22
slug: /deployment-release
description: "Shipping new code without taking the system down: CI/CD, rolling, blue/green, canary, feature flags, rollback, backward-compatible migrations."
---

> Deploying often is safe, as long as every deploy is small and reversible.

## Story

NoteNest now has a dozen servers and a few dozen engineers. Every Friday evening Minh gets nervous: pull the new code onto each machine, run the migration script, and hope. One time the column-rename script finished before every server had updated; half the servers kept looking for the old column and returned 500s for ten minutes. As for rollback, nobody remembered how to do it properly.

Minh concludes that the fear does not come from deploying itself, but from each deploy being too big, too manual, and having no way back.

## Core concepts

### The CI/CD pipeline and immutable artifacts

![Canary release](/img/diagrams/deployment-release.svg)

*Diagram drawn from scratch for this project; ideas referenced from [Martin Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) and [CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html).*

- **CI**: every commit is built and tested automatically.
- **CD**: a build that passes the tests is deployed automatically (or with one button press).
- **Immutable artifact**: build *once* into a versioned image or package, then promote exactly that artifact through staging and production. Environments differ only in configuration, never in code. Rollback is then simply redeploying the previous artifact.

### Deployment strategies

- **Rolling**: replace servers (or groups of them) with the new version gradually. No extra infrastructure, but old and new versions run side by side for a while.
- **Blue/green**: stand up a whole new environment (green) next to the running one (blue), verify it, then switch all traffic over. If something is wrong, switch straight back; the price is double the infrastructure during the switch.
- **Canary**: send a small slice of traffic (1–5%) to the new version, watch error rate and latency, and grow it if the numbers hold; pull it back if they do not. The blast radius stays small, but you need good observability (see lesson 21).

### Feature flags: decoupling deploy from release

**Deploy** means getting code onto production. **Release** means letting users see the feature. With a feature flag, new code reaches production switched *off*, then is enabled gradually by percentage, user group or region. In an incident you flip the flag instead of deploying again. The cost: old flags pile up as debt, so every flag needs an owner and a removal date.

### Backward-compatible database migrations

During a rolling or canary release, two versions of the code share one database, so the schema must work for both. The **expand/contract** pattern:

1. **Expand**: add the new column or table (remove nothing).
2. Write to both old and new, and **backfill** the old data.
3. Switch reads to the new one.
4. **Contract**: in a later release, once nobody uses the old one, drop it.

Each step is small and reversible. Renaming a column in a single step is exactly Minh's incident.

### Health checks, readiness and rollback

- **Readiness probe**: an instance reports "I am ready for traffic" (started, connected to the DB, cache warm); until then the load balancer sends it nothing.
- **Liveness probe**: is the process stuck? If so, restart it.
- **Automatic rollback**: wire thresholds (error rate, p99 latency) into the pipeline and revert when they are crossed. Rollback must be *practiced* regularly, because a mechanism that has never run will not run when you need it.

## Trade-offs

| Strategy | What you gain | What you lose |
|---|---|---|
| Rolling | Simple, no extra infrastructure | Two versions run side by side; slow rollback |
| Blue/green | Instant switch and rollback | Double infrastructure; awkward with a shared database |
| Canary | Small risk, decisions backed by numbers | Needs good observability and enough traffic; takes longer |
| Feature flags | Release decoupled from deploy, instant off-switch | More code paths to test; old flags become debt |
| Big-bang (stop the system, upgrade) | Easy to understand | Downtime; all the risk lands in one event |

## Common mistakes

- Breaking the schema in one step (rename, drop) while the old version is still running.
- Rebuilding for each environment, so what runs in production is not what was tested.
- No readiness probe, so a rolling deploy sends requests to an instance that has not finished starting.
- A canary with no metric to compare against; "nobody complained" is not a number.
- Having a rollback mechanism that was never tried, or rolling back the code while forgetting that a migration already changed the data.
- Flags that are never removed, leaving the code full of dead branches.
- Big, rare deploys (once a month): each one is a gamble; small, frequent deploys make bugs far easier to find.

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="deployment-release" />

## Further reading

- [Martin Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Martin Fowler: CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html)
- [Martin Fowler: FeatureToggle](https://martinfowler.com/articles/feature-toggles.html)
- [Kubernetes: Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
- [Google SRE Book: Release Engineering](https://sre.google/sre-book/release-engineering/)

**Next:** a system that runs well also becomes a target. Lesson 23: [Security basics](./23-security-basics.md).
