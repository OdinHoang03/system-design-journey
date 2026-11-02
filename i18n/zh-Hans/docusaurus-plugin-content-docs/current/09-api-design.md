---
id: api-design
title: "API 设计"
sidebar_position: 9
slug: /api-design
description: "REST、gRPC、GraphQL;分页、版本、错误码和幂等键,让 API 既好用又能安全重试。"
---

> API 是一份合同:写错了,所有客户端都要为此付出多年代价。

## 故事

NoteNest 上线了手机 App。“保存”按钮调用 `POST /notes`。在信号差的地方,App 等得太久自动重发,用户看到同一条笔记出现了两次。还没完:笔记列表一次响应返回全部 40,000 条;小明把字段 `title` 改名为 `name` 后,旧版 App 直接白屏。这三个 bug 都是 API 设计问题,不是代码问题。

## 核心概念

### 选择 API 风格

| 风格 | 思路 | 适合 | 注意 |
|---|---|---|---|
| **REST** | 资源 + HTTP 动词(`GET /notes/42`) | 公开 API、CRUD、易缓存 | 拼装数据可能要调用多次 |
| **gRPC** | `.proto` 契约、二进制、HTTP/2 | 内部服务间调用、追求速度、需要流式 | 浏览器难以直接调用;肉眼难读 |
| **GraphQL** | 客户端通过一个端点自选字段 | 多个页面需要不同数据的 App | 缓存更难;需限制查询深度/复杂度 |

没有“最好”的风格:边缘用 REST、内部用 gRPC 是很常见的组合。

### 设计好 REST

- **用名词,不用动词**:`POST /notes`、`GET /notes/42`、`DELETE /notes/42`。
- 动词各司其职:`GET` 安全且可重复;`PUT` 和 `DELETE` 是**幂等**的(调用多次与调用一次效果相同);`POST` 不是。
- **有意义的状态码**:`201` 已创建,`400` 请求有误,`401` 未认证,`403` 无权限,`404` 不存在,`409` 冲突,`429` 被限流(第 11 课),`5xx` 服务端错误。
- **结构化错误**:机器可读的错误码、给人看的信息、哪个字段有问题。

### 分页

永远不要返回整个列表。

| 方式 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| **Offset/limit** | `?offset=100&limit=20` | 简单,可跳到任意页 | offset 大时变慢;调用之间数据变化会导致重复/遗漏 |
| **游标(keyset)** | `?after=<游标>&limit=20` | 快,新数据到来时稳定 | 不能跳到任意页 |

对于很长且不断变化的列表(信息流、笔记),优先用游标。

### 版本与向后兼容

- 给响应**新增**字段是*兼容*的;改名、删字段、改类型是*破坏性*的。
- 版本的做法:放在路径里(`/v1/notes`)、放在请求头里,或者不设版本、只增不改(additive-only),并逐步弃用旧字段。
- 客户端应**忽略未知字段**;服务端应**保留旧字段**,直到监控显示已无人使用。

### 幂等键

![幂等键](/img/diagrams/api-design.svg)

*本项目自绘示意图。*

`POST` 的问题:超时时客户端不知道请求有没有成功,重发有风险(创建两次、扣款两次)。解决办法:客户端为每个*意图*生成一个**唯一键**并随请求发送(请求头 `Idempotency-Key`)。服务端把键和结果存起来;再次看到同一个键时,直接返回已保存的结果,而不是重做一遍。

```python
def create_note(req):
    key = req.headers["Idempotency-Key"]
    saved = key_store.get(key)
    if saved:
        return saved                       # 重试:返回之前的结果
    note = db.insert_note(req.json)        # 每个 key 只执行一次
    resp = {"status": 201, "id": note.id}
    key_store.set(key, resp, ttl=24 * 3600)
    return resp
```

一个关键细节:写入笔记和记录键必须是原子的(同一事务,或给键加 `UNIQUE` 约束),否则两个并发请求仍会同时通过。

### 其他细节

- 用令牌**认证**,绝不把机密放进 URL。
- **限制**请求体大小和每页条数。
- 客户端**超时与重试**要带退避(第 17 课)。
- 用 OpenAPI 或 `.proto` **写成文档**;契约是生成客户端代码的事实来源。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| REST | 简单、可缓存、工具多 | 取多取少、往返次数多 |
| gRPC | 快、契约严格、支持流式 | 浏览器不好用、肉眼难调试 |
| GraphQL | 客户端灵活、往返少 | 缓存和负载控制更难 |
| Offset | 易实现 | 数据量大或变化时慢且错位 |
| 游标 | 快、稳定 | 不能跳页,令牌不透明 |
| 路径中带版本 | 明确、易路由 | 要并行维护多个版本 |
| 只增不破坏 | 不需要版本 | 长期背着旧字段 |

## 常见错误

- 不分页地返回全部数据,还“让客户端自己处理”。
- 不通知、不留过渡期就改名/删除字段。
- 所有错误都返回 `200` 加 `{"error": ...}`,或者所有错误都是 `500`。
- 创建资源的 `POST` 没有防重复发送的手段。
- 在公开 API 中暴露内部细节(表名、可猜测的自增 id)。
- 什么都用 GraphQL,却不限制查询深度。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在当前浏览器中。

<Quiz lessonId="api-design" />

## 延伸阅读

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)(方法、状态码、幂等)
- [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [gRPC: Introduction](https://grpc.io/docs/what-is-grpc/introduction/)
- [GraphQL: Learn](https://graphql.org/learn/)

**下一课:** API 已经清晰,现在在各服务前面放一个共用的“入口”。第 10 课:[反向代理与 API 网关](./10-proxy-api-gateway.md)。
