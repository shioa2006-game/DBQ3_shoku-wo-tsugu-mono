"""第3章の結末ムービーの小道具：島の建物・田畑・木々・桟橋・灯台・船。

形はゲーム（dqb3-tsugumono-ch1-3 の src/game/blueprints.js）で建てたものに合わせる。
  - 船: 板の甲板、タール塗りの舷側（焦げ茶）、一段高い船尾楼と舵輪（真鍮）、船尾灯、6段の帆柱と帆桁、
        わらを織った大きな帆（生成り）。
  - 灯台: 石積みの塔、板の灯室、頂上の灯り。
  - 桟橋: 板張り、先端の灯り。 食堂: 白い壁と板の間、かまど。 社: 赤い鳥居と祭壇（水色の光）。
座標は各関数の原点からの相対値。id を使うものは prefix を付け、場面どうしで衝突しないようにする。
"""
import math

from helpers import n, smooth_d, cloud

INK = "#3b2a1c"        # 木・建物の輪郭
GREEN_INK = "#2d4a3a"  # 草木の輪郭
WOOD = "#c99c5f"       # 板
WOOD_DARK = "#7c5730"  # 丸太
TAR = "#5a3f24"        # 船の舷側
WALL = "#f2ecdc"       # 白い壁
THATCH = "#d8bd6a"     # わら屋根
STONE = "#9aa0a4"      # 石
TORII = "#c23b2a"
BRASS = "#d9b545"
SAIL = "#f3efe4"


# ---------------------------------------------------------------------------
# 船（横から。船首は +x、喫水線は y=0）
# ---------------------------------------------------------------------------
HULL = ("M-214,-118 L-132,-118 L-124,-80 L140,-80 Q200,-84 238,-122 C228,-78 212,-30 172,4 Q150,16 110,18 "
        "L-140,18 Q-188,14 -206,-26 Q-214,-60 -214,-118Z")
SHEER = "M-214,-118 L-132,-118 L-124,-80 L140,-80 Q200,-84 238,-122"
SAIL_D = "M-150,-446 L190,-446 Q216,-312 202,-176 Q22,-150 -162,-176 Q-178,-312 -150,-446Z"
MAST_X, MAST_TOP, YARD_Y = 20, -500, -452
WHEEL = (-170, -146)


def ship_defs(p):
    return (f'<linearGradient id="{p}hull" x1="0" y1="-120" x2="0" y2="20" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="#6d4c2c"/><stop offset=".55" stop-color="{TAR}"/><stop offset="1" stop-color="#3a2816"/></linearGradient>'
            f'<linearGradient id="{p}sail" x1="-170" y1="0" x2="215" y2="0" gradientUnits="userSpaceOnUse">'
            '<stop offset="0" stop-color="#ddd1b4"/><stop offset=".38" stop-color="#fbf8ee"/><stop offset=".7" stop-color="#f4eedf"/>'
            '<stop offset="1" stop-color="#d9cdae"/></linearGradient>'
            f'<clipPath id="{p}hullclip"><path d="{HULL}"/></clipPath>'
            f'<clipPath id="{p}sailclip"><path d="{SAIL_D}"/></clipPath>')


