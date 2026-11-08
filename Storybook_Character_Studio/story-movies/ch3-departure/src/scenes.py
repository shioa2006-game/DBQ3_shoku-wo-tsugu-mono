"""第3章の結末「旅立ち ― ジパング復興編・完」の5場面のSVG。

  1. 復興した島        朝の光の中の島。山の上の社、田と畑、食堂と小屋、港の桟橋と船、岬の灯台。
  2. 島に残る三人      桟橋に立つピノ・イナホ・ジンベエ（正面）。書の光の粒が舞い、名前の順に足元が光る。
  3. 船出              桟橋から見送る三人の背中（手前）と、船の上で手を振るシオン・ミナ・ゴンタ、舵輪のワタリ。
  4. 灯台の先へ        岬の灯台の灯りの先へ、帆を張った船が進む。
  5. 海の向こうへ      大きな空と海。水平線の島々へ向かう小さな帆。タイトル「ジパング復興編・完」。

座標は viewBox="0 0 1600 900"。乱数は場面ごとの固定シード。id・クラス・アニメーション名には場面の接頭辞
（s1-〜s5-）を付け、クロスフェード中に2場面が並んでも衝突しないようにする。位置が動くアニメーションには
.mv を付け、モーション軽減時に止める（共通エンジンの約束）。人物は shared/figures.py（正式デザインの頭・胴）。
"""
import math
import os
import random

from helpers import n, kasumi, cloud, lobes_union, SPARK
from figures import Cast, place, mix
import props as P

HEAD = ('<svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" '
        'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}">')
