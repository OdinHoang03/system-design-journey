---
id: case-file-storage
title: "Case study: designing file & video storage"
sidebar_position: 27
slug: /case-file-storage
description: "Designing file and video storage and sync: chunking, direct upload to object storage, metadata, asynchronous transcoding, CDN."
---

> Big files should not take a detour through your servers.

## Story

NoteNest users want to attach photos, PDFs and even 2 GB lecture videos to notes. Minh's first version receives the file through the API and writes it to the app server's disk. One person uploading a large video holds a connection for minutes; three of them exhaust the workers. The disk fills fast, and when he adds servers, a file sits on one machine that the others cannot see. If the network drops at 95%, the upload restarts from zero. It is time to treat files as a problem of their own.

## Core concepts

### 1. Requirements

**Functional:** upload and download files (up to a few GB); resume after a network drop; sync across devices; smooth video playback on any network; sharing by link; version history (optional).

**Non-functional:** **high durability** (a stored file must never be lost), fast delivery worldwide, reasonable storage cost.

**Out of scope:** real-time collaborative document editing.

### 2. Estimation (see lesson 8)

- 5M DAU, 10% upload daily, 5 MB on average ⇒ 500,000 × 5 MB ≈ **2.5 TB/day**, ≈ **900 TB/year**; 3 replicas ≈ 2.7 PB. This is why you need object storage, not server disks.
- Writes: 500,000 files/day ≈ **6 files/s**: small. Bandwidth is the issue: 2.5 TB/day ≈ **30 MB/s** average, a few times that at peak.
- Reads: 10–50× writes, mostly video and images ⇒ you need a **CDN** (lesson 2).

Conclusion: few files, but **huge volume and bandwidth**. Do not let file bytes pass through app servers.

### 3. Separate metadata from content

| Part | Stored in | Why |
|---|---|---|
| **File content** (bytes) | **Object storage** (S3 or equivalent), split into chunks | Cheap, durable (many copies), nearly unlimited scale |
| **Metadata** (name, owner, size, chunk list, version, permissions) | Database (SQL, lessons 5, 12) | Needs queries, transactions, access control |

### 4. High-level design

![File and video storage](/img/diagrams/case-file-storage.svg)

*Original diagram drawn for this project.*

1. The client calls **start upload**; the metadata service creates an `uploading` record and returns **pre-signed URLs** (signed, expiring in minutes) for each chunk.
2. The client **PUTs each chunk straight to object storage** with those URLs; the bytes never touch the app server. Chunks can upload in parallel.
3. When done, the client (or a storage event) signals **commit**; the metadata service verifies all chunks exist and flips the state to `ready`.
4. For video, commit puts a job on a **queue** (lesson 6); workers **transcode** asynchronously.
5. The results (several resolutions) are served by a **CDN** to viewers.

### 5. Chunking

Splitting a file into chunks (say 4–8 MB) gives you:

- **Resumability**: re-upload only the missing chunks.
- **Parallelism**: many chunks at once use the available bandwidth.
- **Cheap sync**: editing part of a large file only uploads changed chunks (compare chunk hashes).
- **Deduplication**: chunks with the same hash are stored once.

Chunks that are too small bloat metadata and request counts; too large and you lose resumability and parallelism.

### 6. Syncing across devices

Each device remembers a `version`/cursor; when it reconnects it asks "what changed after this cursor?" (long polling, or a push notification saying something changed, then pulling the change list). Two devices editing one file create a **conflict**: the simple answer is to keep both (a "conflicted copy"); automatic merging only suits structured data.

### 7. Video: transcoding and streaming

A raw video (one format, one bitrate) will not play smoothly everywhere. Workers **transcode** it into several resolutions/bitrates, then cut it into short segments of a few seconds (HLS or MPEG-DASH). The player picks segments by current bandwidth (**adaptive bitrate**) and switches quality as the network changes. Transcoding is CPU-heavy, so it runs asynchronously from a queue, with workers scaled by queue length; users see "processing" until it finishes.

### 8. Delivery and security

- A **CDN** caches video segments and public files near viewers (lessons 2, 4).
- Private downloads use **short-lived pre-signed URLs** after the metadata service checks permissions, instead of a public bucket.
- Scan for viruses/content asynchronously before the state becomes `ready`.
- Lifecycle: move rarely used files to a cheaper storage tier, delete orphaned chunks from abandoned uploads.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Upload directly to object storage | Light app servers, scales well | Signed URLs to manage, post-upload checks |
| Through the app server | Tight control, simple at first | Bandwidth bottleneck, long-held connections |
| Small chunks | Fine-grained resume and sync | More metadata, more requests |
| Large chunks | Fewer requests | More re-upload on failure, coarse sync |
| Deduplication | Saves space | Complexity, reference counting on delete, privacy concerns |
| Async transcoding | Does not block users, scales independently | Video is not watchable immediately |
| Multiple resolutions | Smooth on any network | Storage and CPU cost |
| Keep both on conflict | No data lost | Users must merge by hand |

## Common mistakes

- Routing file bytes through the app server before reaching storage.
- No resumable upload; a 2 GB file that fails at 95% starts over.
- Making the bucket public instead of using signed URLs, exposing private files.
- Pre-signed URLs that live too long, or have no size/type limits.
- Transcoding synchronously inside the upload request; the request times out.
- Deleting metadata but not chunks (garbage grows forever), or deleting chunks that are still referenced.
- Trusting the client-declared extension/`Content-Type`; verify for real.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="case-file-storage" />

## Further reading

- [AWS: Uploading objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [AWS: Multipart upload overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [RFC 8216: HTTP Live Streaming](https://www.rfc-editor.org/rfc/rfc8216)
- [MDN: Media streaming and adaptive bitrate](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/Live_streaming_web_audio_and_video)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Next:** the file is up; now tell the user at the right moment. Lesson 28: [Designing a notification system](./28-case-notification.md).
