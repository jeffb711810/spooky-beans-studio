// WINCHESTER MYSTERY HOUSE exterior (Rick-style recreation of the real house, from the Commons reference photos):
// butter-yellow stick-style walls with olive boards, brick-red roofs (steep gables, witch-hat turrets with spiky finials),
// the round cupola with arched windows, the ivy-covered tower, the hanging fish-scale turret by the Door to Nowhere, the
// open belvedere, verandas, chimneys; formal gardens: lawn, hedges, the fountain with a statue, palms, big round trees.
// All parts are data-driven (MASS below) so positions can be tuned against the photos without touching the builders.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, quad, tri } from "../bridge/build";
import { grassHD, ctex } from "../bridge/paint";
import { GLOSS_OF, SATMUL_OF } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { stickworkTex, fishscaleTex, roofRedTex, leadedTex } from "./textures";

export const WH = { X: -900, Z: 0 };
/** per-frame state the staging sets before the world applies it (mansionMood): scaffolding, the 1906 tower, its fall */
export const WHS = { scaffold: 0, tallTower: 0, fall: 0, lit: 1, doorNW: 0, bell: 0 };
const WIN_GLASS: THREE.Mesh[] = [], CLOUDS: THREE.Mesh[] = [], LAMPS: THREE.Mesh[] = [];
let FLOWERS: THREE.Object3D | null = null, GLOBE_DAY: THREE.Material | null = null;
let SCAFF: THREE.Group | null = null, TALL: THREE.Group | null = null, GLASS_DAY: THREE.Material | null = null, DOORNW: THREE.Group | null = null, BELL: THREE.Group | null = null;
const GLASS_NIGHT = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.3, 1.55, 0.7) }), GLASS_DARK = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.04, 0.05, 0.09) });
/** called every frame by the world after staging: day / night windows, clouds, scaffolding, the tall tower and its fall */
export const mansionMood = (mode: "day" | "night" | "int") => {
  WIN_GLASS.forEach((m, i) => { m.material = mode === "night" ? (((i * 7) % 10) < 6 * WHS.lit ? GLASS_NIGHT : GLASS_DARK) : (GLASS_DAY as THREE.Material); });
  CLOUDS.forEach((c) => (c.visible = mode === "day"));
  if (FLOWERS) FLOWERS.visible = mode !== "night"; // red blooms read purple under the night grade
  LAMPS.forEach((m) => { m.material = mode === "night" ? GLASS_NIGHT : (GLOBE_DAY as THREE.Material); });
  if (SCAFF) SCAFF.visible = WHS.scaffold > 0;
  if (DOORNW) DOORNW.rotation.y = -1.75 * WHS.doorNW; // swings OUT over the drop
  if (BELL) BELL.rotation.z = 0.5 * Math.sin(WHS.bell);
  if (TALL) { TALL.visible = WHS.tallTower > 0 && WHS.fall < 1; const u = Math.min(1, WHS.fall); TALL.rotation.set(0, 0, -1.3 * u * u); TALL.position.set(0, -3 * u * u * u, 0); }
};
const cloudTex = () => ctex("whCloud", 512, 256, (g) => {
  g.clearRect(0, 0, 512, 256);
  for (const [x, y, r] of [[150, 160, 80], [240, 120, 100], [340, 150, 85], [420, 175, 60], [90, 185, 55]]) {
    const gr = g.createRadialGradient(x, y - r * 0.3, r * 0.2, x, y, r); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.85, "#f2f8ff"); gr.addColorStop(1, "rgba(242,248,255,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
});
const trunkTex = () => ctex("whPalmTrunk", 128, 512, (g) => { g.fillStyle = "#9a6a3c"; g.fillRect(0, 0, 128, 512); for (let y = 0; y < 512; y += 24) { g.fillStyle = "#7a4e2a"; g.fillRect(0, y, 128, 7); g.fillStyle = "#b4824e"; g.fillRect(0, y + 7, 128, 4); } });

// Rick-style turf: jittered triangle facets with small value / hue shifts (seamless tile), olive-green, no fine noise
const lawnTex = () => ctex("whLawn3", 1024, 1024, (g) => {
  const N = 16, s = 1024 / N, h = (i: number) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const w = (i: number) => ((i % N) + N) % N;
  const pt = (i: number, j: number) => { const k = w(i) * 131 + w(j) * 17; return [i * s + (h(k) - 0.5) * s * 0.7, j * s + (h(k + 7.3) - 0.5) * s * 0.7]; };
  g.fillStyle = "#93ad48"; g.fillRect(0, 0, 1024, 1024);
  for (let i = -1; i <= N; i++) for (let j = -1; j <= N; j++) {
    const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
    [[a, b, c], [a, c, d]].forEach((t, q) => {
      const r = h(w(i) * 977 + w(j) * 131 + q * 53), u = h(w(i) * 71 + w(j) * 29 + q * 5 + 0.5), v = 0.94 + r * 0.12;
      g.fillStyle = `rgb(${Math.round((140 + u * 16) * v)},${Math.round(174 * v)},${Math.round((64 + u * 8) * v)})`;
      g.beginPath(); g.moveTo(t[0][0], t[0][1]); g.lineTo(t[1][0], t[1][1]); g.lineTo(t[2][0], t[2][1]); g.closePath(); g.fill();
    });
  }
});
const gravelTex = () => ctex("whGravel3", 512, 512, (g) => {
  const h = (i: number) => { const v = Math.sin(i * 91.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
  g.fillStyle = "#e4c48e"; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 70; k++) { const x = h(k) * 512, y = h(k + 300) * 512, r = 24 + h(k + 600) * 40, lt = h(k + 900) < 0.5;
    for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      gr.addColorStop(0, lt ? "rgba(246,222,170,0.22)" : "rgba(200,164,112,0.09)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, 2 * r, 2 * r); } }
  for (let k = 0; k < 260; k++) { const x = h(k + 1200) * 512, y = h(k + 1500) * 512, r = 2 + h(k + 1800) * 2.5;
    g.fillStyle = h(k + 2100) < 0.5 ? "rgba(190,152,104,0.18)" : "rgba(255,244,220,0.3)"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
});

export const buildMansion = (R: THREE.Object3D) => {
  const OX = WH.X, OZ = WH.Z, FL = 3.2, DS = THREE.DoubleSide;
  const P = (x: number, y: number, z: number) => V(OX + x, y, OZ + z);
  const rb = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r = 0.03, seg = 2) => {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, rr = Math.max(0.001, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
    return new RoundedBoxGeometry(w, h, d, seg, rr).translate(OX + (x0 + x1) / 2, (y0 + y1) / 2, OZ + (z0 + z1) / 2);
  };
  const lathe = (prof: number[][], x: number, y: number, z: number, sy = 1, sr = 1, seg = 24) =>
    new THREE.LatheGeometry(prof.map(([r, yy]) => new THREE.Vector2(r * sr, yy * sy)), seg).translate(OX + x, y, OZ + z);
  const wq = (xa: number, za: number, xb: number, zb: number, y0: number, y1: number, tu: number, tv: number) => {
    const L = Math.hypot(xb - xa, zb - za);
    return quad(P(xa, y0, za), P(xb, y0, zb), P(xb, y1, zb), P(xa, y1, za), L / tu, (y1 - y0) / tv, 0, y0 / tv);
  };
  const M = {
    wall: lam("whxWall3", () => ({ map: stickworkTex() })), wallLow: lam("whxWallLow", () => ({ color: "#6c6a46" })),
    olive: lam("whxOlive", () => ({ color: "#5d5a3c" })), white: lam("whxWhite", () => ({ color: "#fbf6ea" })),
    fish: lam("whxFish", () => ({ map: fishscaleTex(), side: DS })), roof: lam("whxRoof2", () => ({ map: roofRedTex(), side: DS })),
    roofEdge: lam("whxRoofEdge", () => ({ color: "#a8382e" })), glass: lam("whxGlass", () => ({ map: leadedTex() })),
    brick: lam("whxBrick", () => ({ color: "#b8604a" })), spire: lam("whxSpire", () => ({ color: "#d8d2b8" })),
    ivy: lam("whxIvy", () => ({ color: "#3f9a3e" })), ivyD: lam("whxIvyD", () => ({ color: "#2f7f32" })),
    grass: lam("whxGrass5", () => ({ map: grassHD(), color: "#a8bb52" })), path: lam("whxPath2", () => ({ color: "#e2b878" })),
    hedge: lam("whxHedge2", () => ({ color: "#6aa83a" })), hedgeD: lam("whxHedgeD2", () => ({ color: "#5a9632" })),
    stone: lam("whxStone", () => ({ color: "#e6dccb" })), water: lam("whxWater", () => ({ color: "#7fd0f4" })), jet: lam("whxJet", () => ({ color: "#e8f8ff" })),
    trunk: lam("whxTrunk", () => ({ map: trunkTex() })), frond: lam("whxFrond", () => ({ color: "#4cbf52", side: DS })), frondD: lam("whxFrondD", () => ({ color: "#36a043", side: DS })),
    treeA: lam("whxTreeA2", () => ({ color: "#7cb444" })), treeB: lam("whxTreeB2", () => ({ color: "#689e3a" })), bark: lam("whxBark", () => ({ color: "#7a5032" })),
    flowerR: lam("whxFlowerR", () => ({ color: "#ff5a4a" })), flowerY: lam("whxFlowerY", () => ({ color: "#ffd23a" })),
  };
  Object.assign(GLOSS_OF, { whxGlass: 1, whxWhite: 0.3, whxOlive: 0.35, whxRoof2: 0.3, whxWater: 1, whxStone: 0.3, whxSpire: 0.8, whxHedge: 0.15 });
  Object.assign(SATMUL_OF, { whxWall3: 1.1, whxRoof2: 1.15, whxGrass5: 1.0, whxHedge2: 1.0, whxHedgeD2: 1.0, whxTreeA: 1.1, whxTreeB: 1.1, whxIvy: 1.1, whxIvyD: 1.1, whxFrond: 1.1, whxFrondD: 1.1, whxFlowerR: 1.2, whxFlowerY: 1.2 });
  const walls = new Batch(), big = new Batch(), thin = new Batch(), flat = new Batch();

  // ---------- builders ----------
  /** a rectangular window (white frame, olive cap + sill, leaded glass); nx,nz = outward normal; arch = round top */
  const win = (cx: number, y0: number, cz: number, nx: number, nz: number, w = 0.85, h = 1.6, arch = false) => {
    const tx = Math.abs(nz), tz = Math.abs(nx), o = 0.04;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass); g.position.copy(P(cx + nx * o, y0 + h / 2, cz + nz * o)); g.lookAt(P(cx + nx * 9, y0 + h / 2, cz + nz * 9)); R.add(g); WIN_GLASS.push(g);
    const bx = (u0: number, u1: number, v0: number, v1: number, d0: number, d1: number, m: THREE.Material, r = 0.02) => big.add(rb(
      Math.min(cx + tx * u0 + nx * d0, cx + tx * u1 + nx * d1), v0, Math.min(cz + tz * u0 + nz * d0, cz + tz * u1 + nz * d1),
      Math.max(cx + tx * u0 + nx * d0, cx + tx * u1 + nx * d1), v1, Math.max(cz + tz * u0 + nz * d0, cz + tz * u1 + nz * d1), r), m);
    bx(-w / 2 - 0.1, -w / 2, y0, y0 + h, 0, 0.1, M.white); bx(w / 2, w / 2 + 0.1, y0, y0 + h, 0, 0.1, M.white);
    bx(-w / 2 - 0.12, w / 2 + 0.12, y0 - 0.12, y0, 0, 0.16, M.white); bx(-w / 2, w / 2, y0 + h * 0.62 - 0.025, y0 + h * 0.62 + 0.025, 0, 0.06, M.white);
    bx(-0.02, 0.02, y0, y0 + h, 0, 0.06, M.white);
    if (arch) {
      const a = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 24, 0, Math.PI), M.glass); a.position.copy(P(cx + nx * o, y0 + h, cz + nz * o)); a.lookAt(P(cx + nx * 9, y0 + h, cz + nz * 9)); R.add(a); WIN_GLASS.push(a);
      const t = new THREE.TorusGeometry(w / 2 + 0.05, 0.06, 8, 24, Math.PI); const m = new THREE.Mesh(t); m.position.copy(P(cx + nx * 0.06, y0 + h, cz + nz * 0.06)); m.lookAt(P(cx + nx * 9, y0 + h, cz + nz * 9)); m.updateMatrix();
      big.add(t.clone().applyMatrix4(m.matrix), M.white);
      bx(-w / 2 - 0.16, w / 2 + 0.16, y0 + h + w / 2 + 0.04, y0 + h + w / 2 + 0.16, 0, 0.12, M.olive);
    } else { bx(-w / 2 - 0.16, w / 2 + 0.16, y0 + h, y0 + h + 0.16, 0, 0.14, M.olive); }
  };
  /** a stick-style wing: walls, belt courses, corner boards, a dark lower storey band, windows on the visible faces */
  const wing = (x0: number, x1: number, z0: number, z1: number, floors: number, o: { winFront?: number; winSide?: number; arch?: number[]; low?: boolean } = {}) => {
    const H = floors * FL;
    walls.add(wq(x0, z1, x1, z1, 0, H, 2.4, FL), M.wall); walls.add(wq(x1, z0, x0, z0, 0, H, 2.4, FL), M.wall);
    walls.add(wq(x0, z0, x0, z1, 0, H, 2.4, FL), M.wall); walls.add(wq(x1, z1, x1, z0, 0, H, 2.4, FL), M.wall);
    if (o.low !== false) big.add(rb(x0 - 0.05, 0, z0 - 0.05, x1 + 0.05, 0.9, z1 + 0.05, 0.03), M.wallLow);
    for (let f = 1; f <= floors; f++) big.add(rb(x0 - 0.1, f * FL - 0.18, z0 - 0.1, x1 + 0.1, f * FL, z1 + 0.1, 0.04), M.olive);
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) big.add(rb(x - 0.12, 0, z - 0.12, x + 0.12, H, z + 0.12, 0.04), M.olive);
    const nf = o.winFront ?? Math.max(1, Math.floor((x1 - x0) / 2.2)), ns = o.winSide ?? Math.max(1, Math.floor((z1 - z0) / 2.6));
    for (let f = 0; f < floors; f++) {
      for (let i = 0; i < nf; i++) win(x0 + ((i + 0.5) / nf) * (x1 - x0), f * FL + 0.95, z1, 0, 1, 0.85, 1.55, (o.arch ?? []).includes(f));
      for (let i = 0; i < ns; i++) { win(x0, f * FL + 0.95, z0 + ((i + 0.5) / ns) * (z1 - z0), -1, 0, 0.8, 1.5); win(x1, f * FL + 0.95, z0 + ((i + 0.5) / ns) * (z1 - z0), 1, 0, 0.8, 1.5); }
    }
  };
  /** steep gable roof; ridge along x ("side") or along z ("front" = gable end faces the camera) */
  const gable = (x0: number, x1: number, z0: number, z1: number, yb: number, h: number, ridge: "x" | "z", ov = 0.35) => {
    const ROOF_U = 1.6;
    if (ridge === "z") {
      const cx = (x0 + x1) / 2, a = x0 - ov, b = x1 + ov, za = z0 - ov, zb = z1 + ov, yt = yb + h;
      big.add(quad(P(a, yb - 0.15, zb), P(cx, yt, zb), P(cx, yt, za), P(a, yb - 0.15, za), (zb - za) / ROOF_U, (h + 1) / ROOF_U), M.roof);
      big.add(quad(P(b, yb - 0.15, za), P(cx, yt, za), P(cx, yt, zb), P(b, yb - 0.15, zb), (zb - za) / ROOF_U, (h + 1) / ROOF_U), M.roof);
      for (const [zz, s] of [[z1, 1], [z0, -1]] as [number, number][]) {
        const t = tri(P(x0, yb, zz + s * 0.01), P(x1, yb, zz + s * 0.01), P(cx, yt - 0.2, zz + s * 0.01)); if (s < 0) t.scale(1, 1, 1);
        big.add(t, M.fish);
        // barge boards + king-post stick truss (white / olive)
        const L = Math.hypot(cx - a, yt - yb + 0.15), ang = Math.atan2(yt - yb + 0.15, cx - a);
        for (const sx of [-1, 1]) { const g = new RoundedBoxGeometry(L + 0.1, 0.22, 0.12, 2, 0.03).rotateZ(sx * ang).translate(OX + cx - sx * (cx - a) / 2, (yb - 0.15 + yt) / 2, OZ + zz + s * (ov + 0.06)); big.add(g, M.white); }
        big.add(rb(cx - 0.07, yb + 0.2, zz + (s > 0 ? 0 : -0.1), cx + 0.07, yt - 0.35, zz + (s > 0 ? 0.1 : 0), 0.02), M.olive);
        big.add(rb(x0 + 0.5, yb + h * 0.38, zz + (s > 0 ? 0 : -0.1), x1 - 0.5, yb + h * 0.38 + 0.14, zz + (s > 0 ? 0.1 : 0), 0.02), M.olive);
      }
      big.add(rb(cx - 0.09, yt - 0.06, za, cx + 0.09, yt + 0.1, zb, 0.04), M.roofEdge);
      finial(cx, yt + 0.05, zb - 0.1, 1.0);
    } else {
      const cz = (z0 + z1) / 2, a = z0 - ov, b = z1 + ov, xa = x0 - ov, xb = x1 + ov, yt = yb + h;
      big.add(quad(P(xa, yb - 0.15, b), P(xb, yb - 0.15, b), P(xb, yt, cz), P(xa, yt, cz), (xb - xa) / ROOF_U, (h + 1) / ROOF_U), M.roof);
      big.add(quad(P(xb, yb - 0.15, a), P(xa, yb - 0.15, a), P(xa, yt, cz), P(xb, yt, cz), (xb - xa) / ROOF_U, (h + 1) / ROOF_U), M.roof);
      big.add(tri(P(x1, yb, z1), P(x1, yb, z0), P(x1, yt - 0.2, cz)), M.fish); big.add(tri(P(x0, yb, z0), P(x0, yb, z1), P(x0, yt - 0.2, cz)), M.fish);
      big.add(rb(xa, yt - 0.06, cz - 0.09, xb, yt + 0.1, cz + 0.09, 0.04), M.roofEdge);
    }
  };
  const finial = (x: number, y: number, z: number, h: number) => thin.add(lathe([[0, 0], [0.09, 0], [0.12, 0.08], [0.05, 0.2], [0.08, 0.3], [0.03, 0.45], [0.012, h], [0, h]], x, y, z, 1, 1, 12), M.spire);
  /** pyramid / hip cap over a block */
  const hip = (x0: number, x1: number, z0: number, z1: number, yb: number, h: number, ov = 0.35) => {
    const a = V(x0 - ov, yb - 0.15, z1 + ov), b = V(x1 + ov, yb - 0.15, z1 + ov), c = V(x1 + ov, yb - 0.15, z0 - ov), d = V(x0 - ov, yb - 0.15, z0 - ov), t = V((x0 + x1) / 2, yb + h, (z0 + z1) / 2);
    const Pp = (v: THREE.Vector3) => P(v.x, v.y, v.z);
    for (const [p, q] of [[a, b], [b, c], [c, d], [d, a]]) { const g = tri(Pp(p), Pp(q), Pp(t)); big.add(g, M.roof); }
    finial(t.x, t.y - 0.05, t.z, 1.1);
  };
  /** round tower with a witch-hat cone; ivy = cover the camera side in leafy clumps */
  const tower = (cx: number, cz: number, r: number, floors: number, cone: number, ivy = false) => {
    const H = floors * FL;
    walls.add(new THREE.CylinderGeometry(r, r, H, 28, 1, true).translate(OX + cx, H / 2, OZ + cz), M.wall);
    for (let f = 1; f <= floors; f++) big.add(new THREE.CylinderGeometry(r + 0.1, r + 0.1, 0.18, 28).translate(OX + cx, f * FL - 0.09, OZ + cz), M.olive);
    big.add(new THREE.CylinderGeometry(r + 0.06, r + 0.1, 0.9, 28).translate(OX + cx, 0.45, OZ + cz), M.wallLow);
    for (let f = 0; f < floors; f++) for (const a of [-0.9, 0, 0.9]) win(cx + Math.sin(a) * (r + 0.02), f * FL + 0.95, cz + Math.cos(a) * (r + 0.02), Math.sin(a), Math.cos(a), 0.7, 1.45, f === floors - 1);
    big.add(new THREE.ConeGeometry(r + 0.55, cone, 28, 1, true).translate(OX + cx, H + cone / 2 - 0.1, OZ + cz), M.roof);
    big.add(new THREE.CylinderGeometry(r + 0.55, r + 0.62, 0.12, 28).translate(OX + cx, H - 0.1, OZ + cz), M.roofEdge);
    finial(cx, H + cone - 0.2, cz, 1.4);
    if (ivy) { let k = 0; for (let y = 0.3; y < H + 0.2; y += 0.42) for (let a = -1.5; a <= 1.5; a += 0.32) { k++; const rr = 0.32 + 0.16 * ((k * 7) % 5) / 5, aa = a + 0.12 * ((k * 3) % 4);
      if (((k * 13) % 9) === 0 && y > H * 0.7) continue;
      big.add(new THREE.SphereGeometry(rr, 12, 9).translate(OX + cx + Math.sin(aa) * (r + 0.12), y + 0.1 * ((k * 5) % 3), OZ + cz + Math.cos(aa) * (r + 0.12)), k % 3 ? M.ivy : M.ivyD); } }
  };
  /** the round cupola with arched windows and an ogee-ish red cap (centre of the hero view) */
  const cupola = (cx: number, cz: number, yb: number, r: number) => {
    walls.add(new THREE.CylinderGeometry(r, r, 2.2, 24, 1, true).translate(OX + cx, yb + 1.1, OZ + cz), M.wall);
    for (let k = 0; k < 7; k++) { const a = -1.35 + (k / 6) * 2.7; win(cx + Math.sin(a) * (r + 0.02), yb + 0.35, cz + Math.cos(a) * (r + 0.02), Math.sin(a), Math.cos(a), 0.42, 1.0, true); }
    big.add(new THREE.CylinderGeometry(r + 0.12, r + 0.12, 0.2, 24).translate(OX + cx, yb + 2.25, OZ + cz), M.olive);
    big.add(lathe([[r + 0.45, 0], [r + 0.3, 0.35], [r * 0.75, 1.1], [r * 0.3, 2.0], [0.1, 2.6], [0, 2.7]], cx, yb + 2.3, cz, 1, 1, 24), M.roof);
    finial(cx, yb + 4.9, cz, 1.2);
  };
  /** open belvedere: ring of white posts, a railing, a cone cap (on the Door to Nowhere wing) */
  const belvedere = (cx: number, cz: number, yb: number, r: number) => {
    big.add(new THREE.CylinderGeometry(r + 0.15, r + 0.15, 0.25, 20).translate(OX + cx, yb + 0.12, OZ + cz), M.olive);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; thin.add(lathe([[0, 0], [0.08, 0], [0.06, 0.2], [0.05, 1.5], [0.08, 1.7], [0, 1.72]], cx + Math.cos(a) * r, yb + 0.25, cz + Math.sin(a) * r, 1, 1, 10), M.white); }
    big.add(new THREE.TorusGeometry(r, 0.05, 8, 32).rotateX(Math.PI / 2).translate(OX + cx, yb + 1.0, OZ + cz), M.white);
    big.add(new THREE.ConeGeometry(r + 0.45, 2.4, 20, 1, true).translate(OX + cx, yb + 1.97 + 1.2, OZ + cz), M.roof);
    finial(cx, yb + 4.2, cz, 1.0);
  };
  /** the hanging fish-scale turret (oriel) with a pendant drop, next to the Door to Nowhere */
  const oriel = (cx: number, cz: number, yb: number, r: number) => {
    big.add(lathe([[0.02, -1.6], [0.12, -1.45], [r * 0.5, -1.0], [r * 0.9, -0.4], [r, 0], [0, 0]].map(([a, b]) => [a, b]), cx, yb, cz, 1, 1, 20), M.fish);
    thin.add(lathe([[0, 0], [0.08, 0.05], [0.04, 0.2], [0, 0.3]], cx, yb - 1.9, cz, 1, 1, 12), M.spire);
    walls.add(new THREE.CylinderGeometry(r, r, FL, 20, 1, true).translate(OX + cx, yb + FL / 2, OZ + cz), M.wall);
    for (const a of [-0.7, 0.7]) win(cx + Math.sin(a) * (r + 0.02), yb + 1.0, cz + Math.cos(a) * (r + 0.02), Math.sin(a), Math.cos(a), 0.4, 1.3, true);
    big.add(new THREE.CylinderGeometry(r + 0.1, r + 0.1, 0.16, 20).translate(OX + cx, yb + FL, OZ + cz), M.olive);
  };
  /** veranda: deck, olive posts, white railing, low red roof */
  const porch = (x0: number, x1: number, z0: number, z1: number) => {
    big.add(rb(x0, 0, z0, x1, 0.55, z1, 0.03), M.wallLow);
    for (let x = x0 + 0.2; x <= x1 - 0.1; x += 1.8) thin.add(lathe([[0, 0], [0.16, 0], [0.12, 0.2], [0.1, 2.5], [0.14, 2.7], [0, 2.7]], x, 0.55, z1 - 0.2, 1, 1, 12), M.olive);
    big.add(rb(x0, 1.35, z1 - 0.26, x1, 1.45, z1 - 0.14, 0.02), M.white);
    for (let x = x0 + 0.2; x < x1; x += 0.24) thin.add(rb(x - 0.025, 0.55, z1 - 0.22, x + 0.025, 1.35, z1 - 0.18, 0.01), M.white);
    big.add(quad(P(x0 - 0.3, 3.15, z1 + 0.4), P(x1 + 0.3, 3.15, z1 + 0.4), P(x1 + 0.3, 3.9, z0), P(x0 - 0.3, 3.9, z0), (x1 - x0) / 1.6, 3), M.roof);
    big.add(rb(x0 - 0.3, 3.0, z1 + 0.25, x1 + 0.3, 3.2, z1 + 0.45, 0.03), M.white);
  };
  const chimney = (x: number, z: number, y: number, h: number) => { big.add(rb(x - 0.4, y, z - 0.4, x + 0.4, y + h, z + 0.4, 0.04), M.brick); big.add(rb(x - 0.5, y + h, z - 0.5, x + 0.5, y + h + 0.18, z + 0.5, 0.04), M.olive); };

  // ---------- MASS (hero view: front faces +z) ----------
  // far-left wing behind trees, the left wing with the ivy tower, the narrow centre tower, the cupola, the big gabled
  // centre-right block with a veranda, the Door-to-Nowhere wing on the right with the hanging turret and belvedere,
  // taller back wings rising behind (the house keeps going: 160 rooms)
  wing(-24, -14, -12, -1, 3, { winFront: 4 }); gable(-24, -14, -12, -1, 3 * FL, 4.5, "x");
  wing(-14, -4, -9, 0, 3, { winFront: 3, arch: [2] }); hip(-14, -4, -9, 0, 3 * FL, 3.6); gable(-11, -6.5, -2, 0, 3 * FL - 0.3, 3.4, "z");
  tower(-10.5, 1.4, 2.4, 3, 6.2, true);
  wing(-4, 0.5, -6, 1.2, 4, { winFront: 2 }); gable(-4, 0.5, -6, 1.2, 4 * FL, 4.2, "z");
  wing(0.5, 14, -10, 0.8, 3, { winFront: 5, arch: [1] });
  gable(7, 11, -4, 0.8, 3 * FL, 4.0, "z"); gable(11, 14, -4, 0.8, 3 * FL, 3.6, "z"); hip(0.5, 7, -10, 0.8, 3 * FL, 3.2);
  cupola(4.0, 0.2, 2 * FL + 0.2, 1.35);
  porch(1.5, 14.5, 0.8, 3.6);
  wing(14, 23, -8, -0.5, 2, { winFront: 3 }); gable(14, 23, -8, -0.5, 2 * FL, 3.8, "x");
  oriel(16.2, 0.1, FL + 0.2, 0.9); belvedere(19.5, -3, 2 * FL + 1.6, 1.0);
  { const dx = 17.6, dz = -0.5 + 0.06; big.add(rb(dx - 0.6, FL + 0.1, dz - 0.02, dx + 0.6, FL + 2.5, dz + 0.1, 0.03), M.white);
    big.add(rb(dx - 0.5, FL + 0.12, dz + 0.1, dx + 0.5, FL + 2.42, dz + 0.116, 0.004), lam("whxDark", () => ({ color: "#2a2a22" })));
    const g = new THREE.Group(), b = new Batch(); b.add(new RoundedBoxGeometry(0.96, 2.22, 0.06, 2, 0.02).translate(0.48, 1.11, 0.03), M.wallLow);
    for (const [y0, y1] of [[0.25, 1.0], [1.2, 2.0]]) b.add(new RoundedBoxGeometry(0.66, y1 - y0, 0.03, 2, 0.012).translate(0.48, (y0 + y1) / 2, 0.07), M.olive);
    b.add(new THREE.SphereGeometry(0.045, 12, 10).translate(0.84, 1.1, 0.1), lam("whxKnob", () => ({ color: "#f2c24f" })));
    b.build(g, true); g.position.copy(P(dx - 0.48, FL + 0.18, dz + 0.122)); DOORNW = g; R.add(g); } // the Door to Nowhere (swings out over the drop)
  { const g = new THREE.Group(), b = new Batch(); b.add(lathe([[0, 0], [0.42, 0], [0.4, 0.06], [0.3, 0.3], [0.22, 0.62], [0.12, 0.7], [0, 0.72]], 0, -0.72, 0, 1, 1, 24).translate(-OX, 0, -OZ), lam("whxBell", () => ({ color: "#e9b43c" })));
    b.add(new THREE.SphereGeometry(0.08, 12, 10).translate(0, -0.72, 0), M.olive);
    b.build(g, true); g.position.copy(P(19.5, 2 * FL + 1.6 + 1.75, -3)); BELL = g; R.add(g); }
  wing(-8, 12, -22, -10, 4, { winFront: 7 }); gable(-8, 2, -22, -10, 4 * FL, 4.5, "x"); gable(2, 12, -22, -10, 4 * FL, 5.0, "x");
  tower(9, -11, 1.9, 4, 5.0); tower(-2, -12, 1.6, 5, 4.6);
  for (const [x, z, y, h] of [[-9, -5, 3 * FL + 1.5, 3.2], [5, -6, 3 * FL + 1.2, 3.0], [12, -15, 4 * FL + 1.8, 3.4], [-20, -7, 3 * FL + 2, 3.0]]) chimney(x, z, y, h);

  // ---------- GARDENS ----------
  const lawnM = lam("whxLawn3", () => ({ map: lawnTex() })), gravelM = lam("whxGravel2", () => ({ map: gravelTex() }));
  const iron = lam("whxIron", () => ({ color: "#34363d" })), pot = lam("whxPot", () => ({ color: "#cf7f4f" })), flW = lam("whxFlowerW", () => ({ color: "#fff4e2" }));
  GLOBE_DAY = lam("whxGlobe", () => ({ color: "#fff3d6" }));
  Object.assign(GLOSS_OF, { whxIron: 0.6, whxPot: 0.25, whxGlobe: 0.9 });
  Object.assign(SATMUL_OF, { whxLawn3: 0.92, whxPot: 1.05 });
  flat.add(quad(P(-180, 0, 180), P(180, 0, 180), P(180, 0, -180), P(-180, 0, -180), 24, 24), lawnM);
  flat.add(quad(P(-2.4, 0.01, 47), P(2.4, 0.01, 47), P(2.4, 0.01, 3.6), P(-2.4, 0.01, 3.6), 1, 9), gravelM);
  flat.add(quad(P(-26, 0.012, 7.2), P(28, 0.012, 7.2), P(28, 0.012, 5.2), P(-26, 0.012, 5.2), 12, 1), gravelM);
  // cream stone curbs along every path edge
  for (const s of [-1, 1]) for (const [z0, z1] of [[3.6, 5.2], [7.2, 47]]) big.add(rb(s * 2.4 - 0.08, 0, z0, s * 2.4 + 0.08, 0.09, z1, 0.03), M.stone);
  for (const [x0, x1] of [[-26, -2.48], [2.48, 28]]) for (const z of [5.2, 7.2]) big.add(rb(x0, 0, z - 0.08, x1, 0.09, z + 0.08, 0.03), M.stone);
  // the front gate: stone pillars with ball finials, a boundary hedge both ways (the opening shot flies through it)
  for (const s of [-1, 1]) {
    const gx = s * 3.0, gz = 44;
    big.add(rb(gx - 0.36, 0, gz - 0.36, gx + 0.36, 1.95, gz + 0.36, 0.05), M.stone);
    big.add(rb(gx - 0.44, 1.95, gz - 0.44, gx + 0.44, 2.1, gz + 0.44, 0.04), M.white);
    big.add(lathe([[0, 0], [0.16, 0], [0.1, 0.08], [0.1, 0.14], [0.22, 0.26], [0.26, 0.42], [0.2, 0.58], [0, 0.64]], gx, 2.1, gz, 1, 1, 24), M.stone);
    big.add(rb(s > 0 ? 3.36 : -34, 0, gz - 0.42, s > 0 ? 34 : -3.36, 1.0, gz + 0.42, 0.14, 3), M.hedgeD);
  }
  // topiary cones in terracotta pots and black lamp posts lining the main path
  const topiary = (x: number, z: number) => {
    big.add(lathe([[0, 0], [0.3, 0], [0.36, 0.1], [0.4, 0.52], [0.45, 0.58], [0.45, 0.64], [0, 0.64]], x, 0, z, 1, 1, 28), pot);
    big.add(lathe([[0, 0], [0.48, 0.1], [0.6, 0.45], [0.5, 1.05], [0.28, 1.55], [0.08, 1.85], [0, 1.9]], x, 0.6, z, 1, 1, 28), M.hedge);
  };
  const lamp = (x: number, z: number) => {
    big.add(lathe([[0, 0], [0.2, 0], [0.2, 0.08], [0.12, 0.16], [0.08, 0.5], [0, 0.5]], x, 0, z, 1, 1, 20), iron);
    big.add(new THREE.CylinderGeometry(0.05, 0.06, 2.45, 14).translate(OX + x, 1.7, OZ + z), iron);
    big.add(lathe([[0, 0], [0.1, 0], [0.14, 0.05], [0.06, 0.1], [0, 0.1]], x, 2.88, z, 1, 1, 20), iron);
    big.add(lathe([[0, 0], [0.2, 0], [0.12, 0.12], [0.03, 0.2], [0.05, 0.25], [0, 0.29]], x, 3.32, z, 1, 1, 20), iron);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18).scale(1, 1.1, 1), GLOBE_DAY as THREE.Material); gl.position.copy(P(x, 3.17, z)); gl.castShadow = true; R.add(gl); LAMPS.push(gl);
  };
  for (const s of [-1, 1]) { for (const z of [18.5, 24.5, 30.5, 36.5]) topiary(s * 3.3, z); for (const z of [21.5, 27.5, 33.5, 39.5]) lamp(s * 3.1, z); }
  for (const [x0, x1, z0, z1] of [[-26, -3.2, 7.6, 8.6], [3.2, 28, 7.6, 8.6], [-26, -3.2, 4.0, 4.8], [3.2, 28, 4.0, 4.8], [-20, -3.2, 13, 13.9], [3.2, 9, 13, 13.9], [16, 26, 13, 13.9]]) big.add(rb(x0, 0, z0, x1, 0.8, z1, 0.12, 3), (x0 + z0) % 2 ? M.hedge : M.hedgeD);
  // fountain (front right, the hero foreground): basin, water, pedestal, a figure
  { const fx = 15.5, fz = 19;
    big.add(lathe([[0, 0], [3.4, 0], [3.5, 0.15], [3.5, 0.6], [3.25, 0.7], [3.1, 0.55], [0, 0.55]], fx, 0, fz, 1, 1, 48), M.stone);
    big.add(new THREE.CylinderGeometry(3.12, 3.12, 0.02, 48).translate(OX + fx, 0.5, OZ + fz), M.water);
    big.add(lathe([[0, 0], [0.5, 0], [0.35, 0.3], [0.25, 1.2], [0.7, 1.35], [0.9, 1.5], [0, 1.55]], fx, 0.5, fz, 1, 1, 28), M.stone);
    big.add(lathe([[0, 0], [0.3, 0], [0.32, 0.5], [0.22, 0.8], [0, 0.95]], fx, 2.05, fz, 1, 1, 18), M.stone);
    big.add(new THREE.SphereGeometry(0.2, 16, 12).translate(OX + fx, 3.15, OZ + fz), M.stone);
    for (const s of [-1, 1]) big.add(new THREE.SphereGeometry(0.14, 12, 9).scale(1.6, 0.6, 0.8).rotateZ(s * 0.5).translate(OX + fx + s * 0.32, 2.85, OZ + fz), M.stone);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; { const j = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(P(fx, 3.3, fz), P(fx + Math.cos(a) * 0.75, 3.85, fz + Math.sin(a) * 0.75), P(fx + Math.cos(a) * 1.45, 1.95, fz + Math.sin(a) * 1.45)), 16, 0.03, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 0.95, 1.0), transparent: true, opacity: 0.85 })); j.layers.set(NOINK); R.add(j); } }
  }
  // palms (one tall in front of the left wing, a pair at the right) and big round trees
  const palmTree = (x: number, z: number, h: number, seed: number) => {
    big.add(new THREE.CylinderGeometry(0.28, 0.42, h, 14).translate(OX + x, h / 2, OZ + z), M.trunk);
    for (let k = 0; k < 14; k++) { const a = k * 2.399 + seed, len = 3.2 + 0.6 * ((k * 5) % 3) / 2;
      const c = new THREE.QuadraticBezierCurve3(P(x, h, z), P(x + Math.cos(a) * len * 0.45, h + 1.4, z + Math.sin(a) * len * 0.45), P(x + Math.cos(a) * len, h - 0.6 - 0.8 * (k % 3), z + Math.sin(a) * len));
      for (let j = 1; j < 12; j++) { const t = j / 12, p = c.getPoint(t), tg = c.getTangent(t), side = V(-Math.sin(a), 0, Math.cos(a));
        for (const s of [-1, 1]) { const lf = new THREE.SphereGeometry(0.1, 8, 6).scale(0.9, 0.14, 7 * (1 - 0.5 * t)); const dir = side.clone().multiplyScalar(s).addScaledVector(tg, 0.4).add(V(0, -0.5, 0)).normalize();
          lf.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir)); lf.translate(p.x + dir.x * 0.35, p.y + dir.y * 0.35, p.z + dir.z * 0.35); big.add(lf, (j + k) % 2 ? M.frond : M.frondD); } } }
  };
  palmTree(-6.5, 12.5, 13, 0.3); palmTree(26, 6, 12, 1.1); palmTree(29, 10, 10, 2.2);
  const roundTree = (x: number, z: number, h: number, r: number, seed: number) => {
    big.add(new THREE.CylinderGeometry(r * 0.12, r * 0.18, h * 0.6, 10).translate(OX + x, h * 0.3, OZ + z), M.bark);
    for (let k = 0; k < 7; k++) { const a = k * 2.399 + seed, rr = r * (0.55 + 0.2 * ((k * 3) % 4) / 3), d = k ? r * 0.55 : 0;
      big.add(new THREE.SphereGeometry(rr, 18, 14).translate(OX + x + Math.cos(a) * d, h * 0.62 + r * 0.45 + (k % 3) * r * 0.18, OZ + z + Math.sin(a) * d), k % 2 ? M.treeA : M.treeB); }
  };
  roundTree(-19, 9, 9, 3.2, 0.2); roundTree(31, -2, 12, 4.4, 1.3); roundTree(-30, -4, 11, 4.0, 2.1); roundTree(-27, 16, 7, 2.6, 0.7);
  { const fl = new Batch();
    for (let k = 0; k < 64; k++) {
      const row = k % 2, x = -18.5 + Math.floor(k / 2) * 1.45 + row * 0.72, z = 9.7 + row * 1.55 + ((k * 7) % 3) * 0.12;
      if (Math.abs(x) < 3.2) continue;
      const bl = k % 3 === 0 ? M.flowerR : k % 3 === 1 ? M.flowerY : flW;
      for (let q = 0; q < 3; q++) { const a = q * 2.1 + k, rr = 0.34 + 0.06 * ((k + q) % 3);
        big.add(new THREE.SphereGeometry(rr, 16, 12).scale(1, 0.85, 1).translate(OX + x + Math.cos(a) * 0.26, rr * 0.8, OZ + z + Math.sin(a) * 0.2), q % 2 ? M.hedge : M.hedgeD); }
      for (let q = 0; q < 9; q++) { const a = q * 2.399 + k * 0.7, rad = 0.12 + 0.24 * (((q * 5) % 4) / 3);
        fl.add(new THREE.SphereGeometry(0.075, 10, 8).translate(OX + x + Math.cos(a) * rad, 0.7 - rad * 0.32, OZ + z + Math.sin(a) * rad * 0.8), bl); }
    }
    const fg = new THREE.Group(); fl.build(fg, false); fg.traverse((o) => o.layers.set(NOINK)); R.add(fg); FLOWERS = fg; }
  for (const [x, z, h, r, sd] of [[-36, 8, 10, 3.8, 0.4], [-35, -16, 13, 4.6, 1.9], [-16, -30, 14, 5.2, 2.7], [6, -33, 15, 5.6, 0.9], [24, -27, 13, 4.8, 3.3],
    [39, -11, 11, 4.3, 1.4], [41, 15, 9, 3.4, 2.2], [-41, 26, 8, 3.1, 0.1], [35, 28, 7.5, 2.9, 1.0], [-48, -4, 12, 4.6, 2.9], [50, 2, 12, 4.8, 0.6]]) roundTree(x, z, h, r, sd);
  const cypress = (x: number, z: number, h: number, r: number) => big.add(lathe([[0, 0], [r * 0.7, h * 0.04], [r, h * 0.25], [r * 0.85, h * 0.6], [r * 0.45, h * 0.88], [0, h]], x, 0, z, 1, 1, 22), M.treeB);
  for (const [x, z, h] of [[-27.2, 2.6, 9], [-28.8, 5.2, 7.5], [30.6, 2.2, 9.5], [32.2, 4.8, 8]]) cypress(x, z, h, 1.1);
  // distant California foothills all round (soft, no ink; the fog fades them into the sky)
  { const pos: number[] = [], NS = 180, ht = (a: number) => 11 + 7 * Math.sin(a * 3 + 0.6) + 5 * Math.sin(a * 7 + 2.1) + 2.5 * Math.sin(a * 13 + 0.3);
    const p = (a: number, r: number, y: number) => [OX + Math.cos(a) * r, y, OZ + Math.sin(a) * r];
    for (let i = 0; i < NS; i++) { const a0 = (i / NS) * Math.PI * 2, a1 = ((i + 1) / NS) * Math.PI * 2, A = p(a0, 150, -1), B = p(a1, 150, -1), C = p(a1, 172, ht(a1)), D = p(a0, 172, ht(a0));
      pos.push(...A, ...C, ...B, ...A, ...D, ...C); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    const hills = new THREE.Mesh(geo, lam("whxHills", () => ({ color: "#86b06c", side: DS }))); hills.layers.set(NOINK); R.add(hills); }
  // daytime clouds (unlit billboards far behind the house)
  for (const [x, y, z, s] of [[-40, 46, -110, 34], [25, 58, -120, 42], [70, 40, -100, 28], [-80, 60, -130, 40], [-10, 34, -90, 30], [40, 30, -80, 24]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), new THREE.MeshBasicMaterial({ map: cloudTex(), transparent: true, depthWrite: false, fog: false })); m.position.copy(P(x, y, z)); m.layers.set(NOINK); m.name = "whCloud"; R.add(m); CLOUDS.push(m);
  }
  GLASS_DAY = M.glass;
  // ---------- scaffolding on the centre-right block (shown while building): poles, planks, braces, ladders ----------
  { const sc = new Batch(), wood = lam("whxScaff", () => ({ color: "#c98a4a" })), plank = lam("whxPlank", () => ({ color: "#e0a868" }));
    const z = 1.6;
    for (let x = 1; x <= 14.5; x += 2.25) for (const dz of [0, 1.1]) sc.add(new THREE.CylinderGeometry(0.07, 0.07, 10.4, 8).translate(OX + x, 5.2, OZ + z + dz), wood);
    for (const y of [3.3, 6.5, 9.7]) { sc.add(rb(0.8, y - 0.07, z - 0.15, 14.7, y, z + 1.25, 0.02), plank); sc.add(rb(0.8, y + 0.9, z + 1.05, 14.7, y + 0.98, z + 1.15, 0.02), wood); }
    for (let x = 1; x < 14; x += 2.25) { const a = P(x, 0.2, z + 1.1), b = P(x + 2.25, 3.2, z + 1.1), d = b.clone().sub(a), g = new THREE.CylinderGeometry(0.05, 0.05, d.length(), 6);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); sc.add(g, wood); }
    for (const lx of [4.4, 11.1]) { for (const s2 of [-0.22, 0.22]) sc.add(rb(lx + s2 - 0.04, 0, z + 1.35, lx + s2 + 0.04, 3.4, z + 1.43, 0.015), wood); for (let y = 0.3; y < 3.3; y += 0.32) sc.add(rb(lx - 0.22, y, z + 1.36, lx + 0.22, y + 0.04, z + 1.42, 0.01), wood); }
    SCAFF = new THREE.Group(); sc.build(SCAFF, true); R.add(SCAFF); SCAFF.visible = false; }
  // ---------- the tall 7-storey tower on the back block (before 1906); its pivot is its base so it can topple ----------
  { const tb = new Batch(), bx0 = 4, bz0 = -14, r = 2.1, h = 7 * FL;
    tb.add(new THREE.CylinderGeometry(r, r, h - 3 * FL, 24, 1, true).translate(0, 3 * FL + (h - 3 * FL) / 2, 0), M.wall);
    for (let f = 4; f <= 7; f++) tb.add(new THREE.CylinderGeometry(r + 0.1, r + 0.1, 0.18, 24).translate(0, f * FL - 0.09, 0), M.olive);
    tb.add(new THREE.ConeGeometry(r + 0.6, 6, 24, 1, true).translate(0, h + 2.9, 0), M.roof);
    TALL = new THREE.Group(); tb.build(TALL, true); const piv = new THREE.Group(); piv.position.copy(P(bx0, 0, bz0)); piv.add(TALL); R.add(piv); TALL.visible = false; }
  walls.build(R, true); big.build(R, true); thin.build(R, false); flat.build(R, false);
};
