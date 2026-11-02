import {t, q} from './t';

export default [
  q(
    t('Vấn đề chính của fan-out on write thuần túy là gì?', 'What is the main problem with pure fan-out on write?', '纯写扩散的主要问题是什么?'),
    [
      t('Đọc feed rất chậm', 'Reading the feed is very slow', '读取信息流非常慢'),
      t('Một bài của người có hàng triệu follower tạo ra hàng triệu lần ghi, nhiều lần phí cho người không mở app', 'One post from an account with millions of followers causes millions of writes, much of it wasted on people who never open the app', '拥有数百万粉丝的账号发一条帖就产生数百万次写入,其中很多浪费在从不打开 App 的人身上'),
      t('Không thể sắp xếp theo thời gian', 'It cannot sort by time', '无法按时间排序'),
      t('Không dùng được cache', 'It cannot use a cache', '无法使用缓存'),
    ],
    1,
    t('Đó là "vấn đề người nổi tiếng"; mô hình lai tránh đẩy bài của họ.', 'This is the "celebrity problem"; the hybrid model avoids pushing their posts.', '这就是“大 V 问题”;混合模型会避免推送他们的帖子。'),
  ),
  q(
    t('Mô hình lai hoạt động thế nào?', 'How does the hybrid model work?', '混合模型如何工作?'),
    [
      t('Người thường: đẩy vào feed follower bất đồng bộ; người nổi tiếng (trên ngưỡng): không đẩy, kéo bài của họ lúc đọc rồi trộn theo thời gian', 'Ordinary users: push asynchronously into follower feeds; celebrities (over a threshold): no push, pull their posts at read time and merge by time', '普通用户:异步推送到粉丝信息流;大 V(超过阈值):不推,读取时拉取其帖子并按时间合并'),
      t('Mọi người đều chỉ kéo', 'Everyone only pulls', '所有人都只拉'),
      t('Mọi người đều chỉ đẩy đồng bộ', 'Everyone only pushes synchronously', '所有人都只同步推'),
      t('Chọn ngẫu nhiên đẩy hoặc kéo cho mỗi bài', 'Randomly choose push or pull per post', '每条帖子随机选择推或拉'),
    ],
    0,
    t('Ngưỡng follower quyết định ai được coi là "hot user".', 'A follower threshold decides who counts as a "hot user".', '粉丝数阈值决定谁算“热点用户”。'),
  ),
  q(
    t('Vì sao feed cache chỉ nên lưu id bài thay vì toàn bộ nội dung?', 'Why should the feed cache store only post ids instead of full content?', '为什么信息流缓存只应存帖子 id 而不是完整内容?'),
    [
      t('Vì id không bao giờ thay đổi và nội dung thì không cần hiển thị', 'Because ids never change and content never needs displaying', '因为 id 永不改变,而内容不需要显示'),
      t('Để tiết kiệm bộ nhớ và sửa/xoá bài ở một nơi; đọc xong thì hydrate nội dung từ cache bài đăng', 'To save memory and edit/delete in one place; hydrate the content from the post cache on read', '为了节省内存并在一处编辑/删除;读取时再从帖子缓存填充内容'),
      t('Vì Redis không lưu được chuỗi', 'Because Redis cannot store strings', '因为 Redis 无法存储字符串'),
      t('Để feed không bao giờ cần database', 'So the feed never needs a database', '为了让信息流永远不需要数据库'),
    ],
    1,
    t('Sao chép nội dung vào hàng triệu feed vừa tốn bộ nhớ vừa khiến sửa/xoá gần như bất khả thi.', 'Copying content into millions of feeds wastes memory and makes edits/deletes nearly impossible.', '把内容复制进上百万个信息流既浪费内存,又让编辑/删除几乎不可能。'),
  ),
  q(
    t('Vì sao feed nên phân trang bằng cursor thay vì offset?', 'Why should a feed use cursor rather than offset pagination?', '为什么信息流应使用游标而不是 offset 分页?'),
    [
      t('Vì bài mới liên tục chèn vào đầu; với offset, trang kế tiếp sẽ lặp hoặc sót mục', 'Because new posts keep being inserted at the top; with offset the next page repeats or skips items', '因为新帖不断插入顶部;用 offset 时下一页会重复或遗漏内容'),
      t('Vì cursor cho phép nhảy tới trang bất kỳ', 'Because a cursor lets you jump to any page', '因为游标可以跳到任意页'),
      t('Vì offset không tồn tại trong SQL', 'Because offset does not exist in SQL', '因为 SQL 中没有 offset'),
      t('Không có khác biệt nào', 'There is no difference', '没有任何区别'),
    ],
    0,
    t('Cursor gắn với vị trí cụ thể (id/thời điểm của mục cuối), nên bài mới không làm lệch trang.', 'A cursor is tied to a specific position (id/time of the last item), so new posts do not shift pages.', '游标绑定具体位置(最后一项的 id/时间),所以新帖不会让分页错位。'),
  ),
  q(
    t('Cách nào tiết kiệm công ghi mà không làm hỏng trải nghiệm?', 'Which approach saves write work without hurting the experience?', '哪种做法能在不损害体验的前提下节省写入?'),
    [
      t('Không đẩy vào feed của người dùng lâu không hoạt động; khi họ quay lại thì dựng feed bằng cách kéo', 'Do not push into inactive users\' feeds; rebuild their feed by pulling when they return', '不向长期不活跃用户的信息流推送;他们回来时通过拉取重建'),
      t('Xoá feed của tất cả mọi người mỗi giờ', 'Wipe everyone\'s feed every hour', '每小时清空所有人的信息流'),
      t('Chỉ cho phép đăng một bài mỗi ngày', 'Only allow one post per day', '每天只允许发一条帖子'),
      t('Làm fan-out đồng bộ trong request đăng bài', 'Do fan-out synchronously in the post request', '在发帖请求里同步做扩散'),
    ],
    0,
    t('Lần quay lại đầu tiên chậm hơn một chút, đổi lại tiết kiệm rất nhiều lần ghi vô ích.', 'The first return visit is slightly slower, in exchange for saving many useless writes.', '首次回访稍慢,换来节省大量无用写入。'),
  ),
];
