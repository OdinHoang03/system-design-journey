---
id: case-notification
title: "Case study: designing a notification system"
sidebar_position: 28
slug: /case-notification
description: "Design a multi-channel notification system (push, email, SMS): per-channel queues, priorities, user preferences, de-duplication, retries."
---

> Right person, right channel, exactly once.

## Story

NoteNest adds note sharing. When someone invites you to a shared note you should be told: a push on your phone, an email, sometimes an SMS. At first each feature called the email provider in its own way. Then the incidents arrived: a worker restarted halfway and resent a whole batch, so thousands of people got the same email twice; a login OTP got stuck behind thousands of promotional emails and arrived five minutes late. Minh decided to extract **one shared notification system**.

The familiar flow: **requirements → estimation → API → high-level design → deep dive → trade-offs**.

## Core concepts

### 1. Requirements

**Functional:** send notifications via push (iOS/Android), email and SMS; users toggle channels and types; localized templates; send now or scheduled.

**Non-functional:** urgent notifications (OTP) arrive in seconds; **no duplicates**; survive bulk sends without slowing urgent ones; easy to add channels; delivery status is trackable.

**Out of scope:** template editor design, content A/B testing.

### 2. Estimation

- 10M users, 5 notifications/day each ⇒ 50M/day ≈ **600/s** average, a few thousand/s at peak (see lesson 8).
- A bulk campaign of 10M notifications in 1 hour ≈ **2,800/s** extra, and it must not crowd out OTPs.
- Logs kept 90 days × 50M × ~300 bytes ≈ **1.3 TB**.

Conclusion: moderate load, but **sending out is slow and unreliable** (providers rate-limit and fail transiently). We need queues to decouple and absorb spikes.

### 3. API

```http
POST /api/v1/notifications
Idempotency-Key: 7b1e...
{"user_id": 42, "type": "note_invite", "priority": "normal",
 "data": {"note_title": "Weekly plan", "inviter": "Lan"}}
→ 202 {"id": "n_91c"}
```

It returns `202 Accepted`: sending happens asynchronously (lesson 6). The `Idempotency-Key` lets calling services retry without creating a second notification (lesson 9).

### 4. High-level design

![Notification system](/img/diagrams/case-notification.svg)

*Original diagram drawn for this project.*

1. The **Notification API** accepts the request, checks **user preferences** (is this channel off? quiet hours?), de-duplicates, and rate-limits (lesson 11).
2. It picks channels, renders content from a **template** in the user's language, and pushes to a **separate queue per channel**.
3. A **worker** per channel takes messages, calls the provider (APNs/FCM for push, an email provider, an SMS provider), and records the outcome.
4. Transient failures are retried; when attempts run out the message goes to a **dead-letter queue** for review.

### 5. Deep dive

**Priority.** Use separate queues (or priority classes) per level: `critical` (OTP, security alerts), `normal`, `bulk` (campaigns). The `bulk` workers are rate-limited so they do not eat the whole provider quota. This is how OTPs stay fast during a campaign.

**De-duplication.** Message queues are usually **at-least-once** (lesson 6): a message can be delivered twice. Countermeasures:
- Each notification has a **stable `notification_id`** (derived from the idempotency key).
- Before sending, the worker runs `SET dedup:{id} NX EX 86400` on Redis; if the key already exists it skips.
- If the provider supports it, pass that id as their idempotency key too.
- Know that exactly-once is impossible to guarantee when calling an external system: settle for **at-least-once + de-duplication** so practice comes close to exactly once.

**Retry with backoff.** Retry after 1 s, 5 s, 30 s, 5 min… with jitter (lesson 17). Distinguish transient errors (timeout, 5xx, rate-limited) from permanent ones (device token removed, email does not exist): permanent errors are not retried and the token/email is flagged for cleanup.

**Preferences and compliance.** Keep a `preferences(user_id, channel, type, enabled)` table; promotional email needs an unsubscribe link (RFC 8058 describes one-click unsubscribe). Transactional/security messages may bypass marketing preferences but never legal requirements.

**Scheduling.** Store in a table/sorted set keyed by send time; a periodic sweeper pushes due items onto the queue. For sends in the user's time zone, compute the UTC instant at creation.

**Tracking status.** Record the event chain `queued → sent → delivered → opened/failed` from provider responses and webhooks. Use an append-only log and aggregate asynchronously.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Separate queue per channel | A slow/failing channel does not drag others; scale independently | More components to operate |
| Separate queue per priority | OTPs stay fast | Needs fairness tuning so bulk is not starved forever |
| At-least-once + de-dup | No lost messages, duplicates very rare | Needs a de-dup store (Redis) and a sensible TTL |
| At-most-once | Never a duplicate | Messages can be lost, unacceptable for OTPs |
| Aggressive retry | High delivery rate | May hammer the provider; late sends annoy users |
| Shared content templates | Easy to change and translate | Template versions to manage |
| External providers | Fast to build, infrastructure exists | Dependence, per-message fees, need a second provider as backup |

## Common mistakes

- One shared queue for everything: a promo campaign blocks OTPs.
- Sending inside the user's request (synchronously); a slow provider slows the whole app.
- No de-duplication: a worker restart and users get the same message repeatedly.
- Unlimited retries on dead device tokens, or no retry when the error was only transient.
- Ignoring user preferences and quiet hours; sending at 3 a.m.
- A single provider for a vital channel (OTP); when it fails nobody can log in.
- Not monitoring queue latency and failure rate per channel.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="case-notification" />

## Further reading

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple: User Notifications](https://developer.apple.com/documentation/usernotifications)
- [Amazon SNS: documentation](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [RFC 8030: Web Push](https://www.rfc-editor.org/rfc/rfc8030)
- [RFC 8058: One-click email unsubscribe](https://www.rfc-editor.org/rfc/rfc8058)

**Next:** the final case study, search suggestions as you type. Lesson 29: [Designing search autocomplete](./29-case-autocomplete.md).
