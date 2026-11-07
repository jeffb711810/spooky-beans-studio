// PAINTED TEXTURES (owner: textures agent). Hand-painted canvas textures for every surface of the Bell farm.
import { ctex, jit, rng } from "../bridge/paint";

/** horizontal hewn logs with pale chinking, 8 logs per tile (tile = 2.4 m tall) */
export const logsTex = (key = "logs", base = "#8a6143") => ctex(key, 1024, 1024, (g, r) => {
  const n = 8, h = 1024 / n;
  g.fillStyle = "#cdbfa6"; g.fillRect(0, 0, 1024, 1024); // chinking
  for (let i = 0; i < n; i++) {
    const y0 = i * h + 10, y1 = (i + 1) * h - 8, col = jit(r, base, 0.12, 4, 0.12);
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, jit(r, col, 0.05)); gr.addColorStop(0.35, col); gr.addColorStop(1, "#4a3022");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, y0 + 4);
    for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y0 + 3 * Math.sin(x * 0.01 + i) + (r() - 0.5) * 3);
    for (let x = 1024; x >= 0; x -= 64) g.lineTo(x, y1 + 2 * Math.sin(x * 0.013 + i * 2) + (r() - 0.5) * 3);
    g.closePath(); g.fill();
    g.strokeStyle = "rgba(40,24,18,0.55)"; g.lineWidth = 3;
    for (let k = 0; k < 7; k++) { // grain
      const yy = y0 + 12 + r() * (y1 - y0 - 24), x0 = r() * 1024;
      g.beginPath(); g.moveTo(x0, yy); g.bezierCurveTo(x0 + 80, yy + 4, x0 + 160, yy - 4, x0 + 260, yy + 1); g.stroke();
    }
    if (r() < 0.6) { const kx = r() * 1000, ky = (y0 + y1) / 2; g.fillStyle = "#3c271c"; g.beginPath(); g.ellipse(kx, ky, 10, 7, 0, 0, 7); g.fill(); }
    g.strokeStyle = "rgba(20,12,10,0.85)"; g.lineWidth = 4; // ink seam under each log
    g.beginPath(); g.moveTo(0, y1 + 2); g.lineTo(1024, y1 + 2); g.stroke();
  }
});
/** patchwork quilt: 6 x 6 squares, stitched */
export const quiltTex = (key: string, cols: string[]) => ctex("quilt" + key, 512, 512, (g, r) => {
  const n = 6, s = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = jit(r, cols[(i * 7 + j * 3 + Math.floor(r() * 2)) % cols.length], 0.08); g.fillRect(i * s, j * s, s, s);
    if ((i + j) % 3 === 0) { g.fillStyle = "rgba(255,240,210,0.35)"; g.beginPath(); g.arc(i * s + s / 2, j * s + s / 2, s * 0.22, 0, 7); g.fill(); }
  }
  g.strokeStyle = "rgba(40,24,30,0.7)"; g.lineWidth = 3; g.setLineDash([10, 8]);
  for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke(); }
});
/** cedar shingles */
export const shinglesTex = () => ctex("shingles", 512, 512, (g, r) => {
  g.fillStyle = "#4a3a30"; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) for (let x = -(row % 2) * 32; x < 512; x += 64) {
    const y = row * 64, c = jit(r, "#6e5847", 0.14, 6, 0.15);
    g.fillStyle = c; g.fillRect(x + 3, y + 2, 58 + (r() - 0.5) * 6, 60);
    g.fillStyle = "rgba(20,14,12,0.8)"; g.fillRect(x + 3, y + 56, 58, 6);
  }
});
export const dirtTex = () => ctex("dirt", 512, 512, (g, r) => {
  g.fillStyle = "#6b5440"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 500; k++) { g.fillStyle = jit(r, "#6b5440", 0.25, 6, 0.2); g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 9, 2 + r() * 5, r() * 3, 0, 7); g.fill(); }
});
export const tickingTex = () => ctex("ticking", 256, 256, (g) => {
  g.fillStyle = "#e9dfc8"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#8a8fb0"; for (let x = 0; x < 256; x += 32) g.fillRect(x + 4, 0, 6, 256);
});
export const stoneTex = () => ctex("bwstone", 512, 512, (g, r) => {
  g.fillStyle = "#8d8a86"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 60; k++) { g.fillStyle = jit(r, "#9a968f", 0.18, 8, 0.2); g.beginPath(); g.ellipse(r() * 512, r() * 512, 18 + r() * 40, 12 + r() * 26, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(30,26,30,0.35)"; g.lineWidth = 3;
  for (let k = 0; k < 14; k++) { g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.lineTo(x + 40 * (r() - 0.5), y + 60 * r()); g.stroke(); }
});
export const moonTex = () => ctex("moon", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.42, "rgba(255,255,255,1)"); gr.addColorStop(0.47, "rgba(255,255,255,0.35)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(170,180,210,0.5)";
  for (const [x, y, rr] of [[105, 100, 14], [150, 140, 10], [120, 155, 8]]) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
});

export const rugTex = () => ctex("bwRug", 512, 512, (g) => {
  const cols = ["#7a3b3b", "#c9a46a", "#3f5a7a", "#8a6a3a", "#5a7a4a", "#c9a46a", "#7a3b3b", "#3f3a5a"];
  for (let k = 0; k < 16; k++) { g.fillStyle = cols[k % cols.length]; g.beginPath(); g.ellipse(256, 256, 250 - k * 15, 250 - k * 15, 0, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(30,20,20,0.5)"; g.lineWidth = 2;
  for (let k = 0; k < 16; k++) { g.beginPath(); g.ellipse(256, 256, 250 - k * 15, 250 - k * 15, 0, 0, 7); g.stroke(); }
});
export const samplerTex = () => ctex("bwSampler", 256, 200, (g) => {
  g.fillStyle = "#e9dfc6"; g.fillRect(0, 0, 256, 200);
  const r = rng(5);
  g.fillStyle = "#8a2f3a"; // cross-stitch border + little house + two trees + heart, no letters
  for (let x = 10; x < 246; x += 8) { g.fillRect(x, 10, 5, 5); g.fillRect(x, 185, 5, 5); }
  for (let y = 10; y < 190; y += 8) { g.fillRect(10, y, 5, 5); g.fillRect(241, y, 5, 5); }
  g.fillStyle = "#5a4a3a"; g.fillRect(100, 90, 56, 50); g.fillStyle = "#8a2f3a"; g.beginPath(); g.moveTo(92, 92); g.lineTo(128, 58); g.lineTo(164, 92); g.fill();
  g.fillStyle = "#3f6a3a"; for (const x of [50, 206]) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x - 20, 135); g.lineTo(x + 20, 135); g.fill(); }
  g.fillStyle = "#c25a7a"; g.beginPath(); g.arc(120, 160, 8, 0, 7); g.arc(136, 160, 8, 0, 7); g.fill(); g.beginPath(); g.moveTo(112, 163); g.lineTo(128, 178); g.lineTo(144, 163); g.fill();
  void r;
});
