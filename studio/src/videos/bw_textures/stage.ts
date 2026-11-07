// Who stands where, doing what, in every shot of "The Bell Witch"; effect cards and per-frame prop states.
// Reactions land 0-3 frames before their word (word frames from voice/words.json). Kate is never drawn: only
// what she does (knocks, gnawing, the sliding quilt, the yank, the slap, her voice rings, the bent flame).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, FrontOpts, SideOpts, Expr, fxBurst, fxStars, fxCreak, fxNote, fxPuff } from "../bridge/toon";
import { Who, john, johnBed, lucy, lucyBed, betsy, betsyBed, son, writer, fisher, folk, tier } from "./cast";
import { fxKnock, fxChips, fxVoice, fxFlame, catCard, fishCard, ratCard, witchCard, dropCard, fxWhisper } from "./fxart";
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
type PO = FrontOpts & { scale?: number; roll?: number; side?: boolean; so?: SideOpts; mirror?: boolean; awake?: boolean; f: number };
/** one character card; `awake: false` keeps the eyes shut (asleep) */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, o: PO): Place => {
  const scale = o.scale ?? 1, d = cam.pos.distanceTo(tmp.set(x, y + 1.2 * scale, z)) / scale, [w, h, k] = tier(d);
  const mirror = !!o.mirror, light = light2D(cam, mirror && !!o.side);
  const blink = o.awake === false ? 1 : lidAt(o.f, who.seed * 7);
  if (o.side) {
    const s2: SideOpts = { mode: "stand", ...o.so, light, seed: who.seed, blink };
    return { key: `S|${who.k}|${fkey(s2)}`, x, y, z, scale, mirror, roll: o.roll, size: [w, h, k], draw: (p) => bodySide(p, who.o, s2) };
  }
  const { f: _f, scale: _s, roll: _r, side: _d, so: _so, mirror: _m, awake: _a, ...fo } = o;
  const f2: FrontOpts = { mode: "stand", ...fo, light, seed: who.seed, blink };
  return { key: `F|${who.k}|${fkey(f2)}`, x, y, z, scale, mirror, roll: o.roll, size: [w, h, k], draw: (p) => bodyFront(p, who.o, f2) };
};
/** expression timeline: [[frame, expr], ...] -> expr at f */
const ex = (f: number, tl: [number, Expr][]): Expr => { let e = tl[0][1]; for (const [k, v] of tl) if (f >= k) e = v; return e; };
const fx = (key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, extra: Partial<FxPlace> = {}): FxPlace =>
  ({ key, cw, ch, draw, x, y, z, w, h, ...extra });
/** quantised effect time so the canvas pool reuses drawings (12 steps) */
const qt = (u: number, n = 12) => Math.round(clamp01(u) * n) / n;
const knock = (f: number, at: number, x: number, y: number, z: number, s = 0.9) => {
  const u = (f - at) / 12;
  return u >= 0 && u <= 1 ? [fx(`knock${qt(u)}`, 500, 500, (p) => fxKnock(p, qt(u)), x, y, z, s, s, { soft: true })] : [];
};
const flameAt = (f: number, x: number, y: number, z: number, bend = 0, s = 1): FxPlace => {
  const fl = Math.round(3 * Math.sin(f * 0.9) + 2 * Math.sin(f * 2.3));
  return fx(`flame${q(bend, 10)}_${fl}`, 200, 400, (p) => fxFlame(p, q(bend, 10), fl / 3), x, y, z, 0.05 * s, 0.1 * s, { glow: 3.2 });
};
const voice = (f: number, x: number, y: number, z: number, s: number, col = "#b9f3d0") => {
  const u = ((f % 24) / 24);
  return fx(`voice${col}${qt(u)}`, 600, 600, (p) => fxVoice(p, qt(u), col), x, y, z, s, s, { soft: true, glow: 1.4 });
};
const NIGHTSTAND_FLAME: V3 = [X0 - 0.3, 1.0, -2.72], CRATE_FLAME: V3 = [X0 + 3.55, 0.7, -2.65];
const SIT = 0.66; // card sole height when sitting up in bed (legs hidden in the mattress)
const I = (x: number, y: number, z: number): V3 => [X0 + x, y, z];

