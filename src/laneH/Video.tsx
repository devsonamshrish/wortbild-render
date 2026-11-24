/* register-weihnachtsmarkt-01 — "Der Nussknacker hört mit".
   A Glühwein stall at night. You (a little Räuchermann figure) stand next to your boss, a stern nutcracker.
   Every colloquial thought makes her jaw snap and the stall lights turn red; the neutral word calms her.
   Twist: she says "Mir ist saukalt." herself, a fire basket rises, and now you may shiver: "Ich bibbere!" (loops to frame 0). */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneH-timings.json';
import {makeTiming, Timings, FollowCTA, Pop, SAFE, NB, rand, clamp, prog} from '../lib/kit';

const TM = makeTiming(T as unknown as Timings);
const {line, at, scene} = TM;
export const FRAMES = TM.frames();

const RED = '#ff4d5e';          // the one accent: colloquial / danger
const CREAM = '#ffe9b8';        // neutral tag (always with the word "neutral")
const GOLD = new THREE.Color('#ffc46b');
const HOT = new THREE.Color('#ff2a3c');
const HEAD = '"Trebuchet MS", "Segoe UI", sans-serif';
const SERIF = 'Georgia, "Palatino Linotype", serif';

/* find the start of the first spoken word in a line that contains `needle` */
const w = (id: string, needle: string) => {
  const L = line(id);
  const k = L.words.findIndex((x) => x.w.toLowerCase().replace(/[^a-zäöüß]/g, '').includes(needle));
  return k < 0 ? L.start : L.words[k].s;
};
const end = (id: string) => line(id).end;
const start = (id: string) => line(id).start;

/* ---------- key moments ---------- */
const K = {
  s02: start('s03'),
  loop: w('s03', 'bleib'),
  p1ugs: w('s04', 'bibbere'), p1kalt: w('s04', 'kalt'), p1fix: start('s05'), p1word: w('s05', 'friere'),
  p2zahlt: w('s06', 'zahlt'), p2ugs: w('s06', 'abzocke'), p2fix: start('s07'), p2word: w('s07', 'berteuert'),
  p3heikel: w('s08', 'heikel'), p3kol: w('s08', 'kollege'), p3ugs: w('s08', 'sitzen'), p3fix: start('s09'), p3word: w('s09', 'angetrunken'), p3home: w('s09', 'heimbringen'),
  tw: start('s10'), say: start('s11'), sau: w('s11', 'saukalt'), fire: w('s11', 'feuerkorb'),
  pay: start('s12'), payB: w('s12', 'bibbere'),
  teaser: start('s13'), cta: start('s14'),
};

/* boss anger 0..1 */
const angerAt = (t: number) => {
  const env = (a: number, b: number, peak: number) => peak * prog(t, a - 0.1, 0.25) * (1 - prog(t, b, 0.5));
  return Math.max(
    t < K.s02 ? 1 : 1 - prog(t, K.s02, 0.5),
    env(K.p1ugs, K.p1fix, 0.55),
    env(K.p2ugs, K.p2fix, 0.8),
    env(K.p3ugs, K.p3fix, 1),
  );
};
/* how hard the protagonist shivers */
const shiverAt = (t: number) => Math.max(
  t < K.s02 ? 1 : 1 - prog(t, K.s02, 0.4),
  prog(t, K.p1kalt, 0.3) * (1 - prog(t, K.p1fix + 0.3, 0.6)) * 0.8,
  prog(t, K.payB - 0.3, 0.3),
);

/* ---------- canvas texture sign ---------- */
const useSign = (text: string) => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 220;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3a1d10'; g.fillRect(0, 0, 1024, 220);
  g.strokeStyle = '#ffc46b'; g.lineWidth = 10; g.strokeRect(14, 14, 996, 192);
  g.font = 'bold 128px Georgia'; g.fillStyle = '#ffe2a6'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 512, 118);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
}, [text]);

const Std: React.FC<{c: string; e?: string; ei?: number; r?: number; m?: number}> = ({c, e = '#000', ei = 0, r = 0.6, m = 0.05}) =>
  <meshStandardMaterial color={c} emissive={e} emissiveIntensity={ei} roughness={r} metalness={m} />;

