# "The Chair Nobody Is Allowed to Sit In" (built on the Winchester score engine) - original score + SFX + final mix, own synthesis via the template
# instruments. Score: playful-mysterious, D minor / F major, 114.6 BPM so one eighth note = one hammer swing of the
# animation (sin(f*0.8): 7.854 frames). Sections follow the story beats (frames of story.ts). SFX are placed on the
# animation's own frames (bonks, door, coins, seance, bell, quake, hammering, the silence when it stops).
# Outputs: music.wav, sfx.wav, mix.wav (voice at frame 36), mix_preview.mp3. -14 LUFS, <= -1.3 dBTP.
import sys, json, subprocess, numpy as np
from scipy import signal, ndimage
sys.path.insert(0, "/home/user/mromidev/claude-animated-shorts/templates/audio")
from dsp import (SR, ns, tt, rng, lp, hp, bp, st, pan, peq, shelf, write_wav, read_wav, integrated, momentary, fades,
                 phase, smooth_noise, colored, make_ir, convolve_st, true_peak, modal, dbg, resbank)
from instruments import m2f, musicbox, pluck, vibes, pad, glock, brass, snare, brush, cymbal, timpani, triangle
from sfx_gen import (hammer_hit, wood_crack, timber_tear, whoosh, creak, clink, crickets, breeze, push_thump, rattle,
                     oof, whoa, babble, bird_chirps, stroll_step, vox)

FPS, TOTAL, VO = 30, 1826, 6
DUR = TOTAL / FPS; N = ns(DUR)
A = "/home/user/cartoon-short/stories/busby/audio/"; V = "/home/user/cartoon-short/stories/busby/voice/"
F = lambda f: f / FPS
r = rng(1906); r2 = rng(1881)
BPM = 30 * 60 / (2 * 2 * np.pi / 0.8); B = 60 / BPM; E8 = B / 2; BAR = 4 * B     # 114.6 BPM
BUS = {k: np.zeros((2, N)) for k in ("keys", "str", "perc", "pads", "brass")}


def put(x, t, g=1.0, p=0.0, bus="keys", buf=None):
    x = np.asarray(x, float); x = pan(x, p) if x.ndim == 1 else st(x)
    b = BUS[bus] if buf is None else buf
    k = ns(t)
    if k >= b.shape[1] or k + x.shape[1] <= 0: return
    a = max(0, -k); m = min(x.shape[1], b.shape[1] - k)
    b[:, k + a:k + m] += g * x[:, a:m]


def hum(t): return t + float(np.clip(r2.normal(0, 0.004), -0.009, 0.009))


# ---------------------------------------------------------------- voices
def mb(m, t, vel=0.5, p=0.25, dur=1.3):          # music box with a twin tine (shimmer)
    put(musicbox(m2f(m), vel, r, dur), hum(t), 1.0, p, "keys")
    put(musicbox(m2f(m) * 2 ** (4.5 / 1200), vel * 0.5, r2, dur * 0.85), t + 0.003, 1.0, max(-1, p - 0.6), "keys")


def pz(m, t, vel=0.55, dur=0.45, bright=0.4, p=-0.2):   # pizzicato (+ sine sub under low notes)
    f = m2f(m); y = pluck(f, vel, r, dur, bright)
    if f < 120:
        tq = np.arange(len(y)) / SR
        y = y + 0.32 * vel * np.sin(2 * np.pi * f * tq) * np.exp(-tq / (0.22 + 0.25 * dur)) * (1 - np.exp(-tq / 0.004))
    put(y, hum(t), 1.0, p, "str")


def wood(vel=0.5, f1=1180):
    d = 0.12; t = tt(d)
    y = np.sin(2 * np.pi * f1 * t) * np.exp(-t / 0.018) + 0.6 * np.sin(2 * np.pi * f1 * 1.6 * t) * np.exp(-t / 0.01)
    y += bp(r.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004) * 0.3
    return y * vel


def gl(m, t, vel=0.45, p=0.3, dur=1.4): put(glock(m2f(m), vel, r, dur), hum(t), 1.0, p, "keys")
def vb(m, t, vel=0.4, p=-0.3, dur=1.8): put(vibes(m2f(m), vel, r, dur), hum(t), 1.0, p, "keys")
def pd(ms, t, d, vel=0.32, warm=900): put(pad([m2f(m) for m in ms], d, vel, r, 0.5, 0.9, warm), t, 1.0, 0.0, "pads")


def choir(ms, t, d, vel=0.35):
    for side, rr, dt in ((-0.38, r, 0.0), (0.38, r2, 0.012)):
        n = ns(d); y = np.zeros(n)
        for m in ms:
            f0 = np.full(n, m2f(m) * 2 ** (rr.uniform(-3, 3) / 1200)) * (1 + 0.006 * np.sin(2 * np.pi * 5.2 * np.arange(n) / SR + rr.uniform(0, 6)))
            forms = np.tile([330, 800, 2400, 3300], (n, 1)).astype(float)
            amp = np.minimum(1, np.arange(n) / ns(0.5)) * np.minimum(1, (n - np.arange(n)) / ns(0.6))
            y += vox(f0, forms, amp, rr, 1.0, breath=0.25)
        put(y * vel / len(ms), t + dt, 0.8, side, "pads")


CH = {"Dm": [50, 53, 57], "Gm": [55, 58, 62], "A": [52, 55, 57, 61], "Bb": [53, 58, 62], "F": [53, 57, 60], "C": [52, 55, 60], "C7": [52, 55, 58, 60]}
ROOT = {"Dm": 38, "Gm": 43, "A": 45, "Bb": 46, "F": 41, "C": 36, "C7": 36}


