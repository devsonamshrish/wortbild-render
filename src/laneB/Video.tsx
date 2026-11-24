/* idiom-weihnachtsmarkt-01 · "Eingefroren"
   Leitmetapher: a gingerbread man at a night Christmas market gets frozen step by step by five ice idioms.
   Hook = the end state (he is a block of ice). The idioms build that image: the ice between two people
   (das Eis brechen), frozen feet (kalte Füße bekommen), lying on crushed ice like goods (etw. auf Eis legen),
   slid onto the rink by the nutcracker trader and frozen solid (jdn. aufs Glatteis führen) = the hook frame.
   Twist / payoff: "Schnee von gestern" turns the block itself into yesterday's snow. Last frame rhymes with the first. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneB-timings.json';
import {makeTiming, Pop, Spoken, Card, FollowCTA, SAFE, rand, clamp, prog, Timings} from '../lib/kit';

const {line, at, scene, frames, TIM} = makeTiming(T as unknown as Timings);
export const FRAMES = frames();
const END = FRAMES / 30;

const ACC = '#8ee8ff'; // the one accent: ice cyan
const NIGHT = '#070b1f';
const HEAD = 'Impact, "Arial Black", sans-serif';
const TITLE = '"Trebuchet MS", "Segoe UI", sans-serif';
const UI = '"Segoe UI", system-ui, sans-serif';
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const GROUND = -1.0;

/* ---------------- anchors (all on spoken words) ---------------- */
const A = {
  eisblockHook: () => at('s01', 5), fuenf: () => at('s02', 0), letzte: () => at('s02', 3), taut: () => at('s02', 4),
  eis: () => scene('eis').start, brechen: () => at('s03', 3), gluehwein: () => at('s04', 2), brechen2: () => at('s04', 9),
  fuesse: () => scene('fuesse').start, fuesseW: () => at('s05', 2), riesen: () => at('s06', 2), ploetz: () => at('s06', 5),
  legenS: () => scene('eislegen').start, legen: () => at('s07', 4), fest: () => at('s08', 7),
  glattS: () => scene('glatteis').start, glatt: () => at('s09', 2), glatteis: () => at('s09', 3), fuehren: () => at('s09', 4),
  haendler: () => at('s10', 1), nachger: () => at('s10', 10),
  schneeS: () => scene('schnee').start, eisblock: () => at('s11', 2), schnee: () => at('s11', 3), schnee2: () => at('s12', 7),
  outro: () => scene('outro').start, aufgetaut: () => at('s13', 0), morgen: () => at('s13', 1), cta: () => at('s15', 0),
};

