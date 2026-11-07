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
  ky: [0.075, 0.135, 0.325, 0.6, 0.815, 0.93, 1], sat: [1.0, 1.06, 1.0],
  tintS: [0.012, -0.022], tintM: [0.002, -0.004], tintH: [-0.008, 0.006], vig: [0.34, 0.38],
};
/** interior lamplight: gentle lift, neutral shadows (the old Cb+Cr+ shadow tint made every shadow magenta), faint
 *  warm highlights, light vignette */
export const GRADE_CANDLE: GradeParams = {
  // light round 2 (with the candle/hearth pools): warm-lifted toe (black -> L* ~6, ref interior p2 6), mids/top re-lifted
  // after the pools darken the room (p50 ~35, p98 ~89), saturation down (wood too orange: HSV S .62 -> ~.5),
  // stronger vignette so corners fall off (ref interior corner/centre .67)
  ky: [0.065, 0.135, 0.32, 0.595, 0.85, 0.96, 1], sat: [0.86, 0.92, 1.0],
  tintS: [-0.004, 0.003], tintM: [-0.003, 0.003], tintH: [-0.01, 0.008], vig: [0.3, 0.38],
};
export const GRADE_STRENGTH = { night: 1, candle: 1 };
/** bloom on HDR emissives only (windows, lanterns, flames, moon): softer knee + stronger, tighter glow (5 mips) */
export const BLOOM = { intensity: 0.95, threshold: 1.0, smoothing: 0.3, radius: 0.62, levels: 5 }; // wider glow (ref window r50 ~34 px @720, candle r10 ~174)
