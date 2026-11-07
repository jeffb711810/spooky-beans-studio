// SETS + PROPS (owner: sets agent; the light rig values come from moon.ts / candle.ts, the glows from fx3d.ts).
// The Bell farm: one three.js world posed per frame. Outside: log farmhouse at the origin (front faces +z), porch,
// split-rail fence, yard, trees, hillside graveyard at GRAVE. Inside: a closed log bedroom centred on x = X0
// (beds, quilts, nightstand with candle and vial, table, hearth). Same look toolkit as the bridge: two-tone lit
// materials, painted canvas textures, ink pass, lit character cards, tone-map-inverted sky/fog colours.
import * as THREE from "three";
import { Batch, V, lam, boxGeo, quad, tri, kitClone, Kit } from "../bridge/build";
import { planksHD, grassHD, cloudHD } from "../bridge/paint";
import { TONE, CHAR, POOL, twoTone, untone } from "../bridge/shade";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { LOOK, LightPreset } from "../bridge/lights";
import { logsTex, quiltTex, shinglesTex, dirtTex, tickingTex, stoneTex, moonTex, rugTex, samplerTex } from "./textures";
import { Atmos, halo, pool, cobwebTex } from "./fx3d";
import { NIGHT, RIM_NIGHT, SUN_EXT, MOON_FRAME, MOON_SHOT, NIGHT_SAT } from "./moon";
import { CANDLE, RIM_CANDLE, SUN_INT, POOLS } from "./candle";
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

const ss = THREE.MathUtils.smoothstep;
/** soft draped quilt: a subdivided top surface y = h(x, z) over [x0,x1] x [z0,z1] plus skirts hanging `drop` below it on
 *  all four edges. UVs keep the whole quilt texture: the top fills [m, 1-m], the skirts take the border margins. */
const drape = (x0: number, x1: number, z0: number, z1: number, h: (x: number, z: number) => number, drop: number, nx = 40, nz = 44) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [], m = 0.07;
  const U = (x: number) => m + (1 - 2 * m) * (x - x0) / (x1 - x0), Vv = (z: number) => m + (1 - 2 * m) * (z - z0) / (z1 - z0);
  const grid = (W: number, H: number, P: (i: number, j: number) => number[]) => {
    const b = pos.length / 3;
    for (let j = 0; j <= H; j++) for (let i = 0; i <= W; i++) { const [x, y, z, u, v] = P(i, j); pos.push(x, y, z); uv.push(u, v); }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const a = b + j * (W + 1) + i, c = a + W + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  };
  const X = (i: number) => x0 + ((x1 - x0) * i) / nx, Z = (j: number) => z0 + ((z1 - z0) * j) / nz, ns = 4;
  grid(nx, nz, (i, j) => [X(i), h(X(i), Z(j)), Z(j), U(X(i)), Vv(Z(j))]);                                   // top, faces +y
  grid(nx, ns, (i, j) => { const x = X(i), k = j / ns; return [x, h(x, z1) - drop * k, z1 + 0.012 * k, U(x), 1 - m + m * k]; });  // foot, +z
  grid(nx, ns, (i, j) => { const x = X(nx - i), k = j / ns; return [x, h(x, z0) - drop * k, z0 - 0.012 * k, U(x), m - m * k]; }); // head, -z
  grid(nz, ns, (i, j) => { const z = Z(i), k = j / ns; return [x0 - 0.012 * k, h(x0, z) - drop * k, z, m - m * k, Vv(z)]; });       // left, -x
  grid(nz, ns, (i, j) => { const z = Z(nz - i), k = j / ns; return [x1 + 0.012 * k, h(x1, z) - drop * k, z, 1 - m + m * k, Vv(z)]; }); // right, +x
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
};
/** small cloth wrinkles + rounded edges for a drape over [x0,x1] */
const cloth = (x: number, z: number, x0: number, x1: number) =>
  0.012 * Math.sin(x * 7.3 + z * 3.1) + 0.008 * Math.sin(x * 13.7 - z * 9.2) - 0.045 * (1 - ss(Math.min(x - x0, x1 - x), 0, 0.12));

