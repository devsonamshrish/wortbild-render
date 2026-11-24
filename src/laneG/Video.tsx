/* "Finde den Fehler" am Weihnachtsmarkt: a wooden stall at night with a hand-painted sign board.
   Each board carries one wrong article; each fix lights one section of the string of lights and brings the stall to life
   (shutter opens, Glühwein steams, the Räuchermännchen smokes). Trap at the end: "Die Thüringer" looks wrong, but the error is in the Brötchen. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneG-timings.json';
import {makeTiming, clamp, prog, rand, NB, SAFE, GENUS, FollowCTA, type Timings} from '../lib/kit';

const TM = makeTiming(T as unknown as Timings);
const {line, at} = TM;
export const FRAMES = Math.min(TM.frames(), Math.round(49.6 * 30)); // hard cap 50 s

const GOLD = '#ffbf47';
const ERR = '#ff5148';
const INK = '#fff3dc';
const PAL = '"Palatino Linotype", Georgia, serif';
const BLACK = '"Arial Black", Impact, sans-serif';
const SANS = '"Segoe UI", system-ui, sans-serif';

type Item = {wrong: string; right: string; idx: number; fix: string; genus: string | null; en: string; decoy?: number};
const ITEMS: Item[] = [
  {wrong: 's03', right: 's04', idx: 0, fix: 'Die', genus: GENUS.die, en: 'stall, booth (wooden hut)'},
  {wrong: 's05', right: 's06', idx: 0, fix: 'Der', genus: GENUS.der, en: 'pot of mulled wine'},
  {wrong: 's07', right: 's08', idx: 0, fix: 'Das', genus: GENUS.das, en: 'wooden incense smoker figure'},
  {wrong: 's09', right: 's10', idx: 11, fix: 'dem', genus: null, en: 'long Thuringian grilled sausage', decoy: 0},
];
const endOf = (id: string) => line(id).end;
const startOf = (id: string) => at(id, 0);
/* reveal moment of each item: first word of the corrected line (trap: the word "Fehler" in s10 points at it, the fix lands on "dem" in s10) */
const REVEAL = ITEMS.map((it, i) => (i === 3 ? at('s10', 6) : startOf(it.right)));
const FOUND = ITEMS.map((it, i) => (i === 3 ? at('s10', 4) : REVEAL[i]));
const ITEM_START = ITEMS.map((it, i) => (i === 0 ? 0 : startOf(it.wrong) - 0.35));
const OUTRO = startOf('s12') - 0.2;
const itemAt = (t: number) => { let k = 0; ITEM_START.forEach((s, i) => { if (t >= s) k = i; }); return k; };

const sp = (t: number, t0: number, fps: number, damping = 12, stiffness = 150) =>
  t < t0 ? 0 : spring({frame: Math.round((t - t0) * fps), fps, config: {damping, stiffness, mass: 0.7}});

/* ======================= 3D world ======================= */
const WOOD = '#6b3f22', WOOD_D = '#4a2814', SNOW = '#e9f0ff';

const Snow: React.FC<{t: number}> = ({t}) => {
  const geo = useMemo(() => new THREE.SphereGeometry(0.035, 6, 6), []);
  const flakes = useMemo(() => Array.from({length: 220}, (_, i) => ({x: (rand(i) - 0.5) * 16, z: (rand(i + 500) - 0.5) * 10 - 1, sp: 0.35 + rand(i + 900) * 0.5, ph: rand(i + 77) * 20, s: 0.6 + rand(i + 33) * 1.2})), []);
  return (
    <group>
      {flakes.map((f, i) => {
        const y = 7 - (((t * f.sp + f.ph) % 11));
        return <mesh key={i} geometry={geo} position={[f.x + Math.sin(t * 0.8 + f.ph) * 0.25, y, f.z]} scale={f.s}><meshBasicMaterial color="#ffffff" transparent opacity={0.85} /></mesh>;
      })}
    </group>
  );
};

