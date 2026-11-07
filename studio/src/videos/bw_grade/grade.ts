// COLOUR GRADE + BLOOM (owner: grade agent). Display-referred grade after the NEUTRAL tone map (bridge GradeEffect):
// 7-knot tone curve, saturation by zone, split-tint (Cb, Cr) per zone, vignette. One preset per light.
// Tuned in numpy on un-graded stills (exact shader maths): night median Y' ~0.28-0.33, p5 ~0.05-0.07, blue shadows,
// warm highlights; candle (on the candle agent's warm v1 lighting) median ~0.22-0.36, amber highlights, cool shadows.
// If the moon/candle lighting gets brighter after the merge, dial GRADE_STRENGTH down (0.7-0.85) rather than re-fit.
import { GradeParams } from "../bridge/grade";

/** exterior moonlight: lift the toe+mids (old curve crushed 0.1 -> 0.075), richer shadow/mid chroma, blue-teal
 *  shadows (Cb+, Cr-), near-neutral mids so faces stay clean, warm highlights so windows/lanterns read amber */
export const GRADE_NIGHT_BW: GradeParams = {
  ky: [0, 0.115, 0.32, 0.585, 0.815, 0.935, 1], sat: [1.3, 1.15, 1.0],
  tintS: [0.06, -0.03], tintM: [0.012, -0.008], tintH: [-0.016, 0.012], vig: [0.36, 0.36],
};
/** interior candlelight: gentle lift, shadow chroma held back (0.9) and pushed cool for depth, amber highlights,
 *  lighter vignette than before (corner/centre ~0.45-0.75 instead of ~0.3) */
export const GRADE_CANDLE: GradeParams = {
  ky: [0, 0.105, 0.29, 0.56, 0.8, 0.93, 1], sat: [0.9, 1.05, 1.02],
  tintS: [0.03, -0.02], tintM: [-0.006, 0.004], tintH: [-0.02, 0.014], vig: [0.32, 0.38],
};
export const GRADE_STRENGTH = { night: 1, candle: 1 };
/** bloom on HDR emissives only (windows, lanterns, flames, moon): softer knee + stronger, tighter glow (5 mips) */
export const BLOOM = { intensity: 0.8, threshold: 1.0, smoothing: 0.3, radius: 0.55, levels: 5 };
