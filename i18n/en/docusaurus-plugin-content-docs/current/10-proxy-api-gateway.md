---
id: proxy-api-gateway
title: "Reverse proxy & API gateway"
sidebar_position: 10
slug: /proxy-api-gateway
description: "Forward vs reverse proxy, and the API gateway: one front door for routing, auth, TLS termination, and the price of a central point."
---

> Instead of letting every service open its own door to the Internet, build one shared gate.

## Story

NoteNest is now three services: users, notes, search. Each one handles its own HTTPS certificate, checks tokens its own way, and writes its own access log. When Minh had to change how authentication works, he edited three places and forgot one, leaving a hole. He needed *one* point every request passes through before touching any service.

## Core concepts

### Forward proxy vs reverse proxy

- A **forward proxy** sits on the *client* side and goes out to the Internet on the client's behalf (corporate proxy, VPN). The destination does not know who the real client is.
- A **reverse proxy** sits on the *server* side and receives requests from the Internet on behalf of the servers. The client does not know how many servers are behind it.

A load balancer (lesson 3) is really a reverse proxy specialized in spreading load. Nginx, HAProxy, Envoy and Caddy can all do both jobs.

### What a reverse proxy does

- **TLS termination**: decrypt HTTPS at the gate and forward HTTP (or mTLS) inside the private network; manage certificates in one place.
- **Routing** by host or path (`/notes/*` → notes service).
- **Compression, caching static responses, serving static files**, protocol upgrades (HTTP/2, HTTP/3) that backends never need to know about.
- **Protection**: hide internal addresses, cap request size, drop malformed requests.

### API gateway

An **API gateway** is a reverse proxy that understands *APIs*: beyond routing, it carries the cross-cutting concerns for all services.

![API gateway](/img/diagrams/api-gateway.svg)

*Original diagram drawn for this project.*

- **Authentication/authorization**: verify the token once, pass the identity down in a signed header.
- **Rate limiting** (lesson 11) and per-customer quotas.
- **Unified logs, metrics, traces**; attach a `request-id` to every request.
- **Request/response transformation**, aggregating several calls, API version management.
- **Backend for Frontend (BFF)**: a dedicated gateway per client type (web, mobile) returning exactly the shape each screen needs.

A minimal Nginx configuration:

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

### Service mesh: a gateway for internal traffic

With many services, traffic *between* them also needs encryption, retries and observability. A **service mesh** (Istio, Linkerd) puts a small proxy (a sidecar) next to every service to do that. The gateway handles "north-south" traffic (outside in), the mesh handles "east-west" (between services). A small system does not need a mesh yet.

### The central point: be careful

The gateway sits in the path of every request, which makes it the most convenient place for shared work and also a potential **single point of failure** and bottleneck. Run several copies behind a load balancer, keep it **thin** (no business logic), and set timeouts per route.

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Having a gateway | One place for TLS, auth, logs, limits | An extra hop (a few ms) and one more component to run |
| Thick gateway (lots of logic) | Simple backends | The gateway becomes a "new monolith" every team must edit |
| Thin gateway | Easy to scale, fewer conflicts | Each service still does some of the work |
| TLS ends at the gateway | One place for certificates, lighter servers | Internal traffic is unencrypted unless you use mTLS |
| One shared gateway | Simple | One team's bad config affects everyone |
| BFF per client | Data fits the screen | More gateways to maintain |

## Common mistakes

- Running a single gateway instance: if it dies, the whole system dies.
- Putting business logic into the gateway; it becomes a bottleneck for both organization and performance.
- Trusting every client-supplied header (e.g. `X-User-Id`) instead of letting the gateway overwrite it.
- No sensible timeouts/retries at the gateway, so one slow service drags everything down.
- Leaving internal services directly exposed to the Internet, bypassing the gateway.
- Forgetting to pass the real client IP (`X-Forwarded-For`), so logs and rate limits only see the gateway's IP.

## Exercises & interview questions

Pick one answer per question; the correct answer and explanation appear right away. Your results are saved in this browser.

<Quiz lessonId="proxy-api-gateway" />

## Further reading

- [NGINX: Reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Envoy: What is Envoy](https://www.envoyproxy.io/docs/envoy/latest/intro/what_is_envoy)
- [Microsoft: API gateway pattern](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway)
- [Sam Newman: Pattern: Backends For Frontends](https://samnewman.io/patterns/architectural/bff/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): the Reverse proxy section

**Next:** with a shared gate in place, stop a single client from taking the whole system's capacity. Lesson 11: [Rate limiting](./11-rate-limiting.md).