def creep_bar(t0, ch, vel=0.5, tick=True):
    for k, iv in enumerate([0, 7, 12, 7]): pz(ROOT[ch] + iv, t0 + k * B, vel * (1.0 if k == 0 else 0.72), 0.5, 0.35)
    if tick:
        for k in (1, 3): put(wood(0.3), hum(t0 + k * B), 1.0, 0.35, "perc")
        put(wood(0.13), hum(t0 + 3.5 * B), 1.0, 0.35, "perc")


def oompah_bar(t0, ch, vel=0.5, tuba=True, snr=True, blocks=True):
    if tuba:
        put(brass(m2f(ROOT[ch]), B * 0.8, vel * 0.9, r, "tuba"), hum(t0), 0.9, -0.1, "brass")
        put(brass(m2f(ROOT[ch] + 7 - (12 if ROOT[ch] + 7 > 47 else 0)), B * 0.8, vel * 0.75, r, "tuba"), hum(t0 + 2 * B), 0.9, -0.1, "brass")
    else:
        pz(ROOT[ch], t0, vel); pz(ROOT[ch] + 7, t0 + 2 * B, vel * 0.8)
    for k in (1, 3):
        tk = hum(t0 + k * B)
        for m in CH[ch]: put(pluck(m2f(m), vel * 0.42, r, 0.25, 0.6), tk + r2.uniform(0, 0.006), 1.0, 0.15, "str")
        if snr: put(brush(vel * 0.5, r, 0.3), tk, 1.0, 0.25, "perc")
    if blocks:
        for k in range(8): put(wood(0.16 if k % 2 else 0.22, 1320), hum(t0 + k * E8), 1.0, 0.45, "perc")


def line(t0, notes, step, fn, **kw):
    for i, m in enumerate(notes):
        if m is not None: fn(m, t0 + i * step, **kw)


M_A = [69, 74, 76, 77, 76, 74, 73, 74]; M_B = [77, 79, 81, 82, 81, None, 77, None]; M_C = [76, 74, 73, 76, 74, None, None, None]
G1 = [65, 69, 72, 69, 70, 74, 72, None]; G2 = [69, 72, 77, 72, 67, 70, 69, None]
G3 = [65, 69, 72, 77, 76, 74, 72, 70]; G4 = [69, 67, 65, None, 72, None, 65, None]

# ================================================================ SCORE v2 (user: "remake our music and ambient sound to fit our
# theme": fun, exciting, mysterious, bouncy, silly - Aiden's energy). A sneaky swung mystery groove (pizz walking bass,
# finger snaps, shaker), a comic BASSOON theme, THEREMIN for the spooky lines, CELESTA sparkles on gags; the construction
# sections switch to a straight tuba oom-pah locked to the hammer swings. Same story beats / timeline as v1.
SW = 0.62                                               # swing: the off-eighth lands at 62 % of the beat
def e8(t0, k): return t0 + (k // 2) * B + (k % 2) * SW * B
def bassoon(m, dur, vel=0.5):
    f = m2f(m); n = ns(dur + 0.06); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.02) ** 1.2 * np.where(t < dur, 1 - 0.3 * (t / max(dur, 1e-3)), 0.7 * np.exp(-(t - dur) / 0.025))
    vib = 1 + 0.0035 * np.sin(2 * np.pi * 5.3 * t) * np.clip((t - 0.18) / 0.2, 0, 1)
    ph = phase(f * vib * (1 - 0.015 * np.exp(-t / 0.02))); y = np.zeros(n)
    for k in range(1, int(min(36, 4200 / f)) + 1):
        fk = k * f; a_ = k ** -0.55 * (0.3 + 2.0 * np.exp(-((fk - 470) / 170) ** 2) + 0.8 * np.exp(-((fk - 1150) / 260) ** 2)) / (1 + (fk / 2400) ** 4)
        y += a_ * np.sin(k * ph + r.uniform(0, 2 * np.pi))
    return fades(y * env * vel * 0.22, 0.002, 0.02)
def celesta(m, vel=0.5, dur=1.1):
    f = m2f(m); t = tt(dur)
    y = modal(dur, [(f, 1.0, 0.75 * (1000 / f) ** 0.3), (2 * f, 0.10 * vel, 0.22), (4.1 * f, 0.03 * vel, 0.05)], r)
    return fades(y * vel * (1 - np.exp(-t[:len(y)] / 0.002)), 0.0005, 0.05)
def snap(vel=0.35):
    t = tt(0.08); y = bp(r.standard_normal(len(t)), 2200, 8000) * np.exp(-t / 0.007) + np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.003) * 0.3
    return fades(y * vel, 0.0003, 0.01)
def shaker(vel=0.12): t = tt(0.08); return hp(r.standard_normal(len(t)), 6000) * np.minimum(1, t / 0.012) * np.exp(-t / 0.022) * vel
def theremin(notes, vel=0.3, glide=0.09):
    T1 = notes[-1][0] + notes[-1][2] + 0.25; n = ns(T1); t = np.arange(n) / SR; pts_t, pts_m = [], []
    for (s_, m, d) in notes: pts_t += [s_, s_ + max(glide, d - glide)]; pts_m += [m, m]
    mm = np.interp(t, pts_t, pts_m); vib = 0.22 * np.sin(2 * np.pi * 5.6 * t) * np.clip(t / 0.4, 0, 1)
    ph = phase(440 * 2 ** ((mm + vib - 69) / 12)); y = np.sin(ph) + 0.10 * np.sin(2 * ph) + 0.03 * np.sin(3 * ph)
    return lp(y * np.minimum(1, t / 0.18) * np.clip((T1 - t) / 0.35, 0, 1) * vel, 1600)
