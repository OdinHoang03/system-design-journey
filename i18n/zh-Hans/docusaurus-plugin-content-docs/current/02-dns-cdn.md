---
id: dns-cdn
title: "DNS 与 CDN"
sidebar_position: 2
slug: /dns-cdn
description: "DNS 将域名解析为 IP,CDN 将内容送到用户身边:TTL、缓存、边缘节点、缓存失效。"
---

> 有了域名,远方的用户开始觉得慢。

## 故事

小明买下域名 `notenest.example`,并把它指向部署在新加坡的服务器。越南的用户觉得很快。可柏林的汉娜抱怨说:每次打开页面都要两秒多,而服务器其实几乎是空闲的。光在光纤里传播也需要时间:柏林 ↔ 新加坡一个来回就要约 150–200 ms,而加载一个页面需要*很多*个这样的来回。

两个问题,两件工具:**DNS** 帮用户找到正确的地址;**CDN** 把内容副本送到离用户更近的地方。

## 核心概念

### DNS:互联网的电话簿

DNS 把 `notenest.example` 转换成 IP 地址。解析过程是递归的:

![DNS 解析](/img/diagrams/dns-resolution.svg)

*本图为本项目原创绘制;思路参考自 [Cloudflare Learning: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/).*

1. 浏览器向**递归解析器(recursive resolver)**发起查询(通常是运营商的,或 `8.8.8.8`、`1.1.1.1`)。
2. 如果缓存中没有,解析器就问**根服务器**:“谁负责管理 `.example`?”
3. 再问 **TLD 服务器**:“谁负责管理 `notenest.example`?”
4. 接着问**权威服务器(authoritative server)**(也就是小明配置记录的地方),拿到 IP。
5. 解析器把 IP 返回给浏览器,并按 **TTL** 进行**缓存**。

常见的记录类型:

| 记录 | 含义 |
|---|---|
| `A` / `AAAA` | 域名 → IPv4 / IPv6 |
| `CNAME` | 域名 → 另一个域名(别名) |
| `MX` | 接收邮件的服务器 |
| `TXT` | 任意文本(域名验证、SPF) |
| `NS` | 管理该 zone 的域名服务器 |

**TTL**(time to live)决定缓存能保留多久。TTL 长:查询少,但更换 IP 时生效慢。TTL 短:变更生效快,但查询量更大。

DNS 也是一种粗粒度的流量分配手段:可以返回多个 IP,或者按位置返回不同的 IP(GeoDNS)。

### CDN:离用户更近的副本

**CDN**(Content Delivery Network,内容分发网络)是遍布全球的**边缘(edge)**服务器网络。用户会被引导到最近的边缘节点,边缘节点保存内容的副本。

![CDN 边缘节点](/img/diagrams/cdn-edge.svg)

*本图为本项目原创绘制;思路参考自 [Cloudflare Learning: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/).*

- **缓存命中(cache hit)**:边缘节点有副本,直接返回,源站(origin)完全不受影响。
- **缓存未命中(cache miss)**:边缘节点向**源站**回源取内容,返回给用户,并保留一份副本。
- 哪些内容适合放 CDN?静态文件(JS、CSS、图片、视频),以及变化不频繁的公开 HTML 页面。
- 源站通过响应头来控制边缘节点:`Cache-Control: public, max-age=86400`、`ETag`、`Vary`。

把用户引导到最近边缘节点的方式有:**anycast**(同一个 IP 从多个地点同时广播),或由 DNS 按位置返回 IP。

### 刷新内容(缓存失效)

改了 `app.js`,边缘节点却还保留着旧版本?有三种办法:

1. **按内容命名**(`app.3f9a1c.js`):新文件 = 新 URL,无需清除缓存。这是静态资源的最佳做法。
2. **Purge(清除)**:通过 CDN 的 API 按 URL 或 tag 清除。
3. 对经常变化的页面使用**较短的 TTL**。

## 取舍

| 选择 | 收益 | 代价 |
|---|---|---|
| DNS TTL 较长 | 查询少,速度更快 | 切换服务器/故障转移慢 |
| DNS TTL 较短 | 更换 IP 生效快 | 查询多,更依赖 DNS |
| 静态内容走 CDN | 全球访问快,源站负载轻,能扛住突发流量 | 增加成本;需要管理缓存 |
| 动态/个性化内容走 CDN | 进一步减轻负载 | 缓存配置错误时,容易把一个用户的数据暴露给另一个用户 |
| 手动 Purge | 更新立即生效 | 容易忘记、容易遗漏 |
| 文件名带哈希 | 无需 Purge | 需要构建步骤;HTML 仍需短期缓存 |

## 常见错误

- 等到*已经*需要换 IP 时才去调低 TTL;旧缓存仍按旧 TTL 存活。正确做法是先调低,再更换。
- 在 CDN 上缓存了带 Cookie 或个人数据的响应(缺少 `Cache-Control: private` 或 `Vary`),导致用户看到别人的数据。
- DNS 服务商不支持时,仍在根域名(`notenest.example`)上设置 `CNAME`。
- 以为 CDN “全包了”:忘了缓存未命中依然会回源,而一次全量 Purge 可能把源站压垮(cache stampede,缓存击穿)。
- 没有对 DNS 做监控:DNS 一旦出问题,后面的一切都会“挂掉”,哪怕服务器本身完好无损。

## 练习与面试题

1. 运行 `dig +trace notenest.example`(或任意域名),指出每一层:根、TLD、权威服务器。
2. 你需要把服务器迁移到新 IP,并尽量缩短停机时间。应该按什么顺序操作,TTL 该怎么调?
3. 为以下对象设计缓存策略:用户头像、`app.js`、首页、用户的笔记列表 API。
4. CDN 对动态内容有什么帮助?什么时候*不应该*缓存?
5. 解释 CDN 上的 cache stampede,并给出两种缓解办法(请求合并 request coalescing、stale-while-revalidate)。

## 延伸阅读

- [Cloudflare Learning: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Cloudflare Learning: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/)
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [RFC 1035: Domain Names, Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035)

**下一篇:**各地的用户蜂拥而至,一台服务器扛不住了。第 3 篇:[负载均衡与水平扩展](./03-load-balancer.md)。
