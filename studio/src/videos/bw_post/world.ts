// SETS + PROPS (owner: sets agent; the light rig values come from moon.ts / candle.ts, the glows from fx3d.ts).
// The Bell farm: one three.js world posed per frame. Outside: log farmhouse at the origin (front faces +z), porch,
// split-rail fence, yard, trees, hillside graveyard at GRAVE. Inside: a closed log bedroom centred on x = X0
// (beds, quilts, nightstand with candle and vial, table, hearth). Same look toolkit as the bridge: two-tone lit
// materials, painted canvas textures, ink pass, lit character cards, tone-map-inverted sky/fog colours.
import * as THREE from "three";
import { Batch, V, lam, boxGeo, quad, tri, kitClone, Kit } from "../bridge/build";
import { planksHD, grassHD, cloudHD } from "../bridge/paint";
import { TONE, CHAR, twoTone, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { LOOK, LightPreset } from "../bridge/lights";
import { logsTex, quiltTex, shinglesTex, dirtTex, tickingTex, stoneTex, moonTex, rugTex, samplerTex } from "./textures";
import { Atmos, halo, pool, cobwebTex } from "./fx3d";
import { NIGHT, RIM_NIGHT, SUN_EXT, MOON_FRAME, MOON_SHOT } from "./moon";
import { CANDLE, RIM_CANDLE, SUN_INT } from "./candle";
import { Shot, camAt, shotAt, X0, GRAVE, FPS } from "./story";
import { stage, Props } from "./stage";

const presetOf = (s: Shot): LightPreset => (s.light === "candle" ? CANDLE : NIGHT);

// ---------------- geometry helpers ----------------
/** upward floor quad over [x0,x1] x [z0,z1], uv tiled every `tile` m */
const floorQ = (x0: number, x1: number, z0: number, z1: number, tile: number, y = 0) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
/** vertical wall quad from (xa,za) to (xb,zb); faces the left of the walking direction (+z when walking +x) */
const wallQ = (xa: number, za: number, xb: number, zb: number, y0: number, y1: number, tile: number) => {
  const L = Math.hypot(xb - xa, zb - za);
  return quad(V(xa, y0, za), V(xb, y0, zb), V(xb, y1, zb), V(xa, y1, za), L / tile, (y1 - y0) / tile, 0, y0 / tile);
};
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 0) => boxGeo(V(x0, y0, z0), V(x1, y1, z1), tile);
const cyl = (r: number, h: number, x: number, y: number, z: number, seg = 16) => new THREE.CylinderGeometry(r, r, h, seg).translate(x, y + h / 2, z);

