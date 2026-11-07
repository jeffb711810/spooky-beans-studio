// EFFECT + PROP DRAWINGS (owner: staging agent). 2D Pen drawings composited as cards: knocks, gnawing chips, ghost
// voice rings, candle flames, the cat (+ its little ghost), the fish, the rat, the witch silhouette, the drop, whisper
// marks, and the small acting helpers (shock lines, sweat/tear drops, shiver marks, speed lines, slap print, sparkles,
// dizzy stars, steam, ghost notes, thought bubble). No letters anywhere. Unlit cards: `soft` ones blend their alpha.
import { Pen, INK } from "../bridge/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const TAU = Math.PI * 2;
const hr = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const cl = (x: number) => Math.max(0, Math.min(1, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${cl(a).toFixed(3)})`;
};
/** soft radial glow (sy squashes it vertically) */
const glow = (p: Pen, x: number, y: number, r: number, col: string, a: number, sy = 1) => {
  if (a <= 0.003 || r <= 1) return;
  const g = p.g, gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.35, rgba(col, a * 0.5)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.translate(x, y); g.scale(1, sy); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.restore();
};
const withA = (p: Pen, a: number, fn: () => void) => {
  if (a <= 0.003) return;
  const g = p.g, o = g.globalAlpha; g.globalAlpha = o * Math.min(1, a); fn(); g.globalAlpha = o;
};
const starPts = (cx: number, cy: number, r0: number, r1: number, n: number, rot = 0, jag = 0, seed = 1): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = rot + (i * Math.PI) / n + (jag ? (hr(seed + i, 3) - 0.5) * jag * 0.5 : 0);
    const r = (i % 2 ? r0 : r1) * (jag ? 1 + (hr(seed + i, 5) - 0.5) * jag : 1);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
};
/** spindle streak from a to b, widest at `bias` along it (impact ticks, speed lines) */
const streak = (p: Pen, a: P2, b: P2, w: number, fill: string, ol = 0, bias = 0.35) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * w / 2, ny = (dx / L) * w / 2;
  const m: P2 = [a[0] + dx * bias, a[1] + dy * bias];
  p.poly([a, [m[0] + nx, m[1] + ny], b, [m[0] - nx, m[1] - ny]], fill, ol);
};
/** inked stroke: plum rim under a coloured core */
const inked = (p: Pen, pts: P2[], w: number, fill: string, rim = 6) => { p.stroke(pts, w + 2 * rim, INK); p.stroke(pts, w, fill); };
/** filled closed path from a drawing callback, with fill (string or gradient) and ink */
const shape = (p: Pen, path: (g: CanvasRenderingContext2D) => void, fill: string | CanvasGradient | null, ol = 0, olCol = INK) => {
  const g = p.g; g.beginPath(); path(g); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (ol) { g.lineWidth = ol; g.strokeStyle = olCol; g.lineJoin = "round"; g.stroke(); }
};
const twinkle = (p: Pen, x: number, y: number, r: number, col = "#fffbe8", ol = 0) =>
  p.poly([[x, y - r], [x + r * 0.2, y - r * 0.2], [x + r, y], [x + r * 0.2, y + r * 0.2], [x, y + r], [x - r * 0.2, y + r * 0.2], [x - r, y], [x - r * 0.2, y - r * 0.2]], col, ol);

// ============================== impacts ==============================
/** knock / slap impact, 500 x 500, t 0..1: jagged pop star, radiating ticks, a shock ring, wood dust and splinters.
 *  col = star core colour (warm for knocks, pink for the slap) */
export const fxKnock = (p: Pen, t: number, seed = 1, col = "#ffd77a") => {
  const c = 250, e = 1 - (1 - t) ** 3, fade = 1 - sm((t - 0.3) / 0.7);
  glow(p, c, c, 100 + 120 * e, "#ffe6b4", 0.6 * (1 - t));
  for (let k = 0; k < 2; k++) {
    const u = cl(e * 1.15 - k * 0.25);
    if (u <= 0 || u >= 1) continue;
    withA(p, (1 - u) * 0.85, () => { const g = p.g; g.beginPath(); g.ellipse(c, c, 70 + 175 * u, 70 + 175 * u, 0, 0, TAU); g.strokeStyle = "#fff0cf"; g.lineWidth = 14 * (1 - u) + 2; g.stroke(); });
  }
  for (let i = 0; i < 10; i++) {
    const a = rad(i * 36 + 14 * (i % 2) + seed * 23), r0 = 100 + 80 * e + 18 * (i % 2), r1 = r0 + (80 - 38 * (i % 2)) * (1 - 0.55 * t);
    withA(p, fade, () => streak(p, [c + r0 * Math.cos(a), c + r0 * Math.sin(a)], [c + r1 * Math.cos(a), c + r1 * Math.sin(a)], 22 * (1 - 0.5 * t), "#fff6e2", 5, 0.3));
  }
  for (let i = 0; i < 6; i++) {
    const a = rad(150 + i * 48 + hr(seed + i) * 20), d = 70 + 140 * e;
    withA(p, 0.7 * (1 - t), () => p.ell(c + d * Math.cos(a), c + d * 0.6 * Math.sin(a) + 110 * t * t + 30, 20 + 18 * t, 15 + 12 * t, "#d9c2a0", 0));
  }
  for (let i = 0; i < 4; i++) {
    const a = rad(205 + i * 40 + hr(seed + i, 2) * 20), d = 50 + 200 * e, x = c + d * Math.cos(a), y = c + d * Math.sin(a) + 220 * t * t, s = 13, r = t * 9 + i;
    withA(p, 1 - sm((t - 0.6) / 0.4), () => p.poly([[x + s * Math.cos(r), y + s * Math.sin(r)], [x + 0.5 * s * Math.cos(r + 2), y + 0.5 * s * Math.sin(r + 2)], [x - s * Math.cos(r), y - s * Math.sin(r)], [x + 0.5 * s * Math.cos(r + 4.2), y + 0.5 * s * Math.sin(r + 4.2)]], "#8a5a34", 4));
  }
  if (t < 0.6) {
    const s = t < 0.1 ? 0.75 + 2.5 * t : 1 - 1.2 * (t - 0.1), a = 1 - sm((t - 0.3) / 0.3);
    withA(p, a, () => {
      p.poly(starPts(c, c, 45 * s, 120 * s, 7, rad(-90 + seed * 13), 0.45, seed), "#fffaea", 8);
      p.poly(starPts(c, c, 22 * s, 62 * s, 7, rad(-90 + seed * 13), 0.35, seed), col, 0);
    });
  }
};

/** gnawing, 400 x 400, t 0..1 loops; bite 0..1 grows the gnawed hole. Soft card. */
export const fxChips = (p: Pen, t: number, bite = 1, seed = 1) => {
  const cx = 200, cy = 235, s = 0.6 + 0.4 * bite;
  // the gnawed hole: raw pale wood rim, scalloped tooth bites, dark inside
  const hole = (k: number): P2[] => {
    const pts: P2[] = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU, sc = 1 + 0.12 * Math.abs(Math.sin(a * 5)) * k;
      pts.push([cx + 58 * s * sc * Math.cos(a), cy + 36 * s * sc * Math.sin(a)]);
    }
    return pts;
  };
  p.poly(hole(1.6).map(([x, y]) => [cx + (x - cx) * 1.28, cy + (y - cy) * 1.32] as P2), "#f1d29c", 5);
  p.poly(hole(1), "#2a1610", 4);
  p.ell(cx - 10 * s, cy + 8 * s, 30 * s, 14 * s, "#120806", 0);
  // chomp marks either side (jitter with the gnaw)
  const j = 5 * Math.sin(t * TAU * 3);
  for (const sd of [-1, 1]) for (let k = 0; k < 2; k++)
    p.arc(cx + sd * (95 + 22 * k) * s + j * sd, cy - 8, 16 + 8 * k, 26 + 10 * k, sd > 0 ? -60 : 120, sd > 0 ? 60 : 240, 6, "#fff2d6");
  // sawdust
  for (let i = 0; i < 14; i++) {
    const u = (t + hr(i, seed)) % 1, a = rad(190 + 160 * hr(i, 4)), d = 30 + 120 * u;
    withA(p, 1 - u, () => p.dot(cx + d * Math.cos(a), cy + d * 0.7 * Math.sin(a) + 150 * u * u, 4 + 3 * hr(i, 6), "#f6dfb4"));
  }
  // curled shavings flying up and out, then falling
  for (let i = 0; i < 9; i++) {
    const u = (t + i / 9) % 1, a = rad(200 + ((i * 53 + seed * 17) % 140)), d = 40 + 170 * u;
    const x = cx + d * Math.cos(a), y = cy + d * Math.sin(a) * 0.9 + 230 * u * u, r = (24 + 12 * (i % 3)) * (1 - 0.35 * u), rot = u * 9 + i;
    withA(p, 1 - sm((u - 0.75) / 0.25), () => {
      const pts: P2[] = [];
      for (let k = 0; k <= 8; k++) { const b = rot + (k / 8) * 3.6; pts.push([x + r * Math.cos(b), y + r * 0.55 * Math.sin(b)]); }
      for (let k = 8; k >= 0; k--) { const b = rot + (k / 8) * 3.6; pts.push([x + r * 0.45 * Math.cos(b), y + r * 0.25 * Math.sin(b)]); }
      p.poly(pts, i % 2 ? "#f3d6a2" : "#d8a666", 4);
    });
  }
};

// ============================== the ghost ==============================
/** ghost voice: broken wavy rings with a bright core + soft halo, curling wisps and motes; 600 x 600, t 0..1 loops */
export const fxVoice = (p: Pen, t: number, col = "#b9f3d0") => {
  const g = p.g, c = 300;
  glow(p, c, c, 190 + 18 * Math.sin(t * TAU), col, 0.32);
  glow(p, c, c, 70, "#f4fff8", 0.55);
  g.lineCap = "round"; g.lineJoin = "round";
  for (let k = 0; k < 4; k++) {
    const u = (t + k / 4) % 1, r = 34 + 245 * u, amp = 4 + 16 * u, fade = Math.sin(Math.PI * Math.min(1, u * 1.12));
    const ring = (w: number, color: string) => {
      g.beginPath(); let pen = false;
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * TAU;
        if (Math.sin(a * 3 + k * 2.1 + u * 3) < -0.55) { pen = false; continue; }
        const rr = r + amp * Math.sin(a * 7 + k * 1.7 + u * 9), x = c + rr * Math.cos(a), y = c + rr * 0.92 * Math.sin(a);
        if (pen) g.lineTo(x, y); else g.moveTo(x, y);
        pen = true;
      }
      g.strokeStyle = color; g.lineWidth = w; g.stroke();
    };
    ring(26 * (1 - u) + 8, rgba(col, 0.3 * fade));
    ring(7 * (1 - u) + 2.5, rgba("#f2fff6", 0.95 * fade));
  }
  for (let i = 0; i < 6; i++) {
    const u = (t + i / 6) % 1, a0 = (i / 6) * TAU + 0.7, pts: P2[] = [];
    for (let s = 0; s <= 10; s++) { const v = s / 10, a = a0 + v * 1.4 + u * 0.8, r = 60 + 190 * u + 50 * v; pts.push([c + r * Math.cos(a), c + r * Math.sin(a)]); }
    withA(p, 0.7 * Math.sin(Math.PI * u), () => p.stroke(pts, 5, "#e6fff0"));
  }
  for (let i = 0; i < 12; i++) {
    const u = (t + hr(i)) % 1, a = hr(i, 2) * TAU, r = 40 + 250 * u;
    withA(p, 1 - u, () => p.dot(c + r * Math.cos(a), c + r * Math.sin(a), 6 * (1 - u) + 2, "#f4fff8"));
  }
  // fine motes swirling out along a slow spiral, a few glinting as tiny four-point sparkles
  for (let i = 0; i < 16; i++) {
    const u = (t * 0.5 + hr(i, 7)) % 1, a = hr(i, 8) * TAU + u * 2.4, r = 70 + 215 * u, x = c + r * Math.cos(a), y = c + r * 0.92 * Math.sin(a) - 30 * u;
    const fl = 0.55 + 0.45 * Math.sin(t * TAU * 2 + i * 1.7), al = Math.sin(Math.PI * u) * fl;
    if (i % 4 === 0) withA(p, al, () => { glow(p, x, y, 16, col, 0.6); twinkle(p, x, y, 9 + 4 * fl, "#f4fff8"); });
    else withA(p, 0.85 * al, () => { glow(p, x, y, 9, col, 0.5); p.dot(x, y, 2.6, "#f4fff8"); });
  }
};
/** ghostly music note (pale green, soft), 200 x 240 */
export const fxGhostNote = (p: Pen, kind: number) => {
  glow(p, 100, 150, 95, "#9effc8", 0.35);
  const col = "#e4fff0";
  p.ell(70, 190, 40, 30, col, 7, 0, 360, -20);
  inked(p, [[106, 182], [106, 50]], 9, col, 4);
  if (kind === 0) p.poly([[106, 46], [160, 74], [160, 110], [106, 84]], col, 7);
  else { p.ell(150, 165, 34, 26, col, 7, 0, 360, -20); inked(p, [[180, 158], [180, 34]], 9, col, 4); p.poly([[106, 46], [180, 28], [180, 56], [106, 74]], col, 7); }
};

/** candle flame, 200 x 400 (soft card): halo, orange skin, yellow body, blue root, wick, white core.
 *  bend -1..1 leans the tip sideways, flick -1.7..1.7 stretches it */
export const fxFlame = (p: Pen, bend = 0, flick = 0) => {
  const g = p.g, k = 1 + 0.06 * flick;
  const tear = (by: number, w: number, ht: number, b: number, wob: number) => (gg: CanvasRenderingContext2D) => {
    const tx = 100 + b * ht * 0.42 + wob, ty = by - ht;
    gg.moveTo(100, by);
    gg.bezierCurveTo(100 - w * 1.3, by - ht * 0.1, 100 - w * 0.8 + b * ht * 0.18, by - ht * 0.62, tx, ty);
    gg.bezierCurveTo(100 + w * 0.8 + b * ht * 0.22, by - ht * 0.62, 100 + w * 1.3, by - ht * 0.1, 100, by);
  };
  glow(p, 100 + 30 * bend, 250, 98, "#ffab4a", 0.5, 1.7);
  shape(p, tear(368, 44 * (2 - k), 290 * k, bend, 5 * flick), "#ff8a2a");
  shape(p, tear(364, 33 * (2 - k), 220 * k, bend * 0.92, 3 * flick), "#ffc94a");
  p.ell(100, 352, 20, 15, "rgba(90,130,255,0.85)", 0);
  p.stroke([[100, 396], [100 + 10 * bend, 338]], 8, "#2a1810");
  p.dot(100 + 10 * bend, 338, 5, "#ff5a24");
  shape(p, tear(352, 19, 135 * k, bend * 0.75, 2 * flick), "#fff6dc");
  void g;
};

// ============================== the cat ==============================
export type CatPose = { pose: "sit" | "lap" | "bristle" | "dead"; sniff: number; blink: number; tail: number; look: number; tongue?: number; twitch?: number; night?: boolean };
let FUR = "#67625e", STRIPE = "#3e3a37", CREAM = "#e2dcd2", PINK = "#e9a0b2";
const IRIS = "#e2e070";
/** night palette for the yard (moonlight turns warm greys mauve): cool grey with green >= red, beige ear insides */
const CAT_NIGHT = ["#5d625f", "#363a38", "#d6dbd4", "#c9b79c"], CAT_DAY = [FUR, STRIPE, CREAM, PINK];
type CatFace = "open" | "wide" | "x" | "happy";
/** cat head drawn about (hx, hy) rotated by rotDeg; mouth: w | lap | O | dead */
const catHead = (p: Pen, hx: number, hy: number, rotDeg: number, face: CatFace, mouth: "w" | "lap" | "O" | "dead", blink = 0, look = 0, ears = 0, tongue = 0) => {
  p.rot = rotDeg ? [rad(rotDeg), hx, hy] : null;
  for (const s of [-1, 1]) { // ears (flatten back when scared)
    const e = ears * s;
    p.poly([[hx + s * 125, hy - 30 + 25 * ears], [hx + s * (112 + 50 * ears), hy - 165 + 70 * ears + e * 4], [hx + s * 35, hy - 98]], FUR, 8);
    p.poly([[hx + s * 108, hy - 50 + 22 * ears], [hx + s * (104 + 40 * ears), hy - 138 + 60 * ears], [hx + s * 55, hy - 95]], PINK, 0);
  }
  const head: P2[] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * TAU, deg = (a * 180) / Math.PI, cheek = (deg > 10 && deg < 60) || (deg > 120 && deg < 170);
    const r = 1 + (cheek ? 0.07 * (i % 2) : 0) + (face === "wide" ? 0.05 * (i % 2) : 0);
    head.push([hx + 140 * r * Math.cos(a), hy + 112 * r * Math.sin(a)]);
  }
  p.poly(head, FUR, 9);
  for (const dx of [-26, 0, 26]) p.stroke([[hx + dx, hy - 104], [hx + dx * 0.8, hy - 74 + (dx ? 6 : 0)]], 10, STRIPE);
  for (const s of [-1, 1]) for (const k of [0, 1]) p.stroke([[hx + s * 140, hy + k * 22 - 8], [hx + s * 108, hy + k * 22 - 2]], 8, STRIPE);
  // muzzle
  p.ell(hx - 24, hy + 44, 30, 22, CREAM, 0); p.ell(hx + 24, hy + 44, 30, 22, CREAM, 0);
  // eyes
  for (const s of [-1, 1]) {
    const ex = hx + s * 52, ey = hy - 6;
    if (face === "x") { p.stroke([[ex - 17, ey - 17], [ex + 17, ey + 17]], 9); p.stroke([[ex - 17, ey + 17], [ex + 17, ey - 17]], 9); continue; }
    if (face === "happy" || blink >= 1) { p.arc(ex, ey + 8, 22, 16, 200, 340, 8); continue; }
    if (face === "wide") { p.ell(ex, ey, 36, 40, "#fbfbe8", 6); p.ell(ex, ey, 7, 9, INK, 0); continue; }
    p.ell(ex, ey, 32, 36, IRIS, 6);
    p.ell(ex + look * 5, ey + 4, 17, 27, INK, 0);
    p.dot(ex - 9 + look * 4, ey - 10, 7.5, "#ffffff"); p.dot(ex + 8 + look * 4, ey + 12, 3.5, "#ffffff");
    if (blink > 0) { p.poly([[ex - 36, ey - 42], [ex + 36, ey - 42], [ex + 36, ey], [ex - 36, ey]], FUR, 0); p.stroke([[ex - 32, ey], [ex + 32, ey]], 6); }
  }
  // nose + mouth
  p.poly([[hx - 13, hy + 22], [hx + 13, hy + 22], [hx, hy + 36]], PINK === "#e9a0b2" ? "#e98aa0" : "#b98f7c", 4);
  if (mouth === "O") p.ell(hx, hy + 62, 14, 18, "#5a1e28", 5);
  else if (mouth === "dead") {
    p.arc(hx - 12, hy + 42, 12, 9, 0, 180, 5); p.arc(hx + 12, hy + 42, 12, 9, 0, 180, 5);
    p.poly([[hx + 4, hy + 48], [hx + 30, hy + 50], [hx + 36, hy + 92], [hx + 22, hy + 104], [hx + 8, hy + 94]], "#ec7a92", 5);
    p.stroke([[hx + 21, hy + 56], [hx + 22, hy + 88]], 3, "#b84c66");
  } else {
    p.arc(hx - 12, hy + 40, 12, 10, 0, 180, 5); p.arc(hx + 12, hy + 40, 12, 10, 0, 180, 5);
    if (mouth === "lap") p.ell(hx, hy + 58 + 8 * tongue, 13, 12 + 10 * tongue, "#ec7a92", 4);
  }
  for (const s of [-1, 1]) for (const k of [0, 1, 2]) p.stroke([[hx + s * 46, hy + 36 + k * 9], [hx + s * 150, hy + 18 + k * 24]], 3, "#efe9df");
  p.rot = null;
};
/** cat, 600 x 1000 design (soles at 975). sit: chubby tabby with big eyes; lap: head down at the saucer, tongue out;
 *  bristle: fur on end, tail up, eyes wide; dead: belly up, stiff legs, X eyes, tongue out */
export const catCard = (p: Pen, c: CatPose) => {
  [FUR, STRIPE, CREAM, PINK] = c.night ? CAT_NIGHT : CAT_DAY;
  catBody(p, c);
  [FUR, STRIPE, CREAM, PINK] = CAT_DAY;
};
const catBody = (p: Pen, c: CatPose) => {
  const ow = 9;
  if (c.pose === "dead") {
    const tw = c.twitch ?? 0;
    inked(p, [[495, 905], [560, 885], [590, 872]], 26, FUR, 6);  // tail, stiff
    const legs: [number, number][] = [[250, -6], [305, -2], [395, 3], [450, 8]];
    legs.forEach(([x, a], i) => {
      const lean = rad(a + (i === 3 ? 14 * tw : 0)), tx = x + Math.sin(lean) * 175, ty = 840 - Math.cos(lean) * 175;
      inked(p, [[x, 850], [tx, ty]], 40, FUR, 7);
      p.ell(tx, ty - 6, 26, 18, CREAM, 6, 0, 360, (lean * 180) / Math.PI);
    });
    p.ell(350, 890, 180, 88, FUR, ow);
    p.ell(345, 870, 118, 48, CREAM, 0);
    for (const x of [295, 345, 395]) p.stroke([[x, 935], [x + 6, 968]], 9, STRIPE);
    catHead(p, 200, 860, -70, "x", "dead", 0, 0, 0.2);
    return;
  }
  const bristle = c.pose === "bristle", sn = c.sniff, tl = c.tail;
  // tail (behind): sways; straight up and spiky when scared
  if (bristle) {
    const pts: P2[] = [];
    for (let i = 0; i <= 12; i++) pts.push([462 + (i % 2 ? 44 : 16), 880 - 40 * i]);
    for (let i = 12; i >= 0; i--) pts.push([462 - (i % 2 ? 44 : 16), 880 - 40 * i]);
    p.poly(pts, FUR, 7);
  } else {
    const tip: P2 = [560 + 26 * tl, 760 - 20 * Math.abs(tl)];
    inked(p, [[400, 925], [505, 935], [565, 870], tip], 34, FUR, 7);
    p.stroke([[555 + 26 * tl, 800], tip], 34, STRIPE);
  }
  // body: pear with tabby stripes (spiky outline when the fur stands up)
  const body: P2[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU, yv = Math.sin(a), wid = 150 + 18 * yv, spike = bristle ? 1 + 0.09 * (i % 2) : 1;
    body.push([300 + wid * Math.cos(a) * spike, 800 + 170 * yv * (bristle ? 1 + 0.05 * (i % 2) : 1)]);
  }
  p.poly(body, FUR, ow);
  p.clip(body, () => { for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.stroke([[300 + s * 160, 720 + k * 60], [300 + s * 100, 740 + k * 60]], 16, STRIPE); });
  p.ell(300, 790, 66, 118, CREAM, 0);
  // front legs with white socks
  for (const s of [-1, 1]) {
    const x = 300 + s * 52;
    p.poly([[x - 28, 820], [x + 28, 820], [x + 28, 948], [x - 28, 948]], FUR, 7);
    p.ell(x, 958, 36, 20, CREAM, 6);
    p.stroke([[x - 10, 950], [x - 10, 968]], 3); p.stroke([[x + 10, 950], [x + 10, 968]], 3);
  }
  const hx = 300 + 70 * sn, hy = 565 + 205 * sn - (bristle ? 40 : 0);
  catHead(p, hx, hy, 14 * sn, bristle ? "wide" : "open", bristle ? "O" : c.pose === "lap" ? "lap" : "w", c.blink, c.look, bristle ? 0.9 : 0, c.tongue ?? 0);
};
/** the cat's little ghost floating up (soft card), 400 x 440: halo, closed happy eyes, wispy tail */
export const catGhost = (p: Pen, t: number) => {
  glow(p, 200, 230, 170, "#d8f0ff", 0.45);
  const col = "rgba(236,246,255,0.92)", w = 10 * Math.sin(t * TAU);
  shape(p, (g) => {
    g.moveTo(110, 220); g.bezierCurveTo(105, 300, 150, 340, 190 + w, 380); g.bezierCurveTo(220 + w, 410, 250 + w, 420, 270 + 2 * w, 410);
    g.bezierCurveTo(250, 380, 300, 330, 290, 220);
  }, col, 6);
  for (const s of [-1, 1]) p.poly([[200 + s * 80, 180], [200 + s * 85, 92], [200 + s * 30, 140]], col, 6);
  p.ell(200, 200, 95, 76, col, 6);
  p.arc(170, 200, 16, 12, 200, 340, 6); p.arc(230, 200, 16, 12, 200, 340, 6);
  p.arc(192, 226, 8, 7, 0, 180, 4); p.arc(208, 226, 8, 7, 0, 180, 4);
  p.g.lineWidth = 9; p.g.strokeStyle = "#ffe27a"; p.g.beginPath(); p.g.ellipse(200, 62, 62, 16, 0, 0, TAU); p.g.stroke();
  glow(p, 200, 62, 80, "#fff2a0", 0.4, 0.35);
};

// ============================== fish, rat, witch, drop ==============================
/** fish, 800 x 400; flap -1..1 swings the tail */
export const fishCard = (p: Pen, flap = 0) => {
  const g = p.g, FIN = "#e0702a", RAY = "#a8481a";
  const tail: P2[] = [[620, 200], [790, 70 + 22 * flap], [745, 200 + 12 * flap], [790, 330 + 22 * flap]];
  p.poly(tail, FIN, 9);
  for (const k of [0.3, 0.55, 0.8]) { p.stroke([[640, 200], [640 + 150 * k + 20, 200 + (70 + 22 * flap - 200) * k * 1.1]], 4, RAY); p.stroke([[640, 200], [640 + 150 * k + 20, 200 + (330 + 22 * flap - 200) * k * 1.1]], 4, RAY); }
  p.poly([[290, 80], [340, 18], [420, 8], [510, 50], [550, 92]], FIN, 8);
  for (const x of [340, 390, 440, 490]) p.stroke([[x, 80], [x + 5, 30 + Math.abs(x - 410) * 0.25]], 4, RAY);
  p.poly([[440, 330], [470, 390], [540, 352]], FIN, 7);
  const gr = g.createLinearGradient(0, 55, 0, 345);
  gr.addColorStop(0, "#ee8130"); gr.addColorStop(0.45, "#f7a843"); gr.addColorStop(1, "#ffe09a");
  const body = (gg: CanvasRenderingContext2D) => gg.ellipse(385, 200, 290, 145, 0, 0, TAU);
  shape(p, body, gr);
  g.save(); g.beginPath(); body(g); g.clip();
  for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) p.arc(300 + k * 52 + (r % 2) * 26, 95 + r * 46, 26, 22, -70, 70, 4, "rgba(150,60,18,0.45)");
  g.restore();
  shape(p, body, null, 10);
  p.stroke([[200, 108], [330, 88], [470, 96]], 9, "rgba(255,246,220,0.55)");
  p.arc(240, 200, 40, 100, -55, 55, 7);
  p.poly([[330, 215], [410, 205], [395, 250]], "#ffb860", 6);
  p.ell(185, 165, 38, 38, "#ffffff", 7); p.dot(178, 170, 18); p.dot(171, 161, 6, "#ffffff");
  p.arc(122, 222, 34, 24, 15, 130, 7);
};
/** little rat, 600 x 400 facing left; hat = it wears a witch hat (the story growing); mean = fangs + brow */
export const ratCard = (p: Pen, hat = false, mean = false) => {
  const FURR = "#857a70", ol0 = p.ol; p.ol = 5;
  p.line([[440, 300], [530, 345], [590, 290], [565, 215]], "#d99aa2", 11);
  p.ol = ol0;
  p.ell(335, 285, 150, 92, FURR, 9);
  p.ell(330, 330, 100, 40, "#c2b6a8", 0);
  p.ell(410, 372, 34, 14, "#e2a6ae", 5); p.ell(250, 372, 30, 13, "#e2a6ae", 5);
  shape(p, (g) => { g.moveTo(250, 200); g.bezierCurveTo(170, 175, 70, 240, 48, 282); g.bezierCurveTo(90, 320, 200, 340, 265, 320); }, FURR, 8);
  p.ell(215, 170, 50, 50, FURR, 7); p.ell(215, 172, 32, 32, "#e2a6ae", 0);
  p.ell(150, 238, 13, 16, INK, 0); p.dot(146, 232, 4, "#ffffff");
  if (mean) p.stroke([[128, 214], [170, 222]], 8);
  p.ell(50, 282, 14, 12, "#ef8ea0", 4);
  p.poly([[86, 300], [100, 300], [100, 322], [86, 322]], "#ffffff", 3);
  if (mean) p.poly([[110, 300], [122, 300], [116, 318]], "#ffffff", 3);
  for (const k of [0, 1, 2]) p.stroke([[78, 288 + k * 6], [18, 272 + k * 20]], 3, "#ece6dc");
  if (hat) {
    p.ell(220, 150, 105, 20, "#1a1714", 7);
    p.poly([[160, 148], [190, 60], [240, 20], [300, -10], [262, 50], [270, 148]], "#1a1714", 7);
    p.poly([[170, 132], [262, 132], [264, 112], [176, 112]], "#c8732f", 0);
  }
};
/** witch silhouette with a poison flask, green rim light and glowing eyes, 600 x 1000 */
export const witchCard = (p: Pen) => {
  const SIL = "#13110d", RIM = "#59e08e";
  const parts = (fill: string | null, ol: number, col = INK) => {
    const pp = (pts: P2[]) => { p.path(pts, true); if (fill) { p.g.fillStyle = fill; p.g.fill(); } if (ol) { p.g.lineWidth = ol; p.g.strokeStyle = col; p.g.lineJoin = "round"; p.g.stroke(); } };
    pp([[245, 470], [380, 445], [455, 560], [478, 780], [505, 965], [440, 930], [395, 968], [335, 932], [270, 966], [205, 938], [148, 962], [168, 780], [190, 600]]);
    pp([[330, 350], [395, 420], [420, 540], [445, 610], [400, 560], [385, 600], [360, 500]]);
    pp([[230, 560], [160, 595], [118, 600], [112, 618], [168, 616], [250, 600]]);
    const head: P2[] = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; head.push([290 + 84 * Math.cos(a), 400 + 80 * Math.sin(a)]); }
    pp(head);
    pp([[215, 380], [140, 440], [196, 432]]);
    pp([[222, 445], [196, 492], [252, 468]]);
    pp([[110, 336], [440, 336], [450, 356], [100, 356]]);
    pp([[185, 340], [232, 215], [262, 120], [318, 64], [392, 40], [345, 92], [330, 190], [362, 340]]);
  };
  parts(null, 22, RIM);
  parts(SIL, 7);
  p.ell(236, 392, 15, 8, "#d4ff86", 0, 0, 360, -12); p.ell(286, 388, 13, 7, "#d4ff86", 0, 0, 360, 10);
  p.arc(240, 448, 30, 12, 15, 150, 5, "#9dffb0");
  // flask: neck, cork, round belly with glowing poison and bubbles
  p.poly([[84, 560], [106, 560], [108, 600], [82, 600]], "#2c4a38", 6);
  p.poly([[80, 540], [110, 540], [108, 562], [82, 562]], "#8a6a4a", 5);
  p.ell(95, 650, 52, 52, "#1d3a2a", 7);
  p.clip(starPts(95, 650, 49, 49, 20), () => { p.ell(95, 680, 60, 40, "#7cff8e", 0); });
  p.stroke([[66, 632], [76, 612]], 6, "rgba(255,255,255,0.6)");
  for (const [x, y, r] of [[100, 510, 10], [84, 478, 7], [104, 452, 5]] as const) p.ell(x, y, r, r, "#a8ffb4", 3);
};
/** a falling black drop, 100 x 160 (glossy) */
export const dropCard = (p: Pen) => {
  shape(p, (g) => { g.moveTo(50, 8); g.bezierCurveTo(62, 50, 88, 80, 88, 108); g.bezierCurveTo(88, 132, 70, 150, 50, 150); g.bezierCurveTo(30, 150, 12, 132, 12, 108); g.bezierCurveTo(12, 80, 38, 50, 50, 8); }, "#14110e", 5);
  p.stroke([[34, 98], [32, 118]], 7, "rgba(255,255,255,0.7)");
};
/** the drop landing in the saucer: little dark crown + ring, 300 x 200, t 0..1 */
export const fxPlip = (p: Pen, t: number) => {
  withA(p, 1 - t, () => { const g = p.g; g.beginPath(); g.ellipse(150, 150, 30 + 110 * t, 10 + 34 * t, 0, 0, TAU); g.strokeStyle = "#2a2220"; g.lineWidth = 6; g.stroke(); });
  for (let i = 0; i < 5; i++) {
    const a = rad(200 + i * 35), d = 20 + 70 * t, y = 140 + d * 0.8 * Math.sin(a) + 120 * t * t;
    if (t < 0.85) p.ell(150 + d * Math.cos(a), y, 9 * (1 - t) + 3, 11 * (1 - t) + 3, "#1a1410", 3);
  }
};

// ============================== whisper line ==============================
/** whisper marks travelling right: three nested arcs + dots, 300 x 300 (soft), t 0..1 loops */
export const fxWhisper = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const u = (t + k / 3) % 1, x = 70 + 150 * u, a = Math.sin(Math.PI * u);
    withA(p, a, () => { p.arc(x, 150, 26 + 16 * u, 44 + 26 * u, -55, 55, 15, INK); p.arc(x, 150, 26 + 16 * u, 44 + 26 * u, -55, 55, 8, "#f6eedc"); });
  }
  for (let k = 0; k < 3; k++) { const u = (t * 1.5 + k / 3) % 1; withA(p, 1 - u, () => p.dot(50 + 200 * u, 205 - 14 * Math.sin(u * 9), 7, "#f6eedc")); }
};
/** thought cloud behind the rumour pictures, 700 x 560 (soft): puffy cloud + two trailing puffs down-left */
export const fxBubble = (p: Pen) => {
  const col = "rgba(244,240,230,0.9)";
  const pts: P2[] = [];
  for (let i = 0; i < 90; i++) { const a = (i / 90) * TAU, r = 1 + 0.07 * Math.abs(Math.sin(a * 5)); pts.push([350 + 300 * r * Math.cos(a), 230 + 190 * r * Math.sin(a)]); }
  p.poly(pts, col, 9);
  p.ell(170, 470, 40, 30, col, 7); p.ell(115, 525, 22, 17, col, 6);
};

// ============================== acting helpers ==============================
/** shock emanata: tapered lines bursting around a head, 400 x 400 (soft), t 0..1 */
export const fxShock = (p: Pen, t: number) => {
  const e = 1 - (1 - cl(t * 2)) ** 2, a = 1 - sm((t - 0.55) / 0.45);
  for (let i = 0; i < 9; i++) {
    const ang = rad(-90 + (i - 4) * 24), r0 = 120 + 30 * e, r1 = r0 + 55 * e * (i % 2 ? 0.75 : 1);
    if (Math.abs(i - 4) > 3.5) continue;
    withA(p, a, () => streak(p, [200 + r0 * Math.cos(ang), 215 + r0 * Math.sin(ang)], [200 + r1 * Math.cos(ang), 215 + r1 * Math.sin(ang)], 18, "#fff8e6", 5, 0.6));
  }
};
/** sweat (blue) or tear (pale) drop sliding down, 160 x 240 (soft), t 0..1 */
export const fxSweat = (p: Pen, t: number, col = "#bfe6ff") => {
  const y = 40 + 120 * sm(t), a = 1 - sm((t - 0.7) / 0.3);
  withA(p, a, () => {
    shape(p, (g) => { g.moveTo(80, y - 40); g.bezierCurveTo(92, y - 12, 112, y + 6, 112, y + 28); g.bezierCurveTo(112, y + 48, 96, y + 60, 80, y + 60); g.bezierCurveTo(64, y + 60, 48, y + 48, 48, y + 28); g.bezierCurveTo(48, y + 6, 68, y - 12, 80, y - 40); }, col, 6);
    p.stroke([[66, y + 18], [64, y + 34]], 6, "rgba(255,255,255,0.85)");
  });
};
/** shiver marks either side of a scared figure, 500 x 500 (soft); j = jitter phase 0/1 */
export const fxShiver = (p: Pen, j: number) => {
  const d = j ? 7 : -7;
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
    const x = 250 + s * (175 + 32 * k) + d * s, pts: P2[] = [];
    for (let i = 0; i <= 8; i++) pts.push([x + 9 * Math.sin(i * 1.6 + j * 2), 190 + k * 30 + i * 13]);
    p.stroke(pts, 13, INK); p.stroke(pts, 6, "#e6f4ff");
  }
};
/** speed lines (motion streaks along +x, fading toward the tail), 600 x 300 (soft), t 0..1 */
export const fxSpeed = (p: Pen, t: number, col = "#f4ecdc") => {
  for (let i = 0; i < 7; i++) {
    const y = 40 + i * 36 + 10 * hr(i, 2), L = 180 + 220 * hr(i, 3), x1 = 560 - 60 * hr(i, 4) - 40 * t, x0 = x1 - L * (0.6 + 0.4 * t);
    withA(p, 0.85 * (1 - 0.6 * t), () => streak(p, [x0, y], [x1, y], 12 - 4 * (i % 2), col, 3, 0.8));
  }
};
/** wind gust: curling swoosh strokes, 600 x 400 (soft), t 0..1 = sweep */
export const fxSwoosh = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const pts: P2[] = [], head = cl(t * 1.4 - k * 0.12), tail = cl(head - 0.55);
    for (let i = 0; i <= 20; i++) {
      const v = tail + (head - tail) * (i / 20), x = 580 - 520 * v, y = 120 + k * 70 + 40 * Math.sin(v * 5 + k);
      pts.push(v > 0.85 ? [x - 30 * Math.sin((v - 0.85) * 20), y - 40 * (1 - Math.cos((v - 0.85) * 20))] : [x, y]);
    }
    if (head > tail) withA(p, 1 - sm((t - 0.75) / 0.25), () => { p.stroke(pts, 16 - 3 * k, INK); p.stroke(pts, 8 - 2 * k, "#e8f4ff"); });
  }
};
/** red hand print (the slap), 220 x 260 (soft) */
export const fxHand = (p: Pen) => {
  const col = "rgba(232,70,80,0.78)";
  p.ell(110, 170, 62, 70, col, 0);
  for (const [x, a] of [[62, -18], [92, -6], [124, 6], [154, 18]] as const) p.ell(x, 72, 17, 46, col, 0, 0, 360, a);
  p.ell(40, 170, 16, 40, col, 0, 0, 360, -40);
};
/** sparkles: n four-point stars popping in sequence, 400 x 400 (soft), t 0..1 */
export const fxTwinkle = (p: Pen, t: number, n = 5) => {
  for (let i = 0; i < n; i++) {
    const u = cl(t * 1.3 - i * 0.07), s = Math.sin(Math.PI * u), a = (i / n) * TAU + 0.4, d = n === 1 ? 0 : 110 + 70 * hr(i, 3);
    if (s <= 0) continue;
    const x = 200 + d * Math.cos(a), y = 200 + d * Math.sin(a), r = (n === 1 ? 150 : 60) * s;
    glow(p, x, y, r * 1.2, "#fff4c8", 0.5 * s);
    twinkle(p, x, y, r, "#fffbe8", 4);
  }
};
/** dizzy stars circling a head, 420 x 240 (soft): orbit trail, five-point stars, sparkles */
export const fxDizzy = (p: Pen, t: number) => {
  const g = p.g; g.beginPath(); g.ellipse(210, 120, 165, 48, 0, 0, TAU); g.strokeStyle = "rgba(255,240,170,0.45)"; g.lineWidth = 5; g.stroke();
  for (let i = 0; i < 4; i++) {
    const a = t * TAU + (i * Math.PI) / 2, x = 210 + 165 * Math.cos(a), y = 120 + 48 * Math.sin(a), z = 0.75 + 0.25 * Math.sin(a);
    p.poly(starPts(x, y, 15 * z, 36 * z, 5, -Math.PI / 2 + t * 3), "#ffd84a", 6);
    p.dot(x - 5 * z, y - 4 * z, 5 * z, "#fff8d0");
  }
  for (let i = 0; i < 3; i++) { const a = -t * TAU * 1.5 + i * 2.1; twinkle(p, 210 + 120 * Math.cos(a), 120 + 30 * Math.sin(a), 13, "#fffbe8"); }
};
/** steam / smoke from a roasted head, 300 x 400 (soft), t 0..1 loops */
export const fxSteam = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const u = (t + i / 5) % 1, x = 150 + 40 * Math.sin(u * 7 + i * 2), y = 360 - 300 * u, r = 22 + 40 * u;
    withA(p, 0.75 * Math.sin(Math.PI * u), () => p.ell(x, y, r, r * 0.85, "#d8d2cc", 0));
  }
};
/** a twitch: jagged little tick marks flashing near the face, 300 x 300 (soft), k = 0..2 */
export const fxTwitch = (p: Pen, k: number) => {
  for (let i = 0; i < 3; i++) {
    const a = rad(-60 + i * 50 + k * 15), r = 95, x = 150 + r * Math.cos(a), y = 150 + r * Math.sin(a), d = 30;
    const pts: P2[] = [[x, y], [x + d * Math.cos(a + 0.6), y + d * Math.sin(a + 0.6)], [x + d * Math.cos(a), y + d * Math.sin(a)], [x + 2 * d * Math.cos(a), y + 2 * d * Math.sin(a)]];
    p.stroke(pts, 13, INK); p.stroke(pts, 6, "#fff2d6");
  }
};
/** the swelling tongue, 300 x 300 (soft), s 0..1 = swell */
export const fxTongue = (p: Pen, s: number) => {
  const w = 40 + 50 * s, h = 50 + 90 * s;
  shape(p, (g) => { g.moveTo(150 - w * 0.8, 70); g.bezierCurveTo(150 - w * 1.2, 70 + h * 0.7, 150 - w * 0.6, 70 + h, 150, 70 + h); g.bezierCurveTo(150 + w * 0.6, 70 + h, 150 + w * 1.2, 70 + h * 0.7, 150 + w * 0.8, 70); }, "#ec6f86", 7);
  p.stroke([[150, 82], [150, 60 + h * 0.75]], 5, "#b4485e");
  p.stroke([[150 - w * 0.4, 90], [150 - w * 0.5, 70 + h * 0.4]], 6, "rgba(255,220,226,0.7)");
  if (s > 0.3) for (const sd of [-1, 1]) p.arc(150 + sd * (w + 34), 70 + h * 0.5, 14, 26, sd > 0 ? -60 : 120, sd > 0 ? 60 : 240, 6, "#fff2d6");
};
/** soft coloured aura (behind the witch), 400 x 400 */
export const fxAura = (p: Pen, col: string) => { glow(p, 200, 200, 195, col, 0.55); };
/** a tuft of hair yanked straight up by nothing, with strain ticks, 300 x 400 (soft); col = hair colour */
export const fxTuft = (p: Pen, j: number, col = "#7a4a2a") => {
  const tip: P2 = [150 + (j ? 6 : -6), 40];
  for (const x of [96, 122, 150, 178, 204]) {
    const pts: P2[] = [];
    for (let i = 0; i <= 10; i++) { const v = i / 10; pts.push([x + (tip[0] - x) * v * v + 6 * Math.sin(v * 6 + x), 390 - (390 - tip[1]) * v]); }
    inked(p, pts, 15, col, 5);
  }
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
    const x = 150 + s * (70 + 26 * k) + (j ? 4 : -4) * s;
    p.stroke([[x, 120 + 34 * k], [x + s * 16, 150 + 34 * k], [x, 180 + 34 * k]], 13, INK);
    p.stroke([[x, 120 + 34 * k], [x + s * 16, 150 + 34 * k], [x, 180 + 34 * k]], 6, "#fff2d6");
  }
};

// ============================== small air + impact bits (round 4) ==============================
/** a breath puff in cold night air, 300 x 200 (soft): starts at the left edge (x 30) and drifts right, rising and
 *  spreading; dir -1 mirrors it (drifts left from the right edge). t 0..1 */
export const fxBreath = (p: Pen, t: number, dir = 1) => {
  const e = 1 - (1 - t) ** 2, a = sm(t * 6) * (1 - sm((t - 0.35) / 0.65));
  for (let i = 0; i < 4; i++) {
    const k = 0.45 + 0.2 * i, x0 = 34 + 205 * e * k + 10 * i, x = dir < 0 ? 300 - x0 : x0, y = 118 - 26 * e * (0.4 + 0.3 * i) + 8 * Math.sin(i * 2.1 + t * 4), r = 13 + 46 * e * (0.6 + 0.15 * i);
    glow(p, x, y, r * 1.5, "#eef3f8", 0.55 * a * (1 - 0.12 * i), 0.72);
    withA(p, 0.62 * a * (1 - 0.15 * i), () => p.ell(x, y, r * 0.62, r * 0.45, "#f4f8fb", 0));
  }
};
/** flying wood splinters + a dust cloud sliding down the wall, 500 x 500 (soft), impact at the centre, t 0..1 */
export const fxSplinters = (p: Pen, t: number, seed = 1) => {
  const c = 250, e = 1 - (1 - t) ** 2;
  for (let i = 0; i < 5; i++) { // dust: soft beige clouds that spread and sink
    const a = rad(120 + 75 * i + 30 * hr(seed + i, 4)), d = 30 + 70 * e;
    glow(p, c + d * Math.cos(a), c + d * 0.6 * Math.sin(a) + 90 * t, 34 + 60 * e, "#d8c4a2", 0.42 * (1 - t) * sm(t * 8));
  }
  for (let i = 0; i < 10; i++) { // fine specks
    const a = rad(hr(seed + i, 9) * 360), v = 120 + 120 * hr(seed + i, 10), x = c + v * e * Math.cos(a), y = c + v * e * Math.sin(a) * 0.8 + 200 * t * t;
    withA(p, 1 - sm((t - 0.5) / 0.5), () => p.dot(x, y, 3 + 2 * hr(i, 11), "#efe0c2"));
  }
  for (let i = 0; i < 6; i++) { // splinters: thin raw-wood shards that tumble out and fall
    const a = rad(-160 + (i / 5) * 140 + 18 * (hr(seed + i, 12) - 0.5)), v = 150 + 90 * hr(seed + i, 13);
    const x = c + v * e * Math.cos(a), y = c + v * e * Math.sin(a) + 260 * t * t, L = 26 + 22 * hr(seed + i, 14), w = 5 + 3 * (i % 2), r = rad(40 * i) + t * (5 + 3 * i) * (i % 2 ? 1 : -1);
    const ca = Math.cos(r), sa = Math.sin(r);
    withA(p, 1 - sm((t - 0.65) / 0.35), () => p.poly([[x - L * ca, y - L * sa], [x + w * sa, y - w * ca], [x + L * 0.8 * ca, y + L * 0.8 * sa], [x - w * sa * 0.6, y + w * ca * 0.6]], i % 2 ? "#d9b27a" : "#b88a52", 3.5));
  }
};
/** slap spray: a few sweat droplets and specks flung to the right of the impact (x 100, y 250), 500 x 500 (soft) */
export const fxSpecks = (p: Pen, t: number) => {
  const e = 1 - (1 - t) ** 2.4, a = 1 - sm((t - 0.55) / 0.45);
  for (let i = 0; i < 8; i++) {
    const ang = rad(-38 + i * 11 + 8 * (hr(i, 21) - 0.5)), v = 210 + 150 * hr(i, 22), x = 100 + v * e * Math.cos(ang), y = 250 + v * e * Math.sin(ang) + 160 * t * t;
    const s = (i % 3 === 0 ? 11 : 7) * (1 - 0.3 * t);
    withA(p, a, () => { if (i % 3 === 0) { p.ell(x, y, s, s * 1.25, "#d8efff", 3, 0, 360, -30); p.dot(x - s * 0.3, y - s * 0.4, s * 0.3, "#ffffff"); } else p.dot(x, y, s * 0.55, "#fff6e0"); });
  }
};

// ============================== RICK-STYLE EMOTES (look round 10) ==============================
// user: "show me ... a different character style like ricksclips: his emotes, paper look, goofy charm". Bold, inked,
// springy cartoon symbols that pop over a head on the beat: "!" (startle), "?" (puzzled), the anger vein (cross-popping
// vein). All soft-edged cards like the other acting effects; t 0..1 over the beat.
/** pop scale: overshoots to 1.25 in the first quarter, settles to 1 */
const popS = (t: number) => (t < 0.22 ? sm(t / 0.22) * 1.25 : t < 0.4 ? 1.25 - 0.25 * sm((t - 0.22) / 0.18) : 1);
/** "!" startle mark, 240 x 360: a fat tapered bar + dot, inked, tilted, popping in and fading out at the end */
export const fxBang = (p: Pen, t: number, col = "#fff2b8") => {
  const s = popS(t), a = 1 - sm((t - 0.82) / 0.18);
  withA(p, a, () => {
    const g = p.g; g.save(); g.translate(120, 210); g.rotate(rad(-9)); g.scale(s, s); g.translate(-120, -210);
    shape(p, (g2) => { g2.moveTo(92, 36); g2.quadraticCurveTo(120, 22, 148, 36); g2.lineTo(134, 218); g2.quadraticCurveTo(120, 236, 106, 218); }, col, 11);
    p.ell(120, 288, 27, 27, col, 11);
    g.restore();
  });
};
/** "?" puzzled mark, 260 x 360: an inked hook + dot that wobbles side to side */
export const fxQuestion = (p: Pen, t: number, col = "#fff2b8") => {
  const s = popS(t), a = 1 - sm((t - 0.85) / 0.15), wob = rad(10 * Math.sin(t * TAU * 1.6));
  withA(p, a, () => {
    const g = p.g; g.save(); g.translate(130, 200); g.rotate(wob); g.scale(s, s); g.translate(-130, -200);
    const pts: P2[] = [];
    for (let i = 0; i <= 18; i++) { const an = rad(195 + 225 * (i / 18)); pts.push([130 + 58 * Math.cos(an), 112 + 54 * Math.sin(an)]); }
    pts.push([130, 196], [130, 222]);
    inked(p, pts, 30, col, 8);
    p.ell(130, 282, 21, 21, col, 9);
    g.restore();
  });
};
/** anger vein (cross-popping vein), 240 x 240: four red bulging arcs round a cross, throbbing */
export const fxVein = (p: Pen, t: number, col = "#e8453c") => {
  const s = popS(Math.min(t * 2, 1)) * (1 + 0.1 * Math.sin(t * TAU * 3)), a = 1 - sm((t - 0.88) / 0.12);
  withA(p, a, () => {
    const g = p.g; g.save(); g.translate(120, 120); g.scale(s, s);
    for (let k = 0; k < 4; k++) {
      const c = Math.cos(k * Math.PI / 2), sn = Math.sin(k * Math.PI / 2), R = (x: number, y: number): P2 => [x * c - y * sn, x * sn + y * c];
      const pts: P2[] = [];
      for (let i = 0; i <= 12; i++) { const u = i / 12, x = 24 + 52 * u, y = -24 - 52 * (1 - u) - 26 * Math.sin(u * Math.PI); pts.push(R(x * 0.82, y * 0.82)); }
      inked(p, pts, 15, col, 6);
    }
    g.restore();
  });
};
/** BRAND MASCOT (Allegedly Haunted): a paper-white sheet ghost with a shrug and a sly "allegedly..." side-eye,
 *  drawn on a person-sized card (600 x 1000 design units, the hem floats above the card's sole) */
export const ghostCard = (p: Pen) => {
  const BONE = "#f6f1e8", SHADE = "#d8e2f2", OL = 13;
  const body = (g: CanvasRenderingContext2D) => {
    g.moveTo(135, 520);
    g.bezierCurveTo(130, 330, 228, 288, 300, 288); g.bezierCurveTo(372, 288, 470, 330, 465, 520);
    g.bezierCurveTo(462, 650, 478, 782, 494, 890);
    g.quadraticCurveTo(470, 958, 398, 906); g.quadraticCurveTo(349, 962, 300, 906);
    g.quadraticCurveTo(251, 962, 202, 906); g.quadraticCurveTo(130, 958, 106, 890);
    g.bezierCurveTo(122, 782, 138, 650, 135, 520); g.closePath();
  };
  // shrugging arm nubs (behind the body)
  p.ell(92, 585, 58, 32, BONE, OL, 0, 360, -38); p.ell(508, 585, 58, 32, BONE, OL, 0, 360, 38);
  shape(p, body, BONE, OL);
  // paper shading: a soft cool shade down the right side and under the head (clipped to the sheet)
  const g = p.g; g.save(); g.beginPath(); body(g); g.clip();
  const gr = g.createLinearGradient(250, 0, 500, 0); gr.addColorStop(0, "rgba(216,226,242,0)"); gr.addColorStop(1, SHADE);
  g.fillStyle = gr; g.fillRect(0, 280, 600, 700);
  g.restore();
  // sheet folds (thin ink)
  p.stroke([[214, 905], [222, 812], [236, 748]], 5); p.stroke([[392, 905], [384, 820], [372, 760]], 5);
  // face: half-lidded black eyes glancing right, one brow up (skeptical), a lopsided smirk
  for (const [cx, tilt] of [[262, 1], [358, -1]] as [number, number][]) {
    p.ell(cx, 482, 19, 27, INK, 0);
    p.poly([[cx - 26, 446], [cx + 26, 446], [cx + 26, 468 - 3 * tilt], [cx - 26, 468 + 3 * tilt]], BONE, 0);
    p.stroke([[cx - 24, 469 + 3 * tilt], [cx + 24, 469 - 3 * tilt]], 8);
    p.dot(cx + 8, 482, 5.5, "#ffffff");
  }
  p.stroke([[228, 430], [284, 436]], 10);
  p.stroke([[330, 418], [356, 400], [388, 407]], 10);
  p.stroke([[272, 548], [298, 556], [324, 549], [340, 533]], 8);
};
// ================= WINCHESTER hand props (2D cards, ink outlined) =================
/** Sarah's blueprint held up: blue sheet, white plans, a curl at the top (300 x 220) */
export const blueprintCard = (p: Pen) => {
  p.poly([[10, 30], [290, 14], [292, 206], [8, 212]], "#2f6fc4", 7);
  p.g.strokeStyle = "#f4f8ff"; p.g.lineWidth = 4;
  for (const [x, y, w, h] of [[40, 50, 80, 60], [120, 46, 60, 110], [180, 46, 90, 50], [40, 110, 80, 80], [180, 96, 90, 92]]) p.g.strokeRect(x, y, w, h);
  for (let i = 0; i < 5; i++) p.stroke([[140 + i * 10, 186 - i * 12], [150 + i * 10, 186 - i * 12]], 4, "#f4f8ff");
  p.ell(150, 22, 140, 12, "#5f95dc", 6);
};
/** the will: a long parchment unrolled into 13 numbered parts (n = how many show, 0..13), 300 x 900 */
export const scrollCard = (p: Pen, n: number) => {
  const h = 60 + n * 62;
  p.poly([[40, 30], [260, 30], [262, 30 + h], [38, 30 + h]], "#f6e7c4", 7);
  for (let i = 0; i < n; i++) { const y = 50 + i * 62; p.stroke([[60, y + 50], [240, y + 50]], 3, "#b89a64"); p.stroke([[70, y + 18], [210, y + 18]], 5, "#5a4a3a"); p.stroke([[70, y + 34], [180, y + 34]], 4, "#8a7a5a"); }
  p.ell(150, 28, 128, 22, "#e9d7a8", 7); p.ell(150, 34 + h, 128, 22, "#e9d7a8", 7);
};
/** a folded tourist map with a red maze route (220 x 170) */
export const mapCard = (p: Pen) => {
  p.poly([[10, 20], [80, 8], [150, 20], [212, 10], [210, 160], [148, 168], [80, 156], [12, 166]], "#f3ead2", 6);
  p.stroke([[80, 8], [80, 156]], 3, "#c9b890"); p.stroke([[150, 20], [148, 168]], 3, "#c9b890");
  p.line([[30, 140], [30, 60], [110, 60], [110, 120], [70, 120], [70, 90], [180, 90], [180, 30]], "#e8503c", 6, false);
  p.ell(180, 30, 8, 8, "#e8503c", 3);
};
/** a magnifying glass (160 x 220) */
export const magnifierCard = (p: Pen) => { p.line([[110, 120], [150, 210]], "#8a4a24", 18); p.ell(80, 80, 60, 60, "#cfeef7", 10); p.stroke([[50, 60], [64, 46]], 6, "rgba(255,255,255,0.9)"); };
/** a paint roller dripping yellow (200 x 260) */
export const rollerCard = (p: Pen) => { p.poly([[20, 20], [180, 20], [180, 70], [20, 70]], "#f2c23c", 6); p.line([[100, 70], [100, 110], [130, 110], [130, 250]], "#9aa0a6", 8); p.ell(62, 86, 8, 14, "#f2c23c", 4); };