/* the string of lights: 4 sections, one per found error */
const Lights: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const N = 28;
  const final = sp(t, at('s10', 6), fps, 20, 60);
  return (
    <group>
      {Array.from({length: N}, (_, i) => {
        const u = i / (N - 1), x = -3.6 + u * 7.2, y = 2.05 - Math.sin(u * Math.PI) * 0.35;
        const sec = Math.max(0, Math.min(3, Math.floor(u * 4 - 1e-6)));
        const on = sp(t, FOUND[sec] + i * 0.012, fps, 14, 160);
        const flick = 0.85 + 0.15 * Math.sin(t * 9 + i * 1.7);
        const col = new THREE.Color('#3a3326').lerp(new THREE.Color(GOLD), clamp(on));
        return (
          <mesh key={i} position={[x, y, 1.42]}>
            <sphereGeometry args={[0.085 + 0.03 * final, 12, 12]} />
            <meshStandardMaterial color={col} emissive={GOLD} emissiveIntensity={clamp(on) * (1.6 + final) * flick} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.95, 1.4]}><boxGeometry args={[7.3, 0.015, 0.015]} /><meshBasicMaterial color="#1a1a1a" /></mesh>
    </group>
  );
};

const Puffs: React.FC<{t: number; from: number; origin: [number, number, number]; color: string; rate?: number; spread?: number; size?: number}> = ({t, from, origin, color, rate = 5, spread = 0.25, size = 0.12}) => {
  if (t < from) return null;
  const n = 14;
  return (
    <group>
      {Array.from({length: n}, (_, i) => {
        const life = 2.2, age = ((t - from) * rate / n + i / n) % 1 * life;
        if (t - from < (i / n) * life / (rate / n) * 0) return null;
        const k = age / life;
        const x = origin[0] + Math.sin(i * 2.1 + t) * spread * k + (rand(i) - 0.5) * 0.1;
        return (
          <mesh key={i} position={[x, origin[1] + k * 1.3, origin[2]]} scale={size * (0.6 + k * 2.2)}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial color={color} transparent opacity={0.45 * (1 - k) * clamp((t - from) * 2)} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

const Stall: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  /* shutter: closed at frame 0, flips up into an awning when "Die Bude ... hat schon geöffnet" is revealed, closes again for the loop */
  const open = sp(t, REVEAL[0] + 0.1, fps, 13, 90) * (1 - prog(t, endOf('s13') + 0.15, 0.7));
  const inner = clamp(open * 1.3);
  /* props pop onto the counter when their sentence starts */
  const pTopf = sp(t, ITEM_START[1] + 0.2, fps), pMann = sp(t, ITEM_START[2] + 0.2, fps), pWurst = sp(t, ITEM_START[3] + 0.2, fps);
  const lang = prog(t, at('s09', 3), 0.8); // "so lang": the sausage stretches
  const fixedWurst = sp(t, REVEAL[3], fps, 10, 170);
  return (
    <group>
      {/* back body */}
      <mesh position={[0, 0.3, -0.2]}><boxGeometry args={[6.4, 3.5, 2.6]} /><meshStandardMaterial color={WOOD} roughness={0.85} /></mesh>
      {/* plank lines */}
      {Array.from({length: 9}, (_, i) => <mesh key={i} position={[-3.2 + i * 0.8, 0.3, 1.11]}><boxGeometry args={[0.04, 3.5, 0.02]} /><meshStandardMaterial color={WOOD_D} /></mesh>)}
      {/* opening (warm interior) */}
      <mesh position={[0, 0.55, 1.12]}><planeGeometry args={[5.2, 1.9]} /><meshStandardMaterial color="#2a1208" emissive="#ff9a3c" emissiveIntensity={0.08 + inner * 0.9} /></mesh>
      {/* shelves with jars inside */}
      {Array.from({length: 10}, (_, i) => (
        <mesh key={i} position={[-2.2 + i * 0.49, 0.9 + (i % 2) * 0.05, 1.15]}><cylinderGeometry args={[0.13, 0.13, 0.36, 12]} /><meshStandardMaterial color={['#b5402e', '#d79a3b', '#7a8f3a'][i % 3]} emissive="#ff8a30" emissiveIntensity={inner * 0.35} /></mesh>
      ))}
      <pointLight position={[0, 0.8, 2.2]} color="#ffb060" intensity={inner * 14} distance={7} />
      {/* shutter, hinged at the top of the opening */}
      <group position={[0, 1.5, 1.2]} rotation={[-open * 1.35, 0, 0]}>
        <mesh position={[0, -0.95, 0.03]}><boxGeometry args={[5.4, 1.95, 0.08]} /><meshStandardMaterial color="#5a3018" roughness={0.9} /></mesh>
        {Array.from({length: 6}, (_, i) => <mesh key={i} position={[0, -0.12 - i * 0.33, 0.08]}><boxGeometry args={[5.4, 0.03, 0.02]} /><meshStandardMaterial color={WOOD_D} /></mesh>)}
        {/* red/white stripes on the inside become the awning */}
        {Array.from({length: 9}, (_, i) => <mesh key={i} position={[-2.4 + i * 0.6, -0.95, -0.02]}><boxGeometry args={[0.3, 1.95, 0.01]} /><meshStandardMaterial color="#b3242c" /></mesh>)}
      </group>
      {/* counter */}
      <mesh position={[0, -0.45, 1.45]}><boxGeometry args={[6.0, 0.18, 0.9]} /><meshStandardMaterial color="#7d4a28" roughness={0.7} /></mesh>
      <mesh position={[0, -0.36, 1.45]}><boxGeometry args={[6.0, 0.05, 0.92]} /><meshStandardMaterial color={SNOW} roughness={1} /></mesh>
      {/* roof with snow */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.75, 2.55, 0]} rotation={[0, 0, -s * 0.42]}><boxGeometry args={[3.9, 0.16, 3.4]} /><meshStandardMaterial color="#3d2212" /></mesh>
          <mesh position={[s * 1.74, 2.68, 0]} rotation={[0, 0, -s * 0.42]}><boxGeometry args={[3.85, 0.14, 3.3]} /><meshStandardMaterial color={SNOW} roughness={1} /></mesh>
        </group>
      ))}
      <mesh position={[0, 2.08, 1.58]}><boxGeometry args={[6.9, 0.1, 0.12]} /><meshStandardMaterial color={WOOD_D} /></mesh>

      {/* Glühweintopf */}
      <group position={[-1.9, -0.36, 1.55]} scale={pTopf}>
        <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.42, 0.38, 0.62, 28]} /><meshStandardMaterial color="#8c2230" metalness={0.6} roughness={0.35} /></mesh>
        <mesh position={[0, 0.64, 0]}><cylinderGeometry args={[0.4, 0.4, 0.02, 28]} /><meshStandardMaterial color="#5a0f1c" emissive="#a0202e" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.5, 0.5, 0.06, 28]} /><meshStandardMaterial color="#222" emissive="#ff3a10" emissiveIntensity={0.6} /></mesh>
      </group>
      <Puffs t={t} from={ITEM_START[1] + 0.4} origin={[-1.9, 0.4, 1.55]} color="#ffffff" rate={REVEAL[1] < t ? 9 : 4} />
      {/* Räuchermännchen with a candle */}
      <group position={[0, -0.36, 1.6]} scale={pMann * 0.95}>
        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.28, 0.32, 0.24, 20]} /><meshStandardMaterial color="#2e5a3a" /></mesh>
        <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.22, 0.27, 0.75, 20]} /><meshStandardMaterial color="#1f3f8a" /></mesh>
        <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.2, 20, 20]} /><meshStandardMaterial color="#f1c7a0" /></mesh>
        <mesh position={[0, 1.38, 0]}><cylinderGeometry args={[0.15, 0.24, 0.28, 20]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 1.24, 0]}><cylinderGeometry args={[0.3, 0.3, 0.03, 20]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0.12, 1.02, 0.17]} rotation={[0, 0, -1.2]}><cylinderGeometry args={[0.025, 0.025, 0.3, 8]} /><meshStandardMaterial color="#3b2412" /></mesh>
        <mesh position={[0, 1.07, 0.2]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#c4322b" /></mesh>
        {/* candle */}
        <mesh position={[0.5, 0.15, 0.1]}><cylinderGeometry args={[0.06, 0.06, 0.3, 12]} /><meshStandardMaterial color="#f4ead2" /></mesh>
        <mesh position={[0.5, 0.36, 0.1]} scale={[1, 1.6, 1]}><sphereGeometry args={[0.045 * sp(t, at('s08', 9), fps), 10, 10]} /><meshBasicMaterial color="#ffd27a" /></mesh>
      </group>
      <pointLight position={[0.5, 0.2, 2.0]} color="#ffc070" intensity={sp(t, at('s08', 9), fps) * 4} distance={3} />
      <Puffs t={t} from={REVEAL[2] + 0.2} origin={[0.25, 0.7, 1.85]} color="#d8d8e8" rate={6} spread={0.35} size={0.1} />
      {/* Thüringer in a roll: it grows on "so lang", hangs out left and right */}
      <group position={[1.95, -0.2, 1.6]} scale={pWurst} rotation={[0, -0.25, 0.04 * Math.sin(t * 2)]}>
        <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.8]}><capsuleGeometry args={[0.2, 0.55, 8, 16]} /><meshStandardMaterial color="#d9a35b" roughness={0.8} /></mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.085, 0.6 + lang * 1.25, 8, 16]} /><meshStandardMaterial color="#8a3b1c" emissive="#ff5a10" emissiveIntensity={0.08 + fixedWurst * 0.35} roughness={0.5} /></mesh>
      </group>
      {/* fountain next to the stall ("neben dem Brunnen") */}
      <group position={[-4.6, -1.3, 1.2]}>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.9, 1.0, 0.6, 28]} /><meshStandardMaterial color="#8d93a6" roughness={0.9} /></mesh>
        <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.88, 0.88, 0.06, 28]} /><meshStandardMaterial color={SNOW} /></mesh>
        <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.12, 0.16, 1.2, 14]} /><meshStandardMaterial color="#8d93a6" /></mesh>
        <mesh position={[0, 1.85, 0]}><sphereGeometry args={[0.2, 14, 14]} /><meshStandardMaterial color={SNOW} /></mesh>
      </group>
    </group>
  );
};

