---
id: case-news-feed
title: "Case study: thiết kế news feed"
sidebar_position: 25
slug: /case-news-feed
description: "Thiết kế news feed: fan-out on write vs on read, mô hình lai cho người nổi tiếng, cache feed, phân trang bằng cursor."
---

> Một bài đăng, hàng triệu người xem: công việc nên làm lúc ghi hay lúc đọc?

## Câu chuyện

NoteNest thêm tính năng theo dõi: người dùng follow nhau và mở trang chủ để xem các ghi chú công khai mới nhất của những người mình theo dõi. Ban đầu Minh viết một truy vấn: lấy danh sách người đang theo dõi, rồi lấy bài mới nhất của họ, sắp xếp theo thời gian. Với 100 người theo dõi thì ổn. Rồi một tác giả nổi tiếng có 2 triệu follower đăng bài và hàng triệu người mở app cùng lúc. Mỗi lần mở trang tốn hàng trăm truy vấn; database tắc nghẽn.

Quy trình quen thuộc: **yêu cầu → ước lượng → API → thiết kế sơ bộ → đào sâu → đánh đổi**.

## Khái niệm sâu

### 1. Yêu cầu

**Chức năng:** đăng bài; follow/unfollow; xem feed gồm bài của người mình theo dõi, mới nhất trước; cuộn vô hạn.

**Phi chức năng:** feed tải nhanh (dưới ~200 ms), bài mới hiện trong vài giây (nhất quán cuối cùng chấp nhận được, [bài 5](./05-database-replication-sharding.md)), sẵn sàng cao, chịu được tài khoản có hàng triệu follower.

**Ngoài phạm vi:** xếp hạng bằng machine learning, quảng cáo, nội dung đa phương tiện.

### 2. Ước lượng

- 10 triệu DAU, mỗi người mở feed 5 lần/ngày ⇒ 50M lượt đọc ≈ **600 đọc/giây**, đỉnh ~3.000 (bài 8).
- Mỗi người đăng 0,5 bài/ngày ⇒ 5M bài/ngày ≈ **60 ghi/giây**.
- Trung bình mỗi người có 200 follower ⇒ fan-out on write: 60 × 200 = **12.000 lượt chèn/giây**; một tác giả 2 triệu follower một mình tạo 2 triệu lượt chèn cho một bài.
- Cache feed: 10M người × 500 id bài × 8 byte ≈ **40 GB**, vừa một cụm Redis nhỏ.

Kết luận: hệ thống **đọc nhiều**, nhưng số follower phân bố rất lệch (một số ít tài khoản cực lớn). Đó là điểm khó.

### 3. API

```http
POST /api/v1/posts          {"text": "..."}      → 201 {"id": "p123"}
POST /api/v1/follow/{user}                         → 204
GET  /api/v1/feed?limit=20&after=<cursor>          → 200 {"items": [...], "next": "<cursor>"}
```

Feed dùng **phân trang bằng cursor** (bài 9), vì feed liên tục có bài mới chèn vào đầu và offset sẽ lệch trang.

### 4. Hai chiến lược cốt lõi

![Fan-out news feed](/img/diagrams/case-news-feed.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [bài giảng "Timelines at Scale" của Twitter](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/) và [system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0).*

**Fan-out on read (kéo)**: lúc đọc, lấy danh sách người theo dõi, lấy bài mới nhất của từng người, trộn và sắp xếp. Ghi rẻ (chỉ lưu bài), đọc đắt và chậm khi theo dõi nhiều người.

**Fan-out on write (đẩy)**: lúc đăng, chèn id bài vào **feed riêng của từng follower** (một danh sách trong Redis). Đọc rất nhanh (chỉ lấy một danh sách có sẵn), nhưng ghi tốn: một bài của người nổi tiếng thành hàng triệu lần chèn, và công sức bỏ phí cho người không bao giờ mở app.

### 5. Đào sâu: mô hình lai

Thực tế dùng **lai**:

- Người dùng thường (ít follower): **đẩy**. Bài đăng vào hàng đợi ([bài 6](./06-message-queue.md)), *fan-out worker* chèn id vào feed cache của từng follower, làm bất đồng bộ nên người đăng không phải chờ.
- Người nổi tiếng (vượt ngưỡng, ví dụ 100.000 follower): **không đẩy**. Bài của họ chỉ lưu một nơi.
- Lúc đọc: lấy feed đã có sẵn của người dùng, rồi **kéo** bài mới của các người nổi tiếng mà họ theo dõi, trộn theo thời gian.

**Chỉ lưu id trong feed cache.** Feed là danh sách id bài (và thời điểm), cắt ở ~500 mục. Khi đọc, "làm đầy" (hydrate) nội dung bài, tên tác giả từ cache bài đăng/cache người dùng ([bài 4](./04-cache.md)); tránh sao chép nội dung hàng triệu lần và cho phép sửa/xoá bài ở một nơi.

**Người dùng không hoạt động.** Không đẩy vào feed của người đã lâu không mở app; khi họ quay lại, dựng lại feed bằng cách kéo. Tiết kiệm đáng kể công ghi.

**Dữ liệu.** Bảng bài đăng chia theo `post_id`/tác giả; bảng quan hệ follow lưu theo cả hai chiều (ai theo dõi ai, ai được ai theo dõi) vì fan-out cần danh sách follower còn khi kéo cần danh sách đang theo dõi ([bài 5](./05-database-replication-sharding.md)).

**Xoá bài và unfollow.** Feed cache có thể chứa id đã xoá; khi hydrate bỏ qua id không còn tồn tại, và dọn dần. Unfollow có thể chấp nhận vài bài còn sót cho tới khi cache làm mới.

**Thứ tự.** Sắp theo thời gian giảm dần (id kiểu thời gian như Snowflake giúp sắp xếp). Cursor chứa id/thời điểm của mục cuối trang trước.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Fan-out on read | Ghi rẻ, luôn mới | Đọc chậm, tải truy vấn lớn |
| Fan-out on write | Đọc cực nhanh | Ghi bùng nổ với người nổi tiếng; phí công cho người không đọc |
| Lai theo ngưỡng follower | Cân bằng cả hai | Phức tạp hơn; phải trộn kết quả lúc đọc |
| Chỉ lưu id trong feed | Ít bộ nhớ, sửa/xoá dễ | Thêm bước hydrate |
| Fan-out bất đồng bộ | Đăng bài nhanh | Bài hiện chậm vài giây ở feed người khác |
| Cắt feed ở 500 mục | Giới hạn bộ nhớ | Cuộn quá xa phải đọc từ DB |
| Bỏ qua người dùng không hoạt động | Tiết kiệm ghi | Lần quay lại đầu tiên chậm hơn |

## Sai lầm hay gặp

- Chọn thuần "đẩy" rồi sập vì tài khoản có hàng triệu follower.
- Sao chép toàn bộ nội dung bài vào feed của từng người.
- Phân trang bằng offset; bài mới chèn vào làm trùng/sót mục.
- Làm fan-out đồng bộ trong request đăng bài, người đăng phải chờ.
- Không có ngưỡng và cách xử lý riêng cho "hot user".
- Không tính đến xoá bài, chặn người dùng, quyền riêng tư khi hydrate.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="case-news-feed" />

## Đọc thêm

- [Twitter: Timelines at Scale (InfoQ)](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/)
- [Redis: Lists](https://redis.io/docs/latest/develop/data-types/lists/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Twitter timeline

**Tiếp theo:** feed là đọc nhiều; kế đến là thời gian thực hai chiều. Bài 26: [Thiết kế hệ thống chat](./26-case-chat.md).
