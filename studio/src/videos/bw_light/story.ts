// "The Bell Witch": shot timeline timed to the voice (stories/bell-witch/voice/words.json, 1.2x tightened read).
// Two places in one world: the Bell farm outside (house at the origin, graveyard at GRAVE) and the bedroom inside
// (a closed log room around x = X0). Camera grammar from the reference study: holds that creep in, smootherstep
// glides between keys (punch-ins on the punch words use ease "out": peak early, long settle), hard cuts between shots,
// impact kicks that flip sign every frame and decay over 7 f. Composition: head tops ~0.2-0.35 of the frame, eyes on the
// upper third, no faces cut by the frame edge, focus (lens blur) on the eyes in close-ups, wides sharp.
export const FPS = 30;
export const TOTAL = 2155; // voice ends at 71.14 s (f2134) + a short tail
export type V3 = [number, number, number];
export const X0 = 200; // bedroom centre x
export const GRAVE: V3 = [-34, 0, -26];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };

export type Light = "night" | "candle";
export type Key = { f: number; pos: V3; look: V3; fov?: number; roll?: number; glide?: number; ease?: "out" }; // ease "out": punch-in (fast start, long settle)
export type Shot = {
  id: number; a: number; b: number; light: Light; keys: Key[];
  creep?: number;      // push-in per frame as a fraction of the camera-target distance (0.0025 = 0.25 %/f)
  cInf?: number;       // lens blur (px at 1080 wide), 0 = sharp
  focus?: V3;          // focus point (default: look target)
};
const I = (x: number, y: number, z: number): V3 => [X0 + x, y, z]; // interior coordinates relative to the room centre
const G = (x: number, y: number, z: number): V3 => [GRAVE[0] + x, y, GRAVE[2] + z];

