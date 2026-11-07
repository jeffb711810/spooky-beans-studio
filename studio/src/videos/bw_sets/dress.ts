// SET DRESSING, small-detail pass (owner: sets agent; imported by world.ts). Everything static is merged into the
// caller's Batches (one draw call per material). Outside under the blue moon every grey / wood / cloth albedo keeps
// green >= red (warm browns with blue-ish albedo read mauve); warm accents are oranges / yellows with low blue.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../bridge/build";
import { NOINK } from "../bridge/ink";
import { halo, cobwebTex } from "./fx3d";
import { noticeTex, epitaphTex, dirtTex } from "./textures";

type M3 = THREE.MeshLambertMaterial;
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => boxGeo(V(x0, y0, z0), V(x1, y1, z1));
const cyl = (r: number, h: number, x: number, y: number, z: number, seg = 10) => new THREE.CylinderGeometry(r, r, h, seg).translate(x, y + h / 2, z);
const rnd = (seed: number) => { let s = seed % 2147483647 || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const mat = (key: string, color: string, extra: THREE.MeshLambertMaterialParameters = {}) => lam(key, () => ({ color, ...extra })) as M3;
/** matrix: yaw about y then place */
const at = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);

const O = () => ({
  wood: mat("dsWood", "#767650"), woodDk: mat("dsWoodDk", "#4c4c36"), woodLt: mat("dsWoodLt", "#959670"), endGrain: mat("dsEnd", "#c6c690"),
  iron: mat("dsIron", "#3e4244"), rope: mat("dsRope", "#acac84"), sack: mat("dsSack", "#acac84"), sackDk: mat("dsSackDk", "#8c8c66"),
  jug: mat("dsJug", "#d6d6be", { side: THREE.DoubleSide }), jugTop: mat("dsJugTop", "#5c5c44", { side: THREE.DoubleSide }),
  coat: mat("dsCoat", "#5a5c40"), boot: mat("dsBoot", "#3a3a2c"), basket: mat("dsBasket", "#a8a878"), tater: mat("dsTater", "#a8a878"),
  tuft: mat("dsTuft", "#46663a"), tuft2: mat("dsTuft2", "#5c7a3e"), dry: mat("dsDryGrass", "#a2a468"), stem: mat("dsStem", "#56683a"),
  flY: mat("dsFlowerY", "#e4c64a"), flW: mat("dsFlowerW", "#e6e8d6"), flO: mat("dsFlowerO", "#de9238"),
  leafA: mat("dsLeafA", "#c08a2c"), leafB: mat("dsLeafB", "#a8642a"), leafC: mat("dsLeafC", "#9a9636"), leafD: mat("dsLeafD", "#d0a640"),
  stone: mat("dsStone", "#8a8f8a"), stone2: mat("dsStone2", "#a5a9a2"), water: mat("dsWater", "#0c1016"), straw: mat("dsStraw", "#b2b274"),
  tin: mat("dsTin", "#9aa0a2"),
});
type OM = ReturnType<typeof O>;

// ---------- small reusable pieces ----------
/** grass tuft: 5-8 three-sided blades splaying from (x, y, z) */
export const tuft = (b: Batch, m: OM, r: () => number, x: number, y: number, z: number, s = 1) => {
  const n = 5 + Math.floor(r() * 4), mm = r() < 0.5 ? m.tuft : r() < 0.7 ? m.tuft2 : m.dry;
  for (let i = 0; i < n; i++) {
    const h = (0.1 + 0.14 * r()) * s, a = r() * Math.PI * 2, lean = 0.25 + 0.45 * r();
    b.add(new THREE.ConeGeometry(0.014 * s, h, 3).translate(0, h / 2, 0).rotateZ(lean).rotateY(a)
      .translate(x + Math.cos(a) * 0.025 * s, y, z - Math.sin(a) * 0.025 * s), mm);
  }
};
/** a little wildflower clump: thin stems and small five-point heads */
const flowers = (b: Batch, m: OM, r: () => number, x: number, y: number, z: number, n = 4) => {
  const head = [m.flY, m.flW, m.flO][Math.floor(r() * 3)];
  for (let i = 0; i < n; i++) {
    const h = 0.14 + 0.16 * r(), dx = (r() - 0.5) * 0.16, dz = (r() - 0.5) * 0.16, lean = (r() - 0.5) * 0.3;
    b.add(new THREE.CylinderGeometry(0.004, 0.005, h, 4).translate(0, h / 2, 0).rotateZ(lean).translate(x + dx, y, z + dz), m.stem);
    b.add(new THREE.IcosahedronGeometry(0.024, 0).scale(1, 0.55, 1).translate(x + dx - Math.sin(lean) * h, y + h * Math.cos(lean), z + dz), head);
  }
  tuft(b, m, r, x, y, z, 0.8);
};
/** fallen leaf lying (almost) flat */
const leaf = (b: Batch, m: OM, r: () => number, x: number, y: number, z: number, s = 1) => {
  const L = [m.leafA, m.leafB, m.leafC, m.leafD][Math.floor(r() * 4)];
  b.add(new THREE.CircleGeometry(0.035 * s, 5).scale(1.7, 1, 1).rotateX(-Math.PI / 2 + (r() - 0.5) * 0.5).rotateY(r() * 6.28).translate(x, y + 0.006, z), L);
};
const pebble = (b: Batch, m: OM, r: () => number, x: number, y: number, z: number, s: number) =>
  b.add(new THREE.IcosahedronGeometry(s, 0).scale(1, 0.55, 0.8).rotateY(r() * 6).translate(x, y + s * 0.25, z), r() < 0.5 ? m.stone : m.stone2);
