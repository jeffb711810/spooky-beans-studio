// "The Bell Witch": shot timeline timed to the voice (stories/bell-witch/voice/words.json, 1.2x tightened read).
// Two places in one world: the Bell farm outside (house at the origin, graveyard at GRAVE) and the bedroom inside
// (a closed log room around x = X0). Camera grammar from the reference study: holds that creep in, smootherstep
// glides between keys, hard cuts between shots, impact kicks that flip sign every frame and decay over 7 f.
export const FPS = 30;
export const TOTAL = 2155; // voice ends at 71.14 s (f2134) + a short tail
export type V3 = [number, number, number];
export const X0 = 200; // bedroom centre x
export const GRAVE: V3 = [-34, 0, -26];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };

export type Light = "night" | "candle";
export type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number; glide?: number };
export type Shot = {
  id: number; a: number; b: number; light: Light; keys: Key[];
  creep?: number;      // push-in per frame as a fraction of the camera-target distance (0.0025 = 0.25 %/f)
  cInf?: number;       // lens blur (px at 1080 wide), 0 = sharp
  focus?: V3;          // focus point (default: look target)
};
const I = (x: number, y: number, z: number): V3 => [X0 + x, y, z]; // interior coordinates relative to the room centre
const G = (x: number, y: number, z: number): V3 => [GRAVE[0] + x, y, GRAVE[2] + z];

