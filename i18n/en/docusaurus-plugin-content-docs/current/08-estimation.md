---
id: estimation
title: "Back-of-the-envelope estimation"
sidebar_position: 8
slug: /estimation
description: "Quickly estimate QPS, bandwidth and storage, and learn the latency numbers worth memorizing to drive design decisions."
---

> Before drawing the architecture, know whether you are measuring in meters or kilometers.

## Story

NoteNest has 1 million daily active users. Minh was about to buy a database cluster "just to be safe". Lan, a friend who works in infrastructure, asked three questions: *how many requests per second? how much data per year? how much outgoing bandwidth?* Minh could not answer any of them. Ten minutes of mental math later it turned out they needed only a few hundred QPS and a few hundred GB per year: one server is enough, no cluster. The images, on the other hand, are what eat the bandwidth. The numbers changed the whole decision.

## Core concepts

### Why estimate

An estimate does not need to be precise; it needs the right **order of magnitude** (10 or 10,000?). It tells you whether one machine can cope, whether you need a cache, whether you must shard, and where the bottleneck is.

### The basic chain

![Estimation chain](/img/diagrams/estimation.svg)

*Original diagram drawn for this project.*

1. **DAU** (daily active users) × actions per user per day = requests per day.
2. Divide by **86,400** seconds (round to ~100,000 for mental math) = **average QPS**.
3. Multiply by a **peak factor** (usually 2–10×, depending on how traffic bunches up) = **peak QPS**. Design for the peak, not the average.
4. Write QPS × record size × retention days = **storage**. Multiply by the replication factor (often 3).
5. QPS × response size = **bandwidth**.

NoteNest example: 1 million DAU × 10 reads + 1 write per day.

| Quantity | Calculation | Result |
|---|---|---|
| Reads per day | 1M × 10 | 10 million |
| Average read QPS | 10M ÷ ~10⁵ | ~100 |
| Peak read QPS | × 5 | ~500 |
| Average write QPS | 1M ÷ ~10⁵ | ~10 |
| New data per day | 1M × 2 KB | ~2 GB |
| Data per year | 2 GB × 365 | ~730 GB (×3 replicas ≈ 2.2 TB) |

An ordinary server handles thousands of simple QPS; 500 read QPS does not need a cluster.

### Numbers worth memorizing

| Operation | Approximate magnitude |
|---|---|
| Main-memory (RAM) reference | ~100 ns |
| Read 1 MB sequentially from RAM | ~10–50 µs |
| SSD random read | ~100 µs |
| Round trip inside one data center | ~0.5 ms |
| Read 1 MB sequentially from SSD | ~0.1–1 ms |
| Spinning-disk (HDD) seek | ~5–10 ms |
| Packet Vietnam ↔ US | ~150–250 ms |

These are orders of magnitude, not specs of a particular piece of hardware. The lesson: RAM is hundreds to thousands of times faster than disk; a cross-region round trip costs hundreds of times a data-center round trip; that is why caches (lesson 4) and CDNs (lesson 2) help.

Powers worth remembering: 2¹⁰ ≈ 10³ (KB), 2²⁰ ≈ 10⁶ (MB), 2³⁰ ≈ 10⁹ (GB), 2⁴⁰ ≈ 10¹² (TB). A day ≈ 10⁵ seconds; a month ≈ 2.5×10⁶ seconds; a year ≈ 3×10⁷ seconds.

### How to do it in an interview

- Say your assumptions out loud (DAU, read/write ratio, record size) and ask whether the interviewer agrees.
- Round aggressively: 86,400 ≈ 10⁵, 1.2 ≈ 1.
- Write the unit at every step; do not mix bits with bytes, MB with MiB.
- End with a **design conclusion**: "~500 peak read QPS, so one server plus a cache is enough, but 730 GB/year means we need a storage plan".

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Rounding hard | Fast, doable in your head | Tens of percent of error |
| Sizing for the average | Small, tidy numbers | Falls over at peak hours |
| Sizing for the peak | Safe | Wasted resources when idle (autoscaling can offset this) |
| Provisioning a lot of headroom (10× later) | Fewer architecture changes | Cost and complexity arrive early |
| Measure first, decide later | Accurate | Needs a running system; useless at the initial design stage |

## Common mistakes

- Forgetting the peak factor: traffic is not spread evenly over 24 hours.
- Forgetting replication and indexes: real data is several times the raw data.
- Unit mix-ups: bits vs bytes, Mbps vs MB/s.
- Using the average and ignoring the tail (p99), while users feel latency at the tail.
- Estimating once and never checking against measurements when the system runs.
- Optimizing early for a number nobody verified.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="estimation" />

## Further reading

- [Latency numbers every programmer should know (Jeff Dean's original, compiled by Colin Scott)](https://colin-scott.github.io/personal_website/research/interactive_latency.html)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Back-of-the-envelope section
- [Google SRE Book: Handling overload](https://sre.google/sre-book/handling-overload/)

**Next:** once you know the scale, design how components talk to each other. Lesson 9: [API design](./09-api-design.md).
