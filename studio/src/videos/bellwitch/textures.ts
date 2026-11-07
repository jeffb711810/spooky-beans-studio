// PAINTED TEXTURES (owner: textures agent). Hand-painted canvas textures for every surface of the Bell farm.
// Style: flat painted colour fields with per-plank / per-tile colour jitter, soft broad drift, thin dark painted seams
// (thinner and lighter than the geometry ink), no photographic noise. Every tiling texture is seamless in x and y.
import { ctex, jit, rng, planksHD } from "../bridge/paint";

type R = () => number;
type G = CanvasRenderingContext2D;
type Op = () => void;
const TAU = Math.PI * 2;
const U = (r: R, a: number, b: number) => a + (b - a) * r();
const pick = <T,>(r: R, a: T[]) => a[Math.floor(r() * a.length) % a.length];
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** own seed per key (ctex seeds by key length + first char, so quiltA / quiltB would share a layout) */
const seedOf = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h + 1; };
const rgbOf = (hex: string) => { const n = parseInt(hex.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
/** hex colour scaled by k, as css rgba */
const mul = (hex: string, k: number, a = 1) => {
  const c = rgbOf(hex).map((v) => Math.round(clamp(v * k, 0, 255)));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
};
const lum = (hex: string) => { const [a, b, c] = rgbOf(hex); return 0.3 * a + 0.59 * b + 0.11 * c; };
/** run the recorded draw ops again one tile over in x (and y) so marks that cross an edge wrap seamlessly */
const tileX = (g: G, W: number, ops: Op[]) => { for (const o of [-W, 0, W]) { g.save(); g.translate(o, 0); ops.forEach((f) => f()); g.restore(); } };
const tile2 = (g: G, W: number, H: number, ops: Op[]) => {
  for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) { g.save(); g.translate(ox, oy); ops.forEach((f) => f()); g.restore(); }
};
/** soft elliptical blotch (radial gradient) stretched sx along x */
const blotch = (g: G, x: number, y: number, rad: number, sx: number, rgb: string, a: number) => {
  g.save(); g.translate(x, y); g.scale(sx, 1);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(-rad, -rad, rad * 2, rad * 2);
  g.restore();
};
/** periodic 1-D value noise in [-1, 1] over x in [0, 1) */
const pn1 = (r: R, n: number) => {
  const v = Array.from({ length: n }, () => r() * 2 - 1);
  return (x: number) => {
    const f = (x - Math.floor(x)) * n, i = Math.floor(f), t = f - i, s = t * t * (3 - 2 * t);
    return v[i % n] * (1 - s) + v[(i + 1) % n] * s;
  };
};
/** periodic 2-D value noise in [0, 1] over (x, y) in [0, 1)^2 */
const pn2 = (r: R, n: number) => {
  const v = new Float32Array(n * n); for (let i = 0; i < n * n; i++) v[i] = r();
  return (x: number, y: number) => {
    const fx = (x - Math.floor(x)) * n, fy = (y - Math.floor(y)) * n, ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const i0 = ix % n, i1 = (ix + 1) % n, j0 = (iy % n) * n, j1 = ((iy + 1) % n) * n;
    const a = v[j0 + i0] + (v[j0 + i1] - v[j0 + i0]) * sx, b = v[j1 + i0] + (v[j1 + i1] - v[j1 + i0]) * sx;
    return a + (b - a) * sy;
  };
};
/** long wavy stroke along +x (wood grain), offsets drawn up front */
const grainOp = (g: G, r: R, x: number, y: number, len: number, amp: number, lw: number, col: string): Op => {
  const n = Math.max(2, Math.round(len / 160)), dy = Array.from({ length: n + 1 }, () => (r() - 0.5) * 2 * amp);
  return () => {
    g.strokeStyle = col; g.lineWidth = lw; g.lineCap = "round";
    g.beginPath(); g.moveTo(x, y + dy[0]);
    for (let i = 1; i <= n; i++) { const x1 = x + (len * i) / n; g.quadraticCurveTo(x1 - len / n / 2, y + (dy[i - 1] + dy[i]) / 2 + (i % 2 ? 0.4 : -0.4) * amp, x1, y + dy[i]); }
    g.stroke();
  };
};

/** horizontal hewn logs with daubed chinking, 8 logs per tile (tile = 2.4 m: 0.3 m courses, 853 texels/m).
 *  Per log: own colour, broad drift, adze scallops, grain, drying checks, knots with rings, a few spliced butt
 *  joints showing a sliver of end grain; the chinking is shadowed under each log and inked along both edges. */
/** style C (user: simplified, clean like the reference): smooth colour fields + clean seams; no specks, straw, cracks,
 *  knots, adze facets or heavy grain on the walls, roof and ground */
const CLEAN = true;
export const logsTex = (key = "logs", base = "#8a6143") => ctex(key + (CLEAN ? "_c" : ""), 2048, 2048, (g) => {
  const W = 2048, n = 8, h = W / n, r = rng(seedOf(key));
  // chinking: lime + clay daub, mottled, with straw flecks and pits (only the bands between logs show)
  g.fillStyle = "#c3b499"; g.fillRect(0, 0, W, W);
  const daub: Op[] = [];
  for (let k = 0; k < (CLEAN ? 90 : 700); k++) {
    const x = r() * W, y = Math.floor(r() * n) * h + U(r, -32, 32), rad = U(r, 5, 22);
    const c = pick(r, ["238,228,206", "142,126,102", "212,200,176", "124,108,88"]), a = U(r, 0.15, 0.4);
    daub.push(() => blotch(g, x, y, rad, 1.9, c, a));
  }
  for (let k = 0; k < (CLEAN ? 0 : 520); k++) {
    const x = r() * W, y = Math.floor(r() * n) * h + U(r, -30, 30), rad = U(r, 0.8, 2.2), dark = r() < 0.7;
    daub.push(() => { g.fillStyle = dark ? "rgba(62,48,36,0.55)" : "rgba(250,244,228,0.6)"; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); });
  }
  for (let k = 0; k < (CLEAN ? 0 : 140); k++) {
    const x = r() * W, y = Math.floor(r() * n) * h + U(r, -26, 26), l = U(r, 6, 16), a = U(r, -0.5, 0.5);
    daub.push(() => { g.strokeStyle = "rgba(196,164,102,0.55)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); });
  }
  tile2(g, W, W, daub);

  for (let i = 0; i < n; i++) {
    const yT = i * h, et = pn1(r, 6), eb = pn1(r, 7), et2 = pn1(r, 23), eb2 = pn1(r, 29);
    const top = (x: number) => yT + 20 + 6 * et(x / W) + 2.2 * et2(x / W);
    const bot = (x: number) => yT + h - 18 + 6 * eb(x / W) + 2.2 * eb2(x / W);
    const col = jit(r, base, 0.09, 4, 0.14), y0 = yT + 14, y1 = yT + h - 12, ym = (y0 + y1) / 2;
    const path = () => {
      g.beginPath(); g.moveTo(0, top(0));
      for (let x = 16; x <= W; x += 16) g.lineTo(x, top(x));
      for (let x = W; x >= 0; x -= 16) g.lineTo(x, bot(x));
      g.closePath();
    };
    // the shadow the log throws on the chinking under it
    g.strokeStyle = "rgba(34,22,16,0.32)"; g.lineWidth = 12;
    g.beginPath(); for (let x = 0; x <= W; x += 16) g[x ? "lineTo" : "moveTo"](x, bot(x) + 5); g.stroke();
    // body: hewn face, rounding over at both edges (light lip on top, darker roll underneath)
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, mul(col, 1.2)); gr.addColorStop(0.1, mul(col, 1.06)); gr.addColorStop(0.5, mul(col, 1));
    gr.addColorStop(0.78, mul(col, 0.88)); gr.addColorStop(1, mul(col, 0.58));
    path(); g.fillStyle = gr; g.fill();
    const ops: Op[] = [];
    for (let k = 0; k < 9; k++) { // broad tonal drift along the log
      const x = r() * W, y = U(r, y0 + 30, y1 - 30), rad = U(r, 50, 130), lt = r() < 0.5, a = U(r, 0.07, 0.13);
      ops.push(() => blotch(g, x, y, rad, 4, lt ? "255,226,190" : "38,20,10", a));
    }
    for (let x = U(r, 0, 60); x < (CLEAN ? 0 : W); x += U(r, 70, 150)) { // adze scallops (hewn facets)
      const bend = U(r, 10, 22), xx = x, t0 = y0 + U(r, 10, 30), t1 = y1 - U(r, 12, 30);
      ops.push(() => {
        g.lineCap = "round";
        g.strokeStyle = "rgba(255,232,200,0.09)"; g.lineWidth = 7;
        g.beginPath(); g.moveTo(xx, t0); g.quadraticCurveTo(xx + bend, (t0 + t1) / 2, xx, t1); g.stroke();
        g.strokeStyle = "rgba(40,22,12,0.11)"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(xx + 5, t0); g.quadraticCurveTo(xx + bend + 5, (t0 + t1) / 2, xx + 5, t1); g.stroke();
      });
    }
    for (let k = 0; k < (CLEAN ? 5 : 24); k++) { // grain
      const dark = r() < 0.66;
      ops.push(grainOp(g, r, r() * W, U(r, y0 + 10, y1 - 8), U(r, 260, 1100), U(r, 1.5, 4.5), U(r, 1.4, 3),
        dark ? `rgba(46,26,16,${U(r, 0.16, 0.28).toFixed(2)})` : `rgba(255,232,200,${U(r, 0.08, 0.14).toFixed(2)})`));
    }
    for (let k = 0, nc = CLEAN ? 0 : 1 + Math.floor(r() * 3); k < nc; k++) { // drying checks: thin dark cracks with a light lip
      const x = r() * W, y = U(r, y0 + 25, y1 - 30), len = U(r, 160, 620);
      const crack = grainOp(g, r, x, y, len, 2.5, 2.4, "rgba(22,12,8,0.72)");
      const lip = grainOp(g, r, x + 10, y + 2.6, len - 20, 1, 1.4, "rgba(255,230,200,0.16)");
      ops.push(crack, lip);
    }
    for (let k = 0, nk = r() < 0.75 && !CLEAN ? 1 + Math.floor(r() * 2) : 0; k < nk; k++) { // knots: dark core, rings, grain swirling round
      const kx = r() * W, ky = U(r, y0 + 40, y1 - 40), rx = U(r, 7, 13), ry = rx * U(r, 0.55, 0.75);
      ops.push(() => {
        blotch(g, kx, ky, rx * 3.2, 1.6, "255,228,192", 0.12);
        g.strokeStyle = "rgba(44,26,16,0.30)"; g.lineWidth = 2;
        for (const s of [3.6, 2.6]) { g.beginPath(); g.ellipse(kx, ky, rx * s, ry * s * 0.8, 0, 0, TAU); g.stroke(); }
        for (const sg of [-1, 1]) {
          g.beginPath(); g.moveTo(kx - rx * 8, ky + sg * ry * 1.2);
          g.quadraticCurveTo(kx, ky + sg * ry * 4.6, kx + rx * 8, ky + sg * ry * 1.2); g.stroke();
        }
        g.fillStyle = "#3a2318"; g.beginPath(); g.ellipse(kx, ky, rx, ry, 0, 0, TAU); g.fill();
        g.strokeStyle = "rgba(20,10,6,0.8)"; g.lineWidth = 1.6; g.beginPath(); g.ellipse(kx, ky, rx * 1.5, ry * 1.5, 0, 0, TAU); g.stroke();
        g.fillStyle = "rgba(120,72,40,0.7)"; g.beginPath(); g.ellipse(kx - rx * 0.2, ky - ry * 0.2, rx * 0.4, ry * 0.35, 0, 0, TAU); g.fill();
      });
    }
    if (r() < 0.35 && !CLEAN) { // spliced butt joint: one log end stands proud and shows a sliver of end grain
      const sx = r() * W, sw = U(r, 12, 18), ec = mul(col, 1.28), wob = U(r, -4, 4);
      ops.push(() => {
        g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(sx - 8, y0 - 10, 8, y1 - y0 + 20);
        g.fillStyle = ec; g.beginPath(); g.moveTo(sx, y0 - 10); g.lineTo(sx + sw, y0 - 10); g.lineTo(sx + sw + wob, y1 + 10); g.lineTo(sx + wob, y1 + 10); g.fill();
        g.strokeStyle = "rgba(70,40,22,0.42)"; g.lineWidth = 1.5;
        for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(sx + sw + 90, ym, 90 + k * 6 - sw, Math.PI * 0.82, Math.PI * 1.18); g.stroke(); }
        g.strokeStyle = "rgba(20,12,8,0.85)"; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, y0 - 10); g.lineTo(sx + wob, y1 + 10); g.stroke();
      });
    }
    g.save(); path(); g.clip(); tileX(g, W, ops);
    // light lip along the top edge
    g.strokeStyle = "rgba(255,234,204,0.20)"; g.lineWidth = 3;
    g.beginPath(); for (let x = 0; x <= W; x += 16) g[x ? "lineTo" : "moveTo"](x, top(x) + 4); g.stroke();
    g.restore();
    // painted seams: firm under the log (shadow side), lighter on top
    g.lineJoin = "round";
    g.strokeStyle = "rgba(24,14,10,0.82)"; g.lineWidth = 3.6;
    g.beginPath(); for (let x = 0; x <= W; x += 16) g[x ? "lineTo" : "moveTo"](x, bot(x)); g.stroke();
    g.strokeStyle = "rgba(34,20,14,0.5)"; g.lineWidth = 2.4;
    g.beginPath(); for (let x = 0; x <= W; x += 16) g[x ? "lineTo" : "moveTo"](x, top(x)); g.stroke();
  }
});

