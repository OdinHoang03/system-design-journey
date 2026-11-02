---
id: client-server-http
title: "Client–server & HTTP"
sidebar_position: 1
slug: /client-server-http
description: "Mô hình client–server và giao thức HTTP: request, response, method, status code, stateless."
---

> Ngày đầu: app chạy trên một máy, một người dùng.

## Câu chuyện

Minh vừa viết xong **NoteNest**, một app ghi chú chia sẻ được. Trên laptop, mọi thứ chạy ngon: trình duyệt mở `localhost:3000`, bấm "Lưu", ghi chú hiện ra. Minh gửi link cho bạn thân là Lan. Lan mở lên… không vào được. Vì `localhost` của Lan là máy của Lan, không phải máy của Minh.

Câu hỏi đầu tiên của mọi hệ thống xuất hiện: **ai nói chuyện với ai, và nói bằng ngôn ngữ gì?**

## Khái niệm sâu

### Client và server là vai trò, không phải loại máy

- **Client**: bên chủ động gửi yêu cầu (trình duyệt, app điện thoại, một server khác).
- **Server**: bên lắng nghe ở một địa chỉ + cổng, nhận yêu cầu và trả lời.

Cùng một máy có thể là client của dịch vụ này và server của dịch vụ khác. Ví dụ: API của NoteNest là server với app điện thoại, nhưng là client khi gọi dịch vụ gửi email.

![Client – Server](/img/diagrams/client-server.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0).*

### Một request đi qua những gì

Khi Lan gõ địa chỉ NoteNest, khoảng 4 việc diễn ra theo thứ tự:

1. **Tìm địa chỉ IP** của tên miền (DNS, bài sau sẽ nói kỹ).
2. **Mở kết nối TCP** tới IP đó (bắt tay ba bước). Với HTTPS, thêm **TLS handshake** để mã hoá.
3. **Gửi HTTP request**.
4. **Nhận HTTP response** và hiển thị.

Mỗi bước tốn thời gian mạng (round trip). Đây là lý do "đặt server gần người dùng" và "tái sử dụng kết nối" quan trọng.

### Cấu trúc HTTP

```http
GET /notes/42 HTTP/1.1
Host: notenest.example
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

{"id": 42, "title": "Mua sữa"}
```

- **Method**: `GET` (đọc), `POST` (tạo), `PUT`/`PATCH` (sửa), `DELETE` (xoá).
  `GET` phải *an toàn* (không đổi dữ liệu); `GET`, `PUT`, `DELETE` phải *idempotent* (gọi nhiều lần cho kết quả như gọi một lần).
- **Status code**: `2xx` thành công, `3xx` chuyển hướng, `4xx` lỗi do client (`404`, `401`, `429`), `5xx` lỗi do server (`500`, `503`).
- **Header**: metadata như `Content-Type`, `Authorization`, `Cache-Control`.

### Stateless: server không nhớ bạn

HTTP **không lưu trạng thái** giữa hai request. Muốn "nhớ" người dùng đã đăng nhập, client gửi kèm một **token** (cookie phiên hoặc JWT) ở mỗi request. Đặc tính này nghe bất tiện nhưng cực kỳ có lợi: bất kỳ server nào cũng xử lý được bất kỳ request nào, nên sau này ta thêm server dễ dàng (bài 3).

### Các phiên bản HTTP

| Phiên bản | Điểm chính |
|---|---|
| HTTP/1.1 | Văn bản, kết nối giữ sống (keep-alive), nhưng dễ bị chặn đầu hàng (head-of-line blocking) |
| HTTP/2 | Nhị phân, ghép nhiều request trên một kết nối |
| HTTP/3 | Chạy trên QUIC (UDP), giảm chi phí bắt tay và chặn đầu hàng khi mất gói |

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Stateless (token ở mỗi request) | Server nào cũng xử lý được; dễ scale | Mỗi request mang thêm token; phải kiểm tra lại |
| Stateful (session lưu trên server) | Request gọn, thu hồi phiên dễ | Gắn người dùng với một server; scale khó hơn |
| Polling | Đơn giản | Tốn request rỗng, trễ |
| WebSocket / SSE | Đẩy dữ liệu tức thời | Giữ kết nối lâu, hạ tầng phức tạp hơn |
| REST (JSON) | Dễ debug, ai cũng hiểu | Dễ thừa/thiếu dữ liệu (over/under-fetching) |

## Sai lầm hay gặp

- Dùng `GET` để thay đổi dữ liệu (trình duyệt hay crawler gọi lại là mất dữ liệu).
- Trả `200 OK` kèm nội dung lỗi; client và monitoring không phân biệt được thành công/thất bại.
- Lưu trạng thái phiên trong RAM của một server rồi thắc mắc vì sao đăng nhập "rớt" khi có hai server.
- Không đặt timeout cho request đi ra ngoài; một dịch vụ chậm kéo sập cả hệ thống.
- Nhầm `401` (chưa xác thực) với `403` (đã xác thực nhưng không có quyền).

## Bài tập & câu hỏi phỏng vấn

1. Điều gì xảy ra từ lúc bạn gõ `https://notenest.example` đến lúc trang hiện ra? Liệt kê từng bước và chỗ nào tốn thời gian nhất.
2. Vì sao `PUT` idempotent còn `POST` thì không? Cho ví dụ hậu quả khi client retry một `POST` tạo đơn hàng.
3. Thiết kế cách đánh dấu "đã đăng nhập" mà không dùng session trên server. Ưu nhược điểm?
4. Khi nào chọn WebSocket thay vì polling?
5. *Thực hành:* dùng `curl -v https://example.com` và chỉ ra request line, header, status code.

## Đọc thêm

- [MDN: Tổng quan về HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0), phần mở đầu về hệ thống phân tán

**Tiếp theo:** Lan vào được rồi, nhưng bạn của Lan ở Berlin thấy trang chậm. Sang bài 2: [DNS & CDN](./02-dns-cdn.md).
