/* idiom-weihnachtsmarkt-03: "Vier Bilder. Nur eins passiert wirklich."
   A turned-wood toy man (Erzgebirge style) at the office Christmas party in front of a Glühwein stall.
   Frame 0 is the flash-forward: he hangs head first in a giant Glühwein mug, legs kicking ("zu tief ins Glas geschaut").
   Rewind, then the evening in four idioms acted out literally: a bowl of fat, a shoulder that freezes to ice,
   the dive into the mug, and the crowd that stomps on his foot. Twist: the last one is no picture, it really happens.
   The outro ends with him back in the mug: the last frame rhymes with the first. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneJ-timings.json';
import {makeTiming, Spoken, FollowCTA, Card, SAFE, NB, rand, clamp, prog, ease, Timings} from '../lib/kit';

const TT = T as unknown as Timings;
const {line, scene} = makeTiming(TT);
export const FRAMES = Math.ceil((TT.duration + 0.3) * 30);

const ACC = '#ff9f1c';
const HEAD = '"Trebuchet MS", "Segoe UI", sans-serif';
const SERIF = 'Georgia, "Palatino Linotype", serif';
const BLACK = '"Arial Black", Impact, sans-serif';
const GROUND = -1.7;
const PI = Math.PI;

/* word time by prefix (robust against transcription splits) */
const wAt = (id: string, pre: string) => {
  const ws = line(id).words;
  const w = ws.find((x) => x.w.toLowerCase().replace(/[^a-zäöüß]/g, '').startsWith(pre));
  return (w ?? ws[0]).s;
};
const first = (id: string) => line(id).words[0].s;
const last = (id: string) => line(id).words[line(id).words.length - 1].e;

const K = {
  rew0: first('s02'), rew1: last('s02'),
  fett: scene('fett').start, step: wAt('s03', 'treten'), q1: last('s03'), ex1: first('s04'),
  sch: scene('schulter').start, turn: wAt('s05', 'kalte'), ice: wAt('s05', 'schulter'), q2: last('s05'), ex2: first('s06'),
  glas: scene('glas').start, ex3: first('s07'), dive: wAt('s07', 'tief'),
  fu: scene('fuesse').start, stomp1: wAt('s08', 'treten'), q4: last('s08'), real: first('s09'), ex4: wAt('s09', 'im'), stomp2: wAt('s09', 'getreten'),
  out: scene('outro').start, cta: first('s11'),
};

/* ---------- small math ---------- */
type V3 = [number, number, number];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const seg = (t: number, keys: [number, number][]) => { // piecewise eased scalar
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], ease((t - keys[i - 1][0]) / Math.max(0.001, keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};

/* ---------- camera rig (the camera prop is read once, so the world group moves) ---------- */
type Cam = {s: number; x: number; y: number};
const H: Cam = {s: 1.25, x: 0, y: -0.9};   // hook / mug framing
const D: Cam = {s: 1.15, x: 0, y: 0.0};
const F: Cam = {s: 1.3, x: 0.85, y: 0.24};
const S: Cam = {s: 1.2, x: -0.05, y: 0.07};
const P: Cam = {s: 1.3, x: -0.05, y: 0.24};
const camAt = (t: number): Cam => {
  const keys: [number, Cam][] = [[0, H], [K.rew0, H], [K.rew1, D], [K.step - 0.7, D], [K.step - 0.15, F], [K.sch, F], [K.sch + 0.6, S],
    [K.glas, S], [K.glas + 0.6, H], [K.fu, H], [K.fu + 0.7, P], [K.out, P], [K.out + 0.9, H]];
  const c = {s: seg(t, keys.map(([a, b]) => [a, b.s])), x: seg(t, keys.map(([a, b]) => [a, b.x])), y: seg(t, keys.map(([a, b]) => [a, b.y]))};
  const shake = [K.stomp1, K.stomp2].reduce((acc, ts) => acc + (t > ts && t < ts + 0.4 ? Math.sin((t - ts) * 70) * 0.06 * (1 - (t - ts) / 0.4) : 0), 0);
  return {...c, y: c.y + shake, s: c.s + 0.012 * Math.sin(t * 0.7)};
};

/* ---------- hero pose ---------- */
type Pose = {x: number; y: number; z: number; rz: number; ry: number; kick: number; flat: number; sink: number; blue: number; arms: number; shiver: number; stars: number};
const N0 = {x: -1.4, y: GROUND, z: 0.25};
const STAND = {x: -0.75, y: GROUND, z: 0.25};
const GP = {x: 0, y: 1.8, z: -0.3};
const P0 = {x: 0, y: GROUND, z: 0.35};
const arc = (a: {x: number; y: number; z: number}, b: {x: number; y: number; z: number}, k: number, h: number) =>
  ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) + Math.sin(PI * k) * h, z: lerp(a.z, b.z, k)});

