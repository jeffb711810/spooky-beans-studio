// BUSBY: the pub (main set, x = PX), built to the look-dev chair's standard (user: "this quality should be in the
// entire video"). Every surface carries detail and the story is written on the walls:
//  - the chair's corner: a little table, the dare plaque "BUSBY'S CHAIR - SIT IF YOU DARE", the window to the gibbet hill
//  - the bar: mahogany top, raised panels, brass foot rail, four pumps with readable clips, pints, a bell
//  - the back bar: bottles with labels, small barrels with taps, a gilt mirror, the inn board "THE BUSBY STOOP"
//  - the fireplace (brick, logs, live flames), horse brasses, the dart board and the "DARES" chalk board
//  - beams with a hop garland and pewter tankards on hooks
// Era props switch per shot (PUB.era): 0 = candles (1700s), 1 = oil lamps (1800s), 2 = electric bulbs (1900s+).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, lam } from "../bridge/build";
import { GLOSS_OF } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { ctex, rep, planksHD } from "../bridge/paint";
import { halo } from "./fx3d";
import { brickTex, clockFaceTex, rugTex } from "./textures";
import { V, R01, grainTex, envTex, turned, buildChair } from "./hero";

export const PX = 680;
/** the chair's place in the pub (floor point under the seat centre; facing = rotation about y) */
export const PUB_CHAIR = { x: -2.75, z: -2.2, ry: 0.7 };
/** per-frame state, set by the staging; pubApply() applies it */
export const PUB = { era: 2, chair: 1, fire: 1 };
const ERA: THREE.Group[] = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
let PCHAIR: THREE.Group | null = null; const FIRE: THREE.Object3D[] = [];
export const pubApply = () => {
  ERA.forEach((g, i) => (g.visible = i === PUB.era));
  if (PCHAIR) PCHAIR.visible = PUB.chair > 0;
  FIRE.forEach((o) => (o.visible = PUB.fire > 0));
};

