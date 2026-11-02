import {t, q} from './t';

export default [
  q(
    t('Vì sao lưu sẵn top-k tại mỗi nút của trie?', 'Why precompute top-k at each trie node?', '为什么要在 trie 的每个节点预存 top-k?'),
    [
      t('Để tra cứu chỉ cần đi theo tiền tố rồi đọc danh sách có sẵn, không phải duyệt cả cây con (O(L))', 'So a lookup just follows the prefix and reads a ready list instead of walking the whole subtree (O(L))', '这样查找只需沿前缀走并读取现成列表,不必遍历整棵子树(O(L))'),
      t('Để giảm bộ nhớ', 'To reduce memory', '为了减少内存'),
      t('Để trie tự cập nhật theo từng phím gõ', 'So the trie updates itself on every keystroke', '让 trie 随每次按键自动更新'),
      t('Vì trie không thể tìm tiền tố nếu không có top-k', 'Because a trie cannot find prefixes without top-k', '因为没有 top-k 的 trie 无法查找前缀'),
    ],
    0,
    t('Đổi lại tốn thêm bộ nhớ và phải dựng lại khi điểm xếp hạng thay đổi.', 'The cost is extra memory and rebuilding when ranking scores change.', '代价是更多内存,以及排名分数变化时需要重建。'),
  ),
  q(
    t('Làm sao cập nhật gợi ý theo xu hướng mà không làm chậm đường đọc?', 'How do you reflect trends without slowing the read path?', '如何在不拖慢读路径的前提下反映趋势?'),
    [
      t('Khoá trie và cập nhật ngay mỗi khi có truy vấn', 'Lock the trie and update on every query', '加锁并在每次查询时立即更新 trie'),
      t('Tách đường dữ liệu: tổng hợp nhật ký, dựng trie mới theo lô rồi thay nguyên khối (có thể kèm lớp phủ cho xu hướng nóng)', 'Separate the data path: aggregate logs, build a new trie in batch and swap it in whole (optionally an overlay for hot trends)', '分离数据路径:汇总日志、批量构建新 trie 并整体替换(热点趋势可加叠加层)'),
      t('Không bao giờ cập nhật', 'Never update', '永远不更新'),
      t('Xoá cache mỗi giây', 'Clear the cache every second', '每秒清空缓存'),
    ],
    1,
    t('Gợi ý không cần tức thì; trễ vài phút là chấp nhận được, đổi lại đường đọc luôn nhanh và nhất quán.', 'Suggestions need not be instant; a few minutes of lag is acceptable, in exchange the read path stays fast and consistent.', '建议不需要即时;滞后几分钟可以接受,换来读路径始终快速且一致。'),
  ),
  q(
    t('Biện pháp nào phía client giảm tải mạnh nhất cho dịch vụ gợi ý?', 'Which client-side measure cuts load on the suggestion service the most?', '哪种客户端措施最能减轻建议服务的负载?'),
    [
      t('Gửi request ở mỗi phím gõ để luôn mới nhất', 'Send a request on every keystroke to stay freshest', '每次按键都发请求以保持最新'),
      t('Debounce 100–150 ms, huỷ request cũ và cache kết quả theo tiền tố', 'Debounce 100–150 ms, cancel stale requests, and cache results per prefix', '防抖 100–150 ms、取消过期请求,并按前缀缓存结果'),
      t('Tắt gợi ý trên di động', 'Disable suggestions on mobile', '在手机上关闭建议'),
      t('Tải toàn bộ trie về trình duyệt', 'Download the entire trie into the browser', '把整棵 trie 下载到浏览器'),
    ],
    1,
    t('Debounce giảm số request; huỷ request cũ tránh kết quả đến sai thứ tự; cache bắt các tiền tố lặp lại.', 'Debounce reduces request count; cancelling avoids out-of-order results; caching catches repeated prefixes.', '防抖减少请求数;取消旧请求避免结果乱序;缓存拦截重复前缀。'),
  ),
  q(
    t('Dữ liệu lớn hơn RAM một máy. Chia shard thế nào hợp lý?', 'The data exceeds one machine\'s RAM. How should you shard?', '数据超过单机内存。应该怎样分片?'),
    [
      t('Theo tiền tố, nhưng cắt theo tải thực tế vì chữ cái phổ biến nặng hơn nhiều', 'By prefix, but split by real load since popular letters are far heavier', '按前缀分片,但依据实际负载切分,因为常见字母重得多'),
      t('Chia đều theo bảng chữ cái, không cần xét tải', 'Split evenly by alphabet, ignoring load', '按字母表平均切分,不考虑负载'),
      t('Chia ngẫu nhiên từng ký tự của tiền tố', 'Randomly split each character of the prefix', '随机拆分前缀的每个字符'),
      t('Không thể shard trie', 'A trie cannot be sharded', 'trie 无法分片'),
    ],
    0,
    t('Chia đều theo bảng chữ cái dễ tạo shard nóng (ví dụ `s`, `t`, `n`).', 'An even alphabet split easily creates hot shards (e.g. `s`, `t`, `n`).', '按字母表平均切分容易产生热点分片(如 `s`、`t`、`n`)。'),
  ),
  q(
    t('Rủi ro nào khi dựng trie từ nhật ký truy vấn của người dùng?', 'What risk comes with building the trie from user query logs?', '用用户查询日志构建 trie 有什么风险?'),
    [
      t('Không có rủi ro nào', 'There is no risk', '没有任何风险'),
      t('Thông tin cá nhân hoặc nội dung phản cảm trong nhật ký có thể trở thành gợi ý hiện cho người khác; cần lọc và ngưỡng tối thiểu', 'Personal data or offensive content in the logs can become suggestions shown to others; filter and apply a minimum-count threshold', '日志中的个人信息或不当内容可能变成展示给他人的建议;需要过滤并设置最小出现次数阈值'),
      t('Trie sẽ nhỏ đi quá mức', 'The trie becomes too small', 'trie 会变得过小'),
      t('Nhật ký làm trie chạy chậm hơn ở đường đọc', 'The logs slow the trie on the read path', '日志会拖慢 trie 的读路径'),
    ],
    1,
    t('Chỉ đưa vào trie truy vấn đã đủ nhiều người dùng khác nhau gõ, và áp dụng danh sách chặn khi dựng.', 'Include only queries typed by enough distinct users, and apply a blocklist at build time.', '只把足够多不同用户输入过的查询放入 trie,并在构建时应用黑名单。'),
  ),
];