/** stoneware jug: cream body, brown dipped shoulder, little handle */
const jug = (b: Batch, m: OM, x: number, y: number, z: number, s = 1, yaw = 0) => {
  const P = (pts: number[][]) => pts.map(([a, c]) => new THREE.Vector2(a * s, c * s));
  const T = at(x, y, z, yaw);
  b.add(new THREE.LatheGeometry(P([[0, 0], [0.08, 0], [0.105, 0.05], [0.115, 0.13], [0.11, 0.17]]), 12), m.jug, T);
  b.add(new THREE.LatheGeometry(P([[0.11, 0.17], [0.09, 0.22], [0.05, 0.255], [0.03, 0.27], [0.03, 0.31], [0.037, 0.32], [0, 0.32]]), 12), m.jugTop, T);
  b.add(new THREE.TorusGeometry(0.05 * s, 0.011 * s, 4, 8, Math.PI).rotateZ(-Math.PI / 2).translate(0.075 * s, 0.24 * s, 0), m.jugTop, T);
};
/** slumped grain sack tied at the neck */
const sack = (b: Batch, m: OM, x: number, y: number, z: number, s = 1, yaw = 0, lean = 0) => {
  const T = at(x, y, z, yaw).multiply(new THREE.Matrix4().makeRotationZ(lean));
  b.add(new THREE.SphereGeometry(0.2 * s, 10, 8).scale(1, 1.25, 0.78).translate(0, 0.21 * s, 0), m.sack, T);
  b.add(new THREE.CylinderGeometry(0.05 * s, 0.09 * s, 0.1 * s, 8).translate(0, 0.47 * s, 0), m.sack, T);
  b.add(new THREE.CylinderGeometry(0.055 * s, 0.055 * s, 0.03 * s, 8).translate(0, 0.5 * s, 0), m.rope, T);
  b.add(new THREE.ConeGeometry(0.08 * s, 0.09 * s, 7).rotateX(Math.PI).translate(0, 0.57 * s, 0), m.sackDk, T);
};
/** banded barrel / tub */
const barrel = (b: Batch, m: OM, x: number, y: number, z: number, r0: number, r1: number, h: number, bands: number[], top?: THREE.Material) => {
  b.add(new THREE.CylinderGeometry(r1, r0, h, 14).translate(x, y + h / 2, z), m.wood);
  for (const u of bands) { const rr = r0 + (r1 - r0) * u + 0.007; b.add(new THREE.CylinderGeometry(rr, rr, 0.03, 14, 1, true).translate(x, y + h * u, z), m.iron); }
  if (top) b.add(new THREE.CircleGeometry(Math.min(r0, r1) * 0.92, 14).rotateX(-Math.PI / 2).translate(x, y + h - 0.04, z), top);
};
/** split firewood stack, ends facing +z (or -z with dir -1) */
const woodStack = (b: Batch, m: OM, r: () => number, x0: number, x1: number, y0: number, z0: number, depth: number, rows: number, dir = 1) => {
  const n = Math.max(2, Math.round((x1 - x0) / 0.13));
  for (let j = 0; j < rows; j++) for (let i = 0; i < n - (j % 2); i++) {
    const x = x0 + 0.065 + i * ((x1 - x0 - 0.13) / (n - 1)) + (j % 2) * 0.065, y = y0 + 0.06 + j * 0.11, rr = 0.06 + 0.012 * r(), roll = r() * 6;
    const zc = z0 + depth / 2 + (r() - 0.5) * 0.06;
    b.add(new THREE.CylinderGeometry(rr, rr, depth, 5).rotateY(roll).rotateX(Math.PI / 2).translate(x, y, zc), m.wood);
    b.add(new THREE.CircleGeometry(rr * 0.95, 5).rotateZ(roll).rotateY(dir > 0 ? 0 : Math.PI).translate(x, y, zc + dir * (depth / 2 + 0.002)), m.endGrain);
  }
};
/** rocking chair in local space (seat front toward +z), placed by T */
const rocker = (b: Batch, m: OM, T: THREE.Matrix4) => {
  b.add(box(-0.24, 0.42, -0.22, 0.24, 0.47, 0.24), m.wood, T);
  for (const [x, z] of [[-0.22, -0.2], [0.18, -0.2], [-0.22, 0.18], [0.18, 0.18]]) b.add(box(x, 0.08, z, x + 0.04, 0.44, z + 0.04), m.woodDk, T);
  for (const x of [-0.2, 0.2]) {
    b.add(new THREE.TorusGeometry(1.1, 0.022, 4, 10, 0.5).rotateZ(-Math.PI / 2 - 0.25).rotateY(Math.PI / 2).translate(x, 1.18, 0.0), m.woodDk, T);
    b.add(box(x - 0.02, 0.62, -0.2, x + 0.02, 0.66, 0.24), m.wood, T); // arm
    b.add(box(x - 0.015, 0.47, 0.18, x + 0.015, 0.63, 0.21), m.woodDk, T);
  }
  for (const x of [-0.22, 0.18]) b.add(box(x, 0.44, -0.24, x + 0.04, 1.18, -0.2).rotateX(-0.1), m.woodDk, T);
  b.add(box(-0.24, 1.06, -0.25, 0.24, 1.14, -0.19).rotateX(-0.1), m.wood, T);
  for (let i = 0; i < 5; i++) b.add(box(-0.15 + i * 0.075, 0.47, -0.23, -0.13 + i * 0.075, 1.07, -0.21).rotateX(-0.1), m.wood, T);
};
/** cart wheel in its own plane (xy), hub along z */
const wheel = (b: Batch, m: OM, T: THREE.Matrix4, R2 = 0.5) => {
  b.add(new THREE.TorusGeometry(R2, 0.045, 6, 22), m.woodDk, T);
  b.add(new THREE.TorusGeometry(R2 + 0.04, 0.012, 4, 22), m.iron, T);
  b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 10).rotateX(Math.PI / 2), m.wood, T);
  for (let i = 0; i < 10; i++) b.add(box(-0.018, 0.06, -0.015, 0.018, R2 - 0.02, 0.015).rotateZ((i / 10) * Math.PI * 2), m.wood, T);
};
/** cobweb sheet: apex/top edge at p, hanging into the dihedral (tilt about x) or across a corner (yaw) */
const web = (R: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, rx: number, ry: number) => {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, -h / 2, 0),
    new THREE.MeshBasicMaterial({ map: cobwebTex(), color: new THREE.Color(0.42, 0.45, 0.47), alphaTest: 0.3, side: THREE.DoubleSide, fog: true }));
  mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, 0, "YXZ"); mesh.layers.set(NOINK); R.add(mesh);
};

