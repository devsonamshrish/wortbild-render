/* quiz-weihnachtsmarkt-03 – "Der Glühwein. Aber Glühbier?"
   An article game at a Glühwein stall at night. Three hanging chalk boards (der / die / das) under a snowy awning,
   a string of lights that burns down as the countdown, and every round a new vessel on the counter that the ladle fills.
   The final round answers the hook question: the beer mug fills golden, the "der" board drops off, "das" wins.
   The last frame rhymes with the first: two mugs, "der Glühwein" over "___ Glühbier" → "das Glühbier". */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import T0 from '../data/laneI-timings.json';
import {makeTiming, Timings, Pop, FollowCTA, SAFE, GENUS, NB, rand, clamp, prog} from '../lib/kit';

const TM = makeTiming(T0 as unknown as Timings);
const {at, line, scene} = TM;
export const FRAMES = TM.frames();

const AMBER = '#ffb03b';
const WORDF = 'Cambria, Georgia, serif';
const UIF = '"Trebuchet MS", "Segoe UI", sans-serif';
type Art = 'der' | 'die' | 'das';

const R: {q: string; a: string; art: Art; w: string; en: string; ex: string; skip: number; label: string}[] = [
  {q: 's03', a: 's04', art: 'die', w: 'Tasse', en: 'mug, cup', ex: 'Die Tasse ist so heiß, dass ich sie kaum halten kann.', skip: 0, label: 'Runde 1'},
  {q: 's05', a: 's06', art: 'der', w: 'Becher', en: 'cup, beaker', ex: 'Manche Stände geben den Punsch im Becher statt in der Tasse.', skip: 2, label: 'Runde 2'},
  {q: 's07', a: 's08', art: 'die', w: 'Pfandmarke', en: 'deposit token', ex: 'Heb die Pfandmarke gut auf, sonst gibt es nichts zurück.', skip: 2, label: 'Runde 3 · schwerer'},
  {q: 's09', a: 's10', art: 'das', w: 'Glühbier', en: 'hot spiced beer', ex: 'Probier mal Glühbier – das gibt es nicht an jedem Stand.', skip: 2, label: 'Finale'},
];
const qs = (i: number) => line(R[i].q).start;
const gs = (i: number) => line(R[i].q).end; // guessing pause starts
const rv = (i: number) => at(R[i].a, 0); // reveal
const roundAt = (t: number) => { let k = -1; R.forEach((_, i) => { if (t >= qs(i) - 0.3) k = i; }); return t >= line('s11').start - 0.2 ? -1 : k; };

/* ---------------- textures ---------------- */
const useBoardTex = (art: Art) => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 288;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3a2416'; g.fillRect(0, 0, 512, 288);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${20 + rand(i) * 40},${10 + rand(i + 1) * 20},5,.5)`; g.lineWidth = 2 + rand(i + 2) * 3; g.beginPath(); const y = rand(i + 3) * 288; g.moveTo(0, y); g.bezierCurveTo(170, y + 10 * rand(i + 4), 340, y - 10, 512, y + 6); g.stroke(); }
  g.fillStyle = '#16181c'; g.fillRect(26, 26, 460, 236);
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.setLineDash([14, 10]); g.strokeRect(40, 40, 432, 208);
  g.font = 'bold 150px "Trebuchet MS"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = GENUS[art]; g.fillText(art.toUpperCase(), 256, 150);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}, [art]);

const useCoinTex = () => useMemo(() => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(220, 200, 40, 256, 256, 256); gr.addColorStop(0, '#ffe39a'); gr.addColorStop(1, '#b07a1c');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#7a4f0c'; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 220, 0, Math.PI * 2); g.stroke();
  g.translate(256, 256); g.rotate(-Math.PI / 2); g.translate(-256, -256);
  g.fillStyle = '#5a3606'; g.font = 'bold 92px "Trebuchet MS"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('PFAND', 256, 300);
  g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 26 : 62, a = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(256 + Math.cos(a) * r, 175 + Math.sin(a) * r); } g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}, []);

