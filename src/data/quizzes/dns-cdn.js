import {t, q} from './t';

export default [
  q(
    t('`dig +trace` đi qua các tầng theo thứ tự nào?', 'In what order does `dig +trace` walk the DNS hierarchy?', '`dig +trace` 按什么顺序遍历 DNS 层级?'),
    [
      t('Authoritative → TLD → root', 'Authoritative → TLD → root', '权威服务器 → TLD → 根'),
      t('TLD → root → authoritative', 'TLD → root → authoritative', 'TLD → 根 → 权威服务器'),
      t('Root → TLD → authoritative', 'Root → TLD → authoritative', '根 → TLD → 权威服务器'),
      t('Root → authoritative → TLD', 'Root → authoritative → TLD', '根 → 权威服务器 → TLD'),
    ],
    2,
    t('Root chỉ tới máy chủ của TLD (`.com`), TLD chỉ tới authoritative của domain, authoritative trả bản ghi cuối cùng.', 'Root points to the TLD servers (`.com`), the TLD points to the domain\'s authoritative servers, and those return the final record.', '根服务器指向 TLD(如 `.com`),TLD 指向该域名的权威服务器,权威服务器返回最终记录。'),
  ),
  q(
    t('Cần chuyển sang IP mới với downtime tối thiểu. Làm thế nào?', 'You must move to a new IP with minimal downtime. What do you do?', '需要迁移到新 IP 且停机时间最短,怎么做?'),
    [
      t('Đổi IP ngay, giữ TTL cũ 24 giờ', 'Switch the IP now and keep the old 24-hour TTL', '立刻换 IP,保持原来 24 小时的 TTL'),
      t('Hạ TTL xuống thấp trước, đợi hết TTL cũ, rồi mới đổi IP', 'Lower the TTL first, wait out the old TTL, then change the IP', '先调低 TTL,等旧 TTL 过期,再改 IP'),
      t('Xoá bản ghi rồi tạo lại sau', 'Delete the record and re-create it later', '先删除记录,之后再重建'),
      t('Tăng TTL lên thật cao rồi đổi IP', 'Raise the TTL very high, then change the IP', '把 TTL 调得很高,然后改 IP'),
    ],
    1,
    t('Resolver giữ bản ghi cũ đến hết TTL cũ. Hạ TTL trước để khi đổi IP, mọi người chuyển sang bản mới nhanh; xong có thể nâng TTL lại.', 'Resolvers keep the old record until the old TTL expires. Lowering it ahead of time makes the switch propagate quickly; raise it again afterwards.', '解析器会保留旧记录直到旧 TTL 过期。提前调低 TTL 能让切换迅速生效,完成后再调回去。'),
  ),
  q(
    t('Chiến lược cache nào hợp lý cho `app.js` có hash trong tên tệp (`app.3f9a1c.js`)?', 'Which caching strategy suits `app.js` with a content hash in its filename (`app.3f9a1c.js`)?', '对文件名带内容哈希的 `app.js`(`app.3f9a1c.js`),哪种缓存策略合适?'),
    [
      t('`Cache-Control: no-store`', '`Cache-Control: no-store`', '`Cache-Control: no-store`'),
      t('`Cache-Control: max-age=0`', '`Cache-Control: max-age=0`', '`Cache-Control: max-age=0`'),
      t('`Cache-Control: public, max-age=31536000, immutable`', '`Cache-Control: public, max-age=31536000, immutable`', '`Cache-Control: public, max-age=31536000, immutable`'),
      t('Không đặt header, để trình duyệt tự đoán', 'No header; let the browser guess', '不设置头部,让浏览器自己猜'),
    ],
    2,
    t('Nội dung đổi thì tên tệp đổi, nên bản cũ không bao giờ sai: cache một năm là an toàn.', 'When the content changes, the filename changes, so an old copy is never wrong: caching for a year is safe.', '内容变了文件名就变,旧副本永远不会出错,所以缓存一年是安全的。'),
  ),
  q(
    t('Khi nào *không nên* cache ở CDN?', 'When should you *not* cache at the CDN?', '什么时候*不应该*在 CDN 缓存?'),
    [
      t('Ảnh đại diện công khai', 'Public avatar images', '公开的头像图片'),
      t('Tệp CSS/JS có hash', 'Hashed CSS/JS files', '带哈希的 CSS/JS 文件'),
      t('Phản hồi riêng theo người dùng (ví dụ danh sách ghi chú đã đăng nhập) mà không phân biệt khóa', 'Per-user responses (e.g. a logged-in notes list) without varying the cache key', '按用户区分的响应(如登录后的笔记列表)且缓存键没有区分用户'),
      t('Trang chủ ít đổi', 'A rarely changing home page', '很少变化的首页'),
    ],
    2,
    t('Cache nhầm sẽ cho người này thấy dữ liệu người kia. Dữ liệu cá nhân dùng `private`/`no-store` hoặc phải đưa danh tính vào khóa.', 'A wrong cache hit shows one user another user\'s data. Personal data should use `private`/`no-store`, or the identity must be part of the key.', '缓存出错会让一个用户看到另一个用户的数据。个人数据应使用 `private`/`no-store`,或把身份纳入缓存键。'),
  ),
  q(
    t('Cách nào giảm cache stampede tại CDN?', 'Which technique reduces cache stampede at the CDN?', '哪种做法能减轻 CDN 处的缓存击穿(stampede)?'),
    [
      t('Request coalescing: chỉ một request về origin, các request còn lại chờ kết quả đó', 'Request coalescing: one request goes to origin and the rest wait for its result', '请求合并:只有一个请求回源,其余等待其结果'),
      t('Đặt TTL bằng 0 cho mọi thứ', 'Set TTL to 0 for everything', '把所有内容的 TTL 设为 0'),
      t('Tắt CDN trong giờ cao điểm', 'Turn the CDN off at peak hours', '高峰期关闭 CDN'),
      t('Cho mọi nút biên hết hạn đúng cùng một giây', 'Make every edge node expire in the same second', '让所有边缘节点在同一秒过期'),
    ],
    0,
    t('Khi một khóa nóng hết hạn, coalescing (hoặc `stale-while-revalidate`) ngăn hàng nghìn request cùng đổ về origin.', 'When a hot key expires, coalescing (or `stale-while-revalidate`) stops thousands of requests from hitting the origin together.', '热点键过期时,请求合并(或 `stale-while-revalidate`)可避免成千上万个请求同时涌向源站。'),
  ),
];
