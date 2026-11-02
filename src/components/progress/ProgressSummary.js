import React from 'react';
import Link from '@docusaurus/Link';
import {lessons} from '../../data/lessons';
import {quizzes} from '../../data/quizzes';
import useL from '../useL';
import {useProgress} from './store';
import styles from './progress.module.css';

/** Per-lesson read / quiz status, shown on the roadmap page. */
export default function ProgressSummary() {
  const l = useL();
  const {read, quiz} = useProgress();
  const readCount = lessons.filter((x) => read[x.id]).length;
  return (
    <section className={styles.summaryBox} aria-label={l({vi: 'Tiến trình của bạn', en: 'Your progress', zh: '你的进度'})}>
      <p>
        <strong>
          {l({vi: 'Tiến trình của bạn', en: 'Your progress', zh: '你的进度'})}: {readCount}/{lessons.length}{' '}
          {l({vi: 'bài đã đọc', en: 'lessons read', zh: '课已读'})}
        </strong>
      </p>
      <progress max={lessons.length} value={readCount} className={styles.bar} />
      <ul className={styles.lessonList}>
        {lessons.map((x) => {
          const qs = quizzes[x.id] ?? [];
          const a = quiz[x.id] ?? {};
          const right = qs.filter((q, i) => a[i] === q.answer).length;
          const answered = Object.keys(a).length;
          return (
            <li key={x.id}>
              <span aria-hidden="true">{read[x.id] ? '✓' : '○'}</span>{' '}
              <Link to={`/docs/${x.id}`}>{l(x.title)}</Link>
              <span className={styles.hint}>
                {' · '}
                {read[x.id] ? l({vi: 'đã đọc', en: 'read', zh: '已读'}) : l({vi: 'chưa đọc', en: 'unread', zh: '未读'})}
                {' · '}
                {answered === qs.length && qs.length
                  ? `${l({vi: 'trắc nghiệm', en: 'quiz', zh: '测验'})} ${right}/${qs.length}`
                  : `${l({vi: 'trắc nghiệm', en: 'quiz', zh: '测验'})} ${answered}/${qs.length}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