const heroAt = (t: number): Pose => {
  const base: Pose = {x: 0, y: 0, z: 0, rz: 0, ry: 0, kick: 0, flat: 1, sink: 0, blue: 0, arms: 0, shiver: 0, stars: 0};
  const inMug = (): Pose => ({...base, ...GP, rz: PI + 0.12 * Math.sin(t * 3), kick: 1, arms: 0.05});
  if (t < K.rew0) return inMug();
  if (t < K.fett) { // rewind: fly backwards out of the mug
    const k = prog(t, K.rew0, Math.max(0.4, K.rew1 - K.rew0 - 0.2));
    return {...base, ...arc(GP, N0, k, 0.9), rz: PI * (1 - k), kick: 1 - k, arms: 1 - k};
  }
  if (t < K.sch) { // walk into the bowl of fat, then slip and wobble
    if (t < K.step) {
      const k = prog(t, K.fett, K.step - K.fett);
      return {...base, x: lerp(N0.x, STAND.x, k), y: GROUND + Math.abs(Math.sin(t * 11)) * 0.06 * (k < 1 ? 1 : 0), z: N0.z, rz: Math.sin(t * 11) * 0.05};
    }
    const d = t - K.step;
    return {...base, ...STAND, sink: Math.min(1, d * 6), rz: 0.32 * Math.exp(-2.2 * d) * Math.sin(d * 15) + 0.07 * Math.sin(t * 4.5),
      arms: 0.4 + 1.1 * Math.abs(Math.sin(d * 8)) * Math.exp(-0.6 * d), x: STAND.x + 0.05 * Math.sin(d * 7) * Math.exp(-d)};
  }
  if (t < K.glas) { // cold shoulder: he freezes and shivers
    const k = prog(t, K.sch, 0.5);
    const blue = prog(t, K.ice + 0.3, 1.0);
    return {...base, x: lerp(STAND.x, -0.95, k), y: GROUND, z: STAND.z, sink: 1 - k, blue, shiver: blue, ry: 0.35 * blue, arms: 0.15 * blue};
  }
  if (t < K.fu) { // the dive into the mug
    const j0 = Math.min(K.glas + 0.55, K.dive - 0.5), k = prog(t, j0, 0.65);
    if (k <= 0) return {...base, x: -0.95, y: GROUND, z: STAND.z, blue: 1 - prog(t, K.glas, 0.4), arms: 0.6 * prog(t, K.glas, 0.4)};
    const p = arc({x: -0.95, y: GROUND, z: STAND.z}, GP, k, 1.0);
    return k < 1 ? {...base, ...p, rz: PI * k, arms: 1.2, kick: k} : inMug();
  }
  if (t < K.out + 0.25) { // out of the mug, into the crowd; stomped twice
    const k = prog(t, K.fu, 0.6);
    let p: Pose = k < 1 ? {...base, ...arc(GP, P0, k, 0.7), rz: PI * (1 - k), kick: 1 - k, arms: 1} : {...base, ...P0};
    let flat = 1, stars = 0;
    for (const ts of [K.stomp1, K.stomp2]) {
      const d = t - ts;
      if (d > 0) {
        flat = Math.min(flat, d < 0.12 ? 1 - 0.65 * (d / 0.12) : 0.35 + 0.65 * clamp((d - 1.4) / 0.6));
        if (d < 0.55) p = {...p, y: p.y + Math.sin(PI * d / 0.55) * 0.4, rz: -0.25 * Math.sin(PI * d / 0.55), arms: 1.4};
        if (d < 2.2) stars = Math.max(stars, 1 - d / 2.2);
      }
    }
    return {...p, flat, stars, rz: p.rz + 0.04 * Math.sin(t * 5)};
  }
  // outro: back into the mug (loop to frame 0)
  const k = prog(t, K.out + 0.25, 0.7);
  return k < 1 ? {...base, ...arc(P0, GP, k, 1.0), rz: PI * k, arms: 1.2, kick: k} : inMug();
};

const mugScale = (t: number) => seg(t, [[0, 1], [K.rew0, 1], [K.rew1 - 0.2, 0.22], [K.glas + 0.1, 0.22], [K.glas + 0.6, 1], [K.fu, 1], [K.fu + 0.45, 0.22], [K.out, 0.22], [K.out + 0.45, 1]]);

/* ---------- textures ---------- */
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(...repeat); }
  return tex;
};
const useTextures = () => useMemo(() => ({
  planks: canvasTex(1024, 512, (g) => {
    for (let i = 0; i < 16; i++) {
      const v = 70 + rand(i) * 30;
      g.fillStyle = `rgb(${v + 40},${v},${v * 0.55})`; g.fillRect(i * 64, 0, 64, 512);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 64, 0, 4, 512);
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(40,20,5,.18)'; g.fillRect(i * 64 + 8 + rand(i * 9 + k) * 48, 0, 2, 512); }
    }
  }),
  stripes: canvasTex(512, 128, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f3e7cf' : '#b8202f'; g.fillRect(i * 64, 0, 64, 128); } }),
  sign: canvasTex(1024, 256, (g) => {
    g.fillStyle = '#2a170c'; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = '#e8b04a'; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
    g.fillStyle = '#ffd27a'; g.font = 'bold 150px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Glühwein', 512, 136);
  }),
  cobble: canvasTex(512, 512, (g) => {
    g.fillStyle = '#2b2f36'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const v = 70 + rand(x * 13 + y * 7) * 40;
      g.fillStyle = `rgb(${v},${v + 4},${v + 12})`;
      g.beginPath(); g.ellipse(x * 64 + 32 + (y % 2) * 16, y * 64 + 32, 27, 25, 0, 0, PI * 2); g.fill();
      if (rand(x * 3 + y * 11) > 0.6) { g.fillStyle = 'rgba(235,242,255,.75)'; g.beginPath(); g.ellipse(x * 64 + 30, y * 64 + 22, 18, 8, 0, 0, PI * 2); g.fill(); }
    }
  }, [6, 4]),
  mug: canvasTex(1024, 512, (g) => {
    g.fillStyle = '#a3132c'; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#f6efe2'; g.fillRect(0, 70, 1024, 22); g.fillRect(0, 420, 1024, 22);
    g.fillStyle = '#f6efe2'; g.font = 'italic bold 92px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Weihnachtsmarkt', 256, 260);
    g.fillText('Weihnachtsmarkt', 768, 260);
    for (let i = 0; i < 16; i++) { g.save(); g.translate(i * 64 + 32, 160); g.strokeStyle = '#f6efe2'; g.lineWidth = 4; for (let a = 0; a < 3; a++) { g.rotate(PI / 3); g.beginPath(); g.moveTo(-16, 0); g.lineTo(16, 0); g.stroke(); } g.restore(); }
  }),
}), []);

