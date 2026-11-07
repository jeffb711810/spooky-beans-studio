// MOONLIGHT (owner: moon agent). Exterior night lighting: the two-tone preset for every outdoor shot, the cool rim on
// character cards, the camera-relative key-light direction per outdoor shot, and where the moon sits in each frame.
import { LIGHTS, LightPreset } from "../bridge/lights";

/** moonlit night: lavender-silver key (R >= G so grass goes teal, not day-green), saturated violet shade with a violet
 *  lift floor (never black; reference night darks are violet C ~33), soft lavender far side on the cards */
export const NIGHT: LightPreset = {
  ...LIGHTS.night,
  lit: [1.2, 1.45, 2.55], shade: [0.26, 0.23, 0.6], lift: [0.1, 0.085, 0.27], lambert: 0.35, sideK: 0.82, term: 0.1,
  charTint: [0.8, 0.82, 1.0], charShade: 0.88, charGrad: 0.055, bodyGrad: 0.28, sideTint: [0.78, 0.74, 0.97],
  blob: [0.45, 0.42, 0.62], fog: "#525a8c",
};
/** cool moon rim on character cards: [strength 0..1, linear RGB] */
export const RIM_NIGHT: [number, [number, number, number]] = [0.7, [0.5, 0.66, 1.0]];
/** key light per outdoor shot id: [azimuth deg from the shot's view axis (+ = screen right, 180 = behind camera), elevation deg]
 *  Rules: the key comes from the same screen side as the moon; low (18-24 deg) for long moon shadows; house walls get
 *  N.L either > .3 or < 0 (no terminator mush): one visible wall lit, the other in violet shade. Graveyard (24, 25 open)
 *  is side-backlit from the left so the headstone faces sit in shade, the grave tops stay lit; 25 at -78 also
 *  keeps the end view of the house split (gable lit, long wall shade). 22 has the moon top-right, so the key is right. */
export const SUN_EXT: Record<number, [number, number]> = {
  1: [-100, 20], 2: [-120, 24], 13: [-108, 22], 19: [-115, 22], 22: [118, 28], 23: [-110, 26], 24: [-82, 22], 25: [-78, 20],
};
/** moon placement in the opening frame of each outdoor shot: right / up as fractions of the half-frame, min elevation deg */
export const MOON_FRAME: { right: number; up: number; minEl: number; disc: number; halo: number } = { right: -0.42, up: 0.62, minEl: 12, disc: 2.6, halo: 13 };
/** per shot: 1 peeks over the roof ridge (sinks behind it as the camera creeps), 2 / 22 glow over the ridge at the top
 *  edge (22 top-right, clear of the fish), 19 just above the ridge, 24 / 25 low between the trunks under the crowns */
export const MOON_SHOT: Record<number, Partial<{ right: number; up: number; minEl: number }>> = {
  1: { right: -0.5, up: 0.44, minEl: 2 },
  2: { right: -0.55, up: 0.96 },
  19: { up: 0.6 },
  22: { right: 0.62, up: 0.9 },
  24: { right: -0.72, up: 0.3, minEl: 0 },
  25: { right: -0.72, up: 0.3, minEl: 0 },
};
