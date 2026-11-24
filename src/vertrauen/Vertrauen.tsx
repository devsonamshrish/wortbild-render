/* "Vertrauen" – a word family as a tower: every relative is a glass block that lands when it is spoken.
   The shared stem "trau" glows gold in every block. "miss-" slams on top, the tower tips; "Schritt für Schritt" rebuilds it. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {TIM, line, at, scene, clamp, prog, rand} from './timing';

const NB = ' ';
const SERIF = 'Georgia, "Palatino Linotype", serif';
const SANS = '"Segoe UI", system-ui, sans-serif';
const SAFE = {top: 250, bottom: 400, side: 60};
const GOLD = '#ffc95c', MISS = '#ff5a5f', DAS = '#46d49a';

/* split a word into coloured parts: article, "miss" prefix, the stem "trau" */
type Seg = {t: string; c: string};
const segs = (w: string): Seg[] => {
  const out: Seg[] = [];
  let rest = w;
  if (rest.startsWith('das ')) { out.push({t: 'das ', c: DAS}); rest = rest.slice(4); }
  const m = rest.match(/^(.*?)(miss)?(trau)(.*)$/i);
  if (!m) return [...out, {t: rest, c: '#fff'}];
  if (m[1]) out.push({t: m[1], c: '#fff'});
  if (m[2]) out.push({t: m[2], c: MISS});
  out.push({t: m[3], c: GOLD});
  if (m[4]) out.push({t: m[4], c: '#fff'});
  return out;
};
const Colored: React.FC<{w: string}> = ({w}) => <>{segs(w).map((s, i) => <span key={i} style={{color: s.c}}>{s.t.replace(/ /g, NB)}</span>)}</>;

/* ---------------- 3D tower ---------------- */
const FAMILY = [
  {w: 'vertrauen', t: () => at('s02', 3)},
  {w: 'das Vertrauen', t: () => at('s03', 4)},
  {w: 'vertraut', t: () => at('s04', 0)},
  {w: 'vertrauenswürdig', t: () => at('s05', 0)},
  {w: 'sich anvertrauen', t: () => at('s06', 1)},
];
const BASE = 0.46, H = 0.42, BW = 2.5;
const SLAM = () => at('s08', 0);
const REBUILD = () => [at('s09', 1), at('s09', 3), at('s09', 4), at('s09', 5), at('s09', 6)]; // baut · Schritt · für · Schritt · auf

const useLabel = (w: string, dark = false) =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 172;
    const g = c.getContext('2d')!;
    g.fillStyle = dark ? '#2a0d12' : '#132140';
    g.fillRect(0, 0, 1024, 172);
    g.strokeStyle = dark ? MISS : 'rgba(255,201,92,.55)'; g.lineWidth = 6; g.strokeRect(6, 6, 1012, 160);
    const ss = segs(w);
    let size = 104;
    g.font = `bold ${size}px Georgia`;
    let width = ss.reduce((a, s) => a + g.measureText(s.t).width, 0);
    while (width > 940) { size -= 4; g.font = `bold ${size}px Georgia`; width = ss.reduce((a, s) => a + g.measureText(s.t).width, 0); }
    let x = (1024 - width) / 2;
    g.textBaseline = 'middle';
    for (const s of ss) { g.fillStyle = s.c; g.fillText(s.t, x, 90); x += g.measureText(s.t).width; }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }, [w, dark]);

