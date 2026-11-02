import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {parts, allLessons} from '../data/outline';
import useL from '../components/useL';

export default function Outline() {
  const l = useL();
  const written = allLessons.filter((x) => x.done).length;
  const title = l({vi: 'Đại cương', en: 'Outline', zh: '大纲'});
  return (
    <Layout
      title={title}
      description={l({
        vi: 'Đại cương toàn bộ các bài System Design, chia theo 6 cụm.',
        en: 'The full System Design curriculum outline, grouped into 6 parts.',
        zh: '系统设计全部课程大纲,分为 6 个部分。',
      })}>
      <main className="container margin-vert--lg">
        <Heading as="h1">{title}</Heading>
        <p>
          {l({
            vi: `${allLessons.length} bài trong ${parts.length} cụm; đã viết ${written}. Bài 1–7 là đợt 1 (xem Lộ trình); các bài còn lại là kế hoạch và có thể đổi thứ tự hoặc nội dung.`,
            en: `${allLessons.length} lessons in ${parts.length} parts; ${written} written. Lessons 1–7 are batch 1 (see the Roadmap); the rest is a plan and may be reordered or reshaped.`,
            zh: `共 ${allLessons.length} 课、${parts.length} 个部分,已写 ${written} 课。第 1–7 课为第一批(见路线图);其余为计划,顺序与内容可能调整。`,
          })}
        </p>
        {parts.map((p, i) => (
          <section key={p.key}>
            <Heading as="h2">
              {i + 1}. {l(p.title)}
            </Heading>
            <ul>
              {p.lessons.map((x) => (
                <li key={x.id}>
                  {x.done ? <Link to={`/docs/${x.id}`}>{l(x.title)}</Link> : l(x.title)}
                  {' '}<small>
                    ({l({vi: 'Bài', en: 'Lesson', zh: '第'})} {x.n}
                    {l({vi: '', en: '', zh: ' 课'})}
                    {x.done ? '' : `; ${l({vi: 'kế hoạch', en: 'planned', zh: '计划中'})}`})
                  </small>
                  {x.sum ? <> — {l(x.sum)}</> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </Layout>
  );
}
