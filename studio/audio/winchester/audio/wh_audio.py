# "The House Built to Lose Ghosts" (Winchester) - original score + SFX + final mix, own synthesis via the template
# instruments. Score: playful-mysterious, D minor / F major, 114.6 BPM so one eighth note = one hammer swing of the
# animation (sin(f*0.8): 7.854 frames). Sections follow the story beats (frames of story.ts). SFX are placed on the
# animation's own frames (bonks, door, coins, seance, bell, quake, hammering, the silence when it stops).
# Outputs: music.wav, sfx.wav, mix.wav (voice at frame 36), mix_preview.mp3. -14 LUFS, <= -1.3 dBTP.
import os, sys, json, subprocess, numpy as np
from scipy import signal, ndimage
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lib"))
from dsp import (SR, ns, tt, rng, lp, hp, bp, st, pan, peq, shelf, write_wav, read_wav, integrated, momentary, fades,
                 phase, smooth_noise, colored, make_ir, convolve_st, true_peak, modal, dbg, resbank)
from instruments import m2f, musicbox, pluck, vibes, pad, glock, brass, snare, brush, cymbal, timpani, triangle
from sfx_gen import (hammer_hit, wood_crack, timber_tear, whoosh, creak, clink, crickets, breeze, push_thump, rattle,
                     oof, whoa, babble, bird_chirps, stroll_step, vox)

FPS, TOTAL, VO = 30, 2350, 36
DUR = TOTAL / FPS; N = ns(DUR)
HERE = os.path.dirname(os.path.abspath(__file__)); A = HERE + "/"; V = os.path.join(HERE, "..", "voice") + "/"
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
# S0 0-62 the garden fly-through: a theremin glide up into the house, celesta sparkle, pizz
put(theremin([(0.0, 57, 0.5), (0.5, 62, 0.5), (1.0, 69, 0.9)], 0.22), 0.05, 1.0, 0.0, "pads")
pd([50, 57, 62, 65], 0.0, 2.3, 0.22)
for i, m in enumerate([74, 77, 81, 86]): cel(m, 0.1 + i * 0.12, 0.3)
pz(38, 1.6, 0.5, 0.5)
# S1 62-186 the odd stair + the Door to Nowhere: the sneak groove + the bassoon theme
t = F(62)
for k, ch in enumerate(["Dm", "A"]): sneak_bar(t + k * BAR, ch)
theme(t, [T1A, T1B])
cel(81, F(90), 0.35); cel(86, F(150), 0.35)
# S2 186-295 the reveal: celesta run + hit, theme up an octave on celesta, smug "bwah-bwah" button
t = F(186)
for i, m in enumerate([62, 65, 69, 74, 77, 81]): cel(m + 12, t + i * 0.05, 0.35)
put(timpani(m2f(38), 0.45, r, 1.6), t, 1.0, 0.0, "perc")
for k, ch in enumerate(["Dm", "A"]): sneak_bar(t + 0.2 + k * BAR, ch, 0.45)
for b_, notes in enumerate([T2A, T2B]):
    for k, m in enumerate(notes):
        if m is not None: cel(m + 12, e8(t + 0.2 + b_ * BAR, k), 0.28)
bsn(45, F(284), 0.18, 0.6); bsn(44, F(284) + 0.26, 0.42, 0.6)                 # bwah - bwaaah (on "ghosts.")
# S3 295-434 1881: sad music box + a soft theremin line, no groove
t = F(295)
for i, ms in enumerate([[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]]): pd(ms, t + i * 1.16, 1.4, 0.22, 700)
line(t + 0.1, [74, 72, 70, 69, 70, 69, 67, 65, 67, 65, 64], B * 0.86, mb, vel=0.34, dur=1.8)
put(theremin([(0.0, 69, 1.2), (1.2, 67, 1.0), (2.2, 65, 1.2), (3.4, 64, 1.0)], 0.12), t + 0.3, 1.0, 0.2, "pads")
# S4 434-567 the fortune: bouncy F major oom-pah, celesta coin-sparkles, a stab on "a day"
t = F(434)
for k, ch in enumerate(["F", "C7"]): oompah_bar(t + k * BAR, ch, 0.42, tuba=True, snr=False, blocks=False)
for k in range(2):
    for q in (1, 3): put(snap(0.28), t + k * BAR + q * B, 1.0, 0.35, "perc")
