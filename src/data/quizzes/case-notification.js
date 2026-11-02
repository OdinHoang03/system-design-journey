import {t, q} from './t';

export default [
  q(
    t('Vì sao nên dùng hàng đợi riêng theo mức ưu tiên cho hệ thống thông báo?', 'Why use separate queues per priority in a notification system?', '为什么通知系统要按优先级使用独立队列?'),
    [
      t('Để mã OTP không bị kẹt sau đợt gửi quảng bá hàng loạt', 'So an OTP is not stuck behind a mass promotional send', '避免 OTP 被堵在大批量营销发送后面'),
      t('Để tiết kiệm bộ nhớ', 'To save memory', '为了节省内存'),
      t('Vì mỗi nhà cung cấp chỉ nhận một loại tin', 'Because each provider accepts only one message type', '因为每个服务商只接收一种消息'),
      t('Để bỏ qua tuỳ chọn người dùng', 'To bypass user preferences', '为了绕过用户偏好'),
    ],
    0,
    t('Worker của hàng đợi bulk cũng nên bị giới hạn tốc độ để không ăn hết hạn mức nhà cung cấp.', 'Bulk workers should also be rate-limited so they do not eat the provider quota.', 'bulk 队列的 worker 也应限速,以免耗尽服务商配额。'),
  ),
  q(
    t('Hàng đợi giao at-least-once có thể giao một thông báo hai lần. Cách giảm gửi trùng hợp lý nhất?', 'An at-least-once queue may deliver a notification twice. What is the most sensible way to avoid duplicate sends?', '至少一次投递的队列可能把同一条通知投递两次。避免重复发送最合理的做法是什么?'),
    [
      t('Chuyển sang at-most-once cho mọi loại tin', 'Switch every message type to at-most-once', '所有消息都改成至多一次'),
      t('Gắn `notification_id` ổn định và kiểm tra khoá khử trùng (ví dụ `SET NX` trên Redis) trước khi gửi', 'Attach a stable `notification_id` and check a de-dup key (e.g. Redis `SET NX`) before sending', '附上稳定的 `notification_id`,发送前检查去重键(如 Redis 的 `SET NX`)'),
      t('Hy vọng worker không bao giờ khởi động lại', 'Hope workers never restart', '希望 worker 永远不重启'),
      t('Gửi hai lần cho chắc', 'Send twice to be safe', '为保险起见发两次'),
    ],
    1,
    t('At-most-once có thể mất tin, không chấp nhận được với OTP. Cách thực tế là at-least-once cộng khử trùng.', 'At-most-once can lose messages, unacceptable for OTPs. The practical approach is at-least-once plus de-duplication.', '至多一次可能丢消息,对 OTP 不可接受。实用做法是至少一次加去重。'),
  ),
  q(
    t('Lỗi nào KHÔNG nên retry?', 'Which error should NOT be retried?', '哪种错误不应该重试?'),
    [
      t('Timeout khi gọi nhà cung cấp', 'A timeout calling the provider', '调用服务商超时'),
      t('Nhà cung cấp trả 503', 'The provider returns 503', '服务商返回 503'),
      t('Bị nhà cung cấp giới hạn tốc độ (429)', 'The provider rate-limits us (429)', '被服务商限速(429)'),
      t('Token thiết bị đã bị gỡ (lỗi vĩnh viễn)', 'The device token was unregistered (a permanent error)', '设备令牌已被注销(永久性错误)'),
    ],
    3,
    t('Lỗi vĩnh viễn thì retry vô ích; nên đánh dấu token để dọn. Lỗi tạm thời thì retry với backoff và jitter.', 'Retrying a permanent error is pointless; flag the token for cleanup. Retry transient errors with backoff and jitter.', '永久性错误重试无意义,应标记令牌以便清理。临时错误则带退避和抖动重试。'),
  ),
  q(
    t('API nhận yêu cầu gửi thông báo nên trả mã nào và vì sao?', 'What should the API return for a send request, and why?', '发送通知的请求,API 应返回什么状态码?为什么?'),
    [
      t('`200` sau khi nhà cung cấp xác nhận đã gửi, để chắc chắn', '`200` after the provider confirms sending, to be sure', '等服务商确认已发送后返回 `200`,以求稳妥'),
      t('`202 Accepted`, vì việc gửi chạy bất đồng bộ qua hàng đợi', '`202 Accepted`, because sending runs asynchronously via queues', '`202 Accepted`,因为发送通过队列异步进行'),
      t('`404`, vì thông báo chưa tồn tại', '`404`, since the notification does not exist yet', '`404`,因为通知还不存在'),
      t('`301`, để chuyển hướng sang nhà cung cấp', '`301`, to redirect to the provider', '`301`,重定向到服务商'),
    ],
    1,
    t('Chờ nhà cung cấp trong request người dùng làm chậm ứng dụng; chỉ cần nhận và đưa vào hàng đợi.', 'Waiting on the provider inside the user request slows the app; just accept and enqueue.', '在用户请求里等待服务商会拖慢应用;只需接收并入队。'),
  ),
  q(
    t('Vì sao nên có nhà cung cấp dự phòng cho kênh OTP?', 'Why keep a backup provider for the OTP channel?', '为什么 OTP 渠道要有备用服务商?'),
    [
      t('Để so sánh giá cho vui', 'Just to compare prices for fun', '只是为了比价'),
      t('Vì nhà cung cấp luôn gửi trùng', 'Because providers always send duplicates', '因为服务商总会重复发送'),
      t('Nếu nhà cung cấp duy nhất lỗi, người dùng không đăng nhập được', 'If the only provider fails, users cannot log in', '唯一的服务商出故障时,用户无法登录'),
      t('Vì luật bắt buộc dùng hai nhà cung cấp', 'Because the law requires two providers', '因为法律要求用两家服务商'),
    ],
    2,
    t('Kênh sống còn cần dự phòng và chuyển đổi tự động khi tỉ lệ lỗi tăng.', 'A vital channel needs redundancy and automatic failover when error rates rise.', '关键渠道需要冗余,并在错误率上升时自动切换。'),
  ),
];
