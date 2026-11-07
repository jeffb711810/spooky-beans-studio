// V3 CARTOON FRAMEWORK (spooky-beans-studio/style/CARTOON_FRAMEWORK.md): the Rick-style face kit, white heads, ink limbs
// and ink-ball hands for every engine card. Ported from studio/tools/v3_lookdev.py (the look the user approved).
// Units: D = head width in design units; face coordinates are in D, origin at the head centre, y down.
import type { Pen } from "./toon";

type P2 = [number, number];
export const V3_SKIN = "#fefbf5";
export const V3_SH = "#d5d5dc"; // skin x (0.84, 0.85, 0.90): blue-grey, never purple
export let V3_INK = "#231810";
const WHITE = "#ffffff", MOUTH_IN = "#3c1e22", TONGUE = "#e26e74", SWEAT = "#a8d6f5", BLUSH = "rgba(244,152,152,0.55)";

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (v: number[]) => "#" + v.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
export const v3mix = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return toHex(A.map((x, i) => x + (B[i] - x) * t)); };
export const v3mul = (a: string, k: [number, number, number]) => toHex(hex(a).map((x, i) => x * k[i]));
/** clothes: the right side 1.4-2x darker in linear light (framework 4) = about x0.75 in sRGB, a touch cool */
export const v3cloth = (c: string) => v3mul(c, [0.74, 0.74, 0.79]);

const arc = (n: number, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => a0 + ((a1 - a0) * i) / n);
const bez2 = (a: P2, b: P2, c: P2, n = 16): P2[] => arc(n, 0, 1).map((t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]]);
const bez3 = (a: P2, b: P2, c: P2, d: P2, n = 20): P2[] => arc(n, 0, 1).map((t) => {
  const s = 1 - t; return [s * s * s * a[0] + 3 * s * s * t * b[0] + 3 * s * t * t * c[0] + t * t * t * d[0], s * s * s * a[1] + 3 * s * s * t * b[1] + 3 * s * t * t * c[1] + t * t * t * d[1]];
});

/** the head: a matte white ball, lit toward the key, soft blue-grey terminator on the far side */
export const v3HeadFill = (p: Pen, pts: P2[], cx: number, cy: number, R: number, light: number, skin = V3_SKIN, k = 1) => {
  const g = p.g;
  if (k > 1) { // reference cast, MEASURED on his heads: cream-white, brightest centre-right, a soft WARM falloff (~5-6 %)
    // toward the left and bottom edges (the same side as the heavy ink), no grey half-face, no hot spot
    // (painted deeper than it reads: the grade's bright end squeezes it to his ~6 % soft band inside the heavy ink)
    const base = "#fcf8f3", edge = v3mul(base, [0.7, 0.69, 0.72]);
    const [gx, gy] = p.P(cx + 0.22 * R, cy - 0.18 * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1.28 * R);
    gr.addColorStop(0, base); gr.addColorStop(0.62, base); gr.addColorStop(0.8, v3mix(base, edge, 0.3)); gr.addColorStop(0.92, v3mix(base, edge, 0.85)); gr.addColorStop(1, edge);
    p.path(pts, true); g.fillStyle = gr; g.fill();
    return;
  }
  const lx = Math.cos(light), ly = Math.sin(light), sh = v3mul(skin, [0.84, 0.85, 0.9]);
  const [gx, gy] = p.P(cx + lx * 0.36 * R, cy + ly * 0.36 * R);
  const gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1.5 * R);
  gr.addColorStop(0, skin); gr.addColorStop(0.5, skin); gr.addColorStop(0.74, v3mix(skin, sh, 0.55)); gr.addColorStop(0.92, sh); gr.addColorStop(1, v3mul(sh, [0.97, 0.97, 0.98]));
  p.path(pts, true); g.fillStyle = gr; g.fill();
};

/** ink-ball hand with one tiny pale dot (framework 3) */
export const v3Hand = (p: Pen, x: number, y: number, D: number, solid = false) => {
  p.dot(x, y, (solid ? 0.044 : 0.04) * D, V3_INK);
  if (!solid) p.dot(x - 0.0136 * D, y - 0.0136 * D, 0.011 * D, "#ece2d0"); // reference cast: a plain black ball
};
/** reference cast: soft matte form shading across a body (lit side a touch lighter, the far side cooler and darker)
 *  instead of the glossy streak */
export const v3BodyShade = (p: Pen, tcx: number, tcy: number, a: number, b: number, light: number) => {
  const g = p.g, lx = Math.cos(light) >= 0 ? 1 : -1;
  const [x0, y0] = p.P(tcx - lx * a, tcy), [x1, y1] = p.P(tcx + lx * a, tcy);
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, "rgba(255,248,232,0.16)"); gr.addColorStop(0.42, "rgba(255,248,232,0)"); gr.addColorStop(0.62, "rgba(24,28,48,0)"); gr.addColorStop(1, "rgba(24,28,48,0.34)");
  g.fillStyle = gr; const [qx, qy] = p.P(tcx - 1.3 * a, tcy - 1.3 * b), [rx, ry] = p.P(tcx + 1.3 * a, tcy + 1.3 * b);
  g.fillRect(Math.min(qx, rx), Math.min(qy, ry), Math.abs(rx - qx), Math.abs(ry - qy));
};

/** pale streak just inside the LEFT edge of a body, upper middle (framework 4) */
export const v3Streak = (p: Pen, tcx: number, tcy: number, a: number, b: number, D: number) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 16; i++) {
    const y = tcy - 0.62 * b + (0.85 * b * i) / 16, q = (y - tcy) / b;
    pts.push([tcx - a * Math.sqrt(Math.max(0, 1 - q * q)) * 0.93 + 0.045 * D, y]);
  }
  taper(p, pts, 0.024 * D, "rgba(255,250,236,0.85)");
};

/** tapered brush stroke: a filled ribbon, thin at both ends */
const taper = (p: Pen, pts: P2[], w: number, fill: string, ends = 0.25) => {
  const n = pts.length, L: P2[] = [], Rr: P2[] = [];
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const t = i / (n - 1), h = 0.5 * w * (ends + (1 - ends) * Math.pow(Math.sin(Math.PI * t), 0.55));
    L.push([q[0] + nx * h, q[1] + ny * h]); Rr.push([q[0] - nx * h, q[1] - ny * h]);
  });
  p.path([...L, ...Rr.reverse()], true); p.g.fillStyle = fill; p.g.fill();
};

/** the face kit: the same face on everyone; expressions only change the shapes. `e` is the engine's Expr. */
export type V3Opts = { yaw: number; look: number; lid: number; talk?: number; browUp?: number; fore?: number; tongue?: number; glasses?: boolean; stache?: string; bold?: number; small?: number;
  /** reference cast: his face layout; top / bot = the head's extent and brim = the lowest hat / hair edge over the brows (D from the centre) */
  rick?: boolean; top?: number; bot?: number; brim?: number };
