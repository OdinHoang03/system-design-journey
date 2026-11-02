import {t, q} from './t';

export default [
  q(
    t('Vì sao nên upload file thẳng lên object storage bằng pre-signed URL thay vì qua app server?', 'Why upload files straight to object storage with a pre-signed URL instead of through the app server?', '为什么要用预签名 URL 直传对象存储,而不是经过 App 服务器?'),
    [
      t('Byte file không chiếm băng thông và kết nối của app server, nên app server nhẹ và scale tốt', 'File bytes do not consume the app server\'s bandwidth and connections, keeping it light and scalable', '文件字节不占用 App 服务器的带宽和连接,使其保持轻量、易扩展'),
      t('Vì object storage không cần xác thực', 'Because object storage needs no authentication', '因为对象存储不需要认证'),
      t('Vì app server không thể đọc HTTP', 'Because app servers cannot read HTTP', '因为 App 服务器无法读取 HTTP'),
      t('Để bỏ hẳn metadata', 'To get rid of metadata entirely', '为了彻底去掉元数据'),
    ],
    0,
    t('URL có chữ ký, hết hạn nhanh, vẫn kiểm soát được quyền; metadata service vẫn quản lý trạng thái file.', 'The URL is signed and short-lived, so access stays controlled; the metadata service still manages file state.', 'URL 带签名且短期有效,权限仍可控;元数据服务仍负责管理文件状态。'),
  ),
  q(
    t('Lợi ích chính của việc chia file thành chunk là gì?', 'What is the main benefit of splitting a file into chunks?', '把文件分块的主要好处是什么?'),
    [
      t('Tiếp tục upload khi rớt mạng, upload song song, và đồng bộ chỉ chunk đã đổi', 'Resumable upload, parallel upload, and syncing only changed chunks', '可续传、可并行上传,且同步时只传有变化的分块'),
      t('Làm file nhỏ đi một nửa', 'Makes the file half the size', '让文件体积减半'),
      t('Không cần metadata', 'Removes the need for metadata', '不再需要元数据'),
      t('Chunk càng nhỏ càng tốt, không có hạn chế', 'The smaller the chunk the better, with no downside', '分块越小越好,没有任何缺点'),
    ],
    0,
    t('Chunk quá nhỏ làm metadata và số request phình ra; chọn cỡ vừa phải (vài MB).', 'Tiny chunks bloat metadata and request counts; pick a moderate size (a few MB).', '分块太小会让元数据和请求数膨胀;选择适中大小(几 MB)。'),
  ),
  q(
    t('Dữ liệu nào nên nằm ở database còn dữ liệu nào ở object storage?', 'What belongs in the database and what in object storage?', '哪些数据放数据库,哪些放对象存储?'),
    [
      t('Cả hai đều ở database', 'Both in the database', '两者都放数据库'),
      t('Metadata (tên, chủ sở hữu, danh sách chunk, quyền) ở database; byte nội dung ở object storage', 'Metadata (name, owner, chunk list, permissions) in the database; content bytes in object storage', '元数据(名称、所有者、分块列表、权限)放数据库;内容字节放对象存储'),
      t('Cả hai đều ở object storage', 'Both in object storage', '两者都放对象存储'),
      t('Byte nội dung ở database, metadata ở CDN', 'Content bytes in the database, metadata in the CDN', '内容字节放数据库,元数据放 CDN'),
    ],
    1,
    t('Object storage rẻ và bền cho dữ liệu lớn; database phù hợp truy vấn và giao dịch trên metadata.', 'Object storage is cheap and durable for big data; the database suits queries and transactions on metadata.', '对象存储对大数据既便宜又持久;数据库适合对元数据做查询和事务。'),
  ),
  q(
    t('Vì sao transcoding video nên chạy bất đồng bộ qua queue?', 'Why should video transcoding run asynchronously through a queue?', '为什么视频转码应通过队列异步执行?'),
    [
      t('Vì nó tốn CPU và lâu; queue cho phép trả lời upload ngay và scale worker theo độ dài hàng đợi', 'It is CPU-heavy and slow; a queue lets the upload return at once and workers scale with queue length', '它耗 CPU 且耗时;队列让上传立刻返回,并能按队列长度扩缩 worker'),
      t('Vì video không bao giờ cần transcode', 'Because video never needs transcoding', '因为视频从不需要转码'),
      t('Vì queue làm video đẹp hơn', 'Because queues make video look better', '因为队列能让视频更清晰'),
      t('Vì CDN bắt buộc như vậy', 'Because the CDN requires it', '因为 CDN 要求如此'),
    ],
    0,
    t('Đổi lại, video chưa xem được ngay; giao diện cần trạng thái "đang xử lý".', 'The cost is video not being watchable at once; the UI needs a "processing" state.', '代价是视频不能立刻观看;界面需要“处理中”状态。'),
  ),
  q(
    t('Adaptive bitrate streaming (HLS/DASH) hoạt động thế nào?', 'How does adaptive bitrate streaming (HLS/DASH) work?', '自适应码率流(HLS/DASH)是如何工作的?'),
    [
      t('Video được tải một lần nguyên file ở chất lượng cao nhất', 'The video is downloaded once as a whole file at top quality', '视频以最高画质整个下载一次'),
      t('Video được transcode nhiều mức và cắt thành đoạn ngắn; trình phát chọn đoạn theo băng thông hiện tại', 'The video is transcoded at several levels and cut into short segments; the player picks segments by current bandwidth', '视频被转成多个档位并切成短片段;播放器按当前带宽选择片段'),
      t('Server tự đoán chất lượng mà client không tham gia', 'The server guesses quality with no client involvement', '服务器自行猜测画质,客户端不参与'),
      t('Chỉ dùng cho âm thanh', 'It is only for audio', '只适用于音频'),
    ],
    1,
    t('Đoạn ngắn cũng cache tốt trên CDN, và đổi mức chất lượng giữa chừng không cần tải lại từ đầu.', 'Short segments also cache well on a CDN, and switching quality mid-stream needs no restart.', '短片段在 CDN 上也易缓存,播放中切换画质无需从头重新加载。'),
  ),
];
