import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import RoadmapDiagram from '../components/RoadmapDiagram';
import ProgressSummary from '../components/progress/ProgressSummary';
import useL from '../components/useL';

export default function Roadmap() {
  const l = useL();
  return (
    <Layout
      title={l({vi: 'Lộ trình', en: 'Roadmap', zh: '路线图'})}
      description={l({
        vi: 'Sơ đồ tổng các bài System Design theo hành trình từ 1 đến hàng triệu người dùng.',
        en: 'The map of all System Design lessons, from 1 user to millions.',
        zh: '从 1 个用户到百万用户的系统设计课程总览。',
      })}>
      <main className="container margin-vert--lg">
        <Heading as="h1">{l({vi: 'Lộ trình', en: 'Roadmap', zh: '路线图'})}</Heading>
        <p>
          {l({
            vi: 'Mỗi bài là một chặng: app lớn dần, và mỗi lần lớn lên lại gặp một nút thắt mới. Bấm vào chặng để đọc bài.',
            en: 'Each lesson is a leg of the trip: the app grows, and each growth spurt exposes a new bottleneck. Click a step to read it.',
            zh: '每一课是旅程的一站:应用不断变大,每次变大都会遇到新的瓶颈。点击任一站即可阅读。',
          })}
        </p>
        <ProgressSummary />
        <RoadmapDiagram />
        <p style={{textAlign: 'center', marginTop: '1.5rem'}}>
          <em>
            {l({
              vi: 'Sơ đồ tự vẽ cho dự án này.',
              en: 'Diagram drawn from scratch for this project.',
              zh: '本图为本项目原创绘制。',
            })}
          </em>
        </p>
      </main>
    </Layout>
  );
}
