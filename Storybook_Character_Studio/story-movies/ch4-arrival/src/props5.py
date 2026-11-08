"""火山島編の始まり「海を越えて」の小道具：火山島・噴煙・灰・焼けた船着き場・空の樽。

船・帆・乗組員の並べ方は第3章の結末（../../ch3-departure/src/props.py）のものを使う（同じ船で旅を続けるため）。
座標は各関数の説明のとおり。id には呼び出し側の接頭辞 p を付ける。
"""
import math

from helpers import n, mountain

INK = "#3b2a1c"          # 木・建物の輪郭（第3章と同じ）
BASALT = "#2f2b2e"       # 火山島の黒い岩
BASALT_LIGHT = "#4b4549"
CHAR = "#2b211c"         # 焼けた木
CHAR_LIGHT = "#5a4235"
EMBER = "#f08a3c"
SAND = "#3c3836"         # 黒砂
WOOD = "#c99c5f"
WOOD_DARK = "#7c5730"


# ---------------------------------------------------------------------------
# 火山島（裾の中央 (x, base)。頂の火口がいちばん上）
# ---------------------------------------------------------------------------
def volcano_defs(p):
    return (f'<radialGradient id="{p}crater" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb04a" stop-opacity=".95"/>'
            '<stop offset=".45" stop-color="#e2502a" stop-opacity=".55"/><stop offset="1" stop-color="#b8321e" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="{p}rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BASALT_LIGHT}"/>'
            f'<stop offset="1" stop-color="{BASALT}"/></linearGradient>')


def volcano(p, R, x, base, w, h, ridge_color="#6a6266", lava=True):
    """黒い火山島。左右に低い尾根、中央に頂の欠けた円錐。(defs は volcano_defs)。返り値はマークアップ。"""
    top = base - h
    rim = w * .07
    keys = [(x - w / 2, base), (x - w * .36, base - h * .22), (x - w * .2, base - h * .38), (x - rim * 1.6, top + h * .06),
            (x - rim, top), (x + rim, top + h * .02), (x + rim * 1.7, top + h * .07), (x + w * .22, base - h * .42),
            (x + w * .37, base - h * .2), (x + w / 2, base)]
    body, ridge = mountain(keys, base, R, depth=3, rough=.08)
    o = [f'<path d="{body}" fill="url(#{p}rock)"/>',
         f'<path d="{ridge}" fill="none" stroke="{ridge_color}" stroke-width="3" stroke-linejoin="round" opacity=".7"/>']
    # 斜面の溝と、明るい岩肌（頂の近くだけ。短く、ばらばらに）
    for i in range(9):
        a = R.uniform(-1, 1)
        sx = x + a * rim * 1.6
        sy = top + h * R.uniform(.04, .12)
        ex = sx + a * w * R.uniform(.05, .12)
        ey = sy + h * R.uniform(.22, .42)
        o.append(f'<path d="M{n(sx)},{n(sy)} Q{n((sx + ex) / 2 + R.uniform(-8, 8))},{n((sy + ey) / 2)} {n(ex)},{n(ey)}" '
                 f'fill="none" stroke="#1d1a1d" stroke-width="{n(R.uniform(1.6, 2.8))}" stroke-linecap="round" opacity=".45"/>')
    for _ in range(6):
        cx, cy = x + R.uniform(-.3, .3) * w, base - h * R.uniform(.12, .4)
        rw, rh = w * R.uniform(.03, .07), h * R.uniform(.02, .05)
        o.append(f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(rw)}" ry="{n(rh)}" fill="{BASALT_LIGHT}" opacity=".28"/>')
    # 裾の暗い帯（古い溶岩の原）
    o.append(f'<path d="M{n(x - w / 2)},{n(base)} Q{n(x - w * .2)},{n(base - h * .12)} {n(x)},{n(base - h * .08)} '
             f'Q{n(x + w * .25)},{n(base - h * .14)} {n(x + w / 2)},{n(base)}Z" fill="#221e21" opacity=".55"/>')
    if lava:
        o.append(f'<path d="M{n(x + rim * .4)},{n(top + 4)} Q{n(x + w * .05)},{n(top + h * .35)} {n(x + w * .02)},{n(top + h * .55)}" '
                 f'fill="none" stroke="#e2572a" stroke-width="3" stroke-linecap="round" opacity=".75"/>')
    return "".join(o)


