// Shot 13's horse wagon (wagon agent): "Neighbors ride in from miles away just to get insulted by a wall."
// - horseCard(): a round, cute dapple-grey horse in profile in the bridge toon style (toon.ts Pen: blob contours,
//   painted form shade + white gloss, thick-thin ink rings), a 4-beat walk (lateral sequence), mane, swishing tail,
//   blinking eye, bridle + collar harness; moods: calm / shock (ears pinned, eye wide) / laugh (horse laugh, teeth).
// - Wagon: a small 1817 farm wagon in 3D (plank bed with sage-green boards, spoked wheels that turn with the distance
//   rolled, box seat, hay, shafts to the horse, a framed lantern on a pole that swings forward when it stops, reins).
// - Motion is a pure function of the frame (wagonX ...), shared by stage.ts (cards) and world.ts (3D, WAGON hook).
// Colours: greys and woods keep G >= R (warm browns go mauve under the blue moon; user: no purple).
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { NOINK } from "../bridge/ink";
import { Pen, Blob, blobPts, INK, INK_SIDE, mix } from "../bridge/toon";
import { halo, pool } from "./fx3d";
import { clamp01, smooth, smoother, V3 } from "./story";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

// ---------------- motion (shot 13: 841-948) ----------------
export const W_F0 = 841, W_F1 = 899;   // shot start, wagon at rest
export const WZ = 7.0;                  // wagon centre line (z); it rolls along +x in front of the house
export const W_XS = -4.1;               // bed centre at rest (horse's nose stops at x -1.1, clear of the dirt path)
export const W_LEN = 3.4;               // camera truck length (story.ts shot 13 keys 841 -> 899 follow the same curve)
export const HORSE_SC = 1.45;           // horse card scale (600 x 1000 design card = 1.88 x 3.13 m)
export const HORSE_DX = 2.12;           // horse card centre ahead of the bed centre (m)
const SUH = 0.00216 * HORSE_SC;         // metres per design unit on the horse card
/** bed centre x: the camera's smootherstep truck plus a lead that closes over the first 22 f (the horse trots into
 *  frame from the left while the camera picks it up, then they travel together and stop by f899) */
export const wagonX = (f: number) => {
  const v = clamp01((f - W_F0) / 22);
  return W_XS - W_LEN * (1 - smoother((f - W_F0) / (W_F1 - W_F0))) - 0.75 * (1 - v) * (1 - v);
};
const velAt = (f: number) => wagonX(f + 0.5) - wagonX(f - 0.5); // m per frame
/** braking 0..1 (deceleration, peaks ~f888) */
const brakeAt = (f: number) => clamp01(-(velAt(f + 0.5) - velAt(f - 0.5)) / 0.0055);
const STRIDE0 = 0.9, V0 = 0.1, BETA = 0.6, STEP = 170; // stride (m per cycle) at V0 m/f; stance share; stance travel at amp 1 (units)
const strideAt = (v: number) => Math.max(0.3, STRIDE0 * Math.sqrt(Math.max(0, v) / V0));
let PH: number[] | null = null;
/** walk-cycle phase: integral of speed / stride (cadence slows with the speed, feet never slide) */
const phaseAt = (f: number) => {
  if (!PH) {
    PH = [0];
    let ph = 0;
    for (let g = W_F0; g < 960; g++) { for (let k = 0; k < 4; k++) { const v = velAt(g + k / 4 + 0.125); ph += v / strideAt(v) / 4; } PH.push(ph); }
  }
  const t = Math.max(0, Math.min(PH.length - 1.001, f - W_F0)), i = Math.floor(t);
  return PH[i] + (PH[i + 1] - PH[i]) * (t - i);
};
/** bed bounce (m) and pitch (rad, + = nose up): road bumps while rolling, a nose dip while braking, a rock after the stop */
export const wagonBounce = (f: number) => {
  const d = wagonX(f) - wagonX(W_F0), go = clamp01(velAt(f) / 0.04);
  return 0.009 * go * Math.abs(Math.sin(d * 3.1)) + 0.004 * go * Math.abs(Math.sin(d * 7.3 + 1));
};
export const wagonPitch = (f: number) => {
  const n = f - W_F1;
  return -0.012 * brakeAt(f) + (n >= 0 ? 0.014 * Math.exp(-n / 5) * Math.sin(n * 0.9) : 0);
};
/** riders' forward lurch (rad, + = top toward the travel direction): inertia while braking, a damped spring after */
export const wagonLean = (f: number) => {
  const n = f - W_F1;
  return 0.085 * smooth(brakeAt(f)) + (n >= 0 ? 0.07 * Math.exp(-n / 6) * Math.sin(n * 0.75 + 0.6) : 0);
};
/** riders: [local x along the bed, card sole height] (driver on the box seat: hands rest on it; passengers in the hay) */
export const SEATS: { dx: number; y: number; dz: number }[] = [
  { dx: 0.72, y: 1.1, dz: 0 },      // driver
  { dx: -0.14, y: 0.7, dz: -0.04 }, // passenger next to the seat
  { dx: -0.8, y: 0.7, dz: 0.04 },   // passenger at the tail board
];
/** the reins: the driver's hand and the horse's bit (world), written by stage.ts every frame of shot 13 */
export const REINS: { on: boolean; a: V3; b: V3 } = { on: false, a: [0, 0, 0], b: [0, 0, 0] };

