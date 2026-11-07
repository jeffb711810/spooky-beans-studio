// POST / PICTURE QUALITY (owner: post agent).
// "The Bell Witch": our original ~71 s horror-history short in the flat-characters-in-a-3D-toon-world style.
// One world (world.ts) posed per frame from the shot timeline (story.ts) and the staging (stage.ts). Post chain as the
// bridge: ink (own pass) -> lens blur pre + main -> bloom (emissive only) -> NEUTRAL tone map -> grade, MSAA 4.
// Look pass (post): world ink thinned toward the reference (~3 px at 1080 wide): 4.2 px at 6 m -> 2.6 px at 90 m
// (was 5.1 -> 3.3), creases x0.72, so the characters' 4.6 px plum outlines stay the strongest line in the frame;
// candle interiors draw room-shell folds (wall/floor, wall/wall) at 0.3 instead of 0.7 (reference: none there);
// the final EffectPass dithers its 8-bit output (night-sky, moon-halo, bloom and vignette gradients, no banding).
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, Effect, EffectAttribute, EffectComposer as PPComposer, EffectPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { loadKit } from "../bridge/world";
import { Kit } from "../bridge/build";
import { InkPass, InkOptions, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect } from "../bridge/grade";
import { GRADE_NIGHT_BW, GRADE_CANDLE, GRADE_STRENGTH, BLOOM } from "./grade";
import { World } from "./world";
import { TOTAL, shotAt, flashAt, camAt, focusAt, cInfAt, WHIP_PXF } from "./story";
import { CAPTIONS } from "./captions";
import "@fontsource/montserrat/800.css";

export const BELL_FRAMES = TOTAL;

// world ink (px at 1080x1920; ink.ts scales by output height). Shared base + per-light differences.
const INK: InkOptions = { color: "#040305", widthNear: 4.2, widthFar: 2.6, distNear: 6, distFar: 90, creaseScale: 0.72,
  depthLo: 0.01, depthHi: 0.03, angleLo: 35, angleHi: 50, farOpacity: 0.9 };
