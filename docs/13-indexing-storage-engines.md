---
id: indexing-storage-engines
title: "Index & storage engine"
sidebar_position: 13
slug: /indexing-storage-engines
description: "Index hoạt động ra sao, B-tree vs LSM-tree, composite index, write amplification: vì sao có database đọc nhanh và có database ghi nhanh."
---

> Index đổi chi phí ghi lấy tốc độ đọc; storage engine quyết định đổi theo cách nào.

## Câu chuyện

Tính năng tìm ghi chú theo tiêu đề của NoteNest chạy mượt với 10 nghìn ghi chú. Ở 200 triệu ghi chú, mỗi lần tìm mất 8 giây. Minh mở `EXPLAIN` và thấy dòng đáng sợ: `Seq Scan`, tức database đọc *từng hàng* của bảng. Thêm một index, truy vấn xuống còn 3 ms. Nhưng một tuần sau, luồng "hoạt động gần đây" với hàng chục nghìn ghi mỗi giây lại làm database nghẹt vì... quá nhiều index. Bài này giải thích hai mặt của đồng xu đó.

## Khái niệm sâu

### Index là gì

Không có index, tìm một giá trị phải **quét toàn bảng** (độ phức tạp O(n)). **Index** là một cấu trúc phụ lưu các giá trị của cột theo thứ tự cùng con trỏ tới hàng thật, giống mục lục cuối sách. Tra index mất O(log n), nhưng mỗi lần ghi phải cập nhật cả bảng lẫn mọi index của nó.

```sql
CREATE INDEX idx_notes_user_created ON notes (user_id, created_at DESC);

EXPLAIN SELECT * FROM notes
WHERE user_id = 7 ORDER BY created_at DESC LIMIT 20;
-- Index Scan using idx_notes_user_created
```

### Dùng index đúng cách

- **Composite index** `(user_id, created_at)` phục vụ được truy vấn theo `user_id`, hoặc `user_id` + `created_at`, nhưng *không* phục vụ truy vấn chỉ theo `created_at` (quy tắc **leftmost prefix**: thứ tự cột quan trọng).
- **Covering index**: index chứa đủ cột truy vấn cần, không phải quay lại đọc bảng.
- **Độ chọn lọc (selectivity)**: index trên cột chỉ có vài giá trị (ví dụ `is_deleted`) hầu như vô dụng. Index trên `email` thì rất tốt.
- **Index không cứu được** `WHERE LOWER(title) = 'x'` hay `LIKE '%abc'` (khớp ở giữa/cuối chuỗi) nếu index không được tạo cho đúng biểu thức đó.
- Mỗi index tốn **dung lượng** và làm **ghi chậm hơn**. Hãy đo bằng `EXPLAIN` và bỏ index không dùng.

### Hai họ storage engine

![B-tree và LSM-tree](/img/diagrams/btree-vs-lsm.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), chương Storage and Retrieval.*

**B-tree** (PostgreSQL, MySQL/InnoDB, hầu hết database quan hệ): dữ liệu chia thành các **trang** cố định (thường 4–16 KB) tổ chức thành cây thấp và rộng. Ghi là **sửa trang tại chỗ**; để an toàn khi sập máy, ghi thêm vào **WAL** (write-ahead log) trước. Đọc rất đều và dự đoán được: vài bước nhảy trang là tới nơi.

**LSM-tree** (Cassandra, RocksDB, LevelDB, HBase): ghi vào **memtable** trong RAM (kèm WAL để khỏi mất), khi đầy thì **flush** ra đĩa thành file đã sắp xếp bất biến gọi là **SSTable**. Nền tảng chạy **compaction** gộp các file lại, bỏ bản cũ. Ghi toàn là *ghi tuần tự*, rất nhanh. Đọc phải xem memtable rồi nhiều file; **Bloom filter** (cấu trúc xác suất cho biết "chắc chắn không có" hoặc "có thể có") giúp bỏ qua phần lớn file.

**Write amplification** (khuếch đại ghi): một lần ghi logic sinh ra nhiều lần ghi vật lý (trang + WAL ở B-tree; các lượt compaction ở LSM). Nó tiêu hao băng thông đĩa và tuổi thọ SSD, và là con số nên đo khi chọn engine.

### Chọn engine theo khối lượng công việc

Nguyên tắc ngón tay cái: B-tree hợp với tải *đọc nhiều, truy vấn theo dải, cần độ trễ ổn định*; LSM hợp với tải *ghi rất nhiều, dữ liệu theo thời gian, ghi nối thêm*. Cả hai đều có thể làm mọi việc, chỉ khác chi phí. Ngoài ra còn **hash index** (chỉ tra khớp chính xác), **index đảo ngược** (bài 15), và **column store** (lưu theo cột, tối ưu phân tích).

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Thêm index | Đọc/tìm nhanh hơn rất nhiều | Ghi chậm hơn, tốn dung lượng, planner có thể chọn sai |
| Composite index | Một index phục vụ nhiều truy vấn | Phụ thuộc thứ tự cột; to hơn |
| B-tree | Đọc nhanh, ổn định, truy vấn dải tốt | Ghi ngẫu nhiên (sửa tại chỗ), phân mảnh trang |
| LSM-tree | Ghi tuần tự rất nhanh, nén tốt | Đọc có thể chạm nhiều file; compaction gây đỉnh I/O và trễ đuôi |
| Hash index | Tra khớp chính xác rất nhanh | Không truy vấn dải, không sắp xếp |

## Sai lầm hay gặp

- Đoán mà không đo: không chạy `EXPLAIN` / `EXPLAIN ANALYZE` trước khi thêm index.
- Index trên mọi cột "cho chắc", rồi ghi chậm dần.
- Sai thứ tự cột trong composite index, nên truy vấn thật sự không dùng được nó.
- Bọc cột trong hàm (`WHERE DATE(created_at) = ...`) làm index mất tác dụng.
- Đưa tải ghi khổng lồ vào kho B-tree rồi ngạc nhiên vì I/O; hoặc dùng LSM cho tải đọc dải nặng mà không điều chỉnh compaction.
- Thêm index trên bảng lớn đang chạy mà không dùng chế độ tạo không khóa (ví dụ `CREATE INDEX CONCURRENTLY` của PostgreSQL), làm khóa ghi cả bảng.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="indexing-storage-engines" />

## Đọc thêm

- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 3 (Storage and Retrieval)
- [Use The Index, Luke](https://use-the-index-luke.com/): hướng dẫn index SQL miễn phí
- [PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [RocksDB Wiki: Overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Database

**Tiếp theo:** khi dữ liệu nằm trên nhiều máy, "đọc thấy gì" trở thành câu hỏi khó. Bài 14: [Nhất quán & CAP](./14-consistency-cap.md).
