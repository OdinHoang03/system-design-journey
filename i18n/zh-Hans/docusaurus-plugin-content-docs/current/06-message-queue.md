---
id: message-queue
title: "消息队列与异步处理"
sidebar_position: 6
slug: /message-queue
description: "用队列把重活从请求中剥离:producer、consumer、至少一次投递、幂等、重试、死信队列、背压。"
---

> 繁重的工作不必让用户当场等着。

## 故事

NoteNest 上线了“把笔记导出为 PDF”和“发送提醒邮件”两个功能。用户点击导出时,API 会当场执行:生成 PDF(3 秒)、发送邮件(1 秒)、更新统计……做完才响应。高峰期,成千上万的人同时点击,服务器都在忙着生成 PDF,再没有余力处理普通请求。邮件服务只要稍微慢一点,整条链路就跟着卡住。

小明意识到,用户只需要知道“请求已收到”;PDF 晚几秒送到就行。

## 核心概念

### 队列:两方之间的信箱

![Message queue](/img/diagrams/message-queue.svg)

*本图为本项目原创绘制;思路参考自 [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0),Asynchronism 部分。*

- **生产者(Producer)**(API)把一条**消息(message)**(待办的工作)放入队列,然后立刻响应,例如返回 `202 Accepted`。
- **队列(Queue)**持久地保存消息,直到有人来处理。
- **消费者(Consumer)/ worker** 按自己的节奏取出消息处理,然后**确认(ack)**。

好处:

1. **时间解耦**:用户不必等待繁重的工作。
2. **削峰填谷**:队列是缓冲区,worker 匀速处理。
3. **依赖解耦**:邮件服务挂了,消息就在队列里等着,API 照常运行。
4. **独立扩展**:队列变长就加 worker,无需改动 API。

### 队列与发布/订阅

- **队列(点对点)**:每条消息只会被组内的一个消费者处理。适合分配任务。
- **发布/订阅(topic)**:每条消息会投递给*所有*订阅的消费组。适合向多个服务广播事件(“笔记已创建”):搜索、统计、通知。
- **分布式日志**(Kafka 风格):消息被顺序追加写入并长期保留,消费者自己记录读取位置,还可以重新读取。适合大规模事件流和数据重处理。

### 投递保证

| 级别 | 含义 | 影响 |
|---|---|---|
| 至多一次(At-most-once) | 最多投递一次 | 消息可能丢失 |
| **至少一次(At-least-once)** | 至少投递一次,可能重复 | 最常见;消费者必须能容忍重复 |
| 恰好一次(Exactly-once) | 刚好一次 | 在分布式系统中非常难;通常用至少一次 + 幂等来达到“效果上的一次” |

由于可能收到重复消息,消费者必须是**幂等(idempotent)**的:处理两次与处理一次结果相同。做法:附带 `message_id` 或**幂等键(idempotency key)**,记录已处理的消息,或者使用天然幂等的操作(`SET status = 'sent'`)。

### 失败、重试与死信

- worker 在 ack 之前出错,消息会被重新投递(在可见性超时 visibility timeout 之后)。
- **带指数退避 + 抖动(jitter)的重试**可以避免请求扎堆。
- 一直失败的消息(**毒消息 poison message**)会被转入**死信队列(dead-letter queue,DLQ)**,留待人工检查,而不是堵住整条队列。

### 顺序与背压

队列通常只保证单个分区/分组内有序(例如相同 `user_id`),而非全局有序。如果生产者长期比消费者快,队列会无限增长:需要监控**队列长度 / 延迟**,自动增加 worker,并在超过阈值时施加**背压(backpressure)**(拒绝或减缓生产者)。

### 常用模式

- **Outbox(发件箱)**:把事件写入与业务数据*同一个事务*里的表,再由独立进程转发到队列;避免“数据库写成功但发队列失败”的情况。
- **Saga**:用一连串带补偿(compensation)的步骤,取代分布式事务。
- **Fan-out(扇出)**:一个事件,多个相互独立的消费者。

## 取舍

| 选择 | 收益 | 代价 |
|---|---|---|
| 同步 | 简单,结果立即可得 | 用户要等待;一个环节慢就拖累全部 |
| 通过队列异步 | 快,能扛突发流量,依赖解耦 | 结果稍后才到;难调试;多一层基础设施;要针对重复/失败来设计 |
| 至少一次 + 幂等 | 不丢任务 | 消费者要写得小心 |
| 严格保序 | 顺序正确 | 降低并行度 |
| Kafka 式日志 | 可重读,吞吐量大 | 运维比简单队列复杂 |

## 常见错误

- 消费者不幂等:邮件发了两遍,钱扣了两次。
- 没有 DLQ;一条坏消息让 worker 无限循环。
- 不做退避就立刻重试,把本就脆弱的下游服务彻底压垮。
- 把队列用在需要即时结果的场景(登录、需要确认的支付)。
- 不监控延迟和队列长度;直到用户抱怨才发现问题。
- 先写数据库、再发队列,分成两个独立步骤;任何一步失败,数据就不一致(应使用 outbox)。
- 消息体过大:应携带引用(ID、URL),而不是整个文件。

## 练习与面试题

1. 用队列设计 NoteNest 的“导出 PDF”流程:用户如何拿到结果(轮询、邮件、WebSocket)?
2. 为什么恰好一次几乎无法做到?我们用什么来替代?
3. 为“发送欢迎邮件”写一个幂等的消费者。
4. 解释 DLQ、可见性超时(visibility timeout)和退避(backoff)。
5. 队列在持续变长。列出可能的原因及处理办法。
6. 什么时候选 Kafka(日志),而不是 RabbitMQ/SQS 这类队列?

## 延伸阅读

- [RabbitMQ: Tutorials](https://www.rabbitmq.com/tutorials)
- [Apache Kafka: Introduction](https://kafka.apache.org/intro)
- [Amazon SQS: Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Microsoft: Transactional Outbox pattern](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos)
- [Designing Data-Intensive Applications](https://dataintensive.net/),第 11 章(Stream Processing)

**下一篇:**把所有零件拼起来。第 7 篇:[案例:设计一个短链接服务](./07-url-shortener.md)。
