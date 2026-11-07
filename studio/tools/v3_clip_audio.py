"""Test-clip audio: a slice of the Winchester score + a whoosh on the whip. usage: music.wav out.wav [seconds] [whoosh_at]"""
import sys, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
sr, m = wavfile.read(sys.argv[1]); m = m.astype(float) / (32768.0 if m.dtype == np.int16 else 1.0)
if m.ndim == 1: m = np.stack([m, m], 1)
DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 6.0; WT = float(sys.argv[4]) if len(sys.argv) > 4 else 2.38
seg = m[int(24 * sr):int((24 + DUR) * sr)].copy(); n = len(seg); t = np.arange(n) / sr
seg *= np.clip(t / 0.08, 0, 1)[:, None] * np.clip((DUR - t) / 0.45, 0, 1)[:, None]
L = int(0.5 * sr); tt = np.arange(L) / sr; rng = np.random.default_rng(5)
env = np.where(tt < 0.16, (tt / 0.16) ** 2, np.exp(-(tt - 0.16) / 0.07))
w = np.zeros((L, 2))
for ch in range(2):
    x = rng.standard_normal(L); y = np.zeros(L)
    for k, (lo, hi) in enumerate([(300, 1400), (700, 3000), (1500, 6000)]):        # rising band sweep
        sos = butter(2, [lo, hi], btype="band", fs=sr, output="sos"); seg_k = sosfilt(sos, x)
        wk = np.clip(1 - abs(tt / 0.30 - k / 2), 0, 1); y += seg_k * wk
    w[:, ch] = y * env * (0.8 if ch == 0 else 1.0)
w /= np.abs(w).max() + 1e-9; s0 = int(WT * sr); seg[s0:s0 + L] += 0.35 * w[:max(0, min(L, n - s0))]
seg *= 10 ** (-1.0 / 20) / (np.abs(seg).max() + 1e-9)
wavfile.write(sys.argv[2], sr, (seg * 32767).astype(np.int16))
