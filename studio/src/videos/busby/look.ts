// LOOK OVERRIDES (look-dev round 10, user: "make our video look 95% like his", "our color looks boring", "his pops /
// shines / smooth / clean / fun"). INPUT_PROPS {"look": {...}} patches the light presets, light pools, shine, grades
// and bloom without touching the source, so scripts/stills-variants.mjs can render several looks from ONE bundle.
// Production renders pass no "look" prop: everything below is then a no-op and the values in moon.ts / candle.ts /
// grade.ts / shade.ts are what you get. Once a variant is approved, bake it into those files.
import { getInputProps } from "remotion";

type Num3 = [number, number, number];
export type LookOv = { faceTint?: [number, number, number];
  night?: Record<string, unknown>;      // Partial<LightPreset> for outdoor shots (moon.ts NIGHT)
  candle?: Record<string, unknown>;     // Partial<LightPreset> for indoor shots (candle.ts CANDLE)
  pools?: Record<string, unknown>;      // candle.ts POOLS
  extPools?: Record<string, unknown>;   // moon.ts EXT_POOLS (warm lamp / window pools outdoors)
  nightSat?: number;                    // moon.ts NIGHT_SAT
  nightSatDark?: number;                // moon.ts NIGHT_SAT_DARK (pools.satDark = candle.ts POOLS_SAT_DARK)
  shineNight?: Record<string, unknown>; // moon.ts SHINE_NIGHT
  shineCandle?: Record<string, unknown>;// candle.ts SHINE_CANDLE
  gradeNight?: Record<string, unknown>; // grade.ts GRADE_NIGHT_BW
  gradeCandle?: Record<string, unknown>;// grade.ts GRADE_CANDLE
  bloom?: Record<string, unknown>;      // grade.ts BLOOM
  sky?: string[];                       // 5 night sky stops (horizon -> zenith), on-screen colours
  fogNight?: string;
  winCol?: Num3;                        // glowing window colour (linear HDR)
  grassCol?: string;                    // grass tint over grassHD (world.ts M.grass)
  paper?: boolean;                      // toon.ts STYLE.paper: matte paper heads + pinstripes
  charm?: boolean;                      // stage.ts CHARM: Rick-style "!" / "?" / anger-vein emotes on the beats
  ink?: { night?: Record<string, unknown>; candle?: Record<string, unknown> }; // Bell.tsx INK_LIGHT (incl. ao, aoRadius)
  satMulK?: number;                     // 0 = ignore the per-material outdoor saturation (SATMUL_OF), 1 = full
};
let cache: LookOv | null = null;
export const lookOv = (): LookOv => (cache ??= ((getInputProps() as { look?: LookOv }).look ?? {}));
/** RICK-STYLE characters (paper look, clean round heads, his small black eyes / simple mouths, colourful pinstriped
 *  clothes) and their emotes: the production default, and INPUT_PROPS look.paper / look.charm switch them per render */
export const PAPER_DEFAULT = true, CHARM_DEFAULT = true; // approved 2026-11-06 ("pretty good ... let's just start with this")
export const paperOn = () => lookOv().paper ?? PAPER_DEFAULT;
export const charmOn = () => lookOv().charm ?? CHARM_DEFAULT;
/** TAIL render (story.ts DISSOLVES): INPUT_PROPS tail = the dissolve's boundary frame */
export const tailOf = () => (getInputProps() as { tail?: number }).tail;
/** shallow-merge an override object onto a preset (arrays replace whole) */
export const ov = <T extends object>(base: T, patch?: Record<string, unknown>): T => (patch ? ({ ...base, ...patch } as T) : base);

/** WINCHESTER per-shot MOODS (each shot picks one; merged over the global INPUT_PROPS look):
 *  day = sunny exterior (Rick-measured palette, warm high key, blue-grey cast shadows, thinning ink),
 *  dayInt = bright interior, night = the moonlit exterior (Bell Witch night), candle = candlelit interior */