/* ---------- 3D pieces ---------- */
const Mat: React.FC<{c: string | THREE.Color; r?: number; m?: number; e?: string; ei?: number}> = ({c, r = 0.5, m = 0, e, ei = 0}) =>
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? '#000'} emissiveIntensity={ei} />;

const Figure: React.FC<{body: string; hat?: string; skirt?: boolean; t: number; kick?: number; flat?: number; sink?: number; blue?: number; arms?: number; beard?: boolean}> =
  ({body, hat, skirt, t, kick = 0, flat = 1, sink = 0, blue = 0, arms = 0, beard}) => {
    const col = useMemo(() => new THREE.Color(), []);
    col.set(body).lerp(new THREE.Color('#a8dcff'), blue * 0.75);
    const skin = new THREE.Color('#f0c9a0').lerp(new THREE.Color('#bfe6ff'), blue * 0.7);
    return (
      <group>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.15, s > 0 ? -0.07 * sink : 0, 0.04]} rotation={[0, 0, s * kick * (0.35 + 0.45 * Math.sin(t * 14 + s * 1.9))]} scale={[s > 0 ? 1 + (1 - flat) * 0.5 : 1, s > 0 ? flat : 1, 1]}>
            <mesh position={[0, 0.07, 0.07]} scale={[1, 0.6, 1.45]}><sphereGeometry args={[0.13, 20, 14]} /><Mat c="#7a4423" r={0.35} e="#3a1a08" ei={0.3} /></mesh>
            <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.075, 0.075, 0.3, 14]} /><Mat c="#efe6d8" /></mesh>
            <mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.078, 0.078, 0.07, 14]} /><Mat c="#c62f2f" /></mesh>
          </group>
        ))}
        {skirt ? (
          <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.24, 0.46, 1.0, 32]} /><Mat c={col} r={0.4} /></mesh>
        ) : (
          <mesh position={[0, 0.82, 0]}><cylinderGeometry args={[0.3, 0.38, 1.0, 32]} /><Mat c={col} r={0.4} /></mesh>
        )}
        <mesh position={[0, 0.55, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[skirt ? 0.37 : 0.365, 0.035, 10, 40]} /><Mat c="#e2b04c" r={0.3} m={0.6} /></mesh>
        {[0.75, 0.95, 1.15].map((y) => <mesh key={y} position={[0, y, skirt ? 0.3 - (y - 0.75) * 0.1 : 0.35 - (y - 0.75) * 0.12]}><sphereGeometry args={[0.035, 10, 8]} /><Mat c="#f2c84b" r={0.3} m={0.5} /></mesh>)}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.33, 1.22, 0]} rotation={[0, 0, s * (0.25 + arms)]}>
            <mesh position={[0, -0.27, 0]}><capsuleGeometry args={[0.075, 0.38, 6, 12]} /><Mat c={col} r={0.4} /></mesh>
            <mesh position={[0, -0.55, 0]}><sphereGeometry args={[0.085, 12, 10]} /><Mat c={skin} /></mesh>
          </group>
        ))}
        <mesh position={[0, 1.55, 0]}><sphereGeometry args={[0.3, 32, 24]} /><Mat c={skin} r={0.55} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.1, 1.6, 0.27]}><sphereGeometry args={[0.035, 10, 8]} /><Mat c="#120c08" r={0.2} /></mesh>)}
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.17, 1.5, 0.23]} scale={[1, 0.7, 0.4]}><sphereGeometry args={[0.06, 10, 8]} /><Mat c={blue > 0.5 ? '#9fc8ff' : '#f08a80'} /></mesh>)}
        <mesh position={[0, 1.53, 0.31]}><sphereGeometry args={[0.05, 12, 10]} /><Mat c="#e0a77e" /></mesh>
        {beard && <mesh position={[0, 1.43, 0.24]} scale={[1.6, 0.55, 0.6]}><sphereGeometry args={[0.1, 14, 10]} /><Mat c="#f4f1ea" r={0.9} /></mesh>}
        {hat ? (
          <group position={[0, 1.78, 0]}>
            <mesh position={[0, 0.25, 0]}><coneGeometry args={[0.27, 0.55, 32]} /><Mat c={hat} r={0.45} /></mesh>
            <mesh rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.26, 0.05, 10, 32]} /><Mat c="#f4f1ea" r={0.9} /></mesh>
            <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.07, 12, 10]} /><Mat c="#f4f1ea" r={0.9} /></mesh>
          </group>
        ) : (
          <mesh position={[0, 1.66, -0.2]}><sphereGeometry args={[0.17, 16, 12]} /><Mat c="#5b3220" r={0.7} /></mesh>
        )}
      </group>
    );
  };

