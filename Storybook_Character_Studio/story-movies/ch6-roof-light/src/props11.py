"""第6章の結び「大屋根の灯」の小道具。

  altar             要石を据えた祭壇（二段の石の台。前の面の中央に要石、上に授職の灯の石皿）
  flame             授職の灯の炎（下を原点に上へ伸びる）
  selection_pillar  選択の柱（祭壇とは別の、四角い石の記念柱。仕事の印を刻む枠が縦に並び、今はアサギの大工の印だけ）
  carpenter_mark    アサギの大工の印（曲尺と木槌を丸い枠に刻んだもの）
  kitchen           共同台所（石の腰壁と木の壁、わら屋根、かまどの焚き口と煙出し）
  pot               ミナが運ぶ鍋（セル座標。湯気つき）
  varga_shadow      三つ首の竜の影（輪郭だけ。三本の首と角のある頭、大きな翼、尾。左へ飛ぶ）
  gargoyle_shadow   ガーゴイルの影（輪郭だけ。角とコウモリの翼。左へ飛ぶ）

ヴァルガとガーゴイルは名前・色・全身を見せず、Studioの造形（prototypes/varuga-8dir・gargoyle-8dir）の輪郭の特徴
（三つの頭と角・大きな翼・尾／角と翼の小さな体）だけを影にする。座標は呼び出し側で置く。
"""
from helpers import n

INK = "#2a1f16"
STONE = "#bdb3a2"
STONE_LIGHT = "#ddd4c2"
STONE_DARK = "#8a8070"


def book_mark(cx, cy, r, gold, ink):
    """職業の書の紋章（要石の面に刻む）。共通部品 temple.book_emblem と同じ形。"""
    from temple import book_emblem
    return book_emblem(cx, cy, r, gold, ink)


def altar(cx, base, w=560, glow_cls=""):
    """要石を据えた祭壇（下端の中央が (cx, base)）。前の面の中央の要石は、ほかの石と色の違う青みの石で、職業の書の紋章が光る。"""
    h1, h2 = 120, 70
    x0, x1 = cx - w / 2, cx + w / 2
    o = [f'<path d="M{n(x0 - 30)},{n(base)} L{n(x1 + 30)},{n(base)} L{n(x1 + 30)},{n(base - 26)} L{n(x0 - 30)},{n(base - 26)}Z" fill="{STONE_DARK}" stroke="{INK}" stroke-width="3"/>',
         f'<path d="M{n(x0)},{n(base - 26)} L{n(x1)},{n(base - 26)} L{n(x1)},{n(base - 26 - h1)} L{n(x0)},{n(base - 26 - h1)}Z" fill="{STONE}" stroke="{INK}" stroke-width="3"/>',
         f'<path d="M{n(x0 + 40)},{n(base - 26 - h1)} L{n(x1 - 40)},{n(base - 26 - h1)} L{n(x1 - 40)},{n(base - 26 - h1 - h2)} L{n(x0 + 40)},{n(base - 26 - h1 - h2)}Z" '
         f'fill="{STONE_LIGHT}" stroke="{INK}" stroke-width="3"/>',
         f'<path d="M{n(x0 + 30)},{n(base - 26 - h1 - h2 - 14)} L{n(x1 - 30)},{n(base - 26 - h1 - h2 - 14)} L{n(x1 - 30)},{n(base - 26 - h1 - h2)} '
         f'L{n(x0 + 30)},{n(base - 26 - h1 - h2)}Z" fill="{STONE}" stroke="{INK}" stroke-width="3"/>']
    # 石の目地
    for y in (base - 26 - h1 / 2,):
        o.append(f'<path d="M{n(x0)},{n(y)} L{n(x1)},{n(y)}" stroke="{STONE_DARK}" stroke-width="2"/>')
    for x in (x0 + 110, x1 - 110):
        o.append(f'<path d="M{n(x)},{n(base - 26)} L{n(x)},{n(base - 26 - h1)}" stroke="{STONE_DARK}" stroke-width="2"/>')
    # 要石（中央。くさびの形に少し張り出す）と紋章
    ky = base - 26 - h1 / 2
    o.append(f'<path d="M{n(cx - 62)},{n(ky - 52)} L{n(cx + 62)},{n(ky - 52)} L{n(cx + 50)},{n(ky + 54)} L{n(cx - 50)},{n(ky + 54)}Z" '
             f'fill="#9fb0bf" stroke="{INK}" stroke-width="3.4"/>'
             f'<path d="M{n(cx + 18)},{n(ky - 52)} L{n(cx + 62)},{n(ky - 52)} L{n(cx + 50)},{n(ky + 54)} L{n(cx + 12)},{n(ky + 54)}Z" fill="#7f90a2" opacity=".6"/>'
             f'<circle class="{glow_cls}" cx="{n(cx)}" cy="{n(ky)}" r="46" fill="#ffd77a" opacity=".45"/>'
             + book_mark(cx, ky, 26, "#f0c860", INK))
    top = base - 26 - h1 - h2 - 14
    # 灯の石皿
    o.append(f'<path d="M{n(cx - 54)},{n(top)} L{n(cx + 54)},{n(top)} L{n(cx + 40)},{n(top - 22)} L{n(cx - 40)},{n(top - 22)}Z" fill="{STONE_DARK}" stroke="{INK}" stroke-width="3"/>'
             f'<ellipse cx="{n(cx)}" cy="{n(top - 22)}" rx="46" ry="9" fill="#5a4a3a" stroke="{INK}" stroke-width="2.6"/>')
    return "".join(o), (cx, top - 24)


