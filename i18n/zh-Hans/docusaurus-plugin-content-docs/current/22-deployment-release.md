---
id: deployment-release
title: "部署与安全发布"
sidebar_position: 22
slug: /deployment-release
description: "上线新代码而不拖垮系统:CI/CD、滚动、蓝绿、金丝雀、特性开关、回滚、向后兼容的迁移。"
---

> 只要每次部署足够小、而且能退回去,频繁部署反而更安全。

## 故事

NoteNest 现在有十几台服务器、几十位工程师。每个周五晚上 Minh 都提心吊胆:把新代码一台台拉下去,跑迁移脚本,然后祈祷。有一次改列名的脚本在所有服务器更新完之前就跑完了,一半服务器还在找旧列,返回了十分钟的 500。至于回滚,没人记得正确的做法。

Minh 得出结论:恐惧并非来自部署本身,而是因为每次部署太大、太手工,而且没有退路。

## 核心概念

### CI/CD 流水线与不可变制品

![金丝雀发布](/img/diagrams/deployment-release.svg)

*本图为本项目自绘;思路参考 [Martin Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) 与 [CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html)。*

- **CI**:每次提交自动构建并跑测试。
- **CD**:通过测试的构建自动(或点一下按钮)部署。
- **不可变制品**:只构建*一次*,产出带版本号的镜像或包,再把这同一个制品依次送入预发布与生产。各环境只在配置上不同,代码绝不不同。此时回滚就是重新部署旧制品。

### 部署策略

- **滚动(rolling)**:逐台(或逐组)把服务器换成新版本。无需额外基础设施,但新旧版本会并行运行一段时间。
- **蓝绿(blue/green)**:在运行中的环境(蓝)旁边搭起一整套新环境(绿),验证后一次性切换全部流量。出问题立刻切回;代价是切换期间基础设施翻倍。
- **金丝雀(canary)**:先放一小部分流量(1–5%)到新版本,观察错误率和延迟,指标正常就逐步放大,不正常就撤回。受影响的范围始终很小,但需要良好的可观测性(见第 21 篇)。

### 特性开关:把部署与发布解耦

**部署**是把代码放到生产环境,**发布**是让用户看到功能。用了特性开关,新代码以*关闭*状态上线,之后按百分比、用户群或地区逐步开启。出事时只需关掉开关,不必再部署一次。代价是旧开关会积累成债务,所以每个开关都要有负责人和下线日期。

### 向后兼容的数据库迁移

滚动或金丝雀期间,两个版本的代码共用同一个数据库,所以 schema 必须同时适用于两者。**扩展/收缩(expand/contract)**模式:

1. **扩展**:新增列或表(不删任何东西)。
2. 新旧同时写入,并对旧数据做**回填**。
3. 把读取切到新的。
4. **收缩**:在之后的某次发布中,确认没人再用旧的,才把它删掉。

每一步都小且可回退。一步到位地改列名,正是 Minh 遇到的事故。

### 健康检查、就绪与回滚

- **就绪探针(readiness)**:实例报告“我可以接收流量了”(已启动、已连上数据库、缓存已预热);没就绪之前负载均衡不会发请求给它。
- **存活探针(liveness)**:进程是否卡死?卡死就重启。
- **自动回滚**:把阈值(错误率、p99 延迟)接入流水线,超过就自动退回。回滚要定期*演练*,因为从没跑过的机制,到需要时多半跑不起来。

## 取舍

| 策略 | 得到 | 失去 |
|---|---|---|
| 滚动 | 简单,无需额外基础设施 | 新旧版本并行;回滚慢 |
| 蓝绿 | 瞬时切换与回滚 | 基础设施翻倍;共用数据库时棘手 |
| 金丝雀 | 风险小,凭数据决策 | 需要良好的可观测性和足够流量;耗时更长 |
| 特性开关 | 发布与部署分离,可瞬时关闭 | 要测试更多代码分支;旧开关变成债务 |
| 大爆炸(停机升级) | 容易理解 | 有停机时间;风险集中在一次 |

## 常见错误

- 旧版本还在运行时,一步就破坏 schema 兼容(改名、删列)。
- 每个环境各自重新构建,线上跑的并不是测过的东西。
- 没有就绪探针,滚动部署把请求发给尚未启动完的实例。
- 金丝雀没有可对比的指标;“没人投诉”不是数据。
- 有回滚机制却从没试过,或者回滚了代码,却忘了数据已被迁移改过。
- 开关从不清理,代码里全是死分支。
- 大而稀少的部署(一个月一次):每次都是赌博;小而频繁的部署才容易定位问题。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="deployment-release" />

## 延伸阅读

- [Martin Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Martin Fowler: CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html)
- [Martin Fowler: FeatureToggle](https://martinfowler.com/articles/feature-toggles.html)
- [Kubernetes: Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
- [Google SRE Book: Release Engineering](https://sre.google/sre-book/release-engineering/)

**下一篇:**系统跑得好,也就成了坏人的目标。第 23 篇:[安全基础](./23-security-basics.md)。
