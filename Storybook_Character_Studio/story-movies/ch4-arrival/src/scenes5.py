"""火山島編の始まり「海を越えて」の5場面のSVG。

  1. 神殿からの見習い    思い出の額に、プロローグ第4場面（燃える神殿から逃れるシオン）。
  2. ジパングの復興      思い出の額に、第3章の結末の第1場面（復興した島）と第2場面（島に残る三人）。
  3. 長い航海            夕暮れから夜へ。月と星の下を進む船、空になった樽と袋、甲板の四人。
  4. 灰の風              灰の舞う霞んだ空。船首に立つ四人の後ろ姿の先に、煙を上げる黒い火山島。
  5. 焼けた船着き場      火山のふもとの黒い浜。焼け落ちた桟橋と小屋。タイトル「火山島編」。

思い出の額（場面1・2）は、ほかのムービーの場面をそのまま縮めて入れる（props5.recall）。元の接頭辞
（s4- / s1- / s2-）はこの場面の接頭辞の下（s1-pa- / s2-ma- / s2-mb-）に置き換え、元の動きはこの場面の再生中に動く。
座標は viewBox="0 0 1600 900"。乱数は場面ごとの固定シード。位置が動くアニメーションには .mv を付け、
モーション軽減時に止める。現れ方（不透明度）は .mv の付かない外側の組に分けて、止めても絵が残るようにする。
"""
import os
import random

from helpers import n, kasumi
from figures import Cast, place, mix
import props as P          # 第3章の結末の船（../../ch3-departure/src/props.py）
import props5 as Q
import scenes as M4        # 第3章の結末の場面（思い出の額と、空・海の部品）
import scenes_b as PB      # プロローグの場面（思い出の額）

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


def motes(R, cls, count, x0, x1, y0, y1, color="#ffe9a8"):
    """書の光の粒（下から上へ立ちのぼる）。"""
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(x0, x1))}" cy="{n(R.uniform(y0, y1))}" r="{n(R.uniform(1.6, 3.6))}" fill="{color}" '
                   f'style="--dx:{n(R.uniform(-30, 30))}px;--dy:{n(R.uniform(-160, -80))}px;animation-delay:-{n(R.uniform(0, 3.6))}s"/>'
                   for _ in range(count))


def card(pfx, recalled, x, y, w, tint="#f3d8a0", tint_op=.12):
    """思い出の額：影、縮めた場面、色味のうすい重ね、四隅の暗がり、金の縁。"""
    h = w * 900 / 1600
    return (f'<rect x="{n(x + 14)}" y="{n(y + 18)}" width="{n(w)}" height="{n(h)}" rx="8" fill="#000" opacity=".35"/>'
            + recalled
            + f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{tint}" opacity="{tint_op}"/>'
            + f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="url(#{pfx}vig)"/>'
            + Q.frame(x, y, w))


def vignette_defs(pfx):
    return (f'<radialGradient id="{pfx}vig" cx=".5" cy=".5" r=".72"><stop offset=".62" stop-color="#1a1208" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#1a1208" stop-opacity=".45"/></radialGradient>')


# ---------------------------------------------------------------------------
# 場面1：神殿からの見習い（プロローグ第4場面の前半を額に）
# ---------------------------------------------------------------------------
S1_CSS = """
.s1-pa-shotb{display:none}
.s1-fade{opacity:0}
.is-active .s1-fade{animation:s1-in 1s .15s ease-out both}
.s1-mote{opacity:0}
.is-active .s1-mote{animation:s1-mote 3.6s ease-out infinite}
.is-active .s1-glow{animation:s1-glow 2.6s ease-in-out infinite alternate}
@keyframes s1-in{to{opacity:1}}
@keyframes s1-mote{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s1-glow{from{opacity:.55}to{opacity:.95}}
"""


