---
id: case-chat
title: "Case study: thiết kế hệ thống chat"
sidebar_position: 26
slug: /case-chat
description: "Thiết kế chat thời gian thực: WebSocket, định tuyến tin nhắn giữa nhiều server, thứ tự và chống trùng, online presence, lưu trữ lịch sử."
---

> Tin nhắn phải đến nhanh, đúng thứ tự, và không bao giờ mất.

## Câu chuyện

Người dùng NoteNest muốn bàn bạc ngay trên ghi chú chung. Minh thêm tính năng chat: nhắn 1-1 và nhóm nhỏ. Bản đầu chỉ là một trang gọi `GET /messages` mỗi 2 giây (polling). Với 100.000 người đang mở, đó là 50.000 request mỗi giây, gần như toàn là câu trả lời "không có gì mới", mà tin nhắn vẫn trễ tới 2 giây. Anh cần một kết nối luôn mở để server *đẩy* tin tới người nhận.

## Khái niệm sâu

### 1. Yêu cầu

**Chức năng:** chat 1-1 và nhóm (tới ~100 người); gửi/nhận thời gian thực; xem lịch sử; trạng thái online; đồng bộ nhiều thiết bị; (tuỳ chọn) đã đọc.

**Phi chức năng:** độ trễ thấp (dưới ~200 ms), **không mất tin**, thứ tự nhất quán trong một cuộc trò chuyện, chịu được người dùng mất mạng chập chờn.

**Ngoài phạm vi:** gọi thoại/video, mã hoá đầu cuối.

### 2. Ước lượng (làm tròn, xem bài 8)

- 10 triệu DAU, mỗi người gửi 40 tin/ngày = 400 triệu tin/ngày ≈ **4.600 tin/giây**, đỉnh ~5 lần ≈ **25.000/giây**.
- Mỗi tin ~100 byte + metadata ⇒ 400M × 100 B ≈ **40 GB/ngày**, ≈ **15 TB/năm** (chưa kể nhân bản).
- Kết nối: 10% DAU online cùng lúc = **1 triệu kết nối mở**. Một server chịu khoảng 50.000–100.000 kết nối nhàn rỗi ⇒ cần **~20 server chat**.

Kết luận: tải *ghi* vừa phải, nhưng **số kết nối giữ lâu** mới là thứ quyết định kiến trúc.

### 3. Chọn giao thức

| Cách | Ý tưởng | Nhược |
|---|---|---|
| **Polling** | Client hỏi định kỳ | Tốn request, trễ |
| **Long polling** | Server giữ request tới khi có tin | Tạo lại kết nối liên tục; khó cân bằng tải |
| **WebSocket** | Một kết nối TCP hai chiều, giữ lâu | Có trạng thái: phải biết user đang nối vào server nào |
| **SSE** | Server đẩy một chiều qua HTTP | Chiều gửi vẫn cần request riêng |

Chat chọn **WebSocket** cho kết nối thời gian thực, còn thao tác không cần real-time (đăng nhập, tải lịch sử, tải file) vẫn qua API HTTP thông thường (bài 9).

### 4. Thiết kế tổng thể

![Hệ thống chat](/img/diagrams/case-chat.svg)

*Hình tự vẽ cho dự án này.*

Luồng khi Alice gửi tin cho Bob:

1. Alice gửi qua WebSocket tới **chat server A**, kèm `client_msg_id` do app sinh.
2. Server A **lưu tin vào message store** trước, rồi mới xác nhận (ack) cho Alice. Lưu trước, giao sau: nếu server sập giữa chừng thì tin không mất.
3. Server A tra **registry** (thường là Redis: `user → server`) xem Bob đang nối vào server nào.
4. Nếu Bob nối vào server B, A chuyển tin qua kênh nội bộ (pub/sub hoặc gọi trực tiếp) cho B; B đẩy xuống WebSocket của Bob.
5. Nếu Bob offline, tin nằm sẵn trong store; gửi **push notification** (bài 28), và khi Bob online lại, app đồng bộ phần còn thiếu.

Chat server **không giữ dữ liệu bền**; chỉ giữ kết nối. Nhờ vậy mất một server chỉ làm client nối lại vào server khác.

