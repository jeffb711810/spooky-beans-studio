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
export const logsTex = (key = "logs", base = "#8a6143") => ctex(key, 2048, 2048, (g) => {
  const W = 2048, n = 8, h = W / n, r = rng(seedOf(key));
  // chinking: lime + clay daub, mottled, with straw flecks and pits (only the bands between logs show)
  g.fillStyle = "#c3b499"; g.fillRect(0, 0, W, W);
  const daub: Op[] = [];
  for (let k = 0; k < 700; k++) {
    const x = r() * W, y = Math.floor(r() * n) * h + U(r, -32, 32), rad = U(r, 5, 22);
    const c = pick(r, ["238,228,206", "142,126,102", "212,200,176", "124,108,88"]), a = U(r, 0.15, 0.4);
    daub.push(() => blotch(g, x, y, rad, 1.9, c, a));
  }
  for (let k = 0; k < 520; k++) {
    const x = r() * W, y = Math.floor(r() * n) * h + U(r, -30, 30), rad = U(r, 0.8, 2.2), dark = r() < 0.7;
    daub.push(() => { g.fillStyle = dark ? "rgba(62,48,36,0.55)" : "rgba(250,244,228,0.6)"; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); });
  }
  for (let k = 0; k < 140; k++) {
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
    for (let x = U(r, 0, 60); x < W; x += U(r, 70, 150)) { // adze scallops (hewn facets)
      const bend = U(r, 10, 22), xx = x, t0 = y0 + U(r, 10, 30), t1 = y1 - U(r, 12, 30);
      ops.push(() => {
        g.lineCap = "round";
        g.strokeStyle = "rgba(255,232,200,0.09)"; g.lineWidth = 7;
        g.beginPath(); g.moveTo(xx, t0); g.quadraticCurveTo(xx + bend, (t0 + t1) / 2, xx, t1); g.stroke();
        g.strokeStyle = "rgba(40,22,12,0.11)"; g.lineWidth = 3;
        g.beginPath(); g.moveTo(xx + 5, t0); g.quadraticCurveTo(xx + bend + 5, (t0 + t1) / 2, xx + 5, t1); g.stroke();
      });
    }
    for (let k = 0; k < 24; k++) { // grain
      const dark = r() < 0.66;
      ops.push(grainOp(g, r, r() * W, U(r, y0 + 10, y1 - 8), U(r, 260, 1100), U(r, 1.5, 4.5), U(r, 1.4, 3),
        dark ? `rgba(46,26,16,${U(r, 0.16, 0.28).toFixed(2)})` : `rgba(255,232,200,${U(r, 0.08, 0.14).toFixed(2)})`));
    }
    for (let k = 0, nc = 1 + Math.floor(r() * 3); k < nc; k++) { // drying checks: thin dark cracks with a light lip
      const x = r() * W, y = U(r, y0 + 25, y1 - 30), len = U(r, 160, 620);
      const crack = grainOp(g, r, x, y, len, 2.5, 2.4, "rgba(22,12,8,0.72)");
      const lip = grainOp(g, r, x + 10, y + 2.6, len - 20, 1, 1.4, "rgba(255,230,200,0.16)");
      ops.push(crack, lip);
    }
    for (let k = 0, nk = r() < 0.75 ? 1 + Math.floor(r() * 2) : 0; k < nk; k++) { // knots: dark core, rings, grain swirling round
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
    if (r() < 0.35) { // spliced butt joint: one log end stands proud and shows a sliver of end grain
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
export const quiltTex = (key: string, cols: string[]) => ctex("quilt" + key, 2048, 1280, (g) => {
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
export const shinglesTex = () => ctex("shingles", 1024, 1024, (g) => {
  const W = 1024, n = 8, h = W / n, r = rng(seedOf("shingles"));
  g.fillStyle = "#18181a"; g.fillRect(0, 0, W, W);
  // weathered grey cedar (green >= red): warm browns turned mauve/purple under the blue moonlight (user, example 3)
  const tones = ["#5c5a4e", "#605d50", "#585649", "#5e5c52", "#555447", "#5b5a4f"];
  const ops: Op[] = [], moss: Op[] = [];
  for (let row = 0; row < n; row++) {
    const y0 = row * h, xs = U(r, 0, 140);
    let x = xs;
    while (x < xs + W - 1) {
      let w = U(r, 50, 150); if (xs + W - (x + w) < 45) w = xs + W - x;
      const x0 = x + U(r, 1.2, 2.4), x1 = x + w - U(r, 1.2, 2.4), yl = y0 + h - U(r, 1.5, 5), yr = y0 + h - U(r, 1.5, 5);
      const col = jit(r, pick(r, tones), 0.05, 3, 0.08), chip = r() < 0.15 ? U(r, 6, 14) * (r() < 0.5 ? -1 : 1) : 0;
      const grains = Array.from({ length: 4 + Math.floor(r() * 6) }, () => [U(r, x0 + 3, x1 - 3), y0 + U(r, 0, 50), U(r, -3, 3), r() < 0.6 ? 1 : 0, U(r, 0.9, 2)]);
      const split = r() < 0.18 ? [U(r, x0 + 8, x1 - 8), U(r, 30, 80)] : null;
      const silver = r() < 0.3 ? [U(r, x0, x1), U(r, 0.05, 0.1)] : null;
      const stain = r() < 0.3 ? [U(r, x0 + 5, x1 - 5), U(r, 8, 22)] : null;
      const lichen = r() < 0.22 ? Array.from({ length: 2 + Math.floor(r() * 4) }, () => [U(r, x0 + 4, x1 - 4), y0 + U(r, 25, h - 12), U(r, 1.5, 3.2)]) : [];
      const mossD = r() < 0.13 ? Array.from({ length: 6 + Math.floor(r() * 9) }, () => [U(r, x0, x1), U(r, -12, 2), U(r, 1.8, 4.5), Math.floor(r() * 3)]) : [];
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
export const dirtTex = () => ctex("dirt", 1024, 1024, (g) => {
  const W = 1024, r = rng(seedOf("dirt")), n1 = pn2(r, 4), n2 = pn2(r, 9), n3 = pn2(r, 23), nh = pn2(r, 6);
  const img = g.createImageData(W, W), d = img.data, base = [107, 84, 64];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / W, a = n1(u, v) * 0.5 + n2(u, v) * 0.32 + n3(u, v) * 0.18 - 0.5, b = nh(u, v) - 0.5;
    const k = 1 + a * 0.34 + (r() - 0.5) * 0.035, i = (y * W + x) * 4;
    d[i] = base[0] * k * (1 + b * 0.07); d[i + 1] = base[1] * k; d[i + 2] = base[2] * k * (1 - b * 0.12); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const ops: Op[] = [];
  for (let k = 0; k < 22; k++) {
    const x = r() * W, y = r() * W, rad = U(r, 50, 140), damp = k % 2 === 0, a = U(r, 0.1, 0.18);
    ops.push(() => blotch(g, x, y, rad, 1.6, damp ? "42,30,22" : "186,158,120", a));
  }
  for (let k = 0; k < 1000; k++) {
    const x = r() * W, y = r() * W, rad = U(r, 0.8, 1.9), dark = r() < 0.6;
    ops.push(() => { g.fillStyle = dark ? "rgba(42,30,22,0.4)" : "rgba(196,172,138,0.2)"; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); });
  }
  for (let k = 0; k < 30; k++) {
    const x = r() * W, y = r() * W, l = U(r, 8, 22), a = r() * TAU, twig = r() < 0.35, lw = U(r, 1.2, 2);
    ops.push(() => { g.strokeStyle = twig ? "rgba(55,38,26,0.6)" : "rgba(200,172,112,0.55)"; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); });
  }
  const pcols = ["#80776c", "#8c7f6c", "#71665b", "#968a76", "#675e57", "#857865"];
  for (let k = 0; k < 110; k++) {
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
export const tickingTex = () => ctex("ticking", 1024, 256, (g) => {
  const W = 1024, H = 256, r = rng(seedOf("ticking"));
  g.fillStyle = "#e7ddc6"; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 32; k++) {
    const x = k * 32;
    g.fillStyle = jit(r, "#6f7aa5", 0.05, 3, 0.1); g.fillRect(x + 4, 0, 8, H);
    g.fillStyle = "rgba(111,122,165,0.85)"; g.fillRect(x + 17, 0, 2, H); g.fillRect(x + 22, 0, 2, H);
  }
  for (let y = 0; y < H; y += 3) { g.fillStyle = `rgba(110,92,64,${U(r, 0.03, 0.07).toFixed(3)})`; g.fillRect(0, y, W, 1); }
  for (let x = 1; x < W; x += 4) { g.fillStyle = `rgba(255,252,240,${U(r, 0.03, 0.07).toFixed(3)})`; g.fillRect(x, 0, 1, H); }
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
  const pl = planksHD().image as CanvasImageSource;
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
