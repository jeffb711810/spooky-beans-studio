// Sandbox entry for the atmos agent: renders only src/videos/bw_atmos (an isolated copy of the Bell Witch short).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { BellWitch, BELL_FRAMES } from "../../videos/bw_atmos/Bell";

const Root: React.FC = () => <Composition id="BellWitch" component={BellWitch} durationInFrames={BELL_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
