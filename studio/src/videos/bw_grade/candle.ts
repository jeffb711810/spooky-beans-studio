// CANDLELIGHT (owner: candle agent). Interior lighting: the two-tone preset for every bedroom shot, the warm rim on
// character cards and the camera-relative key-light direction per interior shot (the candle / hearth side).
import { LightPreset } from "../bridge/lights";

/** candlelight inside the log room: warm key, plum-black shade, short dark fog */
export const CANDLE: LightPreset = {
  az: 50, el: 30,
  lit: [1.6, 1.0, 0.55], shade: [0.13, 0.1, 0.19], lift: [0.03, 0.02, 0.06], lambert: 0.45, sideK: 0.8, term: 0.2,
  charTint: [1.0, 0.82, 0.64], charShade: 0.78, charGrad: 0.16, bodyGrad: 0.35, sideTint: [0.78, 0.7, 0.9],
  blob: [0.3, 0.25, 0.35], actorShadow: true,
  top: "#141c3c", hor: "#5d6d94", skyCurve: [0.05, 0.6, 1.0], fog: "#1c1420", fogNear: 7, fogFar: 45, sunDisc: "#ffffff",
  sunCol: "#ffb070", sunI: 2.0, sky: "#2a2030", ground: "#1a1418", hemiI: 0.15,
  bias: -0.0006, normalBias: 0.02,
};
export const RIM_CANDLE: [number, [number, number, number]] = [0.5, [1.0, 0.62, 0.28]];
/** key light per interior shot id: [azimuth deg from the shot's view axis (+ = screen right), elevation deg] */
export const SUN_INT: Record<number, [number, number]> = {
  3: [55, 30], 4: [60, 32], 5: [50, 30], 6: [40, 34], 7: [45, 32], 8: [25, 26], 9: [45, 30], 10: [70, 26], 11: [50, 30], 12: [40, 30],
  14: [40, 28], 15: [50, 30], 16: [30, 34], 17: [60, 25], 18: [40, 30], 20: [60, 25], 21: [35, 30],
};
