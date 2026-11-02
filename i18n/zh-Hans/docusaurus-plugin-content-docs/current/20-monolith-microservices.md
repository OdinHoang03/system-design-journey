---
id: monolith-microservices
title: "单体与微服务"
sidebar_position: 20
slug: /monolith-microservices
description: "何时拆分服务以及代价:模块化单体、领域边界、每服务一库、分布式单体、绞杀者模式。"
---

> 拆分服务首先解决的是组织问题,其次才是机器问题。

## 故事

NoteNest 现在有 40 名开发者、6 个团队,都在同一个代码库里工作。每次发布都像开一场会:支付团队只改了一行,却要等搜索团队修完 bug 才能上线。导出 PDF 模块的一处内存泄漏,把整个应用拖垮,连登录页都打不开。

有人提议“全部拆成微服务”。Minh 反问:我们要解决哪个问题?又愿意为此付出什么代价?

## 核心概念

### 两个极端与中间地带

![从单体到微服务](/img/diagrams/monolith-microservices.svg)

*图为本项目自绘;思路参考 [microservices.io](https://microservices.io/)(Chris Richardson)和 Martin Fowler 的 [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)。*

- **单体(Monolith)**:一个构建与部署单元。进程内函数调用、一个数据库、天然的 ACID 事务。简单,团队小的时候很快。
- **微服务(Microservices)**:许多小服务,各自独立部署、拥有自己的数据,通过网络通信。
- **模块化单体**:仍是一个部署单元,但内部按清晰边界划分模块,只通过公开接口互相调用。大多数团队应该从这里起步,并在这里停留很久。

### 按领域划分边界,而不是按技术层

沿着**限界上下文(bounded context)**切:笔记、分享、计费、搜索。不要按层切(“界面服务”“逻辑服务”“数据服务”):那样每个功能都要碰三个服务,每次改动仍要协调。康威定律:系统的结构会映射出构建它的组织的结构。好的服务边界通常与一个端到端负责的团队的边界重合。

### 每个服务一个数据库

每个服务拥有自己的数据;其他服务只能通过 API 或事件访问,不能直接读它的表。这样改表结构不会影响别人。代价是:不再有跨服务的 `JOIN` 和 ACID 事务;跨服务的数据要靠 API、读模型和最终一致性来拼装(见第 18 篇)。

### 通信:同步还是异步

- **同步**(HTTP/gRPC):好理解、结果立即返回,但延迟和故障会串联:A 等 B,B 等 C。需要超时、重试、熔断(第 17 篇)。
- **异步**(队列/事件,第 6、16 篇):解耦时间与依赖,但流程更难追踪,结果稍后才到。

### 宣传册里很少提的运维成本

- **网络不可靠**:每次调用都可能变慢、丢失或只成功一半。
- **调试与可观测性**:一个请求穿过多个服务,需要集中日志和链路追踪(第 21 篇)。
- **版本与兼容**:服务 A、B 发布节奏不同步,API 必须向后兼容。
- **基础设施**:CI/CD、服务发现、配置、服务间安全,每一项都随服务数量成倍增加。

### 分布式单体:最糟的陷阱

你付出了微服务的全部成本,却没有得到任何好处:服务必须一起修改、一起发布,或共用一个数据库,或者以长链条互相调用。如果两个服务总是一起变化,它们其实就是一个服务。

### 渐进迁移:绞杀者模式(strangler fig)

不要“一次性重写”。在前面放一层路由(网关),然后每次把**一个**功能迁到新服务,并把流量导过去。旧单体逐渐萎缩,直到清空。每一步都小、可度量、可回滚。

### 何时该拆

- 多个团队发布时互相踩脚,且领域边界已经清晰。
- 某部分需要截然不同的扩展方式或技术(例如视频处理)。
- 需要对关键部分做故障隔离。
- 如果都不满足,在单体内加一个模块要便宜得多。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 单体 | 简单、ACID 事务、易调试、基础设施少 | 发布强耦合、故障扩散、大团队互相冲突 |
| 模块化单体 | 边界清晰、运维仍简单 | 需要纪律来守住边界;仍是一起发布 |
| 微服务 | 独立发布与扩展、故障隔离、团队自治 | 网络、最终一致性、运维成本、调试更复杂 |
| 每服务一库 | 表结构自治 | 没有跨服务 JOIN/ACID |
| 同步调用 | 简单、结果立即可得 | 故障与延迟沿调用链级联 |

## 常见错误

- 过早拆分:团队只有 5 个人,边界还不清晰。
- 按技术层而不是按领域来切。
- 多个服务共用一个数据库。
- 拆得过细(“纳米服务”):一个功能要调用十几个服务。
- 很长的同步调用链,没有超时,也没有熔断。
- 在没有集中日志、链路追踪和自动化 CI/CD 之前就拆分。
- 搞“一次性重写”,而不是绞杀者模式。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="monolith-microservices" />

## 延伸阅读

- [Martin Fowler: MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)
- [Martin Fowler & James Lewis: Microservices](https://martinfowler.com/articles/microservices.html)
- [microservices.io: Pattern language](https://microservices.io/patterns/index.html)
- [Martin Fowler: Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Building Microservices, Sam Newman](https://samnewman.io/books/building_microservices_2nd_edition/)

**下一篇:**系统有了许多零件,怎么知道它是健康还是生病了?第 21 篇:[可观测性](./21-observability.md)。
