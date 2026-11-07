"""v3 3D test clip: real engine world frames (camera path from v3_path3d.py) + v3 characters placed in 3D on top.

Shows: ORBIT ~99 deg at 17.5 deg elevation with the faces flipping sides in one frame as the camera crosses each
character's front; WHIP that stops dead + rest; 1.9x PUSH-IN outCubic; hard CUT + push-in. Moves snap 60-70% in 4-5
frames then freeze; the face changes one frame before the body; mouths change every 2 frames; no blinks while talking.

usage: python3 v3_clip3d.py world_frames_dir out_frames_dir
"""
import math, os, sys, glob, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import v3_lookdev as L
import v3_clip as C
from v3_clip import EYES, BROWS, MOUTHS, EXPR, mv, arm, hammer, INK, bez2, bez3, arc
from v3_lookdev import BTOP, BH, BW, SOLE, flat_cap, ball_cap, top_hat
import v3_path3d as PATH

OW, OH, FOV, HCH = 720, 1280, 26.0, 1.55
FPX = (OH / 2) / math.tan(math.radians(FOV / 2))
EX, EY, S = C.EX, C.EY, C.S
EYES["happy"] = lambda c, y: [c.eye_happy(s * EX, EY - 0.01, y) for s in S]
EYES["ring_side"] = lambda c, y: [c.eye_ring(s * 0.115, EY, y, look=(-1.0, 0.1), pr=0.03) for s in S]
BROWS["raised"] = lambda c, y: [c.brow(s * 0.13, EY - 0.16, s * 0.12, 0.03, y) for s in S]
BROWS["none"] = lambda c, y: None
MOUTHS["laugh_a"] = lambda c, y: c.mouth_teeth(0.30, 0.16, 0.185, y, shape="D", n=6, interior=True)
MOUTHS["laugh_b"] = lambda c, y: c.mouth_teeth(0.26, 0.11, 0.19, y, shape="D", n=5, interior=True)
MOUTHS["grin"] = lambda c, y: c.mouth_teeth(0.34, 0.075, 0.205, y, lop=-0.02, shape="crescent", n=7)
EXPR.update({"laugh": ("happy", "raised", "laugh_a", "blush"), "shifty": ("ring_side", "none", "grin", None)})


class Rig3(C.Rig):
    def face(self, yaw, e):
        super().face(yaw, e)
        if EXPR[e][3] == "blush": self.fx_blush(yaw, EY)


def rig(Dpx, P):
    c = Rig3(Dpx); c.pose = P; return c


# same designs as v3_clip, with the head yaw taken from the pose (P["yaw"], in the sprite's native facing)
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
    c.head(P["yaw"], P["e"]); c.hair(148, 236, (58, 40, 28)); flat_cap(c, (128, 110, 90), 1)
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
    c.head(P["yaw"], P["e"]); c.hair(-34, 22, (150, 148, 144)); top_hat(c)
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
    c.head(P["yaw"], P["e"])
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
    c.head(P["yaw"], P["e"]); c.hair(152, 234, (128, 80, 42)); ball_cap(c, (48, 112, 184), 1)
    return c.done()


TALK = C.TALK


