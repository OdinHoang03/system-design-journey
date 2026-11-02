import {t, q} from './t';

export default [
  q(
    t('Round robin hoạt động tệ khi nào, và `least connections` sửa điều gì?', 'When does round robin work badly, and what does `least connections` fix?', '轮询在什么情况下表现不佳,`least connections` 解决了什么?'),
    [
      t('Khi các server giống hệt nhau và request đều nhau', 'When servers are identical and requests are uniform', '服务器完全相同且请求大小均匀时'),
      t('Khi request nặng nhẹ rất khác nhau: server nhận phải request nặng bị quá tải; least connections gửi tới server đang rảnh hơn', 'When requests vary a lot in cost: a server stuck with heavy ones overloads; least connections prefers the less busy server', '请求耗时差异很大时:拿到重请求的服务器会过载;least connections 会选更空闲的服务器'),
      t('Khi chỉ có một server', 'When there is only one server', '只有一台服务器时'),
      t('Khi dùng HTTPS', 'When using HTTPS', '使用 HTTPS 时'),
    ],
    1,
    t('Round robin chỉ đếm lượt, không biết tải thực. Least connections nhìn số kết nối đang mở.', 'Round robin only counts turns and ignores real load. Least connections looks at open connections.', '轮询只按次序分配,不了解真实负载。least connections 看当前打开的连接数。'),
  ),
  q(
    t('App lưu phiên (session) trong RAM của từng server. Cách nào cho phép scale ngang mà không mất phiên?', 'Your app keeps sessions in each server\'s RAM. Which approach lets you scale out without losing sessions?', '应用把会话存在各服务器内存中。哪种方式可以在水平扩展时不丢会话?'),
    [
      t('Tăng RAM của một server lên thật lớn', 'Add far more RAM to a single server', '给单台服务器加大量内存'),
      t('Chuyển session sang kho dùng chung (Redis) hoặc token có chữ ký phía client', 'Move sessions to a shared store (Redis) or signed client-side tokens', '把会话迁到共享存储(Redis)或客户端签名令牌'),
      t('Tắt health check', 'Turn off health checks', '关闭健康检查'),
      t('Dùng DNS round robin để chia người dùng ngẫu nhiên mỗi request', 'Use DNS round robin to spread users randomly per request', '用 DNS 轮询让每个请求随机分配'),
    ],
    1,
    t('Server không giữ trạng thái (stateless) thì request đi tới server nào cũng được. Sticky session là phương án thứ ba nhưng mất phiên khi server chết.', 'A stateless server can serve any request. Sticky sessions are a third option but lose the session when that server dies.', '无状态服务器可以处理任何请求。粘性会话是第三种方案,但服务器宕机时会丢失会话。'),
  ),
  q(
    t('Làm sao tránh để load balancer là single point of failure?', 'How do you keep the load balancer from being a single point of failure?', '如何避免负载均衡器成为单点故障?'),
    [
      t('Chạy hai LB (active–passive hoặc active–active) với IP ảo/DNS failover', 'Run two LBs (active–passive or active–active) with a virtual IP/DNS failover', '运行两个 LB(主备或双主),配合虚拟 IP/DNS 故障切换'),
      t('Dùng LB mạnh hơn', 'Buy a more powerful LB', '换一个更强的 LB'),
      t('Cho client nhớ IP của backend', 'Make clients remember backend IPs', '让客户端记住后端 IP'),
      t('Tắt health check để LB khỏi phải xử lý', 'Disable health checks so the LB has less to do', '关闭健康检查减轻 LB 负担'),
    ],
    0,
    t('Máy mạnh hơn vẫn chỉ là một máy. Cần dự phòng; dịch vụ cloud thường làm sẵn điều này.', 'A bigger box is still one box. You need redundancy; cloud load balancers usually do this for you.', '更强的机器仍然只是一台。需要冗余;云厂商的负载均衡通常已内置。'),
  ),
  q(
    t('Phân biệt LB L4 và L7: khi nào cần L7?', 'L4 vs L7 load balancing: when do you need L7?', '四层与七层负载均衡:什么时候需要七层?'),
    [
      t('Khi muốn định tuyến theo đường dẫn URL, header hoặc cookie', 'When you want to route by URL path, header or cookie', '需要按 URL 路径、请求头或 cookie 路由时'),
      t('Khi chỉ cần chuyển gói TCP nhanh nhất có thể', 'When you only need the fastest raw TCP forwarding', '只需要最快速地转发 TCP 数据时'),
      t('Khi muốn LB không đọc nội dung gì cả', 'When you want the LB to read nothing at all', '希望 LB 完全不读取内容时'),
      t('L7 luôn nhanh hơn L4', 'L7 is always faster than L4', '七层总是比四层快'),
    ],
    0,
    t('L4 nhìn IP/cổng nên nhanh và đơn giản; L7 hiểu HTTP nên định tuyến `/api` và `/static` tới nhóm khác nhau, kết thúc TLS, v.v. Đổi lại tốn CPU hơn.', 'L4 sees IP/port, so it is fast and simple; L7 understands HTTP, so it can send `/api` and `/static` to different pools, terminate TLS, etc., at more CPU cost.', '四层只看 IP/端口,快且简单;七层理解 HTTP,可把 `/api` 和 `/static` 路由到不同后端、终止 TLS 等,但更耗 CPU。'),
  ),
  q(
    t('Health check tốt cho một API phụ thuộc database và cache nên làm gì?', 'What should a good health check do for an API that depends on a database and cache?', '对依赖数据库和缓存的 API,好的健康检查应当如何?'),
    [
      t('Luôn trả `200` để LB không loại server', 'Always return `200` so the LB never drops the server', '总是返回 `200`,让 LB 不会摘除服务器'),
      t('Kiểm tra nhẹ khả năng phục vụ thật (ví dụ ping DB), có timeout ngắn, và tách liveness với readiness', 'Do a light check of real ability to serve (e.g. a DB ping) with a short timeout, and separate liveness from readiness', '轻量检查真实服务能力(如 ping 数据库),设短超时,并区分存活与就绪'),
      t('Chạy truy vấn nặng nhất để chắc chắn mọi thứ ổn', 'Run the heaviest query to be sure everything works', '执行最重的查询以确认一切正常'),
      t('Chỉ kiểm tra tiến trình còn chạy', 'Only check that the process is running', '只检查进程是否在运行'),
    ],
    1,
    t('Check quá nhẹ thì server hỏng vẫn nhận traffic; quá nặng thì tự gây tải và dễ loại nhầm cả đàn khi DB chậm.', 'Too light and a broken server keeps getting traffic; too heavy and it adds load and may eject the whole fleet when the DB is merely slow.', '检查太轻,坏掉的服务器仍会收到流量;太重则增加负载,数据库只是变慢时可能把整批服务器都摘掉。'),
  ),
];
