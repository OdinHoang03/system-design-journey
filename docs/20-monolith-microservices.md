---
id: monolith-microservices
title: "Monolith vs microservices"
sidebar_position: 20
slug: /monolith-microservices
description: "Khi nào tách dịch vụ và cái giá phải trả: modular monolith, ranh giới domain, database per service, distributed monolith, strangler fig."
---

> Tách dịch vụ giải quyết vấn đề của tổ chức trước, rồi mới tới vấn đề của máy.

## Câu chuyện

NoteNest giờ có 40 dev chia 6 nhóm, cùng làm trong một codebase. Mỗi lần deploy là một cuộc họp: nhóm Thanh toán sửa một dòng nhưng phải chờ nhóm Tìm kiếm sửa xong bug mới được phát hành. Một lỗi rò bộ nhớ ở module xuất PDF làm sập cả app, kể cả trang đăng nhập.

Có người đề nghị "tách hết thành microservice". Minh hỏi lại: tách để giải quyết vấn đề nào, và mình sẵn sàng trả giá gì?

## Khái niệm sâu

### Hai cực và điểm ở giữa

![Từ monolith sang microservices](/img/diagrams/monolith-microservices.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [microservices.io](https://microservices.io/) (Chris Richardson) và bài viết [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) của Martin Fowler.*

- **Monolith**: một đơn vị build và deploy. Gọi hàm trong cùng tiến trình, một database, giao dịch ACID sẵn có. Đơn giản, nhanh khi nhóm nhỏ.
- **Microservices**: nhiều dịch vụ nhỏ, mỗi cái deploy độc lập, sở hữu dữ liệu riêng, nói chuyện qua mạng.
- **Modular monolith**: vẫn một đơn vị deploy nhưng chia module có ranh giới rõ, chỉ gọi nhau qua giao diện công khai. Phần lớn đội nên bắt đầu và dừng ở đây rất lâu.

### Ranh giới theo domain, không theo tầng kỹ thuật

Cắt theo **bounded context** (miền nghiệp vụ): Ghi chú, Chia sẻ, Thanh toán, Tìm kiếm. Đừng cắt theo tầng ("service giao diện", "service logic", "service dữ liệu"): mỗi tính năng khi đó chạm cả ba và mọi thay đổi vẫn phải phối hợp. Định luật Conway: cấu trúc hệ thống sẽ phản chiếu cấu trúc tổ chức tạo ra nó. Ranh giới dịch vụ tốt thường trùng ranh giới của một nhóm sở hữu trọn vẹn.

### Database per service

Mỗi dịch vụ sở hữu dữ liệu của mình; dịch vụ khác chỉ truy cập qua API hoặc sự kiện, không đọc thẳng bảng. Nhờ vậy đổi schema không phá người khác. Cái giá: không còn `JOIN` hay giao dịch ACID xuyên dịch vụ; dữ liệu liên dịch vụ phải ghép qua API, bản sao đọc (read model) và nhất quán cuối cùng (xem bài 18).

### Giao tiếp: đồng bộ hay bất đồng bộ

- **Đồng bộ** (HTTP/gRPC): dễ hiểu, có kết quả ngay, nhưng nối đuôi độ trễ và lỗi: dịch vụ A đợi B đợi C. Cần timeout, retry, circuit breaker (bài 17).
- **Bất đồng bộ** (queue/event, bài 6 và 16): tách thời gian và phụ thuộc, nhưng khó theo dõi luồng và kết quả đến sau.

### Chi phí vận hành mà tài liệu quảng cáo ít nhắc

- **Mạng không đáng tin**: mỗi lời gọi có thể chậm, mất hoặc thành công một nửa.
- **Debug và quan sát**: một request đi qua nhiều dịch vụ; cần log tập trung và trace (bài 21).
- **Version và tương thích**: dịch vụ A và B deploy lệch nhau, API phải tương thích ngược.
- **Hạ tầng**: CI/CD, service discovery, cấu hình, bảo mật giữa các dịch vụ, mỗi thứ nhân lên theo số dịch vụ.

### Distributed monolith: cái bẫy tệ nhất

Bạn có đủ chi phí của microservices mà không có lợi ích: các dịch vụ phải sửa và deploy cùng nhau, hoặc dùng chung một database, hoặc gọi nhau theo chuỗi dài. Nếu hai dịch vụ luôn đổi cùng nhau, chúng là một dịch vụ.

### Chuyển đổi dần: strangler fig

Đừng viết lại "big bang". Đặt một lớp định tuyến (gateway) phía trước, rồi mỗi lần chuyển **một** chức năng sang dịch vụ mới và hướng traffic tới đó. Monolith cũ teo dần cho tới khi trống. Mỗi bước nhỏ, đo được và quay lại được.

### Khi nào nên tách

- Nhiều nhóm giẫm chân nhau khi deploy, và ranh giới domain đã rõ.
- Một phần cần scale hoặc công nghệ khác hẳn (ví dụ xử lý video).
- Cần cô lập lỗi cho phần quan trọng.
- Chưa có những điều trên thì thêm module trong monolith rẻ hơn rất nhiều.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Monolith | Đơn giản, giao dịch ACID, debug dễ, ít hạ tầng | Deploy gắn chặt, lỗi lan rộng, nhóm lớn giẫm chân nhau |
| Modular monolith | Ranh giới rõ, vẫn đơn giản vận hành | Cần kỷ luật giữ ranh giới; vẫn deploy chung |
| Microservices | Deploy và scale độc lập, cô lập lỗi, nhóm tự chủ | Mạng, nhất quán cuối cùng, chi phí vận hành, debug phức tạp |
| Database per service | Tự chủ schema | Không JOIN/ACID xuyên dịch vụ |
| Gọi đồng bộ | Đơn giản, kết quả ngay | Lỗi và độ trễ lan theo chuỗi |

## Sai lầm hay gặp

- Tách quá sớm khi nhóm còn 5 người và ranh giới chưa rõ.
- Cắt theo tầng kỹ thuật thay vì theo domain.
- Nhiều dịch vụ dùng chung một database.
- Tách quá nhỏ ("nano-service"): mỗi tính năng phải gọi cả chục dịch vụ.
- Chuỗi gọi đồng bộ dài mà không timeout, không circuit breaker.
- Không có log tập trung, trace, hay CI/CD tự động trước khi tách.
- Viết lại big bang thay vì strangler fig.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="monolith-microservices" />

## Đọc thêm

- [Martin Fowler: MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)
- [Martin Fowler & James Lewis: Microservices](https://martinfowler.com/articles/microservices.html)
- [microservices.io: Pattern language](https://microservices.io/patterns/index.html)
- [Martin Fowler: Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Building Microservices, Sam Newman](https://samnewman.io/books/building_microservices_2nd_edition/)

**Tiếp theo:** hệ thống đã nhiều mảnh, làm sao biết nó đang khoẻ hay ốm? Bài 21: [Quan sát hệ thống](./21-observability.md).
