"""Low-res test clip for cartoon framework v3: animation timing + camera moves + editing in the Winchester world.

Characters are drawn by v3_lookdev (face kit on sphere heads, hats, bean bodies) as cached pose sprites and composited
ON TOP of a 4K world still that the camera pushes / whips / cuts across (step 7 after the world's fog/haze/DOF/bloom).

Rules shown (style/CARTOON_FRAMEWORK.md):
- every move: outCubic over 15 frames = 60-70% in the first 4-5 frames, then a slow settle; NO motion blur
- holds are completely still (identical sprite); the FACE changes one frame BEFORE the body moves
- talking mouths change every 2 frames; nobody blinks while talking (the blink happens in a pause)
- camera: push-in 1.9x outCubic, whip that stops dead in 1 frame, short rest, hard cut; shake = Rick's sine sum

usage: python3 v3_clip.py world_4k.png out_dir
"""
import math, sys, os, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import v3_lookdev as L
from v3_lookdev import Char, INK, WHITE, bez2, bez3, arc, flat_cap, ball_cap, top_hat, BTOP, BH, BW, SOLE

L.SS = 2                                   # sprites: 2x supersampling is plenty at test res
OW, OH, FPS, N = 720, 1280, 30, 180        # test build: 720x1280, 6 s
EX, EY, S = 0.122, 0.045, (-1, 1)


# ---------------- face kit as parts, so the mouth / eyes can be swapped per frame ----------------
EYES = {
    "dot": lambda c, y: [c.eye_dot(s * EX, EY, y) for s in S],
    "dot_tall": lambda c, y: [c.eye_dot(s * EX, EY - 0.01, y, 0.085, 0.125) for s in S],
    "lid": lambda c, y: [c.eye_lid(s * EX, EY - 0.02, y) for s in S],
    "lid_smug": lambda c, y: [c.eye_lid(s * EX, EY - 0.02, y, ang=0.06 * s) for s in S],
    "lid_scheme": lambda c, y: [c.eye_lid(s * EX, EY - 0.005, y, ang=-s * 0.30, dw=0.085, dh=0.06) for s in S],
    "ring_stern": lambda c, y: [c.eye_ring(s * 0.115, EY, y, r=0.095, pr=0.026) for s in S],
    "ring": lambda c, y: [c.eye_ring(s * 0.115, EY - 0.01, y) for s in S],
    "ring_big": lambda c, y: [c.eye_ring(s * 0.118, EY - 0.01, y, r=0.112, pr=0.026) for s in S],
    "closed": lambda c, y: [c.eye_closed(s * EX, EY + 0.01, y) for s in S],
}
BROWS = {
    "flat": lambda c, y: [c.brow(s * 0.13, EY - 0.165, 0.0, 0.02, y) for s in S],
    "smug": lambda c, y: (c.brow(-0.13, EY - 0.13, -0.05, 0.01, y), c.brow(0.13, EY - 0.19, 0.16, 0.03, y)),
    "V": lambda c, y: [c.brow(s * 0.13, EY - 0.115, -s * 0.42, 0.0, y) for s in S],
    "stern": lambda c, y: [c.brow(s * 0.125, EY - 0.135, -s * 0.36, 0.0, y) for s in S],
    "worried": lambda c, y: [c.brow(s * 0.135, EY - 0.165, s * 0.34, 0.015, y) for s in S],
    "high": lambda c, y: [c.brow(s * 0.12, EY - 0.20, s * 0.10, 0.035, y, ln=0.08) for s in S],
    "panic": lambda c, y: (c.brow(-0.13, EY - 0.20, 0.18, 0.02, y, wavy=0.012), c.brow(0.13, EY - 0.215, -0.10, 0.03, y, wavy=0.016)),
}
MOUTHS = {
    "smile": lambda c, y: c.mouth_line(bez2((-0.06, 0.225), (0.0, 0.25), (0.06, 0.225), 20), y),
    "smirk": lambda c, y: c.mouth_line(bez3((-0.07, 0.235), (-0.01, 0.245), (0.06, 0.24), (0.10, 0.205), 24), y),
    "dash": lambda c, y: c.mouth_line([(-0.03, 0.235), (0.03, 0.235)], y, 0.03),
    "wavy": lambda c, y: c.mouth_line([(-0.05, 0.24), (-0.017, 0.23), (0.017, 0.24), (0.05, 0.23)], y, 0.028),
    "sly": lambda c, y: c.mouth_teeth(0.38, 0.085, 0.20, y, lop=0.03, shape="crescent", n=7),
    "o": lambda c, y: c.paint(c.fpoly([(0.042 * math.cos(t), 0.25 + 0.055 * math.sin(t)) for t in arc(40)[:-1]], y), INK),
    "box": lambda c, y: (c.mouth_teeth(0.15, 0.085, 0.215, y, shape="box", n=5, grid=True),
                         [c.mouth_line(bez2((s * 0.09, 0.30), (s * 0.115, 0.33), (s * 0.08, 0.36), 10), y, 0.016) for s in S]),
    # talking set (changes every 2 frames)
    "talk_a": lambda c, y: c.paint(c.fpoly([(0.04 * math.cos(t), 0.235 + 0.035 * math.sin(t)) for t in arc(40)[:-1]], y), (60, 30, 34)),
    "talk_b": lambda c, y: c.mouth_teeth(0.17, 0.085, 0.20, y, shape="D", n=5, interior=True),
    "talk_c": lambda c, y: c.mouth_line(bez3((-0.06, 0.232), (-0.01, 0.240), (0.05, 0.236), (0.085, 0.21), 20), y),
}
EXPR = {  # name: (eyes, brows, mouth, fx)
    "smug": ("lid_smug", "smug", "smirk", None), "scheming": ("lid_scheme", "V", "sly", None),
    "neutral": ("dot", "flat", "smile", None), "stern": ("ring_stern", "stern", "dash", None),
    "worried": ("dot", "worried", "wavy", None), "startled": ("ring", "high", "o", None),
    "panic": ("ring_big", "panic", "box", "panic"),
}


