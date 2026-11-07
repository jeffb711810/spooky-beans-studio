# Shrink pauses (silencedetect spans) by punctuation context, then pitch-preserving tempo -> voice_tight.wav + words.json
import json, subprocess, re, sys, numpy as np, wave
TEMPO = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
words = json.load(open("words_raw.json"))
log = subprocess.run(["ffmpeg", "-i", "voice.wav", "-af", "silencedetect=noise=-35dB:d=0.15", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]; en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
sil = list(zip(st, en))
w = wave.open("voice.wav", "rb"); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)
def keep_for(a, b):
    prev = [o for o in words if o["e"] <= a + 0.12]
    if not prev: return 0.05                       # lead-in: start talking at once
    p = prev[-1]["w"].split("~")[0]
    if p.endswith("..."): return 0.42
    if p.endswith((".", "?", "!", '"')): return 0.24
    if p.endswith(","): return 0.14
    return 0.10
pieces, tmap, cur, t_out = [], [], 0.0, 0.0       # tmap: (t_in, t_out) knots
for a, b in sil:
    k = min(b - a, keep_for(a, b))
    if b - a - k < 0.03: continue
    cut0, cut1 = a + k / 2, b - k / 2              # drop the middle of the pause
    seg = x[int(cur * sr): int(cut0 * sr)]
    tmap.append((cur, t_out)); t_out += len(seg) / sr; tmap.append((cut0, t_out))
    pieces.append(seg); cur = cut1
seg = x[int(cur * sr):]; tmap.append((cur, t_out)); t_out += len(seg) / sr; tmap.append((len(x) / sr, t_out)); pieces.append(seg)
# 8 ms crossfades at the joins
fade = int(0.008 * sr); y = pieces[0]
for p in pieces[1:]:
    r = np.linspace(0, 1, fade); y = np.concatenate([y[:-fade], y[-fade:] * (1 - r) + p[:fade] * r, p[fade:]])
w2 = wave.open("_cut.wav", "wb"); w2.setnchannels(1); w2.setsampwidth(2); w2.setframerate(sr); w2.writeframes(np.clip(y, -32768, 32767).astype(np.int16).tobytes()); w2.close()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "_cut.wav", "-af", f"atempo={TEMPO}", "-ar", "48000", "-ac", "1", "voice_tight.wav"], check=True)
ti, to = np.array([a for a, _ in tmap]), np.array([b for _, b in tmap])
remap = lambda t: float(np.interp(t, ti, to)) / TEMPO
out = [{"w": o["w"], "s": round(remap(o["s"]), 3), "e": round(remap(o["e"]), 3)} for o in words]
json.dump(out, open("words.json", "w"), indent=0)
print(f"in {len(x)/sr:.1f}s -> cut {t_out:.1f}s -> tempo {TEMPO}: {t_out/TEMPO:.1f}s; last word ends {out[-1]['e']:.2f}s")
