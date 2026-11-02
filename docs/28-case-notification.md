---
id: case-notification
title: "Case study: thiết kế hệ thống thông báo"
sidebar_position: 28
slug: /case-notification
description: "Thiết kế hệ thống thông báo đa kênh (push, email, SMS): hàng đợi theo kênh, ưu tiên, tuỳ chọn người dùng, chống gửi trùng, retry."
---

> Gửi đúng người, đúng kênh, đúng một lần.

## Câu chuyện

NoteNest thêm tính năng chia sẻ ghi chú. Khi ai đó mời bạn vào ghi chú chung, bạn cần được báo: push trên điện thoại, email, đôi khi SMS. Ban đầu mỗi tính năng tự gọi nhà cung cấp email theo kiểu riêng. Rồi sự cố đến: một worker bị khởi động lại giữa chừng và gửi lại cả lô, hàng nghìn người nhận cùng một email hai lần; mã OTP đăng nhập thì kẹt sau hàng nghìn email quảng bá nên đến trễ năm phút. Minh quyết định tách thành **một hệ thống thông báo** dùng chung.

Quy trình quen thuộc: **yêu cầu → ước lượng → API → thiết kế sơ bộ → đào sâu → đánh đổi**.

## Khái niệm sâu

### 1. Yêu cầu

**Chức năng:** gửi thông báo qua push (iOS/Android), email, SMS; người dùng tuỳ chọn bật/tắt theo kênh và loại; hỗ trợ mẫu nội dung theo ngôn ngữ; gửi ngay hoặc hẹn giờ.

**Phi chức năng:** thông báo khẩn (OTP) đến trong vài giây; **không gửi trùng**; chịu được đợt gửi hàng loạt mà không làm chậm thông báo khẩn; mở rộng thêm kênh mới dễ; theo dõi được trạng thái đã gửi/đã nhận.

**Ngoài phạm vi:** thiết kế trình soạn mẫu, A/B test nội dung.

### 2. Ước lượng

- 10 triệu người dùng, mỗi người trung bình 5 thông báo/ngày ⇒ 50 triệu/ngày ≈ **600/giây** trung bình, đỉnh vài nghìn/giây (xem bài 8).
- Đợt gửi hàng loạt (chiến dịch) 10 triệu thông báo trong 1 giờ ≈ **2.800/giây** thêm vào, và phải không chen ngang OTP.
- Lưu nhật ký 90 ngày × 50M × ~300 byte ≈ **1,3 TB**.

Kết luận: tải vừa phải, nhưng **gửi ra ngoài là chậm và không đáng tin** (nhà cung cấp giới hạn tốc độ, lỗi tạm thời). Cần hàng đợi để tách rời và hấp thụ đột biến.

### 3. API

```http
POST /api/v1/notifications
Idempotency-Key: 7b1e...
{"user_id": 42, "type": "note_invite", "priority": "normal",
 "data": {"note_title": "Kế hoạch tuần", "inviter": "Lan"}}
→ 202 {"id": "n_91c"}
```

Trả `202 Accepted`: việc gửi diễn ra bất đồng bộ (bài 6). `Idempotency-Key` cho phép dịch vụ gọi retry mà không tạo thông báo thứ hai (bài 9).

### 4. Thiết kế sơ bộ

![Hệ thống thông báo](/img/diagrams/case-notification.svg)

*Hình tự vẽ cho dự án này.*

1. **Notification API** nhận yêu cầu, kiểm tra **tuỳ chọn người dùng** (đã tắt kênh này chưa, đang trong giờ yên lặng không), chống trùng, rate limit (bài 11).
2. Chọn kênh, dựng nội dung từ **mẫu** theo ngôn ngữ của người dùng, rồi đẩy vào **hàng đợi riêng cho từng kênh**.
3. **Worker** của mỗi kênh lấy tin, gọi nhà cung cấp (APNs/FCM cho push, nhà cung cấp email, nhà cung cấp SMS), ghi kết quả.
4. Lỗi tạm thời thì retry; hết lượt thì đưa vào **dead-letter queue** để xem lại.

### 5. Đào sâu

**Ưu tiên.** Dùng hàng đợi riêng (hoặc hạng ưu tiên) cho từng mức: `critical` (OTP, cảnh báo bảo mật), `normal`, `bulk` (chiến dịch). Worker của `bulk` bị giới hạn tốc độ để không nuốt hết hạn mức nhà cung cấp. Đây là cách giữ OTP nhanh khi đang chạy chiến dịch.