class Rig(Char):
    def face(self, yaw, e):
        eyes, brows, mouth, fx = EXPR[e]
        EYES[self.pose.get("eyes") or eyes](self, yaw); BROWS[brows](self, yaw); MOUTHS[self.pose.get("m") or mouth](self, yaw)
        if fx == "panic":
            self.fx_vein(-0.30, -0.12, yaw); self._sweat = [(-35, 0.68, 0.075), (-5, 0.72, 0.06), (195, 0.68, 0.07), (160, 0.70, 0.055)]


def rig(Dpx, P):
    c = Rig(Dpx); c.pose = P; return c


def arm(c, sh, hand, bend=0.10):
    sh, hand = np.array(sh), np.array(hand); m = (sh + hand) / 2; d = hand - sh; n = np.array([d[1], -d[0]]) / (np.hypot(*d) + 1e-9)
    c.limb(bez2(tuple(sh), tuple(m + n * bend), tuple(hand), 22))


def hammer(c, hx, hy, ang):
    d = np.array([math.cos(ang), math.sin(ang)]); q = np.array([d[1], -d[0]]); h = np.array([hx, hy])
    tp = h + d * 0.40; handle = c.stroke([tuple(h - d * 0.10), tuple(tp)], 0.05); c.paint(handle, (166, 112, 62)); c.outline(handle, 0.025)
    hd = c.poly([tuple(tp + q * a * 0.16 + d * b * 0.055) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]); c.grad(hd, (150, 156, 164), 1.6); c.outline(hd, 0.03)


