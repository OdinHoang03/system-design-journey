import {t, q} from './t';

export default [
  q(
    t('Điểm khác chính giữa forward proxy và reverse proxy?', 'What is the key difference between a forward and a reverse proxy?', '正向代理与反向代理的主要区别是什么?'),
    [
      t('Forward proxy đứng phía client thay client ra Internet; reverse proxy đứng phía server thay các server nhận request', 'A forward proxy sits on the client side and goes out for the client; a reverse proxy sits on the server side and receives requests for the servers', '正向代理在客户端一侧代表客户端访问外部;反向代理在服务端一侧代表服务器接收请求'),
      t('Chúng giống hệt nhau', 'They are identical', '二者完全相同'),
      t('Reverse proxy chỉ dùng cho email', 'A reverse proxy is only for email', '反向代理只用于邮件'),
      t('Forward proxy luôn nhanh hơn', 'A forward proxy is always faster', '正向代理总是更快'),
    ],
    0,
    t('Load balancer và API gateway đều là biến thể của reverse proxy.', 'Load balancers and API gateways are both flavors of reverse proxy.', '负载均衡器和 API 网关都是反向代理的变体。'),
  ),
  q(
    t('TLS termination tại gateway nghĩa là gì và cái giá phải nghĩ tới?', 'What does TLS termination at the gateway mean, and what cost should you consider?', '在网关终止 TLS 是什么意思?需要考虑什么代价?'),
    [
      t('Gateway giải mã HTTPS, quản lý chứng chỉ ở một nơi; đổi lại lưu lượng nội bộ có thể không mã hoá nếu không dùng mTLS', 'The gateway decrypts HTTPS and manages certificates in one place; in return internal traffic may be unencrypted unless you use mTLS', '网关解密 HTTPS,证书集中管理;代价是不用 mTLS 时内部流量可能不加密'),
      t('Gateway tắt HTTPS hoàn toàn trên Internet', 'The gateway turns HTTPS off entirely on the Internet', '网关在互联网侧完全关闭 HTTPS'),
      t('Mỗi dịch vụ phải tự giữ chứng chỉ', 'Every service must hold its own certificate', '每个服务都要自己持有证书'),
      t('Không có đánh đổi nào', 'There is no trade-off', '没有任何代价'),
    ],
    0,
    t('Mạng nội bộ không nên mặc định là "an toàn"; với dữ liệu nhạy cảm hãy dùng mTLS bên trong.', 'Do not assume the internal network is "safe"; use mTLS inside for sensitive data.', '不要默认内网“安全”;对敏感数据应在内部使用 mTLS。'),
  ),
  q(
    t('Rủi ro lớn nhất của một API gateway là gì và cách giảm?', 'What is the biggest risk of an API gateway and how do you reduce it?', 'API 网关最大的风险是什么?如何降低?'),
    [
      t('Nó làm hệ thống chậm đi mãi mãi; không giảm được', 'It slows the system forever; it cannot be reduced', '它会永远拖慢系统;无法降低'),
      t('Là điểm chết duy nhất và nút thắt; chạy nhiều bản sau LB, giữ gateway mỏng, đặt timeout', 'It is a single point of failure and bottleneck; run several copies behind a load balancer, keep it thin, set timeouts', '它是单点故障和瓶颈;在负载均衡后运行多个副本,保持精简,设置超时'),
      t('Nó không thể ghi log', 'It cannot write logs', '它无法写日志'),
      t('Nó cấm dùng HTTPS', 'It forbids HTTPS', '它禁止使用 HTTPS'),
    ],
    1,
    t('Nhét logic nghiệp vụ vào gateway khiến nó thành "monolith mới".', 'Stuffing business logic into the gateway turns it into a "new monolith".', '把业务逻辑塞进网关会让它变成“新的单体”。'),
  ),
  q(
    t('Backend for Frontend (BFF) là gì?', 'What is a Backend for Frontend (BFF)?', '什么是 Backend for Frontend(BFF)?'),
    [
      t('Một cơ sở dữ liệu riêng cho giao diện', 'A dedicated database for the UI', '为界面准备的专用数据库'),
      t('Một gateway/backend riêng cho từng loại client, trả đúng hình dạng dữ liệu màn hình cần', 'A gateway/backend per client type that returns exactly the data shape each screen needs', '为每类客户端准备的网关/后端,返回每个页面恰好需要的数据形状'),
      t('Một thư viện CSS', 'A CSS library', '一个 CSS 库'),
      t('Tên khác của CDN', 'Another name for a CDN', 'CDN 的别名'),
    ],
    1,
    t('Đổi lại là phải duy trì nhiều gateway.', 'The cost is maintaining several gateways.', '代价是要维护多个网关。'),
  ),
  q(
    t('Vì sao gateway cần chuyển `X-Forwarded-For` và ghi đè header danh tính do client gửi?', 'Why must the gateway forward `X-Forwarded-For` and overwrite client-supplied identity headers?', '为什么网关要透传 `X-Forwarded-For` 并覆盖客户端自带的身份请求头?'),
    [
      t('Để log/giới hạn tốc độ thấy IP thật, và để client không giả mạo danh tính (ví dụ `X-User-Id`)', 'So logs/rate limits see the real IP, and clients cannot forge identity (e.g. `X-User-Id`)', '让日志/限流看到真实 IP,并防止客户端伪造身份(如 `X-User-Id`)'),
      t('Chỉ để làm đẹp log', 'Only to make logs prettier', '只是为了让日志更好看'),
      t('Vì HTTP bắt buộc', 'Because HTTP requires it', '因为 HTTP 要求如此'),
      t('Để tăng tốc độ tải trang', 'To make pages load faster', '为了加快页面加载'),
    ],
    0,
    t('Tin header từ client là lỗ hổng phổ biến; chỉ tin header do gateway tự đặt.', 'Trusting client headers is a common hole; trust only headers the gateway sets itself.', '信任客户端请求头是常见漏洞;只信任网关自己设置的请求头。'),
  ),
];
