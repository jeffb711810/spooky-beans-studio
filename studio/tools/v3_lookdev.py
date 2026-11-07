"""Look-dev still for cartoon framework v3 (style/CARTOON_FRAMEWORK.md).

Draws v3 characters (face kit projected onto a sphere head, hats, gradient clothes with the pale streak, rubber limbs,
ink-ball hands) and composites them ON TOP of a world render, following the 9-step order:
world (+fog/haze/DOF/bloom from the engine) -> shadows in the world -> characters (never blurred) -> particles -> grade.

usage: python3 v3_lookdev.py world.png out.png
"""
import math, sys, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd

SS = 4                                   # supersampling for smooth edges
INK = np.array([35, 24, 16], float)      # warm ink, never pure black (measured from Rick's frames)
SKIN = np.array([254, 251, 245], float)  # one skin colour for everyone: WHITE (Rick day heads read #FBF9F2, L* 98 on screen)
OUTLINE = 0.045                          # D
LIMB = 0.06                              # D
HAND = 0.078                             # D, ink ball


def lin(c): c = np.asarray(c, float) / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def srgb(l): l = np.clip(l, 0, 1); return np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055) * 255.0


class Char:
    """one character canvas; units in D, origin = head centre, +y down"""

    def __init__(self, Dpx, left=-1.25, right=1.25, top=-1.45, bottom=2.72):
        self.k = Dpx * SS
        self.left, self.top = left, top
        self.W, self.H = int((right - left) * self.k), int((bottom - top) * self.k)
        self.rgb = np.zeros((self.H, self.W, 3)); self.a = np.zeros((self.H, self.W))

    def P(self, x, y): return ((x - self.left) * self.k, (y - self.top) * self.k)

    # ---- masks ----
    def poly(self, pts):
        m = Image.new("L", (self.W, self.H), 0); ImageDraw.Draw(m).polygon([self.P(*p) for p in pts], fill=255)
        return np.asarray(m) > 127

    def ell(self, cx, cy, rx, ry, n=160):
        return self.poly([(cx + rx * math.cos(t), cy + ry * math.sin(t)) for t in np.linspace(0, 2 * math.pi, n, endpoint=False)])

    def stroke(self, pts, w, taper=False):
        """polygon around a centreline, width w (D) (tapered ends optional), round caps"""
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
        r = w / 2 * self.k
        ys, xs = np.nonzero(m)
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
        Lc = lin(np.minimum(255, np.asarray(base) * 1.06)); Dc = lin(base) / k
        row = srgb(Lc[None, :] * (1 - t[:, None]) + Dc[None, :] * t[:, None])
        self.paint(m, np.broadcast_to(row[None, :, :], (self.H, self.W, 3)))

    def streak(self, cx, cy, rx, ry, a0=-0.1, a1=0.85, w=0.022, clip=None):
        """pale streak just inside the LEFT edge, upper middle (clipped to the shape)"""
        ins = OUTLINE * 0.9 + w * 0.6
        pts = [(cx - (rx - ins) * math.cos(t), cy - (ry - ins) * math.sin(t)) for t in np.linspace(a0, a1, 40)]
        m = self.stroke(pts, w, taper=True)
        if clip is not None: m &= nd.binary_erosion(clip, iterations=int(OUTLINE * 0.5 * self.k))
        self.paint(m, (255, 250, 236), 0.9)

    def clothes(self, m, base, ell=None):
        self.grad(m, base)
        if ell: self.streak(*ell, clip=m)

    def hair(self, a0, a1, col, r_in=(0.36, 0.43)):
        """flat hair patch hugging the back of the head, ragged inner edge"""
        out = [(0.5 * math.cos(math.radians(t)), 0.5 * math.sin(math.radians(t))) for t in np.linspace(a0, a1, 30)]
        inn = [((r_in[i % 2]) * math.cos(math.radians(t)), (r_in[i % 2]) * math.sin(math.radians(t))) for i, t in enumerate(np.linspace(a1, a0, 9))]
        self.paint(self.poly(out + inn) & self.ell(0, 0, 0.478, 0.478), col)

    # ---- head + face kit projected onto the sphere ----
    def head(self, yaw, expr):
        R = 0.5; m = self.ell(0, 0, R, R)
        X, Y = np.meshgrid((np.arange(self.W) / self.k + self.left), (np.arange(self.H) / self.k + self.top))
        r = np.hypot(X, Y) / R
        t = np.clip((X + R) / (2 * R), 0, 1)[..., None]; rim = (1 - 0.10 * np.clip((r - 0.80) / 0.20, 0, 1) ** 2)[..., None]
        SH = np.array([0.93, 0.93, 0.955])             # measured white-head shade side (Rick x(.94,.92,.95) lavender -> neutral-cool, no purple)
        self.paint(m, SKIN[None, None, :] * (1 - t * (1 - SH)) * rim)
        self.outline(m)
        self.face(yaw, expr)

    def sph(self, u, v, yaw):
        R = 0.5; lon = u / R + yaw; lat = v / R
        return (R * math.cos(lat) * math.sin(lon), R * math.sin(lat))

    def fpoly(self, pts, yaw): return self.poly([self.sph(u, v, yaw) for u, v in pts])

    def face(self, yaw, e):
        ex, ey, erx, ery = 0.132, 0.04, 0.0455, 0.0535
        for s in (-1, 1):
            pts = [(s * ex + erx * math.cos(t), ey + ery * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 64, endpoint=False)]
            if e in ("smug", "tired"):                       # flat top lid cuts off the top 40-50%
                lid = ey - ery + 2 * ery * (0.42 if e == "smug" else 0.5)
                pts = [(u, max(v, lid)) for u, v in pts]
            self.paint(self.fpoly(pts, yaw), INK)
            # brows: short tapered brush arcs (they do the acting)
            bx, by, ang, sag = s * 0.137, -0.106, 0.0, 0.018
            if e == "worried": ang, by = s * 0.30, -0.118          # inner ends up
            if e == "smug": ang, by = (-0.12 if s < 0 else 0.10), (-0.10 if s < 0 else -0.145)  # one brow raised
            if e == "surprised": by, sag = -0.16, 0.03
            if e == "angry": ang, by = -s * 0.38, -0.09
            c = []
            for t in np.linspace(-1, 1, 30):
                u, v = 0.07 * t, -sag * (1 - t * t)
                c.append((bx + u * math.cos(ang) - v * math.sin(ang), by + u * math.sin(ang) + v * math.cos(ang)))
            proj = [self.sph(u, v, yaw) for u, v in c]
            self.paint(self.stroke(proj, 0.034, taper=True), INK)
        # mouth
        if e == "surprised":
            self.paint(self.fpoly([(0.028 * math.cos(t), 0.215 + 0.034 * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 48)], yaw), INK)
        else:
            wd, sg = {"smug": (0.075, 0.022), "neutral": (0.06, 0.018), "worried": (0.042, -0.006)}.get(e, (0.06, 0.018))
            c = [(wd * t, 0.205 + sg * (1 - t * t)) for t in np.linspace(-1, 1, 28)]
            if e == "smug": c = [(u + 0.012, v - 0.012 * u / wd) for u, v in c]   # lopsided smirk
            self.paint(self.stroke([self.sph(u, v, yaw) for u, v in c], 0.024), INK)

    # ---- limbs ----
    def limb(self, pts, w=LIMB): self.paint(self.stroke(pts, w), INK)

    def hand(self, x, y):
        self.paint(self.ell(x, y, HAND / 2, HAND / 2, 40), INK)
        self.paint(self.ell(x - HAND * 0.17, y - HAND * 0.17, 0.011, 0.011, 20), (236, 226, 208))  # one tiny pale dot

    def leg_pair(self, spread=1.0):
        for s in (-1, 1):
            hip, mid, ank = (s * 0.20, 1.25), (s * 0.235 * spread, 1.95), (s * 0.195, 2.57)
            pts = bez3(hip, (s * 0.24 * spread, 1.6), (s * 0.235 * spread, 2.3), ank, 30) + bez2(ank, (s * 0.205, 2.635), (s * 0.34, 2.635), 12)[1:]
            self.limb(pts)

    def done(self):
        img = np.dstack([np.clip(self.rgb, 0, 255), np.clip(self.a, 0, 1) * 255]).astype(np.uint8)
        im = Image.fromarray(img, "RGBA")
        # premultiplied downsample for clean edges
        pm = np.asarray(im).astype(float); pm[..., :3] *= pm[..., 3:4] / 255
        small = Image.fromarray(pm.astype(np.uint8), "RGBA").resize((self.W // SS, self.H // SS), Image.LANCZOS)
        s = np.asarray(small).astype(float); a = s[..., 3:4] / 255
        s[..., :3] = np.where(a > 0.002, s[..., :3] / np.maximum(a, 1e-3), 0)
        return np.clip(s, 0, 255).astype(np.uint8), self.left, self.top


def bez2(a, b, c, n):
    return [tuple((1 - t) ** 2 * np.array(a) + 2 * (1 - t) * t * np.array(b) + t * t * np.array(c)) for t in np.linspace(0, 1, n)]


def bez3(a, b, c, d, n):
    A, B, C, Dd = map(np.array, (a, b, c, d))
    return [tuple((1 - t) ** 3 * A + 3 * (1 - t) ** 2 * t * B + 3 * (1 - t) * t * t * C + t ** 3 * Dd) for t in np.linspace(0, 1, n)]


BODY = (0.0, 0.905, 0.38, 0.455)  # cx, cy, rx, ry (fill 0.76 x 0.91 D)


def body_base(c, col, rx=0.38, ry=0.455, cy=0.905):
    m = c.ell(0, cy, rx, ry); c.clothes(m, col, (0, cy, rx, ry)); return m


# ---------------- the cast ----------------
def carpenter(Dpx):
    c = Char(Dpx, right=1.45); f = 1   # faces right
    c.leg_pair()
    c.limb(bez2((-0.33, 0.78), (-0.52, 1.0), (-0.47, 1.3), 20)); c.hand(-0.47, 1.31)            # back arm hangs
    m = body_base(c, (86, 126, 172))                                                            # blue work shirt
    apron = m & c.poly([(-1, 0.98), (1, 0.98), (1, 2), (-1, 2)])
    c.grad(apron, (206, 170, 112)); c.paint(c.stroke([(-0.24, 0.98), (0.24, 0.98)], 0.018), INK)
    c.paint(c.stroke([(-0.24, 0.98), (-0.20, 0.55)], 0.03), (176, 140, 88)); c.paint(c.stroke([(0.24, 0.98), (0.20, 0.55)], 0.03), (150, 118, 72))
    pk = c.poly([(-0.12, 1.08), (0.12, 1.08), (0.11, 1.24), (-0.11, 1.24)]); c.paint(pk, (186, 150, 96)); c.outline(pk, 0.02)
    c.paint(c.stroke([(-0.06, 1.08), (-0.065, 0.98)], 0.022), (120, 120, 126))                  # pencil in the pocket
    c.outline(m)
    tri = c.poly([(-0.17, 0.47), (0.17, 0.47), (0.0, 0.66)]); c.paint(tri, (196, 64, 48)); c.outline(tri, 0.025)  # neckerchief
    # front arm holds a hammer up and out (clear of the cap)
    hx, hy = 0.66, 0.60
    c.limb(bez2((0.33, 0.76), (0.56, 0.84), (hx, hy), 20))
    top = np.array([hx + 0.11, hy - 0.40]); d = top - np.array([hx - 0.02, hy + 0.10]); d /= np.hypot(*d); q = np.array([d[1], -d[0]])
    handle = c.stroke([(hx - 0.02, hy + 0.10), tuple(top)], 0.05); c.paint(handle, (166, 112, 62)); c.outline(handle, 0.025)
    hd = [tuple(top + q * sx * 0.16 + d * sy * 0.055) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    head = c.poly(hd); c.grad(head, (150, 156, 164), 1.6); c.outline(head, 0.03)
    c.hand(hx, hy)
    c.head(0.30 * f, "smug")
    c.hair(150, 238, (58, 40, 28))
    # flat cap: puffy crown + bill to the facing side
    crown = c.poly(bez3((-0.53, -0.16), (-0.62, -0.72), (0.52, -0.80), (0.50, -0.20), 40) + [(0.50, -0.16)])
    c.clothes(crown, (128, 110, 90), (-0.02, -0.42, 0.55, 0.30)); c.outline(crown)
    bill = c.ell(0.62, -0.17, 0.24, 0.065); c.clothes(bill, (112, 96, 78)); c.outline(bill)
    c.paint(c.ell(0.0, -0.66, 0.035, 0.022), (90, 76, 62))
    return c.done()


def sarah(Dpx):
    c = Char(Dpx, left=-1.35); f = -1  # faces left
    c.leg_pair(0.85)
    # bonnet hood behind the head + veil
    veil = c.poly(bez3((0.18, -0.42), (0.62, -0.30), (0.78, 0.55), (0.56, 1.05), 30) + [(0.30, 0.95), (0.40, 0.2)])
    c.paint(veil, (48, 46, 44), 0.92); c.outline(veil)
    hood = c.ell(0.06, -0.10, 0.60, 0.58); c.clothes(hood, (58, 54, 50), (0.06, -0.10, 0.60, 0.58)); c.outline(hood)
    # long black dress: a taller bell
    m = c.poly(bez3((-0.30, 0.45), (-0.62, 0.70), (-0.62, 1.95), (-0.40, 2.05), 30) + bez3((0.40, 2.05), (0.62, 1.95), (0.62, 0.70), (0.30, 0.45), 30))
    c.clothes(m, (60, 56, 52), (0, 1.25, 0.58, 0.78)); c.outline(m)
    for i in range(5): c.paint(c.ell(-0.02, 0.70 + 0.14 * i, 0.018, 0.018, 20), (220, 210, 190))      # buttons
    col = c.poly([(-0.26, 0.47)] + [(0.26 * math.cos(t), 0.47 + 0.16 * math.sin(t)) for t in np.linspace(0, math.pi, 18)][::-1] + [(0.26, 0.47)])
    c.paint(col, (238, 232, 216)); c.outline(col, 0.025)
    c.paint(c.ell(0, 0.62, 0.045, 0.05), (206, 168, 72)); c.paint(c.ell(0, 0.62, 0.025, 0.03), (240, 226, 200))  # cameo brooch
    # hands clasped in front, worried
    c.limb(bez2((-0.36, 0.78), (-0.36, 1.12), (-0.06, 1.10), 20)); c.limb(bez2((0.36, 0.78), (0.34, 1.14), (0.04, 1.12), 20))
    c.hand(-0.05, 1.10); c.hand(0.04, 1.12)
    c.head(0.30 * f, "worried")
    # bonnet brim over the forehead + bow
    brim = c.poly(bez3((-0.50, -0.20), (-0.42, -0.62), (0.48, -0.66), (0.54, -0.18), 30) + bez3((0.46, -0.26), (0.36, -0.54), (-0.36, -0.52), (-0.42, -0.16), 30))
    c.clothes(brim, (52, 48, 45)); c.outline(brim)
    return c.done()


def foreman(Dpx):
    c = Char(Dpx, left=-1.45); f = -1
    c.leg_pair()
    c.limb(bez3((0.33, 0.78), (0.62, 0.95), (0.52, 1.18), (0.30, 1.08), 24)); c.hand(0.30, 1.07)          # hand on hip
    m = body_base(c, (78, 96, 82))                                                                       # frock coat
    vest = m & c.poly([(-0.17, 0.45), (0.17, 0.45), (0.13, 1.22), (-0.13, 1.22)])
    c.grad(vest, (204, 166, 64)); c.outline(vest, 0.025)
    c.paint(c.stroke(bez2((-0.13, 0.86), (0.0, 1.0), (0.13, 0.86), 20), 0.016), (232, 192, 82))            # watch chain
    for i in range(3): c.paint(c.ell(0.0, 0.78 + 0.13 * i, 0.016, 0.016, 16), (90, 64, 30))
    c.outline(m)
    col = c.poly([(-0.14, 0.44), (0.0, 0.58), (0.14, 0.44), (0.0, 0.47)]); c.paint(col, (244, 240, 230)); c.outline(col, 0.02)
    bow = c.poly([(-0.10, 0.50), (0.0, 0.545), (0.10, 0.50), (0.10, 0.60), (0.0, 0.555), (-0.10, 0.60)]); c.paint(bow, INK)
    c.limb(bez2((-0.33, 0.74), (-0.60, 0.68), (-0.80, 0.44), 20)); c.hand(-0.81, 0.43)                   # points at the house
    c.head(0.30 * f, "neutral")
    # top hat
    brim = c.ell(0.0, -0.33, 0.50, 0.075); crown = c.poly([(-0.29, -0.34), (-0.32, -1.02), (0.31, -1.02), (0.28, -0.34)])
    c.clothes(brim, (52, 48, 46)); c.outline(brim)
    c.clothes(crown, (54, 50, 48), (0, -0.68, 0.31, 0.34)); band = crown & c.poly([(-1, -0.50), (1, -0.50), (1, -0.38), (-1, -0.38)])
    c.paint(band, (150, 44, 38)); c.outline(crown)
    c.paint(c.ell(0.0, -1.02, 0.315, 0.05), (66, 62, 60)); c.outline(c.ell(0.0, -1.02, 0.315, 0.05), 0.03)
    return c.done()


def tourist(Dpx):
    c = Char(Dpx, right=1.45); f = 1
    c.leg_pair()
    c.limb(bez2((-0.33, 0.78), (-0.50, 1.02), (-0.40, 1.30), 20)); c.hand(-0.40, 1.31)
    m = body_base(c, (228, 104, 56))                                                                       # modern tee
    logo = c.poly([(-0.10, 0.90), (0.12, 0.90), (0.12, 1.02), (-0.10, 1.02)]); c.paint(logo, (250, 244, 232)); c.paint(c.stroke([(-0.06, 0.96), (0.08, 0.96)], 0.02), (228, 104, 56))
    for s in (-1, 1): c.paint(c.stroke(bez2((s * 0.22, 0.47), (s * 0.30, 0.8), (s * 0.30, 1.15), 16), 0.05), (44, 58, 88))   # backpack straps
    c.outline(m)
    cam = c.poly([(-0.16, 1.12), (0.10, 1.12), (0.10, 1.30), (-0.16, 1.30)]); c.grad(cam, (54, 54, 58), 1.5); c.outline(cam, 0.025)
    c.paint(c.ell(-0.03, 1.21, 0.06, 0.06), (120, 150, 180)); c.outline(c.ell(-0.03, 1.21, 0.06, 0.06), 0.022)
    c.paint(c.stroke(bez2((-0.14, 1.12), (-0.2, 0.7), (0.0, 0.5), 16), 0.02), (40, 40, 44))
    c.limb(bez2((0.33, 0.74), (0.66, 0.60), (0.72, 0.18), 20)); c.hand(0.72, 0.16)                         # waves at the house
    c.head(0.30 * f, "surprised")
    c.hair(155, 236, (128, 80, 42))
    crown = c.poly(bez3((-0.50, -0.14), (-0.56, -0.70), (0.50, -0.74), (0.48, -0.16), 40))
    c.clothes(crown, (48, 112, 184), (-0.01, -0.40, 0.52, 0.28)); c.outline(crown)
    bill = c.poly(bez3((0.30, -0.20), (0.55, -0.27), (0.86, -0.22), (0.86, -0.13), 20) + [(0.32, -0.10)]); c.clothes(bill, (40, 96, 160)); c.outline(bill)
    c.paint(c.ell(-0.01, -0.62, 0.04, 0.025), (40, 96, 160))
    return c.done()


# ---------------- compose ----------------
CAM = dict(pos=np.array([-897.8, 1.0, 44.0]), look=np.array([-899.2, 5.0, 0.0]), fov=26.0, W=1080, H=1920)


def project(X):
    C, T = CAM["pos"], CAM["look"]; fw = (T - C) / np.linalg.norm(T - C)
    r = np.cross(fw, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, fw)
    d = np.asarray(X, float) - C; zc = d @ fw; fpx = (CAM["H"] / 2) / math.tan(math.radians(CAM["fov"] / 2))
    return CAM["W"] / 2 + (d @ r) / zc * fpx, CAM["H"] / 2 - (d @ u) / zc * fpx, zc, fpx


def main(world, out, cast, seed=7):
    bg = np.asarray(Image.open(world).convert("RGB")).astype(float)
    H, W = bg.shape[:2]; HEIGHT = 1.55                       # metres, head top to soles (3.13 D)
    placed = []
    for fn, x, z in cast:
        sx, sy, zc, fpx = project((x, 0.0, z)); Dpx = HEIGHT * fpx / zc / 3.13
        img, left, top = fn(Dpx)
        placed.append(dict(z=float(zc), img=img, ox=float(sx + left * Dpx), oy=float(sy - (2.635 - top) * Dpx), D=float(Dpx), top=top))
    placed.sort(key=lambda p: -p["z"])                       # far first
    # world step: soft ground shadows (sun front-left -> shadows fall back-right = up-right on screen)
    sh = np.zeros((H, W))
    for p in placed:
        a = p["img"][..., 3]; h, w = a.shape; ho = int(h * 0.22); k = 1.1
        flat = Image.fromarray(a).transform((int(w + k * ho) + 2, ho), Image.AFFINE, (1, k, -k * ho, 0, h / ho, 0), Image.BILINEAR)
        fa = np.asarray(flat.filter(ImageFilter.GaussianBlur(p["D"] * 0.05))) / 255.0
        ox, oy = int(p["ox"]), int(p["oy"] + (2.635 - p["top"]) * p["D"] - ho)
        y0, x0, y1, x1 = max(0, oy), max(0, ox), min(H, oy + ho), min(W, ox + fa.shape[1])
        if y1 > y0 and x1 > x0: sh[y0:y1, x0:x1] = np.maximum(sh[y0:y1, x0:x1], fa[y0 - oy:y1 - oy, x0 - ox:x1 - ox])
    bg *= (1 - 0.30 * sh)[..., None]
    # step 7: characters on top, never blurred
    for p in placed:
        img = p["img"].astype(float); h, w = img.shape[:2]; ox, oy = int(round(p["ox"])), int(round(p["oy"]))
        y0, x0, y1, x1 = max(0, oy), max(0, ox), min(H, oy + h), min(W, ox + w)
        if y1 <= y0 or x1 <= x0: continue
        sub = img[y0 - oy:y1 - oy, x0 - ox:x1 - ox]; a = sub[..., 3:4] / 255.0
        bg[y0:y1, x0:x1] = bg[y0:y1, x0:x1] * (1 - a) + sub[..., :3] * a
    # step 8: particles (floating specks + a few soft bokeh discs) over everything
    rnd = random.Random(seed); lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for _ in range(80):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H * 0.85), rnd.uniform(1.0, 2.6)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 250, 232, int(rnd.uniform(70, 150))))
    for _ in range(9):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H * 0.7), rnd.uniform(10, 26)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 248, 225, int(rnd.uniform(14, 28))))
    lay = np.asarray(lay.filter(ImageFilter.GaussianBlur(0.8))).astype(float); la = lay[..., 3:4] / 255.0
    bg = bg * (1 - la) + lay[..., :3] * la
    # step 9: colour grade over everything, toward Rick's measured DAY grade (references/reports/grade.md):
    # deeper mids + full whites (S-curve), more mid/high saturation, warm-lifted blacks, soft vignette
    Image.fromarray(np.clip(grade(bg / 255.0) * 255, 0, 255).astype(np.uint8)).save(out)


def smoothstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


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
    main(sys.argv[1], sys.argv[2], [(carpenter, -899.115, 32.4), (sarah, -898.817, 25.8), (foreman, -897.88, 30.6), (tourist, -896.988, 28.2)])
