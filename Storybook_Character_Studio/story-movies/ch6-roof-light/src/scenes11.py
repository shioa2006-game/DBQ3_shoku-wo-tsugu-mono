"""第6章の結び「大屋根の灯」の5場面のSVG。

  1. 灯のともる祭壇    再建した本堂の中。要石を据えた祭壇に授職の灯がともり、そばの選択の柱のアサギの大工の印が光る。
  2. 祝いの夜          灯のともった神殿と共同台所の前。膳を囲むガンゾウ・スズハ・ワタリ・シオン・アサギ・ゴンタ・ピノと、
                       鍋を運んでくるミナ。
  3. 海岸から望む神殿  夜の海岸から、山の肩に立つ神殿を見上げる。大屋根の窓と提灯の灯が、海に映る。
  4. 遠い咆哮          神殿の軒先から夜の海を見る。咆哮が届いて提灯の灯が揺れ、林から鳥が飛び立つ。月の光る沖を、
                       ガーゴイルの群れを従えた三つ首の影が横切る（輪郭だけ）。
  5. 結び              静かになった夜空と、灯のともった大屋根。タイトル「第6章・完」。

再建した神殿は共通部品（../../shared/temple.py の temple_rebuilt。崩れた神殿跡と同じ基壇と柱の並び）。
座標は viewBox="0 0 1600 900"。乱数は場面ごとの固定シード。位置が動くアニメーションには .mv を付け、
モーション軽減時に止める。現れ方（不透明度）は .mv の付かない外側の組に分けて、止めても絵が残るようにする。
ヴァルガの名前・色・全身、ガーゴイルの姿は見せない（影の輪郭だけ）。授職の場面そのものも描かない。
"""
import os
import random

from helpers import n
from figures import Cast, place, mix
import scenes as M4        # 第3章の結末の空・海の部品（../../ch3-departure/src/scenes.py）
import scenes9 as M9       # 第2章の結びの膳の料理と提灯（../../ch2-harvest/src/scenes9.py）
import temple as T         # 再建した神殿（../../shared/temple.py）
import props11 as Q

HEAD = M4.HEAD
CAST = Cast(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts", "cast.json"))


def figure(cid, direction, arms, at, scale, prefix, tone=None, rims=(), bust=False, extra=""):
    """人物1人（extra はセル座標で胴の上に重ねる絵＝手に持つ鍋など）。返り値は (defs, 描画, Figure)。"""
    f = CAST.figure(cid, direction, f"{prefix}{cid}-{direction}-", arms=arms, legs=not bust, tone=tone, rims=rims, arms_over=True)
    return f.defs, place(f.rim, at, scale, f.foot) + place(f.body + extra, at, scale, f.foot), f


def stars(R, cls, count, y1=480):
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(0, 1600))}" cy="{n(R.uniform(10, y1))}" r="{n(R.uniform(.9, 2.1))}" '
                   f'fill="#f2f4ff" style="animation-delay:-{n(R.uniform(0, 3))}s"/>' for _ in range(count))


def place_temple(markup, at, scale):
    """再建した神殿（プロローグの座標）を、基壇の中央の下端 (800, 592) が at に来るように置く。"""
    return T.place_remains(markup, at, scale)


def motes(R, cls, count, x0, x1, y0, y1, color="#ffe9a8"):
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(x0, x1))}" cy="{n(R.uniform(y0, y1))}" r="{n(R.uniform(1.6, 3.4))}" fill="{color}" '
                   f'style="--dx:{n(R.uniform(-30, 30))}px;--dy:{n(R.uniform(-170, -90))}px;animation-delay:-{n(R.uniform(0, 3.4))}s"/>'
                   for _ in range(count))