export const SHOTS: Shot[] = [
  // L01-02 hook: the farmhouse at night (fence rails as foreground), push in on "murdered" (63), tilt on "didn't exist" (97-108)
  { id: 1, a: 0, b: 129, light: "night", creep: 0.0015,
    keys: [{ f: 0, pos: [6, 2.0, 19.5], look: [0.2, 2.2, 0], fov: 40 },
      { f: 80, glide: 24, ease: "out", pos: [4.9, 1.9, 16.2], look: [0.6, 2.05, 1.5], fov: 39 },
      { f: 118, glide: 22, pos: [4.6, 1.85, 15.4], look: [0.7, 2.0, 1.5], fov: 38, roll: -0.05 }] },
  // the family who swore: punch in on "swore" (156)
  { id: 2, a: 129, b: 187, light: "night", creep: 0.002, cInf: 12, focus: [-0.1, 1.45, 6.1],
    keys: [{ f: 129, pos: [0.1, 1.5, 12.8], look: [-0.1, 1.2, 6], fov: 44 },
      { f: 168, glide: 14, ease: "out", pos: [0.05, 1.5, 11.5], look: [-0.1, 1.25, 6], fov: 43 }] },
  // L03 knocking: bedroom wide; the knocks escalate (247-284) -> push in and tilt
  { id: 3, a: 187, b: 303, light: "candle", creep: 0.0012,
    keys: [{ f: 187, pos: I(-2.2, 1.6, 2.4), look: I(-2.25, 1.12, -2.0), fov: 56 },
      { f: 292, glide: 46, pos: I(-2.25, 1.55, 1.75), look: I(-2.25, 1.28, -2.0), fov: 54, roll: -0.06 }] },
  // L04 gnawing: two-shot on a long lens, the gnawed headboard between their faces; focus on the eyes
  { id: 4, a: 303, b: 378, light: "candle", creep: 0.0016, cInf: 12, focus: I(-2.25, 1.55, -1.95),
    keys: [{ f: 303, pos: I(-2.25, 1.42, 1.9), look: I(-2.25, 1.32, -2.2), fov: 43 }] },
  // L05 tears the room apart / punch in on "No rat." (423)
  { id: 5, a: 378, b: 443, light: "candle", creep: 0.0018, cInf: 6, focus: I(-0.6, 1.5, -0.4),
    keys: [{ f: 378, pos: I(0.55, 1.5, 2.55), look: I(-0.95, 0.95, -0.6), fov: 48 },
      { f: 432, glide: 20, ease: "out", pos: I(0.75, 1.53, 2.05), look: I(-0.62, 1.32, -0.42), fov: 42 }] },
  // L06 covers slide off Betsy's bed (460-482): her face up top, the quilt lands in the lower third
  { id: 6, a: 443, b: 496, light: "candle", creep: 0.002, keys: [{ f: 443, pos: I(2.6, 1.75, 1.35), look: I(2.25, 0.74, -1.5), fov: 53 }] },
  // L07 hair yanked (505): low close-up, dutch on "yanks"
  { id: 7, a: 496, b: 557, light: "candle", creep: 0.002, cInf: 12, focus: I(2.2, 1.45, -2.1),
    keys: [{ f: 496, pos: I(2.15, 1.25, 0.35), look: I(2.2, 1.45, -2.1), fov: 44 },
      { f: 518, glide: 16, ease: "out", pos: I(2.15, 1.25, 0.05), look: I(2.2, 1.55, -2.1), fov: 42, roll: 0.08 }] },
  // L08 "It's just the wind," John says
  { id: 8, a: 557, b: 610, light: "candle", creep: 0.0025, cInf: 10, focus: I(-1.0, 1.5, -1.4),
    keys: [{ f: 557, pos: I(-0.45, 1.48, 0.95), look: I(-1.0, 1.4, -1.4), fov: 38 }] },
  // L09 the wind slaps her (622): punch toward Betsy on the hit
  { id: 9, a: 610, b: 668, light: "candle", creep: 0.0015, cInf: 8, focus: I(2.2, 1.35, -2.1),
    keys: [{ f: 610, pos: I(1.6, 1.5, 1.8), look: I(1.6, 1.1, -1.8), fov: 50 },
      { f: 633, glide: 12, ease: "out", pos: I(1.55, 1.48, 1.7), look: I(1.58, 1.12, -1.8), fov: 48.5, roll: 0.06 }] },
  // L10 it starts talking: push into the dark corner, rings above, the crate candle bends below
  { id: 10, a: 668, b: 722, light: "candle", creep: 0.0012,
    keys: [{ f: 668, pos: I(1.9, 1.45, 0.6), look: I(3.7, 1.15, -2.75), fov: 46 }, { f: 718, glide: 46, pos: I(2.75, 1.35, -0.85), look: I(3.7, 1.12, -2.75), fov: 38 }] },
  // L11 it calls itself Kate: family huddled on the big bed, all eyes on the voice off-screen right; push on "Kate." (748)
  { id: 11, a: 722, b: 762, light: "candle", creep: 0.002, cInf: 6, focus: I(-2.2, 1.5, -1.7),
    keys: [{ f: 722, pos: I(-2.2, 1.45, 2.5), look: I(-2.22, 1.15, -1.8), fov: 58 },
      { f: 756, glide: 14, ease: "out", pos: I(-2.2, 1.45, 2.2), look: I(-2.22, 1.18, -1.8), fov: 57, roll: -0.04 }] },
  // L12 sings hymns / roasts the dinner guests (799): punch in on "roasts"
  { id: 12, a: 762, b: 841, light: "candle", creep: 0.0008, cInf: 6, focus: I(2.35, 1.5, 0.2),
    keys: [{ f: 762, pos: I(2.35, 1.42, 2.88), look: I(2.35, 1.38, 0.2), fov: 63 },
      { f: 808, glide: 14, ease: "out", pos: I(2.35, 1.42, 2.75), look: I(2.35, 1.38, 0.2), fov: 62, roll: -0.05 },
      { f: 830, glide: 12, ease: "out", pos: I(2.35, 1.42, 2.68), look: I(2.35, 1.38, 0.2), fov: 61, roll: 0.04 }] },
  // L13 neighbors ride in from miles away, punch toward the porch on "insulted" (906)
  { id: 13, a: 841, b: 948, light: "night", creep: 0.0012,
    keys: [{ f: 841, pos: [7.5, 1.6, 12.5], look: [0, 1.45, 3.5], fov: 42 },
      { f: 916, glide: 16, ease: "out", pos: [7.5, 1.6, 12.5], look: [0.2, 1.5, 3.5], fov: 36, roll: 0.03 }] },
  // L14 Kate only hates one person. John. -> punch to his face on "John." (1008)
  { id: 14, a: 948, b: 1025, light: "candle", creep: 0.0018, cInf: 8, focus: I(-2.0, 1.5, -0.75),
    keys: [{ f: 948, pos: I(-1.45, 1.42, 1.85), look: I(-2.0, 1.25, -0.75), fov: 44 },
      { f: 1022, glide: 20, ease: "out", pos: I(-1.78, 1.5, 1.0), look: I(-2.0, 1.43, -0.75), fov: 40, roll: -0.04 }] },
  // L15 face twitches (1041), tongue swells (1067): dutch on the twitch, push on the tongue
  { id: 15, a: 1025, b: 1101, light: "candle", creep: 0.0015, cInf: 12, focus: I(-2.4, 1.55, -2.0),
    keys: [{ f: 1025, pos: I(-2.35, 1.58, 0.35), look: I(-2.4, 1.48, -2.0), fov: 38 },
      { f: 1052, glide: 14, pos: I(-2.35, 1.58, 0.2), look: I(-2.4, 1.48, -2.0), fov: 38, roll: -0.07 },
      { f: 1080, glide: 16, ease: "out", pos: I(-2.38, 1.6, -0.05), look: I(-2.4, 1.48, -2.0), fov: 36, roll: 0.03 }] },
  // L16 December 20th, 1820, John doesn't wake up: high-ish side angle, John along the bed, the family behind
  { id: 16, a: 1101, b: 1196, light: "candle", creep: 0.0015, cInf: 6,
    keys: [{ f: 1101, pos: I(1.0, 1.85, -1.5), look: I(-2.6, 1.15, -2.05), fov: 54 }] },
  // L17 the tiny bottle: vial on the right third, the candle flame on the left, focus on the glass
  { id: 17, a: 1196, b: 1279, light: "candle", creep: 0.0025, cInf: 16, focus: I(0.05, 0.88, -2.66),
    keys: [{ f: 1196, pos: I(0.85, 1.02, -1.75), look: I(-0.12, 0.9, -2.7), fov: 40 }] },
  // L18-19 one drop to the cat; the cat dies instantly
  { id: 18, a: 1279, b: 1370, light: "candle", creep: 0.002, cInf: 10, focus: I(-0.25, 0.25, -1.9),
    keys: [{ f: 1279, pos: I(0.35, 0.65, -0.4), look: I(-0.25, 0.3, -1.9), fov: 42 }] },
  // L20 Kate laughs: low 3/4 on the house so three windows flicker in frame
  { id: 19, a: 1370, b: 1500, light: "night", creep: 0.0015,
    keys: [{ f: 1370, pos: [-16, 1.35, 14], look: [-0.8, 2.4, 0.8], fov: 46 },
      { f: 1412, glide: 18, ease: "out", pos: [-14.4, 1.35, 12.6], look: [-0.8, 2.4, 0.8], fov: 45, roll: 0.04 }] },
  // L21 Wait. How does a wall buy poison? dutch grows into "poison" (1544)
  { id: 20, a: 1500, b: 1565, light: "candle", creep: 0.002, cInf: 8, focus: I(0.05, 0.9, -2.66),
    keys: [{ f: 1500, pos: I(0.2, 1.05, -1.85), look: I(0.05, 0.93, -2.95), fov: 44, roll: 0.06 },
      { f: 1546, glide: 18, ease: "out", pos: I(0.15, 1.02, -2.05), look: I(0.05, 0.92, -2.95), fov: 42, roll: 0.16 }] },
  // L22 nobody wrote it down until 1894 (the writer at the table), push on "1894" (1616)
  { id: 21, a: 1565, b: 1696, light: "candle", creep: 0.0012, cInf: 8, focus: I(2.3, 1.5, 0.3),
    keys: [{ f: 1565, pos: I(2.4, 1.8, 2.85), look: I(2.3, 1.25, 0.6), fov: 56 },
      { f: 1628, glide: 16, ease: "out", pos: I(2.38, 1.75, 2.55), look: I(2.3, 1.27, 0.6), fov: 54 }] },
  // L23 the fishing story: two-shot, the fish grows above them; the camera eases back as it grows
  { id: 22, a: 1696, b: 1790, light: "night", creep: 0.0008, cInf: 8, focus: [2.5, 1.5, 8.4],
    keys: [{ f: 1696, pos: [2.45, 1.45, 12.6], look: [2.45, 1.55, 8.4], fov: 46 },
      { f: 1776, glide: 24, pos: [2.45, 1.45, 13.0], look: [2.45, 1.65, 8.4], fov: 48 }] },
  // L24 a rat in the wall becomes a witch with poison (the whisper line along the fence)
  { id: 23, a: 1790, b: 1891, light: "night", creep: 0.0012,
    keys: [{ f: 1790, pos: [-2.6, 1.5, 17.8], look: [-2.6, 1.6, 12.5], fov: 50 }, { f: 1860, glide: 62, pos: [1.4, 1.5, 17.8], look: [1.4, 1.75, 12.5], fov: 50 }] },
  // L25 Kate's promise: the graveyard, low; slow dutch into "be back" (1947)
  { id: 24, a: 1891, b: 2004, light: "night", creep: 0.0018, cInf: 6, focus: G(0, 0.6, 0),
    keys: [{ f: 1891, pos: G(1.2, 1.1, 5.2), look: G(0, 0.8, 0), fov: 40 },
      { f: 1962, glide: 44, pos: G(0.9, 1.0, 4.4), look: G(0, 0.85, 0), fov: 40, roll: -0.06 }] },
  // L26-28 1935 / nobody saw her / nobody ever did: reverse angle from behind the grave, the far house over the
  // stone; ease from the stone to the house ("Nobody saw her", 2049) so the window can light by itself (2123)
  { id: 25, a: 2004, b: TOTAL, light: "night", creep: 0.0008, cInf: 1.2, focus: [0, 2.0, 0],
    keys: [{ f: 2004, pos: G(-2.2, 1.05, -2.9), look: G(1.25, 1.0, 0.45), fov: 42 },
      { f: 2078, glide: 56, pos: G(-2.2, 1.3, -2.9), look: [0, 2.2, 0], fov: 26 }] },
];

