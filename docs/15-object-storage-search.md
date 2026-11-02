---
id: object-storage-search
title: "Object storage & tìm kiếm"
sidebar_position: 15
slug: /object-storage-search
description: "Lưu file lớn bằng object storage (kiểu S3), presigned URL, inverted index và full-text search: khi nào database thường không còn là chỗ phù hợp."
---

> File lớn thuộc về object storage; tìm văn bản thuộc về inverted index.

## Câu chuyện

Người dùng NoteNest bắt đầu đính kèm ảnh, PDF và bản ghi âm vào ghi chú. Minh lúc đầu lưu thẳng file vào cột `BLOB` của database; chỉ vài tuần sau, database phình lên hàng terabyte, sao lưu mất cả ngày, và replica luôn trễ vì phải sao chép các file khổng lồ. Cùng lúc, ô tìm kiếm nội dung ghi chú dùng `LIKE '%từ khóa%'` chạy mất cả chục giây và không biết "chạy" khớp với "chạy bộ". Hai vấn đề khác nhau, cùng một nguyên nhân: database quan hệ không sinh ra để làm hai việc này.

## Khái niệm sâu

### Object storage

**Object storage** (Amazon S3, Google Cloud Storage, Azure Blob, MinIO) lưu dữ liệu dạng **object** trong các **bucket**: mỗi object có một **key** (như đường dẫn `users/7/photo.jpg`), nội dung (byte) và vài **metadata**. Không có thư mục thật, không sửa một phần; muốn đổi thì ghi lại cả object. Đổi lại:

- **Rẻ và gần như vô hạn**: dữ liệu được chia thành nhiều phần, rải trên nhiều máy.
- **Bền rất cao** (S3 công bố 99,999999999%, "11 số chín"), nhờ **nhân bản** nhiều bản hoặc **erasure coding** (chia thành mảnh dữ liệu + mảnh chẵn lẻ, mất vài mảnh vẫn phục hồi được, tốn dung lượng ít hơn nhân bản).
- **API đơn giản qua HTTP**: `PUT`, `GET`, `DELETE`, liệt kê theo tiền tố.

Mô hình đúng là: **file ở object storage, database chỉ giữ metadata** (tên, kích thước, chủ sở hữu, object key).

![Object storage và inverted index](/img/diagrams/object-storage-search.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [tài liệu Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) và [Elasticsearch: Inverted index](https://www.elastic.co/docs/manage-data/data-store/index-basics).*

### Upload file lớn đúng cách

Đừng cho file đi qua server ứng dụng. Server cấp một **presigned URL** (URL có chữ ký, hết hạn sau vài phút, chỉ cho phép một thao tác trên một key), client `PUT` thẳng lên object storage. Server ứng dụng chỉ xử lý request nhỏ. Với file lớn, dùng **multipart upload**: chia file thành phần vài chục MB, tải song song, thử lại riêng từng phần rồi ghép. Để phục vụ download nhanh, đặt **CDN** (bài 2) phía trước bucket.

Vài điểm cần nhớ: đặt tên key có tiền tố phân bố đều nếu nhà cung cấp cần; bật **versioning** để chống xóa nhầm; dùng **lifecycle rule** chuyển dữ liệu nguội sang lớp lưu trữ rẻ hơn; mặc định để bucket **riêng tư**.

### Vì sao `LIKE` không đủ cho tìm kiếm

`LIKE '%abc%'` không dùng được index thông thường nên phải quét toàn bảng. Nó cũng không hiểu ngôn ngữ: không có dạng gốc của từ, không xếp hạng độ liên quan, không sửa lỗi chính tả.

### Inverted index

**Inverted index** (chỉ mục đảo) đảo chiều "tài liệu → từ" thành "từ → danh sách tài liệu chứa nó" (**postings list**), như mục lục tra cứu ở cuối sách.

1. **Phân tích (analyze)**: tách văn bản thành **token**, chuyển về chữ thường, bỏ stop word, đưa về **dạng gốc (stemming)** để "chạy", "đang chạy" khớp nhau.
2. **Lập chỉ mục**: với mỗi token, lưu danh sách ID tài liệu (và vị trí, tần suất).
3. **Truy vấn**: tra từng token rồi **giao** (AND) hoặc **hợp** (OR) các danh sách. "cache AND queue" ra giao của hai danh sách.
4. **Xếp hạng**: chấm điểm độ liên quan, kinh điển là **TF-IDF**/**BM25** (từ xuất hiện nhiều trong tài liệu này nhưng hiếm trong toàn bộ kho thì có điểm cao).

Các hệ như Elasticsearch/OpenSearch, Apache Solr, Meilisearch, và tính năng full-text của PostgreSQL (`tsvector` + GIN index) đều dựa trên ý tưởng này. Khi dữ liệu lớn, chỉ mục được **chia shard** (mỗi shard giữ một phần tài liệu, truy vấn gửi tới mọi shard rồi gộp kết quả) và **nhân bản** để chịu lỗi và tăng đọc, y như bài 5.

### Giữ chỉ mục đồng bộ với database

Kho tìm kiếm là **bản sao dẫn xuất**, không phải nguồn sự thật. Mô hình thường dùng: ghi vào database chính, rồi đẩy sự kiện qua **message queue** (bài 6) hoặc **change data capture (CDC)** để một consumer cập nhật chỉ mục. Hệ quả: tìm kiếm có độ trễ nhất quán (eventual, bài 14) và chỉ mục luôn có thể dựng lại từ database.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| File trong object storage | Rẻ, bền, scale gần vô hạn, giữ database nhỏ | Độ trễ cao hơn lưu cục bộ; không sửa từng phần; không truy vấn nội dung |
| File trong cột BLOB | Một chỗ, giao dịch chung với metadata | Database phình, sao lưu/replica nặng, tốn tiền đắt |
| Presigned URL | Server không phải chuyển tiếp byte | Phải quản lý hạn dùng, kiểm tra quyền khi cấp URL |
| Inverted index / search engine | Tìm nhanh, xếp hạng, hiểu ngôn ngữ | Thêm hệ thống phải vận hành; dữ liệu trễ so với database |
| Full-text trong chính database | Ít thành phần, nhất quán hơn | Kém tính năng và kém scale hơn search engine chuyên dụng |

## Sai lầm hay gặp

- Nhét file vào database, hoặc cho file đi vòng qua server ứng dụng.
- Để bucket công khai nhầm; ảnh riêng tư lộ ra Internet.
- Presigned URL hết hạn quá lâu hoặc không giới hạn loại/kích thước file.
- Coi search engine là nguồn sự thật chính, rồi mất dữ liệu khi chỉ mục hỏng.
- Quên rằng object storage là eventual hoặc strong tùy nhà cung cấp và thời điểm; đọc tài liệu về mô hình nhất quán thay vì giả định.
- Dùng `LIKE '%x%'` cho tìm kiếm văn bản trên bảng hàng triệu dòng.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="object-storage-search" />

## Đọc thêm

- [Amazon S3: tài liệu](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html), mục presigned URL và multipart upload
- [Elasticsearch Guide](https://www.elastic.co/guide/index.html), phần về mapping, analyzer và relevance
- [PostgreSQL: Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Wikipedia: Inverted index](https://en.wikipedia.org/wiki/Inverted_index) và [Okapi BM25](https://en.wikipedia.org/wiki/Okapi_BM25)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Hết lô Dữ liệu.** Phần tiếp theo là bất đồng bộ và độ tin cậy; xem toàn bộ kế hoạch ở [Đại cương](/outline) hoặc quay lại [Lộ trình](/roadmap).