const INK_LIGHT: Record<"night" | "candle", InkOptions> = {
  night: { ...INK, concaveGain: 0.6 },                     // porch/fence/stones on the ground keep contact lines
  candle: { ...INK, widthNear: 4.0, concaveGain: 0.3 },     // rooms 1.5-6 m away: slightly finer, few shell folds
};

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: BLOOM.intensity, luminanceThreshold: BLOOM.threshold, luminanceSmoothing: BLOOM.smoothing, mipmapBlur: true, levels: BLOOM.levels, radius: BLOOM.radius });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
// ---- whip-pan motion blur (camera agent; reference: the one whip pan is always smeared). A 12-tap directional blur
// along the camera's screen motion x 0.5 shutter. Its pass is switched off on every other frame (no cost there). ----
const WHIP_FS = /* glsl */ `
uniform vec2 vel;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (dot(vel, vel) < 1e-10) { outputColor = inputColor; return; }
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 12; i++) acc += texture2D(inputBuffer, uv + vel * (float(i) / 11.0 - 0.5));
  outputColor = acc / 12.0;
}`;
class WhipBlur extends Effect {
  constructor() { super("WhipBlur", WHIP_FS, { attributes: EffectAttribute.CONVOLUTION, uniforms: new Map([["vel", new THREE.Uniform(new THREE.Vector2())]]) }); }
  get vel() { return this.uniforms.get("vel")!.value as THREE.Vector2; }
}
const wcam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.1, 1500), wpt = new THREE.Vector3();
/** screen motion (uv per frame) of the frame-centre point at the focus distance between f and f+1, or null if slow */
const whipVel = (f: number): [number, number] | null => {
  const s = shotAt(f);
  if (f + 1 >= s.b) return null;
  const set = (c: ReturnType<typeof camAt>) => { wcam.position.set(...c.pos); wcam.up.set(0, 1, 0); wcam.lookAt(...c.look); wcam.rotateZ(c.roll); wcam.fov = c.fov; wcam.updateProjectionMatrix(); wcam.updateMatrixWorld(); };
  const c0 = camAt(s, f); set(c0);
  const d = Math.max(0.5, Math.hypot(c0.look[0] - c0.pos[0], c0.look[1] - c0.pos[1], c0.look[2] - c0.pos[2]));
  wpt.set(0, 0, 0.5).unproject(wcam).sub(wcam.position).normalize().multiplyScalar(d).add(wcam.position);
  set(camAt(s, f + 1)); wpt.project(wcam);
  const du = -wpt.x / 2, dv = -wpt.y / 2; // where the centre point went (uv), negated = how the picture slid
  return Math.hypot(du * 720, dv * 1280) > WHIP_PXF ? [du, dv] : null;
};
const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("bell kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, INK_LIGHT.night),
    lens: new LensBlur({ maxCoC: 30, nearScale: 1.2 }), // camera round 2: cInf 22-50 inside, foreground framing up to 30 px
    whip: new WhipBlur(),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADE_NIGHT_BW, 1),
  }), [camera, scene]);
  useEffect(() => () => { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); }, [fx]);
  const composer = useRef<PPComposer>(null);
  // dither the last (on-screen) EffectPass once: +-0.5 LSB ordered noise kills 8-bit banding in the dark gradients
  useFrame(() => {
    const ps = composer.current?.passes, last = ps?.[ps.length - 1];
    if (last instanceof EffectPass && !last.dithering) last.dithering = true;
  });
  const post = useMemo(() => (
    <EffectComposer ref={composer} multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.whip} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </EffectComposer>
  ), [fx]);
  const cam = camera as THREE.PerspectiveCamera, s = shotAt(f);
  const target = world.update(f, cam, scene);
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  // focus on the speaking / reacting face; it travels and racks with the camera keys (story.ts focusAt), the blur
  // strength glides with them too (blurred close-up -> sharp wide). `target` (stage focus) is the fallback.
  const fo = focusAt(s, f);
  fpt.set(...(fo ?? [target.x, target.y, target.z]));
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = cInfAt(s, f);
  // whip blur: uv streak = camera screen motion x 0.5 shutter; its pass runs only on whip frames
  const wv = whipVel(f);
  fx.whip.vel.set(wv ? wv[0] * 0.5 : 0, wv ? wv[1] * 0.5 : 0);
  const wp = composer.current?.passes.find((p) => p instanceof EffectPass && (p as unknown as { effects: Effect[] }).effects.includes(fx.whip));
  if (wp) wp.enabled = !!wv;
  const tag = fx.grade as unknown as { _l?: string };
  if (tag._l !== s.light) { fx.grade.set(s.light === "candle" ? GRADE_CANDLE : GRADE_NIGHT_BW); fx.ink.set(INK_LIGHT[s.light]); tag._l = s.light; }
  fx.grade.amount = GRADE_STRENGTH[s.light];
  return (<><primitive object={world.root} dispose={null} />{post}</>);
};

// ---- captions (reference style: 1-2 words at a time, heavy white sans with a thick black outline, lower middle,
// a quick pop on each new chunk). Timings come from the voice alignment (captions.ts, generated). ----
const CAP_FONT = "Montserrat";
const useCapFont = () => {
  const [h] = useState(() => delayRender("caption font"));
  useEffect(() => {
    const done = () => continueRender(h);
    (document as unknown as { fonts?: { load: (f: string) => Promise<unknown> } }).fonts?.load(`800 86px ${CAP_FONT}`).then(done, done) ?? done();
  }, [h]);
};
const POP = [0.84, 0.97, 1.05, 1.0];
const Captions: React.FC<{ f: number }> = ({ f }) => {
  useCapFont();
  const c = CAPTIONS.find((x) => f >= x.a && f < x.b);
  if (!c) return null;
  const k = POP[Math.min(f - c.a, POP.length - 1)];
  const base: React.CSSProperties = {
    position: "absolute", left: 60, right: 60, top: 1180, textAlign: "center", fontFamily: `${CAP_FONT}, sans-serif`, fontWeight: 800,
    fontSize: 88, lineHeight: 1.08, letterSpacing: -0.5, transform: `scale(${k})`, transformOrigin: "50% 50%",
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...base, color: "#000", WebkitTextStroke: "20px #000", filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.45))" }}>{c.t}</div>
      <div style={{ ...base, color: "#ffffff" }}>{c.t}</div>
    </AbsoluteFill>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
export const BellWitch: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = flashAt(f);
  return (
    <AbsoluteFill style={{ background: "#0b0d18" }}>
      <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows
        gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 1500 }}>
        <Inner kit={kit} />
      </ThreeCanvas>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {(getInputProps() as { captions?: boolean }).captions !== false && <Captions f={f} />}
    </AbsoluteFill>
  );
};