/* a decorated tree on the right gives depth */
const Tree: React.FC<{t: number}> = ({t}) => (
  <group position={[4.9, -1.6, -1.5]}>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[0, 1.0 + i * 0.95, 0]}><coneGeometry args={[1.7 - i * 0.35, 1.5, 16]} /><meshStandardMaterial color="#173d2a" roughness={0.9} /></mesh>
    ))}
    {Array.from({length: 18}, (_, i) => {
      const h = 0.6 + rand(i + 3) * 3.4, r = (1.7 - (h - 0.6) / 0.95 * 0.35) * 0.75, a = rand(i + 9) * 6.28;
      return <mesh key={i} position={[Math.cos(a) * r, h, Math.sin(a) * r]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1 + 0.6 * Math.sin(t * 3 + i)} /></mesh>;
    })}
  </group>
);

const World: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const k = itemAt(t);
  /* camera drift: a slow push-in plus a lean toward the current prop; a kick on every found error */
  const focusX = [0, -1.0, 0, 1.0][k];
  const fx = THREE.MathUtils.lerp([0, -1.0, 0, 1.0][Math.max(0, k - 1)], focusX, prog(t, ITEM_START[k], 0.9));
  const kick = FOUND.reduce((a, f) => a + (t > f ? Math.exp(-(t - f) * 7) * Math.sin((t - f) * 40) * 0.06 : 0), 0);
  const push = prog(t, 0, 40) * 1.4 + (t > OUTRO ? -prog(t, OUTRO, 2.5) * 1.4 : 0);
  return (
    <group position={[-fx * 0.6 + kick, 0.75 + kick * 0.5, push]} rotation={[0.02, fx * 0.04, 0]}>
      <ambientLight intensity={0.35} color="#8fa6ff" />
      <directionalLight position={[-4, 6, 5]} intensity={0.8} color="#b8c8ff" />
      <pointLight position={[0, 3.2, 4]} intensity={6} color="#ffd9a0" distance={12} />
      {/* snowy ground */}
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 30]} /><meshStandardMaterial color="#b9c6e8" roughness={1} /></mesh>
      {/* far stalls silhouettes with lit windows */}
      {[-7, -3.5, 3.5, 7].map((x, i) => (
        <group key={i} position={[x, -0.2, -7]}>
          <mesh><boxGeometry args={[2.8, 2.6, 1.5]} /><meshStandardMaterial color="#1d1a2a" /></mesh>
          <mesh position={[0, 0.2, 0.76]}><planeGeometry args={[1.8, 0.8]} /><meshStandardMaterial color="#000" emissive="#ffa040" emissiveIntensity={0.7 + 0.2 * Math.sin(t * 2 + i)} /></mesh>
        </group>
      ))}
      <Stall t={t} fps={fps} />
      <Lights t={t} fps={fps} />
      <Tree t={t} />
      <Snow t={t} />
    </group>
  );
};