# ---------------------------------------------------------------------------
# 場面1：灯のともる祭壇
# ---------------------------------------------------------------------------
S1_CSS = """
.s1-flame{transform-box:fill-box;transform-origin:50% 100%;transform:scale(0)}
.is-active .s1-flame{animation:s1-light 1s .35s cubic-bezier(.2,.8,.3,1.2) both,s1-flick .5s 1.35s ease-in-out infinite alternate}
.is-active .s1-fl{animation:s1-fl .45s ease-in-out infinite alternate}
.s1-fl{transform-box:fill-box;transform-origin:50% 100%}
.s1-halo,.s1-keyglow,.s1-mark{opacity:0}
.is-active .s1-halo{animation:s1-halo 1.6s .4s ease-out both}
.is-active .s1-keyglow{animation:s1-in .8s .6s ease-out both,s1-pulse 1.6s 1.4s ease-in-out infinite alternate}
.is-active .s1-mark{animation:s1-in .8s 1.2s ease-out both,s1-pulse 1.6s 2s ease-in-out infinite alternate}
.s1-mote{opacity:0}
.is-active .s1-mote{animation:s1-mote 3.4s 0.6s ease-out infinite}
@keyframes s1-light{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes s1-flick{from{transform:scale(1,1)}to{transform:scale(.94,1.06)}}
@keyframes s1-fl{from{transform:scale(1,1)}to{transform:scale(.9,1.1)}}
@keyframes s1-halo{from{opacity:0}to{opacity:1}}
@keyframes s1-in{from{opacity:0}to{opacity:1}}
@keyframes s1-pulse{from{opacity:.55}to{opacity:1}}
@keyframes s1-mote{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
"""


S1_FLOOR = 716     # 床の高さ（祭壇の要石と柱の印が字幕に隠れないように）


