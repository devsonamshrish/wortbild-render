/* Shared Wortbild kit: word-level timing, text that appears exactly when spoken, cards, and the follow CTA.
   Every video builds its own look on top of this; nothing here dictates style beyond safe margins and fonts. */
import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const NB = ' '; // protected space: inline-block words otherwise glue together ("Ratemit")
export const SERIF = 'Georgia, "Palatino Linotype", serif';
export const SANS = '"Segoe UI", system-ui, sans-serif';
export const SAFE = {top: 250, bottom: 400, side: 60}; // app UI covers the top ~250 px and bottom ~400 px
export const GENUS = {der: '#5aa9ff', die: '#ff6b8b', das: '#46d49a'} as const; // genus colours only for articles, always with the article text too

export type Word = {w: string; s: number; e: number; score: number};
export type Line = {text: string; start: number; end: number; words: Word[]};
export type Timings = {duration: number; scenes: {key: string; word?: string | null; start: number; end: number; lines: string[]}[]; lines: Record<string, Line>};

/* timing helpers bound to one video's timings.json */
export const makeTiming = (T: Timings) => ({
  TIM: T,
  line: (id: string) => T.lines[id],
  /* start (s) of the n-th spoken word of a line */
  at: (id: string, n = 0) => T.lines[id].words[Math.min(n, T.lines[id].words.length - 1)].s,
  scene: (key: string) => T.scenes.find((s) => s.key === key)!,
  frames: (fps = 30) => Math.ceil((T.duration + 0.6) * fps),
});

/* deterministic randomness: Remotion renders frames in parallel, never use Math.random */
export const rand = (seed: number) => { const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (v: number) => { const x = clamp(v); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const prog = (t: number, t0: number, dur: number) => ease((t - t0) / dur);

/* springs in at absolute second `show` */
export const Pop: React.FC<{show: number; children: React.ReactNode; style?: React.CSSProperties}> = ({show, children, style}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const s = spring({frame: f - Math.round(show * fps), fps, config: {damping: 11, stiffness: 140, mass: 0.7}});
  return <span style={{display: 'inline-block', transform: `translateY(${(1 - s) * 40}px) scale(${0.6 + 0.4 * s})`, opacity: clamp(s * 1.4), ...style}}>{children}</span>;
};

/* a sentence whose words appear exactly when spoken; skip = leading words not to show */
export const Spoken: React.FC<{line: Line; skip?: number; size: number; color?: string; weight?: number; font?: string}> = ({line, skip = 0, size, color = '#fff', weight = 700, font = SANS}) => {
  const words = line.text.replace(/[.!?]$/, '').split(' ').slice(skip);
  return (
    <div style={{fontSize: size, lineHeight: 1.2, color, fontWeight: weight, fontFamily: font}}>
      {words.map((w, i) => (
        <React.Fragment key={i}><Pop show={line.words[Math.min(i + skip, line.words.length - 1)].s - 0.05}>{w}</Pop>{i < words.length - 1 ? ' ' : ''}</React.Fragment>
      ))}
    </div>
  );
};

/* bottom card, visible from `from` to `to` (absolute seconds), stays above the bottom safe area */
export const Card: React.FC<{from: number; to: number; label: string; accent: string; children: React.ReactNode; bg?: string}> = ({from, to, label, accent, children, bg = 'rgba(10,12,22,.88)'}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  if (t < from - 0.2 || t > to) return null;
  const s = spring({frame: f - Math.round(from * fps), fps, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 10, transform: `translateY(${(1 - s) * 120}px)`, opacity: s * clamp((to - t) / 0.25),
      background: bg, borderRadius: 34, padding: '32px 40px', borderLeft: `10px solid ${accent}`}}>
      <div style={{fontFamily: SANS, fontSize: 32, letterSpacing: 4, textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: 10}}>{label}</div>
      {children}
    </div>
  );
};

/* the closing call to action: follow (not "save" any more, user rule from 2026-11-23) */
export const FollowCTA: React.FC<{show: number; accent?: string}> = ({show, accent = '#e0475b'}) => (
  <Pop show={show}>
    <div style={{display: 'flex', alignItems: 'center', gap: 26, background: '#fff', color: '#14121c', borderRadius: 30, padding: '30px 40px', fontFamily: SANS, fontSize: 50, fontWeight: 800}}>
      <svg width={60} height={60} viewBox="0 0 30 30"><circle cx={15} cy={15} r={15} fill={accent} /><path d="M15 8v14M8 15h14" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" /></svg>
      Folge{NB}für{NB}mehr{NB}Wortbilder
    </div>
  </Pop>
);
