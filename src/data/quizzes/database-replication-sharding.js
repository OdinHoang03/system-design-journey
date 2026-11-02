import {t, q} from './t';

export default [
  q(
    t('Replication lag là gì và cách nào giúp người dùng không thấy dữ liệu cũ ngay sau khi ghi?', 'What is replication lag, and what helps users avoid stale data right after a write?', '什么是复制延迟?怎样让用户在刚写入后不看到旧数据?'),
    [
      t('Replica nhận ghi chậm hơn primary; đọc từ primary trong một khoảng ngắn sau khi ghi ("read-your-writes")', 'Replicas apply writes later than the primary; read from the primary briefly after a write ("read-your-writes")', '副本比主库晚应用写入;写入后短时间内从主库读取("read-your-writes")'),
      t('Primary chạy chậm; tăng CPU là hết', 'The primary is slow; adding CPU fixes it', '主库变慢;加 CPU 即可'),
      t('Dữ liệu bị mã hoá; giải mã là xong', 'Data is encrypted; decrypting fixes it', '数据被加密;解密即可'),
      t('Shard bị lệch; cân bằng lại shard', 'Shards are skewed; rebalance them', '分片倾斜;重新平衡分片'),
    ],
    0,
    t('Cách khác: ghim người dùng vào primary theo thời gian, hoặc đọc kèm phiên bản/token vị trí ghi.', 'Other options: pin the user to the primary for a while, or read with a version/write-position token.', '其他办法:在一段时间内把用户固定到主库,或带版本/写入位点令牌去读。'),
  ),
  q(
    t('Primary chết; replica 1 trễ 2 giây, replica 2 trễ 5 giây. Thăng cấp cái nào và có thể mất gì?', 'Primary dies; replica 1 lags 2 s, replica 2 lags 5 s. Which do you promote and what may be lost?', '主库宕机;副本 1 落后 2 秒,副本 2 落后 5 秒。提升哪个?可能丢什么?'),
    [
      t('Replica 2; mất 2 giây dữ liệu', 'Replica 2; lose 2 seconds of data', '副本 2;丢 2 秒数据'),
      t('Replica 1 (ít trễ hơn); có thể mất khoảng 2 giây ghi chưa kịp sao chép', 'Replica 1 (less lag); you may lose about 2 seconds of writes not yet replicated', '副本 1(落后更少);可能丢失约 2 秒尚未复制的写入'),
      t('Không cái nào; chờ primary sống lại', 'Neither; wait for the primary to return', '都不提升;等主库恢复'),
      t('Cả hai cùng thăng cấp', 'Promote both', '同时提升两个'),
    ],
    1,
    t('Chọn bản gần nhất để mất ít nhất; chấp nhận mất các ghi chưa sao chép (replication bất đồng bộ), hoặc dùng bán đồng bộ nếu không được phép mất.', 'Pick the most up-to-date copy to lose the least; accept losing un-replicated writes (async replication), or use semi-sync if loss is unacceptable.', '选最新的副本以丢得最少;接受丢失未复制的写入(异步复制),若不能丢则使用半同步。'),
  ),
  q(
    t('So sánh `hash(key) mod N` và consistent hashing khi thêm một shard.', 'Compare `hash(key) mod N` and consistent hashing when you add a shard.', '增加一个分片时,比较 `hash(key) mod N` 与一致性哈希。'),
    [
      t('Cả hai di chuyển khoảng một nửa số khóa', 'Both move about half of the keys', '两者都移动约一半的键'),
      t('`mod N` chỉ di chuyển ~1/N khóa, consistent hashing di chuyển gần hết', '`mod N` moves only ~1/N of keys, consistent hashing moves almost all', '`mod N` 只移动约 1/N 的键,一致性哈希几乎全部移动'),
      t('`mod N` đổi N nên gần như mọi khóa đổi shard; consistent hashing chỉ di chuyển khoảng 1/N khóa', '`mod N` changes N so almost every key changes shard; consistent hashing moves only about 1/N of keys', '`mod N` 的 N 变了,几乎所有键都换分片;一致性哈希只移动约 1/N 的键'),
      t('Không có khác biệt', 'There is no difference', '没有区别'),
    ],
    2,
    t('Di chuyển gần hết dữ liệu là cơn ác mộng vận hành; consistent hashing (kèm virtual node) giữ phần lớn khóa tại chỗ.', 'Moving almost all data is an operational nightmare; consistent hashing (with virtual nodes) keeps most keys in place.', '几乎迁移全部数据是运维噩梦;一致性哈希(配合虚拟节点)能让大部分键留在原地。'),
  ),
  q(
    t('Một "hot user" có hàng chục triệu người theo dõi. Hướng xử lý nào hợp lý?', 'A "hot user" has tens of millions of followers. Which handling makes sense?', '一个“热点用户”有数千万粉丝。哪种处理合理?'),
    [
      t('Để mọi thứ trên một shard và tăng RAM', 'Leave everything on one shard and add RAM', '全部放一个分片并加内存'),
      t('Cache mạnh dữ liệu của họ, nhân bản dữ liệu nóng và tách riêng (ví dụ fan-out lúc đọc cho tài khoản lớn)', 'Cache their data heavily, replicate the hot data and treat them specially (e.g. fan-out on read for big accounts)', '重度缓存其数据,复制热点数据并特殊处理(如大账号采用读时扩散)'),
      t('Chặn tài khoản đó', 'Block the account', '封禁该账号'),
      t('Chuyển sang `mod N` với N nhỏ hơn', 'Switch to `mod N` with a smaller N', '改用更小的 N 做 `mod N`'),
    ],
    1,
    t('Hash đều không giải quyết được tải dồn vào một khóa. Cần cache, nhân bản dữ liệu nóng, hoặc chia nhỏ khóa nóng.', 'Even hashing cannot fix load piled on one key. You need caching, replicating hot data, or splitting the hot key.', '均匀哈希解决不了负载集中在单个键的问题。需要缓存、复制热点数据或拆分热点键。'),
  ),
  q(
    t('Khi nào bạn *không* nên shard?', 'When should you *not* shard?', '什么时候*不应该*分片?'),
    [
      t('Khi một primary + replica + index/cache hợp lý vẫn còn dư sức', 'When one primary plus replicas and sensible indexes/caching still has headroom', '当一主多从加合理的索引/缓存仍有余量时'),
      t('Khi dữ liệu đã vượt xa một máy', 'When data already far exceeds one machine', '当数据量已远超单机时'),
      t('Khi ghi đã vượt khả năng của một primary', 'When writes already exceed what a primary can handle', '当写入已超出单个主库能力时'),
      t('Khi cần đạt độ trễ thấp', 'When you need low latency', '当需要低延迟时'),
    ],
    0,
    t('Shard làm truy vấn xuyên shard, giao dịch và vận hành phức tạp hơn nhiều. Chỉ shard khi các cách đơn giản hơn đã hết đường.', 'Sharding makes cross-shard queries, transactions and operations much harder. Shard only after simpler options run out.', '分片会让跨分片查询、事务和运维复杂得多。只有更简单的办法用尽后才分片。'),
  ),
];
