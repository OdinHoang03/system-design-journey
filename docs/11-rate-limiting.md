---
id: rate-limiting
title: "Rate limiting"
sidebar_position: 11
slug: /rate-limiting
description: "Giới hạn tốc độ request: token bucket, leaky bucket, fixed/sliding window; giới hạn ở đâu, theo khoá nào, trả 429 ra sao."
---

> Không ai được chiếm hết bàn ăn, kể cả khách quen.

## Câu chuyện

Một đối tác viết script đồng bộ ghi chú và vô tình gọi API 3.000 lần mỗi giây. Hệ thống không bị tấn công, nhưng cả NoteNest chậm hẳn; người dùng thật bị timeout. Minh chặn IP của đối tác thì họ phàn nàn, mà không chặn thì sự cố lặp lại. Điều anh cần là một luật công bằng: mỗi khách có một hạn mức, vượt thì bị từ chối nhẹ nhàng chứ không kéo cả hệ thống xuống.

## Khái niệm sâu

### Vì sao cần giới hạn tốc độ

- **Bảo vệ** hệ thống khỏi quá tải do lỗi hoặc client xấu (kể cả tấn công vét cạn mật khẩu, scraping).
- **Công bằng**: một client không làm đói client khác.
- **Kiểm soát chi phí**: gọi dịch vụ trả tiền theo lượt, hoặc ép các gói dịch vụ khác nhau có hạn mức khác nhau.

Rate limiting từ chối *bớt* request để phần còn lại vẫn được phục vụ tốt (shedding load có chủ đích).

### Bốn thuật toán chính

| Thuật toán | Ý tưởng | Ưu | Nhược |
|---|---|---|---|
| **Token bucket** | Xô chứa tối đa `b` token, nạp `r` token/giây; mỗi request lấy 1 token | Cho phép bùng nổ ngắn (tới `b`) rồi giữ tốc độ trung bình `r`; ít bộ nhớ | Cần chọn `b` và `r` |
| **Leaky bucket** | Request vào hàng đợi, chảy ra với tốc độ cố định | Đầu ra đều đặn | Bùng nổ làm đầy hàng đợi, request mới bị bỏ; độ trễ tăng |
| **Fixed window** | Đếm request trong mỗi cửa sổ cố định (mỗi phút) | Rất đơn giản, ít bộ nhớ | Lỗi biên: 2 cửa sổ liên tiếp có thể cho phép gần gấp đôi hạn mức quanh ranh giới |
| **Sliding window** | Đếm trong khoảng "N giây gần nhất" | Chính xác hơn, hết lỗi biên | Tốn bộ nhớ hơn (log) hoặc xấp xỉ (counter có trọng số) |

![Token bucket](/img/diagrams/rate-limiting.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [bài viết Stripe về rate limiter](https://stripe.com/blog/rate-limiters).*

Token bucket tối giản:

```python
import time

class TokenBucket:
    def __init__(self, rate, capacity):
        self.rate, self.capacity = rate, capacity   # token/giây, sức chứa
        self.tokens, self.last = capacity, time.monotonic()

    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

### Giới hạn theo khoá nào

Chọn **khoá** quyết định công bằng với ai: theo **IP** (dễ nhưng nhiều người chung một IP sau NAT), theo **user/API key** (chính xác nhất, cần xác thực trước), theo **endpoint** (route ghi nặng giới hạn chặt hơn route đọc), hoặc kết hợp. Thường dùng nhiều tầng: một mức toàn cục thô, thêm mức chặt cho các route nhạy cảm như đăng nhập.

### Giới hạn ở đâu

- **Gateway/proxy** (bài 10): chỗ tự nhiên nhất, chặn sớm trước khi tốn tài nguyên.
- **Trong ứng dụng**: khi luật phụ thuộc nghiệp vụ (gói cước, tổ chức).
- **CDN/WAF** (bài 2): chặn lưu lượng thô ở rìa.
- **Phía client**: tự giới hạn khi gọi dịch vụ khác, để không làm quá tải họ.

### Khi chạy nhiều server

Mỗi server đếm riêng thì hạn mức thực tế là `N × giới hạn`. Cần bộ đếm dùng chung, thường là Redis với thao tác nguyên tử (script Lua hoặc `INCR` + `EXPIRE`). Đánh đổi: thêm một lần gọi mạng cho mỗi request, và nếu Redis chậm/sập phải quyết định **fail-open** (cho qua) hay **fail-closed** (chặn). Với hạn mức quan trọng nhưng không sống còn, thường chọn fail-open, kèm bộ đếm cục bộ làm lưới đỡ. Bài 24 sẽ đi sâu vào thiết kế rate limiter.

### Trả lời thế nào khi bị chặn

Trả `429 Too Many Requests` kèm `Retry-After` (số giây nên đợi) và, nếu muốn, các header cho biết hạn mức còn lại. Client tử tế sẽ đợi, retry có backoff và jitter (bài 17).

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Token bucket | Cho bùng nổ ngắn, nhẹ | Phải chọn tham số; bùng nổ vẫn dội vào backend |
| Leaky bucket | Đầu ra mượt | Độ trễ khi hàng đợi đầy; request cũ nằm chờ |
| Fixed window | Đơn giản nhất | Lỗi biên gần gấp đôi hạn mức |
| Sliding window | Chính xác | Bộ nhớ/tính toán nhiều hơn |
| Đếm cục bộ từng server | Không tốn mạng, nhanh | Hạn mức thực tế lệch, tăng theo số server |
| Đếm tập trung (Redis) | Hạn mức chính xác | Thêm độ trễ và một thành phần có thể sập |
| Fail-open | Dịch vụ vẫn chạy khi bộ đếm hỏng | Mất bảo vệ đúng lúc rủi ro |
| Fail-closed | Luôn được bảo vệ | Bộ đếm hỏng thì từ chối cả người dùng thật |

## Sai lầm hay gặp

- Giới hạn theo IP mà không tính NAT/proxy: chặn nhầm cả một văn phòng, hoặc chỉ thấy IP của proxy.
- Đặt hạn mức một lần cho mọi route, trong khi `/login` cần chặt hơn `/notes` nhiều.
- Không trả `Retry-After`; client đoán mò và retry dồn dập, tệ thêm.
- Đếm bằng "đọc rồi ghi" không nguyên tử; hai request đồng thời cùng lọt qua.
- Chỉ rate limit ở rìa mà quên dịch vụ nội bộ, một dịch vụ lỗi vẫn có thể đè dịch vụ khác.
- Không giám sát số request bị chặn, nên không biết luật quá chặt hay đang bị tấn công.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="rate-limiting" />

## Đọc thêm

- [Stripe: Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)
- [RFC 6585: 429 Too Many Requests](https://www.rfc-editor.org/rfc/rfc6585#section-4)
- [Cloudflare: What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)
- [Redis: Rate limiting patterns](https://redis.io/glossary/rate-limiting/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Tiếp theo:** phần "Scale & hiệu năng" đã đủ; các bài kế tiếp sẽ đi vào dữ liệu. Xem [Đại cương](/outline) để biết lộ trình còn lại.
