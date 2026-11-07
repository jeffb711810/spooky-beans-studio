// CANDLELIGHT. Interior lighting: the two-tone preset for every bedroom shot, the warm rim on character cards and the
// camera-relative key-light direction per interior shot (the candle / hearth side).
// Fix round 1 (user: "the lighting is all off, make it look normal"): natural warm lamplight instead of orange key +
// plum shade. Shade is a warm neutral brown (wood stays wood, no purple seams), the key is higher (shorter, calmer cast
// shadows instead of long diagonal streaks), lighter fog, softer rim.
import { LightPreset } from "../bridge/lights";

/** warm lamplight inside the log room: soft amber key, warm-neutral brown shade, light warm haze */
// look round: cool blue-grey shade vs the warm candle key (the warm-brown shade made everything read brown)
export const CANDLE: LightPreset = {
  az: 110, el: 40,
  lit: [1.45, 1.27, 1.06], shade: [0.33, 0.345, 0.385], lift: [0.026, 0.028, 0.032], lambert: 0.45, sideK: 0.84, term: 0.22,
  charTint: [1.0, 0.93, 0.82], charShade: 0.88, charGrad: 0.12, bodyGrad: 0.22, sideTint: [0.9, 0.85, 0.8],
  blob: [0.42, 0.37, 0.33], actorShadow: true,
  top: "#141c3c", hor: "#5d6d94", skyCurve: [0.05, 0.6, 1.0], fog: "#2a2018", fogNear: 9, fogFar: 44, /* style C: clearer room (was 5..26) */ sunDisc: "#ffffff",
  sunCol: "#ffdcb8", sunI: 2.0, sky: "#3a3028", ground: "#1e1814", hemiI: 0.2,
  bias: -0.0006, normalBias: 0.02,
};
// LOOK ROUND 10 (his candle bedroom / burglar room: golden light at the source, deep blue away from it, colourfulness
// .33): a gold key over a deep blue shade; with the pools below, far corners go blue, the candle side gold
Object.assign(CANDLE, { lit: [1.85, 1.45, 0.85], shade: [0.1, 0.21, 0.52], term: 0.35, lambert: 0.55, charTint: [1.0, 0.78, 0.55], charGrad: 0.03, bodyGrad: 0.08, sideTint: [0.97, 0.95, 0.94] }); // flat paper cards
export const RIM_CANDLE: [number, [number, number, number]] = [0, [1.0, 0.76, 0.46]]; // off (see RIM_NIGHT)
/** key light per interior shot id: [azimuth deg from the shot's view axis (+ = screen right, >90 = from the camera
 *  side), elevation deg]. From the candle / hearth side, raised to 36-44 deg so shadows fall short and soft. */
// style C (user: "look at the shadows and how accurate they are"): the key swung ~35 deg further round to the camera
// side (cap 155) so the back walls / headboards behind the characters are LIT and their cast shadows land there
const SWING = (a: number) => a; // (a +35 deg swing hid every shadow straight behind its character: keep the side keys)
export const SUN_INT: Record<number, [number, number]> = Object.fromEntries(Object.entries({
  97: [-80, 30], 96: [-80, 30],
  3: [105, 38], 4: [110, 40], 5: [115, 42], 6: [110, 42], 7: [105, 40], 8: [120, 38], 9: [110, 42], 10: [-120, 36], 11: [105, 38],
  12: [100, 38], 14: [110, 38], 15: [100, 40], 16: [140, 42], 17: [-95, 34], 18: [120, 44], 20: [-95, 34], 21: [100, 40],
  // light round 2: the candle close-ups (17, 20) take a true side key from the candle side (form + shadow toward the lens)
} as Record<number, [number, number]>).map(([k, [a, e]]) => [k, [SWING(a), e]]));
/** practical light pools inside (shade.ts POOL): brightness falls from the sources (bedside candle, Betsy's crate candle,
 *  hearth) to `floor` between r[0] and r[1] metres; `col` tints right at the source; cards take `cardK` of the effect.
 *  `sat` = world albedo saturation inside (TONE.uSat). */
// light round 2: tighter, warmer pools and a deeper (still lifted by the grade toe) floor so the room reads lit FROM the
// candles/hearth; cards take less of it (heads stay V ~.93-.97); albedo saturation .86 -> .72 (wood too orange)
export const POOLS = { k: 1, floor: 0.42, floorCol: [0.12, 0.25, 0.62] as [number, number, number], r: [0.7, 3.4] as [number, number], col: [1.8, 1.42, 0.8] as [number, number, number], cardK: 0.4, sat: 1.3 }; // look round 10: gold at the candles, deep blue corners (was floor [.27,.35,.5], col [1.3,1.1,.86], sat .85)

/** SHINE indoors (look round 10; shade.ts SHINE): warm candle glints on pewter / glass / iron / polished wood */
export const SHINE_CANDLE = { k: 0.9, exp: 40, edge: 0.1, sheen: 0.15, specCol: [1.2, 0.95, 0.65] as [number, number, number], poolSpecCol: [1.5, 1.1, 0.6] as [number, number, number], sheenCol: [0.45, 0.32, 0.2] as [number, number, number] };
/** albedo saturation far from the candles / hearth and in shadow indoors (shade.ts uSatDark, uPoolVis = 1) */
export const POOLS_SAT_DARK = 0.25; // look round 10 (was .85 = off)
