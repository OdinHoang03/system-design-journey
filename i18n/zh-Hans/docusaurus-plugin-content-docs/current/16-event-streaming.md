---
id: event-streaming
title: "事件流(Kafka)"
sidebar_position: 16
slug: /event-streaming
description: "追加写日志、分区、偏移量、消费者组、保留策略、压缩、回放:当事件成为可以重读的数据。"
---

> 别在处理完事件后就把它扔掉:留下来,谁需要谁来读。

## 故事

NoteNest 已经有了队列,而且运转良好:每个任务由一个 worker 处理,然后消失。可 Minh 现在有了更多需求。搜索组想听到每一条“笔记被编辑”的事件来更新索引;统计组想要一模一样的事件;上周推荐组发现了 bug,需要把过去三天的数据重跑一遍。用队列的话,消息 ack 之后就没了;想让多方都能听,就得复制队列;想重跑,根本没办法。

Minh 换了个思路:事件不是“做完就丢的任务”,而是**已经发生的事实**,应该记进一本只增不减的账本。谁需要,就拿一枚书签,从想读的地方开始读。

## 核心概念

### 日志:只能往后追加的账本

![事件流](/img/diagrams/event-streaming.svg)

*本图为本项目自绘;思路参考 [Apache Kafka: Introduction](https://kafka.apache.org/intro)。*

- **追加写日志**:事件只会加在末尾,不会在中间修改。每条事件有一个序号,叫**偏移量(offset)**。
- **Topic** 是同一类事件的流(如 `note.updated`),被切分成多个**分区(partition)**,每个分区是一份独立的日志。
- **消费者**自己记住读到了哪里。传统队列在 ack 时删除消息;日志则原样保留,只移动书签。

### 分区与顺序

分区让读写可以并行,突破单机上限。代价是:顺序只在**单个分区内**有保证,整个 topic 没有。生产者用 **key**(例如 `note_id`)选择分区:相同 key 总是进同一个分区,所以同一篇笔记的事件仍然有序,不同笔记则并行处理。

### 消费者组

**消费者组**是一组共同分担某个 topic 的 worker:同一时刻每个分区只由组内一个消费者读取。增加消费者能提高并行度,但最多到分区数为止(多出来的闲着)。不同的组(`search`、`stats`)**互不影响**地读取,各自有独立的偏移量。这是它与队列最大的区别:一条事件,多方使用,互不干扰。

### 保留多久:保留策略与压缩

- **按时间/大小保留**:保留 7 天或 1 TB,然后删除最旧的片段。
- **日志压缩(compaction)**:每个 key 只保留最新值。适合存“当前状态”(配置、用户资料),而不是完整历史。

### 回放:重读过去

日志还在,消费者只要把偏移量往回拨,就能重新处理:修好 bug 后重跑三天数据、构建新索引,或让新服务从头追上进度。这是事件流最主要的威力。前提是处理必须幂等,因为同一事件可能被读取多次(参见[消息队列](./06-message-queue.md))。

### 持久性:复制与 ISR

每个分区有一个接收写入的 **leader** 和若干复制它的 **follower**。跟得上进度的 follower 集合叫 **ISR**(同步副本集)。设置 `acks=all` 时,只有整个 ISR 都收到才算写成功:稍慢一点,但一台 broker 宕机不会丢事件。leader 挂了,会从 ISR 中选出新的(选举机制见[共识与选主](./19-consensus.md))。

### 分区数的选择与热点 key

分区数决定最大并行度,而且以后很难减少;增加分区还会改变 key 到分区的映射,打乱按 key 的顺序。可以用目标吞吐除以单个消费者的速度来估算,再留出余量。**热点 key**(某个 key 占了大部分流量,比如“大 V”账号)会全部挤进同一个分区造成拥堵;办法是给 key 加随机后缀,代价是该 key 失去严格顺序。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 用日志代替队列 | 多组独立读取、可回放、高吞吐 | 运维更重;没有现成的逐条 ack/重试 |
| 更多分区 | 并行度高 | 顺序仅限分区内;日后难调整 |
| 保留时间长 | 能回放更久、更安全 | 占磁盘 |
| 压缩 | 精简,保留最新状态 | 丢失中间历史 |
| `acks=all` | broker 宕机不丢数据 | 写延迟更高 |
| 按实体设 key | 实体内顺序正确 | 有热点 key 风险 |

## 常见错误

- 每天只有几个小任务也上 Kafka:简单队列就够了。
- 以为顺序是全局的;其实只存在于单个分区内。
- 没有设置 key,同一实体的事件落入不同分区,到达顺序错乱。
- 消费者数量多于分区数:多出的没有作用。
- 消费者不幂等,然后又做回放:数据被重复累加。
- 不监控**消费滞后(consumer lag)**(最新偏移量与已读偏移量之差);消费者落后了却没人知道。
- 保留期短于排查故障所需时间,等到要回放时数据已被删掉。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="event-streaming" />

## 延伸阅读

- [Apache Kafka: Introduction](https://kafka.apache.org/intro)
- [Apache Kafka: Documentation, Design](https://kafka.apache.org/documentation/#design)
- [Jay Kreps: The Log, what every software engineer should know](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- [Confluent: Kafka 101](https://developer.confluent.io/courses/apache-kafka/events/)
- [Designing Data-Intensive Applications](https://dataintensive.net/),第 11 章(Stream Processing)

**下一篇:**事件流向四面八方,故障也会蔓延到四面八方。第 17 篇:[容错模式](./17-reliability-patterns.md)。
