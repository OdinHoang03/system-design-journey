---
id: observability
title: "Quan sát hệ thống"
sidebar_position: 21
slug: /observability
description: "Log có cấu trúc, metric, trace phân tán, SLI/SLO và error budget, cảnh báo theo triệu chứng: biết hệ thống đang làm gì mà không phải đoán."
---

> Không đo được thì không sửa được; và không quan sát được thì sự cố nào cũng là đoán mò.

## Câu chuyện

NoteNest giờ có hàng chục dịch vụ. Một sáng thứ Hai, người dùng than "app chậm". Minh mở dashboard: CPU bình thường, RAM bình thường, trung bình thời gian phản hồi vẫn 200 ms. Vậy mà tin nhắn hỗ trợ cứ đổ về. Anh grep log trên từng server, mất hai tiếng mới thấy một dịch vụ tìm kiếm thỉnh thoảng đợi database tới 8 giây.

Sai lầm không nằm ở hệ thống mà ở chỗ Minh **không nhìn thấy** nó. Hệ thống tốt cho phép hỏi câu hỏi mới ("chỉ riêng người dùng gói Pro ở Đà Nẵng thì sao?") mà không phải deploy thêm code.

## Khái niệm sâu

### Ba trụ: log, metric, trace

![Log, metric và trace](/img/diagrams/observability.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/), chương Monitoring Distributed Systems.*

- **Metric**: con số theo thời gian, rẻ và gọn, trả lời "có gì sai, mức độ bao nhiêu". Hợp để cảnh báo và vẽ biểu đồ.
- **Trace**: đường đi của *một* request qua nhiều dịch vụ, chia thành các **span** có thời lượng. Trả lời "chậm ở đâu".
- **Log**: bản ghi sự kiện chi tiết, trả lời "vì sao".

Quy trình điều tra thường đi từ metric (phát hiện) → trace (khoanh vùng) → log (tìm nguyên nhân).

### Log có cấu trúc và correlation id

Log dạng văn bản tự do khó tìm. Hãy ghi **JSON** với trường cố định: `timestamp`, `level`, `service`, `user_id`, `message`. Quan trọng nhất là **correlation id** (hay trace id): API gateway sinh một ID cho mỗi request, mọi dịch vụ gắn nó vào log và truyền tiếp qua header. Nhờ đó một câu truy vấn gom được toàn bộ log của một request trên mười dịch vụ. Không ghi mật khẩu, token, dữ liệu cá nhân vào log.

### Metric: RED, USE và percentile

Hai bộ chỉ số nên nhớ:

- **RED** (cho dịch vụ nhận request): **R**ate (số request/giây), **E**rrors (tỉ lệ lỗi), **D**uration (độ trễ).
- **USE** (cho tài nguyên như CPU, đĩa, kết nối): **U**tilization, **S**aturation (hàng đợi), **E**rrors.

Độ trễ phải xem theo **percentile** (p50, p95, p99), không phải trung bình. Trung bình 200 ms có thể che giấu 1% request mất 8 giây, và người dùng nặng (gọi nhiều request) gặp các request chậm đó nhiều hơn mức tưởng. Dùng histogram để tính percentile; đừng lấy trung bình của các p99.

**Cardinality**: mỗi tổ hợp nhãn (label) là một chuỗi thời gian riêng. Gắn `user_id` hay `request_id` làm nhãn metric sẽ tạo hàng triệu chuỗi và làm sập hệ thống giám sát. Nhãn nên có tập giá trị nhỏ, hữu hạn (`route`, `status`, `region`); chi tiết từng người dùng để trong log hoặc trace.

### Trace phân tán

Mỗi request mang một **trace id**; mỗi bước tạo một span ghi thời điểm bắt đầu, thời lượng, span cha. Ghép lại thành biểu đồ thác nước cho thấy 7,8 giây của request nằm ở truy vấn database trong dịch vụ tìm kiếm. Tiêu chuẩn mở là **OpenTelemetry** (API, SDK và định dạng chung cho log, metric, trace), tránh bị khoá vào một nhà cung cấp.

