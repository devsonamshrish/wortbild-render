/* idiom-weihnachtsmarkt-02 · "Der Nussknacker raspelt Süßholz"
   Leitmetapher: an Erzgebirge wooden-toy market at night. The protagonist is a smooth-talking nutcracker at the
   Mandelstand. Every idiom is acted out literally on his body: he rasps a real stick of Süßholz (shavings fly at the
   vendor), a roast pops up on his hat and she literally smells it (den Braten riechen), a little girl's giant finger
   reels him in and he is wound round it on a golden ribbon (um den Finger wickeln), his mug tips onto his phone and
   presents rain down (Schöne Bescherung = gift-giving per Kap. 10, but meant ironically: a fine mess).
   Loop: the last shot returns to the first one: he is rasping Süßholz again. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneF-timings.json';
import {makeTiming, Pop, Spoken, Card, FollowCTA, SAFE, rand, clamp, prog, Timings} from '../lib/kit';

const {line, at, scene, frames} = makeTiming(T as unknown as Timings);
export const FRAMES = frames();

const ACC = '#f4b740'; // the one accent: candle gold
const NIGHT = '#0a0e22';
const TITLE = '"Palatino Linotype", Palatino, Georgia, serif';
const UI = '"Trebuchet MS", "Segoe UI", sans-serif';
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const end = (id: string) => line(id).end;
const bump = (t: number, t0: number, d = 0.5) => (t > t0 && t < t0 + d ? Math.sin(((t - t0) / d) * Math.PI) : 0);

/* ---------------- anchors: every beat sits on a spoken word ---------------- */
const A = {
  nuss: () => at('s01', 1), raspelt: () => at('s01', 2), suess0: () => at('s01', 3),
  loop: () => line('s02').start, schoen: () => at('s02', 6), nicht: () => at('s02', 10),
  s03: () => line('s03').start, mandel: () => at('s03', 3), suess: () => at('s03', 4), raspeln: () => at('s03', 6),
  braten0: () => scene('braten').start, nett: () => at('s04', 4), merkt: () => end('s04') - 0.1, s04end: () => end('s04'),
  s05: () => line('s05').start, braten: () => at('s05', 4), gerochen: () => at('s05', 5), nett2: () => at('s05', 9),
  finger0: () => scene('finger').start, kleine: () => at('s06', 3), laechelt: () => at('s06', 5), s06end: () => end('s06'),
  s07: () => line('s07').start, laecheln: () => at('s07', 6), um: () => at('s07', 7), finger: () => at('s07', 9), gewickelt: () => at('s07', 10),
  besch0: () => scene('bescherung').start, tasse: () => at('s08', 2), umgekippt: () => at('s08', 3), handy: () => at('s08', 4), nass: () => at('s08', 5), s08end: () => end('s08'),
  schoene: () => at('s09', 0), besch: () => at('s09', 1),
  payoff: () => scene('payoff').start, geschenke: () => at('s10', 2), ironisch: () => at('s10', 5),
  s11: () => line('s11').start, raspelt2: () => at('s11', 2), suess2: () => at('s11', 5),
  outro: () => scene('outro').start, follow: () => line('s13').start,
};

const raspActive = (t: number) => t < A.braten0() + 0.4 || t > A.raspelt2() - 0.15;

