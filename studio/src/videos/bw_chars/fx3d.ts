// Light and atmosphere for "The Bell Witch": moon + corona + wide halo, stars, wispy moonlit clouds (silver lining
// toward the moon), window / lantern / candle glows and light pools, the moonbeam through the bedroom window with
// drifting dust, chimney smoke, low ground mist + far mist banks, bats, the owl, cobwebs.
// Everything here is self-lit (additive or soft cards) on the NOINK layer, so the ink pass never outlines it.
// Cost: ~40 draw calls of tiny shaders; all canvases are painted once (ctex cache); per frame only ~900 points move.
import * as THREE from "three";
import { ctex, rng } from "../bw_chars_bridge/paint";
import { NOINK } from "../bw_chars_bridge/ink";
import { MOON_FRAME } from "./moon";
import { SHOTS, camAt } from "./story";

// ---------------- textures (painted once) ----------------
/** radial alpha texture from a profile a(r), r = 0..1, with +-0.6/255 dither so dark-scene glows never band */
const radial = (key: string, n: number, prof: (r: number) => number) => ctex(key, n, n, (g) => {
  const im = g.createImageData(n, n), d = im.data, c = (n - 1) / 2, R = rng(n * 7 + key.length * 13);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const rr = Math.hypot(x - c, y - c) / (n / 2), i = (y * n + x) * 4, a = rr >= 1 ? 0 : prof(rr);
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a <= 0 ? 0 : Math.max(0, Math.min(255, Math.round(a * 255 + (R() - 0.5) * 1.2)));
  }
  g.putImageData(im, 0, 0);
});
const win2 = (r: number, p = 2) => (1 - r * r) ** p;
/** additive glow: small hot core + broad flat skirt (reference: flat halo, e-fold ~1.5 % of frame height) */
export const glowTex = () => radial("bwGlow2", 256, (r) => (0.25 * Math.exp(-((r / 0.09) ** 2)) + 0.75 * Math.exp(-((r / 0.48) ** 2))) * win2(r));
const softTex = () => radial("bwSoftGlow", 128, (r) => Math.exp(-((r / 0.45) ** 2)) * win2(r));
const dotTex = () => radial("bwDot", 32, (r) => Math.exp(-((r / 0.4) ** 2)) * win2(r));
const poolTex = () => radial("bwPool2", 256, (r) => 0.9 * Math.exp(-((r / 0.65) ** 2)) * win2(r, 1.5));
/** four-pane window light pattern (cool moonlight on the floor), soft edged */
const paneTex = () => ctex("bwPanes2", 256, 256, (g) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256);
  g.filter = "blur(7px)";
  const gr = g.createRadialGradient(128, 128, 20, 128, 128, 180);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0.25)");
  g.fillStyle = gr;
  for (const [x, y] of [[26, 26], [134, 26], [26, 134], [134, 134]]) g.fillRect(x, y, 96, 96);
  g.filter = "none";
  // the canvas is drawn on black: turn luminance into alpha
  const im = g.getImageData(0, 0, 256, 256), d = im.data;
  for (let i = 0; i < d.length; i += 4) { d[i + 3] = d[i]; d[i] = d[i + 1] = d[i + 2] = 255; }
  g.putImageData(im, 0, 0);
});
/** soft elliptical blob (alpha a at the centre) */
const blob = (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a: number, rot = 0) => {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.5, `rgba(255,255,255,${a * 0.55})`); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore();
};
/** fade the four borders of a canvas to transparent (fractions of width / height) */
const fadeEdges = (g: CanvasRenderingContext2D, W: number, H: number, fx: number, fyTop: number, fyBot: number) => {
  g.globalCompositeOperation = "destination-out";
  const lr = g.createLinearGradient(0, 0, W, 0);
  lr.addColorStop(0, "rgba(0,0,0,1)"); lr.addColorStop(fx, "rgba(0,0,0,0)"); lr.addColorStop(1 - fx, "rgba(0,0,0,0)"); lr.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = lr; g.fillRect(0, 0, W, H);
  const tb = g.createLinearGradient(0, 0, 0, H);
  tb.addColorStop(0, "rgba(0,0,0,1)"); tb.addColorStop(fyTop, "rgba(0,0,0,0)"); tb.addColorStop(1 - fyBot, "rgba(0,0,0,0)"); tb.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = tb; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
};
/** wispy cirrus / stratus streak for the night sky */
const wispTex = (k: number) => ctex("bwWisp" + "_".repeat(k), 512, 128, (g) => {
  const r = rng(101 + k * 37), ph = r() * 6;
  for (let i = 0; i < 54; i++) {
    const u = r(), x = 30 + u * 452, y = 66 + Math.sin(u * 3.2 + ph) * 13 + (r() - 0.5) * 26;
    blob(g, x, y, 34 + r() * 90, 4 + r() * 10, (0.1 + 0.22 * r()) * (0.35 + Math.sin(Math.PI * u)), (r() - 0.5) * 0.12);
  }
  g.globalCompositeOperation = "destination-out"; // thin gaps -> striations
  for (let i = 0; i < 16; i++) blob(g, r() * 512, 40 + r() * 50, 30 + r() * 70, 1.5 + r() * 3, 0.55);
  g.globalCompositeOperation = "source-over";
  fadeEdges(g, 512, 128, 0.14, 0.2, 0.2);
});
/** seamless patchy ground mist (tiles) */
const mistSheetTex = () => ctex("bwMistSheet", 256, 256, (g) => {
  const r = rng(4242);
  for (let i = 0; i < 70; i++) {
    const x = r() * 256, y = r() * 256, rx = 18 + r() * 52, ry = rx * (0.45 + r() * 0.3), a = 0.1 + 0.16 * r();
    for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) blob(g, x + ox, y + oy, rx, ry, a);
  }
});
/** low mist bank: dense at the bottom, fading up, soft ends */
const bankTex = () => ctex("bwMistBank", 512, 128, (g) => {
  const r = rng(777);
  for (let i = 0; i < 60; i++) {
    const x = 20 + r() * 472, y = 92 + (r() - 0.6) * 34, rx = 40 + r() * 80;
    blob(g, x, y, rx, 10 + r() * 16, 0.08 + 0.12 * r());
  }
  fadeEdges(g, 512, 128, 0.16, 0.45, 0.08);
});
/** smoke puff: a few overlapping soft blobs */
const puffTex = (k: number) => ctex("bwPuff" + "_".repeat(k), 128, 128, (g) => {
  const r = rng(55 + k * 91);
  for (let i = 0; i < 9; i++) {
    const a = r() * 6.28, d = r() * 22;
    blob(g, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 22 + r() * 18, 18 + r() * 16, 0.22 + 0.15 * r(), r() * 3);
  }
});
/** moonbeam shaft: u across the window (soft edges, faint mullion), v along the beam (top row = window end) */
const shaftTex = () => ctex("bwShaft", 128, 256, (g) => {
  const im = g.createImageData(128, 256), d = im.data, r = rng(919);
  const ph = [r() * 6, r() * 6, r() * 6];
  const ss = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
    const u = x / 127, v = y / 255;
    const across = ss(0, 0.26, u) * ss(1, 0.74, u) * (1 - 0.3 * Math.exp(-(((u - 0.5) / 0.035) ** 2)));
    const streak = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(u * 23 + ph[0]) * Math.sin(u * 9.7 + ph[1]) + 0.25 * Math.sin(u * 41 + ph[2]));
    const along = ss(0, 0.07, v) * (1 - 0.68 * v) * ss(1, 0.84, v);
    const i = (y * 128 + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(255 * Math.min(1, across * streak * along));
  }
  g.putImageData(im, 0, 0);
});
/** bat silhouette, pose 0 = wings up, 1 = spread, 2 = down; thin cool rim on the upper edges */
const batTex = (pose: number) => ctex("bwBat2_" + pose, 256, 128, (g) => {
  const P = [
    { wy: -30, ty: -56, f1: -36, f2: -16 },
    { wy: -12, ty: -6, f1: 12, f2: 18 },
    { wy: 4, ty: 40, f1: 44, f2: 32 },
  ][pose];
  const shape = (ox: number, oy: number) => {
    const X = (x: number) => 128 + x + ox, Y = (y: number) => 64 + y + oy;
    g.beginPath(); g.ellipse(X(0), Y(4), 10, 18, 0, 0, 7); g.fill();
    g.beginPath(); g.arc(X(0), Y(-17), 9, 0, 7); g.fill();
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(X(s * 3), Y(-22)); g.lineTo(X(s * 9), Y(-36)); g.lineTo(X(s * 9), Y(-20)); g.closePath(); g.fill();
      const W = [s * 54, P.wy], T = [s * 120, P.ty], F1 = [s * 96, P.f1], F2 = [s * 70, P.f2], H = [s * 8, 16];
      const sc = (a: number[], b: number[]) => { // scalloped membrane edge: bulges toward the wrist
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; g.quadraticCurveTo(X(mx + (W[0] - mx) * 0.3), Y(my + (W[1] - my) * 0.3), X(b[0]), Y(b[1]));
      };
      g.beginPath(); g.moveTo(X(s * 6), Y(-8));
      g.quadraticCurveTo(X(s * 28), Y(P.wy - 12), X(W[0]), Y(W[1]));
      g.lineTo(X(T[0]), Y(T[1]));
      sc(T, F1); sc(F1, F2); sc(F2, H);
      g.closePath(); g.fill();
    }
  };
  g.fillStyle = "#56628e"; shape(-2, -3);
  g.fillStyle = "#08070d"; shape(0, 0);
});
/** owl on a perch: moonlit rim (moon upper left), pale face discs, yellow eyes (or a blink), claws */
const owlTex = (blink: boolean) => ctex("bwOwl2" + (blink ? "b" : "o"), 128, 192, (g) => {
  const body = (ox: number, oy: number) => {
    g.beginPath(); g.ellipse(64 + ox, 122 + oy, 40, 54, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(64 + ox, 70 + oy, 38, 32, 0, 0, 7); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 18 + ox, 46 + oy); g.lineTo(64 + s * 34 + ox, 22 + oy); g.lineTo(64 + s * 36 + ox, 56 + oy); g.closePath(); g.fill(); }
  };
  g.fillStyle = "#6a78a8"; body(-3, -3);
  g.fillStyle = "#17141f"; body(0, 0);
  g.fillStyle = "#0f0d15"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 30, 124, 13, 40, s * 0.12, 0, 7); g.fill(); } // folded wings
  g.strokeStyle = "#2c2838"; g.lineWidth = 2.5; // breast feathers
  for (let k = 0; k < 9; k++) { const x = 52 + (k % 3) * 12, y = 104 + Math.floor(k / 3) * 16; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x, y + 4); g.lineTo(x + 4, y); g.stroke(); }
  g.fillStyle = "#2e2a3a"; for (const x of [46, 82]) { g.beginPath(); g.arc(x, 74, 18, 0, 7); g.fill(); }
  if (!blink) {
    g.fillStyle = "#ffd447"; for (const x of [46, 82]) { g.beginPath(); g.arc(x, 74, 11.5, 0, 7); g.fill(); }
    g.fillStyle = "#0d0b12"; for (const x of [46, 82]) { g.beginPath(); g.arc(x, 74, 5.5, 0, 7); g.fill(); }
    g.fillStyle = "#ffffff"; for (const x of [43, 79]) { g.beginPath(); g.arc(x, 71, 2, 0, 7); g.fill(); }
  } else { g.strokeStyle = "#c9a23a"; g.lineWidth = 3; for (const x of [46, 82]) { g.beginPath(); g.moveTo(x - 10, 76); g.quadraticCurveTo(x, 80, x + 10, 76); g.stroke(); } }
  g.fillStyle = "#c79a3c"; g.beginPath(); g.moveTo(58, 84); g.lineTo(70, 84); g.lineTo(64, 97); g.closePath(); g.fill();
  for (const x of [52, 76]) for (const dx of [-5, 0, 5]) { g.beginPath(); g.ellipse(x + dx, 176, 2.5, 6, 0, 0, 7); g.fill(); }
});
export const cobwebTex = () => ctex("bwWeb", 512, 512, (g) => {
  g.strokeStyle = "rgba(225,225,235,0.9)"; g.lineWidth = 3; // anchored in the top-left corner
  const spokes = 9, cx = 256; // fan from the corner vertex at the top centre
  for (let i = 0; i <= spokes; i++) { const a = (i / spokes) * Math.PI; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx + 260 * Math.cos(a), 480 * Math.sin(a)); g.stroke(); }
  g.lineWidth = 2;
  for (let k = 1; k <= 8; k++) {
    const rr = k * 0.12; g.beginPath();
    for (let i = 0; i <= spokes; i++) { const a = (i / spokes) * Math.PI, sag = i > 0 && i < spokes ? 0.88 : 1; const x = cx + 260 * rr * sag * Math.cos(a), y = 480 * rr * sag * Math.sin(a); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  }
});

