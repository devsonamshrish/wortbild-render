/* quiz-weihnachtsmarkt-02 – "Lebkuchenherz: der, die oder das?"
   Leitmetapher: a dark Budengasse at night. Every correctly guessed article switches on the lights of one stall,
   the lane lights up stall by stall until the last hut, where the gingerbread heart from the hook swings.
   Hook = the trap word (frame 0), "Moment" rewinds the lane to the first stall, the heart is paid off at the end. */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T from '../data/laneE-timings.json';
import {makeTiming, Pop, Spoken, Card, FollowCTA, SAFE, NB, GENUS, rand, clamp, prog, Timings, SANS} from '../lib/kit';

const {line, at, scene, frames} = makeTiming(T as unknown as Timings);
export const FRAMES = frames();

const GOLD = '#ffcf6b';
const BLACK = '"Arial Black", Impact, sans-serif';
const W = 4.7; // distance between stalls
const last = (id: string) => at(id, line(id).words.length - 1);

type Art = 'der' | 'die' | 'das';
const ITEMS: {key: string; art: Art; noun: string; q: string; r: string; ex: string; exSkip: number; en: string; exText?: string}[] = [
  {key: 'marone', art: 'die', noun: 'Marone', q: 's04', r: 's05', ex: 's05', exSkip: 0, en: 'roasted chestnut', exText: 'Die Maronen kommen heiß aus der Glut, man pellt sie mit den Fingern.'},
  {key: 'zuckerwatte', art: 'die', noun: 'Zuckerwatte', q: 's06', r: 's07', ex: 's07', exSkip: 0, en: 'candy floss', exText: 'Die Zuckerwatte ist so groß wie mein Kopf, das schaffe ich nie allein.'},
  {key: 'lametta', art: 'das', noun: 'Lametta', q: 's08', r: 's09', ex: 's09', exSkip: 0, en: 'tinsel', exText: 'Das Lametta klebt noch im Staubsauger, obwohl der Baum längst weg ist.'},
  {key: 'lebkuchen', art: 'der', noun: 'Lebkuchen', q: 's10', r: 's11', ex: 's11', exSkip: 2, en: 'gingerbread (honey-spice cake)'},
  {key: 'herz', art: 'das', noun: 'Lebkuchenherz', q: 's12', r: 's13', ex: 's14', exSkip: 0, en: 'gingerbread heart'},
];
const reveal = (i: number) => (i === 4 ? at('s13', 2) : i === 0 ? at('s05', 1) : at(ITEMS[i].r, 0));
const qStart = (i: number) => line(ITEMS[i].q).start;
const qWord = (i: number) => last(ITEMS[i].q);
const NOT_DER = () => at('s13', 0);
const REW = () => at('s02', 0); // "Moment."
const FLIP = () => at('s14', 4); // heart turns round: "mit „Für meine Kollegin“"
const END_ZOOM = () => line('s14').start;

/* ---------- camera path: the world group slides, the camera never moves ---------- */
const camAt = (t: number) => {
  let x = 4 * W, z = 2.6, y = -0.35;
  const r0 = REW();
  if (t >= r0) {
    const k = prog(t, r0 + 0.15, 0.95);
    x = 4 * W * (1 - k); z = 2.6 * (1 - k); y = -0.35 * (1 - k);
  }
  for (let i = 1; i < 5; i++) {
    const s = qStart(i) - 0.1;
    if (t >= s) x = (i - 1) * W + W * prog(t, s, 0.8);
  }
  // push in during each guess pause (the ticking moment), release on the reveal
  for (let i = 0; i < 5; i++) {
    const a = line(ITEMS[i].q).end, b = reveal(i);
    if (t > a - 0.2 && t < b + 1.2) z += 0.9 * prog(t, a - 0.2, b - a + 0.2) * (1 - prog(t, b, 0.6));
  }
  const e = END_ZOOM();
  if (t >= e) { const k = prog(t, e, 1.1); z += 2.6 * k; y += -0.35 * k; }
  return {x, y, z};
};

