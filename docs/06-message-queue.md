---
id: message-queue
title: "Message queue & xử lý bất đồng bộ"
sidebar_position: 6
slug: /message-queue
description: "Queue tách việc nặng khỏi request: producer, consumer, at-least-once, idempotency, retry, dead-letter queue, backpressure."
---

> Việc nặng không cần làm ngay trước mặt người dùng.

## Câu chuyện

NoteNest thêm tính năng "xuất ghi chú ra PDF" và "gửi email nhắc việc". Khi người dùng bấm xuất, API chạy luôn: dựng PDF (3 giây), gửi email (1 giây), cập nhật thống kê… rồi mới trả lời. Giờ cao điểm, hàng nghìn người cùng bấm, các server bận dựng PDF nên không còn sức phục vụ request thường. Dịch vụ gửi email chậm một chút là cả luồng bị treo theo.

Minh nhận ra người dùng chỉ cần biết "đã nhận yêu cầu"; PDF có thể đến sau vài giây.

## Khái niệm sâu

### Queue: hộp thư giữa hai bên

![Message queue](/img/diagrams/message-queue.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0), mục Asynchronism.*

- **Producer** (API) đẩy một **message** (việc cần làm) vào queue rồi trả lời ngay, ví dụ `202 Accepted`.
- **Queue** giữ message bền vững cho tới khi có người xử lý.
- **Consumer / worker** lấy message ra xử lý theo tốc độ của nó, rồi **xác nhận** (ack).

Lợi ích:

1. **Tách thời gian**: người dùng không đợi việc nặng.
2. **San phẳng tải đột biến**: queue là bộ đệm; worker xử lý đều tay.
3. **Tách phụ thuộc**: dịch vụ email chết thì message nằm chờ, API vẫn chạy.
4. **Scale độc lập**: thêm worker khi queue dài, không đụng tới API.

### Queue và pub/sub

- **Queue (point-to-point)**: mỗi message chỉ một consumer trong nhóm xử lý. Hợp để chia việc.
- **Pub/sub (topic)**: mỗi message được giao cho *mọi* nhóm đăng ký. Hợp để phát sự kiện ("ghi chú đã tạo") cho nhiều dịch vụ: tìm kiếm, thống kê, thông báo.
- **Log phân tán** (kiểu Kafka): message được ghi nối tiếp, giữ lại lâu, consumer tự nhớ vị trí đọc và có thể đọc lại. Hợp luồng sự kiện lớn và xử lý lại dữ liệu.

### Đảm bảo giao hàng

| Mức | Nghĩa | Hệ quả |
|---|---|---|
| At-most-once | Gửi tối đa một lần | Có thể mất message |
| **At-least-once** | Gửi ít nhất một lần, có thể trùng | Phổ biến nhất; consumer phải chịu được trùng |
| Exactly-once | Chỉ đúng một lần | Rất khó trong hệ phân tán; thường đạt được "hiệu ứng" một lần bằng at-least-once + idempotency |

Vì có thể nhận trùng, consumer phải **idempotent**: xử lý hai lần cho cùng kết quả như một lần. Cách làm: gắn `message_id` hoặc **idempotency key**, ghi lại những cái đã xử lý, hoặc dùng thao tác tự nhiên idempotent (`SET status = 'sent'`).

### Lỗi, retry và dead-letter

- Worker lỗi trước khi ack thì message được giao lại (sau visibility timeout).
- **Retry với exponential backoff + jitter** tránh dồn dập.
- Message cứ lỗi mãi (**poison message**) bị chuyển sang **dead-letter queue** (DLQ) để người kiểm tra, thay vì chặn cả hàng.

### Thứ tự và backpressure

Queue thường chỉ đảm bảo thứ tự trong một phân vùng/nhóm (ví dụ cùng `user_id`), không phải toàn cục. Nếu producer nhanh hơn consumer lâu dài, queue dài vô hạn: cần theo dõi **độ dài queue / độ trễ**, tự động thêm worker, và áp **backpressure** (từ chối hoặc làm chậm producer) khi vượt ngưỡng.

### Mẫu hay dùng

- **Outbox**: ghi sự kiện vào bảng trong *cùng giao dịch* với dữ liệu, một tiến trình riêng chuyển sang queue; tránh trường hợp "ghi DB xong nhưng gửi queue thất bại".
- **Saga**: chuỗi bước có hoàn tác (compensation) thay cho giao dịch phân tán.
- **Fan-out**: một sự kiện, nhiều consumer độc lập.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Đồng bộ | Đơn giản, kết quả có ngay | Người dùng đợi; một phần chậm kéo tất cả |
| Bất đồng bộ qua queue | Nhanh, chịu tải đột biến, tách phụ thuộc | Kết quả đến sau; khó debug; thêm hạ tầng; cần thiết kế cho trùng/lỗi |
| At-least-once + idempotent | Không mất việc | Phải viết consumer cẩn thận |
| Giữ thứ tự chặt | Đúng thứ tự | Giảm song song |
| Log kiểu Kafka | Đọc lại, thông lượng lớn | Vận hành phức tạp hơn queue đơn giản |

## Sai lầm hay gặp

- Consumer không idempotent: email gửi hai lần, tiền trừ hai lần.
- Không có DLQ; một message hỏng làm worker lặp vô hạn.
- Retry ngay lập tức không backoff, đè sập dịch vụ phía dưới đang yếu.
- Dùng queue cho việc cần kết quả tức thì (đăng nhập, thanh toán cần xác nhận).
- Không giám sát độ trễ và độ dài queue; sự cố chỉ lộ ra khi người dùng than phiền.
- Ghi DB rồi mới gửi queue ở hai bước rời nhau; một bước lỗi là dữ liệu lệch (dùng outbox).
- Message quá lớn: nên chứa tham chiếu (ID, URL), không chứa cả tệp.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="message-queue" />

## Đọc thêm

- [RabbitMQ: Tutorials](https://www.rabbitmq.com/tutorials)
- [Apache Kafka: Introduction](https://kafka.apache.org/intro)
- [Amazon SQS: Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Microsoft: Transactional Outbox pattern](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 11 (Stream Processing)

**Tiếp theo:** ghép mọi mảnh lại. Bài 7: [Case study: thiết kế URL shortener](./07-url-shortener.md).