/* ======================= 2D overlay ======================= */
const words = (id: string) => line(id).text.split(' ');

/* one article that flips from wrong (red, struck) to right (genus colour) */
const Article: React.FC<{wrong: string; right: string; genus: string | null; t: number; mark: number; flip: number; fps: number}> = ({wrong, right, genus, t, mark, flip, fps}) => {
  const m = sp(t, mark, fps, 10, 180), f = prog(t, flip, 0.35);
  const showRight = t >= flip + 0.17;
  const col = showRight ? (genus ?? GOLD) : t >= mark ? ERR : INK;
  return (
    <span style={{position: 'relative', display: 'inline-block', color: col, transform: `rotateX(${Math.sin(f * Math.PI) * 90}deg) scale(${1 + 0.15 * m * (showRight ? 0 : 1)})`}}>
      {showRight ? right : wrong}
      {!showRight && t >= mark && (
        <>
          <span style={{position: 'absolute', left: -6, right: -6, top: '52%', height: 7, background: ERR, transform: `scaleX(${m})`, transformOrigin: 'left', borderRadius: 4}} />
          <span style={{position: 'absolute', inset: '-10px -16px', border: `5px solid ${ERR}`, borderRadius: '50%', opacity: m, transform: `scale(${1.3 - 0.3 * m}) rotate(-4deg)`}} />
        </>
      )}
      {showRight && <span style={{position: 'absolute', left: 0, right: 0, bottom: -8, height: 6, background: genus ?? GOLD, borderRadius: 3}} />}
    </span>
  );
};

