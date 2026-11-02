---
id: deployment-release
title: "Triển khai & phát hành an toàn"
sidebar_position: 22
slug: /deployment-release
description: "Đưa mã mới lên mà không làm sập hệ thống: CI/CD, rolling, blue/green, canary, feature flag, rollback, migration tương thích ngược."
---

> Deploy thường xuyên mới an toàn, miễn là mỗi lần deploy đủ nhỏ và quay lại được.

## Câu chuyện

NoteNest giờ có chục server và vài chục kỹ sư. Cứ tối thứ Sáu Minh lại hồi hộp: kéo mã mới về từng máy, chạy script migration, cầu trời. Một lần script đổi tên cột chạy xong trước khi mọi server cập nhật; nửa số server vẫn tìm cột cũ và trả lỗi 500 trong mười phút. Rollback thì không ai nhớ làm thế nào cho đúng.

Minh rút ra: nỗi sợ deploy không đến từ việc deploy, mà từ việc mỗi lần deploy quá lớn, thủ công và không có đường lùi.

## Khái niệm sâu

### Pipeline CI/CD và artifact bất biến

![Canary release](/img/diagrams/deployment-release.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Martin Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) và [CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html).*

- **CI**: mỗi commit tự build và chạy test.
- **CD**: bản build qua được test sẽ tự động (hoặc bấm một nút) được triển khai.
- **Artifact bất biến**: build *một lần* ra image/gói có phiên bản, rồi đưa đúng thứ đó qua staging và production. Khác biệt giữa môi trường chỉ nằm ở cấu hình, không nằm ở mã. Rollback khi đó chỉ là triển khai lại artifact cũ.

### Các chiến lược triển khai

- **Rolling**: thay dần từng server (hoặc từng nhóm) sang bản mới. Không tốn thêm hạ tầng; nhưng bản cũ và mới chạy song song một lúc.
- **Blue/green**: dựng nguyên một môi trường mới (green) cạnh môi trường đang chạy (blue), kiểm tra xong thì chuyển toàn bộ lưu lượng. Lỗi thì chuyển ngược lại ngay; đổi lại tốn gấp đôi hạ tầng trong lúc chuyển.
- **Canary**: cho một phần nhỏ lưu lượng (1–5%) đi vào bản mới, theo dõi tỉ lệ lỗi và độ trễ, đạt ngưỡng thì tăng dần; xấu thì rút về. Số người bị ảnh hưởng luôn nhỏ, nhưng cần quan sát tốt (xem bài 21).

### Feature flag: tách deploy khỏi release

**Deploy** là đưa mã lên production. **Release** là cho người dùng thấy tính năng. Với feature flag, mã mới lên production ở trạng thái *tắt*, sau đó bật dần theo phần trăm, theo nhóm người dùng, hoặc theo vùng. Sự cố thì tắt flag, không cần deploy lại. Cái giá: flag cũ tích tụ thành nợ, nên mỗi flag cần chủ và ngày gỡ.

### Migration database tương thích ngược

Khi rolling hoặc canary, hai phiên bản mã dùng chung một database, nên schema phải chạy được với cả hai. Mẫu **expand/contract**:

1. **Expand**: thêm cột/bảng mới (không xoá gì).
2. Ghi vào cả cũ lẫn mới, **backfill** dữ liệu cũ.
3. Chuyển đọc sang cái mới.
4. **Contract**: ở lần phát hành sau, khi chắc chắn không còn ai dùng, mới xoá cái cũ.

Mỗi bước nhỏ và hoàn tác được. Đổi tên cột trong một bước chính là sự cố của Minh.

### Health check, readiness và rollback

- **Readiness probe**: instance báo "tôi sẵn sàng nhận lưu lượng" (đã khởi động, kết nối DB, ấm cache); chưa sẵn sàng thì load balancer không gửi request vào.
- **Liveness probe**: tiến trình có bị treo không; treo thì khởi động lại.
- **Rollback tự động**: gắn ngưỡng (tỉ lệ lỗi, độ trễ p99) vào pipeline; vượt ngưỡng thì tự lùi. Phải *tập* rollback định kỳ, vì cơ chế chưa từng chạy thì lúc cần sẽ không chạy.

## Đánh đổi

| Chiến lược | Được | Mất |
|---|---|---|
| Rolling | Đơn giản, không tốn thêm hạ tầng | Hai phiên bản chạy song song; rollback chậm |
| Blue/green | Chuyển và rollback tức thì | Gấp đôi hạ tầng; khó với database dùng chung |
| Canary | Rủi ro nhỏ, quyết định bằng số liệu | Cần quan sát tốt, cần đủ lưu lượng, thời gian dài hơn |
| Feature flag | Release tách khỏi deploy, tắt tức thì | Nhiều nhánh mã cần test; flag cũ thành nợ |
| Big-bang (dừng hệ thống, nâng cấp) | Dễ hiểu | Có downtime; rủi ro dồn vào một lần |

## Sai lầm hay gặp

- Đổi schema phá tương thích trong một bước (đổi tên, xoá cột) khi còn bản cũ đang chạy.
- Build lại cho từng môi trường, nên cái chạy thật không phải cái đã test.
- Không có readiness probe; rolling deploy gửi request vào instance chưa khởi động xong.
- Canary mà không có chỉ số để so sánh; "không ai báo lỗi" không phải là số liệu.
- Có cơ chế rollback nhưng chưa từng thử, hoặc rollback mã mà quên rằng dữ liệu đã bị migration đổi.
- Flag không bao giờ được gỡ, mã đầy nhánh chết.
- Deploy lớn, hiếm (mỗi tháng một lần): mỗi lần là một canh bạc; deploy nhỏ, thường xuyên mới dễ tìm lỗi.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="deployment-release" />

## Đọc thêm

- [Martin Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Martin Fowler: CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html)
- [Martin Fowler: FeatureToggle](https://martinfowler.com/articles/feature-toggles.html)
- [Kubernetes: Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
- [Google SRE Book: Release Engineering](https://sre.google/sre-book/release-engineering/)

**Tiếp theo:** hệ thống chạy ổn thì cũng là mục tiêu của kẻ xấu. Bài 23: [Bảo mật cơ bản](./23-security-basics.md).