export const v3Face = (p: Pen, cx: number, cy: number, D: number, e: string, o: V3Opts) => {
  const yaw = o.yaw, R = 0.5;
  // face-plane (u, v) in D -> design units, wrapped on the head sphere (lon = u / R + yaw)
  const RK = !!o.rick, FS = RK ? 1 : o.small ?? 1;
  // reference cast, MEASURED on two of his faces: lids 0.075 D above the middle of the head, mouth 0.143 D below it,
  // eyes 0.138 D off centre (so a big white chin below the mouth); under a hat brim the eyes drop only as far as they must
  const top = o.top ?? -0.5, bot = o.bot ?? 0.5, EYT = Math.max((top + bot) / 2 - 0.075, o.brim !== undefined ? o.brim + 0.105 : -9);
  const VS = Math.max(0.95, Math.min(1.15, 1.13 * (bot - top))), US = RK ? 1.03 : FS;
  const F = (u0: number, v0: number): P2 => { const u = u0 * US, v = RK ? EYT + (v0 - 0.025) * VS : v0 * FS + (1 - FS) * 0.03, lon = u / R + yaw, lat = v / R; return [cx + D * R * Math.cos(lat) * Math.sin(Math.max(-1.55, Math.min(1.55, lon))), cy + D * R * Math.sin(lat)]; };
  const vis = (u: number) => Math.cos(u / R + yaw) > 0.05; // features past the limb are not drawn
  const BW = o.bold ?? 1; // reference cast: heavier ink on every feature (lids, brows, mouths, outlines)
  const fill = (pts: P2[], col: string, ol = 0) => { const q = pts.map(([u, v]) => F(u, v)); p.path(q, true); p.g.fillStyle = col; p.g.fill(); if (ol) { p.g.lineWidth = ol * BW * D; p.g.strokeStyle = V3_INK; p.g.lineJoin = "round"; p.g.stroke(); } };
  let MK = 1; // mouth lines: his are heavier than his lids
  const line = (pts: P2[], w: number, col = V3_INK) => p.stroke(pts.map(([u, v]) => F(u, v)), w * BW * MK * D, col);
  const brush = (pts: P2[], w: number) => taper(p, pts.map(([u, v]) => F(u, v)), w * BW * D, V3_INK, RK ? 0.55 : 0.25);
  // brows stay under a low hat brim
  const foreV = RK && o.brim !== undefined ? (o.brim + 0.045 - EYT) / VS + 0.025 : o.fore !== undefined ? (o.fore - cy) / D + 0.035 : -9;
  const brow = (bx: number, by: number, ang: number, sag: number, ln = RK ? 0.09 : 0.095, w = RK ? 0.042 : 0.046, wavy = 0) => {
    if (!vis(bx)) return;
    const up = o.browUp && Math.sign(bx) === Math.sign(yaw || 1) ? o.browUp * 0.01 : 0;
    by = Math.max(by - up, foreV);
    const c: P2[] = arc(24, -1, 1).map((t) => { const u = ln * t, v = -sag * (1 - t * t) + wavy * Math.sin(t * Math.PI * 1.5); return [bx + u * Math.cos(ang) - v * Math.sin(ang), by + u * Math.sin(ang) + v * Math.cos(ang)]; });
    brush(c, w);
  };
  const closed = o.lid > 0.55;
  const eyeDot = (ex: number, ey: number, w = 0.09, h = 0.12) => { if (!vis(ex)) return; if (closed) return eyeClosed(ex, ey); fill(arc(40).map((t) => [ex + (w / 2) * Math.cos(t), ey + (h / 2) * Math.sin(t)]), V3_INK); };
  const eyeLid = (ex: number, ey: number, ang = 0, lw = 0.19, dw = RK ? 0.1 : 0.095, dh = RK ? 0.085 : 0.075, lt = RK ? 0.026 : 0.028) => {
    if (!vis(ex)) return;
    const ca = Math.cos(ang), sa = Math.sin(ang), Rt = (u: number, v: number): P2 => [ex + u * ca - v * sa, ey + u * sa + v * ca];
    if (!closed) fill(arc(24, 0, Math.PI).map((t) => Rt((dw / 2) * Math.cos(t), dh * Math.sin(t))), V3_INK);
    line(RK ? bez2(Rt(-lw / 2, 0.006), Rt(0, -0.018), Rt(lw / 2, 0.006), 12) : [Rt(-lw / 2, 0.004), Rt(0, -0.004), Rt(lw / 2, 0.004)], lt);
  };
  const eyeRing = (ex: number, ey: number, r = 0.105, look: P2 = [0, 0], pr = 0.03) => {
    if (!vis(ex)) return; if (closed) return eyeClosed(ex, ey);
    const ring = arc(48).map((t) => [ex + r * Math.cos(t), ey + r * Math.sin(t)] as P2);
    fill(ring, WHITE); line(ring, RK ? 0.026 : 0.03);
    const px = ex + look[0] * r * 0.5, py = ey + look[1] * r * 0.5;
    fill(arc(24).map((t) => [px + pr * Math.cos(t), py + pr * 1.1 * Math.sin(t)]), V3_INK);
  };
  const eyeHappy = (ex: number, ey: number, w = 0.13, h = 0.05) => { if (vis(ex)) line(arc(16, -1, 1).map((u) => [ex + (w / 2) * u, ey + 0.02 - h * (1 - u * u)]), 0.034); };
  function eyeClosed(ex: number, ey: number, w = 0.13, droop = 0) { if (vis(ex)) line([[ex - w / 2, ey], [ex + w / 2, ey + droop]], 0.03); }
  const teeth = (w: number, h: number, y0: number, lop = 0, shape: "crescent" | "D" | "box" = "crescent", n = 6, grid = false, interior = false) => {
    const us = arc(28, -1, 1);
    let top: P2[], bot: P2[];
    if (shape === "crescent") { top = us.map((u) => [(w / 2) * u, y0 + 0.02 * (1 - u * u) - lop * u - 0.015 * u * u]); bot = top.map(([x, y]) => [x, y + h * Math.pow(Math.max(0, 1 - ((2 * x) / w) ** 2), 0.8)]); }
    else if (shape === "D") { top = us.map((u) => [(w / 2) * u, y0 - lop * u]); bot = top.map(([x, y]) => [x, y + h * Math.sqrt(Math.max(0, 1 - ((2 * x) / w) ** 2))]); }
    else { top = us.map((u) => [(w / 2) * u, y0]); bot = us.map((u) => [(w / 2) * u, y0 + h]); }
    const shape2 = [...top, ...bot.reverse()], q = shape2.map(([u, v]) => F(u, v));
    const g = p.g;
    g.save(); p.path(q, true); g.clip();
    if (interior) {
      p.path(q, true); g.fillStyle = MOUTH_IN; g.fill();
      p.path([...top, ...top.map(([x, y]) => [x, y + h * 0.3] as P2).reverse()].map(([u, v]) => F(u, v)), true); g.fillStyle = WHITE; g.fill();
      p.path(arc(24).map((t) => F(w * 0.22 * Math.cos(t), y0 + h * 0.86 + h * 0.24 * Math.sin(t))), true); g.fillStyle = TONGUE; g.fill();
    } else {
      p.path(q, true); g.fillStyle = WHITE; g.fill();
      for (let i = 1; i < n; i++) { const x = -w / 2 + (w * i) / n; line([[x, y0 - 0.06], [x, y0 + h + 0.06]], 0.012); }
      if (grid) line([[-w / 2, y0 + h / 2], [w / 2, y0 + h / 2]], 0.012);
    }
    g.restore();
    p.path(q, true); g.lineWidth = 0.024 * D; g.strokeStyle = V3_INK; g.lineJoin = "round"; g.stroke();
  };
  const openMouth = (w: number, h: number, y0: number, teethBand = false) => { // talking / shouting: dark open mouth
    const q: P2[] = [...arc(20, -1, 1).map((u) => [(w / 2) * u, y0 + 0.006 * (1 - u * u)] as P2), ...arc(20, 0, Math.PI).map((t) => [(w / 2) * Math.cos(t), y0 + h * Math.sin(t)] as P2)];
    fill(q, MOUTH_IN, 0.022);
    if (teethBand) { const g = p.g; g.save(); p.path(q.map(([u, v]) => F(u, v)), true); g.clip(); fill([[-w / 2, y0 - 0.01], [w / 2, y0 - 0.01], [w / 2, y0 + h * 0.26], [-w / 2, y0 + h * 0.26]], WHITE); g.restore(); }
  };
  const lozenge = (mx: number, my: number, w: number, h: number) => fill([...arc(16, -1, 1).map((u) => [mx + (w / 2) * u, my - (h / 2) * Math.pow(1 - u * u, 0.45)] as P2), ...arc(16, 1, -1).map((u) => [mx + (w / 2) * u, my + (h / 2) * Math.pow(1 - u * u, 0.45)] as P2)], V3_INK);
  const shoutMouth = (w: number, h: number, y0: number) => { // HIS angry shout: arched top, corners pulled DOWN, upper teeth (never a smile)
    const top: P2[] = arc(20, -1, 1).map((u) => [(w / 2) * u, y0 + h * 0.15 - h * 0.6 * Math.sqrt(Math.max(0, 1 - u * u))] as P2);
    const bot: P2[] = arc(20, 1, -1).map((u) => [(w / 2) * u * 0.9, y0 + h * 0.42 + h * 0.06 * (1 - u * u)] as P2);
    const q = [...top, ...bot]; fill(q, MOUTH_IN, 0.024);
    const g = p.g; g.save(); p.path(q.map(([u, v]) => F(u, v)), true); g.clip(); fill([[-w / 2, y0 - h], [w / 2, y0 - h], [w / 2, y0 - h * 0.18], [-w / 2, y0 - h * 0.18]], WHITE); g.restore();
  };
  const sweat: [number, number, number][] = [];
  const vein = (vx: number, vy: number, s = 0.075) => { for (const a of [-0.5, 0.6, 2.1]) line(bez2([vx, vy], [vx + 0.55 * s * Math.cos(a + 0.6), vy - 0.55 * s * Math.sin(a + 0.6)], [vx + s * Math.cos(a), vy - s * Math.sin(a)], 10), 0.02); };
  const blush = (ey: number) => { if (RK || (o.small ?? 1) < 1) return; for (const s of [-1, 1]) if (vis(s * 0.21)) fill(arc(24).map((t) => [s * 0.225 + 0.065 * Math.cos(t), ey + 0.105 + 0.035 * Math.sin(t)]), BLUSH); };

  const EX = 0.134, EY = 0.045, S = [-1, 1] as const, lk = Math.max(-1, Math.min(1, o.look)) * 0.022;
  const talk = o.talk ?? 0, talking = talk > 0.12;
  let mouthDone = false;
  const M = (fn: () => void) => { if (!talking) { MK = RK ? 1.4 : 1; fn(); MK = 1; } };
  switch (e) {
    case "deadpan": // HIS signature face: a heavy lid over a big half-round pupil, one brow cocked, a flat dark lozenge mouth
      for (const s of S) eyeLid(s * EX + lk, EY - 0.02, 0, 0.19, 0.1, 0.1);
      brow(-0.142, EY - 0.165, -0.02, 0.012); brow(0.142, EY - 0.215, 0.06, 0.025);
      M(() => lozenge(0, 0.232, 0.27, 0.042));
      break;
    case "alert": // his guard: wide white eyes, small pupils, brows up, a small round mouth
      for (const s of S) { eyeRing(s * 0.127, EY - 0.01, 0.1, [o.look, 0], 0.028); brow(s * 0.135, EY - 0.17, s * 0.12, 0.025); }
      M(() => fill(arc(24).map((t) => [0.026 * Math.cos(t), 0.235 + 0.02 * Math.sin(t)] as P2), V3_INK));
      break;
    case "excited": // his inmate: wide white eyes and a crescent of teeth
      for (const s of S) { eyeRing(s * 0.127, EY - 0.01, 0.105, [o.look, 0.2], 0.03); brow(s * 0.14, EY - 0.175, s * 0.1, 0.03); }
      M(() => teeth(0.36, 0.1, 0.19, 0, "crescent", 7));
      break;
    case "smug": case "suspicious":
      for (const s of S) eyeLid(s * EX + lk, EY - 0.02, 0.06 * s);
      brow(-0.142, EY - 0.13, -0.05, 0.01); brow(0.142, EY - 0.19, 0.16, 0.03);
      M(() => line(bez3([-0.07, 0.235], [-0.01, 0.245], [0.06, 0.24], [0.1, 0.205]), 0.03));
      break;
    case "evil":
      for (const s of S) { eyeLid(s * EX + lk, EY - 0.005, -s * 0.3, 0.19, 0.085, 0.06); brow(s * 0.142, EY - 0.115, -s * 0.42, 0); }
      M(() => teeth(0.38, 0.085, 0.2, 0.03, "crescent", 7));
      break;
    case "grin": case "relief_open":
      for (const s of S) { if (RK && e === "grin") eyeDot(s * EX + lk, EY, 0.085, 0.12); else eyeHappy(s * EX, EY - 0.01); brow(s * 0.142, EY - 0.165, s * 0.1, 0.03); }
      M(() => teeth(0.34, 0.12, 0.19, 0, "D", 6));
      break;
    case "nervous":
      for (const s of S) { eyeDot(s * EX + lk, EY - 0.01, 0.085, 0.125); brow(s * 0.146, EY - 0.17, s * 0.34, 0.012); }
      M(() => RK ? teeth(0.2, 0.075, 0.205, 0, "box", 5, true) : teeth(0.4, 0.14, 0.19, 0, "D", 6));
      sweat.push([-40, 0.66, 0.075], [215, 0.64, 0.06]);
      break;
    case "stern":
      for (const s of S) { eyeRing(s * 0.127, EY, 0.095, [o.look, 0], 0.026); brow(s * 0.137, EY - 0.135, -s * 0.36, 0); }
      M(() => line([[-0.03, 0.235], [0.03, 0.235]], 0.03));
      break;
    case "angry": case "pained":
      for (const s of S) { if (e === "pained") eyeClosed(s * EX, EY, 0.13, -0.02 * s); else eyeDot(s * EX + lk, EY, 0.085, 0.1); brow(s * 0.137, EY - 0.12, -s * 0.42, 0); }
      M(() => teeth(0.22, 0.09, 0.205, 0, "box", 5, true));
      vein(-0.3, -0.12);
      break;
    case "shock":
      for (const s of S) { eyeRing(s * 0.127, EY - 0.01, 0.105, [o.look, 0]); brow(s * 0.132, EY - 0.2, s * 0.1, 0.035, 0.08); }
      M(() => fill(arc(30).map((t) => [0.042 * Math.cos(t), 0.25 + 0.055 * Math.sin(t)]), V3_INK));
      break;
    case "scream": case "terrified": case "yell":
      for (const s of S) eyeRing(s * 0.129, EY - 0.01, 0.112, [o.look, 0], 0.026);
      brow(-0.142, EY - 0.2, 0.18, 0.02, 0.095, 0.046, 0.012); brow(0.142, EY - 0.215, -0.1, 0.03, 0.095, 0.046, 0.016);
      if (e === "terrified") { M(() => teeth(0.15, 0.085, 0.215, 0, "box", 5, true)); for (const s of S) line(bez2([s * 0.09, 0.3], [s * 0.115, 0.33], [s * 0.08, 0.36], 8), 0.016); }
      else { M(() => openMouth(0.2, 0.15, 0.2, true)); if (!talking) mouthDone = true; } // talking: the shout's own mouth shapes below
      vein(-0.3, -0.12); sweat.push([-35, 0.68, 0.075], [-5, 0.72, 0.06], [195, 0.68, 0.07], [160, 0.7, 0.055]);
      break;
    case "laugh":
      for (const s of S) { eyeHappy(s * EX, EY - 0.01); brow(s * 0.142, EY - 0.16, s * 0.12, 0.03); }
      M(() => teeth(0.3, 0.16, 0.185, 0, "D", 6, false, true)); blush(EY);
      break;
    case "worried": case "sad": case "cry":
      for (const s of S) { if (e === "cry") eyeClosed(s * EX, EY, 0.13, 0.012 * s); else eyeDot(s * EX + lk, EY); brow(s * 0.146, EY - 0.165, s * 0.34, 0.015); }
      M(() => e === "worried" ? line([[-0.05, 0.24], [-0.017, 0.23], [0.017, 0.24], [0.05, 0.23]], 0.028) : line(bez2([-0.06, 0.25], [0, 0.215], [0.06, 0.25], 12), 0.03));
      if (e !== "worried") for (const s of S) if (vis(s * EX)) { // tears: a drop under each eye, tip up
        const [tx, ty] = F(s * (EX + 0.01), EY + 0.15), r = 0.032 * D;
        p.path([...arc(16, 0, Math.PI).map((t) => [tx + r * Math.cos(t), ty + r * Math.sin(t)] as P2), [tx, ty - 2.2 * r]], true);
        p.g.fillStyle = SWEAT; p.g.fill(); p.g.lineWidth = 0.014 * D; p.g.strokeStyle = V3_INK; p.g.stroke();
      }
      break;
    case "dazed":
      for (const s of S) { eyeClosed(s * EX, EY, 0.13, 0.012 * s); brow(s * 0.142, EY - 0.13, s * 0.28, 0.01); }
      M(() => line([[-0.05, 0.24], [-0.017, 0.23], [0.017, 0.24], [0.05, 0.23]], 0.026));
      break;
    case "whistle":
      for (const s of S) { eyeLid(s * EX + lk, EY - 0.02); brow(s * 0.142, EY - 0.17, 0, 0.02); }
      M(() => { const ring = arc(24).map((t) => [0.03 * Math.cos(t), 0.235 + 0.035 * Math.sin(t)] as P2); fill(ring, MOUTH_IN, 0.024); });
      break;
    case "relief": case "smile_closed":
      for (const s of S) { eyeHappy(s * EX, EY - 0.01); brow(s * 0.142, EY - 0.165, s * 0.08, 0.025); }
      M(() => line(bez2([-0.08, 0.215], [0, 0.265], [0.08, 0.215], 14), 0.03));
      break;
    case "smile": case "lick":
      for (const s of S) { eyeDot(s * EX + lk, EY); brow(s * 0.142, EY - 0.165, 0, 0.02); }
      M(() => line(bez2([-0.075, 0.22], [0, 0.26], [0.075, 0.22], 14), 0.03));
      break;
    default: // neutral
      for (const s of S) { eyeDot(s * EX + lk, EY); brow(s * 0.142, EY - 0.165, 0, 0.02); }
      M(() => RK ? lozenge(0, 0.235, 0.12, 0.03) : line(bez2([-0.06, 0.225], [0, 0.25], [0.06, 0.225], 14), 0.03));
  }
  // talking: the mouth changes on twos (the stage samples the voice envelope); 3 sizes, dark inside
  if (talking && !mouthDone && RK) { // HIS talking mouths (studied frame by frame): small dark shapes swapped on twos; only a shout opens wide with teeth
    const loud = e === "scream" || e === "yell" || e === "angry" || e === "evil" || e === "terrified";
    if (e === "angry" || e === "evil" || e === "yell") { if (talk < 0.35) shoutMouth(0.15, 0.085, 0.225); else if (talk < 0.7) shoutMouth(0.2, 0.115, 0.225); else shoutMouth(0.25, 0.145, 0.225); }
    else if (loud) { if (talk < 0.35) openMouth(0.12, 0.07, 0.215, true); else if (talk < 0.7) openMouth(0.17, 0.11, 0.205, true); else openMouth(0.22, 0.15, 0.2, true); }
    else if (talk < 0.35) openMouth(0.075, 0.035, 0.225);
    else if (talk < 0.6) openMouth(0.1, 0.055, 0.22);
    else if (talk < 0.85) openMouth(0.13, 0.08, 0.215, true);
    else openMouth(0.19, 0.12, 0.205, true);
  } else if (talking && !mouthDone) {
    if (talk < 0.45) openMouth(0.13, 0.055, 0.21);
    else if (talk < 0.8) openMouth(0.17, 0.09, 0.205, true);
    else openMouth(0.21, 0.13, 0.2, true);
  }
  // BUSBY (reference cast): round ink-rimmed glasses and a moustache are allowed again, drawn on the same face sphere
  if (o.glasses) {
    for (const sx of S) { const ex = sx * EX; if (!vis(ex)) continue; line(arc(40).map((t) => [ex + 0.092 * Math.cos(t), EY - 0.008 + 0.084 * Math.sin(t)] as P2), 0.024); }
    if (vis(0)) line([[-EX + 0.09, EY - 0.03], [0, EY - 0.045], [EX - 0.09, EY - 0.03]], 0.02);
  }
  if (o.stache) for (const sx of S) { const c = sx * 0.062; if (!vis(c)) continue;
    fill(arc(28).map((t) => { const u = 0.072 * Math.cos(t), v = 0.028 * Math.sin(t) + (Math.cos(t) * sx > 0.6 ? -0.012 : 0); const a = -sx * 0.22; return [c + u * Math.cos(a) - v * Math.sin(a), 0.148 + u * Math.sin(a) + v * Math.cos(a)] as P2; }), o.stache, 0.016); }
  // sweat / tears fly off the head (drawn last: over hats)
  for (const [phi, r, sz] of sweat) {
    const a = (phi * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), x0 = r * ca, y0 = r * sa;
    const loc: P2[] = [...arc(16, -Math.PI / 2, Math.PI / 2).map((t) => [0.5 * Math.cos(t), 0.5 * Math.sin(t)] as P2), [-1.5, 0]];
    const q = loc.map(([u, v]) => [cx + D * (x0 + sz * (u * ca - v * sa)), cy + D * (y0 + sz * (u * sa + v * ca))] as P2);
    p.path(q, true); p.g.fillStyle = SWEAT; p.g.fill(); p.g.lineWidth = 0.016 * D; p.g.strokeStyle = V3_INK; p.g.stroke();
  }
};

