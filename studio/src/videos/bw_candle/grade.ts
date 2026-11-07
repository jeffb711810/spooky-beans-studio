// COLOUR GRADE + BLOOM (owner: grade agent). Display-referred grade after the NEUTRAL tone map (bridge GradeEffect):
// 7-knot tone curve, saturation by zone, split-tone tints (Cb, Cr), vignette. One preset per light.
import { GradeParams } from "../bridge/grade";

export const GRADE_NIGHT_BW: GradeParams = {
  ky: [0, 0.075, 0.22, 0.5, 0.77, 0.91, 1], sat: [0.8, 0.88, 0.92],
  tintS: [0.03, -0.012], tintM: [0.004, -0.014], tintH: [-0.004, -0.004], vig: [0.42, 0.32],
};
export const GRADE_CANDLE: GradeParams = {
  ky: [0, 0.07, 0.21, 0.5, 0.78, 0.92, 1], sat: [0.85, 0.95, 0.95],
  tintS: [0.03, -0.004], tintM: [0, 0], tintH: [-0.014, 0.012], vig: [0.5, 0.3],
};
export const GRADE_STRENGTH = { night: 1, candle: 1 };
/** bloom on HDR emissives only (windows, lanterns, flames, moon) */
export const BLOOM = { intensity: 0.6, threshold: 1.0, smoothing: 0.2, radius: 0.6, levels: 6 };
