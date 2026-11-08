"""第5章の結末「帰るべき場所へ ― 火山島編・完」の4場面のSVG。

  1. 清めの泉          竹林の社の前の泉に澄んだ水が戻る。水門から導水路が、火の戻った鉱山町へ下る。
  2. 町の人々          鍛冶場の火と導水路の町の前に、ベルク・ナギ・ヨモギと、ロク・カヤ・スミ・テル。名前の順に足元が光る。
  3. 船出              直した桟橋から見送るベルク・ナギ・カヤの後ろ姿と、夕日の海へ出る船の四人。
  4. 始まりの場所へ    夜の海。小さな船の行く手、水平線の山の上に、プロローグ第3場面と同じ形の崩れた神殿の影。
                       タイトル「火山島編・完」。

座標は viewBox="0 0 1600 900"。乱数は場面ごとの固定シード。位置が動くアニメーションには .mv を付け、
モーション軽減時に止める。船（第3章の結末の props.py）と火山島（火山島編の始まりの props5.py）は
ほかのムービーのものを使う。第6～7章は未実装なので、神殿は影だけで、その先（魔物・再建）は描かない。
"""
import os
import random

from helpers import n, kasumi
from figures import Cast, place, mix
import props as P          # 第3章の結末の船（../../ch3-departure/src/props.py）
import scenes as M4        # 第3章の結末の空・海の部品
import props5 as V         # 火山島編の始まりの火山島（../../ch4-arrival/src/props5.py）
import props7 as Q

