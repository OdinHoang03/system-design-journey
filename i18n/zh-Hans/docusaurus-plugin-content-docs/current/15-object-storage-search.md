---
id: object-storage-search
title: "对象存储与搜索"
sidebar_position: 15
slug: /object-storage-search
description: "用对象存储(S3 风格)保存大文件、预签名 URL、倒排索引与全文搜索:什么时候普通数据库不再是合适的地方。"
---

> 大文件属于对象存储;文本搜索属于倒排索引。

## 故事

NoteNest 的用户开始在笔记里附上照片、PDF 和录音。起初小明把文件直接存进数据库的 `BLOB` 列;没几周数据库就膨胀到几个 TB,备份要花一整天,副本也总是落后,因为得复制那些巨大的文件。与此同时,笔记内容的搜索框用的是 `LIKE '%关键词%'`,一次查询要十几秒,还不知道“跑步”和“跑”算同一个词。两个不同的问题,同一个原因:关系型数据库并不是为这两件事而生的。

## 核心概念

### 对象存储

**对象存储**(Amazon S3、Google Cloud Storage、Azure Blob、MinIO)把数据作为 **对象** 放在 **桶(bucket)** 里:每个对象有一个 **key**(像路径 `users/7/photo.jpg`)、内容(字节)和一些 **元数据**。没有真正的文件夹,也不能局部修改;要改就得整个对象重写。作为交换:

- **便宜且几乎无限**:数据被切分并分散在许多机器上。
- **极高的持久性**(S3 标称 99.999999999%,“11 个 9”),靠多份 **副本** 或 **纠删码**(切成数据块 + 校验块,丢几块仍能恢复,开销比完整复制小)。
- **基于 HTTP 的简单 API**:`PUT`、`GET`、`DELETE`,按前缀列举。

正确的模式是:**文件放对象存储,数据库只保存元数据**(名称、大小、所有者、对象 key)。

![对象存储与倒排索引](/img/diagrams/object-storage-search.svg)

*本项目自绘的图;思路参考 [Amazon S3 文档](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) 与 [Elasticsearch: Inverted index](https://www.elastic.co/docs/manage-data/data-store/index-basics)。*

### 正确上传大文件

不要让文件经过应用服务器。服务器签发一个 **预签名 URL(presigned URL)**(带签名、几分钟后过期、只允许对某个 key 做一种操作),客户端直接 `PUT` 到对象存储。应用服务器只处理小请求。大文件用 **分片上传(multipart upload)**:切成几十 MB 一片,并行上传,单片可重试,最后合并。要加速下载,在桶前面加 **CDN**(第 2 篇)。

几点要记住:如果服务商有要求,key 前缀要分布均匀;开启 **版本控制** 防误删;用 **生命周期规则** 把冷数据转到更便宜的存储层级;桶默认保持 **私有**。

### 为什么 `LIKE` 不足以做搜索

`LIKE '%abc%'` 用不上普通索引,只能扫全表。它也不懂语言:没有词干、没有相关性排序、不容错别字。

### 倒排索引

**倒排索引(inverted index)** 把“文档 → 词”翻转成“词 → 包含它的文档列表”(**倒排表 / postings list**),就像书末的检索索引。

1. **分析(analyze)**:把文本切成 **token**,转小写,去掉停用词,还原成词根(**词干提取**),让“running”和“run”能匹配。中文则需要先 **分词**。
2. **建立索引**:对每个 token,保存文档 ID 列表(以及位置和频率)。
3. **查询**:查每个 token,然后对列表取 **交集**(AND)或 **并集**(OR)。“cache AND queue”就是两个列表的交集。
4. **排序**:计算相关性得分,经典做法是 **TF-IDF** / **BM25**(在本文档里频繁出现、但在整个语料里稀少的词得分高)。

Elasticsearch/OpenSearch、Apache Solr、Meilisearch 以及 PostgreSQL 的全文搜索(`tsvector` + GIN 索引)都建立在这个思路上。规模大了以后,索引会 **分片**(每个分片保存部分文档,查询发给所有分片再合并结果)并 **复制**(容错、提升读取能力),和第 5 篇一样。

### 让索引与数据库保持同步

搜索存储是 **派生出来的副本**,不是事实来源。常见做法:先写主数据库,再通过 **消息队列**(第 6 篇)或 **变更数据捕获(CDC)** 推送事件,由消费者更新索引。结果是:搜索是最终一致的(第 14 篇),而且索引总能从数据库重建。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 文件放对象存储 | 便宜、持久、近乎无限扩展、数据库保持小巧 | 延迟高于本地存储;不能局部修改;不能查询内容 |
| 文件放 BLOB 列 | 一处搞定,和元数据同一事务 | 数据库膨胀,备份与副本沉重,存储昂贵 |
| 预签名 URL | 服务器不用中转字节 | 要管理过期时间,签发 URL 时必须校验权限 |
| 倒排索引 / 搜索引擎 | 搜索快、可排序、懂语言 | 多一个要运维的系统;数据比数据库滞后 |
| 数据库自带全文搜索 | 组件少、更一致 | 功能和扩展性不如专用搜索引擎 |

## 常见错误

- 把文件塞进数据库,或让文件绕经应用服务器。
- 不小心把桶设成公开,私人照片暴露在互联网上。
- 预签名 URL 有效期过长,或没有限制文件类型与大小。
- 把搜索引擎当作主要的事实来源,索引一坏就丢数据。
- 忘了对象存储的一致性取决于服务商和时间点;要读它的一致性模型,而不是想当然。
- 在百万行的表上用 `LIKE '%x%'` 做文本搜索。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="object-storage-search" />

## 延伸阅读

- [Amazon S3 文档](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html),其中的预签名 URL 与分片上传部分
- [Elasticsearch Guide](https://www.elastic.co/guide/index.html),关于 mapping、analyzer 和相关性的部分
- [PostgreSQL: Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Wikipedia: Inverted index](https://en.wikipedia.org/wiki/Inverted_index) 与 [Okapi BM25](https://en.wikipedia.org/wiki/Okapi_BM25)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**数据批次到此结束。**接下来是异步与可靠性;完整计划见 [大纲](/outline),或回到 [路线图](/roadmap)。
