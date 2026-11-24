/* familie-weihnachtsmarkt-01 · "Das Licht, das lügt"
   Leitmetapher: one tealight on a snowy Christmas-market lane at night. The stem LICHT grows the world word by word:
   Teelicht (one flame) -> Windlicht (wind nearly kills it, a glass drops over it) -> Lichterkette (bulbs light up across
   the Budengasse) -> Lichtermeer (the view tilts down "from the bridge" onto a whole square of lights).
   Twist: the fifth "Licht" is no light at all: "hinters Licht führen". The world swings round, blacks out, coins land on a
   counter and one slides away. Payoff: "Geht dir jetzt ein Licht auf?" re-ignites the single flame = the first frame.
   Accent: amber. Type: Palatino Linotype + Trebuchet MS. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneD-timings.json';
import {makeTiming, Pop, Card, Spoken, FollowCTA, SAFE, NB, GENUS, rand, clamp, prog, Timings} from '../lib/kit';

const {line, at, scene, frames} = makeTiming(T as Timings);
export const FRAMES = frames() + 30;

const ACC = '#ffb547';
const COLD = '#8fb4ff';
const PAL = '"Palatino Linotype", Palatino, Georgia, serif';
const TRE = '"Trebuchet MS", "Segoe UI", sans-serif';
const PI = Math.PI;
const end = (id: string) => line(id).end;

/* ---------------- timing anchors ---------------- */
const T_KLEIN = at('s03', 3);          // "klein": zoom out, the tealight becomes small in the market
const T_TEE = at('s03', 6);            // "Teelicht"
const T_WIND = at('s04', 2);           // "Wind": gusts start
const Q1 = [end('s04'), at('s05', 0)]; // guess pause 1
const T_GLAS = at('s05', 1);           // "Glas": the glass drops
const T_WINDL = at('s05', 4);           // "Windlicht": glass lands, flame recovers
const T_SCHNUR = at('s06', 5);         // "Schnur": the dark wire appears
const Q2 = [end('s06'), at('s07', 0)];
const T_KETTE = at('s07', 1);          // "Lichterkette": bulbs light left to right
const T_GASSE = at('s07', 6);          // "Budengasse": stall windows light
const T_PLATZ = at('s08', 4);          // "Platz": view begins to tilt down
const Q3 = [end('s08'), at('s09', 0)];
const T_BRUECKE = at('s09', 2);        // "Brücke": railing in the foreground
const T_MEER = at('s09', 6);           // "Lichtermeer": the field ignites
const T_FUENF = at('s11', 0);          // "Der Verkäufer…": the view comes back from the bridge
const T_PASS = at('s11', 1);           // "Verkäufer": lights flicker
const T_VERK = at('s11', 1);           // "Verkäufer": counter rises
const T_GELD = at('s11', 5);           // "Wechselgeld": coins drop
const T_HINTERS = at('s11', 6);        // "hinters": world swings round
const T_GEF = at('s11', 8);            // "geführt": blackout
const T_WENIG = at('s11', 7);          // "Licht": a coin slides away
const T_LUEGT = at('s13', 0);          // "Das war das Licht, das lügt"
const T_AUF = at('s14', 5);            // "Licht" in "ein Licht auf": flame re-ignites
const T_AUF2 = at('s14', 6);           // "auf": bloom
const OUT = scene('outro').start;
const HOOK_END = at('s03', 0);