// =====================================================================================================================
// HATS, HAIR AND CLOTHES (v3_lookdev.py cast: carpenter flat cap, foreman top hat, tourist ball cap, Sarah's hood):
// every hat has a 3D look (elliptical base / top seen slightly from above, a gloss stroke); all in head-D units.
// =====================================================================================================================
import type { Outfit } from "./toon";
type X2 = (x: number, y: number) => P2;
const lin = (n: number, a: number, b: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
/** a filled, shaded, outlined piece of cloth (gradient light-left, x0.75 on the far side) */
/** outline weight for hats / wear (reference cast, measured: his outlines are ~0.55 of ours); set per card by toon.ts */
let INKK = 1;
export const v3InkScale = (k: number) => { INKK = k; };
export const v3InkColor = (c: string) => { V3_INK = c; };
const cloth = (p: Pen, pts: P2[], col: string, light: number, D: number, ol = 0.048, gl?: [P2, P2], ga = 0.2) => {
  p.gradFill(pts, col, v3cloth(col), light, 0.08);
  if (gl && INKK > 0.9) p.clip(pts, () => p.stroke([gl[0], gl[1]], 0.05 * D, `rgba(255,255,255,${ga})`));
  if (ol) p.poly(pts, null, ol * INKK * D);
};
const flat = (p: Pen, pts: P2[], col: string, D: number, ol = 0) => { p.path(pts, true); p.g.fillStyle = col; p.g.fill(); if (ol) p.poly(pts, null, ol * INKK * D); };
const ellX = (X: X2, cx: number, cy: number, rx: number, ry: number, n = 40) => lin(n, 0, Math.PI * 2).slice(0, -1).map((t) => X(cx + rx * Math.cos(t), cy + ry * Math.sin(t)));
const B2 = (X: X2, a: P2, b: P2, c: P2, n = 16) => bez2(a, b, c, n).map(([x, y]) => X(x, y));
const B3 = (X: X2, a: P2, b: P2, c: P2, d: P2, n = 24) => bez3(a, b, c, d, n).map(([x, y]) => X(x, y));
const lighter = (c: string, k: number) => v3mul(c, [k, k, k]);

/** side hair under a hat: a ragged band inside the head outline on the back side (front view: small sideburns) */
const sideHair = (p: Pen, cx: number, hc: number, D: number, col: string, f: number) => {
  if (f === 0) return;
  const sides = [[f, 148, 236]];
  p.clip(lin(40, 0, Math.PI * 2).map((t) => [cx + 0.475 * D * Math.cos(t), hc + 0.475 * D * Math.sin(t)] as P2), () => {
    for (const [s, a0, a1] of sides) {
      const X: X2 = (x, y) => [cx + x * D * -s, hc + y * D]; // the back side is opposite the facing side
      const out = lin(24, a0, a1).map((a) => X(0.5 * Math.cos((a * Math.PI) / 180), 0.5 * Math.sin((a * Math.PI) / 180)));
      const inn = lin(8, a1, a0).map((a, i) => { const r = i % 2 ? 0.42 : 0.34; return X(r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)); });
      flat(p, [...out, ...inn], col, D);
      for (let i = 1; i <= 3; i++) { const a = ((a0 + ((a1 - a0) * i) / 4) * Math.PI) / 180; p.stroke([X(0.47 * Math.cos(a), 0.47 * Math.sin(a)), X(0.4 * Math.cos(a + 0.06), 0.4 * Math.sin(a + 0.06))], 0.016 * D, v3mul(col, [0.6, 0.6, 0.6])); }
    }
  });
};