type Fab = { col: string; print: number; pc: string };
type Pt = [number, number];
/** patchwork quilt, mapped once over the quilt top (about 1.6:1): binding + printed border, 8 x 5 blocks that alternate
 *  pieced blocks (Ohio star, pinwheel, nine-patch, hourglass, log cabin, broken dishes) with plain blocks quilted in a
 *  stitched wreath. Fabrics are calico dots, florets, pin stripes or sprigs; seams are thin, stitches are dashed. */
export const quiltTex = (key: string, cols: string[]) => ctex("quilt" + key + (CLEAN ? "_c" : ""), 2048, 1280, (g) => {
  const W = 2048, H = 1280, r = rng(seedOf("quilt" + key)), B = 64, nx = 8, ny = 5, bw = (W - 2 * B) / nx, bh = (H - 2 * B) / ny;
  const byL = [...cols].sort((a, b) => lum(b) - lum(a));
  const light = byL[0], darkest = byL[byL.length - 1], others = byL.slice(1);
  const mkFab = (col: string, print: number): Fab => {
    const c = jit(r, col, 0.05, 3, 0.08);
    return { col: c, print, pc: lum(c) > 150 ? mul(c, 0.74, 0.9) : mul(c, 1.42, 0.8) };
  };
  const fabs = others.flatMap((c) => [mkFab(c, 0), mkFab(c, 1 + Math.floor(r() * 3))]);
  const bgF = mkFab(light, 3), bgF2 = mkFab(light, 0);
  const printIn = (f: Fab, x0: number, y0: number, w: number, h: number) => {
    g.fillStyle = f.col; g.fillRect(x0, y0, w, h);
    if (CLEAN) return; // style C: flat patches (no calico dots, florets, pin stripes or sprigs)
    g.fillStyle = f.pc; g.strokeStyle = f.pc; g.beginPath();
    if (f.print === 0) { // calico dots
      for (let y = y0 + 4, row = 0; y < y0 + h + 6; y += 12, row++) for (let x = x0 + (row % 2) * 6; x < x0 + w + 6; x += 12) { g.moveTo(x + 2.3, y); g.arc(x, y, 2.3, 0, TAU); }
      g.fill();
    } else if (f.print === 1) { // tiny four-petal florets
      for (let y = y0 + 6, row = 0; y < y0 + h + 8; y += 18, row++) for (let x = x0 + (row % 2) * 9; x < x0 + w + 8; x += 18)
        for (let q = 0; q < 4; q++) { const a = (q * TAU) / 4 + 0.4, px = x + Math.cos(a) * 3.3, py = y + Math.sin(a) * 3.3; g.moveTo(px + 1.9, py); g.arc(px, py, 1.9, 0, TAU); }
      g.fill();
    } else if (f.print === 2) { // diagonal pin stripes
      for (let k = -h; k < w; k += 11) { g.moveTo(x0 + k, y0 + h); g.lineTo(x0 + k + h, y0); }
      g.lineWidth = 2; g.stroke();
    } else { // tone-on-tone sprigs
      for (let y = y0 + 5, row = 0; y < y0 + h + 6; y += 16, row++) for (let x = x0 + (row % 2) * 8; x < x0 + w + 6; x += 16) { g.moveTo(x, y); g.lineTo(x + 5, y - 3); g.moveTo(x + 2, y - 1); g.lineTo(x + 3, y + 3); }
      g.lineWidth = 1.5; g.stroke();
    }
  };
  const poly = (pts: Pt[]) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); };
  const patch = (pts: Pt[], f: Fab) => {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
    g.save(); poly(pts); g.clip(); printIn(f, x0 - 1, y0 - 1, Math.max(...xs) - x0 + 2, Math.max(...ys) - y0 + 2); g.restore();
    poly(pts); g.strokeStyle = "rgba(40,24,32,0.38)"; g.lineWidth = 2; g.stroke();
  };
  const rect = (x: number, y: number, w: number, h: number, f: Fab) => patch([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], f);
  const cellTris = (x: number, y: number, w: number, h: number) => { // top, right, bottom, left triangles of a cell
    const c: Pt[] = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m: Pt = [x + w / 2, y + h / 2];
    return [0, 1, 2, 3].map((q) => [c[q], c[(q + 1) % 4], m] as Pt[]);
  };
  const stitch = (draw: () => void, onDark: boolean) => {
    if (CLEAN) return; // style C: no quilting stitches
    g.save(); g.setLineDash([9, 7]); g.lineCap = "round"; g.lineWidth = 2.2;
    g.strokeStyle = onDark ? "rgba(248,236,212,0.55)" : "rgba(92,62,58,0.42)"; draw(); g.stroke(); g.restore();
  };
  // border print + dark binding
  const borderF = fabs[Math.floor(r() * fabs.length)];
  printIn(borderF, 0, 0, W, H);
  g.strokeStyle = mul(jit(r, darkest, 0.05), 0.9); g.lineWidth = 44; g.strokeRect(0, 0, W, H);
  g.strokeStyle = "rgba(30,16,24,0.5)"; g.lineWidth = 2.5; g.strokeRect(22, 22, W - 44, H - 44);
  stitch(() => { g.beginPath(); g.rect(43, 43, W - 86, H - 86); }, lum(borderF.col) < 150);
  let last = -1;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = B + i * bw, y = B + j * bh;
    const fA = pick(r, fabs); let fB = pick(r, fabs); if (fB.col === fA.col) fB = fabs[(fabs.indexOf(fB) + 2) % fabs.length];
    let fC = pick(r, fabs); if (fC.col === fA.col || fC.col === fB.col) fC = fabs[(fabs.indexOf(fC) + 3) % fabs.length];
    const bg = r() < 0.5 ? bgF : bgF2;
    if ((i + j) % 2 === 1) { // plain setting block with a quilted wreath
      const f = r() < 0.35 ? bg : fA; rect(x, y, bw, bh, f);
      const cx = x + bw / 2, cy = y + bh / 2, rad = Math.min(bw, bh) * 0.3;
      stitch(() => {
        g.beginPath(); g.arc(cx, cy, rad, 0, TAU); g.moveTo(cx + rad * 0.55, cy); g.arc(cx, cy, rad * 0.55, 0, TAU);
        for (let q = 0; q < 8; q++) { const a = (q * TAU) / 8; g.moveTo(cx + Math.cos(a) * rad * 0.55, cy + Math.sin(a) * rad * 0.55); g.quadraticCurveTo(cx + Math.cos(a + 0.4) * rad * 1.15, cy + Math.sin(a + 0.4) * rad * 1.15, cx + Math.cos(a + 0.79) * rad, cy + Math.sin(a + 0.79) * rad); }
      }, lum(f.col) < 150);
    } else {
      let t = Math.floor(r() * 6); if (t === last) t = (t + 1) % 6; last = t;
      if (t === 0) { // Ohio star
        const cw = bw / 3, ch = bh / 3;
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
          const cx = x + a * cw, cy = y + b * ch;
          if (a !== 1 && b !== 1) rect(cx, cy, cw, ch, bg);
          else if (a === 1 && b === 1) rect(cx, cy, cw, ch, fA);
          else {
            const tr = cellTris(cx, cy, cw, ch), outer = b === 0 ? 0 : a === 2 ? 1 : b === 2 ? 2 : 3;
            tr.forEach((p, q) => patch(p, q === outer ? bg : q === (outer + 2) % 4 ? fB : fC));
          }
        }
      } else if (t === 1) { // pinwheel
        const cw = bw / 2, ch = bh / 2, order = [0, 1, 3, 2];
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
          const cx = x + a * cw, cy = y + b * ch, c: Pt[] = [[cx, cy], [cx + cw, cy], [cx + cw, cy + ch], [cx, cy + ch]], q = order[b * 2 + a];
          patch([c[q], c[(q + 1) % 4], c[(q + 2) % 4]], fA); patch([c[(q + 2) % 4], c[(q + 3) % 4], c[q]], bg);
        }
      } else if (t === 2) { // nine-patch
        const cw = bw / 3, ch = bh / 3;
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) rect(x + a * cw, y + b * ch, cw, ch, a === 1 && b === 1 ? fB : (a + b) % 2 ? bg : fA);
      } else if (t === 3) { // hourglass
        const cw = bw / 2, ch = bh / 2;
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) cellTris(x + a * cw, y + b * ch, cw, ch).forEach((p, q) => patch(p, (q + a + b) % 2 ? bg : (a + b) % 2 ? fB : fA));
      } else if (t === 4) { // log cabin (red-ish hearth centre, light and dark halves)
        const sx = bw / 8, sy = bh / 8, lt = [bg, bgF2.col === bg.col ? bgF : bgF2], dk = [fA, fB, fC];
        for (let k = 0; k < 3; k++) {
          rect(x + k * sx, y + k * sy, (8 - 2 * k) * sx, sy, lt[k % 2]);
          rect(x + (7 - k) * sx, y + (k + 1) * sy, sx, (7 - 2 * k) * sy, dk[k % 3]);
          rect(x + k * sx, y + (7 - k) * sy, (7 - 2 * k) * sx, sy, dk[(k + 1) % 3]);
          rect(x + k * sx, y + (k + 1) * sy, sx, (6 - 2 * k) * sy, lt[(k + 1) % 2]);
        }
        rect(x + 3 * sx, y + 3 * sy, 2 * sx, 2 * sy, fabs[0]);
      } else { // broken dishes: 4 x 4 half-square triangles
        const cw = bw / 4, ch = bh / 4;
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
          const cx = x + a * cw, cy = y + b * ch, c: Pt[] = [[cx, cy], [cx + cw, cy], [cx + cw, cy + ch], [cx, cy + ch]], q = (a + b) % 2;
          patch([c[q], c[q + 1], c[(q + 2) % 4]], b % 2 ? fB : fA); patch([c[(q + 2) % 4], c[(q + 3) % 4], c[q]], bg);
        }
      }
      stitch(() => { g.beginPath(); g.rect(x + 10, y + 10, bw - 20, bh - 20); }, false);
    }
    // pillowy quilting: light centre, darker towards the seams
    const pg = g.createRadialGradient(x + bw / 2, y + bh / 2, 0, x + bw / 2, y + bh / 2, Math.max(bw, bh) * 0.72);
    pg.addColorStop(0, "rgba(255,246,230,0.09)"); pg.addColorStop(0.55, "rgba(0,0,0,0)"); pg.addColorStop(1, "rgba(26,12,24,0.22)");
    g.fillStyle = pg; g.fillRect(x, y, bw, bh);
  }
  g.strokeStyle = "rgba(30,16,26,0.5)"; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i <= nx; i++) { g.moveTo(B + i * bw, B); g.lineTo(B + i * bw, H - B); }
  for (let j = 0; j <= ny; j++) { g.moveTo(B, B + j * bh); g.lineTo(W - B, B + j * bh); }
  g.stroke();
});

/** weathered cedar shingles, 8 staggered courses per 1.2 m tile (0.15 m exposure), random widths 6-18 cm.
 *  Canvas y runs down-slope (v = 0 at the eave). Per shingle: own tone (brown cedar to silvered grey), vertical grain,
 *  shadow from the course above, a pale weathered butt with a dark edge, splits, chipped corners, moss and lichen. */