/* ---------- the boss: a nutcracker ---------- */
const Nutcracker: React.FC<{t: number; anger: number; shout: number; shiver: number}> = ({t, anger, shout, shiver}) => {
  // jaw: snaps when angry (faster and wider the angrier), drops wide open at the twist
  const snap = anger > 0.05 ? Math.max(0, Math.sin(t * (10 + anger * 10))) * (0.15 + anger * 0.35) : 0;
  const jaw = Math.max(snap, shout * 0.75);
  const hop = anger > 0.9 ? Math.abs(Math.sin(t * 12)) * 0.08 : 0;
  const brow = anger * 0.5;
  const sh = Math.sin(t * 47) * 0.03 * shiver;
  return (
    <group position={[-0.82 + sh, -0.68 + hop, 0]} rotation={[0, 0.28, sh * 2]}>
      {/* base */}
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.42, 0.46, 0.1, 40]} /><Std c="#2c6b3d" r={0.5} /></mesh>
      {/* boots + legs */}
      {[-0.13, 0.13].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.22, 0.03]}><boxGeometry args={[0.18, 0.24, 0.3]} /><Std c="#111" r={0.25} m={0.3} /></mesh>
          <mesh position={[x, 0.52, 0]}><cylinderGeometry args={[0.085, 0.085, 0.4, 20]} /><Std c="#f3ead8" /></mesh>
        </group>
      ))}
      {/* coat */}
      <mesh position={[0, 0.98, 0]}><cylinderGeometry args={[0.27, 0.32, 0.62, 32]} /><Std c="#b3121f" r={0.35} /></mesh>
      <mesh position={[0, 0.74, 0]}><torusGeometry args={[0.31, 0.035, 10, 40]} /><Std c="#d9a634" m={0.8} r={0.25} /></mesh>
      {[0.88, 1.02, 1.16].map((y) => <mesh key={y} position={[0, y, 0.29]}><sphereGeometry args={[0.035, 12, 12]} /><Std c="#ffd36a" e="#ffb000" ei={0.4} m={0.8} r={0.2} /></mesh>)}
      {/* arms, the right one wags at the angry moments */}
      <mesh position={[-0.36, 1.0, 0]} rotation={[0, 0, 0.12]}><cylinderGeometry args={[0.075, 0.07, 0.5, 16]} /><Std c="#b3121f" r={0.35} /></mesh>
      <group position={[0.34, 1.2, 0]} rotation={[0, 0, -0.15 - anger * (1.6 + Math.sin(t * 14) * 0.25)]}>
        <mesh position={[0, -0.24, 0]}><cylinderGeometry args={[0.075, 0.07, 0.5, 16]} /><Std c="#b3121f" r={0.35} /></mesh>
        <mesh position={[0, -0.52, 0]}><sphereGeometry args={[0.08, 14, 14]} /><Std c="#f1c8a5" /></mesh>
      </group>
      {/* head */}
      <mesh position={[0, 1.47, 0]}><cylinderGeometry args={[0.22, 0.22, 0.4, 32]} /><Std c="#f1c8a5" r={0.55} /></mesh>
      {/* eyes and brows */}
      {[-0.08, 0.08].map((x, i) => (
        <group key={x}>
          <mesh position={[x, 1.53, 0.2]}><sphereGeometry args={[0.035, 12, 12]} /><Std c="#111" /></mesh>
          <mesh position={[x, 1.6 - brow * 0.03, 0.21]} rotation={[0, 0, (i ? 1 : -1) * (-0.15 - brow)]}><boxGeometry args={[0.1, 0.022, 0.02]} /><Std c="#3a2414" /></mesh>
        </group>
      ))}
      <mesh position={[0, 1.47, 0.23]}><sphereGeometry args={[0.04, 12, 12]} /><Std c="#e39a86" /></mesh>
      {/* the jaw: hinged lever */}
      <group position={[0, 1.36, 0.06]} rotation={[jaw, 0, 0]}>
        <mesh position={[0, -0.06, 0.1]}><boxGeometry args={[0.3, 0.12, 0.16]} /><Std c="#fbf6ee" r={0.8} /></mesh>
        <mesh position={[0, -0.01, 0.185]}><boxGeometry args={[0.18, 0.02, 0.01]} /><Std c="#5a0a10" /></mesh>
      </group>
      {/* white hair at the sides */}
      {[-0.22, 0.22].map((x) => <mesh key={x} position={[x, 1.42, -0.02]}><boxGeometry args={[0.07, 0.36, 0.3]} /><Std c="#fbf6ee" r={0.9} /></mesh>)}
      {/* tall hat + gold crown band */}
      <mesh position={[0, 1.83, 0]}><cylinderGeometry args={[0.235, 0.245, 0.34, 32]} /><Std c="#141414" r={0.4} /></mesh>
      <mesh position={[0, 1.7, 0]}><torusGeometry args={[0.245, 0.03, 10, 40]} /><Std c="#d9a634" m={0.8} r={0.25} /></mesh>
      {Array.from({length: 7}, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return <mesh key={i} position={[Math.sin(a) * 0.22, 2.04, Math.cos(a) * 0.22]}><coneGeometry args={[0.04, 0.1, 8]} /><Std c="#ffd36a" e="#ffb000" ei={0.3} m={0.8} r={0.2} /></mesh>;
      })}
    </group>
  );
};

