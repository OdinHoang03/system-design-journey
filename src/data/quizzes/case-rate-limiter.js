import {t, q} from './t';

export default [
  q(
    t('Vì sao "GET bộ đếm rồi SET bộ đếm + 1" sai khi chạy trên nhiều gateway?', 'Why is "GET the counter then SET counter + 1" wrong across several gateways?', '为什么在多个网关上“先 GET 计数再 SET 计数 + 1”是错的?'),
    [
      t('Vì Redis không hỗ trợ SET', 'Because Redis does not support SET', '因为 Redis 不支持 SET'),
      t('Không nguyên tử: hai gateway cùng đọc một giá trị và cùng cho qua, hạn mức bị vượt; cần INCR hoặc script Lua', 'It is not atomic: two gateways read the same value and both allow, exceeding the quota; use INCR or a Lua script', '不是原子的:两个网关读到同一个值并都放行,配额被突破;应使用 INCR 或 Lua 脚本'),
      t('Vì bộ đếm sẽ tự giảm', 'Because the counter decrements by itself', '因为计数器会自动递减'),
      t('Vì nó quá chậm so với đọc từ đĩa', 'Because it is slower than reading from disk', '因为它比读磁盘还慢'),
    ],
    1,
    t('Redis chạy trọn một script Lua mà không xen thao tác khác, nên đọc-sửa-ghi trở thành nguyên tử.', 'Redis runs a whole Lua script with nothing interleaved, making read-modify-write atomic.', 'Redis 会完整执行一个 Lua 脚本且中间不插入其他操作,因此读-改-写变成原子的。'),
  ),
  q(
    t('50.000 request/giây, 5 triệu khoá, mỗi bộ đếm ~100 byte. Nút thắt chính của rate limiter là gì?', '50,000 requests/s, 5M keys, ~100 bytes per counter. What is the main bottleneck of the limiter?', '每秒 50,000 请求、500 万个键、每个计数器约 100 字节。限流器的主要瓶颈是什么?'),
    [
      t('Dung lượng lưu trữ (hàng TB)', 'Storage capacity (many TB)', '存储容量(数 TB)'),
      t('Độ trễ thêm vào mỗi request và tính nguyên tử; dữ liệu chỉ cỡ 500 MB', 'Added per-request latency and atomicity; the data is only ~500 MB', '每个请求新增的延迟与原子性;数据只有约 500 MB'),
      t('Băng thông đĩa', 'Disk bandwidth', '磁盘带宽'),
      t('Số lượng ngôn ngữ lập trình', 'The number of programming languages', '编程语言的数量'),
    ],
    1,
    t('5M × 100 B = 500 MB, vừa một Redis. Vấn đề thật là một vòng mạng cho mỗi request và đúng đắn khi đồng thời.', '5M × 100 B = 500 MB, fits one Redis. The real issue is a network round trip per request and correctness under concurrency.', '5M × 100 B = 500 MB,一个 Redis 就够。真正的问题是每个请求一次网络往返以及并发下的正确性。'),
  ),
  q(
    t('Redis của limiter hết thời gian chờ. Với route thông thường nên làm gì?', 'The limiter\'s Redis times out. What should an ordinary route do?', '限流器的 Redis 超时了。对普通路由应该怎么做?'),
    [
      t('Từ chối mọi request (fail-closed) để an toàn tuyệt đối', 'Reject every request (fail-closed) for total safety', '拒绝所有请求(fail-closed)以求绝对安全'),
      t('Fail-open có timeout ngắn, dùng bộ đếm cục bộ làm lưới đỡ và phát cảnh báo; fail-closed chỉ cho route nhạy cảm', 'Fail-open with a short timeout, a local counter as safety net, and an alert; fail-closed only for sensitive routes', '带短超时的 fail-open,用本地计数兜底并发出告警;仅敏感路由使用 fail-closed'),
      t('Chờ vô hạn cho tới khi Redis trả lời', 'Wait indefinitely until Redis answers', '无限期等待直到 Redis 响应'),
      t('Tắt hẳn rate limiting vĩnh viễn', 'Disable rate limiting permanently', '永久关闭限流'),
    ],
    1,
    t('Limiter không được trở thành điểm chết duy nhất của API.', 'The limiter must not become the API\'s single point of failure.', '限流器不能成为 API 的单点故障。'),
  ),
  q(
    t('Làm sao giảm số lần gọi Redis cho mỗi request mà vẫn gần đúng hạn mức?', 'How can you cut Redis calls per request while staying close to the quota?', '如何在配额基本准确的前提下减少每个请求对 Redis 的调用?'),
    [
      t('Gateway xin trước một lô token (ví dụ 10) từ Redis và dùng dần; đổi lại sai số nhỏ', 'The gateway reserves a batch of tokens (e.g. 10) from Redis and spends them gradually, at the cost of small error', '网关先从 Redis 预支一批令牌(如 10 个)再逐步消耗,代价是少量误差'),
      t('Bỏ Redis, mỗi gateway đếm riêng với cùng hạn mức', 'Drop Redis; each gateway counts alone with the same limit', '放弃 Redis,每个网关用同样的限额各自计数'),
      t('Tăng hạn mức lên gấp 100 lần', 'Raise the quota by 100×', '把配额提高 100 倍'),
      t('Chỉ kiểm tra mỗi request thứ 1000', 'Check only every 1000th request', '只检查每第 1000 个请求'),
    ],
    0,
    t('Đếm riêng từng gateway làm hạn mức thực tế thành N lần; xin theo lô là điểm giữa hợp lý.', 'Counting per gateway multiplies the quota by N; batching is a sensible middle ground.', '各网关各自计数会让实际配额变成 N 倍;批量预支是合理的折中。'),
  ),
  q(
    t('Với khoá bộ đếm, vì sao nên đặt TTL (PEXPIRE)?', 'Why set a TTL (PEXPIRE) on counter keys?', '为什么要给计数器键设置 TTL(PEXPIRE)?'),
    [
      t('Để khoá ít dùng tự bị dọn, Redis không phình mãi', 'So idle keys clean themselves up and Redis does not bloat forever', '让闲置键自动清理,Redis 不会无限膨胀'),
      t('Để tăng hạn mức theo thời gian', 'To raise the quota over time', '让配额随时间增加'),
      t('Để mã hoá dữ liệu', 'To encrypt the data', '用于加密数据'),
      t('Không có tác dụng gì', 'It has no effect', '没有任何作用'),
    ],
    0,
    t('Bucket đầy lại sau khoảng im lặng, nên xoá khoá cũ không làm mất tính đúng đắn.', 'A bucket refills after idle time, so deleting an old key loses no correctness.', '桶在闲置一段时间后会重新装满,所以删除旧键不影响正确性。'),
  ),
];