const Mug: React.FC<{tex: THREE.Texture; t: number; steam: number}> = ({tex, t, steam}) => (
  <group>
    <mesh position={[0, 0.575, 0]}><cylinderGeometry args={[0.58, 0.52, 1.15, 48, 1, true]} /><meshStandardMaterial map={tex} roughness={0.2} metalness={0.05} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 1.08, 0]}><cylinderGeometry args={[0.56, 0.56, 0.02, 40]} /><Mat c="#4a0712" r={0.1} e="#6a0a1a" ei={0.25} /></mesh>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.52, 0.52, 0.04, 40]} /><Mat c="#7d0f22" /></mesh>
    <mesh position={[0, 1.15, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.58, 0.035, 10, 48]} /><Mat c="#f6efe2" r={0.25} /></mesh>
    <mesh position={[0.6, 0.6, 0]}><torusGeometry args={[0.28, 0.065, 12, 32, PI]} /><Mat c="#a3132c" r={0.2} /></mesh>
    {steam > 0 && Array.from({length: 9}).map((_, i) => {
      const ph = ((t * 0.45 + rand(i) ) % 1);
      return <mesh key={i} position={[(rand(i + 3) - 0.5) * 0.7 + Math.sin(t * 2 + i) * 0.08, 1.2 + ph * 1.3, (rand(i + 7) - 0.5) * 0.5]} scale={0.6 + ph * 1.4}>
        <sphereGeometry args={[0.12, 12, 10]} /><meshStandardMaterial color="#ffffff" transparent opacity={steam * 0.22 * Math.sin(PI * ph)} depthWrite={false} /></mesh>;
    })}
  </group>
);

const Stall: React.FC<{tx: ReturnType<typeof useTextures>; t: number}> = ({tx, t}) => (
  <group position={[0, 0, -2.2]}>
    <mesh position={[0, GROUND + 1.6, 0]}><boxGeometry args={[6, 3.2, 0.2]} /><meshStandardMaterial map={tx.planks} roughness={0.8} /></mesh>
    {/* glowing counter window with shelves of mugs */}
    <mesh position={[0, GROUND + 1.85, 0.11]}><planeGeometry args={[3.6, 1.3]} /><Mat c="#3a1a08" e="#ff9a3a" ei={0.55} /></mesh>
    {Array.from({length: 14}).map((_, i) => (
      <mesh key={i} position={[-1.6 + (i % 7) * 0.53, GROUND + 1.5 + Math.floor(i / 7) * 0.55, 0.2]}><cylinderGeometry args={[0.1, 0.09, 0.2, 14]} /><Mat c={['#a3132c', '#1e5b3a', '#e8c25a'][i % 3]} r={0.25} /></mesh>
    ))}
    <mesh position={[0, GROUND + 1.15, 0.45]}><boxGeometry args={[4.2, 0.12, 0.7]} /><meshStandardMaterial map={tx.planks} roughness={0.7} /></mesh>
    {/* awning, roof with snow, sign */}
    <mesh position={[0, GROUND + 2.75, 0.55]} rotation={[0.5, 0, 0]}><boxGeometry args={[6.2, 0.05, 1.1]} /><meshStandardMaterial map={tx.stripes} roughness={0.8} /></mesh>
    <mesh position={[0, GROUND + 3.55, 0]} rotation={[0, 0, 0]} scale={[1, 0.45, 1]}><cylinderGeometry args={[0.001, 3.5, 2, 4, 1]} /><Mat c="#4a2c18" r={0.9} /></mesh>
    <mesh position={[0, GROUND + 3.7, 0.2]} scale={[1, 0.4, 1]}><cylinderGeometry args={[0.001, 3.3, 1.6, 4, 1]} /><Mat c="#eef4ff" r={0.95} /></mesh>
    <mesh position={[0, GROUND + 3.35, 0.95]}><planeGeometry args={[2.4, 0.6]} /><meshStandardMaterial map={tx.sign} emissive="#ffffff" emissiveMap={tx.sign} emissiveIntensity={0.35} /></mesh>
    {/* string of lights */}
    {Array.from({length: 17}).map((_, i) => {
      const x = -3 + i * 0.375, sag = 0.28 * (1 - Math.pow((x / 3), 2));
      const on = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7);
      return <mesh key={i} position={[x, GROUND + 3.05 - sag, 1.05]}><sphereGeometry args={[0.06, 10, 8]} /><Mat c="#ffd98a" e={['#ffb347', '#ffe08a', '#ff7a4a'][i % 3]} ei={2.2 * on} /></mesh>;
    })}
  </group>
);

const Bowl: React.FC<{s: number}> = ({s}) => s <= 0.01 ? null : (
  <group scale={s}>
    <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.3, 0.2, 0.14, 32, 1, true]} /><meshStandardMaterial color="#8a5a33" roughness={0.6} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.28, 0.28, 0.01, 32]} /><Mat c="#ffd54a" r={0.08} e="#ffb000" ei={0.35} /></mesh>
    <mesh position={[0, 0.14, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.3, 0.025, 8, 32]} /><Mat c="#6b4325" /></mesh>
  </group>
);

const Splash: React.FC<{t: number; t0: number; at: V3}> = ({t, t0, at}) => {
  const d = t - t0;
  if (d < 0 || d > 1.1) return null;
  return <group position={at}>{Array.from({length: 16}).map((_, i) => {
    const a = rand(i) * PI * 2, v = 0.8 + rand(i + 5) * 1.0, up = 2.2 + rand(i + 9) * 1.6;
    return <mesh key={i} position={[Math.cos(a) * v * d, up * d - 4.5 * d * d, Math.sin(a) * v * d * 0.6]} scale={1 - d / 1.1}><sphereGeometry args={[0.05, 8, 6]} /><Mat c="#ffd54a" r={0.1} e="#ffb000" ei={0.4} /></mesh>;
  })}</group>;
};

