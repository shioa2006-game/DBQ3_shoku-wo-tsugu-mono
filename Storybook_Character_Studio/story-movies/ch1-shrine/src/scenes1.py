"""第1章の結び「小さな社」の3場面のSVG。

  1. 祭壇の二冊          夜の社。水色の祭壇に、職業の書と、よみがえった農民の書が並ぶ。両脇の石灯籠に灯り。
  2. 社を見上げる人々    夜。山の上で灯る社と、灯りの続く参道を、ミナ・ピノ・ゴンタ・ジンベエが見上げる（後ろ姿）。
  3. 朝の村              朝日の村の全景。小屋・田と畑・柵・旗、山の上の社。タイトル「第1章・完」。

第1章で建てたものだけを描く（食堂・灯台・船は第2章以降なので描かない）。社・小屋・田・旗は第3章の結末の
props.py、書の表紙は shared/books.py。座標は viewBox="0 0 1600 900"。位置が動くものには .mv を付ける。
"""
import os
import random

from helpers import n, kasumi, mountain
from figures import Cast, place, mix
import props as P          # 第3章の結末の村の小道具（../../ch3-departure/src/props.py）
import scenes as M4        # 空・海の部品
import books as B

HEAD = M4.HEAD
CAST = Cast(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts", "cast.json"))


def figure_set(specs, prefix, tone=None, rims=()):
    defs, out = [], []
    for cid, direction, arms, at, scale, bust in specs:
        f = CAST.figure(cid, direction, f"{prefix}{cid}-{direction}-", arms=arms, legs=not bust, tone=tone, rims=rims, arms_over=True)
        defs.append(f.defs)
        out.append(place(f.rim, at, scale, f.foot) + place(f.body, at, scale, f.foot))
    return "".join(defs), out


def stars(R, cls, count, y1=520):
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(0, 1600))}" cy="{n(R.uniform(10, y1))}" r="{n(R.uniform(.9, 2.2))}" '
                   f'fill="#f2f4ff" style="animation-delay:-{n(R.uniform(0, 3))}s"/>' for _ in range(count))


def toro(x, y, s=1.0, fire_cls=""):
    """石灯籠（足元の中央 (x, y)）。火袋の灯り。"""
    k = lambda v: n(v * s)
    st, dk, ink = "#9aa0a4", "#6c7276", "#2f2a26"
    return (f'<g transform="translate({n(x)} {n(y)})" stroke="{ink}" stroke-width="{k(3)}" stroke-linejoin="round">'
            f'<path d="M{k(-34)},0 L{k(34)},0 L{k(28)},{k(-18)} L{k(-28)},{k(-18)}Z" fill="{dk}"/>'
            f'<path d="M{k(-10)},{k(-18)} L{k(10)},{k(-18)} L{k(8)},{k(-96)} L{k(-8)},{k(-96)}Z" fill="{st}"/>'
            f'<path d="M{k(-30)},{k(-96)} L{k(30)},{k(-96)} L{k(24)},{k(-110)} L{k(-24)},{k(-110)}Z" fill="{dk}"/>'
            f'<path d="M{k(-22)},{k(-110)} L{k(22)},{k(-110)} L{k(22)},{k(-150)} L{k(-22)},{k(-150)}Z" fill="{st}"/>'
            f'<path class="{fire_cls}" d="M{k(-12)},{k(-114)} L{k(12)},{k(-114)} L{k(12)},{k(-144)} L{k(-12)},{k(-144)}Z" fill="#ffc45a" stroke="none"/>'
            f'<path d="M{k(-44)},{k(-150)} Q{k(0)},{k(-176)} {k(44)},{k(-150)} L{k(30)},{k(-160)} Q{k(0)},{k(-196)} {k(-30)},{k(-160)}Z" fill="{dk}"/>'
            f'<circle cx="0" cy="{k(-196)}" r="{k(8)}" fill="{st}"/></g>')


