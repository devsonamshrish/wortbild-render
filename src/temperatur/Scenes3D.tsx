/* The three literal scenes, all stateless functions of time t (seconds since the scene began). */
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rand, clamp, prog} from './timing';

/* soft round glow sprite, shared by fire, sparks, snow and the belly glow */
export const useGlowTexture = () =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(255,255,255,.75)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);

/* ---------------- 1 · Schmetterlinge im Bauch ---------------- */
const wingShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.35, 0.55, 1.05, 0.75, 0.95, 0.15);
  s.bezierCurveTo(0.9, -0.15, 0.55, -0.2, 0.42, -0.08);
  s.bezierCurveTo(0.62, -0.35, 0.45, -0.7, 0.15, -0.45);
  s.lineTo(0, 0);
  return s;
})();
const wingGeo = new THREE.ShapeGeometry(wingShape, 18);
const WARM = ['#ff8fb1', '#ffb347', '#ffd36e', '#ff6f91', '#ffa6c9', '#f9c74f'];

const Butterfly: React.FC<{i: number; t: number; release: number}> = ({i, t, release}) => {
  // each butterfly rests in the glowing belly, then lifts off on the word "flattern" and spirals up
  const ph = rand(i) * Math.PI * 2;
  const delay = rand(i + 50) * 1.6;
  const k = clamp((t - release - delay) / 6);
  const rad = 0.25 + k * (1.0 + rand(i + 7) * 1.5);
  const ang = ph + k * (4 + rand(i + 3) * 3);
  const y = -1.6 + k * (2.6 + rand(i + 9) * 1.4) + Math.sin(t * 2 + ph) * 0.08;
  const flap = Math.sin(t * (14 + rand(i + 11) * 6) + ph) * (k > 0 ? 1.05 : 0.35);
  const s = 0.22 + rand(i + 13) * 0.18;
  const col = WARM[i % WARM.length];
  return (
    <group position={[Math.cos(ang) * rad, y, Math.sin(ang) * rad * 0.7]} rotation={[0.25, -ang + Math.PI / 2, Math.sin(t + ph) * 0.3]} scale={s}>
      <mesh geometry={wingGeo} rotation={[0, flap, 0]}>
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.55} side={THREE.DoubleSide} roughness={0.4} />
      </mesh>
      <mesh geometry={wingGeo} rotation={[0, Math.PI - flap, 0]}>
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.55} side={THREE.DoubleSide} roughness={0.4} />
      </mesh>
      <mesh rotation={[0, 0, 0]} scale={[0.07, 0.6, 0.07]}>
        <capsuleGeometry args={[0.6, 0.6, 4, 8]} />
        <meshStandardMaterial color="#3a2030" />
      </mesh>
    </group>
  );
};

export const ButterflyScene: React.FC<{t: number; release: number}> = ({t, release}) => {
  const glow = useGlowTexture();
  const pulse = 1 + Math.sin(t * 5) * 0.06;
  return (
    <group position={[0, 1.1, 0]}>
      <ambientLight intensity={0.5} color="#ffd9e6" />
      <pointLight position={[0, -1.4, 1.5]} intensity={30 * pulse} color="#ff9e7a" distance={12} />
      <directionalLight position={[2, 4, 4]} intensity={1.4} color="#fff0e0" />
      {/* the "belly": a warm glowing orb the swarm rises from */}
      <sprite position={[0, -1.6, 0]} scale={[3.2 * pulse, 3.2 * pulse, 1]}>
        <spriteMaterial map={glow} color="#ff8a65" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <mesh position={[0, -1.6, 0]} scale={0.55 * pulse}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#ffb199" emissive="#ff7043" emissiveIntensity={1.2} />
      </mesh>
      {Array.from({length: 46}, (_, i) => (
        <Butterfly key={i} i={i} t={t} release={release} />
      ))}
    </group>
  );
};

