// COLOUR GRADE + BLOOM (owner: grade agent). Display-referred grade after the NEUTRAL tone map (bridge GradeEffect):
// 7-knot tone curve, saturation by zone, split-tint (Cb, Cr) per zone, vignette. One preset per light.
// Tuned in numpy on un-graded stills (exact shader maths): night median Y' ~0.28-0.33, p5 ~0.05-0.07, blue shadows,
// warm highlights; candle (on the candle agent's warm v1 lighting) median ~0.22-0.36, amber highlights, cool shadows.
// If the moon/candle lighting gets brighter after the merge, dial GRADE_STRENGTH down (0.7-0.85) rather than re-fit.
import { GradeParams } from "../bridge/grade";

/** exterior moonlight (fix round 1, "look normal"): same brightness curve, but no colour push: near-neutral
 *  saturation, only a faint cool shadow tint, light vignette */
export const GRADE_NIGHT_BW: GradeParams = {
  // light round 2: lifted blue-black toe (ink/black -> L* ~7, ref night p2 8), mids held (p50 ~32), top rolled (p98 ~86),
  // shadow tint Cb+ with Cr- so the lifted plum outlines read neutral blue, never violet (purple share < .2 %);
  // stronger vignette (ref night corner/centre .46)
  ky: [0.035, 0.125, 0.32, 0.59, 0.82, 0.935, 1], sat: [1.25, 1.12, 1.0],
  // round 9 (user: "what is that blue hue on the door" / "lets calm it"): shadow blue push 0.024 -> 0.01 (Cr- kept: never violet)
  tintS: [0.01, -0.03], tintM: [0.002, -0.01], tintH: [-0.014, 0.01], vig: [0.34, 0.38],
};
// LOOK ROUND 10: brighter mids (his night L .41), richer saturation, blue shadows / warm highlights, his vignette
Object.assign(GRADE_NIGHT_BW, { ky: [0.055, 0.2, 0.44, 0.71, 0.9, 0.97, 1], sat: [1.55, 1.42, 1.15], tintS: [0.038, -0.012], tintM: [0.012, -0.006], tintH: [-0.02, 0.018], vig: [0.4, 0.35] });
/** interior lamplight: gentle lift, neutral shadows (the old Cb+Cr+ shadow tint made every shadow magenta), faint
 *  warm highlights, light vignette */
export const GRADE_CANDLE: GradeParams = {
  // light round 2 (with the candle/hearth pools): warm-lifted toe (black -> L* ~6, ref interior p2 6), mids/top re-lifted
  // after the pools darken the room (p50 ~35, p98 ~89), saturation down (wood too orange: HSV S .62 -> ~.5),
  // stronger vignette so corners fall off (ref interior corner/centre .67)
  ky: [0.03, 0.12, 0.31, 0.58, 0.83, 0.955, 1], sat: [1.02, 0.97, 1.0],
  tintS: [0.026, -0.024], tintM: [-0.002, 0.0], tintH: [-0.022, 0.016], vig: [0.3, 0.38], // look round: cooler (Cb+ Cr-, never Cr+) shadows
};
Object.assign(GRADE_CANDLE, { ky: [0.045, 0.17, 0.41, 0.69, 0.89, 0.97, 1], sat: [1.5, 1.38, 1.12], tintS: [0.05, -0.015], tintM: [0.0, 0.006], tintH: [-0.035, 0.03], vig: [0.45, 0.3] }); // look round 10
export const GRADE_STRENGTH = { night: 1, candle: 1 };
/** bloom on HDR emissives only (windows, lanterns, flames, moon): softer knee + stronger, tighter glow (5 mips) */
export const BLOOM = { intensity: 1.35, threshold: 1.0, smoothing: 0.3, radius: 0.74, levels: 5 }; // look round 10: his lanterns glow (was .95 / .62) // wider glow (ref window r50 ~34 px @720, candle r10 ~174)