export const shinglesTex = () => ctex(CLEAN ? "shingles_c2" : "shingles", 1024, 1024, (g) => {
  const W = 1024, n = 8, h = W / n, r = rng(seedOf("shingles"));
  // SMOOTH roof (user: the cabin looked jagged): soft mid-grey joints instead of near-black gaps (they aliased into
  // a busy flicker), wider tabs, calmer tones
  g.fillStyle = CLEAN ? "#3a3a35" : "#18181a"; g.fillRect(0, 0, W, W);
  // weathered grey cedar (green >= red): warm browns turned mauve/purple under the blue moonlight (user, example 3)
  const tones = ["#5c5a4e", "#605d50", "#585649", "#5e5c52", "#555447", "#5b5a4f"];
  const ops: Op[] = [], moss: Op[] = [];
  for (let row = 0; row < n; row++) {
    const y0 = row * h, xs = U(r, 0, 140);
    let x = xs;
    while (x < xs + W - 1) {
      let w = CLEAN ? U(r, 110, 220) : U(r, 50, 150); if (xs + W - (x + w) < 45) w = xs + W - x;
      const x0 = x + U(r, 1.2, 2.4), x1 = x + w - U(r, 1.2, 2.4), yl = y0 + h - U(r, 1.5, 5), yr = y0 + h - U(r, 1.5, 5);
      const col = CLEAN ? jit(r, pick(r, tones), 0.02, 1, 0.03) : jit(r, pick(r, tones), 0.05, 3, 0.08), chip = !CLEAN && r() < 0.15 ? U(r, 6, 14) * (r() < 0.5 ? -1 : 1) : 0;
      const grains = Array.from({ length: CLEAN ? 1 + Math.floor(r() * 2) : 4 + Math.floor(r() * 6) }, () => [U(r, x0 + 3, x1 - 3), y0 + U(r, 0, 50), U(r, -3, 3), r() < 0.6 ? 1 : 0, U(r, 0.9, 2)]);
      const split = r() < 0.18 && !CLEAN ? [U(r, x0 + 8, x1 - 8), U(r, 30, 80)] : null;
      const silver = r() < 0.3 ? [U(r, x0, x1), U(r, 0.05, 0.1)] : null;
      const stain = r() < 0.3 ? [U(r, x0 + 5, x1 - 5), U(r, 8, 22)] : null;
      const lichen = r() < 0.22 && !CLEAN ? Array.from({ length: 2 + Math.floor(r() * 4) }, () => [U(r, x0 + 4, x1 - 4), y0 + U(r, 25, h - 12), U(r, 1.5, 3.2)]) : [];
      const mossD = r() < 0.13 && !CLEAN ? Array.from({ length: 6 + Math.floor(r() * 9) }, () => [U(r, x0, x1), U(r, -12, 2), U(r, 1.8, 4.5), Math.floor(r() * 3)]) : [];
      ops.push(() => {
        g.save(); g.beginPath(); g.moveTo(x0, y0 - 2); g.lineTo(x1, y0 - 2);
        if (chip > 0) { g.lineTo(x1, yr - chip); g.lineTo(x1 - chip, yr); } else g.lineTo(x1, yr);
        if (chip < 0) { g.lineTo(x0 - chip, yl); g.lineTo(x0, yl + chip); } else g.lineTo(x0, yl);
        g.closePath(); g.fillStyle = col; g.fill(); g.clip();
        if (silver) blotch(g, silver[0], y0 + h * 0.7, 40, 0.7, "196,192,186", silver[1]);
        if (stain) { const sg = g.createLinearGradient(0, yl, 0, y0 + 20); sg.addColorStop(0, "rgba(26,18,14,0.22)"); sg.addColorStop(1, "rgba(26,18,14,0)"); g.fillStyle = sg; g.fillRect(stain[0] - stain[1], y0, stain[1] * 2, h); }
        g.lineCap = "round";
        for (const [gx, gy, dx, dk, lw] of grains) {
          g.strokeStyle = dk ? "rgba(30,20,15,0.24)" : "rgba(232,222,206,0.13)"; g.lineWidth = lw;
          g.beginPath(); g.moveTo(gx, gy); g.quadraticCurveTo(gx + dx, (gy + yl) / 2, gx + dx * 0.4, yl - 4); g.stroke();
        }
        const sg = g.createLinearGradient(0, y0, 0, y0 + 24); sg.addColorStop(0, "rgba(14,9,7,0.6)"); sg.addColorStop(1, "rgba(14,9,7,0)");
        g.fillStyle = sg; g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, 27);
        g.fillStyle = "rgba(236,224,206,0.11)"; g.fillRect(x0, Math.min(yl, yr) - 13, x1 - x0, 8);
        if (split) { g.strokeStyle = "rgba(16,10,8,0.85)"; g.lineWidth = 2; g.beginPath(); g.moveTo(split[0], yl); g.lineTo(split[0] + 2, yl - split[1]); g.stroke(); }
        for (const [lx, ly, lr] of lichen) { g.fillStyle = "rgba(184,186,160,0.55)"; g.beginPath(); g.arc(lx, ly, lr, 0, TAU); g.fill(); }
        g.strokeStyle = "rgba(18,12,10,0.66)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, yl - 1); g.lineTo(x1, yr - 1); g.stroke();
        g.restore();
      });
      if (mossD.length) moss.push(() => {
        for (const [mx, my, mr, mc] of mossD) { g.fillStyle = ["rgba(86,101,58,0.75)", "rgba(107,122,68,0.7)", "rgba(71,85,47,0.8)"][mc]; g.beginPath(); g.arc(mx, yl + my, mr, 0, TAU); g.fill(); }
      });
      x += w;
    }
  }
  tileX(g, W, ops); tile2(g, W, W, moss);
});

/** packed yard dirt (2 m tile): flat, low-noise colour field with broad warm/cool drift, damp and dry patches, sparse
 *  pebbles (lit top, shadowed underside), crumbs, straw and a few grass tufts */
export const dirtTex = () => ctex(CLEAN ? "dirt_c" : "dirt", 1024, 1024, (g) => {
  const W = 1024, r = rng(seedOf("dirt")), n1 = pn2(r, 4), n2 = pn2(r, 9), n3 = pn2(r, 23), nh = pn2(r, 6);
  const img = g.createImageData(W, W), d = img.data, base = [107, 84, 64];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / W, a = n1(u, v) * 0.5 + n2(u, v) * 0.32 + n3(u, v) * 0.18 - 0.5, b = nh(u, v) - 0.5;
    const k = 1 + a * (CLEAN ? 0.2 : 0.34) + (r() - 0.5) * (CLEAN ? 0.01 : 0.035), i = (y * W + x) * 4;
    d[i] = base[0] * k * (1 + b * 0.07); d[i + 1] = base[1] * k; d[i + 2] = base[2] * k * (1 - b * 0.12); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const ops: Op[] = [];
  for (let k = 0; k < 22; k++) {
    const x = r() * W, y = r() * W, rad = U(r, 50, 140), damp = k % 2 === 0, a = U(r, 0.1, 0.18);
    ops.push(() => blotch(g, x, y, rad, 1.6, damp ? "42,30,22" : "186,158,120", a));
  }
  for (let k = 0; k < (CLEAN ? 0 : 1000); k++) {
    const x = r() * W, y = r() * W, rad = U(r, 0.8, 1.9), dark = r() < 0.6;
    ops.push(() => { g.fillStyle = dark ? "rgba(42,30,22,0.4)" : "rgba(196,172,138,0.2)"; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); });
  }
  for (let k = 0; k < (CLEAN ? 0 : 30); k++) {
    const x = r() * W, y = r() * W, l = U(r, 8, 22), a = r() * TAU, twig = r() < 0.35, lw = U(r, 1.2, 2);
    ops.push(() => { g.strokeStyle = twig ? "rgba(55,38,26,0.6)" : "rgba(200,172,112,0.55)"; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); });
  }
  const pcols = ["#80776c", "#8c7f6c", "#71665b", "#968a76", "#675e57", "#857865"];
  for (let k = 0; k < (CLEAN ? 28 : 110); k++) {
    const x = r() * W, y = r() * W, rad = U(r, 2.5, 8), q = U(r, 0.6, 0.9), rot = r() * TAU, c = jit(r, pick(r, pcols), 0.08);
    ops.push(() => {
      g.fillStyle = "rgba(26,16,10,0.5)"; g.beginPath(); g.ellipse(x + 1.4, y + 2, rad, rad * q, rot, 0, TAU); g.fill();
      g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rad, rad * q, rot, 0, TAU); g.fill();
      g.fillStyle = "rgba(255,246,226,0.18)"; g.beginPath(); g.ellipse(x - rad * 0.3, y - rad * 0.32, rad * 0.42, rad * 0.3 * q, rot, 0, TAU); g.fill();
    });
  }
  for (let k = 0; k < 16; k++) {
    const x = r() * W, y = r() * W, blades = Array.from({ length: 4 + Math.floor(r() * 4) }, () => [U(r, -5, 5), U(r, 6, 14), U(r, -4, 4)]);
    ops.push(() => {
      g.strokeStyle = "rgba(78,104,52,0.85)"; g.lineWidth = 1.6; g.lineCap = "round";
      for (const [ox, l, lean] of blades) { g.beginPath(); g.moveTo(x + ox, y); g.quadraticCurveTo(x + ox + lean * 0.3, y - l * 0.6, x + ox + lean, y - l); g.stroke(); }
    });
  }
  tile2(g, W, W, ops);
});

/** mattress ticking: cream twill with faded indigo stripes (one wide + two pin stripes every 7.5 cm), weave lines,
 *  a few old stains. Stripes run along v. */
export const tickingTex = () => ctex(CLEAN ? "ticking_c" : "ticking", 1024, 256, (g) => {
  const W = 1024, H = 256, r = rng(seedOf("ticking"));
  g.fillStyle = "#e7ddc6"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 32; k++) {
    const x = k * 32;
    g.fillStyle = jit(r, "#6f7aa5", 0.05, 3, 0.1); g.fillRect(x + 4, 0, 8, H);
    g.fillStyle = "rgba(111,122,165,0.85)"; g.fillRect(x + 17, 0, 2, H); g.fillRect(x + 22, 0, 2, H);
  }
  if (!CLEAN) {
    for (let y = 0; y < H; y += 3) { g.fillStyle = `rgba(110,92,64,${U(r, 0.03, 0.07).toFixed(3)})`; g.fillRect(0, y, W, 1); }
    for (let x = 1; x < W; x += 4) { g.fillStyle = `rgba(255,252,240,${U(r, 0.03, 0.07).toFixed(3)})`; g.fillRect(x, 0, 1, H); }
  }
  const ops: Op[] = [];
  for (let k = 0; k < 7; k++) { const x = r() * W, y = r() * H, rad = U(r, 26, 60), a = U(r, 0.06, 0.12); ops.push(() => blotch(g, x, y, rad, 1.3, "168,136,74", a)); }
  tile2(g, W, H, ops);
});

/** fieldstone for the chimney and hearth (1.5 m tile): Voronoi stones of mixed grey / tan / brown / blue-grey, each
 *  pillowed (lit top-left, shaded bottom-right) and mottled, set in pale lime mortar with a thin dark painted seam */
