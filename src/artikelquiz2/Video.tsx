import React from 'react';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Card, clamp, FollowCTA, GENUS, makeTiming, NB, Pop, prog, rand, SAFE, SANS, SERIF, Spoken, Timings} from '../lib/kit';
import timingsJson from '../data/artikelquiz2-timings.json';

const T = makeTiming(timingsJson as unknown as Timings);
export const FRAMES = T.frames();
const GOLD = '#ffd04a';
type Art = 'der' | 'die' | 'das';
const WORDS: {key: string; guess: string; reveal: string; art: Art; noun: string; emoji: string; meaning: string}[] = [
  {key: 'schatz', guess: 's02', reveal: 's03', art: 'der', noun: 'Schatz', emoji: '💎', meaning: 'liebevolle Anrede für den Partner'},
  {key: 'brille', guess: 's04', reveal: 's05', art: 'die', noun: 'Brille', emoji: '👓', meaning: 'Sehhilfe, hier: Sicht auf die Dinge'},
  {key: 'fell', guess: 's06', reveal: 's07', art: 'das', noun: 'Fell', emoji: '🐑', meaning: 'Haarkleid von Tieren'},
  {key: 'frieden', guess: 's08', reveal: 's09', art: 'der', noun: 'Frieden', emoji: '🕊️', meaning: 'Zustand ohne Streit'},
  {key: 'traene', guess: 's10', reveal: 's11', art: 'die', noun: 'Träne', emoji: '💧', meaning: 'Wassertropfen im Auge beim Weinen'},
  {key: 'heimweh', guess: 's12', reveal: 's13', art: 'das', noun: 'Heimweh', emoji: '🏠', meaning: 'Sehnsucht nach dem Zuhause'},
];
const ARTS: Art[] = ['der', 'die', 'das'];
const lastW = (id: string) => T.line(id).words.length - 1;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const Background: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: 'linear-gradient(170deg,#12163a 0%,#0b0e24 60%,#160e2c 100%)'}}>
    {Array.from({length: 16}).map((_, i) => {
      const x = rand(i + 1) * 1080, y = (rand(i + 50) * 1920 + t * (14 + rand(i + 9) * 22)) % 1920, r = 6 + rand(i + 20) * 16;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%', background: '#fff', opacity: 0.07 + rand(i + 3) * 0.08}} />;
    })}
  </AbsoluteFill>
);

const Tiles: React.FC<{t: number; start: number; reveal: number | null; art: Art | null}> = ({t, start, reveal, art}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, top: 1000, display: 'flex', gap: 28, perspective: 1200}}>
      {ARTS.map((a, i) => {
        const s = spring({frame: f - Math.round((start + i * 0.08) * fps), fps, config: {damping: 12, stiffness: 120}});
        const rv = reveal === null ? 0 : prog(t, reveal, 0.5);
        const win = art === a, dir = i === 0 ? -1 : i === 1 ? 0.4 : 1;
        const wob = reveal === null ? Math.sin(t * 3 + i * 2) * 5 : 0;
        const tr = win
          ? `translateX(${(1 - i) * 329 * rv}px) translateY(${-30 * rv}px) scale(${1 + 0.1 * rv}) rotateX(${wob}deg)`
          : `translateY(${(1 - s) * 500 + rv * rv * 900}px) rotate(${dir * rv * 40}deg) rotateX(${wob}deg)`;
        const lit = win && rv > 0;
        return (
          <div key={a} style={{flex: 1, height: 230, borderRadius: 36, transform: tr, opacity: s * (win ? 1 : 1 - rv * 0.9),
            background: lit ? GENUS[a] : 'rgba(255,255,255,.08)', border: `5px solid ${lit ? '#fff' : 'rgba(255,255,255,.35)'}`,
            boxShadow: lit ? `0 0 ${80 * rv}px ${GENUS[a]}` : '0 14px 0 rgba(0,0,0,.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: SANS, fontWeight: 900, fontSize: 104, color: lit ? '#0b1020' : '#fff'}}>
            {a}
            {win && rv > 0.5 ? <svg width={64} height={64} viewBox="0 0 30 30"><path d="M5 16l7 7 13-15" stroke="#0b1020" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
          </div>
        );
      })}
    </div>
  );
};

const Ring: React.FC<{p: number}> = ({p}) => {
  const R = 190, C = 2 * Math.PI * R;
  return (
    <svg width={460} height={460} viewBox="-230 -230 460 460" style={{position: 'absolute', left: 310, top: 300}}>
      <circle r={R} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={18} />
      <circle r={R} fill="none" stroke={GOLD} strokeWidth={18} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * p} transform="rotate(-90)" />
    </svg>
  );
};

const Burst: React.FC<{t: number; t0: number; color: string}> = ({t, t0, color}) => {
  const p = (t - t0) / 0.9;
  if (p < 0 || p > 1) return null;
  return (
    <>
      {Array.from({length: 16}).map((_, i) => {
        const a = (i / 16) * Math.PI * 2 + rand(i), d = 150 + rand(i + 7) * 260 * prog(t, t0, 0.9);
        return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * d - 11, top: 530 + Math.sin(a) * d - 11, width: 22, height: 22, borderRadius: '50%', background: i % 3 === 0 ? GOLD : color, opacity: 1 - p}} />;
      })}
    </>
  );
};

