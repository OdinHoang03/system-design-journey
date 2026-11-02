---
id: consensus
title: "Đồng thuận & bầu leader"
sidebar_position: 19
slug: /consensus
description: "Nhiều máy cùng đồng ý một sự thật: quorum, split brain, Raft ở mức trực giác, lock phân tán với fencing token, ID duy nhất."
---

> Khi nhiều máy phải đồng ý với nhau, đa số là thứ duy nhất ta tin được.

## Câu chuyện

NoteNest có một job dọn dẹp chạy mỗi đêm, và để chịu lỗi Minh chạy nó trên hai server, một chính một dự phòng. Một đêm mạng giữa hai máy đứt: dự phòng tưởng chính đã chết nên tự lên làm chính, còn máy chính vẫn sống và vẫn làm. Hai "chính" cùng xoá và ghi, dữ liệu lệch. Đó là **split brain**.

Minh cần một cách để cả cụm đồng ý "ai là leader lúc này" mà không thể có hai câu trả lời.

## Khái niệm sâu

### Quorum: đa số quyết định

![Đồng thuận bằng đa số](/img/diagrams/consensus.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [Raft visualization](https://raft.github.io/).*

Một quyết định chỉ có hiệu lực khi **hơn nửa** số node xác nhận. Hai nhóm rời nhau không thể cùng chiếm đa số, nên không có hai leader cùng commit. Cụm 3 node chịu 1 lỗi, 5 node chịu 2 lỗi; dùng số lẻ vì 4 node không chịu thêm lỗi nào so với 3.

### Raft ở mức trực giác

- **Term**: số "nhiệm kỳ" tăng dần. Mỗi term có tối đa một leader.
- **Bầu leader**: follower không nghe heartbeat trong một khoảng ngẫu nhiên sẽ tự ứng cử, xin phiếu; ai được đa số phiếu thành leader.
- **Sao chép log**: mọi ghi đi qua leader, leader gửi bản ghi cho follower; khi đa số đã lưu thì bản ghi **committed** và mới trả lời client.
- Leader chết thì term mới, bầu lại; bản ghi đã commit không bao giờ mất vì đa số đã giữ nó.

Paxos giải cùng bài toán, nổi tiếng là khó hiểu; Raft được thiết kế để dễ học hơn. Trong thực tế bạn hiếm khi tự cài: dùng **etcd**, **ZooKeeper** hay **Consul**.

### Khi nào dùng

Đồng thuận đắt (mỗi ghi cần vòng mạng tới đa số) và thông lượng thấp. Dùng cho lượng dữ liệu nhỏ cần nhất quán mạnh: cấu hình, bầu leader, service discovery, metadata. Không dùng làm database chính cho dữ liệu lớn.

### Lock phân tán, lease và fencing token

Lock phân tán thường có **lease** (hết hạn tự nhả) để lock không kẹt mãi khi client chết. Nhưng client có thể bị pause (GC, mạng) quá lease mà không biết, rồi vẫn ghi. Cách chặn đúng là **fencing token**: lock trả số tăng dần, nơi lưu trữ từ chối ghi có token nhỏ hơn token đã thấy. Martin Kleppmann phân tích rằng lock dựa trên đồng hồ và timing (như Redlock) không an toàn nếu thiếu fencing; dùng cho tối ưu hiệu năng thì được, dùng cho tính đúng đắn thì cần hệ đồng thuận kèm token.

### ID duy nhất

- **UUID v4**: ngẫu nhiên 128 bit, không cần phối hợp; nhưng làm index B-tree phân mảnh.
- **Snowflake**: 64 bit = timestamp + machine id + sequence; sinh cục bộ, gần như tăng theo thời gian. Phụ thuộc đồng hồ và việc cấp machine id duy nhất.
- **ULID / UUID v7**: timestamp ở đầu rồi phần ngẫu nhiên, sắp xếp được theo thời gian.

### Đồng hồ không đáng tin

Đồng hồ các máy lệch nhau và có thể bị chỉnh lùi (NTP). Đừng dùng giờ thực để quyết định "ai mới hơn" giữa các máy; dùng số term/version, hoặc logical clock.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Một leader cố định, không đồng thuận | Đơn giản | Split brain khi mạng lỗi |
| Cụm đồng thuận (Raft/etcd) | Một leader duy nhất, chịu lỗi | Độ trễ ghi cao, cần đa số sống |
| 5 node thay vì 3 | Chịu 2 lỗi | Tốn máy, ghi chậm hơn một chút |
| Lock có lease | Không kẹt khi client chết | Có thể hết hạn khi đang làm: cần fencing |
| UUID v4 | Không cần phối hợp | Index phân mảnh, 128 bit |
| Snowflake | Gọn, theo thời gian | Phụ thuộc đồng hồ và machine id |

## Sai lầm hay gặp

- Tự viết bầu leader bằng "ping thấy chết thì lên thay": cách nhanh nhất để có split brain.
- Chạy cụm đồng thuận 2 hoặc 4 node, hoặc đặt mọi node cùng một rack/zone.
- Dùng lock với lease mà không có fencing token cho thao tác ghi quan trọng.
- Tin đồng hồ hệ thống để sắp thứ tự sự kiện giữa các máy.
- Dùng etcd/ZooKeeper như database chứa dữ liệu lớn.
- Snowflake không xử lý đồng hồ bị lùi, hoặc hai máy trùng machine id.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="consensus" />

## Đọc thêm

- [Raft: The Secret Lives of Data (minh hoạ)](https://thesecretlivesofdata.com/raft/)
- [Raft Consensus Algorithm](https://raft.github.io/) và bài báo "In Search of an Understandable Consensus Algorithm"
- [Martin Kleppmann: How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Twitter Engineering: Announcing Snowflake](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake)
- [Designing Data-Intensive Applications](https://dataintensive.net/), chương 8 và 9

**Tiếp theo:** phần Vận hành & kiến trúc, bắt đầu với Bài 20: Monolith vs microservices (sắp có).
