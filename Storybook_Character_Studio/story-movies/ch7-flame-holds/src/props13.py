"""最終決戦の決着「灯は消えず」の小道具。

  fallen_varga       地上へ落ちたヴァルガ（M12の props12.Varga の部品を使う）。翼は地面へ垂れて裂け、左の翼に大型対空
                     ボウガンの矢。左右の二つの頭はすでに倒れて地面に横たわり（暗く沈める）、中央の三つ目の頭だけが首を
                     もたげる。三つ目の頭と首は、呼び出し側のクラスで手前へ倒れる動きを付ける。
  mist               黒い霧の塊（ヴァルガが崩れていくところ）
  bolt               大型対空ボウガンの矢（木の軸・鉄の矢じり・矢羽）
  ballista_tower     大型対空ボウガンの射台：ピノの木組みの高い台に、ベルクの金属機構（鉄の弓・巻き上げ車・帯金）の
                     ボウガンを据えたもの。空へ向けて斜めに構える
  temple_damage      再建した神殿（../../shared/temple.py の temple_rebuilt と同じ座標）に重ねる戦いの傷：大屋根の穴と
                     焦げ、壁のすす・ひび、割れた窓、欠けた軒、基壇に落ちた板と石。入口と祭壇の灯は無事
  selection_pillar_done  選択の柱（M11の props11.selection_pillar）の四つの枠すべてに印を刻んだもの。
                     下から、アサギの大工の印（M11）・建築（金槌と積んだ石）・食料（湯気の立つ椀）・防衛（盾）

戦いの傷は、ムービーの後も修理の段階へ引き継ぐ（直った神殿は見せない）。傷の位置と壊れ方の細部はゲームで決める。
座標は呼び出し側で置く。
"""
import math
import random

from helpers import n, cloud
from figures import namespace
from props11 import selection_pillar, STONE_DARK

INK = "#291516"
WOOD, WOOD_DARK, WOOD_LIGHT = "#9a6a3c", "#5e3e22", "#c4945c"   # ピノの木組み（再建した神殿の木と同じ色）
IRON, IRON_DARK, IRON_LIGHT = "#59606c", "#33373f", "#9aa3b0"   # ベルクの金属機構
GOLD = "#f0c860"