/* ---------- you: a little wooden smoker figure with a mug ---------- */
const You: React.FC<{t: number; shiver: number; relief: number}> = ({t, shiver, relief}) => {
  const sh = Math.sin(t * 52) * 0.05 * shiver;
  const shrink = 1 - shiver * 0.04;
  return (
    <group position={[0.86 + sh, -0.68, 0.2]} rotation={[0, -0.32, sh * 1.5]} scale={[1, shrink, 1]}>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.33, 0.36, 0.08, 36]} /><Std c="#6b4426" r={0.6} /></mesh>
      <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.2, 0.29, 0.66, 30]} /><Std c="#2f6f8f" r={0.5} /></mesh>
      {/* scarf */}
      <mesh position={[0, 0.76, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.15, 0.06, 12, 32]} /><Std c="#f2e3c6" r={0.9} /></mesh>
      <mesh position={[0.08, 0.6, 0.17]} rotation={[0, 0, 0.1 + sh * 3]}><boxGeometry args={[0.09, 0.26, 0.04]} /><Std c="#f2e3c6" r={0.9} /></mesh>
      {/* head */}
      <mesh position={[0, 0.98, 0]}><sphereGeometry args={[0.2, 30, 30]} /><Std c="#f1c8a5" r={0.55} /></mesh>
      {[-0.07, 0.07].map((x) => <mesh key={x} position={[x, 1.01, 0.18]}><sphereGeometry args={[0.025, 10, 10]} /><Std c="#111" /></mesh>)}
      <mesh position={[0, 0.96, 0.2]}><sphereGeometry args={[0.04, 12, 12]} /><Std c={shiver > 0.3 ? '#e36f6f' : '#e39a86'} /></mesh>
      {/* mouth: worried line or relieved smile */}
      <mesh position={[0, 0.9, 0.185]} rotation={[0, 0, Math.PI]} scale={[1, 0.4 + relief * 0.6, 1]}><torusGeometry args={[0.05, 0.012, 6, 16, Math.PI * (0.4 + relief * 0.6)]} /><Std c="#5a1a14" /></mesh>
      {/* felt hat */}
      <mesh position={[0, 1.15, 0]}><cylinderGeometry args={[0.3, 0.3, 0.025, 30]} /><Std c="#3b2a1d" r={0.8} /></mesh>
      <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.15, 0.17, 0.2, 30]} /><Std c="#3b2a1d" r={0.8} /></mesh>
      {/* arm + mug */}
      <mesh position={[-0.22, 0.5, 0.12]} rotation={[0.9, 0, -0.5]}><cylinderGeometry args={[0.06, 0.06, 0.32, 14]} /><Std c="#2f6f8f" r={0.5} /></mesh>
      <group position={[-0.3, 0.6, 0.26]}>
        <mesh><cylinderGeometry args={[0.075, 0.065, 0.14, 24]} /><Std c="#b8322a" r={0.3} /></mesh>
        <mesh position={[0, 0.071, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.068, 24]} /><Std c="#5a0f14" e="#3a0508" ei={0.3} /></mesh>
        {Array.from({length: 6}, (_, i) => {
          const p = ((t * 0.5 + i / 6) % 1);
          return <mesh key={i} position={[Math.sin(t * 2 + i) * 0.03, 0.1 + p * 0.45, 0]}><sphereGeometry args={[0.03 + p * 0.05, 10, 10]} /><meshBasicMaterial color="#fff" transparent opacity={(1 - p) * 0.28} /></mesh>;
        })}
      </group>
    </group>
  );
};

/* ---------- the colleague who sways in ---------- */
const Colleague: React.FC<{t: number}> = ({t}) => {
  if (t < K.p3kol - 0.4 || t > K.p3home + 2.2) return null;
  const inn = prog(t, K.p3kol - 0.3, 1.0), out = prog(t, K.p3home, 1.4);
  const x = 2.6 - inn * 2.45 + out * 2.9;
  const sway = Math.sin(t * 3.2) * 0.22 * (1 - out * 0.5);
  return (
    <group position={[x, -0.68, -0.95]} rotation={[0, -0.2, sway]}>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.3, 0.33, 0.08, 30]} /><Std c="#6b4426" /></mesh>
      <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.2, 0.27, 0.74, 28]} /><Std c="#6b3fa0" r={0.5} /></mesh>
      <mesh position={[0, 1.02, 0]}><sphereGeometry args={[0.2, 28, 28]} /><Std c="#f1c8a5" /></mesh>
      <mesh position={[0, 0.99, 0.2]}><sphereGeometry args={[0.05, 12, 12]} /><Std c="#e0495a" e="#b0102a" ei={0.4} /></mesh>
      {[-0.07, 0.07].map((xx) => <mesh key={xx} position={[xx, 1.05, 0.18]} scale={[1, 0.35, 1]}><sphereGeometry args={[0.03, 10, 10]} /><Std c="#111" /></mesh>)}
      {/* Santa-ish bobble hat askew */}
      <mesh position={[0.05, 1.27, 0]} rotation={[0, 0, -0.5]}><coneGeometry args={[0.18, 0.4, 24]} /><Std c="#c8102e" /></mesh>
      <mesh position={[0.2, 1.42, 0]}><sphereGeometry args={[0.06, 12, 12]} /><Std c="#fff" r={0.9} /></mesh>
      {/* tilted mug */}
      <mesh position={[0.3, 0.62, 0.1]} rotation={[0, 0, -0.9 + Math.sin(t * 3.2) * 0.3]}><cylinderGeometry args={[0.07, 0.06, 0.13, 20]} /><Std c="#2c6b3d" /></mesh>
    </group>
  );
};

