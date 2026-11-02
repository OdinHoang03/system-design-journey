// Single source of truth for the whole curriculum outline: 6 parts, 29 lessons.
// `done: true` lessons have a doc (id = doc id). Lessons 1-7 keep their numbers;
// new lessons are numbered from 8. Keep sidebars.js part/doc ids in sync with this file.
export const parts = [
  {
    key: 'foundations',
    title: {vi: 'Nền tảng', en: 'Foundations', zh: '基础'},
    lessons: [
      {n: 1, id: 'client-server-http', done: true, title: {vi: 'Client–server & HTTP', en: 'Client–server & HTTP', zh: '客户端–服务器与 HTTP'}},
      {n: 2, id: 'dns-cdn', done: true, title: {vi: 'DNS & CDN', en: 'DNS & CDN', zh: 'DNS 与 CDN'}},
      {n: 8, id: 'estimation', title: {vi: 'Ước lượng quy mô (back-of-envelope)', en: 'Back-of-the-envelope estimation', zh: '规模估算'},
        sum: {vi: 'QPS, băng thông, dung lượng lưu trữ; con số cần thuộc.', en: 'QPS, bandwidth, storage; the numbers worth memorizing.', zh: 'QPS、带宽、存储量;值得记住的数字。'}},
      {n: 9, id: 'api-design', title: {vi: 'Thiết kế API', en: 'API design', zh: 'API 设计'},
        sum: {vi: 'REST, gRPC, GraphQL; phân trang, version, idempotency key.', en: 'REST, gRPC, GraphQL; pagination, versioning, idempotency keys.', zh: 'REST、gRPC、GraphQL;分页、版本、幂等键。'}},
    ],
  },
  {
    key: 'scaling',
    title: {vi: 'Scale & hiệu năng', en: 'Scaling & performance', zh: '扩展与性能'},
    lessons: [
      {n: 3, id: 'load-balancer', done: true, title: {vi: 'Load balancer & scale ngang', en: 'Load balancer & horizontal scaling', zh: '负载均衡与水平扩展'}},
      {n: 4, id: 'cache', done: true, title: {vi: 'Cache', en: 'Caching', zh: '缓存'}},
      {n: 10, id: 'proxy-api-gateway', title: {vi: 'Reverse proxy & API gateway', en: 'Reverse proxy & API gateway', zh: '反向代理与 API 网关'},
        sum: {vi: 'Một cửa vào: định tuyến, xác thực, TLS termination.', en: 'One front door: routing, auth, TLS termination.', zh: '统一入口:路由、认证、TLS 终止。'}},
      {n: 11, id: 'rate-limiting', title: {vi: 'Rate limiting', en: 'Rate limiting', zh: '限流'},
        sum: {vi: 'Token bucket, sliding window; giới hạn ở đâu và theo gì.', en: 'Token bucket, sliding window; where to limit and by what key.', zh: '令牌桶、滑动窗口;在哪里限、按什么限。'}},
    ],
  },
  {
    key: 'data',
    title: {vi: 'Dữ liệu', en: 'Data', zh: '数据'},
    lessons: [
      {n: 5, id: 'database-replication-sharding', done: true, title: {vi: 'Database: replication & sharding', en: 'Database: replication & sharding', zh: '数据库:复制与分片'}},
      {n: 12, id: 'sql-vs-nosql', title: {vi: 'SQL vs NoSQL', en: 'SQL vs NoSQL', zh: 'SQL 与 NoSQL'},
        sum: {vi: 'Mô hình dữ liệu, ACID vs BASE, khi nào chọn gì.', en: 'Data models, ACID vs BASE, when to pick which.', zh: '数据模型、ACID 与 BASE、如何选择。'}},
      {n: 13, id: 'indexing-storage-engines', title: {vi: 'Index & storage engine', en: 'Indexing & storage engines', zh: '索引与存储引擎'},
        sum: {vi: 'B-tree vs LSM-tree, đọc nhanh hay ghi nhanh.', en: 'B-tree vs LSM-tree: fast reads or fast writes.', zh: 'B 树与 LSM 树:读快还是写快。'}},
      {n: 14, id: 'consistency-cap', title: {vi: 'Nhất quán & CAP', en: 'Consistency & CAP', zh: '一致性与 CAP'},
        sum: {vi: 'Strong, eventual, PACELC; chọn mức nhất quán theo bài toán.', en: 'Strong, eventual, PACELC; choosing consistency per problem.', zh: '强一致、最终一致、PACELC;按场景选择一致性。'}},
      {n: 15, id: 'object-storage-search', title: {vi: 'Object storage & tìm kiếm', en: 'Object storage & search', zh: '对象存储与搜索'},
        sum: {vi: 'Lưu file lớn (S3), inverted index, full-text search.', en: 'Large files (S3), inverted index, full-text search.', zh: '大文件(S3)、倒排索引、全文搜索。'}},
    ],
  },
  {
    key: 'async',
    title: {vi: 'Bất đồng bộ & độ tin cậy', en: 'Async & reliability', zh: '异步与可靠性'},
    lessons: [
      {n: 6, id: 'message-queue', done: true, title: {vi: 'Message queue & xử lý bất đồng bộ', en: 'Message queues & asynchronous processing', zh: '消息队列与异步处理'}},
      {n: 16, id: 'event-streaming', title: {vi: 'Event streaming (Kafka)', en: 'Event streaming (Kafka)', zh: '事件流(Kafka)'},
        sum: {vi: 'Log, partition, consumer group, replay.', en: 'Log, partitions, consumer groups, replay.', zh: '日志、分区、消费者组、回放。'}},
      {n: 17, id: 'reliability-patterns', title: {vi: 'Mẫu thiết kế chịu lỗi', en: 'Reliability patterns', zh: '容错模式'},
        sum: {vi: 'Timeout, retry + backoff, circuit breaker, bulkhead.', en: 'Timeouts, retry + backoff, circuit breaker, bulkhead.', zh: '超时、退避重试、熔断、舱壁。'}},
      {n: 18, id: 'distributed-transactions', title: {vi: 'Giao dịch phân tán & saga', en: 'Distributed transactions & saga', zh: '分布式事务与 Saga'},
        sum: {vi: '2PC, saga, outbox; giữ dữ liệu đúng qua nhiều dịch vụ.', en: '2PC, saga, outbox: keeping data correct across services.', zh: '2PC、Saga、Outbox:跨服务保持数据正确。'}},
      {n: 19, id: 'consensus', title: {vi: 'Đồng thuận & bầu leader', en: 'Consensus & leader election', zh: '共识与选主'},
        sum: {vi: 'Raft/Paxos ở mức trực giác, lock phân tán, ID duy nhất.', en: 'Raft/Paxos intuition, distributed locks, unique IDs.', zh: 'Raft/Paxos 直觉、分布式锁、唯一 ID。'}},
    ],
  },
  {
    key: 'operations',
    title: {vi: 'Vận hành & kiến trúc', en: 'Operations & architecture', zh: '运维与架构'},
    lessons: [
      {n: 20, id: 'monolith-microservices', done: true, title: {vi: 'Monolith vs microservices', en: 'Monolith vs microservices', zh: '单体与微服务'},
        sum: {vi: 'Khi nào tách dịch vụ và cái giá phải trả.', en: 'When to split services, and what it costs.', zh: '何时拆分服务,以及代价。'}},
      {n: 21, id: 'observability', done: true, title: {vi: 'Quan sát hệ thống', en: 'Observability', zh: '可观测性'},
        sum: {vi: 'Log, metric, trace; SLI/SLO, cảnh báo.', en: 'Logs, metrics, traces; SLIs/SLOs, alerting.', zh: '日志、指标、链路追踪;SLI/SLO、告警。'}},
      {n: 22, id: 'deployment-release', done: true, title: {vi: 'Triển khai & phát hành an toàn', en: 'Deployment & safe releases', zh: '部署与安全发布'},
        sum: {vi: 'Rolling, blue/green, canary, feature flag, rollback.', en: 'Rolling, blue/green, canary, feature flags, rollback.', zh: '滚动、蓝绿、金丝雀、特性开关、回滚。'}},
      {n: 23, id: 'security-basics', done: true, title: {vi: 'Bảo mật cơ bản', en: 'Security basics', zh: '安全基础'},
        sum: {vi: 'Authn/authz, session vs JWT, TLS, các lỗi hay gặp.', en: 'Authn/authz, sessions vs JWT, TLS, common pitfalls.', zh: '认证/授权、会话与 JWT、TLS、常见陷阱。'}},
    ],
  },
  {
    key: 'case-studies',
    title: {vi: 'Case study', en: 'Case studies', zh: '案例'},
    lessons: [
      {n: 7, id: 'url-shortener', done: true, title: {vi: 'Thiết kế URL shortener', en: 'Designing a URL shortener', zh: '设计短链接服务'}},
      {n: 24, id: 'case-rate-limiter', title: {vi: 'Thiết kế rate limiter', en: 'Designing a rate limiter', zh: '设计限流器'},
        sum: {vi: 'Đếm phân tán, Redis, đánh đổi chính xác vs chi phí.', en: 'Distributed counting, Redis, accuracy vs cost.', zh: '分布式计数、Redis、精度与成本。'}},
      {n: 25, id: 'case-news-feed', title: {vi: 'Thiết kế news feed', en: 'Designing a news feed', zh: '设计信息流'},
        sum: {vi: 'Fan-out on write vs on read, người nổi tiếng.', en: 'Fan-out on write vs read, celebrity problem.', zh: '写扩散与读扩散、大 V 问题。'}},
      {n: 26, id: 'case-chat', title: {vi: 'Thiết kế hệ thống chat', en: 'Designing a chat system', zh: '设计聊天系统'},
        sum: {vi: 'WebSocket, thứ tự tin nhắn, online presence.', en: 'WebSockets, message ordering, presence.', zh: 'WebSocket、消息顺序、在线状态。'}},
      {n: 27, id: 'case-file-storage', title: {vi: 'Thiết kế lưu trữ file & video', en: 'Designing file & video storage', zh: '设计文件与视频存储'},
        sum: {vi: 'Chia chunk, đồng bộ, transcoding, CDN.', en: 'Chunking, sync, transcoding, CDN.', zh: '分块、同步、转码、CDN。'}},
      {n: 28, id: 'case-notification', title: {vi: 'Thiết kế hệ thống thông báo', en: 'Designing a notification system', zh: '设计通知系统'},
        sum: {vi: 'Đa kênh, ưu tiên, chống gửi trùng.', en: 'Multi-channel, priorities, de-duplication.', zh: '多渠道、优先级、去重。'}},
      {n: 29, id: 'case-autocomplete', title: {vi: 'Thiết kế gợi ý tìm kiếm', en: 'Designing search autocomplete', zh: '设计搜索联想'},
        sum: {vi: 'Trie, xếp hạng, cập nhật gần thực.', en: 'Tries, ranking, near-real-time updates.', zh: 'Trie、排序、近实时更新。'}},
    ],
  },
];

export const allLessons = parts.flatMap((p) => p.lessons);
