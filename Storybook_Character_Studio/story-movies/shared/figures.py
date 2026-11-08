"""ムービー用の人物（Studioの正式デザインの頭・胴＋ムービーで描く手足）。

頭・胴は shared/cast.mjs が作画コードから書き出した部品（<ムービー>/parts/cast.json）をそのまま使う。
座標はゲームの8方向シートと同じ128px四方のセル座標で、全員の背丈・頭の大きさの比がゲームと同じになる。
ここで描くのは、ゲームでは3Dリグが受け持つ腕・脚・手・足（色はゲームのリグと同じ）と、姿勢・光だけ。
手足の付け根は、胴の画像から測った肩・裾の位置（anchors）に合わせる。

使い方（場面のコードから）:
    cast = Cast(path_to_cast_json)
    f = cast.figure("pino", "front", "s2-pino-", arms=("wave", "down"), tone=..., rims=...)
    f.defs, f.rim, f.body, f.foot（両足の間の地面）, f.waist（裾の中央）
    place(f.body, at, scale, f.foot) で場面へ置く。

腕の姿勢（ARMS）は肩からの (外へ, 下へ) の量で、肘と手の位置を表す。左右は画面の左右（side=-1 が画面左）。
"wave" の腕は .wave クラスの組に入れ、肩を中心に回して手を振れるようにする（回転の中心は fill-box の中央。
肩を中心にした透明な円を入れてある）。

プロローグ（story-movies/prologue/src/shion.py）は設定画の座標（443.5px）で手足を描いている。
ここは同じ描き方（輪郭付きの太い線＋陰と照り返しの帯、丸い手、革のブーツ）を128pxのセル座標へ移したもの。
"""
import json
import math
import re

from helpers import n, smooth_d

# 設定画（443.5px）→ シート（128px）の倍率。プロローグの手足の太さをこの倍率で移す。
K = 128 / 443.5
ARM_W = 30 * K          # 袖の太さ
LEG_W = 33 * K          # ズボンの太さ
OUTLINE = 3 * K         # 輪郭の太さ（原本と同じ3）
HAND_R = 15.5 * K
LEG_LEN = 31            # 裾から足首まで（セル座標）。ゲームのリグの脚の長さに近い
GROUND = LEG_LEN + 23.5 * K   # 裾から靴底まで

# 腕の姿勢：肩から (外へ, 下へ) の肘、手の位置（セル座標）
ARMS = {
    "down": ((5.0, 12.0), (6.0, 23.5)),     # 自然に下ろす（胴の横に見える）
    "wave": ((13.5, -1.5), (21.0, -15.0)),  # 横から上げて手を振る（手は頭の外）
    "high": ((11.0, -9.0), (17.0, -25.0)),  # 高く上げて振る（遠くへ）
    "hip": ((10.0, 9.0), (3.0, 17.0)),      # 腰に手
    "front": ((4.0, 12.0), (-6.5, 20.0)),   # 体の前で手を重ねる
    "helm": ((6.0, 10.0), (-4.0, 14.0)),    # 前へ（舵輪を握る）
}


# ---------------------------------------------------------------------------
# 色と id
# ---------------------------------------------------------------------------
def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _hex(c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v))) for v in c)


def mix(a, b, t):
    return _hex(tuple(x + (y - x) * t for x, y in zip(_rgb(a), _rgb(b))))


def grade(svg, fn):
    """svg 内の #rrggbb をすべて fn で変換する（朝・夕・夜の色調）。"""
    return re.sub(r"#[0-9a-fA-F]{6}\b", lambda m: fn(m.group(0).lower()), svg)


def namespace(svg, prefix):
    svg = re.sub(r'\bid="([^"]+)"', lambda m: f'id="{prefix}{m.group(1)}"', svg)
    svg = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{prefix}{m.group(1)})", svg)
    return re.sub(r'href="#([^"]+)"', lambda m: f'href="#{prefix}{m.group(1)}"', svg)


def _thin_line(m):
    w = re.search(r'stroke-width="([\d.]+)"', m.group(0))
    return "" if w and float(w.group(1)) < 1.6 else m.group(0)


