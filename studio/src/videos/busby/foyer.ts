// WINCHESTER: the GRAND FOYER of the Victorian mystery mansion (look test). User: "this house is an amazing Victorian
// mystery mansion, not just a house. It's huge, put more detail." Double-height hall (7 m) with a gallery on three sides,
// a central grand staircase with brass lamp posts, the odd little staircase that runs into the gallery's underside (the
// hook), tall stained-glass windows (the only way the sun gets in), Sarah's round spiderweb window, a two-tier chandelier,
// a fireplace corner with velvet armchairs, an inlaid parquet floor with a compass star, palms, a bust, many doors.
// Everything soft-edged (rounded boxes, lathe profiles) like his props.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam, quad } from "../bridge/build";
import { planksHD } from "../bridge/paint";
import { GLOSS_OF } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { halo } from "./fx3d";
import { wallpaperTex, portraitTex, clockFaceTex, parquetTex, starMedallionTex, stainedGlassTex, spiderWebTex, persianRugTex, velvetTex } from "./textures";

export const FOYER = { HX: -600, H1: 3.4, H: 7.0 };

export const buildFoyer = (R: THREE.Object3D) => {
  const { HX, H1, H } = FOYER, DS = THREE.DoubleSide;
  const X0 = -4.5, X1 = 4.5, ZF = -10, ZN = 3.5, GW = 1.6; // gallery depth (sides) / back gallery z -10..-7.6
  const GZ = ZF + 2.4, GS = 3.25; // back-gallery front edge, gallery slab underside
  const rb = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r = 0.015, seg = 2) => {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, rr = Math.max(0.001, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
    return new RoundedBoxGeometry(w, h, d, seg, rr).translate(HX + (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  };
  const lathe = (prof: number[][], x: number, y: number, z: number, sy = 1, sr = 1, seg = 28) =>
    new THREE.LatheGeometry(prof.map(([r, yy]) => new THREE.Vector2(r * sr, yy * sy)), seg).translate(HX + x, y, z);
  const wallQ = (xa: number, za: number, xb: number, zb: number, y0: number, y1: number, tile: number) => {
    const L = Math.hypot(xb - xa, zb - za);
    return quad(V(HX + xa, y0, za), V(HX + xb, y0, zb), V(HX + xb, y1, zb), V(HX + xa, y1, za), L / tile, (y1 - y0) / tile, 0, y0 / tile);
  };
  const floorQ = (x0: number, x1: number, z0: number, z1: number, tile: number, y = 0) =>
    quad(V(HX + x0, y, z1), V(HX + x1, y, z1), V(HX + x1, y, z0), V(HX + x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
  const along = (p0: THREE.Vector3, p1: THREE.Vector3, r: number, seg = 10) => { // capsule from p0 to p1
    const d = p1.clone().sub(p0), L = d.length(), g = new THREE.CapsuleGeometry(r, Math.max(0.001, L), 4, seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())); return g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
  };
  const L = (x: number, y: number, z: number) => V(HX + x, y, z);
  const M = {
    paper: lam("whWallpaper5", () => ({ map: wallpaperTex() })),
    wains: lam("fyWains2", () => ({ color: "#d4843f" })), wainsD: lam("fyWainsD2", () => ({ color: "#b8682c" })),
    trim: lam("fyTrim2", () => ({ color: "#fff6e2" })), gold: lam("fyGold", () => ({ color: "#f2c44e" })),
    wood: lam("fyWood2", () => ({ color: "#c8742f" })), woodL: lam("fyWoodL2", () => ({ color: "#e09650" })), woodD: lam("fyWoodD2", () => ({ color: "#9c5222" })),
    ceil: lam("fyCeil2", () => ({ color: "#fff4df", side: DS })), beam: lam("fyBeam2", () => ({ color: "#f3e2c0" })),
    parquet: lam("fyParquet", () => ({ map: parquetTex() })), floorB: lam("fyFloorB2", () => ({ map: planksHD(true), color: "#f0b47a" })),
    carpet: lam("fyCarpet2", () => ({ color: "#d23a34" })), brass: lam("fyBrass", () => ({ color: "#f2c24f" })),
    door: lam("fyDoor2", () => ({ color: "#b95a26" })), doorP: lam("fyDoorP2", () => ({ color: "#9a4a1e" })),
    marble: lam("fyMarble", () => ({ color: "#f2ece0" })), dark: lam("fyDark", () => ({ color: "#1e1410" })),
    velvet: lam("fyVelvet", () => ({ map: velvetTex() })), rug: lam("fyRug", () => ({ map: persianRugTex() })),
    pot: lam("fyPot", () => ({ color: "#2f7fd6" })), leaf: lam("fyLeaf", () => ({ color: "#4cc35a", side: DS })), leafD: lam("fyLeafD", () => ({ color: "#33a046", side: DS })),
    mirror: lam("fyMirror", () => ({ color: "#cfeef7" })), candle: lam("fyCandle", () => ({ color: "#fff8ea" })), globe: lam("fyGlobe", () => ({ color: "#fff6dc" })),
  };
  Object.assign(GLOSS_OF, { fyGold: 0.9, fyBrass: 1, fyWood2: 0.65, fyWoodL2: 0.65, fyWoodD2: 0.6, fyWains2: 0.45, fyWainsD2: 0.45, fyBeam2: 0.2, fyParquet: 0.45, fyFloorB2: 0.45, fyCarpet2: 0.12,
    fyDoor2: 0.6, fyDoorP2: 0.6, fyTrim2: 0.3, fyMarble: 0.7, fyPot: 0.9, fyLeaf: 0.35, fyLeafD: 0.3, fyMirror: 1, fyGlobe: 0.7, fyTrim: 0.25 });
  const flat = new Batch(), wallsC = new Batch(), big = new Batch(), thin = new Batch();

  // ===== floor: parquet + a compass-star medallion (decal) =====
  flat.add(floorQ(X0, X1, ZF, ZN, 1.6, 0.002), M.floorB);
  // inlaid border band (dark walnut with a gold line) 0.45 m in from the walls, and a ring round the medallion
  { const ib = lam("fyInlay2", () => ({ color: "#a8582a" })), il = lam("fyInlayL", () => ({ color: "#e9c27a" })), o = 0.45, w = 0.22;
    for (const [a, b, c, d] of [[X0 + o, X1 - o, ZN - o - w, ZN - o], [X0 + o, X1 - o, ZF + o, ZF + o + w], [X0 + o, X0 + o + w, ZF + o, ZN - o], [X1 - o - w, X1 - o, ZF + o, ZN - o]] as number[][]) flat.add(floorQ(a, b, c, d, 1, 0.004), ib);
    for (const [a, b, c, d] of [[X0 + o + w, X1 - o - w, ZN - o - w - 0.04, ZN - o - w], [X0 + o + w, X1 - o - w, ZF + o + w, ZF + o + w + 0.04], [X0 + o + w, X0 + o + w + 0.04, ZF + o + w, ZN - o - w], [X1 - o - w - 0.04, X1 - o - w, ZF + o + w, ZN - o - w]] as number[][]) flat.add(floorQ(a, b, c, d, 1, 0.005), il); }
  { const m = new THREE.Mesh(new THREE.CircleGeometry(1.35, 64).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: starMedallionTex(), transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(HX, 0.006, 0.6); R.add(m); }
  // ===== walls: tall wainscot (to 1.4 m) under teal damask; the LEFT wall + ceiling cast (sun only through the glass) =====
  const WIN = [[-0.2, -1.6], [-4.6, -6.0]]; // left-wall windows (z ranges), y 0.6..3.0
  const wall = (b: Batch, xa: number, za: number, xb: number, zb: number, y0 = 0, y1 = H) => {
    if (y0 < 1.4) b.add(wallQ(xa, za, xb, zb, y0, Math.min(1.4, y1), 1.2), M.wains);
    if (y1 > 1.4) b.add(wallQ(xa, za, xb, zb, Math.max(1.4, y0), y1, 1.6), M.paper);
  };
  { let z = ZN; for (const [za, zb] of WIN) { wall(wallsC, X0, z, X0, za); wall(wallsC, X0, za, X0, zb, 0, 0.6); wall(wallsC, X0, za, X0, zb, 3.0, H); z = zb; } wall(wallsC, X0, z, X0, ZF); }
  wallsC.add(quad(V(HX + X0, H, ZN), V(HX + X1, H, ZN), V(HX + X1, H, ZF), V(HX + X0, H, ZF)), M.ceil);
  wall(flat, X0, ZF, X1, ZF); wall(flat, X1, ZF, X1, ZN); wall(flat, X1, ZN, X0, ZN);
  // mouldings on every wall run (ground floor + gallery floor)
  const runs: [number, number, number, number][] = [[X0, ZF, X0, ZN], [X0, ZF, X1, ZF], [X1, ZF, X1, ZN]];
  const ring = (y0: number, y1: number, d: number, m: THREE.Material, r = 0.015) => {
    big.add(rb(X0, y0, ZF, X0 + d, y1, ZN, r), m); big.add(rb(X0, y0, ZF, X1, y1, ZF + d, r), m); big.add(rb(X1 - d, y0, ZF, X1, y1, ZN, r), m);
  };
  ring(1.36, 1.46, 0.06, M.woodD, 0.02); ring(1.42, 1.48, 0.09, M.gold, 0.012); ring(0, 0.2, 0.05, M.woodD); ring(H - 0.24, H, 0.12, M.trim, 0.02); ring(H - 0.32, H - 0.22, 0.07, M.gold, 0.02);
  ring(H1 + 0.15, H1 + 0.32, 0.04, M.woodD); ring(H1 + 1.2, H1 + 1.28, 0.05, M.woodD);
  void runs;
  // raised panels in the wainscot (left / right / back), skipping the windows and doors
  const panelsX = (x: number, nx: number, zs: number[][]) => { for (const [za, zb] of zs) for (let z = zb - 0.12; z - 0.62 > za; z -= 0.8) {
    big.add(rb(x - (nx < 0 ? 0.03 : 0), 0.3, z - 0.62, x + (nx > 0 ? 0.03 : 0), 1.22, z, 0.012), M.wainsD);
    big.add(rb(x - (nx < 0 ? 0.05 : 0), 0.37, z - 0.56, x + (nx > 0 ? 0.05 : 0), 1.15, z - 0.06, 0.025), M.wains); } };
  panelsX(X0, 1, [[0.1, ZN - 0.1], [-4.4, -1.8], [ZF + 0.1, -6.2]]); panelsX(X1, -1, [[-4.4, -2.9], [ZF + 1.6, -6.9]]);
  // ===== gallery (three sides) on soft columns, with a turned balustrade =====
  big.add(rb(X0, GS, ZF, X0 + GW + 0.02, H1, ZN, 0.03), M.wood); big.add(rb(X1 - GW - 0.02, GS, ZF, X1, H1, ZN, 0.03), M.wood); big.add(rb(X0, GS, ZF, X1, H1, GZ, 0.03), M.wood);
  flat.add(floorQ(X0, X0 + GW, ZF, ZN, 1.6, H1 + 0.002), M.floorB); flat.add(floorQ(X1 - GW, X1, ZF, ZN, 1.6, H1 + 0.002), M.floorB); flat.add(floorQ(X0 + GW, X1 - GW, ZF, GZ, 1.6, H1 + 0.002), M.floorB);
  big.add(rb(X0 + GW - 0.04, GS - 0.12, ZF, X0 + GW + 0.06, GS + 0.02, ZN, 0.02), M.gold); big.add(rb(X1 - GW - 0.06, GS - 0.12, ZF, X1 - GW + 0.04, GS + 0.02, ZN, 0.02), M.gold);
  big.add(rb(X0 + GW, GS - 0.12, GZ - 0.04, X1 - GW, GS + 0.02, GZ + 0.06, 0.02), M.gold);
  const colProf = [[0, 0], [0.24, 0], [0.24, 0.1], [0.2, 0.14], [0.17, 0.2], [0.15, 0.4], [0.14, 2.6], [0.17, 2.68], [0.23, 2.8], [0.27, 2.9], [0.27, 3.0], [0, 3.0]];
  for (const [cx, cz] of [[X0 + GW, GZ], [X1 - GW, GZ], [X0 + GW, -5.3], [X1 - GW, -5.3], [X0 + GW, -2.95], [X1 - GW, -2.95], [X0 + GW, ZN - 0.3], [X1 - GW, ZN - 0.3]]) {
    big.add(lathe(colProf, cx, 0, cz, GS / 3.0, 1, 24), M.woodL); big.add(new THREE.TorusGeometry(0.155, 0.025, 8, 24).rotateX(Math.PI / 2).translate(HX + cx, GS * 0.86, cz), M.gold);
  }
  const balProf = [[0, 0], [0.037, 0], [0.037, 0.08], [0.028, 0.12], [0.026, 0.78], [0.033, 0.85], [0.033, 0.95], [0, 0.95]];
  const balRun = (p0: THREE.Vector3, p1: THREE.Vector3, h: number, step = 0.22) => {
    const d = p1.clone().sub(p0), n = Math.max(1, Math.round(d.length() / step));
    for (let i = 0; i <= n; i++) { const p = p0.clone().addScaledVector(d, i / n); thin.add(lathe(balProf, p.x - HX, p.y, p.z, h / 0.95, 1, 12), M.trim); }
    big.add(along(p0.clone().add(V(0, h + 0.03, 0)), p1.clone().add(V(0, h + 0.03, 0)), 0.045, 12), M.wood);
    big.add(rb(Math.min(p0.x, p1.x) - HX - 0.04, p0.y - 0.02, Math.min(p0.z, p1.z) - 0.04, Math.max(p0.x, p1.x) - HX + 0.04, p0.y + 0.04, Math.max(p0.z, p1.z) + 0.04, 0.015), M.wood);
  };
  balRun(L(X0 + GW + 0.05, H1, ZN - 0.1), L(X0 + GW + 0.05, H1, GZ + 0.05), 0.92);
  balRun(L(X1 - GW - 0.05, H1, ZN - 0.1), L(X1 - GW - 0.05, H1, GZ + 0.05), 0.92);
  balRun(L(X0 + GW + 0.05, H1, GZ + 0.05), L(-1.45, H1, GZ + 0.05), 0.92); balRun(L(1.45, H1, GZ + 0.05), L(X1 - GW - 0.05, H1, GZ + 0.05), 0.92);
  // ===== the GRAND STAIRCASE: 12 steps from z -2.6 up to the back gallery, flared first steps, red runner, lamp posts =====
  { const N = 12, RISE = H1 / N, RUN = (GZ - -2.6) / -N, Z0 = -2.6, HW = 1.3;
    for (let i = 0; i < N; i++) {
      const za = Z0 - (i + 1) * RUN, zb = Z0 - i * RUN, yt = RISE * (i + 1), fl = i === 0 ? 0.45 : i === 1 ? 0.22 : 0;
      big.add(rb(-HW - fl, yt - RISE, za, HW + fl, yt - 0.03, zb, 0.02), M.wood);
      big.add(rb(-HW - fl - 0.03, yt - 0.05, za, HW + fl + 0.03, yt, zb + 0.045, 0.022), M.woodL);
      if (fl) for (const s of [-1, 1]) big.add(new THREE.CylinderGeometry(RUN / 2 + 0.03, RUN / 2 + 0.03, 0.05, 24).translate(HX + s * (HW + fl), yt - 0.025, (za + zb) / 2 + 0.02), M.woodL);
      big.add(rb(-0.85, yt - 0.006, za - 0.005, 0.85, yt + 0.024, zb + 0.05, 0.012), M.carpet);
      big.add(rb(-0.85, yt - RISE + 0.01, zb + 0.03, 0.85, yt + 0.01, zb + 0.052, 0.01), M.carpet);
      for (const s of [-1, 1]) for (const u of [0.3, 0.75]) if (i > 0) thin.add(lathe(balProf, s * (HW - 0.08), yt, za + (zb - za) * u, 0.92 / 0.95, 1, 12), M.trim);
    }
    for (const s of [-1, 1]) {
      const p0 = L(s * (HW - 0.08), RISE * 2 + 0.95, Z0 - 1.5 * RUN), p1 = L(s * (HW - 0.08), H1 + 0.95, GZ + 0.1);
      big.add(along(p0, p1, 0.05, 12), M.wood);
      // newel post with a brass lamp post and a frosted globe (lit)
      const nx = s * (HW + 0.32), nz = Z0 - 0.1;
      big.add(rb(nx - 0.16, 0, nz - 0.16, nx + 0.16, 0.25, nz + 0.16, 0.025), M.wood);
      big.add(lathe([[0, 0], [0.12, 0], [0.12, 0.06], [0.09, 0.12], [0.1, 0.4], [0.075, 0.7], [0.09, 0.85], [0.13, 0.95], [0.13, 1.0], [0, 1.0]], nx, 0.25, nz, 1, 1, 24), M.wood);
      big.add(lathe([[0, 0], [0.04, 0], [0.025, 0.1], [0.02, 0.7], [0.05, 0.75], [0.06, 0.8], [0, 0.82]], nx, 1.25, nz, 1, 1, 16), M.brass);
      const gm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.1, 1.3) })); gm.position.set(HX + nx, 2.2, nz); gm.layers.set(NOINK); R.add(gm);
      const hl = halo(new THREE.Color(0.9, 0.6, 0.25), 1.6); hl.position.copy(gm.position); R.add(hl);
      big.add(along(L(nx, 1.25, nz), L(s * (HW - 0.08), RISE * 2 + 0.95, Z0 - 1.5 * RUN), 0.05, 12), M.wood);
    }
    // stringer boards with a gold bead along both open sides
    for (const s of [-1, 1]) { const a = L(s * (HW + 0.02), RISE * 0.5, Z0 + 0.1), b = L(s * (HW + 0.02), H1 - 0.1, GZ + 0.05);
      big.add(along(a, b, 0.09, 8).scale(1, 1, 1), M.wood); big.add(along(a.clone().add(V(s * 0.06, -0.05, 0)), b.clone().add(V(s * 0.06, -0.05, 0)), 0.025, 8), M.gold); }
  }
  // ===== the ODD STAIRCASE into the ceiling: narrow, up the right wall, dead-ending under the right gallery =====
  { const SX0 = X1 - 1.0, N = 11, RISE = GS / N, RUN = 0.31, Z0 = 0.7;
    for (let i = 0; i < N; i++) {
      const za = Z0 - (i + 1) * RUN, zb = Z0 - i * RUN, yt = RISE * (i + 1);
      big.add(rb(SX0, yt - RISE, za, X1, yt - 0.03, zb, 0.015), M.wood);
      big.add(rb(SX0 - 0.03, yt - 0.045, za, X1, yt, zb + 0.04, 0.02), M.woodL);
      big.add(rb(SX0 + 0.22, yt - 0.006, za - 0.005, X1 - 0.12, yt + 0.022, zb + 0.045, 0.012), M.carpet);
      big.add(rb(SX0 + 0.22, yt - RISE + 0.01, zb + 0.025, X1 - 0.12, yt + 0.01, zb + 0.048, 0.01), M.carpet);
      for (const u of [0.3, 0.75]) { const top = Math.min(0.9, GS - 0.02 - yt); if (top > 0.15) thin.add(lathe(balProf, SX0 + 0.06, yt, za + (zb - za) * u, top / 0.95, 1, 12), M.trim); }
    }
    { const g = new THREE.BufferGeometry(), x = HX + SX0 - 0.001, zt = Z0 - N * RUN;
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([x, 0, Z0, x, 0, zt, x, GS, zt, x, 0, Z0, x, GS, zt, x, RISE, Z0]), 3));
      g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(12), 2)); g.computeVertexNormals(); big.add(g, M.wains); }
    big.add(along(L(SX0 + 0.06, RISE + 0.92, Z0 - 0.2), L(SX0 + 0.06, GS - 0.05, Z0 - (N - 3.2) * RUN), 0.04, 10), M.wood);
    big.add(rb(SX0 - 0.03, 0, Z0 - 0.04, SX0 + 0.13, 1.15, Z0 + 0.12, 0.02), M.wood); big.add(new THREE.SphereGeometry(0.09, 20, 14).translate(HX + SX0 + 0.05, 1.24, Z0 + 0.04), M.brass);
    // a tiny door under it (Winchester-style oddity)
    big.add(rb(SX0 - 0.05, 0.06, -1.6, SX0 + 0.005, 0.86, -1.1, 0.02), M.trim); big.add(rb(SX0 - 0.06, 0.1, -1.56, SX0, 0.82, -1.14, 0.02), M.door);
    big.add(new THREE.SphereGeometry(0.025, 12, 8).translate(HX + SX0 - 0.08, 0.45, -1.2), M.brass);
  }
  // ===== doors everywhere (ground + gallery level) =====
  const door = (cx: number, cz: number, y0: number, nx: number, nz: number, w = 1.0, h = 2.3, col = M.door) => {
    const tx = Math.abs(nz), tz = Math.abs(nx), o = (k: number) => [cx + nx * k, cz + nz * k];
    const [ax, az] = o(0), x0 = ax - tx * (w / 2 + 0.12), x1 = ax + tx * (w / 2 + 0.12), z0 = az - tz * (w / 2 + 0.12), z1 = az + tz * (w / 2 + 0.12);
    const th = (k: number) => [Math.min(x0, x0 + nx * k), Math.max(x1, x1 + nx * k), Math.min(z0, z0 + nz * k), Math.max(z1, z1 + nz * k)];
    { const [a, b, c, d] = th(0.07); big.add(rb(a, y0, c, b, y0 + h + 0.14, d, 0.025), M.trim); }
    { const [a, b, c, d] = th(0.09); big.add(rb(a + tx * 0.12, y0, c + tz * 0.12, b - tx * 0.12, y0 + h, d - tz * 0.12, 0.02), col); }
    for (const [v0, v1] of [[0.12, 0.42], [0.52, 0.92]]) for (const [u0, u1] of [[-0.42, -0.06], [0.06, 0.42]]) {
      const [a, b, c, d] = th(0.12);
      big.add(rb(tx ? cx + u0 * w : a + 0.0, y0 + v0 * h, tz ? cz + u0 * w : c, tx ? cx + u1 * w : b, y0 + v1 * h, tz ? cz + u1 * w : d, 0.02), M.doorP);
    }
    const kx = cx + nx * 0.14 + tx * w * 0.38, kz = cz + nz * 0.14 + tz * w * 0.38; big.add(new THREE.SphereGeometry(0.045, 14, 10).translate(HX + kx, y0 + h * 0.46, kz), M.brass);
  };
  door(-3.2, ZF, 0, 0, 1); door(3.2, ZF, 0, 0, 1); door(X1, -8.6, 0, -1, 0);
  for (const [x, z, nx, nz] of [[-3.3, ZF, 0, 1], [3.3, ZF, 0, 1], [X0, -8.7, 1, 0], [X0, -5.2, 1, 0], [X0, -1.7, 1, 0], [X0, 1.8, 1, 0], [X1, -8.7, -1, 0], [X1, -5.2, -1, 0], [X1, -1.7, -1, 0], [X1, 1.8, -1, 0]] as number[][])
    door(x, z, H1 + 0.02, nx, nz, 0.9, 2.15, [M.door, M.doorP][(x + z) > 0 ? 1 : 0]);
  // ===== stained-glass windows (left wall): deep sills, gold frames; coloured light falls on the parquet =====
  for (const [za, zb] of WIN) {
    const zc = (za + zb) / 2, w = za - zb;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.4).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ map: stainedGlassTex(), color: new THREE.Color(1.15, 1.15, 1.15) }));
    m.position.set(HX + X0 - 0.07, 1.8, zc); m.layers.set(NOINK); R.add(m);
    big.add(rb(X0 - 0.08, 0.5, zb - 0.14, X0 + 0.2, 0.6, za + 0.14, 0.02), M.woodD);
    big.add(rb(X0 - 0.08, 3.0, zb - 0.14, X0 + 0.08, 3.14, za + 0.14, 0.02), M.gold);
    big.add(rb(X0 - 0.08, 0.6, zb - 0.14, X0 + 0.08, 3.0, zb, 0.02), M.gold); big.add(rb(X0 - 0.08, 0.6, za, X0 + 0.08, 3.0, za + 0.14, 0.02), M.gold);
