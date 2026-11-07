# Conform a new narration take to the existing (Adam, tightened) timeline: phrase by phrase, pitch-preserving tempo so
# each phrase starts and ends where the old one did; pauses are rebuilt as silence. Writes voice_tight.wav + words.json
# (same format as ../voice) so the cuts, captions, lip sync and SFX of the film stay valid. Stretch clamped 0.8..1.3.
import json, subprocess, wave, numpy as np
OLD = json.load(open("../voice/timeline_target.json") if __import__("os").path.exists("../voice/timeline_target.json") else open("../voice/words.json")); NEW = json.load(open("words_raw.json"))
assert len(OLD) == len(NEW)
w = wave.open("voice.wav", "rb"); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32); w.close()
n = len(OLD); starts = [0]
for k in range(1, n):
    if OLD[k]["s"] - OLD[k - 1]["e"] > 0.09 or NEW[k]["s"] - NEW[k - 1]["e"] > 0.14: starts.append(k)
starts.append(n)
TOT = OLD[-1]["e"] + 0.6
out = np.zeros(int(TOT * sr) + sr, np.float32); words = []; t_end_prev = 0.0; rep = []
for a, b in zip(starts[:-1], starts[1:]):
    ta0, ta1 = OLD[a]["s"], OLD[b - 1]["e"]                     # target span
    s0, s1 = NEW[a]["s"], NEW[b - 1]["e"]                       # source span (pad 40 ms each side for clean edges)
    p0, p1 = max(0.0, s0 - 0.04), min(len(x) / sr, s1 + 0.06)
    ratio = float(np.clip((ta1 - ta0) / max(0.05, s1 - s0), 0.8, 1.3))   # output/input duration
    seg = x[int(p0 * sr):int(p1 * sr)]
    open("_seg.raw", "wb").write(seg.astype(np.int16).tobytes())
    tempo = 1 / ratio
    y = subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "_seg.raw", "-af", f"atempo={tempo:.5f}", "-f", "s16le", "-"], capture_output=True).stdout
    y = np.frombuffer(y, np.int16).astype(np.float32)
    fade = int(0.008 * sr); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    t0 = max(ta0 - (s0 - p0) * ratio, t_end_prev)                  # never overlap the previous phrase
    k0 = int(t0 * sr); out[k0:k0 + len(y)] += y[:len(out) - k0]
    off = t0 + (s0 - p0) * ratio
    for k in range(a, b): words.append({"w": NEW[k]["w"], "s": round(off + (NEW[k]["s"] - s0) * ratio, 3), "e": round(off + (NEW[k]["e"] - s0) * ratio, 3)})
    t_end_prev = t0 + len(y) / sr - 0.01
    rep.append((OLD[a]["w"], round(ratio, 3), round(off - ta0, 3)))
out = out[:int((words[-1]["e"] + 0.5) * sr)]
w2 = wave.open("_conf.wav", "wb"); w2.setnchannels(1); w2.setsampwidth(2); w2.setframerate(sr); w2.writeframes(np.clip(out, -32768, 32767).astype(np.int16).tobytes()); w2.close()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "_conf.wav", "-ar", "48000", "-ac", "1", "voice_tight.wav"], check=True)
json.dump(words, open("words.json", "w"), indent=0)
r = np.array([q[1] for q in rep]); d = np.array([q[2] for q in rep])
print(f"phrases {len(rep)}  stretch out/in: min {r.min():.2f} med {np.median(r):.2f} max {r.max():.2f}  clamped {(np.abs(r-0.8)<1e-3).sum()+(np.abs(r-1.3)<1e-3).sum()}  start drift max {np.abs(d).max():.3f}s")
print("old end", OLD[-1]["e"], "new end", words[-1]["e"])
