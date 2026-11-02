---
id: url-shortener
title: "Case study: thiết kế URL shortener"
sidebar_position: 7
slug: /url-shortener
description: "Thiết kế dịch vụ rút gọn link từ yêu cầu, ước lượng quy mô, sinh mã Base62, lưu trữ, cache, scale, analytics bất đồng bộ."
---

> Ghép mọi mảnh lại thành một hệ thống hoàn chỉnh.

## Câu chuyện

Người dùng NoteNest hay chia sẻ link dài ngoằng. Minh quyết định làm thêm **notenest.link**: dán link dài, nhận link ngắn như `notenest.link/aZ3x9Qk`. Đây là bài phỏng vấn kinh điển, và là dịp ôn lại cả hành trình: HTTP, DNS/CDN, load balancer, cache, database, queue.

Quy trình mọi bài thiết kế: **làm rõ yêu cầu → ước lượng → API → thiết kế sơ bộ → đào sâu điểm khó → đánh đổi**.

## Khái niệm sâu

### 1. Yêu cầu

**Chức năng:** tạo link ngắn từ link dài; truy cập link ngắn thì chuyển hướng; (tuỳ chọn) alias tuỳ chọn, hạn dùng, thống kê lượt click.

**Phi chức năng:** độ trễ chuyển hướng thấp (dưới ~100 ms), sẵn sàng cao (link chết là link hỏng vĩnh viễn), mã khó đoán, chịu tải đọc lớn.

**Ngoài phạm vi (nói rõ khi phỏng vấn):** tài khoản, chống spam/phishing nâng cao.

### 2. Ước lượng (làm tròn để dễ nhẩm)

- 100 triệu link mới/tháng ≈ **40 ghi/giây**.
- Tỉ lệ đọc:ghi = 100:1 ⇒ ≈ **4.000 đọc/giây**, đỉnh gấp 5–10 lần.
- Lưu 5 năm: 100M × 12 × 5 = 6 tỷ bản ghi; mỗi bản ~500 byte ⇒ ≈ **3 TB**.
- Cần bao nhiêu ký tự? Với Base62 (`a–z A–Z 0–9`): 62⁶ ≈ 5,7×10¹⁰, 62⁷ ≈ 3,5×10¹². **7 ký tự** là dư cho 6 tỷ link.

Kết luận: hệ thống **đọc nhiều**, dữ liệu không quá lớn, ghi ít. Cache và replica là công cụ chính.

### 3. API

```http
POST /api/v1/links
{"url": "https://example.com/very/long/path", "alias": "my-note", "expires_at": "2027-01-01"}
→ 201 {"short_url": "https://notenest.link/aZ3x9Qk"}

GET /aZ3x9Qk
→ 301 hoặc 302, Location: https://example.com/very/long/path
```

**301 hay 302?** `301` (vĩnh viễn) cho phép trình duyệt/CDN cache chuyển hướng: nhanh, giảm tải, nhưng ta không đếm được click và khó đổi đích. `302` (tạm thời) mỗi lần đều qua server: đếm được click, đổi được đích, tốn tải hơn. Nếu cần thống kê, dùng `302`.

### 4. Sinh mã ngắn: điểm khó nhất

| Cách | Ý tưởng | Ưu | Nhược |
|---|---|---|---|
| Hash rồi cắt | MD5/SHA của URL, lấy 7 ký tự | Không cần bộ đếm | **Đụng độ**: phải kiểm tra và thử lại |
| Bộ đếm + Base62 | ID tăng dần → đổi sang Base62 | Không đụng độ, ngắn | Mã đoán được; bộ đếm là điểm nghẽn nếu một chỗ |
| Bộ đếm phân khối | Mỗi app server xin một **khối ID** (ví dụ 1000 số) từ dịch vụ trung tâm | Nhanh, ít phối hợp | Mất vài ID khi server chết (chấp nhận được) |
| Ngẫu nhiên + kiểm tra | Sinh 7 ký tự ngẫu nhiên, chèn nếu chưa tồn tại | Khó đoán | Càng đầy càng đụng độ; cần ràng buộc `UNIQUE` |
| Snowflake-style ID | Timestamp + máy + số thứ tự | Phân tán, không phối hợp | Dài hơn 7 ký tự khi Base62 |

Lựa chọn thực tế: **bộ đếm phân khối + Base62**, và có thể **xáo trộn** (hoán vị bit/mã hoá nhẹ) trước khi đổi Base62 để mã khó đoán. Alias do người dùng đặt dùng chung ràng buộc `UNIQUE`.

```python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def to_base62(n: int) -> str:
    if n == 0:
        return ALPHABET[0]
    out = []
    while n:
        n, r = divmod(n, 62)
        out.append(ALPHABET[r])
    return "".join(reversed(out))
```

### 5. Lưu trữ

