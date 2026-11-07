import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { BellWitch, BELL_FRAMES, BellBanner, BellPfp } from "./videos/bellwitch/Bell";
import { BellTest, TEST_FRAMES } from "./videos/bellwitch/BellTest";
import { BellWitch as Busby, BELL_FRAMES as BUSBY_FRAMES } from "./videos/busby/Bell";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BellWitch" component={BellWitch} durationInFrames={BELL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="WHLook" component={BellWitch} durationInFrames={2200} fps={30} width={1080} height={1920} />
    <Composition id="BellPfp" component={BellPfp} durationInFrames={2170} fps={30} width={800} height={800} />
    <Composition id="BellBanner" component={BellBanner} durationInFrames={2170} fps={30} width={2560} height={1440} />
    <Composition id="BusbyLook" component={Busby} durationInFrames={BUSBY_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BellTest" component={BellTest} durationInFrames={TEST_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
