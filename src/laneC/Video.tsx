/* familie-weihnachtsmarkt-02 · word_family "Zucker"
   Leitmetapher: a gingerbread man on the counter of a sweets stall gets "sugared" word by word.
   Puderzucker snows on him and the Stollen (he sneezes), Zuckerguss writes a name on his gingerbread heart,
   a Zuckerstange spins into his hand (the only "die"), and finally a Zuckerhut lands on his head like a hat.
   Twist (from the page): the Zuckerhut is soaked in rum and set alight. It is no hat: it belongs to the Feuerzangenbowle.
   Hook = the cone on his head ("Ein Hut aus Zucker?"); the last frame rhymes: the same cone, now burning on the tongs beside him.
   Accent: caramel orange. Type: Arial Black + Cambria. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneC-timings.json';
import {makeTiming, Pop, FollowCTA, SAFE, NB, GENUS, rand, clamp, prog, Timings} from '../lib/kit';

const {line, at, frames} = makeTiming(T as Timings);
export const FRAMES = frames() + 12;

const ACC = '#ff8a3d'; // caramel, the one accent
const BLK = '"Arial Black", Impact, sans-serif';
const CAM = 'Cambria, Georgia, serif';
const PI = Math.PI;
const norm = (s: string) => s.toLowerCase().replace(/[^a-zäöüß]/g, '');
/* start of the first word in a line that begins with `p` (robust against how the aligner splits words) */
const atw = (id: string, p: string) => {
  const L = line(id);
  const k = L.words.findIndex((w) => norm(w.w).startsWith(p));
  return k >= 0 ? L.words[k].s : L.start;
};
const endOf = (id: string) => line(id).end;

/* ---------------- timing anchors ---------------- */
const T_HALT = at('s02', 0);
const T_Q1 = at('s03', 0), T_STOLLEN = atw('s03', 'stollen'), T_R1 = at('s04', 0), T_PUDER = atw('s04', 'puder');
const T_Q2 = at('s05', 0), T_HERZ = atw('s05', 'herz'), T_R2 = at('s06', 0), T_GUSS = atw('s06', 'zucker');
const T_Q3 = at('s07', 0), T_R3 = at('s08', 0), T_STANGE = atw('s08', 'zucker'), T_ACHT = atw('s08', 'achtung'), T_DIE2 = at('s08', 99);
const T_Q4 = at('s09', 0), T_HUT = atw('s09', 'zucker'), T_KOPF = atw('s09', 'kopf');
const T_ZUERST = at('s10', 0), T_RUM = atw('s10', 'rum'), T_GETR = atw('s10', 'getr'), T_ANZ = atw('s10', 'angez');
const T_KEIN = at('s11', 0), T_FZB = atw('s11', 'feuer');
const T_OUT = at('s12', 0), T_CTA = at('s13', 0);

/* ---------------- the family ---------------- */
type Item = {lead: string; rev: string; art: 'der' | 'die' | 'das'; pre: string; stem: string; post: string; en: string; tAns: number};
const ITEMS: Item[] = [
  {lead: 's03', rev: 's04', art: 'der', pre: 'Puder', stem: 'zucker', post: '', en: 'icing sugar', tAns: T_PUDER},
  {lead: 's05', rev: 's06', art: 'der', pre: '', stem: 'Zucker', post: 'guss', en: 'sugar icing', tAns: T_GUSS},
  {lead: 's07', rev: 's08', art: 'die', pre: '', stem: 'Zucker', post: 'stange', en: 'candy cane', tAns: T_STANGE},
  {lead: 's09', rev: 's10', art: 'der', pre: '', stem: 'Zucker', post: 'hut', en: 'sugar loaf', tAns: T_HUT},
];

/* ---------------- textures ---------------- */
const useTex = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, key: string, rep?: [number, number]) =>
  useMemo(() => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

const glowTex = (g: CanvasRenderingContext2D, w: number, h: number) => {
  const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
};

/* ---------------- shots: camera keyframes [time, cx, cy, dist] ---------------- */
type Shot = [number, number, number, number];
const SHOTS: Shot[] = [
  [0, 0, 2.05, 6.6],
  [T_HALT - 0.1, 0, 2.0, 6.0],
  [T_HALT + 0.6, -0.4, 1.55, 7.6],
  [T_Q1 + 0.2, -0.85, 1.45, 7.0],
  [T_R1 + 0.6, -0.6, 1.5, 6.6],
  [T_Q2 + 0.3, 0, 1.35, 4.3],
  [T_R2 + 0.6, 0, 1.4, 4.6],
  [T_Q3 + 0.3, 0.35, 1.55, 6.4],
  [T_R3 + 0.8, 0.2, 1.5, 6.2],
  [T_Q4 + 0.3, 0, 2.15, 6.6],
  [T_KOPF + 0.3, 0, 2.1, 6.0],
  [T_RUM, 0, 2.55, 4.9],
  [T_ANZ + 0.6, 0, 2.4, 5.4],
  [T_KEIN + 0.8, 0.85, 1.75, 7.4],
  [T_OUT, 0.85, 1.85, 7.0],
  [T_OUT + 6, 0.85, 1.95, 6.5],
];
const shotAt = (t: number) => {
  let i = 0;
  while (i < SHOTS.length - 2 && t > SHOTS[i + 1][0]) i++;
  const a = SHOTS[i], b = SHOTS[i + 1];
  const k = prog(t, a[0], Math.max(0.01, b[0] - a[0]));
  return {x: a[1] + (b[1] - a[1]) * k, y: a[2] + (b[2] - a[2]) * k, d: a[3] + (b[3] - a[3]) * k};
};

/* ---------------- flames ---------------- */
const Flame: React.FC<{t: number; s: number; seed: number}> = ({t, s, seed}) => (
  <group scale={s}>
    {Array.from({length: 7}, (_, i) => {
      const a = (i / 7) * PI * 2 + seed, fl = 0.75 + 0.35 * Math.sin(t * 17 + i * 2.1 + seed) + 0.15 * Math.sin(t * 31 + i);
      const blue = i % 2 === 0;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.12, 0.25 * fl, Math.sin(a) * 0.12]} scale={[1, fl, 1]} rotation={[Math.sin(t * 9 + i) * 0.12, 0, Math.cos(t * 7 + i) * 0.12]}>
          <coneGeometry args={[blue ? 0.16 : 0.12, blue ? 0.75 : 0.55, 12, 1, true]} />
          <meshBasicMaterial color={blue ? '#3f8cff' : '#ffb03a'} transparent opacity={blue ? 0.55 : 0.75} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      );
    })}
    <mesh position={[0, 0.25, 0]}><sphereGeometry args={[0.28, 12, 10]} /><meshBasicMaterial color="#6fb4ff" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
  </group>
);

