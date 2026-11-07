// BUSBY (The Chair Nobody Is Allowed to Sit In): hero props at reference detail (user: "little details that are
// important in the story need to look good and eye popping"). Reference lesson: his story props are MODELLED (turned
// profiles, bevels, separate parts the ink can outline), carry painted detail (grain, wear, readable lettering), and
// metal reads as metal (a bright moving reflection band + a hot spot), never one flat colour.
//  - the museum wall (x = BX): the cursed Windsor chair on a high shelf, brass plaque, gilt frames, rope barrier, spot
//  - the forgers' bench (x = CX, 1702): fake crowns with struck faces and reeded edges, a mould, a crucible, a candle
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, lam } from "../bridge/build";
import { GLOSS_OF } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { ctex, rep, planksHD } from "../bridge/paint";
import { halo } from "./fx3d";
import { parquetTex, stoneTex } from "./textures";

export const BX = 600; // museum: back wall z = -3, the chair's seat top at y = SEAT_Y
export const CX = 640; // forgers' bench: top at y = BENCH_Y, centred on z = 0
export const SEAT_Y = 2.38, BENCH_Y = 0.9;
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const R01 = (seed: number) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

// ---------------------------------------------------------------- textures
/** wood grain, streaks running along the texture's v axis (lathe parts: v = along the part) */
export const grainTex = (key: string, base: string, dark: string, light: string, knots = 3, size = 1024) => ctex(key, size, size, (g) => {
  const r = R01(key.length * 977 + size);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 10; i++) { // broad soft tone bands
    const x = r() * size, w = 30 + r() * 120; g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,230,190,0.05)"; g.fillRect(x, 0, w, size);
  }
  const knot: [number, number, number][] = Array.from({ length: knots }, () => [r() * size, r() * size, 8 + r() * 16]);
  const streak = (col: string, a: number, lw: number) => {
    let x = r() * size; const amp = 2 + r() * 7, fr = 0.004 + r() * 0.01, ph = r() * 6;
    g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = lw; g.beginPath();
    for (let y = -8; y <= size + 8; y += 8) {
      let dx = amp * Math.sin(y * fr + ph);
      for (const [kx, ky, kr] of knot) { const dy = y - ky, ex = x - kx, d2 = (dy * dy) / (kr * kr * 9) + (ex * ex) / (kr * kr * 4); if (d2 < 4) dx += Math.sign(ex || 1) * kr * 1.6 * Math.exp(-d2); }
      if (y === -8) g.moveTo(x + dx, y); else g.lineTo(x + dx, y);
    }
    g.stroke(); x += 0;
  };
  for (let i = 0; i < 70; i++) streak(dark, 0.18 + r() * 0.32, 1 + r() * 3.2);
  for (let i = 0; i < 30; i++) streak(light, 0.1 + r() * 0.18, 1 + r() * 2);
  g.globalAlpha = 1;
  for (const [kx, ky, kr] of knot) for (let k = 3; k >= 1; k--) { // knots: dark eye + rings stretched along the grain
    g.strokeStyle = dark; g.globalAlpha = 0.35 + 0.15 * k; g.lineWidth = 1.5 + k * 0.6;
    g.beginPath(); g.ellipse(kx, ky, kr * 0.45 * k, kr * 1.3 * k, 0, 0, Math.PI * 2); g.stroke();
  }
  g.globalAlpha = 1;
  for (const [kx, ky, kr] of knot) { g.fillStyle = dark; g.beginPath(); g.ellipse(kx, ky, kr * 0.35, kr * 0.9, 0, 0, Math.PI * 2); g.fill(); }
});
/** the seat: elm grain across, the dish polished pale by 300 years of sitters (the story told in one texture) */
const seatTex = () => ctex("bzSeat", 2048, 2048, (g) => {
  const S = 2048, r = R01(4242);
  g.fillStyle = "#7a4a22"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) { // grain runs along x (side to side across the seat)
    const y0 = r() * S, amp = 4 + r() * 16, fr = 0.002 + r() * 0.006, ph = r() * 6, dark = r() < 0.72;
    g.strokeStyle = dark ? "#341a0a" : "#b07a44"; g.globalAlpha = dark ? 0.16 + r() * 0.3 : 0.1 + r() * 0.15; g.lineWidth = 1.2 + r() * 4;
    g.beginPath(); for (let x = -10; x <= S + 10; x += 10) { const y = y0 + amp * Math.sin(x * fr + ph) + 30 * Math.exp(-(((x - S * 0.5) / 260) ** 2)) * Math.sin(y0 * 0.01); if (x === -10) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
  }
  g.globalAlpha = 1;
  const wear = g.createRadialGradient(S * 0.5, S * 0.47, 20, S * 0.5, S * 0.47, S * 0.17); // the dish, worn honey-pale
  wear.addColorStop(0, "rgba(214,150,92,0.55)"); wear.addColorStop(0.55, "rgba(190,122,70,0.3)"); wear.addColorStop(1, "rgba(190,122,70,0)");
  g.fillStyle = wear; g.beginPath(); g.ellipse(S * 0.5, S * 0.47, S * 0.2, S * 0.16, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#2a1408"; g.lineCap = "round"; // scratches + two old nicks
  for (let i = 0; i < 26; i++) { const x = S * (0.32 + r() * 0.36), y = S * (0.34 + r() * 0.3), a = r() * Math.PI, l = 14 + r() * 50; g.globalAlpha = 0.25 + r() * 0.3; g.lineWidth = 1 + r() * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.globalAlpha = 1;
});
/** brushed museum plaster: deep teal, soft mottling (no flat colour anywhere: reference walls always carry a pattern) */
const plasterTex = () => ctex("bzPlaster", 1024, 1024, (g) => {
  const S = 1024, r = R01(77);
  g.fillStyle = "#2f6e6a"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) { const x = r() * S, y = r() * S, rr = 10 + r() * 60; g.fillStyle = r() < 0.5 ? "rgba(255,255,240,0.025)" : "rgba(0,20,20,0.035)"; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); }
  // damask-style stencil rows (very faint): diamonds + dots
  g.strokeStyle = "rgba(220,255,240,0.07)"; g.lineWidth = 3;
  for (let y = 0; y < S; y += 128) for (let x = (y / 128) % 2 ? 64 : 0; x < S + 64; x += 128) {
    g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + 22, y); g.lineTo(x, y + 34); g.lineTo(x - 22, y); g.closePath(); g.stroke();
    g.fillStyle = "rgba(220,255,240,0.07)"; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
  }
});
const wainsTex = () => ctex("bzWains", 512, 512, (g) => {
  const r = R01(9); g.fillStyle = "#1d4744"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { const x = r() * 512; g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.03)"; g.fillRect(x, 0, 1 + r() * 3, 512); }
});
/** engraved brass plaque: the museum's warning, readable in the shot (reference: props carry readable story text) */
const plaqueTexB = () => ctex("bzPlaque", 1024, 448, (g) => {
  const W = 1024, H = 448;
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "#f6d27a"); gr.addColorStop(0.45, "#d9a43c"); gr.addColorStop(0.55, "#f0c766"); gr.addColorStop(1, "#b9842c");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#5a3a10"; g.lineWidth = 10; g.strokeRect(18, 18, W - 36, H - 36); g.lineWidth = 3; g.strokeRect(36, 36, W - 72, H - 72);
  for (const [x, y] of [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]]) { g.fillStyle = "#7a5418"; g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#3a2408"; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + 8, y); g.stroke(); }
  g.textAlign = "center"; g.fillStyle = "#3b240a";
  g.font = "bold 74px Georgia, 'Times New Roman', serif"; g.fillText("THE BUSBY STOOP CHAIR", W / 2, 150);
  g.font = "italic 44px Georgia, 'Times New Roman', serif"; g.fillText("Cursed by Thomas Busby, hanged 1702", W / 2, 228);
  g.fillStyle = "#8a1810"; g.font = "bold 60px Georgia, 'Times New Roman', serif"; g.fillText("PLEASE DO NOT SIT", W / 2, 340);
});
/** gilt frame pictures: the inn engraving (left) and a portrait of Busby himself (right), drawn in the house style */
const innTex = () => ctex("bzInnPic", 768, 1024, (g) => {
  const W = 768, H = 1024, r = R01(31);
  g.fillStyle = "#efe2c2"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(120,90,40,${0.02 + r() * 0.04})`; g.fillRect(r() * W, r() * H, 2, 2); }
  g.strokeStyle = "#3a2a18"; g.lineWidth = 5; g.lineJoin = "round";
  g.beginPath(); g.moveTo(90, 700); g.lineTo(90, 430); g.lineTo(384, 250); g.lineTo(678, 430); g.lineTo(678, 700); g.closePath(); g.stroke(); // the inn
  g.beginPath(); g.moveTo(60, 450); g.lineTo(384, 230); g.lineTo(708, 450); g.stroke();
  for (let y = 270; y < 440; y += 22) { g.lineWidth = 1.5; g.beginPath(); g.moveTo(384 - (y - 250) * 1.6, y); g.lineTo(384 + (y - 250) * 1.6, y); g.stroke(); } // thatch hatching
  g.lineWidth = 4; g.strokeRect(330, 560, 108, 140); g.strokeRect(150, 500, 110, 90); g.strokeRect(508, 500, 110, 90);
  for (const x of [205, 563]) { g.beginPath(); g.moveTo(x, 500); g.lineTo(x, 590); g.moveTo(x - 55, 545); g.lineTo(x + 55, 545); g.stroke(); }
  g.beginPath(); g.moveTo(700, 700); g.lineTo(700, 330); g.lineTo(610, 330); g.stroke(); // sign post + hanging sign
  g.strokeRect(612, 350, 80, 56); g.font = "bold 22px Georgia, serif"; g.fillStyle = "#3a2a18"; g.textAlign = "center"; g.fillText("INN", 652, 386);
  g.lineWidth = 2; for (let x = 20; x < W - 20; x += 14) { g.beginPath(); g.moveTo(x, 712 + (x % 3) * 3); g.lineTo(x + 6, 700); g.stroke(); } // grass
  g.font = "italic 40px Georgia, serif"; g.fillText("The Busby Stoop Inn", W / 2, 840);
  g.font = "26px Georgia, serif"; g.fillText("near Thirsk, Yorkshire", W / 2, 890);
});
const busbyTex = () => ctex("bzBusbyPic", 768, 960, (g) => {
  const W = 768, H = 960;
  const bg = g.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, W * 0.75); bg.addColorStop(0, "#5f7d5a"); bg.addColorStop(1, "#1f3326");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.lineJoin = "round"; g.lineCap = "round";
  g.fillStyle = "#3a2a2a"; g.strokeStyle = "#140c08"; g.lineWidth = 9; // coat
  g.beginPath(); g.moveTo(150, H); g.quadraticCurveTo(170, 700, 384, 660); g.quadraticCurveTo(598, 700, 618, H); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#f2ece0"; g.beginPath(); g.moveTo(330, 668); g.lineTo(384, 760); g.lineTo(438, 668); g.closePath(); g.fill(); g.stroke(); // cravat
  g.fillStyle = "#fffaf0"; g.beginPath(); g.ellipse(384, 470, 190, 200, 0, 0, Math.PI * 2); g.fill(); g.stroke(); // the bean head
  g.fillStyle = "#231a14"; g.beginPath(); g.moveTo(170, 330); g.quadraticCurveTo(384, 120, 598, 330); g.quadraticCurveTo(384, 260, 170, 330); g.fill(); g.stroke(); // tricorn
  g.beginPath(); g.moveTo(150, 340); g.quadraticCurveTo(384, 230, 618, 340); g.lineTo(560, 350); g.quadraticCurveTo(384, 300, 208, 350); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = "#140c08"; g.lineWidth = 12; // scowl: brows down, narrow eyes, flat frown
  g.beginPath(); g.moveTo(280, 420); g.lineTo(360, 448); g.moveTo(488, 420); g.lineTo(408, 448); g.stroke();
  g.fillStyle = "#140c08"; g.beginPath(); g.ellipse(330, 482, 16, 12, 0, 0, Math.PI * 2); g.ellipse(438, 482, 16, 12, 0, 0, Math.PI * 2); g.fill();
  g.lineWidth = 10; g.beginPath(); g.moveTo(330, 584); g.quadraticCurveTo(384, 566, 438, 590); g.stroke();
  g.fillStyle = "#e9dcc0"; g.font = "italic 38px Georgia, serif"; g.textAlign = "center"; g.fillText("Thos. Busby", W / 2, 920);
});
/** coin faces: the struck design as COLOUR (inked lines) + HEIGHT (normal map) so the relief catches the light */
const coinDraw = (g: CanvasRenderingContext2D, S: number, side: 0 | 1, height: boolean) => {
  const c = S / 2, ink = height ? "#fff" : "#2a2c30";
  if (height) { g.fillStyle = "#404040"; g.fillRect(0, 0, S, S); }
  else {
    const gr = g.createRadialGradient(c * 0.8, c * 0.7, 10, c, c, c); gr.addColorStop(0, "#f4f6f8"); gr.addColorStop(0.6, "#c9ced6"); gr.addColorStop(1, "#9aa1ac");
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  }
  g.strokeStyle = ink; g.fillStyle = ink; g.lineJoin = "round"; g.lineCap = "round";
  g.lineWidth = S * 0.035; g.beginPath(); g.arc(c, c, c * 0.93, 0, Math.PI * 2); g.stroke(); // raised rim
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; g.beginPath(); g.arc(c + Math.cos(a) * c * 0.84, c + Math.sin(a) * c * 0.84, S * 0.008, 0, Math.PI * 2); g.fill(); } // beading
  g.save(); g.translate(c, c); g.font = `bold ${Math.round(S * 0.085)}px Georgia, 'Times New Roman', serif`; g.textAlign = "center";
  const legend = side === 0 ? "GVLIELMVS · III · DEI · GRA ·" : "MAG · BR · FRA · ET · HIB · REX · 1702 ·";
  const n = legend.length, span = Math.PI * 1.72;
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 - span / 2 + (i + 0.5) * (span / n); g.save(); g.rotate(a + Math.PI / 2); g.fillText(legend[i], 0, -c * 0.66); g.restore(); }
  g.restore();
  g.lineWidth = S * 0.012;
  if (side === 0) { // laureate bust facing right: head, long curled wig, laurel, shoulder
    g.save(); g.translate(c, c * 1.04); const k = S / 1024;
    g.beginPath(); g.moveTo(-150 * k, 210 * k); g.quadraticCurveTo(-170 * k, 80 * k, -110 * k, 20 * k); g.quadraticCurveTo(-130 * k, -120 * k, -40 * k, -190 * k);
    g.quadraticCurveTo(60 * k, -240 * k, 120 * k, -150 * k); g.quadraticCurveTo(150 * k, -100 * k, 140 * k, -60 * k); g.lineTo(175 * k, -10 * k); g.lineTo(140 * k, 10 * k);
    g.quadraticCurveTo(150 * k, 40 * k, 130 * k, 60 * k); g.quadraticCurveTo(140 * k, 100 * k, 90 * k, 110 * k); g.quadraticCurveTo(80 * k, 160 * k, 140 * k, 210 * k); g.closePath();
    if (height) { g.fillStyle = "#c8c8c8"; g.fill(); } g.stroke();
    for (let i = 0; i < 9; i++) { const y = -150 * k + i * 42 * k, x = -95 * k - Math.sin(i * 0.9) * 22 * k; g.beginPath(); g.arc(x, y, 30 * k, 0.3, Math.PI * 1.7); g.stroke(); } // wig curls
    for (let i = 0; i < 6; i++) { const a = -2.4 + i * 0.32; g.beginPath(); g.ellipse(Math.cos(a) * 120 * k + 10 * k, Math.sin(a) * 120 * k - 60 * k, 26 * k, 11 * k, a + 1.2, 0, Math.PI * 2); g.stroke(); } // laurel
    g.beginPath(); g.arc(70 * k, -70 * k, 12 * k, 0, Math.PI * 2); g.fill(); // eye
    g.restore();
  } else { // crowned cross of four shields with the date
    g.save(); g.translate(c, c); const k = S / 1024;
    for (let i = 0; i < 4; i++) { g.save(); g.rotate((i * Math.PI) / 2); g.beginPath(); g.moveTo(-70 * k, -80 * k); g.lineTo(70 * k, -80 * k); g.lineTo(70 * k, -200 * k); g.quadraticCurveTo(0, -260 * k, -70 * k, -200 * k); g.closePath();
      if (height) { g.fillStyle = "#b0b0b0"; g.fill(); } g.stroke(); g.beginPath(); g.moveTo(-40 * k, -120 * k); g.lineTo(40 * k, -180 * k); g.moveTo(40 * k, -120 * k); g.lineTo(-40 * k, -180 * k); g.stroke(); g.restore(); }
    g.beginPath(); g.arc(0, 0, 38 * k, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
};
const coinTex = (side: 0 | 1) => ctex(`bzCoin${side}`, 1024, 1024, (g) => coinDraw(g, 1024, side, false));
/** normal map from a height drawing (Sobel), tangent space, +y up the texture */
export const normalFrom = (key: string, S: number, draw: (g: CanvasRenderingContext2D) => void, k = 2.2) => {
  const t = ctex(key, S, S, (g) => {
    draw(g);
    const src = g.getImageData(0, 0, S, S), d = src.data, out = g.createImageData(S, S), o = out.data;
    const H = (x: number, y: number) => d[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1) - H(x - 1, y - 1) - 2 * H(x - 1, y) - H(x - 1, y + 1)) * k;
      const dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1) - H(x - 1, y - 1) - 2 * H(x, y - 1) - H(x + 1, y - 1)) * k;
      const n = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
      o[i] = ((-dx / n) * 0.5 + 0.5) * 255; o[i + 1] = ((dy / n) * 0.5 + 0.5) * 255; o[i + 2] = ((1 / n) * 0.5 + 0.5) * 255; o[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
  });
  t.colorSpace = THREE.NoColorSpace; return t;
};
const coinNrm = (side: 0 | 1) => normalFrom(`bzCoinN${side}`, 512, (g) => coinDraw(g, 512, side, true));
const reedTex = () => ctex("bzReed", 1024, 32, (g) => { g.fillStyle = "#c3c8d0"; g.fillRect(0, 0, 1024, 32); g.fillStyle = "#7e8590"; for (let x = 0; x < 1024; x += 8) g.fillRect(x, 0, 3, 32); });
const reedNrm = () => normalFrom("bzReedN", 256, (g) => { g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256); for (let x = 0; x < 256; x += 4) { const gr = g.createLinearGradient(x, 0, x + 4, 0); gr.addColorStop(0, "#000"); gr.addColorStop(0.5, "#fff"); gr.addColorStop(1, "#000"); g.fillStyle = gr; g.fillRect(x, 0, 4, 256); } }, 1.4);
/** stylised reflection world for metal: warm floor, dark band, a hot white strip (the window), cool sky */
export const envTex = () => {
  const t = ctex("bzEnv", 1024, 512, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, "#9fb8c8"); gr.addColorStop(0.32, "#e9f2f6"); gr.addColorStop(0.4, "#ffffff"); gr.addColorStop(0.47, "#5d6470");
    gr.addColorStop(0.62, "#2a2c33"); gr.addColorStop(0.8, "#7a5a3a"); gr.addColorStop(1, "#3a2a1c");
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(380, 120, 90, 120); g.fillRect(560, 140, 50, 90); // two bright panes
  });
  t.mapping = THREE.EquirectangularReflectionMapping; return t;
};

// ---------------------------------------------------------------- geometry helpers
/** a turned part: lathe profile [radius m, t 0..1 along a->b], aligned from a to b */
export const turned = (prof: [number, number][], a: THREE.Vector3, b: THREE.Vector3, seg = 22) => {
  const d = b.clone().sub(a), L = d.length();
  const g = new THREE.LatheGeometry(prof.map(([r, t]) => new THREE.Vector2(Math.max(r, 1e-4), t * L)), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z);
  return g;
};
const LEG: [number, number][] = [[0, 0], [0.0135, 0], [0.016, 0.02], [0.017, 0.12], [0.0135, 0.15], [0.021, 0.165], [0.021, 0.19], [0.015, 0.21], [0.018, 0.25], [0.023, 0.36], [0.025, 0.45], [0.022, 0.55],
  [0.016, 0.62], [0.0135, 0.655], [0.02, 0.675], [0.02, 0.705], [0.014, 0.73], [0.0125, 0.92], [0.0115, 1], [0, 1]];
const STRETCH: [number, number][] = [[0, 0], [0.008, 0], [0.009, 0.1], [0.0125, 0.15], [0.0125, 0.18], [0.01, 0.21], [0.014, 0.35], [0.0165, 0.5], [0.014, 0.65], [0.01, 0.79], [0.0125, 0.82], [0.0125, 0.85], [0.009, 0.9], [0.008, 1], [0, 1]];
const SPINDLE: [number, number][] = [[0, 0], [0.0065, 0], [0.008, 0.05], [0.0095, 0.3], [0.0105, 0.42], [0.009, 0.55], [0.007, 0.8], [0.006, 1], [0, 1]];
const ARMPOST: [number, number][] = [[0, 0], [0.011, 0], [0.012, 0.06], [0.0175, 0.2], [0.0185, 0.3], [0.013, 0.42], [0.017, 0.46], [0.017, 0.5], [0.012, 0.54], [0.0145, 0.7], [0.012, 0.9], [0.01, 1], [0, 1]];

/** THE CHAIR. Local frame: seat top centre at the origin, front = +z, feet at y = -0.44 */
export const buildChair = () => {
  const grp = new THREE.Group(), b = new Batch();
  const woodV = lam("bzWoodV", () => ({ map: rep(grainTex("bzGrainV", "#74461f", "#3a1d0a", "#a0683a", 3), 1, 1) }));
  const woodT = lam("bzWoodT", () => { const t = rep(grainTex("bzGrainV", "#74461f", "#3a1d0a", "#a0683a", 3), 1, 1); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; return { map: t }; });
  const seatM = lam("bzSeatM", () => { const t = rep(seatTex(), 1, 1); t.offset.set(0.5, 0.5); return { map: t }; });
  // seat: a saddle outline, bevelled all round (rounded front edge reads as one soft ink line)
  const s = new THREE.Shape();
  s.moveTo(0, -0.205); s.bezierCurveTo(0.12, -0.205, 0.235, -0.19, 0.245, -0.12); s.bezierCurveTo(0.255, -0.03, 0.24, 0.1, 0.19, 0.16); s.bezierCurveTo(0.14, 0.205, 0.06, 0.212, 0, 0.212);
  s.bezierCurveTo(-0.06, 0.212, -0.14, 0.205, -0.19, 0.16); s.bezierCurveTo(-0.24, 0.1, -0.255, -0.03, -0.245, -0.12); s.bezierCurveTo(-0.235, -0.19, -0.12, -0.205, 0, -0.205);
  const seat = new THREE.ExtrudeGeometry(s, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.011, bevelSegments: 4, curveSegments: 40 });
  seat.rotateX(-Math.PI / 2).translate(0, -0.037, 0); b.add(seat, seatM);
  // legs (splayed), side + cross stretchers
  const sock = [V(0.17, -0.03, 0.12), V(-0.17, -0.03, 0.12), V(0.16, -0.03, -0.12), V(-0.16, -0.03, -0.12)];
  const foot = [V(0.235, -0.44, 0.205), V(-0.235, -0.44, 0.205), V(0.215, -0.44, -0.22), V(-0.215, -0.44, -0.22)];
  for (let i = 0; i < 4; i++) b.add(turned(LEG, foot[i], sock[i], 24), woodV);
  const at = (i: number, t: number) => foot[i].clone().lerp(sock[i], t);
  b.add(turned(STRETCH, at(0, 0.34), at(2, 0.34)), woodV); b.add(turned(STRETCH, at(1, 0.34), at(3, 0.34)), woodV);
  const mR = at(0, 0.34).lerp(at(2, 0.34), 0.55), mL = at(1, 0.34).lerp(at(3, 0.34), 0.55);
  b.add(turned(STRETCH, mL, mR), woodV);
  // arm bow: one bent rail round the back, knuckled hand-holds at the front
  const armPts = [V(-0.262, 0.21, 0.135), V(-0.252, 0.222, 0.02), V(-0.215, 0.23, -0.11), V(-0.12, 0.236, -0.2), V(0, 0.238, -0.222), V(0.12, 0.236, -0.2), V(0.215, 0.23, -0.11), V(0.252, 0.222, 0.02), V(0.262, 0.21, 0.135)];
  const arm = new THREE.CatmullRomCurve3(armPts, false, "centripetal");
  b.add(new THREE.TubeGeometry(arm, 120, 0.0155, 14, false), woodT);
  for (const sx of [-1, 1]) b.add(new THREE.SphereGeometry(0.023, 18, 12).scale(1.0, 0.72, 1.35).translate(sx * 0.262, 0.212, 0.142), woodV);
  for (const sx of [-1, 1]) { // arm posts (turned) + two short arm spindles a side
    b.add(turned(ARMPOST, V(sx * 0.215, -0.005, 0.115), V(sx * 0.258, 0.205, 0.128)), woodV);
    b.add(turned(SPINDLE, V(sx * 0.214, -0.005, 0.01), V(sx * 0.247, 0.218, 0.02)), woodV);
    b.add(turned(SPINDLE, V(sx * 0.196, -0.005, -0.085), V(sx * 0.222, 0.224, -0.105)), woodV);
  }
  // back hoop: seat -> through the arm bow -> over the top, raked back
  const hoopPts = [V(-0.145, -0.005, -0.165), V(-0.152, 0.23, -0.19), V(-0.168, 0.4, -0.22), V(-0.15, 0.56, -0.25), V(-0.08, 0.64, -0.266), V(0, 0.656, -0.27),
    V(0.08, 0.64, -0.266), V(0.15, 0.56, -0.25), V(0.168, 0.4, -0.22), V(0.152, 0.23, -0.19), V(0.145, -0.005, -0.165)];
  const hoop = new THREE.CatmullRomCurve3(hoopPts, false, "centripetal");
  b.add(new THREE.TubeGeometry(hoop, 140, 0.0148, 14, false), woodT);
  const hp = hoop.getSpacedPoints(400);
  for (const x of [-0.118, -0.078, 0.078, 0.118]) { // back spindles: seat to the hoop, through the arm bow
    let best = hp[0], bd = 1e9; for (const p of hp) if (p.y > 0.45) { const d = Math.abs(p.x - x); if (d < bd) { bd = d; best = p; } }
    b.add(turned(SPINDLE, V(x * 0.96, -0.005, -0.172), best.clone().add(V(0, 0.004, 0))), woodV);
  }
  // pierced splat (the wheel-back): vase outline with a six-window wheel + a slot; it leans with the hoop
  const sp = new THREE.Shape(), Y = 0.63;
  sp.moveTo(-0.03, 0); sp.lineTo(0.03, 0); sp.bezierCurveTo(0.028, 0.06, 0.022, 0.1, 0.03, 0.16); sp.bezierCurveTo(0.062, 0.24, 0.062, 0.34, 0.04, 0.42);
  sp.bezierCurveTo(0.03, 0.47, 0.034, 0.53, 0.054, 0.585); sp.lineTo(0.05, Y); sp.lineTo(-0.05, Y); sp.lineTo(-0.054, 0.585);
  sp.bezierCurveTo(-0.034, 0.53, -0.03, 0.47, -0.04, 0.42); sp.bezierCurveTo(-0.062, 0.34, -0.062, 0.24, -0.03, 0.16); sp.bezierCurveTo(-0.022, 0.1, -0.028, 0.06, -0.03, 0);
  const wc = 0.29, ro = 0.037, ri = 0.013, gap = 0.17;
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + gap, a1 = ((i + 1) / 6) * Math.PI * 2 - gap, h = new THREE.Path();
    h.moveTo(Math.cos(a0) * ro, wc + Math.sin(a0) * ro); h.absarc(0, wc, ro, a0, a1, false); h.lineTo(Math.cos(a1) * ri, wc + Math.sin(a1) * ri); h.absarc(0, wc, ri, a1, a0, true); sp.holes.push(h);
  }
  { const h = new THREE.Path(); h.moveTo(-0.009, 0.5); h.lineTo(0.009, 0.5); h.absarc(0, 0.555, 0.009, 0, Math.PI, false); h.lineTo(-0.009, 0.5); sp.holes.push(h); }
  { const h = new THREE.Path(); h.absarc(0, 0.115, 0.008, 0, Math.PI * 2, false); sp.holes.push(h); }
  const splat = new THREE.ExtrudeGeometry(sp, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 18 });
  splat.translate(0, 0, -0.004).rotateX(-Math.atan2(0.268 - 0.172, Y)).translate(0, -0.006, -0.172); b.add(splat, woodV);
  b.build(grp, true);
  return grp;
};

// ---------------------------------------------------------------- the museum wall (opening shot)
export const buildMuseum = (R: THREE.Object3D) => {
  const g = new THREE.Group(), b = new Batch(), x0 = BX, zW = -3;
  const M = {
    floor: lam("bzFloor", () => ({ map: rep(planksHD(true), 3, 2.5), color: "#c8a27c" })), // wide boards (the parquet aliased into stripes at distance)
    wall: lam("bzWall", () => ({ map: rep(plasterTex(), 3, 1.5) })),
    wains: lam("bzWainsM", () => ({ map: rep(wainsTex(), 4, 1) })),
    trim: lam("bzTrim", () => ({ color: "#f1e6cf" })),
    panel: lam("bzPanel", () => ({ color: "#245652" })),
    oak: lam("bzShelf", () => ({ map: rep(grainTex("bzGrainV", "#74461f", "#3a1d0a", "#a0683a", 3), 1, 1) })),
    iron: lam("bzIron", () => ({ color: "#2e3036" })),
    brass: lam("bzBrass", () => ({ color: "#e0aa3e", envMap: envTex(), reflectivity: 0.35, combine: THREE.MixOperation })),
    gilt: lam("bzGilt", () => ({ color: "#d9a641", envMap: envTex(), reflectivity: 0.25, combine: THREE.MixOperation })),
    rope: lam("bzRope", () => ({ color: "#c0222e" })),
    plaque: lam("bzPlaqueM", () => ({ map: plaqueTexB() })),
    inn: lam("bzInn", () => ({ map: innTex() })), busby: lam("bzBusby", () => ({ map: busbyTex() })),
    lamp: lam("bzLamp", () => ({ color: "#1c1d22" })),
  };
  Object.assign(GLOSS_OF, { bzWoodV: 0.3, bzWoodT: 0.3, bzSeatM: 0.4, bzShelf: 0.4, bzIron: 0.6, bzBrass: 1, bzGilt: 0.9, bzPlaqueM: 0.8, bzFloor: 0.5, bzTrim: 0.25, bzPanel: 0.3, bzLamp: 0.7, bzRope: 0.15 });
  const rb = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, r = 0.01) => { const w = bx - ax, h = by - ay, d = bz - az; return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)).translate(x0 + (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); };
  // room shell: parquet floor, plaster wall above a panelled dado, crown moulding, ceiling
  b.add(new THREE.PlaneGeometry(12, 10).rotateX(-Math.PI / 2).translate(x0, 0, 2), M.floor);
  b.add(new THREE.PlaneGeometry(12, 3.3).translate(x0, 1.1 + 1.65, zW), M.wall);
  b.add(new THREE.PlaneGeometry(12, 1.1).translate(x0, 0.55, zW + 0.001), M.wains);
  b.add(new THREE.PlaneGeometry(12, 10).rotateX(Math.PI / 2).translate(x0, 4.4, 2), M.trim);
  b.add(rb(-6, 0, zW, 6, 0.16, zW + 0.03, 0.006), M.trim);             // skirting
  b.add(rb(-6, 1.06, zW, 6, 1.12, zW + 0.05, 0.012), M.trim);          // chair rail (the joke writes itself)
  b.add(rb(-6, 4.26, zW, 6, 4.4, zW + 0.12, 0.02), M.trim);            // crown
  for (let i = -6; i < 6; i++) b.add(rb(i * 0.95 + 0.1, 0.26, zW, i * 0.95 + 0.85, 0.96, zW + 0.022, 0.008), M.panel); // raised panels
  b.add(new THREE.PlaneGeometry(10, 4.4).rotateY(Math.PI / 2).translate(x0 - 4.2, 2.2, 2), M.wall); // side walls (glimpsed in the low angle)
  b.add(new THREE.PlaneGeometry(10, 4.4).rotateY(-Math.PI / 2).translate(x0 + 4.2, 2.2, 2), M.wall);
  // the high shelf + two iron brackets
  const shelfY = SEAT_Y - 0.44 - 0.045;
  b.add(rb(-0.38, shelfY, zW, 0.38, shelfY + 0.045, zW + 0.54, 0.008), M.oak);
  for (const sx of [-0.27, 0.27]) { // short L-brackets with a diagonal brace (kept clear of the plaque below)
    b.add(rb(sx - 0.018, shelfY - 0.27, zW, sx + 0.018, shelfY, zW + 0.03, 0.004), M.iron);
    b.add(rb(sx - 0.018, shelfY - 0.03, zW, sx + 0.018, shelfY, zW + 0.46, 0.004), M.iron);
    b.add(turned([[0, 0], [0.011, 0], [0.011, 1], [0, 1]], V(x0 + sx, shelfY - 0.25, zW + 0.025), V(x0 + sx, shelfY - 0.02, zW + 0.38), 10), M.iron);
    for (const yy of [shelfY - 0.2, shelfY - 0.08]) b.add(new THREE.SphereGeometry(0.012, 10, 6).scale(1, 1, 0.5).translate(x0 + sx, yy, zW + 0.034), M.brass); // screw heads
  }
  // plaque under the shelf
  b.add(rb(-0.34, 1.26, zW, 0.34, 1.57, zW + 0.02, 0.006), M.gilt);
  b.add(new THREE.PlaneGeometry(0.62, 0.271).translate(x0, 1.415, zW + 0.0215), M.plaque);
  // gilt frames: the inn (left), Busby (right)
  const frame = (cx: number, cy: number, w: number, h: number, mat: THREE.Material) => {
    const t = 0.07, d = 0.05;
    b.add(rb(cx - w / 2 - t, cy + h / 2, zW, cx + w / 2 + t, cy + h / 2 + t, zW + d, 0.012), M.gilt); b.add(rb(cx - w / 2 - t, cy - h / 2 - t, zW, cx + w / 2 + t, cy - h / 2, zW + d, 0.012), M.gilt);
    b.add(rb(cx - w / 2 - t, cy - h / 2, zW, cx - w / 2, cy + h / 2, zW + d, 0.012), M.gilt); b.add(rb(cx + w / 2, cy - h / 2, zW, cx + w / 2 + t, cy + h / 2, zW + d, 0.012), M.gilt);
    b.add(rb(cx - w / 2 - 0.012, cy - h / 2 - 0.012, zW, cx + w / 2 + 0.012, cy + h / 2 + 0.012, zW + 0.02, 0.004), M.gilt);
    b.add(new THREE.PlaneGeometry(w, h).translate(x0 + cx, cy, zW + 0.021), mat);
  };
  frame(-1.75, 2.35, 0.72, 0.96, M.inn); frame(1.75, 2.42, 0.6, 0.75, M.busby);
  // rope barrier: two brass stanchions, a sagging red velvet rope with brass end caps
  const zR = -1.25;
  for (const sx of [-1.25, 1.25]) {
    b.add(new THREE.LatheGeometry([[0, 0], [0.17, 0], [0.17, 0.025], [0.12, 0.05], [0.03, 0.07], [0.022, 0.1], [0.022, 0.86], [0.035, 0.88], [0.035, 0.9], [0.028, 0.93], [0.05, 0.97], [0.05, 1.0], [0, 1.03]].map(([r, y]) => new THREE.Vector2(r, y)), 32).translate(x0 + sx, 0, zR), M.brass);
  }
  const rope = new THREE.CatmullRomCurve3([V(x0 - 1.2, 0.9, zR), V(x0 - 0.7, 0.66, zR), V(x0, 0.56, zR), V(x0 + 0.7, 0.66, zR), V(x0 + 1.2, 0.9, zR)]);
  b.add(new THREE.TubeGeometry(rope, 80, 0.028, 12, false), M.rope);
  for (const sx of [-1.2, 1.2]) b.add(new THREE.CylinderGeometry(0.034, 0.03, 0.08, 16).rotateZ(Math.PI / 2).translate(x0 + sx * 0.985, 0.89, zR), M.brass);
  // ceiling spot aimed at the chair (+ its lit lens), the light cone in the dust
  const spot = V(x0 + 0.05, 4.3, zW + 1.7), tgt = V(x0, SEAT_Y + 0.15, zW + 0.3);
  b.add(rb(-0.03, 4.3, zW + 1.67, 0.08, 4.4, zW + 1.73, 0.01), M.lamp);
  const can = turned([[0, 0], [0.07, 0], [0.085, 0.02], [0.09, 0.22], [0.075, 0.26], [0.03, 0.28], [0, 0.28]], spot.clone().addScaledVector(tgt.clone().sub(spot).normalize(), 0.22), spot.clone().addScaledVector(tgt.clone().sub(spot).normalize(), -0.06), 28);
  b.add(can, M.lamp);
  b.build(g, true);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.075, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.9, 2.3) }));
  lens.position.copy(spot).addScaledVector(tgt.clone().sub(spot).normalize(), 0.225); lens.lookAt(tgt); lens.layers.set(NOINK); g.add(lens);
  const h = halo(new THREE.Color(1.0, 0.85, 0.6), 0.5); h.position.copy(lens.position); g.add(h);
  { const len = spot.distanceTo(tgt) + 0.5, cone = new THREE.ConeGeometry(0.75, len, 40, 1, true).translate(0, -len / 2, 0);
    const cv = document.createElement("canvas"); cv.width = 4; cv.height = 256; const cg = cv.getContext("2d")!;
    const gr = cg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,236,200,0.0)"); gr.addColorStop(0.15, "rgba(255,236,200,0.5)"); gr.addColorStop(1, "rgba(255,236,200,0.06)"); cg.fillStyle = gr; cg.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(cv);
    const m = new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ map: tx, color: new THREE.Color(0.32, 0.27, 0.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    m.position.copy(spot).addScaledVector(tgt.clone().sub(spot).normalize(), 0.24); m.quaternion.setFromUnitVectors(V(0, -1, 0), tgt.clone().sub(spot).normalize()); m.layers.set(NOINK); m.renderOrder = 1; g.add(m); }
  // THE CHAIR on its shelf, back against the wall
  const chair = buildChair(); chair.position.set(x0, SEAT_Y, zW + 0.31); g.add(chair);
  R.add(g);
};

// ---------------------------------------------------------------- the forgers' bench, 1702
export const buildBench = (R: THREE.Object3D) => {
  const g = new THREE.Group(), b = new Batch(), x0 = CX, y0 = BENCH_Y;
  const env = envTex();
  const M = {
    top: lam("bzBenchTop", () => { const t = rep(grainTex("bzGrainB", "#8a5a34", "#3e2210", "#b07a4a", 4, 1024), 1, 1); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; return { map: t }; }),
    leg: lam("bzBenchLeg", () => ({ map: rep(grainTex("bzGrainB", "#8a5a34", "#3e2210", "#b07a4a", 4, 1024), 1, 1) })),
    stone: lam("bzStone", () => ({ map: rep(stoneTex(), 2, 1.2) })), flag: lam("bzFlag", () => ({ map: rep(stoneTex(), 3, 3) })),
    face0: lam("bzCoinF0", () => ({ map: coinTex(0), normalMap: coinNrm(0), normalScale: new THREE.Vector2(1.1, 1.1), envMap: env, reflectivity: 0.42, combine: THREE.MixOperation })),
    face1: lam("bzCoinF1", () => ({ map: coinTex(1), normalMap: coinNrm(1), normalScale: new THREE.Vector2(1.1, 1.1), envMap: env, reflectivity: 0.42, combine: THREE.MixOperation })),
    edge: lam("bzCoinE", () => ({ map: reedTex(), normalMap: reedNrm(), envMap: env, reflectivity: 0.5, combine: THREE.MixOperation })),
    iron: lam("bzIronB", () => ({ color: "#3c3f46", envMap: env, reflectivity: 0.18, combine: THREE.MixOperation })),
    clay: lam("bzClay", () => ({ color: "#b8693a" })), leather: lam("bzLeather", () => ({ color: "#7a3f22" })), cord: lam("bzCord", () => ({ color: "#d9c08a" })),
    pewter: lam("bzPewter", () => ({ color: "#a9adb6", envMap: env, reflectivity: 0.3, combine: THREE.MixOperation })), wax: lam("bzWax", () => ({ color: "#f3ead2" })),
  };
  Object.assign(GLOSS_OF, { bzCoinF0: 1, bzCoinF1: 1, bzCoinE: 1, bzIronB: 0.8, bzPewter: 0.9, bzBenchTop: 0.35, bzLeather: 0.35, bzClay: 0.2, bzWax: 0.3 });
  const rb = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, r = 0.01) => { const w = bx - ax, h = by - ay, d = bz - az; return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)).translate(x0 + (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); };
  // room: flagstones, rough stone wall
  b.add(new THREE.PlaneGeometry(8, 6).rotateX(-Math.PI / 2).translate(x0, 0, 0), M.flag);
  b.add(new THREE.PlaneGeometry(8, 4).translate(x0, 2, -0.9), M.stone);
  // bench: three thick planks (gaps between them) on square legs with a stretcher
  for (const [z0, z1] of [[-0.38, -0.135], [-0.128, 0.118], [0.125, 0.37]]) b.add(rb(-0.75, y0 - 0.06, z0, 0.75, y0, z1, 0.01), M.top);
  for (const [lx, lz] of [[-0.66, -0.3], [0.66, -0.3], [-0.66, 0.3], [0.66, 0.3]]) b.add(rb(lx - 0.04, 0, lz - 0.04, lx + 0.04, y0 - 0.06, lz + 0.04, 0.008), M.leg);
  b.add(rb(-0.66, 0.2, -0.02, 0.66, 0.26, 0.02, 0.006), M.leg);
  b.build(g, true);
  // the coins: each a real coin (struck faces, reeded edge), stacked with a jitter, spilled from a pouch, one on edge
  const r = R01(1702), cr = 0.02, ct = 0.0032;
  const coinGeo = new THREE.CylinderGeometry(cr, cr, ct, 64, 1, false);
  const coinAt = (x: number, y: number, z: number, rx: number, ry: number, rz: number) => {
    const m = new THREE.Mesh(coinGeo, [M.edge, M.face0, M.face1]); m.position.set(x0 + x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m);
  };
  const stack = (x: number, z: number, n: number, lean = 0) => {
    for (let i = 0; i < n; i++) { const sl = lean * Math.max(0, i - n + 4); coinAt(x + (r() - 0.5) * 0.003 + sl * 0.006, y0 + ct / 2 + i * ct * 1.02, z + (r() - 0.5) * 0.003, (r() - 0.5) * 0.03, r() * 6.3, (r() - 0.5) * 0.03); }
  };
  stack(0.02, 0.04, 14); stack(0.068, 0.012, 9); stack(0.05, 0.075, 6, 1); stack(-0.02, -0.005, 4);
  for (let i = 0; i < 26; i++) { // the spill, fanning out of the pouch mouth
    const a = -0.4 + r() * 1.3, d = 0.07 + r() * 0.17, x = -0.16 + Math.cos(a) * d, z = -0.06 + Math.sin(a) * d * 0.8, flip = r() < 0.45 ? Math.PI : 0, tilt = r() < 0.25 ? 0.12 : 0.0;
    coinAt(x, y0 + ct / 2 + (tilt ? 0.006 : 0) + (i % 5 === 0 ? ct : 0), z, flip + tilt, r() * 6.3, tilt * 0.5);
  }
  coinAt(0.115, y0 + cr, 0.06, Math.PI / 2, 0.5, 0.18); // one coin rolling on its edge
  // leather pouch (lathe sack) with a tied neck, lying on its side, mouth toward the spill
  { const p = new THREE.LatheGeometry([[0, 0], [0.04, 0.005], [0.065, 0.03], [0.072, 0.07], [0.06, 0.11], [0.03, 0.13], [0.022, 0.14], [0.03, 0.155], [0.036, 0.17], [0.03, 0.172]].map(([a, c]) => new THREE.Vector2(a, c)), 26);
    const m = new THREE.Mesh(p, M.leather); m.rotation.set(0, 0, -Math.PI / 2 + 0.25); m.position.set(x0 - 0.33, y0 + 0.062, -0.07); m.rotateY(0.3); m.castShadow = true; g.add(m);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 8, 24), M.cord); tie.position.set(x0 - 0.2, y0 + 0.05, -0.04); tie.rotation.set(0.2, 1.2, 0); g.add(tie); }
  // the iron coin mould, open: two blocks on long handles; the lower half shows two struck cavities
  { const mb = new Batch();
    mb.add(rb(0.17, y0, -0.2, 0.31, y0 + 0.035, -0.08, 0.006), M.iron); mb.add(rb(0.17, y0, -0.06, 0.31, y0 + 0.035, 0.06, 0.006), M.iron);
    mb.add(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 8).rotateZ(Math.PI / 2).translate(x0 + 0.52, y0 + 0.018, -0.15), M.iron);
    mb.add(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 8).rotateZ(Math.PI / 2).translate(x0 + 0.52, y0 + 0.018, -0.01), M.iron);
    mb.build(g, true);
    for (const cz of [-0.17, -0.11]) { const cav = new THREE.Mesh(new THREE.CircleGeometry(cr, 48).rotateX(-Math.PI / 2), M.face0); cav.position.set(x0 + 0.24, y0 + 0.0355, cz + 0.03 * (cz > -0.15 ? 0 : 0)); cav.rotation.y = 0.3; g.add(cav); } }
  // the crucible on a little iron trivet: molten silver glowing (self-lit, outside the ink)
  { const pot = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.035, 0], [0.05, 0.02], [0.058, 0.07], [0.062, 0.1], [0.056, 0.102], [0.05, 0.09], [0, 0.085]].map(([a, c]) => new THREE.Vector2(a, c)), 28), M.clay);
    pot.position.set(x0 + 0.42, y0 + 0.035, 0.2); pot.castShadow = true; g.add(pot);
    const tri = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.006, 8, 24).rotateX(Math.PI / 2), M.iron); tri.position.set(x0 + 0.42, y0 + 0.03, 0.2); g.add(tri);
    const melt = new THREE.Mesh(new THREE.CircleGeometry(0.05, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.5, 0.45) }));
    melt.position.set(x0 + 0.42, y0 + 0.035 + 0.088, 0.2); melt.layers.set(NOINK); g.add(melt);
    const hh = halo(new THREE.Color(1.0, 0.45, 0.15), 0.35); hh.position.copy(melt.position).add(V(0, 0.03, 0)); g.add(hh); }
  // pewter candlestick + candle + flame
  { const cs = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.06, 0.012], [0.02, 0.03], [0.014, 0.1], [0.03, 0.11], [0.03, 0.12], [0, 0.12]].map(([a, c]) => new THREE.Vector2(a, c)), 28), M.pewter);
    cs.position.set(x0 - 0.45, y0, -0.25); cs.castShadow = true; g.add(cs);
    const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.14, 18), M.wax); cd.position.set(x0 - 0.45, y0 + 0.19, -0.25); g.add(cd);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8).scale(1, 2.0, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.1, 0.8) })); fl.position.set(x0 - 0.45, y0 + 0.285, -0.25); fl.layers.set(NOINK); g.add(fl);
    const hh = halo(new THREE.Color(1.0, 0.62, 0.25), 0.55); hh.position.copy(fl.position); g.add(hh); }
  R.add(g);
};
