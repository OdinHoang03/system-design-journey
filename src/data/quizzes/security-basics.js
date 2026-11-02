import {t, q} from './t';

export default [
  q(
    t('Làm sao lưu mật khẩu đúng cách?', 'What is the right way to store passwords?', '存储密码的正确方式是什么?'),
    [
      t('SHA-256 một lần, không cần salt', 'A single SHA-256 with no salt', '单次 SHA-256,不加盐'),
      t('Mã hoá đối xứng để sau này giải mã gửi lại cho người dùng', 'Symmetric encryption so it can be decrypted and sent back later', '对称加密,以便日后解密发回给用户'),
      t('argon2id hoặc bcrypt với salt riêng cho từng người', 'argon2id or bcrypt with a per-user salt', '使用 argon2id 或 bcrypt,每个用户独立加盐'),
      t('Lưu thô nhưng khoá chặt database', 'Store plaintext but lock the database down', '存明文,但把数据库锁严'),
    ],
    2,
    t('Hash cố ý chậm có salt làm brute-force và rainbow table rất tốn kém; mật khẩu không bao giờ cần được giải ngược.', 'A deliberately slow, salted hash makes brute force and rainbow tables expensive; a password never needs to be recovered.', '故意放慢且加盐的哈希让暴力破解和彩虹表代价高昂;密码本来就不需要被还原。'),
  ),
  q(
    t('Người dùng đổi `/notes/1042` thành `/notes/1043` và đọc được ghi chú của người khác. Đây là lỗi gì và cách sửa?', 'A user changes `/notes/1042` to `/notes/1043` and reads someone else\'s note. What is this and how do you fix it?', '用户把 `/notes/1042` 改成 `/notes/1043` 就读到别人的笔记。这是什么漏洞,如何修复?'),
    [
      t('XSS; escape đầu ra', 'XSS; escape output', 'XSS;对输出转义'),
      t('IDOR / broken access control; kiểm tra quyền sở hữu trên server cho từng đối tượng', 'IDOR / broken access control; check ownership on the server for every object', 'IDOR / 访问控制失效;在服务端对每个对象检查所有权'),
      t('CSRF; thêm SameSite', 'CSRF; add SameSite', 'CSRF;添加 SameSite'),
      t('SQL injection; dùng UUID thay số nguyên là đủ', 'SQL injection; swapping integers for UUIDs is enough', 'SQL 注入;把整数换成 UUID 就够了'),
    ],
    1,
    t('UUID chỉ làm khó đoán, không thay thế việc kiểm tra quyền; authz phải chạy ở server cho mỗi request.', 'UUIDs only make guessing harder and do not replace a permission check; authz must run on the server for every request.', 'UUID 只是更难猜,不能代替权限检查;授权必须在服务端对每个请求执行。'),
  ),
  q(
    t('Điểm yếu chính của JWT so với session phía server là gì?', 'What is the main weakness of JWT compared with a server-side session?', '与服务端会话相比,JWT 的主要弱点是什么?'),
    [
      t('Khó thu hồi: token vẫn hợp lệ đến khi hết hạn nếu không có danh sách thu hồi', 'Hard to revoke: the token stays valid until expiry unless you keep a revocation list', '难以撤销:除非维护吊销列表,否则令牌到期前一直有效'),
      t('Không thể ký số', 'It cannot be signed', '无法签名'),
      t('Luôn được mã hoá nên không đọc được', 'It is always encrypted so it cannot be read', '总是加密的,因此无法读取'),
      t('Không dùng được với nhiều dịch vụ', 'It cannot be used across several services', '无法用于多个服务'),
    ],
    0,
    t('Vì thế hay dùng access token ngắn hạn cộng refresh token có thể thu hồi. Payload JWT chỉ được ký, ai cũng đọc được.', 'That is why short-lived access tokens plus revocable refresh tokens are common. A JWT payload is only signed; anyone can read it.', '所以常用短期访问令牌加可撤销的刷新令牌。JWT 载荷只是签名,任何人都能读。'),
  ),
  q(
    t('Phát biểu nào về OAuth2 và OIDC đúng?', 'Which statement about OAuth2 and OIDC is correct?', '关于 OAuth2 和 OIDC,哪项说法正确?'),
    [
      t('OAuth2 cho biết người dùng là ai; OIDC chỉ cấp quyền', 'OAuth2 tells you who the user is; OIDC only grants access', 'OAuth2 告诉你用户是谁;OIDC 只负责授权'),
      t('OAuth2 là uỷ quyền truy cập bằng token có scope; OIDC thêm ID token để biết người dùng là ai', 'OAuth2 delegates scoped access via tokens; OIDC adds an ID token to say who the user is', 'OAuth2 通过带范围的令牌委托访问;OIDC 增加 ID 令牌表明用户身份'),
      t('Cả hai đều yêu cầu app lưu mật khẩu của dịch vụ khác', 'Both require the app to store the other service\'s password', '两者都要求应用保存其他服务的密码'),
      t('Chúng thay thế TLS', 'They replace TLS', '它们取代 TLS'),
    ],
    1,
    t('Mục đích của OAuth2 là không phải trao mật khẩu; OIDC bổ sung phần danh tính ("Đăng nhập bằng Google").', 'OAuth2 exists so you never hand over a password; OIDC adds the identity part ("Sign in with Google").', 'OAuth2 的目的是无需交出密码;OIDC 补上身份部分(“用 Google 登录”)。'),
  ),
  q(
    t('Tài khoản bị dò mật khẩu hàng nghìn lần mỗi phút. Biện pháp nào hợp lý nhất?', 'Accounts are being guessed at thousands of attempts a minute. Which response makes the most sense?', '账号每分钟被尝试上千次密码。哪种措施最合理?'),
    [
      t('Giấu thông báo lỗi và hy vọng', 'Hide error messages and hope', '隐藏错误信息,听天由命'),
      t('Rate limit theo tài khoản và IP, khoá tạm sau nhiều lần sai, khuyến khích MFA', 'Rate limit per account and IP, lock temporarily after many failures, encourage MFA', '按账号和 IP 限流,多次失败后临时锁定,并推广 MFA'),
      t('Tăng độ dài tối đa của mật khẩu lên 1000 ký tự', 'Raise the maximum password length to 1000 characters', '把密码最大长度提高到 1000 个字符'),
      t('Chuyển hash sang MD5 cho nhanh', 'Switch the hash to MD5 for speed', '改用 MD5 提高速度'),
    ],
    1,
    t('Nhiều lớp độc lập (giới hạn tốc độ, khoá tạm, MFA) làm việc dò mật khẩu không còn kinh tế; hash nhanh làm tình hình tệ hơn.', 'Independent layers (rate limiting, lockouts, MFA) make guessing uneconomical; a faster hash makes things worse.', '多层独立防线(限流、锁定、MFA)让猜密码得不偿失;换更快的哈希只会更糟。'),
  ),
];