// ---------------- shaders ----------------
const VS = `varying vec2 vUv; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
/** soft card: tiled alpha map x colour, faded by camera distance (never a veil in front of the lens), optional hole */
const SOFT_FS = `uniform sampler2D map; uniform vec3 color; uniform float opacity; uniform vec4 fade; uniform vec2 rep, drift; uniform vec4 hole;
varying vec2 vUv; varying vec3 vW;
#include <fog_pars_fragment>
void main(){
  float a = texture2D(map, vUv * rep + drift).a;
  float d = distance(vW, cameraPosition);
  a *= smoothstep(fade.x, fade.y, d) * (1.0 - smoothstep(fade.z, fade.w, d));
  vec2 o = max(max(hole.xz - vW.xz, vW.xz - hole.yw), 0.0);
  a *= smoothstep(0.0, 0.9, length(o));
  gl_FragColor = vec4(color, a * opacity);
#include <fog_fragment>
}`;
/** moonlit cloud: dim body, silver lining on the edge facing the moon, thin parts glow near the moon */
const CLOUD_FS = `uniform sampler2D map; uniform vec2 mdir; uniform vec3 moonDir, body, lining, glow; uniform float opacity;
varying vec2 vUv; varying vec3 vW;
void main(){
  float a = texture2D(map, vUv).a;
  if (a < 0.004) discard;
  float a1 = texture2D(map, vUv + mdir).a, a2 = texture2D(map, vUv + mdir * 2.4).a;
  float edge = clamp(1.0 - (0.55 * a1 + 0.45 * a2) / max(a, 0.03), 0.0, 1.0);
  float c = 1.0 - dot(normalize(vW - cameraPosition), moonDir);
  float nearM = exp(-c * 55.0), wide = exp(-c * 10.0);
  vec3 col = body * (0.75 + 0.7 * wide) + lining * edge * (0.22 + 0.78 * nearM) + glow * nearM * (1.0 - 0.6 * a);
  gl_FragColor = vec4(col, a * opacity);
}`;
const softMat = (map: THREE.Texture, color: THREE.Color, opacity: number, fade: [number, number, number, number], extra: Partial<THREE.ShaderMaterialParameters> = {}) => {
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      map: { value: null }, color: { value: new THREE.Color() }, opacity: { value: 1 }, fade: { value: new THREE.Vector4() },
      rep: { value: new THREE.Vector2(1, 1) }, drift: { value: new THREE.Vector2() }, hole: { value: new THREE.Vector4(1e4, 1e4 + 1, 1e4, 1e4 + 1) },
    }]),
    vertexShader: VS, fragmentShader: SOFT_FS, transparent: true, depthWrite: false, fog: true, ...extra,
  });
  m.uniforms.map.value = map; (m.uniforms.color.value as THREE.Color).copy(color); m.uniforms.opacity.value = opacity;
  (m.uniforms.fade.value as THREE.Vector4).set(...fade);
  return m;
};

const add = (m: THREE.MeshBasicMaterialParameters) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, ...m });
const onLayer = <T extends THREE.Object3D>(o: T) => { o.layers.set(NOINK); o.frustumCulled = false; return o; };
/** additive glow sprite (scale in metres) */
export const halo = (col: THREE.Color, size: number) => {
  const s = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true })));
  s.scale.setScalar(size); return s;
};
/** additive light pool on the floor (horizontal) */
export const pool = (col: THREE.Color, w: number, d: number, panes = false) => {
  const m = onLayer(new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), add({ map: panes ? paneTex() : poolTex(), color: col, polygonOffset: true, polygonOffsetFactor: -4 })));
  return m;
};

// ---------------- layout tables ----------------
const DEG = Math.PI / 180;
/** clouds around the moon: [right deg, up deg, width deg, height deg, texture, opacity, sway deg] */
const WISPS: [number, number, number, number, number, number, number][] = [
  [3, -2.4, 22, 3.4, 0, 0.8, 2.2], [13, 4.6, 30, 4.4, 1, 0.62, 3], [-9, 6.8, 26, 3.6, 2, 0.55, 2.5],
  [21, -5.5, 26, 4.2, 0, 0.5, 2.5], [-15, -6.2, 22, 3.2, 1, 0.45, 2],
];
/** far mist banks [x, z, width] (yard rear / sides, the field between graveyard and house, behind the graveyard) */
const BANKS: [number, number, number][] = [[-3, -13, 30], [16, -5, 22], [-17, -2, 22], [-14, -9, 18], [-34, -35, 26], [-44, -30, 18], [-24, -34, 20], [8, 22, 30]];
const TREE_PERCH = new THREE.Vector3(-31.62, 4.42, -29.62); // left fork of the dead tree (world.ts)
const POST_PERCH = new THREE.Vector3(-34, 1.16, -30.6);     // graveyard fence post right of the big stone, in frame
// moonbeam geometry: bedroom window x 199.4..200.6, y 1.3..2.15, z -3, light travelling down into the room
const BEAM_D = new THREE.Vector3(0.22, -1, 1.05).normalize(), BEAM_P0 = new THREE.Vector3(200, 1.725, -2.96), BEAM_L = 1.725 / -BEAM_D.y;

export class Atmos {
  group = new THREE.Group();
  moon: THREE.Sprite; moonHalo: THREE.Sprite; corona: THREE.Sprite;
  stars: THREE.Points; starsB: THREE.Points;
  private starDir: THREE.Vector3[] = []; private starBase: number[] = []; private starPh: number[] = [];
  clouds: THREE.Mesh[] = [];
  smoke: THREE.Sprite[] = [];
  mist: THREE.Mesh[] = [];
  banks: THREE.Mesh[] = [];
  bats: THREE.Sprite[] = [];
  owl: THREE.Sprite; owlEyes: THREE.Sprite[] = [];
  beam: THREE.Mesh; beamPool: THREE.Mesh; dust: THREE.Points;
  private dustP: number[][] = [];
  private perch = new Map<number, THREE.Vector3>();
  private v = new THREE.Vector3(); private w = new THREE.Vector3();
  constructor(moonTex: THREE.Texture, cloudMaps: THREE.Texture[]) {
    void cloudMaps; // the puffy day-cloud maps are replaced by our own wisps
    const G = this.group;
    this.moon = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, color: new THREE.Color(2.4, 2.5, 2.8), fog: false, depthWrite: false, transparent: true })));
    this.moon.renderOrder = -0.5;
    // wide atmospheric glow (MOON_FRAME.halo deg) + tight corona (2.4 x the disc)
    this.moonHalo = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), color: new THREE.Color(0.15, 0.19, 0.34), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending })));
    this.moonHalo.renderOrder = -0.45;
    this.corona = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), color: new THREE.Color(0.42, 0.5, 0.78), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending })));
    this.corona.renderOrder = -0.4;
    // stars on the sky dome: many faint + a few bright; dimmed near the horizon and in the moon's glare, slow twinkle
    const r = rng(77);
    const mk = (n: number, size: number, kmin: number, kmax: number) => {
      const pos: number[] = [], col: number[] = [];
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, el = Math.asin(0.07 + 0.93 * r()), d = 1000;
        const dir = new THREE.Vector3(Math.cos(el) * Math.cos(a), Math.sin(el), Math.cos(el) * Math.sin(a));
        pos.push(dir.x * d, dir.y * d, dir.z * d);
        const k = (kmin + (kmax - kmin) * r() ** 2) * Math.min(1, Math.max(0, (el / DEG - 4) / 12));
        this.starDir.push(dir); this.starBase.push(k); this.starPh.push(r() * 100);
        const tint = r(); col.push(k * (0.82 + 0.15 * tint), k * 0.9, k * (1.05 - 0.1 * tint));
      }
      const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      const p = onLayer(new THREE.Points(sg, new THREE.PointsMaterial({ size, map: dotTex(), sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending })));
      p.renderOrder = -0.8; return p;
    };
    this.stars = mk(620, 3.2, 0.18, 0.55); this.starsB = mk(55, 5.2, 0.55, 1.15);
    WISPS.forEach((wp) => {
      const m = onLayer(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        uniforms: { map: { value: wispTex(wp[4]) }, mdir: { value: new THREE.Vector2() }, moonDir: { value: new THREE.Vector3(0, 1, 0) },
          body: { value: new THREE.Color(0.026, 0.033, 0.07) }, lining: { value: new THREE.Color(0.62, 0.7, 0.98) }, glow: { value: new THREE.Color(0.2, 0.25, 0.4) }, opacity: { value: wp[5] } },
        vertexShader: VS, fragmentShader: CLOUD_FS, transparent: true, depthWrite: false, fog: false,
      })));
      m.renderOrder = -0.3; this.clouds.push(m);
    });
    for (let i = 0; i < 11; i++) {
      const s = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(i % 2), color: new THREE.Color(0.4, 0.45, 0.6), transparent: true, depthWrite: false, fog: true })));
      this.smoke.push(s);
    }
    // ground mist: two horizontal sheets over the farm + graveyard; nothing within ~5 m of the lens, full from ~13 m
    const smap = mistSheetTex();
    for (const [y, op] of [[0.06, 0.3], [0.34, 0.16]] as const) {
      const m = onLayer(new THREE.Mesh(new THREE.PlaneGeometry(130, 110).rotateX(-Math.PI / 2), softMat(smap, new THREE.Color(0.17, 0.2, 0.27), op, [5, 13, 55, 110])));
      m.position.set(-12, y, -6);
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      (u.rep.value as THREE.Vector2).set(130 / 15, 110 / 15);
      (u.hole.value as THREE.Vector4).set(-3.9, 3.9, 2.9, 5.5); // keep the porch floor clear (people stand there)
      this.mist.push(m);
    }
    const bmap = bankTex();
    BANKS.forEach(() => this.banks.push(onLayer(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), softMat(bmap, new THREE.Color(0.18, 0.21, 0.28), 0.5, [13, 24, 75, 150])))));
    for (let i = 0; i < 5; i++) this.bats.push(onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: batTex(1), fog: false, depthWrite: false, transparent: true, alphaTest: 0.35 }))));
    this.owl = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: owlTex(false), fog: true, transparent: true, alphaTest: 0.4 })));
    for (let i = 0; i < 2; i++) this.owlEyes.push(onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), color: new THREE.Color(0.9, 0.62, 0.12), fog: true, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }))));
    // moonbeam: one soft shaft card turned about the beam axis toward the lens (soft from every angle) + floor panes + dust
    this.beam = onLayer(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), softMat(shaftTex(), new THREE.Color(0.17, 0.22, 0.42), 1, [0.45, 1.3, 1e3, 2e3], { blending: THREE.AdditiveBlending, fog: false })));
    this.beam.matrixAutoUpdate = false;
    const Wc = [[-0.6, 1.3], [0.6, 1.3], [0.6, 2.15], [-0.6, 2.15]].map(([x, y]) => new THREE.Vector3(200 + x, y, -2.98));
    const Fl = Wc.map((p) => p.clone().addScaledVector(BEAM_D, p.y / -BEAM_D.y));
    const cx = Fl.reduce((s, p) => s + p.x, 0) / 4, cz = Fl.reduce((s, p) => s + p.z, 0) / 4;
    this.beamPool = pool(new THREE.Color(0.3, 0.38, 0.72), 1.35, Math.abs(Fl[2].z - Fl[0].z) + 0.2, true);
    this.beamPool.position.set(cx, 0.006, cz);
    const dg = new THREE.BufferGeometry();
    for (let i = 0; i < 80; i++) this.dustP.push([r() - 0.5, r() - 0.5, r(), r() * 100, 0.6 + 0.8 * r()]);
    dg.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(80 * 3), 3));
    dg.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(80 * 3), 3));
    this.dust = onLayer(new THREE.Points(dg, new THREE.PointsMaterial({ size: 3.4, map: dotTex(), sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
    G.add(this.moon, this.moonHalo, this.corona, this.stars, this.starsB, ...this.clouds, ...this.smoke, ...this.mist, ...this.banks, ...this.bats, this.owl, ...this.owlEyes, this.beam, this.beamPool, this.dust);
  }

  /** owl perch for a shot: the dead tree when the shot frames it, else the fence post beside the big stone */
  private perchFor(shotId: number) {
    let p = this.perch.get(shotId);
    if (p) return p;
    const s = SHOTS.find((x) => x.id === shotId);
    let tree = false;
    if (s) {
      tree = true;
      for (const f of [s.a, Math.round((s.a + s.b) / 2)]) {
        const c = camAt(s, f), pc = new THREE.PerspectiveCamera(c.fov, 9 / 16, 0.1, 2000);
        pc.position.set(...c.pos); pc.lookAt(...c.look); pc.updateMatrixWorld();
        const q = TREE_PERCH.clone().project(pc);
        if (!(q.z < 1 && Math.abs(q.x) < 0.8 && Math.abs(q.y) < 0.85)) tree = false;
      }
    }
    p = tree ? TREE_PERCH : POST_PERCH; this.perch.set(shotId, p);
    return p;
  }

  /** outdoor / indoor visibility and motion; moonDir = world direction of the moon for this shot */
  update(f: number, outside: boolean, cam: THREE.PerspectiveCamera, moonDir: THREE.Vector3, shotId: number, batsOn: boolean, owlOn: boolean) {
    const t = f / 30;
    for (const o of [this.moon, this.moonHalo, this.corona, this.stars, this.starsB, ...this.clouds, ...this.smoke, ...this.mist, ...this.banks]) o.visible = outside;
    this.beam.visible = this.beamPool.visible = this.dust.visible = !outside && shotId !== 17 && shotId !== 20; // beam washed the vial close-ups
    const up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3().crossVectors(moonDir, up).normalize(), u2 = new THREE.Vector3().crossVectors(right, moonDir).normalize();
    if (outside) {
      const disc = MOON_FRAME.disc * DEG, hal = MOON_FRAME.halo * DEG;
      this.moon.position.copy(cam.position).addScaledVector(moonDir, 900); this.moon.scale.setScalar(2 * 900 * Math.tan(disc));
      this.corona.position.copy(cam.position).addScaledVector(moonDir, 895); this.corona.scale.setScalar(2 * 895 * Math.tan(disc * 2.4));
      this.moonHalo.position.copy(cam.position).addScaledVector(moonDir, 890); this.moonHalo.scale.setScalar(2 * 890 * Math.tan(hal * 1.15));
      // stars: twinkle + moon glare (no stars inside ~5 deg of the moon, full beyond ~16 deg)
      let j = 0;
      for (const P of [this.stars, this.starsB]) {
        P.position.copy(cam.position);
        const ca = P.geometry.getAttribute("color") as THREE.BufferAttribute, n = ca.count;
        for (let i = 0; i < n; i++, j++) {
          const ang = Math.acos(Math.min(1, this.starDir[j].dot(moonDir))) / DEG, glare = Math.min(1, Math.max(0, (ang - 5) / 11));
          const tw = 0.78 + 0.22 * Math.sin(t * (1.3 + (this.starPh[j] % 1.7)) + this.starPh[j]);
          const k = this.starBase[j] * glare * tw;
          ca.setXYZ(i, k * 0.86, k * 0.9, k);
        }
        ca.needsUpdate = true;
      }
      // wispy clouds laid out around the moon, drifting slowly (sine sway: no wrap pops)
      const moonPos = this.w.copy(cam.position).addScaledVector(moonDir, 850);
      this.clouds.forEach((m, i) => {
        const [dx, dy, wd, hd, , , sw] = WISPS[i];
        const ox = (dx + sw * Math.sin(t * 0.07 + i * 1.9)) * DEG, oy = dy * DEG;
        const dir = this.v.copy(moonDir).addScaledVector(right, Math.tan(ox)).addScaledVector(u2, Math.tan(oy)).normalize();
        m.position.copy(cam.position).addScaledVector(dir, 850); m.lookAt(cam.position);
        m.scale.set(2 * 850 * Math.tan((wd * DEG) / 2), 2 * 850 * Math.tan((hd * DEG) / 2), 1);
        const ex = new THREE.Vector3(1, 0, 0).applyQuaternion(m.quaternion), ey = new THREE.Vector3(0, 1, 0).applyQuaternion(m.quaternion);
        const dl = moonPos.clone().sub(m.position), px = dl.dot(ex), py = dl.dot(ey), L = Math.hypot(px, py) || 1, k = 850 * Math.tan(0.4 * DEG);
        const U = (m.material as THREE.ShaderMaterial).uniforms;
        (U.mdir.value as THREE.Vector2).set((px / L) * k / m.scale.x, (py / L) * k / m.scale.y);
        (U.moonDir.value as THREE.Vector3).copy(moonDir);
      });
      // chimney smoke: soft puffs rising from the stack, leaning with the wind, curling, fading out high up
      this.smoke.forEach((s, i) => {
        const u = (t * 0.085 + i / this.smoke.length) % 1, sz = 0.45 + u * 3.1;
        s.position.set(4.45 - u * 2.9 + 0.35 * Math.sin(u * 5 + t * 0.4 + i), 6.0 + u * 4.4 + u * u * 1.6, u * 0.9 + 0.25 * Math.sin(t * 0.6 + i * 2));
        s.scale.setScalar(sz);
        const mat = s.material as THREE.SpriteMaterial;
        mat.opacity = 0.5 * Math.min(1, u * 7) * (1 - u) ** 1.4; mat.rotation = i * 1.3 + t * 0.12 * (i % 2 ? 1 : -1);
      });
      this.mist.forEach((m, i) => {
        const U = (m.material as THREE.ShaderMaterial).uniforms;
        (U.drift.value as THREE.Vector2).set(t * (i ? 0.0075 : -0.005), t * (i ? 0.002 : 0.003));
      });
      BANKS.forEach(([x, z, w], i) => {
        const m = this.banks[i], bx = x + 0.9 * Math.sin(t * 0.08 + i * 2.1);
        m.position.set(bx, 0.95, z); m.rotation.set(0, Math.atan2(cam.position.x - bx, cam.position.z - z), 0); m.scale.set(w, 2.5, 1);
      });
    } else {
      // moonbeam shaft: axial billboard from the window to the floor
      const mid = this.v.copy(BEAM_P0).addScaledVector(BEAM_D, BEAM_L / 2);
      const X = new THREE.Vector3().crossVectors(BEAM_D, this.w.copy(cam.position).sub(mid)).normalize(), Y = BEAM_D.clone().negate(), Z = new THREE.Vector3().crossVectors(X, Y);
      this.beam.matrix.makeBasis(X, Y, Z).scale(new THREE.Vector3(1.15, BEAM_L, 1)).setPosition(mid); this.beam.matrixWorldNeedsUpdate = true;
      // dust motes drifting inside the beam, glinting as they cross it; brightness 0 at the wrap point
      const pa = this.dust.geometry.getAttribute("position") as THREE.BufferAttribute, ca = this.dust.geometry.getAttribute("color") as THREE.BufferAttribute;
      this.dustP.forEach(([a0, b0, w0, ph, sp], i) => {
        const a = a0 + 0.06 * Math.sin(t * 0.21 * sp + ph), b = b0 + 0.06 * Math.sin(t * 0.17 * sp + ph * 1.3), w = (w0 + t * 0.012 * sp) % 1;
        const p = this.w.set(200 + a * 1.15, 1.725 + b * 0.8, -2.96).addScaledVector(BEAM_D, w * BEAM_L * 0.97);
        pa.setXYZ(i, p.x, p.y, p.z);
        const k = 0.55 * Math.sin(Math.PI * w) * Math.max(0, 1 - 4 * a * a) * Math.max(0, 1 - 4 * b * b) * (0.55 + 0.45 * Math.sin(t * 1.7 * sp + ph)) * (1 - 0.5 * w);
        ca.setXYZ(i, k * 0.62, k * 0.72, k);
      });
      pa.needsUpdate = ca.needsUpdate = true;
    }
    // bats flitting across the moon (some left to right, some right to left), 4-frame wingbeat
    this.bats.forEach((b, i) => {
      b.visible = outside && batsOn;
      if (!b.visible) return;
      const D = 55 + i * 9, u = (((t * 0.1 + i * 0.23) % 1) * 2 - 1) * (i % 2 ? -1 : 1);
      const lift = 0.055 * Math.sin(t * 1.6 + i * 2) + 0.022 * Math.sin(t * 4.1 + i) + (i - 2) * 0.03;
      b.position.copy(cam.position).addScaledVector(moonDir, D).addScaledVector(right, u * D * 0.55).addScaledVector(u2, lift * D);
      const sz = 1.9 + 0.25 * (i % 3);
      b.scale.set(sz, sz / 2, 1);
      (b.material as THREE.SpriteMaterial).map = batTex([0, 1, 2, 1][(f + i * 3) % 4]);
    });
    this.owl.visible = outside && owlOn;
    this.owlEyes.forEach((e) => { e.visible = false; });
    if (this.owl.visible) {
      const p = this.perchFor(shotId), blink = f % 75 < 4;
      this.owl.position.copy(p); this.owl.scale.set(0.4, 0.6, 1);
      (this.owl.material as THREE.SpriteMaterial).map = owlTex(blink);
      const cr = this.v.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
      if (!blink) this.owlEyes.forEach((e, k) => {
        e.visible = true; e.position.copy(p).addScaledVector(cr, (k ? 1 : -1) * 0.056).addScaledVector(up, 0.069); e.scale.setScalar(0.13);
      });
    }
  }
}
