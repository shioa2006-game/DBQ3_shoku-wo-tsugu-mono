"""ムービー用の主人公シオン（第4・第5場面）。

頭（髪・顔・耳）と胴（首・襟・生成りの服・紺のベスト・肩紐・ベルト・小物入れ・ホルダー・職業の書）は、
Studioの正式デザイン prototypes/hero2-8dir/character.mjs から書き出した parts/shion-parts.json を
そのまま使う（src/shion_parts.mjs。座標は設定画のセル単位、443.5px四方）。ゲームと同じ人物に見えることを
最優先にし、形は描き直さない。

ここで描くのは、ゲームでは3Dリグが受け持つ腕・脚・手・足（紺の袖・素手・焦げ茶のズボン・茶色のブーツ）と、
場面ごとの姿勢・表情・光だけ。
  - run_left():   第4場面。左斜め前を向いて夜の山道を駆け下りる。眉と口だけを「必死に逃げる」表情へ差し替える。
  - stand_dawn(): 第5場面。右斜め後ろ姿で朝日を見る。背中の職業の書（深緑の表紙と金の紋章）が正面に来る。

色の調子（夜・夜明け）は grade() で全体の色を寄せ、縁の光は rim()（人物の形を一色で塗った写しを
少しずらして後ろに敷く）で付ける。フィルターやマスクは使わない（再生負荷を抑えるため）。
id はシーンごとの接頭辞を付け、クロスフェード中に2場面が並んでも衝突しないようにする。
"""
import json
import math
import os
import re

from helpers import n, smooth_d

_HERE = os.path.dirname(os.path.abspath(__file__))
PARTS_PATH = os.path.join(_HERE, "..", "parts", "shion-parts.json")
with open(PARTS_PATH, encoding="utf-8") as _f:
    PARTS = json.load(_f)

INK = PARTS["palette"]["ink"]          # 髪・肌の輪郭（原本と同じ）
SLEEVE_INK = "#141a3a"                 # ベストの輪郭（原本と同じ）
LEATHER_INK = "#3e2210"                # 革の輪郭（原本と同じ）
# 手足の色。ゲームの3Dリグの色（compare/ch4-5/characters/preview.js の hero2 generatedColors）に合わせる。
LIMB = {
    "sleeve": ("#293d75", "#3d5596", "#1a2652"),
    "pants": ("#3b2a22", "#5a4434", "#241812"),
    "boot": ("#8a5428", "#b27845", "#5a3416"),
}


# ---------------------------------------------------------------------------
# 色と id の変換
# ---------------------------------------------------------------------------
def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _hex(c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v))) for v in c)


def mix(a, b, t):
    return _hex(tuple(x + (y - x) * t for x, y in zip(_rgb(a), _rgb(b))))


def grade(svg, fn):
    """svg 内の #rrggbb をすべて fn で変換する（夜・夜明けの色調）。"""
    return re.sub(r"#[0-9a-fA-F]{6}\b", lambda m: fn(m.group(0).lower()), svg)


def namespace(svg, prefix):
    svg = re.sub(r'\bid="([^"]+)"', lambda m: f'id="{prefix}{m.group(1)}"', svg)
    svg = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{prefix}{m.group(1)})", svg)
    return re.sub(r'href="#([^"]+)"', lambda m: f'href="#{prefix}{m.group(1)}"', svg)


def _thin_line(m):
    w = re.search(r'stroke-width="([\d.]+)"', m.group(0))
    return "" if w and float(w.group(1)) < 6 else m.group(0)


def flat(svg, color):
    """人物の形を一色で塗った写し（縁の光用）。clipPath は元の絵のものを参照する。
    形に効かない細い線（毛束・輪郭線など、塗りのない太さ6未満の線）は省き、写しを軽くする。"""
    s = re.sub(r"<defs>.*?</defs>", "", svg, flags=re.S)
    s = re.sub(r'<path [^>]*fill="none"[^>]*/>', _thin_line, s)
    s = re.sub(r'fill="(?!none)[^"]*"', f'fill="{color}"', s)
    s = re.sub(r'stroke="(?!none)[^"]*"', f'stroke="{color}"', s)
    return re.sub(r'\sopacity="[^"]*"', "", s)


def rim(svg, color, dx, dy, opacity=1.0):
    op = f' opacity="{n(opacity)}"' if opacity < 1 else ""
    return f'<g transform="translate({n(dx)} {n(dy)})"{op}>{flat(svg, color)}</g>'