def bsn(m, t, d=0.22, vel=0.5, p=-0.15): put(bassoon(m, d, vel), hum(t), 1.0, p, "brass")
def cel(m, t, vel=0.4, p=0.3): put(celesta(m, vel), hum(t), 1.0, p, "keys")
def sneak_bar(t0, ch, vel=0.5, snaps=True, shake=True):
    """swung walking pizz bass + snaps on 2 and 4 + shaker eighths"""
    root = ROOT[ch]
    for k, iv in enumerate([0, 3 if ch in ("Dm", "Gm") else 4, 7, 6 if ch in ("Dm", "Gm") else 9]): pz(root + iv, t0 + k * B, vel * (1 if k == 0 else 0.78), 0.32, 0.45)
    if snaps:
        for k in (1, 3): put(snap(0.3), hum(t0 + k * B), 1.0, 0.35, "perc")
    if shake:
        for k in range(8): put(shaker(0.1 if k % 2 else 0.14), e8(t0, k), 1.0, -0.4, "perc")
T1A = [50, None, 53, 57, 56, 57, None, 50]; T1B = [52, 53, 52, 50, 49, None, 45, None]   # the bassoon theme (swung)
T2A = [62, None, 65, 69, 68, 69, None, 74]; T2B = [72, 70, 69, 67, 65, None, 62, None]
def theme(t0, bars, vel=0.55, octave=0):
    for b_, notes in enumerate(bars):
        for k, m in enumerate(notes):
            if m is not None: bsn(m + octave, e8(t0 + b_ * BAR, k), 0.2 if k % 2 else 0.26, vel)
# ================================================================ SCORE v3 (user 2026-11-07: "I want our music to be better it
# doesnt flow with the story or our characters voice"). v2 switched genre ~15 times in 78 s (sneak groove, music box, tuba
# oom-pah, theremin, timpani...). v3 is ONE sound world for the whole film: a swung pizz walking bass, light snaps +
# shaker, and a celesta / glock / vibes / music-box melody that ANSWERS Aiden - melodic phrases only in his pauses (call
# and response), the bass and percussion low and out of his voice band while he talks. The story is told by density:
# the groove thins for the sad and spooky turns, builds for the construction, dies with Sarah, and returns for today.
words = json.load(open(V + "words.json"))
spans = []
for w in words:
    s_, e_ = float(w["s"]) + F(VO), float(w["e"]) + F(VO)
    if spans and s_ - spans[-1][1] < 0.3: spans[-1][1] = max(spans[-1][1], e_)
    else: spans.append([s_, e_])
GAPS = [(spans[i][1], spans[i + 1][0]) for i in range(len(spans) - 1) if spans[i + 1][0] - spans[i][1] >= 0.42]
GAPS.append((spans[-1][1], DUR))
def gq(t): return np.ceil(t / E8 - 1e-6) * E8                      # next eighth on the film-wide beat grid
def mbx(m, t, vel=0.3, p=0.2): mb(m, t, vel, p, 1.8)
def vbx(m, t, vel=0.26, p=-0.2): vb(m, t, vel, p, 1.6)
def glk(m, t, vel=0.26, p=0.3): gl(m, t, vel, p, 1.2)

# ===================================================== THE CHAIR: a NEW score (not the Winchester sneak): a spooky waltz
# 3/4 at 144 BPM in E minor / G major. Harpsichord pluck + bassoon on 1, pizzicato chord stabs + snaps on 2 and 3, celesta
# and music box answering Aiden in his pauses, the curse as a tritone hook (E F B E). Silence for the scares.
BW = 60 / 144; WBAR = 3 * BW
VO_ = {"Em": (40, [52, 55, 59]), "B7": (35, [51, 54, 57]), "Am": (45, [57, 60, 64]), "C": (36, [52, 55, 60]), "G": (43, [55, 59, 62]),
       "D7": (38, [54, 57, 60]), "Cm": (36, [51, 55, 60]), "F#dim": (42, [54, 57, 60])}
def hpsi(m, t, vel=0.3, p=0.15, dur=0.9): put(pluck(m2f(m), vel, r, dur, 0.85), hum(t), 1.0, p, "str")
def waltz_bar(t0, ch, vel, snaps=True, bassoon=True):
    root, tri = VO_[ch]
    pz(root, t0, 0.52 * vel / 0.45, 0.5); put(pluck(m2f(root + 12), 0.3 * vel / 0.45, r, 0.6, 0.5), hum(t0), 1.0, -0.2, "str")
    if bassoon: bsn(root + 12, t0, 0.26, 0.32 * vel / 0.45)
    for k in (1, 2):
        for i, m in enumerate(tri): pz(m + 12, t0 + k * BW + i * 0.006, 0.2 * vel / 0.45, 0.16, 0.5, 0.1 + 0.1 * i)
        if snaps: put(snap(0.26 * vel / 0.45), hum(t0 + k * BW), 1.0, 0.35 if k == 1 else -0.35, "perc")
    put(shaker(0.09), hum(t0 + 2.5 * BW), 1.0, 0.4, "perc")
