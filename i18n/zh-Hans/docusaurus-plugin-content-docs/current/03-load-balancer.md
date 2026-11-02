---
id: load-balancer
title: "负载均衡与水平扩展"
sidebar_position: 3
slug: /load-balancer
description: "垂直扩展与水平扩展、L4/L7 负载均衡、均衡算法、健康检查、粘性会话。"
---

> 一台服务器撑不住了,于是加上第二台、第三台。

## 故事

NoteNest 被一位知名博主推荐了。一个晚上,访问量暴涨 20 倍。唯一那台服务器的 CPU 打满到 100%,请求开始超时。小明把机器配置升级了一倍,只撑了几个小时又满了。更糟的是,每次升级都得先关机;而且这台机器一旦出故障,*整个* NoteNest 就消失了。

## 核心概念

### 垂直扩展与水平扩展

- **垂直扩展(scale up)**:换更强的机器(加 CPU、加内存)。简单,但有上限,成本越来越高,而且依然是*单点故障*(single point of failure)。
- **水平扩展(scale out)**:增加更多机器一起干同一件事。几乎没有上限,容错性更好,但也更复杂:需要分发请求,且不能让任何一台机器持有“私有状态”。

### 负载均衡器

**负载均衡器(Load Balancer,LB)**位于各服务器之前,接收请求并转发给一台健康的服务器。

![负载均衡器](/img/diagrams/load-balancer.svg)

*本图为本项目原创绘制;思路参考自 [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) (CC BY-NC-ND 4.0;仅参考思路,未复制图片).*

常见的两个层级:

| | L4(传输层) | L7(应用层) |
|---|---|---|
| 能看到 | IP、端口、TCP/UDP | URL、请求头、Cookie |
| 速度 | 非常快,处理少 | 稍慢,功能多 |
| 能做什么 | 转发连接 | 按路径路由、终止 TLS、压缩、限流 |
| 例子 | 云厂商的网络负载均衡、HAProxy 的 TCP 模式 | NGINX、HAProxy 的 HTTP 模式、ALB |

### 选择服务器的算法

- **轮询(Round robin)**:依次轮流分配给每台服务器。适合各请求耗时相近的场景。
- **加权轮询(Weighted round robin)**:性能强的机器分到更多请求。
- **最少连接(Least connections)**:选择当前处理连接数最少的服务器。适合处理时间差异较大的请求。
- **IP 哈希 / 一致性哈希(consistent hashing)**:同一个客户端(或同一个 key)总是被分配到同一台服务器;对本地缓存很有用。

### 健康检查

LB 会定期向每台服务器发送 `GET /healthz`。出现故障(超时、5xx)的服务器会被移出轮转;恢复正常后再重新加入。这样,一台机器宕机,用户也不会看到错误。

### 水平扩展的前提:无状态

如果服务器 1 把登录会话保存在内存里,下一个请求落到服务器 2 时就会“丢失登录状态”。解决办法:

1. **把状态移到外部**:会话放进 Redis/数据库,上传的文件放进对象存储。这样每台服务器都一模一样,随时可以替换。
2. **粘性会话(Sticky session)**:LB 记住客户端 → 服务器的对应关系(通过 Cookie)。临时应急很快,但会导致负载不均,而且服务器一旦宕机,会话照样丢失。

### LB 本身也可能挂

只有一个 LB,它自己又成了单点故障。实际中会使用 active–passive 的 LB 主备对(故障时切换虚拟 IP),或使用云厂商已经做好多副本的 LB 服务。DNS 也可以返回多个 LB 的 IP。

## 取舍

| 选择 | 收益 | 代价 |
|---|---|---|
| 垂直扩展 | 简单,无需改代码 | 有上限、成本高、升级时停机、单点故障 |
| 水平扩展 | 几乎没有上限,容错 | 必须无状态,要运维多台机器 |
| L4 LB | 快速、轻量 | 无法按内容路由 |
| L7 LB | 灵活,支持 TLS 与路由 | 更耗 CPU,多出一层需要配置 |
| 粘性会话 | 便于快速应急 | 负载倾斜,服务器宕机即丢会话 |
| 会话存放在共享存储 | 服务器可随意替换 | 多一个需要运维的组件,多一次网络调用 |

## 常见错误

- 加了服务器,上传的文件却仍存在本地磁盘上;刚上传的图片在下一个请求里就“消失”了。
- 健康检查只检查“进程还活着”,不检查数据库连接,于是 LB 仍然把请求发给有故障的服务器。
- 健康检查太重或太严苛,数据库只是短暂变慢,LB 就把整个集群都摘掉了。
- 忘了此时客户端的 IP 变成了 LB 的 IP;应当读取 `X-Forwarded-For`(并且只信任来自自家 LB 的该请求头)。
- 只扩展了应用层,却忘了数据库;所有新增的服务器一起涌向同一个数据库(第 5 篇)。
- 从不演练关掉一台服务器;第一次看到系统如何反应,偏偏是在真正的故障发生时。

## 练习与面试题

1. 配置 NGINX 作为三台本地服务器(端口 3001–3003)的 LB,关掉其中一台,观察请求仍然成功。
2. 轮询在什么情况下表现很差,`least connections` 能解决什么问题?
3. 你的应用把会话存在内存里。列出三种改造成水平扩展的方案,并说明优缺点。
4. 如何避免 LB 成为单点故障?
5. 区分 L4 与 L7 LB;什么时候需要 L7?
6. 为一个依赖数据库和缓存的 API 设计健康检查。

## 延伸阅读

- [NGINX: HTTP load balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [HAProxy:文档](https://docs.haproxy.org/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0):Load balancer 与 Horizontal scaling 部分
- [Google SRE Book](https://sre.google/sre-book/load-balancing-frontend/) (CC BY-NC 4.0):Load balancing at the frontend

**下一篇:**现在有三台服务器了,可是三台都在向数据库重复问同一个问题,问了几百万次。第 4 篇:[缓存](./04-cache.md)。
