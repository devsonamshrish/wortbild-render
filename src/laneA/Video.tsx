/* quiz-weihnachtsmarkt-01 · "Die Budengasse"
   Leitmetapher: a lane of wooden market stalls at night. Every stall's hinged shutter (Klappladen) is closed and
   has a noun painted on it. While you guess, the shutter rattles; on the spoken article it flies up into an awning,
   the warm stall behind it lights up, the price board shows the article and the string of lights along its roof
   switches on. Item by item the dark lane lights up.
   Spine: HOOK frame 0 = the trap stall (Krakauer) with a sausage sizzling over a fire basket -> "Moment! Die Falle
   kommt am Ende" -> rewind down the lane to stall 1 -> four stalls -> TWIST: der Stand ... in Bayern das Standl
   (the gable sign gets an L, the price board flips) -> the trap: die Krakauer -> PAYOFF: back at the first image. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneA-timings.json';
import {makeTiming, Pop, Spoken, Card, FollowCTA, SAFE, NB, GENUS, rand, clamp, prog, Timings} from '../lib/kit';

const {line, at, frames} = makeTiming(T as unknown as Timings);
export const FRAMES = frames();

const GOLD = '#ffc94a'; // the one accent: candle gold
const INK = '#fff6e4';
const NIGHT = '#0a1024';
const HUD = '"Arial Black", Impact, sans-serif';
const PAINT = 'Georgia, "Palatino Linotype", serif';
const PI = Math.PI;
const L = (a: number, b: number, k: number) => a + (b - a) * k;
const lastE = (id: string) => { const w = line(id).words; return w[w.length - 1].e; };

/* ---------------- items ---------------- */
type Art = 'der' | 'die' | 'das';
type Item = {art: Art; noun: string; en: string; ex: string; lead: string; rev: string; nIdx: number; paint: string; goods: string};
const ITEMS: Item[] = [
  {art: 'der', noun: 'Bratapfel', en: 'baked apple', ex: 'Der Bratapfel ist mit Marzipan und Rosinen gefüllt, dazu gibt es warme Vanillesoße.', lead: 's04', rev: 's05', nIdx: 2, paint: '#7d2324', goods: 'apple'},
  {art: 'das', noun: 'Marzipan', en: 'marzipan', ex: 'Aus Marzipan formen die Lübecker sogar kleine Früchte und Brote.', lead: 's06', rev: 's07', nIdx: 2, paint: '#24543a', goods: 'marzipan'},
  {art: 'der', noun: 'Spekulatius', en: 'spiced shortcrust biscuit with a pressed picture', ex: 'Zu jedem Kaffee gibt es bei uns im Advent ein paar Spekulatius.', lead: 's08', rev: 's09', nIdx: 2, paint: '#26406a', goods: 'biscuit'},
  {art: 'der', noun: 'Stand', en: 'stall (the general word)', ex: 'Welchen Stand meinst du, den mit dem roten Dach?', lead: 's10', rev: 's11', nIdx: 2, paint: '#8a5a1c', goods: 'lantern'},
  {art: 'die', noun: 'Krakauer', en: 'coarse smoked sausage', ex: 'Die Krakauer ist grob, geräuchert und kommt mit viel Senf.', lead: 's13', rev: 's14', nIdx: 4, paint: '#4a1a1e', goods: 'sausage'},
];
const STANDL = {art: 'das' as Art, noun: 'Standl', en: 'stall (Bavaria, Austria)', ex: 'Das Standl dort hinten hat guten Punsch.'};
const ARTS: Art[] = ['der', 'die', 'das'];
const N = ITEMS.length;
const KRAK = 4, STAND = 3;
const nounAt = (i: number) => at(ITEMS[i].lead, ITEMS[i].nIdx);
const guess0 = (i: number) => lastE(ITEMS[i].lead);
const reveal = (i: number) => at(ITEMS[i].rev, 0);
const standlT = () => at('s12', 5);          // "das" in "Aber in Bayern sagt man: das Standl!"
const senfT = () => at('s14', 11);           // "Senf"
const T_MOMENT = () => at('s02', 0);
const T_REW1 = () => at('s04', 0) - 0.15;
const T_PAY = () => at('s15', 0);
const T_TEASE = () => at('s16', 0);
const T_CTA = () => at('s17', 0);
const nextStart = (i: number) => (i < N - 1 ? at(ITEMS[i + 1].lead, 0) - 0.25 : T_PAY() - 0.1);

/* ---------------- geometry ---------------- */
const BX = 3.7;                 // spacing of the stalls along the lane
const SH = -0.25;               // the whole stall sits a bit low so the tags row fits above the roof
const GROUND = -2.15;
const BW = 3.2, BD = 1.6;
const TOP = 0.85 + SH + 0.25;   // top of the front opening / shutter hinge
const CNT = -1.0;               // counter top
const FZ = BD / 2;
const EAVE = TOP + 0.22, RIDGE = EAVE + 0.95, RHW = BW / 2 + 0.25;

