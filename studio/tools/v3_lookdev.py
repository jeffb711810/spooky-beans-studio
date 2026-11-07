"""Look-dev stills for cartoon framework v3 (style/CARTOON_FRAMEWORK.md).

Draws v3 characters and composites them ON TOP of a world render in the framework's 9-step order:
world (+fog/haze/DOF/bloom from the engine) -> ground shadows -> characters (never blurred) -> particles -> grade.

Character design, matched to Rick's frames (measured 2026-11-07):
- white sphere head with a soft cool-grey shade on the lower right (~15% darker), face kit projected onto the sphere
- eyes: dot ovals 0.09 x 0.115 D / lidded half-discs 0.17 x 0.095 D under a thick lid line / white rings 0.21 D
- brows: thick tapered brush strokes 0.18 x 0.05 D; mouths 0.03 D strokes
- bean bodies (superellipse capsules ~0.70 x 1.08 D), 0.055 D rubber limbs, ink-ball hands, ~3.25 D tall
- 3D-looking hats (seen slightly from above: elliptical bases and tops, gloss), sitting low on the head

usage: python3 v3_lookdev.py world.png group.png [medium.png]
"""
import math, sys, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd

SS = 4                                            # supersampling for smooth edges
INK = np.array([35, 24, 16], float)               # warm ink, never pure black (measured from Rick's frames)
SKIN = np.array([254, 251, 245], float)           # one skin colour: WHITE (Rick's day heads read #FBF9F2, L* 98)
SKIN_SH = SKIN * np.array([0.84, 0.85, 0.90])     # shade side (Rick's is lavender; ours blue-grey: no purple)
WHITE = np.array([255, 255, 255], float)
OUTLINE, LIMB, HAND, SOLE = 0.048, 0.055, 0.08, 2.75   # D; soles at y = 2.75 -> 3.25 D tall


def lin(c): c = np.asarray(c, float) / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def srgb(l): l = np.clip(l, 0, 1); return np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055) * 255.0
def smoothstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def arc(n=40, a0=0.0, a1=2 * math.pi): return np.linspace(a0, a1, n)


def bez2(a, b, c, n):
    return [tuple((1 - t) ** 2 * np.array(a) + 2 * (1 - t) * t * np.array(b) + t * t * np.array(c)) for t in np.linspace(0, 1, n)]


def bez3(a, b, c, d, n):
    A, B, C, Dd = map(np.array, (a, b, c, d))
    return [tuple((1 - t) ** 3 * A + 3 * (1 - t) ** 2 * t * B + 3 * (1 - t) * t * t * C + t ** 3 * Dd) for t in np.linspace(0, 1, n)]


