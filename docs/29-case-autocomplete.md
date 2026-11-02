---
id: case-autocomplete
title: "Case study: thiết kế gợi ý tìm kiếm"
sidebar_position: 29
slug: /case-autocomplete
description: "Thiết kế gợi ý tìm kiếm khi gõ: trie lưu top-k, xếp hạng theo độ phổ biến, cập nhật gần thực, cache và độ trễ dưới 100 ms."
---

> Trả lời trước khi người dùng gõ xong câu hỏi.

## Câu chuyện

NoteNest có ô tìm kiếm ghi chú công khai. Người dùng gõ "nodejs ..." mà phải tự nhớ cả cụm; nhiều người bỏ cuộc. Minh muốn ô tìm kiếm **gợi ý ngay khi gõ**: gõ `no` hiện `notion`, `node js`, `note taking`. Nghe đơn giản, nhưng mỗi phím gõ là một request, nên 1 triệu người dùng gõ cùng lúc tạo ra lượng truy vấn khổng lồ, và mỗi gợi ý phải về trước khi người dùng gõ phím kế tiếp.

## Khái niệm sâu

### 1. Yêu cầu

**Chức năng:** nhập một **tiền tố**, trả về 5 gợi ý phổ biến nhất bắt đầu bằng tiền tố đó; hỗ trợ tiếng Việt có dấu và đa ngôn ngữ; (tuỳ chọn) cá nhân hoá, sửa lỗi chính tả.

**Phi chức năng:** **rất nhanh** (p99 dưới ~100 ms, vì gõ liên tục); sẵn sàng cao; gợi ý cập nhật theo xu hướng trong vài phút đến vài giờ (không cần tức thì); lọc nội dung phản cảm.

**Ngoài phạm vi:** tìm kiếm toàn văn (bài 15), xếp hạng kết quả tìm kiếm.

### 2. Ước lượng (xem bài 8)

- 10 triệu người dùng hoạt động/ngày, mỗi người 10 lượt tìm × trung bình 4 ký tự gõ có gửi request ⇒ 400 triệu request/ngày ≈ **5.000/giây**, đỉnh ~**25.000/giây**.
- 100 triệu truy vấn khác nhau, mỗi truy vấn ~30 byte ⇒ ≈ **3 GB** dữ liệu gốc; cây tiền tố lớn hơn vài lần nhưng vẫn **vừa trong RAM** của vài máy.

Kết luận: **đọc cực nhiều, dữ liệu nhỏ**; dữ liệu có thể nằm trong bộ nhớ, và cache phát huy rất mạnh.

### 3. API

```http
GET /api/v1/suggest?q=no&lang=vi&limit=5
→ 200 {"suggestions": ["notion", "node js", "note taking", "notebook", "nodemailer"]}
```

Trình duyệt chỉ gửi sau khi người dùng ngừng gõ ~100–150 ms (**debounce**), và huỷ request cũ khi có phím mới.

### 4. Thiết kế sơ bộ

![Gợi ý tìm kiếm](/img/diagrams/case-autocomplete.svg)

*Hình tự vẽ cho dự án này.*

Có hai đường tách biệt:

- **Đường phục vụ (đọc, nhanh):** trình duyệt → cache (tiền tố → top 5) → máy chủ trie. Phần lớn request trúng cache.
- **Đường dữ liệu (ghi, chậm):** nhật ký truy vấn → tổng hợp đếm → dựng trie mới → đưa lên các máy chủ trie.

Tách hai đường là điểm mấu chốt: không cập nhật trie theo từng truy vấn, nên đường đọc không bị ảnh hưởng.

### 5. Đào sâu

**Trie (cây tiền tố).** Mỗi cạnh là một ký tự; đường từ gốc đến một nút là một tiền tố. Tìm tiền tố dài `L` tốn `O(L)`, không phụ thuộc số truy vấn.

```text
        (gốc)
          n
          o
        /   \
       d     t
       e     e → "note" (880)
       js    book (310), taking (640)
```

Nếu mỗi lần phải duyệt cả cây con để tìm top 5, nút gần gốc (ví dụ `n`) có hàng triệu hậu duệ: quá chậm. Giải pháp: **lưu sẵn top-k tại mỗi nút** (5 gợi ý tốt nhất của cây con, kèm điểm). Khi đó tra cứu chỉ là đi `L` bước rồi đọc danh sách có sẵn: `O(L)`. Đổi lại tốn thêm bộ nhớ (nén bằng cách chỉ lưu id của truy vấn, và cắt các nhánh quá hiếm).

