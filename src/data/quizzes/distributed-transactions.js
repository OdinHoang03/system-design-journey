import {t, q} from './t';

export default [
  q(
    t('Vì sao một giao dịch ACID của database không bao phủ được luồng đặt hàng → thanh toán → trừ kho khi mỗi bước ở một dịch vụ riêng?', 'Why can a single database ACID transaction not cover order → payment → stock when each step lives in a separate service?', '当下单 → 支付 → 扣库存分属不同服务时,为什么单库 ACID 事务无法覆盖?'),
    [
      t('Mỗi dịch vụ có database riêng; không có một transaction manager chung để commit hoặc rollback cả ba cùng lúc', 'Each service owns its own database; there is no shared transaction manager to commit or roll back all three at once', '每个服务有自己的数据库,没有统一的事务管理器能同时提交或回滚三者'),
      t('Vì SQL không hỗ trợ transaction', 'Because SQL has no transactions', '因为 SQL 不支持事务'),
      t('Vì HTTP không gửi được JSON', 'Because HTTP cannot carry JSON', '因为 HTTP 无法传输 JSON'),
      t('Vì ACID chỉ dùng cho bảng nhỏ', 'Because ACID only works on small tables', '因为 ACID 只适用于小表'),
    ],
    0,
    t('Atomicity chỉ đảm bảo trong phạm vi một database. Qua nhiều dịch vụ ta phải tự ghép bằng 2PC hoặc saga.', 'Atomicity is guaranteed only within one database. Across services we must assemble it ourselves with 2PC or sagas.', '原子性只在单个数据库内有保证。跨服务时必须自己用 2PC 或 Saga 来拼装。'),
  ),
  q(
    t('Điểm yếu lớn nhất của two-phase commit (2PC) là gì?', 'What is the biggest weakness of two-phase commit (2PC)?', '两阶段提交(2PC)最大的弱点是什么?'),
    [
      t('Quá nhanh nên dễ mất dữ liệu', 'It is so fast that data gets lost', '太快导致数据丢失'),
      t('Nếu coordinator chết sau khi các bên đã vote "yes", các bên giữ khoá và chờ vô hạn (blocking)', 'If the coordinator dies after participants voted "yes", they hold locks and block indefinitely', '协调者在参与者投“同意”后宕机,参与者会一直持有锁并无限等待(阻塞)'),
      t('Không dùng được với database quan hệ', 'It cannot be used with relational databases', '无法用于关系型数据库'),
      t('Cần đúng một node', 'It needs exactly one node', '只能用一个节点'),
    ],
    1,
    t('Ở trạng thái "prepared", participant không được tự quyết commit hay abort. Khoá giữ lâu làm giảm thông lượng và có thể kéo sập cả hệ.', 'In the "prepared" state a participant may not decide alone. Long-held locks hurt throughput and can stall everything.', '在“已准备”状态下参与者不能自行决定提交或中止。锁被长期占用会拖垮吞吐,甚至拖垮整个系统。'),
  ),
  q(
    t('Trong saga, bước 3 (trừ kho) thất bại sau khi bước 2 (thu tiền) đã commit. Cần làm gì?', 'In a saga, step 3 (reserve stock) fails after step 2 (charge) has committed. What now?', '在 Saga 中,第 3 步(扣库存)失败,而第 2 步(扣款)已提交。该怎么办?'),
    [
      t('Rollback database của dịch vụ thanh toán bằng lệnh ROLLBACK', 'Run ROLLBACK on the payment database', '对支付库执行 ROLLBACK'),
      t('Bỏ qua, coi như xong', 'Ignore it and move on', '忽略,当作完成'),
      t('Chạy bước bù (compensation) như hoàn tiền, rồi huỷ đơn; các bước bù cũng phải idempotent', 'Run compensating steps such as a refund, then cancel the order; compensations must be idempotent too', '执行补偿步骤(如退款),再取消订单;补偿步骤同样必须幂等'),
      t('Thu thêm tiền khách', 'Charge the customer again', '再向客户收一次款'),
    ],
    2,
    t('Transaction cục bộ đã commit nên không rollback được; ta tạo thao tác ngược nghĩa nghiệp vụ. Bước bù có thể bị gọi lại nên cần idempotent.', 'Local transactions are already committed, so they cannot roll back; we apply a business-level inverse. Compensations may be retried, so they must be idempotent.', '本地事务已提交,无法回滚;我们执行业务意义上的反向操作。补偿可能被重试,所以必须幂等。'),
  ),
  q(
    t('Transactional outbox giải quyết vấn đề gì?', 'What problem does the transactional outbox solve?', '事务性 Outbox 解决什么问题?'),
    [
      t('Làm database nhanh hơn', 'Makes the database faster', '让数据库更快'),
      t('Tránh tình trạng ghi DB thành công nhưng gửi event thất bại (hoặc ngược lại) bằng cách ghi event vào bảng outbox trong cùng giao dịch, rồi relay đẩy đi', 'Avoids "DB write succeeded but event publish failed" (or vice versa) by writing the event to an outbox table in the same transaction and having a relay publish it', '把事件与业务数据在同一事务写入 outbox 表,再由转发器发布,避免“库写成功但事件发送失败”(或相反)'),
      t('Thay thế hoàn toàn message queue', 'Replaces the message queue entirely', '完全取代消息队列'),
      t('Đảm bảo exactly-once mà không cần idempotency', 'Guarantees exactly-once without idempotency', '无需幂等即可保证恰好一次'),
    ],
    1,
    t('Relay có thể gửi trùng (at-least-once), nên phía nhận dùng inbox hoặc idempotency key để loại trùng.', 'The relay may publish duplicates (at-least-once), so receivers use an inbox or idempotency key to de-duplicate.', '转发器可能重复发送(至少一次),接收方需用 inbox 或幂等键去重。'),
  ),
  q(
    t('Khi nào nên cân nhắc gộp các bước vào một database thay vì dùng saga?', 'When should you consider keeping the steps in one database instead of using a saga?', '什么时候应考虑把这些步骤放进同一个数据库,而不是用 Saga?'),
    [
      t('Khi các bước luôn phải đúng cùng nhau, quy mô còn vừa một DB và việc tách dịch vụ chưa mang lại lợi ích rõ', 'When the steps must always be consistent together, scale still fits one DB, and splitting services has no clear payoff', '这些步骤必须始终一致、规模仍能由一个库承载,且拆分服务没有明显收益时'),
      t('Không bao giờ; saga luôn tốt hơn', 'Never; sagas are always better', '永远不要;Saga 总是更好'),
      t('Chỉ khi dùng NoSQL', 'Only when using NoSQL', '仅当使用 NoSQL 时'),
      t('Khi muốn thêm nhiều microservice', 'When you want more microservices', '想增加更多微服务时'),
    ],
    0,
    t('Một transaction cục bộ rẻ và đúng hơn mọi cơ chế phân tán. Saga là cái giá khi ranh giới dịch vụ buộc phải có.', 'A local transaction is cheaper and more correct than any distributed mechanism. A saga is the price paid when service boundaries are unavoidable.', '本地事务比任何分布式机制都更便宜、更正确。Saga 是服务边界不可避免时付出的代价。'),
  ),
];