def fence(x0, y0, x1, y1, posts=6):
    """柵（杭と二本の横木）。"""
    o = []
    for i in range(posts + 1):
        t = i / posts
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        o.append(f'<path d="M{n(x)},{n(y)} L{n(x)},{n(y - 30)}" stroke="#3b2a1c" stroke-width="7" stroke-linecap="round"/>'
                 f'<path d="M{n(x)},{n(y)} L{n(x)},{n(y - 30)}" stroke="#a87a44" stroke-width="4" stroke-linecap="round"/>')
    for dy in (10, 22):
        o.append(f'<path d="M{n(x0)},{n(y0 - dy)} L{n(x1)},{n(y1 - dy)}" stroke="#3b2a1c" stroke-width="6"/>'
                 f'<path d="M{n(x0)},{n(y0 - dy)} L{n(x1)},{n(y1 - dy)}" stroke="#c99c5f" stroke-width="3"/>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面1：祭壇の二冊（夜の社）
# ---------------------------------------------------------------------------
S1_CSS = """
.is-active .s1-fire{animation:s1-fire .8s ease-in-out infinite alternate}
.is-active .s1-glow{animation:s1-glow 2.4s ease-in-out infinite alternate}
.is-active .s1-tw{animation:s1-tw 1.8s ease-in-out infinite alternate}
.s1-mote{opacity:0}
.is-active .s1-mote{animation:s1-mote 3.4s ease-out infinite}
.s1-bookglow{opacity:0}
.is-active .s1-bookglow{animation:s1-in 1.6s .4s ease-out both}
@keyframes s1-fire{from{opacity:.7}to{opacity:1}}
@keyframes s1-glow{from{opacity:.55}to{opacity:.95}}
@keyframes s1-tw{from{opacity:.3}to{opacity:1}}
@keyframes s1-mote{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s1-in{to{opacity:1}}
"""


def scene1():
    R = random.Random(101)
    o = [HEAD.format(label="夜の社。水色の祭壇に、深緑の職業の書と、よみがえった土色の農民の書が並ぶ。両脇の石灯籠に灯りがともる")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append('<defs><linearGradient id="s1-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1230"/>'
             '<stop offset="1" stop-color="#26355e"/></linearGradient>'
             '<radialGradient id="s1-altarglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d8f2ff" stop-opacity=".8"/>'
             '<stop offset=".5" stop-color="#9fd8ff" stop-opacity=".25"/><stop offset="1" stop-color="#9fd8ff" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s1-fireglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/>'
             '<stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s1-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5038"/><stop offset="1" stop-color="#4a3626"/></linearGradient>'
             '<linearGradient id="s1-cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8ff"/><stop offset="1" stop-color="#7fbfe2"/></linearGradient>'
             + B.defs("s1-job-", "job") + B.defs("s1-farmer-", "farmer") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    o.append(stars(R, "s1-tw", 70, 300))
    # 社の正面：柱と梁、屋根の軒、板の奥壁
    o.append('<path d="M300,250 L1300,250 L1300,720 L300,720Z" fill="url(#s1-wall)"/>'
             + "".join(f'<path d="M{x},250 L{x},720" stroke="#3b2a1c" stroke-width="2.4" opacity=".55"/>' for x in range(340, 1300, 52))
             + '<path d="M250,232 L1350,232 L1350,262 L250,262Z" fill="#7c5730" stroke="#2a1f16" stroke-width="4"/>'
             '<path d="M140,236 Q800,130 1460,236 L1400,176 Q800,70 200,176Z" fill="#5a4030" stroke="#2a1f16" stroke-width="5" stroke-linejoin="round"/>'
             '<path d="M200,176 Q800,70 1400,176" fill="none" stroke="#8a6a52" stroke-width="4"/>'
             '<path d="M300,250 L300,760 L350,760 L350,250Z M1250,250 L1250,760 L1300,760 L1300,250Z" fill="#c99c5f" stroke="#2a1f16" stroke-width="4"/>'
             '<path d="M520,262 L1080,262 Q1080,300 800,312 Q520,300 520,262Z" fill="#e9e4d8" stroke="#2a1f16" stroke-width="3"/>'
             + "".join(f'<path d="M{x},300 l-10,22 l20,0z" fill="#f6f2e8" stroke="#2a1f16" stroke-width="2"/>' for x in (600, 700, 800, 900, 1000)))
    # 床と石段
    o.append('<path d="M0,720 L1600,720 L1600,900 L0,900Z" fill="#5d4632"/>'
             + "".join(f'<path d="M0,{y} L1600,{y}" stroke="#3b2a1c" stroke-width="2.4" opacity=".55"/>' for y in (760, 806, 858)))
    # 祭壇（水色の布）と、その上に並ぶ二冊
    o.append('<ellipse class="s1-glow" cx="800" cy="520" rx="420" ry="250" fill="url(#s1-altarglow)"/>')
    o.append('<path d="M500,600 L1100,600 L1120,720 L480,720Z" fill="url(#s1-cloth)" stroke="#2d5a78" stroke-width="4"/>'
             '<path d="M470,586 L1130,586 L1130,604 L470,604Z" fill="#c99c5f" stroke="#2a1f16" stroke-width="4"/>'
             '<path d="M560,640 Q800,660 1040,640" fill="none" stroke="#e8f8ff" stroke-width="3" opacity=".7"/>')
    for cx, bid in ((690, "job"), (910, "farmer")):
        o.append(f'<ellipse class="s1-bookglow" cx="{cx}" cy="470" rx="150" ry="170" fill="url(#s1-{bid}-eglow)"/>')
        o.append(f'<g transform="translate({cx} 476) rotate({-3 if bid == "job" else 3}) scale(.56)">{B.cover(f"s1-{bid}-", bid)}</g>')
    # 石灯籠（両脇）と灯りの粒
    for x in (230, 1370):
        o.append(f'<circle class="s1-fire" cx="{x}" cy="{740 - 128}" r="130" fill="url(#s1-fireglow)"/>' + toro(x, 860, 1.0, fire_cls="s1-fire"))
    o.append('<g class="s1-motes mv">' + "".join(
        f'<circle class="s1-mote mv" cx="{n(R.uniform(560, 1040))}" cy="{n(R.uniform(480, 620))}" r="{n(R.uniform(1.8, 3.6))}" fill="#fff3c8" '
        f'style="--dx:{n(R.uniform(-40, 40))}px;--dy:{n(R.uniform(-200, -110))}px;animation-delay:-{n(R.uniform(0, 3.4))}s"/>'
        for _ in range(26)) + "</g>")
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：社を見上げる人々（夜）
# ---------------------------------------------------------------------------
S2_CSS = """
.is-active .s2-tw{animation:s2-tw 1.8s ease-in-out infinite alternate}
.is-active .s2-lamp{animation:s2-lamp 1.6s ease-in-out infinite alternate}
.is-active .s2-halo{animation:s2-halo 2.4s ease-in-out infinite alternate}
.is-active .s2-cl{animation:s2-drift 4s linear both}
@keyframes s2-tw{from{opacity:.3}to{opacity:1}}
@keyframes s2-lamp{from{opacity:.6}to{opacity:1}}
@keyframes s2-halo{from{opacity:.6}to{opacity:1}}
@keyframes s2-drift{from{transform:translateX(-30px)}}
"""
S2_BACKS = (("jinbei", ("down", "down"), 210, 3.0), ("gonta", ("hip", "down"), 440, 3.0),
            ("mina", ("down", "down"), 1160, 3.0), ("pino", ("down", "hip"), 1390, 3.0))


def night(c):
    return mix(mix(c, "#22305a", .28), "#ffc890", .04)


def scene2():
    R = random.Random(102)
    o = [HEAD.format(label="夜。山の上で灯る社と、灯りの続く参道。手前でミナ・ピノ・ゴンタ・ジンベエが社を見上げる（後ろ姿）")]
    o.append(f"<style>{S2_CSS}</style>")
    bdefs, backs = figure_set([(cid, "back", arms, (x, 884), s, True) for cid, arms, x, s in S2_BACKS], "s2-b-", tone=night,
                              rims=(("#9fd8ff", 0, -1.2, .6),))
    o.append('<defs><linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1130"/>'
             '<stop offset=".7" stop-color="#22305a"/><stop offset="1" stop-color="#3b4a78"/></linearGradient>'
             '<radialGradient id="s2-shrineglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d8f2ff" stop-opacity=".85"/>'
             '<stop offset=".45" stop-color="#9fd8ff" stop-opacity=".3"/><stop offset="1" stop-color="#9fd8ff" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s2-mglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef4ff" stop-opacity=".55"/>'
             '<stop offset="1" stop-color="#eef4ff" stop-opacity="0"/></radialGradient>' + bdefs + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append(stars(R, "s2-tw", 90, 420))
    o.append('<circle cx="1330" cy="140" r="130" fill="url(#s2-mglow)"/><circle cx="1330" cy="140" r="36" fill="#f2f6ff"/>')
    o.append(M4.clouds(R, [(80, 200, 420, 18), (1000, 260, 360, 14)], body="#5d6b94", shade="#3b4770", cls="s2-cl mv"))
    # 北の山（参道の灯り）と、頂上の社
    md, mr = mountain([(280, 900), (420, 700), (560, 520), (700, 350), (800, 300), (900, 350), (1040, 520), (1180, 700), (1320, 900)], 900, R, 3, .1)
    o.append(f'<path d="{md}" fill="#1f3a3a"/><path d="{mr}" fill="none" stroke="#4f7a72" stroke-width="3" opacity=".6"/>')
    path = [(800, 330), (760, 400), (840, 470), (740, 550), (860, 640), (720, 740), (800, 860)]
    o.append('<path d="M' + " L".join(f"{x},{y}" for x, y in path) + '" fill="none" stroke="#c9b48a" stroke-width="10" stroke-linejoin="round" opacity=".55"/>')
    for x, y in path[1:-1]:
        o.append(f'<circle class="s2-lamp" cx="{x}" cy="{y - 10}" r="18" fill="#ffd27a" opacity=".35"/><circle cx="{x}" cy="{y - 10}" r="5" fill="#ffe2a0"/>')
    o.append('<circle class="s2-halo" cx="800" cy="280" r="190" fill="url(#s2-shrineglow)"/>')
    o.append(f'<g transform="translate(800 330)">{P.shrine(1.5)}</g>')
    for markup in backs:
        o.append(markup.replace('class="wave"', 'class="s2-still"'))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：朝の村（タイトル）
# ---------------------------------------------------------------------------
S3_CSS = """
.is-active .s3-cl{animation:s3-drift 6s linear both}
.is-active .s3-flagwave{animation:s3-flag 1.4s ease-in-out infinite alternate}
.s3-flagwave{transform-box:fill-box;transform-origin:0% 50%}
.is-active .s3-gl{animation:s3-gl 1.9s ease-in-out infinite}
.is-active .s3-wv{animation:s3-wv 3s ease-in-out infinite alternate}
.is-active .s3-birds{animation:s3-birds 6s ease-out both}
.is-active .s3-gull{animation:s3-flap .7s ease-in-out infinite alternate}
.s3-gull{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s3-light{animation:s3-light 4.5s ease-out both}
@keyframes s3-drift{from{transform:translateX(-36px)}}
@keyframes s3-flag{from{transform:skewY(-4deg) scaleX(.92)}to{transform:skewY(5deg)}}
@keyframes s3-gl{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes s3-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s3-birds{from{transform:translate(-120px,24px)}}
@keyframes s3-flap{to{transform:scaleY(.55)}}
@keyframes s3-light{from{opacity:.6}to{opacity:0}}
"""


def scene3():
    R = random.Random(103)
    o = [HEAD.format(label="朝日の村の全景。山の上の社、三軒の小屋、田と畑、柵、旗、かかし。浜と海")]
    o.append(f"<style>{S3_CSS}</style>")
    o.append("<defs>" + M4.sky_defs("s3-", "#7fb8e2", "#bfdff0", "#f8e6c4", 470) + M4.sea_defs("s3-", 600)
             + '<linearGradient id="s3-land" x1="0" y1="430" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#8cbf6e"/><stop offset="1" stop-color="#5e9a58"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append('<circle cx="1320" cy="190" r="260" fill="url(#s3-sunglow)"/><circle cx="1320" cy="190" r="50" fill="#fffbe6" opacity=".95"/>')
    o.append(M4.clouds(R, [(60, 110, 420, 24), (760, 80, 380, 22), (1100, 300, 300, 16)], cls="s3-cl mv"))
    # 北の山と社（参道）
    md, mr = mountain([(-40, 560), (80, 420), (200, 290), (300, 200), (380, 170), (460, 210), (560, 320), (700, 470), (820, 560)], 560, R, 3, .1)
    o.append(f'<path d="{md}" fill="#6fa27a"/><path d="{mr}" fill="none" stroke="#4f7a5a" stroke-width="3" opacity=".7"/>')
    o.append('<path d="M380,190 L350,250 L420,300 L330,370 L440,440 L360,520" fill="none" stroke="#e6d6a6" stroke-width="7" stroke-linejoin="round" opacity=".8"/>')
    o.append(f'<g transform="translate(380 196)">{P.shrine(.75)}</g>')
    for x, y in ((160, 380), (250, 300), (520, 330), (600, 420)):
        o.append(P.pine(R, x, y, 54, 22))
    # 村の土地と海（右下）
    o.append('<path d="M-20,560 C300,520 700,530 1040,560 C1180,572 1280,600 1360,640 L1360,900 L-20,900Z" fill="url(#s3-land)"/>')
    o.append('<path d="M1360,640 C1300,700 1240,800 1220,900 L1620,900 L1620,600 C1520,600 1420,612 1360,640Z" fill="url(#s3-sea)"/>'
             '<path d="M1360,640 C1300,700 1240,800 1220,900" fill="none" stroke="#f3e3b4" stroke-width="16"/>')
    o.append(M4.glints(R, "s3-gl", 1300, 1600, 620, 860, 20, "#ffffff"))
    o.append(f'<g class="s3-wv mv">{M4.waves(R, 1280, 1600, 640, 880, 12, opacity=.5)}</g>')
    # 田と畑・かかし
    o.append(P.paddy(560, 650, 230, 70, -6, .7) + P.paddy(820, 646, 210, 66, -4, .7) + P.paddy(600, 740, 250, 74, -6, .7))
    o.append(P.field(880, 732, 230, 76, 5))
    o.append(f'<g transform="translate(760 732)">{P.scarecrow(1.1)}</g>')
    # 小屋（三軒）と旗、柵
    for x, y, s in ((210, 640, 1.25), (380, 610, 1.15), (330, 760, 1.3)):
        o.append(f'<g transform="translate({x} {y})">{P.hut(s=s)}</g>')
    o.append(f'<g transform="translate(500 600)">{P.banner("s3-", 110, "#c23b2a", 1.2)}</g>')
    o.append(fence(60, 860, 520, 840, 8) + fence(1130, 800, 1240, 700, 4))
    o.append(P.round_tree(R, 1180, 560, 30) + P.round_tree(R, 80, 560, 26))
    o.append('<g class="s3-birds mv">' + P.gulls("s3-gull", ((980, 210, 1, 0), (1040, 240, .8, .3), (1100, 200, .9, .5))) + "</g>")
    o.append('<rect class="s3-light" width="1600" height="900" fill="#fff4d8" opacity="0"/>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3]
