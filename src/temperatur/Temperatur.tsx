/* "Liebe hat eine Temperatur" – three Beziehung idioms taken literally, from warm to hot to ice cold.
   Leitmetapher: a thermometer on the right edge that rises and falls with the relationship. */
import React from 'react';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {TIM, line, at, scene, clamp, prog} from './timing';
import {ButterflyScene, FireScene, IceScene} from './Scenes3D';

const NB = ' ';
const SERIF = 'Georgia, "Palatino Linotype", serif';
const SANS = '"Segoe UI", system-ui, sans-serif';
const SAFE = {top: 250, bottom: 400, side: 60};

/* relationship temperature over time, 0 = ice, 1 = fire */
const tempAt = (t: number) => {
  const pts: [number, number][] = [
    [0, 0.42], [at('s01', 3), 0.42], [at('s01', 3) + 0.8, 0.55],
    [scene('schmetterlinge').start, 0.55], [at('s04', 3) + 1, 0.74],
    [scene('feuer').start, 0.78], [at('s07', 5), 1.0],
    [scene('eiszeit').start + 0.2, 0.95], [at('s10', 2) + 1.2, 0.04],
    [scene('outro').start, 0.04], [scene('outro').start + 1.2, 0.5], [99, 0.5]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, va] = pts[i], [b, vb] = pts[i + 1];
    if (t <= b) return va + (vb - va) * prog(t, a, Math.max(0.01, b - a));
  }
  return 0.5;
};
/* temperature → colour (ice blue → rose → ember) */
const tempColor = (v: number, l = 62) => `hsl(${interpolate(v, [0, 0.5, 0.75, 1], [205, 330, 350, 382]) % 360}, ${interpolate(v, [0, 0.5, 1], [70, 75, 95])}%, ${l}%)`;

const Pop: React.FC<{show: number; children: React.ReactNode; style?: React.CSSProperties}> = ({show, children, style}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const s = spring({frame: f - Math.round(show * fps), fps, config: {damping: 11, stiffness: 140, mass: 0.7}});
  return <span style={{display: 'inline-block', transform: `translateY(${(1 - s) * 40}px) scale(${0.6 + 0.4 * s})`, opacity: clamp(s * 1.4), ...style}}>{children}</span>;
};

/* a sentence whose words appear exactly when they are spoken */
const Spoken: React.FC<{id: string; skip?: number; size: number; color?: string; weight?: number; font?: string}> = ({id, skip = 0, size, color = '#fff', weight = 600, font = SANS}) => {
  const L = line(id);
  const words = L.text.replace(/[.!]$/, '').split(' ').slice(skip);
  return (
    <div style={{fontSize: size, lineHeight: 1.18, color, fontWeight: weight, fontFamily: font}}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <Pop show={L.words[Math.min(i + skip, L.words.length - 1)].s - 0.05}>{w}</Pop>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </div>
  );
};

const Card: React.FC<{show: number; label: string; accent: string; children: React.ReactNode}> = ({show, label, accent, children}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const s = spring({frame: f - Math.round((show - 0.15) * fps), fps, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side + 120, bottom: SAFE.bottom + 10, transform: `translateY(${(1 - s) * 120}px)`, opacity: s,
      background: 'rgba(12,10,20,.86)', borderRadius: 34, padding: '34px 40px', borderLeft: `10px solid ${accent}`}}>
      <div style={{fontFamily: SANS, fontSize: 34, letterSpacing: 4, textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: 12}}>{label}</div>
      {children}
    </div>
  );
};

const Thermometer: React.FC<{v: number}> = ({v}) => {
  const x = 1080 - SAFE.side - 58, top = 330, h = 1000, fill = v * h;
  const marks: [number, string][] = [[1, 'heiß'], [0.62, 'warm'], [0.05, 'kalt']];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <rect x={x} y={top - 10} width={46} height={h + 40} rx={23} fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.55)" strokeWidth={3} />
      <rect x={x + 11} y={top + h - fill} width={24} height={fill + 40} rx={12} fill={tempColor(v, 60)} />
      <circle cx={x + 23} cy={top + h + 62} r={44} fill={tempColor(v, 60)} stroke="rgba(255,255,255,.55)" strokeWidth={3} />
      {marks.map(([m, label]) => (
        <g key={label}>
          <line x1={x - 14} x2={x - 2} y1={top + h - m * h} y2={top + h - m * h} stroke="rgba(255,255,255,.7)" strokeWidth={3} />
          <text x={x - 22} y={top + h - m * h + 10} textAnchor="end" fill="rgba(255,255,255,.85)" fontFamily={SANS} fontSize={30} fontWeight={600}>{label}</text>
        </g>
      ))}
    </svg>
  );
};

