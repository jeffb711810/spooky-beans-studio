// Who stands where, doing what, in every shot of "The Bell Witch"; effect cards and per-frame prop states.
// Reactions land 0-3 frames before their word (word frames from voice/words.json). Kate is never drawn: only
// what she does (knocks, gnawing, the sliding quilt, the yank, the slap, her voice rings, the bent flame).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, FrontOpts, SideOpts, Expr, Pose, fxNote, fxPuff, fxContact } from "../bridge/toon";
import { MAX, ROSA, GUS, SARAH } from "./cast";
const WX = (x: number) => -900 + x, FX = (x: number) => -600 + x, MXv = (x: number) => -300 + x;
import { v3Hat } from "../bridge/v3";
import { ghostCard, blueprintCard, scrollCard, mapCard, magnifierCard, rollerCard } from "./fxart";
import { WHS } from "./mansion";
import { WP } from "./whprops";
import { VENV } from "./voiceEnv";
import { WORKER, CREW, PSYCHIC, GUY, HISTORIAN, TOURISTS } from "./cast";
import { Who, john, johnBed, lucy, lucyBed, betsy, betsyBed, son, writer, fisher, folk, tier } from "./cast";
import {
  fxKnock, fxChips, fxVoice, fxFlame, catCard, CatPose, catGhost, fishCard, ratCard, witchCard, dropCard, fxPlip, fxWhisper, fxBubble, fxGhostNote,
  fxShock, fxSweat, fxShiver, fxSpeed, fxSwoosh, fxHand, fxTwinkle, fxDizzy, fxSteam, fxTwitch, fxAura, fxTuft,
  fxBreath, fxSplinters, fxSpecks,
  fxBang, fxQuestion, fxVein,
} from "./fxart";
import { charmOn } from "./look";
/** RICK-STYLE CHARM (look round 10, user: "his emotes, paper look, goofy charm"): "!" / "?" / anger-vein pops on the beats */
const CHARM = charmOn;
import { lateWindow } from "./fx3d";
import { wagonX, wagonLean, wagonBounce, wagonPitch, horsePose, horseCard, horseBit, horsePt, SEATS, REINS, WZ, HORSE_DX, HORSE_SC } from "./wagon"; // WAGON (shot 13)
import { Shot, X0, GRAVE, V3, smooth, smoother, clamp01 } from "./story";

export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
  /** squash & stretch: height x sy, width / sqrt(sy) (feet stay planted) */
  sy?: number;
  /** v3 timing: the person and options that built this card (stage() re-draws it with the next frame's face) */
  who?: Who; po?: PO; at?: V3;
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; soft?: boolean; rot?: number; glow?: number; flat?: boolean };
export type Props = {
  windows: number[]; quiltB: number; chairDown: number; johnLying: boolean; vial: boolean; saucer: boolean; book: boolean; plates: boolean;
  lanterns: V3[];
  /** WINCHESTER: practical light-pool sources without lantern meshes (candles, the crystal ball) */
  pools?: V3[];
  /** shot 11: the huddle quilt (lumps over the four laps) replaces the plain one */
  huddle: boolean;
};
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun: THREE.Vector3; fov?: number };
export type Stage = { places: Place[]; fx: FxPlace[]; props: Props; focus?: V3 };

