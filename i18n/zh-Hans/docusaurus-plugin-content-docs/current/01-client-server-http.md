---
id: client-server-http
title: "客户端–服务器与 HTTP"
sidebar_position: 1
slug: /client-server-http
description: "客户端–服务器模型与 HTTP 协议:请求、响应、方法、状态码、无状态。"
---

> 第一天:应用只跑在一台机器上,只有一个用户。

## 故事

小明刚写完 **NoteNest**,一款可以分享的笔记应用。在笔记本上一切顺利:浏览器打开 `localhost:3000`,点“保存”,笔记就出现了。小明把链接发给好友小兰,小兰点开……打不开。因为小兰的 `localhost` 指的是小兰自己的电脑,而不是小明的。

每个系统都会遇到的第一个问题就此出现:**谁在和谁通信,用什么语言通信?**

## 核心概念

### 客户端和服务器是角色,不是机器类型

- **客户端(Client)**:主动发起请求的一方(浏览器、手机 App、另一台服务器)。
- **服务器(Server)**:在某个地址 + 端口上监听,接收请求并作出响应的一方。

同一台机器可以对某个服务是客户端,对另一个服务又是服务器。例如:NoteNest 的 API 对手机 App 来说是服务器,但在调用邮件发送服务时,它就是客户端。

![Client – Server](/img/diagrams/client-server.svg)

*本图为本项目原创绘制;思路参考自 [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0).*

### 一个请求会经过哪些环节

小兰输入 NoteNest 的网址后,大致按顺序发生 4 件事:

1. **查询域名对应的 IP 地址**(DNS,后面的文章会详细讲)。
2. **与该 IP 建立 TCP 连接**(三次握手)。如果是 HTTPS,还要再加一次用于加密的 **TLS 握手**。
3. **发送 HTTP 请求**。
4. **接收 HTTP 响应**并渲染页面。

每一步都要消耗网络时间(往返一次,即 round trip)。这就是“把服务器放在离用户近的地方”和“复用连接”如此重要的原因。

### HTTP 的结构

```http
GET /notes/42 HTTP/1.1
Host: notenest.example
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

{"id": 42, "title": "买牛奶"}
```

- **方法(Method)**:`GET`(读取)、`POST`(创建)、`PUT`/`PATCH`(修改)、`DELETE`(删除)。
  `GET` 必须是*安全*的(不改变数据);`GET`、`PUT`、`DELETE` 必须是*幂等*的(调用多次的结果与调用一次相同)。
- **状态码(Status code)**:`2xx` 成功,`3xx` 重定向,`4xx` 客户端错误(`404`、`401`、`429`),`5xx` 服务器错误(`500`、`503`)。
- **请求头(Header)**:元数据,如 `Content-Type`、`Authorization`、`Cache-Control`。

### 无状态:服务器不记得你

HTTP 在两次请求之间**不保存状态**。想让服务器“记住”用户已登录,客户端需要在每次请求中附带一个 **token**(会话 Cookie 或 JWT)。这个特性听起来不方便,实际上好处极大:任何一台服务器都能处理任何一个请求,所以之后增加服务器会很容易(第 3 篇)。

### HTTP 的各个版本

| 版本 | 要点 |
|---|---|
| HTTP/1.1 | 文本协议,支持长连接(keep-alive),但容易出现队头阻塞(head-of-line blocking) |
| HTTP/2 | 二进制协议,在一个连接上多路复用多个请求 |
| HTTP/3 | 基于 QUIC(UDP),降低握手开销,并减轻丢包时的队头阻塞 |

## 取舍

| 选择 | 收益 | 代价 |
|---|---|---|
| 无状态(每个请求都带 token) | 任何服务器都能处理,易于扩展 | 每个请求要多带 token,且需要重新校验 |
| 有状态(会话存放在服务器上) | 请求精简,撤销会话容易 | 用户被绑定在某台服务器上,扩展更困难 |
| 轮询(Polling) | 简单 | 浪费空请求,有延迟 |
| WebSocket / SSE | 数据即时推送 | 需要长期保持连接,基础设施更复杂 |
| REST(JSON) | 易于调试,人人都懂 | 容易多取或少取数据(over/under-fetching) |

## 常见错误

- 用 `GET` 来修改数据(浏览器或爬虫重复访问一次,数据就丢了)。
- 返回 `200 OK` 却在内容里写错误信息,客户端和监控都分不清成功还是失败。
- 把会话状态存在某一台服务器的内存里,等有了两台服务器,又纳闷为什么登录会“掉”。
- 不给对外请求设置超时;一个慢服务就能拖垮整个系统。
- 混淆 `401`(未认证)和 `403`(已认证但无权限)。

## 练习与面试题

每题选一个答案,正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="client-server-http" />

## 延伸阅读

- [MDN:HTTP 概述](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0),分布式系统入门部分

**下一篇:**小兰已经能打开了,但小兰在柏林的朋友觉得页面很慢。进入第 2 篇:[DNS 与 CDN](./02-dns-cdn.md)。
