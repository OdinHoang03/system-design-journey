// Resource list. `license` is what the source itself declares (checked 2026-11-02);
// we only link to and describe these sources, never copy their text or images.
export const groups = [
  {
    key: 'repos',
    title: {vi: 'Repo GitHub', en: 'GitHub repositories', zh: 'GitHub 仓库'},
    items: [
      {
        name: 'donnemartin/system-design-primer',
        url: 'https://github.com/donnemartin/system-design-primer',
        license: 'CC BY 4.0',
        desc: {
          vi: 'Cẩm nang kinh điển học thiết kế hệ thống quy mô lớn, kèm flashcard Anki.',
          en: 'The classic guide to large-scale system design, with Anki flashcards.',
          zh: '学习大规模系统设计的经典指南,附 Anki 记忆卡。',
        },
      },
      {
        name: 'ByteByteGoHq/system-design-101',
        url: 'https://github.com/ByteByteGoHq/system-design-101',
        license: 'CC BY-NC-ND 4.0',
        desc: {
          vi: 'Giải thích hệ thống phức tạp bằng hình minh hoạ và ngôn ngữ đơn giản.',
          en: 'Complex systems explained with visuals and simple language.',
          zh: '用图示和浅显的语言讲清复杂系统。',
        },
      },
      {
        name: 'karanpratapsingh/system-design',
        url: 'https://github.com/karanpratapsingh/system-design',
        license: 'CC BY-NC-ND 4.0',
        desc: {
          vi: 'Khoá học thiết kế hệ thống viết theo từng chương, có case study.',
          en: 'A chapter-by-chapter system design course with case studies.',
          zh: '按章节编排的系统设计课程,含案例分析。',
        },
      },
      {
        name: 'binhnguyennus/awesome-scalability',
        url: 'https://github.com/binhnguyennus/awesome-scalability',
        license: 'MIT',
        desc: {
          vi: 'Danh sách bài viết kiến trúc thực tế từ các công ty lớn về hệ thống scale, ổn định, hiệu năng.',
          en: 'Real-world architecture write-ups from big companies on scalable, reliable, fast systems.',
          zh: '来自各大公司的可扩展、高可靠、高性能系统的真实架构文章合集。',
        },
      },
      {
        name: 'ashishps1/awesome-system-design-resources',
        url: 'https://github.com/ashishps1/awesome-system-design-resources',
        license: 'GPL-3.0',
        desc: {
          vi: 'Tuyển tập tài nguyên miễn phí để học khái niệm và luyện phỏng vấn.',
          en: 'Free resources to learn the concepts and prepare for interviews.',
          zh: '免费资源合集,用于学习概念和准备面试。',
        },
      },
      {
        name: 'InterviewReady/system-design-resources',
        url: 'https://github.com/InterviewReady/system-design-resources',
        license: 'GPL-3.0',
        desc: {
          vi: 'Danh sách bài đọc và paper được chọn lọc cho system design.',
          en: 'A curated reading and paper list for system design.',
          zh: '精选的系统设计阅读与论文清单。',
        },
      },
      {
        name: 'yangshun/tech-interview-handbook',
        url: 'https://github.com/yangshun/tech-interview-handbook',
        license: 'MIT',
        desc: {
          vi: 'Cẩm nang chuẩn bị phỏng vấn kỹ thuật, có phần system design.',
          en: 'A technical interview handbook that includes a system design section.',
          zh: '技术面试手册,含系统设计部分。',
        },
      },
      {
        name: 'GitHub topic: system-design',
        url: 'https://github.com/topics/system-design',
        license: '—',
        desc: {
          vi: 'Trang tổng hợp các repo gắn chủ đề system-design, xếp theo số sao.',
          en: 'All repositories tagged system-design, sortable by stars.',
          zh: '所有标记为 system-design 的仓库,可按星标排序。',
        },
      },
    ],
  },
  {
    key: 'books',
    title: {vi: 'Sách & tài liệu dài', en: 'Books & long reads', zh: '书籍与长文'},
    items: [
      {
        name: 'Designing Data-Intensive Applications (M. Kleppmann)',
        url: 'https://dataintensive.net/',
        license: 'All rights reserved (O’Reilly)',
        desc: {
          vi: 'Sách nền tảng về lưu trữ, nhân bản, phân tán và xử lý dữ liệu.',
          en: 'The foundational book on storage, replication, distribution and data processing.',
          zh: '讲存储、复制、分布式与数据处理的奠基之作。',
        },
      },
      {
        name: 'Site Reliability Engineering (Google)',
        url: 'https://sre.google/books/',
        license: 'CC BY-NC 4.0',
        desc: {
          vi: 'Sách của Google về vận hành hệ thống tin cậy, đọc miễn phí online.',
          en: 'Google’s books on running reliable systems, free to read online.',
          zh: '谷歌关于可靠系统运维的书,可免费在线阅读。',
        },
      },
      {
        name: 'High Scalability',
        url: 'https://highscalability.com/',
        license: 'All rights reserved (authors)',
        desc: {
          vi: 'Blog lâu năm phân tích kiến trúc của các hệ thống lớn.',
          en: 'A long-running blog dissecting the architecture of large systems.',
          zh: '长期分析大型系统架构的博客。',
        },
      },
    ],
  },
  {
    key: 'courses',
    title: {vi: 'Khoá học & video công khai', en: 'Public courses & videos', zh: '公开课程与视频'},
    items: [
      {
        name: 'MIT 6.5840 (6.824) Distributed Systems',
        url: 'https://pdos.csail.mit.edu/6.824/',
        license: 'See course site',
        desc: {
          vi: 'Khoá hệ thống phân tán của MIT, có bài giảng video và lab công khai.',
          en: 'MIT’s distributed systems course with public lecture videos and labs.',
          zh: 'MIT 的分布式系统课程,讲座视频与实验均公开。',
        },
      },
      {
        name: 'Developer-Y/cs-video-courses',
        url: 'https://github.com/Developer-Y/cs-video-courses',
        license: 'No license declared',
        desc: {
          vi: 'Danh sách khoá CS có video bài giảng, gồm hệ thống phân tán.',
          en: 'A list of CS courses with video lectures, including distributed systems.',
          zh: '带视频讲座的计算机课程清单,含分布式系统。',
        },
      },
    ],
  },
];
