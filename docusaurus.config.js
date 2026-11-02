// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'System Design Journey',
  tagline: 'Từ app nhỏ đến hệ thống triệu người dùng',
  favicon: 'img/favicon.svg',

  future: {v4: true},

  url: 'https://odinhoang03.github.io',
  baseUrl: '/system-design-journey/',
  organizationName: 'OdinHoang03',
  projectName: 'system-design-journey',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {hooks: {onBrokenMarkdownLinks: 'throw'}},

  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en', 'zh-Hans'],
    localeConfigs: {
      vi: {label: 'Tiếng Việt', htmlLang: 'vi'},
      en: {label: 'English', htmlLang: 'en'},
      'zh-Hans': {label: '简体中文', htmlLang: 'zh-Hans'},
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/OdinHoang03/system-design-journey/tree/main/',
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {respectPrefersColorScheme: true},
      navbar: {
        title: 'System Design Journey',
        logo: {alt: 'System Design Journey', src: 'img/logo.svg'},
        items: [
          {type: 'docSidebar', sidebarId: 'lessons', position: 'left', label: 'Bài học'},
          {to: '/roadmap', label: 'Lộ trình', position: 'left'},
          {to: '/outline', label: 'Đại cương', position: 'left'},
          {to: '/resources', label: 'Tài nguyên', position: 'left'},
          {type: 'localeDropdown', position: 'right'},
          {href: 'https://github.com/OdinHoang03/system-design-journey', label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        copyright: `© ${new Date().getFullYear()} System Design Journey. Built with Docusaurus.`,
      },
      prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
    }),
};

export default config;