/** HAIR as the "hat" (Rick's orange-haired guy): a hair cap over the top of the head with a fringe edge */
const FRINGE: Record<string, P2[]> = {
  parted: [[0.53, 0.02], [0.4, -0.14], [0.2, -0.22], [0.02, -0.15], [-0.2, -0.21], [-0.4, -0.12], [-0.53, 0.02]],
  tousled: [[0.53, -0.02], [0.4, -0.2], [0.29, -0.13], [0.17, -0.24], [0.05, -0.15], [-0.07, -0.25], [-0.19, -0.16], [-0.31, -0.24], [-0.43, -0.12], [-0.53, -0.02]],
  center: [[0.53, 0.16], [0.45, -0.02], [0.28, -0.19], [0.03, -0.28], [-0.03, -0.28], [-0.28, -0.19], [-0.45, -0.02], [-0.53, 0.16]],
};
const hairCap = (p: Pen, o: Outfit, cx: number, hc: number, D: number, f: number, light: number) => {
  const col = o.hair ?? "#5a3b2a", s = f || 1, up = (y: number) => (o.rick ? HAIR_UP * Math.max(0, Math.min(1, (y + 0.5) / 0.3)) : 0);
  const X: X2 = (x, y) => [cx + x * D * s, hc + (y - up(y)) * D]; // reference cast: the fringe sits higher (more face shows)
  const kind = o.hairdo === "center" || o.hairdo === "braids" ? "center" : o.hairdo === "tousled" ? "tousled" : "parted";
  if (o.hairdo === "braids") for (const k of [-1, 1]) for (let i = 0; i < 3; i++) cloth(p, ellX(X, k * 0.47, 0.22 + 0.17 * i, 0.075, 0.095), col, light, D, 0.03);
  const top = lin(30, Math.PI + 0.12, 2 * Math.PI - 0.12).map((t) => X(0.535 * Math.cos(t), 0.535 * Math.sin(t)));
  const fr = FRINGE[kind].map(([x, y]) => X(x, y));
  cloth(p, [...top, ...fr], col, light, D, 0.044, [X(-0.3, -0.36), X(0.05, -0.47)], 0.22);
  const dk = v3mul(col, [0.62, 0.62, 0.62]);
  if (kind === "center") p.stroke([X(0, -0.5), X(0, -0.3)], 0.018 * D, dk);
  else if (kind === "parted") p.stroke(B2(X, [0.18, -0.5], [0.2, -0.36], [0.12, -0.22], 10), 0.018 * D, dk);
  else { cloth(p, [X(-0.04, -0.5), X(0.02, -0.66), X(0.1, -0.5)], col, light, D, 0.03); cloth(p, [X(0.08, -0.51), X(0.2, -0.62), X(0.2, -0.48)], col, light, D, 0.03); }
  for (const [a, b, c] of [[[-0.35, -0.42], [-0.3, -0.3], [-0.22, -0.2]], [[0.35, -0.4], [0.33, -0.28], [0.3, -0.17]]] as [P2, P2, P2][]) p.stroke(B2(X, a, b, c, 8), 0.014 * D, dk);
};

