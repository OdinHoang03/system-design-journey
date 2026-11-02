import {t, q} from './t';

export default [
  q(
    t('Client retry một request `POST /orders` (tạo đơn hàng) vì timeout. Điều gì có thể xảy ra?', 'A client retries `POST /orders` (create order) after a timeout. What can happen?', '客户端因超时重试 `POST /orders`(创建订单),可能发生什么?'),
    [
      t('Luôn chỉ tạo một đơn vì HTTP tự khử trùng lặp', 'Only one order is ever created because HTTP deduplicates', '只会创建一个订单,因为 HTTP 会自动去重'),
      t('Có thể tạo hai đơn vì `POST` không idempotent', 'Two orders may be created because `POST` is not idempotent', '可能创建两个订单,因为 `POST` 不是幂等的'),
      t('Server trả `405` vì không cho phép retry', 'The server returns `405` because retries are not allowed', '服务器返回 `405`,因为不允许重试'),
      t('Request thứ hai tự biến thành `PUT`', 'The second request silently becomes a `PUT`', '第二次请求会自动变成 `PUT`'),
    ],
    1,
    t('`PUT` đặt trạng thái cuối cùng nên gọi lại không đổi kết quả; `POST` tạo tài nguyên mới mỗi lần. Giải pháp: idempotency key.', '`PUT` sets a final state so repeating it changes nothing; `POST` creates a new resource each time. The fix: an idempotency key.', '`PUT` 设定最终状态,重复调用结果不变;`POST` 每次都会创建新资源。解决办法:幂等键。'),
  ),
  q(
    t('Muốn đánh dấu "đã đăng nhập" mà server không lưu session. Cách nào phù hợp?', 'You want to mark a user "logged in" without server-side sessions. Which fits?', '想在服务器不存会话的情况下标记“已登录”,哪种方式合适?'),
    [
      t('Token có chữ ký (ví dụ JWT) mà client gửi kèm mỗi request', 'A signed token (e.g. JWT) that the client sends with every request', '客户端每次请求携带的签名令牌(如 JWT)'),
      t('Lưu mật khẩu trong cookie để kiểm tra lại mỗi lần', 'Store the password in a cookie and re-check it each time', '把密码存在 cookie 里,每次重新校验'),
      t('Dùng địa chỉ IP của client làm danh tính', "Use the client's IP address as identity", '用客户端 IP 地址作为身份'),
      t('Dùng `GET` với `?user=alice` trên URL', 'Use `GET` with `?user=alice` in the URL', '在 URL 里用 `GET ?user=alice`'),
    ],
    0,
    t('Chữ ký cho phép server tin token mà không tra cứu session. Nhược điểm: khó thu hồi trước hạn, nên cần thời hạn ngắn.', 'The signature lets the server trust the token without a session lookup. Downside: hard to revoke early, so keep lifetimes short.', '签名让服务器无需查会话就能信任令牌。缺点:难以提前吊销,所以有效期要短。'),
  ),
  q(
    t('Khi nào WebSocket tốt hơn polling?', 'When is WebSocket a better choice than polling?', '什么时候 WebSocket 比轮询更合适?'),
    [
      t('Dữ liệu hiếm khi đổi, vài phút mới cần kiểm tra một lần', 'Data rarely changes; checking every few minutes is enough', '数据很少变化,几分钟查一次就够'),
      t('Cần tải một tệp tĩnh lớn đúng một lần', 'You need to download one large static file once', '只需一次性下载一个大的静态文件'),
      t('Cần cập nhật hai chiều, độ trễ thấp và thường xuyên (chat, giá cổ phiếu)', 'You need frequent, low-latency, two-way updates (chat, stock prices)', '需要频繁、低延迟的双向更新(聊天、股价)'),
      t('Muốn tận dụng cache của CDN cho từng phản hồi', 'You want the CDN to cache every response', '想让 CDN 缓存每一个响应'),
    ],
    2,
    t('Polling lãng phí request khi không có gì mới và chậm khi có. WebSocket giữ một kết nối mở nên server đẩy tin ngay.', 'Polling wastes requests when nothing changed and is slow when something did. A WebSocket keeps one connection open so the server can push at once.', '轮询在没有新数据时浪费请求,有新数据时又慢。WebSocket 保持一条长连接,服务器可立即推送。'),
  ),
  q(
    t('Dòng nào trong output `curl -v` là *request line*?', 'Which line of `curl -v` output is the *request line*?', '`curl -v` 输出中哪一行是*请求行*?'),
    [
      t('`< HTTP/2 200`', '`< HTTP/2 200`', '`< HTTP/2 200`'),
      t('`> GET / HTTP/2`', '`> GET / HTTP/2`', '`> GET / HTTP/2`'),
      t('`> Host: example.com`', '`> Host: example.com`', '`> Host: example.com`'),
      t('`< content-type: text/html`', '`< content-type: text/html`', '`< content-type: text/html`'),
    ],
    1,
    t('Dòng `>` là phía gửi đi: dòng đầu là request line (method, đường dẫn, phiên bản), các dòng sau là header. Dòng `<` là phản hồi; `200` nằm ở status line.', 'Lines with `>` are outgoing: the first is the request line (method, path, version), the rest are headers. Lines with `<` are the response; `200` is in the status line.', '以 `>` 开头的是发出的内容:第一行是请求行(方法、路径、版本),其余是请求头。以 `<` 开头的是响应;`200` 在状态行中。'),
  ),
  q(
    t('Trong cả hành trình từ lúc gõ URL đến lúc thấy trang, bước nào thường tốn thời gian nhất với người dùng ở xa?', 'From typing a URL to seeing the page, which step typically costs the most for a far-away user?', '从输入 URL 到看到页面,对远距离用户来说哪一步通常最耗时?'),
    [
      t('Trình duyệt phân tích HTML', 'The browser parsing the HTML', '浏览器解析 HTML'),
      t('Các vòng đi–về qua mạng (DNS, TCP, TLS, HTTP)', 'The network round trips (DNS, TCP, TLS, HTTP)', '网络往返(DNS、TCP、TLS、HTTP)'),
      t('Server định dạng JSON', 'The server formatting JSON', '服务器格式化 JSON'),
      t('Hệ điều hành mở cổng mạng', 'The OS opening a network port', '操作系统打开网络端口'),
    ],
    1,
    t('Mỗi vòng đi–về bị giới hạn bởi tốc độ ánh sáng và khoảng cách; đó là lý do cần DNS nhanh, kết nối tái sử dụng và CDN.', 'Every round trip is bounded by distance and the speed of light; that is why we want fast DNS, connection reuse and a CDN.', '每次往返都受距离和光速限制,这就是需要快速 DNS、连接复用和 CDN 的原因。'),
  ),
];