const Ice: React.FC<{s: number; t: number}> = ({s, t}) => s <= 0.01 ? null : (
  <group scale={s}>
    {Array.from({length: 8}).map((_, i) => (
      <mesh key={i} position={[-rand(i) * 0.25, (rand(i + 1) - 0.3) * 0.35, (rand(i + 2) - 0.5) * 0.35]} rotation={[rand(i + 3) * 3, rand(i + 4) * 3, 0.8 + rand(i + 5)]} scale={[0.6, 1.6 + rand(i + 6), 0.6]}>
        <octahedronGeometry args={[0.13 + rand(i + 8) * 0.06, 0]} />
        <meshStandardMaterial color="#c9efff" emissive="#4fb6ff" emissiveIntensity={0.55 + 0.2 * Math.sin(t * 4 + i)} roughness={0.08} metalness={0.1} transparent opacity={0.88} flatShading />
      </mesh>
    ))}
  </group>
);

const Frost: React.FC<{t: number; t0: number; t1: number; from: V3; to: V3}> = ({t, t0, t1, from, to}) => {
  if (t < t0 || t > t1) return null;
  const fade = clamp((t1 - t) / 0.4) * clamp((t - t0) / 0.3);
  return <group>{Array.from({length: 22}).map((_, i) => {
    const ph = ((t - t0) * 0.9 + rand(i)) % 1;
    const p: V3 = [lerp(from[0], to[0], ph), lerp(from[1], to[1], ph) + Math.sin(ph * PI) * 0.3 + (rand(i + 2) - 0.5) * 0.5, lerp(from[2], to[2], ph) + (rand(i + 4) - 0.5) * 0.4];
    return <mesh key={i} position={p} rotation={[t * 3 + i, t * 2, 0]} scale={fade * (0.6 + rand(i + 6) * 0.6)}><octahedronGeometry args={[0.045, 0]} /><Mat c="#ffffff" e="#bfe6ff" ei={1.2} /></mesh>;
  })}</group>;
};

const Stars: React.FC<{k: number; t: number}> = ({k, t}) => k <= 0 ? null : (
  <group position={[0, 2.3, 0]}>{Array.from({length: 4}).map((_, i) => {
    const a = t * 5 + (i * PI) / 2;
    return <mesh key={i} position={[Math.cos(a) * 0.45, 0.06 * Math.sin(a * 2), Math.sin(a) * 0.45]} rotation={[0, 0, t * 6]} scale={k}><octahedronGeometry args={[0.09, 0]} /><Mat c="#ffe14d" e="#ffc400" ei={1.4} /></mesh>;
  })}</group>
);

const CROWD = [
  {x: -1.15, z: -0.6, c: '#6d3b8f', hat: '#2e7d32', from: -3.6},
  {x: 1.15, z: -0.55, c: '#c0392b', hat: '#f1c40f', from: 3.6},
  {x: -0.55, z: -1.15, c: '#2c5aa0', hat: '#c0392b', from: -3.8},
  {x: 0.65, z: -1.1, c: '#7b5a45', hat: '#16a085', from: 3.8},
];
const STOMPER = {x: 0.42, z: 0.32, c: '#d35400', hat: '#1b4f72'};