export const stage = (f: number, s: Shot, cam: CamInfo): Stage => {
  const P: Place[] = [], F: FxPlace[] = [];
  const props: Props = { windows: [1, 1, 1, 1], quiltB: 0, chairDown: 0, johnLying: false, vial: f >= 1101, saucer: false, book: false, plates: false, lanterns: [] };
  let focus: V3 | undefined;
  const add = (who: Who, x: number, y: number, z: number, o: PO) => P.push(person(cam, who, x, y, z, o));
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
      add(john, 1.7, 0.25, 3.7, { f, expr: ex(f, [[0, "neutral"], [61, "nervous"], [106, "shock"]]), look: f < 80 ? -0.6 : 0.6 });
      props.lanterns.push([2.12, 1.15, 3.78]);
      break;
    }
    case 2: { // the family who swore
      const e = ex(f, [[129, "nervous"], [154, "stern"]]), nod = f >= 154 && f < 166 ? 0.1 * Math.sin(((f - 154) / 12) * Math.PI) : 0;
      add(john, -0.75, 0, 5.9, { f, expr: e, headTilt: nod });
      add(lucy, 0.25, 0, 5.9, { f, expr: e, headTilt: -nod });
      add(betsy, -0.35, 0, 6.8, { f, expr: e, headTilt: nod });
      add(son, 0.6, 0, 6.85, { f, expr: ex(f, [[129, "nervous"], [158, "stern"]]) });
      props.lanterns.push([-0.3, 0.95, 5.95]);
      break;
    }
    case 3: { // asleep; knocks on the walls
      const wakeJ = f >= 249, wakeL = f >= 255, wakeB = f >= 262;
      add(johnBed, X0 - 2.65, SIT, -2.0, { f, mode: "sit", awake: wakeJ, expr: wakeJ ? "shock" : "neutral", look: f > 262 ? 1 : -1 });
      add(lucyBed, X0 - 1.85, SIT, -2.0, { f, mode: "sit", awake: wakeL, expr: wakeL ? "shock" : "neutral", look: f > 275 ? 1 : -0.5 });
      add(betsyBed, X0 + 2.2, SIT, -2.1, { f, mode: "sit", awake: wakeB, expr: wakeB ? "nervous" : "neutral", look: -1 });
      F.push(...knock(f, 247, X0 - 3.2, 2.2, -2.9), ...knock(f, 260, X0 - 1.25, 1.95, -2.9), ...knock(f, 273, X0 - 3.35, 1.3, -2.85), ...knock(f, 282, X0 - 2.25, 2.45, -2.9, 1.1));
      break;
    }
    case 4: { // gnawing in the headboard between them
      add(johnBed, X0 - 2.65, SIT, -1.95, { f, mode: "sit", expr: ex(f, [[303, "nervous"], [337, "shock"]]), look: 1 });
      add(lucyBed, X0 - 1.85, SIT, -1.95, { f, mode: "sit", expr: ex(f, [[303, "shock"], [337, "nervous"]]), look: -1 });
      if (f >= 314) F.push(fx(`chips${qt(((f - 314) % 10) / 10, 10)}`, 400, 400, (p) => fxChips(p, qt(((f - 314) % 10) / 10, 10)), X0 - 2.25, 1.12, -2.86, 0.6, 0.6));
      break;
    }
    case 5: { // tears the room apart; "No rat."
      props.chairDown = clamp01((f - 388) / 8);
      const search = f < 421;
      add(john, X0 - 0.6, 0, -0.4, { f, expr: ex(f, [[378, "stern"], [396, "nervous"], [421, "neutral"]]), look: search ? (Math.floor(f / 9) % 2 ? 1 : -1) : 0,
        tilt: search ? 0.08 * Math.sin(f / 4) : 0, wave: f >= 384 && f < 404 ? 1 : undefined });
      add(lucyBed, X0 - 1.85, SIT, -2.0, { f, mode: "sit", expr: "nervous", look: 1 });
      if (f >= 389 && f < 401) F.push(fx(`puffC${qt((f - 389) / 12)}`, 300, 300, (p) => fxPuff(p, qt((f - 389) / 12)), X0 - 0.1, 0.25, -1.1, 0.8, 0.8, { soft: true }));
      break;
    }
    case 6: { // the covers slide off
      props.quiltB = smooth((f - 460) / 22);
      add(betsyBed, X0 + 2.2, SIT, -2.1, { f, mode: "sit", awake: f >= 466, expr: f >= 466 ? "shock" : "neutral", look: 0.4 });
      break;
    }
    case 7: { // something yanks her hair
      const up = f >= 505 ? smooth((f - 505) / 5) * (1 - 0.6 * smooth((f - 540) / 12)) : 0;
      add(betsyBed, X0 + 2.2, SIT + 0.2 * up, -2.1, { f, mode: "sit", expr: f >= 505 ? "pained" : "nervous", roll: 0.06 * up * Math.sin(f * 0.9), headTilt: -0.12 * up });
      if (f >= 505) F.push(fx(`creak${qt((f % 8) / 8, 8)}`, 300, 300, (p) => fxCreak(p, qt((f % 8) / 8, 8)), X0 + 2.2, 1.75 + 0.2 * up, -2.1, 0.45, 0.45));
      break;
    }
    case 8: { // "It's just the wind," John says
      add(john, X0 - 1.0, 0, -1.4, { f, expr: ex(f, [[557, "neutral"], [586, "smile"]]), look: 0, wave: f >= 566 && f < 600 ? 0.6 : undefined });
      break;
    }
    case 9: { // the wind slaps her
      const hit = f >= 620;
      add(betsyBed, X0 + 2.2, SIT, -2.1, { f, mode: "sit", expr: hit ? "dazed" : "neutral", roll: hit ? -0.16 * Math.exp(-(f - 620) / 10) : 0, headTilt: hit ? -0.25 : 0 });
      add(john, X0 + 1.2, 0, -1.2, { f, expr: ex(f, [[610, "smile"], [628, "shock"]]), look: 1 });
      if (f >= 620 && f < 632) F.push(fx(`burst${qt((f - 620) / 12)}`, 500, 500, (p) => fxBurst(p, qt((f - 620) / 12)), X0 + 2.45, 1.35, -2.0, 0.55, 0.55));
      if (f >= 628) F.push(fx(`stars${qt((f % 20) / 20, 10)}`, 420, 210, (p) => fxStars(p, qt((f % 20) / 20, 10)), X0 + 2.2, 1.68, -2.05, 0.5, 0.25));
      break;
    }
    case 10: { // it starts talking: rings from the dark corner
      if (f >= 686) F.push(voice(f, X0 + 3.8, 1.55, -2.8, 0.6 + 0.6 * smooth((f - 686) / 20)));
      break;
    }
    case 11: { // the family huddled on the big bed
      const e = ex(f, [[722, "shock"], [746, "nervous"]]);
      add(johnBed, X0 - 3.05, SIT, -1.95, { f, mode: "sit", expr: e, look: 1 });
      add(lucyBed, X0 - 2.45, SIT, -1.75, { f, mode: "sit", expr: e, look: 1 });
      add(betsyBed, X0 - 1.95, SIT, -1.55, { f, mode: "sit", expr: e, look: 1 });
      add(son, X0 - 1.45, SIT - 0.1, -1.4, { f, mode: "sit", expr: ex(f, [[722, "nervous"], [748, "shock"]]), look: 1 });
      F.push(voice(f, X0 - 0.4, 1.75, -2.4, 0.7));
      break;
    }
    case 12: { // sings hymns, roasts the dinner guests
      props.plates = true; props.quiltB = 0;
      add(folk(0), X0 + 1.85, 0, 0.25, { f, expr: ex(f, [[762, "smile"], [797, "shock"]]), look: 0, roll: f >= 797 ? -0.06 : 0 });
      add(lucy, X0 + 2.35, 0, 0.15, { f, expr: ex(f, [[762, "smile_closed"], [797, "nervous"]]), look: -1 });
      add(folk(1), X0 + 2.85, 0, 0.25, { f, expr: ex(f, [[762, "smile"], [797, "laugh"], [821, "shock"]]), look: f < 821 ? -1 : 0, roll: f >= 821 ? 0.06 : 0 });
      if (f >= 764 && f < 797) for (let i = 0; i < 4; i++) {
        const u = ((f - 764) / 30 + i / 4) % 1;
        F.push(fx(`note${i % 2}`, 200, 220, (p) => fxNote(p, i % 2, "#e9e0c8"), X0 + 1.6 + i * 0.5 + 0.15 * Math.sin(u * 6), 1.8 + 0.7 * u, -0.6, 0.2, 0.22));
      }
      if (f >= 797 && f < 809) F.push(fx(`burstR${qt((f - 797) / 12)}`, 500, 500, (p) => fxBurst(p, qt((f - 797) / 12), "#ffb3a0"), X0 + 1.85, 1.85, 0.3, 0.6, 0.6));
      if (f >= 821 && f < 833) F.push(fx(`burstR${qt((f - 821) / 12)}`, 500, 500, (p) => fxBurst(p, qt((f - 821) / 12), "#ffb3a0"), X0 + 2.85, 1.85, 0.3, 0.6, 0.6));
      break;
    }
    case 13: { // neighbors ride in to get insulted by a wall
      const ins = f >= 904;
      add(folk(2), -1.45, 0.25, 3.35, { f, expr: ins ? "shock" : "smile", headTilt: ins ? 0 : -0.15, roll: ins ? 0.12 * Math.exp(-(f - 904) / 14) : 0 });
      if (f >= 904 && f < 916) F.push(fx(`burstW${qt((f - 904) / 12)}`, 500, 500, (p) => fxBurst(p, qt((f - 904) / 12), "#d8ffe6"), -2.3, 1.7, 3.15, 0.9, 0.9));
      if (f >= 870) F.push(voice(f, -2.3, 1.7, 3.1, 0.9));
      const crowd: [number, number, number][] = [[1.6, 6.0, 3], [2.9, 6.9, 4], [-3.2, 6.6, 5], [-0.2, 7.6, 0], [4.2, 7.9, 1]];
      crowd.forEach(([x, z, i], k) => {
        add(folk(i), x, 0, z, { f, expr: ins && f > 909 ? "laugh" : ex(f, [[841, "smile"], [870, "grin"]]), look: x > 0 ? -0.6 : 0.6 });
        if (k % 2 === 0) props.lanterns.push([x + 0.42, 0.95, z + 0.05]);
      });
      // a late rider walking in from the left
      const wx = -9 + 4.5 * smooth((f - 841) / 100), ph = ((wx + 9) / 0.8) % 1;
      add(folk(1), wx, 0, 8.5, { f, side: true, so: { mode: "march", phase: ph, stride: 0.6, expr: "grin" } });
      props.lanterns.push([wx + 0.5, 0.95, 8.55]);
      break;
    }
    case 14: { // Kate only hates one person. John.
      add(john, X0 - 2.0, 0, -0.75, { f, expr: ex(f, [[948, "nervous"], [1006, "shock"]]), look: Math.sin(f / 10) });
      if (f >= 958) F.push(voice(f, X0 - 2.0, 1.4, -1.4, 1.4, "#c6f7d8"));
      break;
    }
    case 15: { // face twitches, tongue swells
      const tw = f >= 1039 && f < 1065, tg = f >= 1065;
      const k = Math.floor(f / 3) % 3, ex2: Expr = tg ? "lick" : tw ? (["pained", "nervous", "dazed"] as Expr[])[k] : "nervous";
      add(johnBed, X0 - 2.4, SIT, -2.0, { f, mode: "sit", expr: ex2, headTilt: tw ? (k - 1) * 0.07 : tg ? 0.08 : 0, roll: tw ? (k - 1) * 0.025 : 0 });
      break;
    }
    case 16: { // he doesn't wake up
      props.johnLying = true;
      add(johnBed, X0 - 2.25, 1.1, -0.95, { f, awake: false, expr: "neutral", roll: -Math.PI / 2 + 0.02 });
      const sad: Expr = f >= 1170 ? "pained" : "nervous";
      add(lucy, X0 - 3.35, 0, -1.4, { f, expr: sad, headTilt: 0.12, look: 0.5 });
      add(betsy, X0 - 3.25, 0, -0.55, { f, expr: sad, headTilt: 0.1, look: 0.5 });
      add(son, X0 - 3.3, 0, -2.3, { f, expr: sad, headTilt: 0.1, look: 0.6 });
      break;
    }
    case 17: { // the tiny bottle
      props.vial = true; focus = I(0.15, 0.85, -2.66);
      break;
    }
    case 18: { // one drop to the cat; the cat dies
      props.saucer = true; focus = I(-0.25, 0.25, -1.9);
      const dead = f >= 1333, sn = smooth((f - 1300) / 18) * (1 - smooth((f - 1325) / 6) * 0.5);
      P.push({ key: `cat|${dead ? "dead" : q(sn, 10)}|${lidAt(f, 77)}`, x: X0 - 0.25, y: 0, z: dead ? -1.95 : -2.0, scale: 0.36, size: [600, 1000, 1.0],
        draw: (p) => catCard(p, dead ? 0 : q(sn, 10), dead) });
      if (f >= 1288 && f < 1300) F.push(fx("drop", 100, 160, dropCard, X0 - 0.25, 1.1 - 1.05 * smooth((f - 1288) / 12) ** 1.6, -1.75, 0.04, 0.064));
      if (f >= 1333 && f < 1345) F.push(fx(`burstK${qt((f - 1333) / 12)}`, 500, 500, (p) => fxBurst(p, qt((f - 1333) / 12), "#ffffff"), X0 - 0.25, 0.3, -1.9, 0.5, 0.5));
      break;
    }
    case 19: { // Kate laughs: every window flickers
      const fl = (i: number) => (f < 1394 ? 1 : hh(Math.floor(f / 3), i) > 0.5 ? 1 : 0);
      props.windows = [fl(1), fl(2), fl(3), fl(4)];
      if (f >= 1396) F.push(voice(f, 0, 2.6, 3.4, 5.5 + 1.5 * Math.sin(f / 7)));
      break;
    }
    case 20: { // how does a wall buy poison?
      props.vial = true; focus = I(0.15, 0.85, -2.66);
      break;
    }
    case 21: { // nobody wrote it down until 1894
      props.book = true;
      const writing = Math.floor(f / 5) % 2;
      add(writer, X0 + 2.3, 0, 0.3, { f, expr: ex(f, [[1565, "stern"], [1650, "whistle"]]), headTilt: 0.14 + 0.03 * writing, look: 0 });
      break;
    }
    case 22: { // the fishing story: the fish grows every telling
      const size = 0.35 + (f >= 1729 ? 0.2 : 0) + (f >= 1753 ? 0.25 : 0) + (f >= 1770 ? 0.35 : 0);
      const pop = (k: number) => (f >= k && f < k + 4 ? 1.12 : 1);
      const sz = size * pop(1729) * pop(1753) * pop(1770);
      add(fisher, 3.0, 0, 8.2, { f, expr: ex(f, [[1696, "grin"], [1753, "laugh"]]), look: 0.3, wave: 0.8 });
      add(folk(3), 1.95, 0, 8.7, { f, expr: ex(f, [[1696, "neutral"], [1770, "stern"]]), look: 1 });
      props.lanterns.push([1.55, 0.95, 8.75]);
      F.push(fx("fish", 800, 400, fishCard, 3.05, 2.05 + sz * 0.2, 8.15, sz, sz * 0.5));
      break;
    }
    case 23: { // a rat in the wall becomes a witch with poison
      const xs = [-3.2, -1.9, -0.6, 0.7, 2.0];
      const k = Math.min(4, Math.floor(clamp01((f - 1800) / 54) * 4.99));
      xs.forEach((x, i) => {
        add(folk(i), x, 0, 12.5, { f, expr: i === k ? "whistle" : i < k ? "nervous" : "neutral", look: 1, headTilt: i === k ? 0.08 : 0 });
        if (i % 2 === 1) props.lanterns.push([x + 0.42, 0.95, 12.55]);
      });
      if (f >= 1800 && k < 4) F.push(fx(`whisper${qt((f % 14) / 14, 7)}`, 300, 300, (p) => fxWhisper(p, qt((f % 14) / 14, 7)), xs[k] + 0.65, 1.85, 12.55, 0.5, 0.5));
      const ratS = f < 1845 ? 1 : 1 - smooth((f - 1845) / 6);
      if (ratS > 0.02) F.push(fx("rat", 600, 400, ratCard, xs[0], 2.45, 12.4, 0.6 * ratS, 0.4 * ratS));
      const wS = f >= 1853 ? smooth((f - 1853) / 6) * (f < 1859 ? 1.15 : 1) : 0;
      if (wS > 0.02) F.push(fx("witch", 600, 1000, witchCard, xs[4], 2.75, 12.4, 0.75 * wS, 1.25 * wS));
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
