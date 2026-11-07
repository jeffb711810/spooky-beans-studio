// V3 CARTOON FRAMEWORK (spooky-beans-studio/style/CARTOON_FRAMEWORK.md): the Rick-style face kit, white heads, ink limbs
// and ink-ball hands for every engine card. Ported from studio/tools/v3_lookdev.py (the look the user approved).
// Units: D = head width in design units; face coordinates are in D, origin at the head centre, y down.
import type { Pen } from "./toon";

type P2 = [number, number];
export const V3_SKIN = "#fefbf5";
export const V3_SH = "#d5d5dc"; // skin x (0.84, 0.85, 0.90): blue-grey, never purple
export const V3_INK = "#231810";
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
export const v3HeadFill = (p: Pen, pts: P2[], cx: number, cy: number, R: number, light: number, skin = V3_SKIN) => {
  const g = p.g, lx = Math.cos(light), ly = Math.sin(light), sh = v3mul(skin, [0.84, 0.85, 0.9]);
  const [gx, gy] = p.P(cx + lx * 0.36 * R, cy + ly * 0.36 * R);
  const k = Math.hypot(g.getTransform().a, g.getTransform().b) || 1;
  void k;
  const gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1.5 * R);
  gr.addColorStop(0, skin); gr.addColorStop(0.5, skin); gr.addColorStop(0.74, v3mix(skin, sh, 0.55)); gr.addColorStop(0.92, sh); gr.addColorStop(1, v3mul(sh, [0.97, 0.97, 0.98]));
  p.path(pts, true); g.fillStyle = gr; g.fill();
};

