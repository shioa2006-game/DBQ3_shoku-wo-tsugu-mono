"""帰るべき場所へ「火山島編・完」の小道具：清めの泉と社・竹・水門と導水路・鉱山町と鍛冶場・直した桟橋。
神殿跡の影は共通部品（../../shared/temple.py の remains_silhouette。M10と同じ形）。

火山島（props5.volcano）と船（第3章の結末の props.ship_full）は、ほかのムービーのものをそのまま使う。
id には呼び出し側の接頭辞 p を付ける。
"""
import math

from helpers import n

INK = "#3b2a1c"
WOOD = "#c99c5f"
WOOD_DARK = "#7c5730"
STONE = "#8f9396"
STONE_DARK = "#5f6467"
TORII = "#c23b2a"
BAMBOO = "#6fa35a"
BAMBOO_DARK = "#3f6e3a"


# ---------------------------------------------------------------------------
# 竹（根元 (x, base) から上へ。節と、上の葉の房）
# ---------------------------------------------------------------------------
def bamboo(R, x, base, h, w=16, lean=0.0, color=BAMBOO, dark=BAMBOO_DARK, leaf_cls=""):
    top = base - h
    o = [f'<path d="M{n(x - w / 2)},{n(base)} L{n(x - w / 2 + lean * h)},{n(top)} L{n(x + w / 2 + lean * h)},{n(top)} L{n(x + w / 2)},{n(base)}Z" '
         f'fill="{color}" stroke="{dark}" stroke-width="2.2"/>']
    o.append(f'<path d="M{n(x - w * .15)},{n(base)} L{n(x - w * .15 + lean * h)},{n(top)}" stroke="#a6cf86" stroke-width="{n(w * .18)}" opacity=".55"/>')
    y = base - R.uniform(40, 70)
    while y > top + 20:
        dx = lean * (base - y)
        o.append(f'<path d="M{n(x - w / 2 - 1 + dx)},{n(y)} L{n(x + w / 2 + 1 + dx)},{n(y)}" stroke="{dark}" stroke-width="3"/>')
        y -= R.uniform(60, 90)
    # 葉の房
    for _ in range(4):
        lx = x + lean * h + R.uniform(-30, 30)
        ly = top + R.uniform(-10, 70)
        ang = R.uniform(-.6, .6)
        o.append(f'<g class="{leaf_cls}" style="animation-delay:-{n(R.uniform(0, 3))}s;transform-origin:{n(lx)}px {n(ly)}px">'
                 + "".join(f'<path d="M{n(lx)},{n(ly)} q{n(18 * s)},{n(-6 + 12 * ang)} {n(42 * s)},{n(4 + 10 * ang)} q{n(-20 * s)},{n(4)} {n(-42 * s)},{n(-4 - 10 * ang)}Z" '
                           f'fill="{BAMBOO if s > 0 else "#5e9150"}" stroke="{dark}" stroke-width="1.6"/>' for s in (1, -1, .8, -.8))
                 + '</g>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 清めの泉（池の中心 (x, y)、横の半径 rx）と社
# ---------------------------------------------------------------------------
def spring_defs(p):
    return (f'<radialGradient id="{p}water" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#bff3ef"/>'
            '<stop offset=".6" stop-color="#5fc7cf"/><stop offset="1" stop-color="#2f8fa8"/></radialGradient>'
            f'<radialGradient id="{p}shine" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".8"/>'
            '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>')


def spring(p, R, x, y, rx, ry, ring_cls="", sparkle_cls="", murk_cls=""):
    """石で囲んだ泉。澄んだ水、波紋の輪、きらめき。murk_cls は最初だけ見える濁り（場面のCSSで消す）。"""
    o = [f'<ellipse cx="{n(x)}" cy="{n(y + 8)}" rx="{n(rx + 26)}" ry="{n(ry + 16)}" fill="{STONE_DARK}"/>']
    # 縁石
    for i in range(22):

        a = math.pi * 2 * i / 22
        sx, sy = x + (rx + 14) * math.cos(a), y + (ry + 9) * math.sin(a)
        o.append(f'<ellipse cx="{n(sx)}" cy="{n(sy)}" rx="{n(R.uniform(14, 20))}" ry="{n(R.uniform(8, 11))}" fill="{STONE}" stroke="#4c5154" stroke-width="2"/>')
    o.append(f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="{n(rx)}" ry="{n(ry)}" fill="url(#{p}water)" stroke="#2c6f82" stroke-width="3"/>')
    o.append(f'<ellipse class="{murk_cls}" cx="{n(x)}" cy="{n(y)}" rx="{n(rx)}" ry="{n(ry)}" fill="#5d6a5a"/>')
    o.append(f'<ellipse cx="{n(x - rx * .25)}" cy="{n(y - ry * .3)}" rx="{n(rx * .45)}" ry="{n(ry * .28)}" fill="url(#{p}shine)" opacity=".7"/>')
    for i, d in enumerate((0, 1.1, 2.2)):
        o.append(f'<ellipse class="{ring_cls}" cx="{n(x + rx * .12)}" cy="{n(y + ry * .08)}" rx="{n(rx * .3)}" ry="{n(ry * .3)}" fill="none" '
                 f'stroke="#e8fbff" stroke-width="2.4" style="animation-delay:-{d}s"/>')
    for _ in range(14):
        sx, sy = x + R.uniform(-.8, .8) * rx, y + R.uniform(-.7, .7) * ry
        if ((sx - x) / rx) ** 2 + ((sy - y) / ry) ** 2 < .8:
            o.append(f'<path class="{sparkle_cls}" d="M{n(sx - 6)},{n(sy)} L{n(sx + 6)},{n(sy)} M{n(sx)},{n(sy - 4)} L{n(sx)},{n(sy + 4)}" '
                     f'stroke="#ffffff" stroke-width="2" stroke-linecap="round" style="animation-delay:-{n(R.uniform(0, 2))}s"/>')
    return "".join(o)


def hokora(x, y, s=1.0):
    """小さな社（床の中央 (x, y)）。白木の柱、板の屋根、赤い鳥居を手前に。"""
    def P(d, fill, sw=2.4):
        return f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{n(sw * s)}" stroke-linejoin="round"/>'
    k = lambda v: n(v * s)
    o = [f'<g transform="translate({n(x)} {n(y)})">',
         P(f"M{k(-70)},0 L{k(70)},0 L{k(64)},{k(-14)} L{k(-64)},{k(-14)}Z", "#9a9488"),
         P(f"M{k(-48)},{k(-14)} L{k(-48)},{k(-74)} L{k(48)},{k(-74)} L{k(48)},{k(-14)}Z", "#e9dcc0"),
         P(f"M{k(-18)},{k(-14)} L{k(-18)},{k(-58)} L{k(18)},{k(-58)} L{k(18)},{k(-14)}Z", "#5b3b20"),
         P(f"M{k(-74)},{k(-70)} Q{k(0)},{k(-118)} {k(74)},{k(-70)} L{k(62)},{k(-62)} Q{k(0)},{k(-102)} {k(-62)},{k(-62)}Z", "#6a5240"),
         P(f"M{k(-6)},{k(-112)} L{k(6)},{k(-112)} L{k(6)},{k(-96)} L{k(-6)},{k(-96)}Z", WOOD),
         f'<path d="M{k(-18)},{k(-46)} L{k(18)},{k(-46)}" stroke="#d8b445" stroke-width="{k(3)}"/>',
         "</g>"]
    return "".join(o)


def torii(x, y, w=120, h=110):
    """赤い鳥居（足元の中央 (x, y)）。"""
    return (f'<g stroke="{INK}" stroke-width="2.6" stroke-linejoin="round">'
            f'<path d="M{n(x - w * .36)},{n(y)} L{n(x - w * .33)},{n(y - h)} L{n(x - w * .27)},{n(y - h)} L{n(x - w * .28)},{n(y)}Z '
            f'M{n(x + w * .36)},{n(y)} L{n(x + w * .33)},{n(y - h)} L{n(x + w * .27)},{n(y - h)} L{n(x + w * .28)},{n(y)}Z" fill="{TORII}"/>'
            f'<path d="M{n(x - w * .45)},{n(y - h * .72)} L{n(x + w * .45)},{n(y - h * .72)} L{n(x + w * .45)},{n(y - h * .64)} L{n(x - w * .45)},{n(y - h * .64)}Z" fill="{TORII}"/>'
            f'<path d="M{n(x - w * .6)},{n(y - h * .98)} Q{n(x)},{n(y - h * 1.06)} {n(x + w * .6)},{n(y - h * .98)} L{n(x + w * .56)},{n(y - h * .88)} '
            f'Q{n(x)},{n(y - h * .94)} {n(x - w * .56)},{n(y - h * .88)}Z" fill="#2c2220"/>'
            f'<path d="M{n(x - w * .52)},{n(y - h * .88)} L{n(x + w * .52)},{n(y - h * .88)} L{n(x + w * .5)},{n(y - h * .8)} L{n(x - w * .5)},{n(y - h * .8)}Z" fill="{TORII}"/>'
            '</g>')


# ---------------------------------------------------------------------------
# 水門と導水路（板の樋が杭に乗って、町へ下る）
# ---------------------------------------------------------------------------
def channel(points, flow_cls="", w=22):
    """points を通る板の樋（杭つき）。flow_cls は流れる水の破線。"""
    d = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in points)
    o = []
    for (x, y) in points[1:-1]:
        o.append(f'<path d="M{n(x - 4)},{n(y + 4)} L{n(x - 5)},{n(y + 60)} M{n(x + 4)},{n(y + 4)} L{n(x + 5)},{n(y + 60)}" stroke="{WOOD_DARK}" stroke-width="5"/>')
    o.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{w + 6}" stroke-linejoin="round" stroke-linecap="round"/>'
             f'<path d="{d}" fill="none" stroke="{WOOD}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
             f'<path d="{d}" fill="none" stroke="#7fd3dc" stroke-width="{w * .5}" stroke-linejoin="round" stroke-linecap="round"/>'
             f'<path class="{flow_cls}" d="{d}" fill="none" stroke="#e9fbff" stroke-width="3" stroke-dasharray="14 22" stroke-linecap="round"/>')
    return "".join(o)