/* ---------------- textures ---------------- */
let GLOW: THREE.CanvasTexture | null = null;
const glowTex = () => {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(255,255,255,.75)');
  gr.addColorStop(0.45, 'rgba(255,255,255,.18)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  GLOW = new THREE.CanvasTexture(c);
  return GLOW;
};

const Glow: React.FC<{p: [number, number, number]; s: number; color: string; o: number}> = ({p, s, color, o}) =>
  o <= 0.003 ? null : (
    <sprite position={p} scale={[s, s, 1]}>
      <spriteMaterial map={glowTex()} color={color} transparent opacity={clamp(o)} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );

/* ---------------- state of the world over time ---------------- */
const world = (t: number) => {
  const meer = prog(t, T_PLATZ, 1.6) * (1 - prog(t, T_FUENF, 1.0));
  const swing = prog(t, T_HINTERS, 1.1) * (1 - prog(t, T_LUEGT, 1.0));
  const dark = prog(t, T_GEF - 0.05, 0.35) * (1 - prog(t, T_AUF - 0.1, 0.5));
  const flick = t > T_PASS && t < T_PASS + 0.9 ? (Math.sin(t * 60) > 0.2 ? 1 : 0.25) : 1;
  const kette = prog(t, T_KETTE, 1.0);
  const gasse = prog(t, T_GASSE - 0.2, 0.8);
  const field = prog(t, T_PLATZ + 0.4, 2.2); // the field starts to wake on "Platz", full on "Lichtermeer"
  const wind = t > T_WIND - 0.1 && t < T_WINDL + 0.3 ? prog(t, T_WIND - 0.1, 0.4) * (1 - prog(t, T_WINDL, 0.4)) : 0;
  return {meer, swing, dark, flick, kette, gasse, field, wind};
};

/* tealight scale: big in the hook, small in the market, big again in the payoff (rhyme with frame 0) */
const tealScale = (t: number) => {
  const shrink = prog(t, T_KLEIN, 0.9);
  const regrow = prog(t, T_AUF - 0.1, 0.9);
  return 2.0 - 1.0 * shrink + 0.9 * regrow;
};
const tealDrop = (t: number) => 0.45 * (1 - prog(t, T_KLEIN, 0.9)) + 0.3 * prog(t, T_AUF - 0.1, 0.9);
const flameOn = (t: number) => {
  // flame present except: fully out in the blackout until "Licht auf"
  const out = prog(t, T_GEF - 0.05, 0.3) * (1 - prog(t, T_AUF, 0.25));
  return 1 - out;
};

/* ---------------- 3D pieces ---------------- */
const Flame: React.FC<{t: number; on: number; wind: number; boost: number}> = ({t, on, wind, boost}) => {
  if (on < 0.01) return null;
  const fl = 1 + Math.sin(t * 23) * 0.06 + Math.sin(t * 37 + 1) * 0.05;
  const gust = wind * (0.55 + Math.sin(t * 9) * 0.25);
  const size = on * fl * (1 - gust * 0.55);
  return (
    <group position={[0, 0.2, 0]} rotation={[0, 0, -gust * 0.9]} scale={[size, size, size]}>
      <mesh position={[0, 0.17, 0]} scale={[0.09, 0.2, 0.09]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#fff4d6" />
      </mesh>
      <mesh position={[0, 0.2, 0]} scale={[0.14, 0.3, 0.14]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ff9a2e" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Glow p={[0, 0.2, 0]} s={1.0 + boost * 1.4} color={ACC} o={0.85} />
      <Glow p={[0, 0.25, 0]} s={0.5} color="#fff2c8" o={0.9} />
    </group>
  );
};

const Tealight: React.FC<{t: number; w: ReturnType<typeof world>}> = ({t, w}) => {
  const s = tealScale(t);
  const on = flameOn(t) * w.flick;
  const glassDrop = 1 - prog(t, T_GLAS, T_WINDL - T_GLAS + 0.05);
  const glassIn = t > T_GLAS - 0.1 && t < T_GEF;
  const boost = prog(t, T_AUF2, 0.6) * (1 - prog(t, T_AUF2 + 0.7, 1.2)) + (t < T_KLEIN ? 0.05 : 0);
  return (
    <group position={[0, -0.55 - tealDrop(t), 0]} scale={[s, s, s]}>
      {/* aluminium cup + wax + wick */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.32, 0.3, 0.14, 40, 1, true]} />
        <meshStandardMaterial color="#c9ced8" metalness={0.85} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.02, 40]} />
        <meshStandardMaterial color="#fbf5e8" emissive="#ffb547" emissiveIntensity={0.35 * on} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.09, 6]} />
        <meshBasicMaterial color="#1a1410" />
      </mesh>
      <Flame t={t} on={on} wind={w.wind} boost={boost} />
      <pointLight position={[0, 0.5, 0.3]} intensity={(2.2 + boost * 6) * on * (1 - w.wind * 0.5)} distance={6} decay={1.4} color="#ffae52" />
      {/* the Windlicht glass */}
      {glassIn && (
        <group position={[0, 0.5 + glassDrop * 4.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.52, 0.48, 1.0, 48, 1, true]} />
            <meshStandardMaterial color="#cfe3ff" transparent opacity={0.16} metalness={0.2} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.52, 0.018, 8, 48]} />
            <meshStandardMaterial color="#e8f2ff" emissive="#ffcf8a" emissiveIntensity={0.5 * on} />
          </mesh>
          <mesh position={[0, -0.5, 0]} rotation={[PI / 2, 0, 0]}>
            <torusGeometry args={[0.48, 0.022, 8, 48]} />
            <meshStandardMaterial color="#e8f2ff" emissive="#ffcf8a" emissiveIntensity={0.5 * on} />
          </mesh>
        </group>
      )}
      <Coins t={t} />
      {/* log stump it stands on */}
      <mesh position={[0, -0.23, 0]}>
        <cylinderGeometry args={[0.62, 0.66, 0.46, 32]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.01, 32]} />
        <meshStandardMaterial color="#c89a6a" roughness={0.8} />
      </mesh>
    </group>
  );
};

