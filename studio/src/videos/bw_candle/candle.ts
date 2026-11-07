// CANDLELIGHT (owner: candle agent). Interior lighting: the two-tone preset for every bedroom shot, the warm rim on
// character cards and the camera-relative key-light direction per interior shot (the candle / hearth side).
import { LightPreset } from "../bridge/lights";

/** candlelight inside the log room: warm amber key, plum-brown shade (wood keeps its hue), close smoky plum fog */
export const CANDLE: LightPreset = {
  az: 110, el: 24,
  lit: [1.58, 1.05, 0.6], shade: [0.27, 0.15, 0.21], lift: [0.034, 0.016, 0.042], lambert: 0.5, sideK: 0.8, term: 0.25,
  charTint: [1.0, 0.84, 0.66], charShade: 0.84, charGrad: 0.16, bodyGrad: 0.26, sideTint: [0.84, 0.72, 0.88],
  blob: [0.3, 0.25, 0.35], actorShadow: true,
  top: "#141c3c", hor: "#5d6d94", skyCurve: [0.05, 0.6, 1.0], fog: "#2a1822", fogNear: 2.5, fogFar: 15, sunDisc: "#ffffff",
  sunCol: "#ffb070", sunI: 2.0, sky: "#2a2030", ground: "#1a1418", hemiI: 0.15,
  bias: -0.0006, normalBias: 0.02,
};
export const RIM_CANDLE: [number, [number, number, number]] = [0.55, [1.0, 0.66, 0.3]];
/** key light per interior shot id: [azimuth deg from the shot's view axis (+ = screen right, >90 = from the camera
 *  side), elevation deg]. Cheated a little toward the lens from the real nightstand candle / crate candle / hearth so
 *  the log walls catch the light and the cast shadows land long on them. */
export const SUN_INT: Record<number, [number, number]> = {
  3: [105, 18], 4: [110, 26], 5: [115, 28], 6: [110, 28], 7: [105, 26], 8: [120, 20], 9: [110, 28], 10: [-120, 18], 11: [105, 18],
  12: [100, 20], 14: [110, 20], 15: [100, 22], 16: [140, 28], 17: [-115, 16], 18: [120, 32], 20: [-110, 16], 21: [100, 22],
};
