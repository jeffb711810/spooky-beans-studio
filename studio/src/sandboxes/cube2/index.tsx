import React, { useMemo } from "react";
import { Composition, registerRoot, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
const Inner: React.FC = () => { const f = useCurrentFrame(); const tone = useMemo(() => new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), []);
  return (<>
    <ambientLight intensity={1} /><directionalLight position={[2, 3, 4]} intensity={2} />
    <mesh rotation={[f / 20, f / 30, 0]}><boxGeometry args={[2, 2, 2]} /><meshStandardMaterial color="orange" /></mesh>
    <EffectComposer multisampling={4}><primitive object={tone} dispose={null} /></EffectComposer></>); };
const Cube: React.FC = () => (
  <ThreeCanvas width={540} height={960} style={{ background: "#88c" }} camera={{ position: [0, 0, 5] }}><Inner /></ThreeCanvas>);
registerRoot(() => <Composition id="BridgeShort" component={Cube} durationInFrames={60} fps={30} width={540} height={960} />);
