// Every-frame framing / contact / camera-smoothness checker for The Chair (run from the engine root):
//   node_modules/.bin/esbuild out/busby/check/check.ts --bundle --platform=node --outfile=out/busby/check/check.cjs --alias:remotion=./out/busby/check/stub-remotion.js --inject:./out/busby/check/shim.js && node out/busby/check/check.cjs
// every-frame framing + contact check for The Chair: heads cut by the frame edge, characters inside furniture / walls
import * as THREE from "three";
import { SHOTS, TOTAL, shotAtT, camAt, focusAt } from "../../../src/videos/busby/story";
import { stage } from "../../../src/videos/busby/stage";
const U = 0.002219; // m per card unit (card 600 x 1000, sole at 975)
// furniture footprints (x0, x1, z0, z1, top y) per set; pub in PB coords (+680), museum (+600)
const P = (x0: number, x1: number, z0: number, z1: number, top: number) => [680 + x0, 680 + x1, z0, z1, top];
const BOX = [
  P(-1.05, 3.05, -2.58, -1.89, 1.09), // bar (behind it, z < -2.6, is the landlord's place)
  P(-2.43, -1.83, -2.45, -1.85, 0.66), // corner table
  P(0.17, 1.03, 0.47, 1.33, 0.75), P(-1.63, -0.77, 1.17, 2.03, 0.75), // tables
  P(-3.55, -3.05, 0.6, 2.6, 1.25), // settle
  P(3.24, 3.6, -0.05, 1.85, 1.6), P(2.85, 3.3, -0.15, 1.95, 0.06), // fireplace + hearth
];
const CHAIR = [677.25, -2.2]; // pub chair (sitters are allowed here)
const ROOMS = [[676.65, 683.35, -2.8, 3.0], [594.2, 605.8, -2.85, 9.0], [636.0, 644.0, -0.75, 3.0]];
const v = new THREE.Vector3(), cam = new THREE.PerspectiveCamera(38, 1080 / 1920, 0.1, 2000);
type C3 = { pos: [number, number, number]; look: [number, number, number]; fov: number; roll?: number };
const lens = (sh: typeof SHOTS[number], f: number, c: C3): C3 & { near: number } => {
  if (c.fov <= 27) return { ...c, near: 0.1 };
  const F = focusAt(sh, f), l = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], ll = Math.hypot(...l) || 1, u = l.map((x) => x / ll);
  const ds = Math.max(0.6, (F[0] - c.pos[0]) * u[0] + (F[1] - c.pos[1]) * u[1] + (F[2] - c.pos[2]) * u[2]);
  const t0 = Math.tan((c.fov * Math.PI) / 360), k = t0 / Math.tan((26 * Math.PI) / 360), D = Math.min(ds * (k - 1), 4.5), t1 = (t0 * ds) / (ds + D);
  return { pos: [c.pos[0] - u[0] * D, c.pos[1] - u[1] * D, c.pos[2] - u[2] * D], look: c.look, fov: (2 * Math.atan(t1) * 180) / Math.PI, roll: c.roll, near: D + 0.1 };
};
const setCam = (c: C3 & { near: number }) => { cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll ?? 0); cam.fov = c.fov; cam.near = c.near; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); };
const issues: Record<string, number[]> = {};
const flag = (k: string, f: number) => { (issues[k] ??= []).push(f); };
for (let f = 0; f < TOTAL; f++) {
  const s = shotAtT(f, undefined), c0 = camAt(s, f), c = lens(s, f, c0 as C3); setCam(c);
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
  const st = stage(f, s, { pos: cam.position.clone(), right, sun: new THREE.Vector3(0, 1, 0), fov: c.fov });
  for (const p of st.places) {
    const sc = p.scale ?? 1, name = (p.key.split("|")[1] ?? "?").replace("bz_", "");
    const sit = p.key.includes('"mode":"sit"'), hs = (p.who?.o?.shape?.head ?? 1);
    const headY = p.y + ((sit ? 1.27 : 1.62) + (hs - 1) * 0.29) * sc, hr = 0.3 * hs * sc, hatTop = headY + hr + 0.24 * sc;
    const pts = [[0, hatTop], [-hr, headY], [hr, headY], [0, headY - hr]].map(([dx, y]) => v.set(p.x + right.x * dx, y, p.z + right.z * dx).clone().project(cam));
    const inside = pts.map((q) => q.z < 1 && q.z > -1 && Math.abs(q.x) <= 1 && Math.abs(q.y) <= 1);
    const anyIn = inside.some(Boolean), allIn = inside.every(Boolean);
    const dist = cam.position.distanceTo(v.set(p.x, headY, p.z));
    if (anyIn && !allIn) flag(`head cut by frame edge: ${name}`, f);
    if (dist < 0.75 && anyIn) flag(`camera too close to ${name} (${dist.toFixed(2)} m)`, f);
    if (p.y < 0.05) { // standing on the floor: inside furniture? outside the room?
      for (const b of BOX) if (p.x > b[0] - 0.12 && p.x < b[1] + 0.12 && p.z > b[2] - 0.02 && p.z < b[3] + 0.08) flag(`${name} inside furniture`, f);
      const inRoom = ROOMS.some((r) => p.x > r[0] && p.x < r[1] && p.z > r[2] && p.z < r[3]);
      if (!inRoom) flag(`${name} outside the room / in a wall`, f);
      if (sit && Math.hypot(p.x - CHAIR[0], p.z - CHAIR[1]) > 0.3) flag(`${name} sitting on nothing`, f);
    }
  }
  // camera inside furniture
  for (const b of BOX) if (c0.pos[0] > b[0] && c0.pos[0] < b[1] && c0.pos[2] > b[2] && c0.pos[2] < b[3] && c0.pos[1] < b[4] + 0.05) flag(`CAMERA inside furniture (shot ${s.id})`, f);
}
// framing fit: the vertical fov each shot's key camera needs so every head fits (with 8 % margin), at 3 frames
const fit: string[] = [];
for (const sh of SHOTS) {
  let need = 0, who = "";
  for (const f of [sh.a + 2, Math.round((sh.a + sh.b) / 2), sh.b - 2]) {
    const c = camAt(sh, f) as C3; setCam({ ...c, near: 0.1 });
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), inv = cam.matrixWorldInverse;
    const st = stage(f, sh, { pos: cam.position.clone(), right, sun: new THREE.Vector3(0, 1, 0), fov: c.fov });
    for (const p of st.places) { const sc = p.scale ?? 1, sit = p.key.includes('"mode":"sit"'), hs = (p.who?.o?.shape?.head ?? 1), hy = p.y + ((sit ? 1.27 : 1.62) + (hs - 1) * 0.29) * sc, hr = 0.3 * hs * sc;
      for (const [dx, y] of [[0, hy + hr + 0.24 * sc], [-hr, hy], [hr, hy], [0, hy - hr]]) { const q = v.set(p.x + right.x * dx, y, p.z + right.z * dx).applyMatrix4(inv); const z = -q.z; if (z < 0.3) continue;
        const t = Math.max(Math.abs(q.y) / z, (Math.abs(q.x) / z) * (1920 / 1080)) / 0.92, fv = (2 * Math.atan(t) * 180) / Math.PI;
        if (fv > need) { need = fv; who = `${(p.key.split("|")[1] ?? "?").replace("bz_", "")} @f${f}`; } } }
  }
  const cur = (sh.keys[0].fov ?? 40);
  if (need > cur + 0.5) fit.push(`shot ${sh.id}: needs fov ${need.toFixed(1)} (now ${cur}) for ${who}`);
}
console.log(fit.join("\n"));
// camera smoothness: jerks in position / view direction between consecutive frames (not across cuts)
{ let pp: number[] | null = null, pv: number[] | null = null, pd: number[] | null = null, pdv: number[] | null = null, sid = -1; const J: string[] = [];
  for (let f = 0; f < TOTAL; f++) {
    const sh = shotAtT(f, undefined), c = lens(sh, f, camAt(sh, f) as C3), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], dl = Math.hypot(...d), dn = d.map((x) => x / dl);
    const cut = sh.id !== sid || sh.keys.some((k) => k.glide !== undefined && k.glide <= 1 && (k.f === f || k.f === f - 1));
    if (pp && !cut) {
      const vel = c.pos.map((x, i) => x - pp![i]), dv = dn.map((x, i) => x - pd![i]);
      if (pv && pdv) { const acc = Math.hypot(...vel.map((x, i) => x - pv![i])), sp = Math.max(Math.hypot(...vel), Math.hypot(...pv)), aacc = Math.hypot(...dv.map((x, i) => x - pdv![i])), asp = Math.max(Math.hypot(...dv), Math.hypot(...pdv));
        if ((sp > 0.0015 && acc > 0.3 * sp) || (asp > 0.0008 && aacc > 0.3 * asp)) J.push(`${f}(s${sh.id} ${(acc / Math.max(sp, 1e-9)).toFixed(2)}/${(aacc / Math.max(asp, 1e-9)).toFixed(2)})`); }
      pv = vel; pdv = dv;
    } else { pv = null; pdv = null; }
    pp = c.pos; pd = dn; sid = sh.id;
  }
  console.log(`camera jerks: ${J.length}${J.length ? " -> " + J.slice(0, 60).join(" ") : ""}`); }
const runs = (fs: number[]) => { const o: string[] = []; let a = fs[0], b = fs[0]; for (const x of fs.slice(1)) { if (x === b + 1) b = x; else { o.push(a === b ? `${a}` : `${a}-${b}`); a = b = x; } } o.push(a === b ? `${a}` : `${a}-${b}`); return o.join(", "); };
const keys = Object.keys(issues).sort();
console.log(keys.length ? keys.map((k) => `${k}: ${issues[k].length} f [${runs(issues[k])}]`).join("\n") : "NO ISSUES");
void SHOTS;
