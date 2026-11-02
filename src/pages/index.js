import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {lessons} from '../data/lessons';
import useL from '../components/useL';
import styles from './index.module.css';

export default function Home() {
  const l = useL();
  return (
    <Layout
      title={l({vi: 'Lộ trình System Design', en: 'System Design Journey', zh: '系统设计之旅'})}
      description={l({
        vi: 'Blog học System Design qua hành trình một dev đưa app nhỏ thành hệ thống triệu người dùng.',
        en: 'Learn system design through one developer’s journey from a tiny app to a million-user system.',
        zh: '跟随一位开发者把小应用做成百万用户系统的旅程,学习系统设计。',
      })}>
      <header className={styles.hero}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            {l({vi: 'System Design Journey', en: 'System Design Journey', zh: '系统设计之旅'})}
          </Heading>
          <p className={styles.tagline}>
            {l({
              vi: 'Một dev, một app nhỏ, và hành trình đưa nó lên hàng triệu người dùng — từng khái niệm một.',
              en: 'One developer, one tiny app, and the road to a million users — one concept at a time.',
              zh: '一位开发者、一个小应用,以及通往百万用户的路——一次学一个概念。',
            })}
          </p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/roadmap">
              {l({vi: 'Xem lộ trình', en: 'See the roadmap', zh: '查看路线图'})}
            </Link>
            <Link className="button button--secondary button--lg" to="/resources">
              {l({vi: 'Tài nguyên', en: 'Resources', zh: '资源'})}
            </Link>
          </div>
        </div>
      </header>
      <main className="container margin-vert--lg">
        <Heading as="h2">{l({vi: 'Đợt 1: 7 bài', en: 'Batch 1: 7 lessons', zh: '第一批:7 课'})}</Heading>
        <div className={styles.grid}>
          {lessons.map((x, i) => (
            <Link key={x.id} to={`/docs/${x.id}`} className={styles.card}>
              <span className={styles.n}>{i + 1}</span>
              <strong>{l(x.title)}</strong>
              <span>{l(x.story)}</span>
            </Link>
          ))}
        </div>
      </main>
    </Layout>
  );
}
