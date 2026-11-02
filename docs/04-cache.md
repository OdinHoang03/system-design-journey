---
id: cache
title: "Cache"
sidebar_position: 4
slug: /cache
description: "Cache giúp trả lời nhanh và giảm tải: cache-aside, write-through, TTL, eviction, invalidation, cache stampede."
---

> Cùng một câu hỏi được hỏi triệu lần; đừng trả lời lại từ đầu.

## Câu chuyện

Trang chủ NoteNest hiển thị "10 ghi chú nổi bật hôm nay". Mỗi lượt xem chạy một truy vấn tổng hợp nặng trên database, tốn 200 ms. Với 5.000 lượt xem mỗi giây, database quá tải dù kết quả truy vấn gần như *giống hệt nhau* trong cả giờ. Minh nhận ra: phần lớn công việc đang bị lặp lại vô ích.

## Khái niệm sâu

### Cache là gì và vì sao hiệu quả

**Cache** lưu kết quả của một công việc tốn kém ở nơi truy cập nhanh hơn. Hiệu quả nhờ:

- **Locality**: một phần nhỏ dữ liệu nhận phần lớn truy cập (quy luật 80/20).
- **Độ chênh tốc độ**: đọc RAM cỡ trăm nano-giây, đọc qua mạng từ cache cỡ dưới 1 ms, còn truy vấn database nặng có thể tới hàng chục hoặc hàng trăm ms.

Thước đo chính là **hit ratio** = hit / (hit + miss). Hit ratio 95% nghĩa là chỉ 5% request chạm database, giảm tải khoảng 20 lần.

### Cache nằm ở đâu

Từ gần người dùng đến gần dữ liệu:

1. **Trình duyệt** (`Cache-Control`).
2. **CDN** (bài 2).
3. **Cache trong tiến trình** (map trong bộ nhớ của app): nhanh nhất, nhưng mỗi server một bản riêng.
4. **Cache phân tán** (Redis, Memcached): dùng chung cho mọi server.
5. **Cache của database** (buffer pool, kết quả truy vấn).

### Các mẫu đọc/ghi

![Cache-aside](/img/diagrams/cache-aside.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Microsoft Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).*

| Mẫu | Cách chạy | Hợp với |
|---|---|---|
| **Cache-aside** | App hỏi cache; miss thì đọc DB rồi tự ghi vào cache | Mặc định phổ biến, đọc nhiều |
| **Read-through** | Cache tự đọc DB khi miss | Muốn gọn code app |
| **Write-through** | Ghi vào cache và DB cùng lúc | Cần cache luôn mới; ghi chậm hơn |
| **Write-back** | Ghi vào cache, đẩy xuống DB sau | Ghi rất nhiều; chấp nhận rủi ro mất dữ liệu |

Đoạn mã cache-aside tối giản:

```python
def get_featured_notes():
    key = "featured:v1"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)          # hit
    notes = db.query_featured()            # miss: việc tốn kém
    redis.set(key, json.dumps(notes), ex=300)  # TTL 5 phút
    return notes
```

### Hết hạn và loại bỏ

- **TTL**: mỗi mục tự hết hạn sau N giây; đơn giản và an toàn nhất.
- **Eviction** khi cache đầy: **LRU** (bỏ mục lâu không dùng), **LFU** (bỏ mục ít dùng), FIFO.

### Làm mất hiệu lực (invalidation)

> Chỉ có hai việc khó trong khoa học máy tính: invalidation cache và đặt tên. (Câu đùa quen thuộc, thường gán cho Phil Karlton.)

Ghi chú vừa được sửa, nhưng cache còn bản cũ. Các cách xử lý: để TTL tự hết; **xoá khóa khi ghi** (`DEL` sau khi cập nhật DB); đưa **phiên bản vào khóa** (`featured:v2`); hoặc phát sự kiện thay đổi để các cache tự xoá.

### Ba căn bệnh kinh điển

- **Cache stampede (thundering herd)**: một khóa nóng hết hạn, hàng nghìn request cùng miss và đổ vào database. Cách trị: khoá chống trùng (chỉ một request tính lại), TTL ngẫu nhiên (jitter), làm mới sớm, `stale-while-revalidate`.
- **Cache penetration**: truy vấn khóa *không tồn tại* nên luôn miss. Cách trị: cache cả kết quả rỗng với TTL ngắn, hoặc Bloom filter.
- **Cache avalanche**: nhiều khóa cùng hết hạn một lúc hoặc cache sập. Cách trị: TTL có jitter, cache nhân bản, giới hạn tốc độ vào database.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Có cache | Nhanh, giảm tải DB | Dữ liệu có thể cũ; thêm thành phần để vận hành |
| TTL dài | Hit ratio cao | Dữ liệu cũ lâu |
| TTL ngắn | Dữ liệu mới hơn | Hit ratio thấp, tải DB cao |
| Write-through | Cache nhất quán với DB | Ghi chậm hơn, ghi cả những dữ liệu không ai đọc |
| Write-back | Ghi cực nhanh | Có thể mất dữ liệu nếu cache sập trước khi đẩy xuống DB |
| Cache trong tiến trình | Nhanh nhất | Mỗi server một bản; mất đồng bộ giữa các server |
| Redis dùng chung | Mọi server thấy cùng dữ liệu | Thêm một lần gọi mạng; cache trở thành thành phần quan trọng |

## Sai lầm hay gặp

- Cache trước khi đo: không biết truy vấn nào chậm, cache nhầm chỗ.
- Không đặt TTL; dữ liệu cũ sống mãi và bộ nhớ đầy.
- Dùng cache như nơi lưu dữ liệu duy nhất. Cache có thể mất bất kỳ lúc nào; DB mới là nguồn sự thật.
- Cache dữ liệu theo người dùng vào khóa chung (thiếu `user_id` trong khóa), người này thấy dữ liệu người kia.
- Không theo dõi hit ratio và độ trễ; không biết cache đang giúp hay chỉ làm hệ thống phức tạp thêm.
- Khởi động lại cache rỗng giữa giờ cao điểm, cả đàn request đổ về database ("cache lạnh").

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="cache" />

## Đọc thêm

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111)
- [Redis: tài liệu](https://redis.io/docs/latest/)
- [Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Cache

**Tiếp theo:** cache giúp đọc, nhưng dữ liệu lớn dần và ghi nhiều hơn. Bài 5: [Database: replication & sharding](./05-database-replication-sharding.md).