Dữ liệu đơn giản và truy cập theo khóa: `short_code → long_url, created_at, expires_at, owner`. Một bảng key-value hoặc bảng quan hệ có khóa chính `short_code` đều ổn. Với 3 TB, **shard theo `short_code`** (hash) khi cần; mỗi shard có replica (bài 5). Truy vấn "mọi link của người dùng X" cần chỉ mục phụ riêng.

### 6. Kiến trúc tổng thể

![Kiến trúc URL shortener](/img/diagrams/url-shortener.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0), phần ví dụ Pastebin/Bit.ly.*

Luồng đọc (đường nóng):

1. Client gọi `notenest.link/aZ3x9Qk` ⇒ DNS (bài 2) ⇒ CDN, có thể trả luôn nếu dùng `301`/cache ngắn hạn.
2. Load balancer L7 (bài 3) chọn một app server **stateless**.
3. App hỏi **cache** (bài 4); trúng thì trả ngay. Trượt thì đọc **database replica** (bài 5) rồi ghi lại cache với TTL.
4. Trả `302`, đồng thời **đẩy sự kiện click vào queue** (bài 6); worker gom và ghi thống kê, không làm chậm chuyển hướng.

Luồng ghi: app xin ID từ khối đã cấp, đổi Base62, ghi vào primary, (có thể) đặt luôn vào cache.

### 7. Đào sâu các điểm khó

- **Nóng cục bộ (hot key)**: link của người nổi tiếng được click triệu lần. Cache + CDN xử lý; tránh stampede bằng khoá/TTL jitter.
- **Hết hạn**: kiểm tra `expires_at` lúc đọc, và dọn dẹp nền bằng job định kỳ.
- **Độ sẵn sàng**: nhiều app server, nhiều replica, cache nhân bản; nếu cache chết, database phải chịu được tải đọc (hoặc giới hạn tốc độ).
- **Lạm dụng**: giới hạn tốc độ theo IP/khóa API, kiểm tra URL đích với danh sách độc hại, chặn chuyển hướng vòng.
- **Bảo mật**: chỉ cho giao thức `http(s)`; mã không tuần tự nếu không muốn bị dò quét.
- **Phân tích**: click là sự kiện *đến sau*, xử lý bất đồng bộ, chấp nhận trễ vài giây đến vài phút.

## Đánh đổi

| Quyết định | Chọn | Vì sao | Cái giá |
|---|---|---|---|
| Mã hoá URL | Bộ đếm phân khối + Base62 | Không đụng độ, nhanh | Cần dịch vụ cấp khối; xáo trộn để khó đoán |
| Chuyển hướng | `302` | Đếm click, đổi đích | Mỗi lượt đều qua server |
| Thống kê | Queue + worker | Không làm chậm đường nóng | Số liệu trễ, có thể lệch nhỏ |
| Lưu trữ | KV/quan hệ, shard theo mã | Truy cập theo khóa đơn giản | Truy vấn theo người dùng cần chỉ mục phụ |
| Cache | Cache-aside, TTL | 99% đọc không chạm DB | Link bị xoá còn sống tới khi hết TTL |

## Sai lầm hay gặp

- Nhảy vào vẽ kiến trúc mà chưa hỏi yêu cầu và chưa ước lượng.
- Dùng hash cắt ngắn mà quên xử lý đụng độ.
- Bộ đếm tự tăng ở một database duy nhất, thành điểm nghẽn và điểm chết.
- Dùng `301` rồi mới thấy mình không đếm được click.
- Mã tuần tự dễ đoán, người ngoài quét được toàn bộ link "riêng tư".
- Ghi thống kê đồng bộ trong đường chuyển hướng.
- Không giới hạn tốc độ tạo link, bị spam làm đầy kho.

## Bài tập & câu hỏi phỏng vấn

1. Tự làm lại phần ước lượng với số liệu khác (1 tỷ link/tháng). Thành phần nào thay đổi trước?
2. So sánh ba cách sinh mã; chọn một và bảo vệ lựa chọn.
3. Thêm tính năng "link tự huỷ sau N lần click". Cần sửa gì và gặp vấn đề tương tranh nào?
4. Thiết kế thống kê "top link theo quốc gia trong 24 giờ".
5. Hệ thống phải chịu được cache chết hoàn toàn. Bạn làm gì?
6. Mở rộng sang nhiều vùng địa lý: dữ liệu và ID đặt ở đâu?
7. *Thực hành:* cài đặt bản tối giản (một server, SQLite, `to_base62`) rồi thêm cache.

## Đọc thêm

- [donnemartin/system-design-primer: Design Pastebin.com (or Bit.ly)](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md) (CC BY 4.0)
- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [RFC 9110, mục 15.4: Redirection 3xx](https://www.rfc-editor.org/rfc/rfc9110#name-redirection-3xx)
- [Base62 / Base encoding trên Wikipedia](https://en.wikipedia.org/wiki/Base62)

**Hết đợt 1.** Bạn vừa đưa NoteNest từ một laptop lên hệ thống nhiều tầng. Quay lại [Lộ trình](/roadmap) để xem toàn bộ hành trình, hoặc xem thêm [Tài nguyên](/resources).