/* ---------- textures ---------- */
const heartPath = (g: CanvasRenderingContext2D) => {
  g.beginPath();
  g.moveTo(5, 5); g.bezierCurveTo(5, 5, 4, 0, 0, 0); g.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  g.bezierCurveTo(-6, 11, -3, 15.4, 5, 19); g.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  g.bezierCurveTo(16, 7, 16, 0, 10, 0); g.bezierCurveTo(7, 0, 5, 5, 5, 5); g.closePath();
};
const useIcing = (text: boolean) =>
  useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 900;
    const g = c.getContext('2d')!;
    const sc = 44; // 22 x 19 units -> 968 x 836
    g.save(); g.translate(512 - 5 * sc * 0.86, 450 - 9.5 * sc * 0.86); g.scale(sc * 0.86, sc * 0.86);
    heartPath(g); g.restore();
    g.strokeStyle = '#fff7ee'; g.lineWidth = 16; g.setLineDash([2, 26]); g.lineCap = 'round'; g.stroke();
    g.setLineDash([]); g.lineWidth = 7;
    g.save(); g.translate(512 - 5 * sc * 0.74, 450 - 9.5 * sc * 0.74); g.scale(sc * 0.74, sc * 0.74); heartPath(g); g.restore(); g.stroke();
    g.fillStyle = '#fff7ee'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (text) {
      g.font = 'italic bold 118px Georgia'; g.fillText('Für meine', 512, 330);
      g.font = 'italic bold 132px Georgia'; g.fillText('Kollegin', 512, 470);
    } else {
      // little icing flowers
      for (const [x, y] of [[512, 330], [390, 420], [634, 420], [512, 520]]) {
        for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + Math.cos(k) * 30, y + Math.sin(k) * 30, 14, 0, 7); g.fill(); }
        g.fillStyle = '#e8414f'; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.fillStyle = '#fff7ee';
      }
    }
    const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; return tex;
  }, [text]);

const useHeartGeo = () =>
  useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(5, 5); s.bezierCurveTo(5, 5, 4, 0, 0, 0); s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
    s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19); s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
    s.bezierCurveTo(16, 7, 16, 0, 10, 0); s.bezierCurveTo(7, 0, 5, 5, 5, 5);
    const g = new THREE.ExtrudeGeometry(s, {depth: 2.2, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 4, curveSegments: 24});
    g.translate(-5, -9.5, -1.1);
    return g;
  }, []);