// =====================================================================================================
/** porch, front wall and yard of the farmhouse (house at the origin, front wall z = 3, porch floor y 0.25 over
 *  x -3.6..3.6, z 3..4.8). The opening close-up looks at the wall behind John (1.7, 0.25, 3.7): x 0.75..2.15. */
export const dressFarm = (out: Batch, R: THREE.Object3D) => {
  const m = O(), r = rnd(9127), PY = 0.25;
  // ---- the wall right of the door, behind John's close-up (frame 0) ----
  // peg rail with a work coat and a coil of rope, a nailed notice, a horseshoe over the lantern, cobweb in the eave
  out.add(box(0.64, 1.6, 3.0, 1.2, 1.66, 3.035), m.woodDk);
  for (const x of [0.76, 1.08]) out.add(new THREE.CylinderGeometry(0.014, 0.014, 0.11, 6).rotateX(Math.PI / 2).translate(x, 1.63, 3.09), m.woodDk);
  out.add(new THREE.CylinderGeometry(0.15, 0.2, 0.66, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 0.22).translate(1.08, 1.27, 3.07), m.coat); // hanging coat
  out.add(box(0.98, 1.52, 3.05, 1.18, 1.63, 3.11), m.coat);                                                                     // collar
  out.add(new THREE.CylinderGeometry(0.035, 0.045, 0.55, 6).rotateZ(0.08).translate(0.94, 1.22, 3.11), m.coat);                 // sleeve
  out.add(new THREE.CylinderGeometry(0.035, 0.045, 0.52, 6).rotateZ(-0.12).translate(1.22, 1.22, 3.1), m.coat);
  for (let k = 0; k < 3; k++) out.add(new THREE.TorusGeometry(0.13 - k * 0.006, 0.02, 5, 14).scale(1, 1.2, 1).translate(0.76 + k * 0.01, 1.48 - k * 0.015, 3.07 + k * 0.012), m.rope);
  out.add(box(0.755, 1.2, 3.06, 0.77, 1.36, 3.08), m.rope); // rope tail
  {
    const nt = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), lam("dsNotice", () => ({ map: noticeTex() })));
    nt.position.set(0.76, 1.12, 3.012); nt.rotation.z = 0.07; nt.updateMatrix(); out.add(nt.geometry, nt.material as THREE.Material, nt.matrix);
  }
  out.add(new THREE.TorusGeometry(0.07, 0.015, 6, 14, Math.PI * 1.3).rotateZ(-1.15 * Math.PI).translate(1.3, 2.58, 3.02), m.iron);
  web(R, 1.62, 2.79, 3.01, 0.62, 0.42, -0.75, 0);
  web(R, -3.36, 2.54, 4.6, 0.5, 0.4, 0, 0.6);
  web(R, 3.36, 2.54, 4.6, 0.5, 0.4, 0, -0.6);
  // firewood stacked below the coat, a sack slumped against the shutter, boots by the door
  woodStack(out, m, r, 0.64, 1.18, PY, 3.02, 0.38, 5);
  sack(out, m, 1.42, PY, 3.24, 1, 0.3, -0.12);
  for (const [x, z, a] of [[0.72, 3.62, 0.2], [0.86, 3.66, -0.1]]) {
    const T = at(x, PY, z, a);
    out.add(box(-0.045, 0, -0.12, 0.045, 0.035, 0.12), m.boot, T);
    out.add(new THREE.CylinderGeometry(0.048, 0.05, 0.22, 8).translate(0, 0.14, -0.06), m.boot, T);
  }
  // bench under the right window: jugs, a potato basket; a rocking chair angled toward the yard
  out.add(box(1.86, 0.57, 3.04, 2.86, 0.61, 3.38), m.wood);
  for (const x of [1.9, 2.78]) for (const z of [3.07, 3.3]) out.add(box(x, PY, z, x + 0.05, 0.57, z + 0.05), m.woodDk);
  jug(out, m, 2.04, 0.61, 3.2, 1.05, 0.4); jug(out, m, 2.3, 0.61, 3.16, 0.8, -0.6);
  barrel(out, m, 2.6, 0.61, 3.21, 0.13, 0.15, 0.16, [0.85]);
  for (let k = 0; k < 6; k++) out.add(new THREE.SphereGeometry(0.04, 7, 5).scale(1.2, 0.8, 1).translate(2.6 + (r() - 0.5) * 0.15, 0.78 + r() * 0.03, 3.21 + (r() - 0.5) * 0.15), m.tater);
  jug(out, m, 2.95, PY, 3.62, 0.9, 1.2);
  rocker(out, m, at(2.75, PY, 4.05, -0.55));
  // left of the door: hanging bucksaw + sickle, a second wood stack, the old chair is a rocker now (world.ts), washtub
  out.add(box(-1.16, 1.78, 3.0, -0.64, 1.83, 3.03), m.woodDk);
  { // bucksaw
    const T = at(-0.9, 1.5, 3.05);
    out.add(box(-0.24, -0.02, -0.004, 0.24, 0.02, 0.004), m.iron, T);
    for (const x of [-0.22, 0.22]) out.add(box(x - 0.02, -0.05, -0.015, x + 0.02, 0.32, 0.015), m.wood, T);
    out.add(box(-0.22, 0.12, -0.012, 0.22, 0.15, 0.012), m.wood, T);
    out.add(box(-0.22, 0.29, -0.006, 0.22, 0.3, 0.006), m.rope, T);
  }
  out.add(new THREE.TorusGeometry(0.12, 0.012, 4, 10, Math.PI * 1.1).rotateZ(0.4).translate(-1.02, 1.18, 3.04), m.iron);
  out.add(new THREE.CylinderGeometry(0.018, 0.02, 0.2, 6).translate(-1.13, 1.04, 3.04), m.wood);
  woodStack(out, m, r, -1.18, -0.66, PY, 3.02, 0.38, 6);
  barrel(out, m, -3.1, PY, 4.3, 0.24, 0.28, 0.26, [0.2, 0.8], m.water);
  out.add(box(-0.16, 0, -0.015, 0.16, 0.55, 0.015).rotateX(-0.28).translate(-3.1, PY, 4.66), m.wood);
  out.add(box(-0.12, 0.14, 0.015, 0.12, 0.44, 0.022).rotateX(-0.28).translate(-3.1, PY, 4.66), m.tin);
  { // broom on the left porch post
    const g = new THREE.CylinderGeometry(0.014, 0.014, 1.3, 6).translate(0, 0.65 + 0.2, 0).rotateZ(-0.06).translate(-3.58, PY, 4.62);
    out.add(g, m.wood);
    out.add(new THREE.CylinderGeometry(0.03, 0.12, 0.3, 8).translate(0, 0.15, 0).rotateZ(-0.06).translate(-3.58, PY, 4.62), m.straw);
  }
  sack(out, m, 3.3, PY, 4.38, 0.9, 1.3, 0.1); sack(out, m, 3.38, PY, 3.95, 0.75, 0.4, -0.2);
  rocker(out, m, at(-1.25, PY, 4.15, 0.3));
  // rope coil hung on the right porch post, a lantern hook on the left post
  for (let k = 0; k < 3; k++) out.add(new THREE.TorusGeometry(0.12, 0.018, 5, 14).translate(1.15, 1.45 - k * 0.012, 4.75 + k * 0.012), m.rope);
  // ---- porch floor + steps: fallen leaves blown into corners, a second, lower step ----
  out.add(box(-0.8, 0, 5.3, 0.8, 0.06, 5.6), m.woodLt);
  for (let k = 0; k < 46; k++) {
    const x = -3.5 + 7 * r(), z = 3.05 + 1.7 * Math.pow(r(), 0.6);
    leaf(out, m, r, x, PY, z, 0.9 + 0.3 * r());
  }
  for (let k = 0; k < 10; k++) leaf(out, m, r, -0.75 + 1.5 * r(), r() < 0.5 ? 0.12 : 0.06, 4.85 + 0.7 * r());
  // ---- yard ----
  // rain barrels at both front corners, a water trough, a chopping stump with an axe + chips, a wagon wheel on the fence
  barrel(out, m, -3.98, 0, 3.72, 0.28, 0.3, 0.86, [0.12, 0.5, 0.88], m.water);
  barrel(out, m, 4.55, 0, 3.42, 0.25, 0.27, 0.8, [0.12, 0.5, 0.88], m.water);
  {
    const [tx, tz] = [-5.65, 6.6];
    out.add(box(tx - 0.7, 0.08, tz - 0.24, tx + 0.7, 0.46, tz - 0.19), m.wood); out.add(box(tx - 0.7, 0.08, tz + 0.19, tx + 0.7, 0.46, tz + 0.24), m.wood);
    out.add(box(tx - 0.72, 0.08, tz - 0.24, tx - 0.67, 0.46, tz + 0.24), m.wood); out.add(box(tx + 0.67, 0.08, tz - 0.24, tx + 0.72, 0.46, tz + 0.24), m.wood);
    out.add(box(tx - 0.7, 0.08, tz - 0.22, tx + 0.7, 0.12, tz + 0.22), m.woodDk);
    out.add(box(tx - 0.67, 0.4, tz - 0.19, tx + 0.67, 0.405, tz + 0.19), m.water);
    for (const x of [tx - 0.55, tx + 0.55]) out.add(box(x - 0.06, 0, tz - 0.3, x + 0.06, 0.1, tz + 0.3), m.woodDk);
  }
  const stump = (x: number, z: number, axe: boolean) => {
    out.add(new THREE.CylinderGeometry(0.27, 0.33, 0.44, 11).translate(x, 0.22, z), m.wood);
    out.add(new THREE.CircleGeometry(0.265, 11).rotateX(-Math.PI / 2).translate(x, 0.442, z), m.endGrain);
    if (axe) {
      out.add(box(-0.018, 0, -0.018, 0.018, 0.66, 0.018).rotateZ(-0.6).translate(x + 0.02, 0.5, z + 0.02), m.woodLt);
      out.add(box(-0.07, -0.06, -0.012, 0.08, 0.04, 0.012).rotateZ(-0.6).translate(x + 0.02, 0.5, z + 0.02), m.iron);
    }
    for (let k = 0; k < 9; k++) {
      const a = r() * 6.28, d = 0.38 + 0.4 * r();
      out.add(box(-0.05, 0, -0.012, 0.05, 0.022, 0.012).rotateY(r() * 3).translate(x + Math.cos(a) * d, 0.015, z + Math.sin(a) * d), m.endGrain);
    }
    for (let k = 0; k < 3; k++) {
      const a = 0.8 + k * 1.9, d = 0.55;
      out.add(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 5).rotateZ(Math.PI / 2).rotateY(a).translate(x + Math.cos(a) * d, 0.06, z + Math.sin(a) * d), m.wood);
    }
    tuft(out, m, r, x + 0.3, 0, z - 0.2, 1.2); tuft(out, m, r, x - 0.32, 0, z + 0.1, 1);
  };
  stump(3.45, 6.15, true); stump(-8.7, 6.1, true);
  wheel(out, m, new THREE.Matrix4().makeRotationX(0.25).setPosition(3.35, 0.52, 11.28));
  // chicken coop (left yard): plank box on legs, lean-to roof, a ramp and a hatch
  {
    const [cx, cz] = [-7.8, 4.3];
    for (const [x, z] of [[-0.55, -0.4], [0.5, -0.4], [-0.55, 0.35], [0.5, 0.35]]) out.add(box(cx + x, 0, cz + z, cx + x + 0.06, 0.4, cz + z + 0.06), m.woodDk);
    out.add(box(cx - 0.58, 0.4, cz - 0.42, cx + 0.58, 1.05, cz + 0.42), m.wood);
    for (let k = 0; k < 5; k++) out.add(box(cx - 0.6, 0.48 + k * 0.12, cz + 0.42, cx + 0.6, 0.495 + k * 0.12, cz + 0.435), m.woodDk);
    out.add(box(cx - 0.12, 0.45, cz + 0.425, cx + 0.12, 0.72, cz + 0.445), m.woodDk);
    const roofG = box(-0.72, -0.025, -0.58, 0.72, 0.025, 0.58).rotateX(0.32); out.add(roofG.translate(cx, 1.13, cz), m.woodLt);
    out.add(box(-0.1, 0, -0.42, 0.1, 0.02, 0.42).rotateX(-0.55).translate(cx, 0.22, cz + 0.8), m.wood);
    for (let k = 0; k < 4; k++) out.add(box(cx - 0.1, 0.13 + k * 0.09, cz + 0.55 + k * 0.14, cx + 0.1, 0.15 + k * 0.09, cz + 0.57 + k * 0.14), m.woodDk);
    for (let k = 0; k < 6; k++) out.add(new THREE.ConeGeometry(0.01, 0.05, 3).rotateZ(1.4).rotateY(r() * 6).translate(cx + (r() - 0.5) * 1.6, 0.01, cz + 0.7 + r() * 0.6), m.flW); // feathers
  }
  // stones edging the path, flat stepping stones
  for (const sx of [-1, 1]) for (let z = 5.5; z < 11.2; z += 0.38 + 0.18 * r()) pebble(out, m, r, sx * (0.98 + 0.06 * r()), 0, z, 0.06 + 0.06 * r());
  // grass tufts: along the porch front, the path edges, fence posts, house sides and scattered over the yard
  for (let x = -3.5; x < 3.6; x += 0.35 + 0.3 * r()) if (Math.abs(x) > 0.9) tuft(out, m, r, x, 0, 4.86 + 0.12 * r(), 1.1 + 0.4 * r());
  for (const sx of [-1, 1]) for (let z = 5.6; z < 11.3; z += 0.5 + 0.5 * r()) tuft(out, m, r, sx * (1.06 + 0.1 * r()), 0, z, 0.9 + 0.5 * r());
  for (const sx of [-1, 1]) for (let i = 0; i <= 5; i++) { const x = sx * (1.3 + (i * 12.7) / 5); tuft(out, m, r, x + 0.12, 0, 11.4, 1.3); tuft(out, m, r, x - 0.1, 0, 11.6, 1.1); }
  for (const sx of [-1, 1]) for (let z = -2.6; z < 3.2; z += 0.6 + 0.5 * r()) tuft(out, m, r, sx * (4.1 + 0.15 * r()), 0, z, 1 + 0.4 * r());
  for (let k = 0; k < 90; k++) {
    const x = -9 + 18 * r(), z = 5.2 + 6.2 * r();
    if (Math.abs(x) < 1.1) continue;
    tuft(out, m, r, x, 0, z, 0.8 + 0.6 * r());
  }
  // wildflower clumps by the porch, the path, the fence and the barrels
  for (const [x, z] of [[-2.4, 4.98], [1.6, 5.0], [2.9, 4.95], [-1.25, 6.4], [1.25, 7.6], [1.3, 9.9], [-1.2, 10.6], [2.3, 11.25], [4.6, 11.3], [-3.6, 11.3],
    [4.2, 3.95], [-4.2, 4.15], [3.9, 6.6], [-5.0, 7.0], [5.6, 9.0], [-6.5, 9.6], [-8.2, 5.4], [-7.0, 4.9]] as const) flowers(out, m, r, x, 0, z, 3 + Math.floor(r() * 3));
  // fallen leaves over the yard, thicker near the house and along the fence
  for (let k = 0; k < 240; k++) {
    const x = -9 + 18 * r(), z = 4.85 + 6.7 * Math.pow(r(), 0.8), onPath = Math.abs(x) < 0.9 && z > 5.3 ? 0.03 : 0;
    leaf(out, m, r, x, onPath + (z < 6 && Math.abs(x) < 6 ? 0.012 : 0), z, 0.8 + 0.5 * r());
  }
  // loose stones in the grass
  for (let k = 0; k < 40; k++) { const x = -8 + 16 * r(), z = 5 + 6.4 * r(); if (Math.abs(x) > 1.2) pebble(out, m, r, x, 0, z, 0.04 + 0.07 * r()); }
};

