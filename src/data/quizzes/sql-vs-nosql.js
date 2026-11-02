import {t, q} from './t';

export default [
  q(
    t('Bước đầu tiên hợp lý nhất để chọn database cho một tính năng mới là gì?', 'What is the most sensible first step when choosing a database for a new feature?', '为新功能选数据库时,最合理的第一步是什么?'),
    [
      t('Xem công ty lớn nào đang dùng gì', 'See what big companies use', '看大公司在用什么'),
      t('Liệt kê các truy vấn chính và tải đọc/ghi dự kiến', 'List the main queries and the expected read/write load', '列出主要查询和预期的读写负载'),
      t('Chọn NoSQL vì scale tốt hơn', 'Pick NoSQL because it scales better', '选 NoSQL,因为扩展性更好'),
      t('Chọn database có nhiều tính năng nhất', 'Pick the database with the most features', '选功能最多的数据库'),
    ],
    1,
    t('Mô hình dữ liệu phải theo cách truy cập; tên gọi SQL hay NoSQL không trả lời được câu hỏi đó.', 'The data model should follow the access pattern; the SQL/NoSQL label does not answer that.', '数据模型应当跟随访问模式;SQL 或 NoSQL 的标签回答不了这个问题。'),
  ),
  q(
    t('Chuyển tiền giữa hai tài khoản bị lỗi giữa chừng: tài khoản A đã trừ nhưng B chưa cộng. Tính chất ACID nào ngăn chuyện này?', 'A money transfer fails midway: account A was debited but B was not credited. Which ACID property prevents this?', '转账中途出错:A 账户已扣款但 B 还没入账。哪项 ACID 性质能防止这种情况?'),
    [
      t('Atomicity (nguyên tử): hoặc làm trọn vẹn hoặc không làm gì', 'Atomicity: all or nothing', '原子性:要么全做要么全不做'),
      t('Durability (bền vững)', 'Durability', '持久性'),
      t('Isolation (cô lập)', 'Isolation', '隔离性'),
      t('Không tính chất nào; phải tự xử lý trong code', 'None; you must handle it in code', '都不行;必须自己在代码里处理'),
    ],
    0,
    t('Durability chỉ đảm bảo đã commit thì không mất; Isolation lo việc giao dịch chạy song song. Atomicity mới đảm bảo "tất cả hoặc không gì".', 'Durability only says committed data survives; Isolation covers concurrent transactions. Atomicity is what guarantees all-or-nothing.', '持久性只保证已提交的数据不丢;隔离性管并发事务。保证“全有或全无”的是原子性。'),
  ),
  q(
    t('Luồng "hoạt động gần đây" có hàng chục nghìn ghi mỗi giây, đọc chủ yếu theo `user_id` và thời gian. Mô hình nào thường hợp nhất?', 'A "recent activity" feed takes tens of thousands of writes per second and is read mostly by `user_id` and time. Which model usually fits best?', '“最近动态”流每秒有几万次写入,主要按 `user_id` 和时间读取。通常哪种模型最合适?'),
    [
      t('Bảng quan hệ chuẩn hoá cao với nhiều JOIN', 'A highly normalized relational schema with many JOINs', '高度范式化、有很多 JOIN 的关系表'),
      t('Đồ thị (graph database)', 'A graph database', '图数据库'),
      t('Wide-column, khóa hàng là `user_id`, cột sắp theo thời gian', 'Wide-column, row key `user_id`, columns ordered by time', '宽列型,行键为 `user_id`,列按时间排序'),
      t('Một file JSON trên đĩa', 'A JSON file on disk', '磁盘上的一个 JSON 文件'),
    ],
    2,
    t('Ghi khối lượng lớn theo khóa và đọc theo khóa + thời gian chính là sở trường của wide-column.', 'Huge keyed writes with key-and-time reads are exactly the wide-column sweet spot.', '按键的海量写入、按键+时间读取,正是宽列存储的强项。'),
  ),
  q(
    t('Câu nào về "schemaless" là đúng?', 'Which statement about "schemaless" is correct?', '关于“schemaless”,哪句话是对的?'),
    [
      t('Dữ liệu thực sự không có cấu trúc nên code không cần biết gì', 'The data truly has no structure, so code need not know anything', '数据真的没有结构,代码什么都不用知道'),
      t('Schema vẫn tồn tại, chỉ chuyển từ database sang code ứng dụng và dễ bị lệch', 'The schema still exists; it just moves from the database into application code and can drift', 'schema 依然存在,只是从数据库转移到应用代码里,而且容易漂移'),
      t('Không bao giờ cần migration', 'Migrations are never needed', '永远不需要迁移'),
      t('Chỉ có ở key-value', 'Only key-value stores have it', '只有键值存储才有'),
    ],
    1,
    t('Code đọc dữ liệu luôn giả định một hình dạng nào đó; khi bản ghi cũ và mới khác nhau, bạn tự gánh việc xử lý.', 'Code reading the data always assumes some shape; when old and new records differ, handling that is on you.', '读取数据的代码总会假定某种形状;新旧记录不一致时,要自己处理。'),
  ),
  q(
    t('NoteNest dùng Postgres cho ghi chú, wide-column cho luồng hoạt động và Redis cho phiên. Đây là mẫu gì, và cái giá chính?', 'NoteNest uses Postgres for notes, wide-column for the activity stream and Redis for sessions. What is this pattern and its main cost?', 'NoteNest 用 Postgres 存笔记、宽列存储放动态流、Redis 放会话。这是什么模式?主要代价是什么?'),
    [
      t('Sharding; cái giá là hot shard', 'Sharding; the cost is hot shards', '分片;代价是热点分片'),
      t('Replication; cái giá là replication lag', 'Replication; the cost is replication lag', '复制;代价是复制延迟'),
      t('Polyglot persistence; cái giá là vận hành nhiều kho và giữ dữ liệu đồng bộ giữa chúng', 'Polyglot persistence; the cost is operating several stores and keeping data in sync across them', '多模型持久化;代价是要运维多个存储并保持它们之间的数据同步'),
      t('Caching; cái giá là cache cũ', 'Caching; the cost is stale cache', '缓存;代价是缓存过期'),
    ],
    2,
    t('Mỗi kho đúng việc, nhưng thêm kho là thêm thứ phải sao lưu, giám sát và đồng bộ. Chỉ thêm khi có lý do đo được.', 'Each store fits its job, but every extra store is more to back up, monitor and sync. Add one only for a measured reason.', '每个存储各司其职,但多一个存储就多一份备份、监控和同步的负担。有可度量的理由再加。'),
  ),
];
