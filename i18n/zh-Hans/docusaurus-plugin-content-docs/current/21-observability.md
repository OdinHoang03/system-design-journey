---
id: observability
title: "可观测性"
sidebar_position: 21
slug: /observability
description: "结构化日志、指标、分布式链路追踪、SLI/SLO 与错误预算、按症状告警:知道系统在做什么,而不是靠猜。"
---

> 测不出来就修不了;看不见系统,每次故障都只能靠猜。

## 故事

NoteNest 现在有几十个服务。某个周一早晨,用户抱怨“应用好慢”。Minh 打开仪表盘:CPU 正常,内存正常,平均响应时间仍是 200 毫秒。可客服消息还是不断涌来。他一台台服务器去 grep 日志,花了两个小时才发现,搜索服务偶尔会在数据库上等待长达 8 秒。

问题不在系统本身,而在于 Minh **看不见**它。好的系统让你不用再发版,就能提出新问题(“只看广南省的 Pro 用户会怎样?”)。

## 核心概念

### 三大支柱:日志、指标、链路

![日志、指标与链路追踪](/img/diagrams/observability.svg)

*本图为本项目自绘;思路参考 [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/) 的 Monitoring Distributed Systems 一章。*

- **指标(metric)**:随时间变化的数字,便宜又紧凑,回答“哪里出了问题、严重到什么程度”。适合告警和画图。
- **链路(trace)**:*一个*请求穿过多个服务的路径,被拆成带时长的 **span**。回答“慢在哪里”。
- **日志(log)**:详细的事件记录,回答“为什么”。

排查通常是:指标(发现)→ 链路(定位)→ 日志(找原因)。

### 结构化日志与关联 ID

自由文本日志很难检索。请输出 **JSON**,并固定字段:`timestamp`、`level`、`service`、`user_id`、`message`。最关键的是**关联 ID**(correlation ID,即 trace ID):API 网关为每个请求生成一个 ID,各服务把它写进日志并通过 header 继续传递。这样一条查询就能汇总一个请求在十个服务里的全部日志。不要把密码、令牌、个人信息写进日志。

### 指标:RED、USE 与分位数

两套值得记住的指标:

- **RED**(面向处理请求的服务):**R**ate(每秒请求数)、**E**rrors(错误率)、**D**uration(延迟)。
- **USE**(面向 CPU、磁盘、连接等资源):**U**tilization(利用率)、**S**aturation(饱和度/排队)、**E**rrors(错误)。

延迟要看**分位数**(p50、p95、p99),不要看平均值。200 毫秒的平均值可能掩盖了 1% 的请求耗时 8 秒;而重度用户(请求多)碰到这些慢请求的概率比想象中更高。用直方图计算分位数,千万别对多个 p99 取平均。

**基数(cardinality)**:标签值的每种组合都是一条独立的时间序列。把 `user_id` 或 `request_id` 放进指标标签,会生成数百万条序列,直接拖垮监控系统。标签的取值集合应小而有限(`route`、`status`、`region`);单个用户的细节应放在日志或链路里。

### 分布式链路追踪

每个请求携带一个 **trace ID**;每一步生成一个 span,记录开始时间、时长和父 span。拼起来就是一张瀑布图,清楚显示 7.8 秒耗在搜索服务里的一次数据库查询上。开放标准是 **OpenTelemetry**(日志、指标、链路共用的 API、SDK 与格式),可避免被单一厂商锁定。

### SLI、SLO 与错误预算

- **SLI**(服务水平指标):我们测量的东西,如“300 毫秒内成功的请求占比”。
- **SLO**(服务水平目标):给自己定的目标,如“30 天内 99.9%”。
- **错误预算**:允许出错的额度,这里是 0.1%(每 30 天约 43 分钟)。预算还有就继续发新功能;预算耗尽就优先保稳定。

SLO 把“稳定还是功能”的争论变成了数字。SLA 是带赔付的合同,而 SLO 是内部目标,通常比 SLA 更严。

### 告警:看症状,不看原因

“CPU > 80%”的告警可能无伤大雅;“5 分钟内 5% 请求失败”的告警则始终值得关注。应当按**用户能感受到的症状**告警(错误率、延迟、错误预算消耗速度),原因类指标(CPU、磁盘)放进仪表盘供排查。呼叫值班的人**只在需要立刻行动时**才响,并附上处理手册(runbook)。吵闹的告警会让值班人员习惯性忽略(**告警疲劳**),真出事时就没人再信寻呼了。

### 仪表盘、成本与采样

好的仪表盘会讲故事:顶层是关键服务的 RED,往下钻是资源的 USE。可观测性是有成本的:日志和链路随流量增长。降低成本的办法有**采样**(正常链路留 1%,但*所有*出错或很慢的链路都保留)、设置保留期、生产环境调低日志级别。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 详尽记录所有日志 | 大多数故障都能追查 | 存储成本、难检索、泄露数据的风险 |
| 指标 | 便宜、快,适合告警 | 没有单个请求的细节 |
| 100% 链路追踪 | 信息完整 | 昂贵,略增延迟 |
| 采样追踪 | 便宜 | 可能漏掉罕见请求(用尾部采样缓解:保留出错/慢的) |
| 灵敏的告警 | 早发现 | 误报、疲劳 |
| 基于 SLO 的告警 | 噪音少,与用户挂钩 | 需要认真定义 SLI |

## 常见错误

- 只看**平均**延迟;p99 才是最倒霉用户的体验。
- 把 `user_id` 放进指标标签(基数爆炸)。
- 没有关联 ID,跨服务的日志靠人工拼接。
- 按原因(CPU、内存)而不是症状告警,或者告警发出后没人处理。
- 仪表盘几百张图,却不知道该看哪张。
- 把敏感数据写进日志。
- 没人监控监控系统本身(它挂了就两眼一抹黑)。
- 把 SLO 定成 100%:不可达,还会扼杀一切变更的空间。

## 练习与面试题

每题选一个答案;正确答案和解析会立刻显示。结果保存在当前浏览器中。

<Quiz lessonId="observability" />

## 延伸阅读

- [Google SRE Book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [OpenTelemetry: Documentation](https://opentelemetry.io/docs/)
- [Prometheus: Metric and label naming](https://prometheus.io/docs/practices/naming/)
- [Tom Wilkie: The RED Method](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Brendan Gregg: The USE Method](https://www.brendangregg.com/usemethod.html)

**下一篇:**看得见了,发布就能更安全。第 22 篇:[部署与安全发布](./22-deployment-release.md)。