# ---------------------------------------------------------------------------
# 手足（設定画のセル座標。輪郭は原本と同じ太さ3）
# ---------------------------------------------------------------------------
def _offset(pts, k):
    """折れ線を法線方向へ k だけずらす（陰・照り返しの帯用）。"""
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


def limb(pts, w, colors, ink=INK, side=1, ow=3.0):
    """太い線で描く袖・ズボン（端と関節は丸い）。side=±1 は陰の側（進む向きに対して右=+1）。"""
    base, light, dark = colors
    cap = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    d = _d(pts)
    o = [f'<path d="{d}" {cap} stroke="{ink}" stroke-width="{n(w + ow * 2)}"/>',
         f'<path d="{d}" {cap} stroke="{base}" stroke-width="{n(w)}"/>']
    o.append(f'<path d="{_d(_offset(pts, side * w * .24))}" fill="none" stroke-linecap="butt" stroke-linejoin="round" '
             f'stroke="{dark}" stroke-width="{n(w * .36)}" opacity=".6"/>')
    o.append(f'<path d="{_d(_offset(pts, -side * w * .24))}" fill="none" stroke-linecap="butt" stroke-linejoin="round" '
             f'stroke="{light}" stroke-width="{n(w * .16)}" opacity=".55"/>')
    return "".join(o)


def hand(x, y, r=15.5, angle=0, thumb=1):
    """丸い手（ミトン形）。thumb=±1 で親指の側、0 で親指を描かない。"""
    o = [f'<g transform="translate({n(x)} {n(y)}) rotate({n(angle)})">']
    if thumb:
        o.append(f'<ellipse cx="{n(thumb * r * .62)}" cy="{n(-r * .52)}" rx="{n(r * .42)}" ry="{n(r * .36)}" '
                 f'fill="url(#skin)" stroke="{INK}" stroke-width="2.6"/>')
    o.append(f'<ellipse cx="0" cy="0" rx="{n(r)}" ry="{n(r * .92)}" fill="url(#skin)" stroke="{INK}" stroke-width="3"/>')
    o.append(f'<path d="M{n(-r * .5)},{n(r * .1)} Q0,{n(r * .45)} {n(r * .5)},{n(r * .1)}" fill="none" stroke="#e3a986" '
             'stroke-width="1.6" stroke-linecap="round"/>')
    o.append("</g>")
    return "".join(o)


def arm(pts, side=1, hand_r=15.5, hand_angle=0, thumb=1):
    """紺の袖（肩→肘→手首）と手。"""
    hx, hy = pts[-1]
    return limb(pts, 30, LIMB["sleeve"], ink=SLEEVE_INK, side=side) + hand(hx, hy, hand_r, hand_angle, thumb)


# ブーツ（足首を原点、つま先は -x、靴底は +y）。茶色の革、明るい履き口、濃い靴底。
_BOOT = ("M-20,-36 L20,-36 L21,0 Q23,19 11,21 L-29,21 Q-43,21 -42,7 Q-41,-4 -23,-7Z")
_CUFF = "M-23,-40 Q0,-43 23,-40 L23,-26 Q0,-29 -23,-26Z"


def boot(ankle, knee, flex=0, flip=False, toe=1.0, size=.9):
    """脛（knee→ankle）の向きにブーツの筒を合わせ、flex（度）だけ足首を曲げる。flip でつま先を +x へ。"""
    ax, ay = ankle
    kx, ky = knee
    ang = math.degrees(math.atan2(kx - ax, -(ky - ay))) + flex
    sx = (-toe if flip else toe) * size
    base, light, dark = LIMB["boot"]
    return (f'<g transform="translate({n(ax)} {n(ay)}) rotate({n(ang)}) scale({n(sx)} {n(size)})">'
            f'<path d="{_BOOT}" fill="{base}" stroke="{LEATHER_INK}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M-36,15 Q-12,17 14,15" fill="none" stroke="{dark}" stroke-width="5" stroke-linecap="round"/>'
            f'<path d="M14,-22 L15,6" fill="none" stroke="{dark}" stroke-width="5" stroke-linecap="round" opacity=".55"/>'
            f'<path d="M-14,-22 Q-15,-12 -24,-6" fill="none" stroke="{light}" stroke-width="3" stroke-linecap="round" opacity=".75"/>'
            f'<path d="{_CUFF}" fill="{light}" stroke="{LEATHER_INK}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M-19,-35 Q0,-37.5 19,-35" fill="none" stroke="#d29a62" stroke-width="2" stroke-linecap="round"/>'
            '</g>')