const useTex = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 256) =>
  useMemo(() => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

/* ---------------- textures ---------------- */
const useSky = () => useTex((g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#050820'); gr.addColorStop(0.55, '#16173d'); gr.addColorStop(1, '#3a2240');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + rand(i) * 0.7})`; const r = rand(i + 3) * 1.4 + 0.3; g.beginPath(); g.arc(rand(i + 1) * w, rand(i + 2) * h * 0.65, r, 0, 7); g.fill(); }
}, 512, 512);

const useFrost = () => useTex((g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${rand(i) * 0.35})`; g.fillRect(rand(i + 1) * w, rand(i + 2) * h, 1 + rand(i + 3) * 3, 1 + rand(i + 4) * 3); }
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5;
  for (let k = 0; k < 14; k++) {
    let x = rand(k + 50) * w, y = rand(k + 60) * h; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (rand(k * 10 + s) - 0.5) * 70; y += (rand(k * 10 + s + 5) - 0.5) * 70; g.lineTo(x, y); }
    g.stroke();
  }
  const ed = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.72);
  ed.addColorStop(0, 'rgba(255,255,255,0)'); ed.addColorStop(1, 'rgba(255,255,255,.55)');
  g.fillStyle = ed; g.fillRect(0, 0, w, h);
});

const useCrack = () => useTex((g, w, h) => {
  g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 3;
  for (let k = 0; k < 9; k++) {
    let x = w / 2, y = h * 0.45; g.beginPath(); g.moveTo(x, y);
    const ang = (k / 9) * Math.PI * 2;
    for (let s = 0; s < 7; s++) { x += Math.cos(ang + (rand(k * 7 + s) - 0.5)) * 22; y += Math.sin(ang + (rand(k * 7 + s + 3) - 0.5)) * 22; g.lineTo(x, y); }
    g.stroke();
  }
});

const useDot = () => useTex((g, w, h) => {
  const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
}, 64, 64);

/* ---------------- the gingerbread man ---------------- */
type GMProps = {x: number; y?: number; z?: number; rz?: number; ry?: number; s?: number; arm?: number; armL?: number; hammer?: boolean; mug?: boolean; scarf?: string; t: number; jaw?: number};
const DOUGH = '#b5652a', ICING = '#fbf6ee';
const Limb: React.FC<{len: number; r: number}> = ({len, r}) => (
  <group>
    <mesh position={[0, -len / 2 - r * 0.2, 0]}><capsuleGeometry args={[r, len, 6, 16]} /><meshStandardMaterial color={DOUGH} roughness={0.78} /></mesh>
    <mesh position={[0, -len - r * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r * 0.85, 0.035, 6, 20, Math.PI]} /><meshStandardMaterial color={ICING} roughness={0.4} /></mesh>
  </group>
);
const Gingerbread: React.FC<GMProps> = ({x, y = GROUND, z = 0, rz = 0, ry = 0, s = 1, arm = 1.15, armL = -1.15, hammer, mug, scarf = '#c4313b', t}) => (
  <group position={[x, y, z]} rotation={[0, ry, rz]} scale={[s, s, s]}>
    <group scale={[1, 1, 0.46]}>
      {/* legs */}
      <group position={[-0.3, 0.92, 0]} rotation={[0, 0, -0.2]}><Limb len={0.42} r={0.25} /></group>
      <group position={[0.3, 0.92, 0]} rotation={[0, 0, 0.2]}><Limb len={0.42} r={0.25} /></group>
      {/* torso */}
      <mesh position={[0, 1.22, 0]}><capsuleGeometry args={[0.5, 0.45, 8, 20]} /><meshStandardMaterial color={DOUGH} roughness={0.78} /></mesh>
      {/* arms (pivot at the shoulder) */}
      <group position={[0.42, 1.52, 0]} rotation={[0, 0, arm]}>
        <Limb len={0.5} r={0.2} />
        {hammer && (
          <group position={[0, -0.82, 0.3]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}><cylinderGeometry args={[0.05, 0.05, 1.1, 10]} /><meshStandardMaterial color="#7a4b25" roughness={0.6} /></mesh>
            <mesh position={[0, 0, 0.8]} rotation={[0, 0, 0]}><cylinderGeometry args={[0.26, 0.26, 0.62, 18]} /><meshStandardMaterial color="#c98a4b" roughness={0.55} /></mesh>
          </group>
        )}
        {mug && <Mug p={[0, -0.85, 0.5]} t={t} />}
      </group>
      <group position={[-0.42, 1.52, 0]} rotation={[0, 0, armL]}><Limb len={0.5} r={0.2} /></group>
      {/* head */}
      <mesh position={[0, 2.08, 0]}><sphereGeometry args={[0.5, 28, 20]} /><meshStandardMaterial color={DOUGH} roughness={0.78} /></mesh>
      {/* icing face: eyes, smile, buttons */}
      {[-0.17, 0.17].map((ex) => <mesh key={ex} position={[ex, 2.18, 0.47]}><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color={ICING} roughness={0.3} /></mesh>)}
      <mesh position={[0, 2.0, 0.46]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.18, 0.033, 6, 20, Math.PI]} /><meshStandardMaterial color={ICING} roughness={0.3} /></mesh>
      {[['#d62f3a', 1.4], ['#2f9a52', 1.17], ['#f2c14e', 0.94]].map(([c, by]) => <mesh key={c as string} position={[0, by as number, 0.5]}><sphereGeometry args={[0.085, 14, 10]} /><meshStandardMaterial color={c as string} roughness={0.25} /></mesh>)}
      {/* scarf */}
      <mesh position={[0, 1.68, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.3]}><torusGeometry args={[0.34, 0.1, 10, 24]} /><meshStandardMaterial color={scarf} roughness={0.85} /></mesh>
      <mesh position={[0.2, 1.42, 0.38]} rotation={[0, 0, 0.25]}><boxGeometry args={[0.16, 0.42, 0.06]} /><meshStandardMaterial color={scarf} roughness={0.85} /></mesh>
    </group>
  </group>
);

const Mug: React.FC<{p: [number, number, number]; t: number}> = ({p, t}) => (
  <group position={p}>
    <mesh><cylinderGeometry args={[0.17, 0.15, 0.34, 18]} /><meshStandardMaterial color="#b3202c" roughness={0.35} /></mesh>
    <mesh position={[0.2, 0, 0]}><torusGeometry args={[0.09, 0.03, 6, 14]} /><meshStandardMaterial color="#b3202c" roughness={0.35} /></mesh>
    <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.15, 18]} /><meshStandardMaterial color="#4a0d14" roughness={0.2} /></mesh>
    {[0, 1, 2].map((k) => { const ph = ((t * 0.7 + k / 3) % 1); return <mesh key={k} position={[Math.sin(t * 2 + k) * 0.05, 0.25 + ph * 0.6, 0]} scale={0.06 + ph * 0.1}><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.35 * (1 - ph)} /></mesh>; })}
  </group>
);

/* ---------------- ice ---------------- */
const IceMat: React.FC<{frost: THREE.Texture; opacity?: number}> = ({frost, opacity = 0.5}) => (
  <meshPhysicalMaterial color="#c9f1ff" map={frost} transparent opacity={opacity} roughness={0.08} metalness={0.05} clearcoat={1} clearcoatRoughness={0.05} emissive="#2b7fa6" emissiveIntensity={0.35} depthWrite={false} />
);

/* a block that grows from the ground up (grow 0..1) */
const IceBlock: React.FC<{p: [number, number, number]; size: [number, number, number]; grow: number; frost: THREE.Texture; crack?: THREE.Texture; crackO?: number; shake?: number; opacity?: number}> = ({p, size, grow, frost, crack, crackO = 0, shake = 0, opacity = 0.5}) => {
  if (grow <= 0.001) return null;
  const [w, h, d] = size, hh = h * grow;
  return (
    <group position={[p[0] + shake, p[1] + hh / 2, p[2]]}>
      <mesh scale={[w, hh, d]}><boxGeometry args={[1, 1, 1]} /><IceMat frost={frost} opacity={opacity} /></mesh>
      <lineSegments scale={[w, hh, d]}><edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} /><lineBasicMaterial color="#effcff" transparent opacity={0.8 * opacity / 0.5} /></lineSegments>
      {crack && crackO > 0 && <mesh position={[0, 0, d / 2 + 0.01]}><planeGeometry args={[w, hh]} /><meshBasicMaterial map={crack} transparent opacity={crackO} depthWrite={false} /></mesh>}
    </group>
  );
};

/* shards flying out of a smashed block */
const Shards: React.FC<{t: number; t0: number; o: [number, number, number]; n: number; frost: THREE.Texture; spread?: number; white?: boolean}> = ({t, t0, o, n, frost, spread = 1, white}) => {
  if (t < t0) return null;
  const dt = t - t0;
  return (
    <group>
      {Array.from({length: n}).map((_, i) => {
        const vx = (rand(i * 3 + 1) - 0.5) * 6 * spread, vy = 1.5 + rand(i * 3 + 2) * 4.2, vz = (rand(i * 3 + 3) - 0.3) * 3 * spread;
        const sy = o[1] + rand(i + 9) * 1.6;
        let y = sy + vy * dt - 4.9 * dt * dt;
        const landed = y < GROUND + 0.05; if (landed) y = GROUND + 0.05;
        const tl = landed ? Math.min(dt, (vy + Math.sqrt(vy * vy + 19.6 * (sy - GROUND))) / 9.8) : dt;
        const s = (white ? 0.06 : 0.1) + rand(i + 40) * (white ? 0.08 : 0.2);
        return (
          <mesh key={i} position={[o[0] + vx * tl, y, o[2] + vz * tl]} rotation={[tl * vx * 2, tl * vy, tl * 3]} scale={s}>
            {white ? <icosahedronGeometry args={[1, 0]} /> : <tetrahedronGeometry args={[1, 0]} />}
            {white ? <meshStandardMaterial color="#ffffff" roughness={0.9} /> : <IceMat frost={frost} opacity={0.75} />}
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------------- market set ---------------- */
const Bude: React.FC<{x: number; z: number; t: number; i: number}> = ({x, z, t, i}) => (
  <group position={[x, GROUND, z]}>
    <mesh position={[0, 1.0, 0]}><boxGeometry args={[2.5, 2.0, 1.6]} /><meshStandardMaterial color="#4a2b1b" roughness={0.9} /></mesh>
    <mesh position={[0, 1.25, 0.81]}><planeGeometry args={[2.0, 0.9]} /><meshBasicMaterial color={['#ffb85c', '#ffcf7a', '#ff9f4a', '#ffd18c'][i % 4]} /></mesh>
    <mesh position={[0, 0.75, 0.95]}><boxGeometry args={[2.3, 0.1, 0.4]} /><meshStandardMaterial color="#6d4128" roughness={0.8} /></mesh>
    {[-1, 1].map((sd) => (
      <group key={sd}>
        <mesh position={[sd * 0.68, 2.35, 0]} rotation={[0, 0, -sd * 0.5]}><boxGeometry args={[1.6, 0.1, 1.9]} /><meshStandardMaterial color="#7a1f22" roughness={0.8} /></mesh>
        <mesh position={[sd * 0.66, 2.42, 0]} rotation={[0, 0, -sd * 0.5]}><boxGeometry args={[1.55, 0.08, 1.85]} /><meshStandardMaterial color="#f4f8ff" roughness={1} /></mesh>
      </group>
    ))}
    {Array.from({length: 9}).map((_, k) => {
      const u = k / 8 - 0.5, on = 0.6 + 0.4 * Math.sin(t * 3 + k * 1.7 + i);
      return <mesh key={k} position={[u * 2.4, 1.86 - Math.cos(u * Math.PI) * 0.12, 0.98]}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color={new THREE.Color('#ffd98a').multiplyScalar(on)} /></mesh>;
    })}
  </group>
);

const Riesenrad: React.FC<{t: number; p: [number, number, number]}> = ({t, p}) => (
  <group position={p}>
    {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 1.6, -2.8, 0]} rotation={[0, 0, sd * 0.32]}><boxGeometry args={[0.18, 6.4, 0.18]} /><meshStandardMaterial color="#3a3f55" metalness={0.6} roughness={0.4} /></mesh>)}
    <group rotation={[0, 0, t * 0.18]}>
      <mesh><torusGeometry args={[5, 0.07, 8, 80]} /><meshBasicMaterial color="#ffcf6e" /></mesh>
      <mesh><torusGeometry args={[4.6, 0.04, 6, 80]} /><meshBasicMaterial color="#b98a3a" /></mesh>
      {Array.from({length: 12}).map((_, k) => <mesh key={k} rotation={[0, 0, (k / 12) * Math.PI * 2]} position={[0, 0, 0]}><boxGeometry args={[0.05, 10, 0.05]} /><meshBasicMaterial color="#9b7a46" /></mesh>)}
      {Array.from({length: 12}).map((_, k) => {
        const a = (k / 12) * Math.PI * 2;
        return (
          <group key={k} position={[Math.cos(a) * 5, Math.sin(a) * 5, 0]} rotation={[0, 0, -t * 0.18]}>
            <mesh position={[0, -0.35, 0]}><boxGeometry args={[0.55, 0.45, 0.45]} /><meshStandardMaterial color={['#c4313b', '#2f6db5', '#e0a832', '#2f9a52'][k % 4]} emissive={['#c4313b', '#2f6db5', '#e0a832', '#2f9a52'][k % 4]} emissiveIntensity={0.5} /></mesh>
            <mesh><sphereGeometry args={[0.08, 8, 6]} /><meshBasicMaterial color="#fff3c4" /></mesh>
          </group>
        );
      })}
    </group>
  </group>
);

/* the nutcracker trader */
const Nussknacker: React.FC<{x: number; t: number; jaw: number; ry?: number}> = ({x, t, jaw, ry = 0.4}) => (
  <group position={[x, GROUND, -0.3]} rotation={[0, ry, 0]}>
    {[-0.2, 0.2].map((lx) => <mesh key={lx} position={[lx, 0.55, 0]}><cylinderGeometry args={[0.14, 0.14, 1.1, 12]} /><meshStandardMaterial color="#f3efe6" roughness={0.6} /></mesh>)}
    {[-0.2, 0.2].map((lx) => <mesh key={lx + 1} position={[lx, 0.1, 0.06]}><boxGeometry args={[0.3, 0.2, 0.42]} /><meshStandardMaterial color="#111" roughness={0.3} /></mesh>)}
    <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.45, 0.42, 1.1, 20]} /><meshStandardMaterial color="#b7182a" roughness={0.45} /></mesh>
    {[1.35, 1.6, 1.85].map((by) => <mesh key={by} position={[0, by, 0.44]}><sphereGeometry args={[0.06, 10, 8]} /><meshStandardMaterial color="#e5b84a" metalness={0.9} roughness={0.2} /></mesh>)}
    <mesh position={[0, 2.12, 0]}><cylinderGeometry args={[0.47, 0.47, 0.08, 20]} /><meshStandardMaterial color="#e5b84a" metalness={0.9} roughness={0.25} /></mesh>
    <mesh position={[0, 2.45, 0]}><cylinderGeometry args={[0.32, 0.32, 0.6, 20]} /><meshStandardMaterial color="#f1c9a5" roughness={0.6} /></mesh>
    {[-0.12, 0.12].map((ex) => <mesh key={ex} position={[ex, 2.55, 0.3]}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color="#111" /></mesh>)}
    <mesh position={[0, 2.25 - jaw * 0.12, 0.28]}><boxGeometry args={[0.42, 0.2, 0.12]} /><meshStandardMaterial color="#f7f7f7" roughness={0.9} /></mesh>
    <mesh position={[0, 2.38, 0.33]}><boxGeometry args={[0.3, 0.05, 0.05]} /><meshStandardMaterial color="#5a1010" /></mesh>
    <mesh position={[0, 3.05, 0]}><cylinderGeometry args={[0.34, 0.34, 0.7, 20]} /><meshStandardMaterial color="#141414" roughness={0.4} /></mesh>
    <mesh position={[0, 2.78, 0]}><cylinderGeometry args={[0.36, 0.36, 0.08, 20]} /><meshStandardMaterial color="#e5b84a" metalness={0.9} roughness={0.25} /></mesh>
    {/* the beckoning arm */}
    <group position={[0.45, 2.0, 0]} rotation={[0, 0, 0.9 + Math.sin(t * 6) * 0.25]}>
      <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.11, 0.11, 0.8, 10]} /><meshStandardMaterial color="#b7182a" roughness={0.45} /></mesh>
      <mesh position={[0, -0.85, 0]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#f3efe6" /></mesh>
    </group>
  </group>
);

/* the crushed-ice counter (etw. auf Eis legen) */
const IceCounter: React.FC<{y: number}> = ({y}) => {
  const cubes = useMemo(() => Array.from({length: 150}).map((_, i) => ({x: (rand(i) - 0.5) * 3.1, z: (rand(i + 500) - 0.5) * 1.2, h: rand(i + 900) * 0.12, r: rand(i + 77) * 3, s: 0.07 + rand(i + 33) * 0.07})), []);
  return (
    <group position={[0, y, 0.3]}>
      <mesh position={[0, -0.4, 0]}><boxGeometry args={[3.5, 0.8, 1.5]} /><meshStandardMaterial color="#c7d2da" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[3.4, 0.06, 1.4]} /><meshStandardMaterial color="#e9f6ff" roughness={0.6} /></mesh>
      {cubes.map((c, i) => <mesh key={i} position={[c.x, 0.08 + c.h, c.z]} rotation={[c.r, c.r * 1.3, c.r * 0.7]} scale={c.s}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#dff6ff" roughness={0.15} transparent opacity={0.85} emissive="#3d8fb5" emissiveIntensity={0.2} /></mesh>)}
      {[-1.3, 1.25].map((lx, k) => <mesh key={k} position={[lx, 0.18, 0.35]} rotation={[-1.2, 0, k]}><cylinderGeometry args={[0.2, 0.2, 0.05, 20]} /><meshStandardMaterial color="#f5d23c" roughness={0.5} /></mesh>)}
    </group>
  );
};

/* falling snow (deterministic) */
const Snow: React.FC<{t: number; dot: THREE.Texture}> = ({t, dot}) => {
  const N = 900;
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const H = 11, sp = 0.35 + rand(i + 7) * 0.4;
    pos[i * 3] = (rand(i) - 0.5) * 18 + Math.sin(t * 0.8 + i) * 0.25;
    pos[i * 3 + 1] = 8 - ((rand(i + 1) * H + t * sp) % H);
    pos[i * 3 + 2] = -14 + rand(i + 2) * 18;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return <points geometry={geo}><pointsMaterial map={dot} size={0.09} transparent depthWrite={false} color="#ffffff" opacity={0.9} /></points>;
};

/* ---------------- states ---------------- */
const gm = (t: number) => {
  let x = 0, y = GROUND, rz = 0, ry = 0, arm = 1.15, armL = -1.15;
  const sEis = A.eis(), sF = A.fuesse(), sL = A.legenS(), sG = A.glattS(), sS = A.schneeS();
  if (t >= sEis && t < sF) {
    x = lerp(-1.2, -0.55, prog(t, A.gluehwein() - 0.3, 0.6));
    // hammer: wind up, slam on "brechen"
    const up = prog(t, A.brechen() - 0.75, 0.5), down = clamp((t - (A.brechen() - 0.12)) / 0.12);
    arm = lerp(lerp(1.15, 3.0, up), 1.55, down);
    if (t > A.gluehwein() - 0.4) arm = lerp(1.55, 2.2, prog(t, A.gluehwein() - 0.4, 0.4));
    if (t > A.gluehwein() + 0.6) arm = 2.2 + Math.sin((t - A.gluehwein()) * 3) * 0.08;
  }
  if (t >= sF && t < sL) {
    x = lerp(-0.55, 0, prog(t, sF, 0.6));
    arm = lerp(2.2, 1.0, prog(t, sF, 0.5)); armL = -1.0;
    if (t > A.fuesseW()) { rz = Math.sin(t * 45) * 0.03; arm = 0.6 + Math.sin(t * 40) * 0.05; armL = -0.6 - Math.sin(t * 40) * 0.05; }
  }
  if (t >= sL && t < sG) {
    const lift = prog(t, A.legen() - 0.35, 0.5);
    rz = lerp(0, Math.PI / 2, lift);
    y = lerp(GROUND, GROUND + 1.27, lift);
    x = lerp(0, 1.05, lift);
    arm = 1.4; armL = -1.4;
    if (t > A.legen() + 0.2) rz += Math.sin(t * 38) * 0.02;
  }
  if (t >= sG && t < sS) {
    const stand = prog(t, sG, 0.5);
    rz = lerp(Math.PI / 2, 0, stand); y = lerp(GROUND + 1.27, GROUND, stand);
    x = lerp(1.05, -0.9, stand);
    const slide = prog(t, A.glatt() - 0.1, Math.max(0.6, A.glatteis() - A.glatt() + 0.2));
    x = lerp(x, 0, slide);
    const spinUp = clamp((t - A.glatt()) / 1.6);
    ry = t > A.glatt() ? (t - A.glatt()) * 7 * spinUp : 0;
    const settle = prog(t, A.fuehren() + 0.4, 0.8);
    ry = lerp(ry, Math.round(ry / (Math.PI * 2)) * Math.PI * 2, settle);
    if (settle >= 1) ry = 0;
    arm = lerp(1.15, 2.4, slide); armL = lerp(-1.15, -2.4, slide);
    rz += slide < 1 ? Math.sin(t * 12) * 0.12 * slide : 0;
  }
  if (t >= sS) {
    const free = prog(t, A.schnee(), 0.4);
    arm = lerp(2.4, 2.9, free); armL = lerp(-2.4, -2.9, free);
    const hop = (t0: number) => (t > t0 && t < t0 + 0.55 ? Math.sin(((t - t0) / 0.55) * Math.PI) * 0.5 : 0);
    y = GROUND + hop(A.schnee() + 0.2) + hop(A.schnee2()) + hop(A.aufgetaut());
    if (t > A.outro()) { arm = lerp(2.9, 1.15, prog(t, A.morgen(), 0.6)); armL = lerp(-2.9, -1.15, prog(t, A.morgen(), 0.6)); }
    if (t > A.morgen() + 0.6) arm = 1.15 + Math.sin(t * 5) * 0.4; // waves
  }
  return {x, y, rz, ry, arm, armL};
};

/* how much the big block around him has grown */
const blockGrow = (t: number) => {
  if (t < A.eis()) return 1 - prog(t, A.eis() - 0.45, 0.4); // hook: full, then rewinds
  if (t >= A.glattS() && t < A.schnee()) return prog(t, A.fuehren() - 0.05, 0.9);
  if (t >= A.outro()) return 0.45 * prog(t, END - 1.3, 1.2); // frost creeps back for the loop
  return 0;
};

/* camera = world group keyframes */
type K = {x: number; y: number; s: number; rx: number; ry: number};
const HOOK: K = {x: 0, y: -0.1, s: 1.14, rx: 0.1, ry: -0.32};
const cam = (t: number): K => {
  const mix = (a: K, b: K, k: number): K => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k), rx: lerp(a.rx, b.rx, k), ry: lerp(a.ry, b.ry, k)});
  let k: K = mix(HOOK, {x: 0, y: -0.2, s: 1.26, rx: 0.12, ry: 0.12}, prog(t, 0, Math.max(1, A.eis() - 0.5)));
  k = mix(k, {x: 0, y: 0.0, s: 0.98, rx: 0.06, ry: 0.0}, prog(t, A.eis() - 0.4, 0.4));
  k = mix(k, {x: 0.25, y: 0.1, s: 1.12, rx: 0.08, ry: -0.08}, prog(t, A.brechen() - 0.2, 0.25));
  k = mix(k, {x: 0, y: 0, s: 1.0, rx: 0.05, ry: 0.12}, prog(t, A.gluehwein(), 1.0));
  k = mix(k, {x: 0, y: 0.75, s: 1.3, rx: 0.3, ry: 0.15}, prog(t, A.fuesseW() - 0.2, 0.5));
  k = mix(k, {x: 0, y: -0.35, s: 0.92, rx: -0.04, ry: -0.18}, prog(t, A.riesen() - 0.2, 0.9));
  k = mix(k, {x: -0.1, y: 0.25, s: 1.1, rx: 0.38, ry: 0.12}, prog(t, A.legenS() - 0.1, 0.8));
  k = mix(k, {x: 0, y: 0.1, s: 1.2, rx: 0.32, ry: -0.08}, prog(t, A.fest(), 1.2));
  k = mix(k, {x: 0, y: 0.0, s: 0.95, rx: 0.2, ry: -0.12}, prog(t, A.glattS() - 0.1, 0.8));
  k = mix(k, HOOK, prog(t, A.fuehren() + 0.2, 1.3));
  k = mix(k, {x: 0, y: -0.1, s: 1.05, rx: 0.12, ry: 0.0}, prog(t, A.schnee() - 0.1, 0.6));
  k = mix(k, HOOK, prog(t, A.outro(), 1.5));
  return {...k, y: k.y - 1.05, s: k.s * 1.16, ry: k.ry + Math.sin(t * 0.6) * 0.02};
};

/* how frozen the world feels (screen frost) */
const frostLevel = (t: number) => {
  if (t < A.eis()) return 1 - prog(t, A.eis() - 0.45, 0.4);
  let f = 0.15 * prog(t, A.fuesseW(), 0.5) + 0.2 * prog(t, A.legen(), 0.5) + 0.65 * prog(t, A.fuehren(), 0.9);
  f *= 1 - prog(t, A.schnee(), 0.5);
  if (t > A.outro()) f = 0.8 * prog(t, END - 1.3, 1.2);
  return f;
};

/* ---------------- 3D world ---------------- */
const World: React.FC<{t: number}> = ({t}) => {
  const frost = useFrost(), crack = useCrack(), dot = useDot(), sky = useSky();
  const g = gm(t);
  const c = cam(t);
  const grow = blockGrow(t);
  // the little ice wall between the two in "das Eis brechen"
  const wallUp = prog(t, A.eis() + 0.05, 0.35);
  const wallOn = t >= A.eis() && t < A.brechen();
  // frozen feet
  const feet = t >= A.fuesse() && t < A.legen() + 0.2 ? prog(t, A.fuesseW() - 0.05, 0.45) * (1 - prog(t, A.legen() - 0.2, 0.3)) : 0;
  // ice counter slides in / out
  const counterY = lerp(-4.5, GROUND + 0.8, prog(t, A.legenS() - 0.1, 0.6)) - 4 * prog(t, A.glattS(), 0.5);
  // rink
  const rink = t >= A.glattS() ? prog(t, A.glattS(), 0.5) : 0;
  // the trader
  const nkIn = prog(t, A.glattS() + 0.05, 0.5), nkOut = prog(t, A.schneeS(), 0.6);
  const nkX = lerp(-4.5, -1.95, nkIn) - 3 * nkOut;
  const jaw = t > A.haendler() - 0.2 && t < A.nachger() + 0.5 ? Math.abs(Math.sin(t * 14)) : Math.abs(Math.sin(t * 3)) * 0.3;
  // the partner in "Eis brechen"
  const partnerX = t < A.eis() ? 8 : lerp(1.25, 0.6, prog(t, A.gluehwein() - 0.3, 0.6)) + 5 * prog(t, A.fuesse(), 0.7);
  // Riesenrad comes closer on "Riesenrad"
  const rr = prog(t, A.riesen() - 0.2, 1.0) * (1 - prog(t, A.legenS(), 0.8));
  const rrPos: [number, number, number] = [lerp(3.2, 1.6, rr), lerp(4.2, 4.4, rr), lerp(-19, -9.5, rr)];
  // crack + burst of the block
  const crackO = prog(t, A.eisblock() - 0.1, 0.3);
  const shake = t > A.eisblock() && t < A.schnee() ? Math.sin(t * 70) * 0.04 : 0;
  const blockO = t >= A.schneeS() ? 0.5 * (1 - prog(t, A.schnee() - 0.05, 0.15)) : 0.5;
  const heap = prog(t, A.schnee() + 0.4, 0.8) * (t >= A.outro() ? 1 - prog(t, END - 1.3, 1.0) * 0.5 : 1);
  const warmth = 1 + 1.2 * prog(t, A.schnee(), 0.8) * (1 - prog(t, END - 1.3, 1.2));
  return (
    <>
      <color attach="background" args={[NIGHT]} />
      <mesh position={[0, 6, -42]}><planeGeometry args={[110, 110]} /><meshBasicMaterial map={sky} /></mesh>
      <ambientLight intensity={0.45} color="#8fa6d8" />
      <hemisphereLight args={['#9fb6e8', '#2a1a12', 0.5]} />
      <directionalLight position={[-5, 8, 9]} intensity={1.0} color="#b9cdf5" />
      <directionalLight position={[4, 3, 10]} intensity={0.5} color="#ffd6a8" />
      <pointLight position={[0, 1.5, -4]} intensity={9 * warmth} distance={14} color="#ffae5a" />
      <pointLight position={[0, 3, 4]} intensity={3} distance={12} color="#cfefff" />
      <group position={[c.x, c.y, 0]} scale={c.s}>
        <group rotation={[c.rx, c.ry, 0]}>
          {/* ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND, -6]}><planeGeometry args={[60, 40]} /><meshStandardMaterial color="#dbe6f5" roughness={0.95} /></mesh>
          <Riesenrad t={t} p={rrPos} />
          {[-5.2, -2.1, 1.0, 4.1].map((bx, i) => <Bude key={i} x={bx} z={-6.5 - (i % 2) * 0.6} t={t} i={i} />)}
          {/* string of lights across the square */}
          {Array.from({length: 26}).map((_, k) => { const u = k / 25 - 0.5; const on = 0.55 + 0.45 * Math.sin(t * 2.4 + k * 0.9); return <mesh key={k} position={[u * 11, 3.8 - Math.cos(u * Math.PI) * 0.6, -3.2]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color={new THREE.Color(k % 3 === 0 ? '#ffdf9a' : '#ffbf66').multiplyScalar(on * Math.min(1.3, warmth))} /></mesh>; })}
          <Snow t={t} dot={dot} />

          {/* ice rink (Glatteis) */}
          {rink > 0 && (
            <group position={[0, GROUND + 0.02, 0]} scale={[rink, 1, rink]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.4, 48]} /><meshPhysicalMaterial color="#9fe3ff" roughness={0.04} metalness={0.3} clearcoat={1} emissive="#1f6c8f" emissiveIntensity={0.35} /></mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><torusGeometry args={[2.45, 0.09, 8, 48]} /><meshStandardMaterial color="#ffffff" roughness={1} /></mesh>
            </group>
          )}

          {/* crushed-ice counter */}
          {counterY > -4.4 && <IceCounter y={counterY} />}

          {/* partner for "das Eis brechen" */}
          {t >= A.eis() && t < A.legenS() && <Gingerbread x={partnerX} t={t} s={0.9} scarf="#e86fa0" ry={-0.25} arm={1.15} armL={t > A.gluehwein() - 0.4 ? lerp(-1.15, -2.2, prog(t, A.gluehwein() - 0.4, 0.4)) : -1.15} mug={false} />}
          {t >= A.gluehwein() - 0.1 && t < A.legenS() && <Mug p={[partnerX - 0.95, GROUND + 2.05, 0.35]} t={t} />}

          {/* the hero */}
          <Gingerbread x={g.x} y={g.y} rz={g.rz} ry={g.ry} arm={g.arm} armL={g.armL} t={t} hammer={t >= A.eis() && t < A.gluehwein() - 0.3} mug={t >= A.gluehwein() - 0.3 && t < A.fuesse()} />

          {/* ice wall between the two, smashed on "brechen" */}
          {wallOn && <IceBlock p={[0.1, GROUND, 0.1]} size={[0.75, 2.5, 0.9]} grow={wallUp} frost={frost} />}
          {t >= A.eis() && t < A.fuesse() && <Shards t={t} t0={A.brechen()} o={[0.1, GROUND + 0.4, 0.1]} n={34} frost={frost} />}

          {/* frozen feet */}
          {feet > 0 && [-0.32, 0.32].map((fx) => <IceBlock key={fx} p={[g.x + fx, GROUND, 0.05]} size={[0.72, 0.75, 0.7]} grow={feet} frost={frost} opacity={0.68} />)}

          {/* the big block (hook, Glatteis, loop) */}
          <IceBlock p={[g.x, GROUND, 0]} size={[2.05, 2.85, 1.15]} grow={grow} frost={frost} crack={crack} crackO={t >= A.glattS() && t < A.outro() ? crackO : 0} shake={shake} opacity={t < A.outro() ? blockO * 1.2 : 0.6} />
          <Shards t={t} t0={A.schnee()} o={[0, GROUND + 0.3, 0]} n={t < A.outro() + 3 ? 120 : 0} frost={frost} spread={0.8} white />
          {heap > 0 && <mesh position={[0, GROUND - 0.05, 0.5]} scale={[1.6 * heap, 0.35 * heap, 0.7 * heap]}><sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#ffffff" roughness={1} /></mesh>}

          {/* the trader */}
          {nkIn > 0 && nkOut < 1 && <Nussknacker x={nkX} t={t} jaw={jaw} />}
        </group>
      </group>
    </>
  );
};

/* ---------------- 2D overlays ---------------- */
const IDIOMS = [
  {key: 'eis', w: 'das Eis brechen', en: 'to break the ice', name: 's03', ex: 's04'},
  {key: 'fuesse', w: 'kalte Füße bekommen', en: 'to get cold feet', name: 's05', ex: 's06'},
  {key: 'eislegen', w: 'etw. auf Eis legen', en: 'to put s.th. on ice, to shelve s.th.', name: 's07', ex: 's08'},
  {key: 'glatteis', w: 'jdn. aufs Glatteis führen', en: 'to lead s.o. up the garden path, to trick s.o.', name: 's09', ex: 's10'},
  {key: 'schnee', w: 'Schnee von gestern', en: 'old news, water under the bridge', name: 's11', ex: 's12'},
];

/* five ice cubes: the open loop. The fifth one is a "?" until it melts everything */
const Meter: React.FC<{t: number}> = ({t}) => {
  if (t < A.fuenf() - 0.1 || t > A.outro() + 0.3) return null;
  const cur = IDIOMS.findIndex((d) => t >= scene(d.key).start && t < scene(d.key).end);
  const o = clamp((A.outro() + 0.3 - t) / 0.3);
  return (
    <div style={{position: 'absolute', right: SAFE.side, top: SAFE.top + 4, display: 'flex', gap: 12, opacity: o}}>
      {IDIOMS.map((d, i) => {
        const shown = t > A.fuenf() + i * 0.08;
        const done = t >= scene(d.key).start, active = i === cur, last = i === 4;
        const melted = last && t > A.schnee();
        const bg = melted ? 'rgba(255,255,255,.95)' : done ? 'rgba(142,232,255,.85)' : 'rgba(142,232,255,.16)';
        return (
          <Pop key={i} show={A.fuenf() + i * 0.08}>
            <div style={{width: 58, height: 58, borderRadius: melted ? 29 : 10, background: bg, border: `3px solid ${active ? '#fff' : 'rgba(142,232,255,.7)'}`,
              boxShadow: active ? `0 0 22px ${ACC}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: shown ? 1 : 0,
              fontFamily: HEAD, fontSize: 34, color: done ? '#07203a' : ACC, transform: active ? 'scale(1.12)' : 'none'}}>
              {last && !done ? '?' : i + 1}
            </div>
          </Pop>
        );
      })}
    </div>
  );
};