def pose(name, f):
    if name == "carpenter":
        P = {"e": "smug", "hb": (-0.44, 1.31), "m": "talk_c"}
        if 6 <= f < 42: P["m"] = TALK[(f - 6) // 2 % len(TALK)]          # mouth on twos, no blinks while talking
        if f >= 50: P["e"] = "scheming"; P["m"] = None                     # face first ...
        P["hf"] = mv(f, 51, (0.42, 1.02), (0.70, 0.26)); P["ham"] = mv(f, 51, 0.55, -1.25)   # ... body next frame
        return P, mv(f, 51, 0.0, -3.0)
    if name == "foreman":
        P = {"e": "stern" if f >= 62 else "neutral", "eyes": "closed" if f in (20, 21) else None}
        P["hf"] = mv(f, 63, (-0.40, 1.22), (-0.82, 0.40)); return P, mv(f, 63, 0.0, -2.5)
    if name == "sarah":
        P = {"e": "panic" if f >= 140 else "startled" if f >= 108 else "worried"}
        h1 = mv(f, 109, (-0.05, 1.10), (-0.48, 0.30)); h2 = mv(f, 109, (0.04, 1.12), (0.48, 0.28))
        P["hl"] = mv(f, 141, h1, (-0.58, 0.02)) if f > 141 else h1; P["hr"] = mv(f, 141, h2, (0.58, 0.0)) if f > 141 else h2
        return P, (mv(f, 141, 4.0, 6.0) if f > 141 else mv(f, 109, 0.0, 4.0))
    P = {"e": "shifty" if f >= 216 else "laugh" if f >= 176 else "startled", "hb": (-0.38, 1.31)}
    if 177 <= f < 216: P["m"] = "laugh_a" if (f - 177) // 2 % 2 == 0 else "laugh_b"
    P["hf"] = mv(f, 177, (0.70, 0.14), (0.62, -0.22)) if f < 217 else mv(f, 217, (0.62, -0.22), (0.40, 0.95))
    return P, (mv(f, 217, -3.0, 5.0) if f >= 217 else mv(f, 177, 0.0, -3.0))


NATIVE = {"carpenter": 1, "tourist": 1, "foreman": -1, "sarah": -1}
FN = {"carpenter": carpenter, "foreman": foreman, "sarah": sarah, "tourist": tourist}


def look_at(p, l):
    fw = l - p; fw /= np.linalg.norm(fw); r = np.cross(fw, [0, 1, 0]); r /= np.linalg.norm(r); u = np.cross(r, fw); return fw, r, u


def proj(X, p, fw, r, u):
    d = np.asarray(X, float) - p; z = d @ fw
    return OW / 2 + (d @ r) / z * FPX, OH / 2 - (d @ u) / z * FPX, z


def face_yaw(name, cam_p):
    x, z, facing = PATH.CAST[name]
    rel = math.radians(((math.degrees(math.atan2(cam_p[0] - x, cam_p[2] - z)) - facing + 180) % 360) - 180)
    yaw = -math.copysign(max(0.26, abs(rel)), rel if rel != 0 else 1.0)   # always a 3/4 view; crossing the front flips it
    return max(-1.20, min(1.20, yaw))


def main(wdir, outdir):
    os.makedirs(outdir, exist_ok=True)
    wfiles = sorted(glob.glob(f"{wdir}/element-*.jpeg"), key=lambda s: int(s.rsplit("-", 1)[1].split(".")[0]))
    N = len(wfiles); cache = {}; rnd = random.Random(4)
    parts = [(rnd.uniform(0, OW), rnd.uniform(0, OH * 0.9), rnd.uniform(0.7, 1.9), rnd.uniform(-0.25, 0.25), rnd.uniform(-0.5, -0.1), rnd.uniform(60, 150)) for _ in range(70)]
    # pre-pass: biggest on-screen size per character -> sprite resolution
    dmax = {n: 1.0 for n in FN}
    for f in range(N):
        p, l, _, _ = PATH.cam(f); fw, r, u = look_at(p, l)
        for n, (x, z, _) in PATH.CAST.items():
            sx, sy, zc = proj((x, 0, z), p, fw, r, u)
            if zc > 0.5 and -OW < sx < 2 * OW: dmax[n] = max(dmax[n], HCH * FPX / zc / (SOLE + 0.5))
    for f in range(N):
        bg = np.asarray(Image.open(wfiles[f]).convert("RGB").resize((OW, OH), Image.LANCZOS)).astype(float)
        p, l, _, _ = PATH.cam(f); fw, r, u = look_at(p, l); items = []
        for n, (x, z, _) in PATH.CAST.items():
            sx, sy, zc = proj((x, 0, z), p, fw, r, u)
            if zc < 0.5: continue
            D = HCH * FPX / zc / (SOLE + 0.5)
            if sx + 1.6 * D < 0 or sx - 1.6 * D > OW or sy - 3.6 * D > OH: continue
            P, lean = pose(n, f); yaw = round(face_yaw(n, p) / 0.04) * 0.04
            mirror = (1 if yaw > 0 else -1) != NATIVE[n]; P = dict(P, yaw=round(-yaw if mirror else yaw, 3))
            key = (n, repr(sorted(P.items())))
            if key not in cache: cache[key] = FN[n](dmax[n], P)
            items.append((zc, n, cache[key], D, sx, sy, -lean if mirror else lean, mirror, (x, z)))
        sh = Image.new("L", (OW, OH), 0); dr = ImageDraw.Draw(sh)          # soft contact shadows, in perspective
        for zc, n, _, D, sx, sy, _, _, (x, z) in items:
            pts = [proj((x + 0.45 * math.cos(t), 0.0, z + 0.32 * math.sin(t)), p, fw, r, u)[:2] for t in np.linspace(0, 2 * math.pi, 24)]
            dr.polygon(pts, fill=140)
        sh = np.asarray(sh.filter(ImageFilter.GaussianBlur(6))) / 255.0; bg *= (1 - 0.34 * sh)[..., None]
        for zc, n, (img, left, top), D, sx, sy, lean, mirror, _ in sorted(items, key=lambda t: -t[0]):   # far first; on top, never blurred
            im = Image.fromarray(img, "RGBA"); k = D / dmax[n]
            im = im.resize((max(1, int(im.size[0] * k)), max(1, int(im.size[1] * k))), Image.LANCZOS)
            pvx, pvy = -left * D, (SOLE - top) * D
            if mirror: im = im.transpose(Image.FLIP_LEFT_RIGHT); pvx = im.size[0] - pvx
            if lean: im = im.rotate(-lean, resample=Image.BICUBIC, center=(pvx, pvy))
            ox, oy = int(round(sx - pvx)), int(round(sy - pvy)); nw, nh = im.size
            a = np.asarray(im).astype(float); ys0, xs0 = max(0, -oy), max(0, -ox); ys1, xs1 = min(nh, OH - oy), min(nw, OW - ox)
            if ys1 <= ys0 or xs1 <= xs0: continue
            sub = a[ys0:ys1, xs0:xs1]; al = sub[..., 3:4] / 255.0
            reg = bg[oy + ys0:oy + ys1, ox + xs0:ox + xs1]; bg[oy + ys0:oy + ys1, ox + xs0:ox + xs1] = reg * (1 - al) + sub[..., :3] * al
        pl = Image.new("RGBA", (OW, OH), (0, 0, 0, 0)); d = ImageDraw.Draw(pl)
        for x, y, rr, vx, vy, al in parts:
            xx, yy = (x + vx * f) % OW, (y + vy * f) % OH; d.ellipse([xx - rr, yy - rr, xx + rr, yy + rr], fill=(255, 250, 232, int(al)))
        pl = np.asarray(pl.filter(ImageFilter.GaussianBlur(0.6))).astype(float); pa = pl[..., 3:4] / 255.0
        bg = bg * (1 - pa) + pl[..., :3] * pa
        Image.fromarray(np.clip(L.grade(bg / 255.0) * 255, 0, 255).astype(np.uint8)).save(f"{outdir}/f{f:04d}.png")
        if f % 30 == 0: print("frame", f, "sprites", len(cache), flush=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
