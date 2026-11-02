// Single source of truth for the 7 lessons of batch 1 (used by roadmap, home, sidebar labels).
export const lessons = [
  {
    id: 'client-server-http',
    users: '1',
    title: {vi: 'Client–server & HTTP', en: 'Client–server & HTTP', zh: '客户端–服务器与 HTTP'},
    story: {
      vi: 'Ngày đầu: app chạy trên một máy, một người dùng.',
      en: 'Day one: the app runs on a single machine for a single user.',
      zh: '第一天:应用只跑在一台机器上,只有一个用户。',
    },
  },
  {
    id: 'dns-cdn',
    users: '100',
    title: {vi: 'DNS & CDN', en: 'DNS & CDN', zh: 'DNS 与 CDN'},
    story: {
      vi: 'Có tên miền, người dùng ở xa bắt đầu thấy chậm.',
      en: 'A real domain name arrives, and far-away users start to feel the lag.',
      zh: '有了域名,远方的用户开始觉得慢。',
    },
  },
  {
    id: 'load-balancer',
    users: '10K',
    title: {vi: 'Load balancer & scale ngang', en: 'Load balancer & horizontal scaling', zh: '负载均衡与水平扩展'},
    story: {
      vi: 'Một server không đủ sức, thêm server thứ hai và thứ ba.',
      en: 'One server is no longer enough, so a second and third one join.',
      zh: '一台服务器撑不住了,于是加上第二台、第三台。',
    },
  },
  {
    id: 'cache',
    users: '100K',
    title: {vi: 'Cache', en: 'Caching', zh: '缓存'},
    story: {
      vi: 'Cùng một câu hỏi được hỏi triệu lần; đừng trả lời lại từ đầu.',
      en: 'The same question is asked a million times; stop answering it from scratch.',
      zh: '同一个问题被问了上百万次,别再每次从头回答。',
    },
  },
  {
    id: 'database-replication-sharding',
    users: '500K',
    title: {vi: 'Database: replication & sharding', en: 'Database: replication & sharding', zh: '数据库:复制与分片'},
    story: {
      vi: 'Database thành nút thắt cổ chai; nhân bản và chia nhỏ dữ liệu.',
      en: 'The database becomes the bottleneck; copy it and split it.',
      zh: '数据库成了瓶颈,于是复制它、再把数据切开。',
    },
  },
  {
    id: 'message-queue',
    users: '1M',
    title: {vi: 'Message queue & xử lý bất đồng bộ', en: 'Message queues & asynchronous processing', zh: '消息队列与异步处理'},
    story: {
      vi: 'Việc nặng không cần làm ngay trước mặt người dùng.',
      en: 'Heavy work does not have to happen while the user waits.',
      zh: '繁重的工作不必让用户当场等着。',
    },
  },
  {
    id: 'url-shortener',
    users: '∞',
    title: {vi: 'Case study: thiết kế URL shortener', en: 'Case study: designing a URL shortener', zh: '案例:设计一个短链接服务'},
    story: {
      vi: 'Ghép mọi mảnh lại thành một hệ thống hoàn chỉnh.',
      en: 'Put every piece together into one complete system.',
      zh: '把所有零件拼成一个完整的系统。',
    },
  },
];