export const SHOTS: Shot[] = [
  // L01-02 hook: the farmhouse at night, then the family who swore
  { id: 1, a: 0, b: 129, light: "night", creep: 0.0022, keys: [{ f: 0, pos: [6, 2.1, 19], look: [0, 2.2, 0], fov: 40 }] },
  { id: 2, a: 129, b: 187, light: "night", creep: 0.003, cInf: 10, keys: [{ f: 129, pos: [0.1, 1.55, 12.6], look: [-0.1, 1.2, 6], fov: 44 }] },
  // L03 knocking: bedroom wide
  { id: 3, a: 187, b: 303, light: "candle", creep: 0.0018, keys: [{ f: 187, pos: I(-2.2, 1.75, 2.4), look: I(-2.25, 1.05, -2.0), fov: 56 }] },
  // L04 gnawing: headboard close, John in the foreground
  { id: 4, a: 303, b: 378, light: "candle", creep: 0.0025, cInf: 12, focus: I(-2.2, 1.05, -2.9),
    keys: [{ f: 303, pos: I(-2.25, 1.5, 0.7), look: I(-2.25, 1.05, -2.6), fov: 46 }] },
  // L05 tears the room apart / "No rat."
  { id: 5, a: 378, b: 443, light: "candle", creep: 0.002, cInf: 6,
    keys: [{ f: 378, pos: I(0.9, 1.45, 2.3), look: I(-0.5, 1.0, -0.8), fov: 44 }, { f: 425, glide: 12, pos: I(-0.3, 1.45, 1.7), look: I(-0.55, 1.2, -0.3), fov: 38 }] },
  // L06 covers slide off Betsy's bed
  { id: 6, a: 443, b: 496, light: "candle", creep: 0.002, keys: [{ f: 443, pos: I(2.2, 1.55, 0.9), look: I(2.2, 0.7, -2.0), fov: 46 }] },
  // L07 hair yanked
  { id: 7, a: 496, b: 557, light: "candle", creep: 0.003, cInf: 12, keys: [{ f: 496, pos: I(2.1, 1.5, 0.9), look: I(2.2, 1.2, -2.1), fov: 40 }] },
  // L08 "It's just the wind," John says (holding a candle)
  { id: 8, a: 557, b: 610, light: "candle", creep: 0.0025, cInf: 10, keys: [{ f: 557, pos: I(-0.4, 1.45, 1.0), look: I(-1.0, 1.25, -1.0), fov: 36 }] },
  // L09 the wind slaps her
  { id: 9, a: 610, b: 668, light: "candle", creep: 0.002, cInf: 8, keys: [{ f: 610, pos: I(1.6, 1.5, 1.8), look: I(1.6, 1.1, -1.8), fov: 50 }] },
  // L10 it starts talking: push into the dark corner, the candle flame bends
  { id: 10, a: 668, b: 722, light: "candle", creep: 0.0015,
    keys: [{ f: 668, pos: I(1.9, 1.5, 0.6), look: I(3.85, 1.4, -2.85), fov: 46 }, { f: 718, glide: 46, pos: I(2.7, 1.5, -0.8), look: I(3.85, 1.4, -2.85), fov: 36 }] },
  // L11 it calls itself Kate: family huddled on the big bed
  { id: 11, a: 722, b: 762, light: "candle", creep: 0.003, keys: [{ f: 722, pos: I(-2.25, 1.5, 2.6), look: I(-2.25, 1.0, -1.8), fov: 54 }] },
  // L12 sings hymns / roasts the dinner guests
  { id: 12, a: 762, b: 841, light: "candle", creep: 0.002, cInf: 6, keys: [{ f: 762, pos: I(2.35, 1.5, 2.85), look: I(2.35, 1.1, 0.2), fov: 58 }] },
  // L13 neighbors ride in from miles away
  { id: 13, a: 841, b: 948, light: "night", creep: 0.0018, keys: [{ f: 841, pos: [7.5, 1.7, 12.5], look: [0, 1.4, 3.5], fov: 42 }] },
  // L14 Kate only hates one person. John.
  { id: 14, a: 948, b: 1025, light: "candle", creep: 0.002, cInf: 8,
    keys: [{ f: 948, pos: I(-1.4, 1.3, 1.8), look: I(-2.0, 1.0, -0.75), fov: 44 }, { f: 1008, glide: 8, pos: I(-1.85, 1.3, 1.0), look: I(-2.0, 1.2, -0.75), fov: 34 }] },
  // L15 face twitches, tongue swells
  { id: 15, a: 1025, b: 1101, light: "candle", creep: 0.0025, cInf: 12, keys: [{ f: 1025, pos: I(-2.3, 1.5, 0.7), look: I(-2.4, 1.2, -2.0), fov: 36 }] },
  // L16 December 20th, 1820, John doesn't wake up
  { id: 16, a: 1101, b: 1196, light: "candle", creep: 0.0018, keys: [{ f: 1101, pos: I(0.7, 1.6, -1.6), look: I(-2.25, 0.95, -1.95), fov: 46 }] },
  // L17 the tiny bottle
  { id: 17, a: 1196, b: 1279, light: "candle", creep: 0.003, cInf: 16, focus: I(0.15, 0.85, -2.66),
    keys: [{ f: 1196, pos: I(0.25, 1.08, -1.55), look: I(-0.05, 0.9, -2.7), fov: 38 }] },
  // L18-19 one drop to the cat; the cat dies instantly
  { id: 18, a: 1279, b: 1370, light: "candle", creep: 0.002, cInf: 10, focus: I(0, 0.25, -1.9),
    keys: [{ f: 1279, pos: I(0.35, 0.65, -0.4), look: I(-0.25, 0.3, -1.9), fov: 42 }] },
  // L20 Kate laughs: the house, every window flickering
  { id: 19, a: 1370, b: 1500, light: "night", creep: 0.002, keys: [{ f: 1370, pos: [-9, 2.3, 16.5], look: [0, 2.0, 0], fov: 40 }] },
  // L21 Wait. How does a wall buy poison?
  { id: 20, a: 1500, b: 1565, light: "candle", creep: 0.003, cInf: 8, focus: I(0.15, 0.85, -2.66),
    keys: [{ f: 1500, pos: I(0.2, 1.05, -1.85), look: I(0.05, 0.98, -2.95), fov: 44, roll: 0.14 }] },
  // L22 nobody wrote it down until 1894 (the writer at the table)
  { id: 21, a: 1565, b: 1696, light: "candle", creep: 0.002, cInf: 8, keys: [{ f: 1565, pos: I(2.4, 1.35, 2.7), look: I(2.3, 1.05, 0.5), fov: 40 }] },
  // L23 the fishing story
  { id: 22, a: 1696, b: 1790, light: "night", creep: 0.0022, cInf: 8, keys: [{ f: 1696, pos: [3.3, 1.6, 12.6], look: [2.75, 1.45, 8.3], fov: 44 }] },
  // L24 a rat in the wall becomes a witch with poison (the whisper line along the fence)
  { id: 23, a: 1790, b: 1891, light: "night", creep: 0.0012,
    keys: [{ f: 1790, pos: [-2.6, 1.6, 17.6], look: [-2.6, 1.4, 12.5], fov: 50 }, { f: 1860, glide: 62, pos: [1.4, 1.6, 17.6], look: [1.4, 1.5, 12.5], fov: 50 }] },
  // L25 Kate's promise: the graveyard
  { id: 24, a: 1891, b: 2004, light: "night", creep: 0.0025, cInf: 6, focus: G(0, 0.6, 0), keys: [{ f: 1891, pos: G(1.2, 1.15, 5.2), look: G(0, 0.75, 0), fov: 40 }] },
  // L26-28 1935 / nobody saw her / nobody ever did: turn from the grave to the house, a window lights by itself
  { id: 25, a: 2004, b: TOTAL, light: "night", creep: 0.0012,
    keys: [{ f: 2004, pos: G(2.2, 1.3, 5.5), look: G(0, 0.8, 0), fov: 42 }, { f: 2060, glide: 40, pos: G(2.2, 1.6, 5.5), look: [0, 2.0, 0], fov: 30 }] },
];