const Block: React.FC<{w: string; pos: [number, number, number]; rot: number; glow: number; dark?: boolean; heat?: number}> = ({w, pos, rot, glow, dark, heat = 0}) => {
  const tex = useLabel(w, dark);
  const side = dark ? '#4a1018' : new THREE.Color('#1b2f57').lerp(new THREE.Color('#5a1a22'), heat).getStyle();
  const em = dark ? '#ff2d3a' : new THREE.Color('#ffb84a').lerp(new THREE.Color('#ff2d3a'), heat).getStyle();
  return (
    <mesh position={pos} rotation={[0, 0, rot]}>
      <boxGeometry args={[BW, H * 0.94, 0.8]} />
      {[0, 1, 2, 3].map((k) => <meshStandardMaterial key={k} attach={`material-${k}`} color={side} emissive={em} emissiveIntensity={0.12 + glow * 0.5} roughness={0.35} metalness={0.2} />)}
      <meshStandardMaterial attach="material-4" map={tex} emissive={em} emissiveIntensity={glow * 0.25} roughness={0.4} />
      <meshStandardMaterial attach="material-5" color={side} />
    </mesh>
  );
};

const Tower: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const slam = SLAM(), rb = REBUILD();
  const fall = (t0: number) => spring({frame: Math.round((t - t0) * fps), fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
  const shake = t > slam ? Math.sin((t - slam) * 40) * 0.12 * Math.exp(-(t - slam) * 3) : 0;
  const tip = (i: number) => prog(t, slam, 0.9) * (1 - prog(t, rb[i], 0.45));
  const heat = prog(t, slam, 0.3) * (1 - prog(t, rb[4], 0.6));
  const missOut = prog(t, at('s09', 0) - 0.2, 0.9); // the "miss" block slides off before the rebuild
  return (
    <group position={[shake, -0.95, 0]} rotation={[0.08, Math.sin(t * 0.35) * 0.35, 0]}>
      <mesh position={[0, BASE - 0.08, 0]}>
        <cylinderGeometry args={[1.9, 2.1, 0.16, 48]} />
        <meshStandardMaterial color="#0f1a30" emissive="#ffb84a" emissiveIntensity={0.15} />
      </mesh>
      {FAMILY.map((b, i) => {
        const s = fall(b.t());
        if (t < b.t() - 0.05) return null;
        const y = BASE + H / 2 + i * H + (1 - s) * 5;
        const dir = i % 2 ? 1 : -1, k = tip(i);
        const glow = clamp(1 - (t - b.t()) / 1.5) + 0.15;
        return <Block key={b.w} w={b.w} heat={heat} glow={glow} pos={[dir * k * (0.25 + i * 0.22), y - k * i * 0.06, 0]} rot={dir * k * (0.08 + i * 0.05)} />;
      })}
      {t > slam - 0.45 && missOut < 1 && (() => {
        const s = fall(slam - 0.35);
        return <Block w="misstrauen" dark glow={1} pos={[missOut * 4.5, BASE + H / 2 + 5 * H + (1 - s) * 5 - missOut * 3, 0.05]} rot={-missOut * 1.2 + 0.05} />;
      })()}
    </group>
  );
};

/* ---------------- overlays ---------------- */
const Pop: React.FC<{show: number; children: React.ReactNode; style?: React.CSSProperties}> = ({show, children, style}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const s = spring({frame: f - Math.round(show * fps), fps, config: {damping: 11, stiffness: 140, mass: 0.7}});
  return <span style={{display: 'inline-block', transform: `translateY(${(1 - s) * 40}px) scale(${0.6 + 0.4 * s})`, opacity: clamp(s * 1.4), ...style}}>{children}</span>;
};
const Spoken: React.FC<{id: string; skip?: number; size: number; weight?: number}> = ({id, skip = 0, size, weight = 600}) => {
  const L = line(id);
  const words = L.text.replace(/[.!]$/, '').split(' ').slice(skip);
  return (
    <div style={{fontSize: size, lineHeight: 1.2, color: '#fff', fontWeight: weight, fontFamily: SANS}}>
      {words.map((w, i) => (
        <React.Fragment key={i}><Pop show={L.words[Math.min(i + skip, L.words.length - 1)].s - 0.05}>{w}</Pop>{i < words.length - 1 ? ' ' : ''}</React.Fragment>
      ))}
    </div>
  );
};
const Card: React.FC<{from: number; to: number; label: string; accent: string; children: React.ReactNode}> = ({from, to, label, accent, children}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  if (t < from - 0.2 || t > to) return null;
  const s = spring({frame: f - Math.round(from * fps), fps, config: {damping: 14}});
  const out = clamp((to - t) / 0.25);
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 10, transform: `translateY(${(1 - s) * 120}px)`, opacity: s * out,
      background: 'rgba(10,14,28,.88)', borderRadius: 34, padding: '32px 40px', borderLeft: `10px solid ${accent}`}}>
      <div style={{fontFamily: SANS, fontSize: 32, letterSpacing: 4, textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: 10}}>{label}</div>
      {children}
    </div>
  );
};

