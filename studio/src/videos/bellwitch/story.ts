// "The Bell Witch": shot timeline timed to the voice (stories/bell-witch/voice/words.json, 1.2x tightened read).
// Two places in one world: the Bell farm outside (house at the origin, graveyard at GRAVE) and the bedroom inside
// (a closed log room around x = X0). Camera grammar from the reference study: holds that creep in, smootherstep
// glides between keys (punch-ins on the punch words use ease "out": peak early, long settle), hard cuts between shots,
// impact kicks that flip sign every frame and decay over 7 f. Composition: head tops ~0.2-0.35 of the frame, eyes on the
// upper third, no faces cut by the frame edge, focus (lens blur) on the eyes in close-ups, wides sharp.
export const FPS = 30;
export const TOTAL = 2350; // WINCHESTER: voice f36-2319 + tail
export type V3 = [number, number, number];
export const X0 = 200; // bedroom centre x
export const GRAVE: V3 = [-34, 0, -26];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };

export type Light = "night" | "candle";
export type Key = {
  f: number; pos: V3; look: V3; fov?: number; roll?: number; glide?: number;
  ease?: "out";    // punch-in on a word (re-centred on its old peak, then the same symmetric glide)
  focus?: V3;      // lens focus point (default: the shot focus, else the look target); it travels with the glide
  orbit?: boolean; // glide INTO this key on an arc around the target (crane / arc): radius, azimuth, elevation blend
  via?: V3[];      // the camera passes THROUGH these points on the way into this key (even pace along the path)
  log?: boolean;   // even zoom rate: the camera-target distance blends geometrically (big dolly-ins and pull-outs)
  skew?: number;   // < 1: up to speed sooner, settle longer (reference cranes: ~45 f up to speed, ~60 f settling)
  ramp?: number;   // even-paced truck: smooth ramps of this many frames at each end, constant speed between
  cInf?: number;   // lens blur override for this key (glides with the move: blurred close-up -> sharp wide)
};
export type Shot = {
  id: number; a: number; b: number; light: Light; keys: Key[]; mood?: "day" | "dayInt" | "night" | "candle";
  creep?: number;      // push-in per frame as a fraction of the camera-target distance (0.0025 = 0.25 %/f)
  cInf?: number;       // lens blur: CoC (px at 1080 wide) of things at infinity, 0 = sharp; keys may override it (cInfAt)
  focus?: V3;          // focus point (default: the key focus, else the look target)
  rack?: [number, V3 | null, number][]; // rack focus: [frame, point (null = back to the key focus), frames]
};
const I = (x: number, y: number, z: number): V3 => [X0 + x, y, z]; // interior coordinates relative to the room centre
const G = (x: number, y: number, z: number): V3 => [GRAVE[0] + x, y, GRAVE[2] + z];
// faces (head centres) used as focus points; SIT = 0.66 sole + 0.86 (adult) / 0.7 (kid) head height
const FACE = {
  john4: I(-2.65, 1.52, -1.95), lucy4: I(-1.85, 1.52, -1.95), betsyBed: I(2.2, 1.36, -2.1), johnStand5: I(-0.6, 1.44, -0.4),
  john9: I(1.2, 1.44, -1.2), lucy11: I(-2.35, 1.52, -1.75), john14: I(-2.0, 1.44, -0.75), johnBed15: I(-2.4, 1.52, -2.0),
  john16: I(-2.25, 0.95, -2.39), lucy16: I(-3.72, 1.44, -1.4), lucy12: I(2.35, 1.44, 0.15), folk0_12: I(1.85, 1.44, 0.25), folk1_12: I(2.85, 1.44, 0.25),
  writer: I(2.3, 1.46, 0.3), fisher: [3.0, 1.44, 8.2] as V3, folk3_22: [1.95, 1.44, 9.6] as V3, porch1: [1.7, 1.69, 3.7] as V3,
};