/* ---------- the stall ---------- */
const Stall: React.FC<{t: number; anger: number; warm: number}> = ({t, anger, warm}) => {
  const sign = useSign('Glühwein');
  const bulbs = 15;
  return (
    <group position={[0, -0.68, -2.3]}>
      {/* back wall + side posts */}
      <mesh position={[0, 1.45, -0.2]}><boxGeometry args={[5.2, 2.9, 0.2]} /><Std c="#4a2c18" r={0.85} /></mesh>
      {Array.from({length: 13}, (_, i) => <mesh key={i} position={[-2.4 + i * 0.4, 1.45, -0.08]}><boxGeometry args={[0.02, 2.9, 0.02]} /><Std c="#2b190d" /></mesh>)}
      {[-2.5, 2.5].map((x) => <mesh key={x} position={[x, 1.6, 0.5]}><boxGeometry args={[0.18, 3.2, 0.18]} /><Std c="#3a2212" r={0.8} /></mesh>)}
      {/* counter */}
      <mesh position={[0, 0.5, 0.55]}><boxGeometry args={[4.8, 1.0, 0.5]} /><Std c="#6b3f20" r={0.7} /></mesh>
      <mesh position={[0, 1.03, 0.6]}><boxGeometry args={[5.0, 0.07, 0.65]} /><Std c="#8a5a30" r={0.5} /></mesh>
      {/* gable roof with snow */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.4, 3.35, 0.2]} rotation={[0, 0, -s * 0.42]}><boxGeometry args={[3.2, 0.14, 1.4]} /><Std c="#3a2212" r={0.8} /></mesh>
          <mesh position={[s * 1.37, 3.46, 0.2]} rotation={[0, 0, -s * 0.42]}><boxGeometry args={[3.15, 0.09, 1.42]} /><Std c="#eef3ff" r={0.95} /></mesh>
        </group>
      ))}
      {/* sign */}
      <mesh position={[0, 2.55, 0.62]}><planeGeometry args={[2.4, 0.52]} /><meshStandardMaterial map={sign} emissive="#ffb35a" emissiveIntensity={0.25 + warm * 0.3} /></mesh>
      {/* pot with steam */}
      <mesh position={[-1.3, 1.25, 0.55]}><cylinderGeometry args={[0.3, 0.26, 0.38, 30]} /><Std c="#8a8f98" m={0.85} r={0.3} /></mesh>
      {Array.from({length: 8}, (_, i) => {
        const p = ((t * 0.35 + i / 8) % 1);
        return <mesh key={i} position={[-1.3 + Math.sin(t + i * 2) * 0.12, 1.5 + p * 1.1, 0.55]}><sphereGeometry args={[0.08 + p * 0.16, 12, 12]} /><meshBasicMaterial color="#fff" transparent opacity={(1 - p) * 0.22} /></mesh>;
      })}
      {/* mugs on the counter */}
      {[0.4, 0.75, 1.1, 1.45].map((x, i) => <mesh key={x} position={[x, 1.14, 0.62]}><cylinderGeometry args={[0.08, 0.07, 0.15, 18]} /><Std c={['#b8322a', '#2c6b3d', '#b8322a', '#2f6f8f'][i]} r={0.3} /></mesh>)}
      {/* string of lights: gold, turning red with the boss's anger */}
      {Array.from({length: bulbs}, (_, i) => {
        const u = i / (bulbs - 1), x = -2.45 + u * 4.9, y = 2.98 - Math.sin(u * Math.PI) * 0.32;
        const flick = anger > 0.5 ? 0.6 + 0.4 * Math.sin(t * 30 + i) : 1;
        const col = GOLD.clone().lerp(HOT, clamp(anger * 1.1)).getStyle();
        return <mesh key={i} position={[x, y, 0.75]}><sphereGeometry args={[0.07, 14, 14]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={(1.6 + warm) * flick} /></mesh>;
      })}
    </group>
  );
};

