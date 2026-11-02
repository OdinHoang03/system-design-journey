---
id: reliability-patterns
title: "容错模式"
sidebar_position: 17
slug: /reliability-patterns
description: "超时、带退避与抖动的重试、熔断、舱壁、降级与过载保护:不让局部故障拖垮整个系统。"
---

> 故障必然会发生;我们要做的是不让它蔓延。

## 故事

NoteNest 已经有了队列,但注册流程仍然同步调用邮件服务来验证邮箱地址。某天晚上邮件服务越来越慢:每次调用要 30 秒,而不是 50 毫秒。API 的线程都在傻等,线程耗尽后,API 连首页这种与邮件毫无关系的请求也接不了了。客户端看到报错就自动重试,负载涨到三倍,邮件服务彻底爬不起来。

Minh 意识到:一个边缘服务生病,绝不能让整个 NoteNest 跟着病倒。

## 核心概念

### 超时:别无限等待

每一次网络调用都必须有**超时**(连接超时和读取超时分开设置)。没有超时,慢的依赖会无限期占住你的线程、连接和内存。超时按对方的 p99 再留些余量来定;并且请求的总预算要大于内部各步骤超时之和(沿调用链传递**截止时间 deadline**)。

### 重试、退避与抖动

![熔断与舱壁](/img/diagrams/reliability-patterns.svg)

*本图为本项目自绘;思路参考 [Microsoft Azure Architecture Center: Cloud design patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) 与 [AWS Builders' Library: Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)。*

瞬时错误(丢包、主从切换)重试一次常常就好了。但重试不当反而有害:

- **指数退避**:两次尝试之间等 100 ms、200 ms、400 ms……
- **抖动(jitter)**:在等待时间上加随机量,避免成千上万的客户端同一时刻重试。
- 限制**重试次数**并设置**重试预算**(例如重试最多占总请求的 10%),避免依赖本就虚弱时出现**重试风暴**。
- 只重试**幂等**操作(或带幂等键的操作),且只重试可能是暂时性的错误(5xx、超时),不要重试 `400`/`404`。
- 只在一层做重试;三层各重试 3 次,一个请求就变成 27 次调用。

### 熔断器(Circuit breaker)

熔断器包在调用外面,监控错误率:

- **Closed(闭合)**:正常,请求通过,统计错误。
- **Open(断开)**:错误超过阈值,一段时间内所有请求立即被拒绝(快速失败),让下游喘口气。
- **Half-open(半开)**:等待一段时间后放少量请求试探;成功则回到 Closed,失败则重回 Open。

快速失败比等超时再失败便宜得多。

### 舱壁(Bulkhead)

像船的隔水舱:给每个依赖分配独立的资源(线程池、连接池、信号量)。邮件变慢只会耗尽邮件那一份池子,笔记功能的线程池仍有余量。也可以按客户等级或关键流程来隔离。

### 降级(Fallback / graceful degradation)

局部坏掉时,返回较差但可用的结果:显示过期的缓存数据、去掉推荐、把邮件放进队列稍后发送、提示“稍后为您验证”。事先想清楚什么是核心功能,什么是可选功能。

### 过载保护与健康检查

- **过载保护(load shedding)**:过载时主动拒绝一部分请求(优先保证重要请求,返回 `503` + `Retry-After`),而不是照单全收然后让所有人都变慢。
- **健康检查**:负载均衡把坏实例从轮询中摘除。区分*存活(liveness)*与*就绪(readiness)*;不要让健康检查去调用沉重的依赖,否则一个边缘服务挂了会让整批实例被摘掉。

### 对冲请求(Hedged request)

为削减尾部延迟(p99):请求超过某个阈值(如 p95)仍无响应,就向另一个副本再发一份,谁先返回用谁。只用于读或幂等操作,并记住它会略微增加负载。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 短超时 | 快速释放资源 | 可能误杀只是稍慢的调用 |
| 重试 | 扛过瞬时错误 | 放大负载;可能引发重试风暴;需要幂等 |
| 熔断 | 快速失败,保护下游 | 可能误拒;阈值需调优并监控 |
| 舱壁 | 隔离故障 | 资源被切碎,不如共享池利用率高 |
| 降级 | 用户仍能完成事情 | 数据陈旧或残缺;多了需要测试的分支 |
| 过载保护 | 过载时系统仍存活 | 部分用户被拒绝 |
| 对冲请求 | 降低尾部延迟 | 负载增加;仅限安全操作 |

## 常见错误

- 不设超时,或依赖库里无限等待的默认值。
- 立即重试、没有退避和抖动:自己制造重试风暴。
- 多层重试叠加,调用次数呈指数增长。
- 对非幂等操作(创建订单、扣款)重试却没有幂等键。
- 熔断器没有指标和告警:断路已开,却没人知道。
- 降级方案从没演练过,真要用时它也坏了。
- 健康检查过深(调用数据库、邮件),一次小故障就让整个集群被负载均衡摘除。
- 只测正常路径,从不主动注入故障(混沌工程 / 故障注入)。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在当前浏览器中。

<Quiz lessonId="reliability-patterns" />

## 延伸阅读

- [AWS Builders' Library: Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Microsoft: Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Microsoft: Bulkhead pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead)
- [Google SRE Book: Handling Overload](https://sre.google/sre-book/handling-overload/)
- [Google SRE Book: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

**下一篇:**当一个操作要跨多个服务、中途某一步失败时怎么办。第 18 篇:[分布式事务与 Saga](./18-distributed-transactions.md)。
