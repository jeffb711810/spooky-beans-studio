// BUSBY story effects (2D cards, drawn in card pixels like fxart.ts): the fight cloud, the curse glow, the slipper,
// the date slam, the sweep's falling top hat + brush, the bomber over the moon, headlight sweep, the hubcap, a pint.
import { Pen, ellPts } from "../bridge/toon";

const INKC = "#231810", TAU = Math.PI * 2;
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const withA = (p: Pen, a: number, f: () => void) => { const g = p.g, o = g.globalAlpha; g.globalAlpha = o * Math.max(0, Math.min(1, a)); f(); g.globalAlpha = o; };

/** the cartoon fight (400 x 400), his finish: a boiling two-tone dust cloud (shaded puffs, heavy ink), Busby's red
 *  sleeves and Auty's blue ones punching out with solid fists and boots, the two faces popping out, both hats flying,
 *  stars and dust. The layout re-boils every step (on twos). */
export const fxCloud = (p: Pen, t: number) => {
  const g = p.g, k = Math.round(t * 20), R = (i: number) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  const C = 200, sc = 1 + 0.035 * Math.sin(k * 1.9);
  g.save(); g.translate(C, C); g.scale(sc, sc * (1 - 0.03 * Math.sin(k * 1.9))); g.translate(-C, -C);
  const puff = (x: number, y: number, r: number, col: string, shade: string, ol: number) => {
    p.ell(x, y, r, r * 0.88, col, 0);
    g.save(); p.path(ellPts(x, y, r, r * 0.88), true); g.clip(); p.ell(x + r * 0.28, y + r * 0.42, r * 0.95, r * 0.6, shade, 0); g.restore();
    p.ell(x, y, r, r * 0.88, null, ol);
  };
  // back ring of darker puffs
  // a layer of puffs: ink pass first, then the fills on top, so the ink only shows round the cloud's outside
  const layer = (P: [number, number, number][], col: string, shade: string, ol: number) => {
    for (const [x, y, r] of P) p.ell(x, y, r + ol * 0.5, r * 0.88 + ol * 0.5, INKC, 0);
    for (const [x, y, r] of P) puff(x, y, r, col, shade, 0);
  };
  const back: [number, number, number][] = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + k * 0.31, r = 112 + 16 * R(i); back.push([C + Math.cos(a) * r * 0.92, C + 8 + Math.sin(a) * r * 0.74, 50 + 12 * R(i + 20)]); }
  layer(back, "#e2d8c6", "rgba(150,140,128,0.35)", 12);
  // limbs punching out (sleeve + solid fist / trouser + boot), alternating the two men's colours
  const limbs: [number, string, "fist" | "boot"][] = [[0.15, "#8a2e24", "fist"], [1.35, "#4f73a6", "fist"], [2.45, "#3a2a22", "boot"], [3.5, "#8a2e24", "fist"], [4.55, "#ece4d2", "boot"], [5.55, "#4f73a6", "fist"]];
  limbs.forEach(([a0, col, kind], i) => {
    const a = a0 + 0.45 * Math.sin(k * 1.7 + i * 2.1), out = 150 + 18 * Math.sin(k * 2.3 + i), x0 = C + Math.cos(a) * 70, y0 = C + Math.sin(a) * 60, x1 = C + Math.cos(a) * out, y1 = C + Math.sin(a) * out * 0.84;
    p.stroke([[x0, y0], [x1, y1]], 30); p.stroke([[x0, y0], [x1, y1]], 20, col);
    if (kind === "fist") { p.ell(x1, y1, 19, 19, INKC, 0); p.ell(x1 - 6, y1 - 7, 5, 4, "rgba(255,255,255,0.35)", 0); }
    else { const ang = (a * 180) / Math.PI; p.ell(x1 + Math.cos(a) * 8, y1 + Math.sin(a) * 8, 26, 15, "#1e1814", 5, 0, 360, ang); }
  });
  // front puffs (lighter, bigger), boiling
  const front: [number, number, number][] = [[C, C + 12, 78]];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - k * 0.23, r = 62 + 14 * R(i + 40); front.push([C + Math.cos(a) * r, C + 12 + Math.sin(a) * r * 0.78, 50 + 12 * R(i + 60)]); }
  layer(front, "#f8f2e6", "rgba(190,176,156,0.4)", 13);
  // the two faces popping out (on alternate steps): Busby furious (red), Auty shocked under his nightcap
  const head = (x: number, y: number, furious: boolean) => {
    p.ell(x, y, 34, 31, furious ? "#e65a40" : "#fbf7f0", 0); p.ell(x, y, 34, 31, null, 5);
    if (furious) { p.stroke([[x - 20, y - 14], [x - 6, y - 8]], 5); p.stroke([[x + 20, y - 14], [x + 6, y - 8]], 5); p.ell(x - 11, y - 2, 4, 5, INKC, 0); p.ell(x + 11, y - 2, 4, 5, INKC, 0); p.poly([[x - 13, y + 10], [x + 13, y + 10], [x + 13, y + 19], [x - 13, y + 19]], "#ffffff", 3); for (const dx of [-6, 0, 6]) p.stroke([[x + dx, y + 10], [x + dx, y + 19]], 2); }
    else { for (const s of [-1, 1]) { p.ell(x + s * 11, y - 3, 9, 9, "#ffffff", 3); p.ell(x + s * 11, y - 2, 3, 3, INKC, 0); } p.ell(x, y + 15, 5, 6, INKC, 0); p.poly([[x - 30, y - 18], [x + 26, y - 26], [x + 52, y - 4], [x + 18, y - 30]], "#e0b04a", 4); }
  };
  if (k % 4 < 2) head(C - 70, C - 84, true); else head(C + 76, C - 70, false);
  // both hats flying round the outside
  { const a = k * 0.62, x = C + Math.cos(a) * 170, y = C - 40 + Math.sin(a) * 120; g.save(); g.translate(x, y); g.rotate(k * 0.7); p.poly([[-34, 4], [34, 4], [22, -14], [0, -8], [-22, -14]], "#2a2420", 5); p.stroke([[-30, 2], [30, 2]], 4, "#d9a83a"); g.restore(); }
  { const a = k * 0.62 + Math.PI, x = C + Math.cos(a) * 168, y = C - 30 + Math.sin(a) * 110; g.save(); g.translate(x, y); g.rotate(-k * 0.8); p.poly([[-26, 10], [24, 10], [8, -22], [30, -34]], "#e0b04a", 5); p.ell(32, -36, 9, 9, "#f4efe2", 4); g.restore(); }
  // stars + dust specks
  for (let s = 0; s < 4; s++) {
    const a = s * 1.57 + k * 0.5, x = C + Math.cos(a) * 178, y = C - 70 + Math.sin(a) * 60, r = 15 + 4 * Math.sin(k + s);
    const pts: [number, number][] = []; for (let i = 0; i < 10; i++) { const q = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; pts.push([x + Math.cos(q) * rr, y + Math.sin(q) * rr]); }
    p.poly(pts, "#ffd84a", 4);
  }
  for (let i = 0; i < 14; i++) { const a = R(i + 80) * TAU, r = 150 + 40 * R(i + 90); p.ell(C + Math.cos(a) * r, C + Math.sin(a) * r * 0.8, 4 + 3 * R(i), 4 + 3 * R(i), "#cbbfa8", 2); }
  g.restore();
};
/** HIS steam: solid white puffs with a heavy outline jetting sideways out of the head, then rising (300 x 220; dir 1 =
 *  to the right, the head is at the near edge) */