const World: React.FC<{t: number}> = ({t}) => {
  const tx = useTextures();
  const cam = camAt(t);
  const h = heroAt(t);
  const ms = mugScale(t);
  // colleague: slides in during the rewind, turns her back, leaves before the dive
  const colX = t < K.fett ? lerp(3.6, 1.0, prog(t, K.rew0, Math.max(0.4, K.rew1 - K.rew0 - 0.2))) : lerp(1.0, 3.8, prog(t, K.glas, 0.7));
  const colRy = seg(t, [[0, -0.55], [K.turn - 0.1, -0.55], [K.turn + 0.35, 1.25]]);
  const iceS = t < K.ice ? 0 : spring({frame: Math.round((t - K.ice) * 30), fps: 30, config: {damping: 9, stiffness: 120}});
  const bowlS = seg(t, [[K.fett, 0], [K.fett + 0.4, 1], [K.sch, 1], [K.sch + 0.4, 0]]);
  const crowdIn = prog(t, K.fu + 0.15, 0.7), crowdOut = prog(t, K.out, 0.6);
  const stompY = [K.stomp1, K.stomp2].reduce((acc, ts) => acc + (t > ts - 0.4 && t < ts ? Math.sin(PI * (t - ts + 0.4) / 0.4) * 0.55 : 0), 0);
  const shiver = h.shiver ? Math.sin(t * 55) * 0.025 * h.shiver : 0;
  return (
    <group position={[cam.x, cam.y, 0]} scale={cam.s}>
      <Stall tx={tx} t={t} />
      <mesh rotation={[-PI / 2, 0, 0]} position={[0, GROUND, -0.5]}><planeGeometry args={[14, 9]} /><meshStandardMaterial map={tx.cobble} roughness={0.85} /></mesh>
      {/* standing table with three mugs; the middle one becomes the giant */}
      <group position={[0, GROUND, -0.3]}>
        <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.05, 0.05, 1.24, 12]} /><Mat c="#2a1a10" /></mesh>
        <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.3, 0.34, 0.06, 24]} /><Mat c="#2a1a10" /></mesh>
        <mesh position={[0, 1.0, 0]}><cylinderGeometry args={[0.5, 0.66, 0.48, 40, 1, true]} /><meshStandardMaterial color="#7d1322" roughness={0.85} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.52, 0.52, 0.04, 40]} /><Mat c="#e9dcc4" r={0.8} /></mesh>
        {[-0.3, 0.3].map((x) => <group key={x} position={[x, 1.27, 0.12]} scale={0.22}><Mug tex={tx.mug} t={t} steam={0} /></group>)}
        <group position={[0, 1.27, 0]} scale={ms}><Mug tex={tx.mug} t={t} steam={clamp((ms - 0.6) / 0.4)} /></group>
      </group>
      {/* bowl of fat */}
      <group position={[STAND.x + 0.15, GROUND, STAND.z + 0.05]}><Bowl s={bowlS} /></group>
      <Splash t={t} t0={K.step} at={[STAND.x + 0.15, GROUND + 0.15, STAND.z + 0.05]} />
      {/* hero */}
      <group position={[h.x + shiver, h.y, h.z]} rotation={[0, h.ry, h.rz]}>
        <Figure body="#1f6f54" hat="#c62f2f" beard t={t} kick={h.kick} flat={h.flat} sink={h.sink} blue={h.blue} arms={h.arms} />
        <Stars k={h.stars} t={t} />
      </group>
      {/* colleague with the cold shoulder */}
      {colX < 3.5 && (
        <group position={[colX, GROUND, 0.25]}>
          <group rotation={[0, colRy, 0]}><Figure body="#d9a521" skirt t={t} /></group>
          <group position={[-0.33, 1.22, 0.05]}><Ice s={iceS} t={t} /></group>
        </group>
      )}
      <Frost t={t} t0={K.ice + 0.15} t1={K.glas + 0.2} from={[colX - 0.4, GROUND + 1.25, 0.3]} to={[-0.95, GROUND + 1.3, 0.3]} />
      {/* the crowd (Gedränge) */}
      {crowdIn > 0 && crowdOut < 1 && CROWD.map((c, i) => (
        <group key={i} position={[lerp(c.from, c.x, crowdIn) + (c.from - c.x) * crowdOut + Math.sin(t * 3 + i) * 0.08, GROUND + Math.abs(Math.sin(t * 6 + i)) * 0.04, c.z]} rotation={[0, Math.sin(t * 2 + i) * 0.4, Math.sin(t * 3 + i * 2) * 0.06]}>
          <Figure body={c.c} hat={c.hat} t={t} arms={0.2 + 0.2 * Math.sin(t * 4 + i)} />
        </group>
      ))}
      {crowdIn > 0 && crowdOut < 1 && (
        <group position={[lerp(3.6, STOMPER.x, crowdIn) + 3 * crowdOut, GROUND + stompY, STOMPER.z]} rotation={[0, -0.5, 0]}>
          <Figure body={STOMPER.c} hat={STOMPER.hat} t={t} arms={stompY > 0 ? 1 : 0.2} />
        </group>
      )}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#7f9cff', '#3a2010', 0.55]} />
      <directionalLight position={[-3, 5, 7]} intensity={1.7} color="#ffe2b8" />
      <pointLight position={[0, GROUND + 2.4, -1]} intensity={14} distance={9} color="#ff9a3a" />
      <pointLight position={[3, 1, 3]} intensity={8} distance={10} color={h.blue > 0.3 ? '#8fc8ff' : '#ffc27a'} />
      <pointLight position={[-3, 2, 2]} intensity={6} distance={10} color="#9cb6ff" />
    </group>
  );
};

/* ---------- 2D overlay ---------- */
const Snow: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: 60}).map((_, i) => {
      const sz = 4 + rand(i) * 8, v = 50 + rand(i + 1) * 80;
      const y = ((rand(i + 2) * 2100 + t * v) % 2100) - 90;
      const x = rand(i + 3) * 1080 + Math.sin(t * 0.8 + i) * 24;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: sz, background: '#fff', opacity: 0.3 + rand(i + 4) * 0.45, filter: sz > 9 ? 'blur(2px)' : undefined}} />;
    })}
  </AbsoluteFill>
);

type Item = {key: string; title: string; titleLine?: string; q?: number; ex: number; exEnd: number; before: string; hi: string; after: string; en: string; reg?: string; short: string; real?: boolean};
const ITEMS: Item[] = [
  {key: 'fett', title: 'ins Fettnäpfchen treten', titleLine: 's03', q: K.q1, ex: K.ex1, exEnd: K.sch, before: 'Mit dem Witz über sein Gehalt bin ich voll ', hi: 'ins Fettnäpfchen getreten', after: '.', en: "to put one's foot in it", short: 'Fettnäpfchen'},
  {key: 'schulter', title: 'jdm. die kalte Schulter zeigen', titleLine: 's05', q: K.q2, ex: K.ex2, exEnd: K.glas, before: 'Beim Wichteln hat sie mir ', hi: 'die kalte Schulter gezeigt', after: '.', en: 'to give s.o. the cold shoulder', short: 'kalte Schulter'},
  {key: 'glas', title: 'zu tief ins Glas schauen', ex: K.ex3, exEnd: K.fu, before: 'Auf der Feier hat er mal wieder ', hi: 'zu tief ins Glas geschaut', after: '.', en: 'to have one too many', reg: 'ugs', short: 'Glas'},
  {key: 'fuesse', title: 'jdm. auf die Füße treten', titleLine: 's08', q: K.q4, ex: K.ex4, exEnd: K.out, before: 'Im Gedränge ist mir jemand ', hi: 'auf die Füße getreten', after: '.', en: "to step on s.o.'s toes (literally)", short: 'Füße', real: true},
];
const revealAt = (it: Item) => (it.real ? K.real : it.ex);

