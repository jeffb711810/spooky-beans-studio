// MOONLIGHT (owner: moon agent). Exterior night lighting: the two-tone preset for every outdoor shot, the cool rim on
// character cards, the camera-relative key-light direction per outdoor shot, and where the moon sits in each frame.
import { LIGHTS, LightPreset } from "../bridge/lights";

/** moonlit night (fix round 1: "make the lighting look normal"): a clean cartoon night. Cool silver-blue key that
 *  keeps materials their own colour (wood brown, grass green, faces peach), blue shade with G >= R (no violet), a
 *  neutral-blue lift floor, dark blue fog instead of the lavender wash */
export const NIGHT: LightPreset = {
  ...LIGHTS.night,
  lit: [1.12, 1.24, 1.64], shade: [0.2, 0.3, 0.48], // brighter, cleaner moonlight (user: match the reference's clean night) lift: [0.015, 0.035, 0.055], lambert: 0.35, sideK: 0.84, term: 0.12,
  charTint: [0.88, 0.93, 1.0], charShade: 0.88, charGrad: 0.06, bodyGrad: 0.24, sideTint: [0.84, 0.88, 0.97],
  blob: [0.42, 0.45, 0.55], fog: "#2c3a58",
};
/** cool moon rim on character cards: [strength 0..1, linear RGB] */
export const RIM_NIGHT: [number, [number, number, number]] = [0, [0.66, 0.78, 1.0]]; // off: the shader lit the ink outline itself (light fringe)
/** key light per outdoor shot id: [azimuth deg from the shot's view axis (+ = screen right, 180 = behind camera), elevation deg]
 *  Rules: the key comes from the same screen side as the moon; low (18-24 deg) for long moon shadows; house walls get
 *  N.L either > .3 or < 0 (no terminator mush): one visible wall lit, the other in violet shade. Graveyard (24, 25 open)
 *  is side-backlit from the left so the headstone faces sit in shade, the grave tops stay lit; 25 at -78 also
 *  keeps the end view of the house split (gable lit, long wall shade). 1 at -84 (light round 2): roof lit, porch facade in
 *  blue shade so the warm windows/porch lamp carry it. 22 has the moon top-right, so the key is right. */
export const SUN_EXT: Record<number, [number, number]> = {
  1: [-84, 20], 2: [-120, 24], 13: [-108, 22], 19: [-115, 22], 22: [118, 28], 23: [-110, 26], 24: [-82, 22], 25: [-140, 46], // 25: moon key from the camera side (was -78: the walls we see sat in flat blue shade)
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
  24: { right: -1.75, up: 3.75, minEl: 8 }, // camera round 2: shot 24 opens top-down; placed for the final low framing
  25: { right: -0.72, up: 0.3, minEl: 0 },
};
/** world albedo saturation outside (TONE.uSat) */
export const NIGHT_SAT = 1.0; // burglar ref: rich saturated blue night, warm windows/lanterns pop against it