def ship_rig(p, sail=True):
    """帆柱・帆桁・帆・索（船の後ろ側に描く部分）。"""
    o = []
    # 索（帆柱の先から船首・船尾へ）
    o.append(f'<path d="M{MAST_X},{MAST_TOP + 6} L300,-150 M{MAST_X},{MAST_TOP + 6} L-212,-140 M{MAST_X},{YARD_Y} L-120,-82 '
             f'M{MAST_X},{YARD_Y} L160,-82" fill="none" stroke="{INK}" stroke-width="2.4" opacity=".8"/>')
    # 帆柱（6段の丸太）
    o.append(f'<path d="M{MAST_X - 8},-80 L{MAST_X - 5},{MAST_TOP} L{MAST_X + 5},{MAST_TOP} L{MAST_X + 8},-80Z" fill="{WOOD_DARK}" '
             f'stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>')
    o.append("".join(f'<path d="M{MAST_X - 7},{y} L{MAST_X + 7},{y}" stroke="{INK}" stroke-width="1.6" opacity=".5"/>'
                     for y in range(-150, MAST_TOP, -70)))
    # 小さな吹き流し
    o.append(f'<path class="{p}flag" d="M{MAST_X + 4},{MAST_TOP + 2} Q{MAST_X + 40},{MAST_TOP - 6} {MAST_X + 78},{MAST_TOP + 6} '
             f'Q{MAST_X + 40},{MAST_TOP + 10} {MAST_X + 4},{MAST_TOP + 16}Z" fill="{SAIL}" stroke="{INK}" stroke-width="2"/>')
    if sail:
        o.append(f'<path d="{SAIL_D}" fill="url(#{p}sail)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
        weave = " ".join(f"M-190,{y} Q20,{y + 10} 230,{y}" for y in range(-424, -160, 22))
        seams = " ".join(f"M{x},-450 Q{x + (x - 20) * .06},-310 {x},-150" for x in range(-106, 200, 58))
        o.append(f'<g clip-path="url(#{p}sailclip)"><path d="{weave}" fill="none" stroke="#d7c79f" stroke-width="2.2" opacity=".75"/>'
                 f'<path d="{seams}" fill="none" stroke="#cbbb92" stroke-width="1.6" opacity=".6"/>'
                 '<path d="M-60,-446 Q-40,-300 -70,-160 L-150,-170 Q-170,-300 -150,-446Z" fill="#c9b994" opacity=".22"/></g>')
        o.append(f'<path d="M-162,-176 Q22,-150 202,-176" fill="none" stroke="{INK}" stroke-width="3"/>')
    else:
        # 帆をたたんで帆桁に結ぶ
        o.append(f'<path d="M-150,-446 Q20,-418 190,-446 Q20,-432 -150,-446Z" fill="{SAIL}" stroke="{INK}" stroke-width="2.4"/>')
    # 帆桁
    o.append(f'<path d="M-166,{YARD_Y - 5} L206,{YARD_Y - 5} L206,{YARD_Y + 5} L-166,{YARD_Y + 5}Z" fill="{WOOD}" stroke="{INK}" '
             'stroke-width="2.4" stroke-linejoin="round"/>')
    return "".join(o)


def ship_stern(p):
    """船尾楼の手すりと舵輪（乗組員の後ろ）。"""
    posts = "".join(f'<path d="M{x},-118 L{x},-140" stroke="{INK}" stroke-width="3"/>' for x in range(-210, -130, 16))
    return (f'<path d="M-214,-142 L-134,-142" stroke="{WOOD}" stroke-width="6" stroke-linecap="round"/>{posts}'
            f'<path d="M-214,-142 L-134,-142" fill="none" stroke="{INK}" stroke-width="1.4" opacity=".6"/>')


def ship_wheel(p):
    cx, cy = WHEEL
    spokes = " ".join(f"M{n(cx + math.cos(a) * 9)},{n(cy + math.sin(a) * 9)} L{n(cx + math.cos(a) * 23)},{n(cy + math.sin(a) * 23)}"
                      for a in [i * math.pi / 4 for i in range(8)])
    return (f'<path d="M{cx},{cy} L{cx + 4},-118" stroke="{INK}" stroke-width="5"/>'
            f'<path d="{spokes}" stroke="{INK}" stroke-width="5.4" stroke-linecap="round"/>'
            f'<path d="{spokes}" stroke="{BRASS}" stroke-width="3" stroke-linecap="round"/>'
            f'<circle cx="{cx}" cy="{cy}" r="16" fill="none" stroke="{INK}" stroke-width="6.5"/>'
            f'<circle cx="{cx}" cy="{cy}" r="16" fill="none" stroke="{BRASS}" stroke-width="3.6"/>'
            f'<circle cx="{cx}" cy="{cy}" r="5" fill="{BRASS}" stroke="{INK}" stroke-width="2"/>')


def ship_hull(p, lights=True, glow=False):
    """手前の舷側（乗組員の腰から下を隠す）。"""
    planks = " ".join(f"M-220,{y} Q20,{y + 8} 240,{y - 6}" for y in (-58, -34, -10))
    o = [f'<path d="{HULL}" fill="url(#{p}hull)" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>',
         f'<g clip-path="url(#{p}hullclip)"><path d="{planks}" fill="none" stroke="#2f2012" stroke-width="2.4" opacity=".7"/>'
         f'<path d="M-220,-104 Q20,-96 240,-110" fill="none" stroke="#8a6a44" stroke-width="2" opacity=".55"/>'
         f'<path d="M-220,8 L240,8" stroke="#2a1c10" stroke-width="10" opacity=".45"/></g>',
         f'<path d="{SHEER}" fill="none" stroke="{INK}" stroke-width="13" stroke-linejoin="round"/>',
         f'<path d="{SHEER}" fill="none" stroke="{WOOD}" stroke-width="8" stroke-linejoin="round"/>',
         # 船首の突き出し
         f'<path d="M226,-118 L300,-150" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>'
         f'<path d="M226,-118 L300,-150" stroke="{WOOD_DARK}" stroke-width="5" stroke-linecap="round"/>']
    if lights:
        o.append(lantern(-206, -150, p, glow))
    return "".join(o)


def lantern(x, y, p, glow=True):
    g = (f'<circle class="{p}lamp" cx="{x}" cy="{y + 12}" r="26" fill="#ffcf73" opacity=".35"/>' if glow else "")
    return (g + f'<path d="M{x},{y - 6} L{x},{y + 2}" stroke="{INK}" stroke-width="2"/>'
            f'<path d="M{x - 7},{y + 2} L{x + 7},{y + 2} L{x + 6},{y + 22} L{x - 6},{y + 22}Z" fill="#ffd27a" stroke="{INK}" stroke-width="2.4"/>'
            f'<path d="M{x - 8},{y + 2} L{x + 8},{y + 2} M{x - 7},{y + 22} L{x + 7},{y + 22}" stroke="{INK}" stroke-width="3"/>')


def ship_full(p, sail=True, lights=True, crew="", glow=False):
    """船全体（乗組員は crew として帆柱と舷側の間に入れる）。"""
    return ship_rig(p, sail) + ship_stern(p) + crew + ship_wheel(p) + ship_hull(p, lights, glow)


def ship_silhouette(color="#3d4f6a", sail="#f6f1e2"):
    """遠景の小さな船（帆と船体だけ）。"""
    return (f'<path d="M-150,-446 L190,-446 Q216,-312 202,-176 Q22,-150 -162,-176 Q-178,-312 -150,-446Z" fill="{sail}"/>'
            f'<path d="M{MAST_X - 7},-80 L{MAST_X - 5},{MAST_TOP} L{MAST_X + 5},{MAST_TOP} L{MAST_X + 7},-80Z" fill="{color}"/>'
            f'<path d="{HULL}" fill="{color}"/>')


def tiny_crew():
    """遠くの船の上の四人（頭だけ。シオンの金髪、ミナの栗色、ゴンタの茶、ワタリの紺の帽子）。"""
    o = []
    for x, hair, cap in ((-172, "#e8e2d6", "#2b3f66"), (-20, "#95501e", None), (52, "#f8b646", None), (118, "#5d4326", None)):
        o.append(f'<circle cx="{x}" cy="-100" r="15" fill="#f3c9a4" stroke="{INK}" stroke-width="2.4"/>'
                 f'<path d="M{x - 16},-102 Q{x - 14},-122 {x},-122 Q{x + 14},-122 {x + 16},-102 Q{x},-110 {x - 16},-102Z" fill="{hair}" '
                 f'stroke="{INK}" stroke-width="2"/>')
        if cap:
            o.append(f'<path d="M{x - 17},-108 Q{x},-132 {x + 17},-108Z" fill="{cap}" stroke="{INK}" stroke-width="2"/>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 灯台（塔の根元の中央が原点、上が -y）
# ---------------------------------------------------------------------------
def lighthouse(p, h=420, w0=150, w1=104, beam=False):
    top = -h
    o = []
    # 石積みの塔
    o.append(f'<path d="M{-w0 / 2},0 L{-w1 / 2},{top} L{w1 / 2},{top} L{w0 / 2},0Z" fill="url(#{p}stone)" stroke="{INK}" '
             'stroke-width="3" stroke-linejoin="round"/>')
    rows = []
    y, k = -30, 0
    while y > top + 8:
        t = y / top
        half = w0 / 2 + (w1 / 2 - w0 / 2) * t
        rows.append(f"M{n(-half)},{n(y)} L{n(half)},{n(y)}")
        step = 34
        for x in range(-60, 61, step):
            xx = x + (step / 2 if k % 2 else 0)
            if abs(xx) < half - 4:
                rows.append(f"M{n(xx)},{n(y)} L{n(xx)},{n(y + 30)}")
        y -= 30
        k += 1
    o.append(f'<path d="{" ".join(rows)}" fill="none" stroke="#6b7177" stroke-width="2" opacity=".7"/>')
    o.append(f'<path d="M{-w0 / 2 + 14},-10 L{-w1 / 2 + 10},{top + 10}" stroke="#d5dadc" stroke-width="5" opacity=".5"/>')
    # 扉と窓
    o.append(f'<path d="M-16,0 L-16,-46 Q0,-60 16,-46 L16,0Z" fill="{WOOD_DARK}" stroke="{INK}" stroke-width="2.6"/>'
             f'<path d="M-9,{n(top * .55)} L-9,{n(top * .55 - 30)} Q0,{n(top * .55 - 40)} 9,{n(top * .55 - 30)} L9,{n(top * .55)}Z" '
             f'fill="#3a3a40" stroke="{INK}" stroke-width="2.4"/>')
    # 回廊（板）と手すり
    gw = w1 / 2 + 22
    o.append(f'<path d="M{n(-gw)},{top} L{n(gw)},{top} L{n(gw - 8)},{top + 12} L{n(-gw + 8)},{top + 12}Z" fill="{WOOD}" stroke="{INK}" '
             'stroke-width="2.6" stroke-linejoin="round"/>')
    rail = " ".join(f"M{n(x)},{top} L{n(x)},{top - 22}" for x in [(-gw + 6) + i * (2 * gw - 12) / 8 for i in range(9)])
    o.append(f'<path d="{rail} M{n(-gw + 4)},{top - 22} L{n(gw - 4)},{top - 22}" fill="none" stroke="{INK}" stroke-width="3"/>')
    # 灯室（板の枠と、灯りの見える窓）
    lw = w1 / 2 - 8
    lt = top - 86
    o.append(f'<path d="M{n(-lw)},{top} L{n(-lw)},{lt} L{n(lw)},{lt} L{n(lw)},{top}Z" fill="{WOOD}" stroke="{INK}" stroke-width="2.6"/>')
    o.append(f'<path class="{p}fire" d="M{n(-lw + 9)},{top - 8} L{n(-lw + 9)},{lt + 10} L{n(lw - 9)},{lt + 10} L{n(lw - 9)},{top - 8}Z" '
             'fill="#ffd66e"/>')
    o.append(f'<path d="M0,{top - 8} L0,{lt + 10}" stroke="{INK}" stroke-width="3"/>')
    o.append(f'<g class="{p}flame" style="transform-box:fill-box;transform-origin:50% 100%">'
             f'<path d="M-14,{top - 10} Q-16,{top - 34} 0,{top - 62} Q16,{top - 34} 14,{top - 10}Z" fill="#ff9a2e"/>'
             f'<path d="M-7,{top - 10} Q-8,{top - 26} 0,{top - 44} Q8,{top - 26} 7,{top - 10}Z" fill="#fff0b0"/></g>')
    # 屋根
    o.append(f'<path d="M{n(-lw - 14)},{lt + 2} L0,{lt - 50} L{n(lw + 14)},{lt + 2}Z" fill="#8a4a2a" stroke="{INK}" stroke-width="2.8" '
             'stroke-linejoin="round"/>'
             f'<path d="M0,{lt - 50} L0,{lt - 68}" stroke="{INK}" stroke-width="3"/><circle cx="0" cy="{lt - 70}" r="5" fill="{BRASS}" '
             f'stroke="{INK}" stroke-width="2"/>')
    glow = f'<circle class="{p}glow" cx="0" cy="{lt + 40}" r="{n(w1 * 1.1)}" fill="url(#{p}lampglow)"/>'
    return "".join(o), glow, (0, lt + 40)


def lighthouse_defs(p):
    return (f'<linearGradient id="{p}stone" x1="0" y1="0" x2="1" y2="0">'
            '<stop offset="0" stop-color="#b9bec1"/><stop offset=".5" stop-color="#a1a7ab"/><stop offset="1" stop-color="#7f868b"/></linearGradient>'
            f'<radialGradient id="{p}lampglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/>'
            '<stop offset=".35" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffbe5a" stop-opacity="0"/></radialGradient>')


# ---------------------------------------------------------------------------
# 島の建物（根元の中央が原点）
# ---------------------------------------------------------------------------
def hut(w=90, h=56, roof=THATCH, s=1.0):
    """小屋：板の壁・わら屋根・戸口。"""
    rw, rh = w * .66, h * .78
    return (f'<g transform="scale({n(s)})">'
            f'<path d="M{n(-w / 2)},0 L{n(-w / 2)},{n(-h)} L{n(w / 2)},{n(-h)} L{n(w / 2)},0Z" fill="{WOOD}" stroke="{INK}" stroke-width="2.6"/>'
            f'<path d="M{n(-w / 2)},{n(-h * .5)} L{n(w / 2)},{n(-h * .5)}" stroke="{INK}" stroke-width="1.4" opacity=".45"/>'
            f'<path d="M{n(-w * .12)},0 L{n(-w * .12)},{n(-h * .62)} L{n(w * .14)},{n(-h * .62)} L{n(w * .14)},0Z" fill="#5b3b20" '
            f'stroke="{INK}" stroke-width="2.2"/>'
            f'<path d="M{n(-rw - 10)},{n(-h + 6)} L0,{n(-h - rh)} L{n(rw + 10)},{n(-h + 6)}Z" fill="{roof}" stroke="{INK}" stroke-width="2.6" '
            'stroke-linejoin="round"/>'
            f'<path d="M{n(-rw * .55)},{n(-h - rh * .35)} L{n(rw * .55)},{n(-h - rh * .35)} M{n(-rw * .85)},{n(-h - rh * .05)} '
            f'L{n(rw * .85)},{n(-h - rh * .05)}" stroke="#a88a3e" stroke-width="2" opacity=".7"/>'
            "</g>")


def kitchen(p, w=170, h=70, s=1.0):
    """村の食堂：白い壁・板の梁・わら屋根・紺ののれん・かまどの煙突（煙は scene 側）。"""
    return (f'<g transform="scale({n(s)})">'
            f'<path d="M{n(-w / 2)},0 L{n(-w / 2)},{n(-h)} L{n(w / 2)},{n(-h)} L{n(w / 2)},0Z" fill="{WALL}" stroke="{INK}" stroke-width="2.6"/>'
            + "".join(f'<path d="M{n(x)},0 L{n(x)},{n(-h)}" stroke="{WOOD_DARK}" stroke-width="5"/>' for x in (-w / 2 + 4, -w / 6, w / 6, w / 2 - 4))
            + f'<path d="M{n(-w / 2)},{n(-h + 6)} L{n(w / 2)},{n(-h + 6)}" stroke="{WOOD_DARK}" stroke-width="6"/>'
            f'<path d="M{n(-w * .12)},{n(-h * .78)} L{n(w * .12)},{n(-h * .78)} L{n(w * .12)},{n(-h * .36)} Q0,{n(-h * .3)} '
            f'{n(-w * .12)},{n(-h * .36)}Z" fill="#2b4b84" stroke="{INK}" stroke-width="2"/>'
            f'<path d="M0,{n(-h * .78)} L0,{n(-h * .34)}" stroke="#f2ecdc" stroke-width="1.6" opacity=".7"/>'
            f'<path d="M{n(w * .26)},{n(-h - 30)} L{n(w * .26)},{n(-h - 62)} L{n(w * .36)},{n(-h - 62)} L{n(w * .36)},{n(-h - 30)}Z" '
            f'fill="{STONE}" stroke="{INK}" stroke-width="2.4"/>'
            f'<path d="M{n(-w / 2 - 16)},{n(-h + 6)} L{n(-w * .3)},{n(-h - 48)} L{n(w * .3)},{n(-h - 48)} L{n(w / 2 + 16)},{n(-h + 6)}Z" '
            f'fill="{THATCH}" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>'
            f'<path d="M{n(-w * .4)},{n(-h - 22)} L{n(w * .4)},{n(-h - 22)}" stroke="#a88a3e" stroke-width="2" opacity=".7"/>'
            "</g>")


def shrine(s=1.0):
    """職業の社：板の祠と、前に立つ赤い鳥居。祭壇の水色の光（ゲームの祭壇の色）。"""
    return (f'<g transform="scale({n(s)})">'
            '<circle cx="0" cy="-40" r="46" fill="#bfe8ff" opacity=".35"/>'
            f'<path d="M-30,0 L-30,-42 L30,-42 L30,0Z" fill="{WOOD}" stroke="{INK}" stroke-width="2.4"/>'
            '<path d="M-10,0 L-10,-28 L10,-28 L10,0Z" fill="#9fd8ff" stroke="#2d5a78" stroke-width="2"/>'
            f'<path d="M-44,-38 Q0,-50 44,-38 L32,-70 L-32,-70Z" fill="#6b4a3a" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>'
            f'<path d="M-50,-36 Q0,-46 50,-36" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
            # 鳥居（手前）
            f'<g transform="translate(0 30)"><path d="M-30,0 L-27,-50 M30,0 L27,-50" stroke="{TORII}" stroke-width="7"/>'
            f'<path d="M-44,-52 Q0,-46 44,-52 L42,-60 Q0,-55 -42,-60Z" fill="{TORII}" stroke="{INK}" stroke-width="2"/>'
            f'<path d="M-34,-40 L34,-40" stroke="{TORII}" stroke-width="6"/></g>'
            "</g>")


def scarecrow(s=1.0):
    return (f'<g transform="scale({n(s)})"><path d="M0,0 L0,-46 M-18,-34 L18,-34" stroke="{WOOD_DARK}" stroke-width="4"/>'
            f'<path d="M-12,-36 L12,-36 L9,-16 L-9,-16Z" fill="#7a8a4a" stroke="{INK}" stroke-width="1.8"/>'
            f'<circle cx="0" cy="-48" r="8" fill="#e8d7a0" stroke="{INK}" stroke-width="1.8"/>'
            f'<path d="M-15,-50 Q0,-64 15,-50Z" fill="{THATCH}" stroke="{INK}" stroke-width="1.8"/></g>')


def banner(p, h=80, color="#c23b2a", s=1.0):
    """のぼり旗（竿と布。布は .{p}flagwave で揺れる）。"""
    return (f'<g transform="scale({n(s)})"><path d="M0,0 L0,{-h}" stroke="{WOOD_DARK}" stroke-width="4"/>'
            f'<path class="{p}flagwave" d="M2,{-h + 4} L30,{-h + 6} L28,{-h * .38} L2,{-h * .4}Z" fill="{color}" stroke="{INK}" stroke-width="2"/>'
            '</g>')


def pine(R, x, y, w=60, h=26, color="#3f7653", trunk="#5b3b20"):
    return (f'<path d="M{n(x - 2.5)},{n(y)} L{n(x + 2.5)},{n(y)} L{n(x + 3.5)},{n(y + h * 1.3)} L{n(x - 3.5)},{n(y + h * 1.3)}Z" fill="{trunk}"/>'
            f'<path d="{cloud(x - w / 2, y, w, h, 4, R, zig=8)}" fill="{color}" stroke="{GREEN_INK}" stroke-width="1.6"/>')


def round_tree(R, x, y, r=26, color="#5f9a5c"):
    return (f'<path d="M{n(x - 3)},{n(y)} L{n(x + 3)},{n(y)} L{n(x + 4)},{n(y + r * 1.1)} L{n(x - 4)},{n(y + r * 1.1)}Z" fill="#5b3b20"/>'
            f'<path d="{cloud(x - r, y + r * .2, r * 2, r * 1.5, 5, R)}" fill="{color}" stroke="{GREEN_INK}" stroke-width="1.8"/>')


def paddy(x, y, w, h, tilt=0, ripe=.0):
    """田の一枚（平行四辺形）。水面の照り返しと稲の列。"""
    pts = [(x, y), (x + w, y + tilt), (x + w - h * .4, y + tilt + h), (x - h * .4, y + h)]
    d = "M" + " L".join(f"{n(a)},{n(b)}" for a, b in pts) + "Z"
    base = "#7fbf6a" if ripe < .5 else "#c7c25a"
    rows = " ".join(f"M{n(x - h * .4 * t + 4)},{n(y + h * t)} L{n(x + w - h * .4 * t - 4)},{n(y + tilt + h * t)}"
                    for t in [i / 5 for i in range(1, 5)])
    return (f'<path d="{d}" fill="{base}" stroke="#4f7a3a" stroke-width="2.4" stroke-linejoin="round"/>'
            f'<path d="{rows}" fill="none" stroke="#a9dc8a" stroke-width="2.4" stroke-dasharray="4 6" opacity=".9"/>'
            f'<path d="M{n(x + w * .2)},{n(y + h * .3)} L{n(x + w * .45)},{n(y + tilt * .45 + h * .3)}" stroke="#d8f2ff" stroke-width="2.4" opacity=".6"/>')


def field(x, y, w, h, rows=5):
    """畑：耕した土の畝と芽。"""
    o = [f'<path d="M{x},{y} L{x + w},{y} L{n(x + w - h * .3)},{y + h} L{n(x - h * .3)},{y + h}Z" fill="#8a5c33" stroke="{INK}" stroke-width="2.2"/>']
    for i in range(rows):
        t = (i + .5) / rows
        yy = y + h * t
        o.append(f'<path d="M{n(x - h * .3 * t + 4)},{n(yy)} L{n(x + w - h * .3 * t - 4)},{n(yy)}" stroke="#6d4a28" stroke-width="3"/>')
        o.append(f'<path d="M{n(x - h * .3 * t + 8)},{n(yy - 2)} L{n(x + w - h * .3 * t - 8)},{n(yy - 2)}" stroke="#7cc46a" '
                 f'stroke-width="4" stroke-dasharray="3 7" stroke-linecap="round"/>')
    return "".join(o)


def smoke(cls, x, y, k=1.0):
    """かまどの煙（3つの丸が上へ流れる）。"""
    return "".join(f'<circle class="{cls}" cx="{n(x)}" cy="{n(y)}" r="{n(r * k)}" fill="#f4f1ea" opacity=".7" '
                   f'style="animation-delay:-{n(d)}s"/>' for r, d in ((9, 0), (12, 1.3), (15, 2.6)))


def sparkle_path():
    return "M0,-10C1.2,-2.4 2.4,-1.2 10,0C2.4,1.2 1.2,2.4 0,10C-1.2,2.4 -2.4,1.2 -10,0C-2.4,-1.2 -1.2,-2.4 0,-10Z"


def gulls(cls, birds, color="#3d4f6a"):
    return "".join(f'<g transform="translate({x} {y}) scale({s})"><path class="{cls}" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" fill="none" '
                   f'stroke="{color}" stroke-width="2.6" stroke-linecap="round" style="animation-delay:-{d}s"/></g>'
                   for x, y, s, d in birds)
