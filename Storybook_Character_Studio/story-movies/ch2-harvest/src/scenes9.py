"""第2章の結び「収穫祭の夜」の5場面のSVG。

  1. 守った田          月夜の田。実った稲が揺れ、畦には泥田の主たちとの戦いの泥の跡。
  2. 収穫祭            食堂の前、かまどの火と提灯。膳を囲むジンベエ・ゴンタ・シオン・ミナ・ピノと、料理を運ぶイナホ。
  3. 二冊の書          宴の灯りの中のシオンの背中。背負った職業の書がほのかに光り、農民と料理人の書が浮かぶ。
  4. 荒れる沖          村の灯りから沖へ。黒い雲と稲光、波にもまれる小さな船の影。稲光の一瞬だけ、海の中の巨大な影。
  5. 結び              嵐が遠くで続く暗い海。タイトル「第2章・完」。

島は静かなまま（ゲームの島には嵐の表現がない）。嵐は沖だけ。船は影だけで、乗っている人の顔や名前は描かない。
海の中の影は輪郭だけ（クラーケンの全身は第3章の戦闘まで見せない）。食堂・小屋・田は第3章の結末の props.py、
書の表紙は shared/books.py（M2で決めた意匠）。座標は viewBox="0 0 1600 900"。位置が動くものには .mv を付ける。
"""
import math
import os
import random

from helpers import n, kasumi, mountain
from figures import Cast, place, mix
import props as P          # 第3章の結末の村の小道具（../../ch3-departure/src/props.py）
import scenes as M4        # 空・海の部品
import books as B

HEAD = M4.HEAD
CAST = Cast(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts", "cast.json"))


def figure(cid, direction, arms, at, scale, prefix, tone=None, rims=(), bust=False, extra=""):
    """人物1人（extra はセル座標で胴の上に重ねる絵＝手に持つ皿など）。返り値は (defs, 描画, Figure)。"""
    f = CAST.figure(cid, direction, f"{prefix}{cid}-{direction}-", arms=arms, legs=not bust, tone=tone, rims=rims, arms_over=True)
    return f.defs, place(f.rim, at, scale, f.foot) + place(f.body + extra, at, scale, f.foot), f


def stars(R, cls, count, y1=480):
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(0, 1600))}" cy="{n(R.uniform(10, y1))}" r="{n(R.uniform(.9, 2.1))}" '
                   f'fill="#f2f4ff" style="animation-delay:-{n(R.uniform(0, 3))}s"/>' for _ in range(count))


def night_warm(c):
    """宴の灯り：人物を夜の青で少し沈め、提灯の橙を受ける。"""
    return mix(mix(c, "#2a3460", .16), "#ffb060", .1)


def lanterns(cls, x0, x1, y, sag, count, colors=("#e8553a", "#f6e6c4")):
    """提灯の列（たるんだ綱にぶら下がる）。"""
    o = [f'<path d="M{x0},{y} Q{(x0 + x1) / 2},{y + sag * 2} {x1},{y}" fill="none" stroke="#2a1f16" stroke-width="3"/>']
    for i in range(count):
        t = (i + .5) / count
        x = x0 + (x1 - x0) * t
        yy = (1 - t) ** 2 * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y
        c = colors[i % len(colors)]
        o.append(f'<circle class="{cls}" cx="{n(x)}" cy="{n(yy + 26)}" r="36" fill="#ffc870" opacity=".3" style="animation-delay:-{n(i * .37)}s"/>'
                 f'<path d="M{n(x)},{n(yy)} L{n(x)},{n(yy + 8)}" stroke="#2a1f16" stroke-width="2"/>'
                 f'<ellipse cx="{n(x)}" cy="{n(yy + 26)}" rx="15" ry="19" fill="{c}" stroke="#2a1f16" stroke-width="2.4"/>'
                 f'<path d="M{n(x - 13)},{n(yy + 20)} L{n(x + 13)},{n(yy + 20)} M{n(x - 13)},{n(yy + 32)} L{n(x + 13)},{n(yy + 32)}" stroke="#2a1f16" stroke-width="1.2" opacity=".5"/>'
                 f'<path d="M{n(x - 7)},{n(yy + 7)} L{n(x + 7)},{n(yy + 7)} M{n(x - 7)},{n(yy + 45)} L{n(x + 7)},{n(yy + 45)}" stroke="#2a1f16" stroke-width="4"/>')
    return "".join(o)


