// EFFECT + PROP DRAWINGS (owner: staging agent). 2D Pen drawings composited as cards: knocks, gnawing chips, ghost
// voice rings, candle flames, the cat, the fish, the rat, the witch silhouette, the drop, whisper marks.
import { Pen, INK } from "../bridge/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

/** knock impact on a wall: 500 x 500, t 0..1 */
export const fxKnock = (p: Pen, t: number) => {
  const e = 1 - (1 - t) ** 2;
  for (let k = 0; k < 3; k++) {
    const r = 40 + (110 + k * 55) * e, a = Math.max(0, 1 - t * 1.2);
    if (a <= 0) continue;
    p.g.globalAlpha = a; p.arc(250, 250, r, r, -60 + k * 10, 60 - k * 10, 12 - k * 3, "#f3e7c9"); p.arc(250, 250, r, r, 120 + k * 10, 240 - k * 10, 12 - k * 3, "#f3e7c9");
  }
  p.g.globalAlpha = 1;
  if (t < 0.45) p.ell(250, 250, 34 * (1 - t), 34 * (1 - t), "#fff3c4", 6);
};
/** gnawing: wood chips flying from a bite, 400 x 400, t 0..1 (loops) */
export const fxChips = (p: Pen, t: number, seed = 1) => {
  for (let i = 0; i < 7; i++) {
    const u = (t + i / 7) % 1, a = rad(200 + ((i * 53 + seed * 17) % 140)), d = 30 + 150 * u;
    const x = 200 + d * Math.cos(a), y = 220 + d * Math.sin(a) + 160 * u * u, s = 16 * (1 - 0.5 * u);
    p.poly([[x - s, y - s * 0.5], [x + s, y - s * 0.3], [x + s * 0.6, y + s * 0.6], [x - s * 0.8, y + s * 0.4]], i % 2 ? "#e2b781" : "#c99a63", 4);
  }
  // bite marks
  for (let k = -2; k <= 2; k++) p.ell(200 + k * 22, 215, 9, 13, "#2b1a14", 3);
};
/** ghost voice: wavy rings spreading from a point, 600 x 600, t 0..1 */
export const fxVoice = (p: Pen, t: number, col = "#b9f3d0") => {
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = (t + k / 3) % 1, r = 40 + 230 * u;
    g.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2, rr = r + 9 * Math.sin(a * 9 + t * 20 + k);
      const x = 300 + rr * Math.cos(a), y = 300 + rr * Math.sin(a);
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.strokeStyle = col; g.globalAlpha = 0.85 * (1 - u); g.lineWidth = 10 * (1 - u) + 3; g.stroke();
  }
  g.globalAlpha = 1;
};
/** candle flame, 200 x 400; bend -1..1 leans the tip sideways */
export const fxFlame = (p: Pen, bend = 0, flick = 0) => {
  const tip: P2 = [100 + 70 * bend + 6 * flick, 40 - 10 * Math.abs(bend)];
  const pts: P2[] = [[100, 370], [55, 300], [62 + 20 * bend, 190], tip, [138 + 20 * bend, 190], [145, 300]];
  const g = p.g;
  g.beginPath(); g.moveTo(100, 375);
  g.bezierCurveTo(30, 330, 50 + 30 * bend, 200, tip[0], tip[1]);
  g.bezierCurveTo(150 + 30 * bend, 200, 170, 330, 100, 375);
  g.fillStyle = "#ffd36b"; g.fill();
  g.beginPath(); g.moveTo(100, 370); g.bezierCurveTo(70, 340, 80 + 15 * bend, 270, 100 + 35 * bend, 210); g.bezierCurveTo(118 + 15 * bend, 270, 130, 340, 100, 370);
  g.fillStyle = "#fff8e0"; g.fill();
  void pts;
};
/** sitting cat, 600 x 1000 design (soles at 975); sniff 0..1 leans the head down; dead = belly up, X eyes */
export const catCard = (p: Pen, sniff: number, dead: boolean) => {
  const fur = "#59525f", belly = "#8a8290", ow = 9;
  if (dead) { // belly up, legs in the air, X eyes (kept inside the 600-wide card)
    p.stroke([[60, 900], [110, 880]], 22, fur);
    for (const x of [170, 220, 300, 350]) p.stroke([[x, 830], [x + (x < 260 ? -14 : 14), 690]], 22, fur);
    for (const x of [170, 220, 300, 350]) p.ell(x + (x < 260 ? -14 : 14), 685, 16, 12, fur, 5);
    p.ell(260, 890, 165, 85, fur, ow);
    p.ell(260, 878, 100, 45, belly, 0);
    p.ell(470, 895, 85, 75, fur, ow);
    p.poly([[520, 850], [560, 800], [548, 870]], fur, 6); p.poly([[440, 840], [425, 790], [478, 828]], fur, 6);
    for (const [cx, cy] of [[450, 890], [500, 896]]) { p.stroke([[cx - 12, cy - 12], [cx + 12, cy + 12]], 6); p.stroke([[cx - 12, cy + 12], [cx + 12, cy - 12]], 6); }
    return;
  }
  const hx = 300 + 90 * sniff, hy = 560 + 170 * sniff;
  p.stroke([[420, 930], [520, 900], [540, 780]], 26, fur); // tail
  p.ell(300, 800, 150, 175, fur, ow);                   // body
  p.ell(300, 830, 70, 110, belly, 0);
  for (const x of [240, 360]) p.ell(x, 965, 36, 18, fur, 6);  // paws
  p.poly([[hx - 105, hy - 40], [hx - 80, hy - 160], [hx - 25, hy - 85]], fur, 7); // ears
  p.poly([[hx + 105, hy - 40], [hx + 80, hy - 160], [hx + 25, hy - 85]], fur, 7);
  p.ell(hx, hy, 115, 100, fur, ow);
  p.ell(hx - 40, hy - 10, 16, 22, "#e9e36a", 4); p.ell(hx + 40, hy - 10, 16, 22, "#e9e36a", 4);
  p.ell(hx - 40, hy - 10, 5, 16, INK, 0); p.ell(hx + 40, hy - 10, 5, 16, INK, 0);
  p.poly([[hx - 10, hy + 22], [hx + 10, hy + 22], [hx, hy + 34]], "#d98a9a", 3);
  for (const s of [-1, 1]) for (const k of [0, 1]) p.stroke([[hx + s * 30, hy + 30 + k * 10], [hx + s * 120, hy + 20 + k * 22]], 3, "#cfcfd8");
};
/** fish, 800 x 400 */
export const fishCard = (p: Pen) => {
  p.poly([[640, 200], [790, 90], [760, 200], [790, 310]], "#d9792c", 10);
  p.ell(390, 200, 290, 150, "#f0943a", 10);
  p.ell(380, 250, 230, 60, "#f7c27a", 0);
  p.poly([[330, 60], [470, 20], [500, 80]], "#d9792c", 8);
  p.ell(200, 170, 32, 32, "#ffffff", 7); p.dot(205, 172, 14);
  p.arc(140, 230, 30, 20, 20, 120, 7);
  for (const x of [300, 360, 420, 480]) p.arc(x, 200, 30, 80, -60, 60, 5, "rgba(120,50,20,0.6)");
};
/** little rat, 600 x 400 */
export const ratCard = (p: Pen) => {
  p.stroke([[430, 300], [540, 330], [580, 260]], 12, "#c98f96");
  p.ell(330, 280, 150, 95, "#8b8790", 9);
  p.ell(170, 250, 85, 70, "#8b8790", 9);
  p.ell(200, 170, 42, 46, "#c98f96", 7);
  p.ell(140, 250, 12, 15, INK, 0);
  p.ell(88, 270, 14, 12, "#e58a9a", 4);
  for (const k of [0, 1]) p.stroke([[100, 285 + k * 10], [40, 290 + k * 20]], 3);
};
/** witch silhouette holding a poison bottle, 600 x 1000 */
export const witchCard = (p: Pen) => {
  const sil = "#1a1424";
  p.poly([[300, 40], [230, 300], [170, 330], [430, 330], [370, 300]], sil, 8);           // hat
  p.ell(300, 400, 110, 110, sil, 8);                                                       // head
  p.poly([[300, 470], [150, 960], [450, 960]], sil, 8);                                    // robe
  p.ell(260, 400, 16, 10, "#c8ff7a", 0); p.ell(340, 400, 16, 10, "#c8ff7a", 0);             // eyes glow
  p.stroke([[400, 560], [500, 640]], 22, sil);
  p.poly([[480, 600], [540, 600], [550, 720], [470, 720]], "#2a6a3a", 7);                   // bottle
  p.ell(510, 590, 18, 12, "#8a6a4a", 5);
  p.ell(510, 680, 30, 22, "#7cf07c", 0);
};
/** a falling black drop, 100 x 160 */
export const dropCard = (p: Pen) => { p.poly([[50, 10], [85, 100], [50, 150], [15, 100]], "#120c14", 5); };
/** whisper marks (three short curves), 300 x 300 */
export const fxWhisper = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const u = (t + k / 3) % 1;
    p.g.globalAlpha = 1 - u; p.arc(60 + 160 * u, 150, 30, 50 + 20 * u, -50, 50, 7, "#f2ead8");
  }
  p.g.globalAlpha = 1;
};
