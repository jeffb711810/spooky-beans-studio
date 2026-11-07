// MOONLIGHT (owner: moon agent). Exterior night lighting: the two-tone preset for every outdoor shot, the cool rim on
// character cards, the camera-relative key-light direction per outdoor shot, and where the moon sits in each frame.
import { LIGHTS, LightPreset } from "../bridge/lights";

/** moonlit night: cool key, violet shade (never black), lifted shadows so the picture reads on a phone */
export const NIGHT: LightPreset = {
  ...LIGHTS.night,
  lit: [1.15, 1.3, 1.75], shade: [0.2, 0.21, 0.36], lift: [0.05, 0.06, 0.13],
  charTint: [0.84, 0.9, 1.0], charShade: 0.8,
};
/** cool moon rim on character cards: [strength 0..1, linear RGB] */
export const RIM_NIGHT: [number, [number, number, number]] = [0.6, [0.42, 0.58, 1.0]];
/** key light per outdoor shot id: [azimuth deg from the shot's view axis (+ = screen right, 180 = behind camera), elevation deg] */
export const SUN_EXT: Record<number, [number, number]> = {
  1: [-115, 24], 2: [-120, 28], 13: [-110, 26], 19: [-115, 22], 22: [-120, 30], 23: [-110, 30], 24: [-100, 20], 25: [-100, 20],
};
/** moon placement in the opening frame of each outdoor shot: right / up as fractions of the half-frame, min elevation deg */
export const MOON_FRAME: { right: number; up: number; minEl: number; disc: number; halo: number } = { right: -0.42, up: 0.62, minEl: 12, disc: 2.6, halo: 13 };
export const MOON_SHOT: Record<number, Partial<{ right: number; up: number }>> = {};