/* ---------------- the gingerbread man ---------------- */
const GINGER = new THREE.Color('#b4682e');
const Ginger: React.FC<{t: number; powder: number; eyes: 'open' | 'wide' | 'shut'; mouth: 'smile' | 'o'; armUp: number; sq: number}> = ({t, powder, eyes, mouth, armUp, sq}) => {
  const col = GINGER.clone().lerp(new THREE.Color('#f4ece4'), powder * 0.75).getStyle();
  const mat = <meshStandardMaterial color={col} roughness={0.78} />;
  const icing = <meshStandardMaterial color="#fffaf2" roughness={0.35} emissive="#ffffff" emissiveIntensity={0.08} />;
  const Z = 0.2;
  return (
    <group scale={[1 + sq * 0.35, 1 - sq, 1 + sq * 0.35]}>
      <group scale={[1, 1, 0.42]}>
        {/* legs */}
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.27, 0.42, 0]} rotation={[0, 0, s * 0.22]}><capsuleGeometry args={[0.22, 0.45, 8, 20]} />{mat}</mesh>)}
        {/* body */}
        <mesh position={[0, 1.05, 0]}><capsuleGeometry args={[0.42, 0.42, 10, 28]} />{mat}</mesh>
        {/* arms (right arm can be raised to hold the candy cane) */}
        <mesh position={[-0.68, 1.28, 0]} rotation={[0, 0, PI / 2 - 0.35]}><capsuleGeometry args={[0.19, 0.5, 8, 20]} />{mat}</mesh>
        <mesh position={[0.68, 1.28 + armUp * 0.12, 0]} rotation={[0, 0, -(PI / 2 - 0.35) + armUp * 0.55]}><capsuleGeometry args={[0.19, 0.5, 8, 20]} />{mat}</mesh>
        {/* head */}
        <mesh position={[0, 1.86, 0]}><sphereGeometry args={[0.42, 32, 24]} />{mat}</mesh>
      </group>
      {/* icing face */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.14, 1.93, Z]}>
          {eyes === 'shut'
            ? <mesh rotation={[0, 0, 0]}><boxGeometry args={[0.12, 0.03, 0.02]} />{icing}</mesh>
            : <mesh scale={eyes === 'wide' ? 1.45 : 1}><sphereGeometry args={[0.055, 14, 10]} />{icing}</mesh>}
          {eyes !== 'shut' && <mesh position={[0, 0, 0.04]} scale={eyes === 'wide' ? 0.8 : 1}><sphereGeometry args={[0.025, 10, 8]} /><meshBasicMaterial color="#2a120a" /></mesh>}
        </group>
      ))}
      {mouth === 'o'
        ? <mesh position={[0, 1.73, Z]}><torusGeometry args={[0.07, 0.022, 8, 20]} />{icing}</mesh>
        : <mesh position={[0, 1.78, Z]} rotation={[0, 0, PI]}><torusGeometry args={[0.14, 0.022, 8, 24, PI]} />{icing}</mesh>}
      {/* buttons */}
      {['#e8394e', '#fffaf2', '#3fae6a'].map((c, i) => (
        <mesh key={i} position={[0, 1.28 - i * 0.24, Z - 0.02]}><sphereGeometry args={[0.065, 14, 10]} /><meshStandardMaterial color={c} roughness={0.3} /></mesh>
      ))}
      {/* icing zigzags on wrists and ankles */}
      {[[-1.0, 1.4, 0.35], [1.0, 1.4 + armUp * 0.45, -0.35 + armUp * 0.55], [-0.36, 0.2, 0.2], [0.36, 0.2, -0.2]].map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, 0.1]} rotation={[0, 0, r + PI / 2]}><torusGeometry args={[0.13, 0.018, 6, 18, PI]} />{icing}</mesh>
      ))}
    </group>
  );
};

/* ---------------- the candy cane ---------------- */
const Cane: React.FC<{tex: THREE.Texture}> = ({tex}) => (
  <group>
    <mesh position={[0, -0.55, 0]}><cylinderGeometry args={[0.07, 0.07, 1.4, 20]} /><meshStandardMaterial map={tex} roughness={0.25} /></mesh>
    <mesh position={[0.22, 0.15, 0]}><torusGeometry args={[0.22, 0.07, 14, 28, PI]} /><meshStandardMaterial map={tex} roughness={0.25} /></mesh>
  </group>
);

