import {t, q} from './t';

export default [
  q(
    t('Phương thức HTTP nào KHÔNG idempotent theo mặc định?', 'Which HTTP method is NOT idempotent by default?', '默认情况下哪个 HTTP 方法不是幂等的?'),
    [
      t('GET', 'GET', 'GET'),
      t('PUT', 'PUT', 'PUT'),
      t('DELETE', 'DELETE', 'DELETE'),
      t('POST', 'POST', 'POST'),
    ],
    3,
    t('Gọi `POST /notes` hai lần có thể tạo hai ghi chú. `PUT` và `DELETE` gọi lại cho cùng trạng thái cuối. Vì vậy `POST` cần idempotency key khi retry.', 'Calling `POST /notes` twice can create two notes. `PUT` and `DELETE` repeated leave the same end state. That is why `POST` needs an idempotency key for retries.', '调用两次 `POST /notes` 可能创建两条笔记。`PUT` 和 `DELETE` 重复调用最终状态相同。所以 `POST` 重试时需要幂等键。'),
  ),
  q(
    t('Idempotency-Key giải quyết vấn đề gì và server phải làm gì?', 'What does an Idempotency-Key solve and what must the server do?', 'Idempotency-Key 解决什么问题?服务端要做什么?'),
    [
      t('Chống gửi trùng khi retry: lưu khoá cùng kết quả, gặp lại khoá thì trả kết quả đã lưu (ghi khoá và dữ liệu phải nguyên tử)', 'Prevents duplicates on retry: store the key with the result and return the stored result when the key repeats (writing key and data must be atomic)', '防止重试造成重复:保存键和结果,再次遇到相同键就返回已保存结果(写键和写数据必须原子)'),
      t('Mã hoá request để chống nghe lén', 'Encrypts the request to prevent eavesdropping', '加密请求防止窃听'),
      t('Tăng tốc truy vấn bằng cache', 'Speeds up queries with caching', '通过缓存加速查询'),
      t('Xác thực người dùng thay cho token', 'Authenticates the user in place of a token', '代替令牌来认证用户'),
    ],
    0,
    t('Nếu ghi dữ liệu và ghi khoá không nguyên tử, hai request đồng thời vẫn có thể cùng tạo bản ghi.', 'If writing data and recording the key are not atomic, two concurrent requests can still both create a record.', '如果写数据和记录键不是原子的,两个并发请求仍可能都创建记录。'),
  ),
  q(
    t('Danh sách ghi chú liên tục có bài mới. Cách phân trang nào ổn định hơn?', 'The note list keeps getting new items. Which pagination is more stable?', '笔记列表不断有新内容。哪种分页更稳定?'),
    [
      t('Offset/limit, vì luôn nhảy được tới trang bất kỳ nên không bao giờ trùng mục', 'Offset/limit, since you can jump to any page it never duplicates items', 'Offset/limit,因为能跳到任意页所以绝不重复'),
      t('Cursor (keyset), vì con trỏ gắn với vị trí cụ thể nên mục mới chèn vào không làm lệch trang', 'Cursor (keyset), since the cursor is tied to a position so newly inserted items do not shift pages', '游标(keyset),因为游标绑定具体位置,新插入的内容不会让分页错位'),
      t('Trả toàn bộ danh sách trong một phản hồi', 'Return the whole list in one response', '一次响应返回全部列表'),
      t('Phân trang ngẫu nhiên', 'Random pagination', '随机分页'),
    ],
    1,
    t('Với offset, một mục mới ở đầu đẩy mọi mục xuống một vị trí nên trang kế tiếp lặp lại mục cuối của trang trước.', 'With offset, a new item at the top pushes everything down one slot, so the next page repeats the previous page\'s last item.', '用 offset 时,顶部新增一条会让所有内容后移一位,下一页会重复上一页的最后一条。'),
  ),
  q(
    t('Thay đổi nào là PHÁ VỠ tương thích ngược của API?', 'Which change BREAKS backward compatibility of an API?', '以下哪种改动会破坏 API 的向后兼容?'),
    [
      t('Thêm một trường mới vào phản hồi', 'Adding a new field to a response', '给响应新增一个字段'),
      t('Thêm một endpoint mới', 'Adding a new endpoint', '新增一个端点'),
      t('Đổi tên trường `title` thành `name`', 'Renaming the field `title` to `name`', '把字段 `title` 改名为 `name`'),
      t('Thêm tham số truy vấn tuỳ chọn', 'Adding an optional query parameter', '新增一个可选查询参数'),
    ],
    2,
    t('Client cũ đọc `title` sẽ thất bại. Cộng thêm thì an toàn nếu client bỏ qua trường lạ.', 'Old clients that read `title` will fail. Additions are safe as long as clients ignore unknown fields.', '读取 `title` 的旧客户端会出错。只要客户端忽略未知字段,新增就是安全的。'),
  ),
  q(
    t('Khi nào gRPC hợp hơn REST?', 'When does gRPC fit better than REST?', '什么时候 gRPC 比 REST 更合适?'),
    [
      t('API công khai cho trình duyệt, cần cache bằng CDN', 'A public API for browsers that needs CDN caching', '面向浏览器、需要 CDN 缓存的公开 API'),
      t('Gọi giữa các dịch vụ nội bộ cần nhanh, hợp đồng chặt, hoặc cần streaming', 'Internal service-to-service calls needing speed, a strict contract, or streaming', '需要高速、严格契约或流式传输的内部服务间调用'),
      t('Khi muốn người dùng đọc được request bằng mắt', 'When humans should read requests by eye', '希望人眼能直接读懂请求'),
      t('Không bao giờ, REST luôn tốt hơn', 'Never, REST is always better', '从不,REST 永远更好'),
    ],
    1,
    t('gRPC dùng giao thức nhị phân trên HTTP/2 và hợp đồng `.proto`; đổi lại, trình duyệt khó gọi trực tiếp và khó debug bằng mắt.', 'gRPC uses a binary protocol over HTTP/2 and a `.proto` contract; in exchange it is awkward from browsers and hard to debug by eye.', 'gRPC 基于 HTTP/2 的二进制协议,使用 `.proto` 契约;代价是浏览器难以直接调用、肉眼难调试。'),
  ),
];
