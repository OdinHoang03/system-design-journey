import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {lessons} from '../data/lessons';
import useL from './useL';
import styles from './RoadmapDiagram.module.css';

const H = 78;
const GAP = 34;
const W = 720;

/** Hand-drawn (inline SVG) journey map: one box per lesson, arrows between them. */
export default function RoadmapDiagram() {
  const l = useL();
  const total = lessons.length * H + (lessons.length - 1) * GAP + 20;
  const usersLabel = l({vi: 'người dùng', en: 'users', zh: '用户'});
  const base = useBaseUrl('/docs/');
  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${W} ${total}`}
      role="img"
      aria-label={l({
        vi: 'Sơ đồ lộ trình 7 bài từ 1 đến hàng triệu người dùng',
        en: 'Roadmap of 7 lessons from 1 user to millions',
        zh: '从 1 个用户到百万用户的 7 课路线图',
      })}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className={styles.arrowHead} />
        </marker>
      </defs>
      {lessons.map((x, i) => {
        const y = 10 + i * (H + GAP);
        return (
          <g key={x.id}>
            {i > 0 && (
              <line x1={W / 2} y1={y - GAP + 2} x2={W / 2} y2={y - 2} className={styles.arrow} markerEnd="url(#arrow)" />
            )}
            <a href={`${base}${x.id}`}>
              <rect x="20" y={y} width={W - 40} height={H} rx="12" className={styles.box} />
              <circle cx="62" cy={y + H / 2} r="20" className={styles.badge} />
              <text x="62" y={y + H / 2 + 6} textAnchor="middle" className={styles.num}>{i + 1}</text>
              <text x="100" y={y + 33} className={styles.title}>{l(x.title)}</text>
              <text x="100" y={y + 58} className={styles.story}>{l(x.story)}</text>
              <text x={W - 36} y={y + 33} textAnchor="end" className={styles.users}>{x.users}</text>
              <text x={W - 36} y={y + 58} textAnchor="end" className={styles.usersLabel}>{usersLabel}</text>
            </a>
          </g>
        );
      })}
    </svg>
  );
}