**Chống gửi trùng.** Hệ thống message queue thường là **at-least-once** (bài 6): một tin có thể bị giao hai lần. Cách chặn:
- Mỗi thông báo có **`notification_id` ổn định** (sinh từ idempotency key).
- Trước khi gửi, worker thực hiện `SET dedup:{id} NX EX 86400` trên Redis; nếu khoá đã tồn tại thì bỏ qua.
- Với nhà cung cấp hỗ trợ, truyền luôn id đó làm khoá idempotent của họ.
- Biết rằng không cách nào đảm bảo "đúng một lần" tuyệt đối khi gọi hệ thống ngoài: chốt là **at-least-once + khử trùng** để thực tế gần đúng một lần.

**Retry có backoff.** Thử lại sau 1 s, 5 s, 30 s, 5 phút… có jitter (bài 17). Phân biệt lỗi tạm thời (timeout, 5xx, bị giới hạn tốc độ) với lỗi vĩnh viễn (token thiết bị đã gỡ, email không tồn tại): lỗi vĩnh viễn thì không retry và đánh dấu token/email để dọn.

**Tuỳ chọn và tuân thủ.** Lưu bảng `preferences(user_id, channel, type, enabled)`; email quảng bá phải có liên kết huỷ đăng ký (RFC 8058 mô tả huỷ đăng ký một chạm). Thông báo giao dịch/bảo mật có thể bỏ qua tuỳ chọn marketing nhưng không được bỏ qua yêu cầu pháp lý.

**Hẹn giờ.** Lưu vào bảng/sorted set theo thời điểm gửi; một bộ quét định kỳ đẩy các mục đến hạn vào hàng đợi. Với tin gửi theo múi giờ của người dùng, tính thời điểm UTC khi tạo.

**Theo dõi trạng thái.** Ghi chuỗi sự kiện `queued → sent → delivered → opened/failed` từ phản hồi nhà cung cấp và webhook. Dùng nhật ký chỉ-thêm (append-only) rồi tổng hợp bất đồng bộ.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Hàng đợi riêng theo kênh | Kênh chậm/lỗi không kéo kênh khác; scale độc lập | Nhiều thành phần hơn để vận hành |
| Hàng đợi riêng theo mức ưu tiên | OTP luôn nhanh | Cần cấu hình công bằng để bulk không bị đói vô hạn |
| At-least-once + khử trùng | Không mất tin, trùng rất hiếm | Cần kho khử trùng (Redis) và TTL hợp lý |
| At-most-once | Không bao giờ trùng | Có thể mất tin, không chấp nhận được với OTP |
| Retry mạnh | Tỉ lệ đến cao | Có thể dội nhà cung cấp, gửi trễ gây phiền |
| Mẫu nội dung dùng chung | Dễ đổi, dễ dịch | Phải quản lý phiên bản mẫu |
| Dùng nhà cung cấp ngoài | Nhanh làm, đã có hạ tầng | Phụ thuộc, tốn phí theo lượt, cần dự phòng nhà cung cấp thứ hai |

## Sai lầm hay gặp

- Một hàng đợi chung cho mọi loại: chiến dịch quảng bá chặn OTP.
- Gửi trong luồng request của người dùng (đồng bộ); nhà cung cấp chậm làm chậm cả ứng dụng.
- Không khử trùng: worker khởi động lại, người dùng nhận cùng tin nhiều lần.
- Retry vô hạn với token thiết bị đã chết, hoặc không retry khi lỗi chỉ là tạm thời.
- Quên tuỳ chọn người dùng và giờ yên lặng; gửi lúc 3 giờ sáng.
- Chỉ có một nhà cung cấp cho kênh sống còn (OTP), nhà cung cấp lỗi thì không ai đăng nhập được.
- Không theo dõi độ trễ hàng đợi và tỉ lệ thất bại theo kênh.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="case-notification" />

## Đọc thêm

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple: User Notifications](https://developer.apple.com/documentation/usernotifications)
- [Amazon SNS: tài liệu](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [RFC 8030: Web Push](https://www.rfc-editor.org/rfc/rfc8030)
- [RFC 8058: Huỷ đăng ký email một chạm](https://www.rfc-editor.org/rfc/rfc8058)

**Tiếp theo:** bài cuối của phần case study, tìm kiếm gợi ý khi gõ. Bài 29: [Thiết kế gợi ý tìm kiếm](./29-case-autocomplete.md).