/** ink-ball hand with one tiny pale dot (framework 3) */
export const v3Hand = (p: Pen, x: number, y: number, D: number) => {
  p.dot(x, y, 0.04 * D, V3_INK);
  p.dot(x - 0.0136 * D, y - 0.0136 * D, 0.011 * D, "#ece2d0");
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
export type V3Opts = { yaw: number; look: number; lid: number; talk?: number; browUp?: number; fore?: number; tongue?: number };
export const v3Face = (p: Pen, cx: number, cy: number, D: number, e: string, o: V3Opts) => {
  const yaw = o.yaw, R = 0.5;
  // face-plane (u, v) in D -> design units, wrapped on the head sphere (lon = u / R + yaw)
  const F = (u: number, v: number): P2 => { const lon = u / R + yaw, lat = v / R; return [cx + D * R * Math.cos(lat) * Math.sin(Math.max(-1.55, Math.min(1.55, lon))), cy + D * R * Math.sin(lat)]; };
  const vis = (u: number) => Math.cos(u / R + yaw) > 0.05; // features past the limb are not drawn
  const fill = (pts: P2[], col: string, ol = 0) => { const q = pts.map(([u, v]) => F(u, v)); p.path(q, true); p.g.fillStyle = col; p.g.fill(); if (ol) { p.g.lineWidth = ol * D; p.g.strokeStyle = V3_INK; p.g.lineJoin = "round"; p.g.stroke(); } };
  const line = (pts: P2[], w: number, col = V3_INK) => p.stroke(pts.map(([u, v]) => F(u, v)), w * D, col);
  const brush = (pts: P2[], w: number) => taper(p, pts.map(([u, v]) => F(u, v)), w * D, V3_INK);
  // brows stay under a low hat brim
  const foreV = o.fore !== undefined ? (o.fore - cy) / D + 0.035 : -9;
  const brow = (bx: number, by: number, ang: number, sag: number, ln = 0.095, w = 0.046, wavy = 0) => {
    if (!vis(bx)) return;
    const up = o.browUp && Math.sign(bx) === Math.sign(yaw || 1) ? o.browUp * 0.01 : 0;
    by = Math.max(by - up, foreV);
    const c: P2[] = arc(24, -1, 1).map((t) => { const u = ln * t, v = -sag * (1 - t * t) + wavy * Math.sin(t * Math.PI * 1.5); return [bx + u * Math.cos(ang) - v * Math.sin(ang), by + u * Math.sin(ang) + v * Math.cos(ang)]; });
    brush(c, w);
  };
  const closed = o.lid > 0.55;
  const eyeDot = (ex: number, ey: number, w = 0.09, h = 0.12) => { if (!vis(ex)) return; if (closed) return eyeClosed(ex, ey); fill(arc(40).map((t) => [ex + (w / 2) * Math.cos(t), ey + (h / 2) * Math.sin(t)]), V3_INK); };
  const eyeLid = (ex: number, ey: number, ang = 0, lw = 0.19, dw = 0.095, dh = 0.075, lt = 0.028) => {
    if (!vis(ex)) return;
    const ca = Math.cos(ang), sa = Math.sin(ang), Rt = (u: number, v: number): P2 => [ex + u * ca - v * sa, ey + u * sa + v * ca];
    if (!closed) fill(arc(24, 0, Math.PI).map((t) => Rt((dw / 2) * Math.cos(t), dh * Math.sin(t))), V3_INK);
    line([Rt(-lw / 2, 0.004), Rt(0, -0.004), Rt(lw / 2, 0.004)], lt);
  };
  const eyeRing = (ex: number, ey: number, r = 0.105, look: P2 = [0, 0], pr = 0.03) => {
    if (!vis(ex)) return; if (closed) return eyeClosed(ex, ey);
    const ring = arc(48).map((t) => [ex + r * Math.cos(t), ey + r * Math.sin(t)] as P2);
    fill(ring, WHITE); line(ring, 0.03);
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
  const sweat: [number, number, number][] = [];
  const vein = (vx: number, vy: number, s = 0.075) => { for (const a of [-0.5, 0.6, 2.1]) line(bez2([vx, vy], [vx + 0.55 * s * Math.cos(a + 0.6), vy - 0.55 * s * Math.sin(a + 0.6)], [vx + s * Math.cos(a), vy - s * Math.sin(a)], 10), 0.02); };
  const blush = (ey: number) => { for (const s of [-1, 1]) if (vis(s * 0.21)) fill(arc(24).map((t) => [s * 0.21 + 0.065 * Math.cos(t), ey + 0.105 + 0.035 * Math.sin(t)]), BLUSH); };

  const EX = 0.122, EY = 0.045, S = [-1, 1] as const, lk = Math.max(-1, Math.min(1, o.look)) * 0.022;
  const talk = o.talk ?? 0, talking = talk > 0.12;
  let mouthDone = false;
  const M = (fn: () => void) => { if (!talking) fn(); };
  switch (e) {
    case "smug": case "suspicious":
      for (const s of S) eyeLid(s * EX + lk, EY - 0.02, 0.06 * s);
      brow(-0.13, EY - 0.13, -0.05, 0.01); brow(0.13, EY - 0.19, 0.16, 0.03);
      M(() => line(bez3([-0.07, 0.235], [-0.01, 0.245], [0.06, 0.24], [0.1, 0.205]), 0.03));
      break;
    case "evil":
      for (const s of S) { eyeLid(s * EX + lk, EY - 0.005, -s * 0.3, 0.19, 0.085, 0.06); brow(s * 0.13, EY - 0.115, -s * 0.42, 0); }
      M(() => teeth(0.38, 0.085, 0.2, 0.03, "crescent", 7));
      break;
    case "grin": case "relief_open":
      for (const s of S) { eyeHappy(s * EX, EY - 0.01); brow(s * 0.13, EY - 0.165, s * 0.1, 0.03); }
      M(() => teeth(0.34, 0.12, 0.19, 0, "D", 6));
      break;
    case "nervous":
      for (const s of S) { eyeDot(s * EX + lk, EY - 0.01, 0.085, 0.125); brow(s * 0.135, EY - 0.17, s * 0.34, 0.012); }
      M(() => teeth(0.4, 0.14, 0.19, 0, "D", 6));
      sweat.push([-40, 0.66, 0.075], [215, 0.64, 0.06]);
      break;
    case "stern":
      for (const s of S) { eyeRing(s * 0.115, EY, 0.095, [o.look, 0], 0.026); brow(s * 0.125, EY - 0.135, -s * 0.36, 0); }
      M(() => line([[-0.03, 0.235], [0.03, 0.235]], 0.03));
      break;
    case "angry": case "pained":
      for (const s of S) { if (e === "pained") eyeClosed(s * EX, EY, 0.13, -0.02 * s); else eyeDot(s * EX + lk, EY, 0.085, 0.1); brow(s * 0.125, EY - 0.12, -s * 0.42, 0); }
      M(() => teeth(0.22, 0.09, 0.205, 0, "box", 5, true));
      vein(-0.3, -0.12);
      break;
    case "shock":
      for (const s of S) { eyeRing(s * 0.115, EY - 0.01, 0.105, [o.look, 0]); brow(s * 0.12, EY - 0.2, s * 0.1, 0.035, 0.08); }
      M(() => fill(arc(30).map((t) => [0.042 * Math.cos(t), 0.25 + 0.055 * Math.sin(t)]), V3_INK));
      break;
    case "scream": case "terrified": case "yell":
      for (const s of S) eyeRing(s * 0.118, EY - 0.01, 0.112, [o.look, 0], 0.026);
      brow(-0.13, EY - 0.2, 0.18, 0.02, 0.095, 0.046, 0.012); brow(0.13, EY - 0.215, -0.1, 0.03, 0.095, 0.046, 0.016);
      if (e === "terrified") { M(() => teeth(0.15, 0.085, 0.215, 0, "box", 5, true)); for (const s of S) line(bez2([s * 0.09, 0.3], [s * 0.115, 0.33], [s * 0.08, 0.36], 8), 0.016); }
      else { M(() => openMouth(0.2, 0.15, 0.2, true)); mouthDone = true; }
      vein(-0.3, -0.12); sweat.push([-35, 0.68, 0.075], [-5, 0.72, 0.06], [195, 0.68, 0.07], [160, 0.7, 0.055]);
      break;
    case "laugh":
      for (const s of S) { eyeHappy(s * EX, EY - 0.01); brow(s * 0.13, EY - 0.16, s * 0.12, 0.03); }
      M(() => teeth(0.3, 0.16, 0.185, 0, "D", 6, false, true)); blush(EY);
      break;
    case "worried": case "sad": case "cry":
      for (const s of S) { if (e === "cry") eyeClosed(s * EX, EY, 0.13, 0.012 * s); else eyeDot(s * EX + lk, EY); brow(s * 0.135, EY - 0.165, s * 0.34, 0.015); }
      M(() => e === "worried" ? line([[-0.05, 0.24], [-0.017, 0.23], [0.017, 0.24], [0.05, 0.23]], 0.028) : line(bez2([-0.06, 0.25], [0, 0.215], [0.06, 0.25], 12), 0.03));
      if (e !== "worried") for (const s of S) if (vis(s * EX)) { // tears: a drop under each eye, tip up
        const [tx, ty] = F(s * (EX + 0.01), EY + 0.15), r = 0.032 * D;
        p.path([...arc(16, 0, Math.PI).map((t) => [tx + r * Math.cos(t), ty + r * Math.sin(t)] as P2), [tx, ty - 2.2 * r]], true);
        p.g.fillStyle = SWEAT; p.g.fill(); p.g.lineWidth = 0.014 * D; p.g.strokeStyle = V3_INK; p.g.stroke();
      }
      break;
    case "dazed":
      for (const s of S) { eyeClosed(s * EX, EY, 0.13, 0.012 * s); brow(s * 0.13, EY - 0.13, s * 0.28, 0.01); }
      M(() => line([[-0.05, 0.24], [-0.017, 0.23], [0.017, 0.24], [0.05, 0.23]], 0.026));
      break;
    case "whistle":
      for (const s of S) { eyeLid(s * EX + lk, EY - 0.02); brow(s * 0.13, EY - 0.17, 0, 0.02); }
      M(() => { const ring = arc(24).map((t) => [0.03 * Math.cos(t), 0.235 + 0.035 * Math.sin(t)] as P2); fill(ring, MOUTH_IN, 0.024); });
      break;
    case "relief": case "smile_closed":
      for (const s of S) { eyeHappy(s * EX, EY - 0.01); brow(s * 0.13, EY - 0.165, s * 0.08, 0.025); }
      M(() => line(bez2([-0.08, 0.215], [0, 0.265], [0.08, 0.215], 14), 0.03));
      break;
    case "smile": case "lick":
      for (const s of S) { eyeDot(s * EX + lk, EY); brow(s * 0.13, EY - 0.165, 0, 0.02); }
      M(() => line(bez2([-0.075, 0.22], [0, 0.26], [0.075, 0.22], 14), 0.03));
      break;
    default: // neutral
      for (const s of S) { eyeDot(s * EX + lk, EY); brow(s * 0.13, EY - 0.165, 0, 0.02); }
      M(() => line(bez2([-0.06, 0.225], [0, 0.25], [0.06, 0.225], 14), 0.03));
  }
  // talking: the mouth changes on twos (the stage samples the voice envelope); 3 sizes, dark inside
  if (talking && !mouthDone) {
    if (talk < 0.45) openMouth(0.13, 0.055, 0.21);
    else if (talk < 0.8) openMouth(0.17, 0.09, 0.205, true);
    else openMouth(0.21, 0.13, 0.2, true);
  }
  // sweat / tears fly off the head (drawn last: over hats)
  for (const [phi, r, sz] of sweat) {
    const a = (phi * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), x0 = r * ca, y0 = r * sa;
    const loc: P2[] = [...arc(16, -Math.PI / 2, Math.PI / 2).map((t) => [0.5 * Math.cos(t), 0.5 * Math.sin(t)] as P2), [-1.5, 0]];
    const q = loc.map(([u, v]) => [cx + D * (x0 + sz * (u * ca - v * sa)), cy + D * (y0 + sz * (u * sa + v * ca))] as P2);
    p.path(q, true); p.g.fillStyle = SWEAT; p.g.fill(); p.g.lineWidth = 0.016 * D; p.g.strokeStyle = V3_INK; p.g.stroke();
  }
};