export const fxSteamJet = (p: Pen, t: number, dir: number) => {
  const P: [number, number, number][] = [];
  for (let i = 0; i < 3; i++) { const u = (t + i / 3) % 1; if (u > 0.9) continue; P.push([(dir > 0 ? 24 : 276) + dir * 210 * u, 168 - 130 * u * u, 14 + 34 * Math.sin(Math.PI * Math.min(1, u * 1.1))]); }
  for (const [x, y, r] of P) { p.ell(x, y, r + 5, r * 0.86 + 5, INKC, 0); p.ell(x + r * 0.5, y - r * 0.4, r * 0.62 + 5, r * 0.55 + 5, INKC, 0); }
  for (const [x, y, r] of P) { p.ell(x, y, r, r * 0.86, "#fbf8f2", 0); p.ell(x + r * 0.5, y - r * 0.4, r * 0.62, r * 0.55, "#fbf8f2", 0); p.ell(x + r * 0.2, y + r * 0.3, r * 0.6, r * 0.3, "rgba(190,184,176,0.45)", 0); }
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
/** a pint (160 x 220), his prop finish: a nonic glass (bulge near the rim), amber beer darker at the foot, rising
 *  bubbles, a lumpy foam head, glass rim + two reflections, one heavy ink outline */
export const fxPint = (p: Pen) => {
  const g = p.g, glass: [number, number][] = [[34, 34], [126, 34], [128, 58], [121, 70], [112, 204], [48, 204], [39, 70], [32, 58]];
  const beer: [number, number][] = [[40, 52], [120, 52], [122, 60], [116, 72], [108, 198], [52, 198], [44, 72], [38, 60]];
  p.poly(glass, "rgba(236,244,246,0.55)", 0); // the glass itself (pale, see-through feel)
  const gr = g.createLinearGradient(0, 52, 0, 200); gr.addColorStop(0, "#f6b636"); gr.addColorStop(0.45, "#e8962a"); gr.addColorStop(1, "#b9661a");
  p.poly(beer, gr as unknown as string, 0);
  g.save(); p.path(beer.map(([x, y]) => [x, y] as [number, number]), true); g.clip();
  for (let i = 0; i < 14; i++) { const x = 54 + ((i * 37) % 56), y = 80 + ((i * 53) % 110), r = 1.6 + (i % 3) * 0.8; p.ell(x, y, r, r, "rgba(255,240,200,0.75)", 0); }
  g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(40, 52, 26, 150); // the lit side of the glass
  g.restore();
  // foam: a lumpy head sitting just over the rim, with a few bubbles
  const foam: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const x = 34 + (92 * i) / 12, y = 40 - 9 * Math.sin((i / 12) * Math.PI) - (i % 2 ? 4 : 0); foam.push([x, y]); }
  foam.push([126, 56], [34, 56]);
  p.poly(foam, "#fff8ea", 6);
  for (const [x, y, r] of [[56, 44, 3], [74, 40, 2.4], [98, 45, 3.2], [112, 41, 2]] as const) p.ell(x, y, r, r, "rgba(226,206,170,0.9)", 0);
  // glass reflections + rim, then the heavy ink outline around the whole glass
  p.poly([[44, 74], [52, 74], [58, 192], [52, 192]], "rgba(255,255,255,0.62)", 0);
  p.poly([[104, 80], [108, 80], [104, 180], [101, 180]], "rgba(255,255,255,0.35)", 0);
  p.poly(glass, null, 8);
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