/** shot covering frame f (1-based id) */
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

/** white flashes: 4-frame fade [1, .75, .45, .2] */
export const FLASHES = [187, 1335];
export const flashAt = (f: number) => { for (const a of FLASHES) if (f >= a && f < a + 4) return [1, 0.75, 0.45, 0.2][f - a]; return 0; };

/** impact kicks: frame, strength (radians of roll at the first frame) */
export const KICKS: [number, number][] = [
  [63, 0.02], [249, 0.025], [262, 0.02], [275, 0.025], [284, 0.03], [317, 0.015], [339, 0.015], [423, 0.02], [622, 0.04], [906, 0.03],
  [1008, 0.025], [1335, 0.035], [1405, 0.03], [1426, 0.02], [1855, 0.02], [2125, 0.015],
];
const kickAt = (f: number) => {
  let r = 0;
  for (const [k, a] of KICKS) { const n = f - k; if (n >= 0 && n < 7) r += a * (n % 2 ? -1 : 1) * (1 - n / 7); }
  return r;
};

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
export const camAt = (s: Shot, f: number): Cam => {
  const K = s.keys;
  // last key whose glide has started (glide into key j runs over [K[j].f - glide, K[j].f], then holds)
  let j = 0;
  for (let k = 1; k < K.length; k++) if (f >= K[k].f - (K[k].glide ?? K[k].f - K[k - 1].f)) j = k;
  let pos = K[j].pos, look = K[j].look, fov = K[j].fov ?? 40, roll = K[j].roll ?? 0;
  if (j > 0) {
    const p = K[j - 1], g = K[j].glide ?? K[j].f - p.f, u = smoother((f - (K[j].f - g)) / Math.max(1, g));
    pos = lerp3(p.pos, K[j].pos, u); look = lerp3(p.look, K[j].look, u);
    fov = (p.fov ?? 40) + ((K[j].fov ?? 40) - (p.fov ?? 40)) * u; roll = (p.roll ?? 0) + ((K[j].roll ?? 0) - (p.roll ?? 0)) * u;
  }
  // continuous creep toward the target (every hold moves)
  const c = Math.min(0.5, (s.creep ?? 0.002) * (f - s.a));
  pos = lerp3(pos, look, c);
  return { pos, look, fov, roll: roll + kickAt(f) };
};