export const stoneTex = () => ctex("bwstone", 1024, 1024, (g) => {
  const W = 1024, r = rng(seedOf("bwstone")), cx = 5, cy = 7, cw = W / cx, ch = W / cy;
  const pal = ["#8f8b85", "#9a8b76", "#7f7569", "#8a8f96", "#94796a", "#a39d91", "#77736e", "#8c8270"];
  const sx = new Float32Array(cx * cy), sy = new Float32Array(cx * cy), sc: number[][] = [];
  for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    const k = j * cx + i;
    sx[k] = (i + 0.5 + U(r, -0.36, 0.36)) * cw; sy[k] = (j + 0.5 + U(r, -0.36, 0.36)) * ch;
    sc.push(rgbOf(jit(r, pick(r, pal), 0.08, 5, 0.18)));
  }
  const nA = pn2(r, 11), nB = pn2(r, 37), nM = pn2(r, 16), img = g.createImageData(W, W), d = img.data;
  const mort = [170, 162, 148], seam = [46, 40, 38];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const ci = Math.floor(x / cw), cj = Math.floor(y / ch);
    let d1 = 1e9, d2 = 1e9, k1 = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    for (let dj = -2; dj <= 2; dj++) for (let di = -1; di <= 1; di++) {
      const ii = ci + di, jj = cj + dj, wi = ((ii % cx) + cx) % cx, wj = ((jj % cy) + cy) % cy, k = wj * cx + wi;
      const px = sx[k] + Math.floor(ii / cx) * W, py = sy[k] + Math.floor(jj / cy) * W, dd = (px - x) ** 2 + (py - y) ** 2;
      if (dd < d1) { d2 = d1; x2 = x1; y2 = y1; d1 = dd; k1 = k; x1 = px; y1 = py; } else if (dd < d2) { d2 = dd; x2 = px; y2 = py; }
    }
    const e = (d2 - d1) / (2 * Math.hypot(x2 - x1, y2 - y1)), u = x / W, v = y / W;
    const mw = 5.5 + 3.5 * nM(u, v), i4 = (y * W + x) * 4;
    let c: number[];
    if (e < mw) { const k = 0.9 + 0.14 * nB(u, v); c = mort.map((m) => m * k); }
    else {
      const s = sc[k1], dl = Math.sqrt(d1) + 1e-3, dot = (-(x - x1) * 0.6 - (y - y1) * 0.8) / dl;
      const bev = (1 - clamp((e - mw) / 24)) ** 2, k = (1 + bev * 0.24 * dot) * (0.9 + 0.2 * nA(u + k1 * 0.13, v)) * (1.04 - 0.1 * clamp(dl / 110));
      c = s.map((m) => m * k);
      const t = clamp((e - mw) / 2.6); if (t < 1) c = c.map((m, q) => seam[q] + (m - seam[q]) * t);
    }
    d[i4] = c[0]; d[i4 + 1] = c[1]; d[i4 + 2] = c[2]; d[i4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const ops: Op[] = [];
  for (let k = 0; k < 420; k++) {
    const x = r() * W, y = r() * W, rad = U(r, 0.9, 2.4), dark = r() < 0.6;
    ops.push(() => { g.fillStyle = dark ? "rgba(40,36,34,0.38)" : "rgba(236,230,218,0.32)"; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); });
  }
  tile2(g, W, W, ops);
});

/** painted full moon: crisp disc (same size in the sprite as before, radius 0.44 of the half-width), pale blue-grey maria
 *  and a few soft craters with lit rims, a gentle shaded limb on the lower right, and a short soft glow outside. Maria sit
 *  at linear ~0.3 so they stay visible under the sprite's x2.4-2.8 colour boost and the Neutral tone curve. */
export const moonTex = () => ctex("moon", 512, 512, (g) => {
  const S = 512, C = 256, R0 = 112.6, r = rng(seedOf("moonPaint")), nz = pn2(r, 7), nz2 = pn2(r, 19);
  const maria = [[-0.3, -0.24, 0.36, 0.85], [0.14, -0.4, 0.26, 0.7], [0.3, 0.04, 0.3, 0.75], [-0.04, 0.14, 0.22, 0.55], [-0.4, 0.3, 0.2, 0.55], [0.06, 0.48, 0.17, 0.45]];
  const craters = [[0.44, 0.5, 0.1], [-0.56, 0.04, 0.075], [0.16, -0.62, 0.065], [-0.2, 0.62, 0.08], [0.62, -0.26, 0.055], [-0.12, -0.06, 0.045], [0.36, 0.28, 0.04]];
  const HI = [255, 250, 238], MA = [146, 154, 182], GL = [212, 224, 255];
  const img = g.createImageData(S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x + 0.5 - C) / R0, dy = (y + 0.5 - C) / R0, rho = Math.hypot(dx, dy), dp = rho * R0, i4 = (y * S + x) * 4;
    const ga = dp > R0 ? 0.24 * Math.exp(-(dp - R0) / 20) + 0.06 * clamp(1 - (dp - R0) / (C - R0)) : 0.3;
    const da = clamp(R0 - dp + 0.5);
    let col = GL;
    if (da > 0) {
      let m = 0;
      for (const [mx, my, mr, ms] of maria) m += ms * (1 - sstep(0.3, 1, Math.hypot(dx - mx, dy - my) / mr));
      m = clamp(m * (0.7 + 0.6 * nz(x / S, y / S)));
      let k = 0.95 + 0.07 * nz2(x / S, y / S);
      for (const [cxr, cyr, cr] of craters) {
        const ox = dx - cxr, oy = dy - cyr, q = Math.hypot(ox, oy) / cr;
        if (q < 1.3) {
          const lit = (-ox * 0.7 - oy * 0.7) / (Math.hypot(ox, oy) + 1e-4);
          k *= 1 - 0.2 * (1 - sstep(0.55, 0.85, q)) * 1.0;
          k *= 1 + sstep(0.65, 0.9, q) * (1 - sstep(1.0, 1.3, q)) * 0.28 * lit;
        }
      }
      const limb = sstep(0.5, 1.0, rho) * Math.max(0, (dx * 0.55 + dy * 0.83) / (rho + 1e-4));
      k *= (1 - 0.36 * limb) * (1 - 0.06 * rho * rho) * (rho > 0.982 ? 0.86 : 1);
      const disc = HI.map((hc, q) => (hc + (MA[q] - hc) * m * 0.85) * k);
      col = disc.map((c, q) => GL[q] + (c - GL[q]) * da);
    }
    d[i4] = clamp(col[0], 0, 255); d[i4 + 1] = clamp(col[1], 0, 255); d[i4 + 2] = clamp(col[2], 0, 255);
    d[i4 + 3] = 255 * (da + (1 - da) * ga);
  }
  g.putImageData(img, 0, 0);
});

/** oval braided rag rug (quad 3 x 2 m, mapped once): concentric 3.5 cm three-strand braids laced together, worked in
 *  colour bands of rag fabric with hit-or-miss strands, dark outer rounds and a soft contact shadow. The corners
 *  outside the oval repeat the bedroom floor planks, placed to line up with the floor (rug quad x X0-1.2..X0+1.8,
 *  z -0.9..1.1; floor uv tiles every 2 m from x X0-4, z 3), so the rug reads as an oval lying on the boards. */
export const rugTex = () => ctex("bwRug", 1536, 1024, (g) => {
  const W = 1536, H = 1024, r = rng(seedOf("bwRugBraid"));
  const pl = planksHD(true).image as CanvasImageSource;
  for (const kx of [1, 2]) for (const oy of [-0.05, 0.95]) g.drawImage(pl, ((kx - 1.4) * W) / 1.5, oy * H, W / 1.5, H);
  const cx = W / 2, cy = H / 2, bw = 18, N = 26, Lh = 256, Rout = bw * N;
  const stadPath = (rr: number) => {
    g.beginPath(); g.moveTo(cx - Lh, cy - rr); g.lineTo(cx + Lh, cy - rr); g.arc(cx + Lh, cy, rr, -Math.PI / 2, Math.PI / 2);
    g.lineTo(cx - Lh, cy + rr); g.arc(cx - Lh, cy, rr, Math.PI / 2, Math.PI * 1.5); g.closePath();
  };
  const at = (rr: number, s: number): number[] => { // point, tangent, outward normal at arc length s
    if (s < 2 * Lh) return [cx - Lh + s, cy - rr, 1, 0, 0, -1];
    s -= 2 * Lh;
    if (s < Math.PI * rr) { const a = -Math.PI / 2 + s / rr, c = Math.cos(a), sn = Math.sin(a); return [cx + Lh + rr * c, cy + rr * sn, -sn, c, c, sn]; }
    s -= Math.PI * rr;
    if (s < 2 * Lh) return [cx + Lh - s, cy + rr, -1, 0, 0, 1];
    s -= 2 * Lh; const a = Math.PI / 2 + s / rr, c = Math.cos(a), sn = Math.sin(a); return [cx - Lh + rr * c, cy + rr * sn, -sn, c, c, sn];
  };
  for (const k of [16, 10, 5]) { stadPath(Rout + k); g.fillStyle = "rgba(20,12,8,0.16)"; g.fill(); }
  stadPath(Rout); g.fillStyle = "#2a1e1a"; g.fill();
  const fams = [
    ["#8a3a34", "#a4524a", "#6e2e2c"], ["#c9a050", "#b38a40", "#d8b86a"], ["#3f5878", "#4f6a8c", "#2f4462"], ["#5e6a38", "#727c46", "#4c5630"],
    ["#6a4a32", "#7e5a3c", "#5a3e2a"], ["#a8686a", "#b88078", "#94585c"], ["#d6c6a2", "#c8b48e", "#e0d2b4"],
  ];
  const trios: string[][] = [];
  let band = 0, fam = fams[4], left = 2;
  for (let j = N - 1; j >= 0; j--) {
    if (j >= N - 2) { trios[j] = ["#3a2e2c", "#4a3a30", "#2e2a30"].map((c) => jit(r, c, 0.06)); continue; }
    if (j <= 1) { trios[j] = fams[0].map((c) => jit(r, c, 0.06)); continue; }
    if (left-- <= 0) { let f = pick(r, fams); if (f === fam) f = fams[(fams.indexOf(f) + 3) % fams.length]; fam = f; left = 1 + Math.floor(r() * 3); band++; }
    trios[j] = [jit(r, pick(r, fam), 0.07), jit(r, pick(r, fam), 0.07), jit(r, pick(r, r() < 0.6 ? fam : pick(r, fams)), 0.07)];
  }
  void band;
  for (let j = N - 1; j >= 0; j--) {
    const rr = bw * (j + 0.5), P = 4 * Lh + 2 * Math.PI * rr, steps = Math.round(P / (bw * 0.62)), st = P / steps;
    const w = bw / 2 - 0.4, hl = st / 2 + 0.5, sl = st * 0.55, paths = [new Path2D(), new Path2D(), new Path2D()], edge = new Path2D(), hi = new Path2D();
    for (let k = 0; k < steps; k++) {
      const [px, py, tx, ty, nx, ny] = at(rr, k * st);
      for (const sg of [1, -1]) {
        const p = paths[(k + (sg > 0 ? 0 : 1)) % 3], ex = px + nx * w * sg, ey = py + ny * w * sg;
        const pts = [[px - tx * hl, py - ty * hl], [px + tx * hl, py + ty * hl], [ex + tx * (hl + sl), ey + ty * (hl + sl)], [ex + tx * (sl - hl), ey + ty * (sl - hl)]];
        for (const q of [p, edge]) { q.moveTo(pts[0][0], pts[0][1]); for (const v of pts.slice(1)) q.lineTo(v[0], v[1]); q.closePath(); }
        hi.moveTo(px + nx * w * sg * 0.25 + tx * sl * 0.25, py + ny * w * sg * 0.25 + ty * sl * 0.25);
        hi.lineTo(px + nx * w * sg * 0.8 + tx * sl * 0.8, py + ny * w * sg * 0.8 + ty * sl * 0.8);
      }
    }
    paths.forEach((p, q) => { g.fillStyle = trios[j][q]; g.fill(p); });
    g.strokeStyle = "rgba(255,240,220,0.15)"; g.lineWidth = st * 0.35; g.lineCap = "round"; g.stroke(hi);
    g.strokeStyle = "rgba(30,18,16,0.42)"; g.lineWidth = 1.2; g.stroke(edge);
    stadPath(rr + bw / 2); g.strokeStyle = "rgba(20,12,10,0.5)"; g.lineWidth = 1.8; g.stroke();
  }
  stadPath(Rout); g.strokeStyle = "rgba(20,12,10,0.7)"; g.lineWidth = 2.5; g.stroke();
});

/** cross-stitch sampler on linen (0.56 x 0.46 m): stitched border with a vine zigzag, bands of diamonds and
 *  strawberries, a house between two pines with birds, a band of hearts and flowers. No letters or numbers. */
