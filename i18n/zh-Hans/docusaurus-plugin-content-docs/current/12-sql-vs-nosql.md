---
id: sql-vs-nosql
title: "SQL 与 NoSQL"
sidebar_position: 12
slug: /sql-vs-nosql
description: "关系型、文档、键值、宽列四种数据模型;ACID 与 BASE;按访问模式而不是按潮流来选择数据库。"
---

> 按你读写数据的方式选数据库,而不是按它的名头。

## 故事

NoteNest 已经有了副本和分片。这时产品团队一口气提了三个需求:给笔记打标签、保存编辑历史,还有一个每秒要接收几万条事件的“最近动态”。一位同事对小明说:“全换成 MongoDB 吧,NoSQL 扩展性更好。”另一位说得正相反:“Postgres 什么都能做。”小明停下来,问了一个比这两种意见都更有价值的问题:*这些数据会被怎样访问?*这一篇就帮你回答这个问题。

## 核心概念

### 四种数据模型

![四种数据模型](/img/diagrams/sql-vs-nosql.svg)

*本项目自绘的图;分类方式参考 [Designing Data-Intensive Applications](https://dataintensive.net/)(M. Kleppmann)的 Data Models 一章。*

- **关系型(relational)**:数据放在表里,用外键关联,用 SQL 查询。擅长灵活查询、`JOIN`、完整性约束和事务。
- **文档型(document)**:每条记录是一个嵌套的 JSON 文档。一次读取就能拿到带标签和评论的笔记;适合每条记录结构不一的数据。
- **键值型(key-value)**:只有按键的 `get/put/delete`。极快、易分片,但不能按值查找。
- **宽列型(wide-column)**:行由键标识,列按顺序(通常按时间)排列。为海量写入和按键查询而生。

此外还有 **图数据库**(社交网络这类多层关系)和 **时序数据库**(随时间变化的度量值)。每一种都针对一种访问模式优化,没有哪一种在所有场景都最好。

### ACID 与 BASE

**ACID** 是关系型事务的四项保证:

- **原子性(Atomicity)**:事务要么完整发生,要么完全不发生。
- **一致性(Consistency)**:事务把数据从一个合法状态带到另一个合法状态(约束始终成立)。
- **隔离性(Isolation)**:并发的事务看不到彼此做到一半的状态(隔离级别越高越安全,也越慢)。
- **持久性(Durability)**:一旦提交就不会丢,即使机器宕机。

**BASE**(*Basically Available、Soft state、Eventually consistent*)是许多 NoSQL 系统做出的相反选择的简称:优先保证可用性和扩展性,容忍副本之间暂时不一致。这是一条光谱的两端,而不是两个阵营:不少现代 NoSQL 也提供事务(文档事务、轻量级事务),也有不少 SQL 系统能水平扩展(Citus、Vitess、CockroachDB、Spanner)。

### 范式化还是反范式化

在关系模型里我们做 **范式化**:每个事实只存一处,读取时用 `JOIN` 拼起来。在文档和宽列存储里,常做 **反范式化**:把需要一起读的数据放进同一条记录,一次读取就够,代价是更新时要改好几个地方。以笔记为例:

```sql
-- 关系型:3 张表,读取时拼接
SELECT n.title, t.tag
FROM notes n JOIN note_tags t ON t.note_id = n.id
WHERE n.id = 42;
```

```json
// 文档型:一次读取
{"_id": 42, "title": "周一例会", "tags": ["work", "weekly"]}
```

### 选型流程

1. 列出主要的 **查询**(按键?按范围?搜索?聚合?要不要 `JOIN`?)。
2. 估算 **负载**:每秒读/写次数、数据量、读写比(“规模估算”一课会详细讲)。
3. 明确所需的 **保证**:钱、库存、订座需要严格事务;浏览量、“已读”可以容忍延迟。
4. 核心数据默认用 **一个关系型数据库**。只有出现可度量的理由时,才增加别的存储。

对 NoteNest,小明把用户、笔记、标签(需要约束和 `JOIN`)留在 Postgres;“最近动态”流(写多,按 `user_id` 和时间读)放进宽列存储;登录会话放 Redis。这叫 **多模型持久化(polyglot persistence)**:每类数据放进适合它的存储。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 关系型 + SQL | 灵活查询、`JOIN`、ACID 事务、成熟生态 | 水平扩展写入更复杂;改表结构要做迁移 |
| 文档型 | 灵活的结构,一次读取拿到整簇数据 | `JOIN` 与跨文档一致性较弱;数据重复 |
| 键值型 | 非常快,非常易分片 | 只能按键访问 |
| 宽列型 | 海量写入,易分片 | 表要按查询来设计;没有 `JOIN`,临时查询很少 |
| 多种数据库 | 每类数据用对的工具 | 要运维更多东西,存储之间的数据要保持同步 |

## 常见错误

- 一个索引良好的 Postgres 完全够用,却“为了扩展性”选 NoSQL。
- 选了 NoSQL,才发现需要 `JOIN` 和事务,只好在应用代码里重写一遍。
- 把“schemaless”当成“没有 schema”。schema 依然存在,只是藏在你的代码里,而且很容易漂移。
- 把宽列表当关系表来设计,然后不带主键去查询。
- 加了第三、第四个数据存储,却没人负责同步和备份。
- 看大公司用什么就选什么,而不是看自己的查询需要什么。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="sql-vs-nosql" />

## 延伸阅读

- [Designing Data-Intensive Applications](https://dataintensive.net/),第 2 章(Data Models)和第 7 章(Transactions)
- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [MongoDB: Data Modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [Apache Cassandra: Data Modeling](https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/intro.html)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0):SQL vs NoSQL 部分

**下一篇:**即使选对了存储,数据布局不好,查询照样慢。第 13 篇:[索引与存储引擎](./13-indexing-storage-engines.md)。