// ---------------- helpers ----------------
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 100) => Math.round(v * n) / n;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, seed: number, sw: number[] = []) => {
  for (const S of sw) { const k = f - S + 1; if (k >= 0 && k < 4) return LID[k]; } // the shut frames hide the swap
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
type PO = FrontOpts & { sw?: number[]; bs?: number; scale?: number; roll?: number; side?: boolean; so?: SideOpts; mirror?: boolean; awake?: boolean; shut?: boolean; f: number; sy?: number };
/** one character card; `awake: false` keeps the eyes shut (asleep) */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, o: PO): Place => {
  const scale = o.scale ?? 1, d = cam.pos.distanceTo(tmp.set(x, y + 1.2 * scale, z)) / scale, [w, h, k] = tier(d, cam.fov ?? 38); // texture size from the real lens
  const mirror = !!o.mirror, light = light2D(cam, mirror && !!o.side);
  const talking = (o.talk ?? 0) > 0.04; // v3: NOBODY BLINKS WHILE THEY TALK
  const blink = o.awake === false || o.shut ? 1 : talking ? 0 : lidAt(o.f, who.seed * 7 + 101 * (o.bs ?? 0), o.sw ?? []); // bs: extras sharing an outfit blink out of sync
  if (o.side) {
    const s2: SideOpts = { mode: "stand", ...o.so, light, seed: who.seed, blink };
    return { key: `S|${who.k}|${fkey(s2)}`, x, y, z, scale, mirror, roll: o.roll, size: [w, h, k], sy: o.sy, draw: (p) => bodySide(p, who.o, s2), who, po: o, at: [x, y, z] };
  }
  const { f: _f, sw: _sw, bs: _bs, scale: _s, roll: _r, side: _d, so: _so, mirror: _m, awake: _a, shut: _sh, sy: _sy, ...fo } = o;
  const f2: FrontOpts = { mode: "stand", ...fo, light, seed: who.seed, blink };
  return { key: `F|${who.k}|${fkey(f2)}`, x, y, z, scale, mirror, roll: o.roll, size: [w, h, k], sy: o.sy, draw: (p) => bodyFront(p, who.o, f2), who, po: o, at: [x, y, z] };
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
/** wood splinters + wall dust trailing a knock (20 f, starts 1 f after it) */
const splinters = (f: number, at: number, x: number, y: number, z: number, s = 1, seed = 1) => {
  const u = (f - at - 1) / 20;
  return u >= 0 && u <= 1 ? [fx(`splint${seed}_${qt(u, 10)}`, 500, 500, (p) => fxSplinters(p, qt(u, 10), seed), x, y - 0.05 * s, z, s * 1.15, s * 1.15, { soft: true })] : [];
};
/** discrete held values with a short smooth change: [[frame, value], ...] (fidgets, weight shifts) */
const steps = (f: number, tl: [number, number][], dur = 4) => {
  let v = tl[0][1];
  for (let i = 1; i < tl.length; i++) if (f >= tl[i][0]) v = tl[i - 1][1] + (tl[i][1] - tl[i - 1][1]) * smooth((f - tl[i][0]) / dur); else break;
  return v;
};
/** a quick dip-and-return bump (0..1..0) over n frames from `at` */
const bump = (f: number, at: number, n = 6) => (f >= at && f < at + n ? Math.sin(((f - at) / n) * Math.PI) : 0);
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
/** squash & stretch for a take at `at`: a 3 f anticipation squash, a tall stretch on the pop, a damped settle */
const stretch = (f: number, at: number, a = 0.13) => {
  const n = f - at;
  if (n < -3 || n > 15) return 1;
  if (n < 0) return 1 - 0.4 * a * Math.sin(((n + 3) / 3) * (Math.PI / 2));
  return 1 + a * Math.exp(-n / 3.2) * Math.cos(n * 0.78);
};
/** WINCHESTER acting layer (user: "more facial expression that matches the narrator talking", "fluid lip movements",
 *  "jumpy energetic emotions on top of the sad confused mad"): narrator-synced talk, hops, beat bounces, nods, trembles */
const talkV = (f: number, a: number, b: number, g = 1.15) => (f >= a && f < b ? Math.min(1, (VENV[f - (f & 1)] ?? 0) * g) * smooth((f - a) / 3) * (1 - smooth((f - b + 4) / 4)) : 0);
const hop = (f: number, at: number, h = 0.09, n = 10) => (f >= at && f < at + n ? h * Math.sin((Math.PI * (f - at)) / n) : 0);
const bounce = (f: number, per: number, h: number, ph = 0) => h * Math.abs(Math.sin((Math.PI * (f + ph)) / per));
const nod = (f: number) => 6 * Math.min(0.6, Math.max(0, (VENV[f] ?? 0) - (VENV[f - 3] ?? 0)));
const shake = (f: number, a: number) => a * Math.sin(f * 2.9) * Math.cos(f * 1.7);
const BEAT = 2 * Math.PI / 0.8 * 2;   // one beat of the score (2 hammer swings) in frames
/** pose blend in over n frames from `at` (and out over m frames from `until`) */
const poseIn = (f: number, at: number, n = 5, until = 1e9, m = 6) => (f < at ? 0 : smooth((f - at) / n) * (1 - smooth((f - until) / m)));
/** lip flap while the character speaks the given words ([start, end) frames): syllable-ish open / close, 5 levels */
const talkAt = (f: number, words: [number, number][]) => {
  const f2 = f - (f & 1); // v3: the mouth changes on twos
  for (const [a, b] of words) if (f >= a && f < b) return Math.round((0.25 + 0.75 * Math.abs(Math.sin(((f2 - a + 1) * Math.PI) / 4.6))) * 4) / 4;
  return 0;
};
/** words each speaking character says (frames from words.json) */
const SPEECH = {
  john8: [[557, 561], [562, 567], [567, 569], [569, 583]] as [number, number][],
  fisher: [[1696, 1700], [1700, 1706], [1707, 1716], [1716, 1728], [1731, 1739], [1739, 1750], [1750, 1755], [1755, 1766], [1766, 1772], [1772, 1786]] as [number, number][],
};
/** eyes squeezed on the 2 frames before a take */
const shutBefore = (f: number, ...at: number[]) => at.some((k) => f >= k - 2 && f < k);
/** idle sway (card roll, radians): slow, two sines */
const sway = (_f: number, _seed: number, _a = 0.012) => 0; // reference holds are frozen (no idle float); kept as a no-op
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

/** the doorman after his hat blew off (shot 103) */
const DOORMAN_NOHAT: Who = { ...CREW.doorman, k: "doormanNH", o: { ...CREW.doorman.o, hat: "hair", hair: "#3a2a20", hairdo: "parted" } };
export const stage = (f: number, s: Shot, cam: CamInfo): Stage => {
  const next = stage0(f + 1, s, cam), cur = stage0(f, s, cam);
  const pool = new Map<string, Place[]>();
  for (const p of next.places) if (p.who && p.po) { const k = p.who.k; if (!pool.has(k)) pool.set(k, []); pool.get(k)!.push(p); }
  cur.places = cur.places.map((p) => {
    if (!p.who || !p.po || !p.at) return p;
    const n = pool.get(p.who.k)?.shift();
    if (!n || !n.po) return p;
    const face = { expr: n.po.expr, look: n.po.look, browUp: n.po.browUp, tongue: n.po.tongue };
    const so = p.po.so && n.po.so ? { ...p.po.so, expr: n.po.so.expr } : p.po.so;
    if (face.expr === p.po.expr && face.look === p.po.look && face.browUp === p.po.browUp && so === p.po.so) return p;
    const q = person(cam, p.who, p.at[0], p.at[1], p.at[2], { ...p.po, ...face, so });
    return { ...q, y: p.y };
  });
  return cur;
};
const stage0 = (f: number, s: Shot, cam: CamInfo): Stage => {
  const P: Place[] = [], F: FxPlace[] = [];
  const props: Props = { windows: [1, 1, 1, 1], quiltB: 0, chairDown: f >= 396 ? 1 : 0, /* John knocks it over in shot 5; it stays down (stood back up, its tall back blocked the huddle shot) */ johnLying: false, vial: f >= 1101, saucer: false, book: false, plates: false, lanterns: [], huddle: false };
  Object.assign(WHS, { scaffold: 0, tallTower: 0, fall: 0, lit: 1, doorNW: 0, bell: 0 }); Object.assign(WP, { seance: 0, crystal: 0, coins: 0, doorB: 0, candles: 0 });
  let focus: V3 | undefined;
  // contact shadow under every card standing on a floor / porch / ground (user: the 2D characters should sit IN the 3D
  // world like the reference's, not float on it): a soft dark multiply pool at the soles, turned square to the lens.
  // Skipped for cards sitting up in bed (their soles are hidden in the mattress).
  const cc = s.light === "night" ? "#161c2a" : "#33271e";
  // the surface under a standing card outside (world.ts): porch deck 0.25, dirt path 0.03, yard strip 0.01, grass 0.
  // Soles never go below it (user: the family's feet sank into the raised dirt path, and Betsy's toe-rocking dipped her
  // and her shadow under it, so the shadow flickered).
  const groundY = (x: number, z: number) => s.light !== "night" ? 0
    : Math.abs(x) < 3.6 && z > 3 && z < 4.8 ? 0.25 : Math.abs(x) < 0.95 && z > 5.25 && z < 11.55 ? 0.03 : Math.abs(x) < 6.05 && z > 4.75 && z < 6.05 ? 0.01 : 0;
  const add = (who: Who, x: number, y0: number, z: number, o: PO) => {
    const y = y0 < 0.5 ? Math.max(y0, groundY(x, z)) : y0;
    P.push(person(cam, who, x, y, z, o));
    if (y < 0.5) {
      const sc = o.scale ?? 1, kid = who.k === "betsy" || who.k === "son" || who.k.startsWith("betsy") || who.k.startsWith("son");
      F.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x, y: y + 0.05, z,
        w: (kid ? 0.48 : 0.58) * sc, h: (kid ? 0.3 : 0.36) * sc, flat: true, rot: Math.atan2(cam.pos.x - x, cam.pos.z - z) });
    }
  };
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
  /** Rick-style emote over a head (CHARM): "bang" = "!" startle, "q" = "?" puzzled, "vein" = anger vein; from `at` for `n` f */
  const emoteFx = (h: HeadAt, kind: "bang" | "q" | "vein", at: number, n = 18, side = 1) => {
    if (!CHARM()) return;
    const u = (f - at) / n;
    if (u < 0 || u >= 1) return;
    const r = HEAD[h.b].r * (h.sc ?? 1), uq = qt(u, 12);
    // (sizes x1.35 after the first look: the marks must read at phone size, like his big sweat drops)
    if (kind === "bang") F.push(fx(`bang${uq}`, 240, 360, (p) => fxBang(p, uq), ...hp(h, side * r * 0.7, r * 1.9, 0.08), r * 0.84, r * 1.26, { soft: true, glow: 1.1 }));
    else if (kind === "q") F.push(fx(`quest${uq}`, 260, 360, (p) => fxQuestion(p, uq), ...hp(h, side * r * 0.72, r * 1.88, 0.08), r * 0.9, r * 1.25, { soft: true, glow: 1.1 }));
    else F.push(fx(`vein${uq}`, 240, 240, (p) => fxVein(p, uq), ...hp(h, side * r * 0.5, r * 0.22, 0.1), r * 0.72, r * 0.72, { soft: true, glow: 1.05 })); // on the temple, below any hat brim
  };
  /** shiver marks either side of a figure (w = card width in m) */
  const shiverFx = (x: number, y: number, z: number, w: number) =>
    F.push(fx(`shiver${f % 2}`, 500, 500, (p) => fxShiver(p, f % 2), ...onCard(cam, x, y, z, 0, 0, 0, 0.05), w, w, { soft: true, glow: 1.1 }));

  /** a breath puff in the night air beside the mouth, drifting out to `dir` (-1 screen left, 1 right) for `n` frames */
  const breathFx = (h: HeadAt, at: number, dir: number, n = 22) => {
    const u = (f - at) / n;
    if (u < 0 || u >= 1) return;
    const r = HEAD[h.b].r * (h.sc ?? 1), w = r * 1.6;
    F.push(fx(`breath${dir}_${qt(u)}`, 300, 200, (p) => fxBreath(p, qt(u), dir), ...hp(h, dir * (r * 1.02 + 0.38 * w), -r * 0.42, 0.1), w, w * 0.667, { soft: true }));
  };
  /** the family cat (cool night palette outside): sits, blinks, tail sways with quick flicks, bristles from `scare` */
  const yardCat = (x: number, y: number, z: number, flicks: number[], scare = 1e9, look = 0) => {
    const br = f >= scare, fl = flicks.find((k) => f >= k && f < k + 6);
    const tail = q(fl !== undefined ? Math.sin((f - fl) * 1.9) : 0.45 * Math.sin(f / 11), 10);
    const pose: CatPose = br ? { pose: "bristle", sniff: 0, blink: 0, tail: 0, look: 0, night: true } : { pose: "sit", sniff: 0, blink: lidAt(f, 91), tail, look, night: true };
    const sc = 0.36, [w, hh2, k] = tier(cam.pos.distanceTo(tmp.set(x, y + 0.3, z)) / sc);
    P.push({ key: `cat|${fkey(pose)}|${w}`, x: x + (br ? trem(f, 0.006) : 0), y: y + (br ? 0.03 * smooth((f - scare) / 2) : 0), z, scale: sc, size: [w, hh2, k], draw: (p) => catCard(p, pose) });
  };
  const inside = s.light === "candle";
  if (inside) {
    if (!(f >= 1176 && f < 1196)) F.push(flameAt(f, ...NIGHTSTAND_FLAME, s.id === 10 ? smooth((f - 684) / 16) * 0.9 : 0));
    else if (f < 1192) F.push(fx(`puff${qt((f - 1176) / 16)}`, 300, 300, (p) => fxPuff(p, qt((f - 1176) / 16)), NIGHTSTAND_FLAME[0], 1.1 + (f - 1176) * 0.01, NIGHTSTAND_FLAME[2], 0.25, 0.25, { soft: true }));
    F.push(flameAt(f, ...CRATE_FLAME, s.id === 10 ? -smooth((f - 684) / 16) * 0.9 : 0));
    if (f >= 478 && f < 948) props.quiltB = 1;
    for (const [dz, k] of [[0.08, 0], [0.25, 1], [0.42, 2]] as const) F.push(flameAt(f + k * 7, X0 + 3.46, 0.36 + 0.04 * (k % 2), dz, 0.15 * Math.sin(f / 6 + k), 3.4 - 0.6 * (k % 2)));
  }
  switch (s.id) {
    case 901: case 902: props.pools = [[600, 2.75, -2.62], [600, 1.47, -2.9], [601.75, 2.42, -2.9]]; break; // BUSBY: the spot on the chair, the plaque, the portrait
    case 903: props.pools = [[639.55, 1.19, -0.25], [640.42, 1.03, 0.2]]; break; // BUSBY: candle + crucible
    case 1: { // the farmhouse; John on the porch with a lantern; lights go out on "didn't exist"
      // opening close-up (frame 0 stops the scroll): already uneasy, eyes cut hard off-screen left as if he heard
      // something, a bead of sweat; he glances back toward us as the camera pulls away
      props.windows = [f < 108 ? 1 : 0, f < 112 ? 1 : 0, f < 116 ? 1 : 0, f < 104 ? 1 : 0];
      // round 4 business: a cold breath (already mid-puff on frame 0), an eye-dart toward us and back (10-15), a dry
      // swallow with a blink and a little nod (23-28), a second shaky breath (40), another as he looks round (84)
      const gulp = bump(f, 22, 6), jy = 0.25 + take(f, 106, 0.05) - 0.012 * gulp, jt = f >= 106 ? 0 : (f < 34 ? -7 : -4) - 3 * gulp;
      add(john, 1.7, jy, 3.7, { f, expr: ex(f, [[0, "nervous"], [63, "terrified"], [80, "nervous"], [106, "scream"]]), look: f < 10 ? -1 : f < 16 ? -0.35 : f < 34 ? -1 : f < 80 ? -0.6 : 0.6, sw: [23, 34, 63, 80],
        shut: shutBefore(f, 106), roll: sway(f, 1) + (f >= 61 && f < 106 ? trem(f, 0.006) : 0), headTilt: jt,
        pose: "up", pa: poseIn(f, 106, 4), sy: stretch(f, 106, 0.16) * stretch(f, 63, 0.06) });
      if (f < 64) sweatFx({ x: 1.7, y: 0.25, z: 3.7, b: "adult", tilt: f < 34 ? -7 : -4 }, 0, 1, 30);
      const hJ: HeadAt = { x: 1.7, y: jy, z: 3.7, b: "adult", tilt: jt };
      breathFx(hJ, -6, -1, 26); breathFx(hJ, 40, -1, 24); breathFx(hJ, 84, 1, 22);
      // the family cat on the porch step: tail flicks, bristles when the lights die
      yardCat(0.55, 0.12, 5.05, [48, 88], 106, 0.5);
      props.lanterns.push([2.12, 1.15 + 0.6 * take(f, 106, 0.05), 3.78]);
      break;
    }
    case 2: { // the family who swore: a glance at each other, then a firm, shared nod on "swore"
      const e = ex(f, [[129, "nervous"], [154, "stern"]]), nod = f >= 154 && f < 168 ? Math.sin(((f - 154) / 14) * Math.PI) : 0, dn = -0.03 * nod;
      const glance = f < 153;
      const oath = poseIn(f, 167, 5); // "swore": every right hand goes up, like taking an oath
      add(john, -0.75, dn, 5.9, { f, expr: e, sw: [154], headTilt: 7 * nod, look: glance ? 1 : 0, roll: sway(f, 1), pose: "heart", ps: -1, pa: oath });
      add(lucy, 0.25, dn, 5.9, { f, expr: e, sw: [154], headTilt: -7 * nod, look: glance ? -1 : 0, roll: sway(f, 2), pose: "heart", ps: 1, pa: poseIn(f, 168, 5) });
      // the kids fidget until the vow: Betsy rocks up on her toes and darts a look at us; the boy shifts his weight
      const fid = f < 151, bY = fid ? 0.012 * Math.max(0, Math.sin((f - 129) * 0.42)) : 0;
      add(betsy, -0.35, dn + bY, 6.8, { f, expr: f >= 170 ? "smug" : e, sw: [154, 170], headTilt: 6 * nod, look: glance ? (f >= 138 && f < 143 ? -0.3 : 1) : 0, roll: sway(f, 3), pose: "heart", ps: -1, pa: poseIn(f, 166, 4) });
      const sR = fid ? steps(f, [[129, 0], [133, 0.022], [141, -0.018], [147, 0]], 3) : 0;
      add(son, 0.6, dn + 0.006 * Math.abs(sR) / 0.02, 6.85, { f, expr: ex(f, [[129, "nervous"], [153, "stern"]]), sw: [153], look: glance ? (f >= 144 && f < 149 ? 0.4 : -1) : 0, roll: sR, pose: "heart", ps: 1, pa: poseIn(f, 170, 5) });
      // breath in the cold air, puffing outward (away from the other faces); a shared exhale after the vow
      const hA = (x: number, z: number, b: Build): HeadAt => ({ x, y: dn, z, b });
      breathFx(hA(-0.75, 5.9, "adult"), 131, -1); breathFx(hA(0.25, 5.9, "adult"), 137, 1); breathFx(hA(-0.35, 6.8, "kid"), 142, -1, 18);
      breathFx(hA(0.6, 6.85, "kid"), 134, 1, 18); breathFx(hA(-0.75, 5.9, "adult"), 167, -1); breathFx(hA(0.25, 5.9, "adult"), 168, 1);
      yardCat(0.93, 0, 7.1, [140, 172], 1e9, -0.6);
      props.lanterns.push([-0.3, 0.95, 5.95]);
      break;
    }
    case 3: { // asleep; knocks on the walls: each one jolts them, heads snap toward it, they recoil
      const K: [number, number, number, number][] = [[247, -3.2, 2.2, 0.8], [260, -1.25, 1.95, 0.95], [273, -3.35, 1.3, 1.1], [282, -2.25, 2.45, 1.4]];
      const react = (cx: number) => { // look toward the latest knock, lean away from it
        let L = 0, T = 0;
        for (const [k, kx] of K) if (f >= k + 1) { const d = X0 + kx - cx; L = Math.max(-1, Math.min(1, d * 1.6)); T = -Math.sign(d) * 7 * after(f, k + 1, 7); }
        return { L, T };
      };
      const jx = X0 - 2.65, lx = X0 - 1.85, bx = X0 + 2.2, wJ = 248, wL = 261, wB = 265;
      const rj = react(jx), rl = react(lx);
      const rJ = sway(f, 1, 0.006), rL = sway(f, 2, 0.006) + (f > wL + 12 ? trem(f, 0.01) : 0);
      add(johnBed, jx, SIT + take(f, wJ, 0.07) + take(f, 273, 0.03), -2.0, { f, mode: "sit", awake: f >= wJ, expr: f >= wJ ? (f >= 262 ? "terrified" : "shock") : "neutral", sw: [262], look: f >= wJ ? rj.L : 0, tilt: rj.T, roll: rJ,
        pose: "up", pa: poseIn(f, 274, 4), sy: stretch(f, wJ, 0.14) * stretch(f, 273, 0.07) });
      add(lucyBed, lx, SIT + take(f, wL, 0.07) + take(f, 283, 0.04), -2.0, { f, sw: [283], mode: "sit", awake: f >= wL, expr: f >= wL ? (f >= 283 ? "terrified" : "shock") : "neutral", look: f >= wL ? rl.L : 0, tilt: rl.T, roll: rL,
        pose: "cover", pa: poseIn(f, wL + 3, 5), sy: stretch(f, wL, 0.14) * stretch(f, 283, 0.08) });
      add(betsyBed, bx, SIT + take(f, wB, 0.06), -2.1, { f, mode: "sit", awake: f >= wB, expr: f >= wB ? "terrified" : "neutral", look: -1, roll: sway(f, 3, 0.006) + (f > wB + 8 ? trem(f, 0.01) : 0),
        pose: "hug", pa: poseIn(f, wB + 4, 6), sy: stretch(f, wB, 0.12) });
      shockFx({ x: jx, y: SIT + take(f, wJ, 0.07), z: -2.0, b: "adult", sit: true, roll: rJ }, wJ);
      shockFx({ x: lx, y: SIT + take(f, wL, 0.07), z: -2.0, b: "adult", sit: true, roll: rL }, wL);
      if (f > wL + 12) shiverFx(lx, SIT + 0.75, -2.0, 0.9);
      sweatFx({ x: jx, y: SIT, z: -2.0, b: "adult", sit: true, roll: rJ }, wJ + 14, -1);
      K.forEach(([k, kx, ky, ks], i) => F.push(...knock(f, k, X0 + kx, ky, -2.88, ks, i + 1, "#ffd77a", 1.2 + 0.15 * i), ...knock(f, k + 5, X0 + kx + 0.22, ky - 0.18, -2.88, ks * 0.65, i + 11, "#ffd77a", 1.2 + 0.15 * i))); // double knock, as the SFX
      K.forEach(([k, kx, ky, ks], i) => F.push(...splinters(f, k, X0 + kx, ky, -2.86, ks * 0.8, i + 1)));
      break;
    }
    case 4: { // gnawing in the headboard between them: John leans in to listen, both jolt on "rat"
      const jx = X0 - 2.65, lx = X0 - 1.85;
      const jT = f < 337 ? 6 * smooth((f - 306) / 20) : -7 * after(f, 337, 10) - 2, lT = f < 337 ? -4 : 6 * after(f, 337, 10) + 3;
      const rJ = sway(f, 1, 0.006), rL = sway(f, 2, 0.006) + trem(f, 0.008);
      add(johnBed, jx, SIT + take(f, 337, 0.06), -1.95, { f, mode: "sit", expr: ex(f, [[303, "suspicious"], [337, "shock"], [347, "terrified"]]), sw: [337, 347], look: 1, tilt: jT, roll: rJ, shut: shutBefore(f, 337),
        pose: f < 336 ? "chin" : "up", pa: f < 336 ? poseIn(f, 309, 7, 333, 3) : poseIn(f, 337, 3), sy: stretch(f, 337, 0.15) });
      add(lucyBed, lx, SIT + take(f, 337, 0.04), -1.95, { f, mode: "sit", expr: ex(f, [[303, "nervous"], [315, "shock"], [337, "scream"], [352, "pained"]]), sw: [315, 337, 352], look: f >= 324 && f < 330 ? 0.5 : -1, tilt: lT, roll: rL,
        pose: f < 336 ? "cover" : "cheeks", pa: f < 336 ? poseIn(f, 317, 5) : 1, sy: stretch(f, 315, 0.1) * stretch(f, 337, 0.13) });
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
      add(john, X0 - 0.6, hopS, -0.4, { f, expr: ex(f, [[378, "angry"], [405, "nervous"], [421, "neutral"]]), sw: [405, 421], look: search ? side : 0,
        tilt: search ? 7 * Math.sin(f / 4) : 0, roll: jR,
        pose: search ? "reach" : "shrug", ps: side as -1 | 1, pa: search ? poseIn(f, 382, 3, 417, 3) : poseIn(f, 423, 5) }); // "No rat.": a deadpan shrug
      add(lucyBed, X0 - 1.85, SIT, -2.0, { f, mode: "sit", expr: f >= 389 ? "terrified" : "nervous", look: 1, roll: f >= 389 && f < 400 ? trem(f, 0.008) : 0, tilt: f >= 389 && f < 400 ? -6 : 0,
        pose: "cover", pa: poseIn(f, 390, 4), sy: stretch(f, 389, 0.1) });
      sweatFx({ x: X0 - 0.6, y: 0, z: -0.4, b: "adult" }, 424, 1, 30);
      emoteFx({ x: X0 - 0.6, y: hopS, z: -0.4, b: "adult", roll: jR }, "q", 392, 28, -1);
      if (f >= 389 && f < 401) F.push(fx(`puffC${qt((f - 389) / 12)}`, 300, 300, (p) => fxPuff(p, qt((f - 389) / 12)), X0 - 0.1, 0.25, -1.1, 0.8, 0.8, { soft: true }));
      break;
    }
    case 6: { // the covers slide off: speed lines behind the quilt, a flump of dust, Betsy jolts awake and shivers
      const qv = clamp01((f - 459) / 19) ** 1.7;
      props.quiltB = qv;
      const bx = X0 + 2.2, rB = sway(f, 3, 0.006) + (f >= 474 ? trem(f, 0.012) : 0);
      // round 10 (user: "her feet are now clipping through the bed"): SIT hides the legs IN the mattress (meant for under
      // the quilt); once the quilt flies off she sits ON the mattress, soles above its top (.72)
      const yB = SIT + 0.12 * smooth((f - 463) / 6) + take(f, 462, 0.07);
      add(betsyBed, bx, yB, -2.1, { f, mode: "sit", awake: f >= 462, expr: f >= 462 ? (f >= 476 ? "terrified" : "scream") : "neutral", sw: [476], look: 0.4, roll: rB, tilt: f >= 462 ? -4 : 0,
        pose: f < 476 ? "up" : "hug", pa: f < 476 ? poseIn(f, 462, 3) : 1, sy: stretch(f, 462, 0.17) });
      shockFx({ x: bx, y: yB, z: -2.1, b: "kid", sit: true, roll: rB }, 462);
      if (f >= 474) shiverFx(bx, yB + 0.6, -2.05, 0.95);
      sweatFx({ x: bx, y: yB, z: -2.1, b: "kid", sit: true, roll: rB }, 476, 1, 20);
      // (the vertical speed lines were drawn across her body and read as glitches: removed)
      if (f >= 477 && f < 491) F.push(fx(`puffQ${qt((f - 477) / 14)}`, 300, 300, (p) => fxPuff(p, qt((f - 477) / 14)), bx, 0.18, -0.6, 1.5, 1.5, { soft: true }));
      break;
    }
    case 7: { // something yanks her hair: a beat of dread, then she is hauled up by a tuft pulled straight up
      const up = f >= 505 ? smooth((f - 505) / 5) * (1 - 0.6 * smooth((f - 540) / 12)) : 0;
      const bx = X0 + 2.2, roll = 0.06 * up * Math.sin(f * 0.9) + (f < 505 ? trem(f, 0.006) : 0), tilt = -8 * up, y = SIT + 0.2 * up - (f >= 502 && f < 505 ? 0.015 : 0);
      add(betsyBed, bx, y, -2.1, { f, mode: "sit", pull: up, expr: f >= 505 ? (f < 524 ? "scream" : "pained") : "nervous", sw: [524], roll, headTilt: tilt, look: f < 505 ? (Math.floor(f / 12) % 2 ? 1 : -1) : 0,
        pose: "up", pa: f >= 505 ? q(0.62 + 0.38 * Math.sin((f - 505) * 0.95), 4) * (1 - smooth((f - 540) / 10)) : 0, sy: stretch(f, 505, 0.2) });
      const h: HeadAt = { x: bx, y, z: -2.1, b: "kid", sit: true, roll, tilt };
      shockFx(h, 505);
      if (f >= 505) {
        const r = HEAD.kid.r;
        F.push(fx(`tuft${f % 2}`, 300, 400, (p) => fxTuft(p, f % 2), ...hp(h, 0.02, r * 0.9 + 0.17, 0.03), 0.3, 0.4, { soft: true, glow: 1.05 }));
        const u = qt((f - 505) / 12, 6);
        if (f < 517) F.push(fx(`speedU${u}`, 600, 300, (p) => fxSpeed(p, u), ...hp(h, -r * 1.25, r * 0.6, 0.02), 0.6, 0.3, { soft: true, rot: Math.PI / 2, glow: 1.05 }));
        if (f < 517) F.push(fx(`speedU${u}`, 600, 300, (p) => fxSpeed(p, u), ...hp(h, r * 1.25, r * 0.6, 0.02), 0.6, 0.3, { soft: true, rot: Math.PI / 2, glow: 1.05 }));
      } else sweatFx(h, 497, 1, 16);
      break;
    }
    case 8: { // "It's just the wind," John says: a smug little shrug, eyes shut, waving it off
      const smug = f >= 567;
      const says = f < 585;
      add(john, X0 - 0.75, 0, -0.55, { f, expr: says ? "smug" : "smile_closed", sw: [585], look: 0, talk: talkAt(f, SPEECH.john8),
        pose: "shrug", pa: poseIn(f, 559, 6, 585, 5), wave: f >= 589 && f < 607 ? 0.6 + 0.4 * Math.sin(f / 3) : undefined,
        headTilt: smug ? 9 * smooth((f - 567) / 5) : 0, tilt: smug ? -4 * smooth((f - 567) / 5) : 0, roll: sway(f, 1) });
      break;
    }
    case 9: { // the wind slaps her: a gust swooshes in from the right, smack, hand print, dizzy stars
      const hit = f >= 620, bx = X0 + 2.2, roll = hit ? 0.16 * after(f, 620, 10) + sway(f, 3, 0.01) : 0, tilt = hit ? -6 - 8 * after(f, 620, 12) : 0;
      add(betsyBed, bx, SIT, -2.1, { f, mode: "sit", expr: hit ? "dazed" : "neutral", roll, headTilt: tilt });
      const jT = f >= 633 ? -5 * smooth((f - 633) / 4) : 0;
      add(john, X0 + 1.2, take(f, 633, 0.05), -1.2, { f, expr: ex(f, [[610, "smug"], [633, "shock"], [645, "terrified"]]), sw: [645], look: 1, shut: shutBefore(f, 633), tilt: jT, roll: sway(f, 1),
        pose: "cover", pa: poseIn(f, 634, 4), sy: stretch(f, 633, 0.15) });
      shockFx({ x: X0 + 1.2, y: take(f, 633, 0.05), z: -1.2, b: "adult", tilt: jT }, 633);
      emoteFx({ x: X0 + 1.2, y: take(f, 633, 0.05), z: -1.2, b: "adult", tilt: jT }, "bang", 633, 22);
      const h: HeadAt = { x: bx, y: SIT, z: -2.1, b: "kid", sit: true, roll, tilt };
      if (f >= 612 && f < 622) { const u = qt((f - 612) / 10, 10); F.push(fx(`swoosh${u}`, 600, 400, (p) => fxSwoosh(p, u), ...hp(h, 0.42, 0.02, 0.05), 0.75, 0.5, { soft: true, glow: 1.1 })); }
      F.push(...knock(f, 620, ...hp(h, 0.24, -0.02, 0.1), 0.8, 7, "#ffe27a", 1.6));
      if (f >= 621 && f < 637) { const u = qt((f - 621) / 16, 8); F.push(fx(`specks${u}`, 500, 500, (p) => fxSpecks(p, u), ...hp(h, 0.5, 0.0, 0.1), 0.6, 0.6, { soft: true, glow: 1.1 })); }
      if (hit) F.push(fx("hand", 220, 260, fxHand, ...hp(h, 0.115, -0.06, 0.03), 0.13, 0.155, { soft: true, rot: -0.35 }));
      if (f >= 628) F.push(fx(`dizzy${qt((f % 20) / 20, 10)}`, 420, 240, (p) => fxDizzy(p, qt((f % 20) / 20, 10)), ...hp(h, 0, HEAD.kid.r + 0.06, 0.02), 0.7, 0.4, { soft: true, glow: 1.2 }));
      break;
    }
    case 10: { // it starts talking: rings from the dark corner
      if (f >= 686) F.push(voice(f, X0 + 3.8, 1.55, -2.8, 0.6 + 0.6 * smooth((f - 686) / 20)));
      break;
    }
    case 11: { // the family huddled on the big bed, trembling; all jolt on "Kate"
      const sq = 0.06 * smooth((f - 722) / 30);
      const J = (x: number, k: number, who: Who, z: number, y0: number, b: Build, at: number, scream: Pose = "up") => {
        const r = sway(f, k, 0.006) + trem(f + k, 0.01), y = y0 + take(f, at, 0.05);
        add(who, x, y, z, { f, mode: "sit", expr: f >= at ? "scream" : "terrified", look: 1, roll: r, shut: shutBefore(f, at), tilt: f >= at ? -5 * after(f, at, 10) : 2,
          pose: f >= at ? scream : "hug", pa: f >= at ? poseIn(f, at, 3) : poseIn(f, 724, 8), sy: stretch(f, at, 0.16) });
        shockFx({ x, y, z, b, sit: true, roll: r }, at);
        return { x, y, z, b, sit: true, roll: r } as HeadAt;
      };
      // near/far (camera round 2): the three on the bed squeeze up; the boy has backed off the bed and stands at its foot,
      // nearest the lens (a big soft head in the right foreground), clutching himself
      const hj = J(X0 - 2.85 + sq, 1, johnBed, -1.95, SIT, "adult", 746);
      const hl = J(X0 - 2.35 + sq * 0.5, 2, lucyBed, -1.75, SIT, "adult", 746, "cheeks");
      // style C (user: "they aren't in the covers but noclipped inside it, the boy especially"): the two at the front sit
      // lower, and the huddle quilt (world.ts quiltH) rises in a soft lump over every lap
      props.huddle = true;
      J(X0 - 1.9, 3, betsyBed, -1.55, SIT - 0.05, "kid", 747);
      // (the boy stood in the blurred foreground with a dark box in front of him: back on the bed with the others)
      J(X0 - 1.45, 4, son, -1.4, SIT - 0.17, "kid", 747, "cheeks");
      sweatFx(hj, 726, -1, 20); sweatFx(hl, 732, 1, 24);
      emoteFx(hj, "bang", 746, 16, -1); emoteFx(hl, "bang", 747, 15, 1);
      shiverFx(X0 - 2.3, SIT + 0.75, -1.7, 2.0);
      F.push(voice(f, X0 - 0.4, 1.75, -2.4, 0.7));
      break;
    }
    case 12: { // sings hymns (everyone sways along, ghostly notes from the walls); roasts the dinner guests (smoking heads)
      props.plates = true; props.quiltB = 0;
      const hymn = f >= 764 && f < 797 ? Math.sin(((f - 764) / 16) * Math.PI) : 0;
      const x0 = X0 + 1.85, x1 = X0 + 2.85;
      const laughB = f >= 797 && f < 821 ? 0.015 * Math.abs(Math.sin(f * 0.6)) : 0;
      add(folk(0), x0, take(f, 797, 0.05), 0.25, { f, expr: ex(f, [[762, "smile_closed"], [797, "shock"], [806, "angry"]]), sw: [806], look: f >= 812 ? 1 : 0,
        roll: 0.04 * hymn + (f >= 797 ? -0.05 * after(f, 797, 12) + sway(f, 1, 0.008) : 0), shut: shutBefore(f, 797),
        pose: "fists", pa: poseIn(f, 806, 4), sy: stretch(f, 797, 0.15) });
      add(lucy, X0 + 2.35, 0, 0.15, { f, expr: ex(f, [[762, "smile_closed"], [797, "nervous"], [821, "terrified"]]), look: f < 797 ? -1 : f < 821 ? -1 : 1, roll: -0.04 * hymn + (f >= 797 ? trem(f, 0.006) : 0),
        pose: "cover", pa: poseIn(f, 799, 5) });
      add(folk(1), x1, take(f, 821, 0.05) + laughB, 0.25, { f, expr: ex(f, [[762, "smile_closed"], [797, "laugh"], [821, "shock"], [829, "angry"]]), sw: [829], look: f < 821 ? -1 : 0,
        roll: 0.04 * hymn + (f >= 821 ? 0.05 * after(f, 821, 12) : 0), tilt: f >= 797 && f < 821 ? -5 : 0, shut: shutBefore(f, 821),
        pose: f < 821 ? "point" : "fists", ps: -1, pa: f < 821 ? poseIn(f, 800, 4, 819, 2) : poseIn(f, 829, 4), sy: stretch(f, 821, 0.15) }); // laughs and points... then gets roasted himself
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
      emoteFx({ x: x0, y: take(f, 797, 0.05), z: 0.25, b: "adult" }, "vein", 806, 35, -1);
      emoteFx({ x: x1, y: take(f, 821, 0.05) + laughB, z: 0.25, b: "adult" }, "vein", 829, 12, 1);
      sweatFx({ x: X0 + 2.35, y: 0, z: 0.15, b: "adult" }, 801, -1, 24);
      break;
    }
    case 13: { // neighbours ride in from miles away on a horse wagon (wagon.ts) just to get insulted by a wall: the riders'
      // take on "insulted", then they laugh along with the crowd (wagon agent; the late walker's side -> front card swap
      // popped, so he is gone: the wagon carries the arrival)
      const ins = 904, lgh = 931, wx = wagonX(f), lean = wagonLean(f), bnc = wagonBounce(f), pit = wagonPitch(f);
      // the horse: a profile card in the travel plane (yaw 0, so the 3D shafts meet its collar from every angle)
      const hz = horsePose(f, light2D(cam, false)), hx = wx + HORSE_DX;
      const [hw, hh2, hk] = tier(cam.pos.distanceTo(tmp.set(hx, 0.9, WZ)) / HORSE_SC);
      P.push({ key: `horse|${fkey(hz)}`, x: hx, y: 0, z: WZ, scale: HORSE_SC, yaw: 0, size: [hw, hh2, hk], draw: (p) => horseCard(p, hz) });
      const blob = (x: number, z: number, w: number, d: number) =>
        F.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x, y: 0.04, z, w, h: d, flat: true, rot: 0 });
      blob(hx - 0.07, WZ, 1.55, 0.6);
      for (const [dx, dz] of [[-0.72, 0.66], [-0.72, -0.66], [0.66, 0.66], [0.66, -0.66]]) blob(wx + dx, WZ + dz, 0.36, 0.2);
      // riders: front-facing sit cards, hips at the box seat (driver) / in the hay (passengers); they ride the bed's
      // bounce and pitch, lurch forward on the stop, pop up on "insulted", then laugh
      const RIDE: [Who, number, Expr][] = [[folk(0), 0, "grin"], [folk(5), 7, "smile"], [folk(10), 8, "laugh"]];
      // acting: the driver holds the reins in his lap the whole ride (toon pose "reins"); the passengers' take on
      // "insulted" (hands up / hands to the cheeks, with a stretch), then the laugh: hands on the hips / holding the belly
      // (a giggle behind the hands hid the hands in the open laughing mouth and read as tusks). The take pose lets go just
      // before the laugh pose comes in (no arm pop between them).
      const ACT: [Pose, Pose][] = [["reins", "reins"], ["up", "hips"], ["cheeks", "belly"]];
      SEATS.forEach((st, k) => {
        const [who, bs, e0] = RIDE[k], x = wx + st.dx, z = WZ + st.dz, lgf = lgh + 2 * k;
        const lg = f >= lgf, lb = lg ? Math.abs(Math.sin((f - lgh + k * 3) * 0.55)) : 0;
        const y = st.y + bnc + pit * st.dx + take(f, ins, 0.06) + 0.018 * lb;
        const roll = -lean + (lg ? 0.045 * Math.sin((f - lgh + k * 3) * 0.55) : f >= ins ? trem(f, 0.007) : 0);
        const tl = lg ? (k % 2 ? 4 : -4) : 0, sy = stretch(f, ins, k === 0 ? 0.09 : 0.14);
        const pose: Pose = k === 0 ? "reins" : lg ? ACT[k][1] : ACT[k][0];
        const pa = k === 0 ? 1 : lg ? poseIn(f, lgf + 1, 4) : poseIn(f, ins + 1, 3, lgf - 5, 4);
        add(who, x, y, z, { f, mode: "sit", bs, roll, shut: shutBefore(f, ins), sw: [899, lgf],
          expr: ex(f, [[841, e0], [899, "smile"], [ins, "shock"], [lgf, "laugh"]]),
          look: f < 899 ? 1 : 0, tilt: tl, headTilt: f >= 899 && f < ins ? (k % 2 ? 6 : -6) : 0, pose, pa, sy });
        if (k < 2) shockFx({ x, y, z, b: "adult", sit: true, roll }, ins);
        if (k === 0) {
          sweatFx({ x, y, z, b: "adult", sit: true, roll }, ins + 3, 1, 20);
          // the reins: from his right fist in his lap (toon "reins": card-local 0.071, 0.326 m from the sole for an
          // adult sitting; the upper body tilts about the hips at 0.153 m; the stretch scales it) to the bit
          const a = (-tl * Math.PI) / 180, rx = 0.0714 / Math.sqrt(sy), ry = (0.3257 - 0.153) * sy;
          REINS.on = true;
          REINS.a = onCard(cam, x, y, z, rx * Math.cos(a) - ry * Math.sin(a), 0.153 * sy + rx * Math.sin(a) + ry * Math.cos(a), roll, 0.07);
          REINS.b = horsePt(horseBit(hz), hx, WZ + 0.03);
        }
      });
      // the wall insults them: a knock + its voice ringing on the logs over the door (framed between the riders' heads after the whip)
      // and again on "wall" (928), which cracks them up
      F.push(...knock(f, ins, 0.15, 2.32, 3.15, 0.8, 6, "#d8ffe6", 1.4), ...splinters(f, ins, 0.15, 2.32, 3.17, 0.75, 6));
      F.push(...knock(f, 928, 0.15, 2.32, 3.15, 0.9, 7, "#d8ffe6", 1.4));
      if (f >= 870) F.push(voice(f, 0.15, 2.32, 3.1, 1.05));
      // the man in the doorway and the crowd laugh at the riders (thinned: two neighbours stood where the wagon now stops)
      const pl = f >= 910;
      add(folk(2), -0.45, 0.25 + (pl ? 0.02 * Math.abs(Math.sin(f * 0.55)) : 0), 3.7, { f, expr: pl ? "laugh" : "grin", look: -1, roll: pl ? 0.04 * Math.sin(f * 0.55) : 0, tilt: pl ? 5 : 0 });
      const crowd: [number, number, number][] = [[1.6, 6.0, 3], [2.9, 6.9, 4], [4.2, 7.9, 1]];
      crowd.forEach(([x, z, i], k) => {
        const laugh = f >= ins + 4 + 2 * k;
        add(folk(i), x, laugh ? 0.02 * Math.abs(Math.sin((f + k * 3) * 0.55)) : 0, z, { f, expr: laugh ? "laugh" : ex(f, [[841, "smile"], [868, "grin"]]), sw: [868], bs: k,
          look: -1, roll: laugh ? 0.04 * Math.sin((f + k * 3) * 0.55) : 0, tilt: laugh ? -5 : 0 });
        if (k % 2 === 0) props.lanterns.push([x + 0.42, 0.95 + (laugh ? 0.02 * Math.abs(Math.sin((f + k * 3) * 0.55)) : 0), z + 0.05]);
        const hb: HeadAt = { x, y: 0, z, b: "adult" }; breathFx(hb, 912 + 5 * k, k % 2 ? 1 : -1, 16); breathFx(hb, 930 + 5 * k, k % 2 ? -1 : 1, 16);
      });
      break;
    }
    case 14: { // Kate only hates one person. John: darting eyes, sweating; jolts on his own name
      const jx = X0 - 2.0, y = take(f, 1006, 0.06), r = sway(f, 1) + (f >= 1012 ? trem(f, 0.01) : 0);
      // a nervous rub of the back of the neck on the hold before his name (hand drops away 3 f before the jolt)
      const rub = f >= 976 && f < 1003 ? -1 + 0.35 * Math.sin((f - 976) * 0.8) : undefined;
      add(john, jx, y, -0.75, { f, expr: ex(f, [[948, "nervous"], [990, "terrified"], [1006, "scream"]]), sw: [990], look: f < 1006 ? (Math.sin(f / 10) > 0 ? 1 : -1) : 0, roll: r, shut: shutBefore(f, 1006), tilt: f >= 1006 ? -4 : 2 * Math.sin(f / 10), wave: rub,
        headTilt: rub !== undefined ? 4 : 0, pose: "cheeks", pa: poseIn(f, 1006, 3), sy: stretch(f, 1006, 0.17) });
      const h: HeadAt = { x: jx, y, z: -0.75, b: "adult", roll: r };
      shockFx(h, 1006);
      sweatFx(h, 966, 1, 24); sweatFx(h, 978, -1, 24);
      if (f >= 1012) shiverFx(jx, 1.1, -0.7, 1.1);
      if (f >= 958) F.push(voice(f, X0 - 1.5, 1.9, -1.7, 0.8 + 0.1 * smooth((f - 958) / 20), "#c6f7d8"));
      break;
    }
    case 15: { // face twitches (expression flicker + tick marks), tongue swells (a growing pink tongue)
      const tw = f >= 1039 && f < 1065, tg = f >= 1065, jx = X0 - 2.4;
      const k = Math.floor(f / 3) % 3, ex2: Expr = tg ? "lick" : tw ? (["pained", "nervous", "dazed"] as Expr[])[k] : "nervous";
      const tilt = tw ? (k - 1) * 7 : 0, roll = tw ? (k - 1) * 0.025 : sway(f, 1, 0.006);
      // the tongue swells: his OWN tongue grows out of the open mouth (toon.ts swollenTongue), no second tongue card
      const tng = tg ? Math.round(smooth((f - 1065) / 16) * 12) / 12 : 0;
      add(johnBed, jx, SIT, -2.0, { f, mode: "sit", expr: ex2, headTilt: tilt, roll, tongue: tng });
      const h: HeadAt = { x: jx, y: SIT, z: -2.0, b: "adult", sit: true, roll, tilt };
      if (tw) F.push(fx(`twitch${k}`, 300, 300, (p) => fxTwitch(p, k), ...hp(h, 0.2 * (k === 1 ? -1 : 1), 0.08, 0.05), 0.42, 0.42, { soft: true, glow: 1.1 }));
      break;
    }
    case 16: { // he doesn't wake up: heads bowed, slow breaths, tears
      props.johnLying = true;
      // John lies UNDER the quilt hump (world.ts quiltJ), head on the pillow; the family stands on the floor beyond the
      // far side of the bed (they used to stand inside the bed frame)
      add(johnBed, X0 - 2.25, 0.95, -0.95, { f, awake: false, expr: "neutral", roll: -Math.PI / 2 + 0.02, bust: true }); // no legs / arms: they poked up through the quilt (user)
      add(lucy, X0 - 3.72, 0, -1.4, { f, expr: f >= 1170 ? "cry" : "sad", sw: [1170], headTilt: 10, look: 0.5, roll: sway(f, 2, 0.008), pose: "cover", pa: poseIn(f, 1168, 7) });
      const sn = bump(f, 1138, 5) + bump(f, 1176, 5); // Betsy sniffles
      add(betsy, X0 - 3.25, -0.012 * sn, -1.0, { f, expr: f >= 1176 ? "cry" : "sad", sw: [1176], headTilt: 8 + 3 * sn, look: 0.5, roll: sway(f, 3, 0.008), pose: "hug", pa: poseIn(f, 1140, 8) });
      add(son, X0 - 3.72, 0, -2.3, { f, expr: "sad", headTilt: 8, look: f >= 1150 && f < 1156 ? 0.1 : 0.6, roll: steps(f, [[1101, 0], [1124, 0.018], [1158, -0.012]], 5), pose: "hold", pa: poseIn(f, 1110, 8) }); // shifts his weight
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
      const flk = [1284, 1314].find((k) => f >= k && f < k + 6), tail = q(flk !== undefined ? Math.sin((f - flk) * 1.9) : Math.sin(f / 7), 10), blink = lidAt(f, 77);
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
      const around = wh ? [0, 0.7, 0, -0.7][Math.floor((f - 1650) / 9) % 4] : 0.4; // whistling innocently, eyes darting round
      add(writer, X0 + 2.3, 0, 0.3, { f, expr: ex(f, [[1565, "smug"], [1600, "stern"], [1650, "whistle"]]), sw: [1600], headTilt: wh ? -5 : 7 + 3 * writing, look: around, tilt: wh ? -2 : 4, roll: sway(f, 4, 0.008),
        pose: "chin", pa: poseIn(f, 1567, 6, 1597, 4) });
      if (CHARM()) sweatFx({ x: X0 + 2.3, y: 0, z: 0.3, b: "adult", tilt: -5 }, 1656, -1, 26);
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
      for (const k of pops) breathFx({ x: 3.0, y: hopF, z: 8.2, b: "adult" }, k + 1, 1, 18);
      add(fisher, 3.0, hopF, 8.2, { f, expr: ex(f, [[1696, "grin"], [1753, "laugh"]]), look: 0.3, roll: sway(f, 7), talk: talkAt(f, SPEECH.fisher),
        pose: "spread", pa: poseIn(f, 1700, 6), sy: stretch(f, 1729, 0.07) * stretch(f, 1753, 0.08) * stretch(f, 1770, 0.1) });
      const doubt = f >= 1770;
      // near/far (camera round 2): the doubtful listener stands nearer the lens than the fisher
      add(folk(3), 1.95, 0, 9.6, { f, expr: ex(f, [[1696, "neutral"], [1729, "suspicious"], [1770, "smug"]]), sw: [1729, 1770], look: 1,
        roll: doubt ? 0.05 * smooth((f - 1770) / 6) : sway(f, 3), headTilt: doubt ? -8 : 0, pose: "chin", ps: -1, pa: poseIn(f, 1731, 6), browUp: doubt ? 3 : 0 });
      emoteFx({ x: 1.95, y: 0, z: 9.6, b: "adult" }, "q", 1729, 30, 1);
      props.lanterns.push([1.55, 0.95, 9.65]);
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
        add(folk(i), x, last ? take(f, 1853, 0.06) : 0, 12.5, { f, expr: last ? "scream" : whisp ? "suspicious" : i < k ? "terrified" : listen ? "neutral" : "neutral",
          look: listen ? -1 : 1, headTilt: whisp ? 8 : listen ? -6 : 0, roll, shut: i === 4 && shutBefore(f, 1853),
          talk: whisp ? q(0.25 + 0.5 * Math.abs(Math.sin(f * 0.9)), 4) : 0, pose: last ? "cheeks" : undefined, pa: last ? poseIn(f, 1853, 3) : 0, sy: last ? stretch(f, 1853, 0.16) : 1 });
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
    // ======================= WINCHESTER: "The House Built to Lose Ghosts" =======================
    case 101: { // garden fly-through: a gardener clipping the hedge, a worker with a ladder
      add(CREW.gardener, WX(-7.5), bounce(f, 16, 0.035), 9.6, { f, expr: "smile_closed", look: -1, pose: "hold", pa: 1, headTilt: 6 * Math.sin(f * 0.2) });
      add(CREW.lumber, WX(9.5), bounce(f, 13, 0.03, 5), 9.4, { f, expr: "whistle", look: 1, pose: "hold", pa: 1 });
      break;
    }
    case 102: { // the staircase into the ceiling: a worker climbs ... bonk
      const k = Math.min(4, Math.max(0, Math.floor((f - 62) / 6))), y = 0.295 * (k + 1) + (f < 90 ? take(f, 62 + k * 6, 0.04) : 0), z = 0.7 - 0.31 * (k + 0.5), x = FX(4.0);
      const bonk = f >= 90;
      add(CREW.apprentice, x, y, z, { f, expr: bonk ? "dazed" : "whistle", look: -1, sy: bonk ? stretch(f, 90, -0.16) : 1, headTilt: bonk ? -10 : 5 * Math.sin(f * 0.35), pose: bonk ? "cover" : undefined, pa: bonk ? poseIn(f, 90, 4) : 0 });
      if (bonk) { shockFx({ x, y, z, b: "adult" }, 90); emoteFx({ x, y, z, b: "adult" }, "bang", 91, 16, 1);
        if (f >= 96) F.push(fx(`dizzy${qt(((f - 96) % 18) / 18)}`, 400, 400, (p) => fxDizzy(p, qt(((f - 96) % 18) / 18)), ...hp({ x, y, z, b: "adult" }, 0, 0.42), 0.6, 0.4, { soft: true, glow: 1.1 })); }
      break;
    }
    case 103: { // the Door to Nowhere swings open; a worker steps out ... and windmills over the drop
      WHS.doorNW = smooth((f - 124) / 12);
      if (f >= 136) { const x = WX(17.55), y = 3.38, z = -0.1, wob = Math.sin(f * 0.9);
        // CHECKLIST 8: his hat blows off at the edge and tumbles down the two-story drop (the tilt down follows it)
        const lost = f >= 156, who = lost ? DOORMAN_NOHAT : CREW.doorman;
        if (lost && f < 192) {
          const tt = Math.min(f - 156, 26) / 30, hy = Math.max(0.12, y + 1.55 + 1.6 * tt - 7.5 * tt * tt), hx = x + 0.55 * tt, ang = f < 182 ? (f - 156) * 0.45 : 0;
          F.push(fx(`hatFall${Math.round(ang * 10)}`, 300, 300, (p) => { v3Hat(p, CREW.doorman.o, 150, 196, 230, 0, -2.1); }, hx, hy, z + 0.35, 0.42, 0.42, { rot: ang }));
          if (f >= 182) { const q = qt((f - 182) / 10); F.push(fx(`hatPuff${q}`, 300, 300, (p) => fxPuff(p, q), hx, 0.2, z + 0.4, 0.9, 0.9, { soft: true })); }
        }
        add(who, x, y + hop(f, 150, 0.13, 10), z, { f, expr: f < 150 ? "whistle" : "scream", look: 1, sy: stretch(f, 150, 0.16), roll: f < 150 ? 0 : 0.12 * wob, pose: f < 150 ? undefined : "up", pa: poseIn(f, 150, 3) });
        if (f >= 150) { emoteFx({ x, y, z, b: "adult", roll: 0.12 * wob }, "bang", 150, 20, -1); sweatFx({ x, y, z, b: "adult" }, 152, 1); } }
      break;
    }
    case 104: { // the reveal: Sarah in the garden holding up her blueprint, smug; a worker on the porch roof
      const x = WX(0.8), z = 26;
      add(SARAH, x, hop(f, 250, 0.06, 9) + (f >= 260 ? bounce(f, BEAT, 0.02) : 0), z, { f, expr: f < 250 ? "smile_closed" : "smug", look: f < 250 ? -1 : 1, browUp: f >= 250 ? 0.6 : 0, pose: "hold", pa: 1, sy: stretch(f, 250, 0.1), headTilt: f >= 250 ? 7 : 0 });
      F.push(fx("bp", 300, 220, blueprintCard, x + 0.02, 1.0, z + 0.12, 0.62, 0.45));
      add(CREW.roofer, WX(6.5), 3.95 + 0.02 * (0.5 + 0.5 * Math.sin(f * 0.7)), 2.6, { f, expr: "whistle", look: 1, prop: ["hammer", 0.5 + 0.5 * Math.sin(f * 0.7)] });
      break;
    }
    case 105: { // 1881: Sarah at the mantel, the baby's and William's portraits; candlelight; tears
      const x = FX(3.4), z = -5.15;
      props.pools = [[FX(4.25), 1.75, -6.25], [FX(4.25), 1.75, -4.75], [FX(4.05), 0.5, -5.5]];
      add(SARAH, x, f >= 395 ? 0.012 * Math.abs(Math.sin(f * 0.9)) : 0, z, { f, expr: f < 395 ? "sad" : "cry", look: f < 395 ? 1 : -1, headTilt: f < 395 ? 6 + 2 * Math.sin(f * 0.08) : -8 + 2 * Math.sin(f * 0.9), sy: f >= 395 ? 1 - 0.018 * Math.abs(Math.sin(f * 0.9)) : 1 });
      if (f >= 330) sweatFx({ x, y: 0, z, b: "adult" }, 330, -1, 26, "#bfe6ff");
      break;
    }
    case 106: { // the fortune: coins pile up; "a day" -> eyes pop
      const x = FX(-2.45), z = -4.8;
      WP.coins = smooth((f - 470) / 70);
      const pop = f >= 544;
      add(SARAH, x, hop(f, 500, 0.05, 8) + (f >= 508 && !pop ? bounce(f, 8, 0.025) : 0) + hop(f, 544, 0.11, 10), z, { f, expr: pop ? "shock" : f >= 500 ? "grin" : "suspicious", look: 0, pose: pop ? "cheeks" : undefined, pa: poseIn(f, 544, 3), sy: pop ? stretch(f, 544, 0.16) : stretch(f, 500, 0.08), headTilt: f >= 500 && !pop ? 5 * Math.sin(f * 0.4) : 0 });
      if (pop) emoteFx({ x, y: 0, z, b: "adult" }, "bang", 544, 18, 1);
      for (const at of [480, 500, 520, 540]) if (f >= at && f < at + 14) { const u = qt((f - at) / 14, 7); F.push(fx(`twk${u}`, 400, 400, (p) => fxTwinkle(p, u, 5), FX(-2.95) + ((at / 20) % 3) * 0.12, 1.0, -3.7, 0.3, 0.3, { soft: true, glow: 1.4 })); }
      break;
    }
    case 107: { // the psychic at the séance table (lip-synced to the narrator), Sarah terrified
      WP.seance = 1; WP.candles = 1; WP.crystal = f < 633 ? 0.25 : 0.55 + 0.35 * Math.sin(f * 0.25);
      props.pools = [[FX(0), 1.13, 1.2], [FX(-0.42), 1.15, 1.3], [FX(0.42), 1.15, 1.3]];
      const px = FX(-0.42), pz = 0.45, talking = f >= 633 && f < 812;
      const talk = talking ? Math.min(1, (VENV[f] ?? 0) * 1.15) : 0;
      add(PSYCHIC, px, talking ? 0.012 * (VENV[f] ?? 0) : 0, pz, { f, expr: f >= 760 ? "angry" : "evil", look: f >= 733 && f < 760 ? 1 : 0, talk, headTilt: talking ? nod(f) - 2 : 0, pose: f >= 790 ? "fists" : f >= 760 ? "point" : f >= 633 ? "spread" : "hold", pa: 1, ps: 1 });
      const sx = FX(0.66), sz = 1.75, scared = f >= 700;
      add(SARAH, sx + (scared ? shake(f, 0.012) : 0), hop(f, 733, 0.1, 10), sz, { f, expr: f >= 733 ? "scream" : scared ? "terrified" : "nervous", look: -1, pose: f >= 733 ? "cheeks" : undefined, pa: poseIn(f, 733, 3), sy: f >= 733 ? stretch(f, 733, 0.1) : 1 });
      if (scared) sweatFx({ x: sx, y: 0, z: sz, b: "adult" }, 700, 1);
      if (f >= 733) emoteFx({ x: sx, y: 0, z: sz, b: "adult" }, "bang", 733, 18, 1);
      if (f >= 790 && f < 802) F.push(fx(`slam${qt((f - 790) / 12)}`, 400, 400, (p) => fxShock(p, qt((f - 790) / 12)), FX(-0.42), 0.95, 0.95, 0.9, 0.9, { soft: true, glow: 1.15 }));
      break;
    }
    case 108: { // the little farmhouse; Sarah arrives; a worker starts hammering
      props.windows = [0, 0, 0, 0]; // daytime: the windows are not lit
      add(SARAH, MXv(-1.0), bounce(f, BEAT / 2, 0.03), 17.5, { f, expr: "grin", look: 1, pose: "hold", pa: 1, headTilt: 5 * Math.sin(f * 0.3) }); F.push(fx("bp", 300, 220, blueprintCard, MXv(-0.98), 1.0, 17.62, 0.62, 0.45));
      add(CREW.farmhand, MXv(2.6), 0, 15.5, { f, expr: "smile_closed", look: -1, prop: ["hammer", f > 856 ? 0.5 + 0.5 * Math.sin(f * 0.8) : 0] });
      break;
    }
    case 109: case 110: case 111: case 112: { // the time-lapse: scaffolding + hammering, day / night
      WHS.scaffold = 1; WHS.tallTower = 1;
      const hk = (ph: number) => 0.5 + 0.5 * Math.sin(f * 0.8 + ph);
      add(CREW.sc1, WX(4.2), 3.3 + 0.02 * hk(0), 2.25, { f, expr: "smile_closed", look: 1, prop: ["hammer", hk(0)] });
      add(CREW.sc2, WX(9.0), 6.5 + 0.02 * hk(1.7), 2.25, { f, expr: "whistle", look: -1, prop: ["hammer", hk(1.7)] });
      add(CREW.sc3, WX(12.0), 3.3 + 0.02 * hk(3.1), 2.25, { f, expr: "smile_closed", look: -1, prop: ["hammer", hk(3.1)] });
      if (s.mood === "night") props.lanterns.push([WX(5.2), 4.1, 2.75], [WX(10.2), 7.3, 2.75]);
      break;
    }
    case 113: { // the remodel gag: paint roller, flop into the armchair
      // seen from the fireplace: he stands in front of the armchair, then flops back into it (legs hidden by the seat)
      const z = -4.45, flop = smooth((f - 1030) / 10), x = FX(2.8) - 0.75 * flop;
      add(GUY, x, 0.3 * flop + (f < 1030 ? bounce(f, 9, 0.015) : 0), z, { f, expr: f < 1030 ? "pained" : "dazed", look: -1, headTilt: f < 1030 ? -3 + 3 * Math.sin(f * 0.12) : 0, sy: stretch(f, 1030, -0.12), roll: -0.22 * flop, pose: f < 1030 ? "hold" : "spread", pa: 1 });
      if (f < 1030) F.push(fx("roller", 200, 260, rollerCard, x + 0.09, 1.0, z - 0.16, 0.32, 0.42));
      if (f >= 1040) F.push(fx(`dizzy${qt(((f - 1040) % 18) / 18)}`, 400, 400, (p) => fxDizzy(p, qt(((f - 1040) % 18) / 18)), x, 2.02, z, 0.55, 0.36, { soft: true, glow: 1.1 }));
      break;
    }
    case 114: { // a hundred and sixty rooms: Sarah waving from the belvedere
      add(SARAH, WX(19.5), 8.25 + bounce(f, 10, 0.06), -2.6, { f, expr: "grin", look: 0, pose: "up", pa: 0.6 + 0.4 * Math.sin(f * 0.5), sy: 1 + 0.03 * Math.sin((2 * Math.PI * f) / 10) });
      break;
    }
    case 115: { // a door that opens onto bricks ... bonk
      WP.doorB = smooth((f - 1145) / 10);
      const x = FX(3.75), z = 2.0, bonk = f >= 1160;
      add(CREW.bricky, x + (f >= 1154 ? 0.25 * smooth((f - 1154) / 6) : 0), bonk ? 0 : bounce(f, 12, 0.02), z, { f, expr: bonk ? "dazed" : "whistle", look: 1, sy: stretch(f, 1160, -0.15), roll: bonk ? -0.1 : 0 });
      if (bonk) { shockFx({ x: x + 0.25, y: 0, z, b: "adult" }, 1160); emoteFx({ x: x + 0.25, y: 0, z, b: "adult" }, "bang", 1161, 16, -1); }
      break;
    }
    case 116: { // the window in the floor: a worker looks down; the cook below waves up
      const x = FX(-2.3), z = 0.5;
      add(CREW.glazier, x, hop(f, 1188, 0.14, 11), z, { f, expr: f >= 1188 ? "shock" : "suspicious", look: 0, headTilt: f < 1188 ? 4 * Math.sin(f * 0.25) : 0, sy: stretch(f, 1188, 0.17), pose: f >= 1188 ? "cheeks" : undefined, pa: poseIn(f, 1188, 3) });
      if (f >= 1188) emoteFx({ x, y: 0, z, b: "adult" }, "bang", 1188, 18, 1);
      break;
    }
    case 117: { // the switchback staircase: Sarah creeps up tiny 2.5-inch steps
      const st = Math.min(24, Math.floor(clamp01((f - 1222) / 84) * 25)), fl = Math.floor(st / 6), i = st % 6;
      const x = fl % 2 ? FX(-3.95 + 6 * 0.16 - (i + 0.5) * 0.16) : FX(-3.95 + (i + 0.5) * 0.16), y = (fl * 6 + i + 1) * 0.065, z = -6.7 - fl * 0.5;
      add(SARAH, x, y + take(f, 1222 + Math.floor(st * 2), 0.02), z, { f, expr: f < 1275 ? "nervous" : "pained", look: fl % 2 ? -1 : 1, scale: 0.92, headTilt: 4 * Math.sin(f * 0.6) });
      break;
    }
    case 118: case 119: case 120: { // thirteens: the clock with 13 hours, the 13 doors, the 13-hole drain
      for (const at of [1330, 1395, 1430]) if (f >= at && f < at + 14 && s.id === (at < 1372 ? 118 : at < 1410 ? 119 : 120)) {
        const u = qt((f - at) / 14, 7), pos: V3 = s.id === 118 ? [FX(-4.2) + 0.27, 1.92 + 0.15, 2.3 - 0.1] : s.id === 119 ? [FX(0), 4.9, -2.6] : [FX(3.9), 0.85, -7.6];
        F.push(fx(`twk${u}`, 400, 400, (p) => fxTwinkle(p, u, 5), ...pos, 0.35, 0.35, { soft: true, glow: 1.4 })); }
      break;
    }
    case 121: { // her will: the lawyer unrolls 13 parts
      const x = FX(3.1), z = -3.85, n = Math.min(13, Math.max(1, Math.floor((f - 1470) / 3)));
      add(writer, x, hop(f, 1492, 0.04, 8), z, { f, expr: f >= 1492 ? "suspicious" : "stern", look: -1, browUp: f >= 1492 ? 0.8 : 0, pose: "hold", pa: 1, headTilt: 3 * Math.sin(f * 0.1), sy: stretch(f, 1492, 0.08) });
      F.push(fx(`scroll${n}`, 300, 900, (p) => scrollCard(p, n), x + 0.02, 0.95 - (0.06 + n * 0.062) * 0.45, z + 0.14, 0.3, 0.9));
      break;
    }
    case 122: { // midnight: the bell swings in the belvedere and tolls three times
      WHS.bell = (f - 1529) * 0.21;
      for (const at of [1536, 1554, 1572]) for (const fxk of knock(f, at, WX(19.5), 9.0, -2.6, 1.6, at % 3, "#ffe08a", 1.4)) F.push(fxk);
      break;
    }
    case 123: { // Sarah at her desk by one lamp at midnight ... "Allegedly." side-eye
      const x = FX(-2.45), z = -4.8;
      props.lanterns.push([FX(-2.15), 0.95, -3.8]); props.pools = [[FX(-2.15), 1.05, -3.8]]; // warm lamplight on her face, the room falls off to blue
      add(SARAH, x, hop(f, 1617, 0.04, 8), z, { f, expr: f >= 1618 ? "smug" : "suspicious", look: f >= 1618 ? 1 : 0, browUp: f >= 1618 ? 0.8 : 0, pose: "hold", pa: 1, headTilt: f < 1612 ? 3 * Math.sin(f * 0.2) : 8, sy: stretch(f, 1617, 0.08) });
      break;
    }
    case 124: { // 1906: the earthquake topples the tall tower; two workers run for it
      WHS.tallTower = 1; WHS.fall = smooth((f - 1662) / 42) * smooth((f - 1662) / 42);
      const run = clamp01((f - 1650) / 60);
      add(CREW.run1, WX(4 + 12 * run), bounce(f, 6, 0.09), 14.5, { f, expr: "scream", look: 1, pose: "up", pa: 1, roll: 0.1 * Math.sin(f * 0.8) });
      add(CREW.run2, WX(2.4 + 12 * run), bounce(f, 6, 0.08, 3), 15.1, { f, expr: "terrified", look: 1, pose: "cheeks", pa: 1, roll: 0.1 * Math.sin(f * 0.8 + 1) });
      if (f >= 1700 && f < 1722) { const u = qt((f - 1700) / 22); F.push(fx(`puffQ${u}`, 300, 300, (p) => fxPuff(p, u), WX(15), 10, -8, 16, 16, { soft: true, glow: 1.0 })); }
      break;
    }
    case 125: { // she keeps building: dusts off, smug, unrolls a new plan
      const x = WX(0.8), z = 25.5;
      add(SARAH, x, hop(f, 1748, 0.08, 9), z, { f, expr: f < 1748 ? "dazed" : "smug", look: 1, sy: stretch(f, 1748, 0.12), roll: f < 1748 ? 0.06 * Math.sin(f * 0.4) : 0, browUp: f >= 1748 ? 0.7 : 0, pose: f < 1748 ? "facepalm" : "hold", pa: 1 });
      if (f >= 1748) F.push(fx("bp", 300, 220, blueprintCard, x + 0.02, 1.0, z + 0.12, 0.62, 0.45));
      break;
    }
    case 126: { // 1922: night, scaffolding, hammering ... a window goes dark ... the hammering stops
      WHS.scaffold = 1; WHS.lit = f >= 1800 ? 0.84 : 1;
      const stop = f >= 1903, hk = (ph: number) => (stop ? 0.62 : 0.5 + 0.5 * Math.sin(f * 0.8 + ph)); // "stops." (1903): the swing freezes mid-air
      add(CREW.nt1, WX(4.2), 3.3 + 0.02 * hk(0), 2.25, { f, expr: stop ? "sad" : "smile_closed", look: 1, prop: ["hammer", hk(0)] });
      add(CREW.nt2, WX(9.0), 6.5 + 0.02 * hk(1.7), 2.25, { f, expr: stop ? "sad" : "whistle", look: -1, prop: ["hammer", hk(1.7)] });
      add(CREW.nt3, WX(12.0), 3.3 + 0.02 * hk(3.1), 2.25, { f, expr: stop ? "sad" : "smile_closed", look: -1, prop: ["hammer", hk(3.1)] });
      props.lanterns.push([WX(5.2), 4.1, 2.75], [WX(10.2), 7.3, 2.75]);
      break;
    }
    case 127: { // "The workers leave so fast": three builders stampede out of the house straight at the camera (dust behind)
      if (f < 1968) {
        const RUN: [Who, number, number][] = [[CREW.lumber, -0.9, 1924], [CREW.roofer, 0.5, 1931], [CREW.glazier, 1.45, 1938]];
        RUN.forEach(([who, x, f0], i) => {
          if (f < f0) return;
          const u = (f - f0) / 30, z = -6.6 + 8.2 * u;
          if (z > 1.3) return;
          add(who, FX(x + 0.25 * Math.sin(u * 9 + i)), 0, z, { f, mode: "march", phase: (f - f0) * 0.14, lift: 95, expr: i === 1 ? "terrified" : "scream", look: 0, pose: "up", pa: 1, tilt: (i % 2 ? -1 : 1) * 4 });
          const q = qt(((f - f0) % 10) / 10);
          F.push(fx(`puffRun${i}${q}`, 300, 300, (p) => fxPuff(p, q), FX(x), 0.15, z - 0.35, 0.8, 0.8, { soft: true }));
        });
      }
      // "nails ...": the half-hammered nail glints
      if (f >= 1974 && f < 1988) { const u = qt((f - 1974) / 14, 7); F.push(fx(`nailGlint${u}`, 400, 400, (p) => fxTwinkle(p, u, 1), FX(-4.42), 1.57, -7.37, 0.12, 0.12, { soft: true, glow: 1.6 })); }
      break;
    }
    case 128: { // the historian squints through a magnifier ... shrugs
      const x = FX(-2.45), z = -4.8;
      add(HISTORIAN, x, hop(f, 2068, 0.06, 9), z, { f, expr: f >= 2068 ? "nervous" : "suspicious", look: 0, pose: f >= 2068 ? "shrug" : "hold", pa: 1, headTilt: f < 2068 ? 3 * Math.sin(f * 0.15) : -6, sy: stretch(f, 2068, 0.1) });
      if (f < 2068) F.push(fx("mag", 160, 220, magnifierCard, x + 0.22, 1.25, z + 0.2, 0.26, 0.36));
      if (f >= 2068) emoteFx({ x, y: 0, z, b: "adult" }, "q", 2068, 28, 1);
      break;
    }
    case 129: { // maybe she just really, really liked building: Sarah happily drawing plans
      const x = FX(-2.45), z = -4.8;
      add(SARAH, x, bounce(f, BEAT, 0.035), z, { f, expr: f % 60 < 40 ? "grin" : "laugh", look: 0, pose: "hold", pa: 1, headTilt: 6 * Math.sin(f * 0.15), sy: 1 + 0.025 * Math.cos((2 * Math.PI * f) / BEAT) });
      for (const at of [2110, 2140, 2165]) if (f >= at && f < at + 14) { const u = qt((f - at) / 14, 7); F.push(fx(`twk${u}`, 400, 400, (p) => fxTwinkle(p, u, 5), x + 0.4, 1.55, z + 0.1, 0.35, 0.35, { soft: true, glow: 1.4 })); }
      break;
    }
    case 130: { // today: tourists lost in the foyer, maps up; one walks into the brick door
      WP.doorB = 1;
      TOURISTS.forEach((who, i) => { const x = FX([-1.4, 0.4, 1.2, -0.4][i]) + 0.4 * Math.sin(f * 0.05 + i * 2), z = [-0.6, -1.4, 0.2, 0.9][i];
        add(who, x, hop(f, 2190 + i * 18, 0.05, 8), z, { f, expr: ["nervous", "suspicious", "dazed", "shock"][i] as "nervous", look: i % 2 ? 1 : -1, pose: "hold", pa: 1, headTilt: 4 * Math.sin(f * 0.2 + i) });
        F.push(fx("map", 220, 170, mapCard, x + 0.02, who.o.build === "kid" ? 0.7 : 0.98, z + 0.14, 0.4, 0.31));
        if ((f - 2190 - i * 18) >= 0) emoteFx({ x, y: 0, z, b: who.o.build === "kid" ? "kid" : "adult" }, "q", 2190 + i * 18, 26, 1); });
      break;
    }
    case 131: { // out in the garden: the tour group heads in, one map upside down
      TOURISTS.forEach((who, i) => { const x = WX(-1.2 + i * 0.75), z = 20 - (f - 2274) * 0.03 - i * 0.4;
        add(who, x, bounce(f, 12, 0.03, i * 3), z, { f, expr: ["grin", "smile", "suspicious", "grin"][i] as "grin", look: 0, pose: "hold", pa: 1 });
        F.push(fx("map", 220, 170, mapCard, x + 0.02, who.o.build === "kid" ? 0.7 : 0.98, z + 0.14, 0.4, 0.31, i === 2 ? { rot: Math.PI } : {})); });
      break;
    }
    case 95: { props.windows = [0, 0, 0, 0]; break; } // WINCHESTER hero exterior (no characters)
    case 97: case 96: { // WINCHESTER LOOK TEST: the hallway; a ghost bonks its head where the stairs meet the ceiling
      const HX = -600;
      props.windows = [0, 0, 0, 0];
      if (s.id === 97) add(SARAH, HX - 0.35, 0, 0.55, { f, expr: "suspicious", look: 1, headTilt: 8 });
      const gx = HX + 3.98, gy = 2.17, gz = -1.3;
      if (s.id === 96) P.push({ key: "ghost|mascot", draw: ghostCard, x: gx, y: gy, z: gz, scale: 0.7, roll: 0.12, size: tier(cam.pos.distanceTo(tmp.set(gx, gy + 0.9, gz)), 60) });
      if (s.id === 96) { emoteFx({ x: gx, y: gy, z: gz, b: "adult", sc: 0.7, roll: 0.12 }, "q", f - 8, 28, -1); }
      if (s.id === 97) P.push({ key: "ghost|mascot", draw: ghostCard, x: HX + 1.75, y: 0.15, z: -2.0, scale: 0.6, roll: -0.1, size: tier(cam.pos.distanceTo(tmp.set(HX + 1.75, 0.9, -2.0)), 60) });
      break;
    }
    case 98: { // PROFILE PICTURE: the brand mascot ghost floating at the gate of the haunted house
      const MX = -300.4, gx = MX, gz = 20, gy = 0.32;
      props.windows = [0, 0, 0, 0];
      P.push({ key: "ghost|mascot", draw: ghostCard, x: gx, y: gy, z: gz, size: tier(cam.pos.distanceTo(tmp.set(gx, gy + 1.2, gz)), 58) });
      F.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: gx, y: 0.05, z: gz, w: 0.8, h: 0.45, flat: true, rot: Math.atan2(cam.pos.x - gx, cam.pos.z - gz) });
      break;
    }
    case 99: { // BANNER: three ghost hunters at the gate of the haunted house (paper cast, emotes), framing the title
      const MX = -300.4;
      props.windows = [0, 0, 0, 0];
      add(ROSA, MX - 2.55, 0, 20.6, { f, expr: "shock", look: 1, headTilt: 5, roll: 0.03 });
      emoteFx({ x: MX - 2.55, y: 0, z: 20.6, b: "adult", tilt: 5, roll: 0.03 }, "bang", f - 7, 18, -1);
      add(MAX, MX - 1.95, 0, 20.2, { f, expr: "grin", look: 1, headTilt: -6 });
      props.lanterns.push([MX - 1.95 + 0.42, 0.95, 20.25]);
      add(GUS, MX + 2.45, 0, 20.6, { f, expr: "terrified", look: -1, roll: -0.04 });
      sweatFx({ x: MX + 2.45, y: 0, z: 20.6, b: "adult", roll: -0.04 }, f - 9, -1);
      emoteFx({ x: MX + 2.45, y: 0, z: 20.6, b: "adult", roll: -0.04 }, "q", f - 8, 28, 1);
      break;
    }
    case 25: { // 1935... nobody ever did: a window lights by itself
      // sputters (2121 dim, 2122 out) then catches on the clink (2123), a warm glow pop + sparkles, then a soft candle flicker
      props.windows = [0, 0, lateWindow(f), 0]; // fx3d.ts also throws its panes on the ground (flickering with it)
      if (f >= 2123 && f < 2141) { const u = qt((f - 2123) / 18, 9); F.push(fx(`wpop${u}`, 400, 400, (p) => fxTwinkle(p, u, 5), -4.35, 1.75, 0, 2.6, 2.6, { soft: true, glow: 1.5 })); }
      break;
    }
  }
  return { places: P, fx: F, props, focus };
};
