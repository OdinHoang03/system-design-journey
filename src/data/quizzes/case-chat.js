import {t, q} from './t';

export default [
  q(
    t('Vì sao chat chọn WebSocket thay vì polling mỗi 2 giây?', 'Why does chat choose WebSocket over polling every 2 seconds?', '为什么聊天选用 WebSocket 而不是每 2 秒轮询?'),
    [
      t('Kết nối hai chiều giữ lâu cho phép server đẩy tin ngay, không tốn hàng loạt request "không có gì mới"', 'A long-lived two-way connection lets the server push immediately, without a flood of "nothing new" requests', '长期保持的双向连接让服务器能立即推送,无需大量“没有新消息”的请求'),
      t('WebSocket không cần server có trạng thái', 'WebSocket needs no server-side state', 'WebSocket 不需要服务器保存状态'),
      t('Polling không thể dùng với HTTPS', 'Polling cannot be used with HTTPS', '轮询无法配合 HTTPS 使用'),
      t('WebSocket luôn rẻ hơn về mọi mặt', 'WebSocket is always cheaper in every respect', 'WebSocket 在各方面都更便宜'),
    ],
    0,
    t('Đổi lại, WebSocket có trạng thái: phải biết user đang nối vào server nào và xử lý nối lại.', 'The price is state: you must know which server each user is on and handle reconnects.', '代价是有状态:必须知道每个用户连在哪台服务器,并处理重连。'),
  ),
  q(
    t('Alice gửi tin cho Bob đang nối vào server khác. Server của Alice nên làm gì?', 'Alice messages Bob, who is connected to a different server. What should Alice\'s server do?', 'Alice 给连在另一台服务器上的 Bob 发消息。Alice 的服务器应该怎么做?'),
    [
      t('Phát tin tới mọi server và hy vọng server của Bob nhận được', 'Broadcast to every server and hope Bob\'s picks it up', '广播给所有服务器,希望 Bob 所在的那台收到'),
      t('Lưu tin vào message store trước, rồi tra registry để chuyển tới đúng server của Bob', 'Persist the message first, then look up the registry and forward to Bob\'s server', '先把消息存入消息库,再查注册表转发到 Bob 所在的服务器'),
      t('Chỉ giữ tin trong RAM cho tới khi Bob online', 'Keep it in RAM only until Bob comes online', '只放在内存里,直到 Bob 上线'),
      t('Từ chối nếu Bob ở server khác', 'Reject it if Bob is on another server', '如果 Bob 在另一台服务器就拒绝'),
    ],
    1,
    t('Lưu trước giao sau để không mất tin; registry (ví dụ Redis) ánh xạ user tới server.', 'Store first, deliver after, so nothing is lost; the registry (e.g. Redis) maps user to server.', '先存后发以免丢消息;注册表(如 Redis)记录用户到服务器的映射。'),
  ),
  q(
    t('Làm sao đảm bảo thứ tự tin nhắn trong một cuộc trò chuyện?', 'How do you guarantee message order within a conversation?', '如何保证同一会话内消息的顺序?'),
    [
      t('Sắp xếp theo đồng hồ của thiết bị gửi', 'Sort by the sending device\'s clock', '按发送设备的时钟排序'),
      t('Gán `seq` tăng dần theo từng cuộc trò chuyện ở phía server', 'Assign an increasing per-conversation `seq` on the server side', '在服务端为每个会话分配递增的 `seq`'),
      t('Dùng thời điểm tới của tin ở bất kỳ server nào', 'Use arrival time at whichever server got it', '使用任意服务器收到消息的时间'),
      t('Không cần, người dùng tự đọc hiểu', 'No need; users can figure it out', '不需要,用户自己能看懂'),
    ],
    1,
    t('Đồng hồ client lệch và không đáng tin; chỉ cần thứ tự trong một cuộc, không cần thứ tự toàn cục.', 'Client clocks drift and cannot be trusted; you only need order within one conversation, not global order.', '客户端时钟会漂移、不可信;只需要会话内有序,不需要全局有序。'),
  ),
  q(
    t('Mạng yếu làm client gửi lại cùng một tin. Cách chống hiển thị hai lần?', 'A weak network makes the client resend the same message. How do you avoid showing it twice?', '网络差导致客户端重发同一条消息。如何避免显示两次?'),
    [
      t('Client sinh `client_msg_id`; server bỏ qua tin có id đã thấy (giống idempotency key)', 'The client generates a `client_msg_id`; the server ignores a message whose id it has seen (like an idempotency key)', '客户端生成 `client_msg_id`;服务器忽略已见过的 id(类似幂等键)'),
      t('Cấm client gửi lại', 'Forbid clients from resending', '禁止客户端重发'),
      t('So sánh nội dung tin; tin giống nhau luôn bị bỏ', 'Compare message text; identical text is always dropped', '比较消息内容;相同内容一律丢弃'),
      t('Tăng timeout lên vô hạn', 'Set the timeout to infinity', '把超时设为无限长'),
    ],
    0,
    t('So sánh nội dung sai: người dùng có thể thật sự gửi "ok" hai lần.', 'Comparing text is wrong: a user may genuinely send "ok" twice.', '比较内容是错的:用户可能确实发了两次“ok”。'),
  ),
  q(
    t('Vì sao presence dùng heartbeat kèm TTL thay vì chỉ dựa vào sự kiện đóng kết nối?', 'Why use a heartbeat with TTL for presence instead of relying only on connection-close events?', '为什么在线状态要用带 TTL 的心跳,而不是只依赖连接关闭事件?'),
    [
      t('Vì mất mạng hoặc sập app không phải lúc nào cũng gửi sự kiện đóng; thiếu heartbeat thì coi là offline', 'Losing signal or a crashing app does not always send a close event; missing heartbeats mean offline', '断网或应用崩溃并不总会发出关闭事件;心跳缺失就视为离线'),
      t('Vì heartbeat tốn ít băng thông hơn mọi cách khác', 'Because heartbeats use less bandwidth than anything else', '因为心跳比任何方式都省带宽'),
      t('Vì WebSocket không có sự kiện đóng', 'Because WebSocket has no close event', '因为 WebSocket 没有关闭事件'),
      t('Vì presence phải chính xác tuyệt đối từng mili-giây', 'Because presence must be exact to the millisecond', '因为在线状态必须精确到毫秒'),
    ],
    0,
    t('Đổi lại, trạng thái có thể trễ vài chục giây; thường chấp nhận được với presence.', 'The cost is status lagging by tens of seconds, usually acceptable for presence.', '代价是状态滞后几十秒,对在线状态通常可以接受。'),
  ),
];