/* ---------------- textures ---------------- */
const useTex = (draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 256) =>
  useMemo(() => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const useSky = () => useTex((g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05071a'); gr.addColorStop(0.5, '#141a3c'); gr.addColorStop(1, '#2a1f3a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(230,235,255,${0.2 + rand(i + 2) * 0.6})`; g.fillRect(rand(i) * w, rand(i + 1) * h * 0.45, 1.6, 1.6); }
  // distant stalls: warm bokeh
  for (let i = 0; i < 70; i++) {
    const x = rand(i * 3 + 9) * w, y = h * (0.52 + rand(i * 5 + 1) * 0.3), r = 8 + rand(i * 7) * 26;
    const b = g.createRadialGradient(x, y, 0, x, y, r);
    const warm = rand(i * 11) > 0.25;
    b.addColorStop(0, warm ? 'rgba(255,200,120,.55)' : 'rgba(170,200,255,.4)'); b.addColorStop(1, 'rgba(255,180,90,0)');
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // a church silhouette far behind
  g.fillStyle = '#0b0c1f';
  g.beginPath(); g.moveTo(w * 0.12, h * 0.62); g.lineTo(w * 0.12, h * 0.4); g.lineTo(w * 0.17, h * 0.22); g.lineTo(w * 0.22, h * 0.4); g.lineTo(w * 0.22, h * 0.62); g.fill();
  g.fillRect(w * 0.22, h * 0.48, w * 0.2, h * 0.14);
}, 768, 1365);

const useHalo = () => useTex((g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.3, 'rgba(255,190,90,.5)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, 128, 128);

const usePuff = () => useTex((g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,250,240,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, 128, 128);

const usePlanks = () => useTex((g, w, h) => {
  for (let i = 0; i < 12; i++) {
    const c = 82 + rand(i) * 34; g.fillStyle = `rgb(${c},${c * 0.6},${c * 0.36})`; g.fillRect((i * w) / 12, 0, w / 12, h);
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect((i * w) / 12, 0, 3, h);
    for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(30,12,0,${0.1 + rand(i * 40 + k) * 0.12})`; g.lineWidth = 1.4; g.beginPath(); const xx = (i * w) / 12 + rand(i * 9 + k) * (w / 12); g.moveTo(xx, 0); g.bezierCurveTo(xx + 5, h * 0.3, xx - 5, h * 0.6, xx + 2, h); g.stroke(); }
  }
}, 512, 512);

const useCobble = () => useTex((g, w, h) => {
  g.fillStyle = '#5c6478'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 18; r++) for (let c = 0; c < 18; c++) {
    const x = (c + (r % 2 ? 0.5 : 0)) * (w / 18), y = r * (h / 18), v = 0.75 + rand(r * 37 + c) * 0.3;
    g.fillStyle = `rgb(${90 * v},${98 * v},${118 * v})`; g.beginPath(); g.ellipse(x, y, w / 40, h / 44, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = 'rgba(235,240,255,.55)';
  for (let i = 0; i < 500; i++) { g.beginPath(); g.arc(rand(i) * w, rand(i + 5) * h, 1 + rand(i + 9) * 5, 0, Math.PI * 2); g.fill(); }
}, 512, 512);

const useSign = () => useTex((g, w, h) => {
  g.fillStyle = '#3a2412'; g.fillRect(0, 0, w, h);
  g.strokeStyle = ACC; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#ffd98a'; g.font = `italic bold ${h * 0.44}px "Palatino Linotype", Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#ff9d2e'; g.shadowBlur = 18;
  g.fillText('Gebrannte Mandeln', w / 2, h * 0.54);
}, 1024, 230);

/* ---------------- shared materials ---------------- */
const M = {
  red: {color: '#b3202d', roughness: 0.35, metalness: 0.05},
  black: {color: '#121212', roughness: 0.25, metalness: 0.1},
  white: {color: '#f3eee4', roughness: 0.6},
  skin: {color: '#f0c9a0', roughness: 0.55},
  gold: {color: ACC, roughness: 0.25, metalness: 0.85, emissive: '#5a3a00', emissiveIntensity: 0.4},
  wood: {color: '#8a5a32', roughness: 0.7},
};

/* ---------------- the nutcracker: where he is and what he does ---------------- */
const NX = -1.3, NY = -3.0, NZ = 0.7, NROT = 0.5;
const FX = -2.05, FZ = 0.9, FR = 0.78; // the giant finger axis and the helix radius around it

const nutState = (t: number) => {
  let x = NX, y = NY, z = NZ, ry = NROT, s = 1, lean = 0;
  // "verdächtig nett": bows towards the vendor
  lean = 0.22 * bump(t, A.nett() - 0.1, 0.9) + 0.12 * bump(t, A.nett2() - 0.1, 0.7);
  // pulled in by the smile, then wound round the finger
  const pull = prog(t, A.laecheln() - 0.1, 0.45);
  const wStart = A.um() - 0.15, wDur = Math.max(1.0, A.gewickelt() - A.um() + 0.5);
  const w = clamp((t - wStart) / wDur);
  const release = prog(t, A.besch0() - 0.1, 0.6);
  if (pull > 0 && release < 1) {
    const th = -0.2 + w * 3.25 * Math.PI * 2;
    const hx = FX + FR * Math.cos(th), hz = FZ + FR * Math.sin(th), hy = lerp(-1.15, 1.45, w);
    const k = pull * (1 - release);
    const sc = lerp(1, 0.3, Math.max(pull * 0.35, w > 0 ? clamp(w * 3) : 0));
    x = lerp(NX, hx, k); y = lerp(NY, hy - 0.65, k); z = lerp(NZ, hz, k);
    s = lerp(1, sc, 1 - release);
    ry = NROT + th * k + (w >= 1 ? Math.sin(t * 2) * 0.3 : 0);
    if (w >= 1) y += Math.sin(t * 3.4) * 0.05 * (1 - release);
  }
  // the jaw: chatters while he sweet-talks, drops at the disasters
  const talking = (t < A.braten0() + 0.3) || (t > A.nett() - 0.3 && t < A.s04end()) || t > A.raspelt2() - 0.2;
  let jaw = talking ? Math.abs(Math.sin(t * 13)) * 0.12 : 0;
  jaw += 0.22 * prog(t, A.gerochen(), 0.2) * (1 - prog(t, A.finger0(), 0.3));
  jaw += 0.3 * prog(t, A.nass(), 0.15) * (1 - prog(t, A.payoff(), 0.4));
  return {x, y, z, ry, s, lean, jaw, w};
};

const Nutcracker: React.FC<{t: number}> = ({t}) => {
  const n = nutState(t);
  const rasp = raspActive(t);
  const strokeX = rasp ? Math.sin(t * 17) * 0.28 : 0;
  const ribbonHold = n.w > 0 && n.w < 1;
  return (
    <group position={[n.x, n.y, n.z]} rotation={[0, n.ry, 0]} scale={n.s}>
      <group rotation={[n.lean, 0, -n.lean * 0.3]}>
        {/* boots and legs */}
        {[-0.22, 0.22].map((lx) => (
          <group key={lx}>
            <mesh position={[lx, 0.28, 0]}><cylinderGeometry args={[0.2, 0.22, 0.56, 24]} /><meshStandardMaterial {...M.black} /></mesh>
            <mesh position={[lx, 1.05, 0]}><cylinderGeometry args={[0.18, 0.19, 1.0, 24]} /><meshStandardMaterial {...M.white} /></mesh>
          </group>
        ))}
        {/* jacket, belt, buttons */}
        <mesh position={[0, 2.2, 0]}><cylinderGeometry args={[0.46, 0.52, 1.32, 32]} /><meshStandardMaterial {...M.red} /></mesh>
        <mesh position={[0, 1.62, 0]}><cylinderGeometry args={[0.535, 0.535, 0.15, 32]} /><meshStandardMaterial {...M.black} /></mesh>
        <mesh position={[0, 1.62, 0.53]}><boxGeometry args={[0.2, 0.17, 0.05]} /><meshStandardMaterial {...M.gold} /></mesh>
        {[1.9, 2.15, 2.4, 2.65].map((by) => (
          <mesh key={by} position={[0, by, 0.49]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial {...M.gold} /></mesh>
        ))}
        {/* epaulettes */}
        {[-0.5, 0.5].map((ex) => (
          <mesh key={ex} position={[ex, 2.84, 0]}><cylinderGeometry args={[0.2, 0.22, 0.08, 20]} /><meshStandardMaterial {...M.gold} /></mesh>
        ))}
        {/* arms reach forward to the stick and the rasp */}
        <group position={[0.56, 2.72, 0]} rotation={[-1.05, 0, 0.25]}>
          <mesh position={[0, -0.45, 0]}><cylinderGeometry args={[0.13, 0.14, 0.9, 16]} /><meshStandardMaterial {...M.red} /></mesh>
          <mesh position={[0, -0.95, 0]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial {...M.skin} /></mesh>
        </group>
        <group position={[-0.56, 2.72, 0]} rotation={[-1.15 + (rasp ? Math.sin(t * 17) * 0.12 : 0), 0, -0.35 + (rasp ? Math.sin(t * 17) * 0.18 : 0)]}>
          <mesh position={[0, -0.45, 0]}><cylinderGeometry args={[0.13, 0.14, 0.9, 16]} /><meshStandardMaterial {...M.red} /></mesh>
          <mesh position={[0, -0.95, 0]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial {...M.skin} /></mesh>
        </group>
        {/* the Süßholz stick (yellow-brown root) and the rasp gliding on it */}
        {!ribbonHold && (
          <group position={[0.1, 2.25, 0.9]} rotation={[0, 0, -0.35]}>
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.085, 0.1, 1.7, 14]} /><meshStandardMaterial color="#c9923f" roughness={0.8} /></mesh>
            <mesh position={[0.86, 0, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#e8c37a" roughness={0.8} /></mesh>
            <group position={[strokeX - 0.1, 0.13, 0]}>
              <mesh><boxGeometry args={[0.75, 0.06, 0.16]} /><meshStandardMaterial color="#9aa3ad" metalness={0.9} roughness={0.35} /></mesh>
              <mesh position={[-0.5, 0, 0]}><boxGeometry args={[0.3, 0.1, 0.12]} /><meshStandardMaterial {...M.wood} /></mesh>
            </group>
          </group>
        )}
        {/* head */}
        <mesh position={[0, 3.25, 0]}><cylinderGeometry args={[0.36, 0.37, 0.78, 32]} /><meshStandardMaterial {...M.skin} /></mesh>
        {[-0.13, 0.13].map((ex) => (
          <group key={ex}>
            <mesh position={[ex, 3.42, 0.34]}><sphereGeometry args={[0.05, 12, 12]} /><meshStandardMaterial {...M.black} /></mesh>
            <mesh position={[ex, 3.52, 0.34]} rotation={[0, 0, ex > 0 ? -0.25 - n.jaw : 0.25 + n.jaw]}><boxGeometry args={[0.15, 0.04, 0.04]} /><meshStandardMaterial {...M.white} /></mesh>
            <mesh position={[ex, 3.3, 0.35]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial color="#e07a6a" roughness={0.6} /></mesh>
          </group>
        ))}
        <mesh position={[0, 3.33, 0.39]}><sphereGeometry args={[0.08, 14, 14]} /><meshStandardMaterial color="#e89a7e" roughness={0.5} /></mesh>
        <mesh position={[0, 3.19, 0.38]}><boxGeometry args={[0.36, 0.08, 0.06]} /><meshStandardMaterial {...M.white} /></mesh>
        {/* the mouth opening and the beard/jaw that drops */}
        <mesh position={[0, 3.06, 0.355]}><boxGeometry args={[0.26, 0.04 + n.jaw * 0.9, 0.03]} /><meshStandardMaterial color="#2a0808" /></mesh>
        <mesh position={[0, 2.88 - n.jaw * 0.8, 0.3]}><boxGeometry args={[0.6, 0.36, 0.22]} /><meshStandardMaterial {...M.white} /></mesh>
        {/* hat */}
        <mesh position={[0, 3.66, 0]}><cylinderGeometry args={[0.44, 0.44, 0.08, 32]} /><meshStandardMaterial {...M.black} /></mesh>
        <mesh position={[0, 4.12, 0]}><cylinderGeometry args={[0.36, 0.39, 0.92, 32]} /><meshStandardMaterial {...M.black} /></mesh>
        <mesh position={[0, 3.8, 0]}><cylinderGeometry args={[0.395, 0.395, 0.12, 32]} /><meshStandardMaterial {...M.gold} /></mesh>
        <mesh position={[0, 4.2, 0.37]}><octahedronGeometry args={[0.1]} /><meshStandardMaterial {...M.gold} /></mesh>
      </group>
    </group>
  );
};

/* where the rasp touches the stick, in world space (shavings start here) */
const raspPoint = (t: number) => {
  const n = nutState(t);
  const lx = 0.3, ly = 2.3, lz = 0.95;
  return [n.x + (lx * Math.cos(n.ry) + lz * Math.sin(n.ry)) * n.s, n.y + ly * n.s, n.z + (-lx * Math.sin(n.ry) + lz * Math.cos(n.ry)) * n.s] as const;
};

const Shavings: React.FC<{t: number}> = ({t}) => {
  const N = 80, P = 1.15;
  return (
    <group>
      {Array.from({length: N}, (_, i) => {
        const age = (t + rand(i) * P) % P, born = t - age;
        if (!raspActive(born) || born < -0.6) return null;
        const [ox, oy, oz] = raspPoint(born);
        const vx = 1.3 + rand(i + 3) * 2.2, vy = 1.2 + rand(i + 5) * 2.2, vz = (rand(i + 7) - 0.3) * 1.6;
        const a = age;
        const sc = 0.05 + rand(i + 11) * 0.07;
        return (
          <mesh key={i} position={[ox + vx * a, oy + vy * a - 3.2 * a * a, oz + vz * a]} rotation={[t * 9 + i, t * 7 + i * 2, 0]} scale={[sc * 1.8, sc * 0.35, sc]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={i % 3 ? '#e9b863' : '#fff1b8'} emissive={ACC} emissiveIntensity={0.55} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------------- the vendor behind the counter ---------------- */
const VX = 1.7, VY = -1.0, VZ = -0.95;
const NOSE: [number, number, number] = [VX - 0.12, VY + 1.88, VZ + 0.45];
const Vendor: React.FC<{t: number}> = ({t}) => {
  const squint = prog(t, A.merkt(), 0.25) * (1 - prog(t, A.finger0() + 0.6, 0.4));
  const sniff = t > A.braten() - 0.1 && t < A.finger0() ? Math.abs(Math.sin(t * 16)) * 0.25 : 0;
  const tilt = 0.25 * prog(t, A.braten(), 0.3) * (1 - prog(t, A.finger0(), 0.4));
  const charmed = bump(t, A.suess() - 0.1, 0.8) * 0.15; // a flattered little sway
  const shock = prog(t, A.nass(), 0.2) * (1 - prog(t, A.raspelt2(), 0.4));
  return (
    <group position={[VX, VY, VZ]} rotation={[0, -0.35, charmed + Math.sin(t * 1.4) * 0.03]}>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.42, 0.55, 1.2, 28]} /><meshStandardMaterial color="#2f6a4d" roughness={0.6} /></mesh>
      <mesh position={[0, 0.5, 0.3]}><boxGeometry args={[0.6, 0.85, 0.3]} /><meshStandardMaterial {...M.white} /></mesh>
      <group position={[0, 1.55, 0]} rotation={[-tilt, 0, 0]}>
        <mesh><sphereGeometry args={[0.42, 32, 32]} /><meshStandardMaterial {...M.skin} /></mesh>
        {/* red headscarf */}
        <mesh position={[0, 0.1, -0.03]} scale={[1.05, 0.85, 1.05]}><sphereGeometry args={[0.44, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><meshStandardMaterial color="#8e1b26" roughness={0.7} /></mesh>
        {[-0.15, 0.15].map((ex) => (
          <mesh key={ex} position={[ex, 0.05, 0.38]} scale={[1, 1 - squint * 0.75 + shock * 0.5, 1]}><sphereGeometry args={[0.055, 12, 12]} /><meshStandardMaterial {...M.black} /></mesh>
        ))}
        {/* suspicious brows */}
        {[-0.15, 0.15].map((ex) => (
          <mesh key={'b' + ex} position={[ex, 0.16 - squint * 0.04 + shock * 0.06, 0.39]} rotation={[0, 0, (ex > 0 ? 1 : -1) * squint * 0.45]}><boxGeometry args={[0.14, 0.035, 0.03]} /><meshStandardMaterial color="#3b2414" /></mesh>
        ))}
        <mesh position={[0, -0.04, 0.42]} scale={1 + sniff}><sphereGeometry args={[0.075, 14, 14]} /><meshStandardMaterial color="#e8a080" roughness={0.5} /></mesh>
        <mesh position={[0, -0.2, 0.37]} rotation={[0, 0, Math.PI]} scale={[1, 0.6 + shock * 0.8, 1]}><torusGeometry args={[0.09, 0.02, 8, 16, Math.PI]} /><meshStandardMaterial color="#7a2020" /></mesh>
      </group>
    </group>
  );
};

/* ---------------- the stall ---------------- */
const Stall: React.FC<{t: number; halo: THREE.Texture}> = ({t, halo}) => {
  const planks = usePlanks(), sign = useSign();
  const bulbs = 16;
  return (
    <group>
      {/* back wall, lit from inside */}
      <mesh position={[1.2, 0.3, -1.9]}><planeGeometry args={[6.2, 4.8]} /><meshStandardMaterial map={planks} color="#c58a55" roughness={0.85} /></mesh>
      {/* shelves with jars of almonds */}
      {[0.2, 1.0].map((sy, r) => (
        <group key={sy}>
          <mesh position={[1.4, sy, -1.7]}><boxGeometry args={[4.2, 0.08, 0.35]} /><meshStandardMaterial {...M.wood} /></mesh>
          {Array.from({length: 9}, (_, k) => (
            <mesh key={k} position={[-0.5 + k * 0.48, sy + 0.2, -1.65]}><cylinderGeometry args={[0.14, 0.14, 0.32, 16]} /><meshStandardMaterial color={['#b8743a', '#d9a35a', '#7a4a22'][(k + r) % 3]} roughness={0.4} transparent opacity={0.92} /></mesh>
          ))}
        </group>
      ))}
      {/* posts */}
      {[-0.95, 3.35].map((px) => (
        <mesh key={px} position={[px, -0.35, -0.2]}><boxGeometry args={[0.22, 5.4, 0.22]} /><meshStandardMaterial map={planks} color="#a8703f" /></mesh>
      ))}
      {/* counter */}
      <mesh position={[1.2, -2.0, -0.6]}><boxGeometry args={[4.5, 2.0, 1.1]} /><meshStandardMaterial map={planks} color="#b77a45" roughness={0.8} /></mesh>
      <mesh position={[1.2, -0.97, -0.55]}><boxGeometry args={[4.7, 0.08, 1.25]} /><meshStandardMaterial color="#5a3419" roughness={0.6} /></mesh>
      {/* copper kettle with almonds and steam */}
      <mesh position={[2.55, -0.7, -0.6]}><cylinderGeometry args={[0.42, 0.3, 0.5, 28]} /><meshStandardMaterial color="#c8743a" metalness={0.9} roughness={0.3} /></mesh>
      {Array.from({length: 12}, (_, k) => (
        <mesh key={k} position={[2.55 + Math.cos(k * 2.4) * 0.25 * rand(k), -0.43, -0.6 + Math.sin(k * 2.4) * 0.25 * rand(k + 1)]} scale={[0.07, 0.05, 0.1]}><sphereGeometry args={[1, 10, 10]} /><meshStandardMaterial color="#6b3a16" roughness={0.3} /></mesh>
      ))}
      {/* roof with snow */}
      <group position={[1.2, 2.45, -0.6]} rotation={[0.28, 0, 0]}>
        <mesh><boxGeometry args={[6.6, 0.22, 2.6]} /><meshStandardMaterial map={planks} color="#7a4a26" /></mesh>
        <mesh position={[0, 0.18, 0]}><boxGeometry args={[6.7, 0.18, 2.65]} /><meshStandardMaterial color="#eef3ff" roughness={0.9} /></mesh>
      </group>
      {/* sign */}
      <mesh position={[1.25, 1.75, -0.75]}><planeGeometry args={[3.2, 0.72]} /><meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.35} /></mesh>
      {/* fairy lights along the roof edge */}
      {Array.from({length: bulbs}, (_, k) => {
        const u = k / (bulbs - 1), x = lerp(-1.95, 4.35, u), y = 1.98 - Math.sin(((u * 4) % 1) * Math.PI) * 0.16;
        const tw = 0.65 + 0.35 * Math.sin(t * 3 + k * 1.7);
        return (
          <group key={k} position={[x, y, 0.45]}>
            <mesh><sphereGeometry args={[0.055, 10, 10]} /><meshBasicMaterial color="#fff1c8" /></mesh>
            <sprite scale={[0.55 * tw, 0.55 * tw, 1]}><spriteMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.8} /></sprite>
          </group>
        );
      })}
    </group>
  );
};

/* ---------------- den Braten riechen: a roast pops up on his hat, she sniffs it ---------------- */
const Roast: React.FC<{t: number; puff: THREE.Texture}> = ({t, puff}) => {
  const p = prog(t, A.braten() - 0.15, 0.35);
  const out = prog(t, A.finger0() - 0.1, 0.4);
  const s = p * (1 - out);
  if (s <= 0.001) return null;
  const n = nutState(t);
  const top: [number, number, number] = [n.x, n.y + 4.72 * n.s, n.z];
  const pop = 1 + bump(t, A.braten() - 0.15, 0.45) * 0.4;
  return (
    <group>
      <group position={top} scale={s * pop}>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.55, 0.45, 0.06, 32]} /><meshStandardMaterial {...M.white} /></mesh>
        <mesh position={[0, 0.25, 0]} scale={[0.48, 0.3, 0.36]}><sphereGeometry args={[1, 24, 18]} /><meshStandardMaterial color="#7a3a16" roughness={0.25} metalness={0.1} /></mesh>
        <mesh position={[0.22, 0.38, 0.12]} scale={[0.2, 0.08, 0.14]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#a65a26" roughness={0.3} /></mesh>
        <mesh position={[0.55, 0.3, 0]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.05, 0.05, 0.4, 10]} /><meshStandardMaterial {...M.white} /></mesh>
        <mesh position={[0.66, 0.48, 0]}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial {...M.white} /></mesh>
      </group>
      {/* scent trail: from the roast straight into her nose */}
      {Array.from({length: 26}, (_, i) => {
        const P = 1.3, age = (t + (i / 26) * P) % P, born = t - age;
        if (born < A.braten()) return null;
        const u = age / P;
        const cx = lerp(top[0], NOSE[0], u), cz = lerp(top[2], NOSE[2], u);
        const cy = lerp(top[1] + 0.4, NOSE[1], u) + Math.sin(u * Math.PI) * 0.9;
        const wob = Math.sin(u * 9 + i) * 0.12;
        const sz = (0.18 + 0.22 * Math.sin(u * Math.PI)) * s;
        return (
          <sprite key={i} position={[cx + wob, cy, cz]} scale={[sz, sz, 1]}>
            <spriteMaterial map={puff} transparent depthWrite={false} opacity={0.7 * Math.sin(u * Math.PI) * (1 - out)} color="#fff4e0" />
          </sprite>
        );
      })}
    </group>
  );
};

/* ---------------- um den Finger wickeln: the girl and her giant finger ---------------- */
const Girl: React.FC<{t: number; halo: THREE.Texture}> = ({t, halo}) => {
  const inn = prog(t, A.kleine() - 0.35, 0.55), out = prog(t, A.besch0() + 0.3, 0.6);
  if (inn <= 0 || out >= 1) return null;
  const x = lerp(-4.2, -2.55, inn) - out * 2.2;
  const smile = prog(t, A.laechelt() - 0.05, 0.3);
  const hop = Math.abs(Math.sin(t * 9)) * 0.12 * (inn < 1 ? 1 : 0) + bump(t, A.laechelt(), 0.4) * 0.2;
  return (
    <group position={[x, -3.0 + hop, 1.25]} rotation={[0, 0.35, 0]} scale={1.5}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.2, 0.44, 1.0, 28]} /><meshStandardMaterial color="#c2415d" roughness={0.6} /></mesh>
      <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.16, 0.2, 0.15, 20]} /><meshStandardMaterial {...M.white} /></mesh>
      <mesh position={[0, 1.38, 0]}><sphereGeometry args={[0.3, 28, 28]} /><meshStandardMaterial {...M.skin} /></mesh>
      <mesh position={[0, 1.48, -0.04]} scale={[1.05, 0.9, 1.05]}><sphereGeometry args={[0.31, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} /><meshStandardMaterial color="#e0b04a" roughness={0.7} /></mesh>
      {[-0.32, 0.32].map((px) => (
        <mesh key={px} position={[px, 1.32, -0.02]} scale={[0.7, 1.2, 0.7]}><sphereGeometry args={[0.13, 14, 14]} /><meshStandardMaterial color="#e0b04a" roughness={0.7} /></mesh>
      ))}
      {[-0.1, 0.1].map((ex) => (
        <mesh key={ex} position={[ex, 1.42, 0.27]} scale={[1, 1 - smile * 0.6, 1]}><sphereGeometry args={[0.04, 10, 10]} /><meshStandardMaterial {...M.black} /></mesh>
      ))}
      {[-0.17, 0.17].map((ex) => (
        <mesh key={'c' + ex} position={[ex, 1.3, 0.24]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#ff8f8f" roughness={0.6} /></mesh>
      ))}
      <mesh position={[0, 1.27, 0.28]} rotation={[0, 0, Math.PI]} scale={0.6 + smile * 0.9}><torusGeometry args={[0.07, 0.018, 8, 16, Math.PI]} /><meshStandardMaterial color="#8a1f2a" /></mesh>
      {/* the smile sparkles */}
      {smile > 0 && Array.from({length: 7}, (_, k) => {
        const a = k * 0.9 + t * 1.5, r = 0.45 + 0.15 * Math.sin(t * 4 + k);
        const o = bump(t, A.laechelt() - 0.05 + k * 0.05, 1.3) + bump(t, A.laecheln() - 0.05 + k * 0.04, 1.0);
        return (
          <sprite key={k} position={[Math.cos(a) * r, 1.4 + Math.sin(a) * r, 0.3]} scale={[0.35 * o, 0.35 * o, 1]}>
            <spriteMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={o} />
          </sprite>
        );
      })}
      {/* raised arm */}
      <mesh position={[0.32, 1.05, 0.05]} rotation={[0, 0, -0.35]}><cylinderGeometry args={[0.06, 0.07, 0.55, 12]} /><meshStandardMaterial color="#c2415d" /></mesh>
    </group>
  );
};

const helix = (w: number) => {
  const th = -0.2 + w * 3.25 * Math.PI * 2;
  return new THREE.Vector3(FX + FR * Math.cos(th), lerp(-1.15, 1.45, w) + 0.0, FZ + FR * Math.sin(th));
};

const Finger: React.FC<{t: number}> = ({t}) => {
  const grow = prog(t, A.laecheln() - 0.2, 0.55);
  const gone = prog(t, A.besch0() + 0.1, 0.5);
  const ribbon = useMemo(() => {
    const pts = Array.from({length: 140}, (_, i) => helix(i / 139));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.06, 8, false);
  }, []);
  const k = grow * (1 - gone);
  if (k <= 0.001) return null;
  const wStart = A.um() - 0.15, wDur = Math.max(1.0, A.gewickelt() - A.um() + 0.5);
  const w = clamp((t - wStart) / wDur);
  const idx = ribbon.index ? ribbon.index.count : 0;
  ribbon.setDrawRange(0, Math.floor((idx * w) / 6) * 6);
  const L = 3.9;
  return (
    <group>
      <group position={[FX, -2.0, FZ]} scale={[k, k, k]}>
        <mesh position={[0, L / 2, 0]}><capsuleGeometry args={[0.34, L, 12, 28]} /><meshStandardMaterial color="#f2c4a0" roughness={0.5} /></mesh>
        {/* knuckle creases */}
        {[0.9, 2.1].map((ky) => (
          <mesh key={ky} position={[0, ky, 0.3]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.3]}><torusGeometry args={[0.12, 0.015, 6, 16, Math.PI]} /><meshStandardMaterial color="#c99572" /></mesh>
        ))}
        <mesh position={[0, L + 0.05, 0.22]} rotation={[-0.4, 0, 0]} scale={[0.24, 0.32, 0.08]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#ffd9d0" roughness={0.2} /></mesh>
      </group>
      {w > 0 && (
        <mesh geometry={ribbon}><meshStandardMaterial {...M.gold} /></mesh>
      )}
    </group>
  );
};

/* ---------------- Schöne Bescherung: mug, phone, puddle, presents ---------------- */
const MUGX = 0.15, PHX = 0.95, TOPY = -0.93, CZ = -0.35;
const Mishap: React.FC<{t: number}> = ({t}) => {
  const show = prog(t, A.besch0() - 0.2, 0.4) * (1 - prog(t, A.raspelt2() - 0.3, 0.5));
  if (show <= 0.001) return null;
  const tip = prog(t, A.umgekippt() - 0.12, 0.32);
  const wet = prog(t, A.umgekippt() + 0.1, 0.9);
  const screen = t < A.nass() ? 1 : t < A.nass() + 0.6 ? (Math.sin(t * 60) > 0 ? 1 : 0.1) : 0.05;
  return (
    <group scale={show}>
      {/* the mug tips over to the right, onto the phone */}
      <group position={[MUGX + 0.24, TOPY, CZ]} rotation={[0, 0, -tip * 1.62]}>
        <group position={[-0.24, 0.24, 0]}>
          <mesh><cylinderGeometry args={[0.24, 0.22, 0.48, 28]} /><meshStandardMaterial color="#a51d2b" roughness={0.3} /></mesh>
          <mesh position={[0, 0.235, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.21, 24]} /><meshStandardMaterial color="#4a0c1a" roughness={0.1} /></mesh>
          <mesh position={[-0.27, 0, 0]}><torusGeometry args={[0.12, 0.035, 10, 20]} /><meshStandardMaterial color="#a51d2b" roughness={0.3} /></mesh>
          <mesh position={[0, 0.02, 0.235]}><circleGeometry args={[0.09, 5]} /><meshStandardMaterial {...M.gold} /></mesh>
        </group>
      </group>
      {/* phone */}
      <group position={[PHX, TOPY + 0.02, CZ]} rotation={[0, 0.3, 0]}>
        <mesh><boxGeometry args={[0.36, 0.04, 0.66]} /><meshStandardMaterial {...M.black} /></mesh>
        <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.31, 0.6]} /><meshBasicMaterial color={screen > 0.5 ? '#9fd3ff' : '#10161f'} /></mesh>
      </group>
      {/* the Glühwein puddle */}
      <mesh position={[0.7, TOPY + 0.045, CZ + 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[wet * 1.1, wet * 0.75, 1]}><circleGeometry args={[0.6, 40]} /><meshStandardMaterial color="#5a0f22" roughness={0.05} metalness={0.2} transparent opacity={0.9} /></mesh>
      {/* splash */}
      {Array.from({length: 28}, (_, i) => {
        const a = t - (A.umgekippt() + 0.05);
        if (a < 0 || a > 0.9) return null;
        const vx = 0.6 + rand(i) * 1.6, vy = 1.0 + rand(i + 2) * 2.0, vz = (rand(i + 4) - 0.5) * 1.4;
        const s = 0.04 + rand(i + 6) * 0.05;
        return (
          <mesh key={i} position={[MUGX + 0.45 + vx * a, TOPY + 0.2 + vy * a - 5 * a * a, CZ + vz * a]} scale={s}>
            <sphereGeometry args={[1, 8, 8]} /><meshStandardMaterial color="#7a1030" roughness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
};

const GIFT_COLS = ['#b3202d', '#1f6b45', '#efe6d2', '#24407a', '#6a2a7a', '#c9581e'];
const GIFTS = Array.from({length: 17}, (_, i) => {
  const onCounter = i % 4 === 1;
  const s = 0.42 + rand(i * 3 + 1) * 0.38;
  const x = onCounter ? lerp(-0.4, 2.9, rand(i * 7)) : lerp(-2.7, 2.9, (i + rand(i * 5) * 0.8) / 17);
  const z = onCounter ? -0.35 : lerp(1.0, 2.2, rand(i * 11));
  const base = onCounter ? TOPY : -3.0;
  return {s, x, z, y: base + s / 2, ry: (rand(i * 13) - 0.5) * 1.2, col: GIFT_COLS[i % GIFT_COLS.length], delay: rand(i * 17) * 0.55};
});

const Gifts: React.FC<{t: number}> = ({t}) => {
  const t0 = A.besch() - 0.15;
  if (t < t0) return null;
  const wet = prog(t, A.ironisch() - 0.1, 0.35);
  return (
    <group>
      {GIFTS.map((g, i) => {
        const a = t - t0 - g.delay;
        if (a < 0) return null;
        const fall = clamp(a / 0.45);
        let y = lerp(7.5, g.y, fall * fall);
        if (fall >= 1) y = g.y + Math.abs(Math.sin((a - 0.45) * 12)) * 0.35 * Math.exp(-(a - 0.45) * 5);
        const gone = prog(t, A.raspelt2() - 0.4 + i * 0.02, 0.45);
        const squash = 1 - wet * 0.4;
        const sc = g.s * (1 - gone);
        if (sc <= 0.001) return null;
        const col = new THREE.Color(g.col).lerp(new THREE.Color('#2a0a14'), wet * 0.45);
        return (
          <group key={i} position={[g.x, (y - g.s / 2) - gone * 1.5, g.z]} rotation={[0, g.ry + (1 - fall) * 3, wet * (rand(i) - 0.5) * 0.5]} scale={[sc, sc * squash, sc]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={col} roughness={0.45} /></mesh>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.02, 1.02, 0.16]} /><meshStandardMaterial {...M.gold} /></mesh>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.16, 1.02, 1.02]} /><meshStandardMaterial {...M.gold} /></mesh>
            {[-0.5, 0.5].map((bx) => (
              <mesh key={bx} position={[bx * 0.35, 1.08, 0]} rotation={[0, 0, bx * 1.6]} scale={[1, 0.6, 0.5]}><torusGeometry args={[0.16, 0.05, 8, 16]} /><meshStandardMaterial {...M.gold} /></mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

/* ---------------- snow and ground ---------------- */
const Snow: React.FC<{t: number}> = ({t}) => (
  <group>
    {Array.from({length: 110}, (_, i) => {
      const sp = 0.35 + rand(i + 1) * 0.5, H = 12;
      const y = 6.5 - ((t * sp + rand(i) * H) % H);
      const x = (rand(i + 2) - 0.5) * 8 + Math.sin(t * 0.8 + i) * 0.25;
      const z = -1 + rand(i + 3) * 5;
      const s = 0.025 + rand(i + 4) * 0.04;
      return <mesh key={i} position={[x, y, z]} scale={s}><sphereGeometry args={[1, 6, 6]} /><meshBasicMaterial color="#f4f7ff" transparent opacity={0.85} /></mesh>;
    })}
  </group>
);

/* ---------------- camera = world group keyframes (move the world, not the camera) ---------------- */
type K = {t: number; x: number; y: number; s: number; ry: number};
const camAt = (t: number) => {
  const keys: K[] = [
    {t: 0, x: 1.0, y: -0.55, s: 1.28, ry: 0.06},
    {t: A.nicht(), x: 0.85, y: -0.45, s: 1.22, ry: 0.03},
    {t: A.s03() + 0.3, x: -0.05, y: -0.1, s: 1.0, ry: -0.03},
    {t: A.merkt(), x: -0.35, y: -1.15, s: 1.2, ry: -0.06},
    {t: A.s05() + 1.2, x: -0.2, y: -1.3, s: 1.12, ry: -0.03},
    {t: A.kleine(), x: 1.45, y: 0.4, s: 1.0, ry: 0.1},
    {t: A.um(), x: 1.75, y: 0.1, s: 1.0, ry: 0.06},
    {t: A.tasse(), x: -0.4, y: 1.05, s: 1.4, ry: -0.05},
    {t: A.besch(), x: -0.15, y: 0.25, s: 1.0, ry: 0.0},
    {t: A.ironisch(), x: -0.1, y: 0.35, s: 1.06, ry: -0.04},
    {t: A.raspelt2(), x: 1.0, y: -0.55, s: 1.28, ry: 0.06},
  ];
  let c = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t >= b.t) { c = b; continue; }
    if (t > a.t - 0.001) {
      const k = prog(t, b.t - 0.7, 0.7);
      c = {t, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k), ry: lerp(a.ry, b.ry, k)};
    }
    break;
  }
  const shake = bump(t, A.umgekippt(), 0.35) * 0.06 * Math.sin(t * 70) + bump(t, A.besch(), 0.5) * 0.08 * Math.sin(t * 55);
  return {...c, x: c.x + Math.sin(t * 0.5) * 0.05 + shake, y: c.y + shake * 0.6};
};

/* ---------------- 2D overlays ---------------- */
const Title: React.FC<{t: number; text: string; en?: string; from: number; to: number; size?: number}> = ({t, text, en, from, to, size = 92}) => {
  if (t < from - 0.01 || t > to) return null;
  const o = from <= 0 ? 1 : clamp((t - from) / 0.15);
  const fade = clamp((to - t) / 0.2);
  const s = from <= 0 ? 1 + Math.sin(t * 6) * 0.015 : 0.85 + 0.15 * clamp((t - from) / 0.18) + bump(t, from, 0.3) * 0.06;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: o * fade, transform: `scale(${s})`}}>
      <div style={{fontFamily: TITLE, fontWeight: 700, fontSize: size, lineHeight: 1.02, color: '#fff6e2', textShadow: '0 6px 26px rgba(0,0,0,.85), 0 0 2px #000'}}>{text}</div>
      {en && <div style={{marginTop: 12, fontFamily: UI, fontSize: 38, color: ACC, fontStyle: 'italic', textShadow: '0 3px 12px rgba(0,0,0,.9)'}}>{en}</div>}
    </div>
  );
};

const Sub: React.FC<{t: number; id: string; from?: number; to: number; top?: number; size?: number; skip?: number}> = ({t, id, from, to, top = 560, size = 54, skip = 0}) => {
  const f = from ?? line(id).start - 0.05;
  if (t < f || t > to) return null;
  return (
    <div style={{position: 'absolute', top, left: SAFE.side + 10, right: SAFE.side + 10, textAlign: 'center', opacity: clamp((to - t) / 0.2), textShadow: '0 4px 16px rgba(0,0,0,.95)'}}>
      <Spoken line={line(id)} size={size} font={UI} weight={700} color="#ffffff" skip={skip} />
    </div>
  );
};

/* the ticking guess pause: a draining gold ring with a "?" */
const Tick: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  if (t < from - 0.1 || t > to + 0.15) return null;
  const k = clamp((t - from) / Math.max(0.3, to - from));
  const C = 2 * Math.PI * 56;
  const pulse = 1 + 0.08 * Math.sin(t * 22);
  return (
    <div style={{position: 'absolute', top: 720, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: clamp((t - from + 0.1) / 0.15) * clamp((to + 0.15 - t) / 0.15)}}>
      <svg width={230} height={230} viewBox="0 0 150 150" style={{transform: `scale(${pulse})`}}>
        <circle cx={75} cy={75} r={62} fill="rgba(10,14,34,.82)" />
        <circle cx={75} cy={75} r={56} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={9} />
        <circle cx={75} cy={75} r={56} fill="none" stroke={ACC} strokeWidth={9} strokeDasharray={C} strokeDashoffset={C * k} transform="rotate(-90 75 75)" strokeLinecap="round" />
        <text x={75} y={98} textAnchor="middle" fontFamily={TITLE} fontWeight={700} fontSize={68} fill="#fff6e2">?</text>
      </svg>
    </div>
  );
};

const EnLine: React.FC<{text: string}> = ({text}) => (
  <div style={{marginTop: 14, fontFamily: UI, fontSize: 34, fontStyle: 'italic', color: '#cfd6ea'}}>{text}</div>
);

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const halo = useHalo(), puff = usePuff(), sky = useSky(), cobble = useCobble();
  useMemo(() => { cobble.wrapS = cobble.wrapT = THREE.RepeatWrapping; cobble.repeat.set(4, 4); }, [cobble]);
  const c = camAt(t);
  const irony = prog(t, A.ironisch() - 0.05, 0.25) * (1 - prog(t, A.raspelt2() - 0.2, 0.3));
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      <Audio src={staticFile('laneF/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.4, 13.5], fov: 41}} gl={{antialias: true}}>
        <color attach="background" args={[NIGHT]} />
        <fog attach="fog" args={[NIGHT, 16, 40]} />
        <mesh position={[0, 2, -22]}><planeGeometry args={[34, 60]} /><meshBasicMaterial map={sky} fog={false} /></mesh>
        <ambientLight intensity={0.55} color="#8a96c8" />
        <hemisphereLight args={['#a8b8ff', '#2a1a10', 0.5]} />
        <directionalLight position={[-5, 7, 9]} intensity={1.1} color="#c9d4ff" />
        <directionalLight position={[4, 3, 6]} intensity={0.6} color="#ffc98a" />
        <group position={[c.x, c.y, 0]} scale={c.s} rotation={[0, c.ry, 0]}>
          <pointLight position={[1.2, 1.0, -0.7]} intensity={9} distance={9} decay={1.3} color="#ffab55" />
          <pointLight position={[0.5, 1.9, 1.6]} intensity={5} distance={8} decay={1.4} color="#ffd59a" />
          <mesh position={[0, -3.0, 3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 20]} /><meshStandardMaterial map={cobble} roughness={0.9} color="#c8cfe6" /></mesh>
          <Stall t={t} halo={halo} />
          <Vendor t={t} />
          <Mishap t={t} />
          <Nutcracker t={t} />
          <Shavings t={t} />
          <Roast t={t} puff={puff} />
          <Finger t={t} />
          <Girl t={t} halo={halo} />
          <Gifts t={t} />
          <Snow t={t} />
        </group>
      </ThreeCanvas>

      {/* readable top and bottom */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,8,22,.85) 0%, rgba(6,8,22,.35) 22%, rgba(6,8,22,0) 38%, rgba(6,8,22,0) 70%, rgba(6,8,22,.6) 100%)'}} />
      {irony > 0 && <AbsoluteFill style={{background: `rgba(40,0,20,${irony * 0.25})`}} />}

      {/* HOOK: on screen from frame 0, works without sound */}
      <Title t={t} text="SÜSSHOLZ RASPELN" from={0} to={A.s03() - 0.1} size={112} />
      {t < A.loop() - 0.05 && (
        <div style={{position: 'absolute', top: 545, left: 0, right: 0, textAlign: 'center', fontFamily: UI, fontSize: 50, fontWeight: 700, color: '#fff', textShadow: '0 4px 16px #000'}}>
          Der Nussknacker legt los …
        </div>
      )}
      {/* OPEN LOOP */}
      <Sub t={t} id="s02" to={A.s03() - 0.1} top={560} size={52} />
      {t > A.schoen() && t < A.s03() && (
        <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <Pop show={A.schoen()}>
            <div style={{fontSize: 120, transform: `rotate(${Math.sin(t * 18) * (t > A.nicht() ? 14 : 4)}deg)`, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.8))'}}>🎁</div>
          </Pop>
        </div>
      )}

      {/* 1 Süßholz raspeln */}
      <Title t={t} text="Süßholz raspeln" en="to sweet-talk, to flatter" from={A.s03()} to={A.braten0()} />
      <Card from={at('s03', 0) - 0.25} to={A.braten0() - 0.05} label="Zum Beispiel" accent={ACC}>
        <Spoken line={line('s03')} size={50} font={TITLE} color="#fff6e2" />
      </Card>

      {/* 2 den Braten riechen */}
      <Sub t={t} id="s04" to={A.braten() - 0.1} top={330} size={56} />
      <Tick t={t} from={A.s04end()} to={A.s05()} />
      <Title t={t} text="den Braten riechen" en="to smell a rat" from={A.braten() - 0.05} to={A.finger0()} />
      <Card from={at('s05', 0) - 0.25} to={A.finger0() - 0.05} label="Zum Beispiel" accent={ACC}>
        <Spoken line={line('s05')} size={48} font={TITLE} color="#fff6e2" />
      </Card>

      {/* 3 um den Finger wickeln */}
      <Sub t={t} id="s06" to={A.um() - 0.1} top={330} size={56} />
      <Tick t={t} from={A.s06end()} to={line('s07').start} />
      <Title t={t} text="jdn. um den Finger wickeln" en="to twist s.o. round one's little finger" from={A.um() - 0.05} to={A.besch0()} size={84} />
      <Card from={at('s07', 0) - 0.25} to={A.besch0() - 0.05} label="Zum Beispiel" accent={ACC}>
        <Spoken line={line('s07')} size={48} font={TITLE} color="#fff6e2" />
      </Card>

      {/* 4 Schöne Bescherung (the twist) */}
      <Sub t={t} id="s08" to={A.schoene() - 0.05} top={330} size={60} />
      <Tick t={t} from={A.s08end()} to={A.schoene()} />
      <Title t={t} text="„Schöne Bescherung!“" en="A fine mess! (ironic)" from={A.schoene() - 0.05} to={A.s11()} size={100} />
      <Card from={A.schoene() - 0.25} to={A.s11() - 0.05} label="Zum Beispiel" accent={ACC}>
        <div style={{fontFamily: TITLE, fontSize: 50, fontWeight: 700, color: '#fff6e2', lineHeight: 1.2}}>Tasse umgekippt, Handy nass – schöne Bescherung!</div>
        {t > A.geschenke() - 0.1 && (
          <Pop show={A.geschenke() - 0.1}><EnLine text="die Bescherung = gift-giving, opening the presents" /></Pop>
        )}
      </Card>
      {irony > 0 && (
        <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{transform: `rotate(-9deg) scale(${1.6 - 0.6 * prog(t, A.ironisch() - 0.05, 0.2)})`, opacity: irony, border: `8px solid ${ACC}`, borderRadius: 18, padding: '10px 34px', fontFamily: '"Arial Black", Impact, sans-serif', fontSize: 84, color: ACC, letterSpacing: 6, background: 'rgba(10,14,34,.55)'}}>IRONISCH</div>
        </div>
      )}

      {/* PAYOFF + LOOP: back to the first shot */}
      <Title t={t} text="SÜSSHOLZ RASPELN" from={A.raspelt2() - 0.05} to={A.outro()} size={112} />
      <Sub t={t} id="s11" to={A.outro()} top={560} size={54} />

      {/* OUTRO */}
      <Title t={t} text="SÜSSHOLZ RASPELN" from={A.outro()} to={FRAMES / fps} size={112} />
      <Sub t={t} id="s12" to={FRAMES / fps} top={560} size={50} />
      {t > A.follow() - 0.1 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: SAFE.bottom + 40, display: 'flex', justifyContent: 'center'}}>
          <FollowCTA show={A.follow() - 0.05} accent={ACC} />
        </div>
      )}
    </AbsoluteFill>
  );
};
