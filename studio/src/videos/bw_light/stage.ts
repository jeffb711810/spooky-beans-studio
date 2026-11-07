// Who stands where, doing what, in every shot of "The Bell Witch"; effect cards and per-frame prop states.
// Reactions land 0-3 frames before their word (word frames from voice/words.json). Kate is never drawn: only
// what she does (knocks, gnawing, the sliding quilt, the yank, the slap, her voice rings, the bent flame).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, FrontOpts, SideOpts, Expr, fxNote, fxPuff } from "../bridge/toon";
import { Who, john, johnBed, lucy, lucyBed, betsy, betsyBed, son, writer, fisher, folk, tier } from "./cast";
import {
  fxKnock, fxChips, fxVoice, fxFlame, catCard, CatPose, catGhost, fishCard, ratCard, witchCard, dropCard, fxPlip, fxWhisper, fxBubble, fxGhostNote,
  fxShock, fxSweat, fxShiver, fxSpeed, fxSwoosh, fxHand, fxTwinkle, fxDizzy, fxSteam, fxTwitch, fxTongue, fxAura, fxTuft,
} from "./fxart";
import { Shot, X0, GRAVE, V3, smooth, clamp01 } from "./story";

export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; soft?: boolean; rot?: number; glow?: number };
export type Props = {
  windows: number[]; quiltB: number; chairDown: number; johnLying: boolean; vial: boolean; saucer: boolean; book: boolean; plates: boolean;
  lanterns: V3[];
};
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[]; props: Props; focus?: V3 };

// ---------------- helpers ----------------
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 100) => Math.round(v * n) / n;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, seed: number) => {
  let s = Math.round(-50 * hh(seed, 9));
  for (let n = 0; s <= f && n < 300; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hh(seed * 31 + n, 13)); }
  return 0;
};
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = cam.sun.dot(cam.right) * (mirror ? -1 : 1), sy = -cam.sun.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const tmp = new THREE.Vector3();
type PO = FrontOpts & { scale?: number; roll?: number; side?: boolean; so?: SideOpts; mirror?: boolean; awake?: boolean; shut?: boolean; f: number };
/** one character card; `awake: false` keeps the eyes shut (asleep) */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, o: PO): Place => {
  const scale = o.scale ?? 1, d = cam.pos.distanceTo(tmp.set(x, y + 1.2 * scale, z)) / scale, [w, h, k] = tier(d);
  const mirror = !!o.mirror, light = light2D(cam, mirror && !!o.side);
  const blink = o.awake === false || o.shut ? 1 : lidAt(o.f, who.seed * 7);
  if (o.side) {
    const s2: SideOpts = { mode: "stand", ...o.so, light, seed: who.seed, blink };
    return { key: `S|${who.k}|${fkey(s2)}`, x, y, z, scale, mirror, roll: o.roll, size: [w, h, k], draw: (p) => bodySide(p, who.o, s2) };
  }
  const { f: _f, scale: _s, roll: _r, side: _d, so: _so, mirror: _m, awake: _a, shut: _sh, ...fo } = o;
  const f2: FrontOpts = { mode: "stand", ...fo, light, seed: who.seed, blink };
  return { key: `F|${who.k}|${fkey(f2)}`, x, y, z, scale, mirror, roll: o.roll, size: [w, h, k], draw: (p) => bodyFront(p, who.o, f2) };
};
/** expression timeline: [[frame, expr], ...] -> expr at f */
const ex = (f: number, tl: [number, Expr][]): Expr => { let e = tl[0][1]; for (const [k, v] of tl) if (f >= k) e = v; return e; };
const fx = (key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: Partial<FxPlace> = {}): FxPlace =>
  ({ key, cw, ch, draw, x, y, z, w, h, ...extra });
/** quantised effect time so the canvas pool reuses drawings (12 steps) */
const qt = (u: number, n = 12) => Math.round(clamp01(u) * n) / n;
const knock = (f: number, at: number, x: number, y: number, z: number, s = 1.0, seed = 1, col = "#ffd77a", glow = 1.3) => {
  const u = (f - at) / 12;
  return u >= 0 && u <= 1 ? [fx(`knock${seed}${col}${qt(u)}`, 500, 500, (p) => fxKnock(p, qt(u), seed, col), x, y, z, s, s, { soft: true, glow })] : [];
};
const flameAt = (f: number, x: number, y: number, z: number, bend = 0, s = 1): FxPlace => {
  const fl = Math.round(3 * Math.sin(f * 0.9) + 2 * Math.sin(f * 2.3));
  return fx(`flame${q(bend, 10)}_${fl}`, 200, 400, (p) => fxFlame(p, q(bend, 10), fl / 3), x, y, z, 0.06 * s, 0.12 * s, { soft: true, glow: 4.5 });
};
const voice = (f: number, x: number, y: number, z: number, s: number, col = "#b9f3d0") => {
  const u = ((f % 24) / 24);
  return fx(`voice${col}${qt(u)}`, 600, 600, (p) => fxVoice(p, qt(u), col), x, y, z, s, s, { soft: true, glow: 1.4 });
};
// ---------------- acting helpers ----------------
/** a "take": 3 f anticipation crouch, pop up, settle with a small overshoot (metres of lift) */
const take = (f: number, at: number, h = 0.05) => {
  const n = f - at;
  if (n < -3 || n > 16) return 0;
  if (n < 0) return -0.3 * h * Math.sin(((n + 3) / 3) * (Math.PI / 2));
  if (n < 3) return -0.3 * h + 1.3 * h * Math.sin((n / 3) * (Math.PI / 2));
  return h * Math.exp(-(n - 3) / 3.5) * Math.cos((n - 3) * 0.55);
};
/** eyes squeezed on the 2 frames before a take */
const shutBefore = (f: number, ...at: number[]) => at.some((k) => f >= k - 2 && f < k);
/** idle sway (card roll, radians): slow, two sines */
const sway = (f: number, seed: number, a = 0.012) => a * Math.sin(f / 23 + seed * 1.7) + 0.4 * a * Math.sin(f / 9.3 + seed);
/** scared tremble (roll flips every frame) */
const trem = (f: number, a = 0.01) => (f % 2 ? a : -a);
/** decay after an event: 1 at `at`, e-folding over `k` frames */
const after = (f: number, at: number, k = 8) => (f >= at ? Math.exp(-(f - at) / k) : 0);
/** head-centre height above the sole and head radius (m) of the bridge toon builds */
const HEAD = { adult: { stand: 1.44, sit: 0.86, r: 0.255, chin: 0.24 }, kid: { stand: 1.07, sit: 0.7, r: 0.242, chin: 0.227 } };
type Build = keyof typeof HEAD;
/** world point on a card: card-local (px right, py up) from the sole, with the card roll; nudged toward the camera */
const onCard = (cam: CamInfo, x: number, y: number, z: number, px: number, py: number, roll = 0, toward = 0.06): V3 => {
  const c = Math.cos(roll), s = Math.sin(roll), lx = px * c - py * s, ly = px * s + py * c;
  tmp.set(cam.pos.x - x, 0, cam.pos.z - z).normalize();
  return [x + cam.right.x * lx + tmp.x * toward, y + ly, z + cam.right.z * lx + tmp.z * toward];
};
/** card-local point on a head: (dx, dy) from the head centre, with headTilt (deg, clockwise on screen) about the chin */
const headLocal = (b: Build, sit: boolean, dx: number, dy: number, tiltDeg = 0, scale = 1): [number, number] => {
  const H = HEAD[b], hc = (sit ? H.sit : H.stand) * scale, ch = H.chin * scale, a = (-tiltDeg * Math.PI) / 180;
  const rx = dx * scale, ry = dy * scale + ch;
  return [rx * Math.cos(a) - ry * Math.sin(a), hc - ch + rx * Math.sin(a) + ry * Math.cos(a)];
};
const NIGHTSTAND_FLAME: V3 = [X0 - 0.3, 1.0, -2.72], CRATE_FLAME: V3 = [X0 + 3.55, 0.7, -2.65];
const SIT = 0.66; // card sole height when sitting up in bed (legs hidden in the mattress)
const I = (x: number, y: number, z: number): V3 => [X0 + x, y, z];