const IdiomScene: React.FC<{k: 'schmetterlinge' | 'feuer' | 'eiszeit'; ids: [string, string, string]; accent: string}> = ({k, ids, accent}) => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig();
  const sc = scene(k), t = f / fps; // absolute time
  const local = t - sc.start;
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.6, 8.2], fov: 42}} gl={{antialias: true}}>
        <group position={[0, -Math.sin(local * 0.3) * 0.15, local * 0.08]}>
        {k === 'schmetterlinge' && <ButterflyScene t={local} release={at('s04', 3) - sc.start} />}
        {k === 'feuer' && <FireScene t={local} pour={at('s06', 2) - sc.start - 0.3} flare={at('s07', 5) - sc.start} />}
        {k === 'eiszeit' && <IceScene t={local} freeze={at('s10', 2) - sc.start} />}
        </group>
      </ThreeCanvas>
      <div style={{position: 'absolute', top: SAFE.top + 20, left: SAFE.side, right: SAFE.side + 120}}>
        <Pop show={sc.start + 0.05}>
          <div style={{fontFamily: SANS, fontSize: 32, letterSpacing: 5, textTransform: 'uppercase', color: accent, fontWeight: 700}}>wörtlich{NB}genommen</div>
        </Pop>
        <div style={{marginTop: 14, textShadow: '0 4px 30px rgba(0,0,0,.6)'}}>
          <Spoken id={ids[0]} size={96} font={SERIF} weight={700} />
        </div>
      </div>
      {t > at(ids[1], 1) - 0.45 && t < at(ids[2], 0) - 0.15 && (
        <Card show={at(ids[1], 1) - 0.3} label="Wörtlich" accent={accent}>
          <Spoken id={ids[1]} skip={1} size={56} />
        </Card>
      )}
      {t >= at(ids[2], 2) - 0.45 && (
        <Card show={at(ids[2], 2) - 0.3} label="Gemeint" accent="#ffffff">
          <Spoken id={ids[2]} skip={2} size={58} weight={700} />
        </Card>
      )}
    </AbsoluteFill>
  );
};

/* the whole video; each scene fades in and out around its spoken window */
export const Temperatur: React.FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const t = f / fps, v = tempAt(t);
  const win = (key: string) => {
    const s = scene(key);
    return {from: Math.round((s.start - 0.35) * fps), dur: Math.round((s.end - s.start + 0.7) * fps), s};
  };
  const fade = (key: string) => {
    const {s} = win(key);
    return clamp(Math.min((t - s.start + 0.35) / 0.4, (s.end + 0.35 - t) / 0.4));
  };
  const hook = scene('hook'), outro = scene('outro');
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 62%, ${tempColor(v, 30)} 0%, ${tempColor(v, 9)} 70%, #06070c 100%)`}}>
      <Audio src={staticFile('temperatur/mix.wav')} />

      {/* hook: a beating heart that takes the temperature */}
      {t < hook.end + 0.4 && (
        <AbsoluteFill style={{opacity: clamp((hook.end + 0.35 - t) / 0.4), alignItems: 'center'}}>
          <svg viewBox="-60 -55 120 110" width={560} height={520} style={{position: 'absolute', top: 760, transform: `scale(${1 + Math.max(0, Math.sin(t * 7.5)) * 0.06 * (t > at('s01', 3) ? 1.6 : 1)})`}}>
            <path d="M0 45 C -70 0 -45 -55 0 -22 C 45 -55 70 0 0 45 Z" fill={tempColor(v, 58)} />
          </svg>
          <div style={{position: 'absolute', top: SAFE.top + 60, left: SAFE.side, right: SAFE.side + 120, textAlign: 'left'}}>
            <Spoken id="s01" size={110} font={SERIF} weight={700} />
            <div style={{marginTop: 40}}>
              <Spoken id="s02" size={58} color="rgba(255,255,255,.88)" />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {(['schmetterlinge', 'feuer', 'eiszeit'] as const).map((k, i) => {
        const w = win(k);
        const ids: [string, string, string][] = [['s03', 's04', 's05'], ['s06', 's07', 's08'], ['s09', 's10', 's11']];
        const accent = ['#ffb3c7', '#ffb347', '#9fd8ff'][i];
        return (
          f >= w.from && f < w.from + w.dur ? (
            <AbsoluteFill key={k} style={{opacity: fade(k)}}>
              <IdiomScene k={k} ids={ids[i]} accent={accent} />
            </AbsoluteFill>
          ) : null
        );
      })}

      {/* outro: the three temperatures at a glance, then the save call */}
      {t > outro.start - 0.35 && (
        <AbsoluteFill style={{opacity: clamp((t - outro.start + 0.35) / 0.4), padding: `${SAFE.top + 40}px ${SAFE.side + 150}px 0 ${SAFE.side}px`}}>
          {[['Schmetterlinge im Bauch haben', 0.74], ['Öl ins Feuer gießen', 1], ['Eiszeit herrscht', 0.04]].map(([txt, tv], i) => (
            <Pop key={i} show={outro.start + i * 0.25}>
              <div style={{display: 'flex', alignItems: 'center', gap: 26, marginBottom: 34, fontFamily: SERIF, fontSize: 58, color: '#fff', fontWeight: 700}}>
                <span style={{width: 34, height: 34, borderRadius: 17, background: tempColor(tv as number, 60), flex: 'none'}} />
                {txt as string}
              </div>
            </Pop>
          ))}
          <div style={{marginTop: 120}}>
            <Pop show={at('s12', 0)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 28, background: '#fff', color: '#14121c', borderRadius: 30, padding: '30px 40px', fontFamily: SANS, fontSize: 44, fontWeight: 800}}>
                <svg width={52} height={66} viewBox="0 0 26 33"><path d="M2 2h22v29l-11-8-11 8z" fill="#e0475b" /></svg>
                Speichern{NB}&amp;{NB}später{NB}wiederholen
              </div>
            </Pop>
          </div>
        </AbsoluteFill>
      )}

      <Thermometer v={v} />
    </AbsoluteFill>
  );
};

export const TEMPERATUR_FRAMES = Math.ceil((TIM.duration + 0.6) * 30);