/* ---------------- the world ---------------- */
const World: React.FC<{t: number}> = ({t}) => {
  const stripes = useTex((g, w, h) => {
    g.fillStyle = '#fff6f0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e3263f';
    for (let i = -h; i < w + h; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 30, 0); g.lineTo(i + 30 + h, h); g.lineTo(i + h, h); g.fill(); }
  }, 256, 128, 'stripes', [1, 4]);
  const glow = useTex(glowTex, 128, 128, 'glow');
  const nameTex = useTex((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = 'bold 190px "Segoe Script", "Comic Sans MS", cursive'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 22; g.strokeStyle = '#fffaf2'; g.lineJoin = 'round';
    g.strokeText('Max', w / 2, h / 2 + 8);
    g.fillStyle = '#fffaf2'; g.fillText('Max', w / 2, h / 2 + 8);
  }, 512, 256, 'name');
  const sign = useTex((g, w, h) => {
    g.fillStyle = '#2b140c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffcf9a'; g.lineWidth = 10; g.strokeRect(16, 16, w - 32, h - 32);
    g.fillStyle = '#ffe9cf'; g.font = 'bold 130px Cambria'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Süßes', w / 2, h / 2 + 8);
  }, 768, 220, 'sign');
  const heartShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.42);
    s.bezierCurveTo(-0.15, -0.28, -0.52, -0.05, -0.5, 0.18);
    s.bezierCurveTo(-0.48, 0.42, -0.12, 0.45, 0, 0.22);
    s.bezierCurveTo(0.12, 0.45, 0.48, 0.42, 0.5, 0.18);
    s.bezierCurveTo(0.52, -0.05, 0.15, -0.28, 0, -0.42);
    return s;
  }, []);

  /* ---- states ---- */
  // hook: the cone already on his head; on "Halt" it rewinds up and away
  const hookCone = t < T_HALT ? 1 : 1 - prog(t, T_HALT, 0.55);
  // Puderzucker
  const sieve = prog(t, T_Q1 - 0.1, 0.4) * (1 - prog(t, T_R1 + 0.9, 0.4));
  const pouring = t > T_Q1 + 0.2 && t < T_R1 + 0.6;
  const stollenIn = prog(t, T_Q1 - 0.2, 0.5);
  const stollenPow = prog(t, T_Q1 + 0.2, Math.max(0.5, T_R1 - T_Q1));
  const sneeze = t > T_PUDER && t < T_PUDER + 0.6 ? Math.sin(((t - T_PUDER) / 0.6) * PI) : 0;
  const powder = t < T_Q1 ? 0 : t < T_PUDER ? 0.75 * prog(t, T_Q1 + 0.2, T_PUDER - T_Q1) : 0.75 - 0.5 * prog(t, T_PUDER, 0.3);
  const powder2 = t > T_KEIN ? powder * (1 - prog(t, T_KEIN, 1)) : powder;
  // Zuckerguss: heart swings down on "Herz", piping bag writes during the guess
  const heartIn = prog(t, T_HERZ - 0.35, 0.5);
  const heartSwing = Math.sin((t - T_HERZ) * 5) * 0.25 * Math.exp(-Math.max(0, t - T_HERZ) * 1.8);
  const write = clamp((t - (endOf('s05') - 0.1)) / Math.max(0.6, T_GUSS - endOf('s05') + 0.2));
  const bag = t > endOf('s05') - 0.4 && t < T_GUSS + 0.6 ? 1 : 0;
  // Zuckerstange: spins in from the right during the guess, lands in his hand on the reveal
  const caneFly = prog(t, T_Q3 + 0.1, Math.max(0.6, T_STANGE - T_Q3 - 0.1));
  const armUp = prog(t, T_STANGE - 0.25, 0.35) * (1 - prog(t, T_KEIN, 0.4)) ;
  // Zuckerhut: drops from above on "Kopf"
  const hutDrop = t < T_Q4 ? 0 : prog(t, T_HUT, Math.max(0.4, T_KOPF - T_HUT + 0.15));
  const rum = prog(t, T_RUM, Math.max(0.4, T_ANZ - T_RUM));
  const fire = t > T_ANZ ? prog(t, T_ANZ, 0.25) : 0;
  const lift = prog(t, T_KEIN - 0.05, 0.75); // cone moves from head to the tongs
  const bowlIn = prog(t, T_KEIN - 0.3, 0.6);
  const panic = t > T_ANZ && t < T_KEIN + 0.4;
  const hop = t > T_KEIN && t < T_KEIN + 0.6 ? Math.sin(((t - T_KEIN) / 0.6) * PI) * 0.6 : 0;
  const manX = -0.35 * prog(t, T_KEIN, 0.6);

  // cone position: hook (on head) → away → drop on Kopf → lift to tongs
  const HEAD: [number, number, number] = [0, 2.18, 0.0], TONG: [number, number, number] = [1.95, 1.18, 0.2];
  let cone: [number, number, number] | null = null, coneS = 1, coneR = 0;
  if (t < T_HALT + 0.6 && hookCone > 0.01) { cone = [HEAD[0] + (1 - hookCone) * 0.6, HEAD[1] + (1 - hookCone) * 5, 0]; coneR = (1 - hookCone) * 1.4; }
  else if (t >= T_HUT - 0.05 && t < T_KEIN - 0.05) { cone = [0, HEAD[1] + (1 - hutDrop) * 4.5, 0]; coneR = (1 - hutDrop) * 0.6; }
  else if (t >= T_KEIN - 0.05) {
    cone = [HEAD[0] + manX * (1 - lift) + (TONG[0] - HEAD[0]) * lift, HEAD[1] + (TONG[1] - HEAD[1]) * lift + Math.sin(lift * PI) * 0.9 + hop * (1 - lift), TONG[2] * lift];
  }
  const coneCol = new THREE.Color('#fbf7f0').lerp(new THREE.Color('#c9742c'), rum * 0.75).getStyle();
  const bob = Math.sin(t * 2.2) * 0.03;
  const panicShake = panic ? Math.sin(t * 46) * 0.04 : 0;
  const eyes = panic ? 'wide' : sneeze > 0.3 ? 'shut' : 'open';
  const mouth = panic || (t > T_STANGE - 0.1 && t < T_STANGE + 1.2) ? 'o' : 'smile';

  return (
    <group>
      {/* ---- backdrop: bokeh of a market at night ---- */}
      {Array.from({length: 26}, (_, i) => {
        const cols = ['#ffb35a', '#ff7a3d', '#ffd9a0', '#ff5a6e', '#ffe7c2'];
        return (
          <mesh key={i} position={[(rand(i + 1) - 0.5) * 18, -1 + rand(i + 3) * 9, -9 - rand(i + 5) * 4]}>
            <planeGeometry args={[1.2 + rand(i + 8) * 1.6, 1.2 + rand(i + 8) * 1.6]} />
            <meshBasicMaterial map={glow} color={cols[i % 5]} transparent opacity={0.25 + 0.2 * Math.sin(t * 1.3 + i)} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })}
      {/* back wall of the stall: planks */}
      {Array.from({length: 9}, (_, i) => (
        <mesh key={i} position={[-4 + i * 1.0, 2.4, -2.6]}>
          <boxGeometry args={[0.96, 6.2, 0.15]} /><meshStandardMaterial color={i % 2 ? '#4a2616' : '#55301c'} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 4.9, -2.45]}><planeGeometry args={[3.3, 0.95]} /><meshStandardMaterial map={sign} roughness={0.6} /></mesh>
      {/* string of lights in a sag across the wall */}
      {Array.from({length: 15}, (_, i) => {
        const u = i / 14, x = -4.4 + u * 8.8, y = 4.15 - Math.sin(u * PI) * 0.55;
        const on = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7);
        return (
          <group key={i} position={[x, y, -2.35]}>
            <mesh><sphereGeometry args={[0.09, 12, 10]} /><meshBasicMaterial color={i % 3 === 0 ? '#ffcf80' : '#ffb060'} /></mesh>
            <mesh><planeGeometry args={[0.9, 0.9]} /><meshBasicMaterial map={glow} color="#ffb060" transparent opacity={0.5 * on} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          </group>
        );
      })}
      {/* shelves with jars on the wall */}
      {[-3.3, 3.3].map((x, k) => (
        <group key={k} position={[x, 2.3, -2.2]}>
          <mesh><boxGeometry args={[1.8, 0.08, 0.5]} /><meshStandardMaterial color="#6b3d22" /></mesh>
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[-0.55 + j * 0.55, 0.32, 0]}><cylinderGeometry args={[0.2, 0.2, 0.55, 18]} />
              <meshStandardMaterial color={['#ffcf9a', '#ff8fa0', '#fff0d8'][(j + k) % 3]} transparent opacity={0.8} roughness={0.15} /></mesh>
          ))}
        </group>
      ))}

      {/* ---- the counter (Tresen) ---- */}
      <mesh position={[0, -1.3, 0.2]}><boxGeometry args={[9, 2.6, 2.4]} /><meshStandardMaterial color="#6a3a1e" roughness={0.75} /></mesh>
      <mesh position={[0, 0.02, 0.2]}><boxGeometry args={[9.1, 0.08, 2.5]} /><meshStandardMaterial color="#8a5230" roughness={0.55} /></mesh>
      {/* tannengrün garland on the counter front */}
      {Array.from({length: 22}, (_, i) => (
        <mesh key={i} position={[-4.4 + i * 0.42, -0.18 - Math.sin((i / 21) * PI * 3) * 0.08, 1.45]} rotation={[0, 0, i]}>
          <coneGeometry args={[0.2, 0.45, 6]} /><meshStandardMaterial color={i % 2 ? '#1f5a35' : '#2a6b40'} roughness={0.9} />
        </mesh>
      ))}

      {/* ---- Stollen (left) ---- */}
      <group position={[-1.9, 0.32, 0.3]} scale={[stollenIn, stollenIn, stollenIn]}>
        <mesh rotation={[0, 0, PI / 2]} scale={[1, 1, 0.75]}><capsuleGeometry args={[0.36, 1.0, 10, 24]} /><meshStandardMaterial color="#c4843f" roughness={0.85} /></mesh>
        <mesh rotation={[0, 0, PI / 2]} scale={[1.04, 1.04, 0.8]} position={[0, 0.02, 0]}><capsuleGeometry args={[0.36, 1.0, 10, 24]} />
          <meshStandardMaterial color="#fffaf4" roughness={0.95} transparent opacity={stollenPow * 0.95} /></mesh>
      </group>

      {/* ---- sieve and falling sugar ---- */}
      {sieve > 0.01 && (
        <group position={[-1.0 + Math.sin(t * 14) * 0.05 * (pouring ? 1 : 0), 3.6 + (1 - sieve) * 3, 0.3]} rotation={[0.25, 0, 0]}>
          <mesh rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.85, 0.06, 10, 40]} /><meshStandardMaterial color="#c9cdd4" metalness={0.8} roughness={0.3} /></mesh>
          <mesh rotation={[-PI / 2, 0, 0]}><circleGeometry args={[0.84, 40]} /><meshStandardMaterial color="#8d939c" metalness={0.6} roughness={0.5} transparent opacity={0.65} side={THREE.DoubleSide} /></mesh>
          <mesh position={[1.25, 0, 0]} rotation={[0, 0, PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.8, 8]} /><meshStandardMaterial color="#2b1a12" /></mesh>
        </group>
      )}
      {pouring && Array.from({length: 110}, (_, i) => {
        const span = 3.4, ph = ((t - T_Q1) * (0.9 + rand(i + 2) * 0.5) + rand(i) * span) % span;
        const x = -1.0 + (rand(i + 11) - 0.5) * 2.6 + Math.sin(t * 2 + i) * 0.05;
        return <mesh key={i} position={[x, 3.45 - ph, 0.3 + (rand(i + 13) - 0.5) * 0.8]}><sphereGeometry args={[0.018 + rand(i + 7) * 0.02, 5, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>;
      })}
      {/* sneeze puff */}
      {sneeze > 0 && Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * PI * 2, r = 0.3 + sneeze * 0.9;
        return <mesh key={i} position={[Math.cos(a) * r, 1.6 + Math.sin(a) * r * 0.8, 0.5]}><sphereGeometry args={[0.12 + rand(i) * 0.1, 10, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.7 * sneeze} depthWrite={false} /></mesh>;
      })}

      {/* ---- the gingerbread man ---- */}
      <group position={[manX + panicShake, hop + bob * (panic ? 0 : 1), 0.1]}>
        <Ginger t={t} powder={powder2} eyes={eyes} mouth={mouth} armUp={armUp} sq={sneeze * 0.12 + (t > T_KOPF && t < T_KOPF + 0.25 ? Math.sin(((t - T_KOPF) / 0.25) * PI) * 0.12 : 0)} />
        {/* gingerbread heart on a ribbon */}
        {heartIn > 0.01 && (
          <group position={[0, 1.55 + (1 - heartIn) * 3, 0.32]} rotation={[0, 0, heartSwing]}>
            <mesh position={[-0.26, 0.48, -0.02]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.04, 0.55, 0.02]} /><meshStandardMaterial color="#e3263f" /></mesh>
            <mesh position={[0.26, 0.48, -0.02]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.04, 0.55, 0.02]} /><meshStandardMaterial color="#e3263f" /></mesh>
            <group position={[0, -0.05, 0]} scale={1.05}>
              <mesh><extrudeGeometry args={[heartShape, {depth: 0.09, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3}]} /><meshStandardMaterial color="#8e4a1f" roughness={0.7} /></mesh>
              {/* icing border */}
              <mesh position={[0, 0, 0.125]}><extrudeGeometry args={[heartShape, {depth: 0.005, bevelEnabled: false}]} /><meshStandardMaterial color="#ff5a73" roughness={0.4} transparent opacity={0.0} /></mesh>
              {write > 0 && (() => {
                nameTex.repeat.set(write, 1); nameTex.offset.set(0, 0);
                const W = 0.82;
                return <mesh position={[-W / 2 + (W * write) / 2, 0.05, 0.135]}><planeGeometry args={[W * write, 0.41]} /><meshBasicMaterial map={nameTex} transparent depthWrite={false} /></mesh>;
              })()}
            </group>
          </group>
        )}
        {/* piping bag writing */}
        {bag > 0 && (
          <group position={[-0.4 + write * 0.8, 1.62 + Math.sin(write * 26) * 0.05 + 0.55, 0.7]} rotation={[0.5, 0, 0.35]}>
            <mesh position={[0, 0.0, 0]} rotation={[PI, 0, 0]}><coneGeometry args={[0.16, 0.6, 18]} /><meshStandardMaterial color="#f2efe8" roughness={0.6} /></mesh>
            <mesh position={[0, -0.33, 0]}><cylinderGeometry args={[0.01, 0.01, 0.12, 6]} /><meshStandardMaterial color="#ffffff" /></mesh>
          </group>
        )}
        {/* candy cane: spins in, then sits in his raised right hand */}
        {t > T_Q3 && (
          <group position={[THREE.MathUtils.lerp(4.2, 1.02, caneFly), THREE.MathUtils.lerp(3.4, 1.72, caneFly) + Math.sin(caneFly * PI) * 0.6, 0.35]}
            rotation={[0, 0, (1 - caneFly) * PI * 5 + 0.15]}>
            <Cane tex={stripes} />
          </group>
        )}
      </group>

      {/* ---- the copper bowl with the tongs (Feuerzangenbowle) ---- */}
      {bowlIn > 0.01 && (
        <group position={[1.95 + (1 - bowlIn) * 4, 0, 0.2]}>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.35, 0.45, 0.24, 24]} /><meshStandardMaterial color="#3b2a20" metalness={0.5} roughness={0.5} /></mesh>
          <mesh position={[0, 0.98, 0]} rotation={[PI, 0, 0]}><sphereGeometry args={[0.85, 36, 18, 0, PI * 2, 0, PI / 2]} /><meshStandardMaterial color="#c8743c" metalness={0.85} roughness={0.28} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0.98, 0]} rotation={[PI / 2, 0, 0]}><torusGeometry args={[0.85, 0.04, 10, 40]} /><meshStandardMaterial color="#e0925a" metalness={0.9} roughness={0.2} /></mesh>
          <mesh position={[0, 0.9, 0]} rotation={[-PI / 2, 0, 0]}><circleGeometry args={[0.8, 36]} /><meshStandardMaterial color="#6a0f1a" emissive="#8a1a14" emissiveIntensity={0.25 + fire * 0.4} roughness={0.12} /></mesh>
          {/* the tongs across the rim */}
          {[-0.14, 0.14].map((z) => <mesh key={z} position={[0, 1.04, z]}><boxGeometry args={[2.0, 0.04, 0.05]} /><meshStandardMaterial color="#9aa0a8" metalness={0.9} roughness={0.25} /></mesh>)}
          {/* caramel drips into the punch */}
          {fire > 0 && lift > 0.95 && Array.from({length: 4}, (_, i) => {
            const ph = ((t * 0.9 + i * 0.25) % 1);
            return <mesh key={i} position={[(i - 1.5) * 0.06, 1.0 - ph * 0.12, 0.2]} scale={[1, 1.6, 1]}><sphereGeometry args={[0.03, 8, 6]} /><meshStandardMaterial color="#e08a2a" emissive="#ff8a2a" emissiveIntensity={0.8} /></mesh>;
          })}
          {/* steam */}
          {Array.from({length: 8}, (_, i) => {
            const ph = (t * 0.45 + i / 8) % 1;
            return <mesh key={i} position={[Math.sin(ph * 6 + i) * 0.4 + (i % 3 - 1) * 0.3, 1.1 + ph * 1.6, -0.2]} scale={0.6 + ph * 2}><sphereGeometry args={[0.12, 10, 8]} /><meshBasicMaterial color="#fff2e6" transparent opacity={(1 - ph) * 0.13} depthWrite={false} /></mesh>;
          })}
        </group>
      )}

      {/* ---- the Zuckerhut ---- */}
      {cone && (
        <group position={cone} rotation={[0, coneR, coneR * 0.3]}>
          <mesh position={[0, 0.72, 0]}><coneGeometry args={[0.44, 1.45, 40]} /><meshStandardMaterial color={coneCol} roughness={0.55} emissive="#ffffff" emissiveIntensity={0.04 + 0.1 * (1 - rum)} /></mesh>
          {/* sparkle crystals */}
          {Array.from({length: 14}, (_, i) => {
            const h = rand(i + 40), a = rand(i + 50) * PI * 2, r = 0.44 * (1 - h) + 0.01;
            const tw = Math.max(0, Math.sin(t * 4 + i * 2.3));
            return <mesh key={i} position={[Math.cos(a) * r, h * 1.45, Math.sin(a) * r]}><octahedronGeometry args={[0.025 * (0.5 + tw), 0]} /><meshBasicMaterial color="#ffffff" /></mesh>;
          })}
          {/* rum running down */}
          {rum > 0 && rum < 1 && Array.from({length: 6}, (_, i) => {
            const a = (i / 6) * PI * 2 + 0.3, y = 1.45 - rum * 1.3 - (i % 2) * 0.1, r = 0.44 * (1 - y / 1.45) + 0.02;
            return <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} scale={[1, 1.8, 1]}><sphereGeometry args={[0.035, 8, 6]} /><meshStandardMaterial color="#a8501a" roughness={0.1} metalness={0.2} /></mesh>;
          })}
          {fire > 0 && (
            <>
              <group position={[0, 0.85, 0]}><Flame t={t} s={1.25 * fire} seed={1} /></group>
              <group position={[0, 0.35, 0]}><Flame t={t + 0.3} s={1.5 * fire} seed={2} /></group>
              <pointLight position={[0, 1.2, 0.6]} intensity={(9 + Math.sin(t * 23) * 2.5) * fire} distance={6} color="#ff9a4a" />
              <pointLight position={[0, 0.8, 0.6]} intensity={4 * fire} distance={4} color="#5a8cff" />
            </>
          )}
        </group>
      )}
      {/* a match on "angezündet" */}
      {t > T_ANZ - 0.5 && t < T_ANZ + 0.5 && (
        <group position={[0.9 - prog(t, T_ANZ - 0.5, 0.45) * 0.35, 3.3 - prog(t, T_ANZ - 0.5, 0.45) * 0.3, 0.6]} rotation={[0, 0, 0.9]}>
          <mesh><cylinderGeometry args={[0.02, 0.02, 0.6, 6]} /><meshStandardMaterial color="#e8c890" /></mesh>
          <mesh position={[0, 0.32, 0]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#b0201e" /></mesh>
          <group position={[0, 0.36, 0]}><Flame t={t} s={0.25} seed={5} /></group>
        </group>
      )}
    </group>
  );
};