// ---------------- the horse card ----------------
export type HorsePose = {
  phase: number; amp: number; bob: number; nod: number; tilt: number; neck: number; tail: number; mane: number;
  blink: number; ears: number; mood: "calm" | "shock" | "laugh"; light: number;
};
const COAT = "#c9cfd0", COAT_SH = "#8e989e", LEG = "#b7bec0", HAIR = "#4d5557", HAIR_HI = "#7b8486", HOOF = "#3a3e3f",
  MUZZLE = "#a1a9ab", EAR_IN = "#7f888a", STRAP = "#3d3f36", COLLAR = "#4f5244", BRASS = "#c2b26c", STEEL = "#c9cecd";
const HX = 278, BODY: P2 = [HX, 698]; // body centre (rest); the horse faces screen right
const NECK_B: P2 = [HX + 120, 660], NECK_T: P2 = [HX + 186, 552]; // neck base / top (rest)
const HEAD_C: P2 = [HX + 206, 540], MUZ: P2 = [HX + 252, 584];   // cranium / muzzle centres (rest)
const BIT0: P2 = [HX + 240, 606];
const HS = 1.2, DY = 16; // head drawn 1.2x about its centre (cuter); the horse sits 16 units lower on shorter legs
const LEGS: { j: P2; fore: boolean; near: boolean; off: number }[] = [
  { j: [HX - 106, 756], fore: false, near: false, off: 0.5 },
  { j: [HX + 80, 760], fore: true, near: false, off: 0.75 },
  { j: [HX - 92, 762], fore: false, near: true, off: 0 },
  { j: [HX + 94, 766], fore: true, near: true, off: 0.25 },
];
const rotP = (q: P2, a: number, c: P2): P2 => {
  const s = Math.sin(a), k = Math.cos(a), x = q[0] - c[0], y = q[1] - c[1];
  return [c[0] + x * k - y * s, c[1] + x * s + y * k];
};
/** rest -> posed transforms: body (tilt about the body centre + bob), neck (about its base), head (about the neck top) */
const xf = (h: HorsePose) => {
  const tB = rad(h.tilt), tN = rad(h.neck), tH = rad(h.nod);
  const body = (q: P2): P2 => { const r = rotP(q, tB, BODY); return [r[0], r[1] + h.bob + DY]; };
  const neck = (q: P2): P2 => body(rotP(q, tN, NECK_B));
  const head = (q: P2): P2 => neck(rotP(q, tH, NECK_T));
  const rig = (fn: (q: P2) => P2, a: number, c: P2): number[] => { const c2 = fn(c); return [a, c[0], c[1], c2[0] - c[0], c2[1] - c[1]]; };
  return { body, neck, head, rB: rig(body, tB, BODY), rN: rig(neck, tB + tN, NECK_B), rH: rig(head, tB + tN + tH, HEAD_C) };
};
/** the bit ring on the card (design units), for the reins */
export const horseBit = (h: HorsePose): P2 => { const X = xf(h), c = X.head(HEAD_C), b = X.head(BIT0); return [c[0] + HS * (b[0] - c[0]), c[1] + HS * (b[1] - c[1])]; };
/** card-local design point -> world, for a horse card at (x, 0, z) facing +z (yaw 0) */
export const horsePt = (q: P2, x: number, z: number): V3 => [x + (q[0] - 300) * SUH, (975 - q[1]) * SUH, z];