/* wooden market stalls (Buden) on both sides of the lane */
const STALLS = [-3, -6.2, -9.4, -12.6, -15.8, -19].flatMap((z, i) => [
  {x: -2.75, z, side: 1, i: i * 2},
  {x: 2.75, z: z - 1.2, side: -1, i: i * 2 + 1},
]);
const Stall: React.FC<{x: number; z: number; side: number; i: number; lit: number}> = ({x, z, side, i, lit}) => (
  <group position={[x, -1.0, z]} rotation={[0, side * PI / 2, 0]}>
    <mesh position={[0, 0.7, 0]}>
      <boxGeometry args={[2.0, 1.4, 1.5]} />
      <meshStandardMaterial color="#3b2416" roughness={0.9} />
    </mesh>
    <mesh position={[0, 1.62, 0]} rotation={[0, 0, 0]} scale={[1.18, 0.5, 1]}>
      <cylinderGeometry args={[1, 1, 1.8, 3]} />
      <meshStandardMaterial color="#7a2430" roughness={0.8} />
    </mesh>
    <mesh position={[0, 1.95, 0]} scale={[0.4, 0.12, 1]}>
      <cylinderGeometry args={[1, 1, 1.82, 3]} />
      <meshStandardMaterial color="#f2f5fb" roughness={1} />
    </mesh>
    {/* opening facing the lane */}
    <mesh position={[0, 0.85, 0.76]}>
      <planeGeometry args={[1.6, 0.7]} />
      <meshStandardMaterial color="#2a1a10" emissive="#ffa63d" emissiveIntensity={0.08 + lit * (1.1 + rand(i) * 0.5)} />
    </mesh>
    <Glow p={[0, 0.9, 1.1]} s={2.2} color={ACC} o={lit * 0.45} />
  </group>
);