/* ---------------- overlays ---------------- */
const Caption: React.FC<{id: string; to?: number; size?: number}> = ({id, to, size = 66}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  const L = line(id);
  const a = L.words[0].s - 0.1, b = to ?? L.end + 0.3;
  if (t < a - 0.05 || t > b + 0.25) return null;
  const words = L.text.split(' ');
  return (
    <div style={{position: 'absolute', top: SAFE.top + 70, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((b + 0.25 - t) / 0.25)}}>
      <div style={{display: 'inline-block', fontFamily: CAM, fontWeight: 700, fontSize: size, lineHeight: 1.15, color: '#fff', textShadow: '0 3px 18px rgba(0,0,0,.95), 0 0 4px rgba(0,0,0,.8)'}}>
        {words.map((w, i) => <React.Fragment key={i}><Pop show={L.words[Math.min(i, L.words.length - 1)].s - 0.05}>{w}</Pop>{i < words.length - 1 ? ' ' : ''}</React.Fragment>)}
      </div>
    </div>
  );
};

/* the guess clock: three sugar cubes melt away during the pause */
const GuessClock: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  if (t < from - 0.1 || t > to + 0.15) return null;
  const k = clamp((t - from) / Math.max(0.3, to - from));
  return (
    <div style={{position: 'absolute', top: SAFE.top + 270, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26, opacity: clamp((to + 0.15 - t) / 0.15) * clamp((t - from + 0.1) / 0.15)}}>
      {[0, 1, 2].map((i) => {
        const gone = clamp(k * 3 - i);
        return <div key={i} style={{width: 54, height: 54, borderRadius: 10, background: '#fffaf2', boxShadow: '0 6px 18px rgba(0,0,0,.5)', transform: `scale(${1 - gone * 0.7}) rotate(${gone * 40}deg)`, opacity: 1 - gone * 0.85}} />;
      })}
    </div>
  );
};

