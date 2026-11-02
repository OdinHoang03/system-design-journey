---
id: security-basics
title: "Security basics"
sidebar_position: 23
slug: /security-basics
description: "Authn vs authz, password hashing, sessions vs JWT, OAuth2/OIDC, TLS, secrets management and the common OWASP flaws: injection, XSS, CSRF, IDOR."
---

> The bigger the system, the more people try the doors; security is many locks, not one big lock.

## Story

NoteNest has a million users. One morning Minh gets an email from a researcher: change `/api/notes/1042` to `/api/notes/1043` and you can read a stranger's notes. The same week, a log line leaks the email provider's API key because someone committed a `.env` file, and support reports accounts being guessed at thousands of password attempts a minute.

None of these flaws is sophisticated. Minh realizes he worried about scale and forgot to ask: *who is calling, what are they allowed to do, and if one layer fails, what is left behind it?*

## Core concepts

### Authn, authz and the layers

![Security layers](/img/diagrams/security-basics.svg)

*Diagram drawn from scratch for this project; idea referenced from the [OWASP Top 10](https://owasp.org/www-project-top-ten/).*

- **Authentication (authn)**: who are you? Password, OTP, passkey.
- **Authorization (authz)**: what may you do? Checked on *every request, on the server*, per resource.
- **Defense in depth**: several independent layers (TLS, gateway, permission checks, data encryption); if one is breached, another still blocks.
- **Least privilege**: every user, service and key gets only the minimum access it needs.

### Storing passwords

Never store plaintext passwords, and never use a fast hash (MD5, bare SHA-256). Use an algorithm that is **deliberately slow** and has a random per-user **salt**: **argon2id**, **bcrypt** or scrypt. A salt makes two users with the same password get different hashes and defeats precomputed tables (rainbow tables). Fight guessing with **rate limits** per account + IP, temporary lockouts, and MFA.

### Sessions vs JWT

| | Session (random ID, state on the server) | JWT (self-contained, signed token) |
|---|---|---|
| Stored in | Server/Redis; the cookie holds only the ID | The client; the server only verifies the signature |
| Revocation | Easy: delete the session | Hard: valid until expiry, needs a revocation list |
| Scaling | Needs a shared session store | No lookup, suits many services |

In practice a **short-lived access token** (5–15 minutes) plus a revocable **refresh token** is common. Cookies should carry `HttpOnly`, `Secure` and `SameSite`; avoid keeping tokens in `localStorage` if you can (XSS can read them).

### OAuth2 and OIDC, conceptually

- **OAuth2** is delegation: a user lets app A access their data at service B without handing over a password, through a scoped **access token**.
- **OpenID Connect (OIDC)** sits on top of OAuth2 to tell you *who the person is* ("Sign in with Google"), via an **ID token**.
- The standard flow for web and mobile is **authorization code + PKCE**.

### TLS and secrets

- **TLS** encrypts and authenticates the connection (HTTPS); if it terminates at the load balancer/gateway, encrypt internal traffic too (mTLS) when data is sensitive.
- **Secrets** (API keys, DB passwords) never live in source code or logs. Use a secrets manager (Vault, AWS Secrets Manager...), issue them per service, **rotate** them regularly, and scan repos for leaks.

### Common OWASP flaws

- **Broken access control / IDOR**: reaching another person's resource by guessing an ID. Always check "may this person touch *this object*?"
- **Injection (SQL...)**: concatenating input into a command. Use parameterized queries.
- **XSS**: input runs as script in someone else's browser. Escape output, use CSP.
- **CSRF**: a foreign page makes the browser send a request with your cookie. `SameSite`, CSRF tokens.
- **Misconfiguration and outdated libraries**: update dependencies, turn off unused ports and features.

## Trade-offs

| Choice | What you gain | What you lose |
|---|---|---|
| Server-side sessions | Instant revocation | A shared store; one extra lookup |
| JWT | Stateless, easy to scale | Hard to revoke; a leaked token works until it expires |
| Short-lived token + refresh | Limits the damage | A more complex refresh flow |
| Slow hash (argon2) | Hard to brute-force | CPU cost at login |
| MFA, strict rate limits | Hard to take over accounts | Users find it annoying |
| Rolling your own login | Full control | Easy to get wrong; an IdP (OIDC) is usually safer |

## Common mistakes

- Checking permissions only in the UI, not in the API (IDOR).
- Storing passwords with a fast hash or without a salt.
- Inventing your own cryptography instead of using a vetted library.
- Week-long JWTs with no way to revoke them, or sensitive data in the payload (a JWT is signed, not encrypted).
- Committing secrets to git, printing secrets to logs.
- Concatenating strings into SQL "because it's internal".
- Error messages that reveal too much ("no such email" helps someone enumerating accounts).
- No limit on failed login attempts.

## Exercises & interview questions

Pick one answer per question; the right answer and an explanation appear straight away. Results are saved in this browser.

<Quiz lessonId="security-basics" />

## Further reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet: Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Cheat Sheet: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Cookies and SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OAuth 2.0 Simplified](https://www.oauth.com/)
- [Mozilla: Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

**Next:** the Case study part starts at lesson 7, [designing a URL shortener](./07-url-shortener.md); more cases (lesson 24 onward) are coming.