export const stage = (f: number, s: Shot, cam: CamInfo): Stage => {
  const P: Place[] = [], F: FxPlace[] = [];
  const props: Props = { windows: [1, 1, 1, 1], quiltB: 0, chairDown: 0, johnLying: false, vial: f >= 1101, saucer: false, book: false, plates: false, lanterns: [] };
  let focus: V3 | undefined;
  const add = (who: Who, x: number, y: number, z: number, o: PO) => P.push(person(cam, who, x, y, z, o));
  // ---- small acting effects pinned to a head (b = build, sit, card roll, headTilt deg, card scale) ----
  type HeadAt = { x: number; y: number; z: number; b: Build; sit?: boolean; roll?: number; tilt?: number; sc?: number };
  const hp = (h: HeadAt, dx: number, dy: number, toward = 0.08) => {
    const [lx, ly] = headLocal(h.b, !!h.sit, dx, dy, h.tilt ?? 0, h.sc ?? 1);
    return onCard(cam, h.x, h.y, h.z, lx, ly, h.roll ?? 0, toward);
  };
  /** shock lines for 12 f after `at` */
  const shockFx = (h: HeadAt, at: number) => {
    const u = (f - at) / 12, r = HEAD[h.b].r * (h.sc ?? 1);
    if (u >= 0 && u < 1) F.push(fx(`shock${qt(u)}`, 400, 400, (p) => fxShock(p, qt(u)), ...hp(h, 0, 0.02), r * 3.6, r * 3.6, { soft: true, glow: 1.15 }));
  };
  /** a sweat (or tear) drop running down the side of the head, looping every `per` frames from `from` */
  const sweatFx = (h: HeadAt, from: number, side = 1, per = 22, col = "#bfe6ff") => {
    if (f < from) return;
    const u = qt(((f - from) % per) / per, 11), r = HEAD[h.b].r * (h.sc ?? 1);
    F.push(fx(`sweat${col}${u}`, 160, 240, (p) => fxSweat(p, u, col), ...hp(h, side * r * 0.95, r * 0.35), r * 0.5, r * 0.75, { soft: true, glow: 1.1 }));
  };
  /** shiver marks either side of a figure (w = card width in m) */
  const shiverFx = (x: number, y: number, z: number, w: number) =>
    F.push(fx(`shiver${f % 2}`, 500, 500, (p) => fxShiver(p, f % 2), ...onCard(cam, x, y, z, 0, 0, 0, 0.05), w, w, { soft: true, glow: 1.1 }));

  const inside = s.light === "candle";
  if (inside) {
    if (!(f >= 1176 && f < 1196)) F.push(flameAt(f, ...NIGHTSTAND_FLAME, s.id === 10 ? smooth((f - 684) / 16) * 0.9 : 0));
    else if (f < 1192) F.push(fx(`puff${qt((f - 1176) / 16)}`, 300, 300, (p) => fxPuff(p, qt((f - 1176) / 16)), NIGHTSTAND_FLAME[0], 1.1 + (f - 1176) * 0.01, NIGHTSTAND_FLAME[2], 0.25, 0.25, { soft: true }));
    F.push(flameAt(f, ...CRATE_FLAME, s.id === 10 ? -smooth((f - 684) / 16) * 0.9 : 0));
    if (f >= 482 && f < 948) props.quiltB = 1;
    for (const [dz, k] of [[0.08, 0], [0.25, 1], [0.42, 2]] as const) F.push(flameAt(f + k * 7, X0 + 3.46, 0.36 + 0.04 * (k % 2), dz, 0.15 * Math.sin(f / 6 + k), 3.4 - 0.6 * (k % 2)));
  }
  switch (s.id) {
    case 1: { // the farmhouse; John on the porch with a lantern; lights go out on "didn't exist"
      props.windows = [f < 108 ? 1 : 0, f < 112 ? 1 : 0, f < 116 ? 1 : 0, f < 104 ? 1 : 0];
      add(john, 1.7, 0.25 + take(f, 106, 0.05), 3.7, { f, expr: ex(f, [[0, "neutral"], [61, "nervous"], [106, "shock"]]), look: f < 80 ? -0.6 : 0.6,
        shut: shutBefore(f, 106), roll: sway(f, 1) + (f >= 61 && f < 106 ? trem(f, 0.006) : 0), headTilt: f >= 106 ? 0 : -4 });
      props.lanterns.push([2.12, 1.15 + 0.6 * take(f, 106, 0.05), 3.78]);
      break;
    }
    case 2: { // the family who swore: a glance at each other, then a firm, shared nod on "swore"
      const e = ex(f, [[129, "nervous"], [154, "stern"]]), nod = f >= 154 && f < 168 ? Math.sin(((f - 154) / 14) * Math.PI) : 0, dn = -0.03 * nod;
      const glance = f < 150;
      add(john, -0.75, dn, 5.9, { f, expr: e, headTilt: 7 * nod, look: glance ? 1 : 0, roll: sway(f, 1) });
      add(lucy, 0.25, dn, 5.9, { f, expr: e, headTilt: -7 * nod, look: glance ? -1 : 0, roll: sway(f, 2) });
      add(betsy, -0.35, dn, 6.8, { f, expr: e, headTilt: 6 * nod, look: glance ? 1 : 0, roll: sway(f, 3) });
      add(son, 0.6, dn, 6.85, { f, expr: ex(f, [[129, "nervous"], [158, "stern"]]), look: glance ? -1 : 0, roll: sway(f, 4) });
      props.lanterns.push([-0.3, 0.95, 5.95]);
      break;
    }
    case 3: { // asleep; knocks on the walls: each one jolts them, heads snap toward it, they recoil
      const K: [number, number, number, number][] = [[247, -3.2, 2.2, 1.05], [260, -1.25, 1.95, 1.0], [273, -3.35, 1.3, 1.0], [282, -2.25, 2.45, 1.2]];
      const react = (cx: number) => { // look toward the latest knock, lean away from it
        let L = 0, T = 0;
        for (const [k, kx] of K) if (f >= k + 1) { const d = X0 + kx - cx; L = Math.max(-1, Math.min(1, d * 1.6)); T = -Math.sign(d) * 7 * after(f, k + 1, 7); }
        return { L, T };
      };
      const jx = X0 - 2.65, lx = X0 - 1.85, bx = X0 + 2.2, wJ = 249, wL = 255, wB = 262;
      const rj = react(jx), rl = react(lx);
      const rJ = sway(f, 1, 0.006), rL = sway(f, 2, 0.006) + (f > wL + 12 ? trem(f, 0.01) : 0);
      add(johnBed, jx, SIT + take(f, wJ, 0.07) + take(f, 273, 0.03), -2.0, { f, mode: "sit", awake: f >= wJ, expr: f >= wJ ? "shock" : "neutral", look: f >= wJ ? rj.L : 0, tilt: rj.T, roll: rJ });
      add(lucyBed, lx, SIT + take(f, wL, 0.07) + take(f, 284, 0.03), -2.0, { f, mode: "sit", awake: f >= wL, expr: f >= wL ? (f >= 286 ? "nervous" : "shock") : "neutral", look: f >= wL ? rl.L : 0, tilt: rl.T, roll: rL });
      add(betsyBed, bx, SIT + take(f, wB, 0.06), -2.1, { f, mode: "sit", awake: f >= wB, expr: f >= wB ? "nervous" : "neutral", look: -1, roll: sway(f, 3, 0.006) + (f > wB + 8 ? trem(f, 0.01) : 0) });
      shockFx({ x: jx, y: SIT + take(f, wJ, 0.07), z: -2.0, b: "adult", sit: true, roll: rJ }, wJ);
      shockFx({ x: lx, y: SIT + take(f, wL, 0.07), z: -2.0, b: "adult", sit: true, roll: rL }, wL);
      if (f > wL + 12) shiverFx(lx, SIT + 0.75, -2.0, 0.9);
      sweatFx({ x: jx, y: SIT, z: -2.0, b: "adult", sit: true, roll: rJ }, wJ + 14, -1);
      K.forEach(([k, kx, ky, ks], i) => F.push(...knock(f, k, X0 + kx, ky, -2.88, ks, i + 1)));
      break;
    }
    case 4: { // gnawing in the headboard between them: John leans in to listen, both jolt on "rat"
      const jx = X0 - 2.65, lx = X0 - 1.85;
      const jT = f < 337 ? 6 * smooth((f - 306) / 20) : -7 * after(f, 337, 10) - 2, lT = f < 337 ? -4 : 6 * after(f, 337, 10) + 3;
      const rJ = sway(f, 1, 0.006), rL = sway(f, 2, 0.006) + trem(f, 0.008);
      add(johnBed, jx, SIT + take(f, 337, 0.06), -1.95, { f, mode: "sit", expr: ex(f, [[303, "nervous"], [337, "shock"]]), look: 1, tilt: jT, roll: rJ, shut: shutBefore(f, 337) });
      add(lucyBed, lx, SIT + take(f, 337, 0.04), -1.95, { f, mode: "sit", expr: ex(f, [[303, "shock"], [337, "nervous"]]), look: -1, tilt: lT, roll: rL });
      shockFx({ x: jx, y: SIT + take(f, 337, 0.06), z: -1.95, b: "adult", sit: true, roll: rJ, tilt: jT }, 337);
      sweatFx({ x: lx, y: SIT, z: -1.95, b: "adult", sit: true, roll: rL, tilt: lT }, 312, 1, 20);
      if (f >= 314) {
        const u = qt(((f - 314) % 10) / 10, 10), bite = Math.round(clamp01((f - 314) / 40) * 4) / 4;
        F.push(fx(`chips${u}_${bite}`, 400, 400, (p) => fxChips(p, u, bite), X0 - 2.25, 1.12, -2.86, 0.78, 0.78, { soft: true, glow: 1.15 }));
      }
      break;
    }
    case 5: { // tears the room apart (head whips side to side, little hops); "No rat." deadpan + sweat drop
      props.chairDown = clamp01((f - 388) / 8);
      const search = f < 421, side = Math.floor(f / 9) % 2 ? 1 : -1, hopS = search && f >= 384 ? 0.025 * Math.abs(Math.sin((f / 9) * Math.PI)) : 0;
      const jR = search ? 0.03 * side * Math.abs(Math.sin((f / 9) * Math.PI)) : sway(f, 1, 0.006);
      add(john, X0 - 0.6, hopS, -0.4, { f, expr: ex(f, [[378, "stern"], [396, "nervous"], [421, "neutral"]]), look: search ? side : 0,
        tilt: search ? 7 * Math.sin(f / 4) : 0, wave: f >= 384 && f < 404 ? 1 : undefined, roll: jR });
      add(lucyBed, X0 - 1.85, SIT, -2.0, { f, mode: "sit", expr: "nervous", look: 1, roll: sway(f, 2, 0.006) + trem(f, 0.008), tilt: f >= 389 && f < 400 ? -6 : 0 });
      sweatFx({ x: X0 - 0.6, y: 0, z: -0.4, b: "adult" }, 424, 1, 30);
      if (f >= 389 && f < 401) F.push(fx(`puffC${qt((f - 389) / 12)}`, 300, 300, (p) => fxPuff(p, qt((f - 389) / 12)), X0 - 0.1, 0.25, -1.1, 0.8, 0.8, { soft: true }));
      break;
    }
    case 6: { // the covers slide off: speed lines behind the quilt, a flump of dust, Betsy jolts awake and shivers
      const qv = smooth((f - 460) / 22);
      props.quiltB = qv;
      const bx = X0 + 2.2, rB = sway(f, 3, 0.006) + (f >= 474 ? trem(f, 0.012) : 0);
      add(betsyBed, bx, SIT + take(f, 466, 0.07), -2.1, { f, mode: "sit", awake: f >= 466, expr: f >= 466 ? "shock" : "neutral", look: 0.4, roll: rB, tilt: f >= 466 ? -4 : 0 });
      shockFx({ x: bx, y: SIT + take(f, 466, 0.07), z: -2.1, b: "kid", sit: true, roll: rB }, 466);
      if (f >= 474) shiverFx(bx, SIT + 0.6, -2.05, 0.95);
      sweatFx({ x: bx, y: SIT, z: -2.1, b: "kid", sit: true, roll: rB }, 476, 1, 20);
      if (f >= 461 && f < 484) {
        const u = qt((f - 461) / 23, 8), qy = 0.78 - 0.74 * qv * qv, qz = -2.0 + 1.25 * qv;
        F.push(fx(`speedQ${u}`, 600, 300, (p) => fxSpeed(p, u), bx, qy + 0.45, qz - 0.15, 0.9, 0.5, { soft: true, rot: -Math.PI / 2, glow: 1.1 }));
      }
      if (f >= 481 && f < 495) F.push(fx(`puffQ${qt((f - 481) / 14)}`, 300, 300, (p) => fxPuff(p, qt((f - 481) / 14)), bx, 0.18, -0.6, 1.2, 1.2, { soft: true }));
      break;
    }
    case 7: { // something yanks her hair: a beat of dread, then she is hauled up by a tuft pulled straight up
      const up = f >= 505 ? smooth((f - 505) / 5) * (1 - 0.6 * smooth((f - 540) / 12)) : 0;
      const bx = X0 + 2.2, roll = 0.06 * up * Math.sin(f * 0.9) + (f < 505 ? trem(f, 0.006) : 0), tilt = -8 * up, y = SIT + 0.2 * up - (f >= 502 && f < 505 ? 0.015 : 0);
      add(betsyBed, bx, y, -2.1, { f, mode: "sit", pull: up, expr: f >= 505 ? "pained" : "nervous", roll, headTilt: tilt, look: f < 505 ? (Math.floor(f / 12) % 2 ? 1 : -1) : 0 });
      const h: HeadAt = { x: bx, y, z: -2.1, b: "kid", sit: true, roll, tilt };
      shockFx(h, 505);
      if (f >= 505) {
        const r = HEAD.kid.r;
        F.push(fx(`tuft${f % 2}`, 300, 400, (p) => fxTuft(p, f % 2), ...hp(h, 0.02, r * 0.9 + 0.17, 0.03), 0.3, 0.4, { soft: true, glow: 1.05 }));
        const u = qt(((f - 505) % 10) / 10, 5);
        F.push(fx(`speedU${u}`, 600, 300, (p) => fxSpeed(p, u), ...hp(h, -r * 1.25, r * 0.6, 0.02), 0.6, 0.3, { soft: true, rot: Math.PI / 2, glow: 1.05 }));
        F.push(fx(`speedU${u}`, 600, 300, (p) => fxSpeed(p, u), ...hp(h, r * 1.25, r * 0.6, 0.02), 0.6, 0.3, { soft: true, rot: Math.PI / 2, glow: 1.05 }));
      } else sweatFx(h, 497, 1, 16);
      break;
    }
    case 8: { // "It's just the wind," John says: a smug little shrug, eyes shut, waving it off
      const smug = f >= 586;
      add(john, X0 - 1.0, 0, -1.4, { f, expr: ex(f, [[557, "neutral"], [586, "smile_closed"]]), look: 0, wave: f >= 566 && f < 600 ? 0.6 + 0.4 * Math.sin(f / 3) : undefined,
        headTilt: smug ? 9 * smooth((f - 586) / 5) : 0, tilt: smug ? -4 * smooth((f - 586) / 5) : 0, roll: sway(f, 1) });
      break;
    }
    case 9: { // the wind slaps her: a gust swooshes in from the right, smack, hand print, dizzy stars
      const hit = f >= 620, bx = X0 + 2.2, roll = hit ? 0.16 * after(f, 620, 10) + sway(f, 3, 0.01) : 0, tilt = hit ? -6 - 8 * after(f, 620, 12) : 0;
      add(betsyBed, bx, SIT, -2.1, { f, mode: "sit", expr: hit ? "dazed" : "neutral", roll, headTilt: tilt });
      const jT = f >= 628 ? -5 * smooth((f - 628) / 4) : 0;
      add(john, X0 + 1.2, take(f, 628, 0.05), -1.2, { f, expr: ex(f, [[610, "smile"], [628, "shock"]]), look: 1, shut: shutBefore(f, 628), tilt: jT, roll: sway(f, 1) });
      shockFx({ x: X0 + 1.2, y: take(f, 628, 0.05), z: -1.2, b: "adult", tilt: jT }, 628);
      const h: HeadAt = { x: bx, y: SIT, z: -2.1, b: "kid", sit: true, roll, tilt };
      if (f >= 612 && f < 622) { const u = qt((f - 612) / 10, 10); F.push(fx(`swoosh${u}`, 600, 400, (p) => fxSwoosh(p, u), ...hp(h, 0.42, 0.02, 0.05), 0.75, 0.5, { soft: true, glow: 1.1 })); }
      F.push(...knock(f, 620, ...hp(h, 0.2, -0.02, 0.1), 0.6, 7, "#ff9aa8"));
      if (hit) F.push(fx("hand", 220, 260, fxHand, ...hp(h, 0.115, -0.06, 0.03), 0.13, 0.155, { soft: true, rot: -0.35 }));
      if (f >= 626) F.push(fx(`dizzy${qt((f % 20) / 20, 10)}`, 420, 240, (p) => fxDizzy(p, qt((f % 20) / 20, 10)), ...hp(h, 0, HEAD.kid.r + 0.06, 0.02), 0.55, 0.31, { soft: true, glow: 1.2 }));
      break;
    }
    case 10: { // it starts talking: rings from the dark corner
      if (f >= 686) F.push(voice(f, X0 + 3.8, 1.55, -2.8, 0.6 + 0.6 * smooth((f - 686) / 20)));
      break;
    }
    case 11: { // the family huddled on the big bed, trembling; all jolt on "Kate"
      const sq = 0.06 * smooth((f - 722) / 30);
      const J = (x: number, k: number, who: Who, z: number, y0: number, b: Build, at: number) => {
        const r = sway(f, k, 0.006) + trem(f + k, 0.01), y = y0 + take(f, at, 0.05);
        add(who, x, y, z, { f, mode: "sit", expr: f >= at ? "shock" : "nervous", look: 1, roll: r, shut: shutBefore(f, at), tilt: f >= at ? -5 * after(f, at, 10) : 2 });
        shockFx({ x, y, z, b, sit: true, roll: r }, at);
        return { x, y, z, b, sit: true, roll: r } as HeadAt;
      };
      const hj = J(X0 - 3.05 + sq, 1, johnBed, -1.95, SIT, "adult", 746);
      const hl = J(X0 - 2.45 + sq * 0.5, 2, lucyBed, -1.75, SIT, "adult", 746);
      J(X0 - 1.95, 3, betsyBed, -1.55, SIT, "kid", 747);
      J(X0 - 1.45 - sq * 0.5, 4, son, -1.4, SIT - 0.1, "kid", 747);
      sweatFx(hj, 726, -1, 20); sweatFx(hl, 732, 1, 24);
      shiverFx(X0 - 2.25, SIT + 0.75, -1.6, 2.6);
      F.push(voice(f, X0 - 0.4, 1.75, -2.4, 0.7));
      break;
    }
    case 12: { // sings hymns (everyone sways along, ghostly notes from the walls); roasts the dinner guests (smoking heads)
      props.plates = true; props.quiltB = 0;
      const hymn = f >= 764 && f < 797 ? Math.sin(((f - 764) / 16) * Math.PI) : 0;
      const x0 = X0 + 1.85, x1 = X0 + 2.85;
      const laughB = f >= 797 && f < 821 ? 0.015 * Math.abs(Math.sin(f * 0.6)) : 0;
      add(folk(0), x0, take(f, 797, 0.05), 0.25, { f, expr: ex(f, [[762, "smile_closed"], [797, "shock"], [812, "stern"]]), look: f >= 812 ? 1 : 0,
        roll: 0.04 * hymn + (f >= 797 ? -0.05 * after(f, 797, 12) + sway(f, 1, 0.008) : 0), shut: shutBefore(f, 797) });
      add(lucy, X0 + 2.35, 0, 0.15, { f, expr: ex(f, [[762, "smile_closed"], [797, "nervous"]]), look: f < 797 ? -1 : f < 821 ? -1 : 1, roll: -0.04 * hymn + (f >= 797 ? trem(f, 0.006) : 0) });
      add(folk(1), x1, take(f, 821, 0.05) + laughB, 0.25, { f, expr: ex(f, [[762, "smile_closed"], [797, "laugh"], [821, "shock"]]), look: f < 821 ? -1 : 0,
        roll: 0.04 * hymn + (f >= 821 ? 0.05 * after(f, 821, 12) : 0), tilt: f >= 797 && f < 821 ? -5 : 0, wave: f >= 799 && f < 821 ? 0.7 : undefined, shut: shutBefore(f, 821) });
      if (f >= 764 && f < 800) for (let i = 0; i < 4; i++) {
        const u = ((f - 764) / 30 + i / 4) % 1;
        F.push(fx(`gnote${i % 2}`, 200, 240, (p) => fxGhostNote(p, i % 2), X0 + 1.6 + i * 0.5 + 0.15 * Math.sin(u * 6), 1.85 + 0.7 * u, -0.6, 0.2, 0.24, { soft: true, glow: 1.3, rot: 0.25 * Math.sin(u * 7 + i) }));
      }
      F.push(...knock(f, 797, x0 + 0.05, 1.85, 0.35, 0.6, 4, "#ffb3a0"), ...knock(f, 821, x1 - 0.05, 1.85, 0.35, 0.6, 5, "#ffb3a0"));
      const steam = (x: number, from: number, k: number) => {
        if (f < from) return;
        const u = qt(((f - from + k * 7) % 24) / 24, 12);
        F.push(fx(`steam${u}`, 300, 400, (p) => fxSteam(p, u), x, 1.98, 0.32, 0.36, 0.48, { soft: true }));
      };
      steam(x0, 800, 0); steam(x1, 824, 1);
      sweatFx({ x: X0 + 2.35, y: 0, z: 0.15, b: "adult" }, 801, -1, 24);
      break;
    }
    case 13: { // neighbours ride in to get insulted by a wall: a take, then the crowd laughs at him
      const ins = f >= 904, nx = -1.45;
      const nr = ins ? 0.12 * after(f, 904, 14) : sway(f, 1);
      add(folk(2), nx, 0.25 + take(f, 904, 0.06), 3.35, { f, expr: ins ? (f >= 920 ? "stern" : "shock") : "smile", headTilt: ins ? 0 : -6, roll: nr, shut: shutBefore(f, 904) });
      shockFx({ x: nx, y: 0.25 + take(f, 904, 0.06), z: 3.35, b: "adult", roll: nr }, 904);
      F.push(...knock(f, 904, -2.3, 1.7, 3.15, 0.9, 6, "#d8ffe6", 1.4));
      if (f >= 870) F.push(voice(f, -2.3, 1.7, 3.1, 0.9));
      const crowd: [number, number, number][] = [[1.6, 6.0, 3], [2.9, 6.9, 4], [-3.2, 6.6, 5], [-0.2, 7.6, 0], [4.2, 7.9, 1]];
      crowd.forEach(([x, z, i], k) => {
        const laugh = ins && f > 908 + k;
        add(folk(i), x, laugh ? 0.02 * Math.abs(Math.sin((f + k * 3) * 0.55)) : 0, z, { f, expr: laugh ? "laugh" : ex(f, [[841, "smile"], [870, "grin"]]),
          look: Math.sign(nx - x), roll: laugh ? 0.04 * Math.sin((f + k * 3) * 0.55) : sway(f, k + 2), tilt: laugh ? (x > nx ? -5 : 5) : 0 });
        if (k % 2 === 0) props.lanterns.push([x + 0.42, 0.95 + (laugh ? 0.02 * Math.abs(Math.sin((f + k * 3) * 0.55)) : 0), z + 0.05]);
      });
      // a late rider walking in from the left
      const wx = -9 + 4.5 * smooth((f - 841) / 100), ph = ((wx + 9) / 0.8) % 1;
      add(folk(1), wx, 0, 8.5, { f, side: true, so: { mode: "march", phase: ph, stride: 0.6, expr: "grin" } });
      props.lanterns.push([wx + 0.5, 0.95, 8.55]);
      break;
    }
    case 14: { // Kate only hates one person. John: darting eyes, sweating; jolts on his own name
      const jx = X0 - 2.0, y = take(f, 1006, 0.06), r = sway(f, 1) + (f >= 1012 ? trem(f, 0.01) : 0);
      add(john, jx, y, -0.75, { f, expr: ex(f, [[948, "nervous"], [1006, "shock"]]), look: f < 1006 ? (Math.sin(f / 10) > 0 ? 1 : -1) : 0, roll: r, shut: shutBefore(f, 1006), tilt: f >= 1006 ? -4 : 2 * Math.sin(f / 10) });
      const h: HeadAt = { x: jx, y, z: -0.75, b: "adult", roll: r };
      shockFx(h, 1006);
      sweatFx(h, 966, 1, 24); sweatFx(h, 978, -1, 24);
      if (f >= 1012) shiverFx(jx, 1.1, -0.7, 1.1);
      if (f >= 958) F.push(voice(f, X0 - 2.0, 1.4, -1.4, 1.4, "#c6f7d8"));
      break;
    }
    case 15: { // face twitches (expression flicker + tick marks), tongue swells (a growing pink tongue)
      const tw = f >= 1039 && f < 1065, tg = f >= 1065, jx = X0 - 2.4;
      const k = Math.floor(f / 3) % 3, ex2: Expr = tg ? "lick" : tw ? (["pained", "nervous", "dazed"] as Expr[])[k] : "nervous";
      const tilt = tw ? (k - 1) * 7 : 0, roll = tw ? (k - 1) * 0.025 : sway(f, 1, 0.006);
      add(johnBed, jx, SIT, -2.0, { f, mode: "sit", expr: ex2, headTilt: tilt, roll });
      const h: HeadAt = { x: jx, y: SIT, z: -2.0, b: "adult", sit: true, roll, tilt };
      if (tw) F.push(fx(`twitch${k}`, 300, 300, (p) => fxTwitch(p, k), ...hp(h, 0.2 * (k === 1 ? -1 : 1), 0.08, 0.05), 0.42, 0.42, { soft: true, glow: 1.1 }));
      if (tg) {
        const sw = Math.round(smooth((f - 1065) / 14) * 8) / 8;
        F.push(fx(`tongue${sw}`, 300, 300, (p) => fxTongue(p, sw), ...hp(h, 0.02, -0.21, 0.06), 0.3, 0.3, { soft: true }));
      }
      break;
    }
    case 16: { // he doesn't wake up: heads bowed, slow breaths, tears
      props.johnLying = true;
      // John lies UNDER the quilt hump (world.ts quiltJ), head on the pillow; the family stands on the floor beyond the
      // far side of the bed (they used to stand inside the bed frame)
      add(johnBed, X0 - 2.25, 0.95, -0.95, { f, awake: false, expr: "neutral", roll: -Math.PI / 2 + 0.02 });
      const sad: Expr = f >= 1170 ? "pained" : "nervous";
      add(lucy, X0 - 3.72, 0, -1.4, { f, expr: sad, headTilt: 10, look: 0.5, roll: sway(f, 2, 0.008) });
      add(betsy, X0 - 3.25, 0, -0.55, { f, expr: sad, headTilt: 8, look: 0.5, roll: sway(f, 3, 0.008) });
      add(son, X0 - 3.72, 0, -2.3, { f, expr: sad, headTilt: 8, look: 0.6, roll: sway(f, 4, 0.008) });
      sweatFx({ x: X0 - 3.72, y: 0, z: -1.4, b: "adult", tilt: 10 }, 1150, 1, 30, "#e4f6ff");
      sweatFx({ x: X0 - 3.25, y: 0, z: -0.55, b: "kid", tilt: 8 }, 1162, 1, 26, "#e4f6ff");
      break;
    }
    case 17: { // the tiny bottle: it glints on "tiny"
      props.vial = true; focus = I(0.15, 0.85, -2.66);
      if (f >= 1221 && f < 1235) { const u = qt((f - 1221) / 14, 7); F.push(fx(`glint${u}`, 400, 400, (p) => fxTwinkle(p, u, 1), ...I(0.17, 0.95, -2.58), 0.14, 0.14, { soft: true, glow: 1.6 })); }
      break;
    }
    case 18: { // one drop to the cat: it watches the drop, laps it up, bristles on "cat", flops dead on "dies"; its ghost floats off
      props.saucer = true; focus = I(-0.25, 0.25, -1.9);
      const dead = f >= 1333, brist = f >= 1325 && !dead, lap = f >= 1308 && f < 1322;
      const sn = f < 1296 ? 0 : f < 1322 ? smooth((f - 1296) / 10) : 1 - smooth((f - 1322) / 3);
      const tail = q(Math.sin(f / 7), 10), blink = lidAt(f, 77);
      const pose: CatPose = dead ? { pose: "dead", sniff: 0, blink: 0, tail: 0, look: 0, twitch: f >= 1337 && f < 1352 ? (f % 4 < 2 ? 1 : -0.4) : 0 }
        : brist ? { pose: "bristle", sniff: 0, blink: 0, tail: 0, look: 0 }
        : { pose: lap ? "lap" : "sit", sniff: q(sn, 10), blink: f >= 1322 && f < 1325 ? 1 : blink, tail, look: f < 1296 ? 0.6 : 0, tongue: lap ? (f % 4 < 2 ? 1 : 0) : 0 };
      const cy = brist ? 0.03 * smooth((f - 1325) / 2) : dead ? 0.05 * after(f, 1333, 3) * Math.abs(Math.cos((f - 1333) * 0.9)) : 0;
      const cx = X0 - 0.25 + (brist ? trem(f, 0.006) : 0);
      P.push({ key: `cat|${fkey(pose)}`, x: cx, y: cy, z: dead ? -1.95 : -2.0, scale: 0.36, size: [600, 1000, 1.0], draw: (p) => catCard(p, pose) });
      if (f >= 1288 && f < 1300) F.push(fx("drop", 100, 160, dropCard, X0 - 0.25, 1.1 - 1.05 * smooth((f - 1288) / 12) ** 1.6, -1.75, 0.04, 0.064));
      if (f >= 1300 && f < 1310) { const u = qt((f - 1300) / 10, 10); F.push(fx(`plip${u}`, 300, 200, (p) => fxPlip(p, u), X0 - 0.25, 0.07, -1.72, 0.2, 0.133, { soft: true })); }
      if (brist) F.push(fx(`shiver${f % 2}`, 500, 500, (p) => fxShiver(p, f % 2), X0 - 0.25, 0.22, -1.95, 0.5, 0.5, { soft: true, glow: 1.1 }));
      if (brist) { const u = qt((f - 1325) / 8, 8); F.push(fx(`shock${u}`, 400, 400, (p) => fxShock(p, u), X0 - 0.25, 0.3, -1.95, 0.42, 0.42, { soft: true })); }
      F.push(...knock(f, 1333, X0 - 0.25, 0.22, -1.88, 0.55, 9, "#ffffff"));
      if (f >= 1333 && f < 1347) F.push(fx(`puffK${qt((f - 1333) / 14)}`, 300, 300, (p) => fxPuff(p, qt((f - 1333) / 14)), X0 - 0.25, 0.1, -1.85, 0.6, 0.6, { soft: true }));
      if (f >= 1338) {
        const u = (f - 1338) / 32, g = qt((f % 20) / 20, 10), sc = Math.min(1, (f - 1338) / 5);
        F.push(fx(`ghost${g}`, 400, 440, (p) => catGhost(p, g), X0 - 0.25 + 0.04 * Math.sin(f / 5), 0.2 + 0.6 * u, -1.92, 0.24 * sc, 0.264 * sc, { soft: true, glow: 1.25 }));
      }
      break;
    }
    case 19: { // Kate laughs: every window flickers
      const fl = (i: number) => (f < 1394 ? 1 : hh(Math.floor(f / 3), i) > 0.5 ? 1 : 0);
      props.windows = [fl(1), fl(2), fl(3), fl(4)];
      if (f >= 1396) F.push(voice(f, 0, 2.6, 3.4, 5.5 + 1.5 * Math.sin(f / 7)));
      break;
    }
    case 20: { // how does a wall buy poison? the bottle glints on "poison"
      props.vial = true; focus = I(0.15, 0.85, -2.66);
      if (f >= 1540 && f < 1554) { const u = qt((f - 1540) / 14, 7); F.push(fx(`glint${u}`, 400, 400, (p) => fxTwinkle(p, u, 1), ...I(0.17, 0.95, -2.58), 0.14, 0.14, { soft: true, glow: 1.6 })); }
      break;
    }
    case 21: { // nobody wrote it down until 1894: scribbling, then an innocent whistle at the camera
      props.book = true;
      const writing = Math.floor(f / 5) % 2, wh = f >= 1650;
      add(writer, X0 + 2.3, 0, 0.3, { f, expr: ex(f, [[1565, "stern"], [1650, "whistle"]]), headTilt: wh ? -5 : 7 + 3 * writing, look: wh ? 0 : 0.4, tilt: wh ? -2 : 4, roll: sway(f, 4, 0.008) });
      if (wh) for (let i = 0; i < 3; i++) {
        const u = ((f - 1652) / 36 + i / 3) % 1;
        if (f - 1652 < i * 12) continue;
        F.push(fx(`wnote${i % 2}`, 200, 220, (p) => fxNote(p, i % 2, "#f3ead2"), X0 + 2.5 + 0.35 * u, 1.55 + 0.6 * u, 0.4, 0.13, 0.143, { rot: 0.3 * Math.sin(u * 6 + i) }));
      }
      break;
    }
    case 22: { // the fishing story: the fish grows every telling (pop + sparkles), the listener grows doubtful
      const pops = [1729, 1753, 1770];
      const size = 0.35 + (f >= 1729 ? 0.2 : 0) + (f >= 1753 ? 0.25 : 0) + (f >= 1770 ? 0.35 : 0);
      const pop = (k: number) => (f >= k && f < k + 4 ? 1.12 : 1);
      const sz = size * pop(1729) * pop(1753) * pop(1770);
      const hopF = pops.reduce((a, k) => a + take(f, k, 0.035), 0);
      add(fisher, 3.0, hopF, 8.2, { f, expr: ex(f, [[1696, "grin"], [1753, "laugh"]]), look: 0.3, wave: 0.8 + 0.2 * Math.sin(f / 4), roll: sway(f, 7) });
      const doubt = f >= 1770;
      add(folk(3), 1.95, 0, 8.7, { f, expr: ex(f, [[1696, "neutral"], [1729, "whistle"], [1753, "nervous"], [1770, "stern"]]), look: 1,
        roll: doubt ? 0.05 * smooth((f - 1770) / 6) : sway(f, 3), headTilt: doubt ? -8 : 0 });
      props.lanterns.push([1.55, 0.95, 8.75]);
      const flap = q(Math.sin(f * 0.7), 5);
      F.push(fx(`fish${flap}`, 800, 400, (p) => fishCard(p, flap), 3.05, 2.05 + sz * 0.2, 8.15, sz, sz * 0.5, { rot: 0.06 * Math.sin(f / 5) }));
      for (const k of pops) if (f >= k && f < k + 14) {
        const u = qt((f - k) / 14, 7);
        F.push(fx(`twk${u}`, 400, 400, (p) => fxTwinkle(p, u, 5), 3.05, 2.05 + sz * 0.2, 8.2, sz * 1.5, sz * 1.5, { soft: true, glow: 1.4 }));
      }
      break;
    }
    case 23: { // a rat in the wall becomes a witch with poison: the rumour bubble travels down the line and grows
      const xs = [-3.2, -1.9, -0.6, 0.7, 2.0];
      const kf = clamp01((f - 1800) / 54) * 4.99, k = Math.min(4, Math.floor(kf));
      xs.forEach((x, i) => {
        const whisp = i === k && f >= 1800 && k < 4, listen = i === k + 1 && f >= 1800, last = i === 4 && f >= 1853;
        const roll = whisp ? -0.05 : listen ? 0.05 : sway(f, i + 2);
        add(folk(i), x, last ? take(f, 1853, 0.06) : 0, 12.5, { f, expr: last ? "shock" : whisp ? "whistle" : i < k ? "nervous" : listen ? "neutral" : "neutral",
          look: listen ? -1 : 1, headTilt: whisp ? 8 : listen ? -6 : 0, roll, shut: i === 4 && shutBefore(f, 1853) });
        if (last) shockFx({ x, y: take(f, 1853, 0.06), z: 12.5, b: "adult" }, 1853);
        if (i % 2 === 1) props.lanterns.push([x + 0.42, 0.95, 12.55]);
      });
      if (f >= 1800 && k < 4) F.push(fx(`whisper${qt((f % 14) / 14, 7)}`, 300, 300, (p) => fxWhisper(p, qt((f % 14) / 14, 7)), xs[k] + 0.62, 1.62, 12.6, 0.42, 0.42, { soft: true, glow: 1.15 }));
      const i0 = Math.min(3, Math.floor(kf)), bx = kf >= 4 ? xs[4] : xs[i0] + (xs[i0 + 1] - xs[i0]) * smooth((kf - i0 - 0.7) / 0.3);
      const witch = f >= 1849, bs = witch ? 1.35 : 1, by = witch ? 2.62 : 2.42;
      F.push(fx("bubble", 700, 560, fxBubble, bx + 0.2 * bs, by, 12.3, 1.0 * bs, 0.8 * bs, { soft: true }));
      const cxb = bx + 0.2 * bs + 0.03, cyb = by + 0.06 * bs;
      if (f < 1845) {
        const mean = f >= 1822, hat = f >= 1833, rs = 1 + (mean ? 0.12 : 0) + (hat ? 0.08 : 0);
        F.push(fx(`rat${hat ? 1 : 0}${mean ? 1 : 0}`, 600, 400, (p) => ratCard(p, hat, mean), cxb, cyb - (hat ? 0.03 : 0), 12.4, 0.55 * rs, 0.367 * rs));
      } else if (f < 1849) { const rS = 1.2 * (1 - smooth((f - 1845) / 4)); if (rS > 0.05) F.push(fx("rat11", 600, 400, (p) => ratCard(p, true, true), cxb, cyb, 12.4, 0.55 * rS, 0.367 * rS)); }
      if (f >= 1847 && f < 1861) F.push(fx(`puffW${qt((f - 1847) / 14)}`, 300, 300, (p) => fxPuff(p, qt((f - 1847) / 14)), cxb, cyb, 12.38, 0.8, 0.8, { soft: true, glow: 1.2 }));
      const wS = f >= 1853 ? smooth((f - 1853) / 6) * (f < 1859 ? 1.15 : 1) : 0;
      if (wS > 0.02) {
        F.push(fx("aura", 400, 400, (p) => fxAura(p, "#59e08e"), cxb, cyb, 12.35, 0.95 * wS, 0.95 * wS, { soft: true, glow: 1.2 }));
        F.push(fx("witch", 600, 1000, witchCard, cxb, cyb - 0.02, 12.4, 0.42 * wS, 0.7 * wS, { glow: 1.15 }));
      }
      break;
    }
    case 24: { // Kate's promise at the grave
      if (f >= 1915) F.push(voice(f, GRAVE[0], 1.3, GRAVE[2] + 0.2, 1.3, "#c6f7d8"));
      props.windows = [0, 0, 0, 0];
      break;
    }
    case 25: { // 1935... nobody ever did: a window lights by itself
      props.windows = [0, 0, f >= 2123 ? (f < 2127 ? (f % 2) : 1) : 0, 0];
      break;
    }
  }
  return { places: P, fx: F, props, focus };
};