/* ---------- 3D pieces ---------- */
const WOOD = ['#5b3420', '#4a2c1c', '#603a22', '#523020', '#5e361f'];
const Stall: React.FC<{i: number; lit: number; t: number}> = ({i, lit, t}) => {
  const wood = WOOD[i];
  const bulbs = 11;
  return (
    <group position={[i * W, 0, 0]}>
      {/* back wall, sides */}
      <mesh position={[0, -0.95, -0.8]}><boxGeometry args={[3.8, 3.4, 0.12]} /><meshStandardMaterial color={new THREE.Color('#2a1810').lerp(new THREE.Color('#7a4a2a'), lit).getStyle()} roughness={0.9} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 1.85, -0.95, -0.05]}><boxGeometry args={[0.14, 3.4, 1.6]} /><meshStandardMaterial color={wood} roughness={0.85} /></mesh>)}
      {/* counter */}
      <mesh position={[0, -1.75, 0.55]}><boxGeometry args={[3.8, 1.7, 0.7]} /><meshStandardMaterial color={new THREE.Color(wood).lerp(new THREE.Color('#9a5a2e'), lit * 0.6).getStyle()} roughness={0.8} /></mesh>
      {/* fir garland with berries and bulbs along the counter front */}
      {Array.from({length: 26}, (_, k) => {
        const x = -1.9 + (3.8 * k) / 25, y = -1.05 - Math.sin((k / 25) * Math.PI * 3) ** 2 * 0.28;
        return (
          <group key={k} position={[x, y, 0.98]}>
            <mesh scale={[0.2, 0.15, 0.12]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#1f5a33" roughness={0.9} emissive="#0d3a1c" emissiveIntensity={0.4} /></mesh>
            {k % 3 === 0 && <mesh position={[0.05, -0.08, 0.1]}><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color="#d8202f" emissive="#d8202f" emissiveIntensity={0.4} /></mesh>}
            {k % 3 === 1 && <mesh position={[0, 0.03, 0.12]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#fff1c4" emissive={GOLD} emissiveIntensity={0.15 + lit * 2.2 * (0.7 + 0.3 * Math.sin(t * 5 + k))} /></mesh>}
          </group>
        );
      })}
      <pointLight position={[0, -1.5, 2.2]} intensity={lit * 3} color="#ff9a4a" distance={3.5} />
      <mesh position={[0, -0.88, 0.6]}><boxGeometry args={[4.0, 0.08, 0.9]} /><meshStandardMaterial color="#8a5a34" roughness={0.6} /></mesh>
      {/* planks on the counter front */}
      {[0, 1, 2, 3].map((k) => <mesh key={k} position={[0, -1.15 - k * 0.42, 0.91]}><boxGeometry args={[3.8, 0.03, 0.02]} /><meshStandardMaterial color="#2a1810" /></mesh>)}
      {/* gable roof with snow */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.05, 1.05, 0.15]} rotation={[0, 0, -s * 0.5]}>
          <mesh><boxGeometry args={[2.5, 0.12, 2.1]} /><meshStandardMaterial color="#3a2216" roughness={0.9} /></mesh>
          <mesh position={[0, 0.12, 0]}><boxGeometry args={[2.5, 0.14, 2.1]} /><meshStandardMaterial color="#eef3ff" roughness={1} /></mesh>
        </group>
      ))}
      {/* string of lights along the eave: the score */}
      {Array.from({length: bulbs}, (_, k) => {
        const x = -1.9 + (3.8 * k) / (bulbs - 1), y = 0.42 - Math.sin((k / (bulbs - 1)) * Math.PI) * 0.12;
        const tw = 0.75 + 0.25 * Math.sin(t * 6 + k * 1.7);
        return <mesh key={k} position={[x, y, 1.12]}><sphereGeometry args={[0.055, 10, 10]} /><meshStandardMaterial color="#fff1c4" emissive={GOLD} emissiveIntensity={0.08 + lit * 2.4 * tw} /></mesh>;
      })}
      <pointLight position={[0, 0.1, 1.2]} intensity={0.3 + lit * 9} color="#ffb45c" distance={5.5} />
    </group>
  );
};

const Chestnuts: React.FC<{t: number; hop: number}> = ({t, hop}) => (
  <group position={[0, -0.75, 0.55]}>
    <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.95, 0.75, 0.14, 40]} /><meshStandardMaterial color="#26262b" metalness={0.7} roughness={0.4} /></mesh>
    <mesh position={[0, -0.13, 0]}><cylinderGeometry args={[0.7, 0.7, 0.04, 30]} /><meshStandardMaterial color="#3a1206" emissive="#ff5a1a" emissiveIntensity={1.2 + Math.sin(t * 9) * 0.4} /></mesh>
    {Array.from({length: 11}, (_, k) => {
      const a = k * 2.4, r = k === 0 ? 0 : 0.25 + (k % 3) * 0.18;
      const h = Math.max(0, Math.sin(clamp((t - hop - k * 0.04) / 0.5) * Math.PI)) * 0.5;
      return (
        <mesh key={k} position={[Math.cos(a) * r, 0.13 + h, Math.sin(a) * r * 0.6]} rotation={[0.3, a, 0.2]} scale={[0.19, 0.15, 0.17]}>
          <sphereGeometry args={[1, 18, 14]} /><meshStandardMaterial color="#6a3418" roughness={0.45} />
        </mesh>
      );
    })}
    {Array.from({length: 6}, (_, k) => {
      const p = ((t * 0.5 + k / 6) % 1);
      return <mesh key={k} position={[Math.sin(k * 3 + t) * 0.3, 0.3 + p * 1.6, 0]}><sphereGeometry args={[0.16 + p * 0.25, 12, 10]} /><meshStandardMaterial color="#d8d8e8" transparent opacity={0.28 * (1 - p)} /></mesh>;
    })}
  </group>
);

