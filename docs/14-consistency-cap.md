---
id: consistency-cap
title: "Nhất quán & CAP"
sidebar_position: 14
slug: /consistency-cap
description: "Strong, eventual và các mức nhất quán ở giữa; định lý CAP và PACELC; quorum; cách chọn mức nhất quán theo từng bài toán."
---

> Khi dữ liệu có nhiều bản sao, "đọc được gì" là một lựa chọn thiết kế, không phải điều mặc định.

## Câu chuyện

NoteNest mở thêm một vùng ở Singapore để người dùng châu Á nhanh hơn: mỗi vùng có database riêng, đồng bộ với nhau. Lan sửa ghi chú trên điện thoại ở Hà Nội, rồi mở laptop (kết nối sang vùng khác) và thấy bản cũ. Tệ hơn, một đêm cáp biển bị đứt, hai vùng mất liên lạc. Minh phải trả lời: vùng Singapore nên *ngừng nhận ghi* cho đến khi nối lại, hay cứ nhận rồi gộp sau? Đây là bài toán kinh điển mà định lý CAP mô tả.

## Khái niệm sâu

### Các mức nhất quán

"Nhất quán" ở đây nói về việc các bản sao và các client *thấy* dữ liệu thế nào. Từ chặt đến lỏng:

- **Linearizable (strong)**: hệ thống tỏ ra như chỉ có một bản dữ liệu; đọc luôn thấy ghi mới nhất đã hoàn tất. Dễ lập luận nhất, nhưng mỗi thao tác phải phối hợp giữa các nút nên chậm và kém chịu lỗi.
- **Sequential / causal**: mọi người thấy các thao tác theo cùng một thứ tự, hoặc ít nhất giữ đúng quan hệ nhân quả ("trả lời" không hiện trước "câu hỏi").
- **Read-your-writes / monotonic reads**: các đảm bảo *theo phiên*. Bạn luôn thấy cái bạn vừa ghi và không bao giờ thấy dữ liệu "lùi về quá khứ".
- **Eventual**: nếu ngừng ghi, các bản sao rồi sẽ hội tụ. Không hứa gì về lúc nào, và trong lúc chờ đọc có thể thấy bản cũ.

