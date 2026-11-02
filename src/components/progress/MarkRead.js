import React from 'react';
import useL from '../useL';
import {setRead, useProgress} from './store';
import styles from './progress.module.css';

/** "Mark as read" toggle at the end of a lesson. */
export default function MarkRead({lessonId}) {
  const l = useL();
  const {read} = useProgress();
  const done = Boolean(read[lessonId]);
  return (
    <div className={styles.markRead}>
      <button
        type="button"
        className={`button ${done ? 'button--secondary' : 'button--primary'}`}
        aria-pressed={done}
        onClick={() => setRead(lessonId, !done)}>
        {done
          ? l({vi: '✓ Đã đọc (bấm để bỏ đánh dấu)', en: '✓ Read (click to undo)', zh: '✓ 已读(点击取消)'})
          : l({vi: 'Đánh dấu đã đọc', en: 'Mark as read', zh: '标记为已读'})}
      </button>
      <span className={styles.hint}>
        {l({
          vi: 'Tiến trình lưu trong trình duyệt này.',
          en: 'Progress is saved in this browser.',
          zh: '进度保存在此浏览器中。',
        })}
      </span>
    </div>
  );
}
