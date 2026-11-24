/* "Redewendungen bildlich: Streit" – three idioms acted out literally in 3D:
   a crooked house-blessing sign, a plucked chicken, a plank broken off a fence. */
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {makeTiming, Spoken, Card, FollowCTA, Pop, SAFE, SERIF, SANS, clamp, prog, rand} from '../lib/kit';
import timings from '../data/redewendungen2-timings.json';

const {TIM, line, at, scene, frames} = makeTiming(timings as any);
export const FRAMES = frames();
const ACC = '#ffc247';
const BG: Record<string, string> = {hook: '#171426', haus: '#2e1b3d', huhn: '#16393f', zaun: '#3e2416', outro: '#171426'};
const SCENES = ['haus', 'huhn', 'zaun'] as const;
const PICLINE: Record<string, [string, string, string]> = {haus: ['s02', 's03', 's04'], huhn: ['s05', 's06', 's07'], zaun: ['s08', 's09', 's10']};

/* ---------- 3D building blocks ---------- */
const Bar: React.FC<{a: [number, number]; b: [number, number]; w?: number; color: string}> = ({a, b, w = 0.04, color}) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  return <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]} rotation={[0, 0, Math.atan2(dy, dx) - Math.PI / 2]}><boxGeometry args={[w, L, w]} /><meshStandardMaterial color={color} metalness={0.6} roughness={0.4} /></mesh>;
};
const heartShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5); s.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.3); s.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5);
  return s;
};
const HEART = heartShape();
const Heart: React.FC<{s?: number}> = ({s = 0.5}) => (
  <mesh scale={s}><extrudeGeometry args={[HEART, {depth: 0.15, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2}]} /><meshStandardMaterial color="#e0475b" roughness={0.4} /></mesh>
);

const Person: React.FC<{armL: number; armR?: number; color?: string; bob?: number}> = ({armL, armR = 0.15, color = '#5aa9ff', bob = 0}) => (
  <group position={[0, bob, 0]}>
    <mesh position={[0, -0.3, 0]}><coneGeometry args={[0.38, 1.1, 24]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
    <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.27, 24, 24]} /><meshStandardMaterial color="#f2c9a0" roughness={0.6} /></mesh>
    {[-0.09, 0.09].map((x) => <mesh key={x} position={[x, 0.54, 0.24]}><sphereGeometry args={[0.04, 10, 10]} /><meshStandardMaterial color="#222" /></mesh>)}
    <group position={[0, 0.2, 0]} rotation={[0, 0, armL]}>
      <mesh position={[0, -0.35, 0]}><capsuleGeometry args={[0.07, 0.6, 8, 12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, -0.75, 0]}><sphereGeometry args={[0.1, 14, 14]} /><meshStandardMaterial color="#f2c9a0" /></mesh>
    </group>
    <group position={[0, 0.2, 0]} rotation={[0, 0, armR]}>
      <mesh position={[0, -0.35, 0]}><capsuleGeometry args={[0.07, 0.6, 8, 12]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  </group>
);

