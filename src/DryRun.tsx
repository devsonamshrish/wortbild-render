import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {ThreeCanvas} from '@remotion/three';

/* dry run: a lit, rotating icosahedron (iceberg stand-in) proves WebGL rendering works headless */
export const DryRun: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#0b1626'}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0, 6], fov: 40}}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <mesh rotation={[f * 0.03, f * 0.05, 0]}>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#cfe8ff" flatShading roughness={0.3} />
        </mesh>
      </ThreeCanvas>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 460}}>
        <div style={{color: 'white', fontSize: 90, fontFamily: 'Georgia', opacity: interpolate(f, [0, 20], [0, 1], {extrapolateRight: 'clamp'})}}>
          Eis{' '}&amp;{' '}Licht
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
