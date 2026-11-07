// BUSBY story effects (2D cards, drawn in card pixels like fxart.ts): the fight cloud, the curse glow, the slipper,
// the date slam, the sweep's falling top hat + brush, the bomber over the moon, headlight sweep, the hubcap, a pint.
import { Pen } from "../bridge/toon";

const INKC = "#231810", TAU = Math.PI * 2;
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const withA = (p: Pen, a: number, f: () => void) => { const g = p.g, o = g.globalAlpha; g.globalAlpha = o * Math.max(0, Math.min(1, a)); f(); g.globalAlpha = o; };

/** the cartoon fight: a boiling dust ball with fists, a boot, stars and a flying slipper poking out (400 x 400) */
export const fxCloud = (p: Pen, t: number) => {
  const g = p.g, k = Math.floor(t * 24);
  for (let i = 0; i < 11; i++) { // the puffs boil (new layout every 2 frames)
    const a = (i / 11) * TAU + k * 0.37, r = 110 + 22 * Math.sin(i * 2.3 + k), x = 200 + Math.cos(a) * r * 0.9, y = 205 + Math.sin(a) * r * 0.75;
    p.ell(x, y, 62 + 10 * Math.sin(i + k), 54 + 8 * Math.cos(i * 1.7 + k), "#efe6d6", 7);
  }
  p.ell(200, 205, 120, 100, "#f6efe2", 0);
  const pokes = [[0.2, "fist"], [2.1, "boot"], [3.6, "fist"], [5.0, "hat"]] as const;
  pokes.forEach(([a0, kind], i) => {
    const a = a0 + 0.35 * Math.sin(k * 1.3 + i), x = 200 + Math.cos(a) * 150, y = 205 + Math.sin(a) * 125;
    p.stroke([[200 + Math.cos(a) * 100, 205 + Math.sin(a) * 85], [x, y]], 9);
    if (kind === "fist") p.ell(x, y, 17, 17, INKC, 0);
    else if (kind === "boot") p.ell(x, y, 26, 14, INKC, 0, 0, 360, (a * 180) / Math.PI);
    else { p.poly([[x - 30, y + 8], [x + 30, y + 8], [x + 18, y - 12], [x - 18, y - 12]], "#2a2420", 5); }
  });
  for (let s = 0; s < 4; s++) { // stars
    const a = s * 1.6 + k * 0.5, x = 200 + Math.cos(a) * 165, y = 120 + Math.sin(a) * 60, r = 16;
    const pts: [number, number][] = []; for (let i = 0; i < 10; i++) { const q = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; pts.push([x + Math.cos(q) * rr, y + Math.sin(q) * rr]); }
    p.poly(pts, "#ffd84a", 4);
  }
  void g;
};
/** the curse: a red glow (soft, additive) */
export const fxCurse = (p: Pen, t: number) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 4, 128, 128, 128), a = 0.85 * sm(t * 4) * (0.85 + 0.15 * Math.sin(t * 40));
  gr.addColorStop(0, `rgba(255,110,40,${a})`); gr.addColorStop(0.35, `rgba(235,60,15,${a * 0.55})`); gr.addColorStop(1, "rgba(220,50,10,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
/** Auty's slipper, left behind on the floor (200 x 120) */
export const fxSlipper = (p: Pen) => {
  p.ell(100, 64, 84, 34, "#b84a3a", 7); p.ell(68, 58, 40, 22, "#7a2a22", 0); p.ell(132, 60, 30, 16, "#f0e2c8", 5);
};
/** the date slam: 1702 -> c.1840 (720 x 420) */
export const fxDate = (p: Pen, t: number) => {
  const g = p.g, s = t < 0.12 ? 1.6 - 5 * t : 1, a = sm(t * 8);
  withA(p, a, () => {
    g.save(); g.translate(360, 210); g.scale(s, s); g.rotate(-0.05); g.translate(-360, -210);
    p.poly([[30, 40], [690, 20], [700, 380], [20, 400]], "#f4ead2", 12);
    g.font = "bold 132px Georgia, serif"; g.textAlign = "center"; g.lineWidth = 10; g.strokeStyle = INKC;
    g.fillStyle = "#8a1a12"; g.strokeText("1702", 190, 250); g.fillText("1702", 190, 250);
    g.fillStyle = INKC; g.font = "bold 90px Georgia, serif"; g.fillText("→", 360, 240);
    const b = sm((t - 0.35) * 6); withA(p, b, () => { g.font = "bold 120px Georgia, serif"; g.fillStyle = "#1f5a34"; g.strokeText("c.1840", 540, 250); g.fillText("c.1840", 540, 250); });
    g.font = "italic 44px Georgia, serif"; g.fillStyle = "#5a3a10"; withA(p, b, () => g.fillText("built 138 years later", 360, 340));
    g.restore();
  });
};
/** the sweep's top hat (spinning) and brush (falling past the window) (300 x 300) */
export const fxSweepHat = (p: Pen, t: number) => {
  const g = p.g; g.save(); g.translate(150, 150); g.rotate(t * 9); g.translate(-150, -150);
  p.poly([[100, 70], [200, 70], [206, 200], [94, 200]], "#1e1e22", 7); p.ell(150, 205, 90, 22, "#1e1e22", 7); p.poly([[96, 175], [204, 175], [205, 192], [95, 192]], "#3a3a40", 0);
  g.restore();
};
export const fxBrush = (p: Pen, t: number) => {
  const g = p.g; g.save(); g.translate(150, 150); g.rotate(-t * 7 + 0.6); g.translate(-150, -150);
  p.line([[150, 40], [150, 210]], "#7a4a24", 14); for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; p.stroke([[150, 230], [150 + Math.cos(a) * 52, 230 + Math.sin(a) * 52]], 7); }
  p.ell(150, 230, 18, 18, INKC, 0); g.restore();
};
/** soot puff (300 x 300) */
export const fxSoot = (p: Pen, t: number) => {
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 30 + 90 * t; withA(p, 1 - t, () => p.ell(150 + Math.cos(a) * r, 150 + Math.sin(a) * r * 0.7, 38 + 30 * t, 32 + 26 * t, "#3a3a3e", 0)); }
};
/** a Lancaster-style bomber silhouette (dark, flat) crossing the moon (400 x 160) */
export const fxBomber = (p: Pen) => {
  p.poly([[20, 80], [380, 70], [392, 80], [380, 90], [20, 88]], "#0e1424", 0);
  p.poly([[150, 78], [230, 78], [260, 10], [222, 10]], "#0e1424", 0); p.poly([[150, 84], [230, 84], [262, 150], [222, 150]], "#0e1424", 0);
  p.poly([[20, 80], [40, 50], [56, 50], [50, 82]], "#0e1424", 0);
};
/** headlight sweep on a wall (soft additive streak, 512 x 256) */
export const fxBeam = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(256, 128, 6, 256, 128, 256);
  gr.addColorStop(0, "rgba(255,248,220,0.95)"); gr.addColorStop(0.3, "rgba(255,236,190,0.5)"); gr.addColorStop(1, "rgba(255,230,180,0)");
  g.save(); g.scale(1, 0.5); g.fillStyle = gr; g.beginPath(); g.arc(256, 256, 256, 0, TAU); g.fill(); g.restore();
};
/** the hubcap that rolls in after the crash (240 x 240): chrome disc with spokes */
export const fxHubcap = (p: Pen, t: number) => {
  const g = p.g; g.save(); g.translate(120, 120); g.rotate(t * 14); g.translate(-120, -120);
  p.ell(120, 120, 100, 100, "#c8d0d8", 9); p.ell(120, 120, 64, 64, "#e8eef2", 5); p.ell(120, 120, 18, 18, "#8a929a", 4);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; p.stroke([[120 + Math.cos(a) * 22, 120 + Math.sin(a) * 22], [120 + Math.cos(a) * 62, 120 + Math.sin(a) * 62]], 6, "#6a7078"); }
  g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.ellipse(88, 82, 26, 12, -0.6, 0, TAU); g.fill(); g.restore();
};
/** a pint in a hand (160 x 220) */
export const fxPint = (p: Pen) => {
  p.poly([[40, 40], [120, 40], [112, 200], [48, 200]], "#d88a1c", 7); p.ell(80, 42, 44, 16, "#fff6e0", 6); p.poly([[52, 60], [62, 60], [60, 185], [54, 185]], "rgba(255,255,255,0.55)", 0);
};
/** foam bubbles settling in an abandoned pint (twinkle-ish dots, 200 x 200) */
export const fxBubbles = (p: Pen, t: number) => {
  for (let i = 0; i < 9; i++) { const y = 180 - ((t * 160 + i * 41) % 170), x = 60 + ((i * 37) % 80); withA(p, 0.8, () => p.ell(x, y, 5, 5, "#fff6d8", 2)); }
};
/** the expert's magnifier as a ring + handle (seen around the lens shot), 300 x 300 */
export const fxRing = (p: Pen) => {
  p.line([[210, 210], [290, 292]], "#7a4a24", 30);
  const g = p.g; g.save(); g.beginPath(); g.arc(140, 140, 120, 0, TAU); g.arc(140, 140, 98, 0, TAU, true); g.fillStyle = "#d9a641"; g.fill("evenodd"); g.lineWidth = 7; g.strokeStyle = INKC; g.stroke(); g.restore();
  p.g.fillStyle = "rgba(220,240,255,0.12)"; p.g.beginPath(); p.g.arc(140, 140, 98, 0, TAU); p.g.fill();
  p.g.strokeStyle = "rgba(255,255,255,0.55)"; p.g.lineWidth = 8; p.g.beginPath(); p.g.arc(140, 140, 84, 3.6, 4.4); p.g.stroke();
};
