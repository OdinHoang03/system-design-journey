---
id: proxy-api-gateway
title: "反向代理与 API 网关"
sidebar_position: 10
slug: /proxy-api-gateway
description: "正向代理与反向代理、API 网关:统一入口负责路由、认证、TLS 终止,以及集中点的代价。"
---

> 与其让每个服务各自对外开门,不如建一道共用的大门。

## 故事

NoteNest 现在拆成了三个服务:用户、笔记、搜索。每个服务各自处理 HTTPS 证书、各自校验令牌、各自写访问日志,做法还不一样。小明要改认证方式时,改了三处却漏了一处,留下一个漏洞。他需要*一个*入口,让所有请求在碰到任何服务之前先经过它。

## 核心概念

### 正向代理与反向代理

- **正向代理**位于*客户端*一侧,代表客户端访问互联网(公司代理、VPN)。目标服务器不知道真正的客户端是谁。
- **反向代理**位于*服务端*一侧,代表后端服务器接收来自互联网的请求。客户端不知道背后有多少台服务器。

负载均衡器(第 3 课)本质上就是专门做分流的反向代理。Nginx、HAProxy、Envoy、Caddy 都能同时承担这两类工作。

### 反向代理能做什么

- **TLS 终止**:在入口解密 HTTPS,内网用 HTTP(或 mTLS)转发;证书只在一处管理。
- 按域名或路径**路由**(`/notes/*` → 笔记服务)。
- **压缩、缓存静态响应、提供静态文件**,以及后端无需感知的协议升级(HTTP/2、HTTP/3)。
- **防护**:隐藏内部地址、限制请求大小、丢弃格式错误的请求。

### API 网关

**API 网关**是懂 *API* 的反向代理:除了路由,还为所有服务承担横切关注点(cross-cutting concerns)。

![API 网关](/img/diagrams/api-gateway.svg)

*本项目自绘示意图。*

- **认证/授权**:令牌只校验一次,再通过签名的请求头把身份传给下游服务。
- **限流**(第 11 课)和按客户的配额。
- 统一的**日志、指标、链路追踪**;为每个请求附上 `request-id`。
- **请求/响应转换**、聚合多个调用、API 版本管理。
- **Backend for Frontend(BFF)**:为每类客户端(Web、移动端)提供专属网关,返回每个页面恰好需要的数据形状。

最简 Nginx 配置:

```nginx
server {
  listen 443 ssl http2;
  server_name api.notenest.example;
  ssl_certificate     /etc/tls/fullchain.pem;
  ssl_certificate_key /etc/tls/privkey.pem;

  location /notes/ { proxy_pass http://notes_svc; }
  location /users/ { proxy_pass http://users_svc; }
  location /search/ { proxy_pass http://search_svc; }
}
```

### 服务网格:面向内部流量的网关

服务很多时,服务*之间*的流量同样需要加密、重试和可观测性。**服务网格**(Istio、Linkerd)在每个服务旁放一个小代理(sidecar)来完成这些事。网关管“南北向”流量(从外到内),网格管“东西向”流量(服务之间)。小系统暂时不需要网格。

### 集中点:要小心

网关位于每个请求的必经之路上,所以它既是做共用工作最方便的地方,也可能成为**单点故障**和瓶颈。要在负载均衡器后运行多个副本,保持**精简**(不放业务逻辑),并按路由设置超时。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 设置网关 | TLS、认证、日志、限流集中一处 | 多一跳(几毫秒),多一个要运维的组件 |
| 厚网关(很多逻辑) | 后端服务简单 | 网关变成“新单体”,各团队都得改它 |
| 薄网关 | 易扩展、冲突少 | 各服务仍要自己做部分工作 |
| 在网关终止 TLS | 证书集中管理,服务器更轻 | 不用 mTLS 的话内部流量不加密 |
| 共用一个网关 | 简单 | 某个团队配置出错会影响所有人 |
| 每类客户端一个 BFF | 数据贴合页面 | 要维护更多网关 |

## 常见错误

- 只跑一个网关实例:它一挂,整个系统都挂。
- 把业务逻辑塞进网关;它会在组织和性能两方面都成为瓶颈。
- 信任客户端传来的所有请求头(如 `X-User-Id`),而不是由网关覆盖。
- 网关没有合理的超时/重试,一个慢服务拖垮全部。
- 内部服务仍直接暴露在互联网上,绕过了网关。
- 忘了透传真实客户端 IP(`X-Forwarded-For`),日志和限流只能看到网关的 IP。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在当前浏览器中。

<Quiz lessonId="proxy-api-gateway" />

## 延伸阅读

- [NGINX: Reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Envoy: What is Envoy](https://www.envoyproxy.io/docs/envoy/latest/intro/what_is_envoy)
- [Microsoft: API gateway pattern](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway)
- [Sam Newman: Pattern: Backends For Frontends](https://samnewman.io/patterns/architectural/bff/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)(CC BY 4.0):Reverse proxy 部分

**下一课:** 有了共用的入口,接下来要防止单个客户端占满整个系统的能力。第 11 课:[限流](./11-rate-limiting.md)。
