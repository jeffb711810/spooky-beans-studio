// usage: node scripts/stills-variants.mjs <outPrefix> <frames> <scale> '<json: {name: props, ...}>'
// Bundles ONCE, then renders the same frames for each named props variant -> <outPrefix><name>_<frame>.jpg
import fs from "node:fs";
if (process.env.REMOTION_TMP) { fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true }); process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP; }
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [prefix, frames, scale = "1", variantsJson] = process.argv.slice(2);
const variants = JSON.parse(variantsJson);
const browserExecutable = process.env.CHROME_PATH || null;
const chromiumOptions = { gl: process.env.REMOTION_GL || "angle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
for (const [name, inputProps] of Object.entries(variants)) {
  const composition = await selectComposition({ serveUrl, id: process.env.COMP || "BellWitch", browserExecutable, chromiumOptions, inputProps });
  for (const f of frames.split(",").map(Number)) {
    const t0 = Date.now();
    await renderStill({ composition, serveUrl, inputProps, frame: f, output: `${prefix}${name}_${f}.jpg`, imageFormat: "jpeg", jpegQuality: 92, scale: Number(scale),
      browserExecutable, chromiumOptions, timeoutInMilliseconds: 240000 });
    console.log("still", name, f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  }
}
console.log("ALL DONE");