WMIN = [[76, 79, 78, 75], [83, 82, 79, None, 76], [71, 72, 75, 76], [79, 78, 76, 75, 76], [88, 87, 83]]
WMAJ = [[79, 83, 86, 83], [86, 84, 83, 81, 79], [74, 79, 83], [83, 86, 91, 86]]
WSPK = [[76, 77, 83], [71, 77, 76], [88, 89, 83]]
CURSE = [64, 65, 71, 76]   # E F B E: the chair's tritone hook
SECT = [  # frame a, b, chords per bar (None = no waltz), groove vel, snaps, pad, responder, motif pool, resp vel
    (0, 270, ["Em", "B7", "Em", "Am", "C", "B7", "Em", "B7"], 0.46, True, None, hpsi, WMIN, 0.32),
    (270, 393, ["Am", "B7", "Em", "B7"], 0.3, False, [[40, 47, 52, 55]], cel, WSPK, 0.26),
    (456, 594, None, 0, False, [[40, 46, 52], [40, 47, 52], [39, 46, 51]], vbx, WSPK, 0.24),
    (594, 826, ["G", "D7", "G", "C", "G", "D7", "C", "D7"], 0.52, True, None, cel, WMAJ, 0.3),
    (900, 1257, ["Em", "Am", "B7", "Em", "C", "Am", "B7", "B7"], 0.42, True, None, hpsi, WMIN, 0.3),
    (1383, 1494, ["G", "D7", "G", "C"], 0.44, True, None, cel, WMAJ, 0.28),
    (1494, 1548, None, 0, False, [[40, 47, 50, 55]], vbx, WSPK, 0.22),
    (1560, 1826, ["Em", "B7", "Em", "Am", "C", "B7", "Em", "B7"], 0.46, True, None, hpsi, WMIN, 0.32),
]
def sect_at(t):
    for S in SECT:
        if F(S[0]) <= t < F(S[1]): return S
    return None
