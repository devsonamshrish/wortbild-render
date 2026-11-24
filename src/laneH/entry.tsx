/* solo entry for LaneH: renders only this lane, so a half-finished other lane can never break this render */
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Video, FRAMES} from './Video';
const Solo: React.FC = () => <Composition id="LaneH" component={Video} durationInFrames={FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Solo);