/* the Lichterkette across the Budengasse */
const N_BULB = 22;
const KETTE_Z = -1.8;
const ketteCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-2.7, 2.05, KETTE_Z), new THREE.Vector3(0, 0.75, KETTE_Z), new THREE.Vector3(2.7, 2.05, KETTE_Z - 1.2));
const Kette: React.FC<{t: number; w: ReturnType<typeof world>}> = ({t, w}) => {
  const wire = useMemo(() => new THREE.TubeGeometry(ketteCurve, 60, 0.012, 6, false), []);
  const show = prog(t, T_SCHNUR - 0.2, 0.5);
  if (show <= 0) return null;
  const k = 1 - w.dark;
  return (
    <group>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#1b1712" />
      </mesh>
      {Array.from({length: N_BULB}, (_, i) => {
        const p = ketteCurve.getPoint((i + 0.5) / N_BULB);
        const on = prog(t, T_KETTE + i * 0.035, 0.12) * k * w.flick;
        const tw = 0.85 + Math.sin(t * 3 + i * 1.7) * 0.15;
        return (
          <group key={i} position={[p.x, p.y - 0.07, p.z]}>
            <mesh scale={[show, show, show]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color="#5a4a30" emissive="#ffc46b" emissiveIntensity={on * 2.2} />
            </mesh>
            <Glow p={[0, 0, 0]} s={0.55} color={ACC} o={on * tw * 0.9} />
          </group>
        );
      })}
    </group>
  );
};

/* the Lichtermeer: hundreds of lights over the square */
const FIELD = Array.from({length: 340}, (_, i) => {
  const x = (rand(i * 3 + 1) - 0.5) * 22;
  const z = -2.5 - rand(i * 3 + 2) * 34;
  return {x, z, y: -0.8 + rand(i * 7) * 1.6, d: Math.hypot(x, z + 2), c: rand(i * 5) > 0.75 ? '#fff0c8' : rand(i * 5) > 0.4 ? ACC : '#ff8a3a', s: 0.7 + rand(i * 11) * 1.0};
});
const Field: React.FC<{t: number; w: ReturnType<typeof world>}> = ({t, w}) => {
  if (w.field <= 0.001) return null;
  const head = (t - (T_PLATZ + 0.3)) * 9; // wave front radius
  const k = (1 - w.dark) * w.flick;
  return (
    <group>
      {FIELD.map((f, i) => {
        const on = clamp((head - f.d) / 3) * k * (0.75 + Math.sin(t * 2.2 + i) * 0.25) * (t > T_MEER ? 1 : 0.65);
        return <Glow key={i} p={[f.x, f.y, f.z]} s={f.s * (t > T_MEER ? 1.25 : 1)} color={f.c} o={on} />;
      })}
    </group>
  );
};

/* the bridge railing seen in the foreground during "Von der Brücke aus" */
const Railing: React.FC<{t: number}> = ({t}) => {
  const r = prog(t, T_BRUECKE - 0.2, 0.6) * (1 - prog(t, T_FUENF, 0.7));
  if (r <= 0) return null;
  return (
    <group position={[0, -2.6 - (1 - r) * 1.5, 3.2]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[6, 0.12, 0.16]} />
        <meshStandardMaterial color="#2b3242" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.07, 1.1, 0.07]} />
          <meshStandardMaterial color="#2b3242" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.63, 0]} scale={[1, 1, 1]}>
        <boxGeometry args={[6, 0.04, 0.2]} />
        <meshStandardMaterial color="#f2f5fb" roughness={1} />
      </mesh>
    </group>
  );
};