const Chicken: React.FC<{plucked: number; flap: number}> = ({plucked, flap}) => {
  const body = new THREE.Color('#fbf6ea').lerp(new THREE.Color('#f0a8a0'), plucked);
  return (
    <group rotation={[0, 0, flap]}>
      <mesh scale={[1, 0.8, 0.75]}><sphereGeometry args={[0.75, 28, 28]} /><meshStandardMaterial color={body} roughness={0.8} /></mesh>
      <mesh position={[0.55, 0.62, 0]}><sphereGeometry args={[0.3, 24, 24]} /><meshStandardMaterial color={body} roughness={0.8} /></mesh>
      <mesh position={[0.86, 0.6, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.1, 0.25, 16]} /><meshStandardMaterial color="#ffa628" /></mesh>
      <mesh position={[0.55, 0.95, 0]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color="#e0262f" /></mesh>
      <mesh position={[0.62, 0.7, 0.24]}><sphereGeometry args={[0.045, 10, 10]} /><meshStandardMaterial color="#111" /></mesh>
      {[-0.2, 0.2].map((x) => <Bar key={x} a={[x, -0.55]} b={[x, -0.95]} w={0.06} color="#ffa628" />)}
    </group>
  );
};

/* a feather: flat ellipsoid flying out on a ballistic arc */
const Feather: React.FC<{i: number; t0: number; t: number}> = ({i, t0, t}) => {
  const d = t - t0;
  if (d < 0 || d > 2.2) return null;
  const vx = -0.8 - rand(i + 1) * 1.8, vy = 1.4 + rand(i + 9) * 1.6, vz = (rand(i + 5) - 0.3) * 1.5;
  return (
    <mesh position={[-0.5 + vx * d, 0.2 + vy * d - 1.3 * d * d, 0.4 + vz * d]} rotation={[d * 3 + i, d * 4, d * 2.5 + i]} scale={[0.34, 0.07, 0.12]}>
      <sphereGeometry args={[0.5, 12, 8]} /><meshStandardMaterial color={i % 3 === 0 ? '#ffe9c2' : '#ffffff'} transparent opacity={clamp((2.2 - d) / 0.5)} />
    </mesh>
  );
};

const Plank: React.FC<{h?: number; tilt?: number}> = ({h = 1.7, tilt = 0}) => (
  <group rotation={[0, 0, tilt]}>
    <mesh><boxGeometry args={[0.5, h, 0.14]} /><meshStandardMaterial color="#c58a50" roughness={0.9} /></mesh>
    <mesh position={[0, h / 2 + 0.07, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.35, 0.35, 0.14]} /><meshStandardMaterial color="#c58a50" roughness={0.9} /></mesh>
  </group>
);

/* ---------- scenes ---------- */
const damp = (d: number, k: number, w: number) => Math.exp(-k * d) * Math.cos(w * d);

const SignScene: React.FC<{t: number}> = ({t}) => {
  const tS = at('s02', 3), tK = at('s03', 4), tSchild = at('s03', 2);
  const d = Math.max(0, t - tS), d2 = Math.max(0, t - tK);
  const drop = prog(t, at('s02', 1) - 0.1, 0.45);
  const ang = t < tS ? Math.sin(t * 1.5) * 0.02 : 0.4 * (1 - damp(d, 2.0, 7)) + (t > tK ? 0.14 * Math.exp(-2.6 * d2) * Math.sin(9 * d2) : 0);
  const pulse = 1 + 0.12 * Math.exp(-6 * Math.max(0, t - tSchild)) * (t > tSchild ? 1 : 0);
  return (
    <group position={[0, 0.2 + (1 - drop) * 2.4, 0]} scale={pulse}>
      <mesh position={[0, -0.9, -0.35]}><planeGeometry args={[4.4, 3.3]} /><meshStandardMaterial color="#4b2f5e" /></mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((x) => <mesh key={x} position={[x, -0.9, -0.34]}><planeGeometry args={[0.45, 3.3]} /><meshStandardMaterial color="#573668" /></mesh>)}
      <group position={[0, 1.2, 0]}>
        <mesh><sphereGeometry args={[0.1, 14, 14]} /><meshStandardMaterial color="#d9d9e0" metalness={0.7} roughness={0.3} /></mesh>
        <group rotation={[0, 0, ang]}>
          <Bar a={[0, 0]} b={[-0.85, -0.55]} color="#d9d9e0" /><Bar a={[0, 0]} b={[0.85, -0.55]} color="#d9d9e0" />
          <group position={[0, -1.1, 0]}>
            <mesh><boxGeometry args={[2.1, 1.1, 0.16]} /><meshStandardMaterial color="#b5753d" roughness={0.85} /></mesh>
            <mesh position={[0, 0, 0.09]}><boxGeometry args={[1.9, 0.9, 0.04]} /><meshStandardMaterial color="#f0dcb4" /></mesh>
            <group position={[0, -0.05, 0.12]}><Heart s={0.7} /></group>
          </group>
        </group>
      </group>
    </group>
  );
};