export type Lit = { mat: THREE.MeshBasicMaterial; on: THREE.Color; off: THREE.Color };

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private rrCache = new Map<number, number>();
  private sc0 = new THREE.Vector3();
  private fxs: Fx[] = [];
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private sun: THREE.DirectionalLight; private hemi: THREE.HemisphereLight;
  private fog = new THREE.Fog("#000000", 10, 100);
  private sunCache = new Map<number, THREE.Vector3>();
  private moonCache = new Map<number, THREE.Vector3>();
  private windows: Lit[] = [];          // farmhouse windows (front L, front R, side L, side R)
  private winGlow: { h: THREE.Sprite; p: THREE.Mesh }[] = [];
  private quiltA: THREE.Mesh;           // the big bed's quilt, bunched over the laps of whoever sits up in it
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
    // grass everywhere EXCEPT under the bedroom (x 196..204, z -3..3): its floor sat 2 mm above the grass and the two
    // z-fought (green flicker through the floorboards)
    flat.add(floorQ(-160, 195.5, -160, 160, 6), M.grass); flat.add(floorQ(204.5, 320, -160, 160, 6), M.grass);
    flat.add(floorQ(195.5, 204.5, -160, -3.5, 6), M.grass); flat.add(floorQ(195.5, 204.5, 3.5, 160, 6), M.grass);
    flat.add(floorQ(-0.9, 0.9, 5.3, 11.5, 2, 0.03), M.dirt);
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
      this.windows.push({ mat, on: new THREE.Color(4.2, 2.5, 0.95), off: new THREE.Color(0.012, 0.014, 0.03) });
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
    const pm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 2.6, 0.95) }));
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
    // ---- set dressing (sets pass): notched log ends, purlins, chimney cap, door ironwork, porch chores, yard props ----
    const D = {
      logEnd: lam("bwLogEnd", () => ({ color: "#7e5a3e" })),
      grain: lam("bwEndGrain", () => ({ color: "#c09464" })),
      iron: lam("bwIron", () => ({ color: "#36323a" })),
      hay: lam("bwHay", () => ({ color: "#c9a550" })),
      hayDark: lam("bwHayDark", () => ({ color: "#94763a" })),
      pumpkin: lam("bwPumpkin", () => ({ color: "#d8782c" })),
      corn: lam("bwCorn", () => ({ color: "#dcb24c" })),
      stem: lam("bwStem", () => ({ color: "#56662e" })),
      water: lam("bwWellWater", () => ({ color: "#0c0e16" })),
    };
    /** round log stub from (x,y,z) running len outward along +-x or +-z (s = sign), pale end-grain cap on the end */
    const stub = (b: Batch, x: number, y: number, z: number, ax: "x" | "z", s: number, len: number, r: number, side = D.logEnd) => {
      const g = new THREE.CylinderGeometry(r, r, len, 12, 1, true), cap = new THREE.CircleGeometry(r * 0.96, 12);
      if (ax === "x") { g.rotateZ(Math.PI / 2).translate(x + (s * len) / 2, y, z); cap.rotateY((s * Math.PI) / 2).translate(x + s * (len + 0.003), y, z); }
      else { g.rotateX(Math.PI / 2).translate(x, y, z + (s * len) / 2); if (s < 0) cap.rotateY(Math.PI); cap.translate(x, y, z + s * (len + 0.003)); }
      b.add(g, side); b.add(cap, D.grain);
    };
    // saddle-notched corners: front/back-wall logs poke past the gable walls, gable-wall logs half a course higher
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      for (let k = 0; k < 10; k++) stub(out, 4 * sx, 0.15 + 0.3 * k, 3 * sz - 0.035 * sz, "x", sx, 0.34 + 0.03 * ((k * 5 + sx + sz) % 3), 0.14);
      for (let k = 0; k < 9; k++) stub(out, 4 * sx - 0.035 * sx, 0.3 + 0.3 * k, 3 * sz, "z", sz, 0.32 + 0.03 * ((k * 7 + sx) % 3), 0.14);
    }
    // purlin + ridge-pole ends under the eaves of both gables
    for (const sx of [-1, 1]) {
      for (const [z, y] of [[0.9, 4.38], [-0.9, 4.38], [1.9, 3.71], [-1.9, 3.71]]) stub(out, 4 * sx, y, z, "x", sx, 0.5, 0.11);
      stub(out, 4 * sx, 4.8, 0, "x", sx, 0.55, 0.12);
    }
    // chimney: wide firebox base with a sloped shoulder, cap stone and a dark flue
    out.add(box(4.0, 0, -0.62, 5.2, 1.9, 0.62, 1.5), M.stone);
    out.add(quad(V(5.2, 1.9, 0.62), V(5.2, 1.9, -0.62), V(4.9, 2.4, -0.62), V(4.9, 2.4, 0.62)), M.stone);
    out.add(tri(V(5.2, 1.9, 0.62), V(4.9, 2.4, 0.62), V(4.9, 1.9, 0.62)), M.stone);
    out.add(tri(V(5.2, 1.9, -0.62), V(4.9, 1.9, -0.62), V(4.9, 2.4, -0.62)), M.stone);
    out.add(box(3.92, 5.9, -0.68, 4.98, 6.02, 0.68), M.stone);
    out.add(box(4.14, 6.02, -0.42, 4.76, 6.04, 0.42), D.iron);
    // door: plank boards, battens, strap hinges, latch bar, frame; a horseshoe over it (luck held in, opening up)
    for (let i = 0; i < 4; i++) out.add(box(-0.48 + i * 0.242, 0.27, 3.07, -0.48 + i * 0.242 + 0.225, 2.23, 3.095), M.wood);
    for (const y of [0.55, 1.85]) {
      out.add(box(-0.46, y, 3.095, 0.46, y + 0.1, 3.115), M.woodDark);
      out.add(box(-0.5, y + 0.03, 3.115, -0.08, y + 0.07, 3.125), D.iron);
      out.add(cyl(0.022, 0.012, -0.08, 0, 0).rotateX(Math.PI / 2).translate(0, y + 0.05, 3.12), D.iron);
    }
    out.add(box(0.16, 1.15, 3.1, 0.42, 1.19, 3.13), D.iron);
    out.add(box(-0.6, 0.25, 3.0, -0.5, 2.37, 3.1), M.woodDark); out.add(box(0.5, 0.25, 3.0, 0.6, 2.37, 3.1), M.woodDark);
    out.add(box(-0.62, 2.25, 3.0, 0.62, 2.37, 3.11), M.woodDark);
    out.add(new THREE.TorusGeometry(0.075, 0.016, 6, 14, Math.PI * 1.3).rotateZ(-1.15 * Math.PI).translate(0, 2.47, 3.06), D.iron);
    // porch: bench under the left window with a water bucket + basin, butter churn at the right end, seed corn hanging
    out.add(box(-3.25, 0.66, 3.08, -1.95, 0.71, 3.42), M.wood);
    for (const x of [-3.18, -2.07]) for (const z of [3.12, 3.32]) out.add(box(x, 0.25, z, x + 0.06, 0.66, z + 0.06), M.woodDark);
    const tub = (b: Batch, x: number, y: number, z: number, r0: number, r1: number, h: number, bands: number[], mat = M.wood) => {
      b.add(new THREE.CylinderGeometry(r1, r0, h, 14).translate(x, y + h / 2, z), mat);
      for (const u of bands) { const rr = r0 + (r1 - r0) * u + 0.006; b.add(new THREE.CylinderGeometry(rr, rr, 0.025, 14, 1, true).translate(x, y + h * u, z), D.iron); }
    };
    tub(out, -2.85, 0.71, 3.25, 0.11, 0.13, 0.24, [0.2, 0.8]); out.add(new THREE.CircleGeometry(0.115, 12).rotateX(-Math.PI / 2).translate(-2.85, 0.92, 3.25), D.water);
    out.add(new THREE.TorusGeometry(0.13, 0.008, 4, 10, Math.PI).translate(-2.85, 0.95, 3.25), D.iron);
    out.add(new THREE.CylinderGeometry(0.18, 0.12, 0.08, 14).translate(-2.3, 0.75, 3.25), M.pewter);
    tub(out, 3.15, 0.25, 3.3, 0.17, 0.13, 0.75, [0.15, 0.5, 0.85]); out.add(cyl(0.14, 0.03, 3.15, 1.0, 3.3, 12), M.woodDark);
    out.add(cyl(0.018, 0.32, 3.15, 1.03, 3.3, 6), M.wood);
    for (let k = 0; k < 3; k++) {
      const ear = new THREE.SphereGeometry(0.05, 8, 6).scale(1, 2.6, 1).rotateZ((k - 1) * 0.28).translate(-3.0 + (k - 1) * 0.06, 2.1, 4.82 + 0.02 * k);
      out.add(ear, k === 1 ? D.pumpkin : D.corn);
    }
    out.add(box(-3.02, 2.2, 4.8, -2.98, 2.4, 4.84), D.hayDark);
    // well with a little shingled roof, windlass + crank and a bucket on its rope (side yard, left of the house)
    const [wx, wz] = [-6.9, -5.2];
    out.add(new THREE.CylinderGeometry(0.66, 0.7, 0.72, 18, 1, true).translate(wx, 0.36, wz), M.stone);
    out.add(new THREE.CylinderGeometry(0.58, 0.58, 0.72, 18, 1, true).scale(-1, 1, 1).translate(wx, 0.36, wz), M.stone);
    out.add(new THREE.RingGeometry(0.58, 0.72, 18).rotateX(-Math.PI / 2).translate(wx, 0.73, wz), M.stone);
    out.add(new THREE.CircleGeometry(0.58, 18).rotateX(-Math.PI / 2).translate(wx, 0.45, wz), D.water);
    for (const s of [-1, 1]) out.add(box(wx + s * 0.62 - 0.05, 0, wz - 0.05, wx + s * 0.62 + 0.05, 1.95, wz + 0.05), M.woodDark);
    out.add(cyl(0.06, 1.44, 0, 0, 0, 10).rotateZ(Math.PI / 2).translate(wx, 1.35, wz), M.wood);
    out.add(box(wx + 0.72, 1.32, wz - 0.02, wx + 0.76, 1.55, wz + 0.02), D.iron); out.add(box(wx + 0.72, 1.53, wz - 0.02, wx + 0.9, 1.56, wz + 0.02), D.iron);
    out.add(box(wx + 0.88, 1.53, wz - 0.012, wx + 0.9, 1.56, wz + 0.15), M.wood);
    out.add(quad(V(wx - 0.85, 1.85, wz + 0.6), V(wx + 0.85, 1.85, wz + 0.6), V(wx + 0.85, 2.3, wz), V(wx - 0.85, 2.3, wz), 1.4, 0.6), M.roof);
    out.add(quad(V(wx + 0.85, 1.85, wz - 0.6), V(wx - 0.85, 1.85, wz - 0.6), V(wx - 0.85, 2.3, wz), V(wx + 0.85, 2.3, wz), 1.4, 0.6), M.roof);
    out.add(box(wx - 0.88, 2.27, wz - 0.05, wx + 0.88, 2.35, wz + 0.05), M.woodDark);
    out.add(box(wx - 0.008, 1.0, wz - 0.008, wx + 0.008, 1.3, wz + 0.008), D.hayDark);
    tub(out, wx, 0.82, wz, 0.1, 0.12, 0.2, [0.25, 0.8]);
    // wash tub + washboard by the front-left corner, axe in the chopping block
    tub(out, -5.0, 0, 4.2, 0.4, 0.46, 0.38, [0.2, 0.8]); out.add(new THREE.CircleGeometry(0.43, 16).rotateX(-Math.PI / 2).translate(-5.0, 0.3, 4.2), D.water);
    out.add(box(-0.18, 0, -0.02, 0.18, 0.62, 0.02).rotateX(-0.25).translate(-5.0, 0.02, 4.72), M.wood);
    out.add(box(-0.14, 0.18, 0.02, 0.14, 0.5, 0.03).rotateX(-0.25).translate(-5.0, 0.02, 4.72), M.pewter);
    out.add(box(-0.02, 0, -0.02, 0.02, 0.62, 0.02).rotateZ(0.55).translate(6.32, 0.48, 3.2), M.wood);
    out.add(box(-0.06, -0.05, -0.012, 0.07, 0.05, 0.012).rotateZ(0.55).translate(6.32, 0.52, 3.2), D.iron);
    // cart wheel, pumpkins by the porch corner
    const wheel = (b: Batch, m: THREE.Matrix4) => {
      const R2 = 0.5;
      b.add(new THREE.TorusGeometry(R2, 0.045, 6, 22), M.woodDark, m);
      b.add(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 10).rotateX(Math.PI / 2), M.wood, m);
      for (let i = 0; i < 10; i++) b.add(box(-0.018, 0.06, -0.015, 0.018, R2 - 0.02, 0.015).rotateZ((i / 10) * Math.PI * 2), M.wood, m);
    };
    // leaning on the left gable wall between the side window and the corner
    wheel(out, new THREE.Matrix4().makeRotationZ(-0.18).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)).setPosition(-4.15, 0.52, 2.2));
    for (const [x, z, r] of [[4.2, 4.3, 0.24], [4.5, 3.9, 0.18], [4.05, 3.85, 0.15]]) {
      out.add(new THREE.SphereGeometry(r, 12, 8).scale(1.1, 0.78, 1.1).translate(x, r * 0.72, z), D.pumpkin);
      out.add(cyl(0.025, 0.07, x, r * 1.45, z, 6), D.stem);
    }
    // corn shocks in the field beyond the side fence (seen past the house from the graveyard)
    const shock = (b: Batch, x: number, z: number, h: number, yaw: number) => { // stalks bound near the top, tassels splaying above
      b.add(new THREE.CylinderGeometry(0.15, 0.5, h * 0.72, 9).rotateY(yaw).translate(x, h * 0.36, z), D.hay);
      b.add(new THREE.CylinderGeometry(0.17, 0.17, 0.09, 9).translate(x, h * 0.72, z), D.hayDark);
      b.add(new THREE.CylinderGeometry(0.3, 0.15, h * 0.2, 9).rotateY(yaw).translate(x, h * 0.82, z), D.hay);
      b.add(new THREE.ConeGeometry(0.3, h * 0.12, 9).rotateY(yaw).translate(x, h * 0.98, z), D.hay);
    };
    for (const [x, z, h] of [[-12.9, -5.3, 1.8], [-14.9, -6.6, 1.7], [-20, -10.4, 1.9], [-21.6, -8.8, 1.8], [17.5, -6, 1.9], [19, -8, 1.8]]) shock(out, x, z, h, x + z);
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
    // more markers: wooden crosses, a slanted slab, a small stone, an obelisk, footstones; low dry-stone wall under the pickets
    const cross = (x: number, z: number, h: number, tilt: number) => {
      const m = new THREE.Matrix4().makeRotationZ(tilt).setPosition(gx + x, 0, gz + z);
      out.add(box(-0.045, 0, -0.035, 0.045, h, 0.035), M.wood, m); out.add(box(-0.24, h * 0.66, -0.036, 0.24, h * 0.66 + 0.08, 0.036), M.wood, m);
    };
    cross(0.6, -2.1, 0.95, -0.07); cross(2.4, 0.9, 0.85, 0.1); cross(-2.0, -4.0, 0.8, 0.05);
    out.add(box(-0.22, 0, -0.06, 0.22, 0.75, 0.06).rotateX(-0.22).rotateZ(0.1).translate(gx + 1.9, 0, gz - 3.4), M.grave);
    stone(-0.4, -3.8, 0.38, 0.5, 0.15);
    out.add(box(gx - 2.48, 0, gz - 3.78, gx - 2.12, 0.18, gz - 3.42), M.grave);
    out.add(box(gx - 2.42, 0.18, gz - 3.72, gx - 2.18, 1.15, gz - 3.48), M.grave);
    out.add(new THREE.ConeGeometry(0.17, 0.26, 4).rotateY(Math.PI / 4).translate(gx - 2.3, 1.28, gz - 3.6), M.grave);
    for (const [x, z] of [[-1.7, -0.3], [1.6, -0.1]]) out.add(box(gx + x - 0.12, 0, gz + z - 0.05, gx + x + 0.12, 0.22, gz + z + 0.05), M.grave);
    for (let i = 0; i < 6; i++) {
      const xa = gx - 4.6 + i * 1.55, hgt = 0.3 + 0.06 * ((i * 5) % 3);
      out.add(box(xa, 0, gz - 4.88, xa + 1.5, hgt, gz - 4.38, 1.2), M.stone);
      out.add(box(xa + 0.1, hgt, gz - 4.84, xa + 0.7 + 0.1 * (i % 3), hgt + 0.1, gz - 4.42, 1.2), M.stone);
    }
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
    // Quilts are soft drapes, not slabs: a flat slab cut the sitting cards in a hard line (they looked like they were
    // standing behind a counter / clipping through). The big quilt rises to waist height over the sitters' laps
    // (z <= -1.95, sitters sit at z -2.0 .. -1.55) and falls to the foot; it drops behind their backs to the pillows.
    const QA0 = X0 - 3.47, QA1 = X0 - 1.03;
    this.quiltA = new THREE.Mesh(drape(QA0, QA1, -2.44, -0.86, (x, z) =>
      0.8 + 0.28 * (1 - ss(z, -1.95, -1.15)) * ss(z, -2.44, -2.18) + cloth(x, z, QA0, QA1), 0.22), M.quiltA);
    // John lying in state: one long body-shaped hump under the quilt (shoulders at z -2.4 .. feet at -0.95)
    this.quiltJ = new THREE.Mesh(drape(QA0, QA1, -2.44, -0.86, (x, z) =>
      0.8 + 0.36 * Math.sqrt(Math.max(0, 1 - ((x - (X0 - 2.25)) / 0.6) ** 2)) * ss(z, -2.47, -2.28) * (1 - ss(z, -1.2, -0.92)) + cloth(x, z, QA0, QA1), 0.22), M.quiltA);
    bed(X0 + 1.4, X0 + 3.0, -3, -1.1, 1.15);
    // Betsy's quilt (local frame, centre on the mattress at z -2.0): up to her waist where she sits (z -2.1 = local -0.1)
    this.quiltB = new THREE.Mesh(drape(-0.8, 0.8, -0.6, 0.6, (x, z) =>
      0.04 + 0.15 * (1 - ss(z, -0.05, 0.45)) * ss(z, -0.6, -0.36) + cloth(x, z, -0.8, 0.8), 0.2), M.quiltB);
    for (const q of [this.quiltA, this.quiltJ, this.quiltB]) { q.castShadow = true; q.receiveShadow = true; R.add(q); }
    this.quiltJ.visible = false;
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
    inn.add(quad(V(X0 - 1.2, 0.014, 1.1), V(X0 + 1.8, 0.014, 1.1), V(X0 + 1.8, 0.014, -0.9), V(X0 - 1.2, 0.014, -0.9)), lam("bwRug", () => ({ map: rugTex() })));
    inn.add(box(X0 - 4, 1.62, -0.7, X0 - 3.7, 1.67, 1.0), M.wood);
    for (let k = 0; k < 4; k++) inn.add(box(X0 - 3.98, 1.5, -0.6 + k * 0.5, X0 - 3.93, 1.62, -0.56 + k * 0.5), M.woodDark);
    ["#d8cba8", "#8a5a3a", "#5d7a5a", "#c9b07a", "#6a5a4a", "#d8cba8"].forEach((c, k) => {
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
    inn.add(box(X0 + 0.2, 0.8, -2.86, X0 + 0.44, 0.86, -2.64), lam("bwBible", () => ({ color: "#1e1a18" })));
    for (const [x, ry] of [[X0 - 3.72, Math.PI / 4], [X0 + 3.72, -Math.PI / 4]] as const) {
      const web = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ map: cobwebTex(), color: new THREE.Color(0.55, 0.55, 0.62), alphaTest: 0.3, side: THREE.DoubleSide, fog: true }));
      web.position.set(x, 2.4, -2.72); web.rotation.y = ry; web.layers.set(NOINK); R.add(web);
    }
    // set dressing (sets pass): homespun curtains on a rod, a pierced-tin lantern on a beam hook, drying herbs,
    // an iron pot by the hearth
    const curtain = lam("bwCurtain", () => ({ color: "#9c4b3c" })), iron = lam("bwIron", () => ({ color: "#36323a" })), herb = lam("bwHerb", () => ({ color: "#6f7f3c" }));
    inn.add(cyl(0.016, 2.0, 0, 0, 0, 8).rotateZ(Math.PI / 2).translate(X0, 2.3, -2.92), M.woodDark);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const xa = X0 + s * (0.63 + k * 0.1), dz = 0.012 * (k % 2);
      inn.add(box(Math.min(xa, xa + s * 0.11), 1.16 + 0.03 * k, -2.975 + dz, Math.max(xa, xa + s * 0.11), 2.29, -2.94 + dz), curtain);
    }
    for (const s of [-1, 1]) inn.add(box(Math.min(X0 + s * 0.62, X0 + s * 0.96), 1.5, -2.978, Math.max(X0 + s * 0.62, X0 + s * 0.96), 1.55, -2.915), M.woodDark);
    inn.add(box(X0 + 0.89, 2.37, -2.01, X0 + 0.91, 2.58, -1.99), iron);
    inn.add(cyl(0.07, 0.2, X0 + 0.9, 2.16, -2.0, 10), M.pewter); inn.add(new THREE.ConeGeometry(0.075, 0.1, 10).translate(X0 + 0.9, 2.41, -2.0), M.pewter);
    inn.add(cyl(0.075, 0.015, X0 + 0.9, 2.15, -2.0, 10), iron);
    for (const [x, z] of [[X0 - 3.6, -0.5], [X0 - 3.3, -0.5], [X0 - 3.0, -0.5], [X0 + 3.15, -0.5], [X0 + 3.45, -0.5]]) {
      const hh = 0.22 + 0.04 * ((x * 3) % 2);
      inn.add(box(x - 0.005, 2.5, z - 0.005, x + 0.005, 2.58, z + 0.005), herb);
      inn.add(new THREE.ConeGeometry(0.07, hh, 7).rotateX(Math.PI).translate(x, 2.5 - hh / 2, z), herb);
    }
    inn.add(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62).rotateX(Math.PI).translate(X0 + 3.2, 0.2, -0.68), iron);
    inn.add(new THREE.TorusGeometry(0.15, 0.008, 4, 10, Math.PI).translate(X0 + 3.2, 0.2, -0.68), iron);
    inn.add(new THREE.CircleGeometry(0.15, 12).rotateX(-Math.PI / 2).translate(X0 + 3.2, 0.25, -0.68), lam("bwWellWater", () => ({ color: "#0c0e16" })));
    // hearth: firebox opening, logs, fire glow (flames are cards in stage.ts)
    const fb = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#120a08" }));
    fb.position.set(X0 + 3.393, 0.44, 0.25); fb.layers.set(NOINK); R.add(fb);
    for (const dz of [-0.12, 0.1]) inn.add(cyl(0.06, 0.5, 0, 0, 0, 10).rotateX(Math.PI / 2).translate(X0 + 3.48, 0.12, 0.25 + dz), M.wood);
    const fh = halo(new THREE.Color(1.0, 0.45, 0.12), 1.9); fh.position.set(X0 + 3.25, 0.45, 0.25);
    const fp = pool(new THREE.Color(0.6, 0.25, 0.06), 2.0, 2.0); fp.position.set(X0 + 2.7, 0.02, 0.25);
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
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.0, 2.4, 0.9) }));
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
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus), sunDir = this.sunFor(s);
    // ---- light rig ----
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = this.rrCache.get(s.id);
    if (Rr === undefined) {
      let dm = dist;
      for (const g of [s.a, Math.round((s.a + s.b) / 2), s.b - 1]) { const cg = camAt(s, g); dm = Math.max(dm, V(...cg.pos).distanceTo(V(...cg.look))); }
      Rr = THREE.MathUtils.clamp(dm * 1.2 + 4, 6, outside ? 40 : 10); this.rrCache.set(s.id, Rr);
    }
    {
      const tex = (2 * Rr) / this.sun.shadow.mapSize.x, lz = sunDir.clone().normalize();
      const lx = V(0, 1, 0).cross(lz).normalize(), ly = lz.clone().cross(lx);
      const cx = focus.dot(lx), cy = focus.dot(ly);
      this.sc0.copy(focus).addScaledVector(lx, Math.round(cx / tex) * tex - cx).addScaledVector(ly, Math.round(cy / tex) * tex - cy);
    }
    this.sun.position.copy(this.sc0).addScaledVector(sunDir, 120); this.sun.target.position.copy(this.sc0);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 260; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = outside ? NIGHT_SAT : POOLS.sat;
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
    (this.porch.m.material as THREE.MeshBasicMaterial).color.setRGB(4.2 * pon + 0.02, 2.6 * pon + 0.02, 0.95 * pon + 0.03);
    this.porch.h.visible = this.porch.p.visible = pon > 0.05;
    this.lanternGlow.forEach((g, i) => {
      const l = st.props.lanterns[i]; g.h.visible = g.p.visible = !!l;
      if (l) {
        g.h.position.set(l[0], l[1], l[2]); g.h.scale.setScalar(0.85 * (1 + 0.06 * Math.sin(f * 0.8 + i * 2)));
        const onPorch = Math.abs(l[0]) < 3.6 && l[2] > 3 && l[2] < 4.8; g.p.position.set(l[0], onPorch ? 0.262 : 0.02, l[2]);
      }
    });
    const candleOn = !outside && !(f >= 1176 && f < 1196);
    this.candleHalos.forEach((h, i) => { h.visible = i === 1 ? !outside : candleOn; h.scale.setScalar((i ? 0.7 : 0.8) * (1 + 0.05 * Math.sin(f * 1.3 + i))); });
    this.hearth.forEach((h) => { h.visible = !outside; h.scale.setScalar(1.9 * (1 + 0.08 * Math.sin(f * 0.9) + 0.05 * Math.sin(f * 2.1))); });
    // practical light pools (reference interiors: the room is lit FROM its sources, corners fall off into soft shadow):
    // bedside candle, Betsy's crate candle, the hearth; view-space positions for shade.ts / cardshade.ts
    const src: (THREE.Vector3Tuple | null)[] = outside ? [null, null, null]
      : [candleOn ? [X0 - 0.3, 1.0, -2.72] : null, [X0 + 3.55, 0.7, -2.65], [X0 + 3.25, 0.45, 0.25]];
    src.forEach((p, i) => { const v = POOL.uPoolP.value[i]; if (p) v.set(...p).applyMatrix4(cam.matrixWorldInverse); else v.set(1e5, 0, 0); });
    POOL.uPoolK.value = outside ? 0 : POOLS.k; POOL.uPoolFloor.value = POOLS.floor; POOL.uPoolR.value.set(...POOLS.r);
    POOL.uPoolCol.value.set(...POOLS.col); POOL.uPoolCardK.value = POOLS.cardK;
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
    this.quiltJ.visible = p.johnLying; this.quiltA.visible = !p.johnLying;
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