// Camera round 3 (user: "the camera pans aren't as exciting as ricksclips3000"; "the beginning feels bland"): every shot
// carries a real move (arc / orbit, truck past a soft foreground post, crane, fly-through), snappy symmetric glides
// (18-26 f, peak ~14-25 px/f at 720p) onto the cut and punch words, rolls into the dutch angles on the scares, and the
// glides chain so ~60 % of frames move. Glides never overlap (each starts where the previous key lands).
// ===== WINCHESTER: "The House Built to Lose Ghosts" (voice starts at f36; 2350 f = 78.3 s) =====
// sets: W = the mansion exterior (x -900), F = the grand foyer (x -600), M = the small "farmhouse" (x -300)
const Wv = (x: number, y: number, z: number): V3 => [-900 + x, y, z];
const Fv = (x: number, y: number, z: number): V3 => [-600 + x, y, z];
const Mv = (x: number, y: number, z: number): V3 => [-300 + x, y, z];
export const SHOTS: Shot[] = [
  // 1 the garden fly-through: low over the path between the hedges, rising toward the cupola, into a dip to white
  { id: 101, a: 0, b: 62, light: "night", mood: "day", cInf: 0, keys: [{ f: 0, pos: Wv(0.5, 1.45, 55), look: Wv(1.3, 4.4, 0), fov: 56 },
    { f: 61, glide: 61, via: [Wv(0.9, 2.1, 31)], pos: Wv(4.1, 7.5, 9.5), look: Wv(4.0, 7.6, 0), fov: 50 }] },
  // 2 HOOK: the staircase that runs into the ceiling; a worker with a plank bonks his head
  { id: 102, a: 62, b: 110, light: "candle", mood: "dayInt", cInf: 0, keys: [{ f: 62, pos: Fv(3.95, 0.85, 2.7), look: Fv(4.0, 2.4, -1.6), fov: 60 },
    { f: 109, glide: 47, pos: Fv(3.95, 1.25, 1.5), look: Fv(4.0, 2.75, -1.8), fov: 58 }] },
  // 3 the Door to Nowhere: push in, it swings open, a worker windmills on the edge, tilt down the drop
  { id: 103, a: 110, b: 186, light: "night", mood: "day", cInf: 0, keys: [{ f: 110, pos: Wv(17.6, 3.6, 9.0), look: Wv(17.6, 4.5, -0.4), fov: 50 },
    { f: 150, glide: 34, pos: Wv(17.6, 4.3, 5.2), look: Wv(17.6, 4.6, -0.4), fov: 50 },
    { f: 185, glide: 30, pos: Wv(17.6, 5.4, 3.4), look: Wv(17.6, 0.8, 0.8), fov: 62 }] },
  // 4 the big reveal: crane back from the door to the whole mansion; Sarah in the garden with her blueprint
  { id: 104, a: 186, b: 295, light: "night", mood: "day", cInf: 0, keys: [{ f: 186, pos: Wv(15.5, 4.6, 9.5), look: Wv(13.0, 4.4, 0), fov: 56 },
    { f: 294, glide: 100, log: true, via: [Wv(2.0, 4.2, 24)], pos: Wv(1.4, 1.6, 31.5), look: Wv(1.0, 4.4, 0), fov: 58 }] },
  // 5 1881: Sarah at the mantel, the baby's and William's portraits, candlelight
  { id: 105, a: 295, b: 434, light: "candle", mood: "candle", cInf: 24, creep: 0.0012, keys: [{ f: 295, pos: Fv(2.15, 1.3, -3.55), look: Fv(3.95, 1.22, -5.4), fov: 48 }] },
  // 6 the fortune: coins pile up on the desk; punch-in on "a day"
  { id: 106, a: 434, b: 567, light: "candle", mood: "dayInt", cInf: 22, keys: [{ f: 434, pos: Fv(-2.45, 1.55, -2.3), look: Fv(-2.45, 1.0, -4.1), fov: 50 },
    { f: 545, glide: 10, ease: "out", pos: Fv(-2.45, 1.42, -2.85), look: Fv(-2.45, 1.08, -4.3), fov: 46 }] },
  // 7 the psychic: orbit the séance table, snap to Sarah on "revenge", punch the psychic on "Build."
  { id: 107, a: 567, b: 818, light: "candle", mood: "candle", cInf: 26, keys: [{ f: 567, pos: Fv(0.95, 1.58, 3.3), look: Fv(0.02, 1.22, 0.45), fov: 52 },
    { f: 632, glide: 65, pos: Fv(0.75, 1.55, 3.1), look: Fv(-0.05, 1.22, 0.45), fov: 50 },
    { f: 726, glide: 92, pos: Fv(-0.85, 1.45, 2.85), look: Fv(-0.42, 1.3, 0.45), fov: 48 },
    { f: 733, glide: 1, pos: Fv(0.7, 1.4, 3.05), look: Fv(0.62, 1.4, 1.9), fov: 44 },
    { f: 762, glide: 1, pos: Fv(-0.42, 1.4, 2.6), look: Fv(-0.42, 1.38, 0.55), fov: 44 },
    { f: 790, glide: 8, ease: "out", pos: Fv(-0.42, 1.36, 2.0), look: Fv(-0.42, 1.36, 0.55), fov: 42 }] },
  // 8 the time-lapse: the little farmhouse, the mansion under scaffolding, day / night / day / night
  { id: 108, a: 818, b: 876, light: "night", mood: "day", cInf: 0, keys: [{ f: 818, pos: Mv(1.0, 1.7, 25), look: Mv(-0.1, 3.4, 0), fov: 56 }] },
  { id: 109, a: 876, b: 924, light: "night", mood: "day", cInf: 0, keys: [{ f: 876, pos: Wv(8.5, 3.2, 19.5), look: Wv(8.3, 6.2, 0), fov: 56 }] },
  { id: 110, a: 924, b: 941, light: "night", mood: "night", cInf: 0, keys: [{ f: 924, pos: Wv(8.5, 3.2, 19.5), look: Wv(8.3, 6.2, 0), fov: 56 }] },
  { id: 111, a: 941, b: 958, light: "night", mood: "day", cInf: 0, keys: [{ f: 941, pos: Wv(8.5, 3.2, 19.5), look: Wv(8.3, 6.2, 0), fov: 56 }] },
  { id: 112, a: 958, b: 990, light: "night", mood: "night", cInf: 0, keys: [{ f: 958, pos: Wv(8.5, 3.2, 19.5), look: Wv(8.3, 6.2, 0), fov: 56 },
    { f: 989, glide: 31, pos: Wv(9.0, 7.0, 31), look: Wv(7.0, 8.0, 0), fov: 60 }] },
  // 9 the remodel gag: a guy with a paint roller flops into the armchair
  { id: 113, a: 990, b: 1069, light: "candle", mood: "dayInt", cInf: 20, keys: [{ f: 990, pos: Fv(4.05, 1.45, -3.35), look: Fv(2.05, 1.2, -4.5), fov: 54 }] },
  // 10 a hundred and sixty rooms: crane up over the sprawl of roofs
  { id: 114, a: 1069, b: 1141, light: "night", mood: "day", cInf: 0, keys: [{ f: 1069, pos: Wv(19.5, 9.75, 2.8), look: Wv(19.5, 9.1, -2.6), fov: 44 },
    { f: 1140, glide: 68, log: true, via: [Wv(13, 15, 14)], pos: Wv(2, 30, 30), look: Wv(2, 3, -6), fov: 58 }] },
  // 11 doors into walls / windows in the floor / the switchback staircase
  { id: 115, a: 1141, b: 1179, light: "candle", mood: "dayInt", cInf: 18, keys: [{ f: 1141, pos: Fv(2.3, 1.45, 3.0), look: Fv(4.3, 1.3, 1.85), fov: 52 }] },
  { id: 116, a: 1179, b: 1219, light: "candle", mood: "dayInt", cInf: 0, keys: [{ f: 1179, pos: Fv(-2.3, 1.85, 3.25), look: Fv(-2.3, 0.7, 0.9), fov: 52 }] },
  { id: 117, a: 1219, b: 1310, light: "candle", mood: "dayInt", cInf: 0, keys: [{ f: 1219, pos: Fv(-3.6, 1.75, -4.2), look: Fv(-3.45, 1.5, -8.0), fov: 56 },
    { f: 1309, glide: 90, pos: Fv(-3.6, 2.05, -4.55), look: Fv(-3.45, 1.95, -8.3), fov: 54 }] },
  // 12 thirteens: the 13-hour clock, the 13 numbered doors (whip along the gallery), the 13-hole drain, the will
  { id: 118, a: 1310, b: 1372, light: "candle", mood: "dayInt", cInf: 16, keys: [{ f: 1310, pos: Fv(-2.6, 1.95, 2.3), look: Fv(-4.2, 1.92, 2.3), fov: 40 },
    { f: 1371, glide: 50, pos: Fv(-3.1, 1.93, 2.3), look: Fv(-4.2, 1.92, 2.3), fov: 36 }] },
  { id: 119, a: 1372, b: 1410, light: "candle", mood: "dayInt", cInf: 0, keys: [{ f: 1372, pos: Fv(0, 4.7, 2.0), look: Fv(-4.5, 4.9, -2.6), fov: 56 },
    { f: 1409, glide: 34, pos: Fv(0, 4.7, 2.0), look: Fv(4.5, 4.9, -2.6), fov: 56 }] },
  { id: 120, a: 1410, b: 1465, light: "candle", mood: "dayInt", cInf: 14, keys: [{ f: 1410, pos: Fv(3.45, 1.62, -7.0), look: Fv(3.9, 0.88, -7.6), fov: 40 }] },
  { id: 121, a: 1465, b: 1529, light: "candle", mood: "dayInt", cInf: 22, keys: [{ f: 1465, pos: Fv(1.9, 1.5, -2.2), look: Fv(3.05, 1.3, -3.85), fov: 46 }] },
  // 13 midnight: the bell tolls in the belvedere; Sarah at her desk by one candle, "Allegedly" side-eye snap
  { id: 122, a: 1529, b: 1580, light: "night", mood: "night", cInf: 0, keys: [{ f: 1529, pos: Wv(14, 6.0, 12), look: Wv(19.5, 9.2, -3), fov: 44 },
    { f: 1579, glide: 50, pos: Wv(15.5, 7.0, 9.5), look: Wv(19.5, 9.3, -3), fov: 40 }] },
  { id: 123, a: 1580, b: 1638, light: "candle", mood: "candle", cInf: 24, keys: [{ f: 1580, pos: Fv(-2.45, 1.5, -2.2), look: Fv(-2.45, 1.15, -4.4), fov: 48 },
    { f: 1617, glide: 6, ease: "out", pos: Fv(-2.45, 1.48, -3.05), look: Fv(-2.45, 1.42, -4.6), fov: 42 }] },
  // 14 1906: the earthquake topples the tall tower; Sarah dusts off and unrolls a new plan
  { id: 124, a: 1638, b: 1735, light: "night", mood: "day", cInf: 0, keys: [{ f: 1638, pos: Wv(9.0, 1.5, 24), look: Wv(12.0, 10.0, -6), fov: 66 }] },
  { id: 125, a: 1735, b: 1770, light: "night", mood: "day", cInf: 22, keys: [{ f: 1735, pos: Wv(1.4, 1.5, 28.6), look: Wv(0.8, 1.35, 25.5), fov: 46 }] },
  // 15 1922: night, scaffolding, workers hammering; a window goes dark; the hammering stops
  { id: 126, a: 1770, b: 1924, light: "night", mood: "night", cInf: 0, creep: 0.0009, keys: [{ f: 1770, pos: Wv(8.5, 3.2, 20.5), look: Wv(8.2, 6.0, 0), fov: 54 }] },
  // 16 the nails left half hammered in
  { id: 127, a: 1924, b: 2036, light: "candle", mood: "dayInt", cInf: 30, keys: [{ f: 1924, pos: Fv(-3.95, 1.62, -6.95), look: Fv(-4.45, 1.55, -7.4), fov: 32 },
    { f: 2035, glide: 80, pos: Fv(-3.6, 0.6, -6.6), look: Fv(-4.2, 0.05, -7.3), fov: 40 }] },
  // 17 the historian shrugs; Sarah happily drawing plans
  { id: 128, a: 2036, b: 2100, light: "candle", mood: "dayInt", cInf: 22, keys: [{ f: 2036, pos: Fv(-2.45, 1.5, -2.25), look: Fv(-2.45, 1.3, -4.2), fov: 48 }] },
  { id: 129, a: 2100, b: 2185, light: "candle", mood: "dayInt", cInf: 22, creep: 0.0012, keys: [{ f: 2100, pos: Fv(-2.1, 1.45, -2.4), look: Fv(-2.45, 1.2, -4.3), fov: 46 }] },
  // 18 today: tourists lost in the foyer; then out to the garden, the house one last time
  { id: 130, a: 2185, b: 2274, light: "candle", mood: "dayInt", cInf: 0, keys: [{ f: 2185, pos: Fv(-0.5, 1.75, 3.3), look: Fv(0.3, 1.5, -6), fov: 66 },
    { f: 2273, glide: 88, pos: Fv(0.4, 2.1, 2.6), look: Fv(0.6, 1.6, -6), fov: 66 }] },
  { id: 131, a: 2274, b: 2350, light: "night", mood: "day", cInf: 0, keys: [{ f: 2274, pos: Wv(2.0, 1.8, 26), look: Wv(1.8, 4.6, 0), fov: 58 },
    { f: 2349, glide: 75, log: true, pos: Wv(3.0, 7.5, 52), look: Wv(2.0, 7.2, 0), fov: 58 }] },
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** shot at f; in a TAIL render (tail = a DISSOLVES boundary) the shot that ENDS there keeps running through its dissolve */
export const shotAtT = (f: number, tail?: number) => {
  const d = tail !== undefined ? DISSOLVES[tail] : 0;
  return d && f >= tail! && f < tail! + d ? SHOTS.find((s) => s.b === tail) ?? shotAt(f) : shotAt(f);
};

/** white flashes: 4-frame fade [1, .75, .45, .2] */
export const DIPS: [number, number, number][] = [[50, 62, 74], [866, 876, 886]];
export const flashAt = (f: number) => { for (const [a, m, e] of DIPS) { if (f >= a && f < m) return smooth((f - a) / (m - a)); if (f >= m && f < e) return 1 - smooth((f - m) / (e - m)); } return 0; };

/** impact kicks: frame, strength (radians of roll at the first frame) */
export const KICKS: [number, number][] = [
  [92, 0.02], [1162, 0.022], [790, 0.026], [545, 0.012], [1618, 0.01], [880, 0.008], [894, 0.008], [908, 0.008], [1790, 0.006], [1812, 0.006], [1834, 0.006], [1856, 0.006], [1878, 0.006],
  [1650, 0.020], [1655, 0.040], [1660, 0.030], [1665, 0.020], [1670, 0.040], [1675, 0.030], [1680, 0.020], [1685, 0.040], [1690, 0.030], [1695, 0.020], [1700, 0.040], [1705, 0.030], [1710, 0.020],
]
const kickAt = (f: number) => {
  let r = 0;
  for (const [k, a] of KICKS) { const n = f - k; if (n >= 0 && n < 7) r += (a / 0.012) * (n % 2 ? -1 : 1) * Math.pow(1 - n / 7, 1.5); }
  return r;
};

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
/** shots whose holds are locked dead still like the reference's action / explanation holds (round 9) */
const STILL_HOLDS = new Set<number>([95, 96, 97, 98, 99, 108, 109, 110, 111, 116, 120]); // round 10: + 8 ("just the wind") and 16 (the rack to Lucy) hold still
const NORM = new WeakMap<Shot, Key[]>();
const GLIDE_MAX = 36; // round 9: his flights run 0.8-1.5 s with an S-curve (was 30)
/** keys with every glide >= 18 f (cuts = glide 1 stay cuts); a short "out" punch is re-centred on its old peak frame */
const keysOf = (s: Shot): Key[] => {
  let K = NORM.get(s);
  if (!K) {
    // ROUND 9, RICK'S CAMERA (user: "I want our camera to mimic his"): no 18-24 f punch-ins on words (he holds), and a
    // LEVEL horizon (he never tilts: every key roll is zeroed; the brief impact jolts stay)
    // ...and no glide that runs into the shot's end (within 6 f of the cut): he HOLDS, then the cut's flight does the move
    // (the final pull-out of the film stays)
    K = s.keys.filter((k, i) => s.id > 100 || i === 0 || k.glide === undefined || k.glide <= 1 || (k.glide > 24 && (s.b - k.f > 6 || s.id === 25))).map((k0, i) => {
      const k = { ...k0, roll: 0 };
      if (i === 0 || k.glide === undefined || k.glide <= 1) return k;
      // HOLD + FLIGHT (camera study: he holds calmly ~half the time, then flies 1-1.5 s): in-shot glides are capped at
      // GLIDE_MAX frames, centred on the same peak (the beat stays on its word); tracking moves (paths, even trucks,
      // the wagon ride, the bubble truck) and the final crane keep their length
      const keep = !!k.via || !!k.ramp || s.id === 13 || s.id === 23 || s.id === 25;
      const g = keep ? Math.max(18, k.glide) : Math.min(GLIDE_MAX, Math.max(18, k.glide)), peak = k.ease === "out" ? k.f - k.glide * 0.71 : k.f - k.glide / 2;
      return { ...k, glide: g, f: Math.round(Math.max(s.a + g, peak + g / 2)) };
    });
    NORM.set(s, K);
  }
  return K;
};
/** Catmull-Rom through pts (phantom end points), sampled into an arc-length table: travel at an even pace along the path */
const PATHS = new WeakMap<Key, { pts: V3[]; cum: number[] }>();
const crPoint = (P: V3[], t: number): V3 => {
  const n = P.length - 1, seg = Math.min(n - 1, Math.floor(t * n)), u = t * n - seg;
  const p1 = P[seg], p2 = P[seg + 1], p0 = seg > 0 ? P[seg - 1] : sub3(lerp3(p1, p2, -1), [0, 0, 0]), p3 = seg + 2 <= n ? P[seg + 2] : lerp3(p1, p2, 2);
  const u2 = u * u, u3 = u2 * u, o: number[] = [];
  for (let c = 0; c < 3; c++) o.push(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * u + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3));
  return o as V3;
};
const pathAt = (k: Key, from: V3, u: number): V3 => {
  let T = PATHS.get(k);
  if (!T) {
    const P = [from, ...(k.via ?? []), k.pos], pts: V3[] = [], cum = [0];
    for (let i = 0; i <= 96; i++) { pts.push(crPoint(P, i / 96)); if (i) cum.push(cum[i - 1] + len3(sub3(pts[i], pts[i - 1]))); }
    T = { pts, cum }; PATHS.set(k, T);
  }
  const L = T.cum[T.cum.length - 1] * clamp01(u);
  let i = 1; while (i < T.cum.length - 1 && T.cum[i] < L) i++;
  const a = T.cum[i - 1], b = T.cum[i];
  return lerp3(T.pts[i - 1], T.pts[i], b > a ? (L - a) / (b - a) : 0);
};
/** spherical blend of the camera offset around the (moving) target: cranes and arcs keep their distance */
const orbitAt = (o0: V3, o1: V3, look: V3, u: number): V3 => {
  const r0 = len3(o0), r1 = len3(o1);
  const e0 = Math.asin(Math.max(-1, Math.min(1, o0[1] / r0))), e1 = Math.asin(Math.max(-1, Math.min(1, o1[1] / r1)));
  const a0 = Math.atan2(o0[0], o0[2]); let a1 = Math.atan2(o1[0], o1[2]);
  if (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; else if (a0 - a1 > Math.PI) a1 += 2 * Math.PI;
  const r = r0 * Math.pow(r1 / r0, u), e = e0 + (e1 - e0) * u, az = a0 + (a1 - a0) * u;
  return [look[0] + r * Math.cos(e) * Math.sin(az), look[1] + r * Math.sin(e), look[2] + r * Math.cos(e) * Math.cos(az)];
};
/** trapezoid speed profile: smoothstep ramps over fraction r at each end, cruise between (long trucks at an even pace
 *  peak at 1/(1-r) x the mean speed instead of smootherstep's 1.875x) */
const rampAt = (x: number, r: number) => {
  const S = (t: number) => t * t * t - (t * t * t * t) / 2; // integral of smoothstep, S(1) = 0.5
  const v = x < r ? r * S(x / r) : x > 1 - r ? 1 - r - r * S((1 - x) / r) : r / 2 + (x - r);
  return clamp01(v / (1 - r));
};
type Pose = Cam & { focus: V3; cInf: number };
/** the keyed pose at f before the creep and the kicks */
const poseAt = (s: Shot, f: number): Pose => {
  const K = keysOf(s);
  // last key whose glide has started (glide into key j runs over [K[j].f - glide, K[j].f], then holds)
  let j = 0;
  for (let k = 1; k < K.length; k++) if (f >= K[k].f - (K[k].glide ?? K[k].f - K[k - 1].f)) j = k;
  const k = K[j], fo = (q: Key) => q.focus ?? s.focus ?? q.look, ci = (q: Key) => q.cInf ?? s.cInf ?? 0;
  if (j === 0) return { pos: k.pos, look: k.look, fov: k.fov ?? 40, roll: k.roll ?? 0, focus: fo(k), cInf: ci(k) };
  const p = K[j - 1], g = k.glide ?? k.f - p.f, x = clamp01((f - (k.f - g)) / Math.max(1, g));
  // reference: symmetric ease-in-out; `skew` < 1 gets up to speed sooner and settles longer (crane profile)
  const u = k.ramp ? rampAt(x, Math.min(0.5, k.ramp / g)) : smoother(k.skew ? Math.pow(x, k.skew) : x);
  let uL = u;
  if (k.log) { // even zoom rate: the camera-target distance blends geometrically
    const r = len3(sub3(k.pos, k.look)) / len3(sub3(p.pos, p.look));
    if (Math.abs(Math.log(r)) > 0.05) uL = (1 - Math.pow(r, u)) / (1 - r);
  }
  const look = lerp3(p.look, k.look, uL);
  const pos = k.via ? pathAt(k, p.pos, uL) : k.orbit ? orbitAt(sub3(p.pos, p.look), sub3(k.pos, k.look), look, u) : lerp3(p.pos, k.pos, uL);
  return { pos, look, fov: (p.fov ?? 40) + ((k.fov ?? 40) - (p.fov ?? 40)) * u, roll: (p.roll ?? 0) + ((k.roll ?? 0) - (p.roll ?? 0)) * u,
    focus: lerp3(fo(p), fo(k), uL), cInf: ci(p) + (ci(k) - ci(p)) * u };
};
/** lens focus point at f: the face that speaks or reacts; it travels with the camera on moves between subjects and
 *  racks between faces on the shot's `rack` list */
export const focusAt = (s: Shot, f: number): V3 => {
  const base = poseAt(s, f).focus;
  let cur = base;
  for (const [r0, pt, n] of s.rack ?? []) if (f >= r0) cur = lerp3(cur, pt ?? base, smoother((f - r0) / Math.max(1, n)));
  return cur;
};
/** whip pans (reference: at most one, always smeared): frames whose camera moves faster than this get the
 *  directional motion blur in Bell.tsx (px/f at 720x1280, measured at the frame centre) */
export const WHIP_PXF = 45;
/** lens blur at f (CoC in px at 1080 wide for things at infinity) */
export const cInfAt = (s: Shot, f: number) => poseAt(s, f).cInf;
/** in-shot cuts: keys with glide <= 1 jump. The latest cut at or before f (else the shot start) restarts the creep. */
const isCutKey = (k: Key) => k.glide !== undefined && k.glide <= 1;
const cutStart = (s: Shot, f: number) => { let a = s.a; for (const k of keysOf(s)) if (isCutKey(k) && k.f <= f) a = k.f; return a; };
/** true if a hard cut happens between f - 1 and f (the whip blur must not smear across it) */
export const isCut = (s: Shot, f: number) => keysOf(s).some((k) => isCutKey(k) && k.f === f);
// ---- CAMERA FLIGHTS THROUGH THE CUTS (user: "better camera work like his"; camera study in HANDOFF.md) ----
// The reference almost never shows a bare cut: every change of framing rides a fast eased camera move (rush zoom into
// a face, crane dive, pull-out reveal, whip pan). Here every shot change (and every in-shot cut) becomes one: the
// outgoing shot accelerates into the move over its last T_OUT frames (ease-in, peak speed on its last frame), the
// incoming shot starts at that same speed and settles over T_IN frames (ease-out), so the eye reads ONE continuous
// flight and the zoom / directional blur (Bell.tsx) smears the join. Peak speeds from the study (ours: 1080 x 30 fps):
// zoom ~9 %/frame, whips ~70 px/frame, cranes ~55 px/frame.
export type Rush = "in" | "out" | "up" | "down" | "left" | "right";
export const TRANS: Record<number, Rush> = {
  110: "out", 186: "out", 295: "in", 434: "right", 567: "in", 818: "out", 990: "in", 1069: "up", 1141: "right", 1179: "down", 1219: "left", 1310: "in", 1372: "right", 1410: "down", 1465: "left", 1529: "up", 1580: "in", 1638: "out", 1735: "in", 1770: "out", 1924: "in", 2036: "right", 2100: "in", 2185: "out", 2274: "out",
}
/** DISSOLVES (round 10, user on his grave-bell clips: "he has free cam sometimes then fades into a different part of the
 *  story"): the big jumps in time or place cross-dissolve over D frames (his ~0.45 s) instead of riding a rush. The
 *  outgoing shot keeps playing through the dissolve: it is rendered separately as a TAIL (input prop tail = boundary
 *  frame, shotAtT below) and faded out over the incoming shot at assembly (out/bell/final/dissolve.py). The incoming
 *  shots there already open on a free-cam move (the wagon truck, the crane over John's bed, the crane down to the
 *  headstone, the final crane-out). */
export const DISSOLVES: Record<number, number> = {};
// round 10 (camera split vs his clips: static 21 / creep 32 / move 24 / rush 24 %; ours was 14 / 32 / 19 / 35): same peak
// speeds, shorter windows (was 9 + 15 f), so each cut is one snappy rush instead of a long one -> 18 / 33 / 19 / 30
const T_OUT = 7, T_IN = 10, ZOOM_PK = 0.09, WHIP_PK = 0.026, CRANE_PK = 0.021; // per-frame peaks: log-zoom, rad, x distance
const TB = Object.keys(TRANS).map(Number).sort((a, b) => a - b);
/** per boundary: incoming frames (tin) and the NEXT boundary's outgoing frames share a short gap in proportion */
const WIN = new Map<number, { tin: number; tout: number }>();
TB.forEach((B, i) => { if (!WIN.has(B)) WIN.set(B, { tin: T_IN, tout: T_OUT }); });
TB.forEach((B, i) => {
  if (i === TB.length - 1) return;
  const g = TB[i + 1] - B;
  if (g < T_IN + T_OUT) { const tin = Math.round((g * T_IN) / (T_IN + T_OUT)); WIN.get(B)!.tin = tin; WIN.get(TB[i + 1])!.tout = g - tin; }
});
/** the rush acting on frame f: amount (0..1 along the move's ease), side (-1 outgoing, +1 incoming), that side's length */
export const rushAt = (f: number): { t: Rush; u: number; side: -1 | 1; B: number; n: number } | null => {
  for (const B of TB) {
    const { tin, tout } = WIN.get(B)!;
    if (f >= B - tout && f < B) { const x = (f - (B - tout) + 1) / tout; return { t: TRANS[B], u: x * x * x, side: -1, B, n: tout }; }
    if (f >= B && f < B + tin) { const x = 1 - (f - B) / tin; return { t: TRANS[B], u: x * x * x, side: 1, B, n: tin }; }
  }
  return null;
};
/** total travel of a side so both meet at the same speed (x^3 ease: peak speed = 3 A / n) */
const amp = (pk: number, n: number) => (pk * n) / 3;
const applyRush = (pos: V3, look: V3, f: number): [V3, V3] => {
  const r = rushAt(f);
  if (!r) return [pos, look];
  const off = sub3(pos, look), d = len3(off);
  if (r.t === "in" || r.t === "out") {
    // log-distance: "in" closes in through the cut (outgoing ends close, incoming starts far), "out" the reverse
    const dir = r.t === "in" ? 1 : -1, z = amp(ZOOM_PK, r.n) * r.u * dir * (r.side < 0 ? -1 : 1);
    const k = Math.exp(z);
    return [[look[0] + off[0] * k, look[1] + off[1] * k, look[2] + off[2] * k], look];
  }
  if (r.t === "left" || r.t === "right") {
    // whip: yaw the view about the camera; outgoing turns toward the side, incoming arrives from the other side
    const sgn = r.t === "right" ? -1 : 1, a = amp(WHIP_PK, r.n) * r.u * sgn * (r.side < 0 ? 1 : -1);
    const fx = look[0] - pos[0], fz = look[2] - pos[2], c = Math.cos(a), sn = Math.sin(a);
    return [pos, [pos[0] + fx * c + fz * sn, look[1], pos[2] - fx * sn + fz * c]];
  }
  // crane: camera + target travel vertically together; "down" dives (outgoing sinks, incoming arrives from above)
  const sgn = r.t === "up" ? 1 : -1, dy = amp(CRANE_PK, r.n) * d * r.u * sgn * (r.side < 0 ? 1 : -1);
  return [[pos[0], pos[1] + dy, pos[2]], [look[0], look[1] + dy, look[2]]];
};
export const camAt = (s: Shot, f: number): Cam => {
  let { pos, look } = poseAt(s, f);
  const { fov, roll } = poseAt(s, f);
  // continuous creep toward the target (every hold moves); restarts at every in-shot cut
  // ROUND 9: his holds are LOCKED (action / explanation beats) or creep ~0.1 %/f; ours had a 0.15 %/f floor (never still)
  const cr = STILL_HOLDS.has(s.id) || (s.id > 100 && s.keys.length > 1) ? 0 : Math.min(0.0011, Math.max(0.0008, s.creep ?? 0.001));
  const c = Math.min(0.5, cr * (f - cutStart(s, f)));
  pos = lerp3(pos, look, c);
  // kick: ~3 px at 720p per unit (image offset, camera and target move together), roll 0.004 rad per unit
  const kk = kickAt(f), L = Math.hypot(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]);
  const dy = kk * (3 / 640) * Math.tan((fov * Math.PI) / 360) * L;
  if (dy) { pos = [pos[0], pos[1] + dy, pos[2]]; look = [look[0], look[1] + dy, look[2]]; }
  [pos, look] = applyRush(pos, look, f);
  return { pos, look, fov, roll: roll + kk * 0.004 };
};