### 5. Thứ tự và chống trùng

- **Thứ tự**: chỉ cần thứ tự *trong một cuộc trò chuyện*. Gán mỗi tin một `seq` tăng dần theo từng cuộc trò chuyện (bộ đếm trong store, hoặc ID kiểu Snowflake theo thời gian). Đừng dựa vào đồng hồ của client.
- **Chống trùng**: mạng chập chờn nên client gửi lại. Server dùng `client_msg_id` làm khoá chống trùng, giống idempotency key ở bài 9.
- **Đồng bộ**: client nhớ `seq` lớn nhất đã nhận, khi nối lại hỏi "cho tôi mọi tin sau `seq` này".
- **Ack**: tin có ba trạng thái rõ ràng: đã lưu, đã giao tới thiết bị, đã đọc. Đừng gộp chung.

### 6. Lưu trữ

Truy vấn chính luôn là "lấy N tin mới nhất của cuộc trò chuyện X" và "tin sau `seq` Y". Khoá phân vùng `chat_id`, sắp xếp theo `seq` hợp với kho kiểu wide-column (Cassandra, DynamoDB) hơn là một bảng SQL khổng lồ phải shard (bài 5, 12). Dữ liệu người dùng, nhóm, danh bạ vẫn để ở SQL.

### 7. Online presence

Server giữ **heartbeat** (client gửi mỗi ~5–30 giây). Quá hạn không thấy heartbeat thì coi là offline, vì đóng tab hay mất mạng không phải lúc nào cũng báo cho server. Ghi presence vào Redis với TTL. Đừng phát sự kiện "bạn của bạn vừa online/offline" cho tất cả; chỉ gửi cho người đang mở cuộc trò chuyện hoặc danh sách bạn đang xem, và với nhóm lớn thì kéo (pull) thay vì đẩy.

### 8. Chat nhóm

Nhóm nhỏ: lưu **một** bản tin theo `chat_id` rồi *fan-out* (đẩy) tới từng thành viên đang online. Nhóm lớn (hàng nghìn người): chỉ đẩy "có tin mới" và để client kéo, tương tự vấn đề người nổi tiếng ở bài 25.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| WebSocket | Độ trễ thấp, ít request thừa | Server có trạng thái, khó cân bằng tải, phải xử lý nối lại |
| Polling | Đơn giản, dễ scale | Tốn tải, trễ |
| Lưu trước rồi giao | Không mất tin | Thêm độ trễ ghi |
| Giao trước rồi lưu | Rất nhanh | Có thể mất tin nếu sập giữa chừng |
| Thứ tự theo từng cuộc trò chuyện | Rẻ, đủ dùng | Không có thứ tự toàn cục giữa các cuộc |
| Presence bằng heartbeat | Chịu được mất mạng đột ngột | Trạng thái trễ vài chục giây, tốn băng thông |
| Fan-out khi ghi (nhóm nhỏ) | Giao nhanh | Tốn với nhóm lớn |
| Kéo khi đọc (nhóm lớn) | Rẻ cho người gửi | Người nhận thấy tin chậm hơn |

## Sai lầm hay gặp

- Dùng đồng hồ client hoặc `NOW()` của nhiều server để sắp xếp tin; thứ tự lộn xộn.
- Xác nhận cho người gửi trước khi lưu, rồi sập: người gửi tưởng đã gửi, tin mất.
- Không có chống trùng; mạng yếu sinh ra tin hiển thị hai lần.
- Giữ trạng thái quan trọng trong bộ nhớ của chat server; deploy là mất.
- Phát presence cho toàn bộ danh bạ mỗi lần ai đó nối lại; bão sự kiện.
- Quên rằng khi deploy hàng loạt, cả triệu client nối lại cùng lúc (thundering herd); cần backoff có jitter khi nối lại.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="case-chat" />

## Đọc thêm

- [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455)
- [MDN: WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Discord: How Discord stores trillions of messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)
- [Slack Engineering: Real-time messaging](https://slack.engineering/real-time-messaging/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Tiếp theo:** chat đã chạy, nhưng người dùng còn muốn chia sẻ file và video. Bài 27: [Thiết kế lưu trữ file & video](./27-case-file-storage.md).