// (coloured floor light removed: it read as faded stripes)
  }
  // ===== Sarah's round SPIDERWEB window high on the back wall, glowing =====
  { const m = new THREE.Mesh(new THREE.CircleGeometry(1.05, 72), new THREE.MeshBasicMaterial({ map: spiderWebTex(), transparent: true, color: new THREE.Color(1.25, 1.2, 1.1) }));
    m.position.set(HX, 5.55, ZF + 0.02); m.layers.set(NOINK); R.add(m);
    big.add(new THREE.TorusGeometry(1.08, 0.08, 14, 72).translate(HX, 5.55, ZF + 0.06), M.gold);
    big.add(new THREE.TorusGeometry(1.2, 0.05, 12, 72).translate(HX, 5.55, ZF + 0.04), M.woodD);
    const hl = halo(new THREE.Color(0.9, 0.75, 0.45), 4.0); hl.position.set(HX, 5.55, ZF + 0.6); R.add(hl); }
  // ===== coffered ceiling + medallion + the two-tier chandelier =====
  for (let z = ZN; z >= ZF; z -= 1.35) big.add(rb(X0, H - 0.28, z - 0.09, X1, H, z + 0.09, 0.03), M.beam);
  for (let x = X0; x <= X1 + 1e-6; x += 1.5) big.add(rb(x - 0.09, H - 0.28, ZF, x + 0.09, H, ZN, 0.03), M.beam);
  { const CX = 0, CZ = -3.6, top = H - 0.28;
    big.add(lathe([[0, 0], [0.6, 0], [0.6, -0.03], [0.4, -0.07], [0.15, -0.1], [0, -0.11]], CX, top - 0.015, CZ), M.trim);
    for (let k = 0; k < 14; k++) thin.add(new THREE.TorusGeometry(0.035, 0.008, 6, 12).rotateY((k % 2) * Math.PI / 2).translate(HX + CX, top - 0.15 - k * 0.07, CZ), M.brass);
    const by = top - 1.3;
    big.add(lathe([[0, 0], [0.08, 0.02], [0.2, 0.1], [0.26, 0.22], [0.2, 0.34], [0.1, 0.42], [0.06, 0.55], [0.09, 0.62], [0, 0.66]], CX, by - 0.4, CZ, 1, 1, 32), M.brass);
    for (const [n, rr, yy, gs] of [[10, 0.95, by - 0.25, 0.085], [7, 0.55, by + 0.12, 0.07]] as number[][]) for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, px = CX + Math.cos(a) * rr, pz = CZ + Math.sin(a) * rr;
      thin.add(along(L(CX + Math.cos(a) * 0.18, yy - 0.05, CZ + Math.sin(a) * 0.18), L(px, yy, pz), 0.012, 6), M.brass);
      big.add(lathe([[0, 0], [0.04, 0], [0.055, 0.05], [0, 0.05]], px, yy, pz, 1, 1, 14), M.brass);
      big.add(new THREE.SphereGeometry(gs, 16, 12).translate(HX + px, yy + 0.12, pz), M.globe);
    }
    const hl = halo(new THREE.Color(0.95, 0.7, 0.35), 3.2); hl.position.set(HX + CX, by, CZ); R.add(hl);
  }
  // ===== fireplace corner (right wall, z -5.5): marble surround, mantel, gilt mirror, candlesticks; two velvet armchairs on a rug =====
  { const FZ = -5.5, FX = X1;
    big.add(rb(FX - 0.35, 0, FZ - 0.95, FX, 1.25, FZ + 0.95, 0.03), M.marble);
    big.add(rb(FX - 0.38, 0.22, FZ - 0.48, FX - 0.33, 0.95, FZ + 0.48, 0.03), M.dark);
    big.add(rb(FX - 0.48, 1.25, FZ - 1.1, FX, 1.36, FZ + 1.1, 0.03), M.woodD);
    big.add(rb(FX - 0.06, 1.55, FZ - 0.7, FX, 2.95, FZ + 0.7, 0.04), M.gold); big.add(rb(FX - 0.08, 1.63, FZ - 0.6, FX - 0.05, 2.87, FZ + 0.6, 0.01), M.mirror);
    for (const dz of [-0.75, 0.75]) { big.add(lathe([[0, 0], [0.07, 0], [0.04, 0.05], [0.025, 0.2], [0.05, 0.24], [0, 0.25]], FX - 0.25, 1.36, FZ + dz, 1, 1, 16), M.brass);
      big.add(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 10).translate(HX + FX - 0.25, 1.7, FZ + dz), M.candle); }
    big.add(rb(FX - 0.35, 1.36, FZ - 0.18, FX - 0.12, 1.66, FZ + 0.18, 0.04), M.wood);
    const glow = halo(new THREE.Color(1.0, 0.45, 0.12), 1.3); glow.position.set(HX + FX - 0.5, 0.5, FZ); R.add(glow);
    flat.add(floorQ(1.0, 3.9, FZ - 1.6, FZ + 1.6, 9, 0.008).rotateY(0), M.rug);
    for (const dz of [-1.0, 1.0]) { // armchairs facing the fire (+x)
      const ax = 1.85, az = FZ + dz;
      big.add(rb(ax - 0.4, 0.38, az - 0.42, ax + 0.4, 0.58, az + 0.42, 0.08, 3), M.velvet);
      big.add(rb(ax - 0.5, 0.38, az - 0.42, ax - 0.3, 1.3, az + 0.42, 0.09, 3), M.velvet);
      for (const s of [-1, 1]) big.add(rb(ax - 0.42, 0.38, az + s * 0.42 - 0.09, ax + 0.4, 0.82, az + s * 0.42 + 0.09, 0.08, 3), M.velvet);
      for (const [lx, lz] of [[-0.42, -0.4], [0.38, -0.4], [-0.42, 0.4], [0.38, 0.4]]) big.add(lathe([[0, 0], [0.025, 0], [0.035, 0.2], [0.03, 0.38], [0, 0.38]], ax + lx, 0, az + lz, 1, 1, 10), M.woodD);
    }
  }
  // ===== potted palms flanking the stair foot =====
  const palm = (px: number, pz: number, seed: number) => {
    big.add(lathe([[0, 0], [0.2, 0], [0.26, 0.4], [0.3, 0.44], [0.3, 0.5], [0, 0.5]], px, 0, pz), M.pot);
    for (let k = 0; k < 13; k++) {
      const a = k * 2.399 + seed, len = 1.0 + 0.3 * ((k * 5) % 3) / 2;
      const c = new THREE.QuadraticBezierCurve3(L(px, 0.5, pz), L(px + Math.cos(a) * len * 0.35, 0.5 + len * 0.95, pz + Math.sin(a) * len * 0.35), L(px + Math.cos(a) * len, 0.5 + len * 0.55, pz + Math.sin(a) * len));
      thin.add(new THREE.TubeGeometry(c, 12, 0.016, 6, false), M.leafD);
      for (let j = 2; j < 12; j++) { const t = j / 12, p = c.getPoint(t), tg = c.getTangent(t), side = V(-Math.sin(a), 0, Math.cos(a));
        for (const s of [-1, 1]) { const lf = new THREE.SphereGeometry(0.05, 10, 6).scale(0.75, 0.14, 4.2 * (1 - 0.45 * t));
          const dir = side.clone().multiplyScalar(s).addScaledVector(tg, 0.3).add(V(0, -0.35, 0)).normalize();
          lf.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir)); lf.translate(p.x + dir.x * 0.1, p.y + dir.y * 0.1, p.z + dir.z * 0.1); big.add(lf, (j + k) % 2 ? M.leaf : M.leafD); } }
    }
  };
  palm(-3.9, 0.2, 0.3);
  // ===== a marble bust on a pedestal (left wall, between the windows) and the grandfather clock (front left) =====
  big.add(lathe([[0, 0], [0.22, 0], [0.22, 0.08], [0.16, 0.14], [0.13, 0.95], [0.18, 1.02], [0.2, 1.1], [0, 1.1]], X0 + 0.45, 0, -3.1), M.marble);
  big.add(lathe([[0, 0], [0.2, 0], [0.24, 0.1], [0.18, 0.22], [0.08, 0.28], [0, 0.3]], X0 + 0.45, 1.1, -3.1), M.marble);
  big.add(new THREE.SphereGeometry(0.13, 20, 16).scale(0.9, 1.1, 0.95).translate(HX + X0 + 0.45, 1.52, -3.1), M.marble);
  { const cx = X0 + 0.3, cz = 2.3;
    big.add(rb(cx - 0.26, 0, cz - 0.38, cx + 0.26, 0.34, cz + 0.38, 0.03), M.wood); big.add(rb(cx - 0.22, 0.34, cz - 0.3, cx + 0.22, 1.55, cz + 0.3, 0.03), M.wood);
    big.add(rb(cx + 0.2, 0.55, cz - 0.2, cx + 0.24, 1.4, cz + 0.2, 0.02), M.dark); big.add(rb(cx - 0.26, 1.55, cz - 0.38, cx + 0.26, 2.25, cz + 0.38, 0.03), M.wood);
    big.add(new THREE.CylinderGeometry(0.38, 0.38, 0.52, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(HX + cx, 2.25, cz), M.woodD);
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.22, 40).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ map: clockFaceTex(), color: new THREE.Color(0.92, 0.92, 0.92) })); m.position.set(HX + cx + 0.265, 1.92, cz); m.layers.set(NOINK); R.add(m);
    big.add(new THREE.TorusGeometry(0.225, 0.02, 10, 40).rotateY(Math.PI / 2).translate(HX + cx + 0.265, 1.92, cz), M.brass);
    big.add(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24).rotateZ(Math.PI / 2).translate(HX + cx + 0.245, 0.75, cz), M.brass); }
  // ===== portraits: ground floor (between doors) and up on the gallery walls =====
  const frame = (cx: number, cy: number, cz: number, w: number, h: number, kind: number, nx: number, nz: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: portraitTex(kind) }));
    m.position.set(HX + cx + nx * 0.06, cy, cz + nz * 0.06); m.lookAt(HX + cx + nx * 5, cy, cz + nz * 5); R.add(m);
    const tx = Math.abs(nz), tz = Math.abs(nx);
    big.add(rb(cx - tx * (w / 2 + 0.07) - (nx < 0 ? 0.05 : 0), cy - h / 2 - 0.07, cz - tz * (w / 2 + 0.07) - (nz < 0 ? 0.05 : 0), cx + tx * (w / 2 + 0.07) + (nx > 0 ? 0.05 : 0), cy + h / 2 + 0.07, cz + tz * (w / 2 + 0.07) + (nz > 0 ? 0.05 : 0), 0.025), M.gold);
  };
  frame(X1, 2.2, -0.2, 0.7, 0.9, 0, -1, 0); frame(X0, 2.15, 0.9, 0.55, 0.7, 3, 1, 0); frame(-1.6, H1 + 1.3, ZF, 0.7, 0.9, 1, 0, 1); frame(1.6, H1 + 1.3, ZF, 0.7, 0.9, 2, 0, 1);
  frame(X0, H1 + 1.4, -3.45, 0.6, 0.75, 0, 1, 0); frame(X1, H1 + 1.4, -3.45, 0.6, 0.75, 3, -1, 0); frame(X0, H1 + 1.4, 0.05, 0.6, 0.75, 1, 1, 0); frame(X1, H1 + 1.4, 0.05, 0.6, 0.75, 2, -1, 0);
  flat.build(R, false); wallsC.build(R, false); big.build(R, true); thin.build(R, false);
};