/* ---------- fire basket for the twist ---------- */
const FireBasket: React.FC<{t: number; rise: number}> = ({t, rise}) => {
  if (rise <= 0) return null;
  return (
    <group position={[0.05, -0.68 - (1 - rise) * 1.2, 1.7]} scale={0.8}>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.04, 0.04, 0.5, 8]} /><Std c="#222" m={0.6} /></mesh>
      {[0.5, 0.72, 0.94].map((y, i) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.32 + i * 0.05, 0.02, 8, 30]} /><Std c="#1c1c1c" m={0.7} r={0.4} /></mesh>)}
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <mesh key={i} position={[Math.sin(a) * 0.36, 0.72, Math.cos(a) * 0.36]} rotation={[Math.cos(a) * 0.15, 0, -Math.sin(a) * 0.15]}><boxGeometry args={[0.025, 0.46, 0.025]} /><Std c="#1c1c1c" m={0.7} /></mesh>;
      })}
      {Array.from({length: 9}, (_, i) => {
        const fl = 0.75 + 0.25 * Math.sin(t * 13 + i * 1.7);
        return <mesh key={i} position={[(rand(i) - 0.5) * 0.36, 0.95 + fl * 0.2, (rand(i + 4) - 0.5) * 0.36]} scale={[1, 2.2 * fl, 1]}><sphereGeometry args={[0.1, 12, 12]} /><meshBasicMaterial color={i % 3 ? '#ff8a1e' : '#ffd24a'} transparent opacity={0.85} /></mesh>;
      })}
      {Array.from({length: 14}, (_, i) => {
        const p = ((t * 0.6 + rand(i + 20)) % 1);
        return <mesh key={'s' + i} position={[(rand(i) - 0.5) * 0.5 + Math.sin(t * 3 + i) * 0.1, 1.1 + p * 1.6, (rand(i + 9) - 0.5) * 0.4]}><sphereGeometry args={[0.018, 6, 6]} /><meshBasicMaterial color="#ffb347" transparent opacity={1 - p} /></mesh>;
      })}
    </group>
  );
};

/* ---------- 2D overlays ---------- */
const Tag: React.FC<{ugs: boolean; small?: boolean}> = ({ugs, small}) => (
  <span style={{display: 'inline-block', fontFamily: HEAD, fontWeight: 800, fontSize: small ? 26 : 32, letterSpacing: 3, padding: small ? '4px 12px' : '6px 16px', borderRadius: 10,
    color: ugs ? '#fff' : '#2a1a08', background: ugs ? RED : CREAM, border: ugs ? 'none' : '2px solid #ffffff55', verticalAlign: 'middle'}}>
    {ugs ? 'UGS' : 'NEUTRAL'}
  </span>
);