const CandyFloss: React.FC<{t: number; grow: number}> = ({t, grow}) => {
  const s = 1 + grow * 0.85;
  return (
    <group position={[0, -0.85, 0.55]}>
      <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.03, 0.03, 0.9, 8]} /><meshStandardMaterial color="#f2e6cf" /></mesh>
      <group position={[0, 0.95 + grow * 0.35, 0]} scale={[s, s, s]} rotation={[0, t * 0.6, 0]}>
        {Array.from({length: 22}, (_, k) => (
          <mesh key={k} position={[(rand(k) - 0.5) * 0.7, (rand(k + 40) - 0.5) * 0.55, (rand(k + 80) - 0.5) * 0.5]}>
            <sphereGeometry args={[0.22 + rand(k + 7) * 0.12, 14, 12]} /><meshStandardMaterial color={k % 3 ? '#ffb3d1' : '#ffc8de'} roughness={1} emissive="#ff6fae" emissiveIntensity={0.12} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const Tinsel: React.FC<{t: number; shine: number}> = ({t, shine}) => (
  <group position={[0, 0.3, 0.6]}>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 3.2, 8]} /><meshStandardMaterial color="#9a7a4a" /></mesh>
    {Array.from({length: 46}, (_, k) => {
      const x = -1.5 + (3 * k) / 45, len = 0.9 + rand(k) * 0.5;
      const sw = Math.sin(t * 2.2 + k * 0.5) * 0.08;
      return (
        <mesh key={k} position={[x, -len / 2, 0.02 * (k % 3)]} rotation={[0, k * 0.7 + t, sw]}>
          <boxGeometry args={[0.012, len, 0.05]} />
          <meshStandardMaterial color="#dfe6f2" metalness={1} roughness={0.15} emissive="#ffffff" emissiveIntensity={shine * (0.3 + 0.7 * Math.max(0, Math.sin(t * 9 + k * 2.1)))} />
        </mesh>
      );
    })}
  </group>
);

const Gingerbread: React.FC<{t: number; tag: number}> = ({t, tag}) => (
  <group position={[0, -0.8, 0.6]}>
    {[[-0.65, 0, 0], [0.65, 0, 0], [0, 0.05, 0.1], [0, 0.22, 0.05]].map(([x, y, z], k) => (
      <group key={k} position={[x, y, z]} rotation={[1.25, 0, 0.2 * k]}>
        <mesh><cylinderGeometry args={[0.55, 0.55, 0.16, 36]} /><meshStandardMaterial color="#7a3f1c" roughness={0.6} /></mesh>
        <mesh position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.42, 0.035, 8, 36]} /><meshStandardMaterial color="#fff7ee" /></mesh>
        {[0, 2.1, 4.2].map((a) => <mesh key={a} position={[Math.cos(a) * 0.18, 0.1, Math.sin(a) * 0.18]} scale={[0.1, 0.04, 0.06]} rotation={[0, a, 0]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#f1d9a8" /></mesh>)}
      </group>
    ))}
    {/* blue "der" flag stuck into the stack on "Merk dir das: der." */}
    {tag > 0 && (
      <group position={[0.2, 0.55 + (1 - tag) * 1.5, 0.3]} rotation={[0, 0, 0.12]}>
        <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.015, 0.015, 0.8, 6]} /><meshStandardMaterial color="#ddd" /></mesh>
        <mesh position={[0.28, 0.5, 0]}><boxGeometry args={[0.55, 0.3, 0.02]} /><meshBasicMaterial color={GENUS.der} /></mesh>
      </group>
    )}
  </group>
);

const Heart: React.FC<{t: number; flip: number; glow: number}> = ({t, flip, glow}) => {
  const geo = useHeartGeo();
  const plain = useIcing(false), kollegin = useIcing(true);
  const ry = flip * Math.PI * 2;
  const swing = Math.sin(t * 1.9) * 0.1;
  const showText = flip > 0.25;
  return (
    <group position={[0, 0.42, 1.05]} rotation={[0, 0, swing]}>
      {/* ribbon from the eave */}
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.22, -0.18, 0]} rotation={[0, 0, s * 0.45]}><boxGeometry args={[0.06, 0.45, 0.01]} /><meshBasicMaterial color="#b3162a" /></mesh>)}
      <group position={[0, -1.05, 0]} rotation={[0, ry, 0]}>
        <mesh geometry={geo} scale={[0.085, -0.085, 0.085]}>
          <meshStandardMaterial color="#8a4620" roughness={0.55} emissive="#ff8a3a" emissiveIntensity={glow * 0.25} />
        </mesh>
        <mesh position={[0, 0, 0.29]} scale={[1, 1, 1]}>
          <planeGeometry args={[1.9 * 1.02, 1.67 * 1.02]} />
          <meshBasicMaterial map={showText ? kollegin : plain} transparent alphaTest={0.05} color="#fff3e0" />
        </mesh>
      </group>
    </group>
  );
};

