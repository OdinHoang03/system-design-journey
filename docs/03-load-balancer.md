---
id: load-balancer
title: "Load balancer & scale ngang"
sidebar_position: 3
slug: /load-balancer
description: "Scale dọc và scale ngang, load balancer L4/L7, thuật toán cân bằng tải, health check, sticky session."
---

> Một server không đủ sức, thêm server thứ hai và thứ ba.

## Câu chuyện

NoteNest được một blogger nổi tiếng nhắc tới. Lượng truy cập tăng 20 lần trong một buổi tối. CPU của server duy nhất chạm 100%, request bắt đầu timeout. Minh nâng cấu hình máy lên gấp đôi; được vài giờ rồi lại đầy. Tệ hơn, mỗi lần nâng cấp phải tắt máy, và nếu máy này hỏng thì *cả* NoteNest biến mất.

## Khái niệm sâu

### Scale dọc và scale ngang

- **Scale dọc** (scale up): máy mạnh hơn (thêm CPU, RAM). Đơn giản, nhưng có trần, đắt dần, và vẫn là *một điểm chết duy nhất* (single point of failure).
- **Scale ngang** (scale out): thêm nhiều máy cùng làm một việc. Gần như không có trần, chịu lỗi tốt hơn, nhưng phức tạp hơn: cần chia request và không để máy nào giữ "trạng thái riêng".

### Load balancer

**Load balancer** (LB) đứng trước các server, nhận request và chuyển cho một server khoẻ mạnh.

![Load balancer](/img/diagrams/load-balancer.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) (CC BY-NC-ND 4.0; chỉ tham khảo ý, không chép hình).*

Hai tầng phổ biến:

| | L4 (transport) | L7 (application) |
|---|---|---|
| Nhìn thấy | IP, cổng, TCP/UDP | URL, header, cookie |
| Tốc độ | Rất nhanh, ít xử lý | Chậm hơn chút, nhiều khả năng |
| Làm được | Chuyển kết nối | Định tuyến theo đường dẫn, kết thúc TLS, nén, giới hạn tốc độ |
| Ví dụ | LB mạng của cloud, HAProxy chế độ TCP | NGINX, HAProxy chế độ HTTP, ALB |

### Thuật toán chọn server

- **Round robin**: lần lượt từng server. Tốt khi request tốn công như nhau.
- **Weighted round robin**: máy mạnh nhận nhiều hơn.
- **Least connections**: chọn server đang xử lý ít kết nối nhất. Hợp request có thời gian xử lý chênh lệch.
- **IP hash / consistent hashing**: cùng client (hoặc cùng key) luôn tới cùng server; hữu ích cho cache cục bộ.

### Health check

LB định kỳ gọi `GET /healthz` tới từng server. Server lỗi (timeout, 5xx) bị loại khỏi vòng quay; khi khoẻ lại, nó được thêm vào. Nhờ đó một máy chết không làm người dùng thấy lỗi.

### Điều kiện để scale ngang: stateless

Nếu server 1 giữ phiên đăng nhập trong RAM, request kế tiếp rơi vào server 2 sẽ "mất đăng nhập". Giải pháp:

1. **Đẩy trạng thái ra ngoài**: phiên trong Redis/database, file upload trong object storage. Server nào cũng như nhau nên thay thế được bất cứ lúc nào.
2. **Sticky session**: LB ghi nhớ client → server (qua cookie). Nhanh để vá, nhưng làm mất cân bằng và vẫn mất phiên nếu server chết.

### Bản thân LB cũng có thể chết

Một LB duy nhất lại là single point of failure. Thực tế dùng cặp LB active–passive (chuyển IP ảo khi sự cố) hoặc LB dịch vụ của cloud đã được nhân bản sẵn. DNS cũng có thể trả nhiều IP của nhiều LB.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Scale dọc | Đơn giản, không đổi code | Có trần, đắt, downtime khi nâng cấp, single point of failure |
| Scale ngang | Gần như không trần, chịu lỗi | Phải stateless, vận hành nhiều máy |
| LB L4 | Nhanh, nhẹ | Không định tuyến theo nội dung |
| LB L7 | Linh hoạt, TLS, định tuyến | Tốn CPU hơn, thêm một tầng cần cấu hình |
| Sticky session | Dễ vá nhanh | Tải lệch, mất phiên khi server chết |
| Phiên trong store chung | Server thay thế được | Thêm một thành phần phải vận hành, thêm một lần gọi mạng |

## Sai lầm hay gặp

- Thêm server nhưng vẫn lưu file upload trên đĩa cục bộ; ảnh vừa tải lên "biến mất" ở request sau.
- Health check chỉ kiểm tra "tiến trình còn sống" mà không kiểm tra kết nối database, nên LB vẫn gửi request vào server hỏng.
- Health check quá nặng hoặc quá gắt, khiến LB loại cả cụm khi database chỉ chậm thoáng chốc.
- Quên rằng IP của client lúc này là IP của LB; phải đọc `X-Forwarded-For` (và chỉ tin header từ LB của mình).
- Chỉ scale tầng app mà quên database; tất cả server mới cùng đổ vào một database (bài 5).
- Không kiểm thử việc tắt một server; lần đầu thấy hệ thống phản ứng thế nào lại là lúc sự cố thật.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="load-balancer" />

## Đọc thêm

- [NGINX: HTTP load balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [HAProxy: tài liệu](https://docs.haproxy.org/)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Load balancer và Horizontal scaling
- [Google SRE Book](https://sre.google/sre-book/load-balancing-frontend/) (CC BY-NC 4.0): Load balancing at the frontend

**Tiếp theo:** có ba server rồi, nhưng cả ba đều hỏi database cùng một câu hàng triệu lần. Bài 4: [Cache](./04-cache.md).