/* current word at the top, stem in gold */
const Title: React.FC<{t: number}> = ({t}) => {
  const items: [number, number, React.ReactNode][] = [
    ...FAMILY.map((b, i) => [b.t() - 0.1, i < 4 ? FAMILY[i + 1].t() - 0.1 : at('s07', 0) - 0.1, <Colored w={b.w} />] as [number, number, React.ReactNode]),
    [at('s07', 3), at('s08', 0) - 0.1, <span style={{color: MISS}}>miss-{NB}…</span>],
    [at('s08', 0) - 0.1, at('s09', 0) - 0.1, <Colored w="misstrauen" />],
    [at('s09', 0) - 0.1, scene('outro').start - 0.1, <span><Colored w="Vertrauen" /> aufbauen</span>],
  ];
  const cur = items.find(([a, b]) => t >= a && t < b);
  if (!cur) return null;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}>
      <Pop show={cur[0]}><div style={{fontFamily: SERIF, fontSize: 104, fontWeight: 700, color: '#fff', textShadow: '0 6px 34px rgba(0,0,0,.7)'}}>{cur[2]}</div></Pop>
    </div>
  );
};

export const Vertrauen: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const slam = SLAM(), heat = prog(t, slam, 0.3) * (1 - prog(t, REBUILD()[4], 0.6));
  const hookEnd = scene('hook').end, outro = scene('outro').start;
  return (
    <AbsoluteFill style={{background: `radial-gradient(110% 70% at 50% 55%, ${heat > 0.05 ? `rgba(${90 + heat * 70},${30 - heat * 10},${50 - heat * 20},1)` : '#1a2a52'} 0%, #0a1024 62%, #04060e 100%)`}}>
      <Audio src={staticFile('vertrauen/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 1.0, 9], fov: 42}} gl={{antialias: true}}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 6]} intensity={1.6} />
        <pointLight position={[0, 2, 3]} intensity={heat > 0 ? 6 + heat * 20 : 6} color={heat > 0.1 ? '#ff4a4a' : '#ffc95c'} distance={10} />
        {/* drifting gold dust */}
        {Array.from({length: 60}, (_, i) => (
          <mesh key={i} position={[(rand(i) - 0.5) * 8, ((rand(i + 9) * 9 + t * (0.1 + rand(i + 3) * 0.15)) % 9) - 2.5, -2 - rand(i + 5) * 3]}>
            <sphereGeometry args={[0.025 + rand(i + 7) * 0.025, 6, 6]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.55} />
          </mesh>
        ))}
        {t > hookEnd - 0.6 && t < outro + 0.6 && <Tower t={t} fps={fps} />}
      </ThreeCanvas>

      {/* hook: the stem as a seed, with five empty slots waiting */}
      {t < hookEnd + 0.4 && (
        <AbsoluteFill style={{opacity: clamp((hookEnd + 0.4 - t) / 0.5), alignItems: 'center'}}>
          <div style={{position: 'absolute', top: SAFE.top + 40, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}>
            <div style={{fontFamily: SERIF, fontSize: 108, fontWeight: 700, color: '#fff', lineHeight: 1.1}}>
              <Pop show={at('s01', 0)}>Ein{NB}Wort,</Pop><br /><Pop show={at('s01', 2)}>fünf{NB}Verwandte.</Pop>
            </div>
          </div>
          <div style={{position: 'absolute', top: 820, fontFamily: SERIF, fontWeight: 700, fontSize: 210, color: GOLD, textShadow: `0 0 ${40 + Math.sin(t * 4) * 15}px rgba(255,201,92,.8)`}}>
            <Pop show={at('s01', 1)}>trau</Pop>
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{position: 'absolute', top: 1110 + i * 0 , left: 130 + i * 170, width: 130, height: 46, borderRadius: 10, border: '3px dashed rgba(255,201,92,.6)', opacity: clamp((t - at('s01', 2) - i * 0.12) / 0.3)}} />
          ))}
        </AbsoluteFill>
      )}

      <Title t={t} />

      <Card from={at('s02', 4) - 0.2} to={line('s02').end + 0.5} label="bedeutet" accent={GOLD}><Spoken id="s02" skip={4} size={58} weight={700} /></Card>
      <Card from={at('s03', 2) - 0.2} to={line('s03').end + 0.5} label="Nomen" accent={DAS}>
        <div style={{fontFamily: SANS, fontSize: 58, fontWeight: 700}}><span style={{color: DAS}}>das</span>{NB}Vertrauen <span style={{fontSize: 40, opacity: 0.8}}>(Artikel:{NB}das)</span></div>
      </Card>
      <Card from={at('s04', 2) - 0.2} to={line('s04').end + 0.5} label="bedeutet" accent={GOLD}><Spoken id="s04" skip={2} size={58} weight={700} /></Card>
      <Card from={at('s05', 2) - 0.2} to={line('s05').end + 0.5} label="bedeutet" accent={GOLD}><Spoken id="s05" skip={2} size={54} weight={700} /></Card>
      <Card from={at('s06', 3) - 0.2} to={line('s06').end + 0.5} label="bedeutet" accent={GOLD}><Spoken id="s06" skip={3} size={56} weight={700} /></Card>
      <Card from={at('s07', 0) - 0.2} to={line('s07').end + 0.3} label="aber" accent={MISS}><Spoken id="s07" size={56} weight={700} /></Card>
      <Card from={at('s08', 2) - 0.2} to={line('s08').end + 0.6} label="bedeutet" accent={MISS}><Spoken id="s08" skip={2} size={56} weight={700} /></Card>
      <Card from={at('s09', 0) - 0.2} to={line('s09').end + 0.6} label="und so geht's" accent={GOLD}><Spoken id="s09" size={58} weight={700} /></Card>

      {/* outro: the family at a glance + save */}
      {t > outro - 0.3 && (
        <AbsoluteFill style={{opacity: clamp((t - outro + 0.3) / 0.4), background: 'rgba(4,6,14,.93)', padding: `${SAFE.top + 20}px ${SAFE.side}px 0`}}>
          {['vertrauen', 'das Vertrauen', 'vertraut', 'vertrauenswürdig', 'sich anvertrauen', 'misstrauen'].map((w, i) => (
            <Pop key={w} show={outro + i * 0.12}>
              <div style={{fontFamily: SERIF, fontSize: 64, fontWeight: 700, marginBottom: 18}}><Colored w={w} /></div>
            </Pop>
          ))}
          <div style={{marginTop: 50}}>
            <Pop show={at('s10', 0)}>
              <div style={{display: 'flex', alignItems: 'center', gap: 28, background: '#fff', color: '#14121c', borderRadius: 30, padding: '30px 40px', fontFamily: SANS, fontSize: 46, fontWeight: 800}}>
                <svg width={52} height={66} viewBox="0 0 26 33"><path d="M2 2h22v29l-11-8-11 8z" fill="#e0475b" /></svg>
                Speichern{NB}&amp;{NB}später{NB}wiederholen
              </div>
            </Pop>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const VERTRAUEN_FRAMES = Math.ceil((TIM.duration + 0.6) * 30);
