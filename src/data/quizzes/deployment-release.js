import {t, q} from './t';

export default [
  q(
    t('Feature flag giúp "tách deploy khỏi release" theo nghĩa nào?', 'In what sense does a feature flag "decouple deploy from release"?', '特性开关如何“把部署与发布解耦”?'),
    [
      t('Mã mới được đưa lên production ở trạng thái tắt; bật cho người dùng sau, tách khỏi lần deploy, và tắt lại được ngay khi có sự cố', 'New code reaches production switched off; it is enabled for users later, independently of the deploy, and can be switched off instantly if something breaks', '新代码以关闭状态上线;之后独立于部署再对用户开启,出问题可立即关闭'),
      t('Không cần test trước khi deploy', 'You no longer need to test before deploying', '部署前不再需要测试'),
      t('Mỗi người dùng chạy một phiên bản server khác nhau', 'Every user runs a different server version', '每个用户运行不同版本的服务器'),
      t('Flag thay thế hoàn toàn rollback database', 'Flags fully replace database rollback', '开关完全取代数据库回滚'),
    ],
    0,
    t('Deploy là đưa mã lên; release là cho người dùng thấy. Tách hai việc giảm rủi ro: sự cố chỉ cần tắt flag, không cần deploy lại.', 'Deploy puts code on servers; release exposes it to users. Splitting the two cuts risk: an incident needs only a flag flip, not another deploy.', '部署是把代码放上服务器,发布是让用户看到。两者分开可降低风险:出事只需关开关,无需再次部署。'),
  ),
  q(
    t('Canary release khác blue/green ở điểm chính nào?', 'What is the main difference between a canary release and blue/green?', '金丝雀发布与蓝绿部署的主要区别是什么?'),
    [
      t('Canary chuyển một phần nhỏ lưu lượng sang bản mới rồi tăng dần theo số liệu; blue/green dựng cả môi trường mới và chuyển toàn bộ lưu lượng cùng lúc', 'A canary shifts a small slice of traffic to the new version and grows it based on metrics; blue/green builds a whole new environment and switches all traffic at once', '金丝雀把一小部分流量切到新版本,并依据指标逐步放大;蓝绿则搭建一整套新环境,一次性切换全部流量'),
      t('Canary không cần load balancer', 'A canary needs no load balancer', '金丝雀不需要负载均衡'),
      t('Blue/green chỉ dùng cho database', 'Blue/green is only for databases', '蓝绿只适用于数据库'),
      t('Hai cách này giống hệt nhau', 'They are identical', '两者完全一样'),
    ],
    0,
    t('Canary giới hạn số người bị ảnh hưởng nếu bản mới lỗi; blue/green cho rollback tức thì bằng cách chuyển lưu lượng về môi trường cũ nhưng tốn gấp đôi hạ tầng.', 'A canary limits how many users a bad build can hurt; blue/green gives instant rollback by switching back, at the cost of double the infrastructure.', '金丝雀限制坏版本影响的用户数;蓝绿通过切回旧环境实现瞬时回滚,代价是基础设施翻倍。'),
  ),
  q(
    t('Cần đổi tên cột `title` thành `name` mà không gây downtime. Cách an toàn nhất?', 'You must rename column `title` to `name` with zero downtime. Which approach is safest?', '要在零停机下把列 `title` 改名为 `name`,最安全的做法是?'),
    [
      t('Chạy `RENAME COLUMN` rồi deploy mã mới ngay', 'Run `RENAME COLUMN` and deploy the new code right away', '直接执行 `RENAME COLUMN`,然后马上部署新代码'),
      t('Expand/contract: thêm cột `name`, ghi cả hai cột, backfill, chuyển đọc sang `name`, rồi mới xoá `title` ở lần phát hành sau', 'Expand/contract: add `name`, write to both, backfill, switch reads to `name`, and only drop `title` in a later release', '扩展/收缩:新增 `name` 列,双写,回填,把读切到 `name`,之后某次发布再删除 `title`'),
      t('Tạm dừng toàn bộ hệ thống lúc nửa đêm', 'Take the whole system down at midnight', '半夜让整个系统停机'),
      t('Sửa trực tiếp trên production bằng tay', 'Edit production by hand', '直接在生产环境手工修改'),
    ],
    1,
    t('Khi rolling deploy, bản cũ và bản mới chạy song song nên schema phải tương thích với cả hai; mỗi bước nhỏ đều có thể hoàn tác.', 'During a rolling deploy old and new versions run side by side, so the schema must work for both; each small step can be reverted.', '滚动部署期间新旧版本并行运行,因此 schema 必须同时兼容两者;每个小步骤都可回退。'),
  ),
  q(
    t('Readiness probe khác liveness probe thế nào?', 'How does a readiness probe differ from a liveness probe?', '就绪探针与存活探针有何不同?'),
    [
      t('Readiness cho biết instance đã sẵn sàng nhận lưu lượng chưa (chưa thì bị loại khỏi load balancer); liveness cho biết tiến trình có bị treo cần khởi động lại không', 'Readiness says whether an instance can take traffic yet (if not, it is pulled from the load balancer); liveness says whether the process is stuck and needs a restart', '就绪表示实例能否接收流量(不能则从负载均衡摘除);存活表示进程是否卡死、是否需要重启'),
      t('Hai loại là một, chỉ khác tên', 'They are the same thing under two names', '两者是同一个东西,只是名字不同'),
      t('Liveness dùng để chạy test tự động', 'Liveness runs the automated tests', '存活探针用来运行自动化测试'),
      t('Readiness chỉ kiểm tra CPU', 'Readiness only checks CPU', '就绪探针只检查 CPU'),
    ],
    0,
    t('Nhờ readiness, rolling deploy không gửi request vào instance đang khởi động hoặc đang ấm cache.', 'Thanks to readiness, a rolling deploy never sends requests to an instance that is still booting or warming its cache.', '有了就绪探针,滚动部署不会把请求发给仍在启动或预热缓存的实例。'),
  ),
  q(
    t('Vì sao nên triển khai cùng một artifact bất biến (image) qua staging rồi production?', 'Why deploy the same immutable artifact (image) through staging and then production?', '为什么要让同一个不可变制品(镜像)依次经过预发布与生产?'),
    [
      t('Để thứ đã được kiểm thử chính là thứ chạy thật; khác biệt giữa các môi trường chỉ nằm ở cấu hình', 'So that what was tested is exactly what runs in production; environments differ only in configuration', '这样测试过的就是线上运行的;各环境只在配置上不同'),
      t('Để build nhanh hơn một chút', 'To make builds slightly faster', '为了让构建稍微快一点'),
      t('Vì image không thể rollback', 'Because images cannot be rolled back', '因为镜像无法回滚'),
      t('Để không cần CI', 'So that CI is unnecessary', '这样就不需要 CI'),
    ],
    0,
    t('Build lại cho từng môi trường có thể cho ra kết quả khác ("chạy được trên staging"). Rollback cũng chỉ là triển khai lại artifact cũ.', 'Rebuilding per environment can yield different results ("works on staging"). Rollback is also just redeploying the previous artifact.', '为每个环境重新构建可能得到不同结果(“预发布能跑”)。回滚也只是重新部署旧制品。'),
  ),
];
