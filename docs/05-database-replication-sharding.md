---
id: database-replication-sharding
title: "Database: replication & sharding"
sidebar_position: 5
slug: /database-replication-sharding
description: "Nhân bản (replication) để đọc nhiều và chịu lỗi, chia dữ liệu (sharding) để ghi nhiều và lưu nhiều: đánh đổi, replication lag, chọn shard key."
---

> Database thành nút thắt cổ chai; nhân bản và chia nhỏ dữ liệu.

## Câu chuyện

Nhờ cache, NoteNest sống qua đợt truy cập lớn. Nhưng vài tháng sau, hai chuyện xảy ra cùng lúc: số ghi chú tăng lên hàng trăm triệu và lượng *ghi* tăng gấp nhiều lần. Một đêm, ổ đĩa của database chính hỏng. Dịch vụ ngừng 40 phút trong khi Minh khôi phục từ bản sao lưu, và mất luôn 10 phút dữ liệu cuối. Lúc đó Minh hiểu: database là phần **khó scale nhất** vì nó giữ trạng thái.

## Khái niệm sâu

### Bước 0: tối ưu trước khi chia

Trước khi nhân bản hay chia, hãy làm những việc rẻ hơn: thêm **index** đúng chỗ, sửa truy vấn chậm (`EXPLAIN`), dùng connection pool, cache (bài 4), nâng cấu hình máy. Nhiều hệ thống chạy tốt tới hàng chục nghìn truy vấn/giây trên một database được chăm kỹ.

### Replication: nhiều bản sao

![Primary–replica](/img/diagrams/db-replication.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0).*

Mô hình phổ biến nhất là **primary–replica** (leader–follower): mọi **ghi** đi vào primary, primary gửi nhật ký thay đổi cho các replica, và **đọc** được rải ra replica.

- Được: tăng khả năng đọc, có bản dự phòng (failover), có chỗ chạy báo cáo nặng mà không ảnh hưởng người dùng.
- Không giúp: tăng khả năng *ghi* (mọi ghi vẫn qua một primary) hay dung lượng (mỗi replica vẫn chứa đủ dữ liệu).

**Đồng bộ hay bất đồng bộ?**

| Kiểu | Cách chạy | Đánh đổi |
|---|---|---|
| Bất đồng bộ | Primary xác nhận ghi ngay, replica theo sau | Nhanh, nhưng replica có thể **trễ** (replication lag); nếu primary chết, có thể mất vài giao dịch cuối |
| Đồng bộ | Primary đợi replica xác nhận | Không mất dữ liệu đã xác nhận, nhưng ghi chậm hơn và một replica chết có thể làm kẹt ghi |
| Bán đồng bộ | Đợi ít nhất một replica | Dung hòa hai bên |

**Replication lag** gây ra lỗi khó chịu: Lan sửa ghi chú, tải lại trang, đọc từ replica chưa cập nhật và thấy bản cũ. Cách xử lý: *read-your-writes* (đọc từ primary trong vài giây sau khi người dùng vừa ghi), hoặc chỉ gửi những đọc chấp nhận được dữ liệu hơi cũ sang replica.

**Failover**: khi primary chết, một replica được **thăng cấp** thành primary mới. Cần phát hiện lỗi đáng tin cậy và tránh **split brain** (hai nút cùng tin mình là primary).

Ngoài primary–replica còn có **multi-leader** (nhiều nút nhận ghi, phải xử lý xung đột) và **leaderless** (kiểu Dynamo/Cassandra, đọc/ghi theo quorum).

### Sharding: chia dữ liệu

Khi một máy không còn chứa nổi dữ liệu hoặc không chịu nổi lượng ghi, ta **chia** dữ liệu thành nhiều **shard**, mỗi shard là một database riêng chứa một phần.

![Sharding](/img/diagrams/db-sharding.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), chương Partitioning.*

Quyết định then chốt là **shard key** (khóa chia):