![Lựa chọn khi mạng bị chia cắt](/img/diagrams/cap-partition.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Designing Data-Intensive Applications](https://dataintensive.net/) (M. Kleppmann), chương Consistency and Consensus.*

### Định lý CAP

Với hệ thống phân tán, ba tính chất:

- **C**onsistency: mọi đọc thấy ghi mới nhất (nghĩa linearizable).
- **A**vailability: mọi yêu cầu tới nút còn sống đều nhận được phản hồi.
- **P**artition tolerance: hệ thống vẫn hoạt động khi mạng bị chia cắt.

Định lý nói: khi xảy ra **phân vùng mạng (P)**, bạn phải chọn **C hoặc A**. Mạng thật *sẽ* đứt, nên P gần như bắt buộc; lựa chọn thực chất là giữa:

- **CP**: phía thiểu số từ chối yêu cầu (mất sẵn sàng) để không trả dữ liệu sai. Ví dụ: kho điều phối như etcd/ZooKeeper, Spanner.
- **AP**: mọi phía vẫn trả lời, chấp nhận bản sao lệch nhau rồi hoà giải sau. Ví dụ: Dynamo, Cassandra (cấu hình mặc định).

Hai hiểu lầm hay gặp: CAP *không* nói "chỉ chọn được 2 trong 3" mọi lúc (khi mạng ổn bạn có cả C và A), và "sẵn sàng" trong CAP là một định nghĩa hẹp, không phải "uptime 99.99%".

### PACELC: cả khi mạng ổn

CAP chỉ nói về lúc có sự cố. **PACELC** bổ sung: nếu có **P**artition thì chọn **A** hay **C**; **E**lse (bình thường), chọn **L**atency (độ trễ) hay **C**onsistency. Giữ các bản sao đồng bộ luôn tốn thêm một chuyến đi mạng. Vì vậy một hệ "CP" vẫn chậm hơn khi bình thường, còn hệ "AP" nhanh hơn nhưng đọc có thể cũ.

### Quorum: chỉnh độ nhất quán bằng số

Trong hệ leaderless có **N** bản sao; ghi phải được **W** bản sao xác nhận, đọc hỏi **R** bản sao. Nếu **R + W > N**, tập đọc và tập ghi luôn giao nhau, nên đọc thấy ít nhất một bản mới (chọn bản có phiên bản mới nhất). Ví dụ N=3, W=2, R=2: chịu được 1 nút chết. Hạ W=1 để ghi nhanh thì mất bảo đảm giao nhau. Quorum không tự cho linearizability (còn phụ thuộc đồng hồ, ghi song song, sửa chữa), nên đây là *công cụ chỉnh*, không phải phép màu.

### Hoà giải xung đột khi chọn AP

Nếu hai vùng cùng sửa một ghi chú khi mất liên lạc, cần quy tắc: **last-write-wins** (đơn giản nhưng có thể mất dữ liệu), **vector clock** để phát hiện sửa song song, hoặc **CRDT** (cấu trúc dữ liệu được thiết kế để các bản gộp luôn hội tụ, như bộ đếm, tập hợp, văn bản cộng tác).

### Chọn theo bài toán

| Bài toán | Mức nên chọn | Lý do |
|---|---|---|
| Số dư, tồn kho cuối, đặt chỗ | Mạnh (CP) | Sai một lần là thiệt hại thật |
| Ghi chú của NoteNest | Read-your-writes + eventual giữa các vùng | Người dùng chỉ cần thấy thay đổi của chính mình ngay |
| Bộ đếm lượt xem, "thích" | Eventual | Lệch vài giây không ai quan tâm |
| Bầu leader, khóa phân tán | Mạnh | Hai leader cùng lúc là thảm họa (bài 19) |

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Strong consistency | Dễ lập luận, không có dữ liệu cũ | Chậm hơn, mất sẵn sàng khi phân vùng, đắt khi trải nhiều vùng |
| Eventual consistency | Nhanh, luôn sẵn sàng, scale xuyên vùng | Đọc có thể cũ; phải xử lý xung đột |
| Quorum R+W>N | Chỉnh được nhất quán/độ trễ từng truy vấn | Cần cấu hình đúng; không phải linearizable tự động |
| Đảm bảo theo phiên | Trải nghiệm người dùng "bình thường" với chi phí thấp | Chỉ đúng trong phạm vi một phiên |

## Sai lầm hay gặp

- Nói "chúng tôi chọn CA": mạng phân tán *sẽ* bị chia cắt, nên CA không tồn tại cho hệ nhiều nút qua mạng.
- Dùng eventual consistency cho thứ cần chặt (số dư, tồn kho) vì "NoSQL thì vậy".
- Dùng strong consistency cho mọi thứ, trả giá độ trễ không cần thiết.
- Dựa vào đồng hồ máy để quyết định "ghi nào mới hơn". Đồng hồ các máy luôn lệch nhau.
- Quên rằng read-your-writes bị vỡ khi request tiếp theo rơi vào replica khác.
- Không thiết kế đường hoà giải xung đột rồi mới phát hiện hai vùng có hai phiên bản khác nhau.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="consistency-cap" />

## Đọc thêm

- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 9 (Consistency and Consensus)
- [Wikipedia: CAP theorem](https://en.wikipedia.org/wiki/CAP_theorem)
- [Abadi: Consistency Tradeoffs in Modern Distributed Database System Design (PACELC)](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf)
- [Jepsen: Consistency Models](https://jepsen.io/consistency)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0): mục Consistency patterns và CAP

**Tiếp theo:** không phải dữ liệu nào cũng nằm trong bảng. Bài 15: [Object storage & tìm kiếm](./15-object-storage-search.md).
