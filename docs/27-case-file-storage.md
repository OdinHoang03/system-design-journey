---
id: case-file-storage
title: "Case study: thiết kế lưu trữ file & video"
sidebar_position: 27
slug: /case-file-storage
description: "Thiết kế lưu trữ và đồng bộ file, video: chia chunk, upload trực tiếp lên object storage, metadata, transcoding bất đồng bộ, CDN."
---

> File lớn thì đừng đi vòng qua server của bạn.

## Câu chuyện

Người dùng NoteNest muốn đính kèm ảnh, PDF và cả video bài giảng 2 GB vào ghi chú. Bản đầu của Minh nhận file qua API rồi ghi vào đĩa của app server. Một người upload video lớn giữ kết nối nhiều phút; ba người cùng upload là hết worker. Đĩa đầy nhanh, thêm server thì file nằm ở máy này, máy kia không thấy. Mạng rớt ở 95% là phải tải lại từ đầu. Đã đến lúc coi file là một bài toán riêng.

## Khái niệm sâu

### 1. Yêu cầu

**Chức năng:** upload và tải file (tới vài GB); tiếp tục upload khi mạng rớt; đồng bộ giữa nhiều thiết bị; xem video mượt trên mọi mạng; chia sẻ bằng link; lịch sử phiên bản (tuỳ chọn).

**Phi chức năng:** **bền vững cao** (file đã lưu thì không được mất), phục vụ nhanh trên toàn cầu, chi phí lưu trữ hợp lý.

**Ngoài phạm vi:** chỉnh sửa tài liệu cộng tác theo thời gian thực.

### 2. Ước lượng (xem bài 8)

- 5 triệu DAU, 10% upload mỗi ngày, trung bình 5 MB ⇒ 500.000 × 5 MB ≈ **2,5 TB/ngày**, ≈ **900 TB/năm**; nhân bản 3 lần ≈ 2,7 PB. Đó là lý do phải dùng object storage chứ không phải đĩa của server.
- Ghi: 500.000 file/ngày ≈ **6 file/giây**: nhỏ. Nhưng băng thông là vấn đề: 2,5 TB/ngày ≈ **30 MB/s** trung bình, đỉnh vài lần.
- Đọc: gấp 10–50 lần ghi, phần lớn là video và ảnh ⇒ cần **CDN** (bài 2).

Kết luận: số file ít, nhưng **dung lượng và băng thông lớn**. Đừng để byte của file đi qua app server.

### 3. Tách metadata và nội dung

| Phần | Lưu ở đâu | Vì sao |
|---|---|---|
| **Nội dung file** (byte) | **Object storage** (S3 hoặc tương đương), chia thành chunk | Rẻ, bền (nhiều bản sao), mở rộng gần như vô hạn |
| **Metadata** (tên, chủ sở hữu, kích thước, danh sách chunk, phiên bản, quyền) | Database (SQL, bài 5, 12) | Cần truy vấn, giao dịch, quyền truy cập |

### 4. Thiết kế tổng thể

![Lưu trữ file và video](/img/diagrams/case-file-storage.svg)

*Hình tự vẽ cho dự án này.*

1. Client gọi API **bắt đầu upload**; metadata service tạo bản ghi `uploading` và trả về danh sách **pre-signed URL** (đường dẫn có chữ ký, hết hạn sau vài phút) cho từng chunk.
2. Client **PUT thẳng từng chunk lên object storage** bằng URL đó, byte không chạm app server. Nhiều chunk có thể upload song song.
3. Khi xong, client (hoặc sự kiện từ storage) báo **commit**; metadata service kiểm tra đủ chunk và đổi trạng thái thành `ready`.
4. Với video, commit đẩy một công việc vào **queue** (bài 6); các worker **transcode** bất đồng bộ.
5. Kết quả (các độ phân giải) được **CDN** phục vụ cho người xem.

### 5. Chia chunk

Chia file thành các chunk (ví dụ 4–8 MB) mang lại:

- **Tiếp tục khi rớt mạng** (resumable): chỉ upload lại chunk còn thiếu.
- **Song song**: nhiều chunk cùng lúc tận dụng băng thông.
- **Đồng bộ tiết kiệm**: sửa một đoạn của file lớn chỉ cần upload chunk đổi (so bằng hash của chunk).
- **Khử trùng lặp** (deduplication): chunk có cùng hash chỉ lưu một lần.

Chunk quá nhỏ làm metadata phình ra và nhiều request; quá lớn thì mất lợi ích tiếp tục/song song.

### 6. Đồng bộ giữa thiết bị

Mỗi thiết bị nhớ một `version`/cursor; khi nối mạng, hỏi "có gì đổi sau cursor này?" (long polling hoặc thông báo đẩy báo có thay đổi, rồi kéo danh sách thay đổi). Hai thiết bị cùng sửa một file sinh ra **xung đột**: cách đơn giản là giữ cả hai (một bản "conflicted copy"), còn nhập tự động chỉ hợp với dữ liệu có cấu trúc.

### 7. Video: transcoding và streaming

Video gốc (một định dạng, một bitrate) không xem mượt trên mọi thiết bị. Worker **transcode** thành nhiều độ phân giải/bitrate, rồi cắt thành đoạn ngắn vài giây (HLS hoặc MPEG-DASH). Trình phát chọn đoạn theo băng thông hiện tại (**adaptive bitrate**) và nhảy mức chất lượng khi mạng đổi. Transcoding tốn CPU nên chạy bất đồng bộ theo hàng đợi, có thể scale số worker theo độ dài hàng đợi; người dùng thấy "đang xử lý" cho tới khi xong.

### 8. Phân phối và bảo mật

- **CDN** cache các đoạn video và file công khai gần người xem (bài 2, bài 4).
- Tải xuống riêng tư dùng **pre-signed URL ngắn hạn** sau khi metadata service kiểm tra quyền, thay vì để bucket công khai.
- Quét virus/nội dung bất đồng bộ trước khi trạng thái thành `ready`.
- Vòng đời dữ liệu: chuyển file ít dùng sang lớp lưu trữ rẻ hơn, xoá chunk mồ côi của upload dở.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Upload thẳng lên object storage | App server nhẹ, scale tốt | Phải xử lý URL ký, kiểm tra sau khi upload |
| Qua app server | Kiểm soát chặt, đơn giản ban đầu | Nghẽn băng thông, giữ kết nối lâu |
| Chunk nhỏ | Tiếp tục và đồng bộ mịn | Nhiều metadata, nhiều request |
| Chunk lớn | Ít request | Tải lại nhiều khi lỗi, đồng bộ thô |
| Khử trùng lặp | Tiết kiệm dung lượng | Phức tạp, đếm tham chiếu khi xoá, lo ngại riêng tư |
| Transcode bất đồng bộ | Không chặn người dùng, scale độc lập | Video chưa xem được ngay |
| Nhiều độ phân giải | Xem mượt mọi mạng | Tốn lưu trữ và CPU |
| Giữ cả hai bản khi xung đột | Không mất dữ liệu | Người dùng phải tự gộp |

## Sai lầm hay gặp

- Cho byte file đi qua app server rồi mới tới storage.
- Không có upload tiếp tục được; file 2 GB rớt ở 95% là bắt đầu lại.
- Để bucket công khai thay vì dùng URL ký, lộ file riêng tư.
- Pre-signed URL sống quá lâu, hoặc không giới hạn kích thước/loại file.
- Transcode đồng bộ trong request upload; request quá hạn.
- Xoá metadata mà quên xoá chunk (rác phình mãi), hoặc ngược lại xoá chunk còn được tham chiếu.
- Tin vào phần mở rộng/`Content-Type` do client khai; phải kiểm tra thật.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="case-file-storage" />

## Đọc thêm

- [AWS: Uploading objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [AWS: Multipart upload overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [RFC 8216: HTTP Live Streaming](https://www.rfc-editor.org/rfc/rfc8216)
- [MDN: Media streaming and adaptive bitrate](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/Live_streaming_web_audio_and_video)
- [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) (CC BY 4.0)

**Tiếp theo:** file đã lên, giờ cần báo cho người dùng đúng lúc. Bài 28: [Thiết kế hệ thống thông báo](./28-case-notification.md).