/* ---------------- 2 · Öl ins Feuer gießen ---------------- */
const FIRE_N = 150;
export const FireScene: React.FC<{t: number; pour: number; flare: number}> = ({t, pour, flare}) => {
  const glow = useGlowTexture();
  // the fire grows when the oil lands ("Feuer" in the idiom) and flares on "größer"
  const grow = 1 + prog(t, pour + 0.6, 1.2) * 0.7 + prog(t, flare, 0.5) * 0.9;
  const tilt = prog(t, pour - 0.5, 0.8) * 1.9 - prog(t, flare + 1.5, 1) * 1.9;
  const stream = clamp((t - pour) / 0.4) * (1 - clamp((t - flare - 1.2) / 0.4));
  const parts = useMemo(() => Array.from({length: FIRE_N}, (_, i) => ({sp: 0.9 + rand(i) * 1.4, ph: rand(i + 999), x: (rand(i + 77) - 0.5), z: (rand(i + 55) - 0.5)})), []);
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, -0.6, 1.2]} intensity={18 * grow} color="#ff7a1a" distance={14} />
      {/* logs */}
      {[-0.35, 0.35].map((r, k) => (
        <mesh key={k} position={[0, -2.2, 0]} rotation={[0, r * 2.2, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.18, 2.4, 12]} />
          <meshStandardMaterial color="#4a2c1a" roughness={0.9} />
        </mesh>
      ))}
      {/* flames: additive sprites rising, yellow at the core, red at the tips */}
      {parts.map((p, i) => {
        const life = ((t * p.sp * 0.55 + p.ph) % 1 + 1) % 1;
        const h = life * 3.2 * grow;
        const wob = Math.sin(t * 3 + i) * 0.12 * life;
        const x = p.x * (1.5 - life) * 1.1 * Math.sqrt(grow) + wob;
        const size = (1 - life) * 0.7 * Math.sqrt(grow) + 0.08;
        const col = new THREE.Color().setHSL(0.13 - life * 0.12, 1, 0.62 - life * 0.25);
        return (
          <sprite key={i} position={[x, -2 + h, p.z * 0.6]} scale={[size, size * 1.3, 1]}>
            <spriteMaterial map={glow} color={col} transparent opacity={(1 - life) * 0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        );
      })}
      {/* sparks burst on "größer" */}
      {Array.from({length: 60}, (_, i) => {
        const k = t - flare - rand(i + 300) * 0.3;
        if (k < 0 || k > 2) return null;
        const a = rand(i + 400) * Math.PI * 2, v = 1.2 + rand(i + 500) * 2.2;
        return (
          <sprite key={'s' + i} position={[Math.cos(a) * v * k * 0.6, -0.6 + Math.abs(Math.sin(a)) * v * k - 1.4 * k * k, 0.3]} scale={[0.12, 0.12, 1]}>
            <spriteMaterial map={glow} color="#ffd27a" transparent opacity={1 - k / 2} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        );
      })}
      {/* the oil can tips in from the upper right and pours */}
      <group position={[1.15, 1.7, 0.4]} rotation={[0, 0, tilt]}>
        <mesh>
          <cylinderGeometry args={[0.38, 0.42, 1.0, 24]} />
          <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.1, 0.16, 0.35, 16]} />
          <meshStandardMaterial color="#9c7b14" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {stream > 0 &&
        Array.from({length: 18}, (_, i) => {
          const k = ((t * 1.6 + i / 18) % 1);
          return (
            <mesh key={'o' + i} position={[0.6 - k * 0.6, 1.85 - k * 3.1, 0.4]} scale={0.09 * stream}>
              <sphereGeometry args={[1, 10, 10]} />
              <meshStandardMaterial color="#e0b23a" emissive="#ff9a2a" emissiveIntensity={0.8} metalness={0.4} roughness={0.2} />
            </mesh>
          );
        })}
    </>
  );
};

/* ---------------- 3 · Eiszeit herrscht ---------------- */
const crystalGeo = new THREE.OctahedronGeometry(1, 0);
export const IceScene: React.FC<{t: number; freeze: number}> = ({t, freeze}) => {
  const glow = useGlowTexture();
  const f = prog(t, freeze, 2.2); // everything freezes on "friert"
  return (
    <>
      <ambientLight intensity={0.6} color="#bfe3ff" />
      <directionalLight position={[-3, 5, 4]} intensity={1.6} color="#e6f4ff" />
      <pointLight position={[0, 1, 3]} intensity={8} color="#7fc8ff" distance={10} />
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color={new THREE.Color('#3b4f66').lerp(new THREE.Color('#dff3ff'), f)} roughness={0.15 + (1 - f) * 0.6} metalness={0.2} />
      </mesh>
      {/* two chairs turned away from each other: nobody talks */}
      {[-1, 1].map((d) => (
        <group key={d} position={[d * 1.15, -2.2, 0]} rotation={[0, d * (Math.PI / 2 + 0.35) - prog(t, 0.6, 1.4) * d * 0.5, 0]}>
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.0, 0.12, 1.0]} />
            <meshStandardMaterial color={new THREE.Color('#8b5e3c').lerp(new THREE.Color('#cfeaff'), f)} roughness={0.5 - f * 0.35} />
          </mesh>
          <mesh position={[0, 1.35, -0.45]}>
            <boxGeometry args={[1.0, 1.15, 0.1]} />
            <meshStandardMaterial color={new THREE.Color('#8b5e3c').lerp(new THREE.Color('#cfeaff'), f)} roughness={0.5 - f * 0.35} />
          </mesh>
          {[[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]].map(([x, z], k) => (
            <mesh key={k} position={[x, 0.36, z]}>
              <boxGeometry args={[0.08, 0.72, 0.08]} />
              <meshStandardMaterial color="#5a3d28" />
            </mesh>
          ))}
        </group>
      ))}
      {/* ice crystals grow out of the floor */}
      {Array.from({length: 34}, (_, i) => {
        const a = rand(i + 70) * Math.PI * 2, r = 1.2 + rand(i + 71) * 2.8;
        const g = clamp((t - freeze - rand(i + 72) * 1.5) / 0.9);
        if (g <= 0) return null;
        const s = (0.18 + rand(i + 73) * 0.45) * (1 - Math.pow(1 - g, 3));
        return (
          <mesh key={i} geometry={crystalGeo} position={[Math.cos(a) * r, -2.2 + s * 0.9, Math.sin(a) * r * 0.6 - 0.5]} rotation={[rand(i) * 0.6, rand(i + 1) * 3, rand(i + 2) * 0.6]} scale={[s * 0.45, s * 1.6, s * 0.45]}>
            <meshPhysicalMaterial color="#d8f1ff" roughness={0.05} metalness={0.1} transmission={0.6} thickness={0.5} emissive="#6fb8ff" emissiveIntensity={0.25} />
          </mesh>
        );
      })}
      {/* snow */}
      {Array.from({length: 140}, (_, i) => {
        const sp = 0.35 + rand(i + 200) * 0.5;
        const y = 4 - (((t * sp + rand(i + 201) * 8) % 8) + 8) % 8;
        return (
          <sprite key={'n' + i} position={[(rand(i + 202) - 0.5) * 7 + Math.sin(t + i) * 0.15, y, (rand(i + 203) - 0.5) * 4]} scale={[0.07 + rand(i + 204) * 0.06, 0.07 + rand(i + 204) * 0.06, 1]}>
            <spriteMaterial map={glow} color="#ffffff" transparent opacity={0.85} depthWrite={false} />
          </sprite>
        );
      })}
    </>
  );
};