const foot = (c: number, S: number, H: number): [number, number, number] => {
  if (c < BETA) return [S / 2 - (S * c) / BETA, 0, 0];
  const s = (c - BETA) / (1 - BETA);
  return [-S / 2 + S * (s - Math.sin(2 * Math.PI * s) / (2 * Math.PI)), H * Math.sin(Math.PI * s), s];
};
/** two-bone leg: s = +1 knee forward (fore leg), -1 hock back (hind leg) */
const ik2 = (j: P2, a: P2, l1: number, l2: number, s: number): P2 => {
  const dx = a[0] - j[0], dy = a[1] - j[1], d = Math.max(1, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5));
  const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))), k = Math.atan2(dy, dx) - s * A;
  return [j[0] + l1 * Math.cos(k), j[1] + l1 * Math.sin(k)];
};
const rgba = (c: string, a: number) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`; };
/** inked limb: ink under-stroke then the fill (one continuous shape through the joints) */
const limb = (p: Pen, pts: P2[], w: number, col: string, ink = 9) => { p.stroke(pts, w + ink, INK); p.stroke(pts, w, col); };
/** painted ball shading on a part: lit-side gradient, cool form shade toward the far / lower rim, white gloss */
const painted = (p: Pen, pts: P2[], base: string, shadow: string, light: number, cx: number, cy: number, rx: number, ry: number, gloss = 1) => {
  p.gradFill(pts, base, shadow, light, 0.3);
  const lx = Math.cos(light), ly = Math.sin(light);
  p.clip(pts, () => {
    p.glow(cx + lx * 0.25 * rx, cy + ly * 0.2 * ry - 0.2 * ry, 1.25 * rx, 1.2 * ry,
      [[0, "rgba(255,255,255,0)"], [0.55, "rgba(255,255,255,0)"], [0.85, "rgba(150,158,166,0.32)"], [1, "rgba(118,126,134,0.5)"]], "multiply");
    if (gloss > 0) {
      p.glow(cx + lx * 0.32 * rx, cy - 0.5 * ry, 0.42 * rx, 0.2 * ry, [[0, `rgba(255,255,255,${0.62 * gloss})`], [0.45, `rgba(255,255,255,${0.32 * gloss})`], [1, "rgba(255,255,255,0)"]]);
      p.glow(cx + lx * 0.36 * rx, cy - 0.56 * ry, 0.16 * rx, 0.08 * ry, [[0, `rgba(255,255,255,${0.9 * gloss})`], [1, "rgba(255,255,255,0)"]]);
    }
  });
};
/** closed ribbon around a polyline with widths (tail, ears) */
const ribbon = (c: P2[], w: number[]): P2[] => {
  const L: P2[] = [], R: P2[] = [];
  c.forEach((q, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    L.push([q[0] + nx * w[i] / 2, q[1] + ny * w[i] / 2]); R.push([q[0] - nx * w[i] / 2, q[1] - ny * w[i] / 2]);
  });
  return [...L, ...R.reverse()];
};
const bez = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const o: P2[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * k[0] + t * t * b[0], u * u * a[1] + 2 * u * t * k[1] + t * t * b[1]]); }
  return o;
};

/** the horse on a 600 x 1000 design card, hooves on the sole line (975), facing screen right */
export const horseCard = (p: Pen, h: HorsePose) => {
  const X = xf(h), light = h.light, thick = INK_SIDE, ow = 8; // the same brush hand as the cast: heavy lower-left
  // the card shader's head zone sits above the card (no skin gloss / head gradient on the horse); torso = the barrel
  p.mark("head", 300, -600, 10, 10);
  // ---- legs (far pair first, darker), a 4-beat walk ----
  const S = STEP * h.amp, Hh = Math.min(56, 0.32 * S);
  const legAt = (L: (typeof LEGS)[number]) => {
    const j = X.body(L.j), [fx, fy, sw] = foot((((h.phase + L.off) % 1) + 1) % 1, S, Hh);
    const a: P2 = [L.j[0] + fx, 953 - fy], k = ik2(j, a, 100, 95, L.fore ? 1 : -1);
    const col = L.near ? LEG : mix(LEG, INK, 0.32), hc = L.near ? HOOF : mix(HOOF, INK, 0.3);
    limb(p, [j, k, a], L.near ? 27 : 25, col);
    // hoof: a rounded block, toe forward; tips back as the foot leaves the ground
    p.rot = [rad(32) * Math.sin(Math.PI * sw), a[0], a[1]];
    p.poly([[a[0] - 14, a[1] - 2], [a[0] + 12, a[1] - 2], [a[0] + 19, a[1] + 21], [a[0] - 15, a[1] + 21]], hc, 6);
    p.stroke([[a[0] - 13, a[1] + 3], [a[0] + 13, a[1] + 3]], 5, mix(col, INK, 0.15));
    p.rot = null;
  };
  LEGS.filter((L) => !L.near).forEach(legAt);
  // ---- tail (behind the body): bushy, swishes ----
  {
    const r = X.body([HX - 140, 650]), sw = h.tail, tip: P2 = [r[0] - 48 - 26 * sw, r[1] + 205 - 18 * Math.abs(sw)];
    const mid: P2 = [r[0] - 58 - 10 * sw + 14 * h.mane, r[1] + 70];
    const c = bez(r, mid, tip, 12), w = c.map((_, i) => { const t = i / 12; return 26 + 46 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - 0.6 * t); });
    const pts = ribbon(c, w);
    p.poly(pts, HAIR, 0);
    p.clip(pts, () => { for (let i = -1; i <= 1; i++) p.stroke(bez([r[0] + 4 * i, r[1] + 10], [mid[0] + 8 * i, mid[1]], [tip[0] + 10 * i, tip[1] - 12], 10), 4, HAIR_HI); });
    p.inkRing(pts, ow, thick);
  }
  LEGS.filter((L) => L.near).forEach(legAt);
  // ---- body: a round bean barrel with dapples ----
  const BB: Blob = { a: 152, b: 92, nTop: 2.3, nBot: 2.05, egg: 0.04, asym: 0.05, rot: rad(-2) + rad(h.tilt), noise: 0.005, seed: 11 };
  const bc = X.body(BODY), bp = blobPts(bc[0], bc[1], BB);
  painted(p, bp, COAT, COAT_SH, light, bc[0], bc[1], BB.a, BB.b);
  p.clip(bp, () => {
    for (const [dx, dy, r] of [[-92, -30, 15], [-64, -52, 11], [-110, 4, 12], [-40, -22, 13], [-76, 18, 10], [-20, -60, 9], [30, -40, 10], [8, -6, 9], [62, -50, 8]] as const) {
      const q = X.body([BODY[0] + dx, BODY[1] + dy]);
      p.ell(q[0], q[1], r, r * 0.86, rgba("#ffffff", 0.3), 0);
    }
  });
  p.mark("torso", bc[0], bc[1], BB.a, BB.b);
  p.inkRing(bp, ow, thick);
  // harness on the barrel: breeching round the rump, back pad + girth
  p.rot = X.rB;
  p.band(bez([HX - 118, 648], [HX - 150, 700], [HX - 112, 770], 10), STRAP, 12, 3.2);
  p.band([[HX + 6, 612], [HX + 18, 700], [HX + 10, 788]], STRAP, 15, 3.2);
  p.poly([[HX - 30, 604], [HX + 44, 602], [HX + 46, 628], [HX - 28, 630]], COLLAR, 5);
  p.dot(HX + 8, 616, 5, BRASS);
  p.rot = null;
  // ---- neck (over the body front), mane on the crest ----
  const nb = X.neck(NECK_B), ntop = X.neck(NECK_T);
  const NB: Blob = { a: 78, b: 58, nTop: 2.2, nBot: 2.2, egg: 0.12, asym: 0, rot: Math.atan2(ntop[1] - nb[1], ntop[0] - nb[0]), noise: 0.004, seed: 12 };
  const nm: P2 = [(nb[0] + ntop[0]) / 2, (nb[1] + ntop[1]) / 2], np = blobPts(nm[0], nm[1], NB);
  painted(p, np, COAT, COAT_SH, light, nm[0], nm[1], 56, 64, 0.6);
  p.inkRing(np, ow, thick);
  // collar + hames at the neck base (covers the seam)
  p.rot = X.rN;
  p.band(bez([HX + 96, 604], [HX + 150, 640], [HX + 152, 722], 12), COLLAR, 30, 3.5);
  p.band(bez([HX + 106, 600], [HX + 164, 636], [HX + 166, 716], 12), BRASS, 7, 2.2);
  p.dot(HX + 160, 676, 6, BRASS); p.arc(HX + 160, 676, 6, 6, 0, 360, 2.5);
  // mane: overlapping tufts along the crest, flowing back with the speed
  for (let i = 0; i < 6; i++) {
    const t = i / 5, c = bez([HX + 112, 600], [HX + 140, 556], [HX + 180, 520], 5)[i], fl = 10 + 18 * h.mane;
    const pts = blobPts(c[0] - fl * (0.6 + 0.4 * t) - 8, c[1] - 6 + 4 * Math.sin(i * 2.1 + h.phase * 6.28), { a: 24 - 4 * t, b: 15, nTop: 2, nBot: 2, egg: 0, asym: -0.1, rot: rad(-35 + 18 * t), noise: 0.01, seed: 20 + i });
    p.poly(pts, i % 2 ? HAIR : mix(HAIR, HAIR_HI, 0.35), 0);
    p.inkRing(pts, 5, thick);
  }
  p.rot = null;
  // ---- head: ears behind, cranium, muzzle, eye, bridle ----
  p.rot = X.rH;
  const hcw = X.head(HEAD_C);
  p.g.save(); p.g.translate(hcw[0], hcw[1]); p.g.scale(HS, HS); p.g.translate(-hcw[0], -hcw[1]);
  const hc = HEAD_C, eA = rad(-78 - 70 * h.ears);
  for (const [dx, near] of [[10, false], [-8, true]] as const) {
    const b: P2 = [hc[0] + dx, hc[1] - 40], tp: P2 = [b[0] + 50 * Math.cos(eA), b[1] + 50 * Math.sin(eA)];
    const pts = ribbon(bez(b, [(b[0] + tp[0]) / 2 + 6, (b[1] + tp[1]) / 2], tp, 8), [24, 26, 26, 24, 21, 17, 12, 7, 2]);
    p.poly(pts, near ? COAT : mix(COAT, INK, 0.2), 0);
    if (near) p.clip(pts, () => p.stroke(bez([b[0] + 2, b[1] - 2], [(b[0] + tp[0]) / 2 + 4, (b[1] + tp[1]) / 2], [tp[0], tp[1]], 6), 9, EAR_IN));
    p.inkRing(pts, 5.5, thick);
  }
  const HB: Blob = { a: 58, b: 50, nTop: 2.2, nBot: 2.3, egg: -0.05, asym: 0.04, rot: rad(16), noise: 0.004, seed: 13 };
  const hp = blobPts(hc[0], hc[1], HB);
  painted(p, hp, COAT, COAT_SH, light, hc[0], hc[1], HB.a, HB.b, 0.9);
  p.inkRing(hp, ow, thick);
  const MB: Blob = { a: 46, b: 36, nTop: 2.3, nBot: 2.2, egg: 0.05, asym: 0.03, rot: rad(36), noise: 0.004, seed: 14 };
  const mp = blobPts(MUZ[0], MUZ[1], MB);
  painted(p, mp, MUZZLE, "#6f797c", light, MUZ[0], MUZ[1], MB.a, MB.b, 0.55);
  p.inkRing(mp, 7, thick);
  // forelock
  for (const [dx, a] of [[-4, 0], [8, 0.4]] as const) {
    const b: P2 = [hc[0] + dx, hc[1] - 44];
    const pts = ribbon(bez(b, [b[0] + 18, b[1] + 8], [b[0] + 26 + 6 * a, b[1] + 30], 6), [16, 16, 14, 11, 8, 5, 2]);
    p.poly(pts, HAIR, 0); p.inkRing(pts, 4.5, thick);
  }
  // nostril + mouth
  p.dot(MUZ[0] + 24, MUZ[1] - 8, 6, INK);
  if (h.mood === "laugh") {
    // horse laugh: lips peeled back, a row of big teeth, open mouth
    const m0: P2 = [MUZ[0] - 22, MUZ[1] + 22], m1: P2 = [MUZ[0] + 34, MUZ[1] + 14];
    const mouthP: P2[] = [m0, ...bez([m0[0] + 6, m0[1] + 2], [MUZ[0] + 8, MUZ[1] + 64], m1, 10)];
    p.poly(mouthP, "#3a1c1e", 6);
    p.clip(mouthP, () => {
      for (let i = 0; i < 4; i++) p.poly([[m0[0] + 8 + i * 13, m0[1] - 2 - i * 2], [m0[0] + 20 + i * 13, m0[1] - 3 - i * 2], [m0[0] + 20 + i * 13, m0[1] + 14 - i * 2], [m0[0] + 8 + i * 13, m0[1] + 15 - i * 2]], "#fbf8ee", 3.5);
      p.ell(MUZ[0] + 6, MUZ[1] + 48, 20, 11, "#d86a5c", 0);
    });
  } else if (h.mood === "shock") {
    p.ell(MUZ[0] + 4, MUZ[1] + 26, 10, 12, "#3a1c1e", 5);
  } else p.stroke(bez([MUZ[0] - 20, MUZ[1] + 20], [MUZ[0] + 4, MUZ[1] + 34], [MUZ[0] + 28, MUZ[1] + 18], 8), 5, INK);
  // eye: big and round, blinks; wide with a tiny pupil on the shock, happy arcs while laughing
  const ex = hc[0] + 18, ey = hc[1] - 6;
  if (h.mood === "laugh") p.arc(ex, ey + 6, 14, 12, 200, 340, 6);
  else if (h.blink > 0.75) p.arc(ex, ey + 2, 14, 9, 20, 160, 6);
  else {
    const big = h.mood === "shock" ? 1.25 : 1;
    p.ell(ex, ey, 14 * big, 17 * big, "#ffffff", 5);
    p.dot(ex + 5, ey + 2, h.mood === "shock" ? 5 : 9.5, INK);
    p.dot(ex + 1.5, ey - 3.5, h.mood === "shock" ? 2 : 3.6, "#ffffff");
    if (h.blink > 0.25) p.clip(blobPts(ex, ey, { a: 15 * big, b: 18 * big, nTop: 2, nBot: 2, egg: 0, asym: 0, rot: 0, noise: 0, seed: 1 }), () => {
      p.poly([[ex - 20, ey - 22], [ex + 20, ey - 22], [ex + 20, ey], [ex - 20, ey]], COAT, 0); p.stroke([[ex - 15, ey], [ex + 15, ey]], 5, INK);
    });
  }
  // bridle: crown piece behind the ears, browband, cheek strap to the bit, noseband round the muzzle
  p.band([[hc[0] - 24, hc[1] - 34], [hc[0] - 14, hc[1] + 6], [BIT0[0] - 4, BIT0[1] - 8]], STRAP, 8, 2.4);
  p.band([[hc[0] - 22, hc[1] - 32], [hc[0] + 14, hc[1] - 44]], STRAP, 7, 2.2);
  p.band(bez([MUZ[0] - 36, MUZ[1] - 22], [MUZ[0] - 8, MUZ[1] - 26], [MUZ[0] + 6, MUZ[1] - 40], 6), STRAP, 8, 2.4);
  p.arc(BIT0[0], BIT0[1], 8, 8, 0, 360, 8.5, INK); p.arc(BIT0[0], BIT0[1], 8, 8, 0, 360, 4, STEEL);
  p.g.restore();
  p.rot = null;
};

/** horse pose at f (the stage adds the light angle) */
export const horsePose = (f: number, light: number): HorsePose => {
  const v = velAt(f), go = smooth(v / 0.02), stride = strideAt(v);
  const amp = (go * BETA * stride) / (SUH * STEP); // stance travel (no foot slide) in STEP units
  const ph = phaseAt(f), n = f - W_F1;
  const ins = f >= 904 && f < 924, laugh = f >= 924;
  const toss = n >= -3 ? 1.0 * Math.exp(-Math.max(0, n) / 7) * smooth((n + 3) / 3) : 0; // "whoa": head up at the stop
  const blinkAt = [858, 881, 935].find((k) => f >= k && f < k + 4);
  return {
    phase: Math.round(ph * 48) / 48, amp: Math.round(Math.min(1.15, amp) * 50) / 50,
    bob: Math.round(5 * go * Math.cos(4 * Math.PI * ph)), nod: Math.round(4 * go * Math.sin(4 * Math.PI * ph + 1) + (laugh ? -6 + 4 * Math.sin(f * 0.62) : ins ? -4 : 0)),
    tilt: Math.round(-5 * brakeAt(f) + (n >= 0 ? 3 * Math.exp(-n / 5) * Math.sin(n * 0.8) : 0)),
    neck: Math.round(-12 * toss - (laugh ? 14 : ins ? 6 : 0)),
    tail: Math.round((0.55 * Math.sin(f * 0.21) + (n >= 0 ? 0.6 * Math.exp(-n / 8) * Math.sin(n * 0.9) : 0)) * 10) / 10,
    mane: Math.round(clamp01(v / 0.1) * 10) / 10, blink: blinkAt !== undefined ? [0.5, 1, 1, 0.5][f - blinkAt] : 0,
    ears: ins ? 1 : 0, mood: laugh ? "laugh" : ins ? "shock" : "calm", light,
  };
};

// ---------------- the wagon in 3D ----------------
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => boxGeo(V(x0, y0, z0), V(x1, y1, z1), 0, true);
const RR = 0.48, RF = 0.38; // rear / front wheel radius
const REAR_X = -0.72, FRONT_X = 0.66, TRACK = 0.66;
const HOOK: V3 = [1.36, 1.93, 0.43];
class WagonRig {
  g = new THREE.Group();
  wheels: { g: THREE.Group; r: number }[] = [];
  lamp = new THREE.Group();
  glow: THREE.Sprite; pool: THREE.Mesh;
  reins: THREE.Mesh[] = [];
  private v = new THREE.Vector3(); private q = new THREE.Quaternion(); private up = new THREE.Vector3(0, 1, 0);
  constructor(root: THREE.Object3D) {
    const M = {
      wood: lam("wgWood", () => ({ color: "#8a8c74" })),       // weathered boards (G >= R)
      dark: lam("wgDark", () => ({ color: "#55574a" })),
      paint: lam("wgPaint", () => ({ color: "#557f6c" })),     // faded sage-green box
      iron: lam("wgIron", () => ({ color: "#2f3333" })),
      hay: lam("wgHay", () => ({ color: "#c4b65e" })),
      strap: lam("wgStrap", () => ({ color: "#3d3f36" })),
    };
    const b = new Batch();
    // running gear: axles, bolsters, reach
    for (const [x, y] of [[REAR_X, RR], [FRONT_X, RF]] as const) {
      b.add(box(x - 0.05, y - 0.04, -TRACK - 0.08, x + 0.05, y + 0.04, TRACK + 0.08), M.dark);
      b.add(box(x - 0.07, y + 0.04, -0.58, x + 0.07, 0.62, 0.58), M.dark);
    }
    b.add(box(REAR_X - 0.1, 0.42, -0.04, FRONT_X + 0.1, 0.48, 0.04), M.dark);
    // bed: floor, sage-green side + end boards, wooden top rails, iron-shod stakes
    b.add(box(-1.15, 0.62, -0.52, 1.05, 0.68, 0.52), M.wood);
    for (const s of [-1, 1]) {
      b.add(box(-1.15, 0.68, s > 0 ? 0.48 : -0.54, 1.05, 1.0, s > 0 ? 0.54 : -0.48), M.paint);
      b.add(box(-1.17, 1.0, s > 0 ? 0.47 : -0.565, 1.07, 1.04, s > 0 ? 0.565 : -0.47), M.wood);
      b.add(box(-1.15, 0.79, s > 0 ? 0.54 : -0.55, 1.05, 0.82, s > 0 ? 0.55 : -0.54), M.wood); // rub strip
      for (const x of [-1.06, -0.36, 0.34, 0.98]) {
        b.add(box(x - 0.028, 0.6, s > 0 ? 0.54 : -0.585, x + 0.028, 1.07, s > 0 ? 0.585 : -0.54), M.dark);
        b.add(box(x - 0.032, 0.6, s > 0 ? 0.545 : -0.59, x + 0.032, 0.66, s > 0 ? 0.59 : -0.545), M.iron);
      }
    }
    b.add(box(1.0, 0.68, -0.48, 1.05, 0.98, 0.48), M.paint);
    b.add(box(-1.15, 0.68, -0.48, -1.1, 0.95, 0.48), M.paint);
    // box seat (driver) + seat board, slanted dash board in front of it
    b.add(box(0.5, 0.68, -0.46, 0.92, 1.12, 0.46), M.wood);
    b.add(box(0.47, 1.12, -0.5, 0.95, 1.16, 0.5), M.dark);
    b.add(box(-0.02, 0, -0.47, 0.02, 0.34, 0.47).rotateZ(-0.55).translate(1.08, 0.66, 0), M.wood);
    // hay in the bed round the passengers
    for (const [x, z, r, sy] of [[-0.45, 0.05, 0.42, 0.42], [-0.95, -0.15, 0.3, 0.5], [0.12, -0.2, 0.32, 0.45], [-0.2, 0.3, 0.26, 0.38], [-0.85, 0.3, 0.24, 0.4]] as const)
      b.add(new THREE.SphereGeometry(r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.5, sy, 1).translate(x, 0.68, z), M.hay);
    // shafts: from the front axle up along the horse's sides to its collar; a cross bar behind the horse
    const tip: V3 = [HORSE_DX + 0.42, 0.93, 0];
    for (const s of [-1, 1]) {
      const z = 0.4 * s, pts: V3[] = [[FRONT_X + 0.02, RF + 0.06, z], [1.5, 0.62, z], [tip[0] - 0.45, 0.86, z], [tip[0], tip[1], z]];
      for (let i = 0; i < 3; i++) {
        const a = V(...pts[i]), c = V(...pts[i + 1]), L = a.distanceTo(c);
        const g = new THREE.CylinderGeometry(0.028, 0.03, L + 0.02, 16).translate(0, L / 2, 0);
        g.applyQuaternion(this.q.setFromUnitVectors(this.up, c.clone().sub(a).normalize())); g.translate(a.x, a.y, a.z);
        b.add(g, M.wood);
      }
      b.add(new THREE.SphereGeometry(0.036, 16, 12).translate(tip[0], tip[1], z), M.iron);
    }
    b.add(box(1.32, 0.6, -0.42, 1.38, 0.66, 0.42), M.dark);
    // lantern pole on the front corner: post, a crook arm, the hook
    b.add(box(1.11, 0.66, 0.405, 1.16, 2.0, 0.455), M.dark);
    b.add(box(1.11, 1.95, 0.41, 1.4, 1.99, 0.45), M.dark);
    b.add(box(HOOK[0] - 0.008, HOOK[1] - 0.04, HOOK[2] - 0.008, HOOK[0] + 0.008, HOOK[1], HOOK[2] + 0.008), M.iron);
    b.build(this.g, true);
    // wheels: iron tyre on a wooden felloe, 12 spokes, a fat hub (each a group, spun by the distance rolled)
    for (const [x, r] of [[REAR_X, RR], [FRONT_X, RF]] as const) for (const s of [-1, 1]) {
      const w = new THREE.Group(), wb = new Batch();
      // smooth wheels (user: "the wagon looks bumpy / jagged"): 96 segments round (was 28, facets showed in close-ups)
      wb.add(new THREE.TorusGeometry(r - 0.03, 0.034, 12, 96), M.wood);
      wb.add(new THREE.TorusGeometry(r - 0.004, 0.012, 10, 96).scale(1, 1, 3.2), M.iron);
      wb.add(new THREE.CylinderGeometry(0.075, 0.085, 0.2, 40).rotateX(Math.PI / 2), M.dark);
      wb.add(new THREE.CylinderGeometry(0.05, 0.05, 0.24, 32).rotateX(Math.PI / 2), M.iron);
      for (let i = 0; i < 12; i++) wb.add(box(-0.016, 0.06, -0.014, 0.016, r - 0.05, 0.014).rotateZ((i / 12) * Math.PI * 2), M.wood);
      wb.build(w, true); w.position.set(x, r, s * TRACK); this.g.add(w); this.wheels.push({ g: w, r });
    }
    // the lantern (world.ts "a real lantern" frame), hanging from the hook; swings about it
    {
      const m = this.lamp, iron = lam("bwLanternIron", () => ({ color: "#2b2724" })), body = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.11), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.45, 0.55) }));
      glass.layers.set(NOINK); body.add(glass);
      const part = (g: THREE.BufferGeometry) => body.add(new THREE.Mesh(g, iron));
      part(new THREE.BoxGeometry(0.15, 0.03, 0.15).translate(0, -0.09, 0));
      part(new THREE.BoxGeometry(0.15, 0.02, 0.15).translate(0, 0.085, 0));
      part(new THREE.ConeGeometry(0.1, 0.07, 4).rotateY(Math.PI / 4).translate(0, 0.13, 0));
      for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(new THREE.BoxGeometry(0.016, 0.17, 0.016).translate(0.062 * bx, 0, 0.062 * bz));
      part(new THREE.TorusGeometry(0.045, 0.008, 8, 24, Math.PI).translate(0, 0.17, 0));
      body.position.set(0, -0.255, 0); m.add(body); m.position.set(HOOK[0], HOOK[1] - 0.04, HOOK[2]); this.g.add(m);
    }
    this.glow = halo(new THREE.Color(0.95, 0.55, 0.2), 1.4);
    this.pool = pool(new THREE.Color(0.5, 0.28, 0.09), 2.2, 2.2);
    for (let i = 0; i < 7; i++) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 10).translate(0, 0.5, 0), M.strap);
      r.castShadow = false; this.reins.push(r); root.add(r);
    }
    this.g.visible = false; root.add(this.g, this.glow, this.pool);
  }
  update(f: number, on: boolean) {
    this.g.visible = this.glow.visible = this.pool.visible = on;
    this.reins.forEach((r) => (r.visible = on && REINS.on));
    if (!on) return;
    const x = wagonX(f), d = x - wagonX(W_F0), n = f - W_F1;
    this.g.position.set(x, wagonBounce(f), WZ); this.g.rotation.set(0, 0, wagonPitch(f));
    for (const w of this.wheels) w.g.rotation.z = -d / w.r;
    // the lantern leans forward while braking, swings on the stop and settles; a little sway on the road
    this.lamp.rotation.z = 0.32 * smooth(brakeAt(f)) + (n >= 0 ? 0.3 * Math.exp(-n / 13) * Math.sin(n * 0.42 + 1.3) : 0) + 0.05 * clamp01(velAt(f) / 0.05) * Math.sin(d * 2.6);
    this.g.updateMatrixWorld(true);
    this.lamp.children[0].getWorldPosition(this.v);
    this.glow.position.copy(this.v); this.glow.scale.setScalar(0.85 * (1 + 0.06 * Math.sin(f * 0.8)));
    this.pool.position.set(this.v.x, 0.02, this.v.z);
    // reins: a slack strap from the driver's hand to the bit (sags most at rest)
    if (REINS.on) {
      const a = V(...REINS.a), c = V(...REINS.b), sag = 0.05 + 0.05 * clamp01(1 - velAt(f) / 0.05), pts: THREE.Vector3[] = [];
      for (let i = 0; i <= this.reins.length; i++) { const t = i / this.reins.length; pts.push(a.clone().lerp(c, t).add(V(0, -4 * sag * t * (1 - t), 0))); }
      this.reins.forEach((r, i) => {
        const p0 = pts[i], p1 = pts[i + 1], L = p0.distanceTo(p1);
        r.position.copy(p0); r.quaternion.setFromUnitVectors(this.up, p1.clone().sub(p0).normalize()); r.scale.set(1, L, 1);
      });
    }
  }
}
const RIGS = new WeakMap<THREE.Object3D, WagonRig>();
/** world.ts WAGON hook: builds the wagon once under `root`, then poses it for frame f (shown only in shot 13) */
export const wagonUpdate = (root: THREE.Object3D, f: number, on: boolean) => {
  let r = RIGS.get(root);
  if (!r) { r = new WagonRig(root); RIGS.set(root, r); }
  r.update(f, on);
};
