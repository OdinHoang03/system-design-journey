---
id: reliability-patterns
title: "Mẫu thiết kế chịu lỗi"
sidebar_position: 17
slug: /reliability-patterns
description: "Timeout, retry với backoff + jitter, circuit breaker, bulkhead, fallback, load shedding: để một phần lỗi không kéo sập cả hệ thống."
---

> Lỗi là chuyện chắc chắn xảy ra; việc của ta là không để nó lan.

## Câu chuyện

NoteNest đã có queue, nhưng luồng đăng ký vẫn gọi đồng bộ dịch vụ email để xác minh địa chỉ. Một buổi tối dịch vụ email chậm dần: mỗi lời gọi mất 30 giây thay vì 50 ms. Thread của API bị giữ lại chờ, hết thread thì API không nhận thêm request nào, kể cả trang chủ vốn chẳng liên quan tới email. Client thấy lỗi nên tự động thử lại, tải tăng gấp ba, dịch vụ email càng không gượng dậy nổi.

Minh nhận ra: một dịch vụ phụ ốm không được phép làm cả NoteNest ngã bệnh theo.

## Khái niệm sâu

### Timeout: đừng chờ vô hạn

Mọi lời gọi qua mạng phải có **timeout** (kết nối và đọc, đặt riêng). Không có timeout thì một dịch vụ chậm giữ thread, kết nối và bộ nhớ của bạn vô thời hạn. Chọn timeout dựa trên p99 của dịch vụ đích cộng chút dư; và ngân sách tổng của request phải lớn hơn tổng timeout các bước bên trong (dùng **deadline** truyền xuyên suốt chuỗi gọi).

### Retry, backoff và jitter

![Circuit breaker và bulkhead](/img/diagrams/reliability-patterns.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Microsoft Azure Architecture Center: Cloud design patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) và [AWS Builders' Library: Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/).*

Lỗi thoáng qua (mất gói, failover) thường qua đi nếu thử lại. Nhưng retry sai cách gây hại:

- **Exponential backoff**: chờ 100 ms, 200 ms, 400 ms… giữa các lần thử.
- **Jitter**: cộng ngẫu nhiên vào thời gian chờ để hàng nghìn client không thử lại cùng một nhịp.
- **Giới hạn số lần** và **retry budget** (ví dụ retry chỉ chiếm tối đa 10% tổng request) để tránh **retry storm** khi dịch vụ đích đang yếu.
- Chỉ retry thao tác **idempotent** (hoặc có idempotency key); chỉ retry lỗi có khả năng tạm thời (5xx, timeout), không retry `400`/`404`.
- Retry nên ở một tầng duy nhất; ba tầng mỗi tầng thử 3 lần là 27 lời gọi cho một request.

### Circuit breaker: ngắt mạch

Breaker bọc quanh lời gọi và theo dõi tỉ lệ lỗi:

- **Closed**: bình thường, request đi qua, đếm lỗi.
- **Open**: lỗi vượt ngưỡng, mọi request bị từ chối ngay (fail fast) trong một khoảng thời gian, dịch vụ đích có chỗ thở.
- **Half-open**: sau thời gian chờ, cho vài request thử; thành công thì về Closed, thất bại thì quay lại Open.

Fail fast rẻ hơn nhiều so với chờ timeout rồi mới thất bại.

### Bulkhead: vách ngăn

Như vách khoang tàu: chia tài nguyên (thread pool, connection pool, semaphore) riêng cho từng dịch vụ phụ thuộc. Email chậm chỉ làm cạn pool email; pool của phần ghi chú vẫn còn thread. Cũng có thể cách ly theo loại khách hàng hoặc theo luồng quan trọng.

### Fallback và giảm cấp êm (graceful degradation)

Khi một phần hỏng, trả kết quả kém hơn nhưng vẫn dùng được: hiển thị dữ liệu cache cũ, bỏ phần gợi ý, xếp email vào queue gửi sau, báo "sẽ xác minh sau". Quyết định trước đâu là chức năng cốt lõi, đâu là phụ.

### Load shedding và health check

- **Load shedding**: khi quá tải, chủ động từ chối bớt (ưu tiên request quan trọng, trả `503` + `Retry-After`) thay vì cố nhận hết rồi chậm cho tất cả.
- **Health check**: load balancer loại instance hỏng khỏi vòng quay. Phân biệt *liveness* (tiến trình còn sống) với *readiness* (sẵn sàng nhận tải); đừng cho health check gọi dịch vụ phụ thuộc nặng nề, kẻo một dịch vụ phụ chết làm cả đội instance bị loại.

### Hedged request

Để cắt đuôi độ trễ (p99): nếu request chưa có phản hồi sau một ngưỡng (ví dụ p95), gửi bản thứ hai tới replica khác, lấy bản nào về trước. Chỉ dùng cho thao tác đọc/idempotent và nhớ nó tăng tải một chút.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Timeout ngắn | Giải phóng tài nguyên nhanh | Dễ cắt nhầm lời gọi vốn chỉ hơi chậm |
| Retry | Vượt qua lỗi thoáng qua | Nhân tải; có thể gây retry storm; cần idempotent |
| Circuit breaker | Fail fast, bảo vệ dịch vụ đích | Có thể từ chối nhầm; phải chỉnh ngưỡng và theo dõi |
| Bulkhead | Cô lập sự cố | Tài nguyên chia nhỏ, dùng kém hiệu quả hơn pool chung |
| Fallback | Người dùng vẫn dùng được | Dữ liệu cũ/kém; thêm nhánh code cần test |
| Load shedding | Giữ hệ thống sống khi quá tải | Một số người dùng bị từ chối |
| Hedged request | Giảm độ trễ đuôi | Tăng tải, chỉ cho thao tác an toàn |

## Sai lầm hay gặp

- Không đặt timeout, hoặc dùng timeout mặc định vô hạn của thư viện.
- Retry ngay lập tức, không backoff, không jitter: tự tạo retry storm.
- Retry ở nhiều tầng chồng lên nhau, nhân số lời gọi theo cấp số nhân.
- Retry thao tác không idempotent (tạo đơn, trừ tiền) mà không có idempotency key.
- Circuit breaker không có metric và cảnh báo: mạch mở mà không ai biết.
- Fallback chưa từng được thử; đến lúc cần mới phát hiện nó cũng lỗi.
- Health check quá sâu (gọi cả database, email), một sự cố phụ làm cả cụm bị gỡ khỏi load balancer.
- Chỉ kiểm thử đường vui; không bao giờ thử chủ động làm hỏng (chaos / fault injection).

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="reliability-patterns" />

## Đọc thêm

- [AWS Builders' Library: Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Microsoft: Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Microsoft: Bulkhead pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead)
- [Google SRE Book: Handling Overload](https://sre.google/sre-book/handling-overload/)
- [Google SRE Book: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

**Tiếp theo:** khi một thao tác chạm nhiều dịch vụ và một bước lỗi giữa chừng. Bài 18: [Giao dịch phân tán & saga](./18-distributed-transactions.md).
