# Full-video QC scan of the low-res preview: (1) frame-to-frame pops / flicker away from cuts, (2) flat frames (camera
# inside geometry), (3) purple / magenta pixels (user: NO purple anywhere). Prints flagged frames; writes scan.json.
import sys, json, re, subprocess, numpy as np
src = sys.argv[1]; W, H = 135, 240
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32) / 255
n = len(fr); print("frames", n)
st = open(__import__("os").path.join(__import__("os").path.dirname(__import__("os").path.abspath(__file__)), "..", "src", "videos", "bellwitch", "story.ts")).read()
cuts = sorted({int(a) for a in re.findall(r"id: 1\d\d, a: (\d+)", st)} | {733, 762, 545, 790, 1617})   # shot starts + in-shot snaps
dips = [(50, 74), (866, 886)]
lum = fr @ np.array([0.2126, 0.7152, 0.0722], np.float32)
d = np.abs(np.diff(lum, axis=0)).mean((1, 2))                 # mean abs luma change f -> f+1
flag = []
for f in range(1, n - 1):
    near_cut = any(abs(f + 1 - c) <= 1 for c in cuts) or any(a - 1 <= f <= b + 1 for a, b in dips)
    loc = np.median(d[max(0, f - 6):f + 7])
    if not near_cut and d[f] > max(0.035, 3.5 * loc): flag.append(("pop", f + 1, round(float(d[f]), 3), round(float(loc), 3)))
sd = lum.std((1, 2))
for f in range(n):
    if sd[f] < 0.05: flag.append(("flat", f, round(float(sd[f]), 3)))
mx, mn = fr.max(3), fr.min(3); sat = (mx - mn) / np.maximum(mx, 1e-4)
r_, g_, b_ = fr[..., 0], fr[..., 1], fr[..., 2]
hue = np.degrees(np.arctan2(np.sqrt(3) * (g_ - b_), 2 * r_ - g_ - b_)) % 360
purple = ((hue > 255) & (hue < 330) & (sat > 0.28) & (mx > 0.18)).mean((1, 2))
for f in range(n):
    if purple[f] > 0.004: flag.append(("purple", f, round(float(purple[f]) * 100, 2)))
json.dump({"flags": flag, "diff": d.tolist(), "purple": purple.tolist()}, open(src + ".scan.json", "w"))
for k in ("pop", "flat", "purple"):
    fl = [x for x in flag if x[0] == k]; print(k, len(fl), fl[:40])