/** behind the head: Sarah's hood + veil, bonnets */
export const v3HatBehind = (p: Pen, o: Outfit, cx: number, hc: number, D: number, f: number, light: number): boolean => {
  if (o.hat !== "hood" && o.hat !== "bonnet") return false;
  const col = o.bonnet ?? (o.hat === "hood" ? "#3a3734" : "#cfae6e");
  if (o.hat === "hood") for (const s of f === 0 ? [-1, 1] : [-f]) { // the veil hangs down the back
    const X: X2 = (x, y) => [cx + x * D * s, hc + y * D];
    const veil = [...B3(X, [0.16, -0.4], [0.66, -0.3], [0.8, 0.6], [0.58, 1.1], 30), X(0.3, 1.0), X(0.4, 0.2)];
    p.path(veil, true); p.g.fillStyle = v3mul(col, [0.8, 0.8, 0.83]); p.g.fill(); p.poly(veil, null, 0.048 * D);
  }
  const X: X2 = (x, y) => [cx + x * D * (f || 1), hc + y * D];
  cloth(p, ellX(X, f === 0 ? 0 : 0.05, -0.07, 0.61, 0.6, 48), col, light, D);
  return true;
};

/** the hat (and the hair under it), drawn over the head */
/** reference cast hats: [lowest edge as drawn, y scale, x scale]; the lowest edge moves up to HAT_LOW (measured on his
 *  peaked caps: the band sits ~0.3 D above the middle of the head, the cap ~0.42 D tall and ~1.1 D wide) */