// =====================================================================================================
/** John's fresh grave at the graveyard origin (gx, gz): mound, clods, shovel, pick, wilted flowers, a lit candle stub,
 *  footprints, leaves, pebbles, tufts; the headstone's carved face; small details on the neighbouring graves */
export const dressGrave = (out: Batch, R: THREE.Object3D, gx: number, gz: number) => {
  const m = O(), r = rnd(4421);
  const earth = lam("dsEarth", () => ({ map: dirtTex(), color: "#9c9c8a" }));
  const clod = mat("dsClod", "#4a4636"), clod2 = mat("dsClod2", "#3c3a2e");
  // mound: a lumpy heightfield over x +-0.62, z 0.12..2.1 (local to the stone), sinking below the grass at its rim
  const z0 = 0.12, z1 = 2.1, hx = 0.62, zc = (z0 + z1) / 2, hz = (z1 - z0) / 2;
  const H = (x: number, z: number) => {
    const u = x / (hx * 0.86), v = (z - zc) / (hz * 0.9), q = Math.max(0, 1 - u * u - v * v * v * v);
    const lump = 0.018 * Math.sin(x * 7 + z * 3) * Math.sin(z * 5 - x * 2) + 0.01 * Math.sin(x * 11 + z * 9);
    return q ** 0.6 * (0.26 + lump) - 0.02;
  };
  {
    const g = new THREE.PlaneGeometry(hx * 2, hz * 2, 22, 40).rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i) + zc; p.setY(i, H(x, z)); p.setZ(i, z); }
    const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.7, uv.getY(i) * 1.1);
    g.computeVertexNormals(); g.translate(gx, 0.005, gz); out.add(g, earth);
  }
  const Hw = (x: number, z: number) => (Math.abs(x) < hx && z > z0 && z < z1 ? Math.max(0, H(x, z)) : 0);
  for (let k = 0; k < 34; k++) {
    const onM = k < 18, x = onM ? (r() - 0.5) * 1.1 : (r() < 0.5 ? -1 : 1) * (0.55 + 0.35 * r()), z = onM ? z0 + 0.1 + (z1 - z0 - 0.2) * r() : z0 + (z1 - z0 + 0.4) * r();
    const s = 0.02 + 0.035 * r();
    out.add(new THREE.IcosahedronGeometry(s, 0).scale(1, 0.7, 0.9).rotateY(r() * 6).rotateX(r() * 2).translate(gx + x, Hw(x, z) + s * 0.4, gz + z), r() < 0.5 ? clod : clod2);
  }
  // spill of loose earth around the rim (flat dark patches) and the shovel stuck in at the foot
  for (const [x, z, w, d] of [[0.62, 1.4, 0.2, 0.42], [-0.64, 0.8, 0.18, 0.45]] as const)
    out.add(new THREE.CircleGeometry(1, 9).scale(w, d, 1).rotateX(-Math.PI / 2).translate(gx + x, 0.012, gz + z), earth);
  {
    const T = new THREE.Matrix4().makeTranslation(gx - 0.42, Hw(-0.42, 1.55) - 0.12, gz + 1.55).multiply(new THREE.Matrix4().makeRotationX(-0.1)).multiply(new THREE.Matrix4().makeRotationZ(0.38));
    out.add(new THREE.CylinderGeometry(0.019, 0.019, 1.0, 7).translate(0, 0.62, 0), m.woodLt, T);
    out.add(new THREE.TorusGeometry(0.06, 0.013, 4, 10).translate(0, 1.16, 0), m.woodLt, T);
    out.add(box(-0.11, -0.02, -0.008, 0.11, 0.17, 0.008), m.iron, T);
    out.add(new THREE.CylinderGeometry(0.028, 0.022, 0.12, 7).translate(0, 0.17, 0), m.iron, T);
  }
  { // pick lying in the grass to the right
    const T = at(gx + 0.95, 0.03, gz + 1.25, 0.5);
    out.add(new THREE.CylinderGeometry(0.02, 0.022, 0.9, 7).rotateZ(Math.PI / 2), m.woodLt, T);
    out.add(new THREE.ConeGeometry(0.03, 0.28, 5).rotateX(Math.PI / 2 + 0.25).translate(0.46, 0.0, 0.14), m.iron, T);
    out.add(new THREE.ConeGeometry(0.03, 0.28, 5).rotateX(-Math.PI / 2 - 0.25).translate(0.46, 0.0, -0.14), m.iron, T);
  }
  // wilted bouquet lying on the mound below the stone, tied with string, a few loose petals
  {
    const bx = -0.08, bz = 0.55, by = Hw(bx, bz);
    for (let k = 0; k < 7; k++) {
      const a = -0.5 + (k / 6) * 1.0 + (r() - 0.5) * 0.2, L = 0.3 + 0.12 * r();
      const ex = bx + Math.sin(a) * L, ez = bz - Math.cos(a) * L * 0.4 + 0.2;
      const s = new THREE.Vector3(bx, by + 0.03, bz + 0.25), e = new THREE.Vector3(ex, Hw(ex, ez) + 0.03, ez - 0.25);
      const len = s.distanceTo(e), g = new THREE.CylinderGeometry(0.005, 0.006, len, 4).translate(0, len / 2, 0);
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), e.clone().sub(s).normalize())));
      out.add(g.translate(gx + s.x, s.y, gz + s.z), m.stem);
      const hd = [m.flY, m.flW, m.flO, m.leafB][k % 4];
      out.add(new THREE.IcosahedronGeometry(0.034, 0).scale(1, 0.5, 1.2).translate(gx + e.x, e.y - 0.01, gz + e.z), hd);
    }
    out.add(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 8).rotateX(Math.PI / 2).translate(gx + bx, by + 0.035, gz + bz + 0.32), m.rope);
    for (let k = 0; k < 8; k++) leaf(out, m, r, gx + bx + (r() - 0.5) * 0.5, Hw(bx, bz) + 0.01, gz + bz + (r() - 0.5) * 0.4, 0.5);
  }
  // candle stub in a tin holder at the stone's foot (lit: a tiny flame + soft halo)
  {
    const cx = gx + 0.24, cz = gz + 0.2;
    out.add(new THREE.CylinderGeometry(0.06, 0.07, 0.015, 12).translate(cx, 0.0075, cz), m.tin);
    out.add(new THREE.TorusGeometry(0.03, 0.006, 4, 8).rotateY(Math.PI / 2).translate(cx + 0.075, 0.03, cz), m.tin);
    out.add(new THREE.CylinderGeometry(0.026, 0.029, 0.06, 10).translate(cx, 0.045, cz), mat("dsWax", "#e6e4cc"));
    out.add(new THREE.SphereGeometry(0.03, 8, 4, 0, Math.PI * 2, 0, 0.6).scale(1.2, 0.5, 1).translate(cx, 0.07, cz), mat("dsWax", "#e6e4cc"));
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.04, 6).translate(0, 0.02, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 2.4, 0.8) }));
    fl.position.set(cx, 0.08, cz); fl.layers.set(NOINK); R.add(fl);
    const h = halo(new THREE.Color(0.85, 0.48, 0.16), 0.5); h.position.set(cx, 0.11, cz); R.add(h);
  }
  // the carved face on the headstone's front (+z) and lichen blobs on its arched top
  {
    const w = 0.72, ht = 1.05, sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, ht - w / 2); sh.absarc(0, ht - w / 2, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
    const g = new THREE.ShapeGeometry(sh, 16), p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, p.getY(i) / ht);
    out.add(g.translate(gx, 0.001, gz + 0.083), lam("dsEpitaph", () => ({ map: epitaphTex() })));
    for (let k = 0; k < 7; k++) {
      const a = 0.25 + 2.6 * r();
      out.add(new THREE.SphereGeometry(0.03 + 0.03 * r(), 7, 4).scale(1, 0.35, 1).translate(gx + Math.cos(a) * 0.36, ht - w / 2 + Math.sin(a) * 0.36, gz + (r() - 0.5) * 0.12), r() < 0.5 ? m.leafC : m.dry);
    }
  }
  // footprints (boot soles pressed into the soft ground around the mound): one NOINK mesh, no ink outline
  {
    const fpG: THREE.BufferGeometry[] = [];
    const step = (x: number, z: number, a: number) => {
      fpG.push(new THREE.CircleGeometry(0.04, 8).scale(0.9, 1.6, 1).translate(0, 0.04, 0).rotateX(-Math.PI / 2).rotateY(a).translate(gx + x, 0.008, gz + z));
      fpG.push(new THREE.CircleGeometry(0.032, 8).scale(0.9, 1, 1).translate(0, -0.07, 0).rotateX(-Math.PI / 2).rotateY(a).translate(gx + x, 0.008, gz + z));
    };
    for (let k = 0; k < 7; k++) { step(-0.85 - 0.04 * k + (k % 2) * 0.16, 2.9 - 0.42 * k, 0.1); }
    for (let k = 0; k < 6; k++) { step(0.75 + (k % 2) * 0.15, 3.1 - 0.4 * k, -0.15 + 3.14 * (k > 3 ? 1 : 0)); }
    for (const [x, z, a] of [[0.3, 2.4, 2.9], [-0.25, 2.5, 3.3], [0.55, 0.35, 1.6], [-0.6, 0.3, -1.5]] as const) step(x, z, a);
    const mm = new THREE.Mesh(mergeFlat(fpG), lam("dsPrint", () => ({ color: "#55523f" })));
    mm.layers.set(NOINK); mm.receiveShadow = true; R.add(mm);
  }
  // leaves, pebbles and tufts around the plot and the neighbouring stones
  for (let k = 0; k < 90; k++) { const a = r() * 6.28, d = 0.7 + 2.6 * Math.sqrt(r()), x = Math.cos(a) * d, z = 1.0 + Math.sin(a) * d * 1.3; leaf(out, m, r, gx + x, 0.004, gz + z, 0.7 + 0.5 * r()); }
  for (let k = 0; k < 28; k++) { const s = r() < 0.5 ? -1 : 1, x = s * (0.6 + 0.12 * r()), z = z0 + (z1 - z0) * r(); pebble(out, m, r, gx + x, 0, gz + z, 0.025 + 0.035 * r()); }
  for (let k = 0; k < 16; k++) { const s = r() < 0.5 ? -1 : 1, x = s * (0.7 + 0.15 * r()), z = z0 - 0.1 + (z1 - z0 + 0.3) * r(); tuft(out, m, r, gx + x, 0, gz + z, 1 + 0.5 * r()); }
  for (const x of [-0.42, -0.3, 0.32, 0.44]) tuft(out, m, r, gx + x, 0, gz + 0.06, 1.3);
  for (const [x, z] of [[-1.7, -1.3], [1.6, -1.1], [-2.8, 0.4], [2.9, 0.2], [-0.9, -2.8], [1.1, -3.0], [-0.4, -3.8], [0.6, -2.1], [2.4, 0.9], [-1.7, -0.3], [1.6, -0.1]] as const) {
    for (let k = 0; k < 3; k++) tuft(out, m, r, gx + x + (r() - 0.5) * 0.6, 0, gz + z + 0.08 + 0.1 * r(), 1.1 + 0.5 * r());
    if (r() < 0.6) flowers(out, m, r, gx + x + 0.3 * (r() - 0.5), 0, gz + z + 0.25, 3);
  }
  // a dry wreath leaning on the left neighbour, pebbles left on the right one, a tin cup by the cross
  out.add(new THREE.TorusGeometry(0.17, 0.035, 5, 14).rotateX(-0.25).translate(gx - 1.7, 0.2, gz - 1.18), m.dry);
  for (let k = 0; k < 5; k++) out.add(new THREE.TorusGeometry(0.17, 0.012, 3, 4, 0.5).rotateZ(k * 1.25).rotateX(-0.25).translate(gx - 1.7, 0.2, gz - 1.15), m.leafB);
  for (let k = 0; k < 4; k++) pebble(out, m, r, gx + 1.6 + (k - 1.5) * 0.06, 0.7 + 0.005 * k, gz - 1.1, 0.03);
  out.add(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 8).translate(gx + 0.75, 0.035, gz - 1.95), m.tin);
};