line(t, [77, 81, 84, 81, 82, 86, 84, None], E8, cel, vel=0.3); line(t + BAR, [81, 84, 89, 84, 79, 82, 81, None], E8, cel, vel=0.3)
put(cymbal(0.35, r, 1.2, 1.2), F(544), 1.0, 0.2, "perc"); bsn(62, F(544), 0.12, 0.7); bsn(74, F(544) + 0.12, 0.3, 0.6)
# S5 567-818 the seance: theremin melody over a low pad + choir, tremolo vibes, pizz pulse; swell, pause, BIG hit
t = F(567)
pd([38, 50, 57], t, F(818 - 567), 0.28, 600)
for i, ms in enumerate([[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]]): choir(ms, t + i * 1.4, 1.6, 0.28)
for k in range(16): vb([74, 77, 81, 77][k % 4], t + k * E8 * 1.5, 0.18, 0.4, 1.2)
put(theremin([(0.0, 62, 0.8), (0.8, 65, 0.5), (1.3, 69, 0.9), (2.2, 68, 0.5), (2.7, 65, 1.1), (3.8, 62, 1.0)], 0.2), F(600), 1.0, 0.25, "pads")
for k in range(int((F(733) - F(633)) / B)): pz(38 if k % 2 == 0 else 45, F(633) + k * B, 0.36, 0.6, 0.25)
choir([62, 65, 70], F(733), 1.0, 0.42); put(timpani(m2f(38), 0.75, r, 1.8), F(733), 1.0, 0.0, "perc"); put(cymbal(0.4, r, 1.6, 0.8), F(733), 1.0, -0.2, "perc")
put(theremin([(0.0, 81, 0.7)], 0.16), F(762), 1.0, 0.0, "pads")                   # "The cure?" one eerie note hanging
for m in (50, 57, 62): put(brass(m2f(m), 0.4, 0.9, r, "stab"), F(790), 1.0, 0.0, "brass")
put(timpani(m2f(38), 1.0, r, 2.0), F(790), 1.0, 0.0, "perc"); put(cymbal(0.6, r, 2.0, 1.0), F(790), 1.0, 0.0, "perc")
for k in range(int((F(818) - F(800)) / 0.05)): put(snare(0.15 + 0.35 * k / 12, r, 0.12, 1.0, 0.8), F(800) + k * 0.05, 1.0, 0.2, "perc")
# S6/S7 818-1141 the construction groove: straight tuba oom-pah on the hammer grid + snaps + blocks, bassoon + celesta tune
t = F(818)
prog = ["F", "C7", "F", "Bb", "F", "C7", "F", "C7", "F", "Bb", "F", "C7", "F", "C7", "F", "Bb", "F"]
for k, ch in enumerate(prog):
    t0 = t + k * BAR
    if t0 >= F(1141): break
    oompah_bar(t0, ch, 0.5 if k else 0.6)
    for q in (1, 3): put(snap(0.3), t0 + q * B, 1.0, 0.35, "perc")
    if k < 4 or t0 >= F(1060):
        tune = [G1, G2, G3, G4][k % 4]
        for i, m in enumerate(tune):
            if m is not None: bsn(m - 12, t0 + i * E8, 0.2, 0.45); cel(m + 12, t0 + i * E8, 0.2, 0.35)
