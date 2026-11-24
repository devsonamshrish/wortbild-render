import React from 'react';
import {Composition} from 'remotion';
import {DryRun} from './DryRun';
import {Temperatur, TEMPERATUR_FRAMES} from './temperatur/Temperatur';
import {Vertrauen, VERTRAUEN_FRAMES} from './vertrauen/Vertrauen';
import * as Quiz2 from './artikelquiz2/Video';
import * as Idiom2 from './redewendungen2/Video';
import * as LaneA from './laneA/Video';
import * as LaneB from './laneB/Video';
import * as LaneC from './laneC/Video';
import * as LaneD from './laneD/Video';

/* one composition per video; builders only edit their own folder, never this file */
export const Root: React.FC = () => (
  <>
    <Composition id="DryRun" component={DryRun} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="Temperatur" component={Temperatur} durationInFrames={TEMPERATUR_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Vertrauen" component={Vertrauen} durationInFrames={VERTRAUEN_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Artikelquiz2" component={Quiz2.Video} durationInFrames={Quiz2.FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Redewendungen2" component={Idiom2.Video} durationInFrames={Idiom2.FRAMES} fps={30} width={1080} height={1920} />
    {/* night lanes: one per builder, reused video after video (sources archived per video) */}
    <Composition id="LaneA" component={LaneA.Video} durationInFrames={LaneA.FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LaneB" component={LaneB.Video} durationInFrames={LaneB.FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LaneC" component={LaneC.Video} durationInFrames={LaneC.FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LaneD" component={LaneD.Video} durationInFrames={LaneD.FRAMES} fps={30} width={1080} height={1920} />
  </>
);