class Char:
    """one character canvas; units in D, origin = head centre, +y down"""

    def __init__(self, Dpx, left=-1.35, right=1.35, top=-1.62, bottom=2.88):
        self.k = Dpx * SS; self.left, self.top = left, top
        self.W, self.H = int((right - left) * self.k), int((bottom - top) * self.k)
        self.rgb = np.zeros((self.H, self.W, 3)); self.a = np.zeros((self.H, self.W))
        self.X, self.Y = np.meshgrid(np.arange(self.W) / self.k + left, np.arange(self.H) / self.k + top)

    def P(self, x, y): return ((x - self.left) * self.k, (y - self.top) * self.k)

    # ---- masks ----
    def poly(self, pts):
        m = Image.new("L", (self.W, self.H), 0); ImageDraw.Draw(m).polygon([self.P(*p) for p in pts], fill=255)
        return np.asarray(m) > 127

    def ell(self, cx, cy, rx, ry, n=160): return self.poly([(cx + rx * math.cos(t), cy + ry * math.sin(t)) for t in arc(n)[:-1]])

    def bean(self, cx, top, w, h, n=2.5, taper=0.06):
        """superellipse capsule body; the lower half a little wider"""
        pts = []
        for t in arc(140)[:-1]:
            c, s = math.cos(t), math.sin(t)
            pts.append((cx + math.copysign(abs(c) ** (2 / n), c) * w / 2 * (1 + taper * s), top + h / 2 + math.copysign(abs(s) ** (2 / n), s) * h / 2))
        return self.poly(pts)

    def stroke(self, pts, w, taper=False):
        pts = np.asarray(pts, float); n = len(pts); L, R = [], []
        for i in range(n):
            a, b = pts[max(0, i - 1)], pts[min(n - 1, i + 1)]; d = b - a; d /= (np.hypot(*d) + 1e-9)
            nrm = np.array([-d[1], d[0]]); s = i / (n - 1)
            ww = w * (math.sin(math.pi * s) ** 0.55 if taper else 1.0) / 2
            L.append(pts[i] + nrm * ww); R.append(pts[i] - nrm * ww)
        m = self.poly([tuple(p) for p in L + R[::-1]])
        if not taper:
            for p in (pts[0], pts[-1]): m |= self.ell(p[0], p[1], w / 2, w / 2, 48)
        return m

    # ---- paint ----
    def paint(self, m, col, alpha=1.0):
        col = np.asarray(col, float); mm = m.astype(float) * alpha
        if col.ndim == 1: col = col[None, None, :]
        self.rgb = self.rgb * (1 - mm[..., None]) + col * mm[..., None]; self.a = self.a + mm * (1 - self.a)

    def outline(self, m, w=OUTLINE):
        r = w / 2 * self.k; ys, xs = np.nonzero(m)
        if not len(ys): return
        pad = int(r) + 4; y0, y1, x0, x1 = max(0, ys.min() - pad), min(self.H, ys.max() + pad), max(0, xs.min() - pad), min(self.W, xs.max() + pad)
        sub = m[y0:y1, x0:x1]; band = np.zeros_like(m)
        band[y0:y1, x0:x1] = (nd.distance_transform_edt(~sub) <= r) & (nd.distance_transform_edt(sub) <= r)
        self.paint(band, INK)

    def grad(self, m, base, k=1.85):
        """clothes: light left -> right side k x darker (linear light)"""
        ys, xs = np.nonzero(m)
        if not len(xs): return
        x0, x1 = xs.min(), xs.max(); t = np.clip((np.arange(self.W) - x0) / max(1, x1 - x0), 0, 1)
        Lc = lin(np.minimum(255, np.asarray(base, float) * 1.06)); Dc = lin(base) / k
        row = srgb(Lc[None, :] * (1 - t[:, None]) + Dc[None, :] * t[:, None])
        self.paint(m, np.broadcast_to(row[None, :, :], (self.H, self.W, 3)))

    def streak(self, m, w=0.022):
        """pale streak just inside the LEFT edge of a shape, upper middle, following its contour"""
        ys, xs = np.nonzero(m)
        if not len(ys): return
        y0, y1 = ys.min(), ys.max(); ins = int((OUTLINE * 0.75 + w * 0.7) * self.k); pts = []
        for f in np.linspace(0.22, 0.62, 24):
            y = int(y0 + f * (y1 - y0)); row = np.nonzero(m[y])[0]
            if len(row): pts.append(((row.min() + ins) / self.k + self.left, y / self.k + self.top))
        if len(pts) > 3: self.paint(self.stroke(pts, w, taper=True) & m, (255, 250, 236), 0.9)

    def clothes(self, m, base, k=1.85, streak=True):
        self.grad(m, base, k)
        if streak: self.streak(m)

    def gloss(self, m, x0, y0, x1, y1, w=0.05, a=0.22):
        self.paint(self.stroke([(x0, y0), (x1, y1)], w) & m, WHITE, a)

    # ---- head + face kit projected onto the sphere ----
    def head(self, yaw, expr):
        R = 0.5; m = self.ell(0, 0, R, R)
        x, y = self.X / R, -self.Y / R; rr = x * x + y * y; z = np.sqrt(np.clip(1 - rr, 0, 1))
        Lv = np.array([-0.55, 0.45, 0.70]); Lv /= np.linalg.norm(Lv)
        s = smoothstep(-0.30, 0.60, x * Lv[0] + y * Lv[1] + z * Lv[2])[..., None]      # lit fraction: soft sphere terminator
        rim = (1 - 0.06 * np.clip((np.sqrt(rr) - 0.86) / 0.14, 0, 1) ** 2)[..., None]
        self.paint(m, (SKIN_SH * (1 - s) + SKIN * s) * rim)
        self.face(yaw, expr); self.outline(m, 0.05)

    def sph(self, u, v, yaw):
        R = 0.5; lon = u / R + yaw; lat = v / R
        return (R * math.cos(lat) * math.sin(lon), R * math.sin(lat))

    def fpoly(self, pts, yaw): return self.poly([self.sph(u, v, yaw) for u, v in pts])
    def fstroke(self, pts, w, yaw, taper=False): return self.stroke([self.sph(u, v, yaw) for u, v in pts], w, taper)

    def brow(self, bx, by, ang, sag, yaw, ln=0.09, w=0.05):
        c = []
        for t in np.linspace(-1, 1, 30):
            u, v = ln * t, -sag * (1 - t * t)
            c.append((bx + u * math.cos(ang) - v * math.sin(ang), by + u * math.sin(ang) + v * math.cos(ang)))
        self.paint(self.fstroke(c, w, yaw, taper=True), INK)

    def face(self, yaw, e):
        EX, EY = 0.130, 0.045
        kind = {"smug": "lid", "deadpan": "lid", "angry": "lid", "worried": "dot", "neutral": "dot", "surprised": "ring"}[e]
        for s in (-1, 1):
            ex = s * EX
            if kind == "dot":
                self.paint(self.fpoly([(ex + 0.046 * math.cos(t), EY + 0.058 * math.sin(t)) for t in arc(64)[:-1]], yaw), INK)
                by = EY - 0.165
            elif kind == "lid":
                top = EY - 0.03
                self.paint(self.fpoly([(ex + 0.085 * math.cos(t), top + 0.095 * math.sin(t)) for t in arc(40, 0, math.pi)], yaw), INK)
                drop = 0.014 if e != "angry" else -0.02                 # outer end of the lid a touch lower
                self.paint(self.fstroke([(ex - s * 0.098, top - drop * 0.3), (ex, top - 0.004), (ex + s * 0.098, top + drop)], 0.034, yaw), INK)
                by = top - 0.10
            else:                                                       # startled: white rings, small pupils
                cx, rr = s * 0.115, 0.105
                ring = [(cx + rr * math.cos(t), EY - 0.01 + rr * math.sin(t)) for t in arc(72)]
                self.paint(self.fpoly(ring[:-1], yaw), WHITE); self.paint(self.fstroke(ring, 0.03, yaw), INK)
                self.paint(self.fpoly([(cx + 0.012 + 0.03 * math.cos(t), EY - 0.005 + 0.033 * math.sin(t)) for t in arc(32)[:-1]], yaw), INK)
                by = EY - 0.205
            # brows: thick tapered brush strokes that do the acting
            if e == "worried": self.brow(s * 0.135, by + 0.01, s * 0.34, 0.015, yaw)
            elif e == "angry": self.brow(s * 0.13, by + 0.035, -s * 0.40, 0.0, yaw)
            elif e == "smug": self.brow(s * 0.135, by - (0.045 if s > 0 else 0.0), (0.10 if s > 0 else -0.06), 0.02, yaw)
            elif e == "surprised": self.brow(s * 0.12, by, 0.0, 0.035, yaw, ln=0.08)
            elif e == "deadpan": self.brow(s * 0.135, by + 0.01, -s * 0.05, 0.008, yaw)
            else: self.brow(s * 0.135, by, 0.0, 0.02, yaw)
        # mouth (0.03 D strokes)
        if e == "surprised":
            self.paint(self.fpoly([(0.0 + 0.034 * math.cos(t), 0.245 + 0.044 * math.sin(t)) for t in arc(40)[:-1]], yaw), INK)
        elif e == "smug": self.paint(self.fstroke(bez3((-0.06, 0.232), (-0.01, 0.240), (0.05, 0.236), (0.085, 0.205), 24), 0.03, yaw), INK)
        elif e == "deadpan": self.paint(self.fstroke([(-0.085, 0.228), (0.085, 0.226)], 0.03, yaw), INK)
        elif e == "worried": self.paint(self.fstroke([(-0.045, 0.236), (-0.015, 0.228), (0.015, 0.236), (0.045, 0.228)], 0.028, yaw), INK)
        elif e == "angry": self.paint(self.fstroke(bez2((-0.07, 0.245), (0.0, 0.215), (0.07, 0.245), 20), 0.03, yaw), INK)
        else: self.paint(self.fstroke(bez2((-0.06, 0.218), (0.0, 0.245), (0.06, 0.218), 20), 0.03, yaw), INK)

    def hair(self, a0, a1, col, r_in=(0.34, 0.42), strands=3):
        out = [(0.5 * math.cos(math.radians(t)), 0.5 * math.sin(math.radians(t))) for t in np.linspace(a0, a1, 30)]
        inn = [(r_in[i % 2] * math.cos(math.radians(t)), r_in[i % 2] * math.sin(math.radians(t))) for i, t in enumerate(np.linspace(a1, a0, 9))]
        m = self.poly(out + inn) & self.ell(0, 0, 0.475, 0.475); self.paint(m, col)
        for i in range(strands):                                        # a few darker strand lines
            t = math.radians(a0 + (a1 - a0) * (i + 1) / (strands + 1))
            self.paint(self.stroke([(0.47 * math.cos(t), 0.47 * math.sin(t)), (0.40 * math.cos(t + 0.06), 0.40 * math.sin(t + 0.06))], 0.016) & m, np.asarray(col) * 0.6)

    # ---- limbs ----
    def limb(self, pts, w=LIMB): self.paint(self.stroke(pts, w), INK)

    def hand(self, x, y):
        self.paint(self.ell(x, y, HAND / 2, HAND / 2, 40), INK)
        self.paint(self.ell(x - HAND * 0.17, y - HAND * 0.17, 0.011, 0.011, 20), (236, 226, 208))   # one tiny pale dot

    def legs(self, hip_y=1.36, spread=1.0):
        for s in (-1, 1):
            hip, ank = (s * 0.17, hip_y), (s * 0.175, SOLE - 0.035)
            pts = bez3(hip, (s * 0.21 * spread, hip_y + 0.4), (s * 0.215 * spread, SOLE - 0.45), ank, 30)
            self.limb(pts + bez2(ank, (s * 0.185, SOLE), (s * 0.31, SOLE), 12)[1:])

    def done(self):
        img = np.dstack([np.clip(self.rgb, 0, 255), np.clip(self.a, 0, 1) * 255]).astype(np.uint8)
        pm = img.astype(float); pm[..., :3] *= pm[..., 3:4] / 255
        small = Image.fromarray(pm.astype(np.uint8), "RGBA").resize((self.W // SS, self.H // SS), Image.LANCZOS)
        s = np.asarray(small).astype(float); a = s[..., 3:4] / 255
        s[..., :3] = np.where(a > 0.002, s[..., :3] / np.maximum(a, 1e-3), 0)
        return np.clip(s, 0, 255).astype(np.uint8), self.left, self.top


BTOP, BH, BW = 0.40, 1.08, 0.70      # bean body: top (tucked 0.10 D under the head), height, width


# ---------------- hats (3D look: elliptical bases/tops seen slightly from above, gloss) ----------------
def flat_cap(c, col, f=1):
    base = [(x, -0.20 + 0.075 * math.sqrt(max(0.0, 1 - (x / 0.55) ** 2))) for x in np.linspace(0.56 * f, -0.55 * f, 30)]
    crown = c.poly(bez3((-0.55 * f, -0.18), (-0.66 * f, -0.80), (0.58 * f, -0.84), (0.56 * f, -0.22), 40) + base)
    c.clothes(crown, col); c.paint(c.stroke(bez2((-0.40 * f, -0.26), (-0.05 * f, -0.80), (0.42 * f, -0.40), 30), 0.016) & crown, np.asarray(col) * 0.62)
    c.gloss(crown, -0.30 * f, -0.66, 0.05 * f, -0.74, 0.045, 0.18); c.outline(crown)
    btn = c.ell(-0.02 * f, -0.655, 0.05, 0.028); c.paint(btn, np.asarray(col) * 0.75); c.outline(btn, 0.02)
    visor = c.poly(bez3((0.22 * f, -0.17), (0.60 * f, -0.30), (0.95 * f, -0.24), (0.92 * f, -0.15), 24) + bez2((0.92 * f, -0.15), (0.60 * f, -0.10), (0.24 * f, -0.08), 18))
    c.clothes(visor, np.asarray(col) * 0.86, streak=False); c.outline(visor)


def ball_cap(c, col, f=1):
    base = [(x, -0.17 + 0.07 * math.sqrt(max(0.0, 1 - (x / 0.52) ** 2))) for x in np.linspace(0.52 * f, -0.53 * f, 30)]
    crown = c.poly(bez3((-0.53 * f, -0.15), (-0.58 * f, -0.84), (0.52 * f, -0.86), (0.52 * f, -0.17), 40) + base)
    c.clothes(crown, col)
    for g in (-0.18, 0.20): c.paint(c.stroke(bez2((g * f, -0.12), (g * 0.6 * f, -0.50), (0.0, -0.67), 24), 0.016) & crown, np.asarray(col) * 0.6)
    c.gloss(crown, -0.32 * f, -0.60, -0.08 * f, -0.76, 0.05, 0.2); c.outline(crown)
    btn = c.ell(0.0, -0.665, 0.05, 0.028); c.paint(btn, np.asarray(col) * 0.8); c.outline(btn, 0.02)
    visor = c.poly(bez3((0.25 * f, -0.18), (0.62 * f, -0.33), (1.02 * f, -0.26), (1.00 * f, -0.15), 24) + bez2((1.00 * f, -0.15), (0.64 * f, -0.08), (0.28 * f, -0.07), 18))
    c.clothes(visor, np.asarray(col) * 0.88, streak=False); c.outline(visor)


def top_hat(c, col=(54, 50, 48), band=(150, 44, 38)):
    by = -0.25
    brim = c.ell(0.0, by + 0.02, 0.62, 0.12); c.clothes(brim, np.asarray(col) * 1.1, streak=False); c.outline(brim)
    base = [(x, by + 0.055 * math.sqrt(max(0.0, 1 - (x / 0.31) ** 2))) for x in np.linspace(0.31, -0.31, 24)]
    crown = c.poly([(-0.31, by), (-0.34, -1.06), (0.34, -1.06), (0.31, by)][:3] + [(0.34, -1.06)] + base)
    c.clothes(crown, col)
    bm = crown & ~c.poly([(-1, -2)] + [(x, y - 0.13) for x, y in base[::-1]] + [(1, -2)]); c.paint(bm, band)
    c.gloss(crown, -0.17, -0.98, -0.15, -0.42, 0.06, 0.2); c.outline(crown)
    top = c.ell(0.0, -1.06, 0.34, 0.07); c.paint(top, np.asarray(col) * 1.35); c.outline(top, 0.035)


# ---------------- the cast ----------------
def carpenter(Dpx):
    c = Char(Dpx); f = 1
    c.legs()
    c.limb(bez2((-0.30, 0.74), (-0.50, 1.0), (-0.44, 1.30), 20)); c.hand(-0.44, 1.31)
    m = c.bean(0, BTOP, BW, BH); c.clothes(m, (84, 122, 170))
    for yy in (0.62, 0.80): c.paint(c.stroke([(-0.5, yy), (0.5, yy)], 0.022) & m, (64, 92, 134))      # plaid
    for xx in (-0.16, 0.14): c.paint(c.stroke([(xx, 0.3), (xx, 1.0)], 0.022) & m, (64, 92, 134))
    apron = m & c.poly([(-1, 0.94), (1, 0.94), (1, 2), (-1, 2)]); c.clothes(apron, (206, 170, 112), streak=False)
    c.paint(c.stroke([(-0.33, 0.94), (0.33, 0.94)], 0.018), INK)
    for sx in (-1, 1): c.paint(c.stroke([(sx * 0.22, 0.94), (sx * 0.19, 0.48)], 0.032) & m, (178, 142, 90))
    pk = c.poly([(-0.13, 1.05), (0.13, 1.05), (0.12, 1.22), (-0.12, 1.22)]); c.paint(pk, (188, 152, 98)); c.outline(pk, 0.02)
    c.paint(c.stroke([(-0.06, 1.05), (-0.065, 0.95)], 0.022), (120, 120, 126))
    c.outline(m)
    tri = c.poly([(-0.16, 0.45), (0.16, 0.45), (0.0, 0.64)]); c.paint(tri, (196, 64, 48)); c.outline(tri, 0.025)
    hx, hy = 0.64, 0.60                                    # front arm holds a hammer up and out
    c.limb(bez2((0.30, 0.74), (0.54, 0.84), (hx, hy), 20))
    tp = np.array([hx + 0.11, hy - 0.40]); d = tp - np.array([hx - 0.02, hy + 0.10]); d /= np.hypot(*d); q = np.array([d[1], -d[0]])
    handle = c.stroke([(hx - 0.02, hy + 0.10), tuple(tp)], 0.05); c.paint(handle, (166, 112, 62)); c.outline(handle, 0.025)
    hd = c.poly([tuple(tp + q * a * 0.16 + d * b * 0.055) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]); c.grad(hd, (150, 156, 164), 1.6); c.outline(hd, 0.03)
    c.hand(hx, hy)
    c.head(0.26 * f, "smug"); c.hair(148, 236, (58, 40, 28))
    flat_cap(c, (128, 110, 90), f)
    return c.done()


def sarah(Dpx):
    c = Char(Dpx); f = -1
    c.legs(1.70, 0.8)
    veil = c.poly(bez3((0.16, -0.40), (0.66, -0.30), (0.80, 0.60), (0.58, 1.10), 30) + [(0.30, 1.0), (0.40, 0.2)])
    c.paint(veil, (46, 44, 43), 0.95); c.outline(veil)
    hood = c.ell(0.05, -0.07, 0.61, 0.60); c.clothes(hood, (58, 55, 52)); c.outline(hood)
    dress = c.poly(bez3((-0.28, 0.42), (-0.50, 0.70), (-0.60, 1.62), (-0.46, 1.78), 30) + bez3((0.46, 1.78), (0.60, 1.62), (0.50, 0.70), (0.28, 0.42), 30))
    c.clothes(dress, (62, 58, 55))
    for i in range(5): c.paint(c.ell(-0.02, 0.70 + 0.14 * i, 0.019, 0.019, 20), (222, 212, 192))
    c.paint(c.stroke(bez2((-0.50, 1.62), (0.0, 1.70), (0.50, 1.62), 30), 0.018) & dress, (40, 38, 36))
    c.outline(dress)
    col = c.poly([(-0.25, 0.46)] + [(0.25 * math.cos(t), 0.46 + 0.15 * math.sin(t)) for t in np.linspace(0, math.pi, 18)][::-1] + [(0.25, 0.46)])
    c.paint(col, (240, 234, 220)); c.outline(col, 0.024)
    for i in range(7): c.paint(c.ell(-0.21 + 0.07 * i, 0.47 + 0.11 * math.sin(math.pi * i / 6), 0.018, 0.018, 16), (220, 212, 196))   # lace
    c.paint(c.ell(0, 0.63, 0.045, 0.05), (206, 168, 72)); c.paint(c.ell(0, 0.63, 0.026, 0.03), (240, 226, 200))
    c.limb(bez2((-0.33, 0.76), (-0.36, 1.12), (-0.06, 1.10), 20)); c.limb(bez2((0.33, 0.76), (0.32, 1.14), (0.04, 1.12), 20))
    c.hand(-0.05, 1.10); c.hand(0.04, 1.12)
    c.head(0.26 * f, "worried")
    brim = c.poly(bez3((-0.50, -0.16), (-0.46, -0.68), (0.50, -0.70), (0.53, -0.14), 30) + bez3((0.42, -0.22), (0.36, -0.54), (-0.36, -0.52), (-0.40, -0.12), 30))
    c.clothes(brim, (54, 51, 48)); c.outline(brim)
    for sx in (-1, 1):                                                       # ribbon bow under the chin
        lp = c.ell(sx * 0.075, 0.50, 0.075, 0.045); c.paint(lp, (48, 46, 44)); c.outline(lp, 0.022)
    c.paint(c.ell(0, 0.50, 0.03, 0.03), (40, 38, 36))
    return c.done()


def foreman(Dpx):
    c = Char(Dpx); f = -1
    c.legs()
    c.limb(bez3((0.31, 0.78), (0.60, 0.95), (0.50, 1.18), (0.28, 1.08), 24)); c.hand(0.28, 1.07)
    m = c.bean(0, BTOP, BW, BH); c.clothes(m, (72, 90, 76))
    vest = m & c.poly([(-0.16, 0.42), (0.16, 0.42), (0.11, 1.20), (-0.11, 1.20)]); c.clothes(vest, (204, 166, 64), streak=False); c.outline(vest, 0.024)
    for sx in (-1, 1):
        lap = c.poly([(sx * 0.16, 0.44), (sx * 0.28, 0.50), (sx * 0.14, 0.92)]); c.paint(lap & m, (92, 112, 96)); c.outline(lap & m, 0.02)
    c.paint(c.stroke(bez2((-0.11, 0.86), (0.0, 1.0), (0.11, 0.86), 20), 0.016), (232, 192, 82))
    for i in range(3): c.paint(c.ell(0.0, 0.76 + 0.13 * i, 0.017, 0.017, 16), (90, 64, 30))
    c.outline(m)
    colr = c.poly([(-0.13, 0.42), (0.0, 0.56), (0.13, 0.42), (0.0, 0.46)]); c.paint(colr, (244, 240, 230)); c.outline(colr, 0.02)
    bow = c.poly([(-0.10, 0.48), (0.0, 0.525), (0.10, 0.48), (0.10, 0.58), (0.0, 0.535), (-0.10, 0.58)]); c.paint(bow, INK)
    c.limb(bez2((-0.31, 0.72), (-0.58, 0.66), (-0.78, 0.42), 20)); c.hand(-0.79, 0.41)
    c.head(0.26 * f, "neutral"); c.hair(-34, 22, (150, 148, 144))
    top_hat(c)
    return c.done()


def tourist(Dpx):
    c = Char(Dpx); f = 1
    c.legs()
    pack = c.bean(-0.30, 0.52, 0.34, 0.80, 2.2, 0.0); c.clothes(pack, (44, 58, 88), streak=False); c.outline(pack)
    c.limb(bez2((-0.30, 0.76), (-0.48, 1.02), (-0.38, 1.30), 20)); c.hand(-0.38, 1.31)
    m = c.bean(0, BTOP, BW, BH); c.clothes(m, (228, 104, 56))
    logo = c.poly([(-0.11, 0.86), (0.13, 0.86), (0.13, 0.99), (-0.11, 0.99)]); c.paint(logo, (250, 244, 232))
    c.paint(c.stroke([(-0.07, 0.925), (0.09, 0.925)], 0.02), (228, 104, 56))
    for sx in (-1, 1): c.paint(c.stroke(bez2((sx * 0.20, 0.46), (sx * 0.27, 0.8), (sx * 0.27, 1.15), 16), 0.05) & m, (44, 58, 88))
    c.outline(m)
    cam = c.poly([(-0.16, 1.10), (0.10, 1.10), (0.10, 1.28), (-0.16, 1.28)]); c.grad(cam, (54, 54, 58), 1.5); c.outline(cam, 0.025)
    c.paint(c.ell(-0.03, 1.19, 0.06, 0.06), (120, 150, 180)); c.outline(c.ell(-0.03, 1.19, 0.06, 0.06), 0.022)
    c.paint(c.stroke(bez2((-0.14, 1.10), (-0.2, 0.7), (0.0, 0.48), 16), 0.02), (40, 40, 44))
    c.limb(bez2((0.30, 0.72), (0.64, 0.58), (0.70, 0.16), 20)); c.hand(0.70, 0.14)
    c.head(0.26 * f, "surprised"); c.hair(152, 234, (128, 80, 42))
    ball_cap(c, (48, 112, 184), f)
    return c.done()


# ---------------- compose ----------------
CAM = dict(pos=np.array([-897.8, 1.0, 44.0]), look=np.array([-899.2, 5.0, 0.0]), fov=26.0, W=1080, H=1920)
HEIGHT = 1.55                                                          # metres, head top to soles (3.25 D)


def project(X):
    C, T = CAM["pos"], CAM["look"]; fw = (T - C) / np.linalg.norm(T - C)
    r = np.cross(fw, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, fw)
    d = np.asarray(X, float) - C; zc = d @ fw; fpx = (CAM["H"] / 2) / math.tan(math.radians(CAM["fov"] / 2))
    return CAM["W"] / 2 + (d @ r) / zc * fpx, CAM["H"] / 2 - (d @ u) / zc * fpx, zc, fpx


def solve_x(sx_target, z):
    a = project((-900, 0, z))[0]; b = project((-897, 0, z))[0]; return -900 + 3 * (sx_target - a) / (b - a)


def main(world, out, cast, seed=7):
    bg = np.asarray(Image.open(world).convert("RGB")).astype(float); H, W = bg.shape[:2]; placed = []
    for fn, sxt, z in cast:
        x = solve_x(sxt, z); sx, sy, zc, fpx = project((x, 0.0, z)); Dpx = HEIGHT * fpx / zc / (SOLE + 0.5)
        img, left, top = fn(Dpx)
        placed.append(dict(z=float(zc), img=img, ox=float(sx + left * Dpx), oy=float(sy - (SOLE - top) * Dpx), D=float(Dpx), top=top))
    placed.sort(key=lambda p: -p["z"])
    sh = np.zeros((H, W))                                              # world step: soft ground shadows (fall back-right)
    for p in placed:
        a = p["img"][..., 3]; h, w = a.shape; ho = int(h * 0.22); k = 1.1
        flat = Image.fromarray(a).transform((int(w + k * ho) + 2, ho), Image.AFFINE, (1, k, -k * ho, 0, h / ho, 0), Image.BILINEAR)
        fa = np.asarray(flat.filter(ImageFilter.GaussianBlur(p["D"] * 0.05))) / 255.0
        ox, oy = int(p["ox"]), int(p["oy"] + (SOLE - p["top"]) * p["D"] - ho)
        y0, x0, y1, x1 = max(0, oy), max(0, ox), min(H, oy + ho), min(W, ox + fa.shape[1])
        if y1 > y0 and x1 > x0: sh[y0:y1, x0:x1] = np.maximum(sh[y0:y1, x0:x1], fa[y0 - oy:y1 - oy, x0 - ox:x1 - ox])
    bg *= (1 - 0.30 * sh)[..., None]
    for p in placed:                                                   # step 7: characters on top, never blurred
        img = p["img"].astype(float); h, w = img.shape[:2]; ox, oy = int(round(p["ox"])), int(round(p["oy"]))
        y0, x0, y1, x1 = max(0, oy), max(0, ox), min(H, oy + h), min(W, ox + w)
        if y1 <= y0 or x1 <= x0: continue
        sub = img[y0 - oy:y1 - oy, x0 - ox:x1 - ox]; a = sub[..., 3:4] / 255.0
        bg[y0:y1, x0:x1] = bg[y0:y1, x0:x1] * (1 - a) + sub[..., :3] * a
    rnd = random.Random(seed); lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)   # step 8: particles
    for _ in range(80):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H * 0.85), rnd.uniform(1.0, 2.6)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 250, 232, int(rnd.uniform(70, 150))))
    for _ in range(9):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H * 0.7), rnd.uniform(10, 26)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 248, 225, int(rnd.uniform(14, 28))))
    lay = np.asarray(lay.filter(ImageFilter.GaussianBlur(0.8))).astype(float); la = lay[..., 3:4] / 255.0
    bg = bg * (1 - la) + lay[..., :3] * la
    Image.fromarray(np.clip(grade(bg / 255.0) * 255, 0, 255).astype(np.uint8)).save(out)   # step 9: grade over everything