const Reveal: React.FC<{it: Item; to: number; showEn?: boolean}> = ({it, to}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  const from = it.tAns - 0.15;
  if (t < from - 0.1 || t > to) return null;
  const s = spring({frame: f - Math.round(from * fps), fps, config: {damping: 12, stiffness: 160}});
  const out = clamp((to - t) / 0.25);
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 20, display: 'flex', justifyContent: 'center', opacity: out}}>
      <div style={{transform: `translateY(${(1 - s) * 140}px) scale(${0.7 + 0.3 * s})`, background: 'rgba(28,12,6,.9)', borderRadius: 34, padding: '24px 40px 22px', border: `4px solid ${ACC}`, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.6)'}}>
        <div style={{fontFamily: BLK, fontSize: 84, lineHeight: 1.05, color: '#fff', whiteSpace: 'nowrap'}}>
          <span style={{color: GENUS[it.art], marginRight: 22}}>{it.art}</span>
          {it.pre}<span style={{color: ACC, textDecoration: 'underline', textDecorationThickness: 8, textUnderlineOffset: 12}}>{it.stem}</span>{it.post}
        </div>
        <div style={{fontFamily: CAM, fontStyle: 'italic', fontSize: 38, color: 'rgba(255,255,255,.75)', marginTop: 10}}>{it.en}</div>
      </div>
    </div>
  );
};

