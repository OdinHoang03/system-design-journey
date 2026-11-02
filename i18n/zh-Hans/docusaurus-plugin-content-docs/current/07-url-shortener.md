---
id: url-shortener
title: "案例:设计一个短链接服务"
sidebar_position: 7
slug: /url-shortener
description: "从需求出发设计短链接服务:容量估算、Base62 短码生成、存储、缓存、扩展,以及异步统计分析。"
---

> 把所有零件拼成一个完整的系统。

## 故事

NoteNest 的用户经常分享冗长的链接。小明决定再做一个 **notenest.link**:粘贴长链接,得到像 `notenest.link/aZ3x9Qk` 这样的短链接。这是一道经典的面试题,也是回顾整段旅程的好机会:HTTP、DNS/CDN、负载均衡、缓存、数据库、队列。

所有系统设计题的流程:**明确需求 → 估算 → API → 初步设计 → 深入难点 → 取舍**。

## 核心概念

### 1. 需求

**功能需求:**根据长链接创建短链接;访问短链接时跳转;(可选)自定义别名、过期时间、点击量统计。

**非功能需求:**跳转延迟低(约 100 ms 以内)、高可用(链接失效就是永久性的损坏)、短码难以猜测、能承受大量读取。

**不在范围内(面试时要明确说出来):**用户账号、高级的垃圾信息/钓鱼防护。

### 2. 估算(取整,便于心算)

- 每月 1 亿条新链接 ≈ **每秒 40 次写入**。
- 读写比 = 100:1 ⇒ ≈ **每秒 4,000 次读取**,峰值是平均值的 5–10 倍。
- 存储 5 年:100M × 12 × 5 = 60 亿条记录;每条约 500 字节 ⇒ ≈ **3 TB**。
- 需要多少个字符?用 Base62(`a–z A–Z 0–9`):62⁶ ≈ 5.7×10¹⁰,62⁷ ≈ 3.5×10¹²。对 60 亿条链接来说,**7 个字符**绰绰有余。

结论:这是个**读多写少**的系统,数据量不算大。缓存和从库是主要工具。

### 3. API

```http
POST /api/v1/links
{"url": "https://example.com/very/long/path", "alias": "my-note", "expires_at": "2027-01-01"}
→ 201 {"short_url": "https://notenest.link/aZ3x9Qk"}

GET /aZ3x9Qk
→ 301 或 302,Location: https://example.com/very/long/path
```

**301 还是 302?** `301`(永久重定向)允许浏览器/CDN 缓存跳转:速度快、负载低,但我们无法统计点击,也很难更改目标地址。`302`(临时重定向)每次都会经过服务器:可以统计点击、可以更改目标地址,但负载更高。如果需要统计,就用 `302`。

### 4. 生成短码:最难的部分

| 方法 | 思路 | 优点 | 缺点 |
|---|---|---|---|
| 哈希后截取 | 对 URL 做 MD5/SHA,取 7 个字符 | 不需要计数器 | **冲突**:必须检查并重试 |
| 计数器 + Base62 | 自增 ID → 转成 Base62 | 无冲突,短码短 | 短码可被猜到;如果计数器只有一处,就是瓶颈 |
| 分块计数器 | 每台应用服务器从中心服务申请一个 **ID 段**(例如 1000 个号) | 快,协调少 | 服务器宕机会浪费几个 ID(可以接受) |
| 随机 + 检查 | 生成 7 个随机字符,不存在才插入 | 难以猜测 | 越满冲突越多;需要 `UNIQUE` 约束 |
| Snowflake 式 ID | 时间戳 + 机器 + 序列号 | 分布式,无需协调 | 转成 Base62 后超过 7 个字符 |

实际的选择:**分块计数器 + Base62**,并且可以在转成 Base62 之前先做**混淆**(位置换/轻量加密),让短码难以猜测。用户自定义的别名同样依赖 `UNIQUE` 约束。

