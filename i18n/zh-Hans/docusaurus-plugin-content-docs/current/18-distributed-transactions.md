---
id: distributed-transactions
title: "分布式事务与 Saga"
sidebar_position: 18
slug: /distributed-transactions
description: "跨服务保持数据正确:为什么 ACID 不够、2PC、Saga、补偿、outbox/inbox、幂等。"
---

> 数据分散在多处之后,“要么全做要么全不做”不再是免费的。

## 故事

NoteNest 开始卖 Pro 套餐。Minh 的团队已拆出三个服务:**Order**(订单)、**Payment**(支付)、**Stock**(剩余存储名额)。一次购买包含三件事:创建订单、扣款、预留名额。某天夜里,Payment 刚扣完款,Stock 却说名额没了。客户被扣了钱,却没拿到 Pro 套餐。只有一个数据库时,Minh 一句 `ROLLBACK` 就行;现在没有任何命令能做到。

## 核心概念

### 为什么 ACID 止步于数据库边界

事务的原子性只由单个数据库在其内部保证。三个服务就是三个数据库,没有人持有“统一的提交按钮”。网络可能中途断开,我们也无从得知对方是否已完成。出路有两条:**强制同步**(2PC),或者**接受中间状态再逐步修复**(Saga)。

### 两阶段提交(2PC)

1. **Prepare(准备)**:协调者问每个参与者“你能提交吗?”;同意者锁住数据,并承诺一定能提交。
2. **Commit/Abort(提交/中止)**:全部回答“是”则协调者下令提交,否则中止。

弱点:协调者在参与者投“同意”之后宕机,参与者不能自行决定,只能**持锁等待**(阻塞)。每个事务还要两轮网络往返,速度取决于最慢的一方。2PC 更适合范围小、紧密的场景(几个数据库之间的 XA),而不是众多微服务。

### Saga:带补偿的本地事务链

![带补偿的 Saga](/img/diagrams/distributed-transactions.svg)

*本图为本项目自绘;思路参考 [microservices.io: Saga pattern](https://microservices.io/patterns/data/saga.html)。*

Saga 把工作拆成多个**本地事务**,每个立即提交。每一步都有对应的**补偿(compensation)**:业务意义上的反向操作。第 3 步失败,就倒序执行补偿:退款、取消订单。补偿不等于回滚:客户可能短暂看到“已扣款”,所以必须明确设计中间状态(`PENDING`)。

两种协调方式:

- **Choreography(编排式/事件驱动)**:每个服务监听其他服务的事件并自行响应。中心组件少,但步骤一多就难以追踪整体流程。
- **Orchestration(编导式/集中协调)**:由 orchestrator 逐步下达指令并掌握整个 Saga 的状态。更易理解、易观测;代价是多一个要运维的组件。

### Outbox 与 Inbox

每个 Saga 步骤既要改数据库,又要发消息。两件事若分开做,总会有不一致的时候。**事务性 outbox** 把事件和业务数据在*同一个事务*里写入 `outbox` 表,再由转发器(relay)读表并发布到队列。转发器可能重复发送,所以接收方用 **inbox**(记录已处理 `message_id` 的表)或幂等键来跳过重复。

### 幂等是硬性前提

每一步和每个补偿都可能被再次调用(重试、重复投递)。用 `saga_id` 加步骤编号作为键,让“退款”执行两次也只退一次。

### TCC,以及何时应合并到一个库

**TCC**(Try–Confirm/Cancel)是一种变体:*Try* 先预留(把名额置为“暂时保留”),随后 *Confirm* 或 *Cancel*。比事后补救更整洁,但每个服务要多写两个操作。

用上面任何一种之前,先问一句:真的有必要拆吗?如果这些步骤必须始终一起正确,而一个库还扛得住,那么**一个本地事务**比任何分布式机制都更便宜、更正确。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 单库单事务 | 简单、绝对正确 | 模块被绑在同一个库上 |
| 2PC | 强一致 | 阻塞、慢、协调者是单点 |
| Saga 事件编排 | 松耦合,无中心组件 | 流程难追踪,可能出现事件循环 |
| Saga 集中协调 | 流程清晰、易监控 | 多一个 orchestrator,逻辑易堆积其中 |
| Saga 总体 | 不长期持锁、易扩展 | 最终一致;要写补偿并处理中间状态 |

## 常见错误

- 先拆了微服务,才发现需要跨服务事务;边界本应按“必须一起正确的数据”来划分。
- 补偿不幂等:退款退了两次。
- 写库和发事件分成两步(没用 outbox)。
- 忘了有些动作无法撤销(已发出的邮件),应放在最后一步。
- 不持久化 Saga 状态,崩溃后没人知道进行到了哪一步。
- 把中间状态当作最终结果展示给用户。

## 练习与面试题

每题选一个答案;正确答案与解析会立即显示。结果保存在本浏览器中。

<Quiz lessonId="distributed-transactions" />

## 延伸阅读

- [microservices.io: Saga pattern](https://microservices.io/patterns/data/saga.html)
- [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Microsoft: Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [Garcia-Molina & Salem: Sagas (1987)](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)
- [Designing Data-Intensive Applications](https://dataintensive.net/),第 7 章和第 9 章

**下一篇:**各节点必须就“谁是 leader”达成一致。第 19 篇:[共识与选主](./19-consensus.md)。