def crater_glow(p, cls, x, top, r):
    return f'<ellipse class="{cls}" cx="{n(x)}" cy="{n(top + 4)}" rx="{n(r * 1.4)}" ry="{n(r * .8)}" fill="url(#{p}crater)"/>'


def plume(R, cls, x, top, h, w, dark="#55504f", light="#a8a19c", lean=-.35, puffs=16):
    """噴煙の柱：火口 (x, top) から上へ太くなりながら、lean の向きへ流れる丸の重なり。
    丸ごとに cls と animation-delay を付け、場面のCSSで少しずつ膨らませる。"""
    o = []
    for i in range(puffs):
        t = i / (puffs - 1)
        cx = x + lean * h * t ** 1.4 + R.uniform(-.1, .1) * w * t
        cy = top - h * t
        r = (w * .18) + w * .5 * t ** .9 + R.uniform(-.05, .05) * w
        c = _mix(dark, light, min(1, t * 1.3))
        o.append(f'<circle class="{cls}" cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{c}" opacity="{n(.92 - t * .35)}" '
                 f'style="animation-delay:-{n(R.uniform(0, 3))}s"/>')
    return "".join(o)


def ash(R, cls, x0, x1, y0, y1, count, color="#d8d2cc", size=(1.6, 3.4)):
    """舞う灰：小さな粒。--dx/--dy の向きへ流れ、場面のCSSで動かす（.mv を付けるのは呼び出し側のクラス）。"""
    o = []
    for _ in range(count):
        x, y = R.uniform(x0, x1), R.uniform(y0, y1)
        r = R.uniform(*size)
        o.append(f'<ellipse class="{cls}" cx="{n(x)}" cy="{n(y)}" rx="{n(r)}" ry="{n(r * .6)}" fill="{color}" '
                 f'style="--dx:{n(R.uniform(-260, -120))}px;--dy:{n(R.uniform(60, 160))}px;animation-delay:-{n(R.uniform(0, 4))}s;'
                 f'animation-duration:{n(R.uniform(3.2, 5.4))}s"/>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 焼けた船着き場（桟橋の付け根 (x0, y0) から沖の先端 (x1, y1) へ。手前ほど太い）
# ---------------------------------------------------------------------------
def burnt_pier(R, x0, y0, x1, y1, w0, w1, posts=7, gaps=(2, 4), embers_cls=""):
    """板の抜けた、焦げた桟橋。gaps は板が焼け落ちた区間（手前から数えた番号）。"""
    o = []
    seg = []
    for i in range(posts + 1):
        t = i / posts
        seg.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w0 + (w1 - w0) * t))
    # 両脇の焦げた桁（板が焼け落ちた所も、一続きの桟橋に見えるように）
    for side in (-1, 1):
        o.append(f'<path d="M{n(x0 + side * w0 * .47)},{n(y0 + 6)} L{n(x1 + side * w1 * .47)},{n(y1 + 6 * w1 / w0)}" '
                 f'stroke="#140e0b" stroke-width="{n(9 * (w0 + w1) / (2 * w0))}" stroke-linecap="round"/>'
                 f'<path d="M{n(x0 + side * w0 * .47)},{n(y0 + 6)} L{n(x1 + side * w1 * .47)},{n(y1 + 6 * w1 / w0)}" '
                 f'stroke="{CHAR}" stroke-width="{n(6 * (w0 + w1) / (2 * w0))}" stroke-linecap="round"/>')
    # 杭（焦げて長さがまちまち）
    for i, (x, y, w) in enumerate(seg):
        k = w / w0
        for side in (-1, 1):
            px = x + side * w * .46
            ph = (70 + R.uniform(-10, 10)) * k
            broken = R.random() < .35
            top = y - (ph * (.55 if broken else 1)) + 14 * k
            o.append(f'<path d="M{n(px - 7 * k)},{n(y + 40 * k)} L{n(px - 6 * k)},{n(top)} L{n(px + (3 if broken else 6) * k)},{n(top - (6 if broken else 0) * k)} '
                     f'L{n(px + 7 * k)},{n(y + 40 * k)}Z" fill="{CHAR}" stroke="#140e0b" stroke-width="{n(2.4 * k)}"/>')
            if broken:
                o.append(f'<circle class="{embers_cls}" cx="{n(px)}" cy="{n(top + 3 * k)}" r="{n(3 * k)}" fill="{EMBER}" '
                         f'style="animation-delay:-{n(R.uniform(0, 2))}s"/>')
    # 板（焼け落ちた区間は欠けた端だけ）
    for i, ((xa, ya, wa), (xb, yb, wb)) in enumerate(zip(seg, seg[1:])):
        if i in gaps:
            for j in (0, 1):
                xx, yy, ww = (xa, ya, wa) if j == 0 else (xb, yb, wb)
                k = ww / w0
                o.append(f'<path d="M{n(xx - ww / 2)},{n(yy)} L{n(xx + ww / 2)},{n(yy)} L{n(xx + ww * .2)},{n(yy + (12 if j == 0 else -12) * k)} '
                         f'L{n(xx - ww * .3)},{n(yy + (9 if j == 0 else -9) * k)}Z" fill="{CHAR_LIGHT}" stroke="#140e0b" stroke-width="{n(2 * k)}"/>')
            continue
        o.append(f'<path d="M{n(xa - wa / 2)},{n(ya)} L{n(xa + wa / 2)},{n(ya)} L{n(xb + wb / 2)},{n(yb)} L{n(xb - wb / 2)},{n(yb)}Z" '
                 f'fill="#6b5240" stroke="#1d1410" stroke-width="{n(2.4 * wa / w0)}"/>')
        for q in range(1, 4):
            t = q / 4
            o.append(f'<path d="M{n(xa + (xb - xa) * t - (wa + (wb - wa) * t) / 2)},{n(ya + (yb - ya) * t)} '
                     f'L{n(xa + (xb - xa) * t + (wa + (wb - wa) * t) / 2)},{n(ya + (yb - ya) * t)}" stroke="#2a1d16" stroke-width="{n(1.6 * wa / w0)}" opacity=".7"/>')
        # 焦げの斑
        for _ in range(3):
            t = R.uniform(.1, .9)
            cx = xa + (xb - xa) * t + R.uniform(-.3, .3) * wa
            cy = ya + (yb - ya) * t
            o.append(f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(wa * R.uniform(.08, .16))}" ry="{n(4 * wa / w0)}" fill="{CHAR}" opacity=".75"/>')
    return "".join(o)


