---
id: distributed-transactions
title: "Giao dịch phân tán & saga"
sidebar_position: 18
slug: /distributed-transactions
description: "Giữ dữ liệu đúng qua nhiều dịch vụ: vì sao ACID không đủ, 2PC, saga, compensation, outbox/inbox, idempotency."
---

> Khi dữ liệu nằm ở nhiều nơi, "tất cả hoặc không gì cả" không còn miễn phí.

## Câu chuyện

NoteNest bán gói Pro. Đội của Minh đã tách ba dịch vụ: **Order**, **Payment**, **Stock** (số slot lưu trữ còn lại). Một lần mua gồm ba việc: tạo đơn, thu tiền, giữ slot. Một đêm, Payment thu tiền xong thì Stock báo hết slot. Khách bị trừ tiền mà không có gói Pro. Khi còn một database, Minh chỉ cần `ROLLBACK`; giờ không còn lệnh nào làm được điều đó.

## Khái niệm sâu

### Vì sao ACID dừng ở ranh giới database

Tính nguyên tử (atomicity) của transaction chỉ được một database đảm bảo trong phạm vi của nó. Ba dịch vụ có ba database, không ai cầm "nút commit chung". Mạng có thể rớt giữa chừng, và ta không biết bên kia đã làm xong hay chưa. Có hai hướng: **ép đồng bộ** (2PC) hoặc **chấp nhận trạng thái trung gian và sửa dần** (saga).

### Two-phase commit (2PC)

1. **Prepare**: coordinator hỏi mọi participant "bạn sẵn sàng commit chưa?"; ai đồng ý thì khoá dữ liệu và hứa sẽ commit được.
2. **Commit/Abort**: nếu tất cả "yes" thì coordinator ra lệnh commit, ngược lại abort.

Điểm yếu: nếu coordinator chết sau khi participant đã vote "yes", họ không được tự quyết và **giữ khoá chờ** (blocking). Mỗi giao dịch còn phải đi hai vòng qua mạng và bị chậm theo bên chậm nhất. 2PC hợp với phạm vi nhỏ, cùng một hệ (ví dụ XA giữa vài database) hơn là giữa nhiều microservice.

### Saga: chuỗi giao dịch cục bộ có bước bù

![Saga với compensation](/img/diagrams/distributed-transactions.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [microservices.io: Saga pattern](https://microservices.io/patterns/data/saga.html).*

Saga chia việc thành các **transaction cục bộ**, mỗi cái commit ngay. Mỗi bước có một **compensation** (bước bù): thao tác ngược theo nghĩa nghiệp vụ. Bước 3 lỗi thì chạy bù ngược lại: hoàn tiền, huỷ đơn. Bù không phải rollback: khách có thể đã thấy "đã thu tiền" trong giây lát, nên trạng thái trung gian (`PENDING`) phải được thiết kế rõ.

Hai cách điều phối:

- **Choreography**: mỗi dịch vụ lắng nghe sự kiện của dịch vụ khác và tự phản ứng. Ít thành phần trung tâm, nhưng luồng khó theo dõi khi có nhiều bước.
- **Orchestration**: một orchestrator ra lệnh từng bước và biết trạng thái cả saga. Dễ hiểu, dễ quan sát; đổi lại có thêm một thành phần phải vận hành.

### Outbox và inbox

Mỗi bước saga vừa đổi DB vừa gửi message. Hai việc rời nhau thì có lúc lệch. **Transactional outbox** ghi event vào bảng `outbox` trong *cùng giao dịch* với dữ liệu; một relay đọc bảng rồi gửi sang queue. Relay có thể gửi trùng, nên phía nhận dùng **inbox** (bảng ghi `message_id` đã xử lý) hoặc idempotency key để bỏ qua bản trùng.

### Idempotency là điều kiện bắt buộc

Mọi bước và mọi bước bù đều có thể bị gọi lại (retry, giao trùng). Hãy gắn `saga_id` + số bước làm khoá, để "hoàn tiền" chạy hai lần vẫn chỉ hoàn một lần.

### TCC, và khi nào nên gom vào một DB

**TCC** (Try–Confirm/Cancel) là biến thể: bước *Try* giữ chỗ (đặt slot ở trạng thái "tạm giữ"), sau đó *Confirm* hoặc *Cancel*. Ít xấu hơn bù sau, nhưng mỗi dịch vụ phải viết thêm hai thao tác.

Trước khi dùng bất cứ thứ nào ở trên, hãy hỏi: có thật cần tách không? Nếu các bước luôn phải đúng cùng nhau và một DB còn gánh nổi, **một transaction cục bộ** rẻ và đúng hơn mọi cơ chế phân tán.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Một DB, một transaction | Đơn giản, đúng tuyệt đối | Ràng buộc các module vào một DB |
| 2PC | Nhất quán mạnh | Blocking, chậm, coordinator là điểm chết |
| Saga choreography | Lỏng lẻo, không có điểm trung tâm | Khó theo dõi luồng, dễ vòng lặp sự kiện |
| Saga orchestration | Luồng rõ, dễ giám sát | Thêm orchestrator; có nguy cơ dồn logic |
| Saga nói chung | Không giữ khoá lâu, scale tốt | Nhất quán cuối cùng; phải viết bước bù và xử lý trạng thái trung gian |

## Sai lầm hay gặp

- Tách microservice rồi mới nhận ra cần giao dịch xuyên dịch vụ; lẽ ra ranh giới phải theo dữ liệu cần đúng cùng nhau.
- Bước bù không idempotent: hoàn tiền hai lần.
- Ghi DB rồi gửi event ở hai bước rời nhau (không dùng outbox).
- Quên rằng một số việc không bù được (email đã gửi); đặt chúng ở bước cuối.
- Không lưu trạng thái saga, sập giữa chừng thì không ai biết đang ở bước nào.
- Hiển thị cho người dùng trạng thái trung gian như thể đã hoàn tất.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="distributed-transactions" />

## Đọc thêm

- [microservices.io: Saga pattern](https://microservices.io/patterns/data/saga.html)
- [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Microsoft: Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)
- [Garcia-Molina & Salem: Sagas (1987)](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 7 và 9

**Tiếp theo:** các node phải đồng ý với nhau về "ai là leader". Bài 19: [Đồng thuận & bầu leader](./19-consensus.md).
