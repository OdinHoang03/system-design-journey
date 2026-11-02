---
id: security-basics
title: "Bảo mật cơ bản"
sidebar_position: 23
slug: /security-basics
description: "Authn vs authz, băm mật khẩu, session vs JWT, OAuth2/OIDC, TLS, quản lý secret và các lỗi OWASP hay gặp: injection, XSS, CSRF, IDOR."
---

> Hệ thống càng lớn, càng nhiều người muốn thử cửa; bảo mật là nhiều lớp khoá, không phải một ổ khoá to.

## Câu chuyện

NoteNest có một triệu người dùng. Một sáng, Minh nhận email từ một nhà nghiên cứu: đổi `/api/notes/1042` thành `/api/notes/1043` là đọc được ghi chú của người lạ. Cùng tuần, một dòng log lộ ra khoá API của dịch vụ email vì ai đó commit file `.env`, và đội hỗ trợ báo có tài khoản bị dò mật khẩu hàng nghìn lần mỗi phút.

Không lỗi nào cao siêu. Minh nhận ra mình đã lo scale mà quên hỏi: *ai đang gọi, họ được làm gì, và nếu một lớp thủng thì lớp sau còn gì?*

## Khái niệm sâu

### Authn, authz và sơ đồ các lớp

![Các lớp bảo mật](/img/diagrams/security-basics.svg)

*Hình tự vẽ cho dự án này; ý tưởng tham khảo từ [OWASP Top 10](https://owasp.org/www-project-top-ten/).*

- **Authentication (authn)**: bạn là ai? Mật khẩu, mã OTP, passkey.
- **Authorization (authz)**: bạn được làm gì? Kiểm tra *mỗi request, trên server*, theo từng tài nguyên.
- **Defense in depth**: nhiều lớp độc lập (TLS, gateway, kiểm tra quyền, mã hoá dữ liệu); lớp này thủng, lớp kia vẫn chặn.
- **Least privilege**: mỗi người dùng, dịch vụ, khoá chỉ có quyền tối thiểu cần thiết.

### Lưu mật khẩu

Không bao giờ lưu mật khẩu thô, cũng không dùng hash nhanh (MD5, SHA-256 trần). Dùng thuật toán **cố ý chậm** và có **salt** ngẫu nhiên riêng cho từng người: **argon2id**, **bcrypt** hoặc scrypt. Salt khiến hai người cùng mật khẩu có hash khác nhau và làm vô hiệu bảng tra sẵn (rainbow table). Chống dò mật khẩu bằng **rate limit** theo tài khoản + IP, khoá tạm, và MFA.

### Session vs JWT

| | Session (ID ngẫu nhiên, trạng thái ở server) | JWT (token tự mang thông tin, ký số) |
|---|---|---|
| Lưu ở | Server/Redis; cookie chỉ giữ ID | Client; server chỉ kiểm tra chữ ký |
| Thu hồi | Dễ: xoá session | Khó: hợp lệ đến khi hết hạn, cần danh sách thu hồi |
| Scale | Cần kho session dùng chung | Không cần tra cứu, hợp nhiều dịch vụ |

Thực tế hay dùng **access token ngắn hạn** (5–15 phút) cộng **refresh token** có thể thu hồi. Cookie nên có `HttpOnly`, `Secure`, `SameSite`; đừng để token trong `localStorage` nếu có thể tránh (XSS đọc được).

### OAuth2 và OIDC ở mức khái niệm

- **OAuth2** là uỷ quyền: người dùng cho ứng dụng A quyền truy cập dữ liệu ở dịch vụ B mà không đưa mật khẩu, thông qua **access token** có phạm vi (scope).
- **OpenID Connect (OIDC)** xếp lên trên OAuth2 để cho biết *người đó là ai* ("Đăng nhập bằng Google"), qua **ID token**.
- Luồng chuẩn cho web/mobile là **authorization code + PKCE**.

### TLS và secret

- **TLS** mã hoá và xác thực đường truyền (HTTPS); kết thúc ở load balancer/gateway thì mạng nội bộ cũng nên mã hoá (mTLS) nếu dữ liệu nhạy cảm.
- **Secret** (khoá API, mật khẩu DB) không nằm trong mã nguồn hay log. Dùng trình quản lý secret (Vault, AWS Secrets Manager…), cấp theo dịch vụ, **xoay vòng** định kỳ, và quét repo để bắt rò rỉ.

### Các lỗi OWASP hay gặp

- **Broken access control / IDOR**: truy cập tài nguyên người khác bằng cách đoán ID. Luôn kiểm tra "người này có quyền với *đối tượng này* không".
- **Injection (SQL...)**: nối chuỗi từ input vào câu lệnh. Dùng truy vấn tham số hoá.
- **XSS**: input chạy như script trong trình duyệt người khác. Escape đầu ra, CSP.
- **CSRF**: trang lạ khiến trình duyệt gửi request kèm cookie của bạn. `SameSite`, token CSRF.
- **Cấu hình sai và thư viện cũ**: cập nhật phụ thuộc, tắt cổng/tính năng không dùng.

## Đánh đổi

| Lựa chọn | Được | Mất |
|---|---|---|
| Session phía server | Thu hồi tức thì | Cần kho dùng chung; thêm một lần tra cứu |
| JWT | Không trạng thái, dễ scale | Khó thu hồi; token lộ là dùng được tới khi hết hạn |
| Token ngắn hạn + refresh | Giới hạn thiệt hại | Thêm độ phức tạp luồng làm mới |
| Hash chậm (argon2) | Khó brute-force | Tốn CPU lúc đăng nhập |
| MFA, rate limit chặt | Khó chiếm tài khoản | Người dùng thấy phiền |
| Tự làm đăng nhập | Toàn quyền kiểm soát | Dễ sai; dùng IdP (OIDC) thường an toàn hơn |

## Sai lầm hay gặp

- Chỉ kiểm tra quyền ở giao diện, không kiểm tra ở API (IDOR).
- Lưu mật khẩu bằng hash nhanh hoặc không salt.
- Tự nghĩ ra thuật toán mã hoá thay vì dùng thư viện đã kiểm chứng.
- JWT sống hàng tuần, không có cách thu hồi; hoặc đặt dữ liệu nhạy cảm trong payload (JWT chỉ được ký, không được mã hoá).
- Commit secret vào git, in secret ra log.
- Ghép chuỗi vào SQL "vì chỉ là việc nội bộ".
- Thông báo lỗi tiết lộ quá nhiều ("email không tồn tại" giúp kẻ dò tài khoản).
- Không giới hạn số lần đăng nhập sai.

## Bài tập & câu hỏi phỏng vấn

Chọn một đáp án cho mỗi câu; đáp án đúng và lời giải hiện ngay. Kết quả được lưu trong trình duyệt này.

<Quiz lessonId="security-basics" />

## Đọc thêm

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet: Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Cheat Sheet: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: Cookies và SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OAuth 2.0 Simplified](https://www.oauth.com/)
- [Mozilla: Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

**Tiếp theo:** phần Case study bắt đầu từ bài 7, [thiết kế URL shortener](./07-url-shortener.md); các case khác (bài 24 trở đi) sắp có.