/* bubble anchored above a figure */
const Bubble: React.FC<{x: number; y: number; show: number; hide: number; t: number; tone: 'ugs' | 'ok' | 'sealed'; children: React.ReactNode; cross?: number; tail?: 'left' | 'right'; timer?: [number, number]}> =
  ({x, y, show, hide, t, tone, children, cross = -1, tail = 'right', timer}) => {
    const {fps} = useVideoConfig();
    if (t < show - 0.05 || t > hide + 0.3) return null;
    const s = spring({frame: Math.round((t - show) * fps), fps, config: {damping: 10, stiffness: 160, mass: 0.6}});
    const out = clamp((hide + 0.3 - t) / 0.3);
    const crossed = cross > 0 ? prog(t, cross, 0.25) : 0;
    const border = tone === 'ugs' ? RED : tone === 'ok' ? CREAM : '#ffffff66';
    const wob = tone === 'sealed' ? Math.sin(t * 6) * 2 : 0;
    const tp = timer ? clamp((t - timer[0]) / (timer[1] - timer[0])) : -1;
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) scale(${0.3 + 0.7 * s}) rotate(${wob}deg)`, transformOrigin: tail === 'right' ? '70% 120%' : '30% 120%', opacity: clamp(s * 1.5) * out}}>
        <div style={{position: 'relative', background: tone === 'sealed' ? 'rgba(20,24,44,.85)' : '#fffaf0', color: '#1a1020', border: `6px solid ${border}`, borderRadius: 46,
          padding: '22px 34px', fontFamily: HEAD, fontWeight: 800, fontSize: 64, whiteSpace: 'nowrap', boxShadow: `0 10px 50px ${tone === 'ugs' ? 'rgba(255,60,80,.45)' : 'rgba(0,0,0,.5)'}`}}>
          {children}
          {crossed > 0 && (
            <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="6" y1="80" x2={6 + 88 * crossed} y2={80 - 60 * crossed} stroke={RED} strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{strokeWidth: 12}} />
            </svg>
          )}
          {tp >= 0 && tp < 1 && (
            <svg style={{position: 'absolute', right: -40, top: -40, width: 84, height: 84}} viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="#1a1020" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="#ffffff33" strokeWidth="5" />
              <circle cx="20" cy="20" r="14" fill="none" stroke={RED} strokeWidth="5" strokeDasharray={`${88 * (1 - tp)} 88`} transform="rotate(-90 20 20)" />
              <text x="20" y="25" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Trebuchet MS">?</text>
            </svg>
          )}
        </div>
        {/* thought dots or speech tail */}
        {tone === 'ok'
          ? <div style={{position: 'absolute', [tail === 'right' ? 'right' : 'left']: 70, bottom: -26, width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderTop: `30px solid ${CREAM}`}} />
          : [0, 1].map((i) => <div key={i} style={{position: 'absolute', [tail === 'right' ? 'right' : 'left']: 60 + i * 26, bottom: -30 - i * 30, width: 26 - i * 9, height: 26 - i * 9, borderRadius: 99, background: tone === 'sealed' ? 'rgba(20,24,44,.85)' : '#fffaf0', border: `4px solid ${border}`}} />)}
      </div>
    );
  };

/* headline at the top: a word with its register tag and English gloss */
const Head: React.FC<{t: number; from: number; to: number; children: React.ReactNode; sub?: React.ReactNode}> = ({t, from, to, children, sub}) => {
  if (t < from - 0.05 || t > to) return null;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 6, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((to - t) / 0.2)}}>
      <Pop show={from}><div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 92, color: '#fff', lineHeight: 1.05, textShadow: '0 6px 30px rgba(0,0,0,.8)'}}>{children}</div></Pop>
      {sub && <div style={{marginTop: 12}}><Pop show={from + 0.15}>{sub}</Pop></div>}
    </div>
  );
};
const En: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: '#d8deff', textShadow: '0 3px 14px #000'}}>{children}</span>;

/* the page sentence at the bottom, word by word as spoken (keeps punctuation) */
const Sentence: React.FC<{t: number; id: string; skip: number; text?: string; from: number; to: number; label: React.ReactNode; en?: string; accent: string}> = ({t, id, skip, text, from, to, label, en, accent}) => {
  const {fps} = useVideoConfig();
  if (t < from - 0.2 || t > to) return null;
  const L = line(id);
  const words = (text ?? L.text).split(' ').slice(text ? 0 : skip);
  const s = spring({frame: Math.round((t - from) * fps), fps, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 14, transform: `translateY(${(1 - s) * 120}px)`, opacity: s * clamp((to - t) / 0.25),
      background: 'rgba(12,14,30,.9)', borderRadius: 34, padding: '26px 36px', borderLeft: `10px solid ${accent}`}}>
      <div style={{marginBottom: 10}}>{label}</div>
      <div style={{fontFamily: SERIF, fontSize: 52, lineHeight: 1.22, color: '#fff', fontWeight: 700}}>
        {words.map((x, i) => (
          <React.Fragment key={i}><Pop show={L.words[Math.min(i + (text ? skip : skip), L.words.length - 1)].s - 0.05}>{x}</Pop>{i < words.length - 1 ? ' ' : ''}</React.Fragment>
        ))}
      </div>
      {en && <div style={{marginTop: 10, fontFamily: SANS2, fontSize: 32, color: '#aab3d8'}}>{en}</div>}
    </div>
  );
};
const SANS2 = '"Segoe UI", system-ui, sans-serif';

const Chip: React.FC<{t: number; from: number; to: number; n: number; label: string}> = ({t, from, to, n, label}) => {
  if (t < from || t > to) return null;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 190, left: SAFE.side, display: 'flex', gap: 10, alignItems: 'center', opacity: clamp((t - from) / 0.2) * clamp((to - t) / 0.2)}}>
      {[1, 2, 3].map((k) => <div key={k} style={{width: 22, height: 22, borderRadius: 99, background: k <= n ? RED : '#ffffff33'}} />)}
      <span style={{fontFamily: HEAD, fontWeight: 700, fontSize: 30, color: '#fff', marginLeft: 8, letterSpacing: 2}}>{label}</span>
    </div>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const anger = angerAt(t);
  const shiver = shiverAt(t);
  const shout = prog(t, K.sau - 0.1, 0.2) * (1 - prog(t, K.pay, 0.6));
  const rise = prog(t, K.fire - 0.2, 0.8);
  const warm = prog(t, K.fire - 0.2, 0.8);
  const relief = Math.max(prog(t, K.p1word, 0.3) * (1 - prog(t, K.p2ugs, 0.2)), prog(t, K.p2word, 0.3) * (1 - prog(t, K.p3heikel, 0.2)), prog(t, K.p3word, 0.3) * (1 - prog(t, K.tw, 0.2)), prog(t, K.sau, 0.4));
  const bossShiver = prog(t, K.payB - 0.3, 0.3);

  // camera moves via the world group: hook close-up, pull back, pushes, twist push towards the boss, payoff = hook framing
  const close = Math.max(1 - prog(t, K.s02, 0.9), prog(t, K.pay, 0.8) * (1 - prog(t, K.cta, 0.8)));
  const twistPush = prog(t, K.tw, 0.8) * (1 - prog(t, K.pay, 0.8));
  const itemPush = (a: number, b: number) => prog(t, a, 1.2) * (1 - prog(t, b, 0.6));
  const push = Math.max(itemPush(K.p1ugs, K.p1fix), itemPush(K.p2ugs, K.p2fix), itemPush(K.p3ugs, K.p3fix)) * 0.06;
  const sc = 1.15 * (1 + close * 0.1 + twistPush * 0.12 + push);
  const gx = twistPush * 0.45 + Math.sin(t * 0.3) * 0.04;
  const shakeCam = anger > 0.9 ? Math.sin(t * 50) * 0.015 : 0;
  const gy = -0.55 - close * 0.1 - twistPush * 0.14;

  const bgHot = anger;
  const bg = `radial-gradient(120% 70% at 50% 48%, rgb(${Math.round(38 + bgHot * 60 + warm * 40)},${Math.round(40 + warm * 20 - bgHot * 10)},${Math.round(84 - bgHot * 40 - warm * 30)}) 0%, #0b1030 55%, #04060f 100%)`;

  const p1End = K.p2zahlt - 0.2, p2End = K.p3heikel - 0.2, p3End = K.tw - 0.1;
  const BX = 800, BY = 985;   // thought bubble anchor above you
  const CX = 300, CY = 765;   // speech bubble anchor above the boss

  return (
    <AbsoluteFill style={{background: bg}}>
      <Audio src={staticFile('laneH/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 1.2, 9], fov: 40, rotation: [-0.08, 0, 0]}} gl={{antialias: true}}>
        <ambientLight intensity={0.45} color="#b8c6ff" />
        <directionalLight position={[-3, 5, 6]} intensity={0.9} color="#cfd8ff" />
        <pointLight position={[0, 2.4, -0.6]} intensity={5 + warm * 2} distance={9} color={GOLD.clone().lerp(HOT, anger).getStyle()} />
        <pointLight position={[0.2, 0.6, 2.4]} intensity={warm * 14} distance={6} color="#ff8a2a" />
        <group position={[gx + shakeCam, gy, 0]} scale={sc}>
          <Stall t={t} anger={anger} warm={warm} />
          {/* snowy ground */}
          <mesh position={[0, -0.69, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 14]} /><Std c="#dfe7f7" r={0.95} /></mesh>
          {Array.from({length: 26}, (_, i) => <mesh key={i} position={[(rand(i + 40) - 0.5) * 6, -0.66, 3 - rand(i + 70) * 6]} scale={[1, 0.35, 1]}><sphereGeometry args={[0.12 + rand(i) * 0.15, 12, 8]} /><Std c="#eef3ff" r={1} /></mesh>)}
          <Nutcracker t={t} anger={anger} shout={shout} shiver={bossShiver} />
          <You t={t} shiver={shiver} relief={relief} />
          <Colleague t={t} />
          {/* coins: the boss pays */}
          {t > K.p2zahlt - 0.1 && t < p2End + 0.5 && Array.from({length: 5}, (_, i) => {
            const s = prog(t, K.p2zahlt + i * 0.08, 0.45);
            return <mesh key={i} position={[-0.2 + i * 0.05, 0.45 + (1 - s) * 2.2 + i * 0.022, -1.65]} rotation={[Math.PI / 2 - 0.1, 0, t * (1 - s) * 8]}><cylinderGeometry args={[0.09, 0.09, 0.02, 24]} /><Std c="#ffcf5a" e="#ffaa00" ei={0.4} m={0.9} r={0.2} /></mesh>;
          })}
          <FireBasket t={t} rise={rise} />
          {/* falling snow */}
          {Array.from({length: 110}, (_, i) => {
            const z = 2.5 - rand(i + 5) * 6;
            const y = 4.2 - ((t * (0.25 + rand(i + 1) * 0.3) + rand(i + 2) * 6) % 6);
            return <mesh key={'n' + i} position={[(rand(i) - 0.5) * 6 + Math.sin(t + i) * 0.1, y, z]}><sphereGeometry args={[0.018 + rand(i + 3) * 0.022, 6, 6]} /><meshBasicMaterial color="#fff" transparent opacity={0.8} /></mesh>;
          })}
          {/* distant bokeh lights of the market */}
          {Array.from({length: 18}, (_, i) => <mesh key={'b' + i} position={[(rand(i + 90) - 0.5) * 12, 1.5 + rand(i + 91) * 3, -7]}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color={i % 4 ? '#ffc46b' : '#ff7a5a'} transparent opacity={0.35 + 0.2 * Math.sin(t * 2 + i)} /></mesh>)}
        </group>
      </ThreeCanvas>

      {/* ===== HOOK: on screen from frame 0 ===== */}
      {t < K.s02 + 0.1 && (
        <div style={{position: 'absolute', top: SAFE.top - 10, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((K.s02 + 0.1 - t) / 0.2)}}>
          <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 104, color: '#fff', lineHeight: 1.02, textShadow: '0 6px 30px rgba(0,0,0,.8)'}}>
            Sag{NB}das <span style={{color: RED}}>NIE</span><br />vor{NB}der{NB}Chefin!
          </div>
        </div>
      )}
      <Bubble x={BX} y={BY} show={-1} hide={K.s02 - 0.1} t={t} tone="ugs">Ich bibbere! <Tag ugs /></Bubble>

      {/* setup + open loop */}
      <Head t={t} from={K.loop} to={K.p1kalt - 0.4} sub={<En>Bleib bis zum Ende.</En>}><span style={{fontSize: 78}}>Am{NB}Ende{NB}rutscht{NB}es<br /><span style={{color: RED}}>IHR</span>{NB}raus…</span></Head>
      <Bubble x={CX} y={CY} show={w('s03', 'ihr') - 0.1} hide={K.say - 0.05} t={t} tone="sealed" tail="left"><span style={{color: '#fff', letterSpacing: 8}}>???</span></Bubble>

      {/* ===== item 1: cold ===== */}
      <Chip t={t} from={K.p1kalt - 0.4} to={p1End} n={1} label="KALT" />
      <Head t={t} from={K.p1ugs} to={K.p1word - 0.1} sub={<En>to shiver (colloquial)</En>}>bibbern <Tag ugs /></Head>
      <Head t={t} from={K.p1word} to={p1End} sub={<En>to be cold, to freeze</En>}>frieren <Tag ugs={false} /></Head>
      <Bubble x={BX} y={BY} show={K.p1ugs - 0.05} hide={K.p1fix + 0.6} cross={K.p1fix} timer={[end('s04'), K.p1fix]} t={t} tone="ugs">Ich bibbere! <Tag ugs small /></Bubble>
      <Sentence t={t} id="s05" skip={1} from={K.p1fix + 0.15} to={p1End} label={<Tag ugs={false} small />} accent={CREAM} />

      {/* ===== item 2: the boss pays ===== */}
      <Chip t={t} from={K.p2zahlt - 0.2} to={p2End} n={2} label="DIE CHEFIN ZAHLT" />
      <Head t={t} from={K.p2ugs} to={K.p2word - 0.1} sub={<En>rip-off</En>}>die{NB}Abzocke <Tag ugs /></Head>
      <Head t={t} from={K.p2word} to={p2End} sub={<En>overpriced</En>}>überteuert <Tag ugs={false} /></Head>
      <Bubble x={BX} y={BY} show={K.p2ugs - 0.05} hide={K.p2fix + 0.6} cross={K.p2fix} timer={[end('s06'), K.p2fix]} t={t} tone="ugs">Abzocke! <Tag ugs small /></Bubble>
      <Sentence t={t} id="s07" skip={1} from={K.p2fix + 0.15} to={p2End} label={<Tag ugs={false} small />} accent={CREAM} />

      {/* ===== item 3: the colleague ===== */}
      <Chip t={t} from={K.p3heikel - 0.2} to={p3End} n={3} label="HEIKEL" />
      <Head t={t} from={K.p3heikel} to={K.p3ugs - 0.1}><span style={{fontSize: 84}}>Ein{NB}Kollege<br />schwankt…</span></Head>
      <Head t={t} from={K.p3ugs} to={K.p3word - 0.1} sub={<En>to be drunk</En>}><span style={{fontSize: 80}}>einen{NB}sitzen{NB}haben</span> <Tag ugs /></Head>
      <Head t={t} from={K.p3word} to={p3End} sub={<En>slightly drunk</En>}>angetrunken <Tag ugs={false} /></Head>
      <Bubble x={BX - 30} y={BY} show={K.p3ugs - 0.05} hide={K.p3fix + 0.6} cross={K.p3fix} timer={[end('s08'), K.p3fix]} t={t} tone="ugs"><span style={{fontSize: 54}}>Der{NB}hat{NB}einen{NB}sitzen!</span> <Tag ugs small /></Bubble>
      <Sentence t={t} id="s09" skip={1} from={K.p3fix + 0.15} to={p3End} label={<Tag ugs={false} small />} accent={CREAM} />

      {/* ===== twist: the boss herself ===== */}
      <Head t={t} from={K.tw} to={K.sau - 0.1}><span style={{fontSize: 84}}>Und{NB}dann{NB}sagt<br />die{NB}Chefin:</span></Head>
      <Head t={t} from={K.sau} to={K.pay - 0.05} sub={<En>"I'm freezing." (very colloquial)</En>}><span style={{fontSize: 80}}>„Mir{NB}ist{NB}<span style={{color: RED}}>saukalt</span>.“</span></Head>
      <Bubble x={CX + 40} y={CY + 30} show={K.sau - 0.05} hide={K.pay + 0.2} t={t} tone="ugs" tail="left">Mir{NB}ist{NB}saukalt! <Tag ugs small /></Bubble>
      <Sentence t={t} id="s11" skip={0} text="Mir ist saukalt – gehen wir zum Feuerkorb?" from={K.say} to={K.pay + 0.3} label={<Tag ugs small />} accent={RED} />

      {/* ===== payoff: the first line again, now allowed ===== */}
      <Head t={t} from={K.pay} to={K.teaser - 0.05} sub={<En>Jetzt darfst du.</En>}>Na{NB}also.</Head>
      <Bubble x={BX} y={BY} show={K.payB - 0.05} hide={K.cta - 0.1} t={t} tone="ugs">Ich bibbere! <span style={{display: 'inline-block', background: CREAM, color: '#2a1a08', borderRadius: 10, padding: '4px 12px', fontSize: 26, letterSpacing: 3, verticalAlign: 'middle'}}>OK{NB}✓</span></Bubble>

      {/* ===== teaser + CTA ===== */}
      <Head t={t} from={K.teaser} to={K.cta - 0.05}><span style={{fontSize: 64}}>Morgen:<br />noch{NB}mehr<br />Glühwein-Momente</span></Head>
      {t > K.cta - 0.2 && (
        <div style={{position: 'absolute', top: SAFE.top + 40, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <FollowCTA show={K.cta} accent={RED} />
        </div>
      )}
    </AbsoluteFill>
  );
};