const Board: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const k = itemAt(t), it = ITEMS[k];
  if (t > OUTRO) return null;
  const ws = words(it.wrong), lw = line(it.wrong).words;
  const appear = sp(t, ITEM_START[k], fps, 13, 120);
  const swing = Math.sin(t * 1.6) * 0.8 + (1 - appear) * 12;
  const reveal = REVEAL[k];
  const mark = k === 3 ? at('s10', 4) : reveal;
  /* guess window: ticking dots between the wrong line and the reveal */
  const g0 = endOf(it.wrong), g1 = k === 3 ? startOf('s10') : reveal;
  const guessing = t > g0 && t < g1;
  const left = clamp(1 - (t - g0) / (g1 - g0));
  const decoyOn = it.decoy !== undefined && t > g0 - 0.6 && t < at('s10', 2) + 0.4;
  const decoyOk = it.decoy !== undefined && t >= at('s10', 2);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1100, transform: `rotate(${swing}deg) translateY(${(1 - appear) * -80}px)`, transformOrigin: '50% -60px', opacity: clamp(appear * 1.5)}}>
      {/* ropes */}
      <div style={{position: 'absolute', left: 90, top: -70, width: 6, height: 74, background: '#2b1a0e'}} />
      <div style={{position: 'absolute', right: 90, top: -70, width: 6, height: 74, background: '#2b1a0e'}} />
      <div style={{background: 'repeating-linear-gradient(0deg,#5b3419 0 92px,#4a2a14 92px 96px)', border: '10px solid #3a200f', borderRadius: 22, padding: '40px 44px 46px',
        boxShadow: '0 30px 60px rgba(0,0,0,.55), inset 0 0 40px rgba(0,0,0,.45)', minHeight: 300}}>
        {/* snow on the board edge */}
        <div style={{position: 'absolute', left: 4, right: 4, top: -12, height: 22, background: '#eef3ff', borderRadius: 14, boxShadow: '0 3px 6px rgba(0,0,0,.3)'}} />
        <div style={{fontFamily: SANS, fontSize: 30, letterSpacing: 6, fontWeight: 700, color: GOLD, marginBottom: it.decoy !== undefined ? 48 : 14, textTransform: 'uppercase'}}>
          Schild {k + 1} / 4{k === 3 ? `${NB}·${NB}Vorsicht,${NB}Falle` : ''}
        </div>
        <div style={{fontFamily: PAL, fontSize: ws.length > 11 ? 56 : 64, lineHeight: 1.3, color: INK, fontWeight: 700, textShadow: '0 3px 0 rgba(0,0,0,.35)', perspective: 600}}>
          {ws.map((w, i) => {
            const shown = k === 0 || t >= lw[Math.min(i, lw.length - 1)].s - 0.08;
            const pop = k === 0 ? 1 : sp(t, lw[Math.min(i, lw.length - 1)].s - 0.08, fps, 11, 170);
            const spoken = t >= lw[Math.min(i, lw.length - 1)].s - 0.05 && t <= lw[Math.min(i, lw.length - 1)].e + 0.05 && t < g0;
            let inner: React.ReactNode = w;
            if (i === it.idx) {
              const fix = it.fix + (w.match(/[.,?!]$/)?.[0] ?? '');
              inner = <Article wrong={w} right={fix} genus={it.genus} t={t} mark={mark} flip={reveal} fps={fps} />;
            } else if (i === it.decoy && (decoyOn || decoyOk)) {
              const pulse = decoyOk ? 0 : 0.5 + 0.5 * Math.sin(t * 9);
              inner = (
                <span style={{position: 'relative', display: 'inline-block'}}>
                  {w}
                  <span style={{position: 'absolute', inset: '-6px -12px', border: `4px dashed ${decoyOk ? GENUS.die : GOLD}`, borderRadius: 14, opacity: decoyOk ? 1 : 0.4 + pulse * 0.6}} />
                  <span style={{position: 'absolute', top: -54, left: -4, fontFamily: BLACK, fontSize: 40, color: decoyOk ? GENUS.die : GOLD, whiteSpace: 'nowrap'}}>{decoyOk ? `✓${NB}stimmt` : '?'}</span>
                </span>
              );
            }
            return (
              <React.Fragment key={i}>
                <span style={{display: 'inline-block', opacity: shown ? clamp(pop * 1.4) : 0, transform: `translateY(${(1 - pop) * 26}px)`, borderBottom: spoken ? `4px solid ${GOLD}` : '4px solid transparent'}}>{inner}</span>
                {i < ws.length - 1 ? ' ' : ''}
              </React.Fragment>
            );
          })}
        </div>
        {/* meaning subtitle, only after the fix */}
        {t > reveal + 0.3 && (
          <div style={{marginTop: 18, fontFamily: SANS, fontSize: 34, color: 'rgba(255,243,220,.75)', fontStyle: 'italic', opacity: prog(t, reveal + 0.3, 0.4)}}>
            {['die Bude', 'der Glühweintopf', 'das Räuchermännchen', 'die Thüringer'][k]}{NB}={NB}{it.en}
          </div>
        )}
      </div>
      {/* ticking guess timer */}
      {guessing && (
        <div style={{position: 'absolute', right: 30, top: -40, width: 110, height: 110, borderRadius: '50%', background: `conic-gradient(${GOLD} ${left * 360}deg, rgba(20,18,30,.85) 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.06 * Math.sin((t - g0) * Math.PI * 2 * 2)})`, boxShadow: '0 8px 20px rgba(0,0,0,.5)'}}>
          <div style={{width: 84, height: 84, borderRadius: '50%', background: '#14121e', color: '#fff', fontFamily: BLACK, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {Math.max(1, Math.ceil(left * 3))}
          </div>
        </div>
      )}
    </div>
  );
};

