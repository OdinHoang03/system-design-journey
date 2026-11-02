---
id: sql-vs-nosql
title: "SQL vs NoSQL"
sidebar_position: 12
slug: /sql-vs-nosql
description: "Mô hình dữ liệu quan hệ, document, key-value, wide-column; ACID vs BASE; cách chọn database theo cách truy cập dữ liệu thay vì theo mốt."
---

> Chọn database theo cách bạn đọc và ghi dữ liệu, không theo tên gọi.

## Câu chuyện

NoteNest đã có replica và shard. Rồi nhóm sản phẩm xin thêm ba tính năng cùng lúc: gắn thẻ ghi chú, lưu lịch sử chỉnh sửa, và một bảng "hoạt động gần đây" nhận hàng chục nghìn sự kiện mỗi giây. Một đồng nghiệp rủ Minh: "Chuyển hết sang MongoDB đi, NoSQL scale hơn." Một người khác nói ngược lại: "Postgres làm được tất." Minh dừng lại hỏi một câu đáng giá hơn cả hai ý kiến: *dữ liệu này được truy cập như thế nào?* Bài này giúp bạn trả lời câu hỏi đó.

## Khái niệm sâu

### Bốn mô hình dữ liệu

![Bốn mô hình dữ liệu](/img/diagrams/sql-vs-nosql.svg)

*Hình tự vẽ cho dự án này; ý tưởng phân loại tham khảo từ [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), chương Data Models.*

- **Quan hệ (relational)**: dữ liệu nằm trong bảng, liên kết bằng khóa ngoại, truy vấn bằng SQL. Mạnh ở truy vấn linh hoạt, `JOIN`, ràng buộc toàn vẹn và giao dịch.
- **Document**: mỗi bản ghi là một tài liệu JSON lồng nhau. Một lần đọc lấy được cả ghi chú kèm thẻ và bình luận; hợp với dữ liệu có cấu trúc thay đổi theo từng bản ghi.
- **Key-value**: chỉ có `get/put/delete` theo khóa. Cực nhanh và dễ chia, nhưng không tìm theo giá trị.
- **Wide-column**: hàng được định danh bằng khóa, các cột sắp theo thứ tự (thường theo thời gian). Sinh ra cho lượng ghi khổng lồ, truy vấn theo khóa.

Còn có **graph** (quan hệ nhiều tầng như mạng xã hội) và **time-series** (số đo theo thời gian). Mỗi loại tối ưu một kiểu truy cập; không có loại nào tốt nhất cho mọi thứ.

### ACID và BASE

**ACID** là bộ bốn đảm bảo của giao dịch quan hệ:

- **Atomicity**: giao dịch xảy ra trọn vẹn hoặc không xảy ra gì.
- **Consistency**: giao dịch đưa dữ liệu từ trạng thái hợp lệ này sang trạng thái hợp lệ khác (các ràng buộc luôn đúng).
- **Isolation**: các giao dịch chạy đồng thời không thấy trạng thái dở dang của nhau (mức cô lập càng cao càng an toàn, càng chậm).
- **Durability**: đã commit thì không mất, kể cả khi máy sập.

**BASE** (*Basically Available, Soft state, Eventually consistent*) là cách nói ngắn gọn cho lựa chọn ngược lại ở nhiều hệ NoSQL: ưu tiên sẵn sàng và scale, chấp nhận dữ liệu tạm thời chưa đồng nhất giữa các bản sao. Đây là hai đầu của một dải, không phải hai phe: nhiều NoSQL hiện đại có giao dịch (document transaction, lightweight transaction), và nhiều SQL scale ngang được (Citus, Vitess, CockroachDB, Spanner).

### Chuẩn hoá hay phi chuẩn hoá

Trong mô hình quan hệ, ta **chuẩn hoá**: mỗi sự thật lưu một chỗ, ghép lại bằng `JOIN`. Trong document/wide-column, ta thường **phi chuẩn hoá**: nhét dữ liệu cần đọc cùng nhau vào chung một bản ghi để đọc một lần là xong, đổi lại cập nhật phải sửa nhiều nơi. Ví dụ ghi chú:

```sql
-- quan hệ: 3 bảng, ghép khi đọc
SELECT n.title, t.tag
FROM notes n JOIN note_tags t ON t.note_id = n.id
WHERE n.id = 42;
```

```json
// document: một lần đọc
{"_id": 42, "title": "Họp thứ hai", "tags": ["work", "weekly"]}
```

### Quy trình chọn

1. Liệt kê **truy vấn** chính (đọc theo khóa? theo dải? tìm kiếm? tổng hợp? cần `JOIN` không?).
2. Ước lượng **tải**: số đọc/ghi mỗi giây, kích thước dữ liệu, tỷ lệ đọc:ghi (bài Ước lượng quy mô sẽ hướng dẫn kỹ).
3. Xác định **đảm bảo cần có**: tiền, tồn kho, đặt chỗ cần giao dịch chặt; lượt xem, "đã đọc" thì chấp nhận trễ.
4. Mặc định chọn **một database quan hệ** cho dữ liệu cốt lõi. Chỉ thêm kho khác khi có lý do đo được.

Với NoteNest, Minh giữ Postgres cho người dùng, ghi chú, thẻ (cần ràng buộc và `JOIN`), dùng một kho wide-column cho luồng "hoạt động gần đây" (ghi nhiều, đọc theo `user_id` và thời gian), và Redis cho phiên đăng nhập. Đây gọi là **polyglot persistence**: mỗi loại dữ liệu một kho phù hợp.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Quan hệ + SQL | Truy vấn linh hoạt, `JOIN`, giao dịch ACID, hệ sinh thái trưởng thành | Scale ghi ngang phức tạp hơn; schema đổi cần migration |
| Document | Schema mềm, một lần đọc lấy cả cụm dữ liệu | `JOIN` và nhất quán đa tài liệu yếu hơn; dữ liệu trùng lặp |
| Key-value | Rất nhanh, rất dễ chia | Chỉ truy cập theo khóa |
| Wide-column | Ghi khối lượng lớn, chia dễ | Phải thiết kế bảng theo từng truy vấn; không `JOIN`, ít ad-hoc |
| Nhiều loại database | Mỗi dữ liệu một công cụ đúng | Nhiều thứ phải vận hành, dữ liệu đồng bộ giữa các kho |

## Sai lầm hay gặp

- Chọn NoSQL "vì scale" khi một Postgres có index tốt vẫn dư sức.
- Chọn NoSQL rồi mới phát hiện mình cần `JOIN` và giao dịch, tự viết lại chúng trong code ứng dụng.
- Coi "schemaless" là không có schema. Schema vẫn tồn tại, chỉ là nằm trong code của bạn và dễ lệch.
- Thiết kế bảng wide-column như bảng quan hệ, rồi truy vấn không theo khóa chính.
- Thêm một kho dữ liệu thứ ba, thứ tư mà không có ai chịu trách nhiệm đồng bộ và sao lưu.
- Chọn theo tên tuổi công ty lớn đang dùng thay vì theo truy vấn của chính mình.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="sql-vs-nosql" />

## Đọc thêm

- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 2 (Data Models) và 7 (Transactions)
- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [MongoDB: Data Modeling](https://www.mongodb.com/docs/manual/data-modeling/)
- [Apache Cassandra: Data Modeling](https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/intro.html)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục SQL vs NoSQL

**Tiếp theo:** chọn đúng kho dữ liệu rồi, truy vấn vẫn có thể chậm nếu dữ liệu được lưu sai cách. Bài 13: [Index & storage engine](./13-indexing-storage-engines.md).
