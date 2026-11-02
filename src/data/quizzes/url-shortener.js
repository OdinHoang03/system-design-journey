import {t, q} from './t';

export default [
  q(
    t('Tăng lên 1 tỷ link/tháng, thành phần nào thường phải đổi trước?', 'Growing to 1 billion links/month, which component usually has to change first?', '增长到每月 10 亿条链接时,通常最先需要改变的是哪个组件?'),
    [
      t('Màu giao diện', 'The UI colours', '界面颜色'),
      t('Lưu trữ và đọc: dung lượng DB, QPS đọc, cache, phân mảnh dữ liệu', 'Storage and reads: DB capacity, read QPS, caching, sharding', '存储与读取:数据库容量、读 QPS、缓存、分片'),
      t('Tên miền', 'The domain name', '域名'),
      t('Ngôn ngữ lập trình', 'The programming language', '编程语言'),
    ],
    1,
    t('Hệ thống nghiêng về đọc (đọc nhiều hơn ghi rất nhiều), nên nút thắt đầu tiên nằm ở lưu trữ và đường đọc.', 'The system is read-heavy (far more reads than writes), so the first bottleneck is storage and the read path.', '该系统以读为主(读远多于写),所以最先出现瓶颈的是存储和读取路径。'),
  ),
  q(
    t('Cách sinh mã ngắn nào tránh va chạm mà không cần kiểm tra lại DB mỗi lần?', 'Which short-code scheme avoids collisions without checking the DB each time?', '哪种短码生成方式无需每次查库即可避免冲突?'),
    [
      t('Hash URL rồi cắt 7 ký tự đầu', 'Hash the URL and cut the first 7 characters', '对 URL 取哈希并截取前 7 个字符'),
      t('Số ngẫu nhiên 7 ký tự, mặc kệ va chạm', 'A random 7-character string, ignoring collisions', '随机 7 位字符串,不管冲突'),
      t('Bộ đếm/ID tăng dần duy nhất (cấp theo lô cho từng server) rồi mã hoá base62', 'A unique increasing counter/ID (handed out in batches per server), then base62-encoded', '全局唯一递增计数器/ID(按批分配给各服务器),再做 base62 编码'),
      t('Dùng chính URL gốc làm mã', 'Use the original URL as the code', '直接用原始 URL 作为短码'),
    ],
    2,
    t('ID duy nhất mã hoá base62 không bao giờ trùng. Hash cắt ngắn và số ngẫu nhiên đều có thể va chạm; đổi lại ID tăng dần dễ đoán nên có thể cần xáo trộn.', 'A unique ID encoded in base62 never collides. Truncated hashes and random strings can collide; sequential IDs are guessable, so you may need to scramble them.', '唯一 ID 经 base62 编码不会冲突。截断哈希和随机串都可能冲突;递增 ID 容易被猜到,可能需要打散。'),
  ),
  q(
    t('"Link tự huỷ sau N lần click" gặp vấn đề tương tranh nào?', 'A "link expires after N clicks" feature runs into which concurrency problem?', '“点击 N 次后自动失效”的功能会遇到什么并发问题?'),
    [
      t('Nhiều request đọc–rồi–ghi bộ đếm cùng lúc có thể vượt quá N; cần cập nhật nguyên tử (ví dụ `UPDATE ... WHERE remaining > 0`)', 'Many concurrent read-then-write counter updates can exceed N; use an atomic update (e.g. `UPDATE ... WHERE remaining > 0`)', '多个并发的“读后写”计数更新可能超过 N;需使用原子更新(如 `UPDATE ... WHERE remaining > 0`)'),
      t('Không có vấn đề gì', 'No problem at all', '没有任何问题'),
      t('Chỉ vấn đề giao diện', 'Only a UI problem', '只是界面问题'),
      t('Cache luôn tự đếm đúng', 'The cache always counts correctly on its own', '缓存总会自己计数正确'),
    ],
    0,
    t('Cache cũng làm khó: lượt click phục vụ từ cache không chạm DB, nên bộ đếm phải nằm ở nơi nguyên tử và dùng chung (ví dụ Redis `DECR`).', 'The cache complicates it too: clicks served from cache never touch the DB, so the counter must live somewhere atomic and shared (e.g. Redis `DECR`).', '缓存也会带来麻烦:命中缓存的点击不会访问数据库,所以计数器必须放在原子且共享的地方(如 Redis `DECR`)。'),
  ),
  q(
    t('Thống kê "top link theo quốc gia trong 24 giờ": hướng nào hợp lý ở quy mô lớn?', 'For "top links per country in the last 24 h" at large scale, which approach fits?', '“24 小时内各国热门链接”在大规模下,哪种方式合适?'),
    [
      t('Mỗi lần xem, quét toàn bộ bảng click', 'Scan the whole click table on every view', '每次查看都全表扫描点击表'),
      t('Ghi sự kiện click vào queue/log, gộp theo cửa sổ thời gian (stream/batch) vào bảng tổng hợp để đọc nhanh', 'Write click events to a queue/log, aggregate by time window (stream/batch) into a summary table for fast reads', '把点击事件写入队列/日志,按时间窗口(流/批)聚合到汇总表以便快速读取'),
      t('Hỏi người dùng', 'Ask the users', '询问用户'),
      t('Chỉ lưu trong RAM của một server', 'Keep it only in one server\'s RAM', '只存在单台服务器内存里'),
    ],
    1,
    t('Đường chuyển hướng phải nhanh nên không tính thống kê đồng bộ; đẩy sự kiện ra ngoài và tổng hợp bất đồng bộ.', 'The redirect path must stay fast, so do not compute stats inline; emit events and aggregate asynchronously.', '重定向路径必须保持快速,所以不要同步计算统计;把事件发出去再异步聚合。'),
  ),
  q(
    t('Cache chết hoàn toàn. Hệ thống nên phản ứng thế nào?', 'The cache dies completely. How should the system react?', '缓存完全宕机,系统应如何应对?'),
    [
      t('Sập theo, trả lỗi cho mọi người', 'Go down with it, returning errors to everyone', '跟着宕机,对所有人返回错误'),
      t('Đọc xuống DB nhưng có giới hạn tốc độ/bảo vệ DB, và làm nóng lại cache dần dần', 'Fall back to the DB with rate limiting/protection, and warm the cache gradually', '回退读数据库,但要限流保护数据库,并逐步预热缓存'),
      t('Tắt hết các replica', 'Turn off all replicas', '关闭所有副本'),
      t('Xoá DB cho nhẹ', 'Delete the DB to lighten the load', '删除数据库以减轻负担'),
    ],
    1,
    t('Cache là tối ưu chứ không phải nguồn sự thật. Nếu DB không chịu nổi toàn bộ tải, cần load shedding để giữ dịch vụ sống.', 'The cache is an optimisation, not the source of truth. If the DB cannot take the full load, shed load to stay alive.', '缓存是优化手段而不是事实来源。若数据库扛不住全部流量,需要丢弃部分请求来保住服务。'),
  ),
];
