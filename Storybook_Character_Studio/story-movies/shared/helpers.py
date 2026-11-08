"""SVG作画ヘルパー。

ここで計算した座標は、静的なSVGマークアップとしてHTMLに埋め込まれる（再生時の計算はない）。
乱数は各シーンで固定シードの random.Random を使うため、何度実行しても同じ絵になる。
座標系はすべての関数で viewBox="0 0 1600 900"（16:9）を前提にしている。
"""
import math
import random


def n(v):
    v = round(float(v), 1)
    if v == int(v):
        return str(int(v))
    return f"{v:.1f}"


def poly_d(pts, close=True):
    d = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts)
    return d + ("Z" if close else "")


def subdivide(keys, rng, depth=3, rough=0.2, xj=0.08):
    """キーポイント間を中点変位で細かく割り、自然な稜線を作る。"""
    out = [keys[0]]
    for a, b in zip(keys, keys[1:]):
        seg = [a, b]
        r = rough
        for _ in range(depth):
            new = [seg[0]]
            for p, q in zip(seg, seg[1:]):
                L = abs(q[0] - p[0]) + abs(q[1] - p[1]) * 0.3
                mx = (p[0] + q[0]) / 2 + rng.uniform(-xj, xj) * (q[0] - p[0])
                my = (p[1] + q[1]) / 2 + rng.uniform(-1, 1) * L * r
                new += [(mx, my), q]
            seg = new
            r *= 0.55
        out += seg[1:]
    return out


def mountain(keys, base, rng, depth=3, rough=0.18):
    ridge = subdivide(keys, rng, depth, rough)
    pts = [(ridge[0][0], base)] + ridge + [(ridge[-1][0], base)]
    return poly_d(pts), poly_d(ridge, close=False)


def smooth_d(pts, closed=False, t=1 / 6):
    """Catmull-Rom → 3次ベジェ。"""
    if closed:
        P = [pts[-1]] + pts + [pts[0], pts[1]]
    else:
        P = [pts[0]] + pts + [pts[-1]]
    d = f"M{n(pts[0][0])},{n(pts[0][1])}"
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t)
        c2 = (p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t)
        d += f" C{n(c1[0])},{n(c1[1])} {n(c2[0])},{n(c2[1])} {n(p2[0])},{n(p2[1])}"
    if closed:
        d += "Z"
    return d


def pill(x, y, w, h):
    r = h / 2
    return (f"M{n(x + r)},{n(y)}h{n(w - 2 * r)}a{n(r)},{n(r)} 0 0 1 0,{n(h)}"
            f"h{n(-(w - 2 * r))}a{n(r)},{n(r)} 0 0 1 0,{n(-h)}Z")


def kasumi(x, y, w, h):
    """すやり霞：段差のある横長の霞帯。"""
    return " ".join([
        pill(x, y, w, h),
        pill(x + w * 0.1, y - h * 0.62, w * 0.42, h * 0.78),
        pill(x + w * 0.52, y + h * 0.6, w * 0.4, h * 0.72),
    ])


def cloud(x, y, w, h, lobes, rng, zig=0, flat=0.12):
    """上辺が波打つ雲／松の葉群。zig>0 で下辺をギザギザ（松葉）にする。"""
    ws = [rng.uniform(0.55, 1.5) for _ in range(lobes)]
    tot = sum(ws)
    xs = [x]
    for wi in ws:
        xs.append(xs[-1] + w * wi / tot)
    pts = []
    for i, xx in enumerate(xs):
        u = (xx - x) / w
        prof = math.sin(math.pi * u) ** 0.7
        if i in (0, lobes):
            pts.append((xx, y - h * 0.08))
        else:
            pts.append((xx, y - h * (0.16 + 0.84 * prof) * rng.uniform(0.68, 1.05)))
    d = f"M{n(pts[0][0])},{n(pts[0][1])}"
    for p, q in zip(pts, pts[1:]):
        c = math.dist(p, q)
        s = c * rng.uniform(0.3, 0.5) if not zig else c * 0.48
        r = (c * c / 4 + s * s) / (2 * s)
        d += f" A{n(r)},{n(r)} 0 0 1 {n(q[0])},{n(q[1])}"
    if zig:
        k = max(2, int(w / zig))
        for j in range(1, k + 1):
            xx = x + w - w * j / k
            d += f" L{n(xx + w / k / 2)},{n(y + h * 0.2 * rng.uniform(0.4, 1))} L{n(xx)},{n(y)}"
    else:
        d += f" Q{n(x + w / 2)},{n(y + h * flat)} {n(pts[0][0])},{n(pts[0][1])}"
    return d + "Z"


def flame(w, h, lean=0.0):
    """根元(0,0)から上へ伸びる炎の舌。"""
    t = lean * h
    return (f"M{n(-w / 2)},0 C{n(-w * .62)},{n(-h * .36)} {n(t - w * .4)},{n(-h * .6)} {n(t)},{n(-h)} "
            f"C{n(t + w * .06)},{n(-h * .74)} {n(w * .64)},{n(-h * .44)} {n(w / 2)},0 "
            f"Q0,{n(h * .1)} {n(-w / 2)},0Z")


def spiral(cx, cy, r, turns=1.4, steps=22, start=0.0, cw=True):
    pts = []
    for i in range(steps + 1):
        u = i / steps
        a = start + (1 if cw else -1) * u * turns * 2 * math.pi
        rr = r * (1 - u * 0.85)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return smooth_d(pts)


def lobes_union(circles, stroke, sw, fill, extra=""):
    """円の集合をアウトライン付きの一塊として描く（先に太線、後で塗り）。"""
    s = "".join(f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(r)}"/>' for x, y, r in circles)
    return (f'<g fill="none" stroke="{stroke}" stroke-width="{sw}">{s}</g>'
            f'<g fill="{fill}" {extra}>{s}</g>')


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return (u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
            u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1])


def grass(rng, x0, x1, base_fn, step, hmin, hmax, lean=-8, width=4.5):
    d = ""
    x = x0
    while x < x1:
        b = base_fn(x)
        h = rng.uniform(hmin, hmax)
        tip = x + lean + rng.uniform(-6, 6)
        d += (f"M{n(x - width / 2)},{n(b + 2)} Q{n(x + (tip - x) * 0.3)},{n(b - h * 0.6)} {n(tip)},{n(b - h)} "
              f"Q{n(x + (tip - x) * 0.2 + width * 0.6)},{n(b - h * 0.5)} {n(x + width / 2)},{n(b + 2)}Z ")
        x += step * rng.uniform(0.6, 1.4)
    return d


SPARK = "M0,-10C1.2,-2.4 2.4,-1.2 10,0C2.4,1.2 1.2,2.4 0,10C-1.2,2.4 -2.4,1.2 -10,0C-2.4,-1.2 -1.2,-2.4 0,-10Z"