def sluice(x, y, s=1.0):
    """水門（石の柱二本と板の戸）。"""
    k = lambda v: n(v * s)
    return (f'<g transform="translate({n(x)} {n(y)})" stroke="{INK}" stroke-width="{k(2.4)}">'
            f'<path d="M{k(-34)},0 L{k(-34)},{k(-64)} L{k(-18)},{k(-64)} L{k(-18)},0Z M{k(18)},0 L{k(18)},{k(-64)} L{k(34)},{k(-64)} L{k(34)},0Z" fill="{STONE}"/>'
            f'<path d="M{k(-40)},{k(-64)} L{k(40)},{k(-64)} L{k(40)},{k(-74)} L{k(-40)},{k(-74)}Z" fill="{STONE_DARK}"/>'
            f'<path d="M{k(-18)},{k(-44)} L{k(18)},{k(-44)} L{k(18)},{k(-30)} L{k(-18)},{k(-30)}Z" fill="{WOOD}"/></g>')


# ---------------------------------------------------------------------------
# 鉱山町：鍛冶場（石の炉と煙突の火）、家、食堂
# ---------------------------------------------------------------------------
def forge(p, x, y, s=1.0, fire_cls="", smoke_cls=""):
    """鍛冶場（床の中央 (x, y)）。石積みの壁、板屋根、煙突の口の火と煙。"""
    k = lambda v: n(v * s)
    o = [f'<g transform="translate({n(x)} {n(y)})" stroke="{INK}" stroke-width="{k(2.6)}" stroke-linejoin="round">',
         f'<path d="M{k(-90)},0 L{k(-90)},{k(-70)} L{k(90)},{k(-70)} L{k(90)},0Z" fill="#8a8580"/>',
         f'<path d="M{k(-100)},{k(-66)} L{k(0)},{k(-118)} L{k(100)},{k(-66)}Z" fill="#5a4a3e"/>',
         f'<path d="M{k(-30)},0 L{k(-30)},{k(-42)} Q{k(0)},{k(-60)} {k(30)},{k(-42)} L{k(30)},0Z" fill="#3a2a20"/>',
         f'<path class="{fire_cls}" d="M{k(-20)},0 L{k(-20)},{k(-30)} Q{k(0)},{k(-44)} {k(20)},{k(-30)} L{k(20)},0Z" fill="#ff8a3a" stroke="none"/>',
         f'<path d="M{k(44)},{k(-80)} L{k(44)},{k(-150)} L{k(70)},{k(-150)} L{k(70)},{k(-90)}Z" fill="#7a746e"/>',
         f'<ellipse class="{fire_cls}" cx="{k(57)}" cy="{k(-152)}" rx="{k(12)}" ry="{k(5)}" fill="#ffb04a" stroke="none"/>',
         "</g>"]
    for i, (r, d) in enumerate(((10, 0), (14, 1.2), (18, 2.4))):
        o.append(f'<circle class="{smoke_cls}" cx="{n(x + 57 * s)}" cy="{n(y - 160 * s)}" r="{n(r * s)}" fill="#e8e4de" opacity=".7" style="animation-delay:-{d}s"/>')
    return "".join(o)


