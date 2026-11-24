/* Word-level timing helpers: every visual event is anchored to a spoken word, never to a whole sentence. */
import T from '../data/vertrauen-timings.json';

export type Word = {w: string; s: number; e: number; score: number};
export type Line = {text: string; start: number; end: number; words: Word[]};
export const TIM = T as unknown as {duration: number; scenes: {key: string; idiom: string | null; start: number; end: number; lines: string[]}[]; lines: Record<string, Line>};

export const line = (id: string) => TIM.lines[id];
/* start time (s) of the n-th word of a line */
export const at = (id: string, n = 0) => TIM.lines[id].words[Math.min(n, TIM.lines[id].words.length - 1)].s;
export const scene = (key: string) => TIM.scenes.find((s) => s.key === key)!;

/* deterministic random (Remotion renders frames in parallel: never use Math.random) */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (v: number) => {
  const x = clamp(v);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/* 0→1 over `dur` seconds starting at `t0` */
export const prog = (t: number, t0: number, dur: number) => ease((t - t0) / dur);
