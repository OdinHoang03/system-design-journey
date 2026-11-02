import React from 'react';
import useL from '../useL';
import {quizzes} from '../../data/quizzes';
import {setQuizAnswers, setRead, useProgress} from './store';
import styles from './progress.module.css';

/** Renders `code` spans inside plain quiz text. */
const rich = (text) => text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));

/** Multiple-choice quiz for one lesson; answers persist in localStorage. */
export default function Quiz({lessonId}) {
  const l = useL();
  const questions = quizzes[lessonId] ?? [];
  const {quiz} = useProgress();
  const answers = quiz[lessonId] ?? {};
  const answered = Object.keys(answers).length;
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  const finished = answered === questions.length && questions.length > 0;

  const choose = (i, o) => {
    if (answers[i] !== undefined) return;
    const next = {...answers, [i]: o};
    setQuizAnswers(lessonId, next);
    if (Object.keys(next).length === questions.length) setRead(lessonId, true);
  };

  return (
    <div className={styles.quiz}>
      {questions.map((q, i) => {
        const chosen = answers[i];
        const isDone = chosen !== undefined;
        return (
          <fieldset key={i} className={styles.question}>
            <legend>
              <strong>
                {i + 1}. {rich(l(q.q))}
              </strong>
            </legend>
            <ul className={styles.options}>
              {q.options.map((opt, o) => {
                let cls = styles.option;
                if (isDone && o === q.answer) cls += ` ${styles.right}`;
                else if (isDone && o === chosen) cls += ` ${styles.wrong}`;
                return (
                  <li key={o}>
                    <button type="button" className={cls} disabled={isDone} aria-pressed={chosen === o} onClick={() => choose(i, o)}>
                      <span className={styles.letter}>{String.fromCharCode(65 + o)}</span>
                      <span>{rich(l(opt))}</span>
                      {isDone && o === q.answer && <span className={styles.badge}> ✓</span>}
                      {isDone && o === chosen && o !== q.answer && <span className={styles.badge}> ✗</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            {isDone && (
              <p className={styles.explain} role="status">
                <strong>
                  {chosen === q.answer
                    ? l({vi: 'Chính xác. ', en: 'Correct. ', zh: '正确。'})
                    : l({vi: 'Chưa đúng. ', en: 'Not quite. ', zh: '不对。'})}
                </strong>
                {rich(l(q.explain))}
              </p>
            )}
          </fieldset>
        );
      })}
      <div className={styles.summary}>
        <span>
          {l({vi: 'Đã trả lời', en: 'Answered', zh: '已作答'})} {answered}/{questions.length}
          {finished && ` · ${l({vi: 'Điểm', en: 'Score', zh: '得分'})} ${correct}/${questions.length}`}
        </span>
        {answered > 0 && (
          <button type="button" className="button button--sm button--secondary" onClick={() => setQuizAnswers(lessonId, {})}>
            {l({vi: 'Làm lại', en: 'Retry', zh: '重做'})}
          </button>
        )}
      </div>
    </div>
  );
}
