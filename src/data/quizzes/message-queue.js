import {t, q} from './t';

export default [
  q(
    t('Luồng "xuất PDF" chạy lâu. Thiết kế nào hợp lý với queue?', 'The "export PDF" job is slow. Which queue-based design makes sense?', '“导出 PDF”耗时很长。基于队列的哪种设计合理?'),
    [
      t('API đẩy job vào queue, trả `202` ngay; worker xử lý, người dùng nhận kết quả qua polling, email hoặc WebSocket', 'The API enqueues a job and returns `202` at once; a worker processes it and the user gets the result via polling, email or WebSocket', 'API 把任务入队并立即返回 `202`;worker 处理,用户通过轮询、邮件或 WebSocket 获取结果'),
      t('API chờ PDF xong rồi mới trả lời, timeout 10 phút', 'The API waits for the PDF and replies, with a 10-minute timeout', 'API 等 PDF 生成完才返回,超时 10 分钟'),
      t('Client tự tạo PDF', 'The client builds the PDF itself', '由客户端自己生成 PDF'),
      t('Mỗi lần xuất tạo một server mới', 'Spin up a new server per export', '每次导出新建一台服务器'),
    ],
    0,
    t('Queue tách phần nhận yêu cầu khỏi phần xử lý, giúp chịu được đỉnh tải và retry an toàn.', 'A queue decouples accepting requests from doing the work, which absorbs spikes and allows safe retries.', '队列把接收请求与实际处理解耦,可吸收流量峰值并支持安全重试。'),
  ),
  q(
    t('Vì sao exactly-once gần như không đạt được, và ta làm gì thay thế?', 'Why is exactly-once delivery practically unattainable, and what do we do instead?', '为什么恰好一次(exactly-once)投递几乎无法实现?我们用什么替代?'),
    [
      t('Vì queue quá chậm; dùng queue nhanh hơn', 'Because queues are too slow; use a faster queue', '因为队列太慢;换更快的队列'),
      t('Vì mạng và tiến trình có thể lỗi giữa lúc xử lý và xác nhận; dùng at-least-once cộng consumer idempotent', 'Because network and processes can fail between processing and ack; use at-least-once plus idempotent consumers', '因为处理与确认之间网络和进程可能出错;采用至少一次投递加幂等消费者'),
      t('Vì chuẩn cấm', 'Because a standard forbids it', '因为标准禁止'),
      t('Vì RAM không đủ', 'Because RAM is limited', '因为内存不足'),
    ],
    1,
    t('Không thể biết chắc worker đã xử lý xong hay chưa khi mất ack, nên gửi lại là an toàn hơn, và xử lý trùng phải vô hại.', 'When an ack is lost you cannot tell whether the work was done, so redelivery is safer and duplicate processing must be harmless.', '确认丢失时无法确定任务是否已完成,所以重投更安全,而重复处理必须无害。'),
  ),
  q(
    t('Consumer idempotent cho "gửi email chào mừng" nên làm thế nào?', 'How should an idempotent consumer for "send welcome email" work?', '“发送欢迎邮件”的幂等消费者应如何实现?'),
    [
      t('Gửi mỗi khi nhận message', 'Send on every message received', '每收到消息就发送'),
      t('Lưu khóa duy nhất (user_id + loại email) trước/khi gửi; nếu đã có thì bỏ qua', 'Record a unique key (user_id + email type) when sending; skip if it already exists', '发送时记录唯一键(user_id + 邮件类型);已存在则跳过'),
      t('Xoá message khỏi queue trước khi gửi', 'Delete the message from the queue before sending', '发送前先把消息从队列删除'),
      t('Gửi hai lần cho chắc', 'Send twice to be safe', '发送两次以防万一'),
    ],
    1,
    t('Bản ghi "đã gửi" có ràng buộc duy nhất biến việc nhận trùng thành không làm gì. Xoá message trước khi gửi lại gây mất email nếu worker chết.', 'A "sent" record with a unique constraint turns a duplicate into a no-op. Deleting first would lose the email if the worker crashed.', '带唯一约束的“已发送”记录让重复消息变成空操作。先删除消息会在 worker 崩溃时丢邮件。'),
  ),
  q(
    t('DLQ, visibility timeout và backoff: phát biểu nào đúng?', 'DLQ, visibility timeout and backoff: which statement is correct?', '关于 DLQ、可见性超时和退避,哪项说法正确?'),
    [
      t('DLQ chứa message lỗi nhiều lần; visibility timeout giấu message khỏi worker khác trong lúc đang xử lý; backoff giãn dần thời gian giữa các lần retry', 'A DLQ holds messages that failed repeatedly; visibility timeout hides a message from other workers while it is processed; backoff spaces out retries', 'DLQ 存放多次失败的消息;可见性超时在处理期间对其他 worker 隐藏消息;退避逐步拉长重试间隔'),
      t('DLQ là queue nhanh nhất; backoff làm retry dồn dập', 'A DLQ is the fastest queue; backoff makes retries more frequent', 'DLQ 是最快的队列;退避让重试更密集'),
      t('Visibility timeout xoá message sau thời hạn', 'Visibility timeout deletes the message after the deadline', '可见性超时会在期限后删除消息'),
      t('Cả ba đều chỉ có ở Kafka', 'All three exist only in Kafka', '三者都只存在于 Kafka'),
    ],
    0,
    t('Nếu timeout hết mà worker chưa xong, message hiện lại và bị xử lý lần nữa: lại cần idempotent.', 'If the timeout expires before the worker finishes, the message reappears and is processed again, which is why idempotency matters.', '如果超时前 worker 没处理完,消息会重新出现并再次被处理,所以需要幂等。'),
  ),
  q(
    t('Khi nào chọn Kafka (log) thay vì queue kiểu RabbitMQ/SQS?', 'When pick Kafka (a log) over a RabbitMQ/SQS-style queue?', '什么时候选 Kafka(日志)而不是 RabbitMQ/SQS 这类队列?'),
    [
      t('Khi chỉ có vài job nhỏ mỗi ngày', 'When you have only a few small jobs a day', '每天只有几个小任务时'),
      t('Khi cần giữ lại và phát lại sự kiện, nhiều consumer độc lập đọc cùng dữ liệu, thông lượng rất cao', 'When you need to retain and replay events, have several independent consumers of the same data, and very high throughput', '需要保留并重放事件、多个独立消费者读取同一数据、吞吐量极高时'),
      t('Khi cần xoá message ngay sau khi đọc', 'When messages must vanish right after being read', '需要读后立即删除消息时'),
      t('Khi không muốn vận hành thêm gì', 'When you want zero operations', '不想做任何运维时'),
    ],
    1,
    t('Log giữ lại dữ liệu theo thời hạn và mỗi consumer group tự nhớ vị trí; queue truyền thống tối ưu cho phân phát công việc.', 'A log retains data for a period and each consumer group tracks its own offset; classic queues are optimised for distributing work.', '日志按期限保留数据,每个消费组各自记录偏移;传统队列针对任务分发做了优化。'),
  ),
];
