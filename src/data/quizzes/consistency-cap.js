import {t, q} from './t';

export default [
  q(
    t('Khi mạng giữa hai vùng bị đứt, định lý CAP buộc hệ thống phải chọn gì?', 'When the network between two regions is cut, what does the CAP theorem force a system to choose?', '两个区域之间网络断开时,CAP 定理迫使系统在什么之间选择?'),
    [
      t('Giữa tính nhất quán (C) và tính sẵn sàng (A)', 'Between consistency (C) and availability (A)', '在一致性(C)和可用性(A)之间'),
      t('Giữa độ trễ và băng thông', 'Between latency and bandwidth', '在延迟和带宽之间'),
      t('Giữa SQL và NoSQL', 'Between SQL and NoSQL', '在 SQL 和 NoSQL 之间'),
      t('Giữa đọc và ghi', 'Between reads and writes', '在读和写之间'),
    ],
    0,
    t('Mạng sẽ đứt nên P là bắt buộc; khi đó hoặc từ chối yêu cầu để giữ đúng (CP), hoặc trả lời và chấp nhận lệch (AP).', 'Networks will break so P is a given; then you either refuse requests to stay correct (CP) or answer and accept divergence (AP).', '网络一定会断,所以 P 是必选;此时要么拒绝请求以保持正确(CP),要么照常应答并接受分歧(AP)。'),
  ),
  q(
    t('Câu nào là hiểu lầm về CAP?', 'Which statement is a misreading of CAP?', '下面哪句是对 CAP 的误解?'),
    [
      t('"Hệ thống phân tán luôn có thể chọn CA vì mạng nội bộ đủ tốt"', '"A distributed system can always pick CA because the internal network is good enough"', '“分布式系统总可以选 CA,因为内部网络足够好”'),
      t('"Khi có phân vùng, phải hy sinh C hoặc A"', '"During a partition, you must give up C or A"', '“出现分区时,必须牺牲 C 或 A”'),
      t('"Khi mạng ổn, có thể có cả C và A"', '"When the network is healthy, you can have both C and A"', '“网络正常时,可以同时拥有 C 和 A”'),
      t('"Sẵn sàng trong CAP là định nghĩa hẹp"', '"Availability in CAP is a narrow definition"', '“CAP 里的可用性是个狭义定义”'),
    ],
    0,
    t('Phân vùng không phải thứ ta chọn tránh; hệ nhiều nút qua mạng sớm muộn cũng gặp nên không có "CA" thực tế.', 'Partitions are not something you can opt out of; multi-node networked systems will meet them, so "CA" is not a real option.', '分区不是想避就能避的;联网的多节点系统迟早会遇到,所以现实中不存在“CA”。'),
  ),
  q(
    t('Có N=3 bản sao. Cấu hình nào đảm bảo tập đọc và tập ghi luôn giao nhau?', 'There are N=3 replicas. Which configuration guarantees that read and write sets always overlap?', '有 N=3 个副本。哪种配置能保证读集合与写集合总有交集?'),
    [
      t('W=1, R=1', 'W=1, R=1', 'W=1,R=1'),
      t('W=2, R=2', 'W=2, R=2', 'W=2,R=2'),
      t('W=1, R=2', 'W=1, R=2', 'W=1,R=2'),
      t('W=0, R=3', 'W=0, R=3', 'W=0,R=3'),
    ],
    1,
    t('Điều kiện là R + W > N: 2 + 2 = 4 > 3. Với W=1, R=2 thì tổng chỉ bằng 3, vẫn có thể không giao nhau.', 'The condition is R + W > N: 2 + 2 = 4 > 3. With W=1, R=2 the sum is 3, so the sets can still miss each other.', '条件是 R + W > N:2 + 2 = 4 > 3。W=1、R=2 时总和为 3,两个集合仍可能不相交。'),
  ),
  q(
    t('Lan sửa ghi chú rồi tải lại trang và thấy bản cũ vì đọc từ replica trễ. Đảm bảo nào sửa đúng vấn đề này với chi phí thấp?', 'Lan edits a note, reloads, and sees the old version because the read hit a lagging replica. Which guarantee fixes exactly this at low cost?', '小兰改了笔记,刷新后看到旧版本,因为读到了落后的副本。哪种保证能以低成本恰好解决这个问题?'),
    [
      t('Chuyển cả hệ thống sang linearizable', 'Make the whole system linearizable', '把整个系统改成线性一致'),
      t('Read-your-writes (đọc từ primary hoặc replica đã cập nhật sau khi vừa ghi)', 'Read-your-writes (read from the primary or an up-to-date replica right after a write)', '读己之写(刚写完后从主库或已更新的副本读取)'),
      t('Tăng số replica', 'Add more replicas', '增加副本数量'),
      t('Dùng last-write-wins', 'Use last-write-wins', '使用最后写入者胜'),
    ],
    1,
    t('Đảm bảo theo phiên chỉ cần đúng cho chính người ghi, rẻ hơn nhiều so với nhất quán mạnh toàn cục.', 'A per-session guarantee only has to be right for the writer, far cheaper than global strong consistency.', '会话级保证只需对写入者本人成立,比全局强一致便宜得多。'),
  ),
  q(
    t('Cho mỗi bài toán, cặp "bài toán → mức nhất quán" nào hợp lý nhất?', 'Which "problem → consistency level" pairing is most sensible?', '下面哪组“场景 → 一致性级别”的搭配最合理?'),
    [
      t('Số dư tài khoản → eventual; bộ đếm lượt xem → strong', 'Account balance → eventual; view counter → strong', '账户余额 → 最终一致;浏览量 → 强一致'),
      t('Cả hai → eventual cho nhanh', 'Both → eventual for speed', '两者都 → 最终一致,追求快'),
      t('Cả hai → strong cho an toàn', 'Both → strong for safety', '两者都 → 强一致,追求安全'),
      t('Số dư → strong; bộ đếm lượt xem → eventual', 'Balance → strong; view counter → eventual', '余额 → 强一致;浏览量 → 最终一致'),
    ],
    3,
    t('Chọn theo hậu quả của việc đọc sai: tiền cần chặt, lượt xem lệch vài giây thì không ai thiệt.', 'Choose by the cost of a wrong read: money needs strictness; a view count off by a few seconds hurts nobody.', '按读错的后果来选:钱需要严格;浏览量差几秒谁都不受损。'),
  ),
];