# ---------------- posable cast (same designs as the stills) ----------------
def carpenter(Dpx, P):
    c = rig(Dpx, P); c.legs()
    hb = P["hb"]; arm(c, (-0.30, 0.74), hb, -0.10); c.hand(*hb)
    m = c.bean(0, BTOP, BW, BH); c.clothes(m, (84, 122, 170))
    for yy in (0.62, 0.80): c.paint(c.stroke([(-0.5, yy), (0.5, yy)], 0.022) & m, (64, 92, 134))
    for xx in (-0.16, 0.14): c.paint(c.stroke([(xx, 0.3), (xx, 1.0)], 0.022) & m, (64, 92, 134))
    apron = m & c.poly([(-1, 0.94), (1, 0.94), (1, 2), (-1, 2)]); c.clothes(apron, (206, 170, 112), streak=False)
    c.paint(c.stroke([(-0.33, 0.94), (0.33, 0.94)], 0.018), INK)
    for sx in (-1, 1): c.paint(c.stroke([(sx * 0.22, 0.94), (sx * 0.19, 0.48)], 0.032) & m, (178, 142, 90))
    pk = c.poly([(-0.13, 1.05), (0.13, 1.05), (0.12, 1.22), (-0.12, 1.22)]); c.paint(pk, (188, 152, 98)); c.outline(pk, 0.02)
    c.outline(m)
    tri = c.poly([(-0.16, 0.45), (0.16, 0.45), (0.0, 0.64)]); c.paint(tri, (196, 64, 48)); c.outline(tri, 0.025)
    hf = P["hf"]; arm(c, (0.30, 0.74), hf, 0.10); hammer(c, hf[0], hf[1], P["ham"]); c.hand(*hf)
    c.head(0.26, P["e"]); c.hair(148, 236, (58, 40, 28)); flat_cap(c, (128, 110, 90), 1)
    return c.done()


def foreman(Dpx, P):
    c = rig(Dpx, P); c.legs()
    c.limb(bez3((0.31, 0.78), (0.60, 0.95), (0.50, 1.18), (0.28, 1.08), 24)); c.hand(0.28, 1.07)
    m = c.bean(0, BTOP, BW, BH); c.clothes(m, (72, 90, 76))
    vest = m & c.poly([(-0.16, 0.42), (0.16, 0.42), (0.11, 1.20), (-0.11, 1.20)]); c.clothes(vest, (204, 166, 64), streak=False); c.outline(vest, 0.024)
    for sx in (-1, 1):
        lap = c.poly([(sx * 0.16, 0.44), (sx * 0.28, 0.50), (sx * 0.14, 0.92)]); c.paint(lap & m, (92, 112, 96)); c.outline(lap & m, 0.02)
    c.paint(c.stroke(bez2((-0.11, 0.86), (0.0, 1.0), (0.11, 0.86), 20), 0.016), (232, 192, 82))
    for i in range(3): c.paint(c.ell(0.0, 0.76 + 0.13 * i, 0.017, 0.017, 16), (90, 64, 30))
    c.outline(m)
    colr = c.poly([(-0.13, 0.42), (0.0, 0.56), (0.13, 0.42), (0.0, 0.46)]); c.paint(colr, (244, 240, 230)); c.outline(colr, 0.02)
    c.paint(c.poly([(-0.10, 0.48), (0.0, 0.525), (0.10, 0.48), (0.10, 0.58), (0.0, 0.535), (-0.10, 0.58)]), INK)
    hf = P["hf"]; arm(c, (-0.31, 0.72), hf, -0.10); c.hand(*hf)
    c.head(-0.26, P["e"]); c.hair(-34, 22, (150, 148, 144)); top_hat(c)
    return c.done()


