// WINCHESTER story props inside the grand foyer (x = FOYER.HX): the séance table + crystal ball, Sarah's desk with growing
// coin stacks, the mantel portraits (baby, William), the window in the floor, the door that opens onto bricks, the 7-turn
// switchback staircase that climbs 9 feet, the washstand with the 13-hole drain, the half-hammered nail, 13 numbered
// plaques. WP is the per-frame state set by the staging; propsApply() (called by the world after staging) applies it.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Batch, V, lam } from "../bridge/build";
import { GLOSS_OF } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { halo } from "./fx3d";
import { FOYER } from "./foyer";
import { portraitTex, brickTex, floorViewTex, drainTex, plaqueTex, blueprintTex } from "./textures";

export const WP = { seance: 0, crystal: 0, coins: 0, doorB: 0, candles: 0 };
let SEANCE: THREE.Group | null = null, COINS: THREE.Mesh[] = [], DOORB: THREE.Group | null = null, BALL: THREE.Mesh | null = null, BALLHALO: THREE.Sprite | null = null;
const CANDLE_HALOS: THREE.Sprite[] = [];
export const propsApply = () => {
  if (SEANCE) SEANCE.visible = WP.seance > 0;
  if (BALL) (BALL.material as THREE.MeshBasicMaterial).color.setRGB(0.7 + 1.6 * WP.crystal, 1.0 + 1.5 * WP.crystal, 1.0 + 1.3 * WP.crystal);
  if (BALLHALO) { BALLHALO.visible = WP.seance > 0; BALLHALO.scale.setScalar(0.6 + 1.6 * WP.crystal); }
  COINS.forEach((c, i) => { const k = Math.max(0, Math.min(1, WP.coins * COINS.length - i * 0.6)); c.scale.set(1, Math.max(0.001, k), 1); c.visible = k > 0.01; });
  if (DOORB) DOORB.rotation.y = -1.9 * WP.doorB;
  CANDLE_HALOS.forEach((h) => (h.visible = WP.candles > 0));
};

