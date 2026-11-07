// MOONLIGHT (owner: moon agent). Exterior night lighting: the two-tone preset for every outdoor shot, the cool rim on
// character cards, the camera-relative key-light direction per outdoor shot, and where the moon sits in each frame.
import { LIGHTS, LightPreset } from "../bridge/lights";

/** moonlit night (fix round 1: "make the lighting look normal"): a clean cartoon night. Cool silver-blue key that
 *  keeps materials their own colour (wood brown, grass green, faces peach), blue shade with G >= R (no violet), a
 *  neutral-blue lift floor, dark blue fog instead of the lavender wash */
export const NIGHT: LightPreset = {
  ...LIGHTS.night,
  lit: [1.22, 1.25, 1.36], shade: [0.29, 0.31, 0.37], // calmer x2 (user: "what is that blue hue on the door", "lets calm it"): grey-blue shade, soft silver moon (was [1.12,1.24,1.64] / [0.2,0.3,0.48], then [1.18,1.25,1.46] / [0.26,0.3,0.4]) // brighter, cleaner moonlight (user: match the reference's clean night) lift: [0.015, 0.035, 0.055], lambert: 0.35, sideK: 0.84, term: 0.12,
  lift: [0.045, 0.048, 0.062], // round 9: the inherited [0.04, 0.05, 0.1] lift turned every shaded face periwinkle (the door / posts)
  charTint: [0.88, 0.93, 1.0], charShade: 0.88, charGrad: 0.06, bodyGrad: 0.24, sideTint: [0.84, 0.88, 0.97],
  blob: [0.42, 0.45, 0.55], fog: "#2c3a58",
};
// LOOK ROUND 10 (user: "make our video look 95% like his", "our color looks boring", "his pops"; approved direction:
// "that is a million times better"). Measured on his night frames: blue share .76, L .41, colourfulness .34; ours now
// .94 / .40 / .33 (was .31 / .32 / .22). A bright royal-blue moon (hue ~225, never violet) over a deep blue shade, the
// albedo desaturated in the dark (shade.ts uSatDark) so shadows take the night's blue, warm lamp / window pools.
Object.assign(NIGHT, { lit: [1.05, 1.4, 2.45], shade: [0.09, 0.19, 0.58], lift: [0.02, 0.045, 0.13], term: 0.35, lambert: 0.5,
  fog: "#3a5cc0", charTint: [0.72, 0.82, 1.0], charGrad: 0.03, bodyGrad: 0.08, sideTint: [0.96, 0.97, 1.0] }); // flat paper cards
/** cool moon rim on character cards: [strength 0..1, linear RGB] */
export const RIM_NIGHT: [number, [number, number, number]] = [0, [0.66, 0.78, 1.0]]; // off: the shader lit the ink outline itself (light fringe)
/** key light per outdoor shot id: [azimuth deg from the shot's view axis (+ = screen right, 180 = behind camera), elevation deg]
 *  Rules: the key comes from the same screen side as the moon; low (18-24 deg) for long moon shadows; house walls get
 *  N.L either > .3 or < 0 (no terminator mush): one visible wall lit, the other in violet shade. Graveyard (24, 25 open)
 *  is side-backlit from the left so the headstone faces sit in shade, the grave tops stay lit; 25 at -78 also
 *  keeps the end view of the house split (gable lit, long wall shade). 1 at -84 (light round 2): roof lit, porch facade in
 *  blue shade so the warm windows/porch lamp carry it. 22 has the moon top-right, so the key is right. */
export const SUN_EXT: Record<number, [number, number]> = {
  99: [-120, 30],
  95: [-125, 52],
  98: [-120, 30],
  1: [-84, 20], 2: [-120, 24], 13: [-108, 22], 19: [-115, 22], 22: [118, 28], 23: [-110, 26], 24: [-82, 22], 25: [-140, 46], // 25: moon key from the camera side (was -78: the walls we see sat in flat blue shade)
};
/** moon placement in the opening frame of each outdoor shot: right / up as fractions of the half-frame, min elevation deg */
export const MOON_FRAME: { right: number; up: number; minEl: number; disc: number; halo: number } = { right: -0.42, up: 0.62, minEl: 12, disc: 2.6, halo: 13 };
/** per shot: 1 peeks over the roof ridge (sinks behind it as the camera creeps), 2 / 22 glow over the ridge at the top
 *  edge (22 top-right, clear of the fish), 19 just above the ridge, 24 / 25 low between the trunks under the crowns */
export const MOON_SHOT: Record<number, Partial<{ right: number; up: number; minEl: number }>> = {
  99: { right: -1.85, up: 0.68 },
  98: { right: -1.0, up: 0.8 },
  1: { right: -0.5, up: 0.44, minEl: 2 },
  2: { right: -0.55, up: 0.96 },
  19: { up: 0.6 },
  22: { right: 0.62, up: 0.9 },
  24: { right: -1.75, up: 3.75, minEl: 8 }, // camera round 2: shot 24 opens top-down; placed for the final low framing
  25: { right: -0.72, up: 0.3, minEl: 0 },
};
/** world albedo saturation outside (TONE.uSat) */
export const NIGHT_SAT = 0.65; // look round 10: moonlit albedo a little desaturated so the yard reads blue like his snow
/** albedo saturation in moon SHADOW (shade.ts uSatDark): low, so shadows take the blue of the night, never mauve */
export const NIGHT_SAT_DARK = 0.35;
/** night sky stops (horizon -> zenith, on-screen colours; look round 10: his saturated royal-blue gradient) */
export const NIGHT_SKY = ["#7094f8", "#5a80ee", "#4166d8", "#2b4cb8", "#16328e"];
/** grass tint at night (world.ts M.grass): darker blue-green, so the moonlit yard is not lime */
export const NIGHT_GRASS = "#3f6a78";
/** glowing window colour (linear HDR) */
export const WIN_ON: [number, number, number] = [5.8, 3.4, 1.3];

type C3 = [number, number, number];
/** SHINE outdoors (look round 10; shade.ts SHINE): cool moon glints, warm glints from lanterns / lit windows */
export const SHINE_NIGHT = { k: 0.9, exp: 40, edge: 0.1, sheen: 0.25, specCol: [0.75, 0.85, 1.1] as C3, poolSpecCol: [1.4, 0.95, 0.5] as C3, sheenCol: [0.22, 0.36, 0.8] as C3 };
/** warm light pools OUTDOORS (look round 10, reference: porch lanterns / lit windows spill warm light onto the boards and
 *  the yard): shade.ts POOL with a neutral floor (1 = no change away from the sources) and a warm boost near them.
 *  Sources: the staged lanterns first, then the porch lamp and the two front windows (when lit), up to 3. */
export const EXT_POOLS = { k: 1, r: [0.5, 4.5] as [number, number], col: [2.3, 1.6, 0.85] as C3, floorCol: [1, 1, 1] as C3, cardK: 0.35 };
