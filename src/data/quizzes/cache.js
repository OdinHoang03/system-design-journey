import {t, q} from './t';

export default [
  q(
    t('Cache-aside cho `get_note(id)` hoạt động thế nào?', 'How does cache-aside work for `get_note(id)`?', '`get_note(id)` 的 cache-aside 如何工作?'),
    [
      t('Đọc cache; miss thì đọc DB rồi ghi vào cache (kèm TTL); khi sửa ghi chú thì xoá khóa', 'Read cache; on a miss read the DB and fill the cache (with TTL); delete the key when the note is edited', '先读缓存;未命中则读数据库并写入缓存(带 TTL);修改笔记时删除该键'),
      t('Luôn ghi cache trước, DB ghi sau không cần đợi', 'Always write the cache first and the DB later without waiting', '总是先写缓存,数据库稍后异步写'),
      t('Chỉ đọc DB, cache chỉ để backup', 'Read only the DB; the cache is just a backup', '只读数据库,缓存仅作备份'),
      t('Cache tự biết khi DB đổi', 'The cache knows by itself when the DB changes', '缓存会自动感知数据库变化'),
    ],
    0,
    t('Ứng dụng tự quản lý cache ("bên cạnh" DB). Xoá khóa khi ghi tránh phục vụ bản cũ.', 'The application manages the cache itself ("aside" from the DB). Deleting the key on write avoids serving stale data.', '应用自己管理缓存(位于数据库“旁边”)。写入时删除键可避免返回旧数据。'),
  ),
  q(
    t('Hit ratio tăng từ 90% lên 99%: lượng truy vấn tới DB giảm bao nhiêu lần?', 'Hit ratio goes from 90% to 99%: by what factor do DB queries drop?', '命中率从 90% 升到 99%,数据库查询量减少多少倍?'),
    [
      t('Khoảng 1,1 lần', 'About 1.1×', '约 1.1 倍'),
      t('Khoảng 2 lần', 'About 2×', '约 2 倍'),
      t('Khoảng 10 lần', 'About 10×', '约 10 倍'),
      t('Khoảng 100 lần', 'About 100×', '约 100 倍'),
    ],
    2,
    t('DB nhận phần miss: 10% → 1%, tức giảm 10 lần. Vì vậy vài điểm phần trăm cuối của hit ratio rất đáng giá.', 'The DB gets the misses: 10% → 1%, a 10× drop. That is why the last few points of hit ratio matter so much.', '数据库承担未命中部分:10% → 1%,即减少 10 倍。因此命中率最后几个百分点非常有价值。'),
  ),
  q(
    t('Cache stampede là gì và cách giảm nhẹ nào đúng?', 'What is a cache stampede and which mitigation is right?', '什么是缓存击穿(stampede),哪种缓解方式正确?'),
    [
      t('Cache đầy bộ nhớ; giải pháp là tăng RAM', 'The cache runs out of memory; fix by adding RAM', '缓存内存用满;解决办法是加内存'),
      t('Một khóa nóng hết hạn và rất nhiều request cùng miss đổ vào DB; dùng khoá chống trùng, TTL có jitter, hoặc stale-while-revalidate', 'A hot key expires and many requests miss at once and hit the DB; use a dedup lock, TTL jitter, or stale-while-revalidate', '热点键过期,大量请求同时未命中并涌向数据库;用防重复锁、TTL 抖动或 stale-while-revalidate'),
      t('Truy vấn khóa không tồn tại; dùng Bloom filter', 'Queries for keys that do not exist; use a Bloom filter', '查询不存在的键;用布隆过滤器'),
      t('Cache sập hoàn toàn; giải pháp là bỏ cache', 'The cache goes down; fix by removing the cache', '缓存整体宕机;解决办法是去掉缓存'),
    ],
    1,
    t('Phương án 3 là cache penetration, phương án 4 gần với avalanche. Ba bệnh này có cách trị khác nhau.', 'Option 3 is cache penetration and option 4 is close to avalanche. The three problems have different cures.', '第三项是缓存穿透,第四项接近缓存雪崩。三者解法各不相同。'),
  ),
  q(
    t('Khi nào chọn write-through thay vì cache-aside, và write-back có rủi ro gì?', 'When pick write-through over cache-aside, and what is write-back\'s risk?', '什么时候选 write-through 而非 cache-aside?write-back 有什么风险?'),
    [
      t('Write-through khi cần cache luôn nhất quán với DB; write-back ghi cực nhanh nhưng có thể mất dữ liệu nếu cache sập trước khi đẩy xuống DB', 'Write-through when the cache must stay consistent with the DB; write-back is very fast but can lose data if the cache dies before flushing to the DB', '需要缓存与数据库始终一致时用 write-through;write-back 写入极快,但缓存在刷盘前宕机会丢数据'),
      t('Write-through luôn nhanh hơn; write-back không có rủi ro', 'Write-through is always faster; write-back has no risk', 'write-through 总是更快;write-back 没有风险'),
      t('Chúng giống nhau, chỉ khác tên', 'They are the same thing under different names', '二者只是名称不同'),
      t('Write-back dùng cho dữ liệu tài chính cần bền vững tuyệt đối', 'Write-back is for financial data that must be fully durable', 'write-back 适用于必须绝对持久的金融数据'),
    ],
    0,
    t('Write-through chậm hơn vì ghi cả hai nơi đồng bộ. Write-back đánh đổi độ bền lấy tốc độ.', 'Write-through is slower because it writes both places synchronously. Write-back trades durability for speed.', 'write-through 同步写两处,所以更慢。write-back 用持久性换取速度。'),
  ),
  q(
    t('LRU cài đặt với độ phức tạp O(1) cho cả `get` và `put` bằng cấu trúc nào?', 'Which structure gives LRU O(1) for both `get` and `put`?', '用哪种结构可使 LRU 的 `get` 和 `put` 都是 O(1)?'),
    [
      t('Mảng đã sắp xếp', 'A sorted array', '有序数组'),
      t('Hash map kết hợp danh sách liên kết đôi', 'A hash map plus a doubly linked list', '哈希表加双向链表'),
      t('Cây nhị phân tìm kiếm', 'A binary search tree', '二叉搜索树'),
      t('Một hàng đợi đơn giản', 'A simple queue', '简单队列'),
    ],
    1,
    t('Hash map tìm node trong O(1); danh sách liên kết đôi chuyển node lên đầu và bỏ node cuối trong O(1).', 'The hash map finds a node in O(1); the doubly linked list moves a node to the front and drops the tail in O(1).', '哈希表 O(1) 找到节点;双向链表 O(1) 把节点移到队头并移除队尾。'),
  ),
];