const Top: React.FC<{t: number}> = ({t}) => {
  const hookEnd = A.eis();
  if (t < hookEnd) {
    const o = clamp((hookEnd - 0.1 - t) / 0.3);
    const wob = Math.sin(t * 9) * 2;
    return (
      <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, top: SAFE.top + 70, opacity: o}}>
        <div style={{fontFamily: HEAD, fontSize: 138, color: '#f2fdff', letterSpacing: 2, lineHeight: 1, transform: `rotate(${-2 + wob * 0.2}deg)`,
          textShadow: `0 0 28px ${ACC}, 0 6px 0 #0b3550, 0 10px 30px rgba(0,0,0,.7)`, WebkitTextStroke: `3px ${ACC}`}}>EINGEFROREN?</div>
        <div style={{marginTop: 26, textShadow: '0 3px 18px rgba(0,0,0,.9)'}}>
          {t < at('s02', 0) - 0.1
            ? <Spoken line={line('s01')} size={52} font={TITLE} weight={700} />
            : <Spoken line={line('s02')} size={52} font={TITLE} weight={700} color="#e9fbff" />}
        </div>
      </div>
    );
  }
  const O = A.outro();
  if (t >= O) {
    return (
      <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, top: SAFE.top + 70}}>
        <Pop show={A.aufgetaut() - 0.05}>
          <div style={{fontFamily: HEAD, fontSize: 138, color: '#fff7e8', lineHeight: 1, transform: 'rotate(-2deg)', textShadow: '0 0 30px rgba(255,190,110,.9), 0 6px 0 #5a2c10, 0 10px 30px rgba(0,0,0,.7)'}}>AUFGETAUT.</div>
        </Pop>
        <div style={{marginTop: 26, textShadow: '0 3px 18px rgba(0,0,0,.9)'}}>
          {t > A.morgen() - 0.1 && <Spoken line={line('s13')} skip={1} size={50} font={TITLE} weight={700} color="#e9fbff" />}
        </div>
      </div>
    );
  }
  const I = IDIOMS.find((d) => t >= scene(d.key).start && t < scene(d.key).end);
  if (!I) return null;
  const S = scene(I.key);
  const o = clamp((S.end - t) / 0.25);
  // the idiom itself appears from its first content word (skip the lead-in like "Erstens:")
  const lead = I.key === 'glatteis' ? 2 : I.key === 'schnee' ? 3 : 1;
  const intro = I.key === 'glatteis' ? 'Und jetzt …' : I.key === 'schnee' ? 'Und der Eisblock?' : null;
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, top: SAFE.top + 90, opacity: o, textShadow: '0 4px 22px rgba(0,0,0,.9)'}}>
      {intro && t < at(I.name, lead) - 0.05 && (
        <div style={{fontFamily: TITLE, fontStyle: 'italic', fontSize: 50, color: ACC, fontWeight: 700}}><Pop show={at(I.name, 0) - 0.05}>{intro}</Pop></div>
      )}
      {t >= at(I.name, lead) - 0.1 && (
        <Pop show={at(I.name, lead) - 0.08}>
          <div style={{fontFamily: TITLE, fontSize: 80, fontWeight: 800, color: '#ffffff', lineHeight: 1.04}}>{I.w}</div>
          <div style={{height: 8, width: 220, background: ACC, borderRadius: 4, marginTop: 16, boxShadow: `0 0 16px ${ACC}`}} />
        </Pop>
      )}
    </div>
  );
};