const HAT_RK: Record<string, [number, number, number]> = { cap: [-0.125, 0.62, 0.82], ballcap: [-0.095, 0.62, 0.82], peaked: [-0.085, 0.62, 0.8],
  tricorn: [-0.17, 0.66, 0.82], tophat: [-0.11, 0.72, 0.82], brim: [-0.11, 0.66, 0.82], straw: [-0.08, 0.66, 0.82], nightcap: [-0.24, 0.7, 0.85] };
const HAT_LOW = -0.3, HAIR_UP = 0.07;
/** the lowest hat / hair edge over the brows (D from the head centre), for the face layout; undefined = nothing there */
export const v3Brim = (o: Outfit): number | undefined => {
  if (o.hat && HAT_RK[o.hat]) return HAT_LOW;
  if (o.hat === "flight") return -0.28;
  if (o.hat === "hair") { const fr = FRINGE[o.hairdo === "center" || o.hairdo === "braids" ? "center" : o.hairdo === "tousled" ? "tousled" : "parted"].filter(([x]) => Math.abs(x) < 0.24); return Math.max(...fr.map(([, y]) => y)) - HAIR_UP; }
  return undefined;
};
export const v3Hat = (p: Pen, o: Outfit, cx: number, hc: number, D: number, f: number, light: number): boolean => {
  const ht = o.rick && o.hat ? HAT_RK[o.hat] : undefined;
  const s = f || 1, X: X2 = ht ? (x, y) => [cx + x * ht[2] * D * s, hc + (HAT_LOW + (y - ht[0]) * ht[1]) * D] : (x, y) => [cx + x * D * s, hc + y * D], col = o.cap ?? "#806e5a", hair = o.hair ?? "#3a281c";
  const front = f === 0;
  const visorFront = (drop: number, w: number, c: string) => cloth(p, [...B2(X, [-w, -0.2], [0, -0.16], [w, -0.2], 14), ...B2(X, [w + 0.02, -0.19], [0, drop], [-w - 0.02, -0.19], 14)], c, light, D);
  switch (o.hat) {
    case "hair": hairCap(p, o, cx, hc, D, f, light); return true;
    case "hood": case "bonnet": {
      const c2 = o.bonnet ?? (o.hat === "hood" ? "#3a3734" : "#cfae6e"), rib = o.ribbon ?? v3mul(c2, [0.82, 0.82, 0.82]);
      if (o.hat === "bonnet" && o.hair) sideHair(p, cx, hc, D, o.hair, f);
      cloth(p, [...B3(X, [-0.5, -0.16], [-0.46, -0.68], [0.5, -0.7], [0.53, -0.14], 30), ...B3(X, [0.42, -0.22], [0.36, -0.54], [-0.36, -0.52], [-0.4, -0.12], 30)], c2, light, D);
      for (const k of [-1, 1]) flat(p, ellX(X, k * 0.075, 0.5, 0.075, 0.045, 24), rib, D, 0.022);
      flat(p, ellX(X, 0, 0.5, 0.03, 0.03, 16), v3mul(rib, [0.85, 0.85, 0.85]), D);
      return true;
    }
    case "cap": { // flat cap
      sideHair(p, cx, hc, D, hair, f);
      const base = lin(30, 0.56, -0.55).map((x) => X(x, -0.2 + 0.075 * Math.sqrt(Math.max(0, 1 - (x / 0.55) ** 2))));
      const crown = [...B3(X, [-0.55, -0.18], [-0.66, -0.8], [0.58, -0.84], [0.56, -0.22], 40), ...base];
      cloth(p, crown, col, light, D, 0.048, [X(-0.3, -0.66), X(0.05, -0.74)], 0.18);
      p.clip(crown, () => p.stroke(B2(X, [-0.4, -0.26], [-0.05, -0.8], [0.42, -0.4], 20), 0.016 * D, v3mul(col, [0.62, 0.62, 0.62])));
      flat(p, ellX(X, -0.02, -0.655, 0.05, 0.028, 20), v3mul(col, [0.75, 0.75, 0.75]), D, 0.02);
      if (front) visorFront(-0.05, 0.44, v3mul(col, [0.86, 0.86, 0.86]));
      else cloth(p, [...B3(X, [0.22, -0.17], [0.6, -0.3], [0.95, -0.24], [0.92, -0.15], 24), ...B2(X, [0.92, -0.15], [0.6, -0.1], [0.24, -0.08], 18)], v3mul(col, [0.86, 0.86, 0.86]), light, D);
      return true;
    }
    case "ballcap": {
      sideHair(p, cx, hc, D, hair, f);
      const base = lin(30, 0.52, -0.53).map((x) => X(x, -0.17 + 0.07 * Math.sqrt(Math.max(0, 1 - (x / 0.52) ** 2))));
      const crown = [...B3(X, [-0.53, -0.15], [-0.58, -0.84], [0.52, -0.86], [0.52, -0.17], 40), ...base];
      cloth(p, crown, col, light, D, 0.048, [X(-0.32, -0.6), X(-0.08, -0.76)], 0.2);
      p.clip(crown, () => { for (const g of [-0.18, 0.2]) p.stroke(B2(X, [g, -0.12], [g * 0.6, -0.5], [0, -0.67], 16), 0.016 * D, v3mul(col, [0.6, 0.6, 0.6])); });
      flat(p, ellX(X, 0, -0.665, 0.05, 0.028, 20), v3mul(col, [0.8, 0.8, 0.8]), D, 0.02);
      if (front) visorFront(0.0, 0.42, v3mul(col, [0.88, 0.88, 0.88]));
      else cloth(p, [...B3(X, [0.25, -0.18], [0.62, -0.33], [1.02, -0.26], [1.0, -0.15], 24), ...B2(X, [1.0, -0.15], [0.64, -0.08], [0.28, -0.07], 18)], v3mul(col, [0.88, 0.88, 0.88]), light, D);
      return true;
    }
    case "tricorn": { // 1702: black felt, three brims turned up, a gold galloon on the edge
      sideHair(p, cx, hc, D, hair, f);
      const c = o.cap ?? "#2a2420";
      // (user: "random cowboy hats"): a TRUE tricorn from the front - a broad inverted triangle, one corner pointing
      // forward and down, the top edge high and nearly straight (never dipping in the middle like a cowboy brim)
      cloth(p, [...B3(X, [-0.36, -0.34], [-0.4, -0.86], [0.4, -0.86], [0.36, -0.34], 30), X(0.36, -0.32), X(-0.36, -0.32)], c, light, D, 0.048, [X(-0.2, -0.68), X(0.0, -0.76)], 0.16);
      const brim = [...B2(X, [-0.76, -0.58], [0, -0.72], [0.76, -0.58], 16), ...B2(X, [0.76, -0.58], [0.32, -0.36], [0, -0.17], 12), ...B2(X, [0, -0.17], [-0.32, -0.36], [-0.76, -0.58], 12)];
      cloth(p, brim, lighter(c, 1.12), light, D);
      p.stroke([...B2(X, [-0.7, -0.555], [-0.3, -0.33], [0, -0.215], 12), ...B2(X, [0, -0.215], [0.3, -0.33], [0.7, -0.555], 12)], 0.026 * D, o.ribbon ?? "#d9a83a");
      p.stroke(B2(X, [-0.7, -0.6], [0, -0.7], [0.7, -0.6], 16), 0.02 * D, o.ribbon ?? "#d9a83a");
      return true;
    }
    case "nightcap": { // a long soft cone flopping over to one side, a pompom on the tip
      sideHair(p, cx, hc, D, hair, f);
      const c = o.cap ?? "#e0b04a";
      cloth(p, [...B2(X, [-0.5, -0.24], [-0.56, -0.8], [0.02, -0.98], 16), ...B2(X, [0.02, -0.98], [0.5, -1.02], [0.82, -0.5], 16), ...B2(X, [0.74, -0.48], [0.44, -0.78], [0.48, -0.26], 14)], c, light, D, 0.048, [X(-0.3, -0.6), X(0.0, -0.86)], 0.18);
      cloth(p, [...B2(X, [-0.54, -0.18], [0, -0.3], [0.54, -0.18], 16), ...B2(X, [0.54, -0.3], [0, -0.42], [-0.54, -0.3], 16)], o.ribbon ?? "#f4efe2", light, D);
      flat(p, ellX(X, 0.84, -0.46, 0.1, 0.1, 28), o.ribbon ?? "#f4efe2", D, 0.04);
      return true;
    }
    case "peaked": { // guard / pilot / constable: crown wider than the band, a badge, a black peak
      sideHair(p, cx, hc, D, hair, f);
      const c = o.cap ?? "#24304a";
      cloth(p, [...B3(X, [-0.5, -0.3], [-0.74, -0.62], [-0.6, -0.8], [0, -0.82], 20), ...B3(X, [0, -0.82], [0.6, -0.8], [0.74, -0.62], [0.5, -0.3], 20)], c, light, D, 0.048, [X(-0.4, -0.64), X(-0.1, -0.74)], 0.16);
      cloth(p, [X(-0.5, -0.36), X(0.5, -0.36), X(0.52, -0.2), X(-0.52, -0.2)], o.ribbon ?? v3mul(c, [0.7, 0.7, 0.7]), light, D);
      flat(p, ellX(X, 0, -0.5, 0.07, 0.085, 24), o.buttons ?? "#e0b04a", D, 0.03);
      if (front) visorFront(0.02, 0.46, "#1c1a1a"); else cloth(p, [...B3(X, [0.3, -0.22], [0.6, -0.3], [0.9, -0.22], [0.86, -0.14], 20), ...B2(X, [0.86, -0.14], [0.6, -0.12], [0.3, -0.12], 14)], "#1c1a1a", light, D);
      return true;
    }
    case "flight": { // WWII leather flying helmet: tight dome, ear flaps, goggles pushed up on the forehead
      const c = o.cap ?? "#7a4a2a";
      cloth(p, [...B3(X, [-0.54, 0.05], [-0.62, -0.86], [0.62, -0.86], [0.54, 0.05], 34), X(0.4, 0.06), ...B2(X, [0.42, -0.2], [0, -0.36], [-0.42, -0.2], 14), X(-0.4, 0.06)], c, light, D, 0.048, [X(-0.3, -0.62), X(0.0, -0.74)], 0.2);
      for (const sx of front ? [-1, 1] : [-1]) cloth(p, ellX(X, sx * 0.5, 0.08, 0.11, 0.17, 24), v3mul(c, [0.86, 0.86, 0.86]), light, D);
      p.stroke(B2(X, [-0.56, -0.36], [0, -0.48], [0.56, -0.36], 18), 0.04 * D, "#3a2a1c");
      for (const sx of [-1, 1]) { flat(p, ellX(X, sx * 0.17, -0.44, 0.13, 0.1, 28), "#a8b8c0", D, 0.04); flat(p, ellX(X, sx * 0.17 - 0.03, -0.47, 0.04, 0.03, 12), "#eef6f8", D); }
      return true;
    }
    case "tophat": case "brim": case "straw": {
      sideHair(p, cx, hc, D, o.hat === "tophat" ? o.hair ?? "#969490" : hair, f);
      const c = o.hat === "straw" ? o.cap ?? "#d8bb72" : o.hat === "tophat" ? o.cap ?? "#363230" : col;
      const by = o.hat === "straw" ? -0.23 : -0.25, top = o.hat === "tophat" ? -1.06 : o.hat === "straw" ? -0.58 : -0.8;
      const bw = o.hat === "straw" ? 0.74 : o.hat === "tophat" ? 0.62 : 0.64, cw = o.hat === "straw" ? 0.35 : o.hat === "tophat" ? 0.31 : 0.36;
      cloth(p, ellX(X, 0, by + 0.02, bw, o.hat === "straw" ? 0.13 : 0.12, 48), lighter(c, 1.1), light, D);
      const base = lin(24, cw, -cw).map((x) => X(x, by + 0.055 * Math.sqrt(Math.max(0, 1 - (x / cw) ** 2))));
      const crown = o.hat === "brim" ? [...B3(X, [-cw, by], [-cw - 0.05, top], [cw + 0.05, top], [cw, by], 30), ...base] : [X(-cw, by), X(-cw - 0.03, top), X(cw + 0.03, top), ...base];
      cloth(p, crown, c, light, D, 0, [X(-0.17, top + 0.1), X(-0.15, by - 0.17)], 0.2);
      const band = o.ribbon ?? (o.hat === "tophat" ? "#962c26" : v3mul(c, [0.55, 0.55, 0.58]));
      p.clip(crown, () => { const hb = o.hat === "straw" ? 0.11 : 0.13; flat(p, [X(-1, by + 0.2), ...lin(24, -cw, cw).map((x) => X(x, by + 0.055 * Math.sqrt(Math.max(0, 1 - (x / cw) ** 2)) - hb)), X(1, by + 0.2)], band, D); });
      if (o.hat === "straw") p.clip(crown, () => { for (const yy of [top + 0.1, top + 0.18]) p.stroke([X(-0.4, yy), X(0.4, yy)], 0.012 * D, v3mul(c, [0.78, 0.76, 0.7])); });
      if (o.hat === "brim") p.clip(crown, () => p.stroke(B2(X, [-0.12, top + 0.1], [0, top + 0.18], [0.12, top + 0.1], 10), 0.02 * D, v3mul(c, [0.6, 0.6, 0.6])));
      p.poly(crown, null, 0.048 * D);
      if (o.hat !== "brim") { const tp = ellX(X, 0, top, cw + 0.03, o.hat === "straw" ? 0.075 : 0.07, 36); flat(p, tp, lighter(c, o.hat === "straw" ? 1.12 : 1.35), D, 0.035); }
      return true;
    }
  }
  return false;
};