export type Mood = "day" | "dayInt" | "night" | "candle" | "pubDay" | "pubNight";
export const MOODS: Record<Mood, LookOv> = {
  day: {"night": {"lit": [1.55, 1.47, 1.33], "shade": [0.6, 0.68, 0.82], "lift": [0.04, 0.045, 0.06], "term": 0.35, "lambert": 0.55, "charTint": [1.0, 0.98, 0.95], "sideTint": [0.98, 0.98, 1.0], "fog": "#cfddf5", "fogNear": 45, "fogFar": 300}, "nightSat": 1.0, "nightSatDark": 1.2, "sky": ["#cfddf5", "#9fb8df", "#8da7d9", "#6b8fe0", "#4f74e3"], "fogNight": "#cfddf5", "shineNight": {"specCol": [1.2, 1.15, 1.05], "poolSpecCol": [1.2, 1.15, 1.05], "sheenCol": [0.35, 0.4, 0.5]}, "extPools": {"k": 0}, "gradeNight": {"ky": [0.047, 0.115, 0.29, 0.645, 0.935, 0.988, 1], "sat": [1.0, 1.04, 1.0], "tintS": [0, 0.012], "tintM": [0, 0], "tintH": [0, 0], "vig": [0.16, 0.5]}, "ink": {"night": {"color": "#231a10", "widthNear": 4.6, "widthFar": 1.7, "distNear": 6, "distFar": 60, "farOpacity": 0.55, "ao": 0.4, "aoRadius": 1.0}}},
  dayInt: {"candle": {"lit": [2.05, 1.9, 1.62], "shade": [0.92, 0.98, 1.1], "lift": [0.07, 0.07, 0.075], "term": 0.85, "lambert": 0.75, "charTint": [1.0, 0.99, 0.97], "sideTint": [0.98, 0.98, 1.0], "fog": "#fff4e2", "fogNear": 40, "fogFar": 300}, "pools": {"k": 0, "satDark": 0.95, "sat": 1.0}, "shineCandle": {"k": 1.5, "sheen": 0.3, "specCol": [1.6, 1.55, 1.4], "poolSpecCol": [1.6, 1.5, 1.3], "sheenCol": [0.42, 0.4, 0.36]}, "gradeCandle": {"ky": [0.08, 0.26, 0.45, 0.78, 0.96, 0.995, 1], "sat": [0.95, 1.0, 0.95], "tintS": [0, 0.01], "tintM": [0, 0], "tintH": [0, 0], "vig": [0.42, 0.3]}, "ink": {"candle": {"ao": 1.2, "aoRadius": 0.9}}},
  night: {},
  // BUSBY pub at night, the lamps out: moonlight through the windows, cold blue, the chair alone
  pubNight: {"faceTint": [0.95, 0.97, 1.03], "candle": {"lit": [0.8, 0.9, 1.18], "shade": [0.14, 0.18, 0.32], "lift": [0.02, 0.03, 0.06], "term": 0.4, "lambert": 0.6, "charTint": [0.8, 0.88, 1.0], "fog": "#0e1830", "fogNear": 40, "fogFar": 300},
    "pools": {"k": 1, "floor": 0.5, "floorCol": [0.16, 0.2, 0.34], "r": [1.0, 3.6], "col": [1.0, 1.12, 1.45], "cardK": 0.5, "sat": 0.95, "satDark": 0.55},
    "shineCandle": {"specCol": [0.8, 0.95, 1.3], "poolSpecCol": [0.8, 0.95, 1.4], "sheenCol": [0.15, 0.2, 0.35]}},
  // BUSBY pub by day: the warm room with SOME practical pools (lamps, fire) and a deeper shade, so the room has depth
  pubDay: {"candle": {"lit": [2.1, 1.92, 1.62], "shade": [0.92, 0.98, 1.1], "lift": [0.05, 0.05, 0.055], "term": 0.45, "lambert": 0.7, "charTint": [1.0, 0.97, 0.93], "sideTint": [0.98, 0.97, 0.98], "fog": "#f4e2c8", "fogNear": 40, "fogFar": 300},
    "pools": {"k": 0.6, "floor": 0.78, "floorCol": [0.85, 0.88, 0.95], "r": [1.0, 3.8], "col": [1.35, 1.25, 1.08], "cardK": 0.25, "sat": 0.98, "satDark": 0.9},
    "shineCandle": {"k": 1.6, "sheen": 0.32, "specCol": [1.7, 1.5, 1.2], "poolSpecCol": [1.8, 1.45, 1.0], "sheenCol": [0.5, 0.4, 0.28]},
    "gradeCandle": {"ky": [0.08, 0.26, 0.45, 0.78, 0.96, 0.995, 1], "sat": [0.95, 1.0, 0.95], "tintS": [0, 0.01], "tintM": [0, 0], "tintH": [0, 0], "vig": [0.3, 0.32]}, "ink": {"candle": {"ao": 0.5, "aoRadius": 0.7}}},
  candle: { candle: { lit: [2.0, 1.7, 1.2], shade: [0.78, 0.84, 1.0], lift: [0.04, 0.05, 0.07], term: 0.45 }, pools: { k: 1, floor: 0.82, floorCol: [0.7, 0.76, 0.92], r: [1.2, 4.4], col: [1.6, 1.38, 1.05], cardK: 0.5, sat: 1.0 }, shineCandle: { k: 1.6, sheen: 0.3 }, gradeCandle: { ky: [0.08, 0.25, 0.43, 0.76, 0.95, 0.99, 1], sat: [0.98, 1.02, 0.96], vig: [0.34, 0.3] } },
};
const merge = (a: LookOv, b: LookOv): LookOv => {
  const o: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === "object" && !Array.isArray(v) && a[k as keyof LookOv] && typeof a[k as keyof LookOv] === "object" && !Array.isArray(a[k as keyof LookOv])
    ? (k === "ink" ? { ...(a.ink ?? {}), ...Object.fromEntries(Object.entries(v as object).map(([kk, vv]) => [kk, { ...((a.ink as Record<string, object> | undefined)?.[kk] ?? {}), ...(vv as object) }])) } : { ...(a[k as keyof LookOv] as object), ...(v as object) })
    : v;
  return o as LookOv;
};
const moodCache = new Map<string, LookOv>();
export const lookFor = (s: { mood?: Mood }): LookOv => {
  if (!s.mood) return lookOv();
  let m = moodCache.get(s.mood); if (!m) { m = merge(lookOv(), MOODS[s.mood]); moodCache.set(s.mood, m); } return m;
};