def flat(svg, color):
    """人物の形を一色で塗った写し（縁の光用）。細い線は省いて軽くする。"""
    s = re.sub(r"<defs>.*?</defs>", "", svg, flags=re.S)
    s = re.sub(r'<path [^>]*fill="none"[^>]*/>', _thin_line, s)
    s = re.sub(r'fill="(?!none)[^"]*"', f'fill="{color}"', s)
    s = re.sub(r'stroke="(?!none)[^"]*"', f'stroke="{color}"', s)
    return re.sub(r'\sopacity="[^"]*"', "", s)   # 手を振る腕（.wave）のクラスは残し、写しも一緒に動かす


def rim(svg, color, dx, dy, opacity=1.0):
    op = f' opacity="{n(opacity)}"' if opacity < 1 else ""
    return f'<g transform="translate({n(dx)} {n(dy)})"{op}>{flat(svg, color)}</g>'


def place(markup, at, scale, anchor):
    """anchor（セル座標）を場面の at へ合わせ、scale 倍で置く。"""
    return (f'<g transform="translate({n(at[0])} {n(at[1])}) scale({n(scale)}) '
            f'translate({n(-anchor[0])} {n(-anchor[1])})">{markup}</g>')


# ---------------------------------------------------------------------------
# 手足
# ---------------------------------------------------------------------------
def _offset(pts, k):
    out = []
    for i, (x, y) in enumerate(pts):
        a = pts[max(0, i - 1)]
        b = pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        out.append((x - dy / L * k, y + dx / L * k))
    return out


def _d(pts):
    if len(pts) == 2:
        (x0, y0), (x1, y1) = pts
        return f"M{n(x0)},{n(y0)} L{n(x1)},{n(y1)}"
    return smooth_d(pts)


def shades(color):
    """手足の基本色から（基本・明るい・暗い）を作る。"""
    return color, mix(color, "#ffffff", .2), mix(color, "#000000", .32)


def limb(pts, w, color, ink, side=1):
    """太い線で描く袖・ズボン（端と関節は丸い）。side=±1 は陰の側。"""
    base, light, dark = shades(color)
    cap = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    d = _d(pts)
    return (f'<path d="{d}" {cap} stroke="{ink}" stroke-width="{n(w + OUTLINE * 2)}"/>'
            f'<path d="{d}" {cap} stroke="{base}" stroke-width="{n(w)}"/>'
            f'<path d="{_d(_offset(pts, side * w * .24))}" fill="none" stroke-linecap="butt" stroke-linejoin="round" '
            f'stroke="{dark}" stroke-width="{n(w * .36)}" opacity=".55"/>'
            f'<path d="{_d(_offset(pts, -side * w * .24))}" fill="none" stroke-linecap="butt" stroke-linejoin="round" '
            f'stroke="{light}" stroke-width="{n(w * .16)}" opacity=".5"/>')


def hand(x, y, color, ink, r=HAND_R):
    base, light, dark = shades(color)
    return (f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="{n(r)}" ry="{n(r * .92)}" fill="{base}" stroke="{ink}" stroke-width="{n(OUTLINE)}"/>'
            f'<path d="M{n(x - r * .5)},{n(y + r * .1)} Q{n(x)},{n(y + r * .45)} {n(x + r * .5)},{n(y + r * .1)}" fill="none" '
            f'stroke="{dark}" stroke-width="{n(OUTLINE * .55)}" stroke-linecap="round" opacity=".7"/>'
            f'<ellipse cx="{n(x - r * .3)}" cy="{n(y - r * .35)}" rx="{n(r * .3)}" ry="{n(r * .2)}" fill="{light}" opacity=".7"/>')


# 正面・背面のブーツ（足首を原点、筒は -y、靴底が下）。設定画の単位で描き、K 倍する。
_BOOT_SHAFT = "M-20,-36 L20,-36 L21.5,8 Q22.5,22 9,23.5 L-9,23.5 Q-22.5,22 -21.5,8Z"
_BOOT_TOE = "M-23,6 Q-25,24 0,25 Q25,24 23,6 Q12,13 0,13 Q-12,13 -23,6Z"
_CUFF = "M-23,-40 Q0,-43 23,-40 L23,-26 Q0,-29 -23,-26Z"


