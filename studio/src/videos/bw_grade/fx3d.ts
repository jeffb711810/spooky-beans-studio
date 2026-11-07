// Light and atmosphere for "The Bell Witch": moon + halo + stars + moonlit clouds, window / lantern / candle glows and
// light pools, the moonbeam through the bedroom window with dust, chimney smoke, low mist, bats, the owl, cobwebs.
// Everything here is self-lit (additive or soft cards) on the NOINK layer, so the ink pass never outlines it.
import * as THREE from "three";
import { ctex, rng } from "../bridge/paint";
import { NOINK } from "../bridge/ink";

export const glowTex = () => ctex("bwGlow", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,0.55)"); gr.addColorStop(0.45, "rgba(255,255,255,0.16)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
const poolTex = () => ctex("bwPool", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.5, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** four-pane window light pattern (cool moonlight on the floor) */
const paneTex = () => ctex("bwPanes", 256, 256, (g) => {
  g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256);
  const gr = g.createRadialGradient(128, 128, 30, 128, 128, 170);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0.15)");
  g.fillStyle = gr;
  for (const [x, y] of [[20, 20], [134, 20], [20, 134], [134, 134]]) g.fillRect(x, y, 102, 102);
});
const mistTex = () => ctex("bwMist", 512, 128, (g, r) => {
  for (let k = 0; k < 40; k++) {
    const x = r() * 512, y = 60 + (r() - 0.5) * 50, rx = 60 + r() * 90, ry = 18 + r() * 22;
    const gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, "rgba(255,255,255,0.22)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.beginPath(); g.arc(x, y, rx, 0, 7); g.fill(); g.restore();
  }
  const fade = g.createLinearGradient(0, 0, 512, 0); // soft ends
  fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(0.15, "rgba(0,0,0,0)"); fade.addColorStop(0.85, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = fade; g.fillRect(0, 0, 512, 128);
});
const puffTex = () => ctex("bwPuff", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(0.6, "rgba(255,255,255,0.2)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const batTex = (up: boolean) => ctex("bwBat" + up, 256, 128, (g) => {
  g.fillStyle = "#0b0a12"; g.beginPath(); g.ellipse(128, 70, 16, 22, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(128, 46, 12, 0, 7); g.fill();
  g.beginPath(); g.moveTo(120, 38); g.lineTo(116, 24); g.lineTo(126, 36); g.moveTo(136, 38); g.lineTo(140, 24); g.lineTo(130, 36); g.fill();
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(128 + s * 10, 62);
    const tip = up ? 20 : 110;
    g.quadraticCurveTo(128 + s * 60, up ? 10 : 50, 128 + s * 118, tip);
    g.lineTo(128 + s * 95, tip + 18); g.lineTo(128 + s * 72, tip + 6); g.lineTo(128 + s * 50, tip + 22); g.lineTo(128 + s * 10, 82); g.closePath(); g.fill();
  }
});
const owlTex = (blink: boolean) => ctex("bwOwl" + blink, 128, 192, (g) => {
  g.fillStyle = "#14121a";
  g.beginPath(); g.ellipse(64, 120, 42, 62, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(26, 70); g.lineTo(34, 30); g.lineTo(52, 62); g.lineTo(76, 62); g.lineTo(94, 30); g.lineTo(102, 70); g.fill();
  if (!blink) { g.fillStyle = "#ffd84a"; for (const x of [46, 82]) { g.beginPath(); g.arc(x, 82, 11, 0, 7); g.fill(); } g.fillStyle = "#14121a"; for (const x of [46, 82]) { g.beginPath(); g.arc(x, 82, 4, 0, 7); g.fill(); } }
  else { g.strokeStyle = "#ffd84a"; g.lineWidth = 3; for (const x of [46, 82]) { g.beginPath(); g.moveTo(x - 9, 82); g.lineTo(x + 9, 82); g.stroke(); } }
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

export class Atmos {
  group = new THREE.Group();
  moon: THREE.Sprite; moonHalo: THREE.Sprite;
  stars: THREE.Points;
  clouds: THREE.Mesh[] = [];
  smoke: THREE.Sprite[] = [];
  mist: THREE.Mesh[] = [];
  bats: THREE.Sprite[] = [];
  owl: THREE.Sprite;
  beam: THREE.Mesh; beamPool: THREE.Mesh; dust: THREE.Points;
  constructor(moonTex: THREE.Texture, cloudMaps: THREE.Texture[]) {
    const G = this.group;
    this.moon = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, color: new THREE.Color(2.4, 2.5, 2.8), fog: false, depthWrite: false, transparent: true })));
    this.moon.renderOrder = -0.5;
    this.moonHalo = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(0.35, 0.45, 0.75), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending })));
    this.moonHalo.renderOrder = -0.4;
    // stars on the sky dome (above 6 deg)
    const r = rng(77), pos: number[] = [], col: number[] = [];
    for (let i = 0; i < 700; i++) {
      const a = r() * Math.PI * 2, el = Math.asin(0.1 + 0.9 * r()), d = 1000;
      pos.push(d * Math.cos(el) * Math.cos(a), d * Math.sin(el), d * Math.cos(el) * Math.sin(a));
      const k = 0.5 + 0.9 * r() ** 2; col.push(k * 0.85, k * 0.9, k);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    this.stars = onLayer(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true })));
    this.stars.renderOrder = -0.8;
    for (let i = 0; i < 4; i++) {
      const m = onLayer(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudMaps[i % cloudMaps.length], color: new THREE.Color(0.8, 0.85, 1.0), transparent: true, opacity: 0.75, depthWrite: false, fog: false })));
      m.renderOrder = -0.3; this.clouds.push(m);
    }
    for (let i = 0; i < 7; i++) {
      const s = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex(), color: new THREE.Color(0.55, 0.6, 0.75), transparent: true, depthWrite: false, fog: true })));
      this.smoke.push(s);
    }
    for (let i = 0; i < 9; i++) {
      const m = onLayer(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: mistTex(), color: new THREE.Color(0.62, 0.68, 0.85), transparent: true, depthWrite: false, fog: true, opacity: 0.9 })));
      this.mist.push(m);
    }
    for (let i = 0; i < 4; i++) this.bats.push(onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: batTex(true), fog: false, depthWrite: false, transparent: true, alphaTest: 0.4 }))));
    this.owl = onLayer(new THREE.Sprite(new THREE.SpriteMaterial({ map: owlTex(false), fog: true, transparent: true, alphaTest: 0.4 })));
    // moonbeam through the bedroom window (x 199.4..200.6, y 1.3..2.15, z -3) down to the floor
    const X0 = 200, d = new THREE.Vector3(0.22, -1, 1.05);
    const W = [[X0 - 0.6, 1.3], [X0 + 0.6, 1.3], [X0 + 0.6, 2.15], [X0 - 0.6, 2.15]].map(([x, y]) => new THREE.Vector3(x, y, -2.98));
    const Fl = W.map((p) => p.clone().addScaledVector(d, p.y / -d.y));
    const bp: number[] = [], bc: number[] = [];
    const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, e: THREE.Vector3) => {
      for (const [p, k] of [[a, 1], [b, 1], [c, 0.15], [a, 1], [c, 0.15], [e, 0.15]] as const) { bp.push(p.x, p.y, p.z); bc.push(0.16 * k, 0.21 * k, 0.36 * k); }
    };
    for (let i = 0; i < 4; i++) quad(W[i], W[(i + 1) % 4], Fl[(i + 1) % 4], Fl[i]);
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute("color", new THREE.Float32BufferAttribute(bc, 3));
    this.beam = onLayer(new THREE.Mesh(bg, add({ vertexColors: true, side: THREE.DoubleSide, fog: false })));
    const cx = Fl.reduce((s, p) => s + p.x, 0) / 4, cz = Fl.reduce((s, p) => s + p.z, 0) / 4;
    this.beamPool = pool(new THREE.Color(0.45, 0.55, 0.95), 1.35, Math.abs(Fl[2].z - Fl[0].z) + 0.15, true);
    this.beamPool.position.set(cx, 0.006, cz);
    const dp: number[] = [];
    for (let i = 0; i < 90; i++) { const u = r(), v = r(), w = r(); const a = W[0].clone().lerp(W[1], u), b = W[3].clone().lerp(W[2], u), top = a.lerp(b, v); top.addScaledVector(d, w * 1.9); dp.push(top.x, top.y, top.z); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3));
    this.dust = onLayer(new THREE.Points(dg, new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: false, color: new THREE.Color(0.55, 0.65, 0.95), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));
    G.add(this.moon, this.moonHalo, this.stars, ...this.clouds, ...this.smoke, ...this.mist, ...this.bats, this.owl, this.beam, this.beamPool, this.dust);
  }

  /** outdoor / indoor visibility and motion; moonDir = world direction of the moon for this shot */
  update(f: number, outside: boolean, cam: THREE.PerspectiveCamera, moonDir: THREE.Vector3, shotId: number, batsOn: boolean, owlOn: boolean) {
    const t = f / 30;
    for (const o of [this.moon, this.moonHalo, this.stars, ...this.clouds, ...this.smoke, ...this.mist]) o.visible = outside;
    this.beam.visible = this.beamPool.visible = this.dust.visible = !outside;
    if (outside) {
      this.moon.position.copy(cam.position).addScaledVector(moonDir, 900); this.moon.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(2.6)));
      this.moonHalo.position.copy(cam.position).addScaledVector(moonDir, 890); this.moonHalo.scale.setScalar(2 * 890 * Math.tan(THREE.MathUtils.degToRad(13)));
      this.stars.position.copy(cam.position);
      // moonlit clouds drifting past the moon
      const up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3().crossVectors(moonDir, up).normalize(), u2 = new THREE.Vector3().crossVectors(right, moonDir).normalize();
      this.clouds.forEach((m, i) => {
        const off = ((t * 0.9 + i * 9) % 36) - 18, dy = [-5, 4, -9, 7][i];
        const p = moonDir.clone().multiplyScalar(850).addScaledVector(right, off * 14 + (i - 1.5) * 60).addScaledVector(u2, dy * 9);
        m.position.copy(cam.position).add(p); m.lookAt(cam.position); m.scale.set(200 + i * 30, 70 + i * 10, 1);
      });
      this.smoke.forEach((s, i) => {
        const u = (t * 0.12 + i / this.smoke.length) % 1, sz = 0.8 + u * 3.2;
        s.position.set(4.45 - u * 2.5, 6.0 + u * 5 + u * u * 2, 0.0 + u * 1.2); s.scale.setScalar(sz);
        (s.material as THREE.SpriteMaterial).opacity = 0.75 * (1 - u) * Math.min(1, u * 6);
      });
      const yard: [number, number, number][] = [[-6, 7, 14], [4, 9, 12], [0, 13.5, 16], [-10, 2, 12], [9, 3, 12]];
      const grave: [number, number, number][] = [[-34, -22, 12], [-30, -26, 10], [-38, -28, 12], [-33, -31, 14]];
      [...yard, ...grave].forEach(([x, z, w], i) => {
        const m = this.mist[i]; if (!m) return;
        const dx = ((t * 0.25 + i * 1.7) % 6) - 3;
        m.position.set(x + dx, 0.45, z); m.rotation.set(0, Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z), 0); m.scale.set(w, 1.3, 1);
      });
    } else {
      // dust motes drift slowly inside the beam
      this.dust.position.set(0.04 * Math.sin(t * 0.7), 0.05 * Math.sin(t * 0.5), 0.03 * Math.cos(t * 0.6));
    }
    // bats crossing the moon
    this.bats.forEach((b, i) => {
      b.visible = outside && batsOn;
      if (!b.visible) return;
      const right = new THREE.Vector3().crossVectors(moonDir, new THREE.Vector3(0, 1, 0)).normalize();
      const u = ((t * 0.18 + i * 0.27) % 1) * 2 - 1, D = 70 + i * 12;
      b.position.copy(cam.position).addScaledVector(moonDir, D).addScaledVector(right, u * D * 0.35).add(new THREE.Vector3(0, Math.sin(t * 3 + i) * 1.2 + (i - 1.5) * 2.5, 0));
      b.scale.set(2.6, 1.3, 1);
      (b.material as THREE.SpriteMaterial).map = batTex(Math.floor(f / 3 + i) % 2 === 0);
    });
    this.owl.visible = outside && owlOn;
    if (this.owl.visible) {
      this.owl.position.set(-34 + 2.35, 4.35, -26 - 3.65); this.owl.scale.set(0.55, 0.82, 1);
      (this.owl.material as THREE.SpriteMaterial).map = owlTex(f % 70 < 4);
    }
    void shotId;
  }
}
