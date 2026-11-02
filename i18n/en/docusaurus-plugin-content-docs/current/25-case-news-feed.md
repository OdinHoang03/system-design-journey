---
id: case-news-feed
title: "Case study: designing a news feed"
sidebar_position: 25
slug: /case-news-feed
description: "Design a news feed: fan-out on write vs read, a hybrid model for celebrities, feed caching, cursor pagination."
---

> One post, millions of viewers: should the work happen at write time or at read time?

## Story

NoteNest adds following: users follow each other and open the home page to see the latest public notes from the people they follow. At first Minh wrote one query: fetch the list of people you follow, fetch their latest posts, sort by time. With 100 follows that is fine. Then a famous author with 2 million followers posts and millions of people open the app at once. Each page load costs hundreds of queries and the database clogs.

The usual flow: **requirements → estimation → API → high-level design → deep dive → trade-offs**.

## Core concepts

### 1. Requirements

**Functional:** publish posts; follow/unfollow; view a feed of posts from people you follow, newest first; infinite scroll.

**Non-functional:** a fast feed (under ~200 ms), new posts appear within a few seconds (eventual consistency is acceptable, [lesson 5](./05-database-replication-sharding.md)), high availability, survive accounts with millions of followers.

**Out of scope:** machine-learning ranking, ads, rich media.

### 2. Estimation

- 10M DAU, each opening the feed 5 times/day ⇒ 50M reads ≈ **600 reads/second**, peak ~3,000 (lesson 8).
- Each person posts 0.5 times/day ⇒ 5M posts/day ≈ **60 writes/second**.
- Average 200 followers each ⇒ fan-out on write: 60 × 200 = **12,000 inserts/second**; one author with 2M followers alone creates 2M inserts for a single post.
- Feed cache: 10M people × 500 post ids × 8 bytes ≈ **40 GB**, fits a small Redis cluster.

Conclusion: the system is **read-heavy**, but follower counts are extremely skewed (a few enormous accounts). That is the hard part.

### 3. API

```http
POST /api/v1/posts          {"text": "..."}      → 201 {"id": "p123"}
POST /api/v1/follow/{user}                         → 204
GET  /api/v1/feed?limit=20&after=<cursor>          → 200 {"items": [...], "next": "<cursor>"}
```

The feed uses **cursor pagination** (lesson 9), because new posts keep landing at the top and offsets would shift pages.

### 4. Two core strategies

![News feed fan-out](/img/diagrams/case-news-feed.svg)

*Original diagram drawn for this project; idea referenced from Twitter's [“Timelines at Scale” talk](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/) and the [system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0).*

**Fan-out on read (pull)**: at read time, get the follow list, fetch each person's latest posts, merge and sort. Writes are cheap (just store the post); reads are expensive and slow when you follow many people.

**Fan-out on write (push)**: at post time, insert the post id into **each follower's own feed** (a list in Redis). Reads are very fast (fetch one precomputed list), but writes are costly: one celebrity post becomes millions of inserts, much of it wasted on people who never open the app.

### 5. Deep dive: the hybrid model

In practice you **mix** them:

- Ordinary users (few followers): **push**. The post goes to a queue ([lesson 6](./06-message-queue.md)); a *fan-out worker* inserts the id into each follower's feed cache, asynchronously so the poster does not wait.
- Celebrities (over a threshold, say 100,000 followers): **no push**. Their posts are stored in one place only.
- At read time: take the user's precomputed feed, then **pull** recent posts from the celebrities they follow and merge by time.

**Store only ids in the feed cache.** A feed is a list of post ids (and timestamps) trimmed to ~500 entries. On read, "hydrate" the post body and author name from the post/user caches ([lesson 4](./04-cache.md)); this avoids copying content millions of times and lets edits/deletes happen in one place.

**Inactive users.** Do not push into the feed of someone who has not opened the app in a long time; when they return, rebuild their feed by pulling. This saves a lot of writes.

**Data.** Posts are partitioned by `post_id`/author; the follow relation is stored in both directions (who follows whom, who is followed by whom) since fan-out needs the follower list while pull needs the following list ([lesson 5](./05-database-replication-sharding.md)).

**Deletes and unfollows.** A feed cache may contain deleted ids; skip ids that no longer exist when hydrating and clean up gradually. After an unfollow, a few leftover posts are acceptable until the cache refreshes.

**Ordering.** Sort by time descending (time-ordered ids such as Snowflake help). The cursor holds the id/timestamp of the last item on the previous page.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Fan-out on read | Cheap writes, always fresh | Slow reads, heavy query load |
| Fan-out on write | Very fast reads | Write storms for celebrities; wasted work for non-readers |
| Hybrid by follower threshold | Balances both | More complex; merge at read time |
| Store only ids in the feed | Little memory, easy edits/deletes | Extra hydrate step |
| Asynchronous fan-out | Fast posting | A post shows up seconds late in others' feeds |
| Trim feed to 500 entries | Bounded memory | Scrolling far back reads from the DB |
| Skip inactive users | Saves writes | First return visit is slower |

## Common mistakes

- Choosing pure push, then collapsing under an account with millions of followers.
- Copying the full post content into every person's feed.
- Offset pagination; new posts cause duplicates/gaps.
- Doing fan-out synchronously inside the post request so the poster waits.
- No threshold or special handling for "hot users".
- Ignoring deletes, blocked users and privacy when hydrating.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="case-news-feed" />

## Further reading

- [Twitter: Timelines at Scale (InfoQ)](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/)
- [Redis: Lists](https://redis.io/docs/latest/develop/data-types/lists/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Twitter timeline section

**Next:** a feed is read-heavy; next comes two-way real time. Lesson 26: [Designing a chat system](./26-case-chat.md).