HEAD = M4.HEAD
CAST = Cast(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts", "cast.json"))


def figure_set(specs, prefix, tone=None, rims=()):
    """specs: (人物id, 向き, 腕, 場面の位置, 倍率, 胸から上だけか)。返り値は (defs, [描画])."""
    defs, out = [], []
    for cid, direction, arms, at, scale, bust in specs:
        f = CAST.figure(cid, direction, f"{prefix}{cid}-{direction}-", arms=arms, legs=not bust, tone=tone, rims=rims, arms_over=True)
        defs.append(f.defs)
        out.append(place(f.rim, at, scale, f.foot) + place(f.body, at, scale, f.foot))
    return "".join(defs), out


def warm(c):
    return mix(c, "#fff1d6", .05)


# ---------------------------------------------------------------------------
# 場面1：清めの泉
# ---------------------------------------------------------------------------
S1_CSS = """
.is-active .s1-murk{animation:s1-clear 2.6s .3s ease-in-out both}
.is-active .s1-ring{animation:s1-ring 3.3s ease-out infinite}
.s1-ring{transform-box:fill-box;transform-origin:50% 50%;opacity:0}
.is-active .s1-sp{animation:s1-sp 1.8s ease-in-out infinite}
.is-active .s1-flow{animation:s1-flow 1.2s linear infinite}
.is-active .s1-leaf{animation:s1-leaf 2.6s ease-in-out infinite alternate}
.is-active .s1-ray{animation:s1-ray 7.2s ease-in-out both}
.is-active .s1-smoke{animation:s1-smoke 3.9s linear infinite}
.is-active .s1-fire{animation:s1-fire .9s ease-in-out infinite alternate}
.is-active .s1-puff{animation:s1-puff 3s ease-in-out infinite alternate}
.s1-puff{transform-box:fill-box;transform-origin:50% 50%}
.s1-smoke{transform-box:fill-box;transform-origin:50% 50%}
@keyframes s1-clear{to{opacity:0}}
@keyframes s1-ring{0%{transform:scale(.3);opacity:0}20%{opacity:.85}100%{transform:scale(1.6);opacity:0}}
@keyframes s1-sp{0%,100%{opacity:.1}50%{opacity:1}}
@keyframes s1-flow{to{stroke-dashoffset:-36}}
@keyframes s1-leaf{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes s1-ray{0%{opacity:.15}45%{opacity:.6}100%{opacity:.4}}
@keyframes s1-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.75}100%{transform:translate(20px,-80px) scale(1.6);opacity:0}}
@keyframes s1-fire{from{opacity:.6}to{opacity:1}}
@keyframes s1-puff{from{transform:scale(.97)}to{transform:scale(1.04)}}
"""


def scene1():
    R = random.Random(701)
    o = [HEAD.format(label="竹林の社の前の泉に、澄んだ水が戻る。水門から導水路が、鍛冶場の火の戻った鉱山町へ下っていく。奥に静かな火山")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append("<defs>" + M4.sky_defs("s1-", "#79b6df", "#b7dcef", "#f3ecd6", 520) + V.volcano_defs("s1-v-") + Q.spring_defs("s1-")
             + '<linearGradient id="s1-grass" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#7fae6a"/><stop offset="1" stop-color="#4e8250"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    o.append(M4.clouds(R, [(60, 120, 420, 24), (900, 90, 460, 26)], cls="s1-cl"))
    # 奥：静かな火山（細い煙）と、ふもとの鉱山町（鍛冶場の火）
    o.append(f'<g class="s1-plume mv">{V.plume(R, "s1-puff mv", 1210, 300, 120, 70, dark="#9a948f", light="#e6e2dc", lean=-.4, puffs=9)}</g>')
    o.append(V.volcano("s1-v-", R, 1210, 560, 720, 260, ridge_color="#7d767a", lava=False))
    o.append('<path d="M760,560 C900,540 1080,548 1240,540 C1400,532 1520,548 1620,556 L1620,620 L760,620Z" fill="#6f9a62"/>')
    for x, w, roof in ((1060, 90, "#4f5a66"), (1170, 100, "#6a4f3a"), (1390, 96, "#4f5a66"), (1490, 84, "#6a4f3a")):
        o.append(Q.town_house(x, 590, w, 52, roof=roof, s=.62))
    o.append(Q.forge("s1-", 1290, 592, .7, fire_cls="s1-fire", smoke_cls="s1-smoke mv"))
    # 中：草地、竹林（左右）、社と鳥居
    o.append('<path d="M-20,600 C300,570 700,580 1000,600 C1200,612 1420,606 1620,600 L1620,900 L-20,900Z" fill="url(#s1-grass)"/>')
    for x, h, lean in ((40, 560, .02), (110, 600, -.01), (190, 520, .03), (1500, 560, -.02), (1570, 600, .01)):
        o.append(Q.bamboo(R, x, 900, h, 18, lean, leaf_cls="s1-leaf mv"))
    o.append(Q.hokora(560, 588, .7))          # 鳥居のくぐり口から見える奥の社
    o.append(Q.torii(560, 664, 210, 176))
    # 光の筋（竹林の間から）
    rays = "".join(f'<path d="M{x},-20 L{x + 60},-20 L{x + 360},900 L{x + 220},900Z" fill="#fffbe0"/>' for x in (230, 520))
    o.append(f'<g class="s1-ray" opacity=".4">{rays}</g>')
    # 泉と水門、町へ下る導水路
    o.append(Q.channel([(990, 676), (1080, 650), (1150, 630), (1230, 614), (1300, 604)], flow_cls="s1-flow mv"))
    o.append(Q.spring("s1-", R, 700, 690, 270, 76, ring_cls="s1-ring mv", sparkle_cls="s1-sp", murk_cls="s1-murk"))
    o.append(Q.sluice(988, 684, 1.0))
    for x, h, lean in ((260, 640, .015), (1350, 640, -.015)):
        o.append(Q.bamboo(R, x, 900, h, 22, lean, leaf_cls="s1-leaf mv"))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：町の人々
# ---------------------------------------------------------------------------
S2_CSS = """
.s2-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s2-wave{animation:s2-wave 1.1s ease-in-out infinite alternate}
.is-active .s2-ring{animation:s2-ring 1.6s ease-out both}
.s2-ring{opacity:0}
.is-active .s2-smoke{animation:s2-smoke 3.9s linear infinite}
.s2-smoke{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s2-fire{animation:s2-fire .9s ease-in-out infinite alternate}
.is-active .s2-flow{animation:s2-flow 1.2s linear infinite}
.is-active .s2-puff{animation:s2-puff 3s ease-in-out infinite alternate}
.s2-puff{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s2-cl{animation:s2-drift 9.6s linear both}
@keyframes s2-wave{from{transform:rotate(-12deg)}to{transform:rotate(9deg)}}
@keyframes s2-ring{0%{opacity:0;transform:scale(.6)}35%{opacity:1}100%{opacity:.75;transform:none}}
@keyframes s2-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.75}100%{transform:translate(20px,-80px) scale(1.6);opacity:0}}
@keyframes s2-fire{from{opacity:.6}to{opacity:1}}
@keyframes s2-flow{to{stroke-dashoffset:-36}}
@keyframes s2-puff{from{transform:scale(.97)}to{transform:scale(1.04)}}
@keyframes s2-drift{from{transform:translateX(-40px)}}
"""
# 前の列（名前を呼ぶ三人）と後ろの列（ロク・カヤと島の人々）。名前の字幕に合わせて足元が光る（ミリ秒）。
S2_FRONT = (("belk", ("down", "hip"), 480, 900), ("nagi", ("front", "front"), 800, 1700), ("yomogi", ("front", "down"), 1120, 2500))
S2_BACK = (("roku", ("hip", "hip"), 300, 5000), ("kaya", ("down", "wave"), 640, 5700), ("sumi", ("front", "front"), 960, 6400),
           ("teru", ("wave", "down"), 1300, 6400))
S2_FRONT_FEET, S2_FRONT_SCALE = 836, 2.6
S2_BACK_FEET, S2_BACK_SCALE = 716, 2.25


def scene2():
    R = random.Random(702)
    o = [HEAD.format(label="鍛冶場の煙突に火が戻り、導水路が通る鉱山町。前に鍛冶屋のベルク・僧侶のナギ・薬草のヨモギ、"
                     "後ろにロク・カヤ・スミ・テル")]
    o.append(f"<style>{S2_CSS}</style>")
    fdefs, front = figure_set([(cid, "front", arms, (x, S2_FRONT_FEET), S2_FRONT_SCALE, False) for cid, arms, x, _ in S2_FRONT],
                              "s2-f-", tone=warm, rims=(("#fff3cf", 1.1, -.7, .9),))
    bdefs, back = figure_set([(cid, "front", arms, (x, S2_BACK_FEET), S2_BACK_SCALE, False) for cid, arms, x, _ in S2_BACK],
                             "s2-b-", tone=warm, rims=(("#fff3cf", 1.1, -.7, .8),))
    o.append("<defs>" + M4.sky_defs("s2-", "#6fb0e2", "#acd7f0", "#f6ecd4", 480) + V.volcano_defs("s2-v-")
             + '<linearGradient id="s2-ground" x1="0" y1="600" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#bba98a"/><stop offset="1" stop-color="#8f7c5e"/></linearGradient>'
             '<radialGradient id="s2-ringg" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#ffe9a0" stop-opacity="0"/>'
             '<stop offset=".8" stop-color="#ffe08a" stop-opacity=".9"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s2-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3b2a1c" stop-opacity=".35"/>'
             '<stop offset="1" stop-color="#3b2a1c" stop-opacity="0"/></radialGradient>' + fdefs + bdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append(M4.clouds(R, [(80, 140, 440, 24), (980, 110, 420, 22)], cls="s2-cl mv"))
    o.append(f'<g class="s2-plume mv">{V.plume(R, "s2-puff mv", 820, 170, 130, 80, dark="#9a948f", light="#e6e2dc", lean=-.5, puffs=9)}</g>')
    o.append(V.volcano("s2-v-", R, 820, 520, 1100, 350, ridge_color="#7d767a", lava=False))
    # 町並みと導水路（右の竹の丘から下る）、鍛冶場
    o.append('<path d="M1180,520 C1300,470 1460,460 1620,480 L1620,560 L1180,560Z" fill="#6fa35a"/>')
    for x in (1300, 1360, 1420, 1480, 1540):
        o.append(f'<path d="M{x},{520 - (x - 1300) * .1} l3,-70 M{x + 14},{518 - (x - 1300) * .1} l2,-60" stroke="#3f6e3a" stroke-width="7" stroke-linecap="round"/>')
    o.append('<rect x="0" y="560" width="1600" height="340" fill="url(#s2-ground)"/>')
    for x, w, roof in ((120, 130, "#4f5a66"), (330, 120, "#6a4f3a"), (1180, 120, "#4f5a66"), (1440, 140, "#6a4f3a")):
        o.append(Q.town_house(x, 600, w, 70, roof=roof, s=.9))
    o.append(Q.channel([(1620, 470), (1460, 500), (1300, 520), (1120, 540), (960, 560)], flow_cls="s2-flow mv", w=16))
    o.append(Q.forge("s2-", 640, 610, 1.0, fire_cls="s2-fire", smoke_cls="s2-smoke mv"))
    # 人（後ろの列 → 前の列）。足元の影と、名前の順に灯る光の輪
    for (cid, arms, x, at_ms), markup in zip(S2_BACK, back):
        o.append(f'<ellipse cx="{x}" cy="{S2_BACK_FEET + 4}" rx="82" ry="13" fill="url(#s2-shadow)"/>'
                 f'<ellipse class="s2-ring" cx="{x}" cy="{S2_BACK_FEET + 2}" rx="118" ry="25" fill="url(#s2-ringg)" '
                 f'style="animation-delay:{at_ms}ms;transform-box:fill-box;transform-origin:50% 50%"/>')
        o.append(markup.replace('class="wave"', 'class="s2-wave"'))
    for (cid, arms, x, at_ms), markup in zip(S2_FRONT, front):
        o.append(f'<ellipse cx="{x}" cy="{S2_FRONT_FEET + 4}" rx="96" ry="16" fill="url(#s2-shadow)"/>'
                 f'<ellipse class="s2-ring" cx="{x}" cy="{S2_FRONT_FEET + 2}" rx="138" ry="30" fill="url(#s2-ringg)" '
                 f'style="animation-delay:{at_ms}ms;transform-box:fill-box;transform-origin:50% 50%"/>')
        o.append(markup.replace('class="wave"', 'class="s2-wave"'))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：船出（夕日の海へ）
# ---------------------------------------------------------------------------
S3_CSS = """
.s3-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s3-wave{animation:s3-wave 1s ease-in-out infinite alternate}
.is-active .s3-shipgo{animation:s3-go 7s cubic-bezier(.4,0,.8,1) both}
.is-active .s3-ship{animation:s3-bob 2.4s ease-in-out infinite alternate}
.is-active .s3-wv{animation:s3-wv 3s ease-in-out infinite alternate}
.is-active .s3-gl{animation:s3-gl 1.8s ease-in-out infinite}
.is-active .s3-sh-flag{animation:s3-flag .8s ease-in-out infinite alternate}
.s3-sh-flag{transform-box:fill-box;transform-origin:0% 50%}
.is-active .s3-puff{animation:s3-puff 3s ease-in-out infinite alternate}
.s3-puff{transform-box:fill-box;transform-origin:50% 50%}
@keyframes s3-wave{from{transform:rotate(-14deg)}to{transform:rotate(10deg)}}
@keyframes s3-go{from{transform:translateX(-30px)}to{transform:translateX(150px)}}
@keyframes s3-bob{from{transform:translateY(-3px) rotate(-.7deg)}to{transform:translateY(3px) rotate(.7deg)}}
@keyframes s3-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s3-gl{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes s3-flag{from{transform:skewY(-6deg) scaleX(.9)}to{transform:skewY(6deg)}}
@keyframes s3-puff{from{transform:scale(.97)}to{transform:scale(1.04)}}
"""
S3_SHIP_AT, S3_SHIP_SCALE = (1040, 664), 1.32
S3_CREW = (("watari", ("helm", "helm"), (-176, -112), 1.0), ("mina", ("wave", "down"), (-66, -64), 1.0),
           ("hero2", ("down", "high"), (40, -64), 1.0), ("gonta", ("high", "hip"), (146, -64), 1.0))
S3_BACKS = (("belk", ("down", "wave"), 150, 3.1), ("nagi", ("down", "high"), 380, 3.1), ("kaya", ("high", "down"), 600, 3.1))


def sunset(c):
    return mix(mix(c, "#ffb878", .1), "#5a4a7a", .05)


def scene3():
    R = random.Random(703)
    o = [HEAD.format(label="夕日の海へ出る船。船の上で手を振るミナ・シオン・ゴンタと、舵輪を握るワタリ。"
                     "直した桟橋から手を振って見送るベルク・ナギ・カヤの後ろ姿。左奥に火山島")]
    o.append(f"<style>{S3_CSS}</style>")
    cdefs, crew = figure_set([(cid, "front", arms, at, s, True) for cid, arms, at, s in S3_CREW], "s3-c-", tone=sunset,
                             rims=(("#ffd9a0", .9, -.6, .8),))
    bdefs, backs = figure_set([(cid, "back", arms, (x, 884), s, True) for cid, arms, x, s in S3_BACKS], "s3-b-", tone=sunset,
                              rims=(("#ffd9a0", 0, -1.1, .85),))
    o.append('<defs><linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="440" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#6f7bb8"/><stop offset=".55" stop-color="#e6a07a"/><stop offset="1" stop-color="#ffd08a"/></linearGradient>'
             '<linearGradient id="s3-sea" x1="0" y1="430" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#e9b98a"/><stop offset=".3" stop-color="#7d8fb2"/><stop offset="1" stop-color="#2f4f7a"/></linearGradient>'
             '<radialGradient id="s3-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c8" stop-opacity=".95"/>'
             '<stop offset=".3" stop-color="#ffd08a" stop-opacity=".5"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>'
             + V.volcano_defs("s3-v-") + P.ship_defs("s3-sh-") + cdefs + bdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append('<circle cx="1330" cy="420" r="260" fill="url(#s3-sun)"/><circle cx="1330" cy="420" r="52" fill="#fff4d0"/>')
    o.append(M4.clouds(R, [(60, 170, 420, 20), (760, 120, 360, 18)], body="#ffe2c8", shade="#d8a3a0", cls="s3-cl"))
    # 左奥の火山島（離れていく島）
    o.append(f'<g class="s3-plume mv">{V.plume(R, "s3-puff mv", 230, 250, 110, 60, dark="#8f8088", light="#e6c6b8", lean=-.3, puffs=8)}</g>')
    o.append(V.volcano("s3-v-", R, 230, 432, 520, 190, ridge_color="#7d6a70", lava=False))
    o.append('<rect x="0" y="430" width="1600" height="470" fill="url(#s3-sea)"/>')
    o.append(M4.glints(R, "s3-gl", 1180, 1480, 440, 640, 34, "#fff3d0"))
    o.append(f'<g class="s3-wv mv">{M4.waves(R, 0, 1600, 470, 760, 30, color="#fbe7d0", opacity=.45)}</g>')
    crew_markup = "".join(crew).replace('class="wave"', 'class="s3-wave"')
    ship = P.ship_full("s3-sh-", crew=crew_markup)
    sx, sy = S3_SHIP_AT
    o.append(f'<g class="s3-shipgo mv"><g class="s3-ship mv" style="transform-origin:{sx}px {sy}px">'
             f'<g transform="translate({sx} {sy}) scale({S3_SHIP_SCALE})">{ship}</g></g>'
             f'<path d="M{sx - 330},{sy + 18} Q{sx},{sy + 34} {sx + 360},{sy + 16}" fill="none" stroke="#2c3f6a" stroke-width="16" opacity=".3"/></g>')
    o.append(f'<path d="M0,{sy + 8} L1600,{sy + 8} L1600,900 L0,900Z" fill="url(#s3-sea)" opacity=".5"/>')
    o.append(M4.waves(R, 0, 1600, sy + 20, 860, 22, color="#f4dcc0", opacity=.5))
    o.append(Q.new_pier(846))
    for markup in backs:
        o.append(markup.replace('class="wave"', 'class="s3-wave"'))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面4：始まりの場所へ（夜の海と崩れた神殿の影、タイトル）
# ---------------------------------------------------------------------------
S4_CSS = """
.is-active .s4-sail{animation:s4-sail 8.2s cubic-bezier(.3,0,.7,1) both}
.is-active .s4-bob{animation:s4-bob 2.6s ease-in-out infinite alternate}
.is-active .s4-tw{animation:s4-tw 1.8s ease-in-out infinite alternate}
.is-active .s4-gl{animation:s4-gl 1.9s ease-in-out infinite}
.is-active .s4-wv{animation:s4-wv 3s ease-in-out infinite alternate}
.is-active .s4-lamp{animation:s4-lamp 2.2s ease-in-out infinite}
.is-active .s4-ruin{animation:s4-ruin 4s .4s ease-out both}
.is-active .s4-mist{animation:s4-mist 8.2s linear both}
.s4-ruin{opacity:.25}
@keyframes s4-sail{from{transform:translateX(-80px)}to{transform:translateX(120px)}}
@keyframes s4-bob{from{transform:translateY(-3px) rotate(-.6deg)}to{transform:translateY(3px) rotate(.6deg)}}
@keyframes s4-tw{from{opacity:.35}to{opacity:1}}
@keyframes s4-gl{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes s4-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s4-lamp{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes s4-ruin{to{opacity:1}}
@keyframes s4-mist{from{transform:translateX(50px)}to{transform:translateX(-50px)}}
"""
RUIN_SCALE = .24
RUIN_AT = (1170, 452)      # 神殿の基壇の中央（プロローグの座標の (800, 592)）を置く位置


def scene4():
    R = random.Random(704)
    o = [HEAD.format(label="月の夜の海を、小さな船が進む。行く手の水平線の山の上に、崩れたダーマ神殿の影。タイトル「火山島編・完」")]
    o.append(f"<style>{S4_CSS}</style>")
    o.append('<defs><linearGradient id="s4-sky" x1="0" y1="0" x2="0" y2="560" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#070b1c"/><stop offset=".7" stop-color="#1b2748"/><stop offset="1" stop-color="#3a4870"/></linearGradient>'
             '<linearGradient id="s4-sea" x1="0" y1="550" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#2a3a64"/><stop offset="1" stop-color="#0c1430"/></linearGradient>'
             '<radialGradient id="s4-mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".6"/>'
             '<stop offset="1" stop-color="#e8f0ff" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s4-lampglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/>'
             '<stop offset=".4" stop-color="#ffb84a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>'
             + P.ship_defs("s4-sh-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append("".join(f'<circle class="s4-tw" cx="{n(R.uniform(0, 1600))}" cy="{n(R.uniform(10, 480))}" r="{n(R.uniform(.9, 2.2))}" '
                     f'fill="#f2f4ff" style="animation-delay:-{n(R.uniform(0, 3))}s"/>' for _ in range(110)))
    o.append('<circle cx="330" cy="170" r="150" fill="url(#s4-mglow)"/><circle cx="330" cy="170" r="40" fill="#f4f6ff"/>'
             '<circle cx="344" cy="162" r="36" fill="#1b2748" opacity=".25"/>')
    # 水平線の山と、その上の崩れた神殿の影（プロローグ第3場面と同じ形）
    o.append('<path d="M820,562 C910,548 990,530 1040,512 C1080,498 1110,470 1140,458 C1160,452 1190,452 1210,460 C1250,478 1290,508 1340,526 '
             'C1410,548 1480,556 1580,562Z" fill="#151b31"/>'
             '<path d="M1040,512 C1080,498 1110,470 1140,458 C1160,452 1190,452 1210,460 C1250,478 1290,508 1340,526" fill="none" '
             'stroke="#7d8fbc" stroke-width="2" opacity=".45"/>')
    tx, ty = RUIN_AT[0] - 800 * RUIN_SCALE, RUIN_AT[1] - 592 * RUIN_SCALE
    o.append(f'<g class="s4-ruin"><g transform="translate({n(tx)} {n(ty)}) scale({RUIN_SCALE})" clip-path="url(#s4-ruinclip)">'
             f'{Q.temple_ruin(color="#1a2138", rim="#8fa3cf", rim_op=.45)}</g></g>')
    o.insert(3, f'<defs><clipPath id="s4-ruinclip"><rect x="0" y="0" width="1600" height="{n(592 + (560 - RUIN_AT[1]) / RUIN_SCALE)}"/></clipPath></defs>')
    o.append('<g class="s4-mist mv" opacity=".45"><path d="' + " ".join(kasumi(x, y, w, h) for x, y, w, h in
             ((700, 540, 560, 14), (1180, 552, 520, 12))) + '" fill="#5d6b94"/></g>')
    o.append('<rect x="0" y="558" width="1600" height="342" fill="url(#s4-sea)"/>')
    o.append(M4.glints(R, "s4-gl", 230, 430, 570, 760, 28, "#e8f0ff"))
    o.append(f'<g class="s4-wv mv">{M4.waves(R, 0, 1600, 590, 860, 26, color="#9fb2d8", opacity=.35)}</g>')
    ship = P.ship_full("s4-sh-", crew=P.tiny_crew()) + '<circle class="s4-lamp" cx="-206" cy="-136" r="80" fill="url(#s4-lampglow)"/>' \
        + f'<path d="{P.SAIL_D}" fill="#0f1a3a" opacity=".45"/>'
    o.append(f'<g class="s4-sail mv"><g class="s4-bob mv" style="transform-origin:640px 690px">'
             f'<g transform="translate(640 690) scale(.55)">{ship}</g></g>'
             '<path d="M470,700 Q640,712 830,698" fill="none" stroke="#0a1230" stroke-width="10" opacity=".4"/></g>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3, scene4]