# 後ろから見たブーツ（足首を原点、筒は -y、かかとと靴底が下）。横向きの形を横に縮めると筒まで細くなるため、
# 後ろ姿では筒の幅を保ったまま、かかと側から見た形で描く。
_BOOT_BACK = "M-20,-36 L20,-36 L21.5,8 Q22.5,22 9,23.5 L-9,23.5 Q-22.5,22 -21.5,8Z"


def boot_back(ankle, knee, size=1.0):
    """後ろ姿のブーツ。筒を脛（knee→ankle）の向きに合わせる。"""
    ax, ay = ankle
    kx, ky = knee
    ang = math.degrees(math.atan2(kx - ax, -(ky - ay)))
    base, light, dark = LIMB["boot"]
    return (f'<g transform="translate({n(ax)} {n(ay)}) rotate({n(ang)}) scale({n(size)})">'
            f'<path d="{_BOOT_BACK}" fill="{base}" stroke="{LEATHER_INK}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M-17,17.5 Q0,21 17,17.5" fill="none" stroke="{dark}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M13.5,-22 L14.5,9" fill="none" stroke="{dark}" stroke-width="5" stroke-linecap="round" opacity=".55"/>'
            f'<path d="M-12.5,-22 L-13,5" fill="none" stroke="{light}" stroke-width="3" stroke-linecap="round" opacity=".75"/>'
            f'<path d="M0,-4 L0,13" fill="none" stroke="{dark}" stroke-width="1.8" stroke-linecap="round" opacity=".5"/>'
            f'<path d="{_CUFF}" fill="{light}" stroke="{LEATHER_INK}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="M-19,-35 Q0,-37.5 19,-35" fill="none" stroke="#d29a62" stroke-width="2" stroke-linecap="round"/>'
            '</g>')


def leg(pts, side=1):
    return limb(pts, 34, LIMB["pants"], ink=INK, side=side)


# ---------------------------------------------------------------------------
# 表情（原本の眉・口の線だけを差し替える）
# ---------------------------------------------------------------------------
def _replace(svg, pattern, repls, what):
    found = re.findall(pattern, svg)
    if len(found) != len(repls):
        raise ValueError(f"シオンの{what}が原本と一致しません（{len(found)}本）。shion.py の表情を見直してください。")
    for old, new in zip(found, repls):
        svg = svg.replace(old, new, 1)
    return svg


def run_expression(head):
    """左斜め前の頭：笑顔の口を、口角の下がった小さな開いた口（息を切らして必死に逃げる）へ差し替え、
    頬に汗を一粒足す。眉は前髪に隠れるので原本のまま。"""
    head = _replace(head, r'<path d="[^"]*" fill="none" stroke="#7a3a26"[^>]*/>',
                    ['<path d="M173 190 Q181.5 183.5 190 189.5 Q187 196 181.5 196 Q175.5 196 173 190Z" fill="#7c3428" '
                     'stroke="#6a2c20" stroke-width="2.2" stroke-linejoin="round"/>'
                     '<path d="M177 194 Q181.5 191.5 186 194 Q184 196 181.5 196 Q179 196 177 194Z" fill="#d9776c"/>'], "口")
    # 汗は耳の上のこめかみ（髪の上）に置く。頬の端では顔の輪郭に紛れて見えにくいため。
    sweat = ('<path d="M252 118 Q244 131 245 138 Q246 145 253 145 Q260 144 259 137 Q258 130 252 118Z" fill="#dff3ff" '
             'stroke="#5a86b8" stroke-width="2.2" stroke-linejoin="round"/>'
             '<path d="M249.5 133 Q249.5 139 253 140.5" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>')
    return head + sweat