/* ---------------- 3D pieces ---------------- */
const Steam: React.FC<{y: number; t: number; seed: number; k?: number}> = ({y, t, seed, k = 1}) => (
  <group>
    {Array.from({length: 7}, (_, i) => {
      const ph = (t * 0.45 + i / 7 + rand(seed + i) * 0.1) % 1;
      return (
        <mesh key={i} position={[Math.sin(ph * 5 + i + seed) * 0.12, y + ph * 1.1, 0]} scale={0.12 + ph * 0.32}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial color="#f4ecff" transparent opacity={(1 - ph) * ph * 0.7 * k} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

const MUG_H = 1.15, MUG_R = 0.42;
/* mug: ceramic (red) or glass; liquid level 0..1, colour; foam for beer */
const Mug: React.FC<{x: number; z?: number; level: number; liquid: string; glass?: boolean; foam?: number; t: number; steam?: number; seed?: number; scale?: number; tilt?: number}> = ({x, z = 0, level, liquid, glass, foam = 0, t, steam = 0, seed = 0, scale = 1, tilt = 0}) => {
  const lv = clamp(level) * MUG_H * 0.86;
  return (
    <group position={[x, -0.56, z]} scale={scale} rotation={[0, 0, tilt]}>
      <mesh position={[0, MUG_H / 2, 0]}>
        <cylinderGeometry args={[MUG_R, MUG_R * 0.94, MUG_H, 40, 1, true]} />
        {glass
          ? <meshStandardMaterial color="#d8ecff" transparent opacity={0.28} roughness={0.05} metalness={0.1} side={THREE.DoubleSide} depthWrite={false} />
          : <meshStandardMaterial color="#9c1b26" roughness={0.35} metalness={0.05} side={THREE.DoubleSide} />}
      </mesh>
      {glass && [0, 1, 2, 3, 4, 5].map((k) => (
        <mesh key={k} position={[Math.sin(k * 1.05 + 0.5) * MUG_R * 1.01, MUG_H * 0.5, Math.cos(k * 1.05 + 0.5) * MUG_R * 1.01]}>
          <boxGeometry args={[0.03, MUG_H * 0.8, 0.03]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[MUG_R * 0.94, MUG_R * 0.94, 0.06, 40]} />
        <meshStandardMaterial color={glass ? '#bcd6ee' : '#7a121b'} transparent={glass} opacity={glass ? 0.5 : 1} />
      </mesh>
      {!glass && (
        <mesh position={[0, MUG_H - 0.03, 0]}>
          <torusGeometry args={[MUG_R, 0.035, 10, 40]} />
          <meshStandardMaterial color="#f3e6d0" roughness={0.4} />
        </mesh>
      )}
      <mesh position={[MUG_R - 0.02, MUG_H * 0.52, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.24, 0.06, 12, 24, Math.PI]} />
        {glass ? <meshStandardMaterial color="#d8ecff" transparent opacity={0.45} /> : <meshStandardMaterial color="#9c1b26" roughness={0.35} />}
      </mesh>
      {lv > 0.01 && (
        <mesh position={[0, 0.06 + lv / 2, 0]}>
          <cylinderGeometry args={[MUG_R * 0.93, MUG_R * 0.9, lv, 36]} />
          <meshStandardMaterial color={liquid} roughness={0.15} emissive={liquid} emissiveIntensity={glass ? 0.35 : 0.15} />
        </mesh>
      )}
      {foam > 0.01 && (
        <mesh position={[0, 0.06 + lv + 0.02, 0]} scale={[1, 0.35 + foam * 0.5, 1]}>
          <sphereGeometry args={[MUG_R * 0.98, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#fff4de" roughness={0.9} />
        </mesh>
      )}
      {steam > 0.01 && <Steam y={MUG_H + 0.05} t={t} seed={seed} k={steam} />}
    </group>
  );
};

/* paper cup (der Becher): tapered, white with a red band */
const Cup: React.FC<{x: number; level: number; t: number; steam: number}> = ({x, level, t, steam}) => {
  const H = 1.1, lv = clamp(level) * H * 0.85;
  return (
    <group position={[x, -0.56, 0]}>
      <mesh position={[0, H / 2, 0]}>
        <cylinderGeometry args={[0.44, 0.32, H, 40, 1, true]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, H * 0.55, 0]}>
        <cylinderGeometry args={[0.415, 0.375, 0.28, 40, 1, true]} />
        <meshStandardMaterial color="#c8202f" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} position={[Math.sin(k * 1.256) * 0.41, H * 0.55, Math.cos(k * 1.256) * 0.41]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#fff6d0" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {lv > 0.01 && (
        <mesh position={[0, 0.03 + lv / 2, 0]}>
          <cylinderGeometry args={[0.32 + (lv / H) * 0.11, 0.31, lv, 36]} />
          <meshStandardMaterial color="#d9661f" emissive="#d9661f" emissiveIntensity={0.2} roughness={0.2} />
        </mesh>
      )}
      {steam > 0.01 && <Steam y={H + 0.05} t={t} seed={7} k={steam} />}
    </group>
  );
};

/* die Pfandmarke: a brass token that drops, spins on its edge during the countdown and stops face-on at the reveal */
const Coin: React.FC<{x: number; t: number; t0: number; rev: number; fps: number}> = ({x, t, t0, rev, fps}) => {
  const tex = useCoinTex();
  const drop = spring({frame: Math.round((t - t0) * fps), fps, config: {damping: 9, stiffness: 120}});
  const spinT = Math.min(t, rev) - t0;
  const aRev = (rev - t0) * (9 + (rev - t0) * 3), target = Math.ceil(aRev / (Math.PI * 2) + 0.25) * Math.PI * 2;
  const angle = t < rev ? spinT * (9 + spinT * 3) : aRev + (target - aRev) * spring({frame: Math.round((t - rev) * fps), fps, config: {damping: 12, stiffness: 90}});
  const glow = t > rev ? 0.6 * Math.exp(-(t - rev) * 1.2) + 0.12 : 0.05;
  return (
    <group position={[x, -0.56 + 0.55 + (1 - drop) * 3.5, 0]} rotation={[0, angle, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.08, 48]} />
        <meshStandardMaterial attach="material-0" color="#a8741c" metalness={0.8} roughness={0.3} />
        <meshStandardMaterial attach="material-1" map={tex} metalness={0.5} roughness={0.35} emissive="#ffcf6a" emissiveIntensity={glow} />
        <meshStandardMaterial attach="material-2" map={tex} metalness={0.5} roughness={0.35} emissive="#ffcf6a" emissiveIntensity={glow} />
      </mesh>
    </group>
  );
};

/* a hanging chalk board; hinge at the beam */
const Board: React.FC<{art: Art; x: number; drop: number; swing: number; glow: number; dim: number; fall: number}> = ({art, x, drop, swing, glow, dim, fall}) => {
  const tex = useBoardTex(art);
  return (
    <group position={[x + fall * 0.4, 2.04 + (1 - drop) * 2.5 - fall * fall * 6, 0.15]} rotation={[swing, 0, fall * 1.4]}>
      {[-0.32, 0.32].map((dx) => (
        <mesh key={dx} position={[dx, -0.14, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
          <meshStandardMaterial color="#c9b48a" />
        </mesh>
      ))}
      <mesh position={[0, -0.52, 0]}>
        <boxGeometry args={[0.98, 0.55, 0.06]} />
        <meshStandardMaterial attach="material-0" color="#3a2416" />
        <meshStandardMaterial attach="material-1" color="#3a2416" />
        <meshStandardMaterial attach="material-2" color="#3a2416" />
        <meshStandardMaterial attach="material-3" color="#3a2416" />
        <meshStandardMaterial attach="material-4" map={tex} color={new THREE.Color('#ffffff').multiplyScalar(1 - dim * 0.6)} emissive={GENUS[art]} emissiveIntensity={glow * 0.55} />
        <meshStandardMaterial attach="material-5" color="#3a2416" />
      </mesh>
    </group>
  );
};

const Stall: React.FC<{t: number; bulbs: (i: number) => [string, number]}> = ({t, bulbs}) => (
  <group>
    {/* counter */}
    <mesh position={[0, -1.4, 0.1]}>
      <boxGeometry args={[4.4, 1.7, 1.3]} />
      <meshStandardMaterial color="#5b3820" roughness={0.85} />
    </mesh>
    {Array.from({length: 7}, (_, i) => (
      <mesh key={i} position={[-2.1 + i * 0.7, -1.4, 0.76]}>
        <boxGeometry args={[0.025, 1.7, 0.02]} />
        <meshStandardMaterial color="#2c1a0e" />
      </mesh>
    ))}
    <mesh position={[0, -0.6, 0.1]}>
      <boxGeometry args={[4.6, 0.09, 1.4]} />
      <meshStandardMaterial color="#8a5a33" roughness={0.6} />
    </mesh>
    {/* fir garland with berries along the counter edge */}
    {Array.from({length: 26}, (_, i) => {
      const x = -2.25 + i * 0.18, y = -0.72 - Math.abs(Math.sin(i * 0.6)) * 0.08;
      return (
        <group key={i}>
          <mesh position={[x, y, 0.82]} rotation={[0, 0, rand(i) * 3]}>
            <coneGeometry args={[0.13, 0.26, 7]} />
            <meshStandardMaterial color="#1f4d2b" roughness={0.9} />
          </mesh>
          {i % 3 === 0 && (
            <mesh position={[x + 0.05, y - 0.05, 0.92]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color="#d11f2f" emissive="#7a0010" emissiveIntensity={0.4} />
            </mesh>
          )}
        </group>
      );
    })}
    {/* posts, beam, snow cap, roof */}
    {[-1.78, 1.78].map((x) => (
      <mesh key={x} position={[x, 0.8, 0.2]}>
        <boxGeometry args={[0.2, 2.9, 0.2]} />
        <meshStandardMaterial color="#4a2e1a" roughness={0.8} />
      </mesh>
    ))}
    <mesh position={[0, 2.18, 0.2]}>
      <boxGeometry args={[4.2, 0.26, 0.3]} />
      <meshStandardMaterial color="#4a2e1a" roughness={0.8} />
    </mesh>
    {[-1, 1].map((s) => (
      <group key={s}>
        <mesh position={[s * 1.12, 2.85, -0.05]} rotation={[0, 0, -s * 0.5]}>
          <boxGeometry args={[2.65, 0.16, 0.9]} />
          <meshStandardMaterial color="#3b2414" roughness={0.9} />
        </mesh>
        <mesh position={[s * 1.12 - s * 0.02, 2.96, 0.02]} rotation={[0, 0, -s * 0.5]}>
          <boxGeometry args={[2.7, 0.12, 0.95]} />
          <meshStandardMaterial color="#eef3ff" roughness={1} emissive="#9fb4ff" emissiveIntensity={0.08} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 2.36, 0.24]}>
      <boxGeometry args={[4.3, 0.12, 0.34]} />
      <meshStandardMaterial color="#eef3ff" roughness={1} />
    </mesh>
    {/* string of lights: the countdown */}
    {Array.from({length: 13}, (_, i) => {
      const x = -1.68 + i * 0.28, y = 2.0 - Math.sin((i / 12) * Math.PI) * 0.1;
      const [col, k] = bulbs(i);
      return (
        <group key={i} position={[x, y, 0.4]}>
          <mesh>
            <sphereGeometry args={[0.065, 12, 10]} />
            <meshStandardMaterial color={k > 0.2 ? col : '#3a3328'} emissive={col} emissiveIntensity={k * 2.2} />
          </mesh>
          {k > 0.2 && (
            <mesh>
              <sphereGeometry args={[0.16, 12, 10]} />
              <meshBasicMaterial color={col} transparent opacity={0.18 * k} depthWrite={false} />
            </mesh>
          )}
        </group>
      );
    })}
    {/* copper Glühwein pot at the left, stack of mugs at the right */}
    <mesh position={[-1.62, -0.18, -0.25]}>
      <cylinderGeometry args={[0.55, 0.5, 0.78, 40]} />
      <meshStandardMaterial color="#b8693a" metalness={0.75} roughness={0.3} />
    </mesh>
    <mesh position={[-1.62, 0.2, -0.25]}>
      <cylinderGeometry args={[0.5, 0.5, 0.02, 40]} />
      <meshStandardMaterial color="#5c0d18" emissive="#5c0d18" emissiveIntensity={0.3} />
    </mesh>
    <group position={[-1.62, 0, -0.25]}><Steam y={0.25} t={t} seed={30} k={1.2} /></group>
  </group>
);

/* ladle: rests in the pot, swings over the vessel and pours at each reveal */
const Ladle: React.FC<{t: number; pours: {t0: number; col: string}[]}> = ({t, pours}) => {
  const p = pours.find((q) => t > q.t0 - 0.6 && t < q.t0 + 1.4);
  const k = p ? prog(t, p.t0 - 0.6, 0.45) * (1 - prog(t, p.t0 + 0.95, 0.45)) : 0;
  const tilt = p ? prog(t, p.t0 - 0.15, 0.25) * (1 - prog(t, p.t0 + 0.8, 0.25)) : 0;
  const x = -1.62 + k * 1.45, y = 0.45 + k * 0.8;
  return (
    <group>
      <group position={[x, y, 0.05]} rotation={[0, 0, -0.5 * k - tilt * 1.1]}>
        <mesh rotation={[0, 0, 0]}>
          <sphereGeometry args={[0.2, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#cfd5dc" metalness={0.9} roughness={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.55, 0.32, 0]} rotation={[0, 0, 1.0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.25, 8]} />
          <meshStandardMaterial color="#cfd5dc" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
      {p && tilt > 0.5 && (
        <mesh position={[x + 0.22, (y + 0.1) / 2 - 0.05, 0.05]}>
          <cylinderGeometry args={[0.04, 0.05, Math.max(0.1, y - 0.1), 10]} />
          <meshStandardMaterial color={p.col} emissive={p.col} emissiveIntensity={0.4} transparent opacity={0.92} />
        </mesh>
      )}
    </group>
  );
};

const Snow: React.FC<{t: number}> = ({t}) => (
  <group>
    {Array.from({length: 110}, (_, i) => {
      const sp = 0.25 + rand(i + 4) * 0.35, H = 7.5;
      const y = 4 - (((rand(i + 1) * H + t * sp) % H));
      return (
        <mesh key={i} position={[(rand(i) - 0.5) * 5 + Math.sin(t * 0.8 + i) * 0.08, y, -2.5 + rand(i + 2) * 5.2]}>
          <sphereGeometry args={[0.018 + rand(i + 3) * 0.02, 6, 5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
      );
    })}
  </group>
);

/* ---------------- the world ---------------- */
const World: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const s02 = line('s02'), s11 = line('s11');
  const slide = (t0: number, from: number, to: number, d = 0.55) => from + (to - from) * prog(t, t0, d);
  const fill = (i: number) => prog(t, rv(i), 0.9);
  const sp = (t0: number) => spring({frame: Math.round((t - t0) * fps), fps, config: {damping: 13, stiffness: 110}});

  /* board states */
  const k = roundAt(t);
  const hookDrop = (n: number) => sp(at('s01', 3) + 0.25 + n * 0.22);
  const finale = 3;
  const derFall = t > rv(finale) && t < at('s11', 0) - 0.3 ? clamp((t - rv(finale)) / 1.2) : 0;
  const derBack = t >= at('s11', 0) - 0.3 ? sp(at('s11', 0) - 0.3) : 1;
  const boards: Art[] = ['der', 'die', 'das'];
  const boardState = (art: Art, idx: number) => {
    let glow = 0, dim = 0, swing = Math.sin(t * 1.3 + idx * 1.7) * 0.05;
    if (k >= 0) {
      const r = R[k], rev = rv(k);
      if (t > rev) {
        const hit = r.art === art;
        const e = Math.exp(-(t - rev) * 1.6);
        glow = hit ? 0.55 + 0.45 * e : 0; dim = hit ? 0 : 0.7 * prog(t, rev, 0.3);
        if (hit) swing += Math.sin((t - rev) * 9) * 0.45 * e;
      } else if (k === finale && art === 'der' && t > gs(k) + 0.25) {
        glow = 0.5 * prog(t, gs(k) + 0.25, 0.5); // the fake-out: "der", like der Glühwein?
        swing += Math.sin(t * 7) * 0.08;
      }
    }
    if (t >= s11.start - 0.2) { glow = art === 'die' ? 0 : 0.8; dim = art === 'die' ? 0.7 : 0; }
    const drop = Math.min(hookDrop(idx), art === 'der' ? (derFall > 0 ? 1 : derBack) : 1);
    return {glow, dim, swing, drop, fall: art === 'der' ? derFall : 0};
  };

  /* countdown bulbs */
  const bulbs = (i: number): [string, number] => {
    const warm = '#ffc46b';
    if (k < 0) return [warm, 0.85 + 0.15 * Math.sin(t * 3 + i)];
    const g0 = gs(k), rev = rv(k);
    if (t > g0 && t < rev) { const p = (t - g0) / (rev - g0); return [warm, (12 - i) / 13 >= p ? 1 : 0.05]; }
    if (t >= rev && t < rev + 0.9) return [GENUS[R[k].art], 1.2];
    return [warm, 0.85 + 0.15 * Math.sin(t * 3 + i)];
  };

  /* reveal punch + slow drift */
  const punch = k >= 0 && t > rv(k) ? Math.sin(Math.min(1, (t - rv(k)) / 0.35) * Math.PI) * 0.025 : 0;
  const sc = 1 + punch + Math.min(t, 45) * 0.0012;

  /* vessels */
  const wineX = t < s11.start - 0.2 ? slide(at('s02', 5), -0.85, -4.2) : slide(s11.start - 0.2, -4.2, -0.85);
  const beerHookX = slide(at('s02', 4) - 0.1, 0.85, 4.2);
  const tasseX = slide(qs(0) - 0.35, 4, 0) + slide(qs(1) - 0.45, 0, -4.4) - 0;
  const cupX = slide(qs(1) - 0.35, 4, 0) + slide(qs(2) - 0.45, 0, -4.4);
  const coinX = slide(qs(3) - 0.5, 0, -4.4);
  const beerX = t < s11.start - 0.2 ? slide(qs(3) - 0.35, 4, 0) : slide(s11.start - 0.2, 0, 0.85);

  return (
    <group position={[0, -0.6, 0]} rotation={[0.13, Math.sin(t * 0.3) * 0.05, 0]} scale={sc}>
      <Stall t={t} bulbs={bulbs} />
      {boards.map((a, i) => { const s = boardState(a, i); return <Board key={a} art={a} x={(i - 1) * 1.12} {...s} />; })}
      {/* hook pair (and payoff pair) */}
      {wineX > -4 && <Mug x={wineX} level={0.85} liquid="#6e0f1d" t={t} steam={1} seed={1} />}
      {beerHookX < 4 && <Mug x={beerHookX} level={0.78} liquid="#e2a22a" glass foam={1} t={t} steam={0.8} seed={2} />}
      {/* rounds */}
      {tasseX > -4.3 && tasseX < 3.9 && <Mug x={tasseX} level={fill(0)} liquid="#6e0f1d" t={t} steam={fill(0)} seed={3} />}
      {cupX > -4.3 && cupX < 3.9 && <Cup x={cupX} level={fill(1)} t={t} steam={fill(1)} />}
      {t > qs(2) - 0.4 && coinX > -4.3 && <Coin x={coinX} t={t} t0={qs(2) - 0.3} rev={rv(2)} fps={fps} />}
      {beerX < 3.9 && <Mug x={beerX} level={fill(3) * 0.78} liquid="#e2a22a" glass foam={prog(t, rv(3) + 0.4, 0.8)} t={t} steam={fill(3) * 0.8} seed={4} />}
      <Ladle t={t} pours={[{t0: rv(0), col: '#7a1222'}, {t0: rv(1), col: '#e07020'}, {t0: rv(3), col: '#e8a92c'}]} />
      <Snow t={t} />
    </group>
  );
};

/* ---------------- overlays ---------------- */
const shadow = '0 4px 0 rgba(0,0,0,.35), 0 8px 40px rgba(0,0,0,.85)';
const ArtTag: React.FC<{art: Art; show: number}> = ({art, show}) => (
  <Pop show={show}><span style={{color: GENUS[art]}}>{art}</span></Pop>
);

/* hook title = payoff title (the loop): der Glühwein / ___ Glühbier → das Glühbier */
const PairTitle: React.FC<{t: number; solved: number | null}> = ({t, solved}) => {
  const pulse = 1 + Math.sin(t * 5) * 0.025;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 6, left: SAFE.side, right: SAFE.side, textAlign: 'center', textShadow: shadow}}>
      <div style={{fontFamily: WORDF, fontWeight: 700, fontSize: 78, color: '#fff'}}><span style={{color: GENUS.der}}>der</span>{NB}Glühwein</div>
      <div style={{fontFamily: WORDF, fontWeight: 700, fontSize: 150, color: AMBER, lineHeight: 1.05, transform: `scale(${solved === null ? pulse : 1})`}}>
        {solved === null ? <span style={{display: 'inline-block', color: '#fff', border: '6px dashed rgba(255,255,255,.85)', borderRadius: 18, padding: '0 22px', lineHeight: 1.0, fontSize: 120}}>?</span> : <ArtTag art="das" show={solved} />}{NB}Glühbier{solved === null ? '?' : ''}
      </div>
    </div>
  );
};

const Tokens: React.FC<{t: number}> = ({t}) => {
  const show = at('s02', 6) - 0.1;
  if (t < show || t > line('s11').start - 0.2) return null;
  const k = roundAt(t);
  return (
    <div style={{position: 'absolute', top: SAFE.top - 2, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18, alignItems: 'center'}}>
      {R.map((r, i) => {
        const done = t > rv(i), cur = i === k;
        return (
          <Pop key={i} show={show + i * 0.1}>
            <div style={{width: i === 3 ? 150 : 110, height: 54, borderRadius: 27, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: UIF, fontWeight: 700, fontSize: 30, letterSpacing: 1,
              background: done ? GENUS[r.art] : cur ? 'rgba(255,176,59,.25)' : 'rgba(12,16,34,.7)',
              color: done ? '#0b1020' : '#fff', border: `3px solid ${done ? GENUS[r.art] : cur ? AMBER : 'rgba(255,255,255,.35)'}`}}>
              {done ? r.art : i === 3 ? 'FINALE' : `${i + 1}`}
            </div>
          </Pop>
        );
      })}
    </div>
  );
};

const RoundTitle: React.FC<{t: number}> = ({t}) => {
  const k = roundAt(t);
  if (k < 0) return null;
  const r = R[k], rev = rv(k), wordAt = at(r.q, 99) - 0.08;
  const paused = t > gs(k) && t < rev;
  const p = paused ? (t - gs(k)) / (rev - gs(k)) : t >= rev ? 1 : 0;
  const tick = paused ? 1 + Math.max(0, Math.sin(p * Math.PI * 6)) * 0.04 : 1;
  return (
    <div style={{position: 'absolute', top: SAFE.top + 74, left: SAFE.side, right: SAFE.side, textAlign: 'center', textShadow: shadow}}>
      <Pop show={qs(k) - 0.05}><div style={{fontFamily: UIF, fontWeight: 700, fontSize: 38, letterSpacing: 8, textTransform: 'uppercase', color: AMBER}}>{r.label}</div></Pop>
      <div style={{fontFamily: WORDF, fontWeight: 700, fontSize: r.w.length > 8 ? 118 : 136, color: '#fff', lineHeight: 1.08, transform: `scale(${tick})`}}>
        {t < rev ? <Pop show={wordAt}><span style={{color: 'rgba(255,255,255,.55)'}}>___</span></Pop> : <ArtTag art={r.art} show={rev - 0.05} />}{NB}<Pop show={wordAt}>{r.w}</Pop>
      </div>
      {/* timer bar */}
      <div style={{margin: '14px auto 0', width: 520, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.15)', opacity: t > gs(k) - 0.1 ? 1 : 0}}>
        <div style={{width: `${(1 - p) * 100}%`, height: '100%', borderRadius: 7, background: t >= rev ? GENUS[r.art] : AMBER}} />
      </div>
      {k === 3 && t > at('s10', 0) + 0.35 && t < line('s10').end + 0.3 && (
        <Pop show={at('s10', 0) + 0.4}>
          <div style={{marginTop: 18, fontFamily: UIF, fontWeight: 800, fontSize: 64, color: '#fff', background: 'rgba(160,20,30,.85)', borderRadius: 20, padding: '6px 28px', transform: 'rotate(-3deg)'}}>
            Nicht{NB}<span style={{textDecoration: 'line-through', textDecorationThickness: 8, color: GENUS.der}}>der</span>!
          </div>
        </Pop>
      )}
    </div>
  );
};

/* page sentence, word by word as spoken; the target word in amber */
const Sentence: React.FC<{id: string; text: string; skip: number; hl: string}> = ({id, text, skip, hl}) => {
  const L = line(id);
  let n = skip;
  return (
    <div style={{fontFamily: UIF, fontSize: 50, fontWeight: 700, lineHeight: 1.22, color: '#fff'}}>
      {text.split(' ').map((tok, i, all) => {
        const idx = tok === '–' ? n : n++;
        const s = L.words[Math.min(idx, L.words.length - 1)].s - 0.05;
        return <React.Fragment key={i}><Pop show={s} style={{color: tok.startsWith(hl) ? AMBER : '#fff'}}>{tok}</Pop>{i < all.length - 1 ? ' ' : ''}</React.Fragment>;
      })}
    </div>
  );
};

const ExCard: React.FC<{t: number; i: number}> = ({t, i}) => {
  const r = R[i], from = at(r.a, r.skip) - 0.25, to = Math.min(line(r.a).end + 0.35, i < 3 ? qs(i + 1) - 0.05 : line('s11').start);
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  if (t < from - 0.2 || t > to) return null;
  const s = spring({frame: f - Math.round(from * fps), fps, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 10, transform: `translateY(${(1 - s) * 120}px)`, opacity: s * clamp((to - t) / 0.25),
      background: 'rgba(14,12,24,.9)', borderRadius: 30, padding: '26px 34px', border: `3px solid ${AMBER}`, boxShadow: '0 10px 50px rgba(0,0,0,.6)'}}>
      <Sentence id={r.a} text={r.ex} skip={r.skip} hl={r.w} />
      <div style={{marginTop: 10, fontFamily: UIF, fontSize: 32, fontStyle: 'italic', color: 'rgba(255,255,255,.7)'}}>
        <span style={{color: GENUS[r.art], fontStyle: 'normal', fontWeight: 700}}>{r.art}</span>{NB}{r.w} = {r.en}
      </div>
    </div>
  );
};

export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps, width, height} = useVideoConfig(), t = f / fps;
  const s02 = line('s02'), s11 = line('s11'), outro = scene('outro').start;
  const hookTitle = t < s02.start - 0.05;
  const payoff = t >= s11.start - 0.1;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 45%, #1c2d5c 0%, #0c1430 55%, #050815 100%)'}}>
      <Audio src={staticFile('laneI/mix.wav')} />
      {/* distant market bokeh */}
      <AbsoluteFill>
        {Array.from({length: 26}, (_, i) => {
          const x = rand(i + 50) * 1080, y = 520 + rand(i + 60) * 760, r = 30 + rand(i + 70) * 70;
          const col = i % 5 === 0 ? '#ff6b5a' : i % 3 === 0 ? '#ffe7a8' : '#ffb347';
          return <div key={i} style={{position: 'absolute', left: x - r + Math.sin(t * 0.2 + i) * 14, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
            background: col, opacity: 0.16 + 0.08 * Math.sin(t * 1.5 + i * 2), filter: 'blur(14px)'}} />;
        })}
      </AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.6, 9], fov: 40}} gl={{antialias: true}}>
        <ambientLight intensity={0.5} color="#b8c4ff" />
        <directionalLight position={[-3, 6, 5]} intensity={0.9} color="#c9d6ff" />
        <pointLight position={[0, 1.6, 2.2]} intensity={14} distance={8} color="#ffbf6a" />
        <pointLight position={[-1.6, 0.6, 1.5]} intensity={5} distance={5} color="#ff8a3a" />
        <World t={t} fps={fps} />
      </ThreeCanvas>

      {/* titles */}
      {hookTitle && <PairTitle t={t} solved={null} />}
      {!hookTitle && t < qs(0) - 0.3 && (
        <div style={{position: 'absolute', top: SAFE.top + 80, left: SAFE.side, right: SAFE.side, textAlign: 'center', textShadow: shadow, fontFamily: WORDF, fontWeight: 700, color: '#fff'}}>
          <div style={{fontSize: 92}}><Pop show={at('s02', 1) - 0.05}>Die{NB}Antwort?</Pop></div>
          <div style={{fontSize: 92, color: AMBER}}><Pop show={at('s02', 3) - 0.05}>Am{NB}Ende.</Pop></div>
        </div>
      )}
      <Tokens t={t} />
      <RoundTitle t={t} />
      {payoff && <PairTitle t={t} solved={at('s11', 3) - 0.05} />}

      {R.map((_, i) => <ExCard key={i} t={t} i={i} />)}

      {/* teaser, then the follow CTA */}
      {t > at('s11', 5) - 0.2 && t < outro - 0.1 && (
        <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, bottom: SAFE.bottom + 30, textAlign: 'center'}}>
          <Pop show={at('s11', 5) - 0.2}>
            <div style={{fontFamily: UIF, fontWeight: 700, fontSize: 48, color: '#0b1020', background: AMBER, borderRadius: 26, padding: '20px 34px'}}>
              Morgen:{NB}mehr{NB}vom{NB}Weihnachtsmarkt
            </div>
          </Pop>
        </div>
      )}
      {t > outro - 0.2 && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: SAFE.bottom + 40, display: 'flex', justifyContent: 'center'}}>
          <FollowCTA show={at('s12', 0) - 0.1} accent={AMBER} />
        </div>
      )}
    </AbsoluteFill>
  );
};
