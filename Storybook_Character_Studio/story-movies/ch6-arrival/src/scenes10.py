"""ダーマ再興編の始まり「始まりの場所」の5場面のSVG。

  1. これまでの旅      三枚の思い出の額：神殿からの脱出（プロローグ第4場面）、復興したジパング（M4第1場面）、
                       清めの泉（M7第1場面）。順に現れ、前の額は少し暗くなる。
  2. 夜明けの海        M7の夜の海の続き。星が消えて空が白み、右の水平線から日が昇る。船の上の四人。
  3. 海から山へ続く島  船首に立つ四人の後ろ姿（シオンの背中に職業の書）。ワタリが指す先に、左で海に接し、
                       右の奥へ山が重なって続く島。山腹に小さく、神殿跡の二本の柱。
  4. 神殿跡            山腹の崩れた神殿跡を見上げる。プロローグ・M7と同じ基壇と柱の並びで、屋根はなく、
                       二本の柱だけが立つ。麓から古い水運びの坂道（石段）が上り、谷の橋は落ちている。
  5. 着岸              朝の浜の古い桟橋に船が着く。奥の山腹に神殿跡。タイトル「ダーマ再興編」。

思い出の額（場面1）は、ほかのムービーの場面をそのまま縮めて入れる（火山島編の始まりの props5.recall）。元の接頭辞
（s4- / s1-）はこの場面の接頭辞の下（s1-pa- / s1-mb- / s1-mc-）に置き換え、元の動きはこの場面の再生中に動く。
座標は viewBox="0 0 1600 900"。乱数は場面ごとの固定シード。位置が動くアニメーションには .mv を付け、
モーション軽減時に止める。現れ方（不透明度）は .mv の付かない外側の組に分けて、止めても絵が残るようにする。
第6～7章は未実装なので、スズハ・再建した神殿・ヴァルガは描かない。
"""
import os
import random

from helpers import n, kasumi, mountain
from figures import Cast, place, mix
import props as P          # 第3章の結末の船（../../ch3-departure/src/props.py）
import props5 as V         # 火山島編の始まりの思い出の額・星（../../ch4-arrival/src/props5.py）
import scenes as M4        # 第3章の結末の場面（思い出の額と、空・海の部品）
import scenes_b as PB      # プロローグの場面（思い出の額）
import scenes7 as M7       # 火山島編の結末の場面（思い出の額）
import props10 as Q

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
    """思い出の額：影、縮めた場面、色味のうすい重ね、四隅の暗がり、金の縁（火山島編の始まりと同じ）。"""
    h = w * 900 / 1600
    return (f'<rect x="{n(x + 14)}" y="{n(y + 18)}" width="{n(w)}" height="{n(h)}" rx="8" fill="#000" opacity=".35"/>'
            + recalled
            + f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{tint}" opacity="{tint_op}"/>'
            + f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="url(#{pfx}vig)"/>'
            + V.frame(x, y, w))


def vignette_defs(pfx):
    return (f'<radialGradient id="{pfx}vig" cx=".5" cy=".5" r=".72"><stop offset=".62" stop-color="#1a1208" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#1a1208" stop-opacity=".45"/></radialGradient>')


# 遠くの島の山並み（場面3・5）。奥から手前へ（稜線のキーポイント・色・縁の色・縁の不透明度）。
def far_ranges(dx=0.0, dy=0.0, k=1.0):
    def keys(pts):
        return [(dx + x * k, dy + y * k) for x, y in pts]
    return [
        (keys([(700, 520), (840, 430), (980, 360), (1120, 300), (1270, 254), (1420, 236), (1560, 244), (1700, 262)]), "#aebdd0", "#eef3f8", .5),
        (keys([(600, 520), (760, 446), (900, 392), (1030, 346), (1150, 360), (1290, 318), (1430, 330), (1580, 312), (1700, 330)]), "#86a0b0", "#dfe9ef", .45),
        (keys([(500, 520), (600, 490), (700, 456), (820, 418), (940, 398), (1040, 424), (1160, 410), (1300, 444), (1440, 462), (1600, 472), (1700, 482)]),
         "#5f7f70", "#cfe0c8", .5),
    ]


# 神殿跡を島の山腹に置く位置（場面3の座標。場面5は同じ並びを大きく置く）
ISLE_RUIN = (952, 404)