// ---------------------------------------------------------------- textures
const plasterWarm = () => ctex("pbPlaster", 1024, 1024, (g) => {
  const S = 1024, r = R01(12);
  g.fillStyle = "#ead39c"; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) { const x = r() * S, y = r() * S, rr = 8 + r() * 70; g.fillStyle = r() < 0.55 ? "rgba(120,80,30,0.03)" : "rgba(255,250,230,0.05)"; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(90,60,30,0.35)"; g.lineWidth = 1.5; // hairline cracks
  for (let i = 0; i < 6; i++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 60; y += 10 + r() * 30; g.lineTo(x, y); } g.stroke(); }
});
const boardsTex = () => ctex("pbBoards", 1024, 1024, (g) => {
  const S = 1024, r = R01(21), grain = grainTex("pbGrainD", "#6a3c1a", "#2e160a", "#8c5428", 2, 512).image as HTMLCanvasElement;
  for (let i = 0; i < 8; i++) {
    g.drawImage(grain, (i * 97) % 300, 0, 128, 512, i * 128, 0, 128, S);
    g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,220,170"},${0.03 + r() * 0.06})`; g.fillRect(i * 128, 0, 128, S);
    g.fillStyle = "#1a0c05"; g.fillRect(i * 128, 0, 5, S); g.fillStyle = "rgba(255,210,150,0.18)"; g.fillRect(i * 128 + 5, 0, 3, S);
  }
});
const sign = (key: string, w: number, h: number, bg: string, draw: (g: CanvasRenderingContext2D) => void) => ctex(key, w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); draw(g); });
const innBoardTex = () => sign("pbInnBoard", 1536, 288, "#1f4a32", (g) => {
  g.strokeStyle = "#d8a740"; g.lineWidth = 10; g.strokeRect(14, 14, 1508, 260); g.lineWidth = 3; g.strokeRect(30, 30, 1476, 228);
  g.fillStyle = "#f0c45a"; g.strokeStyle = "#5a3a10"; g.lineWidth = 6; g.textAlign = "center"; g.font = "bold 150px Georgia, 'Times New Roman', serif";
  g.strokeText("THE BUSBY STOOP", 768, 196); g.fillText("THE BUSBY STOOP", 768, 196);
});
const dareTex = () => sign("pbDare", 768, 384, "#3a2412", (g) => {
  g.fillStyle = "#f2e6c8"; g.fillRect(20, 20, 728, 344); g.strokeStyle = "#3a2412"; g.lineWidth = 6; g.strokeRect(34, 34, 700, 316);
  g.fillStyle = "#8a1a12"; g.textAlign = "center"; g.font = "bold 92px Georgia, serif"; g.fillText("BUSBY'S CHAIR", 384, 150);
  g.fillStyle = "#2a1a0a"; g.font = "italic 64px Georgia, serif"; g.fillText("~ sit if you dare ~", 384, 262);
});
const chalkTex = () => sign("pbChalk", 768, 1024, "#26302a", (g) => {
  const r = R01(3); g.strokeStyle = "#8a5a30"; g.lineWidth = 40; g.strokeRect(0, 0, 768, 1024);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`; g.fillRect(40 + r() * 690, 40 + r() * 940, 30 + r() * 80, 2); } // smudges
  g.fillStyle = "#f4f1e8"; g.textAlign = "center"; g.font = "bold 84px 'Comic Sans MS', 'Chalkboard', sans-serif"; g.fillText("DARES", 384, 150);
  g.textAlign = "left"; g.font = "56px 'Comic Sans MS', 'Chalkboard', sans-serif";
  const names = ["Tom", "Bert", "Alfie", "Jack", "Wilf", "Ned"];
  names.forEach((n, i) => { const y = 270 + i * 118; g.fillStyle = "#f4f1e8"; g.fillText(n, 90, y); g.strokeStyle = "#f4f1e8"; g.lineWidth = 5;
    if (i < 5) { g.beginPath(); g.moveTo(80, y - 18); g.lineTo(80 + g.measureText(n).width + 24, y - 22); g.stroke(); g.fillStyle = "#ff8a7a"; g.fillText("✗", 560, y); } else { g.fillStyle = "#ffe08a"; g.fillText("?", 560, y); } });
});
const clipTex = (i: number) => {
  const T = [["STOOP", "BITTER", "#a8261c"], ["DEAD", "MAN'S ALE", "#1d3a6e"], ["OLD", "BUSBY", "#1f5a34"], ["CURSED", "STOUT", "#2a2a2a"]][i];
  return sign(`pbClip${i}`, 256, 384, "#f3e3b8", (g) => {
    g.fillStyle = T[2]; g.beginPath(); g.ellipse(128, 192, 112, 176, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#e0b040"; g.lineWidth = 10; g.beginPath(); g.ellipse(128, 192, 100, 162, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#fff2cc"; g.textAlign = "center"; g.font = "bold 52px Georgia, serif"; g.fillText(T[0], 128, 175); g.font = "bold 34px Georgia, serif"; g.fillText(T[1], 128, 230);
  });
};
const labelTex = (i: number) => sign(`pbLabel${i}`, 512, 256, ["#f1e3c0", "#e8d3a0", "#f6efe0", "#d9c8a8"][i % 4], (g) => {
  g.strokeStyle = ["#7a1a12", "#1a3a6a", "#2a5a2a", "#5a3a10"][i % 4]; g.lineWidth = 10; g.strokeRect(8, 30, 496, 196);
  g.fillStyle = g.strokeStyle; g.textAlign = "center"; g.font = "bold 64px Georgia, serif"; g.fillText(["GIN", "RUM", "PORT", "SHERRY"][i % 4], 256, 150); g.font = "28px Georgia, serif"; g.fillText("est. 1702", 256, 196);
});
const mirrorTex = () => ctex("pbMirror", 768, 640, (g) => {
  const gr = g.createLinearGradient(0, 0, 768, 640); gr.addColorStop(0, "#6f8a92"); gr.addColorStop(0.45, "#c7d6d9"); gr.addColorStop(0.55, "#8aa3aa"); gr.addColorStop(1, "#4f646b");
  g.fillStyle = gr; g.fillRect(0, 0, 768, 640);
  g.fillStyle = "rgba(255,255,255,0.35)"; for (const [x, w] of [[160, 40], [230, 14], [520, 26]]) { g.save(); g.translate(x, 0); g.transform(1, 0, -0.5, 1, 0, 0); g.fillRect(0, 0, w, 640); g.restore(); }
  g.fillStyle = "#e8b84a"; g.strokeStyle = "#5a3a10"; g.lineWidth = 4; g.textAlign = "center"; g.font = "bold italic 70px Georgia, serif";
  g.strokeText("Fine Ales", 384, 110); g.fillText("Fine Ales", 384, 110); g.font = "bold 44px Georgia, serif"; g.strokeText("& STOUT", 384, 170); g.fillText("& STOUT", 384, 170);
});
const dartTex = () => ctex("pbDart", 512, 512, (g) => {
  const c = 256; g.fillStyle = "#151515"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 20; i++) { const a0 = ((i - 0.5) / 20) * Math.PI * 2, a1 = ((i + 0.5) / 20) * Math.PI * 2;
    for (const [r0, r1, cA, cB] of [[150, 240, "#f1e4c4", "#1a1a1a"], [140, 150, "#2a8a3a", "#c4281e"], [70, 140, "#f1e4c4", "#1a1a1a"], [60, 70, "#2a8a3a", "#c4281e"]] as [number, number, string, string][]) {
      g.fillStyle = i % 2 ? cA : cB; g.beginPath(); g.arc(c, c, r1, a0, a1); g.arc(c, c, r0, a1, a0, true); g.closePath(); g.fill(); } }
  g.fillStyle = "#2a8a3a"; g.beginPath(); g.arc(c, c, 22, 0, Math.PI * 2); g.fill(); g.fillStyle = "#c4281e"; g.beginPath(); g.arc(c, c, 10, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#c8c8c8"; g.lineWidth = 2; for (const rr of [60, 70, 140, 150, 240]) { g.beginPath(); g.arc(c, c, rr, 0, Math.PI * 2); g.stroke(); }
});
/** the view out of the windows: hills, the road, and the stoop (gibbet post) on the hill the inn is named after */
const viewTex = () => ctex("pbView", 512, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, "#5a8fd0"); gr.addColorStop(1, "#bfe0f0"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#7fae5a"; g.beginPath(); g.moveTo(0, 330); g.quadraticCurveTo(200, 240, 512, 300); g.lineTo(512, 512); g.lineTo(0, 512); g.fill();
  g.fillStyle = "#5f9442"; g.beginPath(); g.moveTo(0, 400); g.quadraticCurveTo(300, 330, 512, 390); g.lineTo(512, 512); g.lineTo(0, 512); g.fill();
  g.strokeStyle = "#2a2018"; g.lineWidth = 6; g.beginPath(); g.moveTo(330, 262); g.lineTo(330, 196); g.lineTo(356, 196); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(352, 196); g.lineTo(352, 214); g.stroke(); // the stoop
  g.fillStyle = "#c8b080"; g.beginPath(); g.moveTo(240, 512); g.quadraticCurveTo(300, 380, 420, 300); g.lineTo(432, 302); g.quadraticCurveTo(330, 400, 300, 512); g.fill();
  g.fillStyle = "#ffffff"; for (const [x, y, s] of [[90, 90, 1], [380, 70, 0.8]]) { g.beginPath(); g.arc(x, y, 26 * s, 0, Math.PI * 2); g.arc(x + 30 * s, y - 10 * s, 30 * s, 0, Math.PI * 2); g.arc(x + 62 * s, y, 24 * s, 0, Math.PI * 2); g.fill(); }
});

/** small framed paintings for the walls (hunting horse, ship, a stern lady, the windmill), plates for the plate shelf */
const paintTex = (i: number) => ctex(`pbPaint${i}`, 512, 400, (g) => {
  const r = R01(i * 31 + 7);
  const bg = [["#8fb8d8", "#6f9a4a"], ["#a8c8e0", "#2a5a8a"], ["#5a6a4a", "#3a4a32"], ["#e0b878", "#7a9a4a"]][i];
  const gr = g.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, 512, 400);
  g.strokeStyle = "#1e140c"; g.lineWidth = 6; g.lineJoin = "round"; g.lineCap = "round";
  if (i === 0) { g.fillStyle = "#6a3a1e"; g.beginPath(); g.ellipse(250, 250, 110, 45, 0, 0, Math.PI * 2); g.fill(); g.stroke(); // a horse, mid-gallop
    g.beginPath(); g.moveTo(340, 230); g.lineTo(400, 160); g.lineTo(430, 175); g.lineTo(380, 245); g.closePath(); g.fill(); g.stroke();
    for (const [x, d] of [[180, -30], [210, 25], [300, -25], [330, 30]]) { g.beginPath(); g.moveTo(x, 280); g.lineTo(x + d, 350); g.stroke(); }
    g.fillStyle = "#c4281e"; g.beginPath(); g.ellipse(270, 190, 22, 30, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = "#fff8ec"; g.beginPath(); g.arc(270, 150, 20, 0, Math.PI * 2); g.fill(); g.stroke(); }
  if (i === 1) { g.fillStyle = "#e8e0cc"; for (const [x, h] of [[200, 170], [270, 200], [340, 150]]) { g.beginPath(); g.moveTo(x, 250); g.lineTo(x, 250 - h); g.quadraticCurveTo(x + 60, 250 - h / 2, x + 8, 240); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = "#5a3018"; g.beginPath(); g.moveTo(150, 250); g.lineTo(400, 250); g.lineTo(370, 300); g.lineTo(180, 300); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = "#ffffff"; g.lineWidth = 3; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(40 + k * 55, 330 + (k % 2) * 14, 22, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
  if (i === 2) { g.fillStyle = "#2a2a3a"; g.beginPath(); g.moveTo(130, 400); g.quadraticCurveTo(140, 250, 256, 240); g.quadraticCurveTo(372, 250, 382, 400); g.fill(); g.stroke();
    g.fillStyle = "#fffaf0"; g.beginPath(); g.ellipse(256, 170, 85, 95, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = "#3a2418"; g.beginPath(); g.ellipse(256, 95, 95, 40, 0, Math.PI, Math.PI * 2); g.fill();
    g.fillStyle = "#1e140c"; g.beginPath(); g.arc(225, 175, 8, 0, Math.PI * 2); g.arc(287, 175, 8, 0, Math.PI * 2); g.fill(); g.lineWidth = 5; g.beginPath(); g.moveTo(230, 215); g.lineTo(282, 215); g.stroke(); }
  if (i === 3) { g.fillStyle = "#f0e6d0"; g.beginPath(); g.moveTo(230, 300); g.lineTo(245, 160); g.lineTo(285, 160); g.lineTo(300, 300); g.closePath(); g.fill(); g.stroke();
    g.save(); g.translate(265, 165); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.fillStyle = "#d8c8a8"; g.fillRect(-8, 0, 16, 95); g.strokeRect(-8, 0, 16, 95); } g.restore();
    for (let k = 0; k < 7; k++) { g.strokeStyle = "rgba(40,60,20,0.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(r() * 512, 330 + r() * 60); g.lineTo(r() * 512, 330 + r() * 60); g.stroke(); } }
  g.strokeStyle = "rgba(255,240,200,0.18)"; g.lineWidth = 2; for (let k = 0; k < 200; k++) { const x = r() * 512, y = r() * 400; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 3); g.stroke(); } // brush strokes
});
const plateTex = () => ctex("pbPlate", 512, 512, (g) => {
  g.fillStyle = "#f6f4ee"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#2a4f9a"; g.fillStyle = "#2a4f9a";
  g.lineWidth = 16; g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke(); g.lineWidth = 5; g.beginPath(); g.arc(256, 256, 200, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(256, 256, 120, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.ellipse(256 + Math.cos(a) * 160, 256 + Math.sin(a) * 160, 22, 10, a, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.moveTo(200, 300); g.quadraticCurveTo(256, 160, 312, 300); g.stroke(); g.beginPath(); g.arc(256, 240, 30, 0, Math.PI * 2); g.fill();
});

// ---------------------------------------------------------------- the build
export const buildPub = (R: THREE.Object3D) => {
  const x0 = PX, g = new THREE.Group(), b = new Batch(), r = R01(1971), env = envTex();
  const M = {
    floor: lam("pbFloor", () => ({ map: rep(planksHD(true), 3.5, 3), color: "#b98a62" })),
    plaster: lam("pbPlasterM", () => ({ map: rep(plasterWarm(), 3, 1.2) })), boards: lam("pbBoardsM", () => ({ map: rep(boardsTex(), 4, 1) })),
    beam: lam("pbBeam", () => ({ map: rep(grainTex("pbGrainBeam", "#3e2414", "#1a0c05", "#5a3620", 4, 1024), 1, 1) })),
    beamT: lam("pbBeamT", () => { const t = rep(grainTex("pbGrainBeam", "#3e2414", "#1a0c05", "#5a3620", 4, 1024), 1, 1); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; return { map: t }; }),
    mahog: lam("pbMahog", () => { const t = rep(grainTex("pbGrainMah", "#7e3e18", "#34140a", "#a85e2c", 2, 1024), 1, 1); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; return { map: t }; }),
    mahogV: lam("pbMahogV", () => ({ map: rep(grainTex("pbGrainMah", "#7e3e18", "#34140a", "#a85e2c", 2, 1024), 1, 1) })),
    brass: lam("pbBrass", () => ({ color: "#e2ac40", envMap: env, reflectivity: 0.35, combine: THREE.MixOperation })),
    pewter: lam("pbPewter", () => ({ color: "#a7abb4", envMap: env, reflectivity: 0.32, combine: THREE.MixOperation })),
    iron: lam("pbIron", () => ({ color: "#2c2e33" })), porc: lam("pbPorc", () => ({ color: "#f7f3ea" })),
    beer: lam("pbBeer", () => ({ color: "#d88a1c" })), stout: lam("pbStout", () => ({ color: "#2a160c" })), foam: lam("pbFoam", () => ({ color: "#fff6e0" })),
    glassG: lam("pbGlassG", () => ({ color: "#2e7a3a" })), glassA: lam("pbGlassA", () => ({ color: "#9a5214" })), glassC: lam("pbGlassC", () => ({ color: "#cfe3e4" })), glassB: lam("pbGlassB", () => ({ color: "#3a2010" })),
    brick: lam("pbBrick", () => ({ map: rep(brickTex(), 2, 2) })), soot: lam("pbSoot", () => ({ color: "#1a1412" })), stone: lam("pbStone", () => ({ color: "#b8ac98" })),
    log: lam("pbLog", () => ({ color: "#5a3a22" })), hop: lam("pbHop", () => ({ color: "#8ab83a" })), leaf: lam("pbLeaf", () => ({ color: "#4f8a2c", side: THREE.DoubleSide })),
    curtain: lam("pbCurtain", () => ({ color: "#b8302a", side: THREE.DoubleSide })), wax: lam("pbWax", () => ({ color: "#f3ead2" })), shade: lam("pbShade", () => ({ color: "#2f7a52", side: THREE.DoubleSide })),
    fabric: lam("pbFabric", () => ({ color: "#e9c27a", side: THREE.DoubleSide })), glassL: lam("pbGlassL", () => ({ color: "#f4ead0" })),
    inn: lam("pbInnM", () => ({ map: innBoardTex() })), dare: lam("pbDareM", () => ({ map: dareTex() })), chalk: lam("pbChalkM", () => ({ map: chalkTex() })),
    mirror: lam("pbMirrorM", () => ({ map: mirrorTex() })), dart: lam("pbDartM", () => ({ map: dartTex() })), view: lam("pbViewM", () => ({ map: viewTex() })),
  };
  Object.assign(GLOSS_OF, { pbFloor: 0.35, pbMahog: 0.75, pbMahogV: 0.7, pbBrass: 1, pbPewter: 0.9, pbPorc: 0.9, pbBeer: 0.8, pbStout: 0.8, pbGlassG: 1, pbGlassA: 1, pbGlassC: 1, pbGlassB: 1,
    pbMirrorM: 1, pbBeam: 0.2, pbBeamT: 0.2, pbBoardsM: 0.35, pbIron: 0.5, pbGlassL: 0.8, pbShade: 0.6, pbDartM: 0.1 });
  const rb = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, rr = 0.012) => { const w = bx - ax, h = by - ay, d = bz - az; return new RoundedBoxGeometry(w, h, d, 2, Math.min(rr, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)).translate(x0 + (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); };
  const lathe = (prof: number[][], x: number, y: number, z: number, seg = 24) => new THREE.LatheGeometry(prof.map(([a, c]) => new THREE.Vector2(a, c)), seg).translate(x0 + x, y, z);
  const W = 3.6, ZB = -3, ZF = 3.2, H = 3.0;
  // ---- shell: planks, wainscot boards below a rail, warm plaster above, a dark timber frame, beamed ceiling ----
  b.add(new THREE.PlaneGeometry(2 * W, ZF - ZB).rotateX(-Math.PI / 2).translate(x0, 0, (ZB + ZF) / 2), M.floor);
  b.add(new THREE.PlaneGeometry(2 * W, ZF - ZB).rotateX(Math.PI / 2).translate(x0, H, (ZB + ZF) / 2), M.plaster);
  const wall = (len: number, cx: number, cz: number, ry: number) => {
    b.add(new THREE.PlaneGeometry(len, 1.0).translate(0, 0.5, 0).rotateY(ry).translate(x0 + cx, 0, cz), M.boards);
    b.add(new THREE.PlaneGeometry(len, H - 1.0).translate(0, 1.0 + (H - 1.0) / 2, 0).rotateY(ry).translate(x0 + cx, 0, cz), M.plaster);
  };
  wall(2 * W, 0, ZB, 0); wall(ZF - ZB, -W, (ZB + ZF) / 2, Math.PI / 2); wall(ZF - ZB, W, (ZB + ZF) / 2, -Math.PI / 2); wall(2 * W, 0, ZF, Math.PI);
  b.add(rb(-W, 0.98, ZB, W, 1.05, ZB + 0.05), M.beam); b.add(rb(-W, 0.98, ZB, -W + 0.05, 1.05, ZF), M.beam); b.add(rb(W - 0.05, 0.98, ZB, W, 1.05, ZF), M.beam); // dado rails
  b.add(rb(-W, 0, ZB, W, 0.12, ZB + 0.03), M.beam); b.add(rb(-W, 0, ZB, -W + 0.03, 0.12, ZF), M.beam); b.add(rb(W - 0.03, 0, ZB, W, 0.12, ZF), M.beam); // skirting
  for (const x of [-2.4, -0.6, 2.2]) b.add(rb(x - 0.09, 1.05, ZB, x + 0.09, H, ZB + 0.06, 0.01), M.beam);   // timber posts, back wall
  for (const z of [-1.2, 0.9, 2.6]) { b.add(rb(-W, 1.05, z - 0.09, -W + 0.06, H, z + 0.09, 0.01), M.beam); b.add(rb(W - 0.06, 1.05, z - 0.09, W, H, z + 0.09, 0.01), M.beam); }
  b.add(rb(-W, 2.15, ZB, W, 2.27, ZB + 0.06, 0.01), M.beam); // mid rail (back)
  for (let x = -3.0; x <= 3.01; x += 1.2) b.add(rb(x - 0.11, H - 0.26, ZB, x + 0.11, H, ZF, 0.02), M.beam); // ceiling beams across
  b.add(rb(-W, H - 0.34, -0.2, W, H - 0.02, 0.12, 0.025), M.beam); // the big summer beam
  // ---- the bar: counter along the back, raised panels, brass foot rail, pumps, pints, a bell ----
  const bx0 = -1.0, bx1 = 3.0, bz0 = -2.6, bz1 = -1.95;
  b.add(rb(bx0 - 0.05, 1.02, bz0 - 0.02, bx1 + 0.05, 1.085, bz1 + 0.06, 0.02), M.mahog);
  b.add(rb(bx0, 0.1, bz0, bx1, 1.02, bz1, 0.01), M.mahogV); b.add(rb(bx0 - 0.02, 0, bz0, bx1 + 0.02, 0.1, bz1 + 0.03, 0.006), M.beam);
  for (let x = bx0 + 0.12; x < bx1 - 0.3; x += 0.62) { b.add(rb(x, 0.22, bz1, x + 0.5, 0.92, bz1 + 0.025, 0.01), M.mahog); b.add(rb(x + 0.06, 0.28, bz1 + 0.02, x + 0.44, 0.86, bz1 + 0.04, 0.012), M.mahogV); }
  b.add(new THREE.TubeGeometry(new THREE.LineCurve3(V(x0 + bx0, 0.2, bz1 + 0.14), V(x0 + bx1, 0.2, bz1 + 0.14)), 4, 0.022, 14), M.brass);
  for (let x = bx0 + 0.2; x < bx1; x += 0.8) b.add(turned([[0, 0], [0.012, 0], [0.012, 0.8], [0.02, 0.85], [0.02, 1], [0, 1]], V(x0 + x, 0.2, bz1 + 0.01), V(x0 + x, 0.2, bz1 + 0.14), 12), M.brass);
  [0.2, 0.62, 1.04, 1.46].forEach((x, i) => { // beer engines: brass collar, porcelain handle, a readable pump clip
    b.add(lathe([[0, 0], [0.045, 0], [0.045, 0.02], [0.03, 0.04], [0.025, 0.08], [0.032, 0.1], [0, 0.1]], x, 1.085, -2.28, 20), M.brass);
    b.add(turned([[0, 0], [0.018, 0], [0.022, 0.1], [0.028, 0.45], [0.024, 0.75], [0.03, 0.9], [0.02, 1], [0, 1]], V(x0 + x, 1.18, -2.28), V(x0 + x, 1.62, -2.36), 16), M.porc);
    b.add(turned([[0, 0], [0.024, 0], [0.024, 1], [0, 1]], V(x0 + x, 1.23, -2.288), V(x0 + x, 1.26, -2.291), 16), M.iron);
    const clip = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.135), lam(`pbClipM${i}`, () => ({ map: clipTex(i) }))); clip.position.set(x0 + x, 1.5, -2.31); clip.rotation.x = -0.18; g.add(clip);
  });
  const pint = (x: number, y: number, z: number, beer = M.beer, h = 0.15) => { // straight pint: amber body, foam head, glass lip
    b.add(lathe([[0, 0], [0.034, 0], [0.036, 0.01], [0.042, h * 0.85], [0.045, h], [0, h]], x, y, z, 22), beer);
    b.add(lathe([[0, 0], [0.045, 0], [0.047, 0.012], [0.04, 0.026], [0, 0.03]], x, y + h - 0.006, z, 22), M.foam);
  };
  const tankard = (x: number, y: number, z: number, ry = 0) => {
    const tk = new THREE.Group();
    tk.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.052, 0.012], [0.046, 0.02], [0.044, 0.11], [0.048, 0.125], [0.043, 0.13], [0.04, 0.02], [0, 0.02]].map(([a, c]) => new THREE.Vector2(a, c)), 24), M.pewter));
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 8, 16, Math.PI), M.pewter); hd.rotation.z = -Math.PI / 2; hd.position.set(0.05, 0.065, 0); tk.add(hd);
    tk.position.set(x0 + x, y, z); tk.rotation.y = ry; tk.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); g.add(tk);
  };
  pint(-0.62, 1.085, -2.12); pint(1.85, 1.085, -2.1, M.stout); pint(2.05, 1.085, -2.18); tankard(2.5, 1.085, -2.15, 0.6);
  b.add(lathe([[0, 0], [0.05, 0], [0.05, 0.01], [0.012, 0.015], [0.012, 0.03], [0.04, 0.035], [0.05, 0.06], [0.04, 0.1], [0.012, 0.12], [0.02, 0.135], [0, 0.14]], 2.75, 1.085, -2.3, 24), M.brass); // the bell
  // ---- back bar: shelves of bottles with labels, barrels with taps, the gilt mirror, the inn board, a clock ----
  for (const [sx0, sx1] of [[-0.9, 0.35], [1.95, 3.0]]) for (const y of [1.25, 1.62, 1.99]) {
    b.add(rb(sx0, y - 0.03, ZB, sx1, y, ZB + 0.26, 0.006), M.beam);
    for (let x = sx0 + 0.08; x < sx1 - 0.05; x += 0.13 + r() * 0.05) {
      const k = Math.floor(r() * 4), mat = [M.glassG, M.glassA, M.glassC, M.glassB][k], hh = 0.22 + r() * 0.1, z = ZB + 0.12 + (r() - 0.5) * 0.06;
      b.add(lathe([[0, 0], [0.036, 0], [0.038, 0.01], [0.038, hh * 0.62], [0.03, hh * 0.72], [0.013, hh * 0.82], [0.012, hh], [0.016, hh + 0.004], [0, hh + 0.006]], x, y, z, 20), mat);
      if (r() < 0.7) { const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.0385, 0.0385, hh * 0.28, 20, 1, true, -1.1, 2.2), lam(`pbLabelM${k}`, () => ({ map: labelTex(k) }))); lb.position.set(x0 + x, y + hh * 0.3, z); g.add(lb); }
    }
  }
  for (const x of [2.2, 2.65]) { // small spirit barrels on the counter top with brass taps
    const bar = new THREE.LatheGeometry([[0, 0], [0.11, 0], [0.13, 0.06], [0.135, 0.12], [0.13, 0.18], [0.11, 0.24], [0, 0.24]].map(([a, c]) => new THREE.Vector2(a, c)), 24);
    bar.rotateZ(Math.PI / 2).translate(x0 + x + 0.12, 1.085 + 0.14, -2.45); b.add(bar, M.mahogV);
    for (const dx of [0.03, 0.21]) b.add(new THREE.TorusGeometry(0.128, 0.008, 6, 28).rotateY(Math.PI / 2).translate(x0 + x + dx, 1.085 + 0.14, -2.45), M.iron);
    b.add(rb(x + 0.08, 1.085, -2.56, x + 0.16, 1.11, -2.34, 0.004), M.beam);
    b.add(turned([[0, 0], [0.01, 0], [0.01, 1], [0, 1]], V(x0 + x + 0.12, 1.2, -2.33), V(x0 + x + 0.12, 1.2, -2.27), 10), M.brass);
  }
  b.add(rb(0.42, 1.18, ZB, 1.88, 2.34, ZB + 0.05, 0.015), M.brass); // gilt mirror frame + glass
  b.add(new THREE.PlaneGeometry(1.32, 1.04).translate(x0 + 1.15, 1.76, ZB + 0.052), M.mirror);
  b.add(rb(-0.95, 2.36, ZB, 3.05, 2.72, ZB + 0.06, 0.01), M.beam);
  b.add(new THREE.PlaneGeometry(1.92, 0.36).translate(x0 + 1.15, 2.54, ZB + 0.062), M.inn);
  // ---- beams over the bar: hop garland + pewter tankards on hooks ----
  const hopC = new THREE.CatmullRomCurve3([V(x0 - 1.1, 2.72, -1.86), V(x0 - 0.2, 2.58, -1.86), V(x0 + 0.8, 2.66, -1.86), V(x0 + 1.9, 2.57, -1.86), V(x0 + 3.0, 2.7, -1.86)]);
  b.add(new THREE.TubeGeometry(hopC, 60, 0.012, 6), M.log);
  for (let i = 0; i <= 70; i++) { const p = hopC.getPoint(i / 70), q = V(p.x + (r() - 0.5) * 0.06, p.y - 0.03 - r() * 0.07, p.z + (r() - 0.5) * 0.08);
    if (i % 2) b.add(new THREE.IcosahedronGeometry(0.028, 1).scale(0.8, 1.25, 0.8).translate(q.x, q.y, q.z), M.hop);
    else b.add(new THREE.SphereGeometry(0.05, 8, 4).scale(1, 0.18, 0.6).rotateZ((r() - 0.5) * 1.5).rotateY(r() * 3).translate(q.x, q.y + 0.01, q.z), M.leaf); }
  b.add(rb(-1.0, H - 0.26 - 0.1, -2.0, 3.0, H - 0.26, -1.9, 0.01), M.beam); // the beam over the counter (hooks)
  for (let x = -0.7; x < 2.9; x += 0.42) { b.add(new THREE.TorusGeometry(0.02, 0.004, 6, 12, Math.PI * 1.4).translate(x0 + x, H - 0.4, -1.95), M.iron); tankard(x, H - 0.58, -1.95, 1.2 + r()); }
  // ---- the fireplace on the right wall: brick surround, soot, hearth stone, logs, live flames; mantel with brasses ----
  const fz = 0.9;
  b.add(rb(W - 0.36, 0, fz - 0.95, W, 1.5, fz + 0.95, 0.02), M.brick);
  b.add(rb(W - 0.37, 0.12, fz - 0.55, W - 0.05, 0.92, fz + 0.55, 0.01), M.soot);
  b.add(rb(W - 0.75, 0, fz - 1.05, W - 0.3, 0.06, fz + 1.05, 0.01), M.stone);
  b.add(rb(W - 0.48, 1.5, fz - 1.1, W, 1.6, fz + 1.1, 0.015), M.beam);
  for (const [dz, ry] of [[-0.18, 0.3], [0.16, -0.25], [0, 0.05]] as [number, number][]) b.add(new THREE.CylinderGeometry(0.055, 0.06, 0.6, 12).rotateX(Math.PI / 2).rotateY(Math.PI / 2 + ry).translate(x0 + W - 0.28, 0.18 + (dz === 0 ? 0.08 : 0), fz + dz), M.log);
  for (const dz of [-0.75, 0.75]) b.add(lathe([[0, 0], [0.05, 0], [0.05, 0.012], [0.015, 0.03], [0.012, 0.2], [0.03, 0.21], [0.03, 0.22], [0, 0.22]], W - 0.22, 1.6, fz + dz, 20), M.brass);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.008, 24).rotateZ(Math.PI / 2), M.brass); m.position.set(x0 + W - 0.04, 1.32 - i * 0.0, fz - 0.45 + i * 0.3); g.add(m); }
  { const fireG = new THREE.Group();
    for (const [dz, s] of [[0, 1], [-0.14, 0.75], [0.15, 0.7]]) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s, 0.38 * s, 12).translate(0, 0.19 * s, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.35, 0.3) }));
      fl.position.set(x0 + W - 0.28, 0.24, fz + dz); fl.layers.set(NOINK); fireG.add(fl);
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.045 * s, 0.22 * s, 10).translate(0, 0.11 * s, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 2.6, 1.2) })); core.position.copy(fl.position); core.layers.set(NOINK); fireG.add(core); }
    const hh = halo(new THREE.Color(1.0, 0.5, 0.15), 1.6); hh.position.set(x0 + W - 0.35, 0.45, fz); fireG.add(hh);
    g.add(fireG); FIRE.push(fireG); }
  // ---- dart board + the DARES chalk board (front right) ----
  { const db = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.04, 40).rotateZ(Math.PI / 2), [M.beam, M.dart, M.dart]); db.position.set(x0 + W - 0.03, 1.73, 2.25); g.add(db);
    for (const [dy, dz] of [[0.05, 0.02], [-0.07, -0.04], [0.11, -0.09]]) { b.add(turned([[0, 0], [0.003, 0], [0.006, 0.3], [0.004, 1], [0, 1]], V(x0 + W - 0.05, 1.73 + dy, 2.25 + dz), V(x0 + W - 0.2, 1.75 + dy, 2.27 + dz), 8), M.iron);
      b.add(new THREE.PlaneGeometry(0.05, 0.03).rotateY(Math.PI / 2).translate(x0 + W - 0.2, 1.755 + dy, 2.27 + dz), M.curtain); }
    b.add(rb(W - 0.03, 1.0, 1.55, W, 1.9, 1.95 + 0.0, 0.004), M.beam); b.add(new THREE.PlaneGeometry(0.4, 0.86).rotateY(-Math.PI / 2).translate(x0 + W - 0.032, 1.45, 1.75), M.chalk); }
  // ---- left wall: two leaded windows (deep sills, small panes, red curtains), the view to the stoop hill ----
  for (const zc of [-0.75, 1.55]) {
    b.add(new THREE.PlaneGeometry(0.9, 1.0).rotateY(Math.PI / 2).translate(x0 - W - 0.1, 1.55, zc), M.view);
    b.add(rb(-W, 1.0, zc - 0.5, -W + 0.22, 1.06, zc + 0.5, 0.01), M.beam);
    for (const dz of [-0.45, 0, 0.45]) b.add(rb(-W - 0.02, 1.05, zc + dz - 0.03, -W + 0.04, 2.05, zc + dz + 0.03, 0.006), M.beam);
    for (const y of [1.05, 1.55, 2.05]) b.add(rb(-W - 0.02, y - 0.03, zc - 0.48, -W + 0.04, y + 0.03, zc + 0.48, 0.006), M.beam);
    for (let k = 1; k < 6; k++) { const y = 1.05 + k * (1.0 / 6); b.add(new THREE.BoxGeometry(0.01, 0.006, 0.9).translate(x0 - W + 0.01, y, zc), M.iron); }
    for (let k = -3; k <= 3; k++) b.add(new THREE.BoxGeometry(0.01, 1.0, 0.006).translate(x0 - W + 0.01, 1.55, zc + k * 0.128), M.iron);
    for (const s of [-1, 1]) { const c = new THREE.PlaneGeometry(0.34, 1.25, 8, 1); const pa = c.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pa.count; i++) pa.setZ(i, 0.03 * Math.sin(pa.getX(i) * 40)); c.computeVertexNormals();
      c.rotateY(Math.PI / 2).translate(x0 - W + 0.1, 1.5, zc + s * 0.62); b.add(c, M.curtain); }
    b.add(turned([[0, 0], [0.012, 0], [0.012, 1], [0, 1]], V(x0 - W + 0.1, 2.16, zc - 0.85), V(x0 - W + 0.1, 2.16, zc + 0.85), 10), M.iron);
  }
  // ---- the chair's corner: little round table + a pint, the dare plaque on the wall, the chair itself ----
  const cx = PUB_CHAIR.x, cz = PUB_CHAIR.z;
  b.add(lathe([[0, 0], [0.2, 0], [0.2, 0.02], [0.05, 0.05], [0.035, 0.12], [0.03, 0.5], [0.045, 0.56], [0.03, 0.62], [0, 0.62]], cx + 0.62, 0, cz + 0.05, 24), M.mahogV);
  b.add(lathe([[0, 0], [0.3, 0], [0.31, 0.015], [0.3, 0.035], [0, 0.035]], cx + 0.62, 0.62, cz + 0.05, 40), M.mahog);
  pint(cx + 0.66, 0.655, cz + 0.02);
  b.add(rb(cx - 0.2, 1.62, ZB, cx + 0.42, 1.94, ZB + 0.02, 0.006), M.beam);
  b.add(new THREE.PlaneGeometry(0.6, 0.3).translate(x0 + cx + 0.11, 1.78, ZB + 0.022), M.dare);
  { const ch = buildChair(); ch.position.set(x0 + cx, 0.44, cz); ch.rotation.y = PUB_CHAIR.ry; g.add(ch); PCHAIR = ch; }
  // ---- tables, stools, a settle ----
  for (const [tx, tz] of [[0.6, 0.9], [-1.2, 1.6]]) {
    b.add(lathe([[0, 0], [0.24, 0], [0.24, 0.02], [0.05, 0.05], [0.04, 0.12], [0.035, 0.66], [0.05, 0.7], [0, 0.7]], tx, 0, tz, 24), M.mahogV);
    b.add(lathe([[0, 0], [0.42, 0], [0.43, 0.02], [0.42, 0.045], [0, 0.045]], tx, 0.7, tz, 48), M.mahog);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + r(), sx = tx + Math.cos(a) * 0.62, sz = tz + Math.sin(a) * 0.62;
      b.add(lathe([[0, 0], [0.17, 0], [0.18, 0.02], [0.16, 0.045], [0, 0.045]], sx, 0.45, sz, 28), M.mahog);
      for (let l = 0; l < 3; l++) { const la = l * 2.094 + a; b.add(turned(LEGS, V(x0 + sx + Math.cos(la) * 0.15, 0, sz + Math.sin(la) * 0.15), V(x0 + sx + Math.cos(la) * 0.09, 0.45, sz + Math.sin(la) * 0.09), 12), M.mahogV); } }
    pint(tx - 0.12, 0.745, tz + 0.08); tankard(tx + 0.15, 0.745, tz - 0.1, r() * 6);
  }
  b.add(rb(-W + 0.05, 0.42, 0.6, -W + 0.55, 0.47, 2.6, 0.012), M.mahog); b.add(rb(-W + 0.05, 0.47, 0.6, -W + 0.12, 1.25, 2.6, 0.012), M.mahogV); // settle
  for (const z of [0.65, 2.55]) b.add(rb(-W + 0.05, 0, z - 0.04, -W + 0.55, 0.42, z + 0.04, 0.008), M.mahogV);
  // ---- wall dressing (reference rooms: no bare wall): paintings, a plate shelf, the clock, horse brasses, a rug,
  // a coat rack by the door ----
  const pic = (i: number, cxp: number, cy: number, z: number, ry: number, w = 0.5, h = 0.4, gilt = true) => {
    const fr = new THREE.Group(), t = 0.05, mat = gilt ? M.brass : M.beam;
    for (const [ax, ay, bw, bh] of [[0, h / 2 + t / 2, w + 2 * t, t], [0, -h / 2 - t / 2, w + 2 * t, t], [-w / 2 - t / 2, 0, t, h], [w / 2 + t / 2, 0, t, h]]) { const m = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, 0.035, 2, 0.008), mat); m.position.set(ax, ay, 0.0175); fr.add(m); }
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam(`pbPaintM${i}`, () => ({ map: paintTex(i) }))); pm.position.z = 0.012; fr.add(pm);
    fr.position.set(x0 + cxp, cy, z); fr.rotation.y = ry; fr.traverse((o) => { (o as THREE.Mesh).castShadow = true; }); g.add(fr);
  };
  pic(0, -1.45, 1.62, ZB + 0.002, 0, 0.56, 0.42); pic(2, -1.5, 2.45, ZB + 0.002, 0, 0.3, 0.4, false);
  pic(1, -W + 0.002, 1.55, 2.62 + 0.0, Math.PI / 2, 0.5, 0.38); pic(3, W - 0.002, 2.25, -1.7, -Math.PI / 2, 0.5, 0.4);
  b.add(rb(W - 0.2, 2.2, fz - 0.9, W, 2.24, fz + 0.9, 0.006), M.beam); // plate shelf over the fire
  for (let k = 0; k < 5; k++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.015, 32).rotateZ(Math.PI / 2 - 0.22), [M.porc, lam("pbPlateM", () => ({ map: plateTex() })), M.porc]); pl.position.set(x0 + W - 0.1, 2.38, fz - 0.68 + k * 0.34); g.add(pl); }
  { const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 40).rotateX(Math.PI / 2), [M.beam, lam("pbClockM", () => ({ map: clockFaceTex() })), M.beam]); ck.position.set(x0 + 0.85, 2.0, -2.97 + 0.0); ck.visible = false; g.add(ck);
    const ck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 40).rotateZ(Math.PI / 2), [M.brass, lam("pbClockM", () => ({ map: clockFaceTex() })), M.brass]); ck2.position.set(x0 - W + 0.03, 2.5, 0.4); ck2.rotation.x = 0; g.add(ck2); }
  for (const x of [-2.4, -0.6]) for (let k = 0; k < 3; k++) b.add(new THREE.CylinderGeometry(0.055, 0.055, 0.008, 24).rotateX(Math.PI / 2).translate(x0 + x, 1.45 + k * 0.2, ZB + 0.07), M.brass); // horse brasses on the posts
  { const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0).rotateX(-Math.PI / 2), lam("pbRug", () => ({ map: rugTex() }))); rug.position.set(x0 + W - 1.2, 0.006, fz); rug.rotation.y = Math.PI / 2; rug.receiveShadow = true; g.add(rug); }
  b.add(turned([[0, 0], [0.16, 0], [0.16, 0.03], [0.03, 0.06], [0.022, 0.3], [0.028, 0.6], [0.022, 0.95], [0.04, 0.97], [0, 1]], V(x0 - W + 0.35, 0, 2.9), V(x0 - W + 0.35, 1.85, 2.9), 20), M.mahogV); // coat stand
  for (let k = 0; k < 4; k++) { const a = k * 1.5708 + 0.4; b.add(turned([[0, 0], [0.012, 0], [0.01, 0.7], [0.018, 0.9], [0, 1]], V(x0 - W + 0.35, 1.7, 2.9), V(x0 - W + 0.35 + Math.cos(a) * 0.16, 1.82, 2.9 + Math.sin(a) * 0.16), 10), M.brass); }
  b.build(g, true);
  // ---- era lights (switch per shot) ----
  const glow = (grp: THREE.Group, p: THREE.Vector3, col: THREE.Color, s: number, flameCol = new THREE.Color(3.2, 2.1, 0.8)) => {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8).scale(1, 2.1, 1), new THREE.MeshBasicMaterial({ color: flameCol })); fl.position.copy(p); fl.layers.set(NOINK); grp.add(fl);
    const hh = halo(col, s); hh.position.copy(p); grp.add(hh);
  };
  { const e0 = ERA[0], eb = new Batch(); // candles: wall sconces, table candles, a wheel chandelier
    const candle = (x: number, y: number, z: number) => { eb.add(lathe([[0, 0], [0.045, 0], [0.045, 0.01], [0.012, 0.025], [0.012, 0.05], [0.03, 0.055], [0, 0.06]], x, y, z, 16), M.iron); eb.add(new THREE.CylinderGeometry(0.014, 0.015, 0.12, 14).translate(x0 + x, y + 0.12, z), M.wax); glow(e0, V(x0 + x, y + 0.2, z), new THREE.Color(1, 0.62, 0.25), 0.5); };
    candle(cx + 0.55, 0.655, cz + 0.14); candle(0.6, 0.745, 0.9); candle(-1.2, 0.745, 1.6); candle(-0.75, 1.085, -2.3);
    for (const [wx, wz] of [[-W + 0.08, -1.8], [-W + 0.08, 0.4]]) { eb.add(rb(wx - 0.02, 1.62, wz - 0.03, wx + 0.15, 1.66, wz + 0.03, 0.005), M.iron); candle(wx + 0.12, 1.66, wz); }
    eb.add(new THREE.TorusGeometry(0.42, 0.02, 8, 40).rotateX(Math.PI / 2).translate(x0 + 0.6, 2.25, 0.4), M.iron);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; candle(0.6 + Math.cos(a) * 0.42, 2.24, 0.4 + Math.sin(a) * 0.42); }
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; eb.add(turned([[0, 0], [0.004, 0], [0.004, 1], [0, 1]], V(x0 + 0.6 + Math.cos(a) * 0.42, 2.25, 0.4 + Math.sin(a) * 0.42), V(x0 + 0.6, 2.74, 0.4), 6), M.iron); }
    eb.build(e0, true); }
  { const e1 = ERA[1], eb = new Batch(); // oil lamps: brass fonts, glass chimneys, a hanging lamp over the bar
    const lamp = (x: number, y: number, z: number, s = 1) => { eb.add(lathe([[0, 0], [0.06, 0], [0.06, 0.012], [0.025, 0.03], [0.02, 0.09], [0.055, 0.12], [0.06, 0.16], [0.03, 0.19], [0.025, 0.2], [0, 0.2]].map(([a, c]) => [a * s, c * s]), x, y, z, 20), M.brass);
      eb.add(lathe([[0, 0], [0.03, 0], [0.04, 0.03], [0.042, 0.08], [0.026, 0.12], [0.022, 0.2], [0, 0.2]].map(([a, c]) => [a * s, c * s]), x, y + 0.2 * s, z, 20), M.glassL); glow(e1, V(x0 + x, y + 0.27 * s, z), new THREE.Color(1, 0.7, 0.32), 0.7 * s); };
    lamp(cx + 0.55, 0.655, cz + 0.14); lamp(0.6, 0.745, 0.9); lamp(-1.2, 0.745, 1.6); lamp(2.85, 1.085, -2.05, 0.9);
    eb.add(turned([[0, 0], [0.006, 0], [0.006, 1], [0, 1]], V(x0 + 1.0, 2.2, -1.5), V(x0 + 1.0, H - 0.26, -1.5), 8), M.brass); lamp(1.0, 1.98, -1.5, 1.1);
    eb.build(e1, true); }
  { const e2 = ERA[2], eb = new Batch(); // electric: green enamel pendants over the bar, fabric-shaded wall lamps
    const pend = (x: number, z: number) => { eb.add(turned([[0, 0], [0.005, 0], [0.005, 1], [0, 1]], V(x0 + x, 2.2, z), V(x0 + x, H - 0.26, z), 8), M.iron);
      eb.add(new THREE.LatheGeometry([[0.03, 0], [0.05, -0.04], [0.14, -0.14], [0.16, -0.17], [0.15, -0.17], [0.04, -0.05], [0.03, -0.01]].map(([a, c]) => new THREE.Vector2(a, c)), 32).translate(x0 + x, 2.2, z), M.shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.5, 1.6) })); bulb.position.set(x0 + x, 2.06, z); bulb.layers.set(NOINK); e2.add(bulb);
      const hh = halo(new THREE.Color(1, 0.82, 0.5), 0.8); hh.position.set(x0 + x, 2.04, z); e2.add(hh); };
    pend(0.0, -1.55); pend(1.15, -1.55); pend(2.3, -1.55);
    for (const [wx, wz] of [[-W + 0.06, -1.8], [-W + 0.06, 0.4]]) { eb.add(rb(wx, 1.6, wz - 0.03, wx + 0.12, 1.64, wz + 0.03, 0.005), M.brass);
      eb.add(new THREE.CylinderGeometry(0.07, 0.11, 0.14, 24, 1, true).translate(x0 + wx + 0.14, 1.74, wz), M.fabric); glow(e2, V(x0 + wx + 0.14, 1.72, wz), new THREE.Color(1, 0.78, 0.45), 0.55, new THREE.Color(3, 2.6, 1.8)); }
    eb.build(e2, true); }
  ERA.forEach((e) => g.add(e));
  R.add(g);
};
const LEGS: [number, number][] = [[0, 0], [0.012, 0], [0.015, 0.3], [0.017, 0.55], [0.014, 0.8], [0.012, 1], [0, 1]];