def flame(cls_outer, cls_inner, x, y, k=1.0):
    """授職の灯の炎（下端が (x, y)）。"""
    return (f'<g transform="translate({n(x)} {n(y)}) scale({k})">'
            f'<path class="{cls_outer}" d="M-30,0 Q-40,-40 -12,-84 Q-8,-56 4,-70 Q10,-110 2,-140 Q44,-96 38,-44 Q36,-14 30,0Z" fill="#ff9a3a"/>'
            f'<path class="{cls_inner}" d="M-16,0 Q-20,-30 -2,-60 Q4,-40 12,-54 Q24,-30 18,0Z" fill="#ffe08a"/>'
            f'<path class="{cls_inner}" d="M-6,0 Q-6,-16 2,-30 Q8,-16 8,0Z" fill="#fffbe8"/></g>')


def carpenter_mark(cx, cy, r, gold="#f0c860", ink=INK):
    """アサギの大工の印：丸い枠に、曲尺（L字の物差し）と木槌を組み合わせて刻む。"""
    return (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="none" stroke="{gold}" stroke-width="{n(r * .12)}"/>'
            f'<path d="M{n(cx - r * .5)},{n(cy - r * .52)} L{n(cx - r * .5)},{n(cy + r * .44)} L{n(cx + r * .5)},{n(cy + r * .44)}" fill="none" '
            f'stroke="{gold}" stroke-width="{n(r * .16)}" stroke-linecap="square"/>'
            f'<path d="M{n(cx - r * .1)},{n(cy + r * .22)} L{n(cx + r * .42)},{n(cy - r * .3)}" stroke="{gold}" stroke-width="{n(r * .12)}" stroke-linecap="round"/>'
            f'<path d="M{n(cx + r * .18)},{n(cy - r * .52)} L{n(cx + r * .62)},{n(cy - r * .08)} L{n(cx + r * .46)},{n(cy + r * .08)} L{n(cx + r * .02)},{n(cy - r * .36)}Z" '
            f'fill="{gold}" stroke="{ink}" stroke-width="{n(r * .04)}"/>')


