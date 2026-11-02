// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  // Parts mirror src/data/outline.js. Only written lessons are listed; add an id when its doc lands.
  lessons: [
    {type: 'category', label: 'Nền tảng', collapsed: false, items: ['client-server-http', 'dns-cdn', 'estimation', 'api-design']},
    {type: 'category', label: 'Scale & hiệu năng', collapsed: false, items: ['load-balancer', 'cache', 'proxy-api-gateway', 'rate-limiting']},
    {type: 'category', label: 'Dữ liệu', collapsed: false, items: ['database-replication-sharding', 'sql-vs-nosql', 'indexing-storage-engines', 'consistency-cap', 'object-storage-search']},
    {type: 'category', label: 'Bất đồng bộ & độ tin cậy', collapsed: false, items: ['message-queue', 'event-streaming', 'reliability-patterns', 'distributed-transactions', 'consensus']},
    {type: 'category', label: 'Vận hành & kiến trúc', collapsed: false, items: ['monolith-microservices', 'observability', 'deployment-release', 'security-basics']},
    {type: 'category', label: 'Case study', collapsed: false, items: ['url-shortener', 'case-rate-limiter', 'case-news-feed', 'case-chat', 'case-file-storage', 'case-notification', 'case-autocomplete']},
  ],
};

export default sidebars;