export const samplerTex = () => ctex("bwSampler", 560, 460, (g) => {
  const W = 560, H = 460, c = 5, ox = 10, oy = 10, r = rng(seedOf("bwSamplerX"));
  g.fillStyle = "#e5dabf"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(150,128,92,0.12)"; g.lineWidth = 1; g.beginPath();
  for (let x = 0.5; x < W; x += 2.5) { g.moveTo(x, 0); g.lineTo(x, H); }
  for (let y = 0.5; y < H; y += 2.5) { g.moveTo(0, y); g.lineTo(W, y); }
  g.stroke();
  for (let k = 0; k < 6; k++) blotch(g, r() * W, r() * H, U(r, 30, 70), 1.2, "176,136,72", U(r, 0.06, 0.12)); // foxing
  const TH: Record<string, string> = { r: "#8a2f3a", g: "#3f6a3a", n: "#2f3f63", y: "#b8913a", b: "#5a4030", p: "#a85a6a", k: "#2a2426", l: "#6f8a4a" };
  const cells: Record<string, Path2D> = {};
  const st = (i: number, j: number, t: string) => {
    if (i < 0 || j < 0 || i > 107 || j > 87) return;
    const p = (cells[t] ??= new Path2D()), x = ox + i * c, y = oy + j * c;
    p.moveTo(x + 0.8, y + 0.8); p.lineTo(x + c - 0.8, y + c - 0.8); p.moveTo(x + c - 0.8, y + 0.8); p.lineTo(x + 0.8, y + c - 0.8);
  };
  const motif = (rows: string[], i0: number, j0: number, s = 1) => rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch !== ".") for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) st(i0 + i * s + a, j0 + j * s + b, ch);
  }));
  for (let i = 0; i < 108; i++) { st(i, 0, "r"); st(i, 87, "r"); }
  for (let j = 0; j < 88; j++) { st(0, j, "r"); st(107, j, "r"); }
  const tri = (k: number) => { const m = k % 4; return m < 2 ? m : 4 - m; };
  for (let i = 2; i < 106; i++) { st(i, 2 + tri(i), "g"); st(i, 85 - tri(i), "g"); if (i % 4 === 2) { st(i, 5, "r"); st(i, 82, "r"); } }
  for (let j = 6; j < 82; j++) { st(2 + tri(j), j, "g"); st(105 - tri(j), j, "g"); }
  const DIAMOND = ["..n..", ".nnn.", "nn.nn", ".nnn.", "..n.."];
  for (let i = 9; i < 96; i += 9) { motif(DIAMOND, i, 8); st(i + 6, 10, "y"); }
  for (let i = 8; i < 100; i++) { st(i, 14, "y"); st(i, 23, "y"); st(i, 58, "y"); }
  const BERRY = [".g.g.", "..g..", ".rrr.", "rrrrr", ".rrr.", "..r.."];
  for (let i = 10; i < 96; i += 10) motif(BERRY, i, 16);
  // house: roof, chimney, walls, two lit windows with glazing bars, door
  const hx = 44, hy = 30;
  for (let j = 0; j < 5; j++) { st(hx + 15, hy - 2 + j, "b"); st(hx + 16, hy - 2 + j, "b"); }
  for (let j = 0; j < 9; j++) for (let i = 8 - j; i <= 12 + j; i++) st(hx + i, hy + j, "r");
  for (let j = 9; j < 21; j++) for (let i = 2; i <= 18; i++) {
    const win = j >= 11 && j <= 15 && ((i >= 3 && i <= 7) || (i >= 13 && i <= 17)), door = i >= 9 && i <= 11 && j >= 14;
    const bar = win && (i === 5 || i === 15 || j === 13);
    st(hx + i, hy + j, door ? "n" : bar ? "b" : win ? "y" : "b");
  }
  const tree = (i0: number, j0: number) => {
    for (let t = 0; t < 3; t++) for (let j = 0; j < 6; j++) for (let i = -(j + t); i <= j + t; i++) st(i0 + i, j0 + t * 4 + j, t === 1 ? "l" : "g");
    for (let j = 0; j < 3; j++) { st(i0, j0 + 18 + j, "b"); st(i0 + 1, j0 + 18 + j, "b"); }
  };
  tree(24, 31); tree(84, 31);
  const BIRD = ["..nn...", ".nnnn.y", "nnnnnn.", "...n..."];
  motif(BIRD, 18, 26); motif(BIRD, 82, 26);
  for (let i = 8; i < 100; i++) st(i, 52, "g");
  const FLOWER = [".p.p.", "ppypp", ".p.p.", "..g..", ".ggg."];
  for (const i of [12, 36, 68, 92]) motif(FLOWER, i, 47);
  const HEART = [".pp.pp.", "ppppppp", "ppppppp", ".ppppp.", "..ppp..", "...p..."];
  for (let i = 10; i < 98; i += 12) motif(HEART, i, 61);
  for (let i = 16; i < 98; i += 12) motif(FLOWER, i, 61);
  motif(HEART, 47, 69, 2);
  for (const i of [20, 80]) { motif(["..y..", ".yry.", "yrrry", ".yry.", "..y.."], i, 72); }
  g.lineCap = "round";
  for (const [t, p] of Object.entries(cells)) {
    g.save(); g.translate(0.6, 0.7); g.strokeStyle = "rgba(40,24,20,0.28)"; g.lineWidth = 1.9; g.stroke(p); g.restore();
    g.strokeStyle = TH[t]; g.lineWidth = 1.7; g.stroke(p);
  }
});

/** a nailed notice on the porch wall (0.26 x 0.34 m): foxed, water-stained paper with a torn corner, a heavy header
 *  rule and lines of faded scrawl (no readable letters), two nail holes with rust runs */
export const noticeTex = () => ctex("bwNotice", 256, 336, (g) => {
  const W = 256, H = 336, r = rng(seedOf("bwNotice"));
  g.fillStyle = "#dcdcc6"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 9; k++) blotch(g, r() * W, r() * H, U(r, 20, 60), 1.3, "150,140,96", U(r, 0.08, 0.16));
  const edge = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 210);
  edge.addColorStop(0, "rgba(90,84,60,0)"); edge.addColorStop(1, "rgba(90,84,60,0.55)"); g.fillStyle = edge; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(40,40,34,0.85)"; g.lineCap = "round";
  const scrawl = (x0: number, y: number, x1: number, lw: number, amp: number) => {
    g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y);
    for (let x = x0; x < x1; x += U(r, 4, 9)) { if (r() < 0.12) { x += U(r, 6, 14); g.moveTo(x, y); continue; } g.lineTo(x, y + U(r, -amp, amp)); }
    g.stroke();
  };
  scrawl(38, 48, 218, 7, 5); scrawl(70, 74, 186, 4, 3);
  g.fillStyle = "rgba(40,40,34,0.8)"; g.fillRect(30, 90, 196, 3);
  for (let k = 0; k < 9; k++) scrawl(30, 116 + k * 20, 30 + U(r, 120, 196), 2.2, 3);
  scrawl(130, 306, 214, 3, 4);
  g.fillStyle = "#4a4c40"; g.beginPath(); g.moveTo(W, H - 54); g.lineTo(W, H); g.lineTo(W - 46, H); g.lineTo(W - 30, H - 22); g.closePath(); g.fill(); // torn corner
  for (const x of [26, W - 26]) {
    g.fillStyle = "rgba(112,84,46,0.5)"; g.fillRect(x - 2, 20, 4, U(r, 30, 60));
    g.fillStyle = "#2a2a26"; g.beginPath(); g.arc(x, 18, 6, 0, TAU); g.fill();
  }
});

/** John's headstone face (0.72 x 1.05 m, arched): grey-green weathered slate with mottling, lichen rosettes creeping
 *  up from the base and down from the arch, chipped edges, an incised border, a weeping-willow lunette and a short
 *  carved epitaph ("J. B." / 1750 - 1820) over a few lines worn past reading */
export const epitaphTex = () => ctex("bwEpitaph", 512, 768, (g) => {
  const W = 512, H = 768, r = rng(seedOf("bwEpitaph")), n1 = pn2(r, 7), n2 = pn2(r, 19);
  const img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / H, k = 0.86 + 0.18 * n1(u, v) + 0.09 * n2(u, v) - 0.12 * v * v + (r() - 0.5) * 0.04, i = (y * W + x) * 4;
    d[i] = 150 * k; d[i + 1] = 156 * k; d[i + 2] = 150 * k; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // weather streaks running down from the arch
  for (let k = 0; k < 14; k++) { const x = U(r, 20, W - 20); g.fillStyle = `rgba(70,78,70,${U(r, 0.06, 0.14).toFixed(2)})`; g.fillRect(x, U(r, 0, 140), U(r, 4, 14), U(r, 160, 420)); }
  // incised border following the arch (arch centre at y = W/2 from the top)
  const cx = W / 2, cy = W / 2, R0 = W / 2 - 34;
  const border = (off: number, col: string, lw: number) => {
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    g.moveTo(34, H - 40 + off); g.lineTo(34, cy + off); g.arc(cx, cy + off, R0, Math.PI, 0); g.lineTo(W - 34, H - 40 + off); g.stroke();
  };
  border(2.5, "rgba(230,236,228,0.35)", 3); border(0, "rgba(34,38,34,0.7)", 4);
  // willow lunette: trunk, drooping strokes, a plinth
  const carve = (draw: () => void) => {
    g.save(); g.translate(0, 2.5); g.strokeStyle = g.fillStyle = "rgba(232,238,230,0.32)"; draw(); g.restore();
    g.strokeStyle = g.fillStyle = "rgba(30,34,30,0.72)"; draw();
  };
  carve(() => {
    g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, 268); g.quadraticCurveTo(cx - 6, 200, cx + 4, 128); g.stroke();
    g.lineWidth = 3;
    for (let k = 0; k < 13; k++) {
      const a = Math.PI * (0.1 + 0.8 * (k / 12)), sx = cx + Math.cos(a) * 30, sy = 136 - Math.sin(a) * 18, ex = cx + Math.cos(a) * 112;
      g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + ex) / 2, sy - 30, ex, sy + 90 + 20 * Math.sin(k)); g.stroke();
    }
    g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 86, 276); g.lineTo(cx + 86, 276); g.stroke();
  });
  g.textAlign = "center"; g.textBaseline = "middle";
  const text = (s: string, y: number, px: number) => {
    g.font = `bold ${px}px Georgia, 'Times New Roman', serif`;
    g.fillStyle = "rgba(232,238,230,0.34)"; g.fillText(s, cx, y + 3);
    g.fillStyle = "rgba(28,32,28,0.8)"; g.fillText(s, cx, y);
  };
  text("J. B.", 352, 92); text("1750 - 1820", 446, 46);
  // worn epitaph lines: broken incised dashes
  for (let k = 0; k < 4; k++) {
    const y = 516 + k * 40, x0 = U(r, 80, 120), x1 = W - U(r, 80, 120);
    for (let x = x0; x < x1; x += U(r, 10, 26)) {
      const l = U(r, 6, 18); if (r() < 0.3) continue;
      g.fillStyle = "rgba(232,238,230,0.25)"; g.fillRect(x, y + 2.5, l, 5);
      g.fillStyle = `rgba(30,34,30,${U(r, 0.35, 0.65).toFixed(2)})`; g.fillRect(x, y, l, 5);
    }
  }
  // lichen rosettes: pale grey-green and mustard, denser at the base and around the arch
  const lich = (x: number, y: number, rad: number, c: string) => {
    for (let j = 0; j < 7; j++) { const a = r() * TAU, q = rad * U(r, 0.2, 0.8); blotch(g, x + Math.cos(a) * q, y + Math.sin(a) * q, rad * U(r, 0.35, 0.7), 1, c, 0.55); }
    g.fillStyle = `rgba(${c},0.85)`; for (let j = 0; j < 12; j++) { const a = r() * TAU, q = rad * Math.sqrt(r()); g.beginPath(); g.arc(x + Math.cos(a) * q, y + Math.sin(a) * q, U(r, 1.5, 4), 0, TAU); g.fill(); }
  };
  for (let k = 0; k < 26; k++) {
    const base = r() < 0.55, x = base ? U(r, 0, W) : cx + Math.cos(Math.PI * (1 + r())) * U(r, 150, 250);
    const y = base ? H - U(r, 0, 150) * r() : cy - Math.abs(Math.sin(Math.PI * r())) * U(r, 120, 230);
    lich(x, y, U(r, 10, 30), r() < 0.5 ? "196,192,112" : "176,190,160");
  }
  // moss at the foot, chips along the edges (pale scar with a dark lip)
  const ft = g.createLinearGradient(0, H - 90, 0, H); ft.addColorStop(0, "rgba(64,90,52,0)"); ft.addColorStop(1, "rgba(64,90,52,0.75)");
  g.fillStyle = ft; g.fillRect(0, H - 90, W, 90);
  for (let k = 0; k < 9; k++) {
    const side = k % 3, y = U(r, 200, H - 100), x = side === 0 ? 0 : side === 1 ? W : U(r, 120, W - 120), yy = side === 2 ? 0 : y;
    const pts = Array.from({ length: 5 }, (_, j) => [x + Math.cos((j / 5) * TAU) * U(r, 8, 22), yy + Math.sin((j / 5) * TAU) * U(r, 8, 22)]);
    g.fillStyle = "rgba(196,202,194,0.9)"; g.beginPath(); pts.forEach(([a, b], j) => (j ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill();
    g.strokeStyle = "rgba(34,38,34,0.6)"; g.lineWidth = 2; g.stroke();
  }
});