/** merge flat (non-indexed) geometries */
const mergeFlat = (gs: THREE.BufferGeometry[]) => {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [];
  for (const g0 of gs) {
    const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
};

// =====================================================================================================
/** bedroom extras (room centred on X0): carved headboard crest + finials, panel mouldings, a chamber pot, a dropped
 *  slipper and sock, nails in the logs, bread + knife + crumbs + a mug on the table */
export const dressRoom = (inn: Batch, X0: number) => {
  const r = rnd(771);
  const wood = lam("bwWood", () => ({ color: "#6a4a34" })), woodDk = lam("bwWoodDark", () => ({ color: "#3e2a20" }));
  const crock = mat("dsCrockIn", "#e2dccb", { side: THREE.DoubleSide }), crockRim = mat("dsCrockRim", "#7a5a3c"), wool = mat("dsWool", "#b9a98a"), slip = mat("dsSlipper", "#7a3a2c");
  const bread = mat("dsBread", "#c7894a"), crumb = mat("dsCrumb", "#d9a868"), steel = mat("dsSteel", "#b9b6ae"), nail = mat("dsNail", "#2c2a28");
  // headboards: arched crest, ball finials, a moulded panel frame and two carved roundels (centre left clear for the gnaw)
  for (const [bx0, bx1, hb] of [[X0 - 3.5, X0 - 1.0, 1.35], [X0 + 1.4, X0 + 3.0, 1.15]] as const) {
    const cx = (bx0 + bx1) / 2, wd = bx1 - bx0, top = hb - 0.12, z = -2.95;
    inn.add(new THREE.CylinderGeometry(wd * 0.26, wd * 0.26, 0.05, 20, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).scale(1, 0.45, 1).translate(cx, top, z), wood);
    inn.add(new THREE.CylinderGeometry(wd * 0.27, wd * 0.27, 0.035, 20, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).scale(1, 0.45, 1).translate(cx, top, z + 0.005), woodDk);
    for (const x of [bx0 + 0.05, bx1 - 0.05]) { inn.add(new THREE.SphereGeometry(0.07, 10, 8).translate(x, hb + 0.06, -2.95), wood); inn.add(cyl(0.04, 0.04, x, hb, -2.95), woodDk); }
    const zf = -2.915;
    inn.add(box(bx0 + 0.12, 0.6, zf, bx1 - 0.12, 0.635, zf + 0.02), woodDk); inn.add(box(bx0 + 0.12, top - 0.08, zf, bx1 - 0.12, top - 0.045, zf + 0.02), woodDk);
    inn.add(box(bx0 + 0.12, 0.6, zf, bx0 + 0.155, top - 0.045, zf + 0.02), woodDk); inn.add(box(bx1 - 0.155, 0.6, zf, bx1 - 0.12, top - 0.045, zf + 0.02), woodDk);
    for (const s of [-1, 1]) {
      const x = cx + s * wd * 0.33, y = (0.62 + top) / 2;
      inn.add(new THREE.TorusGeometry(0.075, 0.012, 4, 14).translate(x, y, zf + 0.01), woodDk);
      for (let k = 0; k < 4; k++) inn.add(box(-0.006, -0.06, 0, 0.006, 0.06, 0.012).rotateZ((k * Math.PI) / 4).translate(x, y, zf + 0.012), woodDk);
    }
  }
  // chamber pot beside the big bed, a dropped slipper and a sock by Betsy's bed
  inn.add(new THREE.LatheGeometry([[0, 0], [0.1, 0], [0.13, 0.05], [0.13, 0.12], [0.145, 0.14], [0.14, 0.155], [0.115, 0.15]].map(([a, b]) => new THREE.Vector2(a, b)), 14).translate(X0 - 0.82, 0, -1.25), crock);
  inn.add(new THREE.TorusGeometry(0.045, 0.012, 4, 8, Math.PI).rotateZ(-Math.PI / 2).translate(X0 - 0.69, 0.09, -1.25), crock);
  inn.add(new THREE.TorusGeometry(0.135, 0.008, 4, 16).rotateX(Math.PI / 2).translate(X0 - 0.82, 0.148, -1.25), crockRim);
  {
    const T = at(X0 + 1.15, 0, -0.75, 0.7);
    inn.add(new THREE.SphereGeometry(0.06, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.75, 0.7, 1.9), slip, T);
    inn.add(new THREE.CylinderGeometry(0.048, 0.048, 0.008, 10).scale(1, 1, 2.3).translate(0, 0.002, 0), slip, T);
  }
  inn.add(new THREE.CapsuleGeometry(0.025, 0.2, 3, 6).rotateZ(Math.PI / 2).rotateY(1.9).translate(X0 + 0.55, 0.04, -0.35), wool);
  inn.add(new THREE.CapsuleGeometry(0.026, 0.07, 3, 6).rotateY(0.3).translate(X0 + 0.6, 0.04, -0.47), wool);
  // nails driven into the logs (back + side walls), a few bent
  for (let k = 0; k < 22; k++) {
    const side = k % 3, y = 0.9 + 1.5 * r();
    if (side === 0) { const x = X0 - 3.8 + 7.6 * r(); if (Math.abs(x - X0) < 0.8) continue; inn.add(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 5).rotateX(Math.PI / 2 + (r() - 0.5) * 0.4).translate(x, y, -2.975), nail); }
    else { const xw = side === 1 ? X0 - 3.975 : X0 + 3.975, z = -2.6 + 5 * r(); inn.add(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 5).rotateZ(Math.PI / 2 + (r() - 0.5) * 0.4).translate(xw, y, z), nail); }
  }
  // table: bread board with a cut loaf, knife, crumbs, a mug
  const ty = 0.8;
  inn.add(box(X0 + 1.3, ty, 1.35, X0 + 1.72, ty + 0.025, 1.68), wood);
  inn.add(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.25, 0.75, 0.8).translate(X0 + 1.48, ty + 0.025, 1.52), bread);
  inn.add(new THREE.CircleGeometry(0.09, 12).scale(1, 0.6, 1).rotateY(Math.PI / 2).translate(X0 + 1.631, ty + 0.07, 1.52), crumb);
  inn.add(box(X0 + 1.62, ty + 0.025, 1.4, X0 + 1.66, ty + 0.06, 1.62), crumb);
  inn.add(box(-0.16, 0, -0.012, 0.06, 0.006, 0.012).rotateY(0.5).translate(X0 + 1.62, ty + 0.03, 1.36), steel);
  inn.add(box(0.06, -0.006, -0.015, 0.16, 0.016, 0.015).rotateY(0.5).translate(X0 + 1.62, ty + 0.03, 1.36), woodDk);
  for (let k = 0; k < 18; k++) inn.add(new THREE.IcosahedronGeometry(0.008 + 0.006 * r(), 0).translate(X0 + 1.55 + 0.35 * r(), ty + 0.006, 1.25 + 0.5 * r()), crumb);
  inn.add(cyl(0.045, 0.1, X0 + 1.88, ty, 1.62, 12), crock);
  inn.add(new THREE.TorusGeometry(0.03, 0.008, 4, 8, Math.PI).rotateZ(-Math.PI / 2).translate(X0 + 1.93, ty + 0.05, 1.62), crock);
};