for k in range(int(DUR / WBAR) + 1):   # the waltz on one film-wide 3/4 grid: it flows through the cuts
    t0 = k * WBAR; S = sect_at(t0 + 0.01)
    if S is None or S[2] is None: continue
    ci = int((t0 - F(S[0])) // WBAR) % len(S[2]); waltz_bar(t0, S[2][ci], S[3], snaps=S[4])
for S in SECT:
    if S[5] is None: continue
    t = F(S[0]); i = 0
    while t < F(S[1]) - 0.3:
        d = min(WBAR * 2.05, F(S[1]) - t + 0.6); pd(S[5][i % len(S[5])], t, d, 0.2, 600); t += 2 * WBAR; i += 1
def wq(t): return np.ceil(t / BW - 1e-6) * BW
cnt = 0
for (ga, gb) in GAPS:   # call and response: the melody answers Aiden in his pauses (on the waltz grid)
    S = sect_at(ga + 0.05)
    if S is None: continue
    motif = S[7][cnt % len(S[7])]; cnt += 1; t = wq(ga + 0.03)
    for m in motif:
        if t > gb - 0.08: break
        if m is not None: S[6](m, t, S[8])
        t += BW / 2
def curse(f, vel=0.3, low=True):
    for i, m in enumerate(CURSE): cel(m + 12, F(f) + i * 0.17, vel); mb(m + 24, F(f) + i * 0.17 + 0.02, vel * 0.6, 0.2, 1.4)
    if low: pz(40, F(f), 0.45, 0.9); pz(41, F(f) + 0.51, 0.4, 0.9)
# intro: a harpsichord flourish climbing the wall
for i, m in enumerate([64, 67, 71, 76, 79, 83, 88]): hpsi(m, 0.06 + i * 0.09, 0.3)
pd([40, 47, 52, 55], 0.0, 2.0, 0.14)
for i, m in enumerate([88, 83, 79, 76, 71, 67, 64, 59]): cel(m, F(150) + i * 0.055, 0.26)   # into the wheel... 1702
put(timpani(m2f(40), 0.42, r, 1.4), F(171), 1.0, 0.0, "perc")
put(cymbal(0.3, r, 1.2, 1.2), F(228), 1.0, 0.2, "perc"); cel(88, F(228), 0.32); cel(91, F(228) + 0.12, 0.28)  # ka-ching
put(timpani(m2f(40), 0.75, r, 1.6), F(362), 1.0, 0.0, "perc"); bsn(40, F(362), 0.5, 0.5)       # "Get out of my chair."
for k in range(int((F(432) - F(393)) / 0.06)): put(snare(0.1 + 0.25 * (k % 3 == 0), r, 0.1, 1.0, 0.8), F(393) + k * 0.06, 1.0, 0.2, "perc")
for j in range(3):
    for i, m in enumerate([83, 81, 79, 78, 76, 75, 72, 71]): pz(m - 12 * (j == 2), F(395 + j * 12) + i * 0.04, 0.24, 0.2, 0.7, -0.3 + 0.3 * j)
mb(76, F(436), 0.26, 0.2, 2.2); mb(77, F(436) + BW * 1.5, 0.24, 0.2, 2.2); mb(71, F(436) + BW * 3, 0.22, 0.2, 2.4)   # the empty chair
curse(508, 0.3)
for k in range(int((F(576) - F(530)) / 0.06)): put(timpani(m2f(40), 0.14 + 0.5 * k / 26, r, 0.5), F(530) + k * 0.06, 1.0, 0.0, "perc")
put(cymbal(0.7, r, 2.4, 1.0), F(576), 1.0, 0.0, "perc"); put(timpani(m2f(40), 1.0, r, 2.2), F(576), 1.0, 0.0, "perc")   # "dies."
for m in (40, 46, 52): pz(m, F(576), 0.55, 1.0)
hpsi(76, F(879), 0.35); hpsi(77, F(879) + 0.14, 0.33); cel(88, F(879) + 0.22, 0.3)          # "allegedly."
curse(912, 0.24, False); curse(1046, 0.22, False); curse(1162, 0.24, False)
for i, m in enumerate([76, None, 75, 71, None, 72, 71]):                                       # never come home
    if m: mb(m, F(985) + i * BW, 0.24, 0.2, 2.0)
for i, m in enumerate([83, 79, 76, 71, 67, 64, 59]): cel(m, F(1112) + i * 0.035, 0.22)        # the fall
curse(1296, 0.2, False); pd([40, 46, 52], F(1281), F(70), 0.13, 400)                          # waiting
hpsi(71, F(1440), 0.3); hpsi(76, F(1440) + 0.16, 0.3)
put(cymbal(0.6, r, 2.2, 1.0), F(1548), 1.0, 0.0, "perc"); put(timpani(m2f(40), 0.9, r, 2.0), F(1548), 1.0, 0.0, "perc")   # the date slam
for i, m in enumerate([64, 67, 71, 76, 79, 83, 88]): cel(m, F(1550) + i * 0.05, 0.3)
pz(59, F(1690), 0.42, 0.4); pz(64, F(1690) + 0.18, 0.42, 0.4)                                 # the shrug: "bup-bup?"
curse(1760, 0.22, False)

# ---------------------------------------------------------------- music mix (two spaces, glue, tape)
keys = shelf(peq(hp(BUS["keys"], 170), 650, 2.0, 1.1), 9000, 1.0, "high")
strs = hp(BUS["str"], 30); strs = strs + resbank(strs, [(98, 3.0, 0.32), (185, 4.0, 0.28), (275, 5.0, 0.2), (440, 6.0, 0.1)])
perc = hp(BUS["perc"], 60); pads = lp(hp(BUS["pads"], 80), 9000, 1); brs = peq(hp(BUS["brass"], 35), 300, -1.5, 1.0)
HALL = make_ir(2.4, 77, pre=0.026, hf=0.7); ROOMI = make_ir(0.8, 31, pre=0.006, hf=1.0)
wet_h = lp(hp(convolve_st(0.42 * keys + 0.5 * pads + 0.15 * strs + 0.2 * brs, HALL), 220), 9500)[:, :N]
wet_r = hp(convolve_st(0.25 * strs + 0.3 * perc + 0.2 * brs, ROOMI), 150)[:, :N]
mus = keys + strs + perc + pads + 0.8 * brs + 0.5 * wet_h + 0.22 * wet_r
mus = shelf(peq(hp(mus, 28), 320, -1.5, 0.9), 4800, 1.5, "high")
pk = np.abs(mus).max(); mus = np.tanh(1.2 * mus / pk) / np.tanh(1.2) * pk * 0.3 + mus * 0.7

# ================================================================ SFX
hits = np.zeros((2, N)); beds = np.zeros((2, N))
ROOM = make_ir(0.7, 11, pre=0.006); BIGH = make_ir(2.6, 12, pre=0.02)
# the silences (picture beats): "weird happens", the crash, "Waiting.", "The jokes stop."
for a_, b_ in ((826, 900), (1257, 1266), (1281, 1383)):
    i0, i1 = ns(F(a_)), ns(F(b_)); fd = ns(0.08)
    mus[:, i0:i0 + fd] *= np.linspace(1, 0, fd)[None, :]; mus[:, i0 + fd:i1] = 0.0
EV = []


def _env(x, win=0.006): return ndimage.uniform_filter1d(np.abs(st(x)).max(0), max(1, ns(win)))


def ev(label, frame, x, g=1.0, p=0.0, mode="onset", buf=None, dt=0.0):
    x = np.asarray(x, float); e = _env(x, 0.006 if mode == "onset" else 0.03)
    k0 = int(np.argmax(e > 0.1 * e.max())) if mode == "onset" else int(np.argmax(e))
    tq = F(frame) + dt - k0 / SR
    put(x, tq, g, p, buf=hits if buf is None else buf); EV.append((label, frame))


def pop(f0=700, vel=1.0):
    t_ = tt(0.09); f = f0 * (0.45 + 0.55 * np.exp(-t_ / 0.012))
    return fades((np.sin(phase(f)) * np.exp(-t_ / 0.022) + lp(r.standard_normal(len(t_)), 3000) * np.exp(-t_ / 0.0015) * 0.3) * vel, 0.0005, 0.01)


def boing(f0=180, dur=0.55, vel=1.0):
    t_ = tt(dur); f = f0 * (1 + 0.18 * np.exp(-t_ / (dur * 0.35)) * np.sin(2 * np.pi * 14 * t_)) * (1 + 0.25 * (1 - np.exp(-t_ / 0.08)))
    ph = phase(f); y = sum(np.sin(k * ph) / k ** 0.8 for k in range(1, 9))
    return fades(bp(y, 150, 2500) * np.exp(-t_ / (dur * 0.4)) * np.minimum(1, t_ / 0.004) * vel * 0.5, 0.0005, 0.05)


def ting(f0=4700, vel=1.0, dur=1.0):
    y = modal(dur, [(f0, 1.0, 0.25), (f0 * 1.5, 0.45, 0.15), (f0 * 2.01, 0.3, 0.08)], r)
    return fades((y + hp(r.standard_normal(ns(dur)), 7000)[:len(y)] * np.exp(-tt(dur)[:len(y)] / 0.05) * 0.15) * vel, 0.0005, 0.05)


def swish(dur=0.42, lo=300, hi=2200, vel=1.0): return whoosh(dur, r, dur * 0.5, lo, hi, 0.8, dur * 0.22, 0.12) * vel
def knock(f=180, vel=1.0): return fades(modal(0.25, [(f, 1.0, 0.05), (f * 2.3, 0.5, 0.03), (f * 4.1, 0.25, 0.015)], r) * vel + lp(r.standard_normal(ns(0.25)), 2500)[:ns(0.25)] * np.exp(-tt(0.25) / 0.004) * 0.4 * vel, 0.0003, 0.02)


def yoink(dur=0.3, f0=500, f1=1100, vel=1.0):
    t_ = tt(dur); f = f0 * (f1 / f0) ** (t_ / dur) ** 0.6
    return lp(np.sin(phase(f)) * np.minimum(1, t_ / 0.02) * np.minimum(1, (dur - t_) / 0.05), 2600) * vel


def bell(vel=1.0, dur=5.0, f0=147.0):
    parts = [(0.5, 0.5, 4.5), (1.0, 1.0, 3.2), (1.19, 0.6, 2.4), (1.5, 0.45, 1.8), (2.0, 0.55, 1.4), (2.52, 0.3, 0.9), (3.0, 0.25, 0.7), (4.07, 0.15, 0.4)]
    t_ = tt(dur); y = np.zeros(len(t_))
    for k, a, tau in parts: y += a * np.sin(2 * np.pi * f0 * k * t_ + r.uniform(0, 6)) * np.exp(-t_ / tau)
    y += bp(r.standard_normal(len(t_)), 800, 5000) * np.exp(-t_ / 0.01) * 0.4
    return fades(y * vel * 0.4, 0.001, 0.3)


def rumble(dur, vel=1.0):
    n = ns(dur); t_ = np.arange(n) / SR
    y = lp(colored(n, r, 1.0), 140) * 2.5 + lp(colored(n, r, 0.5), 600) * 0.4
    return y * np.minimum(1, t_ / 0.5) * np.minimum(1, (dur - t_) / 0.6) * (0.8 + 0.2 * smooth_noise(n, r, 6.0)) * vel


def rustle(dur, vel=1.0, rate=9.0):
    n = ns(dur); x = bp(colored(n, r, 0.2), 1800, 7000) * np.clip(smooth_noise(n, r, rate) * 1.5, 0, 1) ** 1.3
    return fades(x * vel, 0.01, 0.05)


def scream(vel=1.0, base=420, dur=0.55):
    n = ns(dur); t_ = np.arange(n) / SR
    f0 = base * (1 + 0.12 * np.minimum(1, t_ / 0.1)) * (1 + 0.025 * np.sin(2 * np.pi * 7 * t_))
    forms = np.tile([850, 1300, 2800, 3600], (n, 1)).astype(float)
    return vox(f0, forms, np.minimum(1, t_ / 0.03) * np.minimum(1, (dur - t_) / 0.12) * vel, r, 1.0, breath=0.2)


# beds: the pub hum by day (babble), the night (crickets far off), the museum hush (air)
for a_, b_ in ((594, 826), (900, 975), (1035, 1257), (1350, 1446)): put(babble(F(b_ - a_), r, 140, 1.0, 4.0, 0.6), F(a_), 0.16, 0.0, buf=beds)
for a_, b_ in ((171, 456), (975, 1035), (1221, 1257), (1281, 1350)): put(crickets(F(b_ - a_), r, 3), F(a_), 0.35, 0.0, buf=beds)
for a_, b_ in ((0, 171), (1446, 1826)): put(breeze(F(b_ - a_), r, 0.4) * 0.3, F(a_), 1.0, 0.0, buf=beds)


# AMBIENCE v2 (user: "remake our ... ambient sound to fit our theme")
INT = [(0, 1826)]          # indoor spans
FAR = make_ir(3.2, 41, pre=0.03, hf=0.5)
for a_, b_ in INT:
    put(lp(colored(ns(F(b_ - a_)), r, 1.2), 300) * 0.05, F(a_), 1.0, 0.0, buf=beds)                 # room tone
    if a_ in (1924,): continue                                                                  # the workers are gone in 1922+
    t_ = F(a_) + 0.4
    while t_ < F(b_) - 0.3:
        put(convolve_st(st(lp(hammer_hit(r, 0.5), 1800)), FAR)[:, :ns(1.2)] * 0.5, t_, 0.18, r.uniform(-0.7, 0.7), buf=beds)
        t_ += r.uniform(0.9, 2.2)
for f_ in (330, 470, 1250, 1460, 2000):
    put(creak(0.5, r, 70, 110), F(f_), 0.12, r.uniform(-0.6, 0.6), buf=beds)
def owl():
    y = np.zeros(ns(1.3))
    for t0_, d_ in ((0.0, 0.32), (0.55, 0.18), (0.78, 0.36)):
        n_ = ns(d_); tq_ = np.arange(n_) / SR; fq = 360 * (1 - 0.06 * tq_ / d_)
        y[ns(t0_):ns(t0_) + n_] += (np.sin(phase(fq)) + 0.25 * bp(r.standard_normal(n_), 300, 900)) * np.sin(np.pi * tq_ / d_) ** 1.5
    return y * 0.4
for f_ in (1545, 1800):
    put(convolve_st(st(owl()), FAR)[:, :ns(2.5)], F(f_), 0.35, -0.5, buf=beds)
n_ = ns(F(818 - 567)); cr_ = (r.uniform(0, 1, n_) > 0.9985) * r.uniform(-1, 1, n_)
put(hp(lp(cr_, 6000), 1500) * 0.25, F(567), 1.0, 0.1, buf=beds)                                 # candle crackle

# hook + transitions

# ---------------------------------------------------------------- THE CHAIR: sound on the picture
def A_(*xs):   # sum sounds of different lengths
    xs = [np.asarray(x, float) for x in xs]; n = max(x.shape[-1] for x in xs); out = np.zeros(n)
    for x in xs: out[:x.shape[-1]] += x if x.ndim == 1 else x.mean(0)
    return out
ev("ladder creak", 10, creak(0.5, r, 110, 160), 0.45, 0.4); ev("grunt", 14, oof(r, "ugh", 120), 0.5, -0.2)
ev("up whoosh", 22, whoosh(1.0, r, 0.6, 300, 1600, 0.9, 0.3, 0.2), 0.35, 0.0)
ev("chair on shelf", 52, knock(170, 1.0), 0.7, 0.1); ev("dust", 50, rustle(0.4, 0.4, 14.0), 0.25, 0.1)
ev("reach rustle", 72, rustle(0.5, 0.35, 9.0), 0.3, -0.3)
ev("SLAP", 98, push_thump(r), 0.75, 0.0); ev("slap crack", 98, pop(1400, 1.0), 0.55, 0.0); ev("yelp", 100, whoa(r, 210, 0.45), 0.55, -0.2); ev("bang pop", 100, pop(900), 0.35, -0.3)
ev("punch in", 104, swish(0.3, 600, 3000), 0.4, 0.0)
ev("into the wheel", 140, whoosh(1.4, r, 1.0, 200, 2400, 0.9, 0.4, 0.2), 0.6, 0.0); ev("time shimmer", 168, A_(ting(5200, 0.4, 1.4), ting(3900, 0.3, 1.4)), 0.4, 0.0)
for k, f in enumerate(range(200, 230, 3)): ev(f"coin {f}", f, clink(r, 2800 + 1600 * r.uniform(), 0.15), 0.25 + 0.25 * k / 10, r.uniform(-0.3, 0.3))
ev("ka-ching", 228, A_(ting(2350, 1.0, 1.3), ting(3520, 0.6, 1.3)), 0.5, 0.0)
ev("whip", 232, swish(0.25, 500, 3500), 0.4, 0.0); ev("door creak", 272, creak(0.7, r, 90, 150), 0.55, -0.3); ev("far thunder", 280, rumble(2.2, 0.4), 0.3, 0.0)
ev("startle", 330, pop(800, 1.0), 0.45, 0.2)
ev("steam", 368, hp(rustle(0.8, 0.6, 20.0), 2500), 0.4, 0.1)
for f in (398, 406, 414, 422): ev(f"punch {f}", f, knock(160 + (f % 3) * 20, 1.0), 0.75, ((f // 8) % 2) * 0.4 - 0.2)
for f in (402, 418): ev(f"boing {f}", f, boing(200 + (f % 5) * 15, 0.5), 0.4, 0.2)
ev("crash fight", 426, wood_crack(r), 0.6, 0.0); ev("oof fight", 410, oof(r, "oof", 130), 0.5, 0.1)
ev("candle out", 430, whoosh(0.35, r, 0.1, 400, 1200, 0.9, 0.1, 0.1), 0.35, -0.2)
for f in (436, 448): ev(f"rock creak {f}", f, creak(0.35, r, 120, 95), 0.4, 0.0)
ev("dusk wind", 458, breeze(4.5, r, 0.6), 0.35, 0.0, mode="peak")
ev("THUNDER", 576, A_(rumble(2.6, 1.0), timber_tear(r, 0.6) * 0.5), 0.95, 0.0)
ev("era whoosh 1", 640, whoosh(0.5, r, 0.3, 300, 2000, 0.9, 0.15, 0.1), 0.3, 0.0); ev("era whoosh 2", 690, whoosh(0.5, r, 0.3, 300, 2000, 0.9, 0.15, 0.1), 0.3, 0.0)
ev("pub babble", 600, babble(4.0, r, 150, 1.0, 4.2, 0.75), 0.18, 0.0, mode="peak", buf=beds)
ev("pub babble 2", 740, babble(2.2, r, 160, 1.0, 4.4, 0.8), 0.2, 0.0, mode="peak", buf=beds)
ev("whip 772", 772, swish(0.25, 500, 3500), 0.4, 0.0); ev("gulp", 776, boing(320, 0.25), 0.35, -0.2)
ev("eyebrow", 880, boing(520, 0.3, 0.5), 0.3, 0.2)
ev("thumbs up", 912, ting(4200, 0.6, 0.8), 0.3, -0.2); ev("cheer", 930, babble(1.2, r, 170, 1.1, 5.0, 0.9), 0.3, 0.2)
ev("bomber drone", 980, rumble(2.4, 0.5), 0.35, -0.4, mode="peak")
ev("sip", 1068, yoink(0.25, 900, 500, 0.6), 0.25, 0.1)
ev("falling whistle", 1108, yoink(0.6, 1800, 400, 0.8), 0.45, -0.3); ev("thud", 1128, push_thump(r), 0.55, -0.3); ev("gasp", 1122, whoa(r, 190, 0.5), 0.45, 0.0)
ev("pilots laugh", 1160, babble(1.6, r, 140, 1.0, 5.2, 0.9), 0.3, 0.0)
ev("engine", 1222, (lambda x: x * np.linspace(0.3, 1.0, x.shape[-1]))(np.asarray(rumble(1.2, 0.6), float)), 0.45, 0.0, mode="peak")
ev("CRASH", 1257, A_(wood_crack(r), timber_tear(r, 0.5) * 0.6, push_thump(r) * 0.8), 1.0, 0.0)
ev("hubcap roll", 1266, rattle(0.55, r, 40.0), 0.4, -0.2)
for i, f in enumerate((1276, 1279, 1281, 1282)): ev(f"hubcap wobble {f}", f, knock(900 - 60 * i, 0.5), 0.3 - 0.05 * i, 0.0)
for f in (1300, 1334): ev(f"creak {f}", f, creak(0.7, r, 70, 55), 0.5, -0.2)
ev("record scratch", 1350, A_(yoink(0.25, 2200, 300, 1.0), hp(r.standard_normal(ns(0.25)), 3000) * np.exp(-tt(0.25) / 0.06) * 0.3), 0.6, 0.0)
ev("drag scrape", 1388, rustle(1.9, 0.6, 30.0), 0.4, 0.0, mode="peak")
for f in range(1392, 1446, 12): ev(f"step {f}", f, stroll_step(r, 0.3), 0.35, 0.0)
ev("museum bell", 1447, ting(1980, 0.6, 1.4), 0.3, 0.3); ev("point pop", 1454, pop(1100, 0.6), 0.3, -0.2)
ev("ladder creak 2", 1496, creak(0.4, r, 120, 170), 0.4, 0.3); ev("lens", 1520, swish(0.35, 800, 4200), 0.4, 0.0)
ev("SLAM date", 1548, A_(push_thump(r), boing(160, 0.6) * 0.5), 0.8, 0.0); ev("gasp 2", 1549, whoa(r, 200, 0.55), 0.5, 0.2)
for f in (1690, 1692, 1694): ev(f"q pop {f}", f, pop(1300 + (f % 3) * 100, 0.4), 0.25, ((f % 3) - 1) * 0.4)
ev("ladder creak 3", 1752, creak(0.5, r, 110, 160), 0.45, 0.4); ev("grunt 2", 1760, oof(r, "ugh", 115), 0.45, -0.2)

# ================================================================ FINAL MIX (voice priority, -14 LUFS)
voice, sr = read_wav(V + "voice_tight.wav"); assert sr == SR
vm = voice.mean(0) if voice.ndim > 1 else voice; v = np.zeros((2, N)); k0 = ns(F(VO)); m_ = min(N - k0, len(vm)); v[:, k0:k0 + m_] = vm[:m_]
words = json.load(open(V + "words.json"))
spans = []
for w in words:
    s, e = float(w["s"]) + F(VO), float(w["e"]) + F(VO)
    if spans and s - spans[-1][1] < 0.25: spans[-1][1] = max(spans[-1][1], e)
    else: spans.append([s, e])
ctrl = 1000; nc = int(DUR * ctrl) + 2; va = np.zeros(nc)
for s, e in spans: va[max(0, int((s - 0.06) * ctrl)): int((e + 0.08) * ctrl)] = 1.0
ka, kr = 1 - np.exp(-1 / (0.05 * ctrl)), 1 - np.exp(-1 / (0.35 * ctrl)); env = np.zeros(nc); e_ = 0.0
for i in range(nc):
    e_ += (va[i] - e_) * (ka if va[i] > e_ else kr); env[i] = e_
duck = np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, env)
SOS_MID = signal.butter(2, [1000, 4000], btype="bandpass", fs=SR, output="sos")
def carve(x, bb_db, mid_db):
    mid = signal.sosfiltfilt(SOS_MID, x, axis=-1)
    return ((x - mid) + mid * dbg(mid_db * duck)[None, :]) * dbg(bb_db * duck)[None, :]
mus_p = carve(mus, -5.0, -9.0); sfx = carve(beds, -4.0, -6.0) + carve(hits, 0.0, -4.0)
v = v * dbg(-16.0 - integrated(v)); mus_p = mus_p * dbg(-24.5 - integrated(mus_p)); sfx = sfx * dbg(-24.0 - integrated(sfx))
Lvi = integrated(v); Lv = momentary(v); tcm = np.arange(len(Lv)) * 0.01 + 0.2
spk = np.zeros(len(tcm), bool)
for w in words: spk |= (tcm >= float(w["s"]) + F(VO)) & (tcm <= float(w["e"]) + F(VO))
spk &= Lv > Lvi - 12
prio = np.zeros(N)
for _ in range(2):
    Lb = momentary((mus_p + sfx) * dbg(prio)[None, :])
    need = np.where(spk & np.isfinite(Lb), np.maximum(0.0, 8.5 - (Lv - Lb)), 0.0)
    need = ndimage.uniform_filter1d(ndimage.maximum_filter1d(need, 41), 13)
    prio += -np.interp(np.arange(N) / SR, tcm, need)
mus_p *= dbg(prio)[None, :]; sfx *= dbg(prio)[None, :]


def limiter(x, ceil_db=-1.3, look=0.003, rel=0.08):
    c = dbg(ceil_db); n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12)); La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest"); g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        krl = 1 - np.exp(-1 / (rel * SR)); gap = ns(rel * 8)
        brk = np.flatnonzero(np.diff(idx) > gap)
        for a_, b_ in zip(np.concatenate([[idx[0]], idx[brk + 1]]), np.concatenate([idx[brk], [idx[-1]]])):
            e2 = min(n, b_ + gap); seg = g1[a_:e2]; o = np.empty(len(seg)); g = 1.0
            for q in range(len(seg)): g = min(seg[q], g + (1 - g) * krl); o[q] = g
            g2[a_:e2] = o
    g3 = np.minimum(ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest"), 1.0)
    return x * g3[None, :], g3


G = 0.0
for it in range(3):
    mix, gcurve = limiter((v + mus_p + sfx) * dbg(G)); G += -14.0 - integrated(mix)
mix, gcurve = limiter((v + mus_p + sfx) * dbg(G))
mix = mix - mix.mean(1, keepdims=True)
mix[:, :ns(0.003)] *= np.linspace(0, 1, ns(0.003))[None, :]; mix[:, -ns(0.03):] *= np.linspace(1, 0, ns(0.03))[None, :]
write_wav(A + "busby_mix.wav", mix); write_wav(A + "busby_music.wav", mus_p * dbg(G)); write_wav(A + "busby_sfx.wav", sfx * dbg(G))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", A + "busby_mix.wav", "-b:a", "192k", A + "busby_mix_preview.mp3"])
print(f"mix {mix.shape[1] / SR:.3f}s LUFS {integrated(mix):.2f} TP {true_peak(mix):.2f} dBTP gain {G:+.2f} limiter GR {-20 * np.log10(gcurve.min()):.2f} dB, {len(EV)} events, BPM {BPM:.2f}")
