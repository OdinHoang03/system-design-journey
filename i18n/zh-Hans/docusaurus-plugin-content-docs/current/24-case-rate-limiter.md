---
id: case-rate-limiter
title: "案例:设计限流器"
sidebar_position: 24
slug: /case-rate-limiter
description: "设计分布式限流器:需求、估算、Redis 原子计数、精度与成本、fail-open、多地域。"
---

> 把纸面上的算法,变成每秒能扛几十万次检查的服务。

## 故事

在第 11 课里,小明学会了令牌桶和滑动窗口。现在 NoteNest 要向合作伙伴开放公开 API,他得做一个真正的限流器:跑在 20 台网关服务器上,按套餐应用不同配额,不拖慢正常请求,而且自己宕机时不能把 API 一起带走。这是经典面试题:*“设计一个限流器。”*

套路照旧:**需求 → 估算 → API → 总体设计 → 深入 → 取舍**。

## 核心概念

### 1. 需求

**功能:** 按键(用户、API key、IP)和路由限制请求数;规则可配置(如 Free 60 次/分钟,Pro 600 次/分钟);拒绝时返回 `429` 和 `Retry-After`。

**非功能:** 给每个请求增加的延迟极低(约 2 ms 以内)、精度“够用就好”、高可用(限流器坏了不能拖垮 API)、可跨多台服务器工作。

**不在范围内:** 网络层 DDoS 防护(CDN/WAF 的工作,[第 2 课](./02-dns-cdn.md))。

### 2. 估算

- API 峰值 50,000 请求/秒(第 8 课)⇒ 每秒 50,000 次检查。
- 500 万个活跃键,每个计数器约 100 字节 ⇒ 约 **500 MB**,一个 Redis 放得下。
- 每秒 50,000 次操作对一个 Redis 节点(每秒几十万次)很轻松,但每个请求要多一次约 0.5 ms 的网络往返。

结论:数据量很小,瓶颈是**延迟与原子性**,而不是容量。

### 3. API 与部署位置

限流器是网关(第 10 课)里的**中间件**,不是公开端点。核心函数:

```
allow(key, rule) -> {allowed: bool, remaining: int, retry_after: seconds}
```

被拦截时的响应:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

### 4. 总体设计

![分布式限流器](/img/diagrams/case-rate-limiter.svg)

*本项目自绘示意图;思路参考自 [Stripe 关于限流器的文章](https://stripe.com/blog/rate-limiters)。*

网关生成键(用户 + 路由),请 Redis 检查计数器;放行则转发给 API 服务器,否则返回 `429`。规则(各套餐的配额)存放在配置库中,由网关在本地缓存并定期刷新。

### 5. 深入:精确的分布式计数

**竞态问题。** “先 GET 再 SET”不是原子的:两个网关同时读到 `59`,都放行,配额就被突破了。读-改-写必须是**一个原子操作**:固定窗口用 `INCR`,或者用 **Lua 脚本**(Redis 会完整执行脚本,中间不会插入其他操作)。

Lua 实现的令牌桶(节选):

```lua
-- KEYS[1]=键; ARGV: rate, capacity, now(ms)
local s = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(s[1]) or tonumber(ARGV[2])
local ts = tonumber(s[2]) or tonumber(ARGV[3])
tokens = math.min(ARGV[2], tokens + (ARGV[3]-ts)/1000*ARGV[1])
local ok = tokens >= 1
if ok then tokens = tokens - 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[3])
redis.call('PEXPIRE', KEYS[1], 120000)  -- 闲置的键自动清理
return ok and 1 or 0
```

用 Redis 的时间(或统一时钟),而不是各网关自己的时钟,以免时钟偏差。

**选算法。** 令牌桶:内存少(每个键两个数),允许短时突发,适合作默认选择。滑动窗口日志:最精确,但内存随请求数增长。滑动窗口计数:便宜的近似,误差很小。

**扩展 Redis。** 按键的哈希分散到多个节点([第 5 课](./05-database-replication-sharding.md));每个键只在一个节点上,计数依然正确。“热点”键(某个客户猛刷)只会让一个节点变热。

**减少往返。** 网关持有**一小份本地额度**(先从 Redis 预支 10 个令牌,逐步消耗)。代价是精度略降。

**Redis 变慢或宕机。** 设置极短的超时(几毫秒)。超时后,普通 API **fail-open**(放行,并用本地计数兜底),只有登录等敏感路由才 **fail-closed**。同时发出告警让运维知道。

**多地域。** 全局精确计数需要跨地域往返(很贵,见第 8 课)。常见做法是按地域切分配额(各占 1/N),或在地域间异步同步并接受轻微超额。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 在 Redis 集中计数 | 所有网关上的配额都精确 | 多一次往返,多一个可能出故障的组件 |
| 每个网关本地计数 | 无网络开销 | 实际配额 = N × 限额 |
| 批量预支令牌 | 减少 Redis 调用 | 有误差;网关宕机时未用完的令牌被浪费 |
| Lua 脚本 | 原子、一次往返 | 逻辑放在 Redis 里,更难测试和升级 |
| Fail-open | 限流器坏了 API 仍可用 | 风险最高时失去保护 |
| Fail-closed | 始终受保护 | 限流器坏了整个 API 停摆 |
| 按地域划分配额 | 无需跨地域往返 | 集中在某一地域的客户会被提前限流 |

## 常见错误

- 非原子的“先读后写”:高负载下配额被突破。
- 使用各服务器自己的时钟;时钟偏差让窗口出错。
- 计数器键没有 TTL,Redis 无限膨胀。
- 让限流器成为单点故障:Redis 一挂,API 跟着挂。
- 只有一个全局配额,不区分昂贵与廉价的路由。
- 没有指标(被拦截的请求数、检查延迟),无法判断规则是否合理。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在当前浏览器中。

<Quiz lessonId="case-rate-limiter" />

## 延伸阅读

- [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)
- [RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585#section-4)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)(CC BY 4.0)

**下一课:** 从守住入口,转向读多写扩散的问题。第 25 课:[设计信息流](./25-case-news-feed.md)。
