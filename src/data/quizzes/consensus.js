import {t, q} from './t';

export default [
  q(
    t('Cụm 5 node bị chia đôi mạng thành 3 + 2. Điều gì đúng với hệ đồng thuận dùng đa số (quorum)?', 'A 5-node cluster is split by the network into 3 + 2. What holds for a majority-quorum consensus system?', '5 节点集群被网络分成 3 + 2 两部分。对基于多数派(quorum)的共识系统,哪项正确?'),
    [
      t('Phía 3 node vẫn bầu leader và ghi được; phía 2 node không thể commit', 'The 3-node side can still elect a leader and write; the 2-node side cannot commit', '3 节点一侧仍能选主并写入;2 节点一侧无法提交'),
      t('Cả hai phía đều có leader và cùng ghi', 'Both sides get a leader and both accept writes', '两侧都有 leader 并都能写入'),
      t('Cả cụm dừng hẳn', 'The whole cluster stops', '整个集群停止'),
      t('Phía 2 node thắng vì có node cũ nhất', 'The 2-node side wins because it has the oldest node', '2 节点一侧获胜,因为含最老的节点'),
    ],
    0,
    t('Chỉ một phía có thể chiếm đa số (≥ 3/5), nên không thể có hai leader cùng commit: đó là cách tránh split brain.', 'Only one side can hold a majority (≥ 3/5), so two leaders can never both commit: this is how split brain is avoided.', '只有一侧能拥有多数(≥ 3/5),所以不可能两个 leader 同时提交,这就是避免脑裂的方式。'),
  ),
  q(
    t('Vì sao nên chạy cụm đồng thuận với số node lẻ (3, 5)?', 'Why run a consensus cluster with an odd number of nodes (3, 5)?', '为什么共识集群通常用奇数个节点(3、5)?'),
    [
      t('Số lẻ chạy nhanh hơn', 'Odd numbers run faster', '奇数更快'),
      t('4 node chịu được số lỗi bằng 3 node nhưng tốn thêm một máy', '4 nodes tolerate no more failures than 3 but cost one more machine', '4 个节点容忍的故障数与 3 个相同,却多花一台机器'),
      t('Giao thức chỉ chạy với số lẻ', 'The protocol only works with odd numbers', '协议只支持奇数'),
      t('Để có hai leader dự phòng', 'To have two spare leaders', '为了有两个备用 leader'),
    ],
    1,
    t('Đa số của 3 là 2 (chịu 1 lỗi); đa số của 4 là 3 (vẫn chỉ chịu 1 lỗi).', 'The majority of 3 is 2 (tolerates 1 failure); the majority of 4 is 3 (still only 1 failure).', '3 的多数是 2(容忍 1 个故障);4 的多数是 3(仍只容忍 1 个)。'),
  ),
  q(
    t('Worker A lấy lock có lease 10 giây, rồi bị GC pause 15 giây; worker B lấy lock và ghi. A tỉnh dậy và ghi tiếp. Cách chống?', 'Worker A holds a lock with a 10 s lease, then a 15 s GC pause hits; worker B takes the lock and writes. A wakes up and writes. How do you guard against it?', 'Worker A 持有租约 10 秒的锁,随后发生 15 秒 GC 停顿;B 拿到锁并写入;A 醒来继续写。如何防范?'),
    [
      t('Tăng lease lên 1 giờ', 'Raise the lease to 1 hour', '把租约加到 1 小时'),
      t('Fencing token: lock trả số tăng dần, nơi lưu trữ từ chối ghi có token nhỏ hơn token đã thấy', 'Fencing token: the lock returns an increasing number and the storage rejects writes with a token lower than one already seen', 'Fencing token:锁返回递增编号,存储端拒绝编号小于已见过编号的写入'),
      t('Cho A kiểm tra đồng hồ trước khi ghi', 'Have A check its clock before writing', '让 A 写入前检查时钟'),
      t('Không cần gì, lease đủ an toàn', 'Nothing; leases are safe enough', '无需处理,租约已足够安全'),
    ],
    1,
    t('Client không biết mình đã hết hạn lock (pause, đồng hồ lệch); chỉ nơi lưu trữ mới chặn được ghi muộn bằng fencing token.', 'A client cannot know its lock expired (pauses, clock skew); only the storage can block stale writes using a fencing token.', '客户端无法得知锁已过期(停顿、时钟偏差);只有存储端能凭 fencing token 拦截过期写入。'),
  ),
  q(
    t('Snowflake ID so với UUID v4 làm khóa chính: điểm khác chính?', 'Snowflake ID versus UUID v4 as a primary key: what is the main difference?', 'Snowflake ID 与 UUID v4 作主键相比,主要区别是什么?'),
    [
      t('Snowflake 128 bit và hoàn toàn ngẫu nhiên', 'Snowflake is 128-bit and fully random', 'Snowflake 是 128 位且完全随机'),
      t('Snowflake 64 bit, gần như tăng theo thời gian (timestamp + máy + sequence) nên index thân thiện; UUID v4 ngẫu nhiên làm index phân mảnh', 'Snowflake is 64-bit and roughly time-ordered (timestamp + machine + sequence), so it is index-friendly; random UUID v4 fragments the index', 'Snowflake 为 64 位,大致按时间递增(时间戳 + 机器 + 序号),对索引友好;随机的 UUID v4 会使索引碎片化'),
      t('Snowflake cần một server trung tâm cấp từng ID', 'Snowflake needs a central server to issue each ID', 'Snowflake 需要中心服务器逐个发号'),
      t('Không khác gì', 'There is no difference', '没有区别'),
    ],
    1,
    t('Snowflake sinh ID cục bộ, không phối hợp mỗi lần, nhưng phụ thuộc đồng hồ: lùi giờ có thể gây trùng hoặc lỗi.', 'Snowflake generates IDs locally with no per-ID coordination, but depends on the clock: a clock going backwards can cause duplicates or errors.', 'Snowflake 本地生成 ID、无需逐次协调,但依赖时钟:时钟回拨可能导致重复或报错。'),
  ),
  q(
    t('Khi nào nên dùng etcd/ZooKeeper trong hệ thống của bạn?', 'When should you use etcd/ZooKeeper in your system?', '什么时候该在系统里用 etcd/ZooKeeper?'),
    [
      t('Lưu mọi dữ liệu người dùng vì chúng nhất quán', 'To store all user data because they are consistent', '存放全部用户数据,因为它们一致'),
      t('Cho lượng dữ liệu nhỏ cần nhất quán mạnh: cấu hình, bầu leader, lock, service discovery', 'For small data needing strong consistency: configuration, leader election, locks, service discovery', '用于需要强一致的少量数据:配置、选主、锁、服务发现'),
      t('Làm cache cho trang chủ', 'As a cache for the home page', '作为首页缓存'),
      t('Thay load balancer', 'To replace the load balancer', '替代负载均衡器'),
    ],
    1,
    t('Đồng thuận đắt và thông lượng thấp; dùng cho "điều phối" nhỏ, không cho dữ liệu lớn.', 'Consensus is costly with low throughput; use it for small coordination data, not bulk data.', '共识代价高、吞吐低;适合小规模“协调”数据,不适合海量数据。'),
  ),
];
