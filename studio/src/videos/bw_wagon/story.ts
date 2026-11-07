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
  id: number; a: number; b: number; light: Light; keys: Key[];
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
export const SHOTS: Shot[] = [
  // L01-02 hook, the most energetic camera of the film. Frame 0 stops the scroll: John's nervous face fills the frame,
  // the lit window behind him a warm blur; a quick arc round his face, then the camera tears back past the porch post
  // (it wipes across the frame soft and big) and cranes up and out to the lonely farmhouse, landing on "murdered" (63);
  // then a strong arcing push in on the house with a dutch roll through "didn't exist" (97-108)
  { id: 1, a: 0, b: 129, light: "night", creep: 0.0008, cInf: 0,
    keys: [{ f: 0, pos: [2.27, 1.66, 5.9], look: [1.62, 1.68, 3.7], fov: 40, focus: FACE.porch1, cInf: 50 },
      { f: 18, glide: 18, orbit: true, pos: [1.86, 1.6, 5.78], look: [1.64, 1.7, 3.7], fov: 38, roll: 0.03, focus: FACE.porch1, cInf: 50 },
      { f: 62, glide: 44, log: true, via: [[1.02, 1.8, 7.3], [2.5, 2.3, 11.6]], pos: [5.5, 2.45, 18.4], look: [0.4, 2.25, 0.8], fov: 40, cInf: 0 },
      { f: 126, glide: 60, orbit: true, pos: [5.0, 2.05, 13.4], look: [0.6, 2.0, 1.2], fov: 36, roll: -0.1, cInf: 0 }] },
  // the family who swore: a low truck left past the fence post at the yard gap (it wipes across their bodies, soft),
  // arcing onto the family; punch in with a roll on "swore" (156), then the arc carries on round them
  { id: 2, a: 129, b: 187, light: "night", creep: 0.0012, cInf: 30, focus: [-0.1, 1.45, 6.3],
    keys: [{ f: 129, pos: [2.45, 1.3, 13.0], look: [0.2, 1.3, 6.2], fov: 38 },
      { f: 147, glide: 18, orbit: true, pos: [0.75, 1.33, 12.75], look: [-0.02, 1.3, 6.1], fov: 38 },
      { f: 166, glide: 19, pos: [0.0, 1.4, 11.7], look: [-0.22, 1.32, 6.2], fov: 37, roll: 0.06 },
      { f: 187, glide: 20, orbit: true, pos: [-0.4, 1.43, 12.0], look: [-0.1, 1.33, 6.2], fov: 37, roll: 0.03 }] },
  // L03 knocking. Under the white flash the camera is up among the ceiling beams at the front of the room; it flies in
  // under the beam (a near blur that sweeps up out of frame) and settles on the bed; through the knocks (247-284) it arcs
  // round and pushes in with a growing dutch
  { id: 3, a: 187, b: 303, light: "candle", creep: 0.0008, cInf: 52, focus: I(-2.25, 1.5, -2.0),
    keys: [{ f: 187, pos: I(-2.1, 2.63, 2.86), look: I(-2.25, 1.1, -2.0), fov: 50 },
      { f: 228, glide: 38, pos: I(-2.2, 1.43, 2.35), look: I(-2.25, 1.15, -2.0), fov: 44 },
      { f: 296, glide: 66, orbit: true, pos: I(-1.65, 1.44, 1.7), look: I(-2.25, 1.27, -2.0), fov: 41, roll: -0.08 }] },
  // L04 gnawing: the two-shot; on "gnawing" (317) the camera flies between their heads to an extreme close-up of the
  // gnawed headboard (the heads slide past the lens), then on "rat" (339) it pulls back out to the two of them in shock
  { id: 4, a: 303, b: 378, light: "candle", creep: 0.0008, cInf: 48, focus: I(-2.25, 1.52, -1.95),
    keys: [{ f: 303, pos: I(-2.25, 1.4, 1.62), look: I(-2.25, 1.33, -1.95), fov: 39 },
      { f: 339, glide: 36, log: true, pos: I(-2.25, 1.22, -1.88), look: I(-2.25, 1.12, -2.92), fov: 40, focus: I(-2.25, 1.12, -2.88) },
      { f: 376, glide: 36, log: true, pos: I(-2.0, 1.41, 1.6), look: I(-2.25, 1.35, -1.95), fov: 42, roll: 0.04 }] },
  // L05 tears the room apart: low angle up at him, the ceiling beams over his head; a wide arc round him as he hunts,
  // punch in with a roll on "No rat." (423)
  { id: 5, a: 378, b: 443, light: "candle", creep: 0.0015, cInf: 24, focus: FACE.johnStand5,
    keys: [{ f: 378, pos: I(0.85, 0.8, 1.85), look: I(-0.7, 1.38, -0.45), fov: 43 },
      { f: 412, glide: 32, orbit: true, pos: I(-0.05, 0.82, 1.95), look: I(-0.66, 1.4, -0.45), fov: 42 },
      { f: 433, glide: 20, pos: I(-0.1, 0.95, 1.25), look: I(-0.62, 1.42, -0.42), fov: 37, roll: 0.06 }] },
  // L06 covers slide off Betsy's bed (460-482): her face up top, the quilt lands in the lower third; a crane-arc down
  // and round as the quilt goes
  { id: 6, a: 443, b: 496, light: "candle", creep: 0.0025, cInf: 40, focus: FACE.betsyBed,
    keys: [{ f: 443, pos: I(2.0, 1.45, 1.45), look: I(2.2, 0.78, -1.5), fov: 41 },
      { f: 480, glide: 34, orbit: true, pos: I(2.75, 1.18, 0.85), look: I(2.32, 0.84, -1.5), fov: 38, roll: 0.05 }] },
  // L07 hair yanked (505): low close-up, punch and roll into the dutch on "yanks", then the arc carries on round her
  { id: 7, a: 496, b: 557, light: "candle", creep: 0.0015, cInf: 42, focus: I(2.2, 1.45, -2.1),
    keys: [{ f: 496, pos: I(1.6, 1.28, 0.45), look: I(2.2, 1.45, -2.1), fov: 40 },
      { f: 517, glide: 20, pos: I(2.05, 1.3, 0.05), look: I(2.2, 1.55, -2.1), fov: 37, roll: 0.11 },
      { f: 552, glide: 32, orbit: true, pos: I(2.55, 1.3, -0.1), look: I(2.32, 1.5, -2.1), fov: 35, roll: 0.07 }] },
  // L08 "It's just the wind," John says: a slow smug arc round him, a little roll
  { id: 8, a: 557, b: 610, light: "candle", creep: 0.0025, cInf: 32, focus: I(-1.0, 1.5, -1.4),
    keys: [{ f: 557, pos: I(0.1, 1.45, 0.85), look: I(-1.0, 1.42, -1.4), fov: 37 },
      { f: 596, glide: 36, orbit: true, pos: I(-0.75, 1.47, 0.6), look: I(-1.08, 1.45, -1.4), fov: 34, roll: -0.05 }] },
  // L09 the wind slaps her (622): near/far, John big in the foreground; punch with a roll on the slap, focus racks to
  // him for his shock (633) and back while the camera arcs on round
  { id: 9, a: 610, b: 668, light: "candle", creep: 0.0012, cInf: 40, focus: FACE.betsyBed, rack: [[628, FACE.john9, 6], [650, null, 10]],
    keys: [{ f: 610, pos: I(1.2, 1.38, 1.85), look: I(1.55, 1.1, -1.8), fov: 50 },
      { f: 633, glide: 18, pos: I(1.6, 1.36, 1.6), look: I(1.6, 1.14, -1.8), fov: 46, roll: 0.09 },
      { f: 666, glide: 32, orbit: true, pos: I(1.95, 1.36, 1.3), look: I(1.7, 1.15, -1.8), fov: 44, roll: 0.05 }] },
  // L10 it starts talking: floor-level low angle into the dark corner, the crate candle bends (684-700), then the camera
  // sinks and tilts up to the voice rings with the ceiling beams over them, rolling into the dutch
  { id: 10, a: 668, b: 722, light: "candle", creep: 0.001, cInf: 22,
    keys: [{ f: 668, pos: I(2.95, 0.62, 0.05), look: I(3.55, 0.8, -2.65), fov: 46, focus: I(3.55, 0.8, -2.65) },
      { f: 718, glide: 40, pos: I(2.95, 0.3, -0.5), look: I(3.7, 1.82, -2.75), fov: 62, roll: -0.09, focus: I(3.8, 1.55, -2.8) }] },
  // L11 it calls itself Kate: near/far huddle. The boy stands at the foot of the bed, his head big and soft in the right
  // foreground (whole, inside the frame); Betsy, Lucy and John recede on the bed behind him, sharp; an arc for parallax,
  // then a punch and roll as they all jolt on "Kate." (748)
  { id: 11, a: 722, b: 762, light: "candle", creep: 0.0012, cInf: 40, focus: FACE.lucy11,
    keys: [{ f: 722, pos: I(-0.75, 1.3, 2.15), look: I(-1.8, 1.3, -1.5), fov: 55 },
      { f: 740, glide: 18, orbit: true, pos: I(-0.5, 1.29, 2.05), look: I(-1.8, 1.31, -1.5), fov: 54 },
      { f: 760, glide: 20, pos: I(-0.6, 1.29, 1.75), look: I(-1.8, 1.33, -1.5), fov: 52, roll: -0.07 }] },
  // L12 sings hymns / roasts the dinner guests: table level across the pewter (soft foreground), the guests above; a
  // push over the table, a snap to the first roasted guest on "roasts" (799), a slide to the second on "guests" (823)
  { id: 12, a: 762, b: 841, light: "candle", creep: 0.0008, cInf: 34, focus: FACE.lucy12, rack: [[793, FACE.folk0_12, 6], [815, FACE.folk1_12, 6]],
    keys: [{ f: 762, pos: I(2.35, 1.0, 2.8), look: I(2.35, 1.38, 0.2), fov: 63 },
      { f: 790, glide: 28, pos: I(2.4, 1.02, 2.55), look: I(2.35, 1.4, 0.2), fov: 60 },
      { f: 810, glide: 20, pos: I(2.15, 1.04, 2.45), look: I(2.1, 1.42, 0.2), fov: 54, roll: -0.05 },
      { f: 833, glide: 22, pos: I(2.5, 1.04, 2.42), look: I(2.52, 1.42, 0.2), fov: 53, roll: 0.04 }] },
  // L13 neighbours ride in from miles away (wagon agent): a low truck alongside the horse wagon (wagon.ts), horse in
  // profile: the camera picks the trotting horse up as it enters frame and rides with it (the look point follows the
  // same smootherstep as wagonX, so horse + driver hold their place while the yard slides past) to the stop (899);
  // on "insulted" the film's ONE whip pan (Bell.tsx WhipBlur) swings back onto the riders' shocked faces, the house
  // wall that insulted them behind; a slow push while they laugh it off
  { id: 13, a: 841, b: 948, light: "night", creep: 0.0006, cInf: 16,
    keys: [{ f: 841, pos: [-5.48, 0.72, 11.25], look: [-5.73, 1.06, 7.0], fov: 60, focus: [-5.7, 1.1, 7.0] },
      { f: 899, glide: 58, pos: [-2.08, 0.74, 11.25], look: [-2.33, 1.08, 7.0], fov: 70, focus: [-2.3, 1.1, 7.0] },
      { f: 922, glide: 18, pos: [-7.75, 1.35, 10.75], look: [-4.15, 1.3, 7.0], fov: 44, roll: 0.03, focus: [-4.3, 1.62, 7.0] },
      { f: 946, glide: 24, pos: [-7.55, 1.37, 10.5], look: [-4.13, 1.32, 7.0], fov: 43, roll: 0.05, focus: [-4.3, 1.62, 7.0] }] },
  // L14 Kate only hates one person: start low on her voice rings under the beams, travel down to John, punch on "John."
  { id: 14, a: 948, b: 1025, light: "candle", creep: 0.0012, cInf: 26, focus: FACE.john14,
    keys: [{ f: 948, pos: I(-1.05, 0.95, 0.75), look: I(-1.5, 1.95, -1.7), fov: 46, focus: I(-1.5, 1.9, -1.7) },
      { f: 996, glide: 46, pos: I(-1.5, 1.38, 1.05), look: I(-2.0, 1.42, -0.75), fov: 40 },
      { f: 1018, glide: 20, pos: I(-1.8, 1.47, 1.0), look: I(-2.0, 1.43, -0.75), fov: 35, roll: -0.07 }] },
  // L15 face twitches (1041), tongue swells (1067): an arc round his face, a roll into the dutch on the twitch, a punch
  // on the tongue, and the arc carries on round him
  { id: 15, a: 1025, b: 1101, light: "candle", creep: 0.002, cInf: 36, focus: I(-2.4, 1.55, -2.0),
    keys: [{ f: 1025, pos: I(-1.85, 1.55, 0.4), look: I(-2.4, 1.48, -2.0), fov: 37 },
      { f: 1051, glide: 22, orbit: true, pos: I(-2.3, 1.56, 0.25), look: I(-2.4, 1.48, -2.0), fov: 36, roll: -0.1 },
      { f: 1077, glide: 20, pos: I(-2.4, 1.58, -0.1), look: I(-2.4, 1.5, -2.0), fov: 34, roll: 0.05 },
      { f: 1100, glide: 22, orbit: true, pos: I(-2.85, 1.58, -0.05), look: I(-2.42, 1.5, -2.0), fov: 34, roll: 0.08 }] },
  // L16 December 20th, 1820, John doesn't wake up: high side angle over the bed, a crane down and round to eye level;
  // focus racks from John to his wife as her face falls (1170), and the camera pushes in on her
  { id: 16, a: 1101, b: 1196, light: "candle", creep: 0.0012, cInf: 34, focus: FACE.john16, rack: [[1163, FACE.lucy16, 10]],
    keys: [{ f: 1101, pos: I(1.3, 2.25, -1.45), look: I(-2.6, 0.95, -1.82), fov: 60 },
      { f: 1170, glide: 66, skew: 0.8, orbit: true, pos: I(0.85, 1.42, -0.6), look: I(-2.6, 1.1, -1.85), fov: 56 },
      { f: 1195, glide: 24, pos: I(0.45, 1.4, -0.75), look: I(-2.75, 1.15, -1.7), fov: 52, roll: -0.05 }] },
  // L17 the tiny bottle: from the bedside candle flame (ECU) the camera travels at table height past the candle (it
  // slides out past the lens) to the vial, arriving on "tiny bottle" (1224-1237); push with a roll on "black liquid"
  { id: 17, a: 1196, b: 1279, light: "candle", creep: 0.0012, cInf: 30,
    keys: [{ f: 1196, pos: I(-0.85, 1.0, -2.25), look: I(-0.3, 0.98, -2.72), fov: 40, focus: I(-0.3, 0.98, -2.72) },
      { f: 1252, glide: 56, pos: I(-0.4, 0.95, -2.34), look: I(0.05, 0.9, -2.66), fov: 40, focus: I(0.05, 0.9, -2.66) },
      { f: 1277, glide: 24, pos: I(-0.3, 0.94, -2.4), look: I(0.05, 0.9, -2.66), fov: 38, roll: 0.05, focus: I(0.05, 0.9, -2.66) }] },
  // L18-19 one drop to the cat: floor level, the saucer in front; an arc and push along the boards; after "dies" (1335)
  // the camera cranes up after the cat's ghost
  { id: 18, a: 1279, b: 1370, light: "candle", creep: 0.001, cInf: 28,
    keys: [{ f: 1279, pos: I(0.55, 0.12, -0.75), look: I(-0.25, 0.22, -1.95), fov: 44, focus: I(-0.25, 0.2, -1.95) },
      { f: 1326, glide: 44, orbit: true, pos: I(0.1, 0.1, -1.0), look: I(-0.25, 0.2, -1.95), fov: 42, focus: I(-0.25, 0.2, -1.95) },
      { f: 1369, glide: 33, pos: I(0.18, 0.27, -0.97), look: I(-0.25, 0.44, -1.93), fov: 44, roll: 0.05, focus: I(-0.25, 0.44, -1.93) }] },
  // L20 Kate laughs: low 3/4 on the house so three windows flicker in frame; an arc round the yard corner (the fence
  // slides past in front), a push with a roll on the laugh (1405), then the arc carries on
  { id: 19, a: 1370, b: 1500, light: "night", creep: 0.0015, cInf: 0,
    keys: [{ f: 1370, pos: [-16, 1.35, 14], look: [-0.8, 2.4, 0.8], fov: 46 },
      { f: 1396, glide: 26, orbit: true, pos: [-15.0, 1.4, 15.0], look: [-0.8, 2.4, 0.8], fov: 45 },
      { f: 1418, glide: 22, pos: [-12.6, 1.5, 13.6], look: [-0.8, 2.4, 0.8], fov: 42, roll: 0.06 },
      { f: 1496, glide: 70, ramp: 16, orbit: true, pos: [-9.0, 1.6, 12.8], look: [-0.6, 2.3, 0.8], fov: 40, roll: 0.03 }] },
  // L21 Wait. How does a wall buy poison? an arc round the vial, the dutch grows; punch on "poison" (1544)
  { id: 20, a: 1500, b: 1565, light: "candle", creep: 0.0015, cInf: 34, focus: I(0.05, 0.9, -2.66),
    keys: [{ f: 1500, pos: I(0.3, 1.05, -1.85), look: I(0.05, 0.93, -2.95), fov: 44, roll: 0.05 },
      { f: 1530, glide: 28, orbit: true, pos: I(-0.2, 1.02, -1.92), look: I(0.12, 0.93, -2.95), fov: 42, roll: 0.1 },
      { f: 1553, glide: 20, pos: I(-0.1, 1.0, -2.12), look: I(0.05, 0.92, -2.95), fov: 40, roll: 0.17 }] },
  // L22 nobody wrote it down until 1894: an insert of the open book at table height, then a crane up to the writer's
  // face on "1894" (1616); he whistles innocently (1650) as the camera arcs round him
  { id: 21, a: 1565, b: 1696, light: "candle", creep: 0.001, cInf: 26, focus: FACE.writer,
    keys: [{ f: 1565, pos: I(2.55, 1.15, 1.75), look: I(2.32, 0.82, 1.1), fov: 42, focus: I(2.3, 0.86, 1.1) },
      { f: 1629, glide: 64, log: true, pos: I(2.42, 1.42, 2.6), look: I(2.3, 1.36, 0.3), fov: 42 },
      { f: 1680, glide: 44, orbit: true, pos: I(1.85, 1.42, 2.5), look: I(2.32, 1.38, 0.3), fov: 40, roll: 0.04 }] },
  // L23 the fishing story: near/far, the doubtful listener soft in the left foreground, the fisher and his fish sharp;
  // a truck right (the listener slides across the foreground), a push and roll as focus racks to the listener on
  // "bigger" (1772)
  { id: 22, a: 1696, b: 1790, light: "night", creep: 0.0012, cInf: 18, focus: FACE.fisher, rack: [[1766, FACE.folk3_22, 8]],
    keys: [{ f: 1696, pos: [1.25, 1.38, 12.15], look: [2.45, 1.85, 8.2], fov: 47 },
      { f: 1742, glide: 42, orbit: true, pos: [2.05, 1.39, 12.1], look: [2.55, 1.9, 8.2], fov: 44 },
      { f: 1782, glide: 24, pos: [1.95, 1.41, 11.6], look: [2.5, 1.98, 8.2], fov: 41, roll: 0.05 }] },
  // L24 a rat in the wall becomes a witch with poison (the whisper line along the fence): an even-paced truck along the
  // line with the travelling bubble, then a push and roll onto the witch (1853)
  { id: 23, a: 1790, b: 1891, light: "night", creep: 0.0008, cInf: 16,
    keys: [{ f: 1790, pos: [-2.1, 1.55, 19.4], look: [-2.1, 1.65, 12.5], fov: 42.5 },
      { f: 1850, glide: 60, ramp: 16, pos: [1.35, 1.56, 19.2], look: [1.45, 1.75, 12.5], fov: 42.5 },
      { f: 1878, glide: 26, pos: [1.75, 1.6, 17.6], look: [1.95, 1.95, 12.5], fov: 40, roll: 0.06 }] },
  // L25 Kate's promise: straight down into the grave from above, then a long crane down (orbit about the stone) to a low
  // angle on the headstone, arriving on "be back" (1947); slow dutch push after
  { id: 24, a: 1891, b: 2004, light: "night", creep: 0.0012, cInf: 14,
    keys: [{ f: 1891, pos: G(0.02, 5.6, 1.35), look: G(0, 0.05, 1.0), fov: 46, focus: G(0, 0.05, 1.0) },
      { f: 1960, glide: 66, orbit: true, skew: 0.8, pos: G(0.9, 1.0, 4.4), look: G(0, 0.85, 0), fov: 40, focus: G(0, 0.7, 0.1) },
      { f: 2000, glide: 38, pos: G(0.75, 0.98, 3.7), look: G(0, 0.86, 0), fov: 38, roll: -0.08, focus: G(0, 0.7, 0.1) }] },
  // L26-28 1935 / nobody saw her / nobody ever did: from behind the stone the camera cranes up and out to the far house
  // ("Nobody saw her", 2049), then pushes in so the window can light by itself (2123)
  { id: 25, a: 2004, b: TOTAL, light: "night", creep: 0.0006, cInf: 1.2,
    keys: [{ f: 2004, pos: G(-2.2, 1.05, -2.9), look: G(1.25, 1.0, 0.45), fov: 42, focus: G(0, 0.8, 0), cInf: 12 },
      { f: 2100, glide: 88, skew: 0.85, via: [G(-2.9, 2.6, -4.2)], pos: G(-4.6, 5.2, -6.4), look: [0, 2.0, 0], fov: 30, focus: [-4, 1.7, 0], cInf: 1.2 },
      { f: 2134, glide: 32, pos: G(-5.6, 5.0, -7.4), look: [0, 2.05, 0], fov: 25, roll: 0.03, focus: [-4, 1.7, 0], cInf: 1.2 }] },
];
// Lens blur (user: "make sure the blur is there when needed"): CoC = cInf x |1 - focus / depth|. In the bedroom the back
// wall is only ~1.3-2x the focus distance, so interiors run cInf 22-48 for a 10-16 px CoC on the wall behind the faces
// (1080 wide); outdoors 14-30 against far backgrounds; the wides (1, 19) stay sharp. Per-shot values sit in SHOTS.

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
  for (const [k, a] of KICKS) { const n = f - k; if (n >= 0 && n < 7) r += (a / 0.012) * (n % 2 ? -1 : 1) * Math.pow(1 - n / 7, 1.5); }
  return r;
};

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const NORM = new WeakMap<Shot, Key[]>();
/** keys with every glide >= 18 f (cuts = glide 1 stay cuts); a short "out" punch is re-centred on its old peak frame */
const keysOf = (s: Shot): Key[] => {
  let K = NORM.get(s);
  if (!K) {
    K = s.keys.map((k, i) => {
      if (i === 0 || k.glide === undefined || k.glide <= 1) return k;
      const g = Math.max(18, k.glide), peak = k.ease === "out" ? k.f - k.glide * 0.71 : k.f - k.glide / 2;
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
export const camAt = (s: Shot, f: number): Cam => {
  let { pos, look } = poseAt(s, f);
  const { fov, roll } = poseAt(s, f);
  // continuous creep toward the target (every hold moves)
  const c = Math.min(0.5, Math.max(0.0015, s.creep ?? 0.002) * (f - s.a));
  pos = lerp3(pos, look, c);
  // kick: ~3 px at 720p per unit (image offset, camera and target move together), roll 0.004 rad per unit
  const kk = kickAt(f), L = Math.hypot(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]);
  const dy = kk * (3 / 640) * Math.tan((fov * Math.PI) / 360) * L;
  if (dy) { pos = [pos[0], pos[1] + dy, pos[2]]; look = [look[0], look[1] + dy, look[2]]; }
  return { pos, look, fov, roll: roll + kk * 0.004 };
};
