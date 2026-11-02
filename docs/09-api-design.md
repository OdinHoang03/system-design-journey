---
id: api-design
title: "Thiết kế API"
sidebar_position: 9
slug: /api-design
description: "REST, gRPC, GraphQL; phân trang, version, mã lỗi và idempotency key để API vừa dễ dùng vừa an toàn khi retry."
---

> API là hợp đồng: viết sai thì mọi client phải trả giá nhiều năm.

## Câu chuyện

NoteNest ra app di động. Nút "Lưu" gọi `POST /notes`. Ở vùng sóng yếu, app chờ quá lâu, tự động gửi lại, và người dùng thấy cùng một ghi chú xuất hiện hai lần. Chưa hết: danh sách ghi chú trả về toàn bộ 40.000 mục trong một phản hồi, và khi Minh đổi tên trường `title` thành `name`, app bản cũ trắng màn hình. Cả ba lỗi đều là lỗi thiết kế API, không phải lỗi code.

## Khái niệm sâu

### Chọn kiểu API

| Kiểu | Ý tưởng | Hợp với | Lưu ý |
|---|---|---|---|
| **REST** | Tài nguyên + động từ HTTP (`GET /notes/42`) | API công khai, CRUD, dễ cache | Có thể phải gọi nhiều lần để ghép dữ liệu |
| **gRPC** | Hợp đồng `.proto`, nhị phân, HTTP/2 | Gọi giữa các dịch vụ nội bộ, cần nhanh, có streaming | Trình duyệt khó gọi trực tiếp; khó đọc bằng mắt |
| **GraphQL** | Client tự chọn trường qua một endpoint | App có nhiều màn hình cần dữ liệu khác nhau | Cache khó hơn; cần giới hạn độ sâu/độ phức tạp truy vấn |

Không có kiểu "tốt nhất": REST ở rìa ngoài, gRPC bên trong là kết hợp rất phổ biến.

### Thiết kế REST cho tốt

- **Danh từ, không phải động từ**: `POST /notes`, `GET /notes/42`, `DELETE /notes/42`.
- Động từ đúng nghĩa: `GET` an toàn và lặp được; `PUT` và `DELETE` **idempotent** (gọi nhiều lần cho kết quả như gọi một lần); `POST` thì không.
- **Mã trạng thái** có ý nghĩa: `201` tạo xong, `400` request sai, `401` chưa xác thực, `403` không đủ quyền, `404` không có, `409` xung đột, `429` bị giới hạn tốc độ (bài 11), `5xx` lỗi phía server.
- **Lỗi có cấu trúc**: một mã lỗi máy đọc được, một thông điệp cho người, trường nào sai.

### Phân trang

Đừng trả toàn bộ danh sách.

| Cách | Cách chạy | Ưu | Nhược |
|---|---|---|---|
| **Offset/limit** | `?offset=100&limit=20` | Đơn giản, nhảy tới trang bất kỳ | Chậm khi offset lớn; trùng/sót mục khi dữ liệu đổi giữa các lần gọi |
| **Cursor (keyset)** | `?after=<con trỏ>&limit=20` | Nhanh, ổn định khi có dữ liệu mới | Không nhảy tới trang bất kỳ |

Với danh sách dài và liên tục thay đổi (feed, ghi chú), ưu tiên cursor.

### Version và tương thích ngược

- Thêm trường mới vào phản hồi là *tương thích*; đổi tên, xoá trường hay đổi kiểu là *phá vỡ*.
- Cách đặt version: trong đường dẫn (`/v1/notes`), trong header, hoặc không đặt mà chỉ thêm (additive-only) và cho trường cũ "ngừng dùng" từ từ.
- Client nên **bỏ qua trường lạ**; server nên **giữ trường cũ** cho tới khi đo được là không còn ai dùng.

### Idempotency key

![Idempotency key](/img/diagrams/api-design.svg)

*Hình tự vẽ cho dự án này.*

Vấn đề của `POST`: client không biết request đã thành công hay chưa khi bị timeout, nên gửi lại là rủi ro (tạo hai lần, trừ tiền hai lần). Cách giải: client sinh một **khoá duy nhất** cho mỗi *ý định* và gửi kèm (header `Idempotency-Key`). Server lưu khoá cùng kết quả; gặp lại khoá đó thì trả lại kết quả đã lưu thay vì làm lại.

```python
def create_note(req):
    key = req.headers["Idempotency-Key"]
    saved = key_store.get(key)
    if saved:
        return saved                       # retry: trả lại kết quả cũ
    note = db.insert_note(req.json)        # chỉ chạy một lần cho mỗi key
    resp = {"status": 201, "id": note.id}
    key_store.set(key, resp, ttl=24 * 3600)
    return resp
```

Chi tiết cần chú ý: việc ghi note và ghi khoá phải nguyên tử (cùng giao dịch, hoặc ràng buộc `UNIQUE` trên khoá), nếu không hai request đồng thời vẫn lọt qua.

### Các chi tiết khác

- **Xác thực** bằng token, không đưa bí mật trong URL.
- **Giới hạn kích thước** body và số mục mỗi trang.
- **Timeout & retry** phía client có backoff (bài 17).
- **Tài liệu hoá** bằng OpenAPI hoặc `.proto`; hợp đồng là nguồn sự thật để sinh code client.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| REST | Đơn giản, cache được, công cụ nhiều | Over/under-fetching, nhiều vòng gọi |
| gRPC | Nhanh, hợp đồng chặt, streaming | Khó dùng từ trình duyệt, khó debug bằng mắt |
| GraphQL | Client linh hoạt, ít vòng gọi | Cache và kiểm soát tải khó hơn |
| Offset | Dễ làm | Chậm và lệch khi dữ liệu lớn/đổi |
| Cursor | Nhanh, ổn định | Không nhảy trang, token khó đọc |
| Version trong đường dẫn | Rõ ràng, dễ định tuyến | Phải duy trì nhiều bản song song |
| Chỉ thêm, không phá vỡ | Không cần version | Phải mang theo trường cũ lâu |

## Sai lầm hay gặp

- Trả mọi thứ không phân trang rồi "để client lo".
- Đổi tên/xoá trường mà không báo, không cho thời gian chuyển tiếp.
- Mọi lỗi đều trả `200` kèm `{"error": ...}`, hoặc mọi lỗi đều `500`.
- `POST` tạo tài nguyên mà không có cách chống gửi trùng.
- Để lộ cấu trúc nội bộ (tên bảng, id tăng dần dễ đoán) ra API công khai.
- Lấy GraphQL cho mọi thứ mà không giới hạn độ sâu truy vấn.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="api-design" />

## Đọc thêm

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (phương thức, mã trạng thái, idempotent)
- [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [gRPC: Introduction](https://grpc.io/docs/what-is-grpc/introduction/)
- [GraphQL: Learn](https://graphql.org/learn/)

**Tiếp theo:** API đã rõ, giờ đặt một "cửa vào" chung trước các dịch vụ. Bài 10: [Reverse proxy & API gateway](./10-proxy-api-gateway.md).