export type Lit = { mat: THREE.MeshBasicMaterial; on: THREE.Color; off: THREE.Color };

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private fog = new THREE.Fog("#000000", 10, 100);
  private sunCache = new Map<number, THREE.Vector3>();
  private moonCache = new Map<number, THREE.Vector3>();
  private windows: Lit[] = [];          // farmhouse windows (front L, front R, side L, side R)
  private winGlow: { h: THREE.Sprite; p: THREE.Mesh }[] = [];
  private quiltB: THREE.Mesh;           // Betsy's quilt (slides off)
  private quiltJ: THREE.Mesh;           // the slab over John when he lies down
  private chair: THREE.Group;
  private vial: THREE.Group; private saucer: THREE.Mesh;
  private book: THREE.Group; private plates: THREE.Group;
  private lanterns: THREE.Mesh[] = [];
  private lanternGlow: { h: THREE.Sprite; p: THREE.Mesh }[] = [];
  private porch: { m: THREE.Mesh; h: THREE.Sprite; p: THREE.Mesh };
  private candleHalos: THREE.Sprite[] = [];
  private hearth: THREE.Sprite[] = [];
  private atmos: Atmos;
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky (5 stops by elevation), lights ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() },
        c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#2a3550", "#16141c", 0.3);
    this.sun = new THREE.DirectionalLight("#a8bcff", 2.0);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);

    const M = {
      grass: lam("bwGrass", () => ({ map: grassHD(), color: "#7d8a80" })),
      dirt: lam("bwDirt", () => ({ map: dirtTex() })),
      logs: lam("bwLogs", () => ({ map: logsTex() })),
      logsIn: lam("bwLogsIn", () => ({ map: logsTex("logsIn", "#9a6c4a") })),
      planks: lam("bwPlanks", () => ({ map: planksHD() })),
      wood: lam("bwWood", () => ({ color: "#6a4a34" })),
      woodDark: lam("bwWoodDark", () => ({ color: "#3e2a20" })),
      roof: lam("bwRoof", () => ({ map: shinglesTex() })),
      stone: lam("bwStone", () => ({ map: stoneTex() })),
      grave: lam("bwGrave", () => ({ color: "#9a9894" })),
      ticking: lam("bwTicking", () => ({ map: tickingTex() })),
      pillow: lam("bwPillow", () => ({ color: "#efe8da" })),
      quiltA: lam("bwQuiltA", () => ({ map: quiltTex("A", ["#8c3b4a", "#3f6fb5", "#d9a441", "#5d7a3a", "#e9dcc0"]) })),
      quiltB: lam("bwQuiltB", () => ({ map: quiltTex("B", ["#c25a7a", "#e9dcc0", "#5a8fc2", "#d9a441"]) })),
      wax: lam("bwWax", () => ({ color: "#f2ead2" })),
      pewter: lam("bwPewter", () => ({ color: "#a7a9b2" })),
      bark: lam("bwBark", () => ({ color: "#3a2e2a" })),
      paper: lam("bwPaper", () => ({ color: "#efe3c4" })),
      leather: lam("bwLeather", () => ({ color: "#6a2a24" })),
    };
    const glass = twoTone(new THREE.MeshPhongMaterial({ color: "#3d5a3a", specular: "#e6fff0", shininess: 120 }), 0.3);

    // ================= OUTSIDE =================
    const out = new Batch(), flat = new Batch();
    flat.add(floorQ(-160, 320, -160, 160, 6), M.grass);
    flat.add(floorQ(-0.9, 0.9, 5.3, 11.5, 2, 0.012), M.dirt);
    flat.add(floorQ(-6, 6, 4.8, 6.0, 2, 0.01), M.dirt);
    // house: log box, gables, two roof slopes with fascia, chimney, porch, door
    out.add(box(-4, 0, -3, 4, 3, 3, 2.4), M.logs);
    out.add(tri(V(4, 3, 3), V(4, 3, -3), V(4, 5, 0)), M.logs);
    out.add(tri(V(-4, 3, -3), V(-4, 3, 3), V(-4, 5, 0)), M.logs);
    out.add(quad(V(-4.6, 2.85, 3.7), V(4.6, 2.85, 3.7), V(4.6, 5, 0), V(-4.6, 5, 0), 9.2 / 1.2, 4.3 / 1.2), M.roof);
    out.add(quad(V(4.6, 2.85, -3.7), V(-4.6, 2.85, -3.7), V(-4.6, 5, 0), V(4.6, 5, 0), 9.2 / 1.2, 4.3 / 1.2), M.roof);
    out.add(box(-4.65, 2.7, 3.62, 4.65, 2.9, 3.78), M.woodDark);
    out.add(box(-4.65, 2.7, -3.78, 4.65, 2.9, -3.62), M.woodDark);
    out.add(box(-4.7, 4.92, -0.12, 4.7, 5.1, 0.12), M.woodDark); // ridge
    out.add(box(4.0, 0, -0.6, 4.9, 5.9, 0.6, 1.5), M.stone);
    out.add(box(-3.6, 0, 3, 3.6, 0.25, 4.8, 2), M.planks);
    out.add(box(-0.8, 0, 4.8, 0.8, 0.12, 5.3), M.planks);
    for (const x of [-3.45, -1.15, 1.15, 3.45]) out.add(box(x - 0.08, 0.25, 4.57, x + 0.08, 2.55, 4.73), M.wood);
    out.add(quad(V(-3.8, 2.5, 5.0), V(3.8, 2.5, 5.0), V(3.8, 2.8, 3.0), V(-3.8, 2.8, 3.0), 7.6 / 1.2, 2 / 1.2), M.roof);
    out.add(box(-3.8, 2.38, 4.9, 3.8, 2.52, 5.05), M.woodDark);
    out.add(box(-0.5, 0.25, 3.0, 0.5, 2.25, 3.07), M.woodDark);
    out.add(box(0.28, 1.1, 3.07, 0.36, 1.25, 3.12), M.pewter); // latch
    // windows (glowing panes are separate meshes so they can switch) + warm halo and light pool for each
    const win = (cx: number, cz: number, nx: number, nz: number) => {
      const w = 0.45, y0 = 1.25, y1 = 2.15;
      const tx = -nz, tz = nx; // along the wall
      const a = V(cx - tx * w + nx * 0.03, y0, cz - tz * w + nz * 0.03), b = V(cx + tx * w + nx * 0.03, y0, cz + tz * w + nz * 0.03);
      const g = quad(a, b, V(b.x, y1, b.z), V(a.x, y1, a.z));
      const mat = new THREE.MeshBasicMaterial({ color: "#000000", fog: true, side: THREE.DoubleSide });
      const m = new THREE.Mesh(g, mat); m.layers.set(NOINK); R.add(m);
      this.windows.push({ mat, on: new THREE.Color(2.6, 1.55, 0.6), off: new THREE.Color(0.012, 0.014, 0.03) });
      const h = halo(new THREE.Color(0.9, 0.5, 0.18), 2.6); h.position.set(cx + nx * 0.25, (y0 + y1) / 2, cz + nz * 0.25);
      const onPorch = nz > 0.5, pl = pool(new THREE.Color(0.6, 0.32, 0.1), 2.2, 1.7);
      pl.position.set(cx + nx * 1.1, onPorch ? 0.262 : 0.02, cz + nz * (onPorch ? 0.9 : 1.1));
      R.add(h, pl); this.winGlow.push({ h, p: pl });
      // frame + cross bars + shutters
      const fr = (x0: number, y0b: number, z0: number, x1: number, y1b: number, z1: number) => out.add(box(Math.min(x0, x1), y0b, Math.min(z0, z1), Math.max(x0, x1), y1b, Math.max(z0, z1)), M.woodDark);
      const ox = nx * 0.06, oz = nz * 0.06;
      fr(cx - tx * (w + 0.06), y0 - 0.08, cz - tz * (w + 0.06), cx + tx * (w + 0.06) + ox, y0, cz + tz * (w + 0.06) + oz);
      fr(cx - tx * (w + 0.06), y1, cz - tz * (w + 0.06), cx + tx * (w + 0.06) + ox, y1 + 0.08, cz + tz * (w + 0.06) + oz);
      fr(cx - tx * 0.03, y0, cz - tz * 0.03, cx + tx * 0.03 + ox, y1, cz + tz * 0.03 + oz);
      fr(cx - tx * w, (y0 + y1) / 2 - 0.03, cz - tz * w, cx + tx * w + ox, (y0 + y1) / 2 + 0.03, cz + tz * w + oz);
      for (const s of [-1, 1]) {
        const sx = cx + tx * s * (w + 0.36), sz = cz + tz * s * (w + 0.36);
        out.add(box(Math.min(sx - tx * 0.28, sx + tx * 0.28 + ox * 0.5), y0 - 0.05, Math.min(sz - tz * 0.28, sz + tz * 0.28 + oz * 0.5),
          Math.max(sx - tx * 0.28, sx + tx * 0.28 + ox * 0.5), y1 + 0.05, Math.max(sz - tz * 0.28, sz + tz * 0.28 + oz * 0.5)), M.wood);
      }
    };
    win(-2.3, 3, 0, 1); win(2.3, 3, 0, 1); win(-4, 0, -1, 0); win(4, -1.6, 1, 0);
    // porch lantern by the door, rocking chair
    const pm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.6, 0.6) }));
    pm.position.set(0.95, 2.0, 3.2); pm.layers.set(NOINK);
    out.add(box(0.93, 2.12, 3.0, 0.97, 2.4, 3.22), M.woodDark);
    const ph = halo(new THREE.Color(0.95, 0.55, 0.2), 1.6); ph.position.copy(pm.position);
    const pp = pool(new THREE.Color(0.55, 0.3, 0.1), 2.4, 2.0); pp.position.set(0.95, 0.262, 3.9);
    R.add(pm, ph, pp); this.porch = { m: pm, h: ph, p: pp };
    out.add(box(-1.55, 0.25, 3.9, -0.95, 0.7, 4.4), M.wood); out.add(box(-1.55, 0.7, 3.88, -0.95, 1.3, 3.95), M.wood);
    out.add(box(-1.6, 0.25, 3.85, -1.55, 0.3, 4.5), M.woodDark); out.add(box(-0.95, 0.25, 3.85, -0.9, 0.3, 4.5), M.woodDark);
    // split-rail fence along the yard front (gap at the path) and up the sides
    const fence = (x0: number, z0: number, x1: number, z1: number) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.4));
      for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n; out.add(box(x - 0.07, 0, z - 0.07, x + 0.07, 1.15, z + 0.07), M.wood); }
      for (const y of [0.5, 0.95]) {
        const dx = (x1 - x0) / L, dz = (z1 - z0) / L;
        const g = box(-L / 2, y - 0.05, -0.04, L / 2, y + 0.05, 0.04);
        g.rotateY(-Math.atan2(dz, dx)); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
        out.add(g, M.wood);
      }
    };
    fence(-14, 11.5, -1.3, 11.5); fence(1.3, 11.5, 14, 11.5); fence(-14, 11.5, -14, -6); fence(14, 11.5, 14, -6);
    // woodpile + chopping block by the chimney side
    for (let i = 0; i < 9; i++) out.add(cyl(0.12, 1.2, 0, 0, 0, 10).rotateZ(Math.PI / 2).translate(6.0, 0.13 + 0.22 * Math.floor(i / 3), 1.4 + 0.25 * (i % 3) + 0.12 * Math.floor(i / 3)), M.wood);
    out.add(cyl(0.3, 0.5, 6.3, 0, 3.2), M.wood);
    // ---- graveyard ----
    const [gx, , gz] = GRAVE;
    const stone = (x: number, z: number, w: number, h: number, tilt: number, big = false) => {
      const g = box(-w / 2, 0, -0.08, w / 2, h - w / 2, 0.08);
      const top = new THREE.CylinderGeometry(w / 2, w / 2, 0.16, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, h - w / 2, 0);
      const t2 = top.toNonIndexed();
      g.rotateZ(tilt); t2.rotateZ(tilt);
      g.translate(gx + x, 0, gz + z); t2.translate(gx + x, 0, gz + z);
      out.add(g, M.grave); out.add(t2, M.grave);
      if (big) out.add(box(gx + x - 0.45, 0, gz + z + 0.15, gx + x + 0.45, 0.07, gz + z + 1.9), M.dirt);
    };
    stone(0, 0, 0.72, 1.05, 0, true);
    stone(-1.7, -1.3, 0.55, 0.8, 0.06); stone(1.6, -1.1, 0.5, 0.75, -0.08); stone(-2.8, 0.4, 0.5, 0.7, 0.1);
    stone(2.9, 0.2, 0.55, 0.85, 0.04); stone(-0.9, -2.8, 0.5, 0.7, -0.05); stone(1.1, -3.0, 0.45, 0.65, 0.12);
    for (let i = -4; i <= 4; i++) out.add(box(gx + i * 1.1 - 0.05, 0, gz - 4.6 - 0.05, gx + i * 1.1 + 0.05, 0.9, gz - 4.6 + 0.05), M.woodDark);
    out.add(box(gx - 4.4, 0.62, gz - 4.65, gx + 4.4, 0.7, gz - 4.55), M.woodDark);
    // dead tree: trunk + forked branches (the owl sits on the left fork)
    const limb = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r: number) => {
      const a = V(x0, y0, z0), b = V(x1, y1, z1), L = a.distanceTo(b);
      const g = new THREE.CylinderGeometry(r * 0.6, r, L, 8).translate(0, L / 2, 0);
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize())));
      g.translate(x0, y0, z0); out.add(g, M.bark);
    };
    const tx0 = gx + 3.6, tz0 = gz - 3.8;
    limb(tx0, 0, tz0, tx0 + 0.2, 3.2, tz0, 0.28); limb(tx0 + 0.2, 3.0, tz0, tx0 - 1.4, 4.6, tz0 + 0.3, 0.13); limb(tx0 + 0.2, 2.6, tz0, tx0 + 1.6, 4.0, tz0 - 0.2, 0.12);
    limb(tx0 - 1.0, 4.2, tz0 + 0.2, tx0 - 1.8, 4.5, tz0 + 0.9, 0.05); limb(tx0 + 1.2, 3.7, tz0, tx0 + 2.0, 4.6, tz0 + 0.4, 0.05); limb(tx0 + 0.2, 3.2, tz0, tx0 + 0.5, 5.0, tz0, 0.08);
    // trees: near the house, around the yard, a treeline beyond the graveyard, a few outside the bedroom window
    const trees: [string, number, number, number][] = [
      ["tree_oak", -11, 0.5, 7.5], ["tree_fat", 8.5, -8, 8], ["tree_oak", -15, 3, 6.5], ["tree_default", 15.5, 1, 7], ["tree_cone", -5, -15, 9],
      ["tree_oak", 5, -16, 8.5], ["tree_fat", -21, -9, 8], ["tree_oak", 19, -12, 9], ["tree_cone", -24, 6, 8], ["tree_oak", 23, 8, 7.5],
      ["tree_oak", gx - 6, gz - 7, 9], ["tree_cone", gx - 1, gz - 9, 10], ["tree_fat", gx + 5, gz - 10, 9], ["tree_cone", gx - 10, gz - 2, 9],
      ["tree_oak", gx + 10, gz - 6, 8], ["tree_cone", gx - 4, gz - 13, 11], ["tree_oak", gx + 1, gz - 15, 10],
      ["tree_cone", X0 - 3, -12, 8], ["tree_oak", X0 + 2.5, -14, 9], ["tree_fat", X0 + 7, -11, 7],
    ];
    for (const [n, x, z, h] of trees) { const t = kitClone(kit, n, h); if (t) { t.position.set(x, 0, z); t.rotation.y = (x * 7 + z) % 6; t.traverse((c) => { c.castShadow = true; }); R.add(t); } }
    for (let i = 0; i < 26; i++) { // far ring
      const a = (i / 26) * Math.PI * 2, d = 60 + (i % 3) * 14, t = kitClone(kit, i % 3 ? "tree_oak" : "tree_cone", 9 + (i % 4) * 2);
      if (t) { t.position.set(Math.cos(a) * d, 0, Math.sin(a) * d - 10); R.add(t); }
    }

    // ================= INSIDE: the bedroom (x 196..204, z -3..3, h 2.8) =================
    const shell = new Batch(), inn = new Batch();
    const x0 = X0 - 4, x1 = X0 + 4, zb = -3, zf = 3, H = 2.8, wx0 = X0 - 0.6, wx1 = X0 + 0.6, wy0 = 1.3, wy1 = 2.15;
    shell.add(floorQ(x0, x1, zb, zf, 2, 0.002), M.planks);
    shell.add(quad(V(x0, H, zb), V(x1, H, zb), V(x1, H, zf), V(x0, H, zf), 4, 3), M.planks);
    shell.add(wallQ(x0, zb, wx0, zb, 0, H, 2.4), M.logsIn); shell.add(wallQ(wx1, zb, x1, zb, 0, H, 2.4), M.logsIn);
    shell.add(wallQ(wx0, zb, wx1, zb, 0, wy0, 2.4), M.logsIn); shell.add(wallQ(wx0, zb, wx1, zb, wy1, H, 2.4), M.logsIn);
    shell.add(wallQ(x1, zf, x0, zf, 0, H, 2.4), M.logsIn);
    shell.add(wallQ(x0, zf, x0, zb, 0, H, 2.4), M.logsIn);
    shell.add(wallQ(x1, zb, x1, zf, 0, H, 2.4), M.logsIn);
    for (const z of [-2, -0.5, 1, 2.5]) inn.add(box(x0, H - 0.22, z - 0.12, x1, H, z + 0.12), M.wood); // ceiling beams
    // window frame + sill + cross
    inn.add(box(wx0 - 0.08, wy0 - 0.1, zb, wx1 + 0.08, wy0, zb + 0.14), M.woodDark);
    inn.add(box(wx0 - 0.08, wy1, zb, wx1 + 0.08, wy1 + 0.08, zb + 0.08), M.woodDark);
    inn.add(box(wx0 - 0.08, wy0, zb, wx0, wy1, zb + 0.08), M.woodDark); inn.add(box(wx1, wy0, zb, wx1 + 0.08, wy1, zb + 0.08), M.woodDark);
    inn.add(box(X0 - 0.03, wy0, zb, X0 + 0.03, wy1, zb + 0.05), M.woodDark);
    inn.add(box(wx0, (wy0 + wy1) / 2 - 0.025, zb, wx1, (wy0 + wy1) / 2 + 0.025, zb + 0.05), M.woodDark);
    // beds: big bed (John & Lucy) x 196.5..199, Betsy's bed x 201.4..203
    const bed = (bx0: number, bx1: number, bz0: number, bz1: number, hb = 1.35) => {
      for (const [x, z, h] of [[bx0, bz0, hb], [bx1 - 0.1, bz0, hb], [bx0, bz1 - 0.1, 0.75], [bx1 - 0.1, bz1 - 0.1, 0.75]] as const) inn.add(box(x, 0, z, x + 0.1, h, z + 0.1), M.wood);
      inn.add(box(bx0, 0.55, bz0 + 0.02, bx1, hb - 0.12, bz0 + 0.08), M.wood);            // headboard
      inn.add(box(bx0, 0.3, bz0, bx1, 0.48, bz1), M.wood);                                  // frame
      inn.add(box(bx0 + 0.05, 0.48, bz0 + 0.08, bx1 - 0.05, 0.72, bz1 - 0.02), M.ticking);  // mattress
      inn.add(box(bx0 + 0.15, 0.72, bz0 + 0.12, bx0 + (bx1 - bx0) / 2 - 0.05, 0.86, bz0 + 0.5), M.pillow);
      inn.add(box(bx0 + (bx1 - bx0) / 2 + 0.05, 0.72, bz0 + 0.12, bx1 - 0.15, 0.86, bz0 + 0.5), M.pillow);
    };
    bed(X0 - 3.5, X0 - 1.0, -3, -0.9);
    inn.add(box(X0 - 3.48, 0.72, -2.35, X0 - 1.02, 0.8, -0.86), M.quiltA);
    bed(X0 + 1.4, X0 + 3.0, -3, -1.1, 1.15);
    this.quiltB = new THREE.Mesh(box(-0.8, -0.04, -0.6, 0.8, 0.04, 0.6), M.quiltB);
    this.quiltB.castShadow = true; this.quiltB.receiveShadow = true; R.add(this.quiltB);
    this.quiltJ = new THREE.Mesh(box(-1.2, 0, -0.6, 1.2, 0.3, 0.6), M.quiltA); // over John lying down (bed runs along z)
    this.quiltJ.castShadow = true; this.quiltJ.receiveShadow = true; this.quiltJ.visible = false; R.add(this.quiltJ);
    // nightstand + candle (between the beds, under the window), crate by Betsy's bed with a second candle
    inn.add(box(X0 - 0.5, 0, -2.95, X0 + 0.5, 0.75, -2.45), M.wood);
    inn.add(box(X0 - 0.55, 0.75, -3.0, X0 + 0.55, 0.8, -2.4), M.woodDark);
    inn.add(cyl(0.09, 0.03, X0 - 0.3, 0.8, -2.72), M.pewter); inn.add(cyl(0.035, 0.12, X0 - 0.3, 0.83, -2.72), M.wax);
    inn.add(box(X0 + 3.3, 0, -2.9, X0 + 3.85, 0.55, -2.4), M.wood);
    inn.add(cyl(0.03, 0.1, X0 + 3.55, 0.55, -2.65), M.wax);
    // table + benches, a stone hearth on the right wall
    inn.add(box(X0 + 1.2, 0.72, 0.8, X0 + 3.4, 0.8, 1.8), M.wood);
    for (const [x, z] of [[1.3, 0.9], [3.2, 0.9], [1.3, 1.6], [3.2, 1.6]]) inn.add(box(X0 + x, 0, z, X0 + x + 0.1, 0.72, z + 0.1), M.woodDark);
    inn.add(box(X0 + 1.2, 0.42, 0.15, X0 + 3.4, 0.48, 0.5), M.wood); inn.add(box(X0 + 1.2, 0.42, 2.1, X0 + 3.4, 0.48, 2.45), M.wood);
    inn.add(box(X0 + 3.4, 0, -0.4, X0 + 4, 1.6, 0.9, 1.5), M.stone); inn.add(box(X0 + 3.3, 1.6, -0.5, X0 + 4, 1.7, 1.0), M.woodDark);
    // detail: rug, shelf with jars, rifle over the hearth, sampler, boots, bible, cobwebs
    inn.add(quad(V(X0 - 1.2, 0.004, 1.1), V(X0 + 1.8, 0.004, 1.1), V(X0 + 1.8, 0.004, -0.9), V(X0 - 1.2, 0.004, -0.9)), lam("bwRug", () => ({ map: rugTex() })));
    inn.add(box(X0 - 4, 1.62, -0.7, X0 - 3.7, 1.67, 1.0), M.wood);
    for (let k = 0; k < 4; k++) inn.add(box(X0 - 3.98, 1.5, -0.6 + k * 0.5, X0 - 3.93, 1.62, -0.56 + k * 0.5), M.woodDark);
    ["#d8cba8", "#8a5a3a", "#5d7a5a", "#c9b07a", "#6a4a6a", "#d8cba8"].forEach((c, k) => {
      const h = 0.14 + (0.1 * ((k * 7) % 3)) / 2, rr = 0.06 + 0.02 * (k % 2), z = -0.55 + k * 0.27;
      inn.add(cyl(rr, h, X0 - 3.84, 1.67, z, 12), lam("bwJar" + c, () => ({ color: c })));
      if (k % 2) inn.add(cyl(rr * 0.4, 0.06, X0 - 3.84, 1.67 + h, z, 8), M.woodDark);
    });
    inn.add(box(X0 + 3.88, 1.94, -0.45, X0 + 3.93, 1.98, 0.95), M.woodDark);
    inn.add(box(X0 + 3.86, 1.88, 0.62, X0 + 3.95, 2.02, 0.98), M.wood);
    for (const z of [-0.2, 0.7]) inn.add(box(X0 + 3.92, 1.9, z, X0 + 4, 1.93, z + 0.05), M.woodDark);
    inn.add(box(X0 + 1.92, 1.52, -3.0, X0 + 2.58, 2.08, -2.96), M.woodDark);
    inn.add(quad(V(X0 + 1.97, 1.57, -2.955), V(X0 + 2.53, 1.57, -2.955), V(X0 + 2.53, 2.03, -2.955), V(X0 + 1.97, 2.03, -2.955)), lam("bwSampler", () => ({ map: samplerTex() })));
    for (const dx of [0, 0.16]) inn.add(box(X0 - 0.95 + dx, 0, -0.75, X0 - 0.83 + dx, 0.22, -0.5), M.leather);
    inn.add(box(X0 + 0.2, 0.8, -2.86, X0 + 0.44, 0.86, -2.64), lam("bwBible", () => ({ color: "#1e1a22" })));
    for (const [x, ry] of [[X0 - 3.72, Math.PI / 4], [X0 + 3.72, -Math.PI / 4]] as const) {
      const web = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ map: cobwebTex(), color: new THREE.Color(0.55, 0.55, 0.62), alphaTest: 0.3, side: THREE.DoubleSide, fog: true }));
      web.position.set(x, 2.4, -2.72); web.rotation.y = ry; web.layers.set(NOINK); R.add(web);
    }
    // hearth: firebox opening, logs, fire glow (flames are cards in stage.ts)
    const fb = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#120a08" }));
    fb.position.set(X0 + 3.393, 0.44, 0.25); fb.layers.set(NOINK); R.add(fb);
    for (const dz of [-0.12, 0.1]) inn.add(cyl(0.06, 0.5, 0, 0, 0, 10).rotateX(Math.PI / 2).translate(X0 + 3.48, 0.12, 0.25 + dz), M.wood);
    const fh = halo(new THREE.Color(1.0, 0.45, 0.12), 1.9); fh.position.set(X0 + 3.25, 0.45, 0.25);
    const fp = pool(new THREE.Color(0.6, 0.25, 0.06), 2.0, 2.0); fp.position.set(X0 + 2.7, 0.006, 0.25);
    R.add(fh, fp); this.hearth.push(fh);
    for (const [x, y, z, s] of [[X0 - 0.3, 1.0, -2.72, 0.8], [X0 + 3.55, 0.7, -2.65, 0.7]] as const) {
      const h = halo(new THREE.Color(1.0, 0.6, 0.22), s); h.position.set(x, y, z); R.add(h); this.candleHalos.push(h);
    }
    // chair (tips over in shot 5)
    this.chair = new THREE.Group();
    const cb = new Batch();
    cb.add(box(-0.22, 0.42, -0.22, 0.22, 0.47, 0.22), M.wood);
    for (const [x, z] of [[-0.2, -0.2], [0.16, -0.2], [-0.2, 0.16], [0.16, 0.16]]) cb.add(box(x, 0, z, x + 0.05, 0.42, z + 0.05), M.woodDark);
    cb.add(box(-0.22, 0.47, -0.22, 0.22, 1.0, -0.17), M.wood);
    cb.build(this.chair); R.add(this.chair);
    // vial, saucer, book + quill, plates
    this.vial = new THREE.Group();
    const vg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.11, 16).translate(0, 0.055, 0), glass);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.04, 12).translate(0, 0.13, 0), glass);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.03, 10).translate(0, 0.16, 0), M.wood);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.075, 16).translate(0, 0.04, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.06, 0.02) }));
    this.vial.add(vg, neck, cork, liquid); this.vial.position.set(X0 + 0.05, 0.8, -2.66); this.vial.scale.setScalar(1.25); R.add(this.vial);
    this.saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.025, 20).translate(0, 0.0125, 0), M.pewter);
    this.saucer.position.set(X0 - 0.25, 0, -1.75); R.add(this.saucer);
    this.book = new THREE.Group();
    const bkb = new Batch();
    bkb.add(box(-0.25, 0, -0.17, 0.25, 0.04, 0.17), M.leather); bkb.add(box(-0.23, 0.04, -0.15, -0.01, 0.06, 0.15), M.paper); bkb.add(box(0.01, 0.04, -0.15, 0.23, 0.06, 0.15), M.paper);
    bkb.add(cyl(0.035, 0.05, 0.36, 0, -0.08), M.woodDark);
    const quill = box(-0.008, 0, -0.008, 0.008, 0.32, 0.008); quill.rotateZ(-0.5); quill.translate(0.36, 0.04, -0.08); bkb.add(quill, M.paper);
    bkb.build(this.book); this.book.position.set(X0 + 2.3, 0.8, 1.1); R.add(this.book);
    this.plates = new THREE.Group();
    const pb = new Batch();
    for (const x of [1.6, 2.3, 3.0]) { pb.add(cyl(0.13, 0.02, x, 0, 0.95), M.pewter); pb.add(cyl(0.04, 0.12, x + 0.18, 0, 1.15), M.pewter); }
    pb.build(this.plates); this.plates.position.set(X0, 0.8, 0); R.add(this.plates);
    // lanterns carried by neighbours, each with a halo and a light pool
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.55) }));
      m.visible = false; m.layers.set(NOINK); this.lanterns.push(m); R.add(m);
      const h = halo(new THREE.Color(0.95, 0.55, 0.2), 1.4), p = pool(new THREE.Color(0.5, 0.28, 0.09), 2.0, 2.0);
      h.visible = p.visible = false; R.add(h, p); this.lanternGlow.push({ h, p });
    }
    // atmosphere layer (fx3d.ts)
    this.atmos = new Atmos(moonTex(), [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.night.cloud)));
    R.add(this.atmos.group);
    flat.build(R, false); out.build(R, true); shell.build(R, false); inn.build(R, true);
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  /** camera-relative key light, frozen per shot (opening view direction turned by az, lifted by el) */
  private sunFor(s: Shot) {
    let v = this.sunCache.get(s.id);
    if (v) return v;
    const c = camAt(s, s.a), fx0 = c.look[0] - c.pos[0], fz0 = c.look[2] - c.pos[2], n = Math.hypot(fx0, fz0) || 1, fx = fx0 / n, fz = fz0 / n;
    const L = presetOf(s), ae = (s.light === "candle" ? SUN_INT[s.id] : SUN_EXT[s.id]) ?? [L.az, L.el];
    const az = THREE.MathUtils.degToRad(ae[0]), el = THREE.MathUtils.degToRad(ae[1]);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(s.id, v);
    return v;
  }
  /** moon direction for an outdoor shot, placed in the opening frame by MOON_FRAME / MOON_SHOT (moon.ts) */
  private moonFor(s: Shot) {
    let v = this.moonCache.get(s.id);
    if (v) return v;
    const c = camAt(s, s.a), fw = V(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]).normalize();
    const right = V(0, 0, 0).crossVectors(fw, V(0, 1, 0)).normalize(), up = V(0, 0, 0).crossVectors(right, fw).normalize();
    const tv = Math.tan(THREE.MathUtils.degToRad(c.fov / 2)), th = (tv * 9) / 16, P = { ...MOON_FRAME, ...MOON_SHOT[s.id] };
    v = fw.clone().addScaledVector(up, tv * P.up).addScaledVector(right, th * P.right).normalize();
    const minY = Math.sin(THREE.MathUtils.degToRad(P.minEl));
    if (v.y < minY) { v.y = minY; v.normalize(); }
    this.moonCache.set(s.id, v);
    return v;
  }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = shotAt(f), c = camAt(s, f), L = presetOf(s), t = f / FPS, outside = s.light === "night";
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus), sunDir = this.sunFor(s);
    // ---- light rig ----
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.2 + 4, 6, outside ? 40 : 10);
    this.sun.position.copy(focus).addScaledVector(sunDir, 120); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = LOOK.night.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const rim = outside ? RIM_NIGHT : RIM_CANDLE; CHAR.uRimK.value = rim[0]; CHAR.uRimCol.value.set(...rim[1]);
    // ---- sky, fog ----
    const K = LOOK.night, su = this.skyMat.uniforms;
    [su.c0, su.c1, su.c2, su.c3, su.c4].forEach((u, i) => untone(K.sky.c[i], u.value as THREE.Color));
    const e = K.sky.e.map((d) => THREE.MathUtils.degToRad(d)); (su.e.value as THREE.Vector4).set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    // ---- staged props + cast ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(f, s, { pos: cam.position, right, sun: sunDir });
    this.pose(st.props, t);
    // ---- light + atmosphere layer ----
    this.atmos.update(f, outside, cam, this.moonFor(s), s.id, [1, 19, 24, 25].includes(s.id), s.id >= 24);
    this.winGlow.forEach((g, i) => {
      const on = st.props.windows[i] ?? 0; g.h.visible = g.p.visible = outside && on > 0.05;
      g.h.material.opacity = on; (g.p.material as THREE.MeshBasicMaterial).opacity = on;
    });
    const pon = outside ? st.props.windows[0] ?? 0 : 0;
    (this.porch.m.material as THREE.MeshBasicMaterial).color.setRGB(2.6 * pon + 0.02, 1.6 * pon + 0.02, 0.6 * pon + 0.03);
    this.porch.h.visible = this.porch.p.visible = pon > 0.05;
    this.lanternGlow.forEach((g, i) => {
      const l = st.props.lanterns[i]; g.h.visible = g.p.visible = !!l;
      if (l) {
        g.h.position.set(l[0], l[1], l[2]); g.h.scale.setScalar(1.4 * (1 + 0.06 * Math.sin(f * 0.8 + i * 2)));
        const onPorch = Math.abs(l[0]) < 3.6 && l[2] > 3 && l[2] < 4.8; g.p.position.set(l[0], onPorch ? 0.262 : 0.02, l[2]);
      }
    });
    const candleOn = !outside && !(f >= 1176 && f < 1196);
    this.candleHalos.forEach((h, i) => { h.visible = i === 1 ? !outside : candleOn; h.scale.setScalar((i ? 0.7 : 0.8) * (1 + 0.05 * Math.sin(f * 1.3 + i))); });
    this.hearth.forEach((h) => { h.visible = !outside; h.scale.setScalar(1.9 * (1 + 0.08 * Math.sin(f * 0.9) + 0.05 * Math.sin(f * 2.1))); });
    // ---- cards ----
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3))) continue;
      const a = this.actor(ai++), [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const fxm = this.fx(fi++);
      fxm.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      fxm.use(!!p.soft); fxm.mesh.visible = true; fxm.mesh.position.set(p.x, p.y, p.z);
      fxm.mesh.quaternion.copy(cam.quaternion); fxm.mesh.rotateZ(p.rot ?? 0);
      fxm.mesh.scale.set(p.w, p.h, 1);
      const gl = p.glow ?? 1; fxm.mat.color.setScalar(gl); fxm.soft.color.setScalar(gl);
      fused.push(fxm);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const x of fused) x.bind();
    return st.focus ? V(...st.focus) : focus;
  }

  /** per-frame prop states from the stage */
  private pose(p: Props, t: number) {
    p.windows.forEach((on, i) => { const w = this.windows[i]; if (w) w.mat.color.copy(w.off).lerp(w.on, on); });
    const q = p.quiltB; // 0 on the bed .. 1 on the floor in front of it
    this.quiltB.position.set(X0 + 2.2, 0.78 - 0.74 * q * q, -2.0 + 1.25 * q);
    this.quiltB.rotation.set(0.35 * Math.sin(Math.PI * q), 0, -0.12 * q);
    this.quiltJ.visible = p.johnLying; this.quiltJ.position.set(X0 - 2.25, 0.72, -1.5);
    this.chair.position.set(X0 - 1.0, 0, 0.3);
    this.chair.rotation.set(0, 0.4, p.chairDown * (Math.PI / 2 - 0.05));
    if (p.chairDown > 0) this.chair.position.y = 0.2 * Math.sin(Math.PI * Math.min(1, p.chairDown));
    this.vial.visible = p.vial; this.saucer.visible = p.saucer; this.book.visible = p.book; this.plates.visible = p.plates;
    this.lanterns.forEach((m, i) => {
      const l = p.lanterns[i];
      m.visible = !!l;
      if (l) { m.position.set(l[0], l[1] + 0.02 * Math.sin(t * 5 + i), l[2]); m.rotation.y = 0.3 * i; }
    });
  }
}