/* change on the stump for the twist: three coins drop on "Wechselgeld", one slides off on "Licht" */
const Coins: React.FC<{t: number}> = ({t}) => {
  if (t < T_GELD - 0.05 || t > T_AUF) return null;
  const gone = prog(t, T_LUEGT + 0.6, 0.5);
  return (
    <group>
      {[[-0.46, 0.18], [0.44, 0.24], [0.05, 0.47]].map(([x, z], i) => {
        const td = T_GELD + i * 0.12;
        if (t < td - 0.05) return null;
        const drop = prog(t, td, 0.3);
        const slide = i === 2 ? prog(t, T_WENIG, 0.6) : 0;
        const fall = i === 2 ? prog(t, T_WENIG + 0.5, 0.45) : 0;
        return (
          <mesh key={i} position={[x + slide * 0.2, 0.03 + (1 - drop) * 2.5 - fall * 2.2, z + slide * 0.45]} rotation={[0.1 + fall * 1.4, 0, 0]} scale={[1 - gone, 1 - gone, 1 - gone]}>
            <cylinderGeometry args={[0.17, 0.17, 0.04, 32]} />
            <meshStandardMaterial color="#e2bb5e" metalness={0.85} roughness={0.25} emissive="#5a4010" emissiveIntensity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

/* snow glitter on the ground near the camera */
const Glitter: React.FC<{t: number; dark: number}> = ({t, dark}) => (
  <group>
    {Array.from({length: 90}, (_, i) => {
      const tw = Math.max(0, Math.sin(t * (1.5 + rand(i + 40) * 3) + i * 2.1));
      return <Glow key={i} p={[(rand(i + 20) - 0.5) * 6, -0.97, 4 - rand(i + 30) * 8]} s={0.06 + rand(i + 50) * 0.08} color={dark > 0.5 ? COLD : '#ffe2b0'} o={tw * 0.9} />;
    })}
  </group>
);

const Snow: React.FC<{t: number; wind: number}> = ({t, wind}) => (
  <group>
    {Array.from({length: 110}, (_, i) => {
      const sp = 0.25 + rand(i + 3) * 0.35;
      const y = 4.2 - ((rand(i + 9) * 7 + t * sp) % 7);
      const drift = Math.sin(t * 0.7 + i) * 0.15 + wind * ((t * 2.5 + rand(i) * 6) % 6 - 3) * 1.4;
      return <Glow key={i} p={[(rand(i) - 0.5) * 7 + drift, y, 2.5 - rand(i + 5) * 9]} s={0.05 + rand(i + 7) * 0.06} color="#ffffff" o={0.75} />;
    })}
  </group>
);

const Scene: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const w = world(t);
  const shake = w.wind * Math.sin(t * 31) * 0.03;
  const hookPush = (1 - prog(t, T_KLEIN, 0.9)) * (0.2 - t * 0.05);
  return (
    <>
      <fog attach="fog" args={['#0a1330', 7, 34]} />
      <ambientLight intensity={0.28 - w.dark * 0.12} color="#9fb4e8" />
      <directionalLight position={[-4, 6, 3]} intensity={0.35 + w.dark * 0.5} color={COLD} />
      <pointLight position={[0, 3, -4]} intensity={(w.gasse * 4 + w.meer * 10) * (1 - w.dark)} distance={18} color="#ffa040" />
      <Snow t={t} wind={w.wind} />
      <group position={[shake, -w.meer * 0.9, -w.meer * 1.5 + hookPush]} rotation={[w.meer * 0.42, w.swing * PI, 0]}>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -1.0, -12]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#c9d3e8" roughness={1} />
        </mesh>
        {STALLS.map((s) => <Stall key={s.i} {...s} lit={w.gasse * (1 - w.dark) * w.flick * (s.z > -10 || w.meer > 0.3 ? 1 : 0.5)} />)}
        <Kette t={t} w={w} />
        <Field t={t} w={w} />
        <Tealight t={t} w={w} />
        <Glitter t={t} dark={w.dark} />
      </group>
      <Railing t={t} />
    </>
  );
};

/* ---------------- 2D overlays ---------------- */
const STEM = /(licht)/i;
const Word: React.FC<{w: string; cold?: boolean}> = ({w, cold}) => {
  const m = w.match(/^(der|die|das) (.*)$/);
  const art = m ? (m[1] as keyof typeof GENUS) : null;
  const rest = m ? m[2] : w;
  const parts = rest.split(STEM);
  return (
    <span>
      {art && <span style={{color: GENUS[art]}}>{art}{NB}</span>}
      {parts.map((p, i) => <span key={i} style={{color: STEM.test(p) && p.toLowerCase() === 'licht' ? (cold ? COLD : ACC) : '#fff'}}>{p.replace(/ /g, NB)}</span>)}
    </span>
  );
};

type Item = {from: number; to: number; node: React.ReactNode; en?: string; q?: [number, number]};
const Blank: React.FC<{t: number; n: number}> = ({t, n}) => (
  <span style={{display: 'inline-block', minWidth: n * 52, borderBottom: `8px solid ${ACC}`, transform: `scale(${1 + Math.max(0, Math.sin(t * PI * 3)) * 0.06})`, color: ACC}}>?</span>
);
const Title: React.FC<{t: number}> = ({t}) => {
  const items: Item[] = [
    {from: T_TEE - 0.1, to: Q1[0], node: <Word w="das Teelicht" />, en: 'tealight'},
    {from: Q1[0], to: T_WINDL - 0.1, node: <span><span style={{color: GENUS.das}}>das</span>{NB}<Blank t={t} n={3} /><span style={{color: ACC}}>licht</span></span>, q: [Q1[0], Q1[1]]},
    {from: T_WINDL - 0.1, to: Q2[0], node: <Word w="das Windlicht" />, en: 'hurricane lamp, glass candle holder'},
    {from: Q2[0], to: T_KETTE - 0.1, node: <span><span style={{color: GENUS.die}}>die</span>{NB}<span style={{color: ACC}}>Licht</span>er<Blank t={t} n={3} /></span>, q: [Q2[0], Q2[1]]},
    {from: T_KETTE - 0.1, to: Q3[0], node: <Word w="die Lichterkette" />, en: 'string of lights'},
    {from: Q3[0], to: T_MEER - 0.1, node: <span><span style={{color: GENUS.das}}>das</span>{NB}<span style={{color: ACC}}>Licht</span>er<Blank t={t} n={3} /></span>, q: [Q3[0], Q3[1]]},
    {from: T_MEER - 0.1, to: T_FUENF - 0.1, node: <Word w="das Lichtermeer" />, en: 'sea of lights'},
    {from: T_FUENF - 0.1, to: T_HINTERS - 0.1, node: <span><span style={{color: ACC}}>Licht</span>{NB}Nr.{NB}5{NB}<Blank t={t} n={1} /></span>},
    {from: T_HINTERS - 0.1, to: at('s14', 1) - 0.1, node: <Word w="jdn. hinters Licht führen" cold />, en: 'to deceive s.o.'},
    {from: at('s14', 1) - 0.1, to: OUT - 0.1, node: <Word w="jdm. geht ein Licht auf" />, en: 'the penny drops, s.o. suddenly understands'},
  ];
  const cur = items.find((it) => t >= it.from && t < it.to);
  if (!cur) return null;
  const long = cur.from >= T_HINTERS - 0.2;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 6, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}>
      <Pop show={cur.from}>
        <div style={{fontFamily: PAL, fontSize: long ? 76 : 100, fontWeight: 700, color: '#fff', lineHeight: 1.1, textShadow: '0 6px 30px rgba(0,0,0,.8)'}}>{cur.node}</div>
      </Pop>
      {cur.en && (
        <div style={{fontFamily: TRE, fontStyle: 'italic', fontSize: 38, color: 'rgba(255,255,255,.82)', marginTop: 10, opacity: clamp((t - cur.from - 0.25) / 0.3), textShadow: '0 3px 14px rgba(0,0,0,.9)'}}>{cur.en}</div>
      )}
      {cur.q && (() => {
        const u = clamp((t - cur.q[0]) / Math.max(0.3, cur.q[1] - cur.q[0]));
        return (
          <div style={{margin: '18px auto 0', width: 560, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.18)', overflow: 'hidden'}}>
            <div style={{width: `${(1 - u) * 100}%`, height: '100%', background: ACC}} />
          </div>
        );
      })()}
    </div>
  );
};

/* five flame icons: the "lights" count; #5 turns out to be no light */
const FlameIcon: React.FC<{state: 'off' | 'on' | 'q' | 'lie'; size: number}> = ({state, size}) => {
  const col = state === 'on' ? ACC : state === 'lie' ? COLD : 'rgba(255,255,255,.35)';
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50">
      <path d="M20 3 C27 15 34 22 34 32 A14 14 0 0 1 6 32 C6 22 13 15 20 3Z" fill={state === 'on' ? col : 'none'} stroke={col} strokeWidth={3.5} strokeDasharray={state === 'off' || state === 'q' ? '5 4' : undefined} />
      {state === 'q' && <text x={20} y={40} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" fontFamily="Trebuchet MS">?</text>}
      {state === 'lie' && <path d="M11 22 L29 42 M29 22 L11 42" stroke={COLD} strokeWidth={4} strokeLinecap="round" />}
    </svg>
  );
};
const Counter2D: React.FC<{t: number}> = ({t}) => {
  const shown = at('s02', 0) - 0.1;
  if (t < shown || t > OUT) return null;
  const times = [T_TEE, T_WINDL, T_KETTE, T_MEER];
  const top = t < HOOK_END ? 1410 : 600;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26, opacity: clamp((t - shown) / 0.3)}}>
      {[0, 1, 2, 3, 4].map((i) => {
        const st = i < 4 ? (t >= times[i] ? 'on' : 'off') : t >= T_HINTERS ? 'lie' : 'q';
        const lit = i < 4 ? times[i] : T_HINTERS;
        const pop = t >= lit && t < lit + 0.4 ? 1 + Math.sin(((t - lit) / 0.4) * PI) * 0.35 : 1;
        return <div key={i} style={{transform: `scale(${pop})`}}><FlameIcon state={st} size={46} /></div>;
      })}
    </div>
  );
};

