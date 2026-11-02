import {t, q} from './t';

export default [
  q(
    t('Có composite index `(user_id, created_at)`. Truy vấn nào KHÔNG tận dụng được index này?', 'There is a composite index on `(user_id, created_at)`. Which query can NOT use it effectively?', '有联合索引 `(user_id, created_at)`。哪个查询无法有效利用它?'),
    [
      t('`WHERE user_id = 7`', '`WHERE user_id = 7`', '`WHERE user_id = 7`'),
      t('`WHERE user_id = 7 ORDER BY created_at DESC`', '`WHERE user_id = 7 ORDER BY created_at DESC`', '`WHERE user_id = 7 ORDER BY created_at DESC`'),
      t('`WHERE created_at > now() - interval \'1 day\'` (không có `user_id`)', '`WHERE created_at > now() - interval \'1 day\'` (no `user_id`)', '`WHERE created_at > now() - interval \'1 day\'`(没有 `user_id`)'),
      t('`WHERE user_id = 7 AND created_at > ...`', '`WHERE user_id = 7 AND created_at > ...`', '`WHERE user_id = 7 AND created_at > ...`'),
    ],
    2,
    t('Quy tắc leftmost prefix: index chỉ dùng hiệu quả khi truy vấn bắt đầu từ cột đầu tiên của nó.', 'Leftmost-prefix rule: the index is effective only when the query starts from its first column.', '最左前缀规则:查询必须从索引的第一列开始,索引才有效。'),
  ),
  q(
    t('`EXPLAIN` cho thấy `Seq Scan` trên bảng 200 triệu hàng cho truy vấn `WHERE email = ...`. Hành động hợp lý đầu tiên?', '`EXPLAIN` shows a `Seq Scan` on a 200-million-row table for `WHERE email = ...`. What is the sensible first action?', '`EXPLAIN` 显示对 2 亿行的表执行 `WHERE email = ...` 时是 `Seq Scan`。首先该做什么?'),
    [
      t('Tạo index trên `email` (với bảng đang chạy thì dùng chế độ không khóa)', 'Create an index on `email` (use the non-locking mode on a live table)', '在 `email` 上建索引(线上表用不加锁模式)'),
      t('Chia shard ngay', 'Shard immediately', '立刻分片'),
      t('Tăng RAM gấp đôi', 'Double the RAM', '内存翻倍'),
      t('Chuyển sang NoSQL', 'Switch to NoSQL', '换成 NoSQL'),
    ],
    0,
    t('Index đúng chỗ thường giải quyết ngay bước tối ưu rẻ nhất; chia shard hay đổi database là bước sau cùng.', 'The right index usually fixes it, the cheapest optimization; sharding or switching databases comes last.', '合适的索引往往直接解决问题,是最便宜的优化;分片或换数据库是最后一步。'),
  ),
  q(
    t('Vì sao LSM-tree ghi nhanh?', 'Why is an LSM-tree fast at writes?', '为什么 LSM 树写入很快?'),
    [
      t('Nó bỏ qua WAL nên không ghi gì ra đĩa', 'It skips the WAL so nothing is written to disk', '它跳过 WAL,所以不往磁盘写任何东西'),
      t('Nó sửa từng trang tại chỗ rất khéo', 'It modifies each page in place very cleverly', '它很巧妙地原地修改每个页'),
      t('Nó dùng hash để tìm đúng vị trí ghi', 'It uses a hash to find the exact write spot', '它用哈希找到准确的写入位置'),
      t('Ghi vào memtable trong RAM và flush ra đĩa thành file tuần tự; gộp file để sau', 'Writes go to an in-memory memtable and are flushed as sequential files; merging is deferred', '写入先进内存的 memtable,再顺序刷盘成文件;合并推迟到后台'),
    ],
    3,
    t('Ghi tuần tự nhanh hơn ghi ngẫu nhiên; cái giá là compaction nền và đọc có thể phải xem nhiều file.', 'Sequential I/O beats random I/O; the price is background compaction and reads that may touch several files.', '顺序 I/O 比随机 I/O 快;代价是后台 compaction,以及读取可能要查多个文件。'),
  ),
  q(
    t('Bloom filter trong LSM-tree dùng để làm gì?', 'What is a Bloom filter used for in an LSM-tree?', 'LSM 树里的布隆过滤器有什么用?'),
    [
      t('Nén dữ liệu trong SSTable', 'Compress data inside SSTables', '压缩 SSTable 中的数据'),
      t('Cho biết "chắc chắn không có" khóa trong file, để bỏ qua file đó khi đọc', 'Say "definitely not present" for a key in a file, so that file can be skipped on reads', '对某个键给出“肯定不在该文件中”的判断,读取时就能跳过这个文件'),
      t('Mã hoá dữ liệu', 'Encrypt the data', '加密数据'),
      t('Đảm bảo giao dịch ACID', 'Guarantee ACID transactions', '保证 ACID 事务'),
    ],
    1,
    t('Nó có thể báo nhầm "có thể có" (false positive) nhưng không bao giờ báo nhầm "không có" cho khóa đã tồn tại.', 'It may wrongly say "maybe present" (false positive) but never wrongly says "absent" for an existing key.', '它可能误报“可能存在”(假阳性),但对确实存在的键绝不会误报“不存在”。'),
  ),
  q(
    t('Bảng có cột `is_deleted` chỉ nhận hai giá trị, 99% là `false`. Thêm index trên cột này thì sao?', 'A table has an `is_deleted` column with two values, 99% `false`. What happens if you index it?', '表里有个只有两个取值的 `is_deleted` 列,99% 是 `false`。在它上面建索引会怎样?'),
    [
      t('Mọi truy vấn trên bảng đều nhanh hơn', 'Every query on the table gets faster', '表上所有查询都变快'),
      t('Truy vấn `WHERE is_deleted = false` hầu như không được lợi (độ chọn lọc thấp) mà ghi vẫn chậm đi', '`WHERE is_deleted = false` gains almost nothing (low selectivity) while writes still get slower', '`WHERE is_deleted = false` 几乎没收益(选择性低),写入却照样变慢'),
      t('Database tự chuyển sang LSM', 'The database switches to LSM automatically', '数据库自动切换成 LSM'),
      t('Index bị từ chối vì quá ít giá trị', 'The index is rejected for having too few values', '索引因取值太少而被拒绝'),
    ],
    1,
    t('Index chọn lọc thấp tốn chỗ và chi phí ghi mà ít giá trị; có thể dùng partial index cho phần ít gặp (`WHERE is_deleted`).', 'A low-selectivity index costs space and write time for little gain; a partial index on the rare value (`WHERE is_deleted`) can help.', '低选择性的索引白占空间和写入成本;对少见取值可考虑部分索引(`WHERE is_deleted`)。'),
  ),
];