export const buildProps = (R: THREE.Object3D) => {
  const HX = FOYER.HX, DS = THREE.DoubleSide;
  const rb = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r = 0.015, seg = 2) => {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, rr = Math.max(0.001, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
    return new RoundedBoxGeometry(w, h, d, seg, rr).translate(HX + (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  };
  const lathe = (prof: number[][], x: number, y: number, z: number, seg = 24) => new THREE.LatheGeometry(prof.map(([r, yy]) => new THREE.Vector2(r, yy)), seg).translate(HX + x, y, z);
  const M = {
    wood: lam("wpWood", () => ({ color: "#b8652c" })), woodD: lam("wpWoodD", () => ({ color: "#8a4520" })), brass: lam("fyBrass", () => ({ color: "#f2c24f" })),
    cloth: lam("wpCloth", () => ({ color: "#1f8a80", side: DS })), gold: lam("wpGold", () => ({ color: "#f2c24f" })), coin: lam("wpCoin", () => ({ color: "#f6c84a" })),
    book: lam("wpBook", () => ({ color: "#c94a3c" })), page: lam("wpPage", () => ({ color: "#fbf3df" })), wax: lam("wpWax", () => ({ color: "#fff6e0" })),
    marble: lam("fyMarble", () => ({ color: "#f2ece0" })), porc: lam("wpPorc", () => ({ color: "#f7fbff" })), iron: lam("wpIron", () => ({ color: "#5a5f66" })),
    brick: lam("wpBrick", () => ({ map: brickTex() })), door: lam("wpDoor", () => ({ color: "#c0603a" })), doorP: lam("wpDoorP", () => ({ color: "#9a4a26" })),
    trim: lam("fyTrim2", () => ({ color: "#fff6e2" })), stair: lam("wpStair", () => ({ color: "#d4843f" })), tread: lam("wpTread", () => ({ color: "#e8a058" })),
  };
  Object.assign(GLOSS_OF, { wpCoin: 1, wpGold: 1, wpBook: 0.4, wpPorc: 0.9, wpIron: 0.8, wpWood: 0.55, wpWoodD: 0.5, wpDoor: 0.5, wpStair: 0.5, wpTread: 0.55 });
  const big = new Batch(), thin = new Batch();
  // ---- séance table (centre of the foyer) with a teal cloth, gold fringe, crystal ball on a brass stand, two candles ----
  { const g = new THREE.Group(), b = new Batch(), tx = 0, tz = 1.2;
    b.add(lathe([[0, 0], [0.5, 0], [0.62, 0.05], [0.66, 0.74], [0.6, 0.8], [0, 0.8]], tx, 0, tz, 40), M.cloth);
    b.add(new THREE.TorusGeometry(0.645, 0.03, 8, 48).rotateX(Math.PI / 2).translate(HX + tx, 0.08, tz), M.gold);
    b.add(lathe([[0, 0], [0.12, 0], [0.08, 0.06], [0.05, 0.12], [0.1, 0.16], [0, 0.17]], tx, 0.8, tz, 20), M.brass);
    for (const dx of [-0.42, 0.42]) { b.add(lathe([[0, 0], [0.06, 0], [0.03, 0.04], [0.02, 0.12], [0.04, 0.14], [0, 0.15]], tx + dx, 0.8, tz + 0.1, 14), M.brass);
      b.add(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 10).translate(HX + tx + dx, 1.03, tz + 0.1), M.wax);
      const h = halo(new THREE.Color(1.0, 0.6, 0.22), 0.55); h.position.set(HX + tx + dx, 1.15, tz + 0.1); g.add(h); CANDLE_HALOS.push(h);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8).scale(1, 1.8, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2, 0.8) })); fl.position.set(HX + tx + dx, 1.14, tz + 0.1); fl.layers.set(NOINK); g.add(fl); }
    BALL = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 1.1, 1.1) })); BALL.position.set(HX + tx, 1.13, tz); BALL.layers.set(NOINK); g.add(BALL);
    BALLHALO = halo(new THREE.Color(0.35, 0.95, 0.9), 1.0); BALLHALO.position.set(HX + tx, 1.13, tz); g.add(BALLHALO);
    b.build(g, true); SEANCE = g; R.add(g); g.visible = false; }
  // ---- Sarah's desk (left side): top, drawers, turned legs, ledger, inkwell + quill, candle, a blueprint, coin stacks ----
  { const dx0 = -3.25, dx1 = -1.65, dz0 = -4.35, dz1 = -3.55;
    big.add(rb(dx0, 0.74, dz0, dx1, 0.8, dz1, 0.02), M.wood); big.add(rb(dx0 + 0.05, 0.56, dz0 + 0.04, dx1 - 0.05, 0.74, dz1 - 0.04, 0.015), M.woodD);
    for (const x of [dx0 + 0.3, (dx0 + dx1) / 2, dx1 - 0.3]) big.add(new THREE.SphereGeometry(0.025, 10, 8).translate(HX + x, 0.65, dz1 - 0.02), M.brass);
    for (const [lx, lz] of [[dx0 + 0.06, dz0 + 0.06], [dx1 - 0.06, dz0 + 0.06], [dx0 + 0.06, dz1 - 0.06], [dx1 - 0.06, dz1 - 0.06]]) big.add(lathe([[0, 0], [0.025, 0], [0.035, 0.2], [0.025, 0.45], [0.035, 0.56], [0, 0.56]], lx, 0, lz, 12), M.woodD);
    big.add(rb(dx0 + 0.15, 0.8, dz0 + 0.15, dx0 + 0.55, 0.86, dz0 + 0.45, 0.01), M.book); big.add(rb(dx0 + 0.17, 0.86, dz0 + 0.17, dx0 + 0.53, 0.875, dz0 + 0.43, 0.005), M.page);
    big.add(lathe([[0, 0], [0.05, 0], [0.055, 0.04], [0.03, 0.07], [0, 0.07]], dx1 - 0.25, 0.8, dz0 + 0.2, 14), M.iron);
    thin.add(new THREE.CylinderGeometry(0.004, 0.01, 0.24, 6).rotateZ(0.5).translate(HX + dx1 - 0.2, 0.93, dz0 + 0.2), M.page);
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46).rotateX(-Math.PI / 2).rotateY(0.15), new THREE.MeshLambertMaterial({ map: blueprintTex() })); m.position.set(HX + (dx0 + dx1) / 2 + 0.1, 0.805, (dz0 + dz1) / 2 + 0.05); R.add(m); }
    // coin stacks: grow with WP.coins (each a column of coins, pivot at its base)
    for (let k = 0; k < 9; k++) { const cx = dx0 + 0.42 + (k % 3) * 0.12, cz = dz1 - 0.12 - Math.floor(k / 3) * 0.12, h = 0.08 + 0.04 * ((k * 5) % 4);
      const geo = new THREE.CylinderGeometry(0.045, 0.045, h, 20).translate(0, h / 2, 0);
      const m = new THREE.Mesh(geo, M.coin); m.position.set(HX + cx, 0.8, cz); m.castShadow = true; R.add(m); COINS.push(m); }
  }
  // ---- mantel portraits (fireplace, right wall z -5.5): the baby + William ----
  for (const [dz, kind] of [[-0.42, 4], [0.42, 5]] as [number, number][]) {
    const x = 4.5 - 0.3, z = -5.5 + dz;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.32), new THREE.MeshLambertMaterial({ map: portraitTex(kind) })); m.position.set(HX + x - 0.026, 1.58, z); m.rotation.y = -Math.PI / 2 + 0.25 * Math.sign(dz) * -1; R.add(m);
    big.add(rb(x - 0.02, 1.36, z - 0.17, x + 0.02, 1.8, z + 0.17, 0.015).rotateY(0), M.brass);
  }
  // ---- the WINDOW IN THE FLOOR (left front): brass frame, the kitchen below seen through glass ----
  { const fx = -2.3, fz = 1.4; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: floorViewTex(), color: new THREE.Color(0.95, 0.95, 0.95) }));
    m.position.set(HX + fx, 0.012, fz); m.layers.set(NOINK); R.add(m);
    big.add(rb(fx - 0.5, 0, fz - 0.62, fx + 0.5, 0.03, fz - 0.55, 0.01), M.brass); big.add(rb(fx - 0.5, 0, fz + 0.55, fx + 0.5, 0.03, fz + 0.62, 0.01), M.brass);
    big.add(rb(fx - 0.5, 0, fz - 0.62, fx - 0.43, 0.03, fz + 0.62, 0.01), M.brass); big.add(rb(fx + 0.43, 0, fz - 0.62, fx + 0.5, 0.03, fz + 0.62, 0.01), M.brass);
    thin.add(rb(fx - 0.43, 0, fz - 0.015, fx + 0.43, 0.025, fz + 0.015, 0.006), M.brass); }
  // ---- the DOOR ONTO BRICKS (right wall, in front of the odd stair): casing, a swinging door, bricks behind ----
  { const x = 4.5, z0 = 1.35, z1 = 2.35;
    big.add(rb(x - 0.06, 0, z0 - 0.1, x, 2.4, z0, 0.02), M.trim); big.add(rb(x - 0.06, 0, z1, x, 2.4, z1 + 0.1, 0.02), M.trim); big.add(rb(x - 0.06, 2.3, z0 - 0.1, x, 2.42, z1 + 0.1, 0.02), M.trim);
    big.add(rb(x - 0.02, 0, z0, x + 0.001, 2.3, z1, 0.01), M.brick);
    const g = new THREE.Group(), b = new Batch();
    b.add(new RoundedBoxGeometry(0.06, 2.26, z1 - z0 - 0.02, 2, 0.015).translate(0, 1.13, (z1 - z0) / 2), M.door);
    for (const [y0, y1] of [[0.2, 1.0], [1.2, 2.05]]) b.add(new RoundedBoxGeometry(0.03, y1 - y0, z1 - z0 - 0.3, 2, 0.012).translate(-0.04, (y0 + y1) / 2, (z1 - z0) / 2), M.doorP);
    b.add(new THREE.SphereGeometry(0.045, 12, 10).translate(-0.07, 1.1, z1 - z0 - 0.12), M.brass);
    b.build(g, true); g.position.set(HX + x - 0.05, 0, z0); DOORB = g; R.add(g); }
  // ---- the SWITCHBACK STAIRCASE (back left): 7 flights of tiny 2.5-inch steps that climb 9 feet in total ----
  { const X0s = -3.95, W = 0.55, RS = 0.065, TR = 0.16, NS = 6;
    let y = 0;
    for (let k = 0; k < 7; k++) {
      const dir = k % 2 ? -1 : 1, zf = -6.7 - k * 0.5, xs = dir > 0 ? X0s : X0s + NS * TR;
      for (let i = 0; i < NS; i++) { const x = xs + dir * i * TR, yt = y + RS * (i + 1);
        big.add(rb(Math.min(x, x + dir * TR), 0, zf - W / 2, Math.max(x, x + dir * TR), yt, zf + W / 2, 0.012), M.stair);
        big.add(rb(Math.min(x, x + dir * TR) - 0.01, yt - 0.015, zf - W / 2, Math.max(x, x + dir * TR) + 0.01, yt + 0.004, zf + W / 2, 0.006), M.tread); }
      y += RS * NS;
      big.add(rb(X0s - 0.05, y - 0.03, zf - W / 2 - 0.25, X0s + NS * TR + 0.05, y, zf - W / 2 + 0.02, 0.01), M.tread);
    }
  }
  // ---- the washstand with the THIRTEEN-hole drain (right wall, back, ground floor) ----
  { const x = 3.9, z = -7.6;
    big.add(rb(x - 0.3, 0, z - 0.4, x + 0.3, 0.82, z + 0.4, 0.03), M.marble);
    big.add(lathe([[0, 0.05], [0.13, 0.055], [0.21, 0.075], [0.265, 0.125], [0.29, 0.17], [0.305, 0.185], [0.318, 0.172], [0.3, 0.1], [0.25, 0.035], [0.17, 0.0], [0, 0.0]], x, 0.82, z, 40), lam("wpPorcDS", () => ({ color: "#f7fbff", side: THREE.DoubleSide })));
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.11, 40).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: drainTex() })); d.position.set(HX + x, 0.876, z); R.add(d);
    big.add(new THREE.TorusGeometry(0.06, 0.012, 8, 20, Math.PI).rotateY(Math.PI / 2).translate(HX + x + 0.25, 1.12, z), M.brass);
  }
  // ---- the half-hammered nail + the dropped hammer (left wall, back) ----
  { const z = -7.4; big.add(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8).rotateZ(Math.PI / 2).translate(HX - 4.5 + 0.035, 1.55, z), M.iron);
    big.add(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 14).rotateZ(Math.PI / 2).translate(HX - 4.5 + 0.072, 1.55, z), M.iron);
    big.add(rb(-4.35, 0.02, z + 0.1, -4.05, 0.05, z + 0.14, 0.01).rotateY(0), M.wood); big.add(rb(-4.12, 0.0, z + 0.06, -4.05, 0.06, z + 0.2, 0.012), M.iron); }
  // ---- 13 numbered brass plaques on the 13 doors (gallery + ground floor) ----
  { const spots: [number, number, number, number, number][] = [[-3.3, -10, 0, 1, 4.9], [3.3, -10, 0, 1, 4.9], [-4.5, -8.7, 1, 0, 4.9], [-4.5, -5.2, 1, 0, 4.9], [-4.5, -1.7, 1, 0, 4.9], [-4.5, 1.8, 1, 0, 4.9],
      [4.5, -8.7, -1, 0, 4.9], [4.5, -5.2, -1, 0, 4.9], [4.5, -1.7, -1, 0, 4.9], [4.5, 1.8, -1, 0, 4.9], [-3.2, -10, 0, 1, 1.75], [3.2, -10, 0, 1, 1.75], [4.5, -8.6, -1, 0, 1.75]];
    spots.forEach(([x, z, nx, nz, y], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshLambertMaterial({ map: plaqueTex(i + 1) }));
      m.position.set(HX + x + nx * 0.13, y, z + nz * 0.13); m.lookAt(HX + x + nx * 5, y, z + nz * 5); R.add(m); }); }
  big.build(R, true); thin.build(R, false); void V;
};