| Cách chia | Ví dụ | Điểm mạnh | Điểm yếu |
|---|---|---|---|
| Theo dải (range) | `user_id` 1–1M ở shard 0 | Truy vấn theo dải hiệu quả | Dễ có **hot shard** (người dùng mới dồn vào shard cuối) |
| Theo hash | `hash(user_id) mod N` | Phân bố đều | Truy vấn theo dải phải hỏi mọi shard; đổi N làm dời gần hết dữ liệu |
| Consistent hashing | Vòng băm, mỗi shard giữ một cung | Thêm/bớt shard chỉ dời một phần dữ liệu | Phức tạp hơn; cần virtual node để cân bằng |
| Theo thư mục (directory) | Bảng tra "khóa → shard" | Linh hoạt nhất | Bảng tra là thành phần phải bảo vệ và scale |

Với NoteNest, `user_id` là shard key tự nhiên: hầu hết truy vấn chỉ liên quan đến một người dùng, nên nằm gọn trong một shard.

**Cái giá của sharding:**

- **Truy vấn xuyên shard** (join, tổng hợp toàn hệ thống) chậm và phức tạp.
- **Giao dịch xuyên shard** cần giao thức như two-phase commit hoặc saga; thường là nên tránh bằng cách thiết kế dữ liệu để giao dịch nằm trong một shard.
- **Resharding** (đổi số shard) là một dự án lớn.
- **Hot key**: một người dùng "nổi tiếng" làm một shard quá tải dù phân bố tổng thể đều.

Thực tế, mỗi shard lại có replica riêng; hai kỹ thuật bổ sung nhau.

### SQL hay NoSQL?

Không phải câu hỏi "cái nào scale tốt hơn" mà là "mô hình dữ liệu và truy vấn của bạn cần gì". Database quan hệ cho quan hệ, giao dịch, truy vấn linh hoạt. Nhiều hệ NoSQL (key-value, document, wide-column) hy sinh bớt tính năng để chia và nhân bản dễ hơn. Cả hai nhóm đều có thể replicate và shard.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Replication bất đồng bộ | Ghi nhanh, đọc scale | Replica trễ; có thể mất giao dịch cuối khi failover |
| Replication đồng bộ | An toàn dữ liệu | Ghi chậm, kém sẵn sàng |
| Sharding | Scale ghi và dung lượng | Truy vấn/giao dịch xuyên shard, vận hành phức tạp, resharding đau |
| Shard theo hash | Đều | Mất truy vấn dải |
| Shard theo dải | Truy vấn dải tốt | Hot shard |
| Chuẩn hoá (normalize) | Ít trùng lặp, nhất quán | Nhiều join, khó chia |
| Phi chuẩn hoá (denormalize) | Đọc nhanh, dễ chia | Cập nhật phải sửa nhiều chỗ |

## Sai lầm hay gặp

- Chia shard quá sớm khi chỉ cần thêm index và replica.
- Chọn shard key có cardinality thấp (ví dụ quốc gia) hoặc đơn điệu tăng (timestamp), gây hot shard.
- Gửi *mọi* đọc sang replica rồi gặp lỗi "vừa lưu xong lại không thấy".
- Dùng `hash mod N` rồi tăng N, khiến gần như mọi khóa đổi shard.
- Không kiểm thử failover; lần đầu chạy thật là lúc sự cố thật.
- Coi replication là backup. Lệnh `DROP TABLE` cũng được nhân bản. Vẫn cần sao lưu định kỳ và khôi phục thử.

## Bài tập & câu hỏi phỏng vấn

1. Thiết kế lược đồ cho NoteNest và chọn shard key. Truy vấn nào sẽ trở thành xuyên shard?
2. Giải thích replication lag và đưa ra hai cách để người dùng không thấy dữ liệu cũ sau khi vừa ghi.
3. Primary chết, replica 1 trễ 2 giây, replica 2 trễ 5 giây. Thăng cấp cái nào, và dữ liệu nào có thể mất?
4. So sánh `hash(key) mod N` và consistent hashing khi thêm một shard.
5. Làm sao xử lý một "hot user" có hàng chục triệu người theo dõi?
6. Khi nào bạn *không* nên shard?

## Đọc thêm

- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 5 (Replication) và 6 (Partitioning)
- [PostgreSQL: High availability, load balancing, and replication](https://www.postgresql.org/docs/current/high-availability.html)
- [MySQL: Replication](https://dev.mysql.com/doc/refman/8.4/en/replication.html)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Database

**Tiếp theo:** hệ thống đã lớn, nhưng có việc nặng không nên làm ngay trong request. Bài 6: [Message queue & xử lý bất đồng bộ](./06-message-queue.md).
