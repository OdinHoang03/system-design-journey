---
id: event-streaming
title: "Event streaming (Kafka)"
sidebar_position: 16
slug: /event-streaming
description: "Log append-only, partition, offset, consumer group, retention, compaction, replay: khi sự kiện là dữ liệu có thể đọc lại."
---

> Đừng vứt sự kiện đi sau khi xử lý: giữ lại, và ai cần thì đọc.

## Câu chuyện

NoteNest đã có queue, và nó chạy tốt: mỗi job có một worker xử lý rồi biến mất. Nhưng giờ Minh có thêm nhiều yêu cầu. Nhóm tìm kiếm muốn nghe mọi sự kiện "ghi chú được sửa" để cập nhật index. Nhóm thống kê cũng muốn đúng những sự kiện đó. Tuần trước nhóm gợi ý phát hiện bug, cần chạy lại dữ liệu của ba ngày qua. Với queue, message đã ack là mất; muốn nhiều bên cùng nghe thì phải nhân bản queue; muốn chạy lại thì... hết cách.

Minh đổi cách nghĩ: sự kiện không phải "việc cần làm rồi bỏ" mà là **sự thật đã xảy ra**, nên ghi lại thành một cuốn sổ nối dài. Ai cần thì cầm một cái bookmark và đọc từ chỗ mình muốn.

## Khái niệm sâu

### Log: cuốn sổ chỉ ghi thêm

![Event streaming](/img/diagrams/event-streaming.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Apache Kafka: Introduction](https://kafka.apache.org/intro).*

- **Log append-only**: sự kiện chỉ được ghi nối vào cuối, không sửa giữa chừng. Mỗi sự kiện có một số thứ tự gọi là **offset**.
- **Topic** là một luồng sự kiện cùng loại (`note.updated`). Nó được chia thành nhiều **partition**, mỗi partition là một log riêng.
- **Consumer** tự nhớ offset đã đọc tới đâu. Queue truyền thống xoá message khi ack; log thì giữ nguyên, chỉ dời bookmark.

### Partition và thứ tự

Chia partition để ghi và đọc song song, vượt giới hạn một máy. Cái giá: thứ tự chỉ được đảm bảo **trong một partition**, không phải toàn topic. Producer chọn partition bằng **key** (ví dụ `note_id`): cùng key luôn vào cùng partition, nên các sự kiện của một ghi chú vẫn đúng thứ tự, còn các ghi chú khác nhau được xử lý song song.

### Consumer group

Một **consumer group** là một nhóm worker cùng chia nhau đọc topic: mỗi partition chỉ do một consumer trong nhóm đọc tại một thời điểm. Thêm consumer thì tăng song song, nhưng chỉ tới số partition (thừa consumer thì ngồi chơi). Các nhóm khác nhau (`search`, `stats`) đọc **độc lập**, mỗi nhóm có offset riêng. Đây là chỗ khác biệt lớn với queue: một sự kiện, nhiều bên dùng, không ảnh hưởng nhau.

### Giữ bao lâu: retention và compaction

- **Retention theo thời gian/dung lượng**: giữ 7 ngày hoặc 1 TB rồi xoá đoạn cũ nhất.
- **Log compaction**: với mỗi key chỉ giữ giá trị mới nhất. Hợp để lưu "trạng thái hiện tại" (cấu hình, hồ sơ người dùng) thay vì toàn bộ lịch sử.

### Replay: đọc lại quá khứ

Vì log còn đó, consumer chỉ cần dời offset về trước để xử lý lại: sửa bug xong chạy lại ba ngày dữ liệu, dựng index mới, hoặc cho một dịch vụ mới "bắt kịp" từ đầu. Đây là sức mạnh chính của event streaming. Điều kiện: xử lý phải idempotent, vì cùng sự kiện có thể được đọc nhiều lần (xem bài [Message queue](./06-message-queue.md)).

### Độ bền: replication và ISR

Mỗi partition có một **leader** nhận ghi và vài **follower** sao chép. Tập follower đang theo kịp gọi là **ISR** (in-sync replicas). Producer đặt `acks=all` thì chỉ coi là ghi xong khi cả ISR đã nhận: chậm hơn một chút, nhưng một broker chết không làm mất sự kiện. Leader chết thì một replica trong ISR được bầu lên (cơ chế bầu chọn xem bài [Đồng thuận](./19-consensus.md)).

### Chọn số partition và hot key

Số partition quyết định mức song song tối đa và khó giảm sau này; thêm partition cũng làm đổi ánh xạ key, nên thứ tự theo key bị xáo. Ước lượng theo thông lượng cần đạt chia cho tốc độ một consumer, rồi chừa dư. **Hot key** (một key chiếm phần lớn lưu lượng, như một tài khoản "nổi tiếng") dồn hết vào một partition và làm nó nghẽn; cách chữa là thêm hậu tố ngẫu nhiên vào key, đánh đổi là mất thứ tự chặt cho key đó.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Log thay queue | Nhiều nhóm đọc độc lập, replay, thông lượng lớn | Vận hành nặng hơn; không có ack/retry từng message sẵn có |
| Nhiều partition | Song song cao | Thứ tự chỉ trong partition; khó đổi sau |
| Retention dài | Replay xa, an toàn | Tốn đĩa |
| Compaction | Gọn, giữ trạng thái mới nhất | Mất lịch sử trung gian |
| `acks=all` | Không mất dữ liệu khi broker chết | Độ trễ ghi cao hơn |
| Key theo thực thể | Đúng thứ tự theo thực thể | Nguy cơ hot key |

## Sai lầm hay gặp

- Dùng Kafka cho vài job nhỏ mỗi ngày: queue đơn giản là đủ.
- Tưởng thứ tự là toàn cục; thực tế chỉ có trong một partition.
- Không đặt key, nên sự kiện của cùng một thực thể rơi vào partition khác nhau và đến sai thứ tự.
- Số consumer nhiều hơn số partition: phần dư không làm gì.
- Consumer không idempotent rồi replay: dữ liệu bị cộng trùng.
- Không theo dõi **consumer lag** (độ chênh giữa offset mới nhất và offset đã đọc); consumer tụt hậu mà không ai biết.
- Đặt retention ngắn hơn thời gian cần để sửa sự cố, nên khi cần replay thì dữ liệu đã bị xoá.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="event-streaming" />

## Đọc thêm

- [Apache Kafka: Introduction](https://kafka.apache.org/intro)
- [Apache Kafka: Documentation, Design](https://kafka.apache.org/documentation/#design)
- [Jay Kreps: The Log, what every software engineer should know](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- [Confluent: Kafka 101](https://developer.confluent.io/courses/apache-kafka/events/)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 11 (Stream Processing)

**Tiếp theo:** sự kiện chảy khắp nơi thì lỗi cũng lan khắp nơi. Bài 17: [Mẫu thiết kế chịu lỗi](./17-reliability-patterns.md).
