import {useSyncExternalStore} from 'react';

// Reader progress lives only in this browser (localStorage); there is no account or server.
const KEY = 'sdj:progress:v1';
const EMPTY = {read: {}, quiz: {}};
const listeners = new Set();
let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY));
    cache = {read: raw?.read ?? {}, quiz: raw?.quiz ?? {}};
  } catch {
    cache = {read: {}, quiz: {}};
  }
  return cache;
}

function save(next) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota: keep the in-memory state for this page view.
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

/** Progress object; empty on the server and on first hydration render, then the saved state. */
export function useProgress() {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export function setRead(lessonId, value) {
  const p = load();
  const read = {...p.read};
  if (value) read[lessonId] = Date.now();
  else delete read[lessonId];
  save({...p, read});
}

/** answers: {questionIndex: chosenOptionIndex}; empty object clears the lesson's quiz. */
export function setQuizAnswers(lessonId, answers) {
  const p = load();
  const quiz = {...p.quiz};
  if (Object.keys(answers).length) quiz[lessonId] = answers;
  else delete quiz[lessonId];
  save({...p, quiz});
}