CAST = Cast(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts", "cast.json"))


def morning(c):
    """朝の光：人物の色をわずかに暖かく。"""
    return mix(c, "#fff1d6", .06)


def sky_defs(p, top="#6fb2e4", mid="#a8d5ef", low="#f6ecd4", y1=470):
    return (f'<linearGradient id="{p}sky" x1="0" y1="0" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{top}"/><stop offset=".55" stop-color="{mid}"/><stop offset="1" stop-color="{low}"/></linearGradient>'
            f'<radialGradient id="{p}sunglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8" stop-opacity=".95"/>'
            '<stop offset=".25" stop-color="#fff0c0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></radialGradient>')


def sea_defs(p, y0, y1=900, far="#8cc3df", near="#2f78ad"):
    return (f'<linearGradient id="{p}sea" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{far}"/><stop offset=".35" stop-color="#5d9fca"/><stop offset="1" stop-color="{near}"/></linearGradient>')


def clouds(R, rows, body="#ffffff", shade="#d9e8f3", cls=""):
    d = " ".join(kasumi(x, y, w, h) for x, y, w, h in rows)
    return (f'<g class="{cls}"><path d="{d}" fill="{shade}" transform="translate(0 7)"/>'
            f'<path d="{d}" fill="{body}" opacity=".95"/></g>')


def glints(R, cls, x0, x1, y0, y1, count, color="#ffffff", w=(10, 26)):
    o = [f'<g stroke="{color}" stroke-linecap="round">']
    for _ in range(count):
        x, y = R.uniform(x0, x1), R.uniform(y0, y1)
        ww = R.uniform(*w) * (1 + (y - y0) / max(1, y1 - y0))
        o.append(f'<path class="{cls}" d="M{n(x - ww / 2)},{n(y)} L{n(x + ww / 2)},{n(y)}" stroke-width="{n(1.6 + (y - y0) / 160)}" '
                 f'style="animation-delay:-{n(R.uniform(0, 2))}s;animation-duration:{n(R.uniform(1.4, 2.6))}s"/>')
    o.append("</g>")
    return "".join(o)


def waves(R, x0, x1, y0, y1, count, color="#e6f3fb", width=2.2, opacity=.6):
    d = []
    for _ in range(count):
        x, y = R.uniform(x0, x1), R.uniform(y0, y1)
        w = 18 + (y - y0) * .25
        d.append(f"M{n(x - w / 2)},{n(y)} Q{n(x)},{n(y - 4 - (y - y0) * .02)} {n(x + w / 2)},{n(y)}")
    return f'<path d="{" ".join(d)}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" opacity="{opacity}"/>'


def figure_set(specs, prefix, tone=morning, rims=(("#fff3cf", 1.1, -.7, .9),)):
    """specs: (人物id, 向き, 腕, 場面の位置, 倍率, 胸から上だけか)。返り値は (defs, [人物ごとの描画])."""
    defs, out = [], []
    for i, (cid, direction, arms, at, scale, bust) in enumerate(specs):
        f = CAST.figure(cid, direction, f"{prefix}{cid}-{direction}-", arms=arms, legs=not bust, tone=tone, rims=rims,
                        arms_over=True)
        defs.append(f.defs)
        out.append((f, place(f.rim, at, scale, f.foot) + place(f.body, at, scale, f.foot)))
    return "".join(defs), out


# ---------------------------------------------------------------------------
# 場面1：復興した島
# ---------------------------------------------------------------------------
S1_CSS = """
.is-active .s1-cl{animation:s1-drift 7s linear both}
.is-active .s1-gl{animation:s1-gl 1.9s ease-in-out infinite}
.is-active .s1-smoke{animation:s1-smoke 3.9s linear infinite}
.is-active .s1-flagwave{animation:s1-flag 1.4s ease-in-out infinite alternate}
.is-active .s1-lh-glow{animation:s1-pulse 2.4s ease-in-out infinite}
.is-active .s1-wave{animation:s1-wave 3.2s ease-in-out infinite alternate}
.is-active .s1-birds{animation:s1-birds 7s ease-out both}
.is-active .s1-gull{animation:s1-flap .7s ease-in-out infinite alternate}
.is-active .s1-light{animation:s1-light 5.4s .3s ease-out both}
.s1-gull,.s1-flagwave{transform-box:fill-box;transform-origin:0% 50%}
.s1-gull{transform-origin:50% 50%}
.s1-smoke{transform-box:fill-box;transform-origin:50% 50%}
@keyframes s1-drift{from{transform:translateX(-36px)}}
@keyframes s1-gl{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes s1-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.75}100%{transform:translate(26px,-90px) scale(1.6);opacity:0}}
@keyframes s1-flag{from{transform:skewY(-4deg) scaleX(.92)}to{transform:skewY(5deg)}}
@keyframes s1-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes s1-wave{from{transform:translateY(-5px)}to{transform:translateY(4px)}}
@keyframes s1-birds{from{transform:translate(-140px,26px)}}
@keyframes s1-flap{to{transform:scaleY(.55)}}
@keyframes s1-light{from{opacity:.55}}
"""


def scene1():
    R = random.Random(301)
    o = [HEAD.format(label="朝の光の中のジパングの島。山の上の社、田と畑、食堂と小屋、港の桟橋に泊まる船と、岬の灯台")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append("<defs>" + sky_defs("s1-") + sea_defs("s1-", 440) + P.lighthouse_defs("s1-lh-") + P.ship_defs("s1-sh-") +
             '<linearGradient id="s1-mt" x1="0" y1="170" x2="0" y2="620" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#7fb39a"/><stop offset="1" stop-color="#5f9a6a"/></linearGradient>'
             '<linearGradient id="s1-sand" x1="0" y1="590" x2="0" y2="660" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#f3e3b4"/><stop offset="1" stop-color="#dcc28c"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    o.append('<circle cx="1260" cy="150" r="300" fill="url(#s1-sunglow)"/><circle cx="1260" cy="150" r="54" fill="#fffbe6" opacity=".9"/>')
    o.append(clouds(R, [(80, 110, 520, 30), (860, 70, 460, 26), (300, 250, 360, 20), (1120, 270, 380, 22)], cls="s1-cl mv"))
    # 遠い海と島影
    o.append('<rect x="0" y="440" width="1600" height="460" fill="url(#s1-sea)"/>'
             '<path d="M0,441 C40,430 90,428 140,441Z M1520,441 C1550,432 1580,431 1600,436 L1600,441Z" fill="#9cc0d6"/>')
    # 島：山（奥）
    island = ("M40,640 C110,560 200,420 300,320 C360,258 420,190 470,176 C520,186 580,236 640,300 C700,360 760,404 860,428 "
              "C980,452 1120,448 1240,470 C1330,488 1400,540 1480,640Z")
    o.append(f'<path d="{island}" fill="url(#s1-mt)" stroke="{P.GREEN_INK}" stroke-width="2.4"/>')
    o.append('<path d="M300,320 C360,258 420,190 470,176 C520,186 580,236 640,300" fill="none" stroke="#b6dcb0" stroke-width="4" opacity=".6"/>')
    # 社への参道（つづら折り）
    o.append('<path d="M560,452 L500,410 L560,372 L490,330 L540,292 L478,250 L476,212" fill="none" stroke="#e9dcb0" stroke-width="4" '
             'stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>')
    o.append(f'<g transform="translate(472 200)">{P.shrine(.62)}</g>')
    # 山の松
    pines = []
    for x, y, w in [(330, 318, 46), (372, 286, 40), (410, 252, 34), (560, 240, 36), (600, 282, 40), (640, 320, 44),
                    (290, 372, 52), (680, 360, 46), (240, 430, 56), (420, 330, 36)]:
        pines.append(P.pine(R, x, y, w, w * .45, color="#3f7653"))
    o.append("".join(pines))
    # 台地（村）
    plateau = "M30,660 C180,580 330,520 520,486 C720,452 960,454 1180,480 C1300,494 1390,540 1470,610 L1470,660Z"
    o.append(f'<path d="{plateau}" fill="#86b96f" stroke="{P.GREEN_INK}" stroke-width="2.2"/>')
    # 田（左の段々）と畑（右）
    o.append(P.paddy(150, 560, 150, 34, -6) + P.paddy(230, 528, 150, 30, -8) + P.paddy(330, 500, 140, 28, -6)
             + P.paddy(110, 600, 170, 34, -4))
    o.append(f'<g transform="translate(205 552)">{P.scarecrow(.9)}</g>')
    o.append(P.field(1060, 500, 150, 40, 4) + P.field(1100, 548, 130, 34, 3))
    # 村：小屋・食堂・のぼり旗
    for x, y, s in [(640, 486, .62), (740, 476, .58), (880, 482, .6)]:
        o.append(f'<g transform="translate({x} {y})">{P.hut(s=s)}</g>')
    o.append(f'<g transform="translate(980 488)">{P.kitchen("s1-", s=.62)}</g>')
    o.append(P.smoke("s1-smoke", 1013, 420))
    o.append(f'<g transform="translate(820 486)">{P.banner("s1-", 70, s=.9)}</g><g transform="translate(1060 470)">{P.banner("s1-", 64, "#2b4b84", .9)}</g>')
    for x, y in [(560, 470), (930, 450), (1150, 470), (1260, 500)]:
        o.append(P.round_tree(R, x, y, 22))
    # 川と南へ渡る橋
    o.append('<path d="M1290,470 C1280,520 1310,560 1300,620" fill="none" stroke="#6fb6dd" stroke-width="16" stroke-linecap="round"/>'
             f'<path d="M1262,536 L1334,532" stroke="{P.INK}" stroke-width="12" stroke-linecap="round"/>'
             f'<path d="M1262,536 L1334,532" stroke="{P.WOOD}" stroke-width="8" stroke-linecap="round"/>')
    # 浜
    o.append('<path d="M60,646 C300,612 700,606 1000,612 C1200,616 1360,624 1480,640 L1480,664 L60,664Z" fill="url(#s1-sand)"/>')
    o.append('<path d="M0,664 L1600,664 L1600,900 L0,900Z" fill="url(#s1-sea)" opacity=".55"/>')
    # 桟橋と船
    o.append(f'<path d="M1166,622 L1206,622 L1214,770 L1158,770Z" fill="{P.WOOD}" stroke="{P.INK}" stroke-width="2.4"/>'
             + "".join(f'<path d="M{n(1166 - (y - 622) * .055)},{y} L{n(1206 + (y - 622) * .054)},{y}" stroke="{P.INK}" stroke-width="1.4" opacity=".55"/>'
                       for y in range(636, 770, 14))
             + f'<g transform="translate(1160 766) scale(.5)">{P.lantern(0, -40, "s1-")}</g><g transform="translate(1212 766) scale(.5)">{P.lantern(0, -40, "s1-")}</g>')
    o.append(f'<g transform="translate(1296 762) scale(.36)">{P.ship_full("s1-sh-", lights=False)}</g>')
    # 岬の灯台
    o.append('<path d="M1404,664 C1440,616 1480,596 1540,602 C1580,608 1600,622 1610,640 L1610,700 L1404,700Z" fill="#8f8b80" '
             f'stroke="{P.INK}" stroke-width="2.4"/>')
    tower, glow, _ = P.lighthouse("s1-lh-", h=300, w0=100, w1=70)
    o.append(f'<g transform="translate(1496 616) scale(.62)">{tower}<g class="s1-lh-glow">{glow}</g></g>')
    # 手前の海の波
    o.append(f'<g class="s1-wave mv">{waves(R, 0, 1600, 690, 890, 34)}</g>')
    o.append(glints(R, "s1-gl", 600, 1600, 470, 600, 40, "#fff7d6"))
    o.append('<g class="s1-birds mv">' + P.gulls("s1-gull", [(560, 150, 1, 0), (610, 128, .8, .3), (650, 160, .7, .5)]) + "</g>")
    # 朝の光（最初は少し強く、島が見えてくる）
    o.append('<rect class="s1-light" width="1600" height="900" fill="#fff6dc" opacity="0"/>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：島に残る三人（桟橋に立つピノ・イナホ・ジンベエ）
# ---------------------------------------------------------------------------
S2_CSS = """
.s2-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s2-wave{animation:s2-wave 1.1s ease-in-out infinite alternate}
.is-active .s2-mote{animation:s2-mote 4.2s linear infinite}
.is-active .s2-ring{animation:s2-ring 1.6s ease-out both}
.is-active .s2-cl{animation:s2-drift 9s linear both}
.is-active .s2-fl{animation:s2-fl .9s ease-in-out infinite alternate}
.is-active .s2-gl{animation:s2-gl 1.9s ease-in-out infinite}
.s2-fl{transform-box:fill-box;transform-origin:50% 100%}
.s2-ring{opacity:0}
.s2-mote{transform:translate(0,calc(-120px*var(--p)));opacity:calc(1 - var(--p))}
@keyframes s2-wave{from{transform:rotate(-12deg)}to{transform:rotate(9deg)}}
@keyframes s2-mote{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),-150px);opacity:0}}
@keyframes s2-ring{0%{opacity:0;transform:scale(.6)}35%{opacity:1}100%{opacity:.75;transform:none}}
@keyframes s2-drift{from{transform:translateX(30px)}}
@keyframes s2-fl{from{transform:scale(1,1)}to{transform:scale(.9,1.1)}}
@keyframes s2-gl{0%,100%{opacity:.2}50%{opacity:1}}
"""
S2_GROUND = 818
S2_SCALE = 3.3
S2_PEOPLE = (("pino", ("hip", "wave"), 520), ("inaho", ("front", "front"), 800), ("jinbei", ("down", "down"), 1080))
# 名前（字幕の順：ピノ・イナホ・ジンベエ）に合わせて足元が光る時刻（ミリ秒）
S2_RINGS = (4600, 5400, 6200)


def scene2():
    R = random.Random(302)
    o = [HEAD.format(label="桟橋に立つ三人。大工のピノ、料理と畑のイナホ、神官ジンベエ。背後に村と山の上の社。書の光の粒が舞う")]
    o.append(f"<style>{S2_CSS}</style>")
    fdefs, figs = figure_set([(cid, "front", arms, (x, S2_GROUND), S2_SCALE, False) for cid, arms, x in S2_PEOPLE], "s2-")
    o.append("<defs>" + sky_defs("s2-", "#78b8e6", "#b4dbf1", "#f8efd8", 560) + sea_defs("s2-", 556, 900) + fdefs +
             '<radialGradient id="s2-ringg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2b8" stop-opacity=".9"/>'
             '<stop offset=".55" stop-color="#ffd86a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd86a" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s2-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5b4630" stop-opacity=".45"/>'
             '<stop offset="1" stop-color="#5b4630" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s2-pier" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             f'<stop offset="0" stop-color="#b98c52"/><stop offset="1" stop-color="{P.WOOD}"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append('<circle cx="1360" cy="110" r="320" fill="url(#s2-sunglow)"/>')
    o.append(clouds(R, [(60, 120, 480, 26), (980, 90, 520, 28), (520, 230, 300, 18)], cls="s2-cl mv"))
    # 山と社（遠景）
    o.append('<path d="M700,560 C820,470 920,330 1010,250 C1040,226 1070,214 1100,214 C1140,222 1180,262 1230,320 C1300,400 1400,470 1600,520 L1600,560Z" '
             'fill="#8dbba0" stroke="#4f7a5e" stroke-width="2"/>')
    o.append(f'<g transform="translate(1100 236)">{P.shrine(.5)}</g>')
    o.append('<path d="M-20,560 C120,500 300,470 520,470 C640,472 760,500 860,540 L860,560Z" fill="#9ccaa0" stroke="#4f7a5e" stroke-width="2"/>')
    # 村（背景）：小屋・食堂・木
    for x, y, s in [(190, 520, .9), (330, 512, .85), (1270, 520, .9)]:
        o.append(f'<g transform="translate({x} {y})">{P.hut(s=s)}</g>')
    o.append(f'<g transform="translate(1440 528)">{P.kitchen("s2-", s=.9)}</g>')
    for x, y in [(80, 500), (450, 486), (1170, 500), (1560, 500)]:
        o.append(P.round_tree(R, x, y, 30))
    # 浜と海
    o.append('<path d="M-20,548 C400,536 1200,536 1620,546 L1620,574 L-20,574Z" fill="#efdcab"/>')
    o.append('<rect x="0" y="566" width="1600" height="334" fill="url(#s2-sea)"/>')
    o.append(glints(R, "s2-gl", 0, 1600, 580, 690, 30, "#ffffff"))
    o.append(waves(R, 0, 1600, 600, 890, 28, opacity=.45))
    # 桟橋（奥へすぼまる板張り）
    pier = "M560,572 L1040,572 L1460,900 L140,900Z"
    o.append(f'<path d="{pier}" fill="url(#s2-pier)" stroke="{P.INK}" stroke-width="3"/>')
    planks = []
    y = 584.0
    while y < 900:
        t = (y - 572) / 328
        planks.append(f"M{n(560 - 420 * t)},{n(y)} L{n(1040 + 420 * t)},{n(y)}")
        y += 8 + (y - 572) * .1
    o.append(f'<path d="{" ".join(planks)}" stroke="#8a6436" stroke-width="2" opacity=".7"/>')
    o.append(f'<path d="M800,572 L800,900 M680,572 L470,900 M920,572 L1130,900" stroke="#9a7444" stroke-width="1.6" opacity=".5"/>')
    # 足元の影と、名前の順に灯る光の輪
    for (cid, arms, x), at_ms in zip(S2_PEOPLE, S2_RINGS):
        o.append(f'<ellipse cx="{x}" cy="{S2_GROUND + 4}" rx="98" ry="16" fill="url(#s2-shadow)"/>')
        o.append(f'<ellipse class="s2-ring" cx="{x}" cy="{S2_GROUND + 2}" rx="140" ry="30" fill="url(#s2-ringg)" '
                 f'style="animation-delay:{at_ms}ms;transform-box:fill-box;transform-origin:50% 50%"/>')
    for f, markup in figs:
        o.append(markup.replace('class="wave"', 'class="s2-wave"'))
    # 書の光の粒（立ち上る）
    motes = []
    for _ in range(26):
        x, y = R.uniform(260, 1340), R.uniform(380, 840)
        motes.append(f'<g transform="translate({n(x)} {n(y)}) scale({n(R.uniform(.35, .8))})"><path class="s2-mote mv" d="{SPARK}" fill="#ffe9a0" '
                     f'style="--p:{n(R.random())};--dx:{n(R.uniform(-30, 30))}px;animation-delay:-{n(R.uniform(0, 4.2))}s"/></g>')
    o.append("".join(motes))
    # 手前の灯り柱（桟橋の両端）
    for x in (150, 1450):
        o.append(f'<path d="M{x - 10},900 L{x - 8},700 L{x + 8},700 L{x + 10},900Z" fill="{P.WOOD_DARK}" stroke="{P.INK}" stroke-width="3"/>'
                 f'<g transform="translate({x} 700)"><circle cx="0" cy="-22" r="44" fill="#ffcf73" opacity=".3"/>'
                 '<path class="s2-fl" d="M-12,0 Q-16,-26 0,-50 Q16,-26 12,0Z" fill="#ff9a2e"/>'
                 '<path class="s2-fl" d="M-6,0 Q-8,-16 0,-32 Q8,-16 6,0Z" fill="#fff0b0"/></g>'
                 f'<path d="M{x - 16},700 L{x + 16},700" stroke="{P.INK}" stroke-width="6" stroke-linecap="round"/>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：船出（桟橋から見送る三人の背中と、船の上の四人）
# ---------------------------------------------------------------------------
S3_CSS = """
.s3-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s3-wave{animation:s3-wave 1s ease-in-out infinite alternate}
.is-active .s3-ship{animation:s3-bob 3.4s ease-in-out infinite alternate}
.is-active .s3-shipgo{animation:s3-go 6.6s cubic-bezier(.5,0,.8,1) both}
.is-active .s3-sh-flag{animation:s3-flag .8s ease-in-out infinite alternate}
.is-active .s3-sh-lamp{animation:s3-pulse 2.2s ease-in-out infinite}
.is-active .s3-gl{animation:s3-gl 1.9s ease-in-out infinite}
.is-active .s3-wv{animation:s3-wv 3s ease-in-out infinite alternate}
.is-active .s3-cl{animation:s3-drift 8s linear both}
.s3-sh-flag{transform-box:fill-box;transform-origin:0% 50%}
@keyframes s3-wave{from{transform:rotate(-14deg)}to{transform:rotate(10deg)}}
@keyframes s3-bob{from{transform:translateY(-4px) rotate(-.5deg)}to{transform:translateY(4px) rotate(.5deg)}}
@keyframes s3-go{from{transform:none}to{transform:translateX(70px)}}
@keyframes s3-flag{from{transform:skewY(-6deg) scaleX(.9)}to{transform:skewY(6deg)}}
@keyframes s3-pulse{0%,100%{opacity:.25}50%{opacity:.5}}
@keyframes s3-gl{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes s3-wv{from{transform:translateX(-10px)}to{transform:translateX(10px)}}
@keyframes s3-drift{from{transform:translateX(-30px)}}
"""
S3_SHIP_AT, S3_SHIP_SCALE = (1010, 650), 1.5
# 船の上（船の座標）：舵輪のワタリは船尾楼、三人は甲板。腰から下は舷側に隠れる。
S3_CREW = (("watari", ("helm", "helm"), (-176, -112), 1.0), ("mina", ("wave", "down"), (-66, -64), 1.0),
           ("hero2", ("down", "high"), (40, -64), 1.0), ("gonta", ("high", "hip"), (146, -64), 1.0))
# 桟橋の三人（後ろ姿）。腰は画面の下より下。
S3_BACKS = (("jinbei", ("down", "wave"), 150, 3.2), ("pino", ("high", "down"), 380, 3.2), ("inaho", ("down", "high"), 600, 3.2))


def scene3():
    R = random.Random(303)
    o = [HEAD.format(label="桟橋から船を見送る三人の背中。船の上で手を振るシオン・ミナ・ゴンタと、舵輪を握るワタリ。わらで織った大きな帆")]
    o.append(f"<style>{S3_CSS}</style>")
    cdefs, crew = figure_set([(cid, "front", arms, at, s, True) for cid, arms, at, s in S3_CREW], "s3-c-",
                             rims=(("#fff6dc", .9, -.6, .8),))
    bdefs, backs = figure_set([(cid, "back", arms, (x, 884), s, True) for cid, arms, x, s in S3_BACKS], "s3-b-",
                              rims=(("#fff3cf", 0, -1.1, .85),))
    o.append("<defs>" + sky_defs("s3-", "#6fb0e2", "#acd7f0", "#f7eed8", 440) + sea_defs("s3-", 430) + P.ship_defs("s3-sh-")
             + cdefs + bdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append(clouds(R, [(40, 160, 420, 22), (1060, 120, 480, 26), (700, 300, 280, 16)], cls="s3-cl mv"))
    o.append('<rect x="0" y="430" width="1600" height="470" fill="url(#s3-sea)"/>'
             '<path d="M1180,431 C1230,420 1290,418 1340,431Z M120,431 C150,424 190,424 220,431Z" fill="#9cc0d6"/>')
    o.append(glints(R, "s3-gl", 0, 1600, 440, 560, 34, "#ffffff"))
    o.append(f'<g class="s3-wv mv">{waves(R, 0, 1600, 470, 760, 30, opacity=.5)}</g>')
    # 船と乗組員（船の座標で組み、場面へ置く）
    crew_markup = "".join(place(f.rim, at, s, f.foot) + place(f.body, at, s, f.foot)
                          for (f, _), (cid, arms, at, s) in zip(crew, S3_CREW))
    crew_markup = crew_markup.replace('class="wave"', 'class="s3-wave"')
    ship = P.ship_full("s3-sh-", crew=crew_markup)
    sx, sy = S3_SHIP_AT
    o.append(f'<g class="s3-shipgo mv"><g class="s3-ship mv" style="transform-origin:{sx}px {sy}px">'
             f'<g transform="translate({sx} {sy}) scale({S3_SHIP_SCALE})">{ship}</g></g>'
             f'<path d="M{sx - 330},{sy + 18} Q{sx},{sy + 34} {sx + 360},{sy + 16}" fill="none" stroke="#1d4f78" stroke-width="16" opacity=".35"/></g>')
    # 船の手前の水面
    o.append(f'<path d="M0,{sy + 8} L1600,{sy + 8} L1600,900 L0,900Z" fill="url(#s3-sea)" opacity=".5"/>')
    o.append(waves(R, 0, 1600, sy + 20, 860, 22, opacity=.55))
    # 桟橋（左手前の板。三人はここから見送る）
    o.append(f'<path d="M-20,846 L820,836 L860,900 L-20,900Z" fill="{P.WOOD}" stroke="{P.INK}" stroke-width="3"/>'
             + "".join(f'<path d="M-20,{y} L{n(826 + (y - 846) * .6)},{y - 10}" stroke="#8a6436" stroke-width="2" opacity=".6"/>' for y in (866, 886))
             + '<path d="M-20,846 L820,836" stroke="#e0b878" stroke-width="3" opacity=".7"/>'
             + f'<path d="M790,836 L790,900 L828,900 L826,836Z" fill="{P.WOOD_DARK}" stroke="{P.INK}" stroke-width="3"/>')
    for f, markup in backs:
        o.append(markup.replace('class="wave"', 'class="s3-wave"'))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面4：灯台の先へ
# ---------------------------------------------------------------------------
S4_CSS = """
.is-active .s4-sail{animation:s4-sail 6.4s cubic-bezier(.3,0,.7,1) both}
.is-active .s4-bob{animation:s4-bob 2.6s ease-in-out infinite alternate}
.is-active .s4-beam{animation:s4-beam 3.2s ease-in-out infinite alternate}
.is-active .s4-lh-glow{animation:s4-pulse 2.2s ease-in-out infinite}
.is-active .s4-lh-flame{animation:s4-fl .8s ease-in-out infinite alternate}
.is-active .s4-gl{animation:s4-gl 1.8s ease-in-out infinite}
.is-active .s4-birds{animation:s4-birds 6.6s ease-out both}
.is-active .s4-gull{animation:s4-flap .65s ease-in-out infinite alternate}
.is-active .s4-sh-flag{animation:s4-flag .8s ease-in-out infinite alternate}
.is-active .s4-cl{animation:s4-drift 8s linear both}
.s4-gull{transform-box:fill-box;transform-origin:50% 50%}
.s4-sh-flag{transform-box:fill-box;transform-origin:0% 50%}
@keyframes s4-sail{from{transform:translateX(-150px)}to{transform:translateX(120px)}}
@keyframes s4-bob{from{transform:translateY(-3px) rotate(-.6deg)}to{transform:translateY(3px) rotate(.6deg)}}
@keyframes s4-beam{from{opacity:.55}to{opacity:.95}}
@keyframes s4-pulse{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes s4-fl{from{transform:scale(1,1)}to{transform:scale(.9,1.12)}}
@keyframes s4-gl{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes s4-birds{from{transform:translate(-90px,30px)}}
@keyframes s4-flap{to{transform:scaleY(.55)}}
@keyframes s4-flag{from{transform:skewY(-6deg) scaleX(.9)}to{transform:skewY(6deg)}}
@keyframes s4-drift{from{transform:translateX(-40px)}}
"""


def scene4():
    R = random.Random(304)
    o = [HEAD.format(label="岬の石積みの灯台。灯りの先の海を、わらの帆を張った船が水平線へ進む")]
    o.append(f"<style>{S4_CSS}</style>")
    o.append("<defs>" + sky_defs("s4-", "#5fa6dc", "#a2d2ee", "#fbf1d8", 480) + sea_defs("s4-", 470) + P.lighthouse_defs("s4-lh-")
             + P.ship_defs("s4-sh-") +
             '<linearGradient id="s4-beamg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c0" stop-opacity=".75"/>'
             '<stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></linearGradient>'
             '<linearGradient id="s4-wakeg" x1="710" y1="0" x2="936" y2="0" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#f2f8ff" stop-opacity="0"/><stop offset="1" stop-color="#f2f8ff" stop-opacity=".9"/></linearGradient>'
             '<linearGradient id="s4-rock" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#a39d90"/><stop offset="1" stop-color="#6f6a60"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append('<circle cx="1330" cy="170" r="320" fill="url(#s4-sunglow)"/><circle cx="1330" cy="170" r="58" fill="#fffbe6"/>')
    o.append(clouds(R, [(520, 110, 520, 28), (1000, 300, 420, 20), (140, 260, 300, 18)], cls="s4-cl mv"))
    o.append('<rect x="0" y="470" width="1600" height="430" fill="url(#s4-sea)"/>')
    o.append(glints(R, "s4-gl", 900, 1600, 480, 700, 46, "#fff8de"))
    o.append(waves(R, 400, 1600, 500, 890, 30, opacity=.5))
    # 灯台の光の帯（水平線の方へ）
    o.append('<path class="s4-beam" d="M300,196 L1600,360 L1600,540 Z" fill="url(#s4-beamg)" opacity=".7"/>')
    # 船（右へ進む）と航跡
    ship = P.ship_full("s4-sh-", crew=P.tiny_crew())
    o.append(f'<g class="s4-sail mv"><path d="M932,584 Q860,590 730,586 M936,592 Q850,606 710,608" fill="none" stroke="url(#s4-wakeg)" '
             'stroke-width="4" stroke-linecap="round"/>'
             f'<g class="s4-bob mv" style="transform-origin:1050px 580px"><g transform="translate(1050 580) scale(.6)">{ship}</g></g></g>')
    # 岬と灯台（手前左）
    cape = "M-20,560 C60,540 160,530 260,560 C330,580 380,640 430,700 C470,760 500,840 520,900 L-20,900Z"
    o.append(f'<path d="{cape}" fill="url(#s4-rock)" stroke="{P.INK}" stroke-width="3"/>'
             '<path d="M40,600 L150,590 M90,660 L260,640 M200,720 L360,710 M60,780 L300,770" stroke="#857f73" stroke-width="3" stroke-linecap="round"/>'
             '<path d="M-20,560 C60,540 160,530 260,560" fill="none" stroke="#d8d2c4" stroke-width="4" opacity=".6"/>')
    o.append('<path d="M436,706 C476,766 506,844 526,900" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".55"/>')
    tower, glow, lamp = P.lighthouse("s4-lh-", h=370)
    o.append(f'<g transform="translate(230 610)">{tower}<g class="s4-lh-glow">{glow}</g></g>')
    o.append('<g class="s4-birds mv">' + P.gulls("s4-gull", [(560, 200, 1.2, 0), (620, 176, 1, .25), (520, 240, .9, .45)]) + "</g>")
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面5：海の向こうへ（タイトル）
# ---------------------------------------------------------------------------
S5_CSS = """
.is-active .s5-ship{animation:s5-ship 7s cubic-bezier(.3,0,.7,1) both}
.is-active .s5-glint{animation:s5-glint 2.2s ease-in-out infinite}
.is-active .s5-gl{animation:s5-gl 2s ease-in-out infinite}
.is-active .s5-cl-a{animation:s5-drift 8s linear both}
.is-active .s5-cl-b{animation:s5-drift2 8s linear both}
.is-active .s5-blink{animation:s5-blink 1.8s ease-in-out infinite}
.is-active .s5-rays{animation:s5-rays 8s linear both}
@keyframes s5-ship{from{transform:translateX(-60px)}to{transform:translateX(70px)}}
@keyframes s5-glint{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}
@keyframes s5-gl{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes s5-drift{from{transform:translateX(-40px)}}
@keyframes s5-drift2{from{transform:translateX(30px)}}
@keyframes s5-blink{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes s5-rays{from{transform:rotate(-4deg)}to{transform:none}}
.s5-glint{transform-box:fill-box;transform-origin:50% 50%}
"""


def scene5():
    R = random.Random(305)
    o = [HEAD.format(label="大きな空と海。水平線のまだ見ぬ島々へ、小さな帆の船が進む。遠ざかるジパングの島に灯台の灯り")]
    o.append(f"<style>{S5_CSS}</style>")
    o.append("<defs>" + sky_defs("s5-", "#4f97d4", "#9ccdee", "#fdf0d2", 580) +
             '<radialGradient id="s5-cumulus" cx=".5" cy=".3" r=".75"><stop offset=".55" stop-color="#ffffff"/>'
             '<stop offset="1" stop-color="#d6e6f2"/></radialGradient>' + sea_defs("s5-", 576, 900, "#9ccbe2", "#2a6fa5") +
             '<linearGradient id="s5-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="0"/>'
             '<stop offset="1" stop-color="#fff6d8" stop-opacity=".5"/></linearGradient>'
             '<clipPath id="s5-sky-clip"><rect width="1600" height="577"/></clipPath></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s5-sky)"/>')
    sun = (1180, 400)
    rays = " ".join(f"M{sun[0]},{sun[1]} L{n(sun[0] + math.cos(a - .03) * 1200)},{n(sun[1] + math.sin(a - .03) * 1200)} "
                    f"L{n(sun[0] + math.cos(a + .03) * 1200)},{n(sun[1] + math.sin(a + .03) * 1200)}Z"
                    for a in [math.radians(d) for d in range(-172, -8, 14)])
    o.append(f'<g clip-path="url(#s5-sky-clip)"><g class="s5-rays mv" style="transform-origin:{sun[0]}px {sun[1]}px">'
             f'<path d="{rays}" fill="url(#s5-ray)" opacity=".3"/></g></g>')
    o.append(f'<circle cx="{sun[0]}" cy="{sun[1]}" r="420" fill="url(#s5-sunglow)"/><circle cx="{sun[0]}" cy="{sun[1]}" r="62" fill="#fffbea"/>')
    # 入道雲と霞
    big = [(260, 470, 90), (350, 430, 110), (470, 455, 92), (560, 480, 70), (190, 505, 60), (420, 505, 80)]
    o.append('<g class="s5-cl-a mv">' + lobes_union(big, "#c6dcec", 6, "url(#s5-cumulus)") + "</g>")
    o.append('<g class="s5-cl-b mv">' + clouds(R, [(1060, 470, 360, 18), (-40, 360, 300, 18), (640, 420, 300, 14)]) + "</g>")
    # 水平線の島々（まだ見ぬ島）
    o.append('<path d="M1330,577 C1360,556 1400,552 1440,566 C1460,558 1490,560 1510,577Z M1530,577 C1550,566 1580,564 1600,570 L1600,577Z '
             'M1140,577 C1160,568 1190,568 1210,577Z" fill="#8fb0c8"/>')
    # 海
    o.append('<rect x="0" y="576" width="1600" height="324" fill="url(#s5-sea)"/>'
             f'<path d="M{sun[0] - 260},578 L{sun[0] + 260},578" stroke="#fff6d8" stroke-width="3" opacity=".8"/>')
    o.append(glints(R, "s5-gl", sun[0] - 380, sun[0] + 380, 584, 820, 70, "#fff8de", (8, 22)))
    o.append(waves(R, 0, 1600, 600, 890, 34, opacity=.45))
    # 遠ざかるジパングの島（左手前）と灯台の灯り
    o.append('<path d="M-20,640 C40,600 110,560 170,548 C210,540 250,556 290,580 C330,602 380,620 430,640Z" fill="#6d9a86" stroke="#4d7466" stroke-width="2"/>'
             '<path d="M140,552 L150,520 L160,552Z" fill="#5c8a72"/>'
             '<path d="M392,632 L396,600 L404,600 L408,632Z" fill="#c8ccce" stroke="#556" stroke-width="1.4"/>'
             '<circle class="s5-blink" cx="400" cy="596" r="9" fill="#ffd77a"/>')
    # 小さな船（右へ）と、背に負う書の光
    o.append('<g class="s5-ship mv">'
             '<path d="M920,612 Q980,618 1040,610" fill="none" stroke="#f2f8ff" stroke-width="3" opacity=".8" stroke-linecap="round"/>'
             f'<g transform="translate(1060 610) scale(.16)">{P.ship_silhouette("#3d4a5e", "#fbf6e8")}</g>'
             f'<g transform="translate(1064 576)"><path class="s5-glint" d="{SPARK}" fill="#ffe7a0" transform="scale(.9)"/></g></g>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3, scene4, scene5]
