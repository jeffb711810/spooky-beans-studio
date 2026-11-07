// REALISTIC WORLD (user: "change the world completely... 3D blender looking... our world needs to look more 3d and
// real"): CC0 photo-scanned PBR textures from Poly Haven (public/ph, diffuse + OpenGL normal map), preloaded before the
// first frame so the materials can take them synchronously. The characters stay 2D and inked; only the world changes.
import * as THREE from "three";
import { staticFile } from "remotion";

const IDS = ["old_wood_floor", "plastered_wall_02", "wooden_panels", "rough_wood", "wood_table_worn", "herringbone_parquet"] as const;
export type PhId = (typeof IDS)[number];
const C = new Map<string, THREE.Texture>();

export const loadPH = () => Promise.all(IDS.flatMap((id) => (["diff", "nor"] as const).map((k) => new Promise<void>((res) => {
  new THREE.TextureLoader().load(staticFile(`ph/${id}_${k}.jpg`), (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16;
    t.colorSpace = k === "diff" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    C.set(`${id}_${k}`, t); res();
  }, undefined, () => res());
}))));

/** a repeated copy of a loaded texture (undefined if it failed to load: callers fall back to the painted one) */
export const ph = (id: PhId, k: "diff" | "nor", rx: number, ry: number, rot = 0) => {
  const t0 = C.get(`${id}_${k}`); if (!t0) return undefined;
  const t = t0.clone(); t.repeat.set(rx, ry); if (rot) { t.center.set(0.5, 0.5); t.rotation = rot; } t.needsUpdate = true; return t;
};
/** Lambert parameters for a photo material: diffuse map, normal map (relief that catches the key light), a tint */
export const phMat = (id: PhId, rx: number, ry: number, color = "#ffffff", ns = 1, rot = 0) => {
  const map = ph(id, "diff", rx, ry, rot), normalMap = ph(id, "nor", rx, ry, rot);
  return map ? { map, normalMap, normalScale: new THREE.Vector2(ns, ns), color } : undefined;
};
