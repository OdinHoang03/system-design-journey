import {t, q} from './t';

export default [
  q(
    t('NoteNest có 1 triệu DAU, mỗi người 10 lượt đọc mỗi ngày. QPS đọc trung bình xấp xỉ bao nhiêu?', 'NoteNest has 1M DAU with 10 reads each per day. What is the approximate average read QPS?', 'NoteNest 有 100 万 DAU,每人每天 10 次读取。平均读 QPS 大约是多少?'),
    [
      t('~1', '~1', '~1'),
      t('~100', '~100', '~100'),
      t('~10.000', '~10,000', '~10,000'),
      t('~1.000.000', '~1,000,000', '~1,000,000'),
    ],
    1,
    t('10 triệu lượt/ngày chia ~10⁵ giây ≈ 100 QPS. Chia cho 86.400 cũng ra ~116, cùng bậc độ lớn.', '10M reads/day over ~10⁵ seconds ≈ 100 QPS. Dividing by 86,400 gives ~116, the same order of magnitude.', '每天 1000 万次读取除以约 10⁵ 秒 ≈ 100 QPS。除以 86,400 得约 116,量级相同。'),
  ),
  q(
    t('Vì sao nên thiết kế theo QPS đỉnh thay vì QPS trung bình?', 'Why design for peak QPS rather than average QPS?', '为什么应按峰值 QPS 而不是平均 QPS 来设计?'),
    [
      t('Vì trung bình luôn khó tính hơn', 'Because the average is always harder to compute', '因为平均值总是更难算'),
      t('Vì lưu lượng dồn vào giờ cao điểm; hệ thống chỉ chịu được trung bình sẽ quá tải đúng lúc đó', 'Because traffic bunches into peak hours; a system sized for the average overloads exactly then', '因为流量集中在高峰时段;只按平均值设计的系统恰好在那时过载'),
      t('Vì đỉnh luôn bằng đúng 10 lần trung bình', 'Because the peak is always exactly 10× the average', '因为峰值总是恰好等于平均值的 10 倍'),
      t('Vì QPS trung bình không có ý nghĩa', 'Because average QPS is meaningless', '因为平均 QPS 毫无意义'),
    ],
    1,
    t('Hệ số đỉnh thường 2–10 lần và thay đổi theo sản phẩm; phải ước lượng cho từng bài toán.', 'The peak factor is typically 2–10× and varies by product; estimate it per problem.', '峰值系数通常是 2–10 倍,因产品而异;要针对具体问题估算。'),
  ),
  q(
    t('Mỗi ngày có 2 GB dữ liệu mới, giữ 1 năm, nhân bản 3 lần. Dung lượng cần khoảng bao nhiêu?', 'There are 2 GB of new data per day, kept for 1 year with 3 replicas. Roughly how much capacity is needed?', '每天新增 2 GB 数据,保留 1 年,3 副本。大约需要多少容量?'),
    [
      t('~730 GB', '~730 GB', '~730 GB'),
      t('~2,2 TB', '~2.2 TB', '~2.2 TB'),
      t('~22 TB', '~22 TB', '~22 TB'),
      t('~6 GB', '~6 GB', '~6 GB'),
    ],
    1,
    t('2 GB × 365 ≈ 730 GB, nhân 3 bản ≈ 2,2 TB (chưa kể chỉ mục và dư địa).', '2 GB × 365 ≈ 730 GB, times 3 replicas ≈ 2.2 TB (before indexes and headroom).', '2 GB × 365 ≈ 730 GB,乘以 3 个副本 ≈ 2.2 TB(尚未计入索引和余量)。'),
  ),
  q(
    t('Thứ tự độ trễ nào đúng từ nhanh đến chậm?', 'Which latency ordering is right, fastest to slowest?', '以下哪个延迟从快到慢的顺序是正确的?'),
    [
      t('Đọc RAM < đọc ngẫu nhiên SSD < vòng mạng trong data center < gói tin liên lục địa', 'RAM read < SSD random read < round trip in a data center < intercontinental packet', '内存读取 < SSD 随机读 < 同机房往返 < 跨洲数据包'),
      t('SSD < RAM < vòng mạng nội bộ < liên lục địa', 'SSD < RAM < in-DC round trip < intercontinental', 'SSD < 内存 < 机房内往返 < 跨洲'),
      t('Liên lục địa < RAM < SSD < vòng mạng nội bộ', 'Intercontinental < RAM < SSD < in-DC round trip', '跨洲 < 内存 < SSD < 机房内往返'),
      t('Tất cả xấp xỉ nhau', 'They are all about the same', '它们大致相同'),
    ],
    0,
    t('Khoảng: RAM ~100 ns, SSD ~100 µs, vòng trong data center ~0,5 ms, liên lục địa ~100+ ms. Mỗi bước chậm hơn bước trước cả trăm lần hoặc hơn.', 'Roughly: RAM ~100 ns, SSD ~100 µs, in-DC round trip ~0.5 ms, intercontinental ~100+ ms. Each step is typically a hundred times slower, or more, than the one before.', '大致为:内存 ~100 ns,SSD ~100 µs,机房内往返 ~0.5 ms,跨洲 ~100+ ms。每一步通常比前一步慢上百倍甚至更多。'),
  ),
  q(
    t('Khi ước lượng trong phỏng vấn, việc nào nên làm?', 'In an interview estimate, what should you do?', '面试中做估算时,应该怎么做?'),
    [
      t('Im lặng tính chính xác đến từng đơn vị rồi báo kết quả', 'Compute silently to the exact unit and announce the result', '默默算到精确的每个单位再报结果'),
      t('Nói to các giả định, làm tròn mạnh, ghi đơn vị và kết thúc bằng kết luận thiết kế', 'State assumptions aloud, round aggressively, track units, and end with a design conclusion', '大声说出假设,大胆取整,标注单位,并以设计结论收尾'),
      t('Bỏ qua ước lượng và đi thẳng vào chọn công nghệ', 'Skip estimating and go straight to picking technology', '跳过估算,直接选技术'),
      t('Chỉ dùng số liệu của công ty lớn bất kể bài toán', 'Only use big-company numbers regardless of the problem', '不管题目如何,只用大公司的数据'),
    ],
    1,
    t('Mục tiêu là đúng bậc độ lớn và dẫn tới quyết định thiết kế, không phải độ chính xác.', 'The goal is the right order of magnitude and a design decision, not precision.', '目标是量级正确并推出设计决策,而不是精确。'),
  ),
];
