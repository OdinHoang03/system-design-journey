---
id: security-basics
title: "安全基础"
sidebar_position: 23
slug: /security-basics
description: "认证与授权、密码哈希、会话与 JWT、OAuth2/OIDC、TLS、密钥管理,以及常见的 OWASP 漏洞:注入、XSS、CSRF、IDOR。"
---

> 系统越大,试门的人越多;安全是很多把锁,而不是一把大锁。

## 故事

NoteNest 有一百万用户。一天早上,Minh 收到一位研究者的邮件:把 `/api/notes/1042` 改成 `/api/notes/1043`,就能读到陌生人的笔记。同一周,有人把 `.env` 文件提交进了仓库,邮件服务的 API 密钥出现在日志里;客服还反馈有账号每分钟被尝试上千次密码。

这些漏洞都不高深。Minh 意识到自己只顾着扩展,忘了问:*谁在调用、他能做什么、一层被突破后还剩什么?*

## 核心概念

### 认证、授权与分层

![安全分层](/img/diagrams/security-basics.svg)

*图为本项目自绘;思路参考 [OWASP Top 10](https://owasp.org/www-project-top-ten/)。*

- **认证(authn)**:你是谁?密码、一次性验证码、passkey。
- **授权(authz)**:你能做什么?必须在服务器上对*每个请求、每个资源*检查。
- **纵深防御**:多层相互独立的防线(TLS、网关、权限检查、数据加密);一层失守,另一层仍能拦住。
- **最小权限**:每个用户、服务、密钥只拥有所需的最小权限。

### 存储密码

绝不存明文密码,也不要用快速哈希(MD5、裸 SHA-256)。使用**故意很慢**且带每用户随机**盐**的算法:**argon2id**、**bcrypt** 或 scrypt。加盐使相同密码得到不同哈希,并让预计算表(彩虹表)失效。防止猜密码要靠按账号 + IP 的**限流**、临时锁定和多因素认证(MFA)。

### 会话与 JWT

| | 会话(随机 ID,状态在服务端) | JWT(自包含、带签名的令牌) |
|---|---|---|
| 存放位置 | 服务端/Redis;Cookie 只存 ID | 客户端;服务端只验签 |
| 撤销 | 容易:删除会话 | 困难:到期前一直有效,需要吊销列表 |
| 扩展 | 需要共享的会话存储 | 无需查询,适合多服务 |

实践中常见的是**短期访问令牌**(5–15 分钟)加可撤销的**刷新令牌**。Cookie 应带 `HttpOnly`、`Secure`、`SameSite`;尽量不要把令牌放在 `localStorage`(XSS 可读取)。

### OAuth2 与 OIDC 的概念

- **OAuth2** 是授权委托:用户让应用 A 访问其在服务 B 的数据,而不交出密码,方式是带范围(scope)的**访问令牌**。
- **OpenID Connect(OIDC)** 建立在 OAuth2 之上,用来告诉你*这个人是谁*(“用 Google 登录”),通过 **ID 令牌**实现。
- Web 和移动端的标准流程是**授权码 + PKCE**。

### TLS 与密钥

- **TLS** 对连接加密并认证(HTTPS);若在负载均衡/网关处终止,数据敏感时内部流量也应加密(mTLS)。
- **密钥**(API 密钥、数据库密码)不能出现在源码或日志里。使用密钥管理服务(Vault、AWS Secrets Manager 等),按服务分发,定期**轮换**,并扫描仓库防止泄露。

### 常见 OWASP 漏洞

- **访问控制失效 / IDOR**:靠猜 ID 访问他人资源。始终检查“此人是否有权操作*这个对象*”。
- **注入(SQL 等)**:把输入拼接进命令。使用参数化查询。
- **XSS**:输入在别人的浏览器里作为脚本执行。输出转义,配置 CSP。
- **CSRF**:外部页面让浏览器带着你的 Cookie 发请求。使用 `SameSite`、CSRF 令牌。
- **配置错误与过期依赖**:及时更新依赖,关闭不用的端口和功能。

## 取舍

| 选择 | 得到 | 失去 |
|---|---|---|
| 服务端会话 | 可立即撤销 | 需要共享存储;多一次查询 |
| JWT | 无状态,易扩展 | 难撤销;令牌泄露后到期前都可用 |
| 短期令牌 + 刷新 | 限制损失 | 刷新流程更复杂 |
| 慢哈希(argon2) | 难以暴力破解 | 登录时消耗 CPU |
| MFA、严格限流 | 难以接管账号 | 用户觉得麻烦 |
| 自己实现登录 | 完全可控 | 容易出错;使用 IdP(OIDC)通常更安全 |

## 常见错误

- 只在界面检查权限,API 不检查(IDOR)。
- 用快速哈希或不加盐存密码。
- 自创加密算法,而不是用经过验证的库。
- JWT 有效期长达数周且无法撤销,或把敏感数据放进载荷(JWT 只签名、不加密)。
- 把密钥提交到 git,或打印到日志。
- “反正是内部用”就把字符串拼进 SQL。
- 错误信息泄露太多(“该邮箱不存在”会帮人枚举账号)。
- 不限制登录失败次数。

## 练习与面试题

每题选一个答案;正确答案和解析会立即显示。结果保存在此浏览器中。

<Quiz lessonId="security-basics" />

## 延伸阅读

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet: Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Cheat Sheet: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Cookies and SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OAuth 2.0 Simplified](https://www.oauth.com/)
- [Mozilla: Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

**下一篇:**案例部分从第 7 篇开始,[设计一个短链接服务](./07-url-shortener.md);更多案例(第 24 篇起)即将推出。