const ChickenScene: React.FC<{t: number}> = ({t}) => {
  const tH = at('s05', 3), tR = at('s05', 5), tP = at('s06', 2);
  const appear = prog(t, tH - 0.15, 0.5);
  const act = t > tR;
  const swing = act ? Math.sin((t - tR) * 11) * 0.35 : 0;
  const feathers = Array.from({length: 18}, (_, i) => ({i, t0: i < 5 ? tR + 0.1 + i * 0.18 : tP + (i - 5) * 0.2}));
  const plucked = clamp(feathers.filter((f) => t > f.t0).length / 18);
  const flap = act ? Math.sin((t - tR) * 14) * 0.07 : 0;
  return (
    <group position={[0, -0.1, 0]}>
      <group position={[0.7, 0.1 + (1 - appear) * -2.5, 0]} scale={1.15}><Chicken plucked={plucked} flap={flap} /></group>
      <group position={[-1.4, -0.5, 0.2]}><Person armL={1.4 + swing} color="#5aa9ff" bob={Math.abs(swing) * 0.05} /></group>
      <group position={[0.7, 0.1, 0]}>{feathers.map((f) => <Feather key={f.i} i={f.i} t0={f.t0} t={t} />)}</group>
    </group>
  );
};

const FenceScene: React.FC<{t: number}> = ({t}) => {
  const b1 = at('s08', 4), b2 = at('s09', 4);
  const tug = (b: number) => (t > b - 0.6 && t < b ? Math.sin(t * 40) * 0.05 * ((t - (b - 0.6)) / 0.6) : 0);
  const regrow = prog(t, at('s09', 0), 0.8);
  const fly = (b: number) => { const d = t - b; return <group position={[1.4 * d, 0.3 + 2.4 * d - 4.2 * d * d, 1.2 * d]} rotation={[d * 4, d * 3, d * 6]}><Plank /></group>; };
  let plankState: React.ReactNode = null;
  if (t < b1) plankState = <group position={[0, 0, 0.05]} rotation={[0, 0, tug(b1)]}><Plank /></group>;
  else if (t < b1 + 1.6) plankState = fly(b1);
  else if (t < b2) plankState = <group position={[0, -2.6 * (1 - regrow), 0.05]} rotation={[0, 0, tug(b2)]}><Plank /></group>;
  else if (t < b2 + 1.6) plankState = fly(b2);
  const pulling = (t > b1 - 0.6 && t < b1 + 0.15) || (t > b2 - 0.6 && t < b2 + 0.15);
  const recoil = (t >= b1 && t < b1 + 0.6) || (t >= b2 && t < b2 + 0.6);
  const arm = recoil ? -0.5 : pulling ? -1.45 + Math.sin(t * 40) * 0.05 : -1.1;
  const sparks = [b1, b2].map((b, k) => t >= b && t < b + 0.7 ? Array.from({length: 8}, (_, i) => {
    const d = t - b, a = (i / 8) * Math.PI * 2;
    return <mesh key={k + '_' + i} position={[Math.cos(a) * d * 2.2, 0.3 + Math.sin(a) * d * 2.2, 0.5]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={ACC} emissive={ACC} /></mesh>;
  }) : null);
  return (
    <group position={[0, 0.1, 0]}>
      <mesh position={[0, -1.1, -0.2]}><planeGeometry args={[6, 0.5]} /><meshStandardMaterial color="#4f7a3a" /></mesh>
      {[0.35, -0.3].map((y) => <mesh key={y} position={[0, y, -0.1]}><boxGeometry args={[4.2, 0.18, 0.1]} /><meshStandardMaterial color="#8a5a32" /></mesh>)}
      {[-1.7, -0.85, 0.85, 1.7].map((x) => <group key={x} position={[x, 0, 0]}><Plank /></group>)}
      {plankState}
      <group position={[1.55, -0.45, 0.7]} scale={0.95}><Person armL={arm} armR={0.25} color="#e0475b" /></group>
      {sparks}
    </group>
  );
};

const Teasers: React.FC<{t: number}> = ({t}) => {
  const s = (x: number) => prog(t, x, 0.5);
  return (
    <group>
      <group position={[-1.2, 0.3, 0]} scale={s(at('s01', 1)) * 0.65} rotation={[0, Math.sin(t * 2) * 0.4, 0.4]}><Heart s={0.9} /></group>
      <group scale={s(at('s01', 3) - 0.3)} rotation={[0.3, t * 1.5, 0.5]}><mesh scale={[0.9, 0.17, 0.3]}><sphereGeometry args={[0.5, 16, 10]} /><meshStandardMaterial color="#fff" /></mesh></group>
      <group position={[1.3, 0.3, 0]} scale={s(at('s01', 4)) * 0.8} rotation={[0, 0, -0.5 + Math.sin(t * 3) * 0.1]}><Plank h={1.2} /></group>
    </group>
  );
};

/* ---------- composition ---------- */
export const Video: React.FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), t = f / fps;
  const cur = TIM.scenes.find((s) => t >= s.start - 0.2 && t < s.end) ?? TIM.scenes[TIM.scenes.length - 1];
  const vis = (k: string) => { const s = scene(k); return t >= s.start - 0.1 && t < s.end + 0.1; };
  const pop = (k: string) => Math.max(0.001, prog(t, scene(k).start - 0.05, 0.4));
  return (
    <AbsoluteFill style={{background: BG[cur.key] ?? '#171426'}}>
      <Audio src={staticFile('redewendungen2/mix.wav')} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,.10), rgba(0,0,0,.35))'}} />
      <ThreeCanvas width={1080} height={1920} camera={{position: [0, 0, 12], fov: 35}}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[3, 5, 6]} intensity={2.2} />
        <pointLight position={[-3, 1, 4]} intensity={20} color={ACC} />
        <group position={[0, -0.5, 0]}>
          {t < scene('hook').end + 0.1 && <Teasers t={t} />}
          {vis('haus') && <group scale={pop('haus')}><SignScene t={t} /></group>}
          {vis('huhn') && <group scale={pop('huhn')}><ChickenScene t={t} /></group>}
          {vis('zaun') && <group scale={pop('zaun')}><FenceScene t={t} /></group>}
        </group>
      </ThreeCanvas>

      {t < scene('hook').end + 0.1 && (
        <div style={{position: 'absolute', top: SAFE.top + 20, left: SAFE.side, right: SAFE.side, textAlign: 'center', opacity: clamp((scene('hook').end + 0.1 - t) / 0.3)}}>
          <Spoken line={line('s01')} size={92} font={SERIF} />
        </div>
      )}

      {SCENES.map((k) => {
        const [a, b, c] = PICLINE[k], s = scene(k);
        if (t < s.start - 0.1 || t >= s.end) return null;
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', top: SAFE.top + 10, left: SAFE.side, right: SAFE.side, textAlign: 'center'}}>
              <Spoken line={line(a)} size={k === 'huhn' ? 64 : 76} font={SERIF} color="#fff" />
              {t >= at(b, 0) - 0.05 && (
                <div style={{marginTop: 22, fontFamily: SANS, fontSize: 46, fontWeight: 700, color: ACC}}>
                  <Pop show={at(b, 0) - 0.05}><span style={{border: `3px solid ${ACC}`, borderRadius: 14, padding: '2px 14px', marginRight: 14, fontSize: 34, letterSpacing: 3}}>BILDLICH</span></Pop>
                  <Spoken line={line(b)} skip={1} size={46} color={ACC} weight={700} font={SANS} />
                </div>
              )}
            </div>
            <Card from={at(c, 0) - 0.1} to={s.end} label="Gemeint ist" accent={ACC}>
              <Spoken line={line(c)} skip={2} size={48} color="#fff" weight={600} />
            </Card>
          </React.Fragment>
        );
      })}

      {t >= scene('outro').start - 0.1 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 100}}>
          {/* recap of the three idioms instead of repeating the CTA text twice */}
          <div style={{marginBottom: 70, padding: `0 ${SAFE.side}px`}}>
            {['Der Haussegen hängt schief', 'ein Hühnchen zu rupfen haben', 'einen Streit vom Zaun brechen'].map((w, i) => (
              <Pop key={w} show={scene('outro').start + i * 0.15}>
                <div style={{fontFamily: SERIF, fontSize: 58, fontWeight: 700, color: '#fff', marginBottom: 22, textAlign: 'center'}}>{w}</div>
              </Pop>
            ))}
          </div>
          <FollowCTA show={at('s11', 0) + 0.3} accent="#e0475b" />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