/* the family so far: four sugar cubes with the found words, the last one locked with a "?" until the twist */
const Family: React.FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  if (t < T_Q1 - 0.2 || t > T_OUT - 0.1) return null;
  const words = ['Puder', 'Guss', 'Stange', 'Hut'];
  const op = clamp((t - T_Q1 + 0.2) / 0.3) * clamp((T_OUT - 0.1 - t) / 0.3);
  return (
    <div style={{position: 'absolute', top: SAFE.top, left: SAFE.side, right: SAFE.side, display: 'flex', justifyContent: 'center', gap: 14, opacity: op}}>
      {words.map((w, i) => {
        const found = t >= ITEMS[i].tAns;
        const burnt = i === 3 && t > T_KEIN;
        return (
          <div key={w} style={{fontFamily: BLK, fontSize: 26, padding: '6px 14px', borderRadius: 10, letterSpacing: 1,
            background: found ? (burnt ? ACC : '#fffaf2') : 'rgba(255,255,255,.14)', color: found ? '#2a120a' : 'rgba(255,255,255,.6)',
            transform: `scale(${found ? 1 + 0.2 * Math.exp(-(t - ITEMS[i].tAns) * 6) : 0.95})`}}>
            {found ? (burnt ? <s>Hut</s> : w) : i === 3 ? '?' : '·'}
          </div>
        );
      })}
    </div>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const sh = shotAt(t);
  const shake = (t > T_ANZ && t < T_ANZ + 0.45 ? Math.sin((t - T_ANZ) * 55) * 0.06 * (1 - (t - T_ANZ) / 0.45) : 0)
    + (t > T_KOPF && t < T_KOPF + 0.25 ? Math.sin((t - T_KOPF) * 60) * 0.03 : 0);
  const rew = t > T_HALT - 0.05 && t < T_HALT + 0.8 ? 1 - clamp((t - T_HALT - 0.45) / 0.35) : 0;
  const drift = Math.sin(t * 0.7) * 0.06;
  const fireGlow = t > T_ANZ ? prog(t, T_ANZ, 0.3) : 0;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#120806 0%, #2a1209 40%, #3d1c10 75%, #22100a 100%)'}}>
      <Audio src={staticFile('laneC/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 0], fov: 40, near: 0.1, far: 80}} gl={{antialias: true}}>
        <fog attach="fog" args={['#2a1209', 11, 24]} />
        <ambientLight intensity={0.45} color="#ffd9b8" />
        <hemisphereLight args={['#ffcf9a', '#2a120a', 0.55]} />
        <directionalLight position={[-3, 6, 6]} intensity={1.0} color="#fff0dc" />
        <group position={[shake, 0, -sh.d]}>
          <group position={[-sh.x + drift, -sh.y, 0]}>
            <pointLight position={[0, 3.6, 2.2]} intensity={12} distance={9} color="#ffc68a" />
            <pointLight position={[-3, 2, 2.5]} intensity={5} distance={8} color="#ff9a5a" />
            <World t={t} />
          </group>
        </group>
        {/* soft snow in camera space */}
        {Array.from({length: 70}, (_, i) => {
          const z = -3 - rand(i + 7) * 7, spanY = 9;
          const y = 4 - ((rand(i + 2) * spanY + t * (0.3 + rand(i + 4) * 0.3)) % spanY);
          return <mesh key={i} position={[(rand(i) - 0.5) * (-z) * 0.85 + Math.sin(t + i) * 0.08, (y * (-z)) / 6, z]}><sphereGeometry args={[0.012 + rand(i + 9) * 0.016, 6, 5]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6} /></mesh>;
        })}
      </ThreeCanvas>

      {/* warm vignette, orange flash when the cone is lit */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)'}} />
      {fireGlow > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(255,140,50,${0.35 * Math.exp(-(t - T_ANZ) * 3)}) 0%, transparent 60%)`}} />}

      {/* rewind */}
      {rew > 0 && (
        <AbsoluteFill style={{background: `repeating-linear-gradient(0deg, rgba(255,255,255,${0.07 * rew}) 0 3px, transparent 3px 9px)`, mixBlendMode: 'screen'}}>
          <div style={{position: 'absolute', top: 880, width: '100%', textAlign: 'center', fontFamily: BLK, fontSize: 130, color: '#fff', opacity: rew, textShadow: '0 0 30px rgba(0,0,0,.8)'}}>◀◀</div>
        </AbsoluteFill>
      )}

      {/* HOOK: on screen from frame 0 */}
      {t < T_HALT + 0.15 && (
        <div style={{position: 'absolute', top: SAFE.top, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((T_HALT + 0.15 - t) / 0.2)}}>
          <div style={{fontFamily: CAM, fontWeight: 700, fontSize: 82, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,.95)'}}>Ein{NB}Hut{NB}aus</div>
          <div style={{fontFamily: BLK, fontSize: 168, lineHeight: 1, color: ACC, textShadow: '0 8px 34px rgba(0,0,0,.9)', transform: `scale(${1 + 0.04 * Math.sin(t * 5)})`}}>ZUCKER?</div>
        </div>
      )}
      {/* open loop */}
      {t > T_HALT - 0.05 && t < T_Q1 - 0.05 && (
        <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((T_Q1 - 0.05 - t) / 0.25)}}>
          <Pop show={T_HALT - 0.05}><div style={{display: 'inline-block', fontFamily: BLK, fontSize: 64, color: '#2a120a', background: ACC, borderRadius: 18, padding: '6px 30px'}}>HALT.</div></Pop>
          <div style={{marginTop: 26, fontFamily: CAM, fontWeight: 700, fontSize: 66, lineHeight: 1.15, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,.95)'}}>
            <Pop show={at('s02', 1) - 0.05}>Das{NB}letzte{NB}Wort</Pop><br />
            <Pop show={at('s02', 4) - 0.05}><span>ist <span style={{color: ACC}}>nicht,{NB}was{NB}du{NB}denkst.</span></span></Pop>
          </div>
        </div>
      )}

      <Family />

      {/* lead questions */}
      <Caption id="s03" to={endOf('s04') + 0.2} />
      <Caption id="s05" to={endOf('s06') + 0.2} />
      <Caption id="s07" to={endOf('s08') - 0.2} />
      <Caption id="s09" to={T_ZUERST - 0.1} />
      {ITEMS.slice(0, 4).map((it) => <GuessClock key={it.lead} from={endOf(it.lead)} to={at(it.rev, 0)} />)}

      <Reveal it={ITEMS[0]} to={T_Q2 - 0.05} />
      <Reveal it={ITEMS[1]} to={T_Q3 - 0.05} />
      <Reveal it={ITEMS[2]} to={T_Q4 - 0.05} />
      <Reveal it={ITEMS[3]} to={T_ZUERST + 0.3} />

      {/* "Achtung, die!" */}
      {t > T_ACHT - 0.15 && t < T_Q4 - 0.05 && (
        <div style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', opacity: clamp((T_Q4 - 0.05 - t) / 0.2)}}>
          <Pop show={T_DIE2 - 0.1}><div style={{display: 'inline-block', fontFamily: BLK, fontSize: 150, color: '#1a0a08', background: GENUS.die, borderRadius: 30, padding: '0 46px', transform: 'rotate(-6deg)', boxShadow: '0 16px 50px rgba(0,0,0,.6)'}}>DIE!</div></Pop>
        </div>
      )}

      {/* s10: the page sentence */}
      {t > T_ZUERST - 0.1 && t < T_KEIN - 0.05 && (
        <div style={{position: 'absolute', top: SAFE.top + 30, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((T_KEIN - 0.05 - t) / 0.2)}}>
          <div style={{fontFamily: CAM, fontWeight: 700, fontSize: 60, lineHeight: 1.18, color: '#fff', textShadow: '0 4px 22px rgba(0,0,0,.95)'}}>
            {line('s10').text.replace(/\.$/, '').split(' ').map((w, i, arr) => {
              const hl = /Zuckerhut|Rum|angezündet/.test(w);
              return <React.Fragment key={i}><Pop show={at('s10', i) - 0.05}><span style={{color: hl ? ACC : '#fff'}}>{w}</span></Pop>{i < arr.length - 1 ? ' ' : ''}</React.Fragment>;
            })}
          </div>
        </div>
      )}

      {/* s11: Kein Hut! + Feuerzangenbowle */}
      {t > T_KEIN - 0.1 && t < T_OUT - 0.1 && (
        <>
          <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((T_OUT - 0.1 - t) / 0.25)}}>
            <Pop show={T_KEIN - 0.05}><div style={{fontFamily: BLK, fontSize: 150, color: '#fff', textShadow: '0 8px 34px rgba(0,0,0,.95)'}}>KEIN{NB}<span style={{color: ACC, textDecoration: 'line-through', textDecorationThickness: 14}}>HUT!</span></div></Pop>
          </div>
          <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 20, display: 'flex', justifyContent: 'center', opacity: clamp((T_OUT - 0.1 - t) / 0.25)}}>
            <Pop show={T_FZB - 0.15}>
              <div style={{background: 'rgba(28,12,6,.9)', borderRadius: 34, padding: '22px 36px', border: `4px solid ${ACC}`, textAlign: 'center'}}>
                <div style={{fontFamily: CAM, fontSize: 40, color: 'rgba(255,255,255,.85)', fontWeight: 700}}>Er{NB}gehört{NB}zur</div>
                <div style={{fontFamily: BLK, fontSize: 70, color: '#fff', whiteSpace: 'nowrap'}}><span style={{color: GENUS.die}}>die</span>{NB}Feuerzangenbowle</div>
                <div style={{fontFamily: CAM, fontStyle: 'italic', fontSize: 34, color: 'rgba(255,255,255,.75)', marginTop: 6}}>flaming punch (sugar loaf soaked in rum)</div>
              </div>
            </Pop>
          </div>
        </>
      )}

      {/* outro: teaser + CTA over the rhyme shot */}
      {t > T_OUT - 0.1 && (
        <>
          <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}>
            <Pop show={T_OUT - 0.05}><div style={{fontFamily: CAM, fontWeight: 700, fontSize: 58, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,.9)'}}>Morgen:<br /><span style={{fontFamily: BLK, fontSize: 80, color: ACC}}>mehr Süßes vom Markt.</span></div></Pop>
          </div>
          <div style={{position: 'absolute', bottom: SAFE.bottom + 40, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <FollowCTA show={T_CTA - 0.1} accent={ACC} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