```python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def to_base62(n: int) -> str:
    if n == 0:
        return ALPHABET[0]
    out = []
    while n:
        n, r = divmod(n, 62)
        out.append(ALPHABET[r])
    return "".join(reversed(out))
```

### 5. 存储

数据很简单,按键访问:`short_code → long_url, created_at, expires_at, owner`。一张 key-value 表,或者以 `short_code` 为主键的关系表,都可以。3 TB 的数据量,需要时**按 `short_code` 分片**(哈希);每个分片都有从库(第 5 篇)。“某用户的所有链接”这类查询需要单独的二级索引。

### 6. 整体架构

![URL shortener 架构](/img/diagrams/url-shortener.svg)

*本图为本项目原创绘制;思路参考自 [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0),Pastebin/Bit.ly 示例部分。*

读取流程(热路径):

1. 客户端访问 `notenest.link/aZ3x9Qk` ⇒ DNS(第 2 篇)⇒ CDN,如果使用 `301`/短期缓存,CDN 可以直接返回。
2. L7 负载均衡(第 3 篇)选择一台**无状态**的应用服务器。
3. 应用先查**缓存**(第 4 篇);命中就直接返回。未命中则读取**数据库从库**(第 5 篇),再带 TTL 写回缓存。
4. 返回 `302`,同时**把点击事件放入队列**(第 6 篇);worker 负责汇总并写入统计,不拖慢跳转。

写入流程:应用从已分配的号段里取一个 ID,转成 Base62,写入主库,(可选)同时放入缓存。

### 7. 深入难点

- **局部热点(hot key)**:名人的链接被点击上百万次。用缓存 + CDN 处理;用锁/TTL 抖动(jitter)避免缓存击穿。
- **过期**:读取时检查 `expires_at`,并用定时任务在后台清理。
- **可用性**:多台应用服务器、多个从库、缓存多副本;如果缓存宕机,数据库必须能扛住读取压力(或者做限流)。
- **滥用**:按 IP/API key 限流,用恶意名单检查目标 URL,阻止循环跳转。
- **安全**:只允许 `http(s)` 协议;如果不想被扫描遍历,短码就不要连续递增。
- **数据分析**:点击是*事后发生*的事件,用异步方式处理,可以接受几秒到几分钟的延迟。

## 取舍

| 决策 | 选择 | 原因 | 代价 |
|---|---|---|---|
| URL 编码 | 分块计数器 + Base62 | 无冲突,速度快 | 需要号段分配服务;需做混淆以防被猜到 |
| 跳转 | `302` | 能统计点击,能更改目标 | 每次访问都要经过服务器 |
| 统计 | 队列 + worker | 不拖慢热路径 | 数据有延迟,可能有小幅偏差 |
| 存储 | KV/关系型,按短码分片 | 按键访问简单 | 按用户查询需要二级索引 |
| 缓存 | Cache-aside,TTL | 99% 的读取不碰 DB | 被删除的链接在 TTL 到期前仍然可以访问 |

## 常见错误

- 没问清需求、没做估算,就一头扎进画架构图。
- 用哈希截断却忘了处理冲突。
- 把自增计数器放在唯一的一个数据库里,既是瓶颈又是单点故障。
- 用了 `301`,才发现统计不了点击。
- 短码按顺序递增、容易猜,外人可以扫出所有“私密”链接。
- 在跳转路径里同步写统计数据。
- 不限制创建链接的频率,被垃圾信息塞满存储。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="url-shortener" />

## 延伸阅读

- [donnemartin/system-design-primer: Design Pastebin.com (or Bit.ly)](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md) (CC BY 4.0)
- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [RFC 9110,第 15.4 节:Redirection 3xx](https://www.rfc-editor.org/rfc/rfc9110#name-redirection-3xx)
- [Wikipedia 上的 Base62 / Base encoding](https://en.wikipedia.org/wiki/Base62)

**第一阶段完结。**你刚刚把 NoteNest 从一台笔记本电脑,搭成了一个多层架构的系统。回到[路线图](/roadmap)查看整段旅程,或浏览更多[资源](/resources)。
