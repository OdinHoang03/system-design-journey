import {t, q} from './t';

export default [
  q(
    t('Dịch vụ đích đang quá tải và trả lỗi. Client nên retry thế nào?', 'The downstream service is overloaded and returning errors. How should the client retry?', '下游服务过载并返回错误。客户端应如何重试?'),
    [
      t('Retry ngay lập tức, càng nhiều càng tốt', 'Retry immediately, as many times as possible', '立即重试,越多越好'),
      t('Exponential backoff cộng jitter, giới hạn số lần và có retry budget', 'Exponential backoff plus jitter, a capped number of attempts and a retry budget', '指数退避加抖动,限制次数并设置重试预算'),
      t('Không bao giờ retry', 'Never retry', '永远不重试'),
      t('Retry ở mọi tầng để chắc chắn', 'Retry at every layer to be sure', '每一层都重试以确保成功'),
    ],
    1,
    t('Backoff và jitter dàn đều các lần thử; budget ngăn retry storm nhân tải lên đúng lúc dịch vụ đang yếu.', 'Backoff and jitter spread attempts out; a budget prevents a retry storm from multiplying load just when the service is weak.', '退避和抖动把重试打散;预算防止在服务虚弱时重试风暴成倍放大负载。'),
  ),
  q(
    t('Circuit breaker ở trạng thái Open làm gì?', 'What does a circuit breaker in the Open state do?', '处于 Open 状态的熔断器会做什么?'),
    [
      t('Cho mọi request đi qua và đếm lỗi', 'Lets every request through and counts errors', '放行所有请求并统计错误'),
      t('Từ chối ngay các request (fail fast) trong một khoảng thời gian; sau đó sang Half-open để thử vài request', 'Rejects requests immediately (fail fast) for a while, then moves to Half-open to try a few', '在一段时间内立即拒绝请求(快速失败),之后转为 Half-open 试探少量请求'),
      t('Tự động sửa dịch vụ đích', 'Automatically repairs the downstream service', '自动修复下游服务'),
      t('Xoá hàng đợi retry', 'Clears the retry queue', '清空重试队列'),
    ],
    1,
    t('Fail fast giải phóng thread và cho dịch vụ đích thời gian hồi phục; Half-open kiểm tra xem nó đã khoẻ lại chưa.', 'Failing fast frees threads and gives the dependency time to recover; Half-open checks whether it is healthy again.', '快速失败释放线程并给下游恢复时间;Half-open 用来检查它是否已恢复。'),
  ),
  q(
    t('Bulkhead giải quyết vấn đề gì?', 'What problem does a bulkhead solve?', '舱壁解决什么问题?'),
    [
      t('Mã hoá dữ liệu truyền đi', 'Encrypting data in transit', '加密传输中的数据'),
      t('Một dependency chậm làm cạn tài nguyên dùng chung (thread, kết nối) và kéo theo các chức năng khác', 'One slow dependency exhausting shared resources (threads, connections) and dragging down other features', '某个依赖变慢耗尽共享资源(线程、连接),拖垮其他功能'),
      t('Dữ liệu bị trùng trong queue', 'Duplicate data in a queue', '队列中数据重复'),
      t('Cache bị lỗi thời', 'Stale caches', '缓存过期'),
    ],
    1,
    t('Mỗi dependency có pool riêng, nên sự cố chỉ làm cạn pool của chính nó.', 'Each dependency gets its own pool, so an incident drains only that pool.', '每个依赖有独立的池,故障只会耗尽它自己的池。'),
  ),
  q(
    t('Vì sao không nên retry thao tác "tạo đơn hàng" khi chưa có biện pháp gì?', 'Why is it dangerous to retry a "create order" call with no safeguards?', '为什么在没有任何保护措施时重试“创建订单”很危险?'),
    [
      t('Vì timeout có thể xảy ra sau khi server đã tạo đơn; retry sẽ tạo đơn thứ hai nếu không có idempotency key', 'Because the timeout may occur after the server already created the order; a retry would create a second one without an idempotency key', '因为超时可能发生在服务器已创建订单之后;没有幂等键时重试会创建第二个订单'),
      t('Vì HTTP cấm retry POST', 'Because HTTP forbids retrying POST', '因为 HTTP 禁止重试 POST'),
      t('Vì retry luôn chậm hơn', 'Because retries are always slower', '因为重试总是更慢'),
      t('Vì đơn hàng không cần độ tin cậy', 'Because orders do not need reliability', '因为订单不需要可靠性'),
    ],
    0,
    t('Client không biết thao tác đã chạy hay chưa; idempotency key khiến lần thử lại chỉ trả về kết quả cũ.', 'The client cannot tell whether the operation ran; an idempotency key makes the retry just return the earlier result.', '客户端无法知道操作是否已执行;幂等键让重试只返回之前的结果。'),
  ),
  q(
    t('Health check của load balancer gọi cả database và dịch vụ email. Rủi ro là gì?', 'A load balancer health check calls both the database and the email service. What is the risk?', '负载均衡的健康检查同时调用数据库和邮件服务。风险是什么?'),
    [
      t('Không có rủi ro, càng sâu càng tốt', 'None; the deeper the better', '没有风险,越深越好'),
      t('Dịch vụ email phụ hỏng làm mọi instance bị đánh dấu unhealthy và bị gỡ, gây sập toàn bộ dù phần cốt lõi vẫn chạy', 'A failing side service marks every instance unhealthy and removes them all, causing a full outage though the core still works', '边缘的邮件服务故障会让所有实例被判为不健康并被摘除,即使核心功能仍可用也会全面宕机'),
      t('Health check tốn băng thông CDN', 'Health checks consume CDN bandwidth', '健康检查消耗 CDN 带宽'),
      t('Load balancer sẽ ngừng hoạt động', 'The load balancer stops working', '负载均衡器会停止工作'),
    ],
    1,
    t('Readiness nên phản ánh khả năng phục vụ cốt lõi; sự cố phụ nên được xử lý bằng fallback, không bằng cách gỡ instance.', 'Readiness should reflect core ability to serve; side failures belong to fallbacks, not to pulling instances out.', '就绪检查应反映核心服务能力;边缘故障应靠降级处理,而不是摘除实例。'),
  ),
];
