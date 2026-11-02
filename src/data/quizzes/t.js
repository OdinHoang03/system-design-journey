// Trilingual text helper: t(vi, en, zh).
export const t = (vi, en, zh) => ({vi, en, zh});
// Question helper: answer is the index of the correct option.
export const q = (text, options, answer, explain) => ({q: text, options, answer, explain});
