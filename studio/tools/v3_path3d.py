"""Camera path + cast layout for the v3 3D test clip (Rick's moves: orbit -44..+55 deg at 17.5 deg, whip with a hard stop,
rest, 1.9x push-in outCubic, hard cut + push-in). Writes Remotion props {look3: {path, lock, noCast}}.
usage: python3 v3_path3d.py props.json [probe]"""
import json, math, sys
import numpy as np
N, H = 240, 1.55
CAST = {"carpenter": (-899.9, 10.0, 30.0), "foreman": (-898.7, 10.0, -30.0),     # x, z, facing (deg, 0 = toward +z)
        "sarah": (-903.5, 12.5, 70.0), "tourist": (-897.6, 12.6, 25.0)}
O = np.array([-899.3, 0.95, 10.0]); R, EL = 8.0, math.radians(17.5)
def smooth(t): t = min(1.0, max(0.0, t)); return t * t * (3 - 2 * t)
def ocube(t): t = min(1.0, max(0.0, t)); return 1 - (1 - t) ** 3
def orbit(az): a = math.radians(az); return O + np.array([R * math.sin(a), R * math.tan(EL), R * math.cos(a)])
def chest(name, y=0.95): x, z, _ = CAST[name]; return np.array([x, y, z])
def shake(f, amp):
    t = f / 30; return amp * np.array([math.sin(t * 4.59) * .5 + math.sin(t * 8.61) * .3 + math.sin(t * 13.7) * .2,
                                       math.sin(t * 3.71 + 1.3) * .5 + math.sin(t * 9.43 + .4) * .3, 0.0])
E = orbit(55.0); S_LOOK = chest("sarah", 1.0); T_LOOK = chest("tourist", 1.12)
def cam(f):
    """pos, look, focus point, blur"""
    if f < 90:                                           # A: ORBIT -44 -> +55 deg (~99 deg arc), elevation 17.5 deg
        p = orbit(-44 + 99 * smooth(f / 89)); l = O.copy(); fo = O; amp = 0.02
    elif f < 97:                                         # B1: WHIP pan to Sarah, accelerating, stops dead at f 97
        k = ((f - 89) / 8) ** 2; p = E; l = O + (S_LOOK - O) * k; fo = S_LOOK; amp = 0.0
    elif f < 107: p, l, fo, amp = E, S_LOOK, S_LOOK, 0.0      # B2: rest (the camera's rare still frames)
    elif f < 165:                                        # B3: PUSH-IN 1.9x closer, outCubic
        d0 = np.linalg.norm(E - S_LOOK); d = d0 + (d0 / 1.9 - d0) * ocube((f - 107) / 57)
        p = S_LOOK + (E - S_LOOK) / d0 * d; l = S_LOOK; fo = S_LOOK; amp = 0.015
    else:                                                # C: hard CUT to the tourist, slow push-in
        p0 = T_LOOK + np.array([1.0, 0.30, 4.2]); d0 = np.linalg.norm(p0 - T_LOOK); d = d0 + (3.5 - d0) * ocube((f - 165) / 74)
        p = T_LOOK + (p0 - T_LOOK) / d0 * d; l = T_LOOK; fo = T_LOOK; amp = 0.012
    return p + shake(f, amp), l + shake(f, amp) * 0.6, fo, 6.0
def path(frames):
    out = []
    for f in frames:
        p, l, fo, b = cam(f); out.append([round(float(v), 4) for v in (*p, *l, 26.0, *fo, b)])
    return out
if __name__ == "__main__":
    frames = [0, 45, 89, 106, 200] if len(sys.argv) > 2 else list(range(N))
    props = {"post": {"dpr": 0.6667}, "captions": False, "look3": {"lock": 30, "noCast": True, "path": path(frames)}}
    json.dump(props, open(sys.argv[1], "w")); print(len(frames), "camera keys written")