const Hud: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const k = itemAt(t);
  const loop = t > endOf('s13') + 0.2; // the last frames show the opening title again
  const show = t < OUTRO || loop;
  const big = t < startOf('s03') || loop;
  const s = big ? 1 : 0.62;
  const kick = sp(t, 0, fps);
  return (
    <div style={{position: 'absolute', top: SAFE.top + 10, left: 0, right: 0, textAlign: 'center', opacity: show ? 1 : 0}}>
      <div style={{fontFamily: BLACK, fontSize: 118 * s, lineHeight: 1, color: '#fff', letterSpacing: 2, textShadow: `0 6px 0 ${ERR}, 0 12px 30px rgba(0,0,0,.6)`, transform: `scale(${t < 0.5 ? 0.9 + 0.1 * kick : 1}) rotate(-2deg)`}}>
        FINDE{NB}DEN<br />FEHLER
      </div>
      {!big && (
        <div style={{marginTop: 14, display: 'flex', justifyContent: 'center', gap: 18}}>
          {ITEMS.map((_, i) => {
            const on = t >= FOUND[i];
            return <div key={i} style={{width: 46, height: 46, borderRadius: '50%', border: `4px solid ${GOLD}`, background: on ? GOLD : 'rgba(10,10,20,.6)', boxShadow: on ? `0 0 24px ${GOLD}` : 'none',
              transform: `scale(${i === k && !on ? 1.15 : 1})`, fontFamily: BLACK, fontSize: 24, color: on ? '#1a1206' : GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{on ? '✓' : i + 1}</div>;
          })}
        </div>
      )}
    </div>
  );
};

const Outro: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  if (t < OUTRO) return null;
  const a = sp(t, startOf('s12'), fps, 13, 120);
  return (
    <>
      <div style={{position: 'absolute', left: 70, right: 70, top: 1080, textAlign: 'center', background: 'rgba(12,10,24,.82)', borderRadius: 30, padding: '26px 30px', border: `4px solid ${GOLD}`, opacity: clamp(a) * (1 - prog(t, endOf('s13') + 0.1, 0.4)), transform: `translateY(${(1 - a) * 40}px)`}}>
        <div style={{fontFamily: SANS, fontSize: 34, letterSpacing: 6, color: GOLD, fontWeight: 700}}>MORGEN</div>
        <div style={{fontFamily: PAL, fontSize: 66, color: INK, fontWeight: 700, lineHeight: 1.2, textShadow: '0 4px 14px rgba(0,0,0,.7)'}}>noch{NB}mehr{NB}Fallen vom{NB}Weihnachtsmarkt</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1340, display: 'flex', justifyContent: 'center', opacity: 1 - prog(t, endOf('s13') + 0.3, 0.4)}}>
        <FollowCTA show={startOf('s13')} accent={ERR} />
      </div>
    </>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #1b2a5c 0%, #0a1230 55%, #050817 100%)'}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.6, 11.8], fov: 44}} gl={{antialias: true}}>
        <World t={t} fps={fps} />
      </ThreeCanvas>
      {/* vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(2,4,14,.55) 100%)'}} />
      <Hud t={t} fps={fps} />
      <Board t={t} fps={fps} />
      <Outro t={t} fps={fps} />
      <Audio src={staticFile('laneG/mix.wav')} />
    </AbsoluteFill>
  );
};