### SLI, SLO và error budget

- **SLI** (chỉ số mức dịch vụ): thứ ta đo, ví dụ "tỉ lệ request thành công dưới 300 ms".
- **SLO** (mục tiêu): ngưỡng cam kết với chính mình, ví dụ "99,9% trong 30 ngày".
- **Error budget**: phần được phép hỏng, ở đây 0,1% (khoảng 43 phút mỗi 30 ngày). Còn ngân sách thì cứ phát hành tính năng; cạn ngân sách thì ưu tiên độ ổn định.

SLO biến câu cãi nhau "ổn định hay tính năng" thành con số. Khác với SLA (hợp đồng, có phạt), SLO là mục tiêu nội bộ, thường chặt hơn SLA.

### Cảnh báo: theo triệu chứng, không theo nguyên nhân

Cảnh báo "CPU > 80%" có thể vô hại; cảnh báo "5% request lỗi trong 5 phút" luôn đáng quan tâm. Nên cảnh báo trên **triệu chứng người dùng cảm nhận** (tỉ lệ lỗi, độ trễ, tốc độ đốt error budget), còn nguyên nhân (CPU, đĩa) đưa vào dashboard để điều tra. Mỗi cảnh báo phải đánh thức người trực **chỉ khi cần hành động ngay** và có sổ tay xử lý (runbook). Cảnh báo ồn khiến người trực quen mà bỏ qua (**alert fatigue**), và tới lúc có sự cố thật thì không ai tin nữa.

### Dashboard, chi phí và lấy mẫu

Dashboard tốt kể một câu chuyện: tầng trên là RED của các dịch vụ chính, bấm sâu xuống là USE của tài nguyên. Quan sát có giá: log và trace tăng theo lưu lượng. Giảm chi phí bằng **sampling** (giữ 1% trace bình thường nhưng giữ *mọi* trace lỗi hoặc chậm), đặt thời hạn lưu giữ, và hạ mức log ở môi trường production.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Ghi log chi tiết mọi thứ | Điều tra được hầu hết sự cố | Tốn tiền lưu trữ, khó tìm, rủi ro lộ dữ liệu |
| Metric | Rẻ, nhanh, hợp cảnh báo | Không chứa chi tiết từng request |
| Trace 100% | Đầy đủ | Đắt, thêm độ trễ nhỏ |
| Trace có sampling | Rẻ | Có thể bỏ lỡ request hiếm (giảm bằng sampling theo đuôi: giữ lỗi/chậm) |
| Cảnh báo nhạy | Phát hiện sớm | Báo động giả, mệt mỏi |
| Cảnh báo theo SLO | Ít ồn, gắn với người dùng | Cần định nghĩa SLI cẩn thận |

## Sai lầm hay gặp

- Chỉ nhìn **trung bình** độ trễ; p99 mới là trải nghiệm của người dùng tệ nhất.
- Gắn `user_id` vào nhãn metric (bùng nổ cardinality).
- Không có correlation id; ghép log giữa các dịch vụ bằng tay.
- Cảnh báo theo nguyên nhân (CPU, RAM) thay vì triệu chứng, hoặc cảnh báo không ai xử lý.
- Dashboard hàng trăm biểu đồ, không ai biết nhìn cái nào.
- Ghi dữ liệu nhạy cảm vào log.
- Chưa có giám sát nào cho bản thân hệ thống giám sát (nó chết thì mù).
- Đặt SLO 100%: không đạt được, và triệt tiêu mọi chỗ cho thay đổi.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="observability" />

## Đọc thêm

- [Google SRE Book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [OpenTelemetry: Documentation](https://opentelemetry.io/docs/)
- [Prometheus: Metric and label naming](https://prometheus.io/docs/practices/naming/)
- [Tom Wilkie: The RED Method](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/)
- [Brendan Gregg: The USE Method](https://www.brendangregg.com/usemethod.html)

**Tiếp theo:** thấy được rồi thì phát hành an toàn hơn. Bài 22: [Triển khai & phát hành an toàn](./22-deployment-release.md).
