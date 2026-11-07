import React from "react";
import { Composition, registerRoot, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
const Cube: React.FC = () => { const f = useCurrentFrame(); return (
  <ThreeCanvas width={540} height={960} style={{ background: "#88c" }} camera={{ position: [0, 0, 5] }}>
    <ambientLight intensity={1} /><directionalLight position={[2, 3, 4]} intensity={2} />
    <mesh rotation={[f / 20, f / 30, 0]}><boxGeometry args={[2, 2, 2]} /><meshStandardMaterial color="orange" /></mesh>
  </ThreeCanvas>); };
registerRoot(() => <Composition id="BridgeShort" component={Cube} durationInFrames={60} fps={30} width={540} height={960} />);