def burnt_shed(x, y, s=1.0, ember_cls=""):
    """焼け落ちた小屋：黒い柱と、崩れた屋根の梁（床の中央 (x, y)）。"""
    def L(x1, y1, x2, y2, w=9):
        return (f'<path d="M{n(x + x1 * s)},{n(y + y1 * s)} L{n(x + x2 * s)},{n(y + y2 * s)}" stroke="#140e0b" stroke-width="{n((w + 4) * s)}" stroke-linecap="round"/>'
                f'<path d="M{n(x + x1 * s)},{n(y + y1 * s)} L{n(x + x2 * s)},{n(y + y2 * s)}" stroke="{CHAR}" stroke-width="{n(w * s)}" stroke-linecap="round"/>')
    o = [f'<ellipse cx="{n(x)}" cy="{n(y + 4 * s)}" rx="{n(96 * s)}" ry="{n(12 * s)}" fill="#1d1816" opacity=".7"/>']
    o.append(L(-80, 0, -78, -92) + L(80, 0, 76, -60) + L(-10, 0, -12, -118))
    o.append(L(-90, -84, 20, -122, 8) + L(-12, -118, 60, -40, 7) + L(-60, -20, 70, -6, 7))
    o.append(f'<path d="M{n(x - 70 * s)},{n(y)} L{n(x - 30 * s)},{n(y - 22 * s)} L{n(x + 10 * s)},{n(y - 8 * s)} L{n(x + 54 * s)},{n(y - 18 * s)} '
             f'L{n(x + 88 * s)},{n(y)}Z" fill="#3a2e27" stroke="#140e0b" stroke-width="{n(2.4 * s)}"/>')
    for ex, ey in ((-30, -20), (12, -10), (52, -16)):
        o.append(f'<circle class="{ember_cls}" cx="{n(x + ex * s)}" cy="{n(y + ey * s)}" r="{n(3.2 * s)}" fill="{EMBER}"/>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 船荷（船の座標で、甲板 y=-80 に置く。下は舷側に隠れる）
# ---------------------------------------------------------------------------
def barrel(x, y=-80, s=1.0, tilt=0):
    """空の樽（ふたが外れ、中が暗い）。"""
    w, h = 34 * s, 48 * s
    return (f'<g transform="rotate({tilt} {n(x)} {n(y)})">'
            f'<path d="M{n(x - w / 2)},{n(y)} Q{n(x - w * .6)},{n(y - h / 2)} {n(x - w / 2)},{n(y - h)} L{n(x + w / 2)},{n(y - h)} '
            f'Q{n(x + w * .6)},{n(y - h / 2)} {n(x + w / 2)},{n(y)}Z" fill="#a8743f" stroke="{INK}" stroke-width="{n(2.6 * s)}"/>'
            f'<path d="M{n(x - w * .55)},{n(y - h * .28)} L{n(x + w * .55)},{n(y - h * .28)} M{n(x - w * .55)},{n(y - h * .72)} '
            f'L{n(x + w * .55)},{n(y - h * .72)}" stroke="#5a4a3a" stroke-width="{n(4 * s)}"/>'
            f'<ellipse cx="{n(x)}" cy="{n(y - h)}" rx="{n(w / 2)}" ry="{n(6 * s)}" fill="#2a1d14" stroke="{INK}" stroke-width="{n(2.4 * s)}"/>'
            '</g>')


def sack(x, y=-80, s=1.0):
    """ほとんど空の麻袋（しぼんで口が開いている）。"""
    return (f'<path d="M{n(x - 24 * s)},{n(y)} Q{n(x - 26 * s)},{n(y - 16 * s)} {n(x - 12 * s)},{n(y - 22 * s)} L{n(x - 4 * s)},{n(y - 30 * s)} '
            f'L{n(x + 8 * s)},{n(y - 22 * s)} Q{n(x + 26 * s)},{n(y - 14 * s)} {n(x + 24 * s)},{n(y)}Z" fill="#cdb789" stroke="{INK}" stroke-width="{n(2.4 * s)}"/>'
            f'<path d="M{n(x - 6 * s)},{n(y - 27 * s)} Q{n(x)},{n(y - 22 * s)} {n(x + 6 * s)},{n(y - 25 * s)}" fill="none" stroke="#8a7550" stroke-width="{n(2 * s)}"/>')


def _mix(a, b, t):
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(ca, cb))