const Chips: React.FC<{t: number; f: number; fps: number}> = ({t, f, fps}) => {
  const show = wAt('s02', 'vier') - 0.05;
  if (t < show - 0.1 || t > K.cta - 0.1) return null;
  const s = spring({frame: f - Math.round(show * fps), fps, config: {damping: 13}});
  return (
    <div style={{position: 'absolute', top: SAFE.top + 4, left: SAFE.side, right: SAFE.side, display: 'flex', gap: 14, opacity: s, transform: `translateY(${(1 - s) * -40}px)`}}>
      {ITEMS.map((it, i) => {
        const r = revealAt(it), done = t >= r, active = !done && t >= (i === 0 ? K.fett : revealAt(ITEMS[i - 1]) + 0.5);
        const pop = done ? spring({frame: f - Math.round(r * fps), fps, config: {damping: 9, stiffness: 160}}) : 0;
        return (
          <div key={it.key} style={{flex: 1, height: 92, borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: done ? (it.real ? ACC : 'rgba(255,255,255,.92)') : 'rgba(12,22,26,.78)', color: done ? '#1a120a' : '#fff',
            border: `3px solid ${active ? ACC : 'rgba(255,255,255,.25)'}`, transform: `scale(${1 + 0.12 * Math.sin(pop * PI)})`, fontFamily: HEAD}}>
            {done ? (
              <>
                <div style={{fontSize: 26, fontWeight: 700, lineHeight: 1.05}}>{it.short}</div>
                <div style={{fontSize: 24, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: it.real ? '#1a120a' : '#5c6b73'}}>{it.real ? 'echt!' : 'nur Bild'}</div>
              </>
            ) : <div style={{fontSize: 46, fontWeight: 800, color: active ? ACC : 'rgba(255,255,255,.7)'}}>?</div>}
          </div>
        );
      })}
    </div>
  );
};

const Title: React.FC<{it: Item; t: number; f: number; fps: number}> = ({it, t, f, fps}) => {
  const start = it.titleLine ? line(it.titleLine).words[1].s - 0.1 : K.glas + 0.05;
  if (t < start - 0.1 || t > it.exEnd) return null;
  const out = clamp((it.exEnd - t) / 0.25);
  const s = spring({frame: f - Math.round(start * fps), fps, config: {damping: 12}});
  return (
    <div style={{position: 'absolute', top: SAFE.top + 112, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: out * s}}>
      <div style={{display: 'inline-block', background: 'rgba(10,20,24,.80)', borderRadius: 26, padding: '14px 30px 18px', transform: `scale(${0.8 + 0.2 * s})`}}>
        {it.titleLine ? <Spoken line={line(it.titleLine)} skip={1} size={70} weight={800} font={HEAD} /> :
          <div style={{fontFamily: HEAD, fontSize: 70, fontWeight: 800, color: '#fff', lineHeight: 1.2}}>{it.title}</div>}
      </div>
    </div>
  );
};