/* camera along the lane: hook at the trap stall, rewind to stall 1, then one stall per item */
const camX = (t: number) => {
  let x = KRAK * BX;
  x = L(x, 0, prog(t, T_MOMENT() + 0.35, T_REW1() - T_MOMENT() - 0.35));
  for (let i = 1; i < N; i++) {
    const s = at(ITEMS[i].lead, 0) - 0.75;
    x = L(x, i * BX, prog(t, s, 0.75));
  }
  return x;
};
/* payoff: dolly in on the grill, then back to the first framing so the last frame rhymes with the first */
const camPush = (t: number) => prog(t, T_PAY() - 0.1, 0.9) * (1 - prog(t, T_TEASE() + 0.2, 1.1));

/* ---------------- textures ---------------- */
const fit = (g: CanvasRenderingContext2D, txt: string, max: number, maxW: number, font: (s: number) => string) => {
  let s = max; g.font = font(s);
  while (g.measureText(txt).width > maxW && s > 10) { s -= 2; g.font = font(s); }
  return s;
};
const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t; };

const useShutterTex = (it: Item) => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640;
  const g = c.getContext('2d')!;
  g.fillStyle = it.paint; g.fillRect(0, 0, 1024, 640);
  // vertical planks with grain
  for (let k = 0; k < 8; k++) {
    g.fillStyle = `rgba(0,0,0,${0.08 + rand(k + it.nIdx * 3) * 0.1})`; g.fillRect(k * 128, 0, 128, 640);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(k * 128, 0, 4, 640);
    for (let j = 0; j < 14; j++) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(k * 128 + 10 + rand(k * 31 + j) * 100, 0, 2, 640); }
  }
  // painted frame + corner stars
  g.strokeStyle = 'rgba(255,233,190,.85)'; g.lineWidth = 10; g.strokeRect(36, 36, 952, 568);
  g.lineWidth = 3; g.strokeRect(56, 56, 912, 528);
  const star = (x: number, y: number, r: number) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
  g.fillStyle = GOLD; [[96, 96], [928, 96], [96, 544], [928, 544]].forEach(([x, y]) => star(x, y, 26));
  // the noun, painted
  g.fillStyle = '#fff1d6'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const s = fit(g, it.noun.toUpperCase(), 190, 820, (k) => `bold ${k}px Georgia`);
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
  g.font = `bold ${s}px Georgia`; g.fillText(it.noun.toUpperCase(), 512, 300);
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.font = 'italic 62px Georgia'; g.fillStyle = 'rgba(255,233,190,.8)'; g.fillText('der · die · das ?', 512, 470);
  return tex(c);
}, [it]);

const usePlankTex = () => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#5b3a22'; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 8; k++) {
    g.fillStyle = `rgba(${rand(k) > 0.5 ? '255,220,170' : '0,0,0'},${0.04 + rand(k + 9) * 0.08})`; g.fillRect(0, k * 64, 512, 64);
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, k * 64, 512, 3);
    for (let j = 0; j < 10; j++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(rand(k * 17 + j) * 512, k * 64 + 8 + rand(j + k) * 48, 60 + rand(j) * 120, 2); }
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}, []);

const useBoardTex = (art: Art, noun: string) => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 768; c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7a5230'; g.fillRect(0, 0, 768, 320);
  g.fillStyle = '#1c2422'; g.fillRect(20, 20, 728, 280);
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 40; k++) g.fillRect(rand(k) * 728 + 20, rand(k + 5) * 280 + 20, 80, 3);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 92px Georgia';
  const w = g.measureText(art).width + 50;
  g.fillStyle = GENUS[art]; g.beginPath(); g.roundRect(384 - w / 2, 46, w, 108, 54); g.fill();
  g.fillStyle = '#111'; g.fillText(art, 384, 102);
  g.fillStyle = '#f4f1e8';
  const s = fit(g, noun, 104, 680, (k) => `bold ${k}px Georgia`);
  g.font = `bold ${s}px Georgia`; g.fillText(noun, 384, 228);
  return tex(c);
}, [art, noun]);

const useSignTex = (txt: string) => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 640; c.height = 200;
  const g = c.getContext('2d')!;
  g.fillStyle = '#efe2c2'; g.beginPath(); g.roundRect(0, 0, 640, 200, 30); g.fill();
  g.strokeStyle = '#6b4424'; g.lineWidth = 12; g.beginPath(); g.roundRect(10, 10, 620, 180, 24); g.stroke();
  g.fillStyle = '#5a2a14'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const s = fit(g, txt, 130, 560, (k) => `bold ${k}px Georgia`);
  g.font = `bold ${s}px Georgia`; g.fillText(txt, 320, 108);
  return tex(c);
}, [txt]);

const useSausageTex = () => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7a2a1c'; g.fillRect(0, 0, 256, 128);
  for (let k = 0; k < 260; k++) { g.fillStyle = rand(k) > 0.5 ? 'rgba(240,200,170,.55)' : 'rgba(40,10,6,.5)'; g.beginPath(); g.arc(rand(k + 1) * 256, rand(k + 2) * 128, 1.5 + rand(k + 3) * 3, 0, PI * 2); g.fill(); }
  for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(20,6,4,.6)'; g.fillRect(20 + k * 40, 0, 7, 128); } // grill marks
  return tex(c);
}, []);