def star_field(R, cls, count, y1=420):
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(0, 1600))}" cy="{n(R.uniform(10, y1) ** 1.0)}" r="{n(R.uniform(.9, 2.2))}" '
                   f'fill="#fff6dc" style="animation-delay:-{n(R.uniform(0, 3))}s"/>' for _ in range(count))


def recall(scene_svg, old, new, x, y, w):
    """ほかのムービーの場面（<svg class="scene-art"...> 全体）を、思い出の額の中の入れ子のSVGにする。
    id・クラス・アニメーション名の接頭辞 old を new に置き換える（この場面の接頭辞の下に入れるため）。
    中のCSSアニメーションは、この場面が再生中（.is-active）のときに元のとおり動く。"""
    h = w * 900 / 1600
    s = scene_svg.replace(old, new)
    head_end = s.index(">") + 1
    assert s.startswith('<svg class="scene-art"'), "scene svg expected"
    return (f'<svg x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">'
            + s[head_end:])


def frame(x, y, w, gold="#d9b545", inner="#f6e3a8"):
    """思い出の額（金の縁と細い内枠）。中身の上に重ねる。"""
    h = w * 900 / 1600
    return (f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="none" stroke="#3a2a14" stroke-width="16" rx="6"/>'
            f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="none" stroke="{gold}" stroke-width="10" rx="6"/>'
            f'<rect x="{n(x + 12)}" y="{n(y + 12)}" width="{n(w - 24)}" height="{n(h - 24)}" fill="none" stroke="{inner}" stroke-width="2" opacity=".8" rx="3"/>')
