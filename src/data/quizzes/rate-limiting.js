import {t, q} from './t';

export default [
  q(
    t('Token bucket khác leaky bucket ở điểm nào?', 'How does a token bucket differ from a leaky bucket?', '令牌桶与漏桶有什么不同?'),
    [
      t('Token bucket cho phép bùng nổ ngắn (tới sức chứa của xô) rồi giữ tốc độ trung bình; leaky bucket làm đầu ra đều đặn', 'A token bucket allows short bursts (up to bucket size) then holds the average rate; a leaky bucket makes the output steady', '令牌桶允许短时突发(至多桶容量)后保持平均速率;漏桶让输出保持平稳'),
      t('Hai cái hoàn toàn giống nhau', 'They are exactly the same', '二者完全一样'),
      t('Leaky bucket cho phép bùng nổ vô hạn', 'A leaky bucket allows unlimited bursts', '漏桶允许无限突发'),
      t('Token bucket không cần bộ nhớ', 'A token bucket needs no memory', '令牌桶不需要内存'),
    ],
    0,
    t('Chọn token bucket khi chấp nhận bùng nổ ngắn; leaky bucket khi cần đầu ra mượt (kèm độ trễ xếp hàng).', 'Pick a token bucket when short bursts are fine; a leaky bucket when you need smooth output (at the cost of queueing latency).', '可接受短时突发时选令牌桶;需要平滑输出时选漏桶(代价是排队延迟)。'),
  ),
  q(
    t('Lỗi biên của fixed window là gì?', 'What is the boundary flaw of a fixed window?', '固定窗口的边界问题是什么?'),
    [
      t('Cửa sổ quá lớn nên tốn bộ nhớ', 'The window is too large and uses memory', '窗口太大占用内存'),
      t('Request dồn ở cuối cửa sổ này và đầu cửa sổ sau có thể vượt gần gấp đôi hạn mức trong thời gian ngắn', 'Requests bunched at the end of one window and the start of the next can nearly double the quota in a short time', '集中在一个窗口末尾和下一窗口开头的请求,短时间内可达近两倍配额'),
      t('Không đếm được request POST', 'It cannot count POST requests', '无法统计 POST 请求'),
      t('Luôn chặn nhầm người dùng hợp lệ', 'It always blocks valid users', '总是误拦合法用户'),
    ],
    1,
    t('Sliding window (log hoặc counter có trọng số) sửa lỗi này với chi phí cao hơn một chút.', 'A sliding window (log or weighted counter) fixes this at slightly higher cost.', '滑动窗口(日志式或加权计数)以稍高的代价修复这一问题。'),
  ),
  q(
    t('API chạy trên 10 server, mỗi server giới hạn 100 request/phút/khách bằng bộ đếm cục bộ. Hạn mức thực tế tối đa của một khách là gì?', 'An API runs on 10 servers, each limiting 100 requests/min/customer with a local counter. What is the real maximum for one customer?', 'API 跑在 10 台服务器上,每台用本地计数器把每位客户限制为 100 次/分钟。单个客户实际最多能到多少?'),
    [
      t('100 request/phút', '100 requests/min', '100 次/分钟'),
      t('Khoảng 1.000 request/phút nếu request trải đều qua các server', 'About 1,000 requests/min if requests spread across the servers', '如果请求均匀分布在各服务器上,约 1,000 次/分钟'),
      t('10 request/phút', '10 requests/min', '10 次/分钟'),
      t('Không giới hạn', 'Unlimited', '无限制'),
    ],
    1,
    t('Bộ đếm cục bộ nhân hạn mức theo số server; cần bộ đếm dùng chung (ví dụ Redis, thao tác nguyên tử) cho hạn mức chính xác.', 'Local counters multiply the quota by the server count; use a shared counter (e.g. Redis with atomic ops) for an accurate quota.', '本地计数会让配额随服务器数成倍增加;要精确配额需共享计数器(如使用原子操作的 Redis)。'),
  ),
  q(
    t('Khi Redis dùng cho bộ đếm rate limit bị sập, fail-open nghĩa là gì?', 'When the Redis used for rate-limit counters is down, what does fail-open mean?', '用于限流计数的 Redis 宕机时,fail-open 是什么意思?'),
    [
      t('Từ chối mọi request cho tới khi Redis hoạt động lại', 'Reject every request until Redis recovers', '拒绝所有请求直到 Redis 恢复'),
      t('Cho request đi qua (kèm bảo vệ dự phòng cục bộ), ưu tiên giữ dịch vụ chạy, đổi lại tạm mất bảo vệ', 'Let requests through (with a local fallback), keeping the service up at the cost of temporary protection', '放行请求(可带本地兜底),优先保持服务可用,代价是暂时失去保护'),
      t('Xoá toàn bộ dữ liệu người dùng', 'Delete all user data', '删除所有用户数据'),
      t('Chuyển sang HTTP thay vì HTTPS', 'Switch to HTTP instead of HTTPS', '改用 HTTP 而不是 HTTPS'),
    ],
    1,
    t('Fail-closed thì ngược lại: an toàn hơn nhưng bộ đếm hỏng sẽ chặn cả người dùng hợp lệ. Chọn theo mức quan trọng của hạn mức.', 'Fail-closed is the opposite: safer, but a broken counter blocks legitimate users too. Choose by how important the limit is.', 'fail-closed 则相反:更安全,但计数器坏了也会拦下合法用户。按限额的重要性选择。'),
  ),
  q(
    t('Response đúng khi client vượt hạn mức là gì?', 'What is the right response when a client exceeds its quota?', '客户端超出配额时,正确的响应是什么?'),
    [
      t('`200 OK` kèm thông báo lỗi trong body', '`200 OK` with an error in the body', '`200 OK`,错误信息放在响应体里'),
      t('`500 Internal Server Error`', '`500 Internal Server Error`', '`500 Internal Server Error`'),
      t('`429 Too Many Requests` kèm `Retry-After`', '`429 Too Many Requests` with `Retry-After`', '`429 Too Many Requests` 并附带 `Retry-After`'),
      t('Đóng kết nối không trả gì', 'Close the connection with no reply', '不回复直接断开连接'),
    ],
    2,
    t('`Retry-After` cho client biết đợi bao lâu, tránh retry dồn dập làm tình hình tệ hơn.', '`Retry-After` tells the client how long to wait, preventing bursts of retries that make things worse.', '`Retry-After` 告诉客户端要等多久,避免集中重试让情况更糟。'),
  ),
];
