// One-command final render (Windows / Mac / Linux): `npm run final` -> out/winchester_4K_2160x3840.mp4 with the soundtrack.
// True 4K (scale 2 + post dpr 2), PNG frames, H.264 High @ level 5.1 with a VBV cap (phone-safe), AAC 256k.
// Uses the graphics card through ANGLE on Windows / macOS ("--cpu" forces software rendering if the GPU path fails).
import path from "node:path";
import os from "node:os";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const cpu = process.argv.includes("--cpu"), hd = process.argv.includes("--1080"), safe = process.argv.includes("--safe");
// which video: --comp <id> (default the Winchester short, composition "BellWitch"); output named after it
const ci = process.argv.indexOf("--comp"), COMP = ci > 0 ? process.argv[ci + 1] : "BellWitch", NAME = COMP === "BellWitch" ? "winchester" : COMP.toLowerCase();
const gl = cpu || process.platform === "linux" ? "swangle" : "angle";
const out = path.resolve(hd ? `out/${NAME}_1080x1920.mp4` : `out/${NAME}_4K_2160x3840.mp4`);
const inputProps = { post: { dpr: 2 }, withAudio: true };
console.log(`Bundling... (renderer: ${gl}, ${os.cpus().length} CPU threads)`);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const chromiumOptions = { gl };
const browserExecutable = process.env.CHROME_PATH || null; // optional; by default Remotion downloads its own headless Chrome once
const composition = await selectComposition({ serveUrl, id: COMP, inputProps, chromiumOptions, browserExecutable, timeoutInMilliseconds: 600000 });
const level = hd ? "4.1" : "5.1";
const range = process.env.FRAMES ? process.env.FRAMES.split("-").map(Number) : null;
const total = range ? range[1] - range[0] + 1 : composition.durationInFrames;
const t0 = Date.now(), hm = (s) => `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
let last = -1;
await renderMedia({
  composition, serveUrl, inputProps, chromiumOptions, browserExecutable, outputLocation: out,
  frameRange: range,
  codec: "h264", scale: process.env.SCALE ? Number(process.env.SCALE) : hd ? 1 : 2, imageFormat: "png", crf: hd ? 17 : 16, x264Preset: "slow", pixelFormat: "yuv420p",
  encodingMaxRate: hd ? "20M" : "30M", encodingBufferSize: hd ? "40M" : "60M", audioCodec: "aac", audioBitrate: "256k",
  timeoutInMilliseconds: 600000, concurrency: process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : safe ? 2 : null,
  ffmpegOverride: ({ args }) => (args.includes("libx264") ? [...args.slice(0, -1), "-profile:v", "high", "-level:v", level, "-movflags", "+faststart", args[args.length - 1]] : args),
  onProgress: ({ progress, renderedFrames }) => {
    const pc = Math.floor(progress * 100);
    if (pc !== last) {
      last = pc; const el = (Date.now() - t0) / 1000;
      console.log(`${pc}%  (${renderedFrames} / ${total} frames)  ${hm(el)} so far${progress > 0.02 ? `, about ${hm((el / progress) * (1 - progress))} left` : ""}`);
    }
  },
});
console.log(`DONE -> ${out}`);
