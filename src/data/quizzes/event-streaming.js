import {t, q} from './t';

export default [
  q(
    t('Khác biệt cốt lõi giữa log kiểu Kafka và queue truyền thống là gì?', 'What is the core difference between a Kafka-style log and a traditional queue?', 'Kafka 式日志与传统队列的核心区别是什么?'),
    [
      t('Log giữ sự kiện sau khi đọc; mỗi consumer group tự giữ offset nên đọc độc lập và có thể đọc lại', 'The log keeps events after they are read; each consumer group keeps its own offset, so it reads independently and can re-read', '日志在读取后仍保留事件;每个消费者组各自维护偏移量,因此可独立读取并能重读'),
      t('Log luôn nhanh hơn ở mọi quy mô', 'A log is always faster at every scale', '日志在任何规模下都更快'),
      t('Log xoá message ngay khi ack', 'A log deletes the message on ack', '日志在 ack 时删除消息'),
      t('Log đảm bảo thứ tự toàn cục', 'A log guarantees global ordering', '日志保证全局顺序'),
    ],
    0,
    t('Queue xoá khi ack; log chỉ dời bookmark. Thứ tự toàn cục không có khi topic có nhiều partition.', 'A queue deletes on ack; a log only moves a bookmark. Global ordering does not exist once a topic has several partitions.', '队列在 ack 时删除;日志只移动书签。topic 有多个分区时没有全局顺序。'),
  ),
  q(
    t('Muốn mọi sự kiện của cùng một `note_id` được xử lý đúng thứ tự thì làm gì?', 'To process all events of the same `note_id` in order, what do you do?', '想让同一 `note_id` 的所有事件按顺序处理,该怎么做?'),
    [
      t('Dùng `note_id` làm key để chúng cùng vào một partition', 'Use `note_id` as the key so they land in the same partition', '用 `note_id` 作为 key,使它们进入同一分区'),
      t('Dùng một topic có 100 partition và key ngẫu nhiên', 'Use a topic with 100 partitions and random keys', '用 100 个分区的 topic 并使用随机 key'),
      t('Cho mỗi consumer đọc mọi partition', 'Have every consumer read every partition', '让每个消费者读取所有分区'),
      t('Sắp xếp lại ở client theo giờ hệ thống', 'Re-sort on the client by wall-clock time', '在客户端按系统时间重新排序'),
    ],
    0,
    t('Thứ tự chỉ được đảm bảo trong một partition; key cố định ánh xạ cùng một partition.', 'Ordering is guaranteed only within a partition; a fixed key maps to one partition.', '顺序只在单个分区内有保证;固定的 key 映射到同一分区。'),
  ),
  q(
    t('Topic có 6 partition, một consumer group có 10 consumer. Điều gì xảy ra?', 'A topic has 6 partitions and a consumer group has 10 consumers. What happens?', 'topic 有 6 个分区,消费者组有 10 个消费者。会发生什么?'),
    [
      t('Cả 10 đều làm việc, mỗi cái đọc 0,6 partition', 'All 10 work, each reading 0.6 of a partition', '10 个都工作,每个读 0.6 个分区'),
      t('Chỉ 6 consumer đọc dữ liệu, 4 cái còn lại ngồi chờ', 'Only 6 consumers read data; the other 4 sit idle', '只有 6 个消费者读数据,另外 4 个闲置'),
      t('Kafka tự thêm 4 partition', 'Kafka automatically adds 4 partitions', 'Kafka 自动增加 4 个分区'),
      t('Mọi consumer đọc trùng toàn bộ dữ liệu', 'Every consumer reads all data redundantly', '每个消费者都重复读取全部数据'),
    ],
    1,
    t('Mỗi partition chỉ do một consumer trong nhóm đọc, nên song song tối đa bằng số partition.', 'Each partition is read by one consumer in the group, so maximum parallelism equals the partition count.', '每个分区在组内只由一个消费者读取,所以最大并行度等于分区数。'),
  ),
  q(
    t('Một bug làm index tìm kiếm sai 3 ngày. Với event streaming, cách sửa hợp lý là gì?', 'A bug corrupted the search index for 3 days. With event streaming, what is a sensible fix?', '一个 bug 让搜索索引错了 3 天。用事件流,合理的修复方式是什么?'),
    [
      t('Xin lỗi người dùng và bỏ qua', 'Apologize to users and move on', '向用户道歉并不了了之'),
      t('Sửa bug, dời offset của group search về 3 ngày trước và xử lý lại (consumer phải idempotent)', 'Fix the bug, rewind the search group\'s offset 3 days and reprocess (consumers must be idempotent)', '修复 bug,把 search 组的偏移量回拨 3 天并重新处理(消费者必须幂等)'),
      t('Xoá topic và tạo lại', 'Delete the topic and recreate it', '删除 topic 并重建'),
      t('Chặn producer cho tới khi sửa xong', 'Block producers until the fix is done', '阻塞生产者直到修好为止'),
    ],
    1,
    t('Replay chỉ khả thi nếu retention còn đủ dài và xử lý idempotent, nếu không dữ liệu bị cộng trùng.', 'Replay works only if retention is long enough and processing is idempotent; otherwise data is double counted.', '回放的前提是保留期足够长且处理幂等,否则数据会被重复累加。'),
  ),
  q(
    t('Một tài khoản "nổi tiếng" tạo 60% lưu lượng và partition của nó luôn nghẽn. Đây là vấn đề gì và cách chữa?', 'A "celebrity" account produces 60% of traffic and its partition is always clogged. What is this and how do you fix it?', '一个“大 V”账号产生 60% 的流量,它所在的分区总是拥堵。这是什么问题,怎么解决?'),
    [
      t('Hot key; thêm hậu tố ngẫu nhiên vào key để rải ra nhiều partition, chấp nhận mất thứ tự chặt cho key đó', 'A hot key; add a random suffix to the key to spread it over partitions, accepting loss of strict ordering for that key', '热点 key;给 key 加随机后缀以分散到多个分区,接受该 key 失去严格顺序'),
      t('Consumer lag; thêm consumer vào nhóm là đủ', 'Consumer lag; adding consumers to the group is enough', '消费滞后;给组里加消费者就够了'),
      t('Compaction lỗi; tắt compaction', 'Broken compaction; turn compaction off', '压缩出错;关闭压缩'),
      t('Không có vấn đề, Kafka tự cân bằng theo key', 'No problem; Kafka rebalances by key automatically', '没问题,Kafka 会按 key 自动均衡'),
    ],
    0,
    t('Thêm consumer không giúp vì một partition chỉ một consumer đọc. Phải rải key ra.', 'More consumers do not help because one partition is read by one consumer. The key has to be spread out.', '加消费者没用,因为一个分区只由一个消费者读取。必须把 key 分散开。'),
  ),
];