def rice_stalks(R, cls, x0, x1, base, h, count, color="#d8b84a", dark="#8a6a24"):
    """実った稲（茎と、垂れた穂）。株ごとに cls と遅れを付けて揺らす。"""
    o = []
    for _ in range(count):
        x = R.uniform(x0, x1)
        hh = h * R.uniform(.8, 1.15)
        lean = R.uniform(8, 18)
        o.append(f'<g class="{cls}" style="transform-origin:{n(x)}px {n(base)}px;animation-delay:-{n(R.uniform(0, 2.4))}s">'
                 f'<path d="M{n(x)},{n(base)} Q{n(x + 2)},{n(base - hh * .6)} {n(x + lean * .4)},{n(base - hh)}" fill="none" stroke="#7a8a3a" stroke-width="3"/>'
                 f'<path d="M{n(x + lean * .4)},{n(base - hh)} Q{n(x + lean)},{n(base - hh - 4)} {n(x + lean * 1.3)},{n(base - hh + 22)}" fill="none" '
                 f'stroke="{color}" stroke-width="7" stroke-linecap="round"/>'
                 f'<path d="M{n(x + lean * .4)},{n(base - hh)} Q{n(x + lean)},{n(base - hh - 4)} {n(x + lean * 1.3)},{n(base - hh + 22)}" fill="none" '
                 f'stroke="{dark}" stroke-width="2" stroke-dasharray="2 4"/>'
                 '</g>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面1：守った田（月夜）
# ---------------------------------------------------------------------------
S1_CSS = """
.s1-sway{transform-box:view-box}
.is-active .s1-sway{animation:s1-sway 2.4s ease-in-out infinite alternate}
.is-active .s1-tw{animation:s1-tw 1.8s ease-in-out infinite alternate}
.is-active .s1-gl{animation:s1-gl 2s ease-in-out infinite}
@keyframes s1-sway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
@keyframes s1-tw{from{opacity:.3}to{opacity:1}}
@keyframes s1-gl{0%,100%{opacity:.2}50%{opacity:.9}}
"""


def scene1():
    R = random.Random(901)
    o = [HEAD.format(label="月夜の田。実った稲が揺れ、畦には泥の跡が残る。奥に村の小屋と灯り")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append('<defs><linearGradient id="s1-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1736"/>'
             '<stop offset="1" stop-color="#2f4070"/></linearGradient>'
             '<radialGradient id="s1-mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d6" stop-opacity=".6"/>'
             '<stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s1-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d5786"/><stop offset="1" stop-color="#22355e"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    o.append(stars(R, "s1-tw", 70, 360))
    o.append('<circle cx="1180" cy="150" r="150" fill="url(#s1-mglow)"/><circle cx="1180" cy="150" r="44" fill="#fff8e0"/>')
    # 奥の山と村（小屋の灯り）
    md, _ = mountain([(-40, 470), (200, 360), (420, 400), (640, 330), (900, 410), (1180, 350), (1420, 420), (1640, 380)], 470, R, 3, .1)
    o.append(f'<path d="{md}" fill="#1e2f4a"/>')
    for x, s in ((300, .8), (420, .75), (1260, .8)):
        o.append(f'<g transform="translate({x} 478)">{P.hut(s=s)}</g><circle cx="{x}" cy="{478 - 18 * s}" r="22" fill="#ffd27a" opacity=".25"/>')
    # 田（水面に月）と畦
    o.append('<path d="M-20,470 L1620,470 L1620,900 L-20,900Z" fill="url(#s1-water)"/>')
    o.append('<ellipse cx="1180" cy="560" rx="70" ry="14" fill="#fff6d6" opacity=".35"/>')
    o.append(M4.glints(R, "s1-gl", 1080, 1300, 520, 640, 18, "#fff6d6"))
    o.append('<path d="M-20,640 C400,620 900,650 1620,600 L1620,640 C900,690 400,660 -20,680Z" fill="#4a3a2a"/>')
    # 泥の跡（泥田の主たちとの戦いの名残り）
    for _ in range(9):
        x, y = R.uniform(80, 1500), R.uniform(636, 668)
        o.append(f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="{n(R.uniform(26, 60))}" ry="{n(R.uniform(6, 11))}" fill="#2c2018" opacity=".8"/>')
    # 稲（奥・手前）
    o.append(rice_stalks(R, "s1-sway mv", 0, 1600, 600, 70, 70, "#c9ad4a", "#6a5220"))
    o.append(rice_stalks(R, "s1-sway mv", -40, 1640, 900, 210, 46))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：収穫祭
# ---------------------------------------------------------------------------
S2_CSS = """
.is-active .s2-lamp{animation:s2-lamp 1.4s ease-in-out infinite alternate}
.is-active .s2-fire{animation:s2-fire .5s ease-in-out infinite alternate}
.s2-fire{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s2-smoke{animation:s2-smoke 3.6s linear infinite}
.s2-smoke{transform-box:fill-box;transform-origin:50% 50%}
.s2-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s2-wave{animation:s2-wave 1s ease-in-out infinite alternate}
.is-active .s2-walk{animation:s2-walk 5s ease-out both}
.is-active .s2-tw{animation:s2-tw 1.8s ease-in-out infinite alternate}
@keyframes s2-lamp{from{opacity:.55}to{opacity:1}}
@keyframes s2-fire{from{transform:scale(1,1)}to{transform:scale(.88,1.12)}}
@keyframes s2-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.6}100%{transform:translate(20px,-90px) scale(1.6);opacity:0}}
@keyframes s2-wave{from{transform:rotate(-12deg)}to{transform:rotate(9deg)}}
@keyframes s2-walk{from{transform:translateX(120px)}}
@keyframes s2-tw{from{opacity:.3}to{opacity:1}}
"""
S2_FEET, S2_SCALE = 868, 2.4
S2_SEATED = (("jinbei", ("down", "down"), 330), ("gonta", ("high", "hip"), 560), ("hero2", ("down", "down"), 800),
             ("mina", ("wave", "down"), 1040), ("pino", ("hip", "wave"), 1270))
TABLE_TOP = 742


def dish(cx, cy, k=1.0):
    """皿の料理（セル座標）：白い皿に焼き魚と青菜。"""
    return (f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(15 * k)}" ry="{n(5 * k)}" fill="#f6f2e8" stroke="#3b2a1c" stroke-width="1.4"/>'
            f'<path d="M{n(cx - 9 * k)},{n(cy - 2)} Q{n(cx)},{n(cy - 8 * k)} {n(cx + 9 * k)},{n(cy - 2)} L{n(cx + 12 * k)},{n(cy - 5 * k)} L{n(cx + 12 * k)},{n(cy + 1)} '
            f'Q{n(cx)},{n(cy + 2)} {n(cx - 9 * k)},{n(cy - 2)}Z" fill="#c98a4a" stroke="#3b2a1c" stroke-width="1.2"/>'
            f'<circle cx="{n(cx - 6 * k)}" cy="{n(cy - 3)}" r="{n(2.4 * k)}" fill="#5a9a4a"/>')


def table_food(R, x0, x1, y):
    """膳の上の料理（scene座標）：茶碗のごはん・汁椀・焼き魚・おにぎり。"""
    o = []
    x = x0 + 40
    while x < x1 - 40:
        kind = R.randrange(4)
        if kind == 0:   # ごはん
            o.append(f'<path d="M{n(x - 20)},{n(y - 4)} Q{n(x)},{n(y + 22)} {n(x + 20)},{n(y - 4)}Z" fill="#6a4a3a" stroke="#2a1f16" stroke-width="2.4"/>'
                     f'<path d="M{n(x - 20)},{n(y - 4)} Q{n(x)},{n(y - 22)} {n(x + 20)},{n(y - 4)}Z" fill="#fbf8ee" stroke="#2a1f16" stroke-width="2"/>')
        elif kind == 1:  # 汁
            o.append(f'<path d="M{n(x - 20)},{n(y - 6)} Q{n(x)},{n(y + 20)} {n(x + 20)},{n(y - 6)}Z" fill="#9a2f24" stroke="#2a1f16" stroke-width="2.4"/>'
                     f'<ellipse cx="{n(x)}" cy="{n(y - 6)}" rx="20" ry="5" fill="#c99c5f" stroke="#2a1f16" stroke-width="2"/>')
        elif kind == 2:  # 焼き魚
            o.append(f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="34" ry="9" fill="#f6f2e8" stroke="#2a1f16" stroke-width="2"/>'
                     f'<path d="M{n(x - 22)},{n(y - 2)} Q{n(x)},{n(y - 14)} {n(x + 18)},{n(y - 2)} L{n(x + 28)},{n(y - 9)} L{n(x + 28)},{n(y + 4)} '
                     f'Q{n(x)},{n(y + 6)} {n(x - 22)},{n(y - 2)}Z" fill="#c98a4a" stroke="#2a1f16" stroke-width="2"/>')
        else:            # おにぎり
            o.append(f'<path d="M{n(x - 16)},{n(y + 2)} L{n(x)},{n(y - 22)} L{n(x + 16)},{n(y + 2)} Q{n(x)},{n(y + 8)} {n(x - 16)},{n(y + 2)}Z" '
                     f'fill="#fbf8ee" stroke="#2a1f16" stroke-width="2"/><path d="M{n(x - 7)},{n(y - 4)} L{n(x + 7)},{n(y - 4)} L{n(x + 7)},{n(y + 4)} L{n(x - 7)},{n(y + 4)}Z" fill="#2a3a2a"/>')
        x += R.uniform(70, 100)
    return "".join(o)


def scene2():
    R = random.Random(902)
    o = [HEAD.format(label="夜の食堂の前。かまどの火と提灯。膳を囲むジンベエ・ゴンタ・シオン・ミナ・ピノと、料理を運ぶイナホ")]
    o.append(f"<style>{S2_CSS}</style>")
    defs, people = [], []
    for cid, arms, x in S2_SEATED:
        d, m, _ = figure(cid, "front", arms, (x, S2_FEET), S2_SCALE, "s2-", tone=night_warm, rims=(("#ffc070", 1.1, -.7, .8),))
        defs.append(d); people.append(m)
    # 料理を運ぶイナホ：手を前で重ねた位置に皿を持たせる
    f0 = CAST.figure("inaho", "front", "s2-tmp-", arms=("front", "front"))
    (lx, ly), (rx, _) = f0.shoulders
    plate = dish((lx + rx) / 2, ly + 20, 1.2)
    di, inaho, _ = figure("inaho", "front", ("front", "front"), (1470, S2_FEET), S2_SCALE, "s2-", tone=night_warm,
                          rims=(("#ffc070", 1.1, -.7, .8),), extra=plate)
    defs.append(di)
    o.append('<defs><linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a3a"/>'
             '<stop offset="1" stop-color="#3a3a5e"/></linearGradient>'
             '<radialGradient id="s2-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb860" stop-opacity=".55"/>'
             '<stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>' + "".join(defs) + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append(stars(R, "s2-tw", 60, 260))
    # 食堂（奥）とかまど、宴の暖かい光
    o.append('<ellipse cx="800" cy="560" rx="900" ry="420" fill="url(#s2-warm)"/>')
    o.append(f'<g transform="translate(800 520)">{P.kitchen("s2-", 300, 120, 1.4)}</g>')
    o.append(f'<g transform="translate(240 520)">{P.hut(s=1.2)}</g><g transform="translate(1380 520)">{P.hut(s=1.15)}</g>')
    o.append('<path d="M-20,520 L1620,520 L1620,900 L-20,900Z" fill="#5d4a36"/>')
    # かまど（右手前）の火と煙
    o.append('<g transform="translate(1180 600)"><path d="M-46,0 L46,0 L40,-56 L-40,-56Z" fill="#8a8580" stroke="#2a1f16" stroke-width="3"/>'
             '<path d="M-20,0 L-20,-26 Q0,-40 20,-26 L20,0Z" fill="#3a2a20" stroke="#2a1f16" stroke-width="2.4"/>'
             '<path class="s2-fire" d="M-14,0 Q-16,-20 -4,-34 Q-2,-20 6,-30 Q18,-16 14,0Z" fill="#ff9a3a"/>'
             '<path class="s2-fire" d="M-6,0 Q-6,-14 2,-22 Q8,-12 6,0Z" fill="#ffe08a"/></g>')
    o.append(P.smoke("s2-smoke mv", 1180, 520, 1.3))
    o.append(lanterns("s2-lamp", 60, 1540, 300, 70, 9))
    # 膳を囲む五人（腰から下は膳に隠れる）
    for m in people:
        o.append(m.replace('class="wave"', 'class="s2-wave"'))
    o.append(f'<path d="M150,{TABLE_TOP} L1390,{TABLE_TOP} L1410,{TABLE_TOP + 30} L130,{TABLE_TOP + 30}Z" fill="#a8743f" stroke="#2a1f16" stroke-width="4"/>'
             f'<path d="M130,{TABLE_TOP + 30} L1410,{TABLE_TOP + 30} L1410,{TABLE_TOP + 60} L130,{TABLE_TOP + 60}Z" fill="#7c5730" stroke="#2a1f16" stroke-width="4"/>'
             f'<path d="M170,{TABLE_TOP + 60} L170,900 M1370,{TABLE_TOP + 60} L1370,900" stroke="#2a1f16" stroke-width="14"/>')
    o.append(table_food(R, 180, 1360, TABLE_TOP + 12))
    o.append(f'<g class="s2-walk mv">{inaho}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：二冊の書（シオンの背中）
# ---------------------------------------------------------------------------
S3_CSS = """
.is-active .s3-glow{animation:s3-glow 1.6s ease-in-out infinite alternate}
.s3-bookin{opacity:0}
.is-active .s3-bookin{animation:s3-in .9s ease-out both}
.is-active .s3-rise{animation:s3-rise 3s ease-out both}
.is-active .s3-bokeh{animation:s3-bokeh 2.6s ease-in-out infinite alternate}
@keyframes s3-glow{from{opacity:.45}to{opacity:.95}}
@keyframes s3-in{to{opacity:1}}
@keyframes s3-rise{from{transform:translateY(40px)}to{transform:translateY(-6px)}}
@keyframes s3-bokeh{from{opacity:.25}to{opacity:.7}}
"""


def scene3():
    R = random.Random(903)
    o = [HEAD.format(label="宴の灯りの中のシオンの背中。背負った深緑の職業の書がほのかに光り、両側に農民の書と料理人の書が光の中に浮かぶ")]
    o.append(f"<style>{S3_CSS}</style>")
    d, back, f = figure("hero2", "back", ("down", "down"), (800, 960), 5.6, "s3-", tone=night_warm, rims=(("#ffc070", 0, -1.2, .8),), bust=True)
    o.append('<defs><linearGradient id="s3-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d3a"/>'
             '<stop offset="1" stop-color="#4a3a3a"/></linearGradient>'
             '<radialGradient id="s3-bookglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f6e7a0" stop-opacity=".85"/>'
             '<stop offset=".5" stop-color="#e2c060" stop-opacity=".3"/><stop offset="1" stop-color="#e2c060" stop-opacity="0"/></radialGradient>'
             + B.defs("s3-farmer-", "farmer") + B.defs("s3-cook-", "cook") + d + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-bg)"/>')
    # 宴の灯りのぼけ
    for _ in range(22):
        x, y, r = R.uniform(0, 1600), R.uniform(60, 700), R.uniform(16, 46)
        c = R.choice(("#ffb860", "#ff8a4a", "#ffe0a0"))
        o.append(f'<circle class="s3-bokeh" cx="{n(x)}" cy="{n(y)}" r="{n(r)}" fill="{c}" opacity=".4" style="animation-delay:-{n(R.uniform(0, 2.6))}s"/>')
    o.append(back)
    # 背中の職業の書の光（胴の画像の本の位置：セル座標の中央上）
    o.append(place('<circle cx="64" cy="94" r="22" fill="url(#s3-bookglow)" class="s3-glow"/>', (800, 960), 5.6, f.foot))
    # 浮かぶ二冊（左：農民の書、右：料理人の書）
    for x, bid, delay in ((380, "farmer", .3), (1220, "cook", .9)):
        o.append(f'<g class="s3-bookin" style="animation-delay:{delay}s"><g class="s3-rise mv" style="animation-delay:{delay}s">'
                 f'<ellipse cx="{x}" cy="330" rx="170" ry="190" fill="url(#s3-{bid}-eglow)"/>'
                 f'<g transform="translate({x} 330) rotate({-6 if bid == "farmer" else 6}) scale(.52)">{B.cover(f"s3-{bid}-", bid)}</g></g></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面4：荒れる沖
# ---------------------------------------------------------------------------
S4_CSS = """
.is-active .s4-flash{animation:s4-flash 5s linear both}
.s4-flash{opacity:0}
.is-active .s4-bolt{animation:s4-bolt 5s linear both}
.s4-bolt{opacity:0}
.is-active .s4-shadow{animation:s4-shadow 5s linear both}
.s4-shadow{opacity:0}
.is-active .s4-toss{animation:s4-toss 1.3s ease-in-out infinite alternate}
.is-active .s4-wv{animation:s4-wv 1.6s ease-in-out infinite alternate}
.is-active .s4-cloud{animation:s4-cloud 5s linear both}
.is-active .s4-lamp{animation:s4-lamp 1.4s ease-in-out infinite alternate}
@keyframes s4-flash{0%,47%{opacity:0}48%{opacity:.55}52%{opacity:.08}55%{opacity:.4}62%,100%{opacity:0}}
.is-active .s4-rain{animation:s4-rain .5s linear infinite}
@keyframes s4-rain{from{transform:translate(0,0)}to{transform:translate(-26px,70px)}}
@keyframes s4-bolt{0%,47%{opacity:0}48%,54%{opacity:1}60%,100%{opacity:0}}
@keyframes s4-shadow{0%,47%{opacity:0}49%,55%{opacity:.75}66%,100%{opacity:0}}
@keyframes s4-toss{from{transform:translateY(-10px) rotate(-9deg)}to{transform:translateY(10px) rotate(8deg)}}
@keyframes s4-wv{from{transform:translateX(-18px)}to{transform:translateX(18px)}}
@keyframes s4-cloud{from{transform:translateX(60px)}to{transform:translateX(-40px)}}
@keyframes s4-lamp{from{opacity:.55}to{opacity:1}}
"""


def scene4():
    R = random.Random(904)
    o = [HEAD.format(label="村の灯りの向こうの沖。黒い雲と稲光、高い波にもまれる小さな船の影。稲光の一瞬、海の中に巨大な影が見える")]
    o.append(f"<style>{S4_CSS}</style>")
    o.append('<defs><linearGradient id="s4-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e1c"/>'
             '<stop offset="1" stop-color="#2a3148"/></linearGradient>'
             '<linearGradient id="s4-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3550"/><stop offset="1" stop-color="#0c1224"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    # 黒い雲（沖の上だけ）
    cl = " ".join(kasumi(x, y, w, h) for x, y, w, h in ((700, 120, 900, 60), (820, 220, 820, 54), (640, 320, 960, 50), (980, 60, 640, 46)))
    o.append(f'<g class="s4-cloud mv"><path d="{cl}" fill="#1a1e2c"/><path d="{cl}" fill="#2e3448" transform="translate(0 -10)" opacity=".7"/></g>')
    # 稲光（沖）
    o.append('<path class="s4-bolt" d="M1180,140 L1150,250 L1190,260 L1140,400 L1210,240 L1170,232 L1210,140Z" fill="#f2f6ff"/>')
    # 海
    o.append('<rect x="0" y="430" width="1600" height="470" fill="url(#s4-sea)"/>')
    # 波（高く不ぞろい、白い波頭）と、もまれる小さな船の影
    for i, y in enumerate((470, 520, 585)):
        pts, x = [], -20
        while x < 1640:
            w = R.uniform(60, 120)
            pts.append(f"Q{n(x + w / 2)},{n(y - R.uniform(18, 46) - i * 8)} {n(x + w)},{n(y + R.uniform(-6, 6))}")
            x += w
        d = f"M-20,{y} " + " ".join(pts)
        o.append(f'<g class="s4-wv mv" style="animation-delay:-{i * .4}s"><path d="{d} L1640,900 L-20,900Z" fill="#1a2440" opacity=".6"/>'
                 f'<path d="{d}" fill="none" stroke="#a8b6d8" stroke-width="2.6" opacity=".55"/></g>')
    for _ in range(26):
        x, y = R.uniform(560, 1600), R.uniform(450, 640)
        o.append(f'<path d="M{n(x)},{n(y)} q8,-10 18,-4 q-6,2 -10,8" fill="none" stroke="#e8eeff" stroke-width="2.4" opacity=".55"/>')
    o.append('<g transform="translate(1000 505)"><g class="s4-toss mv">'
             '<path d="M-60,-6 L60,-6 Q50,14 0,18 Q-50,14 -60,-6Z" fill="#05080f"/>'
             '<path d="M-4,-6 L-4,-70 M-4,-66 L34,-30 L-4,-26" fill="none" stroke="#05080f" stroke-width="5"/>'
             '<path d="M-2,-64 L30,-30 L-2,-28Z" fill="#141a2a"/></g></g>')
    # 雨（沖だけ）
    rain = " ".join(f"M{n(R.uniform(800, 1720))},{n(R.uniform(-60, 600))} l-26,70" for _ in range(80))   # 島の上には降らせない
    o.append(f'<g class="s4-rain mv"><path d="{rain}" stroke="#8fa0c8" stroke-width="2" opacity=".45"/></g>')
    # 稲光の明かり（空と沖）と、その一瞬だけ見える海の中の巨大な影（輪郭だけ）
    o.append('<rect class="s4-flash" width="1600" height="700" fill="#dfe6ff"/>')
    arms = []
    for i in range(6):
        a = math.pi * (.12 + i * .15)
        x0, y0 = 1180, 650
        x1, y1 = x0 + 360 * math.cos(a + 2.6), y0 + 150 * math.sin(a)
        arms.append(f'M{x0},{y0} Q{n((x0 + x1) / 2 + 60)},{n((y0 + y1) / 2 - 40)} {n(x1)},{n(y1)}')
    o.append(f'<g class="s4-shadow"><ellipse cx="1180" cy="630" rx="150" ry="58" fill="#0a1020" opacity=".8"/>'
             f'<path d="{" ".join(arms)}" fill="none" stroke="#0a1020" stroke-width="26" stroke-linecap="round" opacity=".75"/></g>')
    # 手前の島（静か）と村の灯り
    o.append('<path d="M-20,640 C120,600 300,590 520,620 C620,634 700,680 740,760 L740,900 L-20,900Z" fill="#141c2c"/>')
    for x, y in ((120, 620), (200, 612), (300, 606), (420, 612)):
        o.append(f'<circle class="s4-lamp" cx="{x}" cy="{y}" r="16" fill="#ffc870" opacity=".4"/><circle cx="{x}" cy="{y}" r="4" fill="#ffe0a0"/>')
    o.append(f'<g transform="translate(250 640)">{P.hut(s=.9)}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面5：結び（暗い海、タイトル）
# ---------------------------------------------------------------------------
S5_CSS = """
.is-active .s5-far{animation:s5-far 3.4s linear both}
.s5-far{opacity:0}
.is-active .s5-wv{animation:s5-wv 3s ease-in-out infinite alternate}
.is-active .s5-tw{animation:s5-tw 1.8s ease-in-out infinite alternate}
@keyframes s5-far{0%,30%{opacity:0}33%{opacity:.7}38%{opacity:.1}41%{opacity:.5}50%,100%{opacity:0}}
@keyframes s5-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s5-tw{from{opacity:.25}to{opacity:.9}}
"""


def scene5():
    R = random.Random(905)
    o = [HEAD.format(label="嵐が遠くで続く暗い海。水平線の雲の中で、ときおり稲光がまたたく。タイトル「第2章・完」")]
    o.append(f"<style>{S5_CSS}</style>")
    o.append('<defs><linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a16"/>'
             '<stop offset="1" stop-color="#1c2340"/></linearGradient>'
             '<linearGradient id="s5-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2644"/><stop offset="1" stop-color="#070b18"/></linearGradient>'
             '<radialGradient id="s5-flash" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#c8d4ff" stop-opacity=".8"/>'
             '<stop offset="1" stop-color="#c8d4ff" stop-opacity="0"/></radialGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s5-sky)"/>')
    o.append(stars(R, "s5-tw", 50, 300))
    o.append('<ellipse class="s5-far" cx="1250" cy="520" rx="260" ry="90" fill="url(#s5-flash)"/>')
    o.append('<path d="' + " ".join(kasumi(x, y, w, h) for x, y, w, h in ((980, 500, 520, 26), (1100, 470, 360, 20))) + '" fill="#141a2c"/>')
    o.append('<rect x="0" y="540" width="1600" height="360" fill="url(#s5-sea)"/>')
    o.append(f'<g class="s5-wv mv">{M4.waves(R, 0, 1600, 560, 880, 28, color="#5d6b94", opacity=.35)}</g>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3, scene4, scene5]