/* hook: visible from frame 0, no waiting for the voice */
const Hook: React.FC<{t: number}> = ({t}) => {
  if (t > HOOK_END + 0.4) return null;
  const o = clamp((HOOK_END + 0.4 - t) / 0.4);
  const glitch = Math.sin(t * 47) > 0.86 ? 1 : 0;
  const breathe = 1 + Math.sin(t * 2.4) * 0.02;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: o, transform: `translateY(${-(1 - o) * 60}px)`}}>
      <div style={{fontFamily: PAL, fontSize: 92, fontWeight: 700, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.8)'}}>Ein{NB}<span style={{color: ACC}}>Licht</span>{NB}hier</div>
      <div style={{fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: 250, lineHeight: 1, color: ACC, letterSpacing: 6, transform: `scale(${breathe}) translateX(${glitch * 12}px) skewX(${glitch * -8}deg)`,
        textShadow: `${glitch * -10}px 0 0 ${COLD}, 0 0 50px rgba(255,160,60,.55)`}}>LÜGT</div>
      <div style={{fontFamily: PAL, fontSize: 64, fontWeight: 700, color: '#fff', marginTop: 4, textShadow: '0 6px 30px rgba(0,0,0,.8)'}}>dich{NB}an.</div>
      {t > at('s02', 0) - 0.1 && (
        <div style={{marginTop: 30, fontFamily: TRE, fontSize: 56, fontWeight: 700, color: '#fff'}}>
          <Pop show={at('s02', 0)}>Welches?</Pop>{' '}
          <Pop show={at('s02', 4)}><span style={{color: ACC}}>Bis{NB}zum{NB}Ende.</span></Pop>
        </div>
      )}
    </div>
  );
};