/** the writer's open book (shot 21, "nobody wrote it down until 1894"): brown-ink handwriting, the right page headed
 *  "1894" and only half written (he is still at it). Little printed details like the reference's props. */
export const pageTex = (side: 0 | 1) => ctex(`bwPage${side}`, 440, 600, (g) => {
  const W = 440, H = 600, r = rng(seedOf("bwPage" + side));
  g.fillStyle = "#efe3c4"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 3; k++) blotch(g, r() * W, r() * H, U(r, 40, 90), 1.2, "176,136,72", U(r, 0.04, 0.07));
  const gx = side ? 0 : W, gut = g.createLinearGradient(gx, 0, side ? 70 : W - 70, 0);
  gut.addColorStop(0, "rgba(120,90,50,0.3)"); gut.addColorStop(1, "rgba(120,90,50,0)"); g.fillStyle = gut; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#3a2a20"; g.fillStyle = "#3a2a20"; g.lineCap = "round"; g.lineJoin = "round";
  let y0 = 64, last = H - 60;
  if (side) { g.font = "italic 700 60px Georgia, 'DejaVu Serif', serif"; g.fillText("1894", 140, 96); y0 = 160; last = 0.66 * H; }
  for (let y = y0; y < last; y += 36) {
    const lastLine = y + 36 >= last;
    let x = 40 + (y === y0 ? 34 : 0);
    const end = lastLine && side ? W * 0.5 : W - 40 - U(r, 0, 36);
    g.lineWidth = 2.8; g.beginPath(); g.moveTo(x, y);
    while (x < end) {
      const wl = Math.min(U(r, 20, 50), end - x);
      for (let t = 0; t <= wl; t += 2.5) g.lineTo(x + t, y - 6 * Math.abs(Math.sin((x + t) * 0.42)) * (0.5 + 0.5 * Math.sin((x + t) * 0.07 + y)));
      x += wl + U(r, 9, 15); g.moveTo(x, y);
    }
    g.stroke();
  }
});

/** the farmhouse front door, PAINTED (round 9, user: the dotted / pixel line along the top of the strap hinges "looks
 *  off", "we need to clean and smooth", "the bottom ones as well"). The battens, strap hinges and latch used to be
 *  1-2 cm deep boxes whose sub-pixel top faces broke the crease ink into dots; now every detail is drawn here with
 *  clean anti-aliased outlines (line weight ~ the world ink at porch distance). Face = x -0.48..0.471, y 0.27..2.23. */