def selection_pillar(x, base, top, w=120, mark_cls=""):
    """選択の柱（下端の中央が (x, base)、上端 top）。仕事の印を刻む枠が縦に並ぶ。今はいちばん下の枠にアサギの大工の印だけ。"""
    o = [f'<path d="M{n(x - w / 2 - 14)},{n(base)} L{n(x + w / 2 + 14)},{n(base)} L{n(x + w / 2 + 14)},{n(base - 30)} L{n(x - w / 2 - 14)},{n(base - 30)}Z" '
         f'fill="{STONE_DARK}" stroke="{INK}" stroke-width="3"/>',
         f'<path d="M{n(x - w / 2)},{n(base - 30)} L{n(x + w / 2)},{n(base - 30)} L{n(x + w / 2)},{n(top)} L{n(x - w / 2)},{n(top)}Z" fill="{STONE_LIGHT}" stroke="{INK}" stroke-width="3"/>',
         f'<path d="M{n(x + w / 2 - 26)},{n(base - 30)} L{n(x + w / 2)},{n(base - 30)} L{n(x + w / 2)},{n(top)} L{n(x + w / 2 - 26)},{n(top)}Z" fill="{STONE}" opacity=".8"/>',
         f'<path d="M{n(x - w / 2 - 12)},{n(top)} L{n(x + w / 2 + 12)},{n(top)} L{n(x + w / 2 + 12)},{n(top - 24)} L{n(x - w / 2 - 12)},{n(top - 24)}Z" '
         f'fill="{STONE}" stroke="{INK}" stroke-width="3"/>']
    # 印を刻む枠（下から上へ）。いちばん下にアサギの印
    span = base - 30 - top
    rows = 4
    for i in range(rows):
        cy = base - 30 - span * (i + .5) / rows
        o.append(f'<rect x="{n(x - w * .34)}" y="{n(cy - w * .34)}" width="{n(w * .68)}" height="{n(w * .68)}" rx="10" fill="none" '
                 f'stroke="{STONE_DARK}" stroke-width="2.4" opacity="{.9 if i == 0 else .45}"/>')
        if i == 0:
            o.append(f'<circle class="{mark_cls}" cx="{n(x)}" cy="{n(cy)}" r="{n(w * .44)}" fill="#ffd77a" opacity=".3"/>'
                     + carpenter_mark(x, cy, w * .26))
    return "".join(o)


def kitchen(x, base, s=1.0, fire_cls=""):
    """共同台所（下端の中央が (x, base)）：石の腰壁、木の壁、わら屋根、かまどの焚き口、煙出し。"""
    k = s
    o = [f'<g transform="translate({n(x)} {n(base)}) scale({k})">',
         '<path d="M-190,0 L190,0 L190,-60 L-190,-60Z" fill="#9a907f" stroke="#2a1f16" stroke-width="3"/>',
         '<path d="M-190,-60 L190,-60 L190,-150 L-190,-150Z" fill="#a8743f" stroke="#2a1f16" stroke-width="3"/>',
         "".join(f'<path d="M{x0},-60 L{x0},-150" stroke="#7c5730" stroke-width="2"/>' for x0 in range(-160, 190, 40)),
         '<path d="M-226,-140 L0,-232 L226,-140 L206,-130 L0,-210 L-206,-130Z" fill="#c9a24e" stroke="#2a1f16" stroke-width="3" stroke-linejoin="round"/>',
         '<path d="M-210,-136 L0,-222 L210,-136" fill="none" stroke="#8a6a2a" stroke-width="3"/>',
         '<path d="M90,-232 L90,-270 L124,-270 L124,-210Z" fill="#7c5730" stroke="#2a1f16" stroke-width="3"/>',
         # かまどの焚き口（火）
         '<path d="M-150,0 L-150,-46 Q-110,-74 -70,-46 L-70,0Z" fill="#3a2a20" stroke="#2a1f16" stroke-width="3"/>',
         f'<path class="{fire_cls}" d="M-140,0 Q-140,-26 -120,-44 Q-118,-26 -108,-38 Q-90,-20 -80,0Z" fill="#ff9a3a"/>',
         f'<path class="{fire_cls}" d="M-126,0 Q-126,-16 -114,-28 Q-104,-14 -98,0Z" fill="#ffe08a"/>',
         # 窓の灯
         '<path d="M30,-120 L130,-120 L130,-80 L30,-80Z" fill="#ffcf7a" stroke="#2a1f16" stroke-width="3"/>',
         '<path d="M80,-120 L80,-80 M30,-100 L130,-100" stroke="#5a3a20" stroke-width="3"/>', '</g>']
    return "".join(o)


