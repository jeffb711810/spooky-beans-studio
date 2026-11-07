// LOOK OVERRIDES (look-dev round 10, user: "make our video look 95% like his", "our color looks boring", "his pops /
// shines / smooth / clean / fun"). INPUT_PROPS {"look": {...}} patches the light presets, light pools, shine, grades
// and bloom without touching the source, so scripts/stills-variants.mjs can render several looks from ONE bundle.
// Production renders pass no "look" prop: everything below is then a no-op and the values in moon.ts / candle.ts /
// grade.ts / shade.ts are what you get. Once a variant is approved, bake it into those files.
import { getInputProps } from "remotion";

type Num3 = [number, number, number];
export type LookOv = {
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
export type Mood = "day" | "dayInt" | "night" | "candle";
export const MOODS: Record<Mood, LookOv> = {
  day: {"night": {"lit": [1.55, 1.47, 1.33], "shade": [0.6, 0.68, 0.82], "lift": [0.04, 0.045, 0.06], "term": 0.35, "lambert": 0.55, "charTint": [1.0, 0.98, 0.95], "sideTint": [0.98, 0.98, 1.0], "fog": "#cfddf5", "fogNear": 45, "fogFar": 300}, "nightSat": 1.0, "nightSatDark": 1.2, "sky": ["#cfddf5", "#9fb8df", "#8da7d9", "#6b8fe0", "#4f74e3"], "fogNight": "#cfddf5", "shineNight": {"specCol": [1.2, 1.15, 1.05], "poolSpecCol": [1.2, 1.15, 1.05], "sheenCol": [0.35, 0.4, 0.5]}, "extPools": {"k": 0}, "gradeNight": {"ky": [0.047, 0.115, 0.29, 0.645, 0.935, 0.988, 1], "sat": [1.0, 1.04, 1.0], "tintS": [0, 0.012], "tintM": [0, 0], "tintH": [0, 0], "vig": [0.16, 0.5]}, "ink": {"night": {"color": "#231a10", "widthNear": 4.6, "widthFar": 1.7, "distNear": 6, "distFar": 60, "farOpacity": 0.55, "ao": 0.4, "aoRadius": 1.0}}},
  dayInt: {"candle": {"lit": [1.45, 1.4, 1.3], "shade": [0.7, 0.68, 0.68], "lift": [0.07, 0.07, 0.075], "term": 0.85, "lambert": 0.75, "charTint": [1.0, 0.99, 0.97], "sideTint": [0.98, 0.98, 1.0], "fog": "#fff4e2", "fogNear": 40, "fogFar": 300}, "pools": {"k": 0, "satDark": 1.0, "sat": 1.08}, "shineCandle": {"specCol": [1.2, 1.15, 1.05], "poolSpecCol": [1.2, 1.15, 1.05], "sheenCol": [0.3, 0.28, 0.25]}, "gradeCandle": {"ky": [0.056, 0.174, 0.3, 0.612, 0.894, 0.973, 1], "sat": [0.98, 1.0, 1.0], "tintS": [0, 0.01], "tintM": [0, 0], "tintH": [0, 0], "vig": [0.3, 0.35]}, "ink": {"candle": {"ao": 1.2, "aoRadius": 0.9}}},
  night: {},
  candle: { pools: { k: 1, floor: 0.38, r: [0.6, 3.2], col: [1.9, 1.4, 0.75], cardK: 0.75, sat: 1.25 } },
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
