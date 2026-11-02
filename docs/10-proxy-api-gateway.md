---
id: proxy-api-gateway
title: "Reverse proxy & API gateway"
sidebar_position: 10
slug: /proxy-api-gateway
description: "Forward proxy vs reverse proxy, API gateway: một cửa vào cho định tuyến, xác thực, TLS termination, và cái giá của điểm tập trung."
---

> Thay vì để mỗi dịch vụ tự mở cửa ra Internet, hãy dựng một cổng chung.

## Câu chuyện

NoteNest đã tách thành ba dịch vụ: người dùng, ghi chú, tìm kiếm. Mỗi dịch vụ tự lo chứng chỉ HTTPS, tự kiểm tra token, tự ghi log truy cập, mỗi nơi một kiểu. Khi Minh phải đổi cách xác thực, anh sửa ở ba chỗ và quên mất một chỗ, để lại một lỗ hổng. Anh cần *một* điểm để mọi request đi qua trước khi chạm vào dịch vụ nào.

## Khái niệm sâu

### Forward proxy và reverse proxy

- **Forward proxy** đứng phía *client*, thay client đi ra Internet (proxy công ty, VPN). Server đích không biết client thật là ai.
- **Reverse proxy** đứng phía *server*, thay các server nhận request từ Internet. Client không biết có bao nhiêu server phía sau.

Load balancer (bài 3) thực chất là một reverse proxy chuyên chia tải. Nginx, HAProxy, Envoy, Caddy đều làm được cả hai việc.

### Reverse proxy làm gì

- **TLS termination**: giải mã HTTPS tại cổng, chuyển HTTP (hoặc mTLS) vào mạng nội bộ; quản lý chứng chỉ ở một nơi.
- **Định tuyến** theo host hoặc đường dẫn (`/notes/*` → dịch vụ ghi chú).
- **Nén, cache phản hồi tĩnh, phục vụ file tĩnh**, nâng cấp giao thức (HTTP/2, HTTP/3) mà server phía sau không cần biết.
- **Bảo vệ**: che địa chỉ nội bộ, giới hạn kích thước request, chặn request lỗi định dạng.

### API gateway

**API gateway** là reverse proxy hiểu *API*: ngoài định tuyến, nó gánh các mối quan tâm chung (cross-cutting concerns) cho mọi dịch vụ.

![API gateway](/img/diagrams/api-gateway.svg)

*Hình tự vẽ cho dự án này.*

- **Xác thực/uỷ quyền**: kiểm tra token một lần, truyền danh tính xuống dịch vụ qua header đã ký.
- **Rate limiting** (bài 11) và hạn mức theo khách hàng.
- **Ghi log, metric, trace** thống nhất; gắn `request-id` cho mỗi request.
- **Biến đổi request/response**, gộp nhiều lời gọi, quản lý version API.
- **Backend for Frontend (BFF)**: một gateway riêng cho từng loại client (web, mobile), trả đúng hình dạng dữ liệu mà màn hình cần.

Cấu hình tối giản bằng Nginx:

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

### Service mesh: gateway cho lưu lượng nội bộ

Khi số dịch vụ lớn, lưu lượng *giữa* các dịch vụ cũng cần mã hoá, retry, quan sát. **Service mesh** (Istio, Linkerd) đặt một proxy nhỏ (sidecar) cạnh mỗi dịch vụ để làm việc đó. Gateway lo lưu lượng "bắc-nam" (ngoài vào trong), mesh lo "đông-tây" (giữa các dịch vụ). Với hệ thống nhỏ, chưa cần mesh.

### Điểm tập trung: cẩn thận

Gateway đứng giữa mọi request, nên nó vừa là chỗ tiện nhất để làm việc chung, vừa là **điểm chết duy nhất** tiềm ẩn và có thể thành nút thắt. Chạy nhiều bản sau một load balancer, giữ nó **mỏng** (không nhét logic nghiệp vụ), và đặt timeout cho từng đường đi.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Có gateway | Một chỗ cho TLS, auth, log, giới hạn | Thêm một bước nhảy (vài ms) và một thành phần phải vận hành |
| Gateway dày (nhiều logic) | Dịch vụ phía sau đơn giản | Gateway thành "monolith mới", mọi đội phải sửa chung |
| Gateway mỏng | Dễ scale, ít xung đột | Mỗi dịch vụ vẫn tự làm một số việc |
| TLS kết thúc tại gateway | Một nơi quản chứng chỉ, server nhẹ hơn | Lưu lượng nội bộ không mã hoá nếu không dùng mTLS |
| Một gateway chung | Đơn giản | Đội nào lỗi cấu hình cũng ảnh hưởng tất cả |
| BFF cho từng client | Dữ liệu vừa khít màn hình | Nhiều gateway để duy trì |

## Sai lầm hay gặp

- Chỉ chạy một bản gateway: gateway sập là cả hệ thống sập.
- Nhét logic nghiệp vụ vào gateway; nó thành nút thắt về tổ chức lẫn hiệu năng.
- Tin tưởng mọi header từ client (ví dụ `X-User-Id`) thay vì để gateway ghi đè.
- Không đặt timeout/retry hợp lý ở gateway, một dịch vụ chậm kéo sập tất cả.
- Để dịch vụ nội bộ vẫn mở thẳng ra Internet, bỏ qua gateway.
- Quên chuyển IP thật của client (`X-Forwarded-For`), log và giới hạn tốc độ chỉ thấy IP của gateway.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="proxy-api-gateway" />

## Đọc thêm

- [NGINX: Reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Envoy: What is Envoy](https://www.envoyproxy.io/docs/envoy/latest/intro/what_is_envoy)
- [Microsoft: API gateway pattern](https://learn.microsoft.com/en-us/azure/architecture/microservices/design/gateway)
- [Sam Newman: Pattern: Backends For Frontends](https://samnewman.io/patterns/architectural/bff/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Reverse proxy

**Tiếp theo:** có cổng chung rồi, cần ngăn một client chiếm hết năng lực của cả hệ thống. Bài 11: [Rate limiting](./11-rate-limiting.md).