export const doorTex = () => ctex("bwDoor2", 768, 1584, (g) => {
  const W = 768, H = 1584, r = rng(seedOf("bwDoor2"));
  const X = (x: number) => ((x + 0.48) / 0.951) * W, Y = (y: number) => ((2.23 - y) / 1.96) * H, S = W / 0.951; // px per m
  const INK = "#17110d";
  g.lineJoin = "round"; g.lineCap = "round";
  g.fillStyle = "#1d140e"; g.fillRect(0, 0, W, H); // the seams between the boards
  // four boards: own tone each, long soft grain, a knot or two, darker bevel at the sides
  for (let i = 0; i < 4; i++) {
    const x0 = X(-0.48 + i * 0.242) + (i ? 2 : 0), x1 = X(-0.48 + i * 0.242 + 0.225) - (i < 3 ? 2 : 0), w = x1 - x0;
    g.fillStyle = jit(r, "#70503a", 0.06, 3, 0.08); g.fillRect(x0, 0, w, H);
    for (let k = 0; k < 7; k++) {
      const gx = x0 + U(r, 0.08, 0.92) * w, amp = U(r, 2, 6), ph = U(r, 0, 6.28), dark = r() < 0.65;
      g.strokeStyle = dark ? `rgba(58,38,24,${U(r, 0.18, 0.3)})` : `rgba(150,112,80,${U(r, 0.12, 0.2)})`;
      g.lineWidth = U(r, 1.5, 3.2); g.beginPath();
      for (let y = 0; y <= H; y += 12) { const xx = gx + amp * Math.sin(y * 0.006 + ph) + 1.5 * Math.sin(y * 0.021 + ph * 2); if (y) g.lineTo(xx, y); else g.moveTo(xx, y); }
      g.stroke();
    }
    if (r() < 0.8) { // a knot
      const kx = x0 + U(r, 0.3, 0.7) * w, ky = U(r, 0.2, 0.85) * H;
      for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(52,34,22,${0.35 - k * 0.08})`; g.lineWidth = 2.2; g.beginPath(); g.ellipse(kx, ky, 7 + 7 * k, 14 + 12 * k, 0, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = "rgba(48,30,20,0.55)"; g.beginPath(); g.ellipse(kx, ky, 5, 10, 0, 0, Math.PI * 2); g.fill();
    }
    const sh = g.createLinearGradient(x0, 0, x1, 0);
    sh.addColorStop(0, "rgba(20,12,8,0.32)"); sh.addColorStop(0.07, "rgba(20,12,8,0)"); sh.addColorStop(0.93, "rgba(20,12,8,0)"); sh.addColorStop(1, "rgba(20,12,8,0.32)");
    g.fillStyle = sh; g.fillRect(x0, 0, w, H);
  }
  // grime toward the sill
  const gr = g.createLinearGradient(0, H * 0.78, 0, H); gr.addColorStop(0, "rgba(28,20,14,0)"); gr.addColorStop(1, "rgba(28,20,14,0.3)");
  g.fillStyle = gr; g.fillRect(0, H * 0.78, W, H * 0.22);
  const outline = (lw: number) => { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); };
  for (const yb of [0.55, 1.85]) {
    // batten: drop shadow under it, flat dark board, lit top edge, clean outline
    const bx0 = X(-0.46), bx1 = X(0.46), by0 = Y(yb + 0.1), by1 = Y(yb);
    g.fillStyle = "rgba(12,8,5,0.4)"; g.fillRect(bx0 + 4, by1, bx1 - bx0, 12);
    g.fillStyle = "#4b3223"; g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    for (let k = 0; k < 4; k++) {
      const gy = by0 + U(r, 0.2, 0.8) * (by1 - by0); g.strokeStyle = `rgba(30,20,13,${U(r, 0.2, 0.32)})`; g.lineWidth = 2;
      g.beginPath(); g.moveTo(bx0, gy); for (let x = bx0; x <= bx1; x += 16) g.lineTo(x, gy + 2.2 * Math.sin(x * 0.02 + k)); g.stroke();
    }
    g.fillStyle = "rgba(140,100,70,0.45)"; g.fillRect(bx0, by0, bx1 - bx0, 6);
    g.beginPath(); g.rect(bx0, by0, bx1 - bx0, by1 - by0); outline(6);
    // strap hinge from the hinge edge (left) to a round end at x -0.08: iron with a soft top-light, 3 rivets
    const sy0 = Y(yb + 0.072), sy1 = Y(yb + 0.028), sh2 = sy1 - sy0, ex = X(-0.085), er = 0.03 * S;
    const strap = () => { g.beginPath(); g.moveTo(-10, sy0); g.lineTo(ex - er * 0.6, sy0); g.arc(ex, (sy0 + sy1) / 2, er, -Math.PI * 0.79, Math.PI * 0.79); g.lineTo(-10, sy1); g.closePath(); };
    g.save(); g.translate(4, 7); strap(); g.fillStyle = "rgba(10,7,5,0.45)"; g.fill(); g.restore();
    strap(); const ig = g.createLinearGradient(0, sy0 - er, 0, sy1 + er); ig.addColorStop(0, "#5c5753"); ig.addColorStop(0.45, "#3b3735"); ig.addColorStop(1, "#272422");
    g.fillStyle = ig; g.fill(); outline(5.5);
    // hinge knuckle on the door edge
    g.beginPath(); g.roundRect(X(-0.48) - 2, Y(yb + 0.09), 0.026 * S, Y(yb + 0.01) - Y(yb + 0.09), 8);
    g.fillStyle = "#3b3735"; g.fill(); outline(5);
    for (const rx of [-0.41, -0.29, -0.17, -0.085]) {
      const cx = X(rx), cy = (sy0 + sy1) / 2, rr = rx === -0.085 ? 0.011 * S : 0.0085 * S;
      g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fillStyle = "#6f6964"; g.fill(); outline(2.6);
      g.beginPath(); g.arc(cx - rr * 0.32, cy - rr * 0.34, rr * 0.34, 0, Math.PI * 2); g.fillStyle = "rgba(205,198,188,0.85)"; g.fill();
    }
    void sh2;
  }
  // thumb latch: bar on a keeper, a ring pull under it
  const ly0 = Y(1.19), ly1 = Y(1.15);
  g.save(); g.translate(4, 7); g.fillStyle = "rgba(10,7,5,0.4)"; g.fillRect(X(0.16), ly0, X(0.42) - X(0.16), ly1 - ly0); g.restore();
  g.beginPath(); g.roundRect(X(0.16), ly0, X(0.42) - X(0.16), ly1 - ly0, 7);
  const lg = g.createLinearGradient(0, ly0, 0, ly1); lg.addColorStop(0, "#5c5753"); lg.addColorStop(1, "#2a2725"); g.fillStyle = lg; g.fill(); outline(5);
  g.beginPath(); g.roundRect(X(0.4), Y(1.215), X(0.44) - X(0.4), Y(1.125) - Y(1.215), 6); g.fillStyle = "#3b3735"; g.fill(); outline(5);
  g.beginPath(); g.arc(X(0.22), Y(1.105), 0.028 * S, 0, Math.PI * 2); g.strokeStyle = INK; g.lineWidth = 11; g.stroke();
  g.strokeStyle = "#57524e"; g.lineWidth = 5; g.stroke();
  g.beginPath(); g.arc(X(0.22), Y(1.15), 0.012 * S, 0, Math.PI * 2); g.fillStyle = "#3b3735"; g.fill(); outline(4);
});

// ================= WINCHESTER (look test): Rick-style clean daytime Victorian interior =================
/** cream wallpaper with fine vertical pinstripes and small diamond motifs (his living-room wallpaper, Victorian) */
export const wallpaperTex = () => ctex("whWallpaper5", 1024, 1024, (g) => {
  // teal damask: a cream fleur motif on a half-drop repeat, thin dark-teal outline, faint vertical satin stripes
  const W = 1024, TL = "#5cc2b6", TD = "#55b6aa", CR = "rgba(250,240,214,0.38)";
  g.fillStyle = TL; g.fillRect(0, 0, W, W);
  for (let x = 0; x < W; x += 32) { g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(x, 0, 14, W); }
  const fleur = (cx: number, cy: number, s: number) => {
    g.save(); g.translate(cx, cy); g.scale(s, s);
    g.beginPath(); g.moveTo(0, -60); g.bezierCurveTo(26, -30, 26, 10, 0, 40); g.bezierCurveTo(-26, 10, -26, -30, 0, -60); g.closePath();
    for (const sx of [-1, 1]) { g.moveTo(0, 10); g.bezierCurveTo(sx * 30, -10, sx * 62, 0, sx * 56, 30); g.bezierCurveTo(sx * 50, 46, sx * 30, 40, sx * 34, 26); g.bezierCurveTo(sx * 40, 14, sx * 20, 14, 0, 30); }
    g.moveTo(0, 46); g.lineTo(10, 60); g.lineTo(0, 74); g.lineTo(-10, 60); g.closePath();
    g.fillStyle = CR; g.fill(); g.lineWidth = 3; g.strokeStyle = TD; g.stroke();
    g.beginPath(); g.ellipse(0, -14, 6, 16, 0, 0, Math.PI * 2); g.fillStyle = TL; g.fill();
    g.restore();
  };
  for (let j = -1; j < 9; j++) for (let k = 0; k < 8; k++) { fleur(k * 128 + 64, j * 128 + 60, 0.62); fleur(k * 128, j * 128 + 124, 0.62); }
  for (let j = 0; j < 8; j++) for (let k = 0; k < 8; k++) {  }
});
/** long hall runner: deep red field, gold border, navy inner band and a simple repeating medallion */
export const runnerTex = () => ctex("whRunner4", 512, 2048, (g) => {
  // hall runner: deep red field, gold + navy borders with a small zig-zag, a diamond lattice and little rosettes, fibre noise
  const W = 512, H = 2048, RED = "#a3242c", RDK = "#82191f", GOLD = "#e8b84c", NAVY = "#1f3658", CR = "#f3e2b8";
  g.fillStyle = RED; g.fillRect(0, 0, W, H);
  g.fillStyle = NAVY; g.fillRect(0, 0, 64, H); g.fillRect(W - 64, 0, 64, H);
  g.fillStyle = GOLD; g.fillRect(64, 0, 10, H); g.fillRect(W - 74, 0, 10, H); g.fillRect(0, 0, 8, H); g.fillRect(W - 8, 0, 8, H);
  g.strokeStyle = GOLD; g.lineWidth = 5; for (const x0 of [14, W - 50]) { g.beginPath(); for (let y = 0; y <= H; y += 36) g.lineTo(x0 + ((y / 36) % 2 ? 36 : 0), y); g.stroke(); }
  g.strokeStyle = RDK; g.lineWidth = 4;
  for (let y = -256; y < H + 256; y += 128) { g.beginPath(); g.moveTo(74, y); g.lineTo(W - 74, y + 364); g.stroke(); g.beginPath(); g.moveTo(W - 74, y); g.lineTo(74, y + 364); g.stroke(); }
  for (let y = 64; y < H; y += 256) {
    for (const [r, c] of [[46, GOLD], [32, NAVY], [18, CR], [7, RED]] as [number, string][]) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.72 : r; g.lineTo(W / 2 + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  }
  for (let i = 0; i < 9000; i++) { const x = (i * 9301 + 49297) % W, y = (i * 233280 + 7) % H; g.fillStyle = i % 2 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"; g.fillRect(x, y, 1, 3); }
});
/** framed little drawings for the walls (his posters: flat colour, thick line, a simple subject) */
export const portraitTex = (kind: number) => ctex(`whPortrait${kind}`, 512, 640, (g) => {
  const W = 512, H = 640, ink = "#1b1712";
  const bg = ["#9fd3e6", "#f2c46b", "#b9e0a5", "#f4a68e", "#f6d9a8", "#a8d8c8"][kind % 6];
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.lineWidth = 12; g.strokeStyle = ink; g.lineJoin = "round"; g.lineCap = "round";
  if (kind === 0) { // a gentleman with a moustache and a top hat
    g.fillStyle = "#3a3a44"; g.fillRect(186, 470, 140, 170); g.strokeRect(186, 470, 140, 170);
    g.fillStyle = "#f6f1e8"; g.beginPath(); g.ellipse(256, 330, 120, 128, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#222"; g.fillRect(170, 120, 172, 120); g.strokeRect(170, 120, 172, 120); g.fillRect(130, 230, 252, 22); g.strokeRect(130, 230, 252, 22);
    g.fillStyle = ink; g.beginPath(); g.ellipse(216, 330, 11, 16, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(296, 330, 11, 16, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(200, 392); g.quadraticCurveTo(256, 360, 312, 392); g.stroke();
  } else if (kind === 1) { // a sailboat on a wave
    g.fillStyle = "#3f7fc4"; g.fillRect(0, 430, W, 210); g.beginPath(); g.moveTo(0, 430); for (let x = 0; x <= W; x += 64) g.quadraticCurveTo(x + 32, 400, x + 64, 430); g.stroke();
    g.fillStyle = "#b8322e"; g.beginPath(); g.moveTo(130, 420); g.lineTo(380, 420); g.lineTo(340, 480); g.lineTo(170, 480); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#fffaf0"; g.beginPath(); g.moveTo(260, 140); g.lineTo(260, 400); g.lineTo(140, 400); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(275, 170); g.lineTo(275, 400); g.lineTo(370, 400); g.closePath(); g.fill(); g.stroke();
  } else if (kind === 2) { // a fern in a pot
    g.fillStyle = "#c86a3c"; g.beginPath(); g.moveTo(170, 440); g.lineTo(342, 440); g.lineTo(316, 600); g.lineTo(196, 600); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#3f8f4a"; for (const a of [-60, -30, 0, 30, 60]) { g.save(); g.translate(256, 440); g.rotate((a * Math.PI) / 180); g.beginPath(); g.ellipse(0, -140, 36, 140, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); }
  } else if (kind === 4) { // the baby in a frilly bonnet
    g.fillStyle = "#fbf6ea"; g.beginPath(); g.arc(256, 340, 150, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#f6f1e8"; g.beginPath(); g.arc(256, 350, 100, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = ink; g.beginPath(); g.arc(220, 350, 9, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(292, 350, 9, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(256, 390, 14, 0.2, Math.PI - 0.2); g.stroke();
  } else if (kind === 5) { // William: moustache, bow tie
    g.fillStyle = "#2a2420"; g.fillRect(176, 480, 160, 160); g.strokeRect(176, 480, 160, 160);
    g.fillStyle = "#f6f1e8"; g.beginPath(); g.ellipse(256, 320, 118, 126, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#4a2e22"; g.beginPath(); g.ellipse(256, 216, 110, 50, 0, Math.PI, 0); g.fill();
    g.fillStyle = ink; g.beginPath(); g.ellipse(216, 316, 10, 15, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(296, 316, 10, 15, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#4a2e22"; g.beginPath(); g.ellipse(232, 372, 34, 14, 0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(280, 372, 34, 14, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#c94a3c"; g.beginPath(); g.moveTo(256, 480); g.lineTo(206, 456); g.lineTo(206, 504); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(256, 480); g.lineTo(306, 456); g.lineTo(306, 504); g.closePath(); g.fill(); g.stroke();
  } else { // a cat
    g.fillStyle = "#f0a04b"; g.beginPath(); g.ellipse(256, 470, 150, 130, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(256, 300, 120, 110, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(256 + s * 110, 260); g.lineTo(256 + s * 90, 160); g.lineTo(256 + s * 40, 210); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = ink; g.beginPath(); g.ellipse(216, 300, 12, 18, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(296, 300, 12, 18, 0, 0, Math.PI * 2); g.fill();
  }
  g.lineWidth = 24; g.strokeStyle = ink; g.strokeRect(0, 0, W, H);
});
/** the view through the hall window: bright sky, a soft cloud, a clipped hedge and a round tree (unlit, bright) */
export const windowViewTex = () => ctex("whView", 512, 512, (g) => {
  const W = 512, gr = g.createLinearGradient(0, 0, 0, W);
  gr.addColorStop(0, "#5fb6f2"); gr.addColorStop(0.7, "#b9e4ff"); gr.addColorStop(1, "#e2f4ff");
  g.fillStyle = gr; g.fillRect(0, 0, W, W);
  g.fillStyle = "rgba(255,255,255,0.95)";
  for (const [x, y, r] of [[120, 120, 46], [170, 104, 58], [226, 124, 44], [380, 70, 30], [414, 62, 38]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#4f9e3c"; g.beginPath(); g.arc(380, 300, 92, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#6d4a2c"; g.fillRect(368, 360, 24, 120);
  g.fillStyle = "#3d8a34"; g.fillRect(0, 400, W, 112); g.beginPath(); for (let x = 0; x <= W; x += 32) g.arc(x, 404, 22, Math.PI, 0); g.fill();
});

/** grandfather-clock dial: cream face, roman-ish tick marks, a painted moon arc, black hands at ten to two */
export const clockFaceTex = () => ctex("whClockFace13", 512, 512, (g) => {
  const C = 256; g.fillStyle = "#f8efd8"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#1b1712"; g.lineWidth = 10; g.beginPath(); g.arc(C, C, 236, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(C, C, 180, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 65; i++) { const a = (i / 65) * Math.PI * 2, r0 = i % 5 ? 214 : 192; g.lineWidth = i % 5 ? 3 : 9; g.beginPath(); g.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); g.lineTo(C + Math.cos(a) * 228, C + Math.sin(a) * 228); g.stroke(); }
  g.fillStyle = "#2f6fb0"; g.beginPath(); g.arc(C, C - 70, 70, Math.PI, 0); g.fill(); g.fillStyle = "#f2c94c"; g.beginPath(); g.arc(C - 20, C - 100, 24, 0, Math.PI * 2); g.fill();
  g.lineCap = "round"; g.lineWidth = 14; g.beginPath(); g.moveTo(C, C); g.lineTo(C - 110, C - 70); g.stroke(); g.lineWidth = 10; g.beginPath(); g.moveTo(C, C); g.lineTo(C + 120, C - 120); g.stroke();
  g.fillStyle = "#1b1712"; g.beginPath(); g.arc(C, C, 16, 0, Math.PI * 2); g.fill();
});

// ================= WINCHESTER grand foyer textures =================
/** inlaid parquet: herringbone in two warm woods with thin dark joints (tiles 1 m) */
export const parquetTex = () => ctex("whParquet", 1024, 1024, (g) => {
  const W = 1024, A = "#d58a4a", B = "#b8693a", L = 128, T = 32;
  g.fillStyle = "#6a3418"; g.fillRect(0, 0, W, W);
  for (let y = -L; y < W + L; y += T * 2) for (let x = -L; x < W + L; x += T * 2) {
    for (const [dx, dy, horiz] of [[0, 0, 1], [T * 2, -T * 2 + T, 0]] as [number, number, number][]) {
      const px = x + dx + ((y / (T * 2)) % 2) * 0, py = y + dy;
      g.fillStyle = horiz ? A : B;
      if (horiz) g.fillRect(px + 1, py + 1, L - 2, T - 2); else g.fillRect(px + 1, py + 1, T - 2, L - 2);
    }
  }
  for (let i = 0; i < 4000; i++) { const x = (i * 7919) % W, y = (i * 104729) % W; g.fillStyle = i % 2 ? "rgba(90,40,10,0.08)" : "rgba(255,230,190,0.07)"; g.fillRect(x, y, 6, 1); }
});
/** the compass-star medallion inlaid in the foyer floor (unlit decal on top of the parquet) */
export const starMedallionTex = () => ctex("whStar", 1024, 1024, (g) => {
  const C = 512; g.clearRect(0, 0, 1024, 1024);
  g.fillStyle = "#5a2a12"; g.beginPath(); g.arc(C, C, 500, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#e9c27a"; g.beginPath(); g.arc(C, C, 486, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#7a3a18"; g.beginPath(); g.arc(C, C, 450, 0, Math.PI * 2); g.fill();
  const star = (n: number, r0: number, r1: number, rot: number, c1: string, c2: string) => {
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2, b = a + Math.PI / n, a2 = a - Math.PI / n;
      g.fillStyle = c1; g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a2) * r0, C + Math.sin(a2) * r0); g.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1); g.closePath(); g.fill();
      g.fillStyle = c2; g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1); g.lineTo(C + Math.cos(b) * r0, C + Math.sin(b) * r0); g.closePath(); g.fill(); }
  };
  star(8, 220, 440, -Math.PI / 2 + Math.PI / 8, "#c67a3e", "#8a4420");
  star(8, 160, 400, -Math.PI / 2, "#f2d08c", "#d9a85a");
  g.fillStyle = "#2a8a80"; g.beginPath(); g.arc(C, C, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#f2d08c"; g.beginPath(); g.arc(C, C, 70, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#2a1408"; g.lineWidth = 6; g.beginPath(); g.arc(C, C, 450, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(C, C, 120, 0, Math.PI * 2); g.stroke();
});
/** tall arched stained-glass window (Tiffany style): jewel panes in lead lines, a lily in the arch (lit from behind) */
export const stainedGlassTex = () => ctex("whStained", 512, 1024, (g) => {
  const W = 512, H = 1024, cols = ["#f2c14e", "#e8833a", "#5fb7e8", "#7cc576", "#f4e3a6", "#3f8fd2", "#e05a4a"];
  g.fillStyle = "#f4e3a6"; g.fillRect(0, 0, W, H);
  let k = 0; for (let y = 0; y < H; y += 96) for (let x = 0; x < W; x += 128) { g.fillStyle = cols[(k++ * 5) % cols.length]; g.fillRect(x, y, 128, 96); }
  g.fillStyle = "#bfe3f7"; g.fillRect(64, 300, W - 128, H - 380);
  g.fillStyle = "#7cc576"; g.beginPath(); g.moveTo(W / 2, 900); g.bezierCurveTo(W / 2 - 40, 700, W / 2 + 40, 600, W / 2, 420); g.lineWidth = 14; g.strokeStyle = "#3f8a3a"; g.stroke();
  for (const s of [-1, 1]) { g.fillStyle = "#5aa84e"; g.beginPath(); g.ellipse(W / 2 + s * 70, 700, 30, 90, s * 0.6, 0, Math.PI * 2); g.fill(); }
  for (const s of [-1, 0, 1]) { g.fillStyle = "#f6f1e8"; g.beginPath(); g.ellipse(W / 2 + s * 38, 420, 26, 70, s * 0.5, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#f2c14e"; g.beginPath(); g.arc(W / 2, 450, 16, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#2a2018"; g.lineWidth = 10;
  for (let y = 0; y <= H; y += 96) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let x = 0; x <= W; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.strokeRect(64, 300, W - 128, H - 380); g.lineWidth = 24; g.strokeRect(0, 0, W, H);
});
/** Sarah's famous round SPIDERWEB window: amber, green and blue panes cut by a lead spider web */
export const spiderWebTex = () => ctex("whWeb", 1024, 1024, (g) => {
  const C = 512, R = 500, rings = [110, 200, 290, 380, 470], n = 12, cols = ["#f2c14e", "#7cc576", "#5fb7e8", "#e8833a", "#f4e3a6"];
  g.clearRect(0, 0, 1024, 1024);
  for (let r = rings.length - 1; r >= 0; r--) for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, rr = rings[r];
    g.fillStyle = cols[(i + r * 2) % cols.length]; g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a0) * rr, C + Math.sin(a0) * rr);
    g.quadraticCurveTo(C + Math.cos((a0 + a1) / 2) * rr * 0.86, C + Math.sin((a0 + a1) / 2) * rr * 0.86, C + Math.cos(a1) * rr, C + Math.sin(a1) * rr); g.closePath(); g.fill();
  }
  g.strokeStyle = "#1e1a16"; g.lineWidth = 12;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a) * R, C + Math.sin(a) * R); g.stroke(); }
  for (const rr of rings) { g.beginPath(); for (let i = 0; i <= n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2; if (i === 0) g.moveTo(C + Math.cos(a0) * rr, C + Math.sin(a0) * rr);
    g.quadraticCurveTo(C + Math.cos((a0 + a1) / 2) * rr * 0.86, C + Math.sin((a0 + a1) / 2) * rr * 0.86, C + Math.cos(a1) * rr, C + Math.sin(a1) * rr); } g.stroke(); }
  g.lineWidth = 26; g.beginPath(); g.arc(C, C, R, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#1e1a16"; g.beginPath(); g.ellipse(C + 40, C - 30, 34, 44, 0.4, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(C + 66, C - 70, 22, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { g.lineWidth = 7; g.beginPath(); g.moveTo(C + 40, C - 30 + i * 12 - 18); g.quadraticCurveTo(C + 40 + s * 60, C - 70 + i * 20, C + 40 + s * 90, C - 10 + i * 26); g.stroke(); }
});
/** Persian rug for the foot of the grand stair: navy field, red medallion, gold border, fringe edge */
export const persianRugTex = () => ctex("whPersian", 1024, 1536, (g) => {
  const W = 1024, H = 1536, NAVY = "#1f3658", RED = "#a3242c", GOLD = "#e8b84c", CR = "#f3e2b8", TL = "#2a8a80";
  g.fillStyle = RED; g.fillRect(0, 0, W, H);
  g.fillStyle = GOLD; g.fillRect(40, 40, W - 80, H - 80); g.fillStyle = NAVY; g.fillRect(90, 90, W - 180, H - 180);
  g.fillStyle = RED; g.fillRect(130, 130, W - 260, H - 260);
  g.fillStyle = NAVY; g.fillRect(160, 160, W - 320, H - 320);
  g.strokeStyle = GOLD; g.lineWidth = 8; for (let x = 60; x < W - 60; x += 40) { g.beginPath(); g.moveTo(x, 50); g.lineTo(x + 20, 80); g.lineTo(x + 40, 50); g.stroke(); g.beginPath(); g.moveTo(x, H - 50); g.lineTo(x + 20, H - 80); g.lineTo(x + 40, H - 50); g.stroke(); }
  const C = [W / 2, H / 2];
  for (const [rx, ry, c] of [[300, 460, RED], [240, 380, GOLD], [190, 310, TL], [120, 200, CR], [60, 100, RED]] as [number, number, string][]) {
    g.fillStyle = c; g.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, k = i % 2 ? 0.86 : 1; g.lineTo(C[0] + Math.cos(a) * rx * k, C[1] + Math.sin(a) * ry * k); } g.closePath(); g.fill(); }
  for (const [x, y] of [[230, 230], [W - 230, 230], [230, H - 230], [W - 230, H - 230]]) { g.fillStyle = RED; g.beginPath(); g.arc(x, y, 60, 0, Math.PI * 2); g.fill(); g.fillStyle = GOLD; g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 12000; i++) { const x = (i * 9301) % W, y = (i * 49297) % H; g.fillStyle = i % 2 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.04)"; g.fillRect(x, y, 1, 3); }
});
/** a dark-green velvet with a faint pile sheen (armchairs) */
export const velvetTex = () => ctex("whVelvet", 256, 256, (g) => { g.fillStyle = "#2f8a5a"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 3000; i++) { const x = (i * 7919) % 256, y = (i * 104729) % 256; g.fillStyle = i % 2 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"; g.fillRect(x, y, 2, 2); } });

// ================= WINCHESTER exterior textures (from the reference photos: butter-yellow walls, olive stick-work) =========
/** stick-style siding: butter-yellow fields framed by dark olive boards (1 tile = 2.4 m wide x 3.2 m floor), clean */
export const stickworkTex = () => ctex("whStick3", 768, 1024, (g) => {
  const W = 768, H = 1024, Y = "#f1cf5b", O = "#4f4b2f", YL = "#f6d977";
  g.fillStyle = Y; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 14) { g.fillStyle = "rgba(150,110,40,0.20)"; g.fillRect(0, y, W, 2); }
  g.fillStyle = O;
  g.fillRect(0, 0, W, 40); g.fillRect(0, H - 40, W, 40); g.fillRect(0, 300, W, 28); g.fillRect(0, 720, W, 28);
  for (const x of [0, 256, 512]) g.fillRect(x - 14, 0, 28, H);
  g.fillStyle = YL; for (const x of [40, 296, 552]) { g.fillRect(x, 60, 176, 220); g.fillRect(x, 760, 176, 220); }
  g.strokeStyle = O; g.lineWidth = 10; for (const x of [40, 296, 552]) { g.strokeRect(x, 60, 176, 220); g.strokeRect(x, 760, 176, 220); }
  g.lineWidth = 8; for (const x of [40, 296, 552]) { g.beginPath(); g.moveTo(x, 760); g.lineTo(x + 176, 980); g.moveTo(x + 176, 760); g.lineTo(x, 980); g.stroke(); }
});
/** fish-scale shingles (gables, turret bulges): yellow scallops with a thin olive edge */
export const fishscaleTex = () => ctex("whFish", 512, 512, (g) => {
  g.fillStyle = "#e6c870"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#7a6f40"; g.lineWidth = 4;
  for (let row = 0; row < 17; row++) for (let k = -1; k < 9; k++) {
    const cx = k * 64 + (row % 2) * 32, cy = row * 32;
    g.fillStyle = row % 2 ? "#ead07a" : "#e2c269"; g.beginPath(); g.arc(cx + 32, cy, 32, 0, Math.PI); g.fill(); g.stroke();
  }
});
/** brick-red roof shingles (the house's roofs, nudged from raspberry to brick red: no magenta) */
export const roofRedTex = () => ctex("whRoofRed2", 512, 512, (g) => {
  g.fillStyle = "#b9382f"; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 16; row++) {
    const y = row * 32; g.fillStyle = "rgba(90,20,12,0.35)"; g.fillRect(0, y + 28, 512, 4);
    for (let x = (row % 2) * 24; x < 512; x += 48) { g.fillStyle = "rgba(90,20,12,0.25)"; g.fillRect(x, y, 3, 30); g.fillStyle = row % 3 ? "rgba(255,190,160,0.08)" : "rgba(120,30,20,0.08)"; g.fillRect(x + 3, y, 45, 28); }
  }
});
/** leaded glass for the daytime windows: soft blue-grey panes with a white diamond lattice */
export const leadedTex = () => ctex("whLeaded", 256, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, "#5f86a8"); gr.addColorStop(1, "#2f4f70");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "rgba(240,236,220,0.85)"; g.lineWidth = 4;
  for (let k = -8; k < 16; k++) { g.beginPath(); g.moveTo(k * 48, 0); g.lineTo(k * 48 + 512, 512); g.stroke(); g.beginPath(); g.moveTo(k * 48, 0); g.lineTo(k * 48 - 512, 512); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.moveTo(20, 0); g.lineTo(90, 0); g.lineTo(20, 140); g.closePath(); g.fill();
});

// ================= WINCHESTER story-prop textures =================
export const brickTex = () => ctex("whBrick", 512, 512, (g) => {
  g.fillStyle = "#e9d8bf"; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 16; r++) for (let k = -1; k < 5; k++) { const x = k * 128 + (r % 2) * 64; g.fillStyle = ["#c0533c", "#b04a36", "#c9603f"][(r + k + 9) % 3]; g.fillRect(x + 4, r * 32 + 4, 120, 24); }
});
/** the room BELOW the floor window: a kitchen seen from above, a cook looking up and waving */
export const floorViewTex = () => ctex("whBelow", 512, 640, (g) => {
  g.fillStyle = "#f3e6c8"; g.fillRect(0, 0, 512, 640);
  for (let y = 0; y < 640; y += 64) for (let x = 0; x < 512; x += 64) if (((x + y) / 64) % 2) { g.fillStyle = "#2f9c94"; g.fillRect(x, y, 64, 64); }
  g.fillStyle = "#8a4a24"; g.fillRect(40, 380, 260, 140); g.strokeStyle = "#1b1712"; g.lineWidth = 8; g.strokeRect(40, 380, 260, 140);
  g.fillStyle = "#c94a3c"; g.beginPath(); g.ellipse(120, 450, 40, 30, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#f6f1e8"; g.beginPath(); g.arc(330, 250, 70, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#fbfbfb"; g.beginPath(); g.ellipse(330, 172, 60, 34, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#1b1712"; g.beginPath(); g.ellipse(305, 250, 9, 13, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(355, 250, 9, 13, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(330, 285, 18, 0, Math.PI); g.stroke();
  g.lineWidth = 10; g.beginPath(); g.moveTo(400, 250); g.lineTo(460, 170); g.stroke(); g.fillStyle = "#f6f1e8"; g.beginPath(); g.arc(462, 160, 18, 0, Math.PI * 2); g.fill(); g.lineWidth = 6; g.stroke();
});
/** a drain plate with THIRTEEN holes */
export const drainTex = () => ctex("whDrain", 256, 256, (g) => {
  g.fillStyle = "#e9eef2"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#c9d2da"; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#2a2e34"; for (let i = 0; i < 13; i++) { const a = (i / 13) * Math.PI * 2; g.beginPath(); g.arc(128 + Math.cos(a) * 72, 128 + Math.sin(a) * 72, 11, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "#7a8590"; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.stroke();
});
/** a brass door plaque with a number */
export const plaqueTex = (n: number) => ctex(`whPlaque${n}`, 256, 160, (g) => {
  g.fillStyle = "#f2c24f"; g.fillRect(0, 0, 256, 160); g.strokeStyle = "#8a5a1a"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 150);
  g.fillStyle = "#3a2410"; g.font = "bold 104px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 128, 86);
});
/** Sarah's blueprint: blue paper, white plans of a tangle of rooms and stairs */
export const blueprintTex = () => ctex("whBlueprint", 512, 384, (g) => {
  g.fillStyle = "#2f6fc4"; g.fillRect(0, 0, 512, 384); g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 1; for (let x = 0; x < 512; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 384); g.stroke(); } for (let y = 0; y < 384; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.strokeStyle = "#f4f8ff"; g.lineWidth = 5;
  for (const [x, y, w, h] of [[40, 40, 140, 100], [180, 40, 90, 160], [270, 40, 200, 70], [40, 140, 140, 200], [270, 110, 120, 120], [390, 110, 80, 230], [180, 200, 210, 140]]) g.strokeRect(x, y, w, h);
  for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(300 + i * 12, 330 - i * 14); g.lineTo(312 + i * 12, 330 - i * 14); g.stroke(); }
  g.beginPath(); g.arc(120, 90, 22, 0, Math.PI * 2); g.stroke();
});