const useSkyTex = () => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, '#050817'); gr.addColorStop(0.55, '#101b3e'); gr.addColorStop(1, '#2a2340');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
  for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(255,255,255,${0.2 + rand(k) * 0.6})`; g.fillRect(rand(k + 1) * 512, rand(k + 2) * 600, 2, 2); }
  return tex(c);
}, []);

/* ---------------- small pieces ---------------- */
const Bulbs: React.FC<{x0: number; y0: number; x1: number; y1: number; z: number; n: number; on: number; seed: number}> = ({x0, y0, x1, y1, z, n, on, seed}) => (
  <>
    {Array.from({length: n}, (_, k) => {
      const f = k / (n - 1);
      const lit = clamp(on * (n + 4) - k) ;               // sweeps along the chain
      const sag = Math.sin(f * PI * 6) * 0.03;
      const c = ['#ffd27a', '#ffb347', '#fff0c0'][(k + seed) % 3];
      return (
        <mesh key={k} position={[L(x0, x1, f), L(y0, y1, f) - 0.06 - Math.abs(sag), z]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color={lit > 0.5 ? c : '#3a3328'} emissive={c} emissiveIntensity={0.08 + lit * 2.6} />
        </mesh>
      );
    })}
  </>
);

const Goods: React.FC<{kind: string; t: number; open: number}> = ({kind, t, open}) => {
  const y = CNT + 0.02;
  if (kind === 'apple') return (
    <>
      {[-0.9, -0.45, 0, 0.45, 0.9].map((x, k) => (
        <group key={k} position={[x, y + 0.2, 0.25 + (k % 2) * 0.12]}>
          <mesh castShadow><sphereGeometry args={[0.19, 24, 18]} /><meshStandardMaterial color="#b3241f" roughness={0.35} /></mesh>
          <mesh position={[0, 0.24, 0]}><cylinderGeometry args={[0.015, 0.015, 0.2, 6]} /><meshStandardMaterial color="#5a3a1a" /></mesh>
          {/* steam */}
          {[0, 1].map((j) => { const ph = (t * 0.5 + rand(k * 3 + j)) % 1; return (
            <mesh key={j} position={[Math.sin(t * 2 + k + j) * 0.05, 0.35 + ph * 0.6, 0]}><sphereGeometry args={[0.06 + ph * 0.08, 10, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.22 * (1 - ph) * open} depthWrite={false} /></mesh>); })}
        </group>
      ))}
    </>
  );
  if (kind === 'marzipan') return (
    <>
      <mesh position={[0, y + 0.03, 0.25]}><boxGeometry args={[2.3, 0.05, 0.6]} /><meshStandardMaterial color="#d9c6a0" roughness={0.7} /></mesh>
      {Array.from({length: 14}, (_, k) => (
        <mesh key={k} position={[-1.0 + (k % 7) * 0.33, y + 0.13, 0.12 + Math.floor(k / 7) * 0.26]} castShadow>
          <sphereGeometry args={[0.1, 16, 12]} /><meshStandardMaterial color={['#f29a2e', '#f4d23c', '#8bc34a', '#e8503a', '#c9a27a'][k % 5]} roughness={0.55} /></mesh>
      ))}
    </>
  );
  if (kind === 'biscuit') return (
    <>
      {[-0.8, 0, 0.8].map((x, k) => Array.from({length: 6}, (_, j) => (
        <mesh key={`${k}-${j}`} position={[x, y + 0.03 + j * 0.05, 0.25]} rotation={[0, rand(k * 9 + j) * 0.4 - 0.2, 0]} castShadow>
          <boxGeometry args={[0.5, 0.04, 0.32]} /><meshStandardMaterial color={j % 2 ? '#a0612a' : '#b8752f'} roughness={0.8} /></mesh>
      )))}
    </>
  );
  if (kind === 'lantern') return (
    <>
      {[-0.95, 0, 0.95].map((x, k) => (
        <group key={k} position={[x, y + 0.26, 0.2]}>
          <mesh><boxGeometry args={[0.26, 0.42, 0.26]} /><meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={0.3 + open * 1.8} transparent opacity={0.9} /></mesh>
          <mesh position={[0, 0.25, 0]}><coneGeometry args={[0.2, 0.14, 4]} /><meshStandardMaterial color="#222" metalness={0.6} /></mesh>
        </group>
      ))}
    </>
  );
  // sausages hanging on hooks inside the trap stall
  return (
    <>
      {[-1.2, -1.0, -0.82, 0.82, 1.0, 1.2].map((xx, k) => (
        <mesh key={k} position={[xx, TOP - 0.55 + Math.sin(t * 1.5 + k) * 0.01, -0.3]} rotation={[0, 0, Math.sin(t * 1.3 + k) * 0.05]}>
          <capsuleGeometry args={[0.06, 0.6, 6, 12]} /><meshStandardMaterial color="#7a2a1c" roughness={0.5} /></mesh>
      ))}
      <mesh position={[0.95, y + 0.17, 0.3]}><cylinderGeometry args={[0.12, 0.12, 0.3, 18]} /><meshStandardMaterial color="#f2c230" roughness={0.4} /></mesh>
    </>
  );
};

/* fire basket with a grate and three sizzling sausages in front of the trap stall */
const Grill: React.FC<{t: number; flare: number; senf: number}> = ({t, flare, senf}) => {
  const sTex = useSausageTex();
  const GY = -0.55;
  return (
    <group position={[0, 0, FZ + 1.15]}>
      {/* basket */}
      <mesh position={[0, GY - 0.4, 0]}><cylinderGeometry args={[0.62, 0.45, 0.6, 20, 1, true]} /><meshStandardMaterial color="#6a5446" metalness={0.5} roughness={0.45} emissive="#ff6a20" emissiveIntensity={0.12} side={THREE.DoubleSide} /></mesh>
      {[0, 1, 2].map((k) => <mesh key={k} position={[Math.cos(k * 2.1) * 0.4, (GY - 0.7 + GROUND) / 2, Math.sin(k * 2.1) * 0.4]}><cylinderGeometry args={[0.03, 0.03, GY - 0.7 - GROUND, 6]} /><meshStandardMaterial color="#222" metalness={0.8} /></mesh>)}
      {/* embers */}
      <mesh position={[0, GY - 0.2, 0]} rotation={[-PI / 2, 0, 0]}><circleGeometry args={[0.55, 24]} /><meshStandardMaterial color="#ff5a1a" emissive="#ff4a10" emissiveIntensity={1.4 + Math.sin(t * 9) * 0.3 + flare} /></mesh>
      {/* flames */}
      {Array.from({length: 9}, (_, k) => {
        const fl = 0.75 + 0.25 * Math.sin(t * (9 + k) + k * 2) + flare * 0.9;
        return (
          <mesh key={k} position={[(rand(k) - 0.5) * 0.7, GY - 0.15 + 0.22 * fl, (rand(k + 4) - 0.5) * 0.5]} scale={[1, fl, 1]}>
            <coneGeometry args={[0.12 + rand(k + 2) * 0.07, 0.7, 10]} />
            <meshBasicMaterial color={k % 3 ? '#ff8a1f' : '#ffd34a'} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })}
      {/* sparks */}
      {Array.from({length: 26}, (_, k) => {
        const ph = (t * (0.45 + rand(k) * 0.5) + rand(k + 7)) % 1;
        return (
          <mesh key={`s${k}`} position={[(rand(k + 3) - 0.5) * 0.8 + Math.sin(t * 3 + k) * 0.1 * ph, GY + ph * (1.6 + flare * 1.4), (rand(k + 5) - 0.5) * 0.5]}>
            <sphereGeometry args={[0.018, 6, 4]} /><meshBasicMaterial color="#ffcf6a" transparent opacity={1 - ph} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })}
      {/* grate */}
      {Array.from({length: 7}, (_, k) => <mesh key={`g${k}`} position={[0, GY, -0.3 + k * 0.1]} rotation={[0, 0, PI / 2]}><cylinderGeometry args={[0.008, 0.008, 1.3, 4]} /><meshStandardMaterial color="#555" metalness={0.9} roughness={0.3} /></mesh>)}
      {/* sausages + mustard */}
      {[-0.17, 0.02, 0.21].map((z, k) => (
        <group key={`w${k}`} position={[0, GY + 0.07 + Math.abs(Math.sin(t * 7 + k)) * 0.006, z]} rotation={[0, 0.05 * (k - 1), PI / 2]}>
          <mesh castShadow><capsuleGeometry args={[0.065, 0.85, 6, 14]} /><meshStandardMaterial map={sTex} roughness={0.4} /></mesh>
          {senf > 0 && Array.from({length: 8}, (_, j) => (j / 8 < senf) && (
            <mesh key={j} position={[Math.sin(j * 1.7) * 0.02 + 0.06, -0.4 + j * 0.11, 0]} rotation={[0, 0, (j % 2 ? 1 : -1) * 0.5]}>
              <capsuleGeometry args={[0.018, 0.08, 4, 8]} /><meshStandardMaterial color="#f2c230" roughness={0.3} emissive="#a07a00" emissiveIntensity={0.2} /></mesh>
          ))}
        </group>
      ))}
      {/* smoke */}
      {Array.from({length: 8}, (_, k) => {
        const ph = (t * 0.22 + rand(k + 11)) % 1;
        return (
          <mesh key={`m${k}`} position={[Math.sin(t * 0.7 + k) * 0.25 + ph * 0.3, GY + 0.3 + ph * 2.2, -0.2]}>
            <sphereGeometry args={[0.08 + ph * 0.22, 12, 10]} /><meshBasicMaterial color="#c8c2c8" transparent opacity={0.07 * Math.sin(ph * PI)} depthWrite={false} />
          </mesh>
        );
      })}
      <pointLight position={[0, GY + 0.4, 0.2]} intensity={6 + Math.sin(t * 13) * 1.2 + flare * 10} color="#ff7a2a" distance={6} decay={1.6} />
    </group>
  );
};

/* one wooden stall */
const Stall: React.FC<{i: number; t: number; fps: number}> = ({i, t, fps}) => {
  const it = ITEMS[i];
  const shutter = useShutterTex(it), plank = usePlankTex();
  const isStandl = i === STAND && t >= standlT() - 0.05;
  const board = useBoardTex(it.art, it.noun), board2 = useBoardTex(STANDL.art, STANDL.noun);
  const sign = useSignTex('STAND');
  const r = reveal(i);
  // shutter: rattles in the last part of the guess, then springs open into an awning
  const op = t < r ? 0 : spring({frame: Math.round((t - r) * fps), fps, config: {damping: 9, stiffness: 90, mass: 0.8}});
  const tense = clamp((t - (r - (i === KRAK ? 1.2 : 0.7))) / 0.5) * (t < r ? 1 : 0);
  const rattle = tense * Math.sin(t * 60 + i) * (i === KRAK ? 0.07 : 0.04);
  const ang = op * 1.62 + rattle;
  const lit = clamp((t - r) / 0.6);
  const bulbsOn = clamp((t - r - 0.1) / 0.8);
  // board flip for the Standl twist
  const flip = i === STAND ? prog(t, standlT() - 0.1, 0.45) : 0;
  const Lin = i === STAND ? spring({frame: Math.round((t - standlT()) * fps), fps, config: {damping: 8, stiffness: 160}}) : 0;
  const OW = BW - 0.4, OH = TOP - CNT;
  const roofLen = Math.hypot(RHW, RIDGE - EAVE), roofA = Math.atan2(RIDGE - EAVE, RHW);
  const gable = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-BW / 2, EAVE); s.lineTo(BW / 2, EAVE); s.lineTo(0, RIDGE - 0.05); s.closePath(); return new THREE.ShapeGeometry(s); }, []);
  return (
    <group position={[i * BX, 0, 0]}>
      {/* body: back, sides, front posts, lintel, counter */}
      <mesh position={[0, (GROUND + EAVE) / 2, -BD / 2]} receiveShadow><boxGeometry args={[BW, EAVE - GROUND, 0.08]} /><meshStandardMaterial map={plank} roughness={0.85} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * BW / 2, (GROUND + EAVE) / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.1, EAVE - GROUND, BD]} /><meshStandardMaterial map={plank} roughness={0.85} /></mesh>)}
      {[-1, 1].map((s) => <mesh key={`p${s}`} position={[s * (BW / 2 - 0.1), (GROUND + EAVE) / 2, FZ]}><boxGeometry args={[0.2, EAVE - GROUND, 0.12]} /><meshStandardMaterial color="#4a2e1a" roughness={0.8} /></mesh>)}
      <mesh position={[0, (TOP + EAVE) / 2, FZ]}><boxGeometry args={[BW, EAVE - TOP + 0.02, 0.12]} /><meshStandardMaterial color="#4a2e1a" roughness={0.8} /></mesh>
      <mesh position={[0, (GROUND + CNT) / 2, FZ]} receiveShadow><boxGeometry args={[BW, CNT - GROUND, 0.1]} /><meshStandardMaterial map={plank} color="#c89a70" roughness={0.85} /></mesh>
      <mesh position={[0, CNT, FZ - 0.25]} castShadow><boxGeometry args={[OW + 0.1, 0.07, 0.75]} /><meshStandardMaterial color="#8a5a34" roughness={0.6} /></mesh>
      {/* warm interior */}
      <mesh position={[0, (CNT + TOP) / 2, -BD / 2 + 0.05]}><planeGeometry args={[OW, OH]} /><meshStandardMaterial color="#5a3418" emissive="#ff9a3c" emissiveIntensity={0.05 + lit * 0.55} /></mesh>
      <pointLight position={[0, TOP - 0.3, 0.2]} intensity={lit * 5} color="#ffb067" distance={4} decay={1.5} />
      {/* price board on the back wall (flips for the twist) */}
      <group position={[0, TOP - 0.45, -BD / 2 + 0.12]} rotation={[0, flip * PI, 0]}>
        <mesh position={[0, 0, 0.005]}><planeGeometry args={[1.5, 0.62]} /><meshStandardMaterial map={board} emissive="#ffffff" emissiveMap={board} emissiveIntensity={0.25 * lit} /></mesh>
        {i === STAND && <mesh position={[0, 0, -0.005]} rotation={[0, PI, 0]}><planeGeometry args={[1.5, 0.62]} /><meshStandardMaterial map={board2} emissive="#ffffff" emissiveMap={board2} emissiveIntensity={0.3} /></mesh>}
      </group>
      {lit > 0 && <Goods kind={it.goods} t={t} open={lit} />}
      {/* the hinged shutter (Klappladen) */}
      <group position={[0, TOP, FZ + 0.08]} rotation={[-ang, 0, 0]}>
        <mesh position={[0, -OH / 2, 0]} castShadow><boxGeometry args={[OW + 0.08, OH, 0.06]} /><meshStandardMaterial map={plank} color="#a07a5a" roughness={0.85} /></mesh>
        <mesh position={[0, -OH / 2, 0.032]}><planeGeometry args={[OW + 0.06, OH - 0.02]} /><meshStandardMaterial map={shutter} roughness={0.7} emissive="#ffffff" emissiveMap={shutter} emissiveIntensity={0.12} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (OW / 2 - 0.25), -0.06, 0.04]}><boxGeometry args={[0.3, 0.06, 0.03]} /><meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} /></mesh>)}
      </group>
      {/* gable roof with snow */}
      <mesh geometry={gable} position={[0, 0, FZ + 0.07]}><meshStandardMaterial map={plank} color="#8a6040" roughness={0.85} /></mesh>
      {[-1, 1].map((s) => (
        <group key={`r${s}`}>
          <mesh position={[s * RHW / 2, (EAVE + RIDGE) / 2, 0.05]} rotation={[0, 0, -s * roofA]} castShadow><boxGeometry args={[roofLen + 0.05, 0.1, BD + 0.5]} /><meshStandardMaterial color="#3b2416" roughness={0.9} /></mesh>
          <mesh position={[s * RHW / 2 - s * 0.03, (EAVE + RIDGE) / 2 + 0.09, 0.05]} rotation={[0, 0, -s * roofA]}><boxGeometry args={[roofLen - 0.05, 0.1, BD + 0.45]} /><meshStandardMaterial color="#eef3ff" roughness={0.95} /></mesh>
        </group>
      ))}
      <Bulbs x0={-RHW} y0={EAVE} x1={0} y1={RIDGE} z={FZ + 0.32} n={11} on={bulbsOn} seed={i} />
      <Bulbs x0={0} y0={RIDGE} x1={RHW} y1={EAVE} z={FZ + 0.32} n={11} on={bulbsOn} seed={i + 1} />
      {/* gable sign on the Stand stall: STAND -> STANDL */}
      {i === STAND && (
        <group position={[0, EAVE + 0.3, FZ + 0.12]}>
          <mesh><planeGeometry args={[1.1, 0.34]} /><meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.3} /></mesh>
          {Lin > 0.01 && (
            <group position={[0.68, 0, 0.02]} scale={Lin} rotation={[0, 0, (1 - Lin) * 1.2]}>
              <mesh><circleGeometry args={[0.2, 24]} /><meshStandardMaterial color={GENUS.das} emissive={GENUS.das} emissiveIntensity={0.6} /></mesh>
              <mesh position={[-0.03, 0, 0.01]}><boxGeometry args={[0.05, 0.22, 0.01]} /><meshBasicMaterial color="#10201a" /></mesh>
              <mesh position={[0.03, -0.085, 0.01]}><boxGeometry args={[0.13, 0.05, 0.01]} /><meshBasicMaterial color="#10201a" /></mesh>
            </group>
          )}
        </group>
      )}
      {i === KRAK && <Grill t={t} flare={(t >= r ? Math.exp(-(t - r) * 1.6) * 1.2 : 0) + tense * 0.3} senf={clamp((t - senfT() + 0.1) / 0.6)} />}
    </group>
  );
};

const Snow: React.FC<{t: number; heavy: number}> = ({t, heavy}) => (
  <>
    {Array.from({length: 170}, (_, k) => {
      if (k > 90 + heavy * 80) return null;
      const v = 0.35 + rand(k) * 0.4;
      const y = 3.6 - (((t * v + rand(k + 1) * 8) % 8));
      const x = (rand(k + 2) - 0.5) * 5 + Math.sin(t * 0.8 + k) * 0.15;
      const z = -1 + rand(k + 3) * 6;
      return <mesh key={k} position={[x, y, z]}><sphereGeometry args={[0.012 + rand(k + 4) * 0.02, 6, 4]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.85} /></mesh>;
    })}
  </>
);

const Scene: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const sky = useSkyTex();
  const x = camX(t), push = camPush(t);
  const solved = ITEMS.filter((_, i) => t >= reveal(i)).length;
    return (
    <>
      <ambientLight intensity={0.35} color="#8fa6ff" />
      <directionalLight position={[-3, 6, 5]} intensity={0.7} color="#b9c8ff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <hemisphereLight args={['#4a5c9a', '#1a1020', 0.4]} />
      {/* sky + distant town: slow parallax */}
      <mesh position={[-x * 0.15, 1.5, -9]}><planeGeometry args={[22, 16]} /><meshBasicMaterial map={sky} /></mesh>
      <group position={[-x * 0.4, 0, -5]}>
        {Array.from({length: 16}, (_, k) => {
          const h = 1.2 + rand(k) * 2.2, bx = -8 + k * 1.3;
          return (
            <group key={k} position={[bx, GROUND + h / 2, -rand(k + 3)]}>
              <mesh><boxGeometry args={[1.1, h, 0.6]} /><meshStandardMaterial color="#141a33" roughness={1} /></mesh>
              {Array.from({length: 4}, (_, j) => rand(k * 7 + j) > 0.45 && (
                <mesh key={j} position={[-0.3 + (j % 2) * 0.6, h / 2 - 0.35 - Math.floor(j / 2) * 0.55, 0.31]}><planeGeometry args={[0.18, 0.24]} />
                  <meshBasicMaterial color="#ffcf7a" transparent opacity={0.35 + 0.5 * clamp(solved / 4)} /></mesh>
              ))}
            </group>
          );
        })}
        {/* the big tree in the square */}
        <group position={[4.5, GROUND, 1]}>
          {[0, 1, 2, 3].map((k) => <mesh key={k} position={[0, 1 + k * 0.85, 0]}><coneGeometry args={[1.5 - k * 0.32, 1.5, 18]} /><meshStandardMaterial color="#0f2a1e" roughness={1} /></mesh>)}
          {Array.from({length: 40}, (_, k) => {
            const hh = rand(k) * 3.4, rr = (1.5 - hh * 0.38) * 0.95, a = k * 2.4;
            const on = clamp(solved / N + 0.2 - rand(k + 1) * 0.5) > 0.05;
            return <mesh key={`b${k}`} position={[Math.cos(a) * rr, 0.6 + hh, Math.sin(a) * rr]}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color={on ? '#ffd27a' : '#3a3020'} /></mesh>;
          })}
        </group>
      </group>
      {/* the lane */}
      <group position={[-x, L(0.18, 0.55, push), L(-1.2 + t * 0.006, 0.9, push)]}>
        <mesh position={[KRAK * BX / 2, GROUND, 1]} rotation={[-PI / 2, 0, 0]} receiveShadow><planeGeometry args={[BX * N + 14, 10]} /><meshStandardMaterial color="#d6def2" roughness={0.9} /></mesh>
        {ITEMS.map((_, i) => <Stall key={i} i={i} t={t} fps={fps} />)}
      </group>
      <Snow t={t} heavy={clamp(solved / N)} />
    </>
  );
};

/* ---------------- overlays ---------------- */
const Pill: React.FC<{art: Art; size: number; dim?: boolean}> = ({art, size, dim}) => (
  <span style={{background: dim ? 'rgba(255,255,255,.12)' : GENUS[art], color: dim ? 'rgba(255,246,228,.45)' : '#121018', borderRadius: size, padding: `0 ${size * 0.34}px`, display: 'inline-block', lineHeight: 1.3, fontFamily: HUD}}>{art}</span>
);

/* which stall is "current" for the HUD */
const current = (t: number) => {
  for (let i = N - 1; i >= 0; i--) if (t >= nounAt(i) - 0.15) return i;
  return -1;
};

const Tags: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const i = current(t);
  if (i < 0 || t > T_PAY() - 0.1) return null;
  const r = reveal(i), g0 = guess0(i);
  const end = nextStart(i);
  if (t > end) return null;
  const revealed = t >= r - 0.05;
  const twist = i === STAND && t >= standlT() - 0.05;
  const art: Art = twist ? 'das' : ITEMS[i].art;
  const hop = !revealed && t > g0 - 0.1 ? Math.floor((t - g0) / 0.28) % 3 : -1;
  const timer = 1 - clamp((t - g0) / (r - g0));
  const ttw = twist ? spring({frame: Math.round((t - standlT()) * fps), fps, config: {damping: 9, stiffness: 150}}) : 1;
  const sr = spring({frame: Math.round((t - (twist ? standlT() : r)) * fps), fps, config: {damping: 9, stiffness: 160}});
  return (
    <div style={{position: 'absolute', top: SAFE.top + 92, left: SAFE.side, right: SAFE.side, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: clamp((end - t) / 0.2)}}>
      <div style={{display: 'flex', gap: 26, background: 'rgba(8,10,24,.78)', padding: '12px 24px', borderRadius: 60}}>
        {ARTS.map((a, k) => {
          const win = revealed && a === art;
          const s = win ? 1 + 0.28 * sr : hop === k ? 1.12 : 1;
          return (
            <div key={a} style={{transform: `scale(${s}) rotateY(${win && twist ? (1 - ttw) * 180 : 0}deg)`, fontSize: 64, transition: 'none'}}>
              <Pill art={a} size={64} dim={revealed ? !win : hop !== k} />
            </div>
          );
        })}
      </div>
      {!revealed && t > g0 - 0.1 && (
        <div style={{width: 520, height: 14, borderRadius: 7, background: 'rgba(255,246,228,.18)', marginTop: 20, overflow: 'hidden'}}>
          <div style={{height: 14, width: `${timer * 100}%`, background: i === KRAK ? '#ff5a3a' : GOLD, borderRadius: 7}} />
        </div>
      )}
    </div>
  );
};

const Star: React.FC<{on: number; size: number}> = ({on, size}) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={{transform: `scale(${1 + 0.35 * Math.sin(on * PI)})`}}>
    <path d={Array.from({length: 10}, (_, k) => { const a = -PI / 2 + k * PI / 5, rr = k % 2 ? 4 : 9.5; return `${k ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`; }).join(' ') + 'Z'}
      fill={on > 0.5 ? GOLD : 'rgba(255,246,228,.12)'} stroke={GOLD} strokeWidth={1} />
  </svg>
);

const Hud: React.FC<{t: number}> = ({t}) => {
  const i = current(t);
  const inQuiz = t >= T_REW1() - 0.1 && t < T_PAY() - 0.1;
  const label = i < 0 ? 'ZÄHL MIT' : i === KRAK ? 'DIE FALLE' : `BUDE ${i + 1}/${N}`;
  if (!inQuiz) return null;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{fontFamily: HUD, fontSize: 40, color: i === KRAK ? '#ff6a4a' : GOLD, letterSpacing: 2, background: 'rgba(8,10,24,.72)', padding: '6px 22px', borderRadius: 16}}>{label}</div>
      <div style={{display: 'flex', gap: 6, background: 'rgba(8,10,24,.72)', padding: '8px 14px', borderRadius: 16}}>
        {ITEMS.map((_, k) => <Star key={k} on={clamp((t - reveal(k) - 0.1) / 0.35)} size={50} />)}
      </div>
    </div>
  );
};

const ExCard: React.FC<{from: number; to: number; art: Art; noun: string; ex: string; en: string}> = ({from, to, art, noun, ex, en}) => (
  <Card from={from} to={to} label="Beispiel" accent={GOLD} bg="rgba(10,12,30,.9)">
    <div style={{fontFamily: PAINT, fontSize: 60, fontWeight: 700, color: INK, marginBottom: 10}}><Pill art={art} size={60} />{NB}{noun}</div>
    <div style={{fontFamily: PAINT, fontSize: 40, color: INK, lineHeight: 1.25}}>{ex}</div>
    <div style={{fontFamily: '"Segoe UI", sans-serif', fontSize: 30, color: INK, opacity: 0.65, marginTop: 10, fontStyle: 'italic'}}>{en}</div>
  </Card>
);

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const mom = T_MOMENT(), rew1 = T_REW1();
  const rewinding = t > mom + 0.3 && t < rew1 + 0.1;
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      <Audio src={staticFile('laneA/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 9], fov: 40}} gl={{antialias: true}} shadows>
        <Scene t={t} fps={fps} />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(4,6,18,.6) 100%)', pointerEvents: 'none'}} />

      {/* HOOK: visible from frame 0, works without sound */}
      {t < mom + 0.35 && (
        <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: clamp((mom + 0.35 - t) / 0.25)}}>
          <div style={{fontFamily: HUD, fontSize: 88, color: INK, textShadow: '0 6px 24px rgba(0,0,0,.8)', lineHeight: 1.05, textAlign: 'center'}}>
            <span style={{color: GENUS.der}}>der</span>? <span style={{color: GENUS.die}}>die</span>? <span style={{color: GENUS.das}}>das</span>?
          </div>
        </div>
      )}
      {t >= mom - 0.05 && t < rew1 + 0.3 && (
        <div style={{position: 'absolute', top: SAFE.top + 10, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: clamp((rew1 + 0.3 - t) / 0.25)}}>
          <Pop show={mom - 0.05}><div style={{fontFamily: HUD, fontSize: 92, color: '#ff6a4a', transform: 'rotate(-4deg)', border: '8px solid #ff6a4a', borderRadius: 18, padding: '0 30px', background: 'rgba(8,10,24,.75)'}}>DIE FALLE</div></Pop>
          <Pop show={at('s02', 5)}><div style={{fontFamily: HUD, fontSize: 52, color: INK, marginTop: 18, background: 'rgba(8,10,24,.75)', padding: '6px 24px', borderRadius: 14}}>kommt am Ende</div></Pop>
        </div>
      )}
      {rewinding && (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {Array.from({length: 18}, (_, k) => (
            <div key={k} style={{position: 'absolute', top: 300 + rand(k) * 1200, left: ((rand(k + 1) * 1400 + (t - mom) * 4200) % 1600) - 300, width: 200 + rand(k + 2) * 300, height: 4, background: 'rgba(255,246,228,.35)', borderRadius: 2}} />
          ))}
          <div style={{position: 'absolute', top: 1150, left: 0, right: 0, textAlign: 'center', fontFamily: HUD, fontSize: 120, color: GOLD, opacity: 0.9}}>◀◀</div>
          <div style={{position: 'absolute', top: 1320, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}><div style={{fontFamily: HUD, fontSize: 58, color: INK, background: 'rgba(8,10,24,.8)', padding: '8px 28px', borderRadius: 16}}>Erst 4 Buden. Zähl mit!</div></div>
        </AbsoluteFill>
      )}

      <Hud t={t} />
      <Tags t={t} fps={fps} />

      {ITEMS.map((it, i) => {
        const to = i === STAND ? standlT() - 0.12 : i === KRAK ? T_PAY() - 0.2 : nextStart(i);
        return <ExCard key={i} from={reveal(i) - 0.05} to={to} art={it.art} noun={it.noun} ex={it.ex} en={it.en} />;
      })}
      <ExCard from={standlT()} to={nextStart(STAND)} art={STANDL.art} noun={STANDL.noun} ex={STANDL.ex} en={STANDL.en} />

      {/* PAYOFF */}
      {t >= T_PAY() - 0.1 && t < T_TEASE() - 0.05 && (
        <div style={{position: 'absolute', top: SAFE.top + 30, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <Pop show={T_PAY() - 0.05}><div style={{fontFamily: HUD, fontSize: 130, color: GOLD, textShadow: '0 6px 30px rgba(0,0,0,.8)', background: 'rgba(8,10,24,.78)', borderRadius: 30, padding: '0 40px'}}>5/5?</div></Pop>
          <div style={{display: 'flex', gap: 12, marginTop: 8}}>{ITEMS.map((_, k) => <Pop key={k} show={T_PAY() + 0.1 + k * 0.08}><Star on={1} size={80} /></Pop>)}</div>
        </div>
      )}
      {t >= T_TEASE() - 0.05 && (
        <div style={{position: 'absolute', top: SAFE.top + 30, left: SAFE.side, right: SAFE.side, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: 'rgba(8,10,24,.8)', borderRadius: 26, padding: '20px 36px', borderTop: `6px solid ${GOLD}`, textAlign: 'center'}}>
            <Spoken line={line('s16')} size={58} color={INK} font={PAINT} />
          </div>
        </div>
      )}
      {t >= T_CTA() - 0.3 && (
        <div style={{position: 'absolute', top: 1260, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <FollowCTA show={T_CTA()} accent="#c8343a" />
        </div>
      )}
    </AbsoluteFill>
  );
};