def town_house(x, y, w=110, h=60, roof="#4f5a66", wall="#d9cfba", s=1.0):
    k = lambda v: n(v * s)
    return (f'<g transform="translate({n(x)} {n(y)})" stroke="{INK}" stroke-width="{k(2.4)}" stroke-linejoin="round">'
            f'<path d="M{k(-w / 2)},0 L{k(-w / 2)},{k(-h)} L{k(w / 2)},{k(-h)} L{k(w / 2)},0Z" fill="{wall}"/>'
            f'<path d="M{k(-w / 2 - 10)},{k(-h + 4)} L{k(0)},{k(-h - 40)} L{k(w / 2 + 10)},{k(-h + 4)}Z" fill="{roof}"/>'
            f'<path d="M{k(-10)},0 L{k(-10)},{k(-30)} L{k(10)},{k(-30)} L{k(10)},0Z" fill="#6a4a30"/>'
            f'<path d="M{k(-w / 2 + 12)},{k(-h + 16)} L{k(-w / 2 + 30)},{k(-h + 16)} L{k(-w / 2 + 30)},{k(-h + 32)} L{k(-w / 2 + 12)},{k(-h + 32)}Z" fill="#f6d98a"/>'
            '</g>')


# ---------------------------------------------------------------------------
# 直した桟橋（左手前の板。見送る人がここに立つ）
# ---------------------------------------------------------------------------
def new_pier(y=846):
    return (f'<path d="M-20,{y} L820,{y - 10} L860,900 L-20,900Z" fill="{WOOD}" stroke="{INK}" stroke-width="3"/>'
            + "".join(f'<path d="M-20,{yy} L{n(826 + (yy - y) * .6)},{yy - 10}" stroke="#8a6436" stroke-width="2" opacity=".6"/>' for yy in (y + 20, y + 40))
            + f'<path d="M-20,{y} L820,{y - 10}" stroke="#f0cf8f" stroke-width="3" opacity=".8"/>'
            + f'<path d="M790,{y - 10} L790,900 L828,900 L826,{y - 10}Z" fill="{WOOD_DARK}" stroke="{INK}" stroke-width="3"/>')