def sarah(Dpx, P):
    c = rig(Dpx, P); c.legs(1.70, 0.8)
    veil = c.poly(bez3((0.16, -0.40), (0.66, -0.30), (0.80, 0.60), (0.58, 1.10), 30) + [(0.30, 1.0), (0.40, 0.2)])
    c.paint(veil, (46, 44, 43), 0.95); c.outline(veil)
    hood = c.ell(0.05, -0.07, 0.61, 0.60); c.clothes(hood, (58, 55, 52)); c.outline(hood)
    dress = c.poly(bez3((-0.28, 0.42), (-0.50, 0.70), (-0.60, 1.62), (-0.46, 1.78), 30) + bez3((0.46, 1.78), (0.60, 1.62), (0.50, 0.70), (0.28, 0.42), 30))
    c.clothes(dress, (62, 58, 55))
    for i in range(5): c.paint(c.ell(-0.02, 0.70 + 0.14 * i, 0.019, 0.019, 20), (222, 212, 192))
    c.outline(dress)
    col = c.poly([(-0.25, 0.46)] + [(0.25 * math.cos(t), 0.46 + 0.15 * math.sin(t)) for t in np.linspace(0, math.pi, 18)][::-1] + [(0.25, 0.46)])
    c.paint(col, (240, 234, 220)); c.outline(col, 0.024)
    c.paint(c.ell(0, 0.63, 0.045, 0.05), (206, 168, 72)); c.paint(c.ell(0, 0.63, 0.026, 0.03), (240, 226, 200))
    hl, hr = P["hl"], P["hr"]; arm(c, (-0.33, 0.76), hl, 0.10); arm(c, (0.33, 0.76), hr, -0.10); c.hand(*hl); c.hand(*hr)
    c.head(-0.26, P["e"])
    brim = c.poly(bez3((-0.50, -0.16), (-0.46, -0.68), (0.50, -0.70), (0.53, -0.14), 30) + bez3((0.42, -0.22), (0.36, -0.54), (-0.36, -0.52), (-0.40, -0.12), 30))
    c.clothes(brim, (54, 51, 48)); c.outline(brim)
    for sx in (-1, 1): lp = c.ell(sx * 0.075, 0.50, 0.075, 0.045); c.paint(lp, (48, 46, 44)); c.outline(lp, 0.022)
    return c.done()


def tourist(Dpx, P):
    c = rig(Dpx, P); c.legs()
    pack = c.bean(-0.30, 0.52, 0.34, 0.80, 2.2, 0.0); c.clothes(pack, (44, 58, 88), streak=False); c.outline(pack)
    hb = P["hb"]; arm(c, (-0.30, 0.76), hb, -0.10); c.hand(*hb)
    m = c.bean(0, BTOP, BW, BH); c.clothes(m, (228, 104, 56))
    c.paint(c.poly([(-0.11, 0.86), (0.13, 0.86), (0.13, 0.99), (-0.11, 0.99)]), (250, 244, 232))
    for sx in (-1, 1): c.paint(c.stroke(bez2((sx * 0.20, 0.46), (sx * 0.27, 0.8), (sx * 0.27, 1.15), 16), 0.05) & m, (44, 58, 88))
    c.outline(m)
    cam = c.poly([(-0.16, 1.10), (0.10, 1.10), (0.10, 1.28), (-0.16, 1.28)]); c.grad(cam, (54, 54, 58), 1.5); c.outline(cam, 0.025)
    c.paint(c.ell(-0.03, 1.19, 0.06, 0.06), (120, 150, 180)); c.outline(c.ell(-0.03, 1.19, 0.06, 0.06), 0.022)
    hf = P["hf"]; arm(c, (0.30, 0.72), hf, 0.10); c.hand(*hf)
    c.head(0.26, P["e"]); c.hair(152, 234, (128, 80, 42)); ball_cap(c, (48, 112, 184), 1)
    return c.done()


# ---------------- timing ----------------
def mv(f, f0, a, b, n=15):
    """one move: outCubic over n frames (60-70% in the first 4-5), then exactly b (completely still)"""
    if f <= f0: return a
    t = min(1.0, (f - f0) / n); k = 1 - (1 - t) ** 3
    if isinstance(a, tuple): return tuple(round(x + (y - x) * k, 3) for x, y in zip(a, b))
    return round(a + (b - a) * k, 3)


TALK = ["talk_a", "talk_b", "talk_c", "talk_b", "talk_a", "talk_c", "talk_b", "talk_a", "talk_b", "talk_c", "talk_a", "talk_b", "talk_c", "talk_b", "talk_a", "talk_c"]