/** clothes details INSIDE the body outline (clip to the torso first): plaid, aprons, braces, vests, logos, straps */
export const v3WearIn = (p: Pen, o: Outfit, tcx: number, hc: number, D: number, f: number, light: number) => {
  const s = f || 1, X: X2 = (x, y) => [tcx + x * D * s, hc + y * D];
  if (o.plaid) { for (const yy of [0.62, 0.8, 1.0]) p.stroke([X(-0.5, yy), X(0.5, yy)], 0.022 * D, o.plaid); for (const xx of [-0.16, 0.14]) p.stroke([X(xx, 0.3), X(xx, 1.5)], 0.022 * D, o.plaid); }
  if (o.vest && !o.dress) {
    const vest = [X(-0.16, 0.42), X(0.16, 0.42), X(0.11, 1.2), X(-0.11, 1.2)];
    cloth(p, vest, o.vest, light, D, 0.024);
    for (const k of [-1, 1]) { const lap = [X(k * 0.16, 0.44), X(k * 0.28, 0.5), X(k * 0.14, 0.92)]; flat(p, lap, lighter(o.jacket, 1.22), D, 0.02); }
    if (o.kit === "foreman") p.stroke(B2(X, [-0.11, 0.86], [0, 1.0], [0.11, 0.86], 12), 0.016 * D, "#e8c052");
    for (let i = 0; i < 3; i++) p.dot(...X(0, 0.76 + 0.13 * i), 0.017 * D, o.buttons ?? "#5a4020");
  } else if (o.buttons && !o.dress && !o.apron) for (let i = 0; i < 3; i++) p.dot(...X(0.02, 0.7 + 0.16 * i), 0.019 * D, o.buttons);
  if (o.suspenders && !o.apron) for (const k of [-1, 1]) p.stroke([X(k * 0.2, 0.42), X(k * 0.18, 1.35)], 0.04 * D, o.suspenders);
  if (o.apron && !o.dress) {
    cloth(p, [X(-1, 0.94), X(1, 0.94), X(1, 2), X(-1, 2)], o.apron, light, D, 0);
    p.stroke([X(-0.33, 0.94), X(0.33, 0.94)], 0.018 * D, V3_INK);
    for (const k of [-1, 1]) p.stroke([X(k * 0.22, 0.94), X(k * 0.19, 0.48)], 0.032 * D, v3mul(o.apron, [0.86, 0.84, 0.8]));
    flat(p, [X(-0.13, 1.05), X(0.13, 1.05), X(0.12, 1.22), X(-0.12, 1.22)], v3mul(o.apron, [0.92, 0.9, 0.88]), D, 0.02);
    p.stroke([X(-0.06, 1.05), X(-0.065, 0.95)], 0.022 * D, "#78787e");
  }
  if (o.logo) { flat(p, [X(-0.11, 0.86), X(0.13, 0.86), X(0.13, 0.99), X(-0.11, 0.99)], "#faf4e8", D); p.stroke([X(-0.07, 0.925), X(0.09, 0.925)], 0.02 * D, o.jacket); }
  if (o.pack) for (const k of [-1, 1]) p.stroke(B2(X, [k * 0.2, 0.46], [k * 0.27, 0.8], [k * 0.27, 1.15], 12), 0.05 * D, o.pack);
};