def pot(cx, cy, k=1.0, steam_cls=""):
    """ミナが両手で運ぶ鍋（セル座標）。湯気が立つ。"""
    return (f'<path d="M{n(cx - 16 * k)},{n(cy - 6 * k)} L{n(cx + 16 * k)},{n(cy - 6 * k)} Q{n(cx + 16 * k)},{n(cy + 10 * k)} {n(cx)},{n(cy + 11 * k)} '
            f'Q{n(cx - 16 * k)},{n(cy + 10 * k)} {n(cx - 16 * k)},{n(cy - 6 * k)}Z" fill="#4a4442" stroke="#2a1f16" stroke-width="1.6"/>'
            f'<ellipse cx="{n(cx)}" cy="{n(cy - 6 * k)}" rx="{n(16 * k)}" ry="{n(4 * k)}" fill="#e2b05a" stroke="#2a1f16" stroke-width="1.4"/>'
            f'<path d="M{n(cx - 19 * k)},{n(cy - 4 * k)} L{n(cx - 15 * k)},{n(cy - 4 * k)} M{n(cx + 15 * k)},{n(cy - 4 * k)} L{n(cx + 19 * k)},{n(cy - 4 * k)}" '
            f'stroke="#2a1f16" stroke-width="2.4" stroke-linecap="round"/>'
            + "".join(f'<path class="{steam_cls}" d="M{n(cx + dx * k)},{n(cy - 10 * k)} q{n(-3 * k)},{n(-5 * k)} 0,{n(-10 * k)} q{n(3 * k)},{n(-5 * k)} 0,{n(-10 * k)}" '
                      f'fill="none" stroke="#fff6e8" stroke-width="1.6" stroke-linecap="round" opacity=".8" style="animation-delay:-{d}s"/>'
                      for dx, d in ((-6, 0), (1, .5), (8, 1))))


def varga_shadow(color="#0b0f1e", wing_cls=""):
    """三つ首の竜の影（左へ飛ぶ。原点は胴の中心、幅およそ440）。三本の首の先に、それぞれ角のある頭。"""
    heads = ""
    for (nx, ny), (hx, hy), a in (((-40, -30), (-160, -120), -8), ((-50, -10), (-200, -40), 4), ((-30, 10), (-150, 50), 14)):
        heads += (f'<path d="M{nx},{ny - 12} Q{(nx + hx) / 2},{(ny + hy) / 2 - 30} {hx + 20},{hy - 8} L{hx + 22},{hy + 10} '
                  f'Q{(nx + hx) / 2 + 10},{(ny + hy) / 2 + 2} {nx},{ny + 12}Z" fill="{color}"/>'
                  f'<g transform="translate({hx} {hy}) rotate({a})"><path d="M30,-12 L-8,-16 L-34,-6 L-40,4 L-10,8 L30,12Z" fill="{color}"/>'
                  f'<path d="M14,-12 L22,-38 L26,-12Z M0,-14 L2,-34 L8,-14Z M-14,-12 L-22,-30 L-8,-14Z" fill="{color}"/></g>')
    wing_up = (f'<path class="{wing_cls}" d="M0,-30 L60,-150 L120,-210 L110,-150 L150,-180 L132,-118 L176,-130 L140,-70 L190,-60 L60,-10Z" fill="{color}"/>')
    wing_far = (f'<path d="M-10,-26 L-30,-130 L10,-170 L18,-120 L50,-140 L40,-90 L70,-80 L20,-20Z" fill="{color}" opacity=".85"/>')
    body = (f'<path d="M-60,-24 Q-20,-46 50,-30 Q110,-16 150,0 Q220,16 280,4 Q230,30 160,26 Q90,30 40,30 Q-30,34 -60,14Z" fill="{color}"/>'
            f'<path d="M10,26 L0,60 L16,62 L30,28Z M70,28 L66,62 L82,62 L88,26Z" fill="{color}"/>')
    return wing_far + body + heads + wing_up


def gargoyle_shadow(color="#10152a", wing_cls=""):
    """ガーゴイルの影（左へ飛ぶ。原点は胴の中心、幅およそ90）。角・コウモリの翼・尾。"""
    return (f'<path class="{wing_cls}" d="M-4,-6 L-26,-40 L-10,-34 L-6,-48 L8,-34 L20,-44 L18,-16Z" fill="{color}"/>'
            f'<path d="M-14,-10 Q-2,-18 12,-10 L16,8 Q4,14 -10,8Z" fill="{color}"/>'
            f'<path d="M-14,-10 L-24,-16 L-30,-8 L-22,-2 L-12,-2Z M-22,-16 L-24,-26 L-18,-17Z M-16,-14 L-14,-24 L-12,-14Z" fill="{color}"/>'
            f'<path d="M14,4 Q30,10 40,2 Q34,14 18,12Z" fill="{color}"/>'
            f'<path d="M0,-8 L18,-30 L34,-36 L30,-24 L42,-24 L30,-8Z" fill="{color}" opacity=".8"/>')