def scene1():
    R = random.Random(501)
    o = [HEAD.format(label="思い出の額の中に、夜の山道を職業の書を背負って駆け下りる少年シオン。遠くの峰で神殿が燃えている")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append('<defs><linearGradient id="s1-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1430"/>'
             '<stop offset="1" stop-color="#1d1a33"/></linearGradient>'
             '<radialGradient id="s1-book" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffdf8a" stop-opacity=".55"/>'
             '<stop offset="1" stop-color="#ffdf8a" stop-opacity="0"/></radialGradient>' + vignette_defs("s1-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s1-bg)"/>')
    o.append(Q.star_field(R, "s1-star", 60, 900).replace('class="s1-star"', 'opacity=".55"'))
    o.append('<ellipse class="s1-glow" cx="800" cy="460" rx="760" ry="420" fill="url(#s1-book)"/>')
    o.append(f'<g class="s1-mote-set mv">{motes(R, "s1-mote mv", 34, 120, 1480, 520, 900)}</g>')
    x, y, w = 270, 124, 1060
    recalled = Q.recall(PB.scene4(), "s4-", "s1-pa-", x, y, w)
    # 額は動かさない（中の場面が毎コマ描き直しになり重くなるため。動きはカメラと額の中に任せる）
    o.append(f'<g class="s1-fade"><g transform="rotate(-1.5 800 410)">{card("s1-", recalled, x, y, w)}</g></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：ジパングの復興（第3章の結末の第1・第2場面を額に）
# ---------------------------------------------------------------------------
S2_CSS = """
.s2-fa,.s2-fb{opacity:0}
.is-active .s2-fa{animation:s2-in .9s .1s ease-out both}
.is-active .s2-fb{animation:s2-in .8s 3.2s ease-out both}
.is-active .s2-mb{animation:s2-mb 1.2s 3.2s cubic-bezier(.2,.7,.3,1) both}
.s2-mb{transform-box:fill-box;transform-origin:50% 50%}
.s2-mote{opacity:0}
.is-active .s2-mote{animation:s2-mote 3.4s ease-out infinite}
.is-active .s2-ray{animation:s2-ray 6.8s ease-in-out both}
@keyframes s2-in{to{opacity:1}}
@keyframes s2-mb{from{transform:translate(120px,40px) rotate(7deg) scale(.92)}to{transform:translate(0,0) rotate(3deg) scale(1)}}
@keyframes s2-mote{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s2-ray{from{opacity:.25}50%{opacity:.6}to{opacity:.35}}
"""


def scene2():
    R = random.Random(502)
    o = [HEAD.format(label="二枚の思い出の額。朝の光の中の復興したジパングの島と、桟橋に立つピノ・イナホ・ジンベエ")]
    o.append(f"<style>{S2_CSS}</style>")
    o.append('<defs><linearGradient id="s2-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2e2bd"/>'
             '<stop offset="1" stop-color="#c9a873"/></linearGradient>' + vignette_defs("s2-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-bg)"/>')
    rays = "".join(f'<path d="M1500,-60 L{n(x)},960 L{n(x + 120)},960Z" fill="#fff6d8"/>' for x in (300, 620, 940))
    o.append(f'<g class="s2-ray" opacity=".4">{rays}</g>')
    o.append(f'<g class="s2-mote-set mv">{motes(R, "s2-mote mv", 30, 80, 1520, 560, 900, "#fff3c4")}</g>')
    ax, ay, aw = 90, 70, 900
    bx, by, bw = 760, 330, 760
    a = Q.recall(M4.scene1(), "s1-", "s2-ma-", ax, ay, aw)
    b = Q.recall(M4.scene2(), "s2-", "s2-mb-", bx, by, bw)
    # 大きい額は動かさない（重くなるため）。重なる額だけ短く滑り込ませる
    o.append(f'<g class="s2-fa"><g transform="rotate(-2 540 323)">{card("s2-", a, ax, ay, aw, "#fff0c8", .1)}</g></g>')
    o.append(f'<g class="s2-fb"><g class="s2-mb mv">{card("s2-", b, bx, by, bw, "#fff0c8", .1)}</g></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：長い航海（夕暮れから夜へ）
# ---------------------------------------------------------------------------
S3_CSS = """
.s3-night,.s3-starset{opacity:0}
.is-active .s3-night{animation:s3-night 4.6s .2s ease-in-out both}
.is-active .s3-starset{animation:s3-night 3.2s 1.6s ease-in both}
.is-active .s3-star{animation:s3-tw 1.8s ease-in-out infinite alternate}
.is-active .s3-moon{animation:s3-moon 5.6s ease-out both}
.is-active .s3-sail{animation:s3-sail 5.6s linear both}
.is-active .s3-bob{animation:s3-bob 2.4s ease-in-out infinite alternate}
.is-active .s3-wv{animation:s3-wv 3s ease-in-out infinite alternate}
.is-active .s3-gl{animation:s3-gl 1.9s ease-in-out infinite}
.is-active .s3-sh-flag{animation:s3-flag .9s ease-in-out infinite alternate}
.is-active .s3-sh-lamp{animation:s3-lamp 2.2s ease-in-out infinite}
.s3-sh-flag{transform-box:fill-box;transform-origin:0% 50%}
@keyframes s3-night{to{opacity:1}}
@keyframes s3-tw{from{opacity:.35}to{opacity:1}}
@keyframes s3-moon{from{transform:translate(-120px,150px)}}
@keyframes s3-sail{from{transform:translateX(-50px)}to{transform:translateX(40px)}}
@keyframes s3-bob{from{transform:translateY(-4px) rotate(-.8deg)}to{transform:translateY(4px) rotate(.8deg)}}
@keyframes s3-wv{from{transform:translateX(-14px)}to{transform:translateX(14px)}}
@keyframes s3-gl{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes s3-flag{from{transform:skewY(-6deg) scaleX(.9)}to{transform:skewY(6deg)}}
@keyframes s3-lamp{0%,100%{opacity:.6}50%{opacity:1}}
"""
S3_SHIP_AT, S3_SHIP_SCALE = (790, 660), 1.3
# 甲板の四人（船の座標）。舵輪のワタリは船尾楼、三人は甲板。疲れた様子で、手を振らない。
S3_CREW = (("watari", ("helm", "helm"), (-176, -112), 1.0), ("mina", ("front", "front"), (-30, -64), 1.0),
           ("hero2", ("down", "down"), (62, -64), 1.0), ("gonta", ("hip", "down"), (158, -64), 1.0))


def dusk(c):
    """夕暮れから夜へ：人物を少し青く、暗く。"""
    return mix(mix(c, "#2a3a6a", .22), "#ffb070", .05)


def scene3():
    R = random.Random(503)
    o = [HEAD.format(label="夕暮れから夜へ。月と星の下、わらの帆の船が進む。甲板には空になった樽と袋、舵輪のワタリとミナ・シオン・ゴンタ")]
    o.append(f"<style>{S3_CSS}</style>")
    cdefs, crew = figure_set([(cid, "front", arms, at, s, True) for cid, arms, at, s in S3_CREW], "s3-c-", tone=dusk,
                             rims=(("#ffc890", .9, -.6, .55),))
    o.append('<defs><linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="470" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#3a4a82"/><stop offset=".55" stop-color="#b07a8a"/><stop offset="1" stop-color="#f4a86a"/></linearGradient>'
             '<linearGradient id="s3-nt" x1="0" y1="0" x2="0" y2="470" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#0b1330"/><stop offset="1" stop-color="#26355e"/></linearGradient>'
             '<linearGradient id="s3-sea" x1="0" y1="460" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#5b5f86"/><stop offset="1" stop-color="#18264a"/></linearGradient>'
             '<radialGradient id="s3-lampglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/>'
             '<stop offset=".4" stop-color="#ffb84a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s3-mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d6" stop-opacity=".7"/>'
             '<stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient>'
             + P.ship_defs("s3-sh-") + cdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append('<rect class="s3-night" width="1600" height="470" fill="url(#s3-nt)"/>')
    o.append(f'<g class="s3-starset">{Q.star_field(R, "s3-star", 70, 400)}</g>')
    o.append('<g class="s3-moon mv"><circle cx="1290" cy="170" r="120" fill="url(#s3-mglow)"/>'
             '<circle cx="1290" cy="170" r="34" fill="#fff4d2"/><circle cx="1302" cy="162" r="30" fill="#fff9e6" opacity=".6"/></g>')
    o.append(M4.clouds(R, [(60, 230, 420, 18), (820, 300, 360, 14)], body="#d9b7c4", shade="#9a8aa8", cls="s3-cl"))
    o.append('<rect x="0" y="460" width="1600" height="440" fill="url(#s3-sea)"/>')
    o.append('<rect class="s3-night" x="0" y="460" width="1600" height="440" fill="#0b1330" opacity=".55"/>')
    o.append(M4.glints(R, "s3-gl", 1150, 1430, 470, 640, 26, "#fff2c8"))
    o.append(f'<g class="s3-wv mv">{M4.waves(R, 0, 1600, 490, 800, 30, color="#c9d3ef", opacity=.35)}</g>')
    # 船荷：空になった樽と、しぼんだ袋（船の座標。下は舷側に隠れる）
    cargo = Q.barrel(-104, -80, 1.0) + Q.barrel(-78, -80, .82, 8) + Q.sack(212, -80, .9)
    crew_markup = cargo + "".join(crew)
    # 夜の船：帆を月明かりの色に沈め、船尾の灯りをやわらかく光らせる（船の座標）
    night = (f'<path d="{P.SAIL_D}" fill="#1a2550" opacity=".38"/>'
             '<circle class="s3-sh-lamp" cx="-206" cy="-136" r="70" fill="url(#s3-lampglow)"/>')
    ship = P.ship_full("s3-sh-", crew=crew_markup) + night
    sx, sy = S3_SHIP_AT
    o.append(f'<g class="s3-sail mv"><g class="s3-bob mv" style="transform-origin:{sx}px {sy}px">'
             f'<g transform="translate({sx} {sy}) scale({S3_SHIP_SCALE})">{ship}</g></g>'
             f'<path d="M{sx - 300},{sy + 20} Q{sx},{sy + 36} {sx + 330},{sy + 18}" fill="none" stroke="#0f1a36" stroke-width="16" opacity=".45"/></g>')
    o.append(f'<path d="M0,{sy + 10} L1600,{sy + 10} L1600,900 L0,900Z" fill="#132042" opacity=".45"/>')
    o.append(M4.waves(R, 0, 1600, sy + 24, 870, 20, color="#b9c4e6", opacity=.4))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面4：灰の風（船首の四人の後ろ姿と、近づく火山島）
# ---------------------------------------------------------------------------
S4_CSS = """
.is-active .s4-ash{animation:s4-ash 4s linear infinite}
.s4-ash{opacity:0}
.is-active .s4-puff{animation:s4-puff 3s ease-in-out infinite alternate}
.s4-puff{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s4-plume{animation:s4-plume 5.8s linear both}
.is-active .s4-glow{animation:s4-glow 1.6s ease-in-out infinite alternate}
.is-active .s4-isle{animation:s4-isle 5.8s ease-out both}
.is-active .s4-haze{animation:s4-haze 5.8s linear both}
.is-active .s4-wv{animation:s4-wv 2.8s ease-in-out infinite alternate}
@keyframes s4-ash{0%{transform:translate(0,0);opacity:0}12%{opacity:.85}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s4-puff{from{transform:scale(.96)}to{transform:scale(1.06)}}
@keyframes s4-plume{to{transform:translate(-40px,-18px)}}
@keyframes s4-glow{from{opacity:.55}to{opacity:1}}
.s4-isle{transform-origin:1240px 520px}
@keyframes s4-isle{from{transform:scale(.9)}to{transform:scale(1.02)}}
@keyframes s4-haze{from{transform:translateX(60px)}to{transform:translateX(-60px)}}
@keyframes s4-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
"""
# 船首の甲板に立つ四人（後ろ姿）。ワタリが右手を上げて島を指す。
S4_BACKS = (("watari", ("down", "high"), 250, 2.55), ("gonta", ("hip", "down"), 470, 2.55),
            ("mina", ("down", "down"), 680, 2.55), ("hero2", ("down", "down"), 880, 2.55))
S4_FEET = 902


def ashen(c):
    """灰色の霞の中の人物：少しくすませ、空の橙を受ける。"""
    return mix(mix(c, "#7c7672", .14), "#ffb478", .05)


def scene4():
    R = random.Random(504)
    o = [HEAD.format(label="灰の舞う霞んだ空。船首に立つシオン・ミナ・ゴンタ・ワタリの後ろ姿。ワタリが指す先に、煙を上げる黒い火山島")]
    o.append(f"<style>{S4_CSS}</style>")
    bdefs, backs = figure_set([(cid, "back", arms, (x, S4_FEET), s, False) for cid, arms, x, s in S4_BACKS], "s4-b-",
                              tone=ashen, rims=(("#ffcf9a", 0, -1.2, .7),))
    o.append('<defs><linearGradient id="s4-sky" x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#6f6a72"/><stop offset=".6" stop-color="#ad9584"/><stop offset="1" stop-color="#dcb489"/></linearGradient>'
             '<linearGradient id="s4-sea" x1="0" y1="510" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#8b8f94"/><stop offset="1" stop-color="#3f4b56"/></linearGradient>'
             '<radialGradient id="s4-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2b4" stop-opacity=".8"/>'
             '<stop offset="1" stop-color="#ffe2b4" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s4-deck" x1="0" y1="740" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#9c7448"/><stop offset="1" stop-color="#6e4f30"/></linearGradient>'
             + Q.volcano_defs("s4-v-") + bdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append('<circle cx="560" cy="170" r="190" fill="url(#s4-sun)"/><circle cx="560" cy="170" r="40" fill="#fff0d2" opacity=".55"/>')
    o.append('<g class="s4-haze mv" opacity=".55"><path d="' + " ".join(kasumi(x, y, w, h) for x, y, w, h in
             ((-60, 260, 640, 26), (700, 210, 560, 22), (240, 400, 700, 20))) + '" fill="#9e9298"/></g>')
    # 火山島と噴煙
    isle = (Q.volcano("s4-v-", R, 1240, 522, 640, 250)
            + Q.crater_glow("s4-v-", "s4-glow", 1240, 272, 40)
            + f'<g class="s4-plume mv">{Q.plume(R, "s4-puff mv", 1240, 268, 250, 150, lean=-.5)}</g>')
    o.append(f'<g class="s4-isle mv">{isle}</g>')
    o.append('<rect x="0" y="512" width="1600" height="388" fill="url(#s4-sea)"/>')
    o.append('<path d="M920,516 C1020,506 1120,508 1240,516 C1360,524 1480,520 1560,516Z" fill="#26232a" opacity=".55"/>')
    o.append(f'<g class="s4-wv mv">{M4.waves(R, 0, 1600, 530, 720, 26, color="#d6dadf", opacity=.35)}</g>')
    # 船首：舷側の上の手すり（右へ上がる）と、甲板
    o.append('<path d="M-20,742 L1180,724 Q1420,716 1620,640 L1620,700 Q1430,770 1180,768 L-20,786Z" fill="#5a3f24" stroke="#2a1c10" stroke-width="4"/>'
             '<path d="M-20,742 L1180,724 Q1420,716 1620,640" fill="none" stroke="#c99c5f" stroke-width="8"/>'
             '<path d="M-20,786 L1180,768 Q1430,770 1620,700 L1620,900 L-20,900Z" fill="url(#s4-deck)"/>'
             + "".join(f'<path d="M-20,{y} L1620,{y - 26}" stroke="#4f3820" stroke-width="2.4" opacity=".55"/>' for y in (818, 852, 890)))
    for markup in backs:
        o.append(markup.replace('class="wave"', 'class="s4-point"'))   # 島を指す手は振らない
    o.append(f'<g class="s4-ashset mv">{Q.ash(R, "s4-ash mv", 0, 1700, -40, 860, 90)}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面5：焼けた船着き場（タイトル）
# ---------------------------------------------------------------------------
S5_CSS = """
.is-active .s5-ash{animation:s5-ash 4.4s linear infinite}
.s5-ash{opacity:0}
.is-active .s5-puff{animation:s5-puff 3.2s ease-in-out infinite alternate}
.s5-puff{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s5-plume{animation:s5-plume 6s linear both}
.is-active .s5-glow,.is-active .s5-em{animation:s5-glow 1.3s ease-in-out infinite alternate}
.is-active .s5-wisp{animation:s5-wisp 3.6s linear infinite}
.s5-wisp{transform-box:fill-box;transform-origin:50% 100%;opacity:0}
.is-active .s5-ship{animation:s5-ship 6s ease-out both}
.is-active .s5-wv{animation:s5-wv 3s ease-in-out infinite alternate}
@keyframes s5-ash{0%{transform:translate(0,0);opacity:0}12%{opacity:.8}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s5-puff{from{transform:scale(.96)}to{transform:scale(1.05)}}
@keyframes s5-plume{to{transform:translate(-50px,-20px)}}
@keyframes s5-glow{from{opacity:.45}to{opacity:1}}
@keyframes s5-wisp{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:.6}100%{transform:translate(-30px,-110px) scale(1.5);opacity:0}}
@keyframes s5-ship{from{transform:translateX(-90px)}}
@keyframes s5-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
"""


def wisp(cls, x, y, k=1.0, delay=0):
    return "".join(f'<circle class="{cls}" cx="{n(x)}" cy="{n(y)}" r="{n(r * k)}" fill="#7a716d" '
                   f'style="animation-delay:-{n(d + delay)}s"/>' for r, d in ((10, 0), (14, 1.2), (18, 2.4)))


def scene5():
    R = random.Random(505)
    o = [HEAD.format(label="黒い火山のふもとの黒い浜。焼け落ちた桟橋と小屋から細い煙。沖から船が近づく。タイトル「火山島編」")]
    o.append(f"<style>{S5_CSS}</style>")
    o.append('<defs><linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="520" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#4e464e"/><stop offset=".55" stop-color="#8d7064"/><stop offset="1" stop-color="#cf9a6a"/></linearGradient>'
             '<linearGradient id="s5-sea" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#7b7f86"/><stop offset="1" stop-color="#36404a"/></linearGradient>'
             '<linearGradient id="s5-sand" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#4a4442"/><stop offset="1" stop-color="#262222"/></linearGradient>'
             + Q.volcano_defs("s5-v-") + P.ship_defs("s5-sh-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s5-sky)"/>')
    # 火山（大きく）と噴煙
    o.append(f'<g class="s5-plume mv">{Q.plume(R, "s5-puff mv", 930, 150, 300, 230, lean=-.7, puffs=18)}</g>')
    o.append(Q.volcano("s5-v-", R, 930, 600, 1400, 450) + Q.crater_glow("s5-v-", "s5-glow", 930, 150, 70))
    # 手前の低い丘（火山との間の奥行き）と、焼けた林（黒い枯れ木）
    o.append('<path d="M380,600 C520,540 700,520 860,548 C1000,572 1120,520 1280,512 C1420,506 1540,530 1620,548 L1620,620 L380,620Z" '
             'fill="#262225"/><path d="M380,600 C520,540 700,520 860,548 C1000,572 1120,520 1280,512 C1420,506 1540,530 1620,548" '
             'fill="none" stroke="#5a5054" stroke-width="3" opacity=".6"/>')
    for i in range(18):
        x = 560 + i * 58 + R.uniform(-14, 14)
        y = 572 - 40 * max(0, 1 - abs(x - 1250) / 420) + R.uniform(-6, 6)
        h = R.uniform(30, 56)
        o.append(f'<path d="M{n(x)},{n(y)} L{n(x + 1)},{n(y - h)} M{n(x)},{n(y - h * .55)} L{n(x - 10)},{n(y - h * .8)} '
                 f'M{n(x + 1)},{n(y - h * .4)} L{n(x + 11)},{n(y - h * .66)}" stroke="#1d1818" stroke-width="3.2" stroke-linecap="round"/>')
    # 海（左手前）と黒い浜（右）
    o.append('<rect x="0" y="560" width="1600" height="340" fill="url(#s5-sea)"/>')
    o.append('<path d="M560,900 C700,760 860,660 1060,610 C1240,570 1440,566 1620,574 L1620,900Z" fill="url(#s5-sand)"/>'
             '<path d="M560,900 C700,760 860,660 1060,610 C1240,570 1440,566 1620,574" fill="none" stroke="#c9ccd2" stroke-width="5" opacity=".55"/>')
    o.append(f'<g class="s5-wv mv">{M4.waves(R, 0, 900, 590, 880, 22, color="#d8dbe0", opacity=.35)}</g>')
    # 沖から近づく船（小さく、四人の頭）
    ship = P.ship_full("s5-sh-", crew=P.tiny_crew())
    o.append(f'<g class="s5-ship mv"><g transform="translate(250 612) scale(.42)">{ship}</g></g>')
    # 焼け落ちた小屋と桟橋（細い煙）
    o.append(Q.burnt_shed(1300, 600, 1.15, ember_cls="s5-em"))
    o.append(wisp("s5-wisp mv", 1290, 520, 1.2) + wisp("s5-wisp mv", 1360, 560, .9, .8))
    o.append(Q.burnt_pier(R, 1040, 640, 560, 880, 120, 300, posts=6, gaps=(2, 4), embers_cls="s5-em"))
    o.append(wisp("s5-wisp mv", 860, 700, 1.0, .4) + wisp("s5-wisp mv", 690, 800, 1.3, 1.6))
    o.append(f'<g class="s5-ashset mv">{Q.ash(R, "s5-ash mv", 0, 1700, -40, 860, 80)}</g>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3, scene4, scene5]
