import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {groups} from '../data/resources';
import useL from '../components/useL';

export default function Resources() {
  const l = useL();
  return (
    <Layout
      title={l({vi: 'Tài nguyên', en: 'Resources', zh: '资源'})}
      description={l({
        vi: 'Repo, sách và khoá học System Design: link, mô tả một dòng và giấy phép.',
        en: 'System design repos, books and courses: link, one-line summary and license.',
        zh: '系统设计的仓库、书籍与课程:链接、一句话介绍与许可证。',
      })}>
      <main className="container margin-vert--lg">
        <Heading as="h1">{l({vi: 'Tài nguyên', en: 'Resources', zh: '资源'})}</Heading>
        <p>
          {l({
            vi: 'Chúng tôi chỉ dẫn link và tóm tắt; không chép nguyên văn hay hình của các nguồn này. Cột giấy phép là giấy phép do chính nguồn công bố (kiểm tra ngày 02/11/2026) — hãy đọc lại trang gốc trước khi dùng lại nội dung.',
            en: 'We only link and summarise; we never copy these sources’ text or images. The license column is what each source declares itself (checked 2026-11-02) — re-read the original before reusing anything.',
            zh: '我们只提供链接和摘要,不复制这些来源的原文或图片。许可证一列为各来源自行声明的许可证(2026-11-02 核对)——复用内容前请再次查看原页面。',
          })}
        </p>
        {groups.map((g) => (
          <section key={g.key}>
            <Heading as="h2">{l(g.title)}</Heading>
            <table>
              <thead>
                <tr>
                  <th>{l({vi: 'Nguồn', en: 'Source', zh: '来源'})}</th>
                  <th>{l({vi: 'Mô tả', en: 'About', zh: '简介'})}</th>
                  <th>{l({vi: 'Giấy phép', en: 'License', zh: '许可证'})}</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((it) => (
                  <tr key={it.url}>
                    <td><a href={it.url} target="_blank" rel="noopener noreferrer">{it.name}</a></td>
                    <td>{l(it.desc)}</td>
                    <td>{it.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </main>
    </Layout>
  );
}