/* "rewind" flash between the hook (end state) and the start of the story */
const Rewind: React.FC<{t: number}> = ({t}) => {
  const t0 = A.eis() - 0.5, d = t - t0;
  if (d < 0 || d > 0.65) return null;
  const o = Math.sin((d / 0.65) * Math.PI);
  return (
    <AbsoluteFill style={{opacity: o}}>
      {Array.from({length: 14}).map((_, i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: ((i * 137 + d * 3000) % 1920), height: 6 + rand(i) * 18, background: 'rgba(220,245,255,.35)'}} />)}
      <div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: HEAD, fontSize: 150, color: '#fff', textShadow: `0 0 30px ${ACC}`}}>◀◀</div>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const fr = frostLevel(t);
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      <Audio src={staticFile('laneB/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 13], fov: 40}} gl={{antialias: true}}>
        <World t={t} />
      </ThreeCanvas>

      {/* vignette for the title and the card */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,6,20,.8) 0%, rgba(4,6,20,.2) 27%, rgba(4,6,20,0) 55%, rgba(4,6,20,.35) 100%)'}} />
      {/* screen frost: grows the more frozen the world is */}
      <AbsoluteFill style={{opacity: fr, background: 'radial-gradient(ellipse at 50% 50%, rgba(190,240,255,0) 52%, rgba(190,240,255,.28) 78%, rgba(235,250,255,.62) 100%)'}} />

      <Top t={t} />
      <Meter t={t} />
      <Rewind t={t} />

      {IDIOMS.map((I) => (
        <Card key={I.key} from={at(I.ex, 0) - 0.25} to={scene(I.key).end - 0.05} label="Zum Beispiel" accent={ACC} bg="rgba(6,10,30,.88)">
          <Spoken line={line(I.ex)} size={46} font={UI} weight={600} color="#f2fbff" />
          <div style={{fontFamily: UI, fontSize: 30, color: 'rgba(200,230,245,.75)', marginTop: 14, fontStyle: 'italic'}}>EN: {I.en}</div>
        </Card>
      ))}

      {t > A.cta() - 0.3 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: SAFE.bottom + 40, display: 'flex', justifyContent: 'center'}}>
          <FollowCTA show={A.cta()} accent="#2b8fbf" />
        </div>
      )}
      {void TIM}
    </AbsoluteFill>
  );
};