for i in range(8): cel(65 + [0, 4, 7, 12, 16, 19, 24, 28][i], F(1069) + i * 0.045, 0.3)
# S8 1141-1310 doors into walls / floor windows / switchback: the sneak groove + staccato bassoon, pizz stair steps
t = F(1141)
for k, ch in enumerate(["Dm", "Gm", "A"]): sneak_bar(t + k * BAR, ch, 0.42, snaps=(k != 1))
theme(t, [T1A, None and T1B or [None] * 8, T1B], 0.45)
scale = [62, 64, 65, 67, 69, 70, 72, 74, 76, 77, 79, 81]
for s_ in range(25): pz(scale[min(len(scale) - 1, s_ // 2)] + (12 if s_ >= 24 else 0), F(1222 + s_ * 84 / 25), 0.22, 0.25, 0.6, 0.3)
# S9 1310-1529 thirteens: clock tick-tock + the celesta counting up 13 notes, pizz, a curious bassoon
t = F(1310)
for k in range(int((F(1529) - t) / B)): put(wood(0.26 if k % 2 == 0 else 0.18, 1500 if k % 2 == 0 else 1100), t + k * B, 1.0, 0.5 if k % 2 else -0.5, "perc")
for k, ch in enumerate(["Dm", "Gm", "A", "Dm"]):
    t0 = t + k * BAR
    for q, iv in enumerate([0, 7]): pz(ROOT[ch] + iv, t0 + q * 2 * B, 0.38, 0.6, 0.3)
for i in range(13): cel([74, 76, 77, 79, 81, 82, 84, 86, 88, 89, 91, 93, 94][i], t + 0.2 + i * 0.16, 0.24, 0.4 - 0.06 * i)
theme(t + BAR, [T2A, T2B], 0.4, -12)
# S10 1529-1638 midnight: theremin + choir under the bell; "Allegedly." -> bassoon "bwah"
t = F(1529)
pd([38, 45, 50, 53], t, F(1612 - 1529), 0.26, 500); choir([57, 62, 65], t + 0.3, 2.6, 0.24)
put(theremin([(0.0, 69, 0.9), (0.9, 70, 0.6), (1.5, 69, 1.4)], 0.17), t + 0.4, 1.0, -0.2, "pads")
bsn(50, F(1617), 0.12, 0.65); bsn(49, F(1617) + 0.16, 0.38, 0.6); put(wood(0.35), F(1617), 1.0, 0.3, "perc"); cel(86, F(1617) + 0.2, 0.3)
# S11 1638-1770 1906: timpani roll + low tremolo, the crash, then "She keeps building": the groove snaps back
for k in range(int((F(1700) - F(1640)) / 0.07)): put(timpani(m2f(38), 0.18 + 0.5 * k / 28, r, 0.6), F(1640) + k * 0.07, 1.0, 0.0, "perc")
pd([38, 44, 50], F(1640), F(60), 0.28, 400)
put(cymbal(0.7, r, 2.4, 1.0), F(1700), 1.0, 0.0, "perc"); put(brass(m2f(38), 0.6, 0.9, r, "stab"), F(1700), 1.0, 0.0, "brass")
for k in range(3):
    oompah_bar(F(1737) + k * BAR, ["F", "C7", "F"][k], 0.55)
    for q in (1, 3): put(snap(0.3), F(1737) + k * BAR + q * B, 1.0, 0.35, "perc")
for i, m in enumerate(G1): 
    if m is not None: bsn(m - 12, F(1737) + i * E8, 0.2, 0.5)
# S12 1770-1885 1922 at night: the groove soft and thinning (vibes, no snaps); dead stop when the hammering stops
t = F(1737) + 3 * BAR; k = 0
while t + k * BAR < F(1885):
    t0 = t + k * BAR; v = 0.4 - 0.06 * k
    oompah_bar(t0, ["Dm", "A", "Dm", "Gm", "A"][k % 5], max(0.2, v), tuba=True, snr=False, blocks=k < 1)
    vb([62, 61, 62, 58, 61][k % 5] + 12, t0, 0.22, -0.3, 2.0); k += 1
# S13 1924-2036 the nails: a lonely music box + a soft theremin breath
for i, m in enumerate([74, None, 72, 69, None, 70, 69, None, 65]):
    if m: mb(m, F(1934) + i * B, 0.3, 0.2, 2.0)
pd([50, 57, 62], F(1930), F(100), 0.16, 500); put(theremin([(0.0, 62, 1.5), (1.5, 61, 1.5)], 0.08), F(1960), 1.0, -0.2, "pads")
# S14 2036-2185 historians / she just liked building: the sneak groove light, celesta giggles
t = F(2036)
for k, ch in enumerate(["Dm", "A", "Dm", "Gm"]):
    t0 = t + k * BAR
    if t0 >= F(2185): break
    sneak_bar(t0, ch, 0.36, snaps=k > 0, shake=k > 0)
    if k >= 1: line(t0, [81, None, 84, 86, None, 84, 81, None], E8, cel, vel=0.25)
bsn(57, F(2068), 0.14, 0.5); bsn(62, F(2068) + 0.18, 0.16, 0.5)              # the shrug: "bup-bup?"
# S15 2185-2350 today: the theme reprise (bassoon + celesta + sneak groove); final hit + celesta ding on "point."
t = F(2185)
for k, ch in enumerate(["Dm", "A", "Dm"]):
    t0 = t + k * BAR
    if t0 >= F(2300): break
    sneak_bar(t0, ch, 0.45)
theme(t, [T1A, T1B], 0.5)
for b_, notes in enumerate([T2A, T2B]):
    for k_, m in enumerate(notes):
        if m is not None and t + b_ * BAR + k_ * E8 < F(2300): cel(m + 12, e8(t + b_ * BAR, k_), 0.24)
tf = F(2318)
for m in (38, 50, 57, 62, 65, 69): put(pluck(m2f(m), 0.5, r, 1.6, 0.4), tf + (m - 38) * 0.004, 1.0, 0.0, "str")
bsn(38, tf, 0.5, 0.6); vb(74, tf, 0.35, 0.0, 2.5); cel(86, tf + 0.25, 0.45, 0.0); put(timpani(m2f(38), 0.5, r, 2.0), tf, 1.0, 0.0, "perc")

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
mus[:, ns(F(1885)):ns(F(1885)) + ns(0.12)] *= np.linspace(1, 0, ns(0.12))[None, :]   # the hammering stops: so does the music
mus[:, ns(F(1885)) + ns(0.12):ns(F(1924))] = 0.0

# ================================================================ SFX
hits = np.zeros((2, N)); beds = np.zeros((2, N))
ROOM = make_ir(0.7, 11, pre=0.006); BIGH = make_ir(2.6, 12, pre=0.02)
wet = lambda x, ir=ROOM, mix=0.35: st(x) * (1 - mix) + convolve_st(st(x), ir)[:, : st(x).shape[1]] * mix
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


# beds: garden (birds + breeze) / night (crickets) / the seance hum / tourists
for a_, b_ in ((0, 62), (186, 295), (818, 924), (941, 958), (1069, 1141), (1638, 1660), (1735, 1770), (2274, 2350)):
    put(breeze(F(b_ - a_), r, 0.7) * 0.5, F(a_), 1.0, 0.0, buf=beds)
    put(bird_chirps(F(b_ - a_), r, 0.45), F(a_), 0.5, 0.3, buf=beds)
for a_, b_ in ((924, 941), (958, 990), (1529, 1580), (1770, 1924)):
    put(crickets(F(b_ - a_), r, 3), F(a_), 0.55, 0.0, buf=beds)
n_ = ns(F(818 - 567)); tq = np.arange(n_) / SR
hm = (np.sin(2 * np.pi * 110 * tq) + 0.5 * np.sin(2 * np.pi * 220.7 * tq) + 0.25 * np.sin(2 * np.pi * 331 * tq)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.5 * tq))
put(hm * np.minimum(1, tq / 1.0) * np.minimum(1, (tq[-1] - tq) / 0.4) * 0.06, F(567), 1.0, 0.0, buf=beds)
for i, (base, sc) in enumerate(((120, 1.0), (210, 1.2), (180, 1.15), (105, 0.95))):
    put(babble(F(2274 - 2190), r, base, sc), F(2190), 0.35, [-0.5, 0.4, 0.15, -0.2][i], buf=beds)


# AMBIENCE v2 (user: "remake our ... ambient sound to fit our theme")
INT = [(62, 110), (295, 567), (990, 1069), (1141, 1529), (1580, 1638), (1924, 2274)]          # indoor spans
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
ev("fly whoosh", 4, whoosh(1.9, r, 1.3, 250, 1800, 0.9, 0.4, 0.2), 0.7, 0.0)
ev("dip shimmer", 50, sum(ting(m2f(m), 0.25, 1.2) for m in (96,)), 0.5, 0.2)
for f, g in ((110, 0.45), (186, 0.4), (295, 0.3), (434, 0.4), (567, 0.35), (818, 0.4), (924, 0.3), (941, 0.3), (958, 0.3), (990, 0.4), (1069, 0.4),
             (1141, 0.35), (1179, 0.35), (1219, 0.35), (1310, 0.35), (1372, 0.45), (1410, 0.35), (1465, 0.35), (1529, 0.35), (1580, 0.3),
             (1638, 0.4), (1735, 0.35), (1770, 0.35), (2036, 0.35), (2100, 0.35), (2185, 0.4), (2274, 0.4)):
    ev(f"swish {f}", f, swish(0.36, 400, 2600), g, 0.0, mode="peak", dt=-0.02)
# 102 the odd stair: bonk + boing + oof, dizzy twinkles
ev("bonk 90", 90, knock(150, 1.0), 0.9, 0.1); ev("boing 90", 90, boing(190, 0.6), 0.55, 0.1, dt=0.01); ev("oof 90", 91, oof(r, "oof", 120), 0.6, 0.1)
for f in (96, 103, 108): ev(f"dizzy {f}", f, ting(5200, 0.35, 0.5), 0.3, 0.3)
# 103 the Door to Nowhere: creak open, step out, windmill "whoa"
ev("door creak", 124, creak(0.55, r, 90, 150), 0.6, 0.1); ev("step", 136, stroll_step(r, 0.3), 0.5, 0.0)
ev("whoa", 151, whoa(r, 170, 0.6), 0.7, 0.0); ev("bang emote", 150, pop(900), 0.4, 0.2)
ev("crane back", 190, whoosh(3.0, r, 1.6, 200, 1200, 0.9, 0.6, 0.15), 0.35, 0.0)
ev("hammer roof 104", 200, hammer_hit(r, 0.6), 0.25, 0.4)
for f in range(208, 290, 8): ev(f"hammer roof {f}", f, hammer_hit(r, 0.5), 0.18, 0.4)
ev("smug ting", 250, ting(3900, 0.5, 0.9), 0.35, -0.2)
# 105 tears
ev("tear plink", 340, ting(2600, 0.4, 0.6), 0.25, 0.1); ev("tear plink 2", 398, ting(2400, 0.4, 0.6), 0.25, -0.1)
# 106 coins pile up, ka-ching, eyes pop
for k, f in enumerate(range(470, 540, 4)): ev(f"coin {f}", f, clink(r, 2800 + 1600 * r.uniform(), 0.15), 0.25 + 0.2 * k / 18, r.uniform(-0.4, 0.2))
ev("ka-ching", 540, ting(2350, 1.0, 1.3) + ting(3520, 0.6, 1.3), 0.55, 0.0)
ev("eyes pop", 544, pop(800, 1.0), 0.6, 0.0)
# 107 the seance: crystal whoomp, scream, slam on "Build."
ev("crystal whoomp", 633, lp(r.standard_normal(ns(0.9)), 300) * np.minimum(1, tt(0.9) / 0.15) * np.exp(-tt(0.9) / 0.3), 0.5, 0.0, mode="peak")
ev("crystal shimmer", 636, ting(5600, 0.5, 1.5), 0.3, 0.3)
ev("scream", 733, scream(1.0, 430), 0.45, 0.25)
ev("slam", 790, push_thump(r), 0.8, 0.0); ev("slam knock", 790, knock(110, 1.0), 0.7, 0.0)
# hammering: every swing peak of each worker (0.5 + 0.5 sin(f*0.8 + ph) = 1)
def swings(a_, b_, ph):
    k = int(np.ceil((a_ * 0.8 + ph - np.pi / 2) / (2 * np.pi)))
    while True:
        f = (np.pi / 2 - ph + 2 * np.pi * k) / 0.8; k += 1
        if f >= b_: return
        if f >= a_: yield f
for f in swings(856, 876, 0.0): ev("farm hammer", f, hammer_hit(r, 0.8), 0.45, 0.35)
for a_, b_ in ((876, 990), (1770, 1885)):
    for ph, p, g in ((0.0, -0.35, 0.42), (1.7, 0.05, 0.32), (3.1, 0.35, 0.36)):
        for f in swings(a_, b_, ph): ev(f"hammer {ph}", f, hammer_hit(r, 0.75 + 0.2 * r.uniform()), g * (0.75 if a_ > 1700 else 1.0), p)
# 113 the paint roller, the flop, dizzy
ev("roller", 992, rustle(F(1030 - 992), 0.5, 3.0), 0.35, 0.2)
ev("flop thump", 1030, lp(r.standard_normal(ns(0.4)), 500) * np.exp(-tt(0.4) / 0.08), 0.8, 0.1); ev("chair creak", 1032, creak(0.35, r, 120, 90), 0.4, 0.1)
ev("flop oof", 1031, oof(r, "ugh", 110), 0.55, 0.1)
for f in range(1042, 1069, 9): ev(f"dizzy {f}", f, ting(5000 + 300 * (f % 3), 0.3, 0.5), 0.25, 0.2)
ev("crane up", 1072, whoosh(2.2, r, 1.2, 250, 1500, 0.9, 0.5, 0.2), 0.35, 0.0)
# 115 door onto bricks: creak, bonk, oof
ev("brick door creak", 1145, creak(0.35, r, 110, 170), 0.5, 0.2)
ev("brick bonk", 1160, knock(240, 1.0), 0.9, 0.25); ev("brick boing", 1160, boing(230, 0.5), 0.45, 0.25, dt=0.01); ev("brick oof", 1161, oof(r, "oof", 135), 0.55, 0.25)
# 116 the floor window: "!" sting
ev("floor !", 1188, pop(1000, 1.0), 0.5, 0.0); ev("floor ting", 1189, ting(4400, 0.6, 0.8), 0.3, 0.1)
# 117 tiny steps
for s in range(25): ev(f"step {s}", 1222 + s * 84 / 25, stroll_step(r, 0.15), 0.18, -0.2)
# 118-121 thirteens: twinkles, water drip, scroll unroll
for f in (1330, 1395, 1430): ev(f"twinkle {f}", f, ting(4700, 0.7, 1.2), 0.4, 0.2)
for f in (1418, 1447): ev(f"drip {f}", f, ting(1900, 0.5, 0.25) * 0.6, 0.3, 0.1)
ev("scroll", 1470, rustle(F(1510 - 1470), 0.7, 12.0), 0.4, 0.1); ev("scroll flap", 1510, rustle(0.15, 1.0, 20), 0.35, 0.1)
# 122 the bell tolls three times
for f in (1536, 1554, 1572): ev(f"bell {f}", f, wet(bell(0.9, 4.5), BIGH, 0.5), 0.5, 0.1)
# 123 "Allegedly." side-eye
ev("side-eye ting", 1618, ting(4200, 0.6, 0.8), 0.35, 0.3)
# 124 the earthquake
ev("rumble", 1645, rumble(F(1715 - 1645), 1.0), 0.75, 0.0)
ev("rattle", 1650, rattle(F(1705 - 1650), r, 40.0), 0.35, 0.2)
ev("tower creak", 1662, creak(1.2, r, 60, 40), 0.55, 0.3)
ev("whoa 1", 1666, whoa(r, 150, 0.5), 0.5, -0.3); ev("whoa 2", 1673, whoa(r, 190, 0.5), 0.45, 0.2)
ev("crash", 1700, timber_tear(r, 0.9), 0.8, 0.3); ev("crash 2", 1702, wood_crack(r), 0.6, 0.35)
ev("crash boom", 1700, lp(r.standard_normal(ns(1.2)), 160) * np.exp(-tt(1.2) / 0.35) * 3, 0.7, 0.0)
ev("debris", 1706, rattle(1.0, r, 25.0, heavy=True), 0.4, 0.3)
ev("blueprint", 1748, rustle(0.35, 1.0, 14), 0.45, 0.0)
# 126 a window goes dark; the hammering stops (no sound at all after 1885 but the crickets)
ev("lamp out", 1800, lp(r.standard_normal(ns(0.5)), 380) * np.minimum(1, tt(0.5) / 0.05) * np.exp(-tt(0.5) / 0.15), 0.4, 0.2, mode="peak")
# 127 the nails: one metal ting
ev("nail ting", 1960, ting(3100, 0.5, 1.0), 0.3, -0.2)
# 128-131: shrug "?", pencil scribbles, twinkles, tourist "?" boops, footsteps, the button
ev("shrug ?", 2068, yoink(0.32, 520, 900), 0.35, 0.2)
for f in range(2104, 2180, 11): ev(f"scribble {f}", f, rustle(0.22, 1.0, 25.0), 0.22, -0.1)
for f in (2110, 2140, 2165): ev(f"twinkle {f}", f, ting(5200, 0.6, 1.0), 0.32, 0.3)
for i in range(4): ev(f"tourist ? {i}", 2190 + i * 18, yoink(0.25, 480 + 60 * i, 820 + 80 * i), 0.3, [-0.5, 0.4, 0.15, -0.2][i])
for f in range(2280, 2340, 13): ev(f"steps {f}", f, stroll_step(r, 0.25), 0.2, 0.0)

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
write_wav(A + "mix.wav", mix); write_wav(A + "music.wav", mus_p * dbg(G)); write_wav(A + "sfx.wav", sfx * dbg(G)); write_wav(A + "voice.wav", v * dbg(G))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", A + "mix.wav", "-b:a", "192k", A + "mix_preview.mp3"])
print(f"mix {mix.shape[1] / SR:.3f}s LUFS {integrated(mix):.2f} TP {true_peak(mix):.2f} dBTP gain {G:+.2f} limiter GR {-20 * np.log10(gcurve.min()):.2f} dB, {len(EV)} events, BPM {BPM:.2f}")