**Điểm xếp hạng.** Cơ bản là tần suất truy vấn trong một cửa sổ gần đây. Thực tế trộn thêm: độ mới (giảm trọng số theo thời gian, exponential decay), tỉ lệ người dùng thực sự bấm vào gợi ý, ngôn ngữ/vùng, và bộ lọc nội dung nhạy cảm (danh sách chặn áp dụng lúc dựng trie).

**Cập nhật gần thực.** Dựng lại toàn bộ trie mỗi vài phút đến vài giờ bằng một job riêng (batch) từ nhật ký truy vấn đã tổng hợp, rồi **thay thế nguyên khối** (blue/green, bài 22) để máy chủ luôn đọc một trie nhất quán. Với xu hướng nóng cần lên nhanh hơn, thêm một **lớp phủ (overlay)** nhỏ cập nhật theo luồng sự kiện (bài 16), trộn với kết quả trie lúc phục vụ.

**Cache.** Tiền tố ngắn (1–3 ký tự) có rất ít giá trị khác nhau và được hỏi cực nhiều, cache ở trình duyệt (`Cache-Control: max-age`), CDN và Redis (bài 2, 4). Chỉ riêng cache trình duyệt đã cắt phần lớn request lặp.

**Mở rộng quy mô.** Dữ liệu nhỏ nên mỗi máy có thể giữ **cả trie**; chỉ cần nhân bản và cân bằng tải (bài 3). Nếu dữ liệu lớn hơn RAM, **shard theo tiền tố** (ví dụ `a–f`, `g–m`…). Lưu ý phân bố lệch: chữ cái phổ biến nặng hơn hẳn, nên chia theo tải thực, không chia đều theo bảng chữ cái.

**Chi tiết khác.** Chuẩn hoá đầu vào (chữ thường, bỏ dấu tuỳ chọn, Unicode NFC), gợi ý cá nhân hoá (trộn lịch sử riêng với top chung), sửa lỗi chính tả bằng khoảng cách chỉnh sửa (edit distance).

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Lưu top-k tại mỗi nút | Tra cứu `O(L)`, rất nhanh | Tốn RAM; phải dựng lại khi điểm thay đổi |
| Duyệt cây con lúc truy vấn | Ít bộ nhớ hơn, luôn mới | Chậm với tiền tố ngắn |
| Dựng lại trie theo lô | Đơn giản, đọc không bị khoá | Gợi ý trễ vài phút đến vài giờ |
| Lớp phủ theo luồng | Bắt kịp xu hướng nóng | Thêm một đường dữ liệu phải vận hành |
| Cache mạnh ở trình duyệt/CDN | Giảm tải lớn, nhanh | Gợi ý có thể cũ vài phút |
| Mỗi máy giữ cả trie | Đơn giản, không gọi chéo | Giới hạn bởi RAM một máy |
| Shard theo tiền tố | Dữ liệu lớn tuỳ ý | Phân bố tải lệch; phức tạp hơn |
| Cá nhân hoá | Gợi ý liên quan hơn | Khó cache, thêm dữ liệu nhạy cảm cần bảo vệ |

## Sai lầm hay gặp

- Gửi request ở mỗi phím mà không debounce, không huỷ request cũ; backend bị dội, kết quả về sai thứ tự.
- Cập nhật trie trực tiếp theo từng truy vấn ở đường đọc; khoá và độ trễ tăng vọt.
- Không lưu top-k, duyệt cả cây con cho mỗi request.
- Không lọc nội dung nhạy cảm hay thông tin cá nhân lọt vào nhật ký truy vấn (ví dụ email, số điện thoại) rồi hiện thành gợi ý cho người khác.
- Chia shard đều theo bảng chữ cái, một shard (`s`, `t`, `n`...) chịu tải gấp nhiều lần.
- Quên chuẩn hoá Unicode, "Việt" gõ theo hai cách mã hoá cho hai kết quả khác nhau.
- Không đo độ trễ p99 từ phía người dùng, chỉ đo ở máy chủ.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="case-autocomplete" />

## Đọc thêm

- [Trie trên Wikipedia](https://en.wikipedia.org/wiki/Trie)
- [Autocomplete trên Wikipedia](https://en.wikipedia.org/wiki/Autocomplete)
- [Elasticsearch: Suggesters](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters.html)
- [Bloom filter trên Wikipedia](https://en.wikipedia.org/wiki/Bloom_filter) (lọc nhanh các truy vấn không có gợi ý)

**Hết phần case study và hết đợt bài này.** Xem toàn bộ hành trình ở [Đại cương](/outline).
