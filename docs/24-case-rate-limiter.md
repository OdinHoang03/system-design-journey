---
id: case-rate-limiter
title: "Case study: thiết kế rate limiter"
sidebar_position: 24
slug: /case-rate-limiter
description: "Thiết kế rate limiter phân tán: yêu cầu, ước lượng, đếm bằng Redis nguyên tử, chính xác vs chi phí, fail-open, nhiều vùng."
---

> Biến một thuật toán trên giấy thành một dịch vụ chịu được hàng trăm nghìn lượt kiểm tra mỗi giây.

## Câu chuyện

Ở bài 11, Minh đã biết token bucket và sliding window. Giờ NoteNest mở API công khai cho đối tác và Minh phải làm rate limiter thật: chạy trên 20 server gateway, áp hạn mức khác nhau theo gói cước, không làm chậm request bình thường, và không sập kéo theo cả API. Đây là bài phỏng vấn quen thuộc: *"Thiết kế một rate limiter."*

Quy trình quen thuộc: **yêu cầu → ước lượng → API → thiết kế sơ bộ → đào sâu → đánh đổi**.

## Khái niệm sâu

### 1. Yêu cầu

**Chức năng:** giới hạn số request theo khoá (user, API key, IP) và theo route; luật cấu hình được (ví dụ gói Free 60/phút, gói Pro 600/phút); từ chối bằng `429` kèm `Retry-After`.

**Phi chức năng:** độ trễ thêm vào mỗi request rất thấp (dưới ~2 ms), chính xác "đủ tốt", sẵn sàng cao (limiter hỏng không được làm hỏng API), chạy được trên nhiều server.

**Ngoài phạm vi:** chống DDoS tầng mạng (việc của CDN/WAF, [bài 2](./02-dns-cdn.md)).

### 2. Ước lượng

- API đỉnh 50.000 request/giây (bài 8) ⇒ 50.000 lượt kiểm tra/giây.
- 5 triệu khoá hoạt động; mỗi khoá một bộ đếm ~100 byte ⇒ ≈ **500 MB**, vừa một Redis.
- 50.000 thao tác/giây là nhẹ với một node Redis (hàng trăm nghìn ops/giây), nhưng tốn một vòng mạng ~0,5 ms cho mỗi request.

Kết luận: dữ liệu nhỏ, nút thắt là **độ trễ và tính nguyên tử**, không phải dung lượng.

### 3. API và vị trí đặt

Limiter là một **middleware ở gateway** (bài 10), không phải endpoint công khai. Hàm lõi:

```
allow(key, rule) -> {allowed: bool, remaining: int, retry_after: seconds}
```

Phản hồi khi bị chặn:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

### 4. Thiết kế sơ bộ

![Rate limiter phân tán](/img/diagrams/case-rate-limiter.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [bài viết Stripe về rate limiter](https://stripe.com/blog/rate-limiters).*

Gateway lấy khoá (user + route), gọi Redis kiểm tra bộ đếm; cho qua thì chuyển tiếp tới API server, không thì trả `429`. Luật (hạn mức theo gói) nằm ở kho cấu hình và được gateway cache cục bộ, làm mới định kỳ.

### 5. Đào sâu: đếm phân tán chính xác

**Vấn đề đua (race).** Cách "GET rồi SET" không nguyên tử: hai gateway cùng đọc `59`, cùng cho qua, hạn mức bị vượt. Phải đọc-sửa-ghi trong **một thao tác nguyên tử**: `INCR` cho fixed window, hoặc **script Lua** (Redis chạy trọn script, không xen thao tác khác).

Token bucket bằng Lua (rút gọn):

```lua
-- KEYS[1]=khoá; ARGV: rate, capacity, now(ms)
local s = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(s[1]) or tonumber(ARGV[2])
local ts = tonumber(s[2]) or tonumber(ARGV[3])
tokens = math.min(ARGV[2], tokens + (ARGV[3]-ts)/1000*ARGV[1])
local ok = tokens >= 1
if ok then tokens = tokens - 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[3])
redis.call('PEXPIRE', KEYS[1], 120000)  -- khoá ít dùng tự dọn
return ok and 1 or 0
```

Dùng thời gian của Redis (hoặc đồng hồ thống nhất) thay vì đồng hồ từng gateway để tránh lệch giờ.

**Chọn thuật toán.** Token bucket: ít bộ nhớ (2 số mỗi khoá), cho bùng nổ ngắn; hợp làm mặc định. Sliding window log: chính xác nhất nhưng tốn bộ nhớ theo số request. Sliding window counter: xấp xỉ rẻ, sai số nhỏ.

**Mở rộng Redis.** Chia khoá bằng hash giữa nhiều node ([bài 5](./05-database-replication-sharding.md)); mỗi khoá chỉ nằm ở một node nên đếm vẫn đúng. Một khoá "nóng" (một khách gọi dữ dội) chỉ làm nóng một node.

**Giảm vòng mạng.** Gateway giữ một **hạn mức cục bộ nhỏ** (xin trước 10 token từ Redis, dùng dần). Đổi lại độ chính xác giảm đôi chút.

**Khi Redis chậm hoặc sập.** Đặt timeout rất ngắn (vài ms). Hết thời gian thì **fail-open** (cho qua, dùng bộ đếm cục bộ làm lưới đỡ) cho API thông thường, và **fail-closed** chỉ cho route nhạy cảm như đăng nhập. Phát cảnh báo để người vận hành biết.

**Nhiều vùng địa lý.** Đếm toàn cục chính xác cần một vòng mạng liên vùng (đắt, xem bài 8). Thường chia hạn mức cho từng vùng (mỗi vùng được 1/N) hoặc đồng bộ bất đồng bộ giữa các vùng và chấp nhận vượt nhẹ.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Đếm tập trung ở Redis | Hạn mức chính xác trên mọi gateway | Thêm vòng mạng, thêm thành phần có thể hỏng |
| Đếm cục bộ từng gateway | Không tốn mạng | Hạn mức thực tế = N × giới hạn |
| Xin token theo lô | Ít gọi Redis | Sai số, token dư bị lãng phí khi gateway chết |
| Lua script | Nguyên tử, một vòng mạng | Logic nằm trong Redis, khó test và nâng cấp hơn |
| Fail-open | API vẫn chạy khi limiter hỏng | Mất bảo vệ đúng lúc rủi ro |
| Fail-closed | Luôn được bảo vệ | Limiter hỏng thì cả API ngừng |
| Chia hạn mức theo vùng | Không có vòng liên vùng | Khách dồn vào một vùng bị chặn sớm |

## Sai lầm hay gặp

- Đọc rồi ghi không nguyên tử, hạn mức bị vượt khi tải cao.
- Dùng đồng hồ từng server; lệch giờ làm cửa sổ sai.
- Không đặt TTL cho khoá bộ đếm, Redis phình mãi.
- Để limiter là điểm chết: Redis sập kéo cả API sập.
- Chỉ có một hạn mức toàn cục, không phân biệt route đắt và rẻ.
- Không có số đo (số request bị chặn, độ trễ kiểm tra), không biết luật có hợp lý không.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="case-rate-limiter" />

## Đọc thêm

- [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/interact/programmability/eval-intro/)
- [RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585#section-4)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Tiếp theo:** từ bảo vệ đầu vào sang bài toán đọc nhiều và ghi lan toả. Bài 25: [Thiết kế news feed](./25-case-news-feed.md).