/** shot covering frame f (1-based id) */
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

/** white flashes: 4-frame fade [1, .75, .45, .2] */
export const FLASHES = [187, 1335];
export const flashAt = (f: number) => { for (const a of FLASHES) if (f >= a && f < a + 4) return [1, 0.75, 0.45, 0.2][f - a]; return 0; };

/** impact kicks: frame, strength (radians of roll at the first frame) */
export const KICKS: [number, number][] = [
  // reference v14 impact: a few px of jolt that flips sign every frame; knocks build up, the slap and the cat's death hit hardest
  [63, 0.012], [249, 0.012], [262, 0.013], [275, 0.015], [284, 0.02], [317, 0.008], [339, 0.008], [423, 0.012], [622, 0.026], [906, 0.015],
  [1008, 0.016], [1335, 0.022], [1405, 0.018], [1426, 0.012], [1855, 0.012], [2125, 0.01],
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
    const p = K[j - 1], g = K[j].glide ?? K[j].f - p.f, x = clamp01((f - (K[j].f - g)) / Math.max(1, g));
    const u = K[j].ease === "out" ? smoother(1 - (1 - x) * (1 - x)) : smoother(x); // "out": peak at 29 % of the glide, long settle, no pop
    pos = lerp3(p.pos, K[j].pos, u); look = lerp3(p.look, K[j].look, u);
    fov = (p.fov ?? 40) + ((K[j].fov ?? 40) - (p.fov ?? 40)) * u; roll = (p.roll ?? 0) + ((K[j].roll ?? 0) - (p.roll ?? 0)) * u;
  }
  // continuous creep toward the target (every hold moves)
  const c = Math.min(0.5, (s.creep ?? 0.002) * (f - s.a));
  pos = lerp3(pos, look, c);
  // kick: roll plus a vertical jolt of ~5 px at 1080x1920 per 0.012 (camera and target move together)
  const kk = kickAt(f), dy = kk * 0.16 * Math.hypot(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]);
  if (dy) { pos = [pos[0], pos[1] + dy, pos[2]]; look = [look[0], look[1] + dy, look[2]]; }
  return { pos, look, fov, roll: roll + kk };
};