# ---------------------------------------------------------------------------
# 場面1：これまでの旅（三枚の思い出の額）
# ---------------------------------------------------------------------------
S1_CSS = """
.s1-pa-shotb{display:none}
.is-active .s1-fa .s1-pa-shota{animation:none}
.s1-fa,.s1-fb,.s1-fc{opacity:0}
.is-active .s1-fa{animation:s1-in 1s .1s ease-out both,s1-dim .8s 2.5s ease-in forwards}
.is-active .s1-fb{animation:s1-in .9s 2.5s ease-out both,s1-dim .8s 4.8s ease-in forwards}
.is-active .s1-fc{animation:s1-in .9s 4.8s ease-out both}
.s1-mote{opacity:0}
.is-active .s1-mote{animation:s1-mote 3.6s ease-out infinite}
.is-active .s1-glow{animation:s1-glow 7.2s ease-in-out both}
@keyframes s1-in{from{opacity:0}to{opacity:1}}
@keyframes s1-dim{from{opacity:1}to{opacity:.7}}
@keyframes s1-mote{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s1-glow{from{opacity:.35}to{opacity:.9}}
"""


def scene1():
    R = random.Random(1001)
    o = [HEAD.format(label="三枚の思い出の額。燃える神殿から職業の書を背負って逃れるシオン、朝の光の中の復興したジパング、澄んだ水の戻った火山島の泉")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append('<defs><linearGradient id="s1-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e1530"/>'
             '<stop offset=".6" stop-color="#2c2a48"/><stop offset="1" stop-color="#5a4458"/></linearGradient>'
             '<radialGradient id="s1-book" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffdf8a" stop-opacity=".5"/>'
             '<stop offset="1" stop-color="#ffdf8a" stop-opacity="0"/></radialGradient>' + vignette_defs("s1-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s1-bg)"/>')
    o.append(V.star_field(R, "s1-star", 50, 900).replace('class="s1-star"', 'opacity=".45"'))
    o.append('<ellipse class="s1-glow" cx="820" cy="470" rx="780" ry="430" fill="url(#s1-book)"/>')
    o.append(f'<g class="s1-mote-set mv">{motes(R, "s1-mote mv", 34, 80, 1520, 560, 900)}</g>')
    ax, ay, aw = 80, 70, 720
    bx, by, bw = 812, 104, 700
    cx, cy, cw = 450, 418, 640
    a = V.recall(PB.scene4(), "s4-", "s1-pa-", ax, ay, aw)
    b = V.recall(M4.scene1(), "s1-", "s1-mb-", bx, by, bw)
    c = V.recall(M7.scene1(), "s1-", "s1-mc-", cx, cy, cw)
    # 額は動かさない（中の場面が毎コマ描き直しになり重くなるため）。現れ方と明るさだけを変える
    o.append(f'<g class="s1-fa"><g transform="rotate(-2 440 272)">{card("s1-", a, ax, ay, aw)}</g></g>')
    o.append(f'<g class="s1-fb"><g transform="rotate(1.6 1162 301)">{card("s1-", b, bx, by, bw, "#fff0c8", .1)}</g></g>')
    o.append(f'<g class="s1-fc"><g transform="rotate(-1 770 598)">{card("s1-", c, cx, cy, cw, "#f2f6e8", .1)}</g></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：夜明けの海（M7の夜の海の続き）
# ---------------------------------------------------------------------------
S2_CSS = """
.is-active .s2-night{animation:s2-day 4.6s .2s ease-in-out both}
.is-active .s2-starset{animation:s2-day 3s ease-in both}
.is-active .s2-star{animation:s2-tw 1.8s ease-in-out infinite alternate}
.is-active .s2-sun{animation:s2-sun 5.2s ease-out both}
.is-active .s2-sunglow{animation:s2-glow 5.2s ease-out both}
.is-active .s2-sail{animation:s2-sail 5.2s linear both}
.is-active .s2-bob{animation:s2-bob 2.4s ease-in-out infinite alternate}
.is-active .s2-wv{animation:s2-wv 3s ease-in-out infinite alternate}
.is-active .s2-gl{animation:s2-gl 1.9s ease-in-out infinite}
.is-active .s2-sh-flag{animation:s2-flag .9s ease-in-out infinite alternate}
.s2-sh-flag{transform-box:fill-box;transform-origin:0% 50%}
.s2-gullset{opacity:0}
.is-active .s2-gullset{animation:s2-in 1s 2.8s ease-out both}
.is-active .s2-flock{animation:s2-flock 5.2s linear both}
.is-active .s2-gull{animation:s2-flap .5s ease-in-out infinite alternate}
.s2-gull{transform-box:fill-box;transform-origin:50% 100%}
@keyframes s2-day{to{opacity:0}}
@keyframes s2-in{to{opacity:1}}
@keyframes s2-tw{from{opacity:.35}to{opacity:1}}
@keyframes s2-sun{from{transform:translateY(54px)}}
@keyframes s2-glow{from{opacity:.4}to{opacity:1}}
@keyframes s2-sail{from{transform:translateX(-50px)}to{transform:translateX(40px)}}
@keyframes s2-bob{from{transform:translateY(-4px) rotate(-.8deg)}to{transform:translateY(4px) rotate(.8deg)}}
@keyframes s2-wv{from{transform:translateX(-14px)}to{transform:translateX(14px)}}
@keyframes s2-gl{0%,100%{opacity:.15}50%{opacity:.95}}
@keyframes s2-flag{from{transform:skewY(-6deg) scaleX(.9)}to{transform:skewY(6deg)}}
@keyframes s2-flock{from{transform:translate(60px,20px)}to{transform:translate(-80px,-30px)}}
@keyframes s2-flap{from{transform:scaleY(1)}to{transform:scaleY(.45)}}
"""
S2_SHIP_AT, S2_SHIP_SCALE = (760, 664), 1.3
# 甲板の四人（船の座標）。舵輪のワタリは船尾楼、三人は甲板で行く手（右）を見る。
S2_CREW = (("watari", ("helm", "helm"), (-176, -112), 1.0), ("gonta", ("hip", "down"), (-34, -64), 1.0),
           ("mina", ("front", "front"), (58, -64), 1.0), ("hero2", ("down", "down"), (156, -64), 1.0))
S2_HORIZON = 470


def dawn(c):
    """夜明け：人物を少し青く沈め、右からの朝日の色を受ける。"""
    return mix(mix(c, "#3a3f6a", .14), "#ffb48a", .07)


def scene2():
    R = random.Random(1002)
    o = [HEAD.format(label="夜明けの海。星が消えて空が白み、右の水平線から日が昇る。わらの帆の船の上に、舵輪のワタリとゴンタ・ミナ・シオン")]
    o.append(f"<style>{S2_CSS}</style>")
    cdefs, crew = figure_set([(cid, "front", arms, at, s, True) for cid, arms, at, s in S2_CREW], "s2-c-", tone=dawn,
                             rims=(("#ffc49a", .9, -.6, .6),))
    o.append('<defs><linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="470" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#4a5c92"/><stop offset=".5" stop-color="#c49aa8"/><stop offset=".85" stop-color="#f7c08c"/>'
             '<stop offset="1" stop-color="#ffd9a0"/></linearGradient>'
             '<linearGradient id="s2-nt" x1="0" y1="0" x2="0" y2="470" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#070b1c"/><stop offset=".7" stop-color="#1b2748"/><stop offset="1" stop-color="#3a4870"/></linearGradient>'
             '<linearGradient id="s2-sea" x1="0" y1="460" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#b8909a"/><stop offset=".4" stop-color="#6f6f96"/><stop offset="1" stop-color="#26355e"/></linearGradient>'
             '<radialGradient id="s2-sunglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3d0" stop-opacity=".95"/>'
             '<stop offset=".3" stop-color="#ffd38f" stop-opacity=".5"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>'
             + P.ship_defs("s2-sh-") + cdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append(f'<circle class="s2-sunglow" cx="1240" cy="{S2_HORIZON}" r="330" fill="url(#s2-sunglow)"/>')
    o.append(f'<g class="s2-sun mv"><circle cx="1240" cy="{S2_HORIZON + 6}" r="46" fill="#fff1c8"/>'
             f'<circle cx="1240" cy="{S2_HORIZON + 6}" r="38" fill="#fffae6"/></g>')
    # 夜の名残（上から明けていく）と、消えていく星
    o.append('<rect class="s2-night" width="1600" height="470" fill="url(#s2-nt)" opacity=".9"/>')
    o.append(f'<g class="s2-starset">{V.star_field(R, "s2-star", 70, 380)}</g>')
    o.append(M4.clouds(R, [(80, 250, 420, 16), (640, 300, 380, 12), (1360, 230, 300, 12)], body="#f6c8b8", shade="#b48ca8", cls="s2-cl"))
    o.append(f'<rect x="0" y="{S2_HORIZON - 4}" width="1600" height="{900 - S2_HORIZON + 4}" fill="url(#s2-sea)"/>')
    # 日の光の道
    o.append(f'<path d="M1180,{S2_HORIZON} L1300,{S2_HORIZON} L1420,900 L1060,900Z" fill="#ffd9a0" opacity=".18"/>')
    o.append(M4.glints(R, "s2-gl", 1110, 1370, S2_HORIZON + 8, 760, 34, "#fff2c8"))
    o.append(f'<g class="s2-wv mv">{M4.waves(R, 0, 1600, S2_HORIZON + 20, 800, 30, color="#f4d6c8", opacity=.35)}</g>')
    # 船荷：中身の入った樽と袋（船の座標。下は舷側に隠れる）
    cargo = V.barrel(-104, -80, 1.0) + V.sack(250, -80, .9)
    ship = P.ship_full("s2-sh-", crew=cargo + "".join(crew)) + f'<path d="{P.SAIL_D}" fill="#ffd2a8" opacity=".16"/>'
    sx, sy = S2_SHIP_AT
    o.append(f'<g class="s2-sail mv"><g class="s2-bob mv" style="transform-origin:{sx}px {sy}px">'
             f'<g transform="translate({sx} {sy}) scale({S2_SHIP_SCALE})">{ship}</g></g>'
             f'<path d="M{sx - 300},{sy + 20} Q{sx},{sy + 36} {sx + 330},{sy + 18}" fill="none" stroke="#1d2850" stroke-width="16" opacity=".4"/></g>')
    o.append(f'<path d="M0,{sy + 10} L1600,{sy + 10} L1600,900 L0,900Z" fill="#1d2a50" opacity=".4"/>')
    o.append(M4.waves(R, 0, 1600, sy + 24, 870, 20, color="#d8c8d8", opacity=.4))
    # 陸が近いしるしの、かもめ（後半に現れる）
    birds = ((1160, 300, 1.1, 0), (1230, 270, .9, .2), (1300, 320, .8, .35))
    o.append('<g class="s2-gullset"><g class="s2-flock mv">'
             + "".join(f'<g transform="translate({x} {y}) scale({s})"><path class="s2-gull mv" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" '
                       f'fill="none" stroke="#3d3a5a" stroke-width="2.6" stroke-linecap="round" style="animation-delay:-{d}s"/></g>'
                       for x, y, s, d in birds) + "</g></g>")
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：海から山へ続く島（船首の四人の後ろ姿）
# ---------------------------------------------------------------------------
S3_CSS = """
.is-active .s3-isle{animation:s3-isle 5.2s ease-out both}
.s3-isle{transform-origin:1100px 520px}
.is-active .s3-haze{animation:s3-haze 5.2s linear both}
.is-active .s3-wv{animation:s3-wv 2.8s ease-in-out infinite alternate}
.is-active .s3-gl{animation:s3-gl 1.9s ease-in-out infinite}
.is-active .s3-shore{animation:s3-shore 2.4s ease-in-out infinite alternate}
.is-active .s3-ruinlight{animation:s3-ruinlight 2.6s ease-in-out infinite alternate}
@keyframes s3-isle{from{transform:scale(.92)}to{transform:scale(1.02)}}
@keyframes s3-haze{from{transform:translateX(60px)}to{transform:translateX(-60px)}}
@keyframes s3-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s3-gl{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes s3-shore{from{opacity:.35}to{opacity:.9}}
@keyframes s3-ruinlight{from{opacity:.35}to{opacity:.8}}
"""
# 船首の甲板に立つ四人（後ろ姿）。ワタリが右手を上げて島を指す。シオンは背中のホルダーに職業の書。
S3_BACKS = (("watari", ("down", "high"), 250, 2.55), ("gonta", ("hip", "down"), 470, 2.55),
            ("mina", ("down", "down"), 680, 2.55), ("hero2", ("down", "down"), 880, 2.55))
S3_FEET = 902


def morning(c):
    """朝の光：人物を少し暖かく。"""
    return mix(c, "#fff1d6", .06)


def scene3():
    R = random.Random(1003)
    o = [HEAD.format(label="晴れた朝の海。船首に立つシオン・ミナ・ゴンタ・ワタリの後ろ姿。シオンの背中に職業の書。ワタリが指す先に、"
                           "左で海に接し、右の奥へ山が重なって続く島。山腹に小さく、神殿跡の二本の柱")]
    o.append(f"<style>{S3_CSS}</style>")
    bdefs, backs = figure_set([(cid, "back", arms, (x, S3_FEET), s, False) for cid, arms, x, s in S3_BACKS], "s3-b-",
                              tone=morning, rims=(("#fff3cf", 1.1, -.7, .8),))
    o.append("<defs>" + M4.sky_defs("s3-", "#7fb6e0", "#cfe3ef", "#f6e6cc", 520) + M4.sea_defs("s3-", 512, 900, "#a9cde3", "#2f6f9f")
             + '<linearGradient id="s3-deck" x1="0" y1="740" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#b08454"/><stop offset="1" stop-color="#7a5634"/></linearGradient>'
             + bdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append('<circle cx="1480" cy="90" r="260" fill="url(#s3-sunglow)"/>')
    o.append(M4.clouds(R, [(-40, 150, 520, 18), (560, 110, 420, 14)], cls="s3-cl"))
    # 島：左で海に接し、右の奥へ山が続く。山腹に神殿跡（遠景の色）と、そこへ上る坂道
    isle = Q.isle("s3-", R, 500, 520, far_ranges(), shore_cls="s3-shore")
    path = Q.stair_path(R, [(560, 512), (700, 488), (640, 470), (790, 444), (740, 428), (880, 414), (912, 404)], w=2.6, pal=Q.FAR,
                        steps=False, edge="#5f7f70")
    ruin = Q.place_remains(Q.temple_remains(random.Random(1010), Q.FAR, grass=False), ISLE_RUIN, .085)
    light = f'<ellipse class="s3-ruinlight" cx="{ISLE_RUIN[0]}" cy="{ISLE_RUIN[1] - 9}" rx="34" ry="13" fill="#fff6d8"/>'
    o.append(f'<g class="s3-isle mv">{isle}{path}{light}{ruin}</g>')
    o.append('<g class="s3-haze mv" opacity=".35"><path d="' + " ".join(kasumi(x, y, w, h) for x, y, w, h in
             ((300, 500, 420, 10), (1180, 506, 400, 8))) + '" fill="#f4f7f8"/></g>')
    o.append('<rect x="0" y="512" width="1600" height="388" fill="url(#s3-sea)"/>')
    o.append(M4.glints(R, "s3-gl", 900, 1500, 530, 700, 30, "#ffffff"))
    o.append(f'<g class="s3-wv mv">{M4.waves(R, 0, 1600, 530, 720, 26, color="#eef6fb", opacity=.45)}</g>')
    # 船首：舷側の上の手すり（右へ上がる）と、甲板（火山島編の始まりの第4場面と同じ形）
    o.append('<path d="M-20,742 L1180,724 Q1420,716 1620,640 L1620,700 Q1430,770 1180,768 L-20,786Z" fill="#6a4a2a" stroke="#2a1c10" stroke-width="4"/>'
             '<path d="M-20,742 L1180,724 Q1420,716 1620,640" fill="none" stroke="#d9ac6c" stroke-width="8"/>'
             '<path d="M-20,786 L1180,768 Q1430,770 1620,700 L1620,900 L-20,900Z" fill="url(#s3-deck)"/>'
             + "".join(f'<path d="M-20,{y} L1620,{y - 26}" stroke="#5a3f24" stroke-width="2.4" opacity=".5"/>' for y in (818, 852, 890)))
    for markup in backs:
        o.append(markup.replace('class="wave"', 'class="s3-point"'))   # 島を指す手は振らない
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面4：神殿跡（山腹の崩れた神殿を見上げる）
# ---------------------------------------------------------------------------
S4_CSS = """
.is-active .s4-ray{animation:s4-ray 5.6s ease-in-out both}
.is-active .s4-dust{animation:s4-dust 4.2s ease-out infinite}
.s4-dust{opacity:0}
.is-active .s4-grass{animation:s4-grass 2.4s ease-in-out infinite alternate}
.s4-grass{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s4-flock{animation:s4-flock 5.6s ease-in both}
.is-active .s4-bird{animation:s4-flap .45s ease-in-out infinite alternate}
.s4-bird{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s4-cl{animation:s4-cl 5.6s linear both}
@keyframes s4-ray{from{opacity:.15}50%{opacity:.55}to{opacity:.35}}
@keyframes s4-dust{0%{transform:translate(0,0);opacity:0}20%{opacity:.8}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s4-grass{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}
@keyframes s4-flock{from{transform:translate(0,0)}to{transform:translate(-260px,-120px)}}
@keyframes s4-flap{from{transform:scaleY(1)}to{transform:scaleY(.4)}}
@keyframes s4-cl{from{transform:translateX(30px)}to{transform:translateX(-40px)}}
"""
S4_RUIN_AT, S4_RUIN_SCALE = (820, 432), .78


def scene4():
    R = random.Random(1004)
    o = [HEAD.format(label="朝の山腹の崩れた神殿跡を見上げる。三段の基壇の上に、屋根を失った二本の柱だけが立ち、ほかの柱は折れて倒れている。"
                           "麓から古い石段の坂道が上り、谷に架かっていた橋は落ちている")]
    o.append(f"<style>{S4_CSS}</style>")
    o.append("<defs>" + M4.sky_defs("s4-", "#86bde4", "#cfe5f0", "#f8ecd2", 520)
             + '<linearGradient id="s4-slope" x1="0" y1="420" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#8fae6c"/><stop offset="1" stop-color="#4f7a4c"/></linearGradient>'
             '<linearGradient id="s4-rayg" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d6" stop-opacity=".9"/>'
             '<stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append('<circle cx="1430" cy="70" r="300" fill="url(#s4-sunglow)"/>')
    o.append(M4.clouds(R, [(40, 120, 460, 16), (860, 70, 380, 12)], cls="s4-cl mv"))
    # 奥へ続く山（霞の色から手前の緑へ）
    for keys, color in (([(-40, 470), (160, 330), (360, 250), (560, 210), (760, 190), (960, 170), (1180, 120), (1400, 90), (1640, 70)], "#b5c6d4"),
                        ([(-40, 520), (200, 420), (420, 350), (640, 320), (900, 300), (1120, 250), (1340, 200), (1640, 170)], "#93ab9a")):
        body, ridge = mountain(keys, 900, R, depth=3, rough=.1)
        o.append(f'<path d="{body}" fill="{color}"/><path d="{ridge}" fill="none" stroke="#eef4f2" stroke-width="2.4" opacity=".45"/>')
    # 山腹（神殿の立つ斜面）。手前へ下る斜面の明暗の帯と、両側の木
    o.append('<path d="M-40,540 C160,490 320,440 420,420 L1220,420 C1320,404 1440,370 1640,350 L1640,900 L-40,900Z" fill="url(#s4-slope)"/>'
             '<path d="M-40,540 C160,490 320,440 420,420 M1220,420 C1320,404 1440,370 1640,350" fill="none" stroke="#c9dca8" stroke-width="3" opacity=".7"/>')
    o.append('<path d="M-40,690 C300,640 620,610 900,622 C1180,634 1420,600 1640,560 L1640,620 C1420,660 1180,690 900,680 C620,670 300,700 -40,760Z" '
             'fill="#a9c47e" opacity=".35"/>'
             '<path d="M-40,820 C360,770 760,760 1100,780 C1320,792 1500,770 1640,740 L1640,900 L-40,900Z" fill="#3f6a40" opacity=".35"/>')
    for x, y, w, h in ((120, 470, 70, 30), (60, 520, 84, 34), (1330, 400, 76, 32), (1420, 430, 90, 36), (1540, 380, 70, 30),
                       (1480, 540, 100, 40), (1300, 600, 84, 34)):
        o.append(P.pine(R, x, y, w, h, color="#4f7f57"))
    # 神殿跡：山腹から張り出す古い石積みの台の上に、三段の基壇
    o.append(Q.terrace(random.Random(1011), 400, 1240, S4_RUIN_AT[1] - 2, 536))
    o.append(f'<g id="s4-ruin">{Q.place_remains(Q.temple_remains(random.Random(1010), Q.DAY), S4_RUIN_AT, S4_RUIN_SCALE)}</g>')
    # 朝日の筋（右上から）
    rays = "".join(f'<path d="M1640,-40 L{n(x)},900 L{n(x + w)},900Z" fill="url(#s4-rayg)"/>' for x, w in ((520, 90), (760, 130), (1040, 80)))
    o.append(f'<g class="s4-ray" style="mix-blend-mode:screen">{rays}</g>')
    # 古い水運びの坂道（石段）。麓から石積みの台の左へ上る。途中の谷に架かっていた橋は落ちている
    o.append('<path d="M226,900 C230,800 240,720 256,656 L334,646 C326,720 340,810 368,900Z" fill="#3c5a3a"/>'
             '<path d="M256,656 C240,720 230,800 226,900 M334,646 C326,720 340,810 368,900" fill="none" stroke="#2c442b" stroke-width="3"/>')
    o.append(Q.stair_path(R, [(40, 900), (200, 800), (140, 726), (250, 656)], w=22))
    o.append(Q.stair_path(R, [(338, 644), (300, 590), (370, 540), (402, 468)], w=20))
    o.append(Q.broken_bridge(246, 342, 648))
    # 手前の草と岩
    for x, y, s in ((90, 880, 1.4), (700, 860, 1.1), (1080, 830, 1.3), (1400, 870, 1.5), (1530, 760, 1.0)):
        o.append(f'<path d="M{n(x - 40 * s)},{n(y)} L{n(x - 26 * s)},{n(y - 30 * s)} L{n(x + 8 * s)},{n(y - 38 * s)} L{n(x + 40 * s)},{n(y - 14 * s)} '
                 f'L{n(x + 46 * s)},{n(y)}Z" fill="#8b8375" stroke="#4a4236" stroke-width="3"/>'
                 f'<path d="M{n(x - 26 * s)},{n(y - 30 * s)} L{n(x + 8 * s)},{n(y - 38 * s)} L{n(x + 4 * s)},{n(y - 22 * s)}Z" fill="#a69e8e"/>')
    tufts = []
    for _ in range(26):
        x, y = R.uniform(0, 1600), R.uniform(640, 900)
        if 400 < x < 1240 and y < 720:
            continue
        h = R.uniform(18, 34)
        tufts.append(f'<path class="s4-grass mv" d="M{n(x - 8)},{n(y)} Q{n(x - 6)},{n(y - h)} {n(x - 2)},{n(y - h * 1.1)} M{n(x)},{n(y)} '
                     f'Q{n(x + 3)},{n(y - h * .9)} {n(x + 9)},{n(y - h)}" fill="none" stroke="#5f8a4a" stroke-width="3.2" stroke-linecap="round" '
                     f'style="animation-delay:-{n(R.uniform(0, 2.4))}s"/>')
    o.append("".join(tufts))
    # 舞い上がるほこり（柱のあたり）と、柱から飛び立つ鳥
    o.append("".join(f'<circle class="s4-dust mv" cx="{n(R.uniform(500, 1100))}" cy="{n(R.uniform(330, 470))}" r="{n(R.uniform(1.4, 2.8))}" '
                     f'fill="#fff6dc" style="--dx:{n(R.uniform(-40, 40))}px;--dy:{n(R.uniform(-70, -30))}px;animation-delay:-{n(R.uniform(0, 4.2))}s"/>'
                     for _ in range(22)))
    birds = ((980, 250, 1.0, 0), (1030, 230, .8, .15), (1070, 262, .7, .3))
    o.append('<g class="s4-flock mv">' + "".join(
        f'<g transform="translate({x} {y}) scale({s})"><path class="s4-bird mv" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" fill="none" '
        f'stroke="#3d4a5a" stroke-width="2.6" stroke-linecap="round" style="animation-delay:-{d}s"/></g>' for x, y, s, d in birds) + "</g>")
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面5：着岸（タイトル）
# ---------------------------------------------------------------------------
S5_CSS = """
.is-active .s5-ship{animation:s5-ship 3.4s cubic-bezier(.2,.6,.3,1) both}
.is-active .s5-bob{animation:s5-bob 2.6s ease-in-out infinite alternate}
.is-active .s5-wv{animation:s5-wv 3s ease-in-out infinite alternate}
.is-active .s5-gl{animation:s5-gl 1.9s ease-in-out infinite}
.is-active .s5-shore{animation:s5-shore 2.4s ease-in-out infinite alternate}
.is-active .s5-flock{animation:s5-flock 5.8s linear both}
.is-active .s5-gull{animation:s5-flap .5s ease-in-out infinite alternate}
.s5-gull{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s5-ruinlight{animation:s5-ruinlight 2.6s ease-in-out infinite alternate}
@keyframes s5-ship{from{transform:translateX(-300px)}}
@keyframes s5-bob{from{transform:translateY(-3px) rotate(-.5deg)}to{transform:translateY(3px) rotate(.5deg)}}
@keyframes s5-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s5-gl{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes s5-shore{from{opacity:.35}to{opacity:.9}}
@keyframes s5-flock{from{transform:translate(0,0)}to{transform:translate(-160px,-40px)}}
@keyframes s5-flap{from{transform:scaleY(1)}to{transform:scaleY(.45)}}
@keyframes s5-ruinlight{from{opacity:.3}to{opacity:.75}}
"""
S5_K, S5_DX, S5_DY = 1.5, -250, -150     # 場面3の島を大きく置く（神殿跡がタイトルの右下に来る）
S5_SEA = 610


def scene5():
    R = random.Random(1005)
    o = [HEAD.format(label="朝の浜。古い木の桟橋に、わらの帆の船が着く。奥の山腹に神殿跡の二本の柱と、そこへ上る坂道。"
                           "タイトル「職をつぐ者／ダーマ再興編／第6章　よみがえるダーマ神殿」")]
    o.append(f"<style>{S5_CSS}</style>")
    o.append("<defs>" + M4.sky_defs("s5-", "#7ab4e0", "#c4e0ef", "#f6e8cc", S5_SEA) + M4.sea_defs("s5-", S5_SEA, 900, "#9fcbe2", "#2f78ad")
             + '<linearGradient id="s5-sand" x1="0" y1="600" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#eadbb8"/><stop offset="1" stop-color="#d2bd90"/></linearGradient>'
             + P.ship_defs("s5-sh-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s5-sky)"/>')
    o.append('<circle cx="1500" cy="80" r="260" fill="url(#s5-sunglow)"/>')
    o.append(M4.clouds(R, [(60, 120, 420, 16), (700, 70, 360, 12)], cls="s5-cl"))
    # 島（場面3の並びを大きく）：坂道と神殿跡
    k = S5_K
    rx, ry = ISLE_RUIN[0] * k + S5_DX, ISLE_RUIN[1] * k + S5_DY
    isle = Q.isle("s5-", R, 500 * k + S5_DX, S5_SEA, far_ranges(S5_DX, S5_DY, k), shore_cls="s5-shore")
    path = Q.stair_path(R, [(560 * k + S5_DX, 512 * k + S5_DY), (700 * k + S5_DX, 488 * k + S5_DY), (640 * k + S5_DX, 470 * k + S5_DY),
                            (790 * k + S5_DX, 444 * k + S5_DY), (740 * k + S5_DX, 428 * k + S5_DY), (880 * k + S5_DX, 414 * k + S5_DY),
                            (rx - 18, ry)], w=4, pal=Q.FAR, steps=False, edge="#5f7f70")
    ruin = Q.place_remains(Q.temple_remains(random.Random(1010), Q.FAR, grass=False), (rx, ry), .085 * k)
    light = f'<ellipse class="s5-ruinlight" cx="{n(rx)}" cy="{n(ry - 12)}" rx="50" ry="19" fill="#fff6d8"/>'
    o.append(isle + path + light + ruin)
    # 海と、右の浜
    o.append(f'<rect x="0" y="{S5_SEA - 2}" width="1600" height="{900 - S5_SEA + 2}" fill="url(#s5-sea)"/>')
    o.append(M4.glints(R, "s5-gl", 100, 700, S5_SEA + 10, 800, 30, "#ffffff"))
    o.append(f'<g class="s5-wv mv">{M4.waves(R, 0, 900, S5_SEA + 20, 880, 26, color="#eef6fb", opacity=.45)}</g>')
    o.append('<path d="M1000,900 C1060,790 1160,700 1300,650 C1400,616 1500,606 1620,604 L1620,900Z" fill="url(#s5-sand)"/>'
             '<path class="s5-shore" d="M1000,900 C1060,790 1160,700 1300,650 C1400,616 1500,606 1620,604" fill="none" stroke="#ffffff" '
             'stroke-width="6" opacity=".6"/>')
    # 浜の草と石
    for _ in range(14):
        x = R.uniform(1240, 1600)
        y = R.uniform(680, 880)
        h = R.uniform(14, 26)
        o.append(f'<path d="M{n(x - 7)},{n(y)} Q{n(x - 5)},{n(y - h)} {n(x - 1)},{n(y - h * 1.1)} M{n(x)},{n(y)} Q{n(x + 3)},{n(y - h * .9)} '
                 f'{n(x + 8)},{n(y - h)}" fill="none" stroke="#7d9a55" stroke-width="3" stroke-linecap="round"/>')
    # 古い桟橋（浜から沖へ）と、着く船
    o.append(Q.old_pier(R, 1240, 560, 700, depth=30, posts=6, missing=(2, 4)))
    ship = P.ship_full("s5-sh-", crew=P.tiny_crew())
    o.append(f'<g class="s5-ship mv"><g class="s5-bob mv" style="transform-origin:380px 720px">'
             f'<g transform="translate(380 724) scale(.6)">{ship}</g></g>'
             '<path d="M240,736 Q380,748 530,734" fill="none" stroke="#1d4a6e" stroke-width="10" opacity=".35"/></g>')
    o.append(M4.waves(R, 0, 1000, 760, 890, 16, color="#eef6fb", opacity=.5))
    birds = ((1120, 240, 1.0, 0), (1180, 214, .8, .2), (1250, 256, .9, .35), (960, 300, .7, .1))
    o.append('<g class="s5-flock mv">' + "".join(
        f'<g transform="translate({x} {y}) scale({s})"><path class="s5-gull mv" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" fill="none" '
        f'stroke="#3d4f6a" stroke-width="2.6" stroke-linecap="round" style="animation-delay:-{d}s"/></g>' for x, y, s, d in birds) + "</g>")
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3, scene4, scene5]
