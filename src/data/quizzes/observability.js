import {t, q} from './t';

export default [
  q(
    t('Trung bình độ trễ là 200 ms nhưng người dùng vẫn than chậm. Nên xem gì?', 'Average latency is 200 ms yet users complain about slowness. What should you look at?', '平均延迟是 200 毫秒,但用户仍抱怨慢。应该看什么?'),
    [
      t('Percentile p95/p99 (histogram) của độ trễ', 'The p95/p99 latency percentiles (from histograms)', '延迟的 p95/p99 分位数(来自直方图)'),
      t('Chỉ CPU trung bình', 'Only the average CPU', '只看平均 CPU'),
      t('Số dòng log mỗi ngày', 'The number of log lines per day', '每天的日志行数'),
      t('Không cần xem gì thêm; trung bình đã đủ', 'Nothing more; the average is enough', '不用再看,平均值就够了'),
    ],
    0,
    t('Trung bình che đuôi chậm. 1% request mất 8 giây vẫn để trung bình thấp nhưng người dùng nặng gặp chúng thường xuyên.', 'The average hides the slow tail. 1% of requests taking 8 seconds still leaves a low average, yet heavy users hit them often.', '平均值会掩盖慢的长尾。1% 的请求耗时 8 秒,平均值仍然很低,但重度用户经常撞上。'),
  ),
  q(
    t('Vì sao không nên gắn `user_id` làm nhãn (label) của metric?', 'Why should you not use `user_id` as a metric label?', '为什么不应把 `user_id` 作为指标标签?'),
    [
      t('Vì label chỉ nhận số', 'Because labels accept only numbers', '因为标签只能是数字'),
      t('Vì mỗi giá trị mới tạo một chuỗi thời gian riêng; hàng triệu chuỗi làm sập hệ thống giám sát (cardinality)', 'Because every new value creates its own time series; millions of series overwhelm the monitoring system (cardinality)', '因为每个新值都会生成独立的时间序列;数百万条序列会压垮监控系统(基数问题)'),
      t('Vì vi phạm chuẩn HTTP', 'Because it violates the HTTP standard', '因为违反 HTTP 标准'),
      t('Vì metric không lưu được chuỗi', 'Because metrics cannot store strings', '因为指标无法存储字符串'),
    ],
    1,
    t('Chi tiết theo từng người dùng thuộc về log hoặc trace; metric chỉ giữ nhãn có tập giá trị nhỏ như route, status, region.', 'Per-user detail belongs in logs or traces; metrics keep only labels with small value sets like route, status, region.', '按用户的细节属于日志或链路;指标只保留取值少的标签,如 route、status、region。'),
  ),
  q(
    t('Correlation id (trace id) dùng để làm gì?', 'What is a correlation (trace) ID for?', '关联 ID(trace ID)有什么用?'),
    [
      t('Mã hoá request để bảo mật', 'To encrypt the request for security', '加密请求以保证安全'),
      t('Gom log và span của một request qua nhiều dịch vụ bằng một truy vấn', 'To gather the logs and spans of one request across many services with a single query', '用一次查询汇总一个请求在多个服务中的日志和 span'),
      t('Tăng tốc độ ghi log', 'To speed up log writes', '加快日志写入'),
      t('Thay thế việc đánh index database', 'To replace database indexing', '替代数据库索引'),
    ],
    1,
    t('Gateway sinh ID, mọi dịch vụ gắn vào log và truyền tiếp qua header; nhờ đó không phải ghép log bằng tay.', 'The gateway generates the ID and every service attaches it to logs and forwards it in a header, so nobody stitches logs by hand.', '网关生成 ID,各服务写入日志并通过 header 传递,不必再手工拼接日志。'),
  ),
  q(
    t('SLO 99,9% trong 30 ngày thì error budget xấp xỉ bao nhiêu và dùng để làm gì?', 'For a 99.9% SLO over 30 days, roughly how big is the error budget and what is it for?', '30 天 99.9% 的 SLO,错误预算大约多少、用来做什么?'),
    [
      t('Khoảng 43 phút; còn ngân sách thì cứ phát hành tính năng, cạn thì ưu tiên ổn định', 'About 43 minutes; keep shipping while budget remains, prioritize stability once it is spent', '约 43 分钟;预算未用完就继续发布功能,用完则优先保稳定'),
      t('Khoảng 43 giờ; để trả tiền phạt cho khách', 'About 43 hours; to pay customer penalties', '约 43 小时;用来赔付客户'),
      t('Bằng 0; hệ thống không được hỏng', 'Zero; the system must never fail', '为 0;系统绝不能出错'),
      t('Không dùng cho quyết định phát hành', 'It is not used for release decisions', '不用于发布决策'),
    ],
    0,
    t('0,1% của 30 ngày ≈ 43 phút. Error budget biến tranh luận "ổn định hay tính năng" thành con số; tiền phạt thuộc về SLA.', '0.1% of 30 days ≈ 43 minutes. The error budget turns the "stability vs features" debate into a number; penalties belong to the SLA.', '30 天的 0.1% ≈ 43 分钟。错误预算把“稳定还是功能”的争论变成数字;赔付属于 SLA。'),
  ),
  q(
    t('Cảnh báo nào nên đánh thức người trực lúc 3 giờ sáng?', 'Which alert should wake the on-call engineer at 3 a.m.?', '哪种告警应在凌晨 3 点叫醒值班人员?'),
    [
      t('"CPU của một server vượt 80%"', '"One server’s CPU exceeds 80%"', '“某台服务器 CPU 超过 80%”'),
      t('"Đĩa đầy 60%"', '"Disk is 60% full"', '“磁盘使用 60%”'),
      t('"Tỉ lệ lỗi người dùng thấy vượt ngưỡng SLO và đang đốt error budget nhanh"', '"User-visible error ratio is above the SLO threshold and burning the error budget fast"', '“用户可见错误率超过 SLO 阈值,正快速消耗错误预算”'),
      t('"Có một dòng log mức WARN"', '"A WARN-level log line appeared"', '“出现了一条 WARN 级别日志”'),
    ],
    2,
    t('Cảnh báo theo triệu chứng người dùng cảm nhận và cần hành động ngay; còn lại để dashboard hoặc ticket, tránh alert fatigue.', 'Page on symptoms users feel that need immediate action; leave the rest to dashboards or tickets to avoid alert fatigue.', '只对用户能感知且需要立即处理的症状呼叫;其余放仪表盘或工单,避免告警疲劳。'),
  ),
];
