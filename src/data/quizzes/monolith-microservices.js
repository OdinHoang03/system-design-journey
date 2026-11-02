import {t, q} from './t';

export default [
  q(
    t('NoteNest có 6 dev, một codebase, deploy mỗi tuần. Nên làm gì trước?', 'NoteNest has 6 developers, one codebase and a weekly deploy. What should come first?', 'NoteNest 有 6 个开发者、一个代码库、每周发布一次。应该先做什么?'),
    [
      t('Tách ngay thành 20 microservice cho "hiện đại"', 'Split into 20 microservices right away to be "modern"', '为了“现代化”立刻拆成 20 个微服务'),
      t('Giữ monolith nhưng chia module rõ ràng theo domain (modular monolith)', 'Keep the monolith but split it into clear domain modules (a modular monolith)', '保留单体,但按领域划分清晰的模块(模块化单体)'),
      t('Viết lại toàn bộ bằng ngôn ngữ mới', 'Rewrite everything in a new language', '用新语言整个重写'),
      t('Cho mỗi dev một database riêng', 'Give each developer a separate database', '给每个开发者一个独立数据库'),
    ],
    1,
    t('Ranh giới module rõ ràng cho phần lớn lợi ích mà chưa phải trả chi phí mạng, vận hành và nhất quán dữ liệu của microservice; có thể tách sau khi thật sự cần.', 'Clear module boundaries deliver most of the benefit without paying for the network, operations and data-consistency costs of microservices; you can split later when it is truly needed.', '清晰的模块边界已能带来大部分好处,又不必承担微服务的网络、运维和数据一致性成本;真正需要时再拆。'),
  ),
  q(
    t('Dấu hiệu nào cho thấy đang có "distributed monolith"?', 'Which sign points to a "distributed monolith"?', '哪种迹象说明出现了“分布式单体”?'),
    [
      t('Mỗi service có database riêng và deploy độc lập', 'Each service has its own database and deploys independently', '每个服务有独立数据库并可独立部署'),
      t('Sửa một service luôn kéo theo sửa và deploy cùng lúc nhiều service khác, hoặc các service dùng chung một database', 'A change in one service always forces changes and simultaneous deploys of others, or services share one database', '改一个服务总要同时改并发布多个其他服务,或多个服务共用一个数据库'),
      t('Service giao tiếp qua event', 'Services communicate through events', '服务之间通过事件通信'),
      t('Có API gateway', 'There is an API gateway', '有 API 网关'),
    ],
    1,
    t('Khi các service buộc phải đổi và deploy cùng nhau, bạn mất lợi ích của việc tách mà vẫn gánh chi phí mạng và vận hành.', 'When services must change and deploy together you lose the benefit of splitting yet still pay the network and operations cost.', '当各服务必须一起修改、一起发布时,既失去拆分的好处,又仍要承担网络与运维成本。'),
  ),
  q(
    t('Vì sao nên "database per service"?', 'Why prefer "database per service"?', '为什么提倡“每个服务一个数据库”?'),
    [
      t('Để join giữa mọi bảng cho nhanh', 'So joins across all tables are fast', '这样可以快速跨所有表 join'),
      t('Để service khác không phụ thuộc vào schema nội bộ; mỗi bên đổi cấu trúc dữ liệu mà không phá bên kia', 'So other services do not depend on internal schemas; each side can change its data structure without breaking others', '这样其他服务不会依赖内部表结构;各方可以修改数据结构而不破坏对方'),
      t('Vì database không chịu được nhiều bảng', 'Because a database cannot hold many tables', '因为数据库放不下很多表'),
      t('Để giảm số lượng backup', 'To reduce the number of backups', '为了减少备份数量'),
    ],
    1,
    t('Database dùng chung là khớp nối ngầm. Đổi lại, dữ liệu liên service phải lấy qua API/event và chấp nhận nhất quán cuối cùng.', 'A shared database is a hidden coupling. In exchange, cross-service data must come through APIs or events, with eventual consistency.', '共享数据库是隐性耦合。代价是跨服务数据只能通过 API 或事件获取,并接受最终一致性。'),
  ),
  q(
    t('Strangler fig pattern dùng để làm gì?', 'What is the strangler fig pattern for?', '绞杀者模式(strangler fig)用来做什么?'),
    [
      t('Dần dần chuyển từng chức năng từ monolith sang service mới sau một lớp định tuyến, cho tới khi monolith cũ rỗng', 'Gradually move one capability at a time from the monolith to new services behind a routing layer until the old monolith is empty', '在路由层之后,逐个把功能从单体迁到新服务,直到旧单体被掏空'),
      t('Dừng hệ thống cuối tuần để viết lại', 'Shut the system down on weekends and rewrite it', '周末停机重写'),
      t('Nhân bản database', 'Replicate the database', '复制数据库'),
      t('Chặn request độc hại', 'Block malicious requests', '拦截恶意请求'),
    ],
    0,
    t('Đây là cách chuyển đổi từng bước, rollback được, thay cho viết lại "big bang" rủi ro cao.', 'It is an incremental, reversible migration instead of a risky big-bang rewrite.', '这是一种可逐步推进、可回滚的迁移方式,取代高风险的“一次性重写”。'),
  ),
  q(
    t('Chuyển từ gọi hàm trong monolith sang gọi giữa service, điều nào ĐÚNG?', 'Moving from in-process calls to calls between services, which statement is TRUE?', '从单体内的函数调用改为服务间调用,哪项说法正确?'),
    [
      t('Không có gì khác, chỉ đổi cú pháp', 'Nothing changes, only the syntax', '没有区别,只是语法不同'),
      t('Phải tính tới độ trễ, timeout, lỗi một phần, retry và version của API', 'You must handle latency, timeouts, partial failures, retries and API versioning', '必须考虑延迟、超时、部分失败、重试和 API 版本'),
      t('Giao dịch ACID vẫn tự động bao trùm nhiều service', 'ACID transactions still span services automatically', 'ACID 事务仍会自动跨越多个服务'),
      t('Debug dễ hơn vì mỗi service nhỏ hơn', 'Debugging gets easier because each service is smaller', '调试更容易,因为每个服务更小'),
    ],
    1,
    t('Cuộc gọi qua mạng có thể chậm, mất hoặc thành công một nửa; debug cần trace xuyên service (bài sau).', 'A network call can be slow, lost or half-successful; debugging needs cross-service tracing (next lesson).', '网络调用可能变慢、丢失或只成功一半;调试需要跨服务链路追踪(下一篇)。'),
  ),
];
