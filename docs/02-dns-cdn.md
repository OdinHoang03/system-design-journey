---
id: dns-cdn
title: "DNS & CDN"
sidebar_position: 2
slug: /dns-cdn
description: "DNS phân giải tên miền ra IP và CDN đưa nội dung đến gần người dùng: TTL, cache, edge, invalidation."
---

> Có tên miền, người dùng ở xa bắt đầu thấy chậm.

## Câu chuyện

Minh mua tên miền `notenest.example` và trỏ về server đặt ở Singapore. Người dùng Việt Nam thấy nhanh. Nhưng Hana ở Berlin phàn nàn: mỗi lần mở trang mất hơn 2 giây, dù server gần như rảnh. Ánh sáng đi trong cáp quang cũng cần thời gian: một vòng đi–về Berlin ↔ Singapore đã mất khoảng 150–200 ms, và một lần tải trang cần *nhiều* vòng như vậy.

Hai vấn đề, hai công cụ: **DNS** giúp người dùng tìm đúng địa chỉ; **CDN** đưa bản sao nội dung đến gần họ.

## Khái niệm sâu

### DNS: danh bạ của Internet

DNS biến `notenest.example` thành địa chỉ IP. Quá trình phân giải đệ quy:

![Phân giải DNS](/img/diagrams/dns-resolution.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Cloudflare Learning: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/).*

1. Trình duyệt hỏi **recursive resolver** (thường của nhà mạng hoặc `8.8.8.8`, `1.1.1.1`).
2. Nếu chưa có trong cache, resolver hỏi **root server**: "ai quản lý `.example`?"
3. Hỏi **TLD server**: "ai quản lý `notenest.example`?"
4. Hỏi **authoritative server** (nơi Minh khai báo bản ghi) và nhận IP.
5. Resolver trả IP cho trình duyệt và **cache** theo **TTL**.

Các loại bản ghi hay gặp:

| Bản ghi | Ý nghĩa |
|---|---|
| `A` / `AAAA` | Tên → IPv4 / IPv6 |
| `CNAME` | Tên → tên khác (bí danh) |
| `MX` | Máy chủ nhận email |
| `TXT` | Văn bản tuỳ ý (xác minh domain, SPF) |
| `NS` | Name server quản lý zone |

**TTL** (time to live) quyết định cache được bao lâu. TTL dài: ít truy vấn, nhưng đổi IP lan truyền chậm. TTL ngắn: đổi nhanh, nhưng tốn truy vấn hơn.

DNS cũng là công cụ phân tải thô: trả nhiều IP, hoặc trả IP khác nhau theo vị trí (GeoDNS).

### CDN: bản sao ở gần người dùng

**CDN** (Content Delivery Network) là mạng các server **edge** rải khắp thế giới. Người dùng được dẫn tới edge gần nhất; edge giữ bản sao nội dung.

![CDN edge](/img/diagrams/cdn-edge.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Cloudflare Learning: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/).*

- **Cache hit**: edge có bản sao, trả ngay. Origin không bị chạm tới.
- **Cache miss**: edge hỏi **origin**, trả cho người dùng và giữ lại bản sao.
- Nội dung nào hợp CDN? Tệp tĩnh (JS, CSS, ảnh, video), và cả trang HTML công khai ít đổi.
- Origin điều khiển edge qua header: `Cache-Control: public, max-age=86400`, `ETag`, `Vary`.

Cách đưa người dùng tới edge gần nhất: **anycast** (cùng một IP được quảng bá từ nhiều nơi) hoặc DNS trả IP theo vị trí.

### Làm mới nội dung (invalidation)

Sửa `app.js` mà edge vẫn giữ bản cũ? Có ba cách:

1. **Đặt tên theo nội dung** (`app.3f9a1c.js`): file mới = URL mới, không cần xoá cache. Cách tốt nhất cho tài nguyên tĩnh.
2. **Purge** theo URL/tag qua API của CDN.
3. **TTL ngắn** cho trang hay đổi.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| TTL DNS dài | Ít truy vấn, nhanh hơn | Chuyển server/failover chậm |
| TTL DNS ngắn | Đổi IP nhanh | Nhiều truy vấn, phụ thuộc DNS hơn |
| CDN cho tĩnh | Nhanh toàn cầu, origin nhẹ, chịu tải đột biến | Thêm chi phí; phải quản lý cache |
| CDN cho nội dung động/cá nhân | Giảm tải thêm | Dễ lộ dữ liệu người này cho người khác nếu cache sai |
| Purge thủ công | Cập nhật tức thì | Dễ quên, dễ sót |
| Tên file có hash | Không cần purge | Cần bước build; HTML vẫn phải ngắn hạn |

## Sai lầm hay gặp

- Hạ TTL xuống thấp *sau khi* đã cần đổi IP; cache cũ vẫn sống theo TTL cũ. Hạ trước, đổi sau.
- Cache cả phản hồi có cookie/dữ liệu cá nhân ở CDN (thiếu `Cache-Control: private` hoặc `Vary`), người này thấy dữ liệu người kia.
- Đặt `CNAME` ở apex domain (`notenest.example`) khi nhà cung cấp DNS không hỗ trợ.
- Tin rằng CDN "tự lo hết": quên rằng cache miss vẫn đổ về origin, và một đợt purge toàn bộ có thể làm origin quá tải (cache stampede).
- Không có giám sát DNS: DNS hỏng thì mọi thứ phía sau đều "chết", dù server còn khoẻ.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="dns-cdn" />

## Đọc thêm

- [Cloudflare Learning: What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Cloudflare Learning: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/)
- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [RFC 1035: Domain Names, Implementation and Specification](https://www.rfc-editor.org/rfc/rfc1035)

**Tiếp theo:** người dùng khắp nơi đổ về, một server không chịu nổi. Bài 3: [Load balancer & scale ngang](./03-load-balancer.md).