const Guess: React.FC<{it: Item; t: number; f: number; fps: number}> = ({it, t, f, fps}) => {
  if (it.q === undefined) return null;
  const a = it.q + 0.05, b = it.real ? K.real : it.ex;
  if (t < a - 0.1 || t > b + 0.15) return null;
  const s = spring({frame: f - Math.round(a * fps), fps, config: {damping: 12}});
  const left = Math.max(0, b - t), total = b - a;
  return (
    <div style={{position: 'absolute', left: SAFE.side + 20, right: SAFE.side + 20, top: SAFE.top + 240, opacity: s * clamp((b + 0.15 - t) / 0.2),
      transform: `translateY(${(1 - s) * -60}px)`, background: 'rgba(10,20,24,.86)', borderRadius: 30, padding: '26px 34px', border: `3px solid ${ACC}`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
        <div style={{width: 96, height: 96, borderRadius: 48, background: ACC, color: '#1a120a', fontFamily: BLACK, fontSize: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${1 + 0.15 * Math.max(0, (left % 1) - 0.8) * 5})`}}>{Math.max(1, Math.ceil(left))}</div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: HEAD, fontSize: 58, fontWeight: 800, color: '#fff'}}>{it.real ? 'Bild oder echt?' : 'Was ist gemeint?'}</div>
          <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,.18)', marginTop: 12, overflow: 'hidden'}}>
            <div style={{width: `${(left / total) * 100}%`, height: '100%', background: ACC}} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Example: React.FC<{it: Item}> = ({it}) => (
  <Card from={it.ex - 0.25} to={it.exEnd} label="Zum Beispiel" accent={ACC} bg="rgba(10,20,24,.90)">
    <div style={{fontFamily: SERIF, fontSize: 48, lineHeight: 1.25, color: '#fff'}}>
      {it.before}<span style={{color: ACC, fontWeight: 700, fontStyle: 'italic'}}>{it.hi}</span>{it.after}
    </div>
    <div style={{fontFamily: HEAD, fontSize: 32, fontStyle: 'italic', color: '#b9c7cc', marginTop: 12}}>
      {it.en}{it.reg && <span style={{marginLeft: 16, fontStyle: 'normal', fontSize: 26, fontWeight: 700, color: '#1a120a', background: '#d8e3e6', borderRadius: 10, padding: '3px 12px'}}>ugs</span>}
    </div>
  </Card>
);

const HookTitle: React.FC<{t: number; o: number}> = ({t, o}) => o <= 0 ? null : (
  <div style={{position: 'absolute', top: SAFE.top + 8, left: SAFE.side - 10, right: SAFE.side - 10, textAlign: 'center', opacity: o}}>
    <div style={{fontFamily: BLACK, fontSize: 104, lineHeight: 1.0, color: '#fff', letterSpacing: -1, textShadow: `0 0 34px rgba(255,159,28,.7), 0 8px 20px rgba(0,0,0,.7)`, transform: `rotate(-3deg) scale(${1 + 0.025 * Math.sin(t * 3)})`}}>
      ZU TIEF<br />INS <span style={{color: ACC}}>GLAS</span>
    </div>
    <div style={{fontFamily: HEAD, fontSize: 54, fontWeight: 800, color: '#fff', marginTop: 8, textShadow: '0 4px 14px rgba(0,0,0,.8)'}}>geschaut.</div>
  </div>
);

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const s02 = line('s02'), s10 = line('s10');
  const hookO = t < K.rew0 + 0.1 ? clamp((K.rew0 + 0.1 - t) / 0.25) : t > K.cta - 0.15 ? clamp((t - K.cta + 0.15) / 0.3) : 0;
  const rew = t > K.rew0 && t < K.rew1 ? Math.sin(PI * clamp((t - K.rew0) / (K.rew1 - K.rew0))) : 0;
  const stamp = t > K.real - 0.05 && t < K.ex4 + 0.9;
  const st = stamp ? spring({frame: f - Math.round((K.real - 0.05) * fps), fps, config: {damping: 10, stiffness: 200}}) : 0;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #061218 0%, #0d2630 55%, #081419 100%)'}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 10], fov: 40}} gl={{antialias: true}}>
        <fog attach="fog" args={['#0b2028', 9, 22]} />
        <World t={t} />
      </ThreeCanvas>
      <Snow t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)'}} />
      {/* rewind: scanlines + icon */}
      {rew > 0 && (
        <AbsoluteFill style={{opacity: rew}}>
          <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0px, rgba(255,255,255,.07) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 9px)', transform: `translateY(${(t * 400) % 9}px)`}} />
          <div style={{position: 'absolute', right: SAFE.side + 10, top: SAFE.top + 130, fontFamily: BLACK, fontSize: 80, color: '#fff', textShadow: '3px 0 0 rgba(255,60,60,.7), -3px 0 0 rgba(60,200,255,.7)'}}>◀◀</div>
        </AbsoluteFill>
      )}

      <HookTitle t={t} o={hookO} />
      {/* hook subtitle (spoken line 1) only while the hook title stands */}
      <Chips t={t} f={f} fps={fps} />

      {/* open loop line */}
      {t > s02.words[0].s - 0.1 && t < K.fett + 0.1 && (
        <div style={{position: 'absolute', left: SAFE.side + 10, right: SAFE.side + 10, bottom: SAFE.bottom + 40, textAlign: 'center', background: 'rgba(10,20,24,.84)', borderRadius: 30, padding: '24px 30px',
          opacity: clamp((K.fett + 0.1 - t) / 0.25)}}>
          <Spoken line={s02} size={60} weight={800} font={HEAD} />
        </div>
      )}

      {ITEMS.map((it) => <Title key={it.key} it={it} t={t} f={f} fps={fps} />)}
      {ITEMS.map((it) => <Guess key={it.key} it={it} t={t} f={f} fps={fps} />)}
      {ITEMS.map((it) => <Example key={it.key} it={it} />)}

      {/* twist stamp */}
      {stamp && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', opacity: clamp((K.ex4 + 0.9 - t) / 0.3)}}>
          <div style={{transform: `rotate(-8deg) scale(${2.2 - 1.2 * st})`, opacity: clamp(st * 2), border: `10px solid ${ACC}`, borderRadius: 24, padding: '14px 36px',
            background: 'rgba(10,20,24,.75)', fontFamily: BLACK, fontSize: 92, color: ACC, letterSpacing: 2, textAlign: 'center', lineHeight: 1.05}}>
            KEIN{NB}BILD.<div style={{fontSize: 60, color: '#fff'}}>Das{NB}passiert{NB}echt!</div>
          </div>
        </div>
      )}

      {/* outro: teaser, then follow CTA; the hook title returns so the last frame rhymes with the first */}
      {t > s10.words[0].s - 0.1 && t < K.cta && (
        <div style={{position: 'absolute', top: SAFE.top + 112, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((K.cta - t) / 0.2)}}>
          <div style={{display: 'inline-block', background: 'rgba(10,20,24,.82)', borderRadius: 26, padding: '16px 30px'}}>
            <Spoken line={s10} size={64} weight={800} font={HEAD} />
          </div>
        </div>
      )}
      {t > K.cta - 0.2 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: SAFE.bottom + 60, display: 'flex', justifyContent: 'center'}}>
          <FollowCTA show={K.cta - 0.1} accent={ACC} />
        </div>
      )}
      <Audio src={staticFile('laneJ/mix.wav')} />
    </AbsoluteFill>
  );
};