def boot(ankle, color, ink, front=True, size=1.0):
    ax, ay = ankle
    base, light, dark = shades(color)
    s = K * size
    toe = (f'<path d="{_BOOT_TOE}" fill="{light}" stroke="{ink}" stroke-width="3" stroke-linejoin="round"/>'
           if front else
           '<path d="M0,-4 L0,13" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" opacity=".25"/>')
    return (f'<g transform="translate({n(ax)} {n(ay)}) scale({n(s)})">'
            f'<path d="{_BOOT_SHAFT}" fill="{base}" stroke="{ink}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M-17,17.5 Q0,21 17,17.5" fill="none" stroke="{dark}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M13.5,-22 L14.5,9" fill="none" stroke="{dark}" stroke-width="5" stroke-linecap="round" opacity=".5"/>'
            f'<path d="M-12.5,-22 L-13,5" fill="none" stroke="{light}" stroke-width="3" stroke-linecap="round" opacity=".7"/>'
            + toe +
            f'<path d="{_CUFF}" fill="{light}" stroke="{ink}" stroke-width="3" stroke-linejoin="round"/>'
            '</g>')


# ---------------------------------------------------------------------------
# 人物
# ---------------------------------------------------------------------------
class Figure:
    def __init__(self, defs, rim_markup, body, foot, waist, shoulders):
        self.defs, self.rim, self.body = defs, rim_markup, body
        self.foot, self.waist, self.shoulders = foot, waist, shoulders


class Cast:
    def __init__(self, path):
        with open(path, encoding="utf-8") as f:
            self.data = json.load(f)

    def figure(self, cid, direction, prefix, arms=("down", "down"), legs=True, tone=None, rims=(), wave_class="wave",
               arms_over=False):
        """人物を組み立てる。arms は（画面左の腕, 画面右の腕）の姿勢名。legs=False で胸から上（船の上など）。
        arms_over=True で腕を胴・頭より手前に描く（体の前で手を重ねる姿勢など）。"""
        c = self.data["characters"][cid]
        v = c["views"][direction]
        a = v["anchors"]
        ink, limbs = c["ink"], c["limbs"]
        cx = (a["hem"]["left"] + a["hem"]["right"]) / 2
        hem_y = a["hem"]["y"]
        sh = a["shoulder"]
        shoulders = ((sh["left"] + 2.5, sh["y"] + 3), (sh["right"] - 2.5, sh["y"] + 3))
        parts_back, parts_front = [], []
        for side, (sx, sy), pose in ((-1, shoulders[0], arms[0]), (1, shoulders[1], arms[1])):
            if pose is None:
                continue
            (eo, ed), (ho, hd) = ARMS[pose]
            elbow = (sx + side * eo, sy + ed)
            hpt = (sx + side * ho, sy + hd)
            markup = limb([(sx, sy), elbow, hpt], ARM_W, limbs["sleeve"], ink, side=side) + hand(*hpt, limbs["hand"], ink)
            if pose in ("wave", "high"):
                # 肩を中心に回して手を振る（透明な円で、組の中央＝肩にする）
                markup = (f'<g class="{wave_class}"><circle cx="{n(sx)}" cy="{n(sy)}" r="30" fill="none"/>{markup}</g>')
            (parts_front if arms_over and pose in ("front", "helm") else parts_back).append(markup)
        leg_markup = ""
        if legs:
            hw = (a["hem"]["right"] - a["hem"]["left"])
            for side in (-1, 1):
                hip = (cx + side * hw * .21, hem_y - 4)
                ankle = (cx + side * hw * .23, hem_y + LEG_LEN)
                knee = ((hip[0] + ankle[0]) / 2, (hip[1] + ankle[1]) / 2)
                leg_markup += (limb([hip, knee, ankle], LEG_W, limbs["pants"], ink, side=side)
                               + boot(ankle, limbs["boot"], ink, front=direction.startswith("front")))
        body = leg_markup + "".join(parts_back) + v["torso"] + v["head"] + "".join(parts_front)
        defs = c["defs"]
        if tone:
            body, defs = grade(body, tone), grade(defs, tone)
        lights = "".join(rim(body, col, dx, dy, op) for col, dx, dy, op in rims)
        foot = (cx, hem_y + (GROUND if legs else 0))
        return Figure(namespace(defs, prefix), namespace(lights, prefix), namespace(body, prefix), foot, (cx, hem_y),
                      shoulders)
