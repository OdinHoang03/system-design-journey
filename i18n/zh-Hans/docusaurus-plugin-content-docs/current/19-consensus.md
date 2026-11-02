---
id: consensus
title: "共识与选主"
sidebar_position: 19
slug: /consensus
description: "多台机器就同一事实达成一致:quorum、脑裂、Raft 直觉、带 fencing token 的分布式锁、唯一 ID。"
---

> 当多台机器必须达成一致时,多数派是唯一值得信任的东西。

## 故事

NoteNest 有个每晚运行的清理任务,为了容错,Minh 把它跑在两台服务器上,一主一备。某天夜里两台机器之间的网络断了:备机以为主机已死,于是自己升为主,而主机其实还活着、还在干活。两个“主”同时删除和写入,数据就乱了。这就是**脑裂(split brain)**。

Minh 需要一种办法,让整个集群对“现在谁是 leader”达成一致,并且绝不会出现两个答案。

## 核心概念

### Quorum:多数派说了算

![多数派共识](/img/diagrams/consensus.svg)

*本图为本项目自绘;思路参考 [Raft 可视化](https://raft.github.io/)。*

一个决定只有在**超过半数**节点确认后才生效。两个互不相交的小组不可能都占多数,所以不会有两个 leader 同时提交。3 节点集群容忍 1 个故障,5 节点容忍 2 个;用奇数,因为 4 个节点比 3 个并不能多容忍任何故障。

### 直观理解 Raft

- **Term(任期)**:单调递增的任期编号,每个任期至多一个 leader。
- **选主**:follower 在一段随机时间内收不到心跳,就成为候选人并拉票;获得多数票者当选 leader。
- **日志复制**:所有写入都经过 leader,leader 把条目发给 follower;多数派存下后条目才算**已提交(committed)**,然后才回复客户端。
- leader 挂了就进入新任期、重新选举;已提交的条目不会丢,因为多数派都持有它。

Paxos 解决同样的问题,以难懂著称;Raft 就是为了更易学而设计的。实践中你很少自己实现:用 **etcd**、**ZooKeeper** 或 **Consul**。

### 何时使用

共识代价高(每次写入都要与多数派往返一轮)且吞吐低。适合需要强一致的少量数据:配置、选主、服务发现、元数据。不要把它当作存放海量数据的主数据库。

### 分布式锁、租约与 fencing token

分布式锁通常带**租约(lease)**(过期自动释放),这样客户端死了锁也不会永远占着。但客户端可能因 GC、网络而停顿超过租约却不自知,之后仍然去写。正确的防御是 **fencing token**:锁发放递增编号,存储端拒绝编号小于已见过编号的写入。Martin Kleppmann 指出,依赖时钟和时序的锁(如 Redlock)没有 fencing 就不安全:用作性能优化可以,要保证正确性则需要共识系统加 token。

### 唯一 ID

- **UUID v4**:128 位随机,无需协调,但会让 B 树索引碎片化。
- **Snowflake**:64 位 = 时间戳 + 机器号 + 序号;本地生成、大致按时间递增。依赖时钟以及机器号的唯一分配。
- **ULID / UUID v7**:时间戳在前、随机在后,可按时间排序。

### 时钟不可靠

各机器时钟会漂移,也可能被回拨(NTP)。不要用墙上时间去判断跨机器的“谁更新”;用 term/版本号或逻辑时钟。

## 取舍

| 选择 | 收益 | 代价 |
|---|---|---|
| 固定单一 leader,不做共识 | 简单 | 网络故障时脑裂 |
| 共识集群(Raft/etcd) | 唯一 leader,容错 | 写延迟较高,需要多数存活 |
| 5 节点而非 3 节点 | 容忍 2 个故障 | 机器更多,写入稍慢 |
| 带租约的锁 | 客户端死亡不会死锁 | 可能在工作中过期:需要 fencing |
| UUID v4 | 无需协调 | 索引碎片化,128 位 |
| Snowflake | 紧凑、按时间有序 | 依赖时钟和机器号 |

## 常见错误

- 自己写选主逻辑:“ping 不通就我顶上”,这是最快走向脑裂的路。
- 共识集群用 2 或 4 个节点,或把所有节点放在同一机架/可用区。
- 重要写入使用带租约的锁却没有 fencing token。
- 相信系统时钟来给跨机器事件排序。
- 把 etcd/ZooKeeper 当作大数据量的数据库。
- Snowflake 不处理时钟回拨,或两台机器机器号重复。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="consensus" />

## 延伸阅读

- [The Secret Lives of Data: Raft(可视化讲解)](https://thesecretlivesofdata.com/raft/)
- [Raft Consensus Algorithm](https://raft.github.io/) 及论文 “In Search of an Understandable Consensus Algorithm”
- [Martin Kleppmann: How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Twitter Engineering: Announcing Snowflake](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake)
- [Designing Data-Intensive Applications](https://dataintensive.net/),第 8、9 章

**下一篇:**进入“运维与架构”部分,从第 20 篇:单体与微服务(即将推出)开始。