const Dots: React.FC<{n: number}> = ({n}) => (
  <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
    {WORDS.map((_, i) => <div key={i} style={{width: i === n ? 34 : 20, height: 20, borderRadius: 10, background: i < n ? GOLD : i === n ? '#fff' : 'rgba(255,255,255,.25)'}} />)}
  </div>
);

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  const idx = WORDS.reduce((acc, w, i) => (t >= T.scene(w.key).start - 0.02 ? i : acc), -1);
  const inOutro = t >= T.scene('outro').start - 0.02;
  const hook = T.line('s01');
  const w = idx >= 0 && !inOutro ? WORDS[idx] : null;

  let body: React.ReactNode = null;
  if (inOutro) {
    const o = T.line('s14');
    body = (
      <>
        <div style={{position: 'absolute', top: 330, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}><Spoken line={o} size={104} font={SERIF} weight={800} /></div>
        <div style={{position: 'absolute', top: 700, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 26}}>
          {WORDS.map((x, i) => (
            <Pop key={i} show={T.at('s14', 0) + i * 0.12}>
              <div style={{width: 300, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 60, color: GENUS[x.art]}}>{x.art}<div style={{fontSize: 40, color: '#fff', fontWeight: 700}}>{x.noun}</div></div>
            </Pop>
          ))}
        </div>
        <div style={{position: 'absolute', top: 1130, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}><FollowCTA show={T.at('s15', 0) - 0.05} accent={GOLD} /></div>
      </>
    );
  } else if (!w) {
    body = (
      <>
        <div style={{position: 'absolute', top: 290, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}><Spoken line={hook} size={118} font={SERIF} weight={800} /></div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontSize: 240, transform: `scale(${0.95 + 0.08 * Math.sin(t * 5)})`}}>❓</div>
        <Tiles t={t} start={T.at('s01', 2) - 0.1} reveal={null} art={null} />
      </>
    );
  } else {
    const gs = T.at(w.guess, lastW(w.guess)) - 0.05;
    const sceneStart = T.scene(w.key).start;
    const rt = T.at(w.reveal, 0) - 0.05;
    const revealed = t >= rt;
    const ringP = clamp((t - gs) / (rt - gs));
    const ap = prog(t, rt, 0.35);
    const meaningFrom = T.at(w.reveal, 2) - 0.1;
    const bob = Math.sin(t * 4) * 10;
    body = (
      <>
        <div style={{position: 'absolute', top: 262, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 5, color: GOLD}}>WORT{NB}{idx + 1}/6</div>
          <Dots n={idx} />
        </div>
        {t >= gs && !revealed ? <Ring p={ringP} /> : null}
        {revealed ? <Burst t={t} t0={rt} color={GENUS[w.art]} /> : null}
        {t >= gs ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 400, textAlign: 'center', fontSize: 200, lineHeight: '260px'}}>
            <Pop show={gs}>
              <span style={{display: 'inline-block', transform: `translateY(${bob}px) scale(${1 + 0.15 * (revealed ? Math.sin(Math.min(1, (t - rt) / 0.5) * Math.PI) : 0)})`}}>{w.emoji}</span>
            </Pop>
          </div>
        ) : (
          <div style={{position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontSize: 170, fontFamily: SANS, fontWeight: 900, color: 'rgba(255,255,255,.3)'}}>{'·'}{NB}{'·'}{NB}{'·'}</div>
        )}
        {t >= gs ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 740, textAlign: 'center', fontFamily: SERIF, fontWeight: 800, fontSize: 132, color: '#fff', whiteSpace: 'nowrap'}}>
            <span style={{display: 'inline-block', color: revealed ? GENUS[w.art] : 'rgba(255,255,255,.35)', transform: `scale(${revealed ? 0.7 + 0.3 * ap : 1})`, textShadow: revealed ? `0 0 40px ${GENUS[w.art]}88` : 'none'}}>
              {revealed ? cap(w.art) : '?'}
            </span>{' '}
            <Pop show={gs}>{w.noun}</Pop>
          </div>
        ) : null}
        <Tiles t={t} start={sceneStart} reveal={revealed ? rt : null} art={w.art} />
        <Card from={meaningFrom} to={T.scene(w.key).end} label={`${cap(w.art)} ${w.noun}`} accent={GENUS[w.art]}>
          <div style={{fontFamily: SANS, fontSize: 48, fontWeight: 700, color: '#fff', lineHeight: 1.2}}>{w.meaning}</div>
        </Card>
      </>
    );
  }

  return (
    <AbsoluteFill>
      <Background t={t} />
      <Audio src={staticFile('artikelquiz2/mix.wav')} />
      {body}
    </AbsoluteFill>
  );
};