def pose_carpenter(f):
    P = {"e": "smug", "hb": (-0.44, 1.31), "m": "talk_c"}
    if 9 <= f < 41: P["m"] = TALK[(f - 9) // 2 % len(TALK)]               # mouth on twos, no blinks while talking
    if f >= 48: P["e"] = "scheming"; P["m"] = None                         # face first ...
    P["hf"] = mv(f, 49, (0.42, 1.02), (0.70, 0.26)); P["ham"] = mv(f, 49, 0.55, -1.25)   # ... body one frame later
    return P, mv(f, 49, 0.0, -3.0)                                         # lean back (deg)


def pose_foreman(f):
    P = {"e": "neutral", "eyes": "closed" if f in (22, 23) else None}     # the blink lands in a pause
    if f >= 54: P["e"] = "stern"
    P["hf"] = mv(f, 55, (-0.40, 1.22), (-0.82, 0.40))
    return P, mv(f, 55, 0.0, -2.5)


def pose_sarah(f):
    P = {"e": "startled" if f >= 84 else "worried"}
    P["hl"] = mv(f, 85, (-0.05, 1.10), (-0.50, 0.28)); P["hr"] = mv(f, 85, (0.04, 1.12), (0.50, 0.26))
    return P, mv(f, 85, 0.0, 4.0)


def pose_tourist(f):
    P = {"e": "panic" if f >= 146 else "startled"}
    P["hf"] = mv(f, 147, (0.70, 0.14), (0.66, -0.30)); P["hb"] = mv(f, 147, (-0.38, 1.31), (-0.66, -0.22))
    return P, mv(f, 147, 0.0, -4.0)


# ---------------- camera (in still pixels) ----------------
def ease_out(t): t = min(1.0, max(0.0, t)); return 1 - (1 - t) ** 3


def lerp3(a, b, k): return tuple(x + (y - x) * k for x, y in zip(a, b))


def shake(f, amp):
    t = f / FPS; return (amp * (math.sin(t * 4.59) * 0.5 + math.sin(t * 8.61) * 0.3 + math.sin(t * 13.7) * 0.2),
                         amp * (math.sin(t * 3.71 + 1.3) * 0.5 + math.sin(t * 9.43 + 0.4) * 0.3 + math.sin(t * 15.1) * 0.2))


def camera(f, K):
    if f < 75:                                                           # shot 1: push-in 1.9x, outCubic
        c = lerp3(K["wide"], K["pair"], ease_out(f / 74)); a = 2.0
    elif f < 82:                                                         # whip: accelerates, then stops dead
        t = (f - 74) / 8; c = lerp3(K["pair"], K["sarah"], t * t); a = 0.0
    elif f < 92: c, a = K["sarah"], 0.0                                  # rest (the camera's rare still frames)
    elif f < 135: c = lerp3(K["sarah"], K["sarah_in"], ease_out((f - 92) / 42)); a = 1.5
    else: c = lerp3(K["tour"], K["tour_in"], ease_out((f - 135) / 44)); a = 1.5   # hard cut + push-in
    dx, dy = shake(f, a); return (c[0] + dx, c[1] + dy, c[2])


def main(still, outdir):
    os.makedirs(outdir, exist_ok=True)
    W0 = Image.open(still).convert("RGB"); SW, SH = W0.size
    L.CAM.update(W=SW, H=SH)
    cast = [("tourist", tourist, pose_tourist, 380, 25.0), ("sarah", sarah, pose_sarah, 760, 30.0),
            ("foreman", foreman, pose_foreman, 1660, 32.6), ("carpenter", carpenter, pose_carpenter, 1240, 33.0)]
    info = {}
    for name, fn, pf, sxt, z in cast:
        x = L.solve_x(sxt, z); sx, sy, zc, fpx = L.project((x, 0.0, z)); D = L.HEIGHT * fpx / zc / (SOLE + 0.5)
        info[name] = dict(sx=float(sx), sy=float(sy), D=float(D), head=float(sy - SOLE * D))
    hw = lambda w: w * 16 / 9
    K = {"wide": (SW / 2, SH / 2, SW)}
    pair_head = (info["carpenter"]["head"] + info["foreman"]["head"]) / 2
    K["pair"] = ((info["carpenter"]["sx"] + info["foreman"]["sx"]) / 2, pair_head + 0.10 * hw(1137), 1137)
    K["sarah"] = (info["sarah"]["sx"], info["sarah"]["head"] + 0.10 * hw(1137), 1137)
    K["sarah_in"] = (info["sarah"]["sx"], info["sarah"]["head"] + 0.10 * hw(980), 980)
    K["tour"] = (max(360, info["tourist"]["sx"]), info["tourist"]["head"] + 0.06 * hw(720), 720)
    K["tour_in"] = (max(320, info["tourist"]["sx"]), info["tourist"]["head"] + 0.06 * hw(640), 640)
    minw = {"carpenter": 1137, "foreman": 1137, "sarah": 980, "tourist": 640}
    cache, rnd = {}, random.Random(3)
    parts = [(rnd.uniform(0, OW), rnd.uniform(0, OH * 0.9), rnd.uniform(0.7, 1.9), rnd.uniform(-0.25, 0.25), rnd.uniform(-0.5, -0.1), rnd.uniform(60, 150)) for _ in range(70)]
    for f in range(N):
        cx, cy, w = camera(f, K); h = hw(w); x0 = min(max(0, cx - w / 2), SW - w); y0 = min(max(0, cy - h / 2), SH - h); sc = OW / w
        bg = np.asarray(W0.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h))).astype(float)
        lay = []
        for name, fn, pf, _, _ in cast:
            P, lean = pf(f); I = info[name]; Dref = I["D"] * OW / minw[name]
            key = (name, repr(sorted((k, v) for k, v in P.items())))
            if key not in cache: cache[key] = fn(Dref, P)
            img, left, top = cache[key]; Dout = I["D"] * sc; k = Dout / Dref
            px, py = (I["sx"] - x0) * sc, (I["sy"] - y0) * sc
            lay.append((I["D"], name, img, left, top, Dout, k, px, py, lean))
        sh = Image.new("L", (OW, OH), 0); dr = ImageDraw.Draw(sh)                    # soft ground shadows (world layer)
        for _, _, _, _, _, Dout, _, px, py, _ in lay:
            dr.ellipse([px - 0.15 * Dout, py - 0.12 * Dout, px + 0.75 * Dout, py + 0.07 * Dout], fill=150)
        sh = np.asarray(sh.filter(ImageFilter.GaussianBlur(float(max(1.0, 0.06 * lay[0][5]))))) / 255.0
        bg *= (1 - 0.30 * sh)[..., None]
        for _, name, img, left, top, Dout, k, px, py, lean in sorted(lay, key=lambda t: t[0]):   # far first, on top, never blurred
            im = Image.fromarray(img, "RGBA"); nw, nh = max(1, int(im.size[0] * k)), max(1, int(im.size[1] * k))
            im = im.resize((nw, nh), Image.LANCZOS); pvx, pvy = -left * Dout, (SOLE - top) * Dout
            if lean: im = im.rotate(-lean, resample=Image.BICUBIC, center=(pvx, pvy))
            ox, oy = int(round(px - pvx)), int(round(py - pvy))
            if ox >= OW or oy >= OH or ox + nw <= 0 or oy + nh <= 0: continue
            a = np.asarray(im).astype(float); ys0, xs0 = max(0, -oy), max(0, -ox); ys1, xs1 = min(nh, OH - oy), min(nw, OW - ox)
            sub = a[ys0:ys1, xs0:xs1]; al = sub[..., 3:4] / 255.0
            reg = bg[oy + ys0:oy + ys1, ox + xs0:ox + xs1]; bg[oy + ys0:oy + ys1, ox + xs0:ox + xs1] = reg * (1 - al) + sub[..., :3] * al
        pl = Image.new("RGBA", (OW, OH), (0, 0, 0, 0)); d = ImageDraw.Draw(pl)        # particles drift over everything
        for x, y, r, vx, vy, al in parts:
            xx, yy = (x + vx * f) % OW, (y + vy * f) % OH; d.ellipse([xx - r, yy - r, xx + r, yy + r], fill=(255, 250, 232, int(al)))
        pl = np.asarray(pl.filter(ImageFilter.GaussianBlur(0.6))).astype(float); pa = pl[..., 3:4] / 255.0
        bg = bg * (1 - pa) + pl[..., :3] * pa
        Image.fromarray(np.clip(L.grade(bg / 255.0) * 255, 0, 255).astype(np.uint8)).save(f"{outdir}/f{f:04d}.png")
        if f % 30 == 0: print("frame", f, "sprites", len(cache), flush=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