# ---------------------------------------------------------------------------
# 大型対空ボウガンの矢
# ---------------------------------------------------------------------------
def bolt(x0, y0, x1, y1, w=9, ink="#2a1f16", head=True):
    """矢（(x0, y0) が矢羽の側、(x1, y1) が矢じりの側）。head=False は矢じりが刺さって見えないとき。"""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    vx, vy = -uy, ux
    o = [f'<path d="M{n(x0)},{n(y0)} L{n(x1)},{n(y1)}" stroke="{ink}" stroke-width="{n(w + 4)}" stroke-linecap="round"/>'
         f'<path d="M{n(x0)},{n(y0)} L{n(x1)},{n(y1)}" stroke="{WOOD}" stroke-width="{n(w)}" stroke-linecap="round"/>'
         f'<path d="M{n(x0 + vx * w * .2)},{n(y0 + vy * w * .2)} L{n(x1 + vx * w * .2)},{n(y1 + vy * w * .2)}" stroke="{WOOD_LIGHT}" '
         f'stroke-width="{n(w * .3)}" stroke-linecap="round" opacity=".7"/>']
    # 矢羽（三枚のうち見える二枚）
    for side in (-1, 1):
        a = (x0 + ux * w * .6, y0 + uy * w * .6)
        b = (x0 + ux * w * 4.4, y0 + uy * w * 4.4)
        c = (x0 - ux * w * .4 + vx * side * w * 2.2, y0 - uy * w * .4 + vy * side * w * 2.2)
        o.append(f'<path d="M{n(a[0])},{n(a[1])} L{n(b[0])},{n(b[1])} L{n(c[0])},{n(c[1])}Z" fill="#e8dcc0" stroke="{ink}" stroke-width="2" stroke-linejoin="round"/>')
    # 帯金
    for t in (.3, .62):
        bx, by = x0 + dx * t, y0 + dy * t
        o.append(f'<path d="M{n(bx + vx * w * .7)},{n(by + vy * w * .7)} L{n(bx - vx * w * .7)},{n(by - vy * w * .7)}" stroke="{IRON_DARK}" stroke-width="{n(w * .5)}"/>')
    if head:
        tip = (x1 + ux * w * 3.2, y1 + uy * w * 3.2)
        o.append(f'<path d="M{n(x1 + vx * w * 1.3)},{n(y1 + vy * w * 1.3)} L{n(tip[0])},{n(tip[1])} L{n(x1 - vx * w * 1.3)},{n(y1 - vy * w * 1.3)} '
                 f'L{n(x1 - ux * w * .4)},{n(y1 - uy * w * .4)}Z" fill="{IRON}" stroke="{ink}" stroke-width="2.4" stroke-linejoin="round"/>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 地上へ落ちたヴァルガ
# ---------------------------------------------------------------------------
def _cell(V, kind, direction, pre, hx, hy, rot=0.0, k=None):
    """頭のセルを、中心が (hx, hy) に来るように置く（rot は度）。"""
    k = V.kh if k is None else k
    return (f'<g transform="translate({n(hx)} {n(hy)}) rotate({n(rot)}) translate({n(-64 * k)} {n(-64 * k)}) scale({round(k, 4):g})">'
            f'{namespace(V.data[kind][direction], pre)}</g>')


def _neck(d, r, w=1.0):
    return (f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{n(30 * w)}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="{r["neck"]}" stroke-width="{n(24 * w)}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="#c65a3e" stroke-width="{n(10 * w)}" stroke-dasharray="5 9" stroke-linecap="round" opacity=".7"/>')


def _hole(cx, cy, rx, ry, R, fill, edge, k=9):
    pts = []
    for i in range(k):
        a = 2 * math.pi * i / k + R.uniform(-.2, .2)
        f = R.uniform(.55, 1.0) if i % 2 else R.uniform(.9, 1.15)
        pts.append((cx + math.cos(a) * rx * f, cy + math.sin(a) * ry * f))
    d = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z"
    return f'<path d="{d}" fill="{fill}" stroke="{edge}" stroke-width="3" stroke-linejoin="round"/>'


CENTER_HEAD = (-6, -330)      # 三つ目の頭の中心（首をもたげたとき）
CENTER_NECK_BASE = (0, -112)
CENTER_FALLEN = (-6, -40)     # 手前へ倒れた後の頭の中心
SIDE_HEADS = ((-262, -40, -86), (268, -40, 86))   # 倒れた左右の頭（中心と回転）


def fallen_varga(V, p, hole_fill, center_cls="", neck_cls=""):
    """地上へ落ちたヴァルガ（原点は胴の下端の中央。M12と同じ大きさ）。defs には V.defs(p) と、{p}dead のフィルターが要る。"""
    r = V.rig
    k = V.kh
    o = []
    # 尾（右へ地面を這う）
    o.append(f'<path d="M24,-24 Q140,-8 236,6 Q310,16 372,0 Q322,28 230,24 Q130,16 14,2Z" fill="{r["membrane"]}" stroke="{INK}" stroke-width="3"/>')
    # 地面へ垂れた翼（裂けて穴があく）。左の翼に大型対空ボウガンの矢
    R = random.Random(1313)
    for s in (-1, 1):
        wing = (f'M{s * 26},-96 L{s * 160},-226 L{s * 318},-196 L{s * 452},-8 Q{s * 392},-24 {s * 342},-2 Q{s * 292},-22 {s * 238},-4 '
                f'Q{s * 182},-32 {s * 122},-18 Q{s * 72},-42 {s * 30},-56Z')
        g = [f'<path d="{wing}" fill="{r["membrane"]}" stroke="{INK}" stroke-width="3.4" stroke-linejoin="round"/>',
             f'<path d="M{s * 26},-96 L{s * 160},-226 L{s * 122},-18 Q{s * 72},-42 {s * 30},-56Z" fill="{INK}" opacity=".3"/>',
             f'<path d="M{s * 160},-226 L{s * 318},-196 L{s * 452},-8 Q{s * 392},-24 {s * 342},-2Z" fill="#a0423e" opacity=".3"/>']
        # 裂け目と穴
        if s < 0:
            g.append(_hole(-262, -96, 30, 22, R, hole_fill, INK))
            g.append(f'<path d="M-200,-10 L-214,-58 L-196,-80 L-226,-112 L-206,-4Z" fill="{hole_fill}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
        else:
            g.append(_hole(214, -110, 24, 18, R, hole_fill, INK))
            g.append(f'<path d="M352,-6 L330,-60 L352,-84 L318,-118 L300,-70 L318,-4Z" fill="{hole_fill}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
        g.append(f'<path d="M{s * 26},-96 L{s * 160},-226 L{s * 318},-196" fill="none" stroke="{r["bone"]}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>')
        for bx, by in ((452, -8), (342, -2), (238, -4)):
            g.append(f'<path d="M{s * 318},-196 L{s * bx},{by}" stroke="{r["bone"]}" stroke-width="6" stroke-linecap="round"/>')
        g.append(f'<path d="M{s * 160},-226 L{s * 122},-18" stroke="{r["bone"]}" stroke-width="5" stroke-linecap="round"/>')
        o.append("".join(g))
    o.append(bolt(-392, -232, -286, -128, 10, head=False)
             + f'<path d="M-298,-138 l-12,-10 m12,10 l14,-6 m-14,6 l-4,16" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
    # 倒れた左右の頭と首（暗く沈める。すでに崩れ始めている）
    dead = []
    for (hx, hy, rot), direction in zip(SIDE_HEADS, ("front_right", "front_left")):
        s = -1 if hx < 0 else 1
        end = (hx - s * 40, hy - 4)
        dead.append(_neck(f"M{s * 20},-108 Q{s * 150},-128 {n(end[0])},{n(end[1])}", r))
        dead.append(f'<ellipse cx="{n(hx)}" cy="{n(hy + 36)}" rx="70" ry="12" fill="#000" opacity=".35"/>')
        dead.append(_cell(V, "head", direction, f"{p}h-", hx, hy, rot))
    # 胴（セル。少し沈む）
    o.append(f'<g transform="translate(-64 -120)">{namespace(V.data["body"]["front"], f"{p}b-")}</g>')
    o.append(f'<g filter="url(#{p}dead)">{"".join(dead)}</g>')
    # 三つ目の頭と首（首をもたげる。呼び出し側のクラスで手前へ倒す）
    bx, by = CENTER_NECK_BASE
    hx, hy = CENTER_HEAD
    neck = f"M{bx},{by} Q34,-214 {hx},{n(hy + 34 * k)}"
    o.append(f'<g class="{neck_cls}" style="transform-origin:{bx}px {by}px">{_neck(neck, r)}</g>')
    o.append(f'<g class="{center_cls}" style="transform-origin:{n(hx)}px {n(hy)}px">{_cell(V, "head", "front", f"{p}h-", hx, hy)}</g>')
    return "".join(o)


def mist(R, cls, blobs, color="#140c18"):
    """黒い霧の塊。blobs は (x, y, w, h, 遅れ秒)。"""
    return "".join(f'<path class="{cls}" d="{cloud(x - w / 2, y + h / 2, w, h, R.randrange(4, 7), R)}" fill="{color}" '
                   f'style="animation-delay:{n(dl)}s"/>' for x, y, w, h, dl in blobs)


# ---------------------------------------------------------------------------
# 大型対空ボウガンの射台
# ---------------------------------------------------------------------------
TOWER_DECK = 262


def ballista_tower(ink="#2a1f16", aim=-34):
    """射台（原点は台の下端の中央）。ピノの木組みの台に、ベルクの金属機構のボウガン。aim は筒先の向き（度。負で上向き）。"""
    o = []
    # 奥の柱（暗く）と手前の柱
    for x0, x1 in ((-46, -34), (94, 80)):
        o.append(f'<path d="M{x0 - 7},-12 L{x1 - 6},-{TOWER_DECK} L{x1 + 6},-{TOWER_DECK} L{x0 + 7},-12Z" fill="{WOOD_DARK}" stroke="{ink}" stroke-width="2.6"/>')
    for x0, x1 in ((-74, -58), (74, 58)):
        o.append(f'<path d="M{x0 - 9},0 L{x1 - 8},-{TOWER_DECK} L{x1 + 8},-{TOWER_DECK} L{x0 + 9},0Z" fill="{WOOD}" stroke="{ink}" stroke-width="3"/>'
                 f'<path d="M{x0 + 2},0 L{x1 + 2},-{TOWER_DECK} L{x1 + 8},-{TOWER_DECK} L{x0 + 9},0Z" fill="{WOOD_DARK}" opacity=".35"/>')
    # 筋交いと横木
    for y0, y1 in ((-26, -128), (-140, -246)):
        o.append(f'<path d="M-66,{y0} L62,{y1} M66,{y0} L-62,{y1}" stroke="{ink}" stroke-width="13" stroke-linecap="round"/>'
                 f'<path d="M-66,{y0} L62,{y1} M66,{y0} L-62,{y1}" stroke="{WOOD}" stroke-width="8" stroke-linecap="round"/>')
    for y in (-134, -244):
        o.append(f'<rect x="-80" y="{y - 7}" width="160" height="14" fill="{WOOD_LIGHT}" stroke="{ink}" stroke-width="2.6"/>')
    # はしご（右）
    o.append(f'<path d="M96,0 L88,-{TOWER_DECK} M124,0 L114,-{TOWER_DECK}" stroke="{ink}" stroke-width="9" stroke-linecap="round"/>'
             f'<path d="M96,0 L88,-{TOWER_DECK} M124,0 L114,-{TOWER_DECK}" stroke="{WOOD_LIGHT}" stroke-width="5" stroke-linecap="round"/>'
             + "".join(f'<path d="M{n(96 - 8 * t)},{n(-t * TOWER_DECK)} L{n(124 - 10 * t)},{n(-t * TOWER_DECK)}" stroke="{WOOD_DARK}" stroke-width="4"/>'
                       for t in (i / 11 for i in range(1, 11))))
    # 床板と手すり
    d = TOWER_DECK
    o.append(f'<path d="M-104,-{d} L128,-{d} L128,-{d - 18} L-104,-{d - 18}Z" fill="{WOOD_LIGHT}" stroke="{ink}" stroke-width="3"/>'
             + "".join(f'<path d="M{x},-{d} L{x},-{d - 18}" stroke="{WOOD_DARK}" stroke-width="2"/>' for x in range(-80, 128, 26)))
    for x in (-98, -40, 70, 122):
        o.append(f'<path d="M{x},-{d} L{x},-{d + 40}" stroke="{ink}" stroke-width="8" stroke-linecap="round"/>'
                 f'<path d="M{x},-{d} L{x},-{d + 40}" stroke="{WOOD}" stroke-width="4" stroke-linecap="round"/>')
    o.append(f'<path d="M-98,-{d + 40} L122,-{d + 40}" stroke="{ink}" stroke-width="9" stroke-linecap="round"/>'
             f'<path d="M-98,-{d + 40} L122,-{d + 40}" stroke="{WOOD_LIGHT}" stroke-width="5" stroke-linecap="round"/>')
    # ボウガン（回転台・台木・鉄の弓・弦・矢・巻き上げ車）
    px, py = 0, -d - 44
    a = math.radians(aim)
    ux, uy = math.cos(a), math.sin(a)
    vx, vy = -uy, ux
    P = lambda t, s=0.0: (px + ux * t + vx * s, py + uy * t + vy * s)
    o.append(f'<path d="M-30,-{d} L30,-{d} L16,{py + 4} L-16,{py + 4}Z" fill="{IRON}" stroke="{ink}" stroke-width="3"/>'
             f'<circle cx="{px}" cy="{py}" r="12" fill="{IRON_DARK}" stroke="{ink}" stroke-width="2.6"/>'
             f'<circle cx="{px}" cy="{py}" r="4" fill="{IRON_LIGHT}"/>')
    # 巻き上げ車（後ろ）
    wx, wy = P(-96, 10)
    o.append(f'<circle cx="{n(wx)}" cy="{n(wy)}" r="24" fill="none" stroke="{ink}" stroke-width="9"/>'
             f'<circle cx="{n(wx)}" cy="{n(wy)}" r="24" fill="none" stroke="{IRON}" stroke-width="5"/>'
             + "".join(f'<path d="M{n(wx)},{n(wy)} L{n(wx + 22 * math.cos(t))},{n(wy + 22 * math.sin(t))}" stroke="{IRON_DARK}" stroke-width="4"/>'
                       for t in (i * math.pi / 3 for i in range(6)))
             + f'<circle cx="{n(wx)}" cy="{n(wy)}" r="6" fill="{IRON_LIGHT}" stroke="{ink}" stroke-width="2"/>')
    # 台木（木）と帯金（鉄）
    s0, s1 = P(-110), P(168)
    o.append(f'<path d="M{n(s0[0])},{n(s0[1])} L{n(s1[0])},{n(s1[1])}" stroke="{ink}" stroke-width="28" stroke-linecap="square"/>'
             f'<path d="M{n(s0[0])},{n(s0[1])} L{n(s1[0])},{n(s1[1])}" stroke="{WOOD}" stroke-width="22" stroke-linecap="square"/>'
             f'<path d="M{n(P(-110, -6)[0])},{n(P(-110, -6)[1])} L{n(P(168, -6)[0])},{n(P(168, -6)[1])}" stroke="{WOOD_LIGHT}" stroke-width="5"/>')
    for t in (-70, 10, 90, 150):
        b0, b1 = P(t, -15), P(t, 15)
        o.append(f'<path d="M{n(b0[0])},{n(b0[1])} L{n(b1[0])},{n(b1[1])}" stroke="{IRON_DARK}" stroke-width="10"/>'
                 f'<circle cx="{n(P(t, -9)[0])}" cy="{n(P(t, -9)[1])}" r="2.2" fill="{IRON_LIGHT}"/>')
    # 鉄の弓（前の端で、台木と直角に張り、後ろへ反る）と弦
    f0 = P(150)
    t1, t2 = P(122, -88), P(122, 88)
    c1, c2 = P(162, -50), P(162, 50)
    bow = f"M{n(t1[0])},{n(t1[1])} Q{n(c1[0])},{n(c1[1])} {n(f0[0])},{n(f0[1])} Q{n(c2[0])},{n(c2[1])} {n(t2[0])},{n(t2[1])}"
    nock = P(-34)
    o.append(f'<path d="M{n(t1[0])},{n(t1[1])} L{n(nock[0])},{n(nock[1])} L{n(t2[0])},{n(t2[1])}" fill="none" stroke="#efe4c8" stroke-width="3"/>')
    o.append(f'<path d="{bow}" fill="none" stroke="{ink}" stroke-width="17" stroke-linecap="round"/>'
             f'<path d="{bow}" fill="none" stroke="{IRON}" stroke-width="11" stroke-linecap="round"/>'
             f'<path d="{bow}" fill="none" stroke="{IRON_LIGHT}" stroke-width="3" stroke-linecap="round" opacity=".7" transform="translate(-2 -2)"/>')
    for t in (t1, t2):
        o.append(f'<circle cx="{n(t[0])}" cy="{n(t[1])}" r="7" fill="{IRON_DARK}" stroke="{ink}" stroke-width="2"/>')
    # 弓の留め具（鉄の箱）と、つがえた矢
    m0, m1, m2, m3 = P(132, -22), P(172, -22), P(172, 22), P(132, 22)
    o.append(f'<path d="M{n(m0[0])},{n(m0[1])} L{n(m1[0])},{n(m1[1])} L{n(m2[0])},{n(m2[1])} L{n(m3[0])},{n(m3[1])}Z" fill="{IRON_DARK}" stroke="{ink}" stroke-width="2.6"/>')
    b0, b1 = P(-30, -2), P(196, -2)
    o.append(bolt(b0[0], b0[1], b1[0], b1[1], 8, ink))
    return "".join(o)


# ---------------------------------------------------------------------------
# 戦いの傷（再建した神殿の座標）
# ---------------------------------------------------------------------------
ROOF_HOLES = ((598, 196, 66, 34), (1036, 168, 54, 30))   # 大屋根の穴（中心と半径）


def temple_damage(p, R, pal, smoke_cls="", hole_fill="#24160e"):
    """temple_rebuilt(p, ...) の上に重ねる。屋根の切り抜き（{p}roofclip）を使う。"""
    c = pal
    o = [f'<defs><radialGradient id="{p}soot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1a120c" stop-opacity=".8"/>'
         f'<stop offset=".55" stop-color="#1a120c" stop-opacity=".35"/><stop offset="1" stop-color="#1a120c" stop-opacity="0"/></radialGradient></defs>']
    # 大屋根の焦げと穴（穴の奥に垂木、縁に折れた葺き板）
    roof = []
    for cx, cy, rx, ry in ROOF_HOLES:
        roof.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx * 2.4}" ry="{ry * 2.2}" fill="url(#{p}soot)"/>')
    o.append(f'<g clip-path="url(#{p}roofclip)">{"".join(roof)}</g>')
    for cx, cy, rx, ry in ROOF_HOLES:
        pts = []
        for i in range(12):
            a = 2 * math.pi * i / 12
            f = R.uniform(.62, .86) if i % 2 else R.uniform(.95, 1.12)
            pts.append((cx + math.cos(a) * rx * f, cy + math.sin(a) * ry * f))
        d = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z"
        o.append(f'<path d="{d}" fill="{hole_fill}" stroke="{c["ink"]}" stroke-width="3" stroke-linejoin="round"/>'
                 f'<path d="M{n(cx - rx * .8)},{n(cy - ry * .2)} L{n(cx + rx * .8)},{n(cy - ry * .45)} M{n(cx - rx * .7)},{n(cy + ry * .4)} L{n(cx + rx * .75)},{n(cy + ry * .2)}" '
                 f'stroke="{c["wood_dark"]}" stroke-width="5" stroke-linecap="round"/>')
        for x, y in pts[::2]:
            ex, ey = x + (x - cx) * .22, y + (y - cy) * .22
            o.append(f'<path d="M{n(ex)},{n(ey)} L{n(x + (cx - x) * .12)},{n(y + (cy - y) * .12)}" stroke="{c["roof_light"]}" stroke-width="4" stroke-linecap="round"/>')
        if smoke_cls:
            for j in range(3):
                o.append(f'<path class="{smoke_cls}" d="{cloud(cx - 30 + j * 14, cy - 10, 60, 34, 4, R)}" fill="#d8d2cc" opacity=".55" '
                         f'style="animation-delay:-{n(j * 1.1)}s"/>')
    # 欠けた軒（右）と、焼け落ちた垂木
    o.append(f'<path d="M1172,262 L1196,282 L1214,268 L1236,290 L1262,272 L1286,288 L1300,262Z" fill="{hole_fill}" stroke="{c["ink"]}" stroke-width="3" stroke-linejoin="round"/>')
    # 壁のすす（窓の上へ立ちのぼる）とひび
    for b in (1, 6):
        cx = (T_COLS[b] + T_COLS[b + 1]) / 2
        o.append(f'<path d="M{n(cx - 26)},452 Q{n(cx - 40)},392 {n(cx - 14)},346 Q{n(cx + 4)},372 {n(cx + 10)},340 Q{n(cx + 40)},392 {n(cx + 26)},452Z" '
                 f'fill="#1a120c" opacity=".45"/>')
    cx6 = (T_COLS[6] + T_COLS[7]) / 2
    o.append(f'<path d="M{n(cx6 - 22)},456 L{n(cx6 - 24)},400 L{n(cx6 - 8)},386 L{n(cx6 + 6)},398 L{n(cx6 + 20)},380 L{n(cx6 + 24)},458Z" '
             f'fill="{hole_fill}" stroke="{c["wood_dark"]}" stroke-width="4" stroke-linejoin="round"/>')
    for x0, pts in ((T_COLS[2] + 40, ((0, 340), (-10, 372), (6, 398), (-6, 430), (4, 468))),
                    (T_COLS[7] + 52, ((0, 344), (8, 380), (-6, 404), (6, 440)))):
        o.append(f'<path d="M' + " L".join(f"{n(x0 + dx)},{y}" for dx, y in pts) + f'" fill="none" stroke="{c["ink"]}" stroke-width="2.4" opacity=".7"/>')
    # 基壇に落ちた葺き板と石
    for x, y, w, rot in ((440, 534, 70, -12), (1120, 528, 84, 9), (1210, 556, 60, -20)):
        o.append(f'<rect x="{n(x - w / 2)}" y="{n(y - 6)}" width="{w}" height="12" fill="{c["roof"]}" stroke="{c["ink"]}" stroke-width="2.4" '
                 f'transform="rotate({rot} {x} {y})"/>')
    for x, y, rr in ((560, 584, 12), (1040, 586, 10), (1270, 584, 14)):
        o.append(f'<path d="M{x - rr},{y + 6} L{x - rr * .7},{y - rr * .6} L{x + rr * .4},{y - rr} L{x + rr},{y - rr * .2} L{x + rr * .8},{y + 6}Z" '
                 f'fill="{c["stone_shade"]}" stroke="{c["ink"]}" stroke-width="2.4"/>')
    return "".join(o)


T_COLS = [380 + 105 * i for i in range(9)]    # temple.COLS と同じ


# ---------------------------------------------------------------------------
# 選択の柱（四つの枠すべてに印）
# ---------------------------------------------------------------------------
def build_mark(cx, cy, r, gold=GOLD, ink="#2a1f16"):
    """建築の印：積んだ石と金槌。"""
    return (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="none" stroke="{gold}" stroke-width="{n(r * .12)}"/>'
            f'<path d="M{n(cx - r * .6)},{n(cy + r * .5)} L{n(cx + r * .1)},{n(cy + r * .5)} L{n(cx + r * .1)},{n(cy + r * .16)} L{n(cx - r * .6)},{n(cy + r * .16)}Z '
            f'M{n(cx - r * .44)},{n(cy + r * .16)} L{n(cx - r * .02)},{n(cy + r * .16)} L{n(cx - r * .02)},{n(cy - r * .16)} L{n(cx - r * .44)},{n(cy - r * .16)}Z" '
            f'fill="none" stroke="{gold}" stroke-width="{n(r * .1)}" stroke-linejoin="round"/>'
            f'<path d="M{n(cx + r * .05)},{n(cy + r * .38)} L{n(cx + r * .42)},{n(cy - r * .28)}" stroke="{gold}" stroke-width="{n(r * .13)}" stroke-linecap="round"/>'
            f'<path d="M{n(cx + r * .12)},{n(cy - r * .5)} L{n(cx + r * .64)},{n(cy - r * .2)} L{n(cx + r * .54)},{n(cy - r * .02)} L{n(cx + r * .02)},{n(cy - r * .32)}Z" '
            f'fill="{gold}" stroke="{ink}" stroke-width="{n(r * .04)}"/>')


def food_mark(cx, cy, r, gold=GOLD, ink="#2a1f16"):
    """食料の印：湯気の立つ椀。"""
    return (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="none" stroke="{gold}" stroke-width="{n(r * .12)}"/>'
            f'<path d="M{n(cx - r * .6)},{n(cy + r * .06)} L{n(cx + r * .6)},{n(cy + r * .06)} Q{n(cx + r * .52)},{n(cy + r * .56)} {n(cx)},{n(cy + r * .58)} '
            f'Q{n(cx - r * .52)},{n(cy + r * .56)} {n(cx - r * .6)},{n(cy + r * .06)}Z" fill="{gold}" stroke="{ink}" stroke-width="{n(r * .04)}"/>'
            + "".join(f'<path d="M{n(cx + dx)},{n(cy - r * .06)} Q{n(cx + dx - r * .16)},{n(cy - r * .24)} {n(cx + dx)},{n(cy - r * .38)} '
                      f'Q{n(cx + dx + r * .16)},{n(cy - r * .52)} {n(cx + dx)},{n(cy - r * .66)}" fill="none" stroke="{gold}" stroke-width="{n(r * .09)}" '
                      f'stroke-linecap="round"/>' for dx in (-r * .2, r * .2)))


def guard_mark(cx, cy, r, gold=GOLD, ink="#2a1f16"):
    """防衛の印：盾。"""
    return (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="none" stroke="{gold}" stroke-width="{n(r * .12)}"/>'
            f'<path d="M{n(cx)},{n(cy - r * .58)} L{n(cx + r * .46)},{n(cy - r * .4)} L{n(cx + r * .42)},{n(cy + r * .08)} Q{n(cx + r * .32)},{n(cy + r * .44)} '
            f'{n(cx)},{n(cy + r * .62)} Q{n(cx - r * .32)},{n(cy + r * .44)} {n(cx - r * .42)},{n(cy + r * .08)} L{n(cx - r * .46)},{n(cy - r * .4)}Z" '
            f'fill="none" stroke="{gold}" stroke-width="{n(r * .12)}" stroke-linejoin="round"/>'
            f'<path d="M{n(cx)},{n(cy - r * .4)} L{n(cx)},{n(cy + r * .44)} M{n(cx - r * .3)},{n(cy - r * .06)} L{n(cx + r * .3)},{n(cy - r * .06)}" '
            f'stroke="{gold}" stroke-width="{n(r * .09)}" stroke-linecap="round"/>')


UPPER_MARKS = (build_mark, food_mark, guard_mark)   # 下から二つ目～四つ目の枠


def selection_pillar_done(x, base, top, w=120, mark_cls=""):
    """M11の選択の柱（いちばん下の枠にアサギの大工の印）に、上の三つの枠の印を加えたもの。"""
    o = [selection_pillar(x, base, top, w, mark_cls)]
    span = base - 30 - top
    for i, mark in enumerate(UPPER_MARKS, start=1):
        cy = base - 30 - span * (i + .5) / 4
        o.append(f'<rect x="{n(x - w * .34)}" y="{n(cy - w * .34)}" width="{n(w * .68)}" height="{n(w * .68)}" rx="10" fill="none" '
                 f'stroke="{STONE_DARK}" stroke-width="2.4" opacity=".9"/>'
                 f'<circle class="{mark_cls}" cx="{n(x)}" cy="{n(cy)}" r="{n(w * .44)}" fill="#ffd77a" opacity=".3"/>'
                 + mark(x, cy, w * .26))
    return "".join(o)
