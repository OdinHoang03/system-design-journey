---
id: cache
title: "缓存"
sidebar_position: 4
slug: /cache
description: "缓存让响应更快、负载更低:cache-aside、write-through、TTL、淘汰、失效、缓存击穿。"
---

> 同一个问题被问了上百万次,别再每次从头回答。

## 故事

NoteNest 的首页展示“今日精选的 10 条笔记”。每次访问都会在数据库上执行一条很重的聚合查询,耗时 200 ms。每秒 5,000 次访问时,数据库不堪重负,可这条查询的结果在整整一个小时里几乎*完全一样*。小明意识到:大部分工作都在白白重复。

## 核心概念

### 什么是缓存,为什么有效

**缓存(Cache)**把一项昂贵工作的结果存放在访问更快的地方。它之所以有效,靠的是:

- **局部性(Locality)**:一小部分数据承担了大部分访问(二八定律)。
- **速度差距**:读内存约为百纳秒级,通过网络读缓存不到 1 ms,而一条重的数据库查询可能要几十到几百 ms。

核心指标是**命中率(hit ratio)** = 命中 / (命中 + 未命中)。命中率 95% 意味着只有 5% 的请求会打到数据库,负载大约降低 20 倍。

### 缓存放在哪里

从离用户最近到离数据最近:

1. **浏览器**(`Cache-Control`)。
2. **CDN**(第 2 篇)。
3. **进程内缓存**(应用内存里的 map):最快,但每台服务器各存一份。
4. **分布式缓存**(Redis、Memcached):所有服务器共用。
5. **数据库自带的缓存**(buffer pool、查询结果缓存)。

### 读写模式

![Cache-aside](/img/diagrams/cache-aside.svg)

*本图为本项目原创绘制;思路参考自 [Microsoft Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).*

| 模式 | 工作方式 | 适用场景 |
|---|---|---|
| **Cache-aside** | 应用先查缓存;未命中则读 DB,再自己写入缓存 | 最常用的默认选择,读多的场景 |
| **Read-through** | 未命中时由缓存自己去读 DB | 想让应用代码更简洁 |
| **Write-through** | 同时写入缓存和 DB | 需要缓存始终是最新的;写入较慢 |
| **Write-back** | 先写入缓存,稍后再刷到 DB | 写入量极大;能接受数据丢失的风险 |

一个最简的 cache-aside 示例:

```python
def get_featured_notes():
    key = "featured:v1"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)          # hit
    notes = db.query_featured()            # miss: 代价高昂的操作
    redis.set(key, json.dumps(notes), ex=300)  # TTL 5 分钟
    return notes
```

### 过期与淘汰

- **TTL**:每个条目在 N 秒后自动过期;最简单,也最安全。
- **淘汰(Eviction)**:缓存满了怎么办:**LRU**(淘汰最久未使用的)、**LFU**(淘汰使用最少的)、FIFO。

### 使缓存失效(invalidation)

> 计算机科学里只有两件难事:缓存失效和命名。(这是一句耳熟能详的玩笑话,通常认为出自 Phil Karlton。)

笔记刚被修改,缓存里还是旧版本。处理办法有:等 TTL 自然过期;**写入时删除 key**(更新 DB 后执行 `DEL`);**把版本号放进 key**(`featured:v2`);或者发布变更事件,让各个缓存自行删除。

### 三种经典“毛病”

- **缓存击穿(cache stampede / thundering herd)**:一个热点 key 过期,成千上万个请求同时未命中,一起涌向数据库。对策:防重复的互斥锁(只让一个请求重新计算)、随机 TTL(jitter)、提前刷新、`stale-while-revalidate`。
- **缓存穿透(cache penetration)**:查询*根本不存在*的 key,所以永远未命中。对策:把空结果也缓存起来并设置较短的 TTL,或使用布隆过滤器(Bloom filter)。
- **缓存雪崩(cache avalanche)**:大量 key 在同一时刻过期,或缓存整体宕机。对策:TTL 加 jitter、缓存多副本、对数据库入口做限流。

## 取舍

| 选择 | 收益 | 代价 |
|---|---|---|
| 使用缓存 | 速度快,降低 DB 负载 | 数据可能过期;多一个需要运维的组件 |
| TTL 较长 | 命中率高 | 数据长时间陈旧 |
| TTL 较短 | 数据更新鲜 | 命中率低,DB 负载高 |
| Write-through | 缓存与 DB 保持一致 | 写入更慢,还会写入无人读取的数据 |
| Write-back | 写入极快 | 缓存若在刷入 DB 之前宕机,可能丢数据 |
| 进程内缓存 | 最快 | 每台服务器一份;各服务器之间数据不同步 |
| 共用的 Redis | 所有服务器看到相同的数据 | 多一次网络调用;缓存成为关键组件 |

## 常见错误

- 没有先度量就上缓存:不知道哪条查询慢,缓存加错了地方。
- 不设置 TTL;陈旧数据永远存活,内存也被占满。
- 把缓存当作唯一的数据存储。缓存随时可能丢失;DB 才是数据的唯一可信来源(source of truth)。
- 把按用户区分的数据缓存到公共 key 下(key 里缺少 `user_id`),导致用户看到别人的数据。
- 不监控命中率和延迟;不知道缓存到底是在帮忙,还是只是让系统更复杂。
- 在高峰期重启缓存,让缓存变空,一大批请求涌向数据库(“冷缓存”)。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="cache" />

## 延伸阅读

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)
- [Redis:文档](https://redis.io/docs/latest/)
- [Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0):Cache 部分

**下一篇:**缓存只能帮上读的忙,可数据越来越多,写入也越来越频繁。第 5 篇:[数据库:复制与分片](./05-database-replication-sharding.md)。
