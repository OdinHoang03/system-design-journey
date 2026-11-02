import {t, q} from './t';

export default [
  q(
    t('Vì sao không nên lưu ảnh và video trực tiếp trong cột BLOB của database chính?', 'Why avoid storing photos and videos directly in a BLOB column of the main database?', '为什么不应把照片和视频直接存进主数据库的 BLOB 列?'),
    [
      t('Database không lưu được dữ liệu nhị phân', 'Databases cannot store binary data', '数据库无法存二进制数据'),
      t('Dữ liệu sẽ bị mất khi restart', 'Data is lost on restart', '重启后数据会丢失'),
      t('Làm database phình to, sao lưu và replica nặng, lưu trữ đắt; nên để file ở object storage và chỉ giữ metadata', 'It bloats the database, makes backups and replicas heavy, and storage costly; keep files in object storage and only metadata in the DB', '会让数据库膨胀、备份和副本沉重、存储昂贵;应把文件放对象存储,数据库只存元数据'),
      t('SQL cấm kiểu BLOB', 'SQL forbids the BLOB type', 'SQL 禁止 BLOB 类型'),
    ],
    2,
    t('Database tối ưu cho dữ liệu có cấu trúc và truy vấn; file lớn thuộc về kho được tạo ra để lưu byte rẻ và bền.', 'Databases are tuned for structured data and queries; large files belong in a store built for cheap, durable bytes.', '数据库为结构化数据和查询优化;大文件属于专为廉价、持久存储字节而生的系统。'),
  ),
  q(
    t('Presigned URL giải quyết điều gì khi người dùng tải file lớn lên?', 'What does a presigned URL solve when users upload large files?', '用户上传大文件时,预签名 URL 解决了什么问题?'),
    [
      t('Client tải thẳng lên object storage với quyền tạm thời, server ứng dụng không phải chuyển tiếp byte', 'The client uploads straight to object storage with temporary permission, so the app server does not relay the bytes', '客户端凭临时权限直接上传到对象存储,应用服务器无需中转字节'),
      t('Nén file tự động', 'It compresses the file automatically', '自动压缩文件'),
      t('Làm file tải nhanh gấp 10 lần', 'It makes the upload 10x faster', '让上传快 10 倍'),
      t('Thay thế việc xác thực người dùng', 'It replaces user authentication', '取代用户认证'),
    ],
    0,
    t('Server vẫn phải kiểm tra quyền trước khi cấp URL; URL chỉ cho một thao tác trên một key và hết hạn nhanh.', 'The server must still check permissions before issuing the URL; it allows one operation on one key and expires quickly.', '服务器在签发 URL 前仍要校验权限;该 URL 只允许对一个 key 做一种操作,而且很快过期。'),
  ),
  q(
    t('Có hai tài liệu: 1 = "cache queue", 2 = "queue shard". Inverted index tra cứu "queue" sẽ trả về gì?', 'Two documents: 1 = "cache queue", 2 = "queue shard". What does the inverted index return for "queue"?', '有两篇文档:1 = “cache queue”,2 = “queue shard”。倒排索引查 “queue” 会返回什么?'),
    [
      t('Chỉ tài liệu 1', 'Only document 1', '只有文档 1'),
      t('Chỉ tài liệu 2', 'Only document 2', '只有文档 2'),
      t('Danh sách [1, 2]', 'The list [1, 2]', '列表 [1, 2]'),
      t('Danh sách rỗng', 'An empty list', '空列表'),
    ],
    2,
    t('Chỉ mục ánh xạ từ → danh sách tài liệu chứa nó: queue → [1, 2], cache → [1], shard → [2].', 'The index maps word → documents containing it: queue → [1, 2], cache → [1], shard → [2].', '索引把词映射到包含它的文档:queue → [1, 2],cache → [1],shard → [2]。'),
  ),
  q(
    t('Vì sao `LIKE \'%từ%\'` không phù hợp để làm tìm kiếm văn bản trên bảng lớn?', 'Why is `LIKE \'%word%\'` a poor fit for text search on a large table?', '为什么 `LIKE \'%词%\'` 不适合在大表上做文本搜索?'),
    [
      t('Nó không hỗ trợ tiếng Việt', 'It does not support Vietnamese', '它不支持越南语'),
      t('Không dùng được index thông thường nên quét toàn bảng, lại không có xếp hạng hay dạng gốc của từ', 'It cannot use a normal index so it scans the whole table, and offers no ranking or stemming', '用不上普通索引所以扫全表,而且没有排序和词干处理'),
      t('Nó chỉ trả về một dòng', 'It returns only one row', '它只返回一行'),
      t('Nó khóa toàn bộ database', 'It locks the entire database', '它会锁住整个数据库'),
    ],
    1,
    t('Ký tự đại diện ở đầu chuỗi làm index B-tree vô dụng; inverted index sinh ra để giải bài toán này.', 'A leading wildcard defeats a B-tree index; the inverted index exists to solve exactly this.', '开头的通配符会让 B 树索引失效;倒排索引正是为解决这个问题而生。'),
  ),
  q(
    t('Nên coi search engine (như Elasticsearch) ở NoteNest là gì, và giữ nó đồng bộ ra sao?', 'How should NoteNest treat its search engine (e.g. Elasticsearch), and how should it stay in sync?', 'NoteNest 应如何看待搜索引擎(如 Elasticsearch),又该怎样保持同步?'),
    [
      t('Nguồn sự thật chính; ghi thẳng vào đó rồi bỏ database', 'The primary source of truth; write there and drop the database', '主要的事实来源;直接写它,弃用数据库'),
      t('Bản sao dẫn xuất; ghi vào database trước rồi cập nhật chỉ mục qua queue hoặc CDC, có thể dựng lại từ database', 'A derived copy; write to the database first, then update the index via a queue or CDC, and it can be rebuilt from the database', '派生副本;先写数据库,再通过队列或 CDC 更新索引,必要时可从数据库重建'),
      t('Cache; xoá sau mỗi giờ', 'A cache; wipe it hourly', '缓存;每小时清空'),
      t('Chỉ dùng cho file, không cho văn bản', 'Only for files, not for text', '只用于文件,不用于文本'),
    ],
    1,
    t('Hệ quả: tìm kiếm có độ trễ nhất quán (eventual), đổi lại chỉ mục hỏng cũng không làm mất dữ liệu gốc.', 'Consequence: search is eventually consistent, but a broken index never loses the original data.', '结果是搜索只保证最终一致,但索引损坏也不会丢失原始数据。'),
  ),
];