# ---------------------------------------------------------------------------
# 姿勢
# ---------------------------------------------------------------------------
def run_left():
    """第4場面：左斜め前を向いて駆ける。手前の脚（画面右）が前へ交差し、奥の脚は後ろへ蹴り上げる。
    腕は脚と逆：奥の腕（画面左）が前、手前の腕（画面右）が後ろ。返り値は (人物, 書の中心)。"""
    v = PARTS["views"]["front_left"]
    head = run_expression(v["head"])
    far_arm = arm([(166, 238), (139, 276), (108, 254)], side=-1, hand_angle=-30, thumb=1)
    far_leg = leg([(202, 326), (232, 364), (280, 366)], side=1) + boot((280, 366), (232, 364), flex=6)
    near_leg = leg([(236, 326), (190, 356), (172, 410)], side=-1) + boot((172, 410), (190, 356), flex=-18)
    # 手前の左腕：肘を後ろへ大きく引き、握りこぶしを腰の横に置く（手首を外へ跳ね上げると女の子走りに見えるため）。
    near_arm = arm([(257, 238), (301, 262), (273, 300)], side=1, hand_angle=-30, thumb=-1)
    body = far_arm + far_leg + near_leg + v["torso"] + head + near_arm
    return f'<g transform="rotate({LEAN} 200 430)">{body}</g>', _rotate((282, 236), LEAN, (200, 430))


LEAN = -8   # 走る前傾（度）


def _rotate(p, deg, c):
    a = math.radians(deg)
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def run_away():
    """第4場面の後半（近い画）：左斜め後ろ姿で駆けていく。背中の職業の書の表紙（深緑と金の紋章）を見せる。
    手前の腕（画面右）は後ろへ振って肘が外へ張り、左腕（画面左）は前へ振って、肘を下げ握りこぶしを左前へ出す。
    手前の脚（画面右）は奥へ踏み出し、奥の脚（画面左）は後ろへ蹴り上げる。ブーツは後ろから見た形（boot_back）。"""
    v = PARTS["views"]["back_left"]
    far_arm = arm([(74, 238), (45, 278), (6, 261)], side=-1, hand_angle=-70, thumb=0)
    near_leg = leg([(150, 330), (158, 366), (161, 402)], side=1) + boot_back((161, 402), (158, 366))
    far_leg = leg([(94, 330), (82, 374), (93, 420)], side=-1) + boot_back((93, 420), (82, 374))
    # 手前の腕は肩の付け根を書とホルダーの後ろに通す（背中の書が腕より手前に出ているため）。
    near_arm = arm([(184, 240), (222, 268), (216, 304)], side=1, hand_angle=10, thumb=0)
    body = far_arm + near_leg + far_leg + near_arm + v["torso"] + v["head"]
    return f'<g transform="rotate(-4 121 430)">{body}</g>', _rotate((161, 241), -4, (121, 430))


def stand_dawn():
    """第5場面：右斜め後ろ姿で立ち、朝日（画面右）を見る。背中の職業の書の表紙が見える。"""
    v = PARTS["views"]["back_right"]
    far_arm = arm([(174, 236), (188, 276), (192, 310)], side=1, hand_angle=8, thumb=0)
    far_leg = leg([(146, 330), (149, 370), (151, 404)], side=1) + boot((151, 404), (149, 370), flip=True, toe=.72)
    near_leg = leg([(98, 332), (95, 376), (94, 414)], side=-1) + boot((94, 414), (95, 376), flip=True, toe=.8)
    near_arm = arm([(54, 238), (38, 278), (34, 312)], side=-1, hand_angle=-6, thumb=0)
    body = far_arm + far_leg + near_leg + v["torso"] + v["head"] + near_arm
    return body, (84, 240)


# ---------------------------------------------------------------------------
# 場面へ置く
# ---------------------------------------------------------------------------
def place(markup, at, scale, anchor):
    """anchor（セル座標）を場面の at へ合わせ、scale 倍で置く。"""
    return (f'<g transform="translate({n(at[0])} {n(at[1])}) scale({n(scale)}) '
            f'translate({n(-anchor[0])} {n(-anchor[1])})">{markup}</g>')


def figure(pose, prefix, tone=None, rims=()):
    """pose の人物を色調 tone（色→色の関数）で整え、rims（(色, dx, dy, 不透明度)）の縁の光を作る。
    返り値は (defs, 縁の光, 人物, 書の中心)。縁の光は人物の後ろに置く。id には prefix を付けてある
    （縁の光は人物の clipPath を参照するので、同じ場面に人物も置くこと）。"""
    body, book = pose()
    defs = PARTS["defs"]
    if tone:
        body, defs = grade(body, tone), grade(defs, tone)
    lights = "".join(rim(body, c, dx, dy, op) for c, dx, dy, op in rims)
    return namespace(defs, prefix), namespace(lights, prefix), namespace(body, prefix), book
