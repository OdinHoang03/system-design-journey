---
id: indexing-storage-engines
title: "索引与存储引擎"
sidebar_position: 13
slug: /indexing-storage-engines
description: "索引如何工作、B 树与 LSM 树、联合索引、写放大:为什么有的数据库读得快,有的写得快。"
---

> 索引用写入成本换读取速度;存储引擎决定这笔交易怎么做。

## 故事

NoteNest 按标题搜索笔记,在 1 万条笔记时很流畅。到了 2 亿条,每次搜索要 8 秒。小明打开 `EXPLAIN`,看到了那行可怕的 `Seq Scan`,也就是数据库在读表里的 *每一行*。他加了一个索引,查询降到 3 毫秒。可一周后,每秒几万次写入的“最近动态”流又把数据库压垮了,原因是……索引太多。这一篇就讲这枚硬币的两面。

## 核心概念

### 索引是什么

没有索引,找一个值只能 **全表扫描**(O(n))。**索引** 是一个辅助结构,按顺序保存某列的值以及指向真实行的指针,就像书末的索引页。查找花 O(log n),但每次写入都要同时更新表 *和* 它的所有索引。

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);

EXPLAIN SELECT * FROM notes
WHERE user_id = 7 ORDER BY created_at DESC LIMIT 20;
-- Index Scan using idx_notes_user_created
```

### 用好索引

- **联合索引** `(user_id, created_at)` 能服务按 `user_id`、或按 `user_id` + `created_at` 的查询,但 *不能* 服务只按 `created_at` 的查询(**最左前缀** 规则:列的顺序很重要)。
- **覆盖索引**:索引包含查询所需的全部列,无需回表。
- **选择性(selectivity)**:在只有几个取值的列(如 `is_deleted`)上建索引几乎没用;在 `email` 上建则非常好。
- 对 `WHERE LOWER(title) = 'x'` 或 `LIKE '%abc'`(匹配字符串中间或末尾),除非专门为该表达式建索引,否则索引帮不上忙。
- 每个索引都占 **空间** 并让 **写入变慢**。用 `EXPLAIN` 测量,删掉没用的索引。

### 两大类存储引擎

![B 树与 LSM 树](/img/diagrams/btree-vs-lsm.svg)

*本项目自绘的图;思路参考 [Designing Data-Intensive Applications](https://dataintensive.net/)(M. Kleppmann)的 Storage and Retrieval 一章。*

**B 树**(PostgreSQL、MySQL/InnoDB 以及多数关系型数据库):数据被切成固定大小的 **页**(通常 4–16 KB),组织成又矮又宽的树。写入是 **原地修改页**;为了崩溃后不丢,先追加写入 **WAL**(预写日志)。读取稳定、可预期:跳几次页就到了。

**LSM 树**(Cassandra、RocksDB、LevelDB、HBase):写入先进内存里的 **memtable**(同时写 WAL 防丢),写满后 **flush** 到磁盘,成为不可变的有序文件,叫 **SSTable**。后台的 **compaction** 负责合并文件、丢弃旧版本。每次写入都是 *顺序写*,非常快。读取要先查 memtable 再查多个文件;**布隆过滤器**(一种概率结构,回答“肯定没有”或“可能有”)让大部分文件可以直接跳过。

**写放大(write amplification)**:一次逻辑写入会引起多次物理写入(B 树里是页 + WAL;LSM 树里是反复的 compaction)。它消耗磁盘带宽和 SSD 寿命,选引擎时值得测量。

### 让引擎匹配负载

经验法则:B 树适合 *读多、范围查询、延迟稳定* 的负载;LSM 适合 *写极多、按时间排序、追加式* 的数据。两者其实都能做所有事,只是付出的代价不同。另外值得了解:**哈希索引**(只能精确匹配)、**倒排索引**(第 15 篇)和 **列存储**(按列存放,为分析优化)。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 加索引 | 读取和查找大幅变快 | 写入变慢、占用空间、优化器可能误判 |
| 联合索引 | 一个索引服务多种查询 | 依赖列顺序;体积更大 |
| B 树 | 读取快而稳,范围查询好 | 随机的原地写入,页碎片 |
| LSM 树 | 顺序写入极快,压缩好 | 读取可能触及多个文件;compaction 造成 I/O 尖峰和尾延迟 |
| 哈希索引 | 精确匹配极快 | 不支持范围查询,无序 |

## 常见错误

- 凭猜测而不测量:没跑 `EXPLAIN` / `EXPLAIN ANALYZE` 就加索引。
- 为了“保险”给每一列都建索引,结果写入越来越慢。
- 联合索引的列顺序错了,真正的查询用不上。
- 给列套上函数(`WHERE DATE(created_at) = ...`),让索引失效。
- 把海量写入压给 B 树存储然后被 I/O 吓一跳;或者用 LSM 存储做大量范围读取却不调 compaction。
- 在线上大表建索引时没用不加锁模式(如 PostgreSQL 的 `CREATE INDEX CONCURRENTLY`),把整张表的写入都堵住。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="indexing-storage-engines" />

## 延伸阅读

- [Designing Data-Intensive Applications](https://dataintensive.net/),第 3 章(Storage and Retrieval)
- [Use The Index, Luke](https://use-the-index-luke.com/):免费的 SQL 索引指南
- [PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [RocksDB Wiki: Overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0):Database 部分

**下一篇:**数据分布在多台机器上之后,“读到什么”就成了难题。第 14 篇:[一致性与 CAP](./14-consistency-cap.md)。
