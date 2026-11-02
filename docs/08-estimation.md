---
id: estimation
title: "Ước lượng quy mô (back-of-envelope)"
sidebar_position: 8
slug: /estimation
description: "Ước lượng nhanh QPS, băng thông, dung lượng lưu trữ và các con số độ trễ cần thuộc để quyết định thiết kế."
---

> Trước khi vẽ kiến trúc, hãy biết mình đang đo bằng mét hay bằng kilômét.

## Câu chuyện

NoteNest có 1 triệu người dùng hoạt động mỗi ngày. Minh định mua một cụm database "cho chắc". Chị Lan, người bạn làm hạ tầng, hỏi ba câu: *mỗi giây có bao nhiêu request? mỗi năm dữ liệu nặng bao nhiêu? bao nhiêu băng thông ra ngoài?* Minh chưa trả lời được câu nào. Mười phút tính nhẩm sau, hoá ra chỉ cần vài trăm QPS và vài trăm GB mỗi năm: một server vừa đủ, không cần cụm. Ngược lại, phần ảnh mới là thứ ngốn băng thông. Con số đổi cả quyết định.

## Khái niệm sâu

### Vì sao ước lượng

Ước lượng không cần chính xác; cần đúng **bậc độ lớn** (10 hay 10.000?). Nó giúp trả lời: một máy có chịu nổi không, cần cache không, có phải shard không, phần nào là nút thắt.

### Chuỗi tính cơ bản

![Chuỗi ước lượng](/img/diagrams/estimation.svg)

*Hình tự vẽ cho dự án này.*

1. **DAU** (người dùng hoạt động mỗi ngày) × số thao tác mỗi người mỗi ngày = request mỗi ngày.
2. Chia cho **86.400** giây (làm tròn thành ~100.000 để tính nhẩm) = **QPS trung bình**.
3. Nhân **hệ số đỉnh** (thường 2–10 lần, tuỳ lưu lượng có dồn vào giờ cao điểm không) = **QPS đỉnh**. Thiết kế theo đỉnh, không theo trung bình.
4. QPS ghi × kích thước bản ghi × số ngày giữ = **dung lượng lưu trữ**. Nhân thêm hệ số nhân bản (thường 3).
5. QPS × kích thước phản hồi = **băng thông**.

Ví dụ NoteNest: 1 triệu DAU × 10 lượt đọc + 1 lượt ghi mỗi ngày.

| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Đọc mỗi ngày | 1M × 10 | 10 triệu |
| QPS đọc trung bình | 10M ÷ ~10⁵ | ~100 |
| QPS đọc đỉnh | × 5 | ~500 |
| QPS ghi trung bình | 1M ÷ ~10⁵ | ~10 |
| Dữ liệu mới mỗi ngày | 1M × 2 KB | ~2 GB |
| Dữ liệu mỗi năm | 2 GB × 365 | ~730 GB (×3 nhân bản ≈ 2,2 TB) |

Một server thông thường xử lý được hàng nghìn QPS đơn giản; 500 QPS đọc chưa cần cụm.

### Những con số nên thuộc

| Thao tác | Độ lớn xấp xỉ |
|---|---|
| Đọc bộ nhớ (RAM) | ~100 ns |
| Đọc 1 MB tuần tự từ RAM | ~10–50 µs |
| Đọc ngẫu nhiên từ SSD | ~100 µs |
| Một vòng trong cùng data center | ~0,5 ms |
| Đọc 1 MB tuần tự từ SSD | ~0,1–1 ms |
| Seek ổ đĩa quay (HDD) | ~5–10 ms |
| Gói tin Việt Nam ↔ Mỹ | ~150–250 ms |

Đây là bậc độ lớn, không phải thông số của một phần cứng cụ thể. Bài học: RAM nhanh hơn đĩa hàng trăm đến hàng nghìn lần; một vòng mạng liên vùng đắt gấp hàng trăm lần một vòng trong data center; vì vậy cache (bài 4) và CDN (bài 2) có ích.

Các lũy thừa cần nhớ: 2¹⁰ ≈ 10³ (KB), 2²⁰ ≈ 10⁶ (MB), 2³⁰ ≈ 10⁹ (GB), 2⁴⁰ ≈ 10¹² (TB). Một ngày ≈ 10⁵ giây; một tháng ≈ 2,5×10⁶ giây; một năm ≈ 3×10⁷ giây.

### Cách làm khi phỏng vấn

- Nói to giả định (DAU, tỉ lệ đọc/ghi, kích thước bản ghi) và hỏi người phỏng vấn có đồng ý không.
- Làm tròn mạnh tay: 86.400 ≈ 10⁵, 1,2 ≈ 1.
- Ghi đơn vị ở mỗi bước, tránh nhầm byte với bit, MB với MiB.
- Kết thúc bằng **kết luận thiết kế**: "~500 QPS đọc đỉnh nên một server cộng cache là đủ, nhưng 730 GB/năm nghĩa là cần kế hoạch lưu trữ".

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Làm tròn mạnh | Tính nhanh, nhẩm được | Sai số vài chục phần trăm |
| Tính theo trung bình | Số nhỏ, đẹp | Sập vào giờ cao điểm |
| Tính theo đỉnh | An toàn | Tốn tài nguyên khi chạy nhàn rỗi (có thể bù bằng autoscaling) |
| Dự trù dư nhiều (10× về sau) | Ít phải đổi kiến trúc | Chi phí và độ phức tạp đến sớm |
| Đo thật rồi mới quyết | Chính xác | Cần có hệ thống chạy; không dùng được ở bước thiết kế ban đầu |

## Sai lầm hay gặp

- Quên hệ số đỉnh: lưu lượng không trải đều 24 giờ.
- Quên nhân bản và chỉ mục: dữ liệu thực tế lớn hơn dữ liệu thô vài lần.
- Nhầm đơn vị: bit với byte, Mbps với MB/s.
- Tính trung bình mà bỏ qua đuôi (p99), trong khi người dùng cảm nhận độ trễ ở đuôi.
- Ước lượng xong rồi để đó, không đối chiếu với số đo thực khi hệ thống chạy.
- Tối ưu quá sớm theo một con số chưa kiểm chứng.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="estimation" />

## Đọc thêm

- [Latency numbers every programmer should know (bản gốc của Jeff Dean, tổng hợp bởi Colin Scott)](https://colin-scott.github.io/personal_website/research/interactive_latency.html)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Back-of-the-envelope
- [Google SRE Book: Handling overload](https://sre.google/sre-book/handling-overload/)

**Tiếp theo:** biết quy mô rồi thì thiết kế cách các thành phần nói chuyện với nhau. Bài 9: [Thiết kế API](./09-api-design.md).