const Backdrop: React.FC<{camX: number; t: number}> = ({camX, t}) => (
  <group position={[-camX * 0.45, 0, -7]}>
    {Array.from({length: 18}, (_, k) => {
      const x = -6 + k * 2.6, h = 3 + rand(k) * 3, w = 2.2;
      return (
        <group key={k} position={[x, -2.6 + h / 2, -rand(k + 3) * 2]}>
          <mesh><boxGeometry args={[w, h, 1]} /><meshStandardMaterial color="#141b33" roughness={1} /></mesh>
          <mesh position={[0, h / 2 + 0.5, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[1.55, 1.55, 0.9]} /><meshStandardMaterial color="#10162b" /></mesh>
          {Array.from({length: 6}, (_, j) => (
            <mesh key={j} position={[-0.55 + (j % 2) * 1.1, h / 2 - 0.7 - Math.floor(j / 2) * 1.0, 0.51]}>
              <planeGeometry args={[0.36, 0.5]} /><meshBasicMaterial color={rand(k * 7 + j) > 0.45 ? '#ffc56a' : '#1d2440'} />
            </mesh>
          ))}
        </group>
      );
    })}
  </group>
);

const Snow: React.FC<{t: number; rewind: number}> = ({t, rewind}) => (
  <group>
    {Array.from({length: 150}, (_, k) => {
      const sp = 0.35 + rand(k + 3) * 0.5;
      const yy = 4.5 - (((rand(k) * 9 + t * sp) % 9 + 9) % 9);
      const xx = (rand(k + 11) - 0.5) * 7 + Math.sin(t * 0.8 + k) * 0.15 + rewind * (rand(k + 5) - 0.2) * 3;
      return <mesh key={k} position={[xx, yy, -2 + rand(k + 21) * 7]}><sphereGeometry args={[0.025 + rand(k + 2) * 0.03, 6, 6]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.85} /></mesh>;
    })}
  </group>
);

const Scene: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const cam = camAt(t);
  const rv = (i: number) => reveal(i);
  // stall lights: the heart stall is lit in the hook, goes dark on the rewind, comes back on its own reveal
  const lit = (i: number) => {
    const on = prog(t, rv(i), 0.45);
    if (i === 4) return Math.max(on, t < REW() + 0.4 ? 1 - prog(t, REW(), 0.4) : 0) ;
    return on;
  };
  const hop = rv(0);
  const grow = prog(t, at('s07', 1), 0.8); // grows on the reveal
  const shine = prog(t, rv(2), 0.4);
  const tag = spring({frame: Math.round((t - at('s11', 6)) * fps), fps, config: {damping: 12}}) * (t >= at('s11', 6) - 0.05 ? 1 : 0);
  const flip = prog(t, FLIP(), 1.0);
  const rewindBlur = t > REW() && t < REW() + 1.2 ? Math.sin(prog(t, REW(), 1.2) * Math.PI) : 0;
  return (
    <>
      <ambientLight intensity={0.35} color="#9fb0ff" />
      <directionalLight position={[-4, 6, 5]} intensity={0.7} color="#b8c6ff" />
      <Backdrop camX={cam.x} t={t} />
      <group position={[-cam.x, -cam.y, cam.z]}>
        {/* cobblestone ground with snow */}
        <mesh position={[2 * W, -2.62, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 12]} /><meshStandardMaterial color="#2a3048" roughness={0.9} /></mesh>
        {Array.from({length: 40}, (_, k) => (
          <mesh key={k} position={[-3 + k * 0.75, -2.6, 1.6 + rand(k) * 1.5]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.25 + rand(k + 1) * 0.4, 16]} /><meshStandardMaterial color="#dfe6f5" roughness={1} /></mesh>
        ))}
        {[0, 1, 2, 3, 4].map((i) => <Stall key={i} i={i} lit={lit(i)} t={t} />)}
        <group position={[0, 0, 0]}><Chestnuts t={t} hop={hop} /></group>
        <group position={[W, 0, 0]}><CandyFloss t={t} grow={grow} /></group>
        <group position={[2 * W, 0, 0]}><Tinsel t={t} shine={shine} /></group>
        <group position={[3 * W, 0, 0]}><Gingerbread t={t} tag={tag} /></group>
        <group position={[4 * W, 0, 0]}><Heart t={t} flip={flip} glow={lit(4)} /></group>
      </group>
      <Snow t={t} rewind={rewindBlur} />
    </>
  );
};