/* the reveal: "Das war das Licht, das lügt." stamped over the scene */
const Reveal: React.FC<{t: number}> = ({t}) => {
  if (t < T_LUEGT - 0.1 || t > at('s14', 1) - 0.1) return null;
  return (
    <div style={{position: 'absolute', top: 760, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}>
      <Pop show={T_LUEGT}>
        <div style={{display: 'inline-block', border: `6px solid ${COLD}`, borderRadius: 20, padding: '18px 34px', transform: 'rotate(-4deg)', background: 'rgba(6,10,26,.75)'}}>
          <div style={{fontFamily: TRE, fontSize: 40, fontWeight: 700, color: COLD, letterSpacing: 4}}>DAS{NB}LICHT,{NB}DAS{NB}LÜGT</div>
          <div style={{fontFamily: PAL, fontSize: 68, fontWeight: 700, color: '#fff', marginTop: 6}}>hinters{NB}<span style={{color: COLD}}>Licht</span>{NB}führen</div>
        </div>
      </Pop>
    </div>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const w = world(t);
  const warm = (1 - w.dark) * (0.35 + w.gasse * 0.25 + w.meer * 0.4);
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 62%, rgba(${Math.round(40 + warm * 70)},${Math.round(36 + warm * 30)},${Math.round(70 - warm * 20)},1) 0%, #0a1330 58%, #040714 100%)`}}>
      <Audio src={staticFile('laneD/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.6, 7.5], fov: 46}} gl={{antialias: true}}>
        <Scene t={t} fps={fps} />
      </ThreeCanvas>

      <Hook t={t} />
      <Title t={t} />
      <Counter2D t={t} />
      <Reveal t={t} />

      <Card from={at('s11', 0) - 0.25} to={end('s11') + 0.5} label="Beispiel" accent={COLD}>
        <Spoken line={line('s11')} size={50} font={TRE} />
      </Card>

      {t > OUT - 0.2 && (
        <AbsoluteFill>
          <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center', fontFamily: PAL, fontSize: 60, fontWeight: 700, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,.9)'}}>
            <Pop show={at('s15', 0)}>Morgen:</Pop>{' '}<Pop show={at('s15', 2)}><span>mehr{NB}Wörter{NB}vom</span></Pop>{' '}<Pop show={at('s15', 4)}><span style={{color: ACC}}>Glühweinstand</span></Pop>
          </div>
          <div style={{position: 'absolute', bottom: SAFE.bottom + 30, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
            <FollowCTA show={at('s16', 0) - 0.1} accent={ACC} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
