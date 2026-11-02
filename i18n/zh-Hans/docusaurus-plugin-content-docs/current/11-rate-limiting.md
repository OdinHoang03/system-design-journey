---
id: rate-limiting
title: "限流"
sidebar_position: 11
slug: /rate-limiting
description: "限制请求速率:令牌桶、漏桶、固定/滑动窗口;在哪里限、按什么键限、如何返回 429。"
---

> 谁都不能独占整张餐桌,熟客也不行。

## 故事

一个合作伙伴写了个同步笔记的脚本,不小心每秒调用 API 3,000 次。没有人攻击,整个 NoteNest 却明显变慢,真实用户纷纷超时。封掉对方的 IP 会招来抱怨,不封又会重复出事。小明需要一条公平的规则:每位客户有一份配额,超出了就被温和地拒绝,而不是把整个系统拖垮。

## 核心概念

### 为什么要限流

- **保护**系统免受 bug 或恶意客户端造成的过载(包括暴力破解密码、爬虫)。
- **公平**:一个客户端不能饿死其他客户端。
- **控制成本**:调用按次计费的服务,或让不同套餐拥有不同配额。

限流是有意拒绝*一部分*请求,让其余请求仍能被良好地服务(主动的负载削减)。

### 四种主要算法

| 算法 | 思路 | 优点 | 缺点 |
|---|---|---|---|
| **令牌桶** | 桶最多装 `b` 个令牌,每秒补充 `r` 个;每个请求取走 1 个 | 允许短时突发(至多 `b`),长期保持平均速率 `r`;内存占用小 | 需要选 `b` 和 `r` |
| **漏桶** | 请求进入队列,以固定速率流出 | 输出平稳 | 突发会填满队列,新请求被丢弃;延迟增加 |
| **固定窗口** | 在每个固定窗口(如每分钟)内计数 | 非常简单,内存少 | 边界问题:相邻两个窗口在交界处可能放行接近两倍的配额 |
| **滑动窗口** | 统计“最近 N 秒”内的请求 | 更精确,没有边界问题 | 更耗内存(日志式)或只是近似(加权计数) |

![令牌桶](/img/diagrams/rate-limiting.svg)

*本项目自绘示意图;思路参考自 [Stripe 关于限流器的文章](https://stripe.com/blog/rate-limiters)。*

最简令牌桶:

```python
import time

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity = rate, capacity   # 令牌/秒,容量
        self.tokens, self.last = capacity, time.monotonic()

    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

### 按什么键限流

**键**决定了对谁公平:按 **IP**(简单,但 NAT 后很多人共用一个 IP)、按**用户/API key**(最准确,但要先认证)、按**接口**(写入重的路由比读取限得更严),或组合使用。常见做法是分层:一个粗粒度的全局限额,再给登录等敏感路由加一层严格限额。

### 在哪里限流

- **网关/代理**(第 10 课):最自然的位置,在消耗资源之前就尽早拒绝。
- **应用内部**:规则依赖业务数据(套餐、组织)时。
- **CDN/WAF**(第 2 课):在边缘削掉原始流量。
- **客户端**:调用其他服务时自我限速,避免压垮对方。

### 多台服务器时

如果每台服务器各数各的,实际配额就是 `N × 限额`。需要共享计数器,通常用 Redis 的原子操作(Lua 脚本或 `INCR` + `EXPIRE`)。代价是每个请求多一次网络调用,而且 Redis 变慢或宕机时要决定 **fail-open**(放行)还是 **fail-closed**(拦截)。对于重要但不致命的配额,常选 fail-open,并用本地计数作为兜底。第 24 课会深入讲限流器的设计。

### 被拦截时怎么回应

返回 `429 Too Many Requests`,附上 `Retry-After`(建议等待的秒数),也可以附上说明剩余配额的响应头。有礼貌的客户端会等待,并带退避和抖动重试(第 17 课)。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 令牌桶 | 允许短时突发,轻量 | 要调参;突发仍会冲击后端 |
| 漏桶 | 输出平滑 | 队列满时延迟增加;旧请求排队等待 |
| 固定窗口 | 最简单 | 边界处可能放行近两倍配额 |
| 滑动窗口 | 精确 | 更多内存/计算 |
| 每台服务器本地计数 | 无网络开销,快 | 实际配额偏离,随服务器数增长 |
| 集中计数(Redis) | 配额精确 | 增加延迟,多一个可能故障的组件 |
| Fail-open | 计数器坏了服务仍可用 | 风险最高时反而失去保护 |
| Fail-closed | 始终受保护 | 计数器坏了连真实用户也被拒 |

## 常见错误

- 按 IP 限流却不考虑 NAT/代理:误封整个办公室,或者只看得到代理的 IP。
- 所有路由共用一个配额,而 `/login` 需要比 `/notes` 严格得多。
- 不返回 `Retry-After`;客户端乱猜并集中重试,情况更糟。
- 用非原子的“先读后写”计数;两个并发请求同时通过。
- 只在边缘限流而忽略内部服务;一个出故障的服务仍能压垮另一个。
- 不监控被拦截的请求数,无法判断规则是太严还是正被攻击。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在当前浏览器中。

<Quiz lessonId="rate-limiting" />

## 延伸阅读

- [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585#section-4)
- [Cloudflare: What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)
- [Redis: Rate limiting patterns](https://redis.io/glossary/rate-limiting/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)(CC BY 4.0)

**下一课:** “扩展与性能”这一部分到此完成;后面的课程会进入数据部分。剩余路线请看[大纲](/outline)。