/* ---------- 2D HUD ---------- */
const Chip: React.FC<{a: Art; state: 'idle' | 'right' | 'gone' | 'wrong'; s: number; bait?: number}> = ({a, state, s, bait = 0}) => {
  const c = GENUS[a];
  const right = state === 'right';
  return (
    <div style={{position: 'relative', fontFamily: BLACK, fontSize: right ? 64 : 52, padding: '8px 26px', borderRadius: 22, letterSpacing: 2,
      color: right ? '#0b0f1e' : '#fff', background: right ? c : `rgba(12,16,34,${0.72 + bait * 0.2})`,
      border: `5px solid ${right ? '#fff' : bait > 0 ? GENUS.der : 'rgba(255,255,255,.35)'}`,
      opacity: state === 'gone' ? 0.18 : 1, transform: `scale(${right ? 1 + 0.25 * s : 1 + bait * 0.08})`,
      boxShadow: right ? `0 0 40px ${c}` : 'none'}}>
      {a.toUpperCase()}
      {state === 'wrong' && (
        <svg style={{position: 'absolute', inset: -14}} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M10 10 L90 90 M90 10 L10 90" stroke="#ff3b3b" strokeWidth={11} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

const Bulbs: React.FC<{t: number}> = ({t}) => {
  const loopPulse = t > at('s03', 0) && t < qStart(0) ? 0.5 + 0.5 * Math.sin(t * 12) : 0;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 4, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
      <svg style={{position: 'absolute', top: -10}} width={560} height={40}><path d="M0 8 Q280 46 560 8" stroke="#3b4566" strokeWidth={4} fill="none" /></svg>
      {ITEMS.map((it, i) => {
        const on = t >= reveal(i);
        const heart = i === 4;
        const col = on ? GENUS[it.art] : heart ? (loopPulse > 0 ? `rgba(255,90,90,${0.4 + loopPulse * 0.6})` : '#4a3a4a') : '#2c3350';
        return heart ? (
          <svg key={i} width={58} height={52} viewBox="-7 -1 24 21" style={{filter: on || loopPulse ? `drop-shadow(0 0 12px ${col})` : 'none', transform: `scale(${1 + loopPulse * 0.25})`}}>
            <path d="M5 5C5 5 4 0 0 0C-6 0 -6 7 -6 7C-6 11 -3 15.4 5 19C12 15.4 16 11 16 7C16 7 16 0 10 0C7 0 5 5 5 5Z" fill={col} stroke="#fff" strokeWidth={1.2} />
            {!on && <text x={5} y={12.5} fontSize={10} textAnchor="middle" fill="#fff" fontFamily="Arial Black">?</text>}
          </svg>
        ) : (
          <div key={i} style={{width: 34, height: 44, borderRadius: '50% 50% 45% 45%', background: col, border: '3px solid rgba(255,255,255,.5)', boxShadow: on ? `0 0 26px ${col}` : 'none'}} />
        );
      })}
    </div>
  );
};

const fit = (w: string, max = 132) => Math.min(max, Math.floor(940 / (w.length * 0.8)));

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const rew = REW(), q0 = qStart(0);
  const cur = ITEMS.reduce((acc, _, i) => (t >= qStart(i) - 0.1 ? i : acc), -1);
  const outro = line('s15').start;
  const rewindK = t > rew && t < rew + 1.2 ? Math.sin(prog(t, rew, 1.2) * Math.PI) : 0;
  const shake = t > NOT_DER() && t < NOT_DER() + 0.6 ? Math.sin((t - NOT_DER()) * 60) * 14 * (1 - (t - NOT_DER()) / 0.6) : 0;

  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #1b2550 0%, #0b1030 55%, #050817 100%)'}}>
      <Audio src={staticFile('laneE/mix.wav')} />
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 9], fov: 45}} gl={{antialias: true}}>
        <Scene t={t} fps={fps} />
      </ThreeCanvas>

      {/* soft top shade so the HUD always reads */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,8,23,.85) 0%, rgba(5,8,23,.55) 28%, rgba(5,8,23,0) 40%)'}} />

      <Bulbs t={t} />

      {/* HOOK: the trap word is on screen at frame 0 (thumbnail) */}
      {t < rew + 0.3 && (
        <div style={{position: 'absolute', top: SAFE.top + 80, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((rew + 0.3 - t) / 0.3)}}>
          <div style={{fontFamily: BLACK, fontSize: 124, lineHeight: 1, color: '#fff', textShadow: '0 8px 30px rgba(0,0,0,.6)'}}>LEBKUCHEN</div>
          <div style={{fontFamily: BLACK, fontSize: 150, lineHeight: 1.02, color: GOLD, textShadow: '0 8px 30px rgba(0,0,0,.6)'}}>HERZ</div>
          <div style={{display: 'flex', justifyContent: 'center', gap: 22, marginTop: 26}}>
            {(['der', 'die', 'das'] as Art[]).map((a, k) => (
              <div key={a} style={{transform: `scale(${1 + 0.08 * Math.max(0, Math.sin(t * 7 - k * 1.2))})`}}><Chip a={a} state="idle" s={0} /></div>
            ))}
            <div style={{fontFamily: BLACK, fontSize: 70, color: GOLD, transform: `rotate(${Math.sin(t * 5) * 10}deg)`}}>?</div>
          </div>
        </div>
      )}

      {/* REWIND: "Moment." */}
      {rewindK > 0 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: clamp(rewindK * 1.6)}}>
          <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 3px, transparent 3px 9px)'}} />
          <div style={{fontFamily: BLACK, fontSize: 210, color: '#fff', letterSpacing: -20, textShadow: `${-30 * rewindK}px 0 0 rgba(255,80,80,.6), ${30 * rewindK}px 0 0 rgba(80,160,255,.6)`}}>◀◀</div>
          <div style={{fontFamily: BLACK, fontSize: 92, color: '#fff', marginTop: -10}}>MOMENT…</div>
        </AbsoluteFill>
      )}

      {/* OPEN LOOP */}
      {t > at('s02', 1) - 0.1 && t < q0 + 0.1 && (
        <div style={{position: 'absolute', top: SAFE.top + 110, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((q0 + 0.1 - t) / 0.3)}}>
          <Spoken line={line('s02')} skip={1} size={66} font={BLACK} weight={400} />
          {t > at('s03', 0) - 0.1 && (
            <div style={{marginTop: 28, display: 'inline-block'}}>
              <Pop show={at('s03', 3) - 0.05}>
                <div style={{fontFamily: BLACK, fontSize: 76, color: '#0b0f1e', background: GOLD, padding: '10px 34px', borderRadius: 20, transform: 'rotate(-3deg)'}}>⚠{NB}FALLE{NB}AM{NB}ENDE</div>
              </Pop>
            </div>
          )}
        </div>
      )}

      {/* QUIZ ITEMS */}
      {cur >= 0 && t < outro + 30 && (() => {
        const it = ITEMS[cur], i = cur;
        const r = reveal(i), qa = line(it.q).end;
        const fade = i < 4 ? clamp((qStart(i + 1) - 0.1 - t) / 0.25) : 1;
        const revealed = t >= r;
        const s = spring({frame: Math.round((t - r) * fps), fps, config: {damping: 9, stiffness: 160}});
        const fuse = t > qa && t < r ? 1 - (t - qa) / (r - qa) : 0;
        const baitDer = i === 4 && t > qa && t < NOT_DER() ? 0.6 + 0.4 * Math.sin(t * 10) : 0;
        const wrongDer = i === 4 && t >= NOT_DER();
        const isHerz = i === 4;
        return (
          <div style={{position: 'absolute', top: SAFE.top + 74, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: fade, transform: `translateX(${shake}px)`}}>
            {isHerz ? (
              <Pop show={qWord(i) - 0.05}>
                <div style={{fontFamily: BLACK, lineHeight: 1, textShadow: '0 6px 24px rgba(0,0,0,.6)'}}>
                  <span style={{fontSize: 104, color: '#fff'}}>LEBKUCHEN</span><br />
                  <span style={{fontSize: 124, color: GOLD}}>HERZ</span>
                </div>
              </Pop>
            ) : (
              <Pop show={qWord(i) - 0.05}>
                <div style={{fontFamily: BLACK, fontSize: fit(it.noun), lineHeight: 1.05, color: '#fff', textShadow: '0 6px 24px rgba(0,0,0,.6)'}}>{it.noun.toUpperCase()}</div>
              </Pop>
            )}
            {t > qWord(i) - 0.1 && (
              <div style={{display: 'flex', justifyContent: 'center', gap: 22, marginTop: 20, height: 100, alignItems: 'center'}}>
                {(['der', 'die', 'das'] as Art[]).map((a) => (
                  <Chip key={a} a={a} s={s} bait={a === 'der' ? baitDer : 0}
                    state={a === 'der' && wrongDer && !revealed ? 'wrong' : revealed ? (a === it.art ? 'right' : a === 'der' && wrongDer ? 'wrong' : 'gone') : 'idle'} />
                ))}
              </div>
            )}
            {/* the burning fuse: guess now */}
            {fuse > 0 && (
              <div style={{position: 'relative', margin: '18px auto 0', width: 620, height: 14}}>
                <div style={{position: 'absolute', left: 0, top: 4, height: 6, width: `${fuse * 100}%`, background: '#c9a66b', borderRadius: 3}} />
                <div style={{position: 'absolute', left: `calc(${fuse * 100}% - 18px)`, top: -11, width: 36, height: 36, borderRadius: 18,
                  background: 'radial-gradient(circle, #fff 0%, #ffd36b 35%, rgba(255,120,40,.0) 70%)', transform: `scale(${1 + 0.3 * Math.sin(t * 40)})`}} />
              </div>
            )}
            {/* twist line: der Lebkuchen vs. das Lebkuchenherz */}
            {isHerz && revealed && (
              <Pop show={r + 0.35}>
                <div style={{marginTop: 18, fontFamily: SANS, fontSize: 46, fontWeight: 800, color: '#fff', background: 'rgba(8,12,30,.8)', padding: '10px 26px', borderRadius: 18}}>
                  <span style={{color: GENUS.der}}>der</span>{NB}Lebkuchen{NB}{NB}→{NB}{NB}<span style={{color: GENUS.das}}>das</span>{NB}Lebkuchen<span style={{color: GOLD}}>herz</span>
                </div>
              </Pop>
            )}
          </div>
        );
      })()}

      {/* example cards: start on the first shown word, leave quickly */}
      {ITEMS.map((it, i) => {
        const L = line(it.ex);
        const from = it.exText ? reveal(i) + 0.55 : at(it.ex, it.exSkip) - 0.25;
        const to = i < 4 ? qWord(i + 1) - 0.3 : line('s15').start + 0.1;
        return (
          <Card key={it.key} from={from} to={to} label={`${it.art} ${it.noun}`} accent={GENUS[it.art]}>
            {it.exText ? <div style={{fontFamily: SANS, fontSize: 46, fontWeight: 700, color: '#fff', lineHeight: 1.2}}>{it.exText}</div> : <Spoken line={L} skip={it.exSkip} size={it.key === 'herz' ? 46 : 52} />}
            <div style={{fontFamily: SANS, fontSize: 32, color: 'rgba(255,255,255,.6)', marginTop: 10, fontStyle: 'italic'}}>{it.en}</div>
          </Card>
        );
      })}

      {/* OUTRO: teaser + follow, the heart swings in the same frame as the hook */}
      {t > line('s15').start - 0.1 && (
        <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
          <div style={{background: 'rgba(8,12,30,.85)', borderRadius: 26, padding: '20px 30px', textAlign: 'center'}}>
            <Spoken line={line('s15')} size={48} />
          </div>
          {t > line('s16').start - 0.1 && <FollowCTA show={line('s16').start} accent={GOLD} />}
        </div>
      )}
    </AbsoluteFill>
  );
};