/** a backpack behind the body (tourists) */
export const v3Pack = (p: Pen, o: Outfit, tcx: number, hc: number, D: number, f: number, light: number) => {
  if (!o.pack) return;
  const s = f || 1, X: X2 = (x, y) => [tcx + x * D * s, hc + y * D];
  cloth(p, ellX(X, -0.3, 0.92, 0.17, 0.4, 40), o.pack, light, D);
};

/** details ON TOP of the body: collars, ties, kerchiefs, Sarah's lace collar + brooch + buttons, the tourist's camera */
export const v3WearOn = (p: Pen, o: Outfit, tcx: number, hc: number, D: number, f: number, light: number) => {
  const s = f || 1, X: X2 = (x, y) => [tcx + x * D * s, hc + y * D];
  if (o.kit === "sarah") {
    const col = [X(-0.25, 0.46), ...lin(18, Math.PI, 0).map((t) => X(0.25 * Math.cos(t), 0.46 + 0.15 * Math.sin(t))), X(0.25, 0.46)];
    flat(p, col, o.collar ?? "#f0eadc", D, 0.024);
    for (let i = 0; i < 7; i++) p.dot(...X(-0.21 + 0.07 * i, 0.47 + 0.11 * Math.sin((Math.PI * i) / 6)), 0.018 * D, "#dcd4c4");
    p.dot(...X(0, 0.63), 0.047 * D, "#cea848"); p.dot(...X(0, 0.63), 0.027 * D, "#f0e2c8");
    for (let i = 0; i < 5; i++) p.dot(...X(-0.02, 0.72 + 0.14 * i), 0.019 * D, o.buttons ?? "#ded4c0");
    return;
  }
  if (o.shawl) { const sh = [X(-0.4, 0.44), X(0.4, 0.44), X(0.37, 0.7), X(0, 0.92), X(-0.37, 0.7)]; cloth(p, sh, o.shawl, light, D, 0.044); }
  if (o.kerchief) flat(p, [X(-0.16, 0.45), X(0.16, 0.45), X(0, 0.64)], o.kerchief, D, 0.025);
  else if (o.collar && !o.dress) flat(p, [X(-0.13, 0.42), X(0, 0.55), X(0.13, 0.42), X(0, 0.46)], o.collar, D, 0.02);
  if (o.tie) {
    if (o.kit === "foreman" || o.vest) flat(p, [X(-0.1, 0.48), X(0, 0.525), X(0.1, 0.48), X(0.1, 0.58), X(0, 0.535), X(-0.1, 0.58)], o.tie, D, 0.016);
    else flat(p, [X(-0.035, 0.5), X(0.035, 0.5), X(0.05, 0.84), X(0, 0.91), X(-0.05, 0.84)], o.tie, D, 0.02);
  }
  if (o.dress && o.collar) flat(p, [X(-0.15, 0.44), X(0, 0.56), X(0.15, 0.44), X(0, 0.48)], o.collar, D, 0.02);
  if (o.camera) {
    p.stroke(B2(X, [-0.14, 1.1], [-0.2, 0.7], [0, 0.48], 12), 0.02 * D, "#28282c");
    cloth(p, [X(-0.16, 1.1), X(0.1, 1.1), X(0.1, 1.28), X(-0.16, 1.28)], "#36363a", light, D, 0.025);
    flat(p, ellX(X, -0.03, 1.19, 0.06, 0.06, 24), "#7896b4", D, 0.022);
  }
};
