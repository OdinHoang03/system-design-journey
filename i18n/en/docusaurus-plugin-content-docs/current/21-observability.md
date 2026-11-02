---
id: observability
title: "Observability"
sidebar_position: 21
slug: /observability
description: "Structured logs, metrics, distributed traces, SLIs/SLOs and error budgets, symptom-based alerting: know what the system is doing instead of guessing."
---

> You can't fix what you can't measure; and without observability, every incident is a guessing game.

## Story

NoteNest now has dozens of services. One Monday morning users complain "the app is slow". Minh opens the dashboard: CPU is fine, RAM is fine, the average response time is still 200 ms. Yet support messages keep pouring in. He greps logs on server after server and takes two hours to find that the search service occasionally waits up to 8 seconds on the database.

The mistake was not in the system but in the fact that Minh could not **see** it. A good system lets you ask new questions ("what about only Pro users in Da Nang?") without shipping new code.

## Core concepts

### Three pillars: logs, metrics, traces

![Logs, metrics and traces](/img/diagrams/observability.svg)

*Diagram drawn from scratch for this project; idea referenced from the [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/), chapter Monitoring Distributed Systems.*

- **Metrics**: numbers over time, cheap and compact, answering "what is wrong and how badly". Ideal for alerts and charts.
- **Traces**: the path of *one* request through many services, split into timed **spans**. They answer "where is it slow".
- **Logs**: detailed event records, answering "why".

An investigation usually goes from metric (detect) → trace (narrow down) → log (find the cause).

### Structured logs and correlation IDs

Free-form text logs are hard to search. Write **JSON** with fixed fields: `timestamp`, `level`, `service`, `user_id`, `message`. Most important is a **correlation ID** (or trace ID): the API gateway generates one per request, and every service attaches it to its logs and forwards it in a header. One query then gathers all logs of a single request across ten services. Never log passwords, tokens or personal data.

### Metrics: RED, USE and percentiles

Two sets of indicators worth memorizing:

- **RED** (for request-serving services): **R**ate (requests per second), **E**rrors (error ratio), **D**uration (latency).
- **USE** (for resources such as CPU, disks, connections): **U**tilization, **S**aturation (queueing), **E**rrors.

Look at latency by **percentile** (p50, p95, p99), not the average. A 200 ms average can hide 1% of requests taking 8 seconds, and heavy users (who make many requests) hit those slow ones more often than you'd expect. Use histograms to compute percentiles; never average p99s.

**Cardinality**: every combination of label values is its own time series. Putting `user_id` or `request_id` in a metric label creates millions of series and takes down the monitoring system. Labels should have small, bounded value sets (`route`, `status`, `region`); per-user detail belongs in logs or traces.

### Distributed tracing

Each request carries a **trace ID**; each step creates a span recording start time, duration and parent span. Put together they form a waterfall chart showing that the 7.8 seconds sit in a database query inside the search service. The open standard is **OpenTelemetry** (common API, SDK and format for logs, metrics and traces), which avoids vendor lock-in.

### SLIs, SLOs and error budgets

- **SLI** (service level indicator): what we measure, e.g. "share of requests that succeed in under 300 ms".
- **SLO** (objective): the target we hold ourselves to, e.g. "99.9% over 30 days".
- **Error budget**: the amount allowed to fail, here 0.1% (about 43 minutes per 30 days). While budget remains, keep shipping features; when it runs out, prioritize stability.

SLOs turn the "stability vs. features" argument into a number. Unlike an SLA (a contract with penalties), an SLO is an internal goal, usually stricter than the SLA.

### Alert on symptoms, not causes

An alert on "CPU > 80%" may be harmless; an alert on "5% of requests failing for 5 minutes" always matters. Alert on **what users feel** (error ratio, latency, error-budget burn rate) and keep causes (CPU, disk) on dashboards for investigation. A page should wake someone **only when immediate action is needed**, and come with a runbook. Noisy alerts teach on-call engineers to ignore them (**alert fatigue**), and when a real incident arrives nobody trusts the pager.

### Dashboards, cost and sampling

A good dashboard tells a story: the top level shows RED for key services, and drilling down reveals USE for resources. Observability costs money: logs and traces grow with traffic. Cut cost with **sampling** (keep 1% of normal traces but *every* error or slow trace), retention limits, and lower log levels in production.

## Trade-offs

| Choice | You gain | You lose |
|---|---|---|
| Log everything in detail | Most incidents can be investigated | Storage cost, hard to search, data-leak risk |
| Metrics | Cheap, fast, good for alerts | No per-request detail |
| 100% tracing | Complete picture | Expensive, adds a little latency |
| Sampled tracing | Cheap | May miss rare requests (mitigate with tail sampling: keep errors/slow ones) |
| Sensitive alerts | Early detection | False alarms, fatigue |
| SLO-based alerts | Less noise, tied to users | Needs careful SLI definitions |

## Common mistakes

- Looking only at **average** latency; p99 is the experience of your unluckiest users.
- Putting `user_id` in metric labels (cardinality explosion).
- No correlation ID, so logs across services are stitched together by hand.
- Alerting on causes (CPU, RAM) instead of symptoms, or alerts nobody acts on.
- Dashboards with hundreds of charts and no idea which one to look at.
- Writing sensitive data into logs.
- Nothing monitors the monitoring system itself (when it dies you go blind).
- Setting a 100% SLO: it is unreachable and removes all room for change.

## Exercises & interview questions

Pick one answer per question; the correct answer and an explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="observability" />

## Further reading

- [Google SRE Book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [OpenTelemetry: Documentation](https://opentelemetry.io/docs/)
- [Prometheus: Metric and label naming](https://prometheus.io/docs/practices/naming/)
- [Tom Wilkie: The RED Method](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Brendan Gregg: The USE Method](https://www.brendangregg.com/usemethod.html)

**Next:** now that we can see, we can ship more safely. Lesson 22: [Deployment & safe releases](./22-deployment-release.md).