def scene1():
    R = random.Random(1101)
    o = [HEAD.format(label="再建した本堂の中。要石を据えた石の祭壇に、授職の灯がともる。そばの四角い石の選択の柱に、アサギの大工の印が光る")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append('<defs><radialGradient id="s1-wall" cx=".44" cy=".7" r=".8"><stop offset="0" stop-color="#6a5240"/>'
             '<stop offset=".6" stop-color="#3a2c26"/><stop offset="1" stop-color="#1c1614"/></radialGradient>'
             '<radialGradient id="s1-halog" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd88a" stop-opacity=".75"/>'
             '<stop offset=".45" stop-color="#ffb24a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb24a" stop-opacity="0"/></radialGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s1-wall)"/>')
    # 奥の石の壁（段積み）と、上の木の梁
    rows = []
    for k, y in enumerate(range(60, 880, 46)):
        rows.append(f'<path d="M0,{y} L1600,{y}" stroke="#1c1512" stroke-width="2.4" opacity=".55"/>')
        x = 40 if k % 2 else 100
        while x < 1600:
            rows.append(f'<path d="M{x},{y - 46} L{x},{y}" stroke="#1c1512" stroke-width="2" opacity=".45"/>')
            x += 120
    o.append("".join(rows))
    o.append('<path d="M0,40 L1600,40 L1600,92 L0,92Z" fill="#3a271b" stroke="#120d0a" stroke-width="3"/>'
             '<path d="M0,46 L1600,46" stroke="#6c4a2e" stroke-width="3"/>'
             + "".join(f'<path d="M{x},92 L{x},150 L{x + 34},150 L{x + 34},92Z" fill="#3a271b" stroke="#120d0a" stroke-width="2.4"/>' for x in range(80, 1600, 240)))
    # 祭壇の灯の光
    altar_markup, (fx, fy) = Q.altar(700, S1_FLOOR, glow_cls="s1-keyglow")
    o.append(f'<ellipse class="s1-halo" cx="{fx}" cy="{fy - 60}" rx="760" ry="520" fill="url(#s1-halog)"/>')
    # 選択の柱（右）と、祭壇（中央）。床
    o.append(Q.selection_pillar(1250, S1_FLOOR, 130, 128, mark_cls="s1-mark"))
    o.append(f'<path d="M0,{S1_FLOOR} L1600,{S1_FLOOR} L1600,900 L0,900Z" fill="#2a201a"/><path d="M0,{S1_FLOOR} L1600,{S1_FLOOR}" stroke="#6a5240" stroke-width="3"/>'
             + "".join(f'<path d="M{x},{S1_FLOOR} L{n(800 + (x - 800) * 1.8)},900" stroke="#3a2c24" stroke-width="2.4"/>' for x in range(-200, 1800, 160))
             + "".join(f'<path d="M0,{y} L1600,{y}" stroke="#3a2c24" stroke-width="2"/>' for y in (S1_FLOOR + 40, S1_FLOOR + 100, S1_FLOOR + 180)))
    o.append(altar_markup)
    o.append(f'<g class="s1-flame">{Q.flame("s1-fl", "s1-fl", fx, fy, 1.3)}</g>')
    o.append(f'<g class="s1-moteset mv">{motes(R, "s1-mote mv", 30, fx - 300, fx + 300, fy - 40, fy + 120)}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：祝いの夜（神殿と共同台所の前）
# ---------------------------------------------------------------------------
S2_CSS = """
.is-active .s2-lamp{animation:s2-lamp 1.4s ease-in-out infinite alternate}
.is-active .s2-win{animation:s2-win 2.2s ease-in-out infinite alternate}
.is-active .s2-fire{animation:s2-fire .5s ease-in-out infinite alternate}
.s2-fire{transform-box:fill-box;transform-origin:50% 100%}
.s2-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s2-wave{animation:s2-wave 1s ease-in-out infinite alternate}
.is-active .s2-walk{animation:s2-walk 4.8s ease-out both}
.is-active .s2-steam{animation:s2-steam 1.6s ease-in-out infinite}
.is-active .s2-tw{animation:s2-tw 1.8s ease-in-out infinite alternate}
.is-active .s2-smoke{animation:s2-smoke 3.6s linear infinite}
.s2-smoke{transform-box:fill-box;transform-origin:50% 50%}
@keyframes s2-lamp{from{opacity:.55}to{opacity:1}}
@keyframes s2-win{from{opacity:.8}to{opacity:1}}
@keyframes s2-fire{from{transform:scale(1,1)}to{transform:scale(.88,1.12)}}
@keyframes s2-wave{from{transform:rotate(-12deg)}to{transform:rotate(9deg)}}
@keyframes s2-walk{from{transform:translateX(130px)}}
@keyframes s2-steam{0%,100%{opacity:.2}50%{opacity:.9}}
@keyframes s2-tw{from{opacity:.3}to{opacity:1}}
@keyframes s2-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.6}100%{transform:translate(20px,-90px) scale(1.6);opacity:0}}
"""
S2_FEET, S2_SCALE = 872, 2.2
# 膳を囲む七人（左から）。アサギとゴンタは杯を上げるように手を上げ、ピノは手を振る。
S2_SEATED = (("ganzou", ("down", "down"), 170), ("suzuha", ("front", "front"), 340), ("watari", ("hip", "down"), 510),
             ("hero2", ("down", "down"), 680), ("asagi", ("high", "down"), 850), ("gonta", ("high", "hip"), 1020),
             ("pino", ("hip", "wave"), 1190))
TABLE_TOP = 754


def scene2():
    R = random.Random(1102)
    o = [HEAD.format(label="灯のともった神殿と共同台所の前の祝いの夜。膳を囲むガンゾウ・スズハ・ワタリ・シオン・アサギ・ゴンタ・ピノと、"
                           "鍋を運んでくるミナ")]
    o.append(f"<style>{S2_CSS}</style>")
    defs, people = [], []
    rim = (("#ffc070", 1.1, -.7, .8),)
    for cid, arms, x in S2_SEATED:
        d, m, _ = figure(cid, "front", arms, (x, S2_FEET), S2_SCALE, "s2-", tone=M9.night_warm, rims=rim)
        defs.append(d); people.append(m)
    # 鍋を運ぶミナ：手を前で重ねた位置に鍋を持たせる
    f0 = CAST.figure("mina", "front", "s2-tmp-", arms=("front", "front"))
    (lx, ly), (rx, _) = f0.shoulders
    held = Q.pot((lx + rx) / 2, ly + 21, 1.0, steam_cls="s2-steam")
    dm, mina, _ = figure("mina", "front", ("front", "front"), (1430, S2_FEET), S2_SCALE, "s2-", tone=M9.night_warm, rims=rim, extra=held)
    defs.append(dm)
    o.append('<defs><linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1530"/>'
             '<stop offset="1" stop-color="#2e3456"/></linearGradient>'
             '<radialGradient id="s2-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb860" stop-opacity=".5"/>'
             '<stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>' + "".join(defs) + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append(stars(R, "s2-tw", 50, 160))
    # 奥の神殿（灯のともった窓と軒の提灯）
    o.append(place_temple(T.temple_rebuilt("s2-t-", R, T.REBUILT_NIGHT, lamp_cls="s2-lamp", window_cls="s2-win"), (760, 640), 1.02))
    o.append('<ellipse cx="800" cy="640" rx="900" ry="380" fill="url(#s2-warm)"/>')
    # 地面と、右の共同台所（かまどの火と煙）
    o.append('<path d="M-20,620 L1620,620 L1620,900 L-20,900Z" fill="#4a3a2c"/>')
    o.append(Q.kitchen(1430, 650, .82, fire_cls="s2-fire"))
    o.append(M9.P.smoke("s2-smoke mv", 1510, 430, 1.2))
    # 膳を囲む七人（腰から下は膳に隠れる）と膳
    for m in people:
        o.append(m.replace('class="wave"', 'class="s2-wave"'))
    o.append(f'<path d="M80,{TABLE_TOP} L1290,{TABLE_TOP} L1310,{TABLE_TOP + 30} L60,{TABLE_TOP + 30}Z" fill="#a8743f" stroke="#2a1f16" stroke-width="4"/>'
             f'<path d="M60,{TABLE_TOP + 30} L1310,{TABLE_TOP + 30} L1310,{TABLE_TOP + 60} L60,{TABLE_TOP + 60}Z" fill="#7c5730" stroke="#2a1f16" stroke-width="4"/>'
             f'<path d="M100,{TABLE_TOP + 60} L100,900 M1270,{TABLE_TOP + 60} L1270,900" stroke="#2a1f16" stroke-width="14"/>')
    o.append(M9.table_food(R, 110, 1260, TABLE_TOP + 12))
    o.append(f'<g class="s2-walk mv">{mina}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：海岸から望む神殿
# ---------------------------------------------------------------------------
S3_CSS = """
.is-active .s3-lamp{animation:s3-lamp 1.6s ease-in-out infinite alternate}
.is-active .s3-win{animation:s3-win 2.4s ease-in-out infinite alternate}
.is-active .s3-glow{animation:s3-glow 2.6s ease-in-out infinite alternate}
.is-active .s3-path{animation:s3-lamp 1.2s ease-in-out infinite alternate}
.is-active .s3-ref{animation:s3-ref 1.8s ease-in-out infinite alternate}
.is-active .s3-wv{animation:s3-wv 3s ease-in-out infinite alternate}
.is-active .s3-tw{animation:s3-tw 1.8s ease-in-out infinite alternate}
@keyframes s3-lamp{from{opacity:.5}to{opacity:1}}
@keyframes s3-win{from{opacity:.8}to{opacity:1}}
@keyframes s3-glow{from{opacity:.55}to{opacity:.9}}
@keyframes s3-ref{from{opacity:.35}to{opacity:.8}}
@keyframes s3-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s3-tw{from{opacity:.3}to{opacity:1}}
"""
S3_SEA = 652
S3_TEMPLE_AT, S3_TEMPLE_SCALE = (860, 448), .34      # 山の肩の平らなところ（620～1110）に、基壇の下端を置く
S3_FRONT = ("M60,652 C160,640 260,612 360,566 C430,534 520,482 600,452 C612,449 616,448 620,448 L1110,446 "
            "C1170,430 1250,390 1330,352 C1410,320 1500,300 1640,292")


def scene3():
    R = random.Random(1103)
    o = [HEAD.format(label="夜の海岸から、山の肩に立つ再建した神殿を見上げる。木組みの大屋根の窓と提灯の灯が、海に映る。浜から神殿へ上る坂道にも灯")]
    o.append(f"<style>{S3_CSS}</style>")
    o.append('<defs><linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="660" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#070b1c"/><stop offset=".7" stop-color="#1a2648"/><stop offset="1" stop-color="#34446c"/></linearGradient>'
             '<linearGradient id="s3-sea" x1="0" y1="650" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#22325a"/><stop offset="1" stop-color="#0a1230"/></linearGradient>'
             '<radialGradient id="s3-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffc06a" stop-opacity=".55"/>'
             '<stop offset="1" stop-color="#ffc06a" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s3-mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".55"/>'
             '<stop offset="1" stop-color="#e8f0ff" stop-opacity="0"/></radialGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append(stars(R, "s3-tw", 90, 420))
    o.append('<circle cx="1360" cy="150" r="130" fill="url(#s3-mglow)"/><circle cx="1360" cy="150" r="34" fill="#f4f6ff"/>'
             '<circle cx="1372" cy="142" r="30" fill="#1a2648" opacity=".25"/>')
    # 奥の山並みと、手前の山（左で海に接し、平らな肩を経て右の奥へ上る）
    back = "M700,652 C820,560 960,480 1100,420 C1230,364 1360,300 1480,262 C1540,244 1600,238 1640,236"
    o.append(f'<path d="{back} L1640,652Z" fill="#1d2746"/><path d="{back}" fill="none" stroke="#6f82b0" stroke-width="2" opacity=".3"/>')
    o.append(f'<path d="{S3_FRONT} L1640,652Z" fill="#141a30"/><path d="{S3_FRONT}" fill="none" stroke="#7d8fbc" stroke-width="2" opacity=".4"/>')
    # 神殿の後ろの暖かい光と、神殿
    tx, ty = S3_TEMPLE_AT
    o.append(f'<ellipse class="s3-glow" cx="{tx}" cy="{ty - 90}" rx="380" ry="200" fill="url(#s3-warm)"/>')
    o.append(place_temple(T.temple_rebuilt("s3-t-", R, T.REBUILT_NIGHT, lamp_cls="s3-lamp", window_cls="s3-win"), S3_TEMPLE_AT, S3_TEMPLE_SCALE))
    # 浜から神殿へ上る坂道と、道の灯（山の斜面の内側だけ）
    road = "M210,650 C320,640 420,626 470,606 C430,592 400,580 420,566 C500,548 560,532 600,516 C560,502 540,490 560,478 C600,466 640,458 680,452"
    o.append(f'<path d="{road}" fill="none" stroke="#3a4466" stroke-width="5" stroke-linecap="round"/>')
    o.append("".join(f'<circle class="s3-path" cx="{x}" cy="{y}" r="4" fill="#ffd98a" style="animation-delay:-{n(i * .3)}s"/>'
                     for i, (x, y) in enumerate(((300, 645), (450, 612), (420, 566), (560, 528), (560, 478), (650, 456)))))
    # 海と、灯の映り込み
    o.append(f'<rect x="0" y="{S3_SEA - 2}" width="1600" height="{900 - S3_SEA + 2}" fill="url(#s3-sea)"/>')
    refl = "".join(f'<path class="s3-ref" d="M{n(x - w / 2)},{n(y)} L{n(x + w / 2)},{n(y)}" stroke="#ffcf7a" stroke-width="{n(2 + (y - S3_SEA) / 60)}" '
                   f'stroke-linecap="round" style="animation-delay:-{n(R.uniform(0, 1.8))}s"/>'
                   for x, y, w in ((tx + R.uniform(-120, 120), S3_SEA + 8 + i * 13, R.uniform(30, 90)) for i in range(16)))
    o.append(f'<g opacity=".8">{refl}</g>')
    o.append(M4.glints(R, "s3-ref", 1260, 1460, S3_SEA + 10, 820, 20, "#e8f0ff"))
    o.append(f'<g class="s3-wv mv">{M4.waves(R, 0, 1600, S3_SEA + 20, 880, 24, color="#9fb2d8", opacity=.3)}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面4：遠い咆哮（神殿の軒先から見る夜の海）
# ---------------------------------------------------------------------------
S4_CSS = """
.is-active .s4-lamp{animation:s4-lamp 1.4s ease-in-out infinite alternate,s4-shake .12s .7s 6 linear}
.s4-lampset{transform-box:fill-box;transform-origin:50% 0%}
.is-active .s4-lampset{animation:s4-swing 2.4s .6s ease-out both}
.is-active .s4-ring{animation:s4-ring 2s .4s ease-out both}
.s4-ring{opacity:0;transform-box:fill-box;transform-origin:50% 50%}
.is-active .s4-flock{animation:s4-flock 3.4s .7s ease-out both}
.s4-flock{opacity:0}
.is-active .s4-bird{animation:s4-flap .3s ease-in-out infinite alternate}
.s4-bird{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s4-pass{animation:s4-pass 4.6s linear both}
.is-active .s4-wing{animation:s4-wing .7s ease-in-out infinite alternate}
.s4-wing{transform-box:fill-box;transform-origin:0% 100%}
.is-active .s4-gwing{animation:s4-wing .35s ease-in-out infinite alternate}
.is-active .s4-tw{animation:s4-tw 1.8s ease-in-out infinite alternate}
.is-active .s4-gl{animation:s4-gl 1.9s ease-in-out infinite}
.is-active .s4-wv{animation:s4-wv 3s ease-in-out infinite alternate}
@keyframes s4-lamp{from{opacity:.55}to{opacity:1}}
@keyframes s4-shake{0%{opacity:1}50%{opacity:.2}100%{opacity:1}}
@keyframes s4-swing{0%{transform:rotate(0)}15%{transform:rotate(5deg)}35%{transform:rotate(-4deg)}55%{transform:rotate(2.5deg)}75%{transform:rotate(-1.2deg)}100%{transform:rotate(0)}}
@keyframes s4-ring{0%{opacity:0;transform:scale(.2)}20%{opacity:.5}100%{opacity:0;transform:scale(2.4)}}
@keyframes s4-flock{0%{opacity:0;transform:translate(0,0)}10%{opacity:1}100%{opacity:1;transform:translate(-260px,-330px)}}
@keyframes s4-flap{from{transform:scaleY(1)}to{transform:scaleY(.35)}}
@keyframes s4-pass{from{transform:translateX(560px)}to{transform:translateX(-1500px)}}
@keyframes s4-wing{from{transform:scaleY(1)}to{transform:scaleY(.55)}}
@keyframes s4-tw{from{opacity:.3}to{opacity:1}}
@keyframes s4-gl{0%,100%{opacity:.15}50%{opacity:.9}}
@keyframes s4-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
"""
S4_SEA = 560
S4_MOON = (1060, 300)


def scene4():
    R = random.Random(1104)
    o = [HEAD.format(label="神殿の軒先から見る夜の海。咆哮が届いて軒の提灯の灯が揺れ、林から鳥が飛び立つ。月の光る沖を、"
                           "翼のある小さな影の群れを従えた三つ首の影が横切る")]
    o.append(f"<style>{S4_CSS}</style>")
    mx, my = S4_MOON
    o.append('<defs><linearGradient id="s4-sky" x1="0" y1="0" x2="0" y2="570" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#060a1a"/><stop offset=".7" stop-color="#18234a"/><stop offset="1" stop-color="#2f4070"/></linearGradient>'
             '<linearGradient id="s4-sea" x1="0" y1="550" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#27375f"/><stop offset="1" stop-color="#0a1230"/></linearGradient>'
             '<radialGradient id="s4-mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef3ff" stop-opacity=".75"/>'
             '<stop offset="1" stop-color="#eef3ff" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s4-lglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".8"/>'
             '<stop offset="1" stop-color="#ffb24a" stop-opacity="0"/></radialGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append(stars(R, "s4-tw", 100, 520))
    o.append(f'<circle cx="{mx}" cy="{my}" r="230" fill="url(#s4-mglow)"/><circle cx="{mx}" cy="{my}" r="78" fill="#f4f6ff"/>'
             f'<circle cx="{mx + 16}" cy="{my - 10}" r="70" fill="#e6ecfb" opacity=".5"/>')
    # 咆哮の波（右の水平線から広がる輪）
    o.append(f'<circle class="s4-ring" cx="1500" cy="{S4_SEA - 20}" r="260" fill="none" stroke="#c9d6ff" stroke-width="6"/>')
    # 海と月の光の道
    o.append(f'<rect x="0" y="{S4_SEA}" width="1600" height="{900 - S4_SEA}" fill="url(#s4-sea)"/>')
    o.append(M4.glints(R, "s4-gl", mx - 120, mx + 120, S4_SEA + 10, 860, 40, "#eef3ff"))
    o.append(f'<g class="s4-wv mv">{M4.waves(R, 0, 1600, S4_SEA + 16, 880, 30, color="#9fb2d8", opacity=.3)}</g>')
    # 沖を横切る影：三つ首の竜と、ガーゴイルの群れ（輪郭だけ。左へ）
    pack = [f'<g transform="translate(1300 240) scale(.62)">{Q.varga_shadow("#0b0f1e", "s4-wing")}</g>']
    for x, y, s in ((1150, 180, .9), (1210, 300, .8), (1450, 170, .85), (1500, 300, .9), (1600, 230, .8), (1700, 160, .75),
                    (1080, 260, .7), (1750, 290, .8), (1380, 120, .7)):
        pack.append(f'<g transform="translate({x} {y}) scale({s})">{Q.gargoyle_shadow("#0e1328", "s4-gwing")}</g>')
    o.append(f'<g class="s4-pass mv">{"".join(pack)}</g>')
    # 手前：右下の林（鳥が飛び立つ）
    for x in range(1060, 1660, 60):
        h = R.uniform(60, 110)
        o.append(f'<path d="M{x - 40},900 L{x},{n(900 - h - 120)} L{x + 40},900Z" fill="#0b1020"/>')
    birds = "".join(f'<g transform="translate({n(1180 + R.uniform(-60, 220))} {n(760 + R.uniform(-40, 60))}) scale({n(R.uniform(.7, 1.1))})">'
                    f'<path class="s4-bird mv" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" fill="none" stroke="#0b1020" stroke-width="3" stroke-linecap="round" '
                    f'style="animation-delay:-{n(R.uniform(0, .3))}s"/></g>' for _ in range(14))
    o.append(f'<g class="s4-flock mv">{birds}</g>')
    # 手前左上：神殿の軒（木組みの大屋根の端）と、揺れる提灯
    o.append('<path d="M-40,-20 L760,-20 L760,96 Q700,104 640,130 Q600,150 560,186 L520,176 Q560,140 600,118 Q640,96 680,90 L-40,90Z" '
             'fill="#1c1514" stroke="#0a0706" stroke-width="3"/>'
             '<path d="M-40,90 L680,90 Q640,96 600,118 Q560,140 520,176" fill="none" stroke="#4a3832" stroke-width="10" stroke-linecap="round"/>'
             + "".join(f'<rect x="{x}" y="92" width="9" height="9" fill="#4a3832"/>' for x in range(-20, 640, 22)))
    for x in (110, 300, 480):
        o.append(f'<g class="s4-lampset mv" style="transform-origin:{x}px 100px">'
                 f'<circle class="s4-lamp" cx="{x}" cy="170" r="70" fill="url(#s4-lglow)"/>'
                 f'<path d="M{x},100 L{x},136" stroke="#0a0706" stroke-width="3"/>'
                 f'<ellipse class="s4-lamp" cx="{x}" cy="170" rx="24" ry="32" fill="#ffd98a" stroke="#0a0706" stroke-width="3"/>'
                 f'<path d="M{x - 14},146 L{x + 14},146 M{x - 14},194 L{x + 14},194" stroke="#0a0706" stroke-width="5"/></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面5：結び（タイトル）
# ---------------------------------------------------------------------------
S5_CSS = """
.is-active .s5-lamp{animation:s5-lamp 1.8s ease-in-out infinite alternate}
.is-active .s5-win{animation:s5-win 2.6s ease-in-out infinite alternate}
.is-active .s5-tw{animation:s5-tw 1.8s ease-in-out infinite alternate}
@keyframes s5-lamp{from{opacity:.6}to{opacity:1}}
@keyframes s5-win{from{opacity:.85}to{opacity:1}}
@keyframes s5-tw{from{opacity:.3}to{opacity:1}}
"""


def scene5():
    R = random.Random(1105)
    o = [HEAD.format(label="静かになった星空と、灯のともった神殿の大屋根。破風に職業の書の紋章。タイトル「職をつぐ者　ダーマ再興編／第6章・完／よみがえるダーマ神殿」")]
    o.append(f"<style>{S5_CSS}</style>")
    o.append('<defs><linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#050916"/><stop offset=".65" stop-color="#16214a"/><stop offset="1" stop-color="#2c3b66"/></linearGradient>'
             '<radialGradient id="s5-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffc06a" stop-opacity=".45"/>'
             '<stop offset="1" stop-color="#ffc06a" stop-opacity="0"/></radialGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s5-sky)"/>')
    o.append(stars(R, "s5-tw", 120, 560))
    o.append('<ellipse cx="800" cy="840" rx="900" ry="320" fill="url(#s5-warm)"/>')
    # 大屋根を大きく：破風の紋章が画面の下の中ほどに来るように置く
    s = 1.25
    o.append(f'<g transform="translate({n(800 - 800 * s)} {n(650 - 220 * s)}) scale({s})">'
             f'{T.temple_rebuilt("s5-t-", R, T.REBUILT_NIGHT, lamp_cls="s5-lamp", window_cls="s5-win")}</g>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3, scene4, scene5]