# Rick's measured DAY grade targets: Y' .13/.21/.42/.57/.71/.90/.97, S p50 .43, warm-lifted blacks, vignette .86
DAY = dict(kx=[0, 0.30, 0.55, 0.75, 0.86, 0.95, 1.0], ky=[0.035, 0.17, 0.42, 0.63, 0.82, 0.975, 1.0],
           sat=(1.0, 1.12, 1.06), tintS=(6, 0, 3), tintM=(0, 0, 4), tintH=(0, 0, 0), vig=(0.12, 0.42), amount=1.0)


def grade(c, g=DAY):
    from scipy.interpolate import PchipInterpolator
    cur = PchipInterpolator(g["kx"], g["ky"]); src = c.copy(); c = cur(np.clip(c, 0, 1))
    y = c @ np.array([0.2126, 0.7152, 0.0722]); wS = 1 - smoothstep(0, 0.55, y); wH = smoothstep(0.45, 1, y); wM = 1 - wS - wH
    sS, sM, sH = g["sat"]; sv = sM + (sS - sM) * wS + (sH - sM) * wH
    c = y[..., None] + sv[..., None] * (c - y[..., None])
    c = c + (wS[..., None] * np.array(g["tintS"]) + wM[..., None] * np.array(g["tintM"]) + wH[..., None] * np.array(g["tintH"])) / 255.0
    h, w = y.shape; yy, xx = np.mgrid[0:h, 0:w]; r = np.hypot(xx / w * 2 - 1, yy / h * 2 - 1) * 0.70710678
    c = c * (1 - g["vig"][0] * smoothstep(g["vig"][1], 1, r))[..., None]
    return np.clip(src + (np.clip(c, 0, 1) - src) * g["amount"], 0, 1)


if __name__ == "__main__":
    # group shot (screen x of the feet, ground depth z)
    main(sys.argv[1], sys.argv[2], [(carpenter, 198, 32.4), (sarah, 440, 25.8), (foreman, 650, 30.6), (tourist, 890, 28.2)])
    if len(sys.argv) > 3:   # medium two-shot like Rick's thumbnails: closer, feet out of frame
        main(sys.argv[1], sys.argv[3], [(foreman, 800, 37.2), (carpenter, 255, 37.9)])
