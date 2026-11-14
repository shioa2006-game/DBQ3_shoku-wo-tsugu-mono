"""三頭魔竜の襲来「三つ首の影」の3場面のSVG。

  1. 暗くなる空      神殿の軒先から見る海。海の向こうの空が暗い雲に覆われ、水平線から三つ首の竜が近づいてくる。
  2. 見下ろす三つの頭  再建した神殿の大屋根の上に、翼を広げたヴァルガ。三つの頭が大屋根を見下ろし、口に火をためる。
  3. 名乗り          暗い空を背に、三つの頭が迫る。名乗りの字幕と、名前「三頭魔竜　ヴァルガ」の表示。

ヴァルガは ../parts/varga.json（Studioの作画コードの頭・開口頭・胴。../../shared/varga.mjs が書き出す）を、props12.Varga で
首・翼・尾と組み立てる。再建した神殿は共通部品（../../shared/temple.py）。ガーゴイルは描かない（ボス戦に加わるかはゲームで決める）。
戦いの結果（反撃と退却）も描かない。座標は viewBox="0 0 1600 900"。位置が動くアニメーションには .mv を付け、モーション軽減時に止める。
"""
import os
import random

from helpers import n, kasumi, cloud
import scenes as M4        # 第3章の結末の空・海の部品（../../ch3-departure/src/scenes.py）
import temple as T         # 再建した神殿（../../shared/temple.py）
import props12 as Q

HEAD = M4.HEAD
VARGA = Q.Varga(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts", "varga.json"))


def embers(R, cls, count, x0, x1, y0, y1, color="#ffb24a"):
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(x0, x1))}" cy="{n(R.uniform(y0, y1))}" r="{n(R.uniform(1.4, 3.2))}" fill="{color}" '
                   f'style="--dx:{n(R.uniform(-40, 40))}px;--dy:{n(R.uniform(-200, -90))}px;animation-delay:-{n(R.uniform(0, 3))}s"/>'
                   for _ in range(count))


def storm(R, cls, x0, x1, y0, y1, count, color, edge=None):
    """暗い雲の塊（上が盛り上がった雲を重ねる。下側ほど大きい）。"""
    o = []
    for i in range(count):
        t = i / max(1, count - 1)
        w = R.uniform(240, 420)
        x = R.uniform(x0, x1 - w * .5)
        y = y0 + (y1 - y0) * t + R.uniform(-20, 20)
        d = cloud(x, y, w, R.uniform(70, 130), R.randrange(4, 7), R)
        o.append(f'<path d="{d}" fill="{color}"' + (f' stroke="{edge}" stroke-width="3"' if edge else "") + "/>")
    return f'<g class="{cls}">{"".join(o)}</g>'


# ---------------------------------------------------------------------------
# 場面1：暗くなる空（水平線から近づく）
# ---------------------------------------------------------------------------
S1_CSS = """
.s1-dark{opacity:0}
.is-active .s1-dark{animation:s1-dark 2.4s ease-in both}
.is-active .s1-storm{animation:s1-storm 2.4s ease-out both}
.s1-come{transform:translate(1040px,420px) scale(.26)}
.is-active .s1-come{animation:s1-come 2.4s ease-in both}
.is-active .s1-wing{animation:s1-wing .5s ease-in-out infinite alternate}
.s1-wing{transform-box:view-box}
.is-active .s1-wv{animation:s1-wv 2.6s ease-in-out infinite alternate}
.is-active .s1-gull{animation:s1-gull 2.4s ease-in both}
@keyframes s1-dark{to{opacity:.88}}
@keyframes s1-storm{from{transform:translateX(420px) scaleY(.6)}to{transform:translateX(0) scaleY(1)}}
@keyframes s1-come{from{transform:translate(1230px,520px) scale(.08)}to{transform:translate(1040px,420px) scale(.26)}}
@keyframes s1-wing{from{transform:scaleY(1)}to{transform:scaleY(.7)}}
@keyframes s1-wv{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes s1-gull{from{transform:translate(0,0)}to{transform:translate(-320px,-60px)}}
"""
S1_SEA = 560


def scene1():
    R = random.Random(1201)
    o = [HEAD.format(label="神殿の軒先から見る海。海の向こうの空が暗い雲に覆われていき、水平線から三つ首の竜が近づいてくる")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append('<defs><linearGradient id="s1-sky" x1="0" y1="0" x2="0" y2="570" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#6f9fd0"/><stop offset=".7" stop-color="#c9d8e4"/><stop offset="1" stop-color="#f2d6a8"/></linearGradient>'
             '<linearGradient id="s1-darkg" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#140f22"/><stop offset=".6" stop-color="#2c1e34"/><stop offset="1" stop-color="#1a1422"/></linearGradient>'
             '<linearGradient id="s1-sea" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#8ab8d6"/><stop offset="1" stop-color="#2f6f9f"/></linearGradient>'
             '<filter id="s1-far"><feColorMatrix type="matrix" values=".45 0 0 0 .04  0 .35 0 0 .03  0 0 .45 0 .07  0 0 0 1 0"/></filter>'
             + VARGA.defs("s1-v-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    o.append(f'<rect x="0" y="{S1_SEA}" width="1600" height="{900 - S1_SEA}" fill="url(#s1-sea)"/>')
    o.append(f'<g class="s1-wv mv">{M4.waves(R, 0, 1600, S1_SEA + 16, 880, 30, color="#eef6fb", opacity=.4)}</g>')
    # 海の向こうから広がる暗い雲と、空・海が暗くなる重ね
    o.append(f'<g class="s1-storm mv" style="transform-origin:1600px 520px">'
             f'{storm(R, "", 760, 1640, 300, 470, 9, "#3b2c46", "#5a4864")}{storm(R, "", 680, 1640, 380, 570, 11, "#2a2136", "#46385a")}</g>')
    o.append('<rect class="s1-dark" width="1600" height="900" fill="url(#s1-darkg)"/>')
    # 水平線から近づく三つ首の竜（遠いので暗く沈める）
    o.append(f'<g class="s1-come mv"><g filter="url(#s1-far)">{VARGA.draw("s1-v-", wing_cls="s1-wing mv")}</g></g>')
    # 逃げるかもめ
    o.append('<g class="s1-gull mv">' + "".join(
        f'<g transform="translate({x} {y}) scale({s})"><path d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" fill="none" stroke="#3d3a5a" stroke-width="2.6" stroke-linecap="round"/></g>'
        for x, y, s in ((900, 330, 1.0), (960, 300, .8), (1010, 350, .9))) + "</g>")
    # 手前：神殿の大屋根の端と、昼のまま灯っていない提灯
    o.append(Q.roof_corner("s1-", "#7a4e2c", "#3e2a18", "#c4945c"))
    for x in (110, 300, 480):
        o.append(f'<path d="M{x},100 L{x},136" stroke="#3e2a18" stroke-width="3"/>'
                 f'<ellipse cx="{x}" cy="170" rx="24" ry="32" fill="#f3e6c8" stroke="#3e2a18" stroke-width="3"/>'
                 f'<path d="M{x - 14},146 L{x + 14},146 M{x - 14},194 L{x + 14},194" stroke="#3e2a18" stroke-width="5"/>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面2：見下ろす三つの頭（大屋根の上に）
# ---------------------------------------------------------------------------
S2_CSS = """
.is-active .s2-wing{animation:s2-wing .9s ease-in-out infinite alternate}
.s2-wing{transform-box:view-box}
.is-active .s2-hover{animation:s2-hover 1.4s ease-in-out infinite alternate}
.is-active .s2-head{animation:s2-head 1.1s ease-in-out infinite alternate}
.s2-fire{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s2-fire{animation:s2-fire 2.8s ease-in both,s2-flick .18s 1s ease-in-out infinite alternate}
.is-active .s2-glow{animation:s2-glow 2.8s ease-in both}
.s2-glow{opacity:0}
.s2-ember{opacity:0}
.is-active .s2-ember{animation:s2-ember 3s ease-out infinite}
.is-active .s2-cl{animation:s2-cl 2.8s linear both}
@keyframes s2-wing{from{transform:scaleY(1)}to{transform:scaleY(.82)}}
@keyframes s2-hover{from{transform:translateY(-8px)}to{transform:translateY(8px)}}
@keyframes s2-head{from{transform:translateY(-6px)}to{transform:translateY(8px)}}
@keyframes s2-fire{from{transform:scale(.3)}to{transform:scale(1.25)}}
@keyframes s2-flick{from{opacity:.75}to{opacity:1}}
@keyframes s2-glow{to{opacity:1}}
@keyframes s2-ember{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s2-cl{from{transform:translateX(40px)}to{transform:translateX(-40px)}}
"""
S2_AT, S2_SCALE = (800, 600), 1.12
S2_ROOF = 1.25


def scene2():
    R = random.Random(1202)
    o = [HEAD.format(label="暗い空の下、再建した神殿の大屋根の上に翼を広げた三つ首の竜。三つの頭が大屋根を見下ろし、口に火をためる")]
    o.append(f"<style>{S2_CSS}</style>")
    o.append('<defs><linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#120c1c"/><stop offset=".6" stop-color="#3a1f2e"/><stop offset="1" stop-color="#6a2e2a"/></linearGradient>'
             '<radialGradient id="s2-fireg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb24a" stop-opacity=".55"/>'
             '<stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient>'
             + VARGA.defs("s2-v-", open_mouth=True) + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append(f'<g class="s2-cl mv" opacity=".85">{storm(R, "", -160, 1760, 60, 420, 14, "#24182c", "#3a2840")}</g>')
    ax, ay = S2_AT
    o.append(f'<ellipse class="s2-glow" cx="{ax}" cy="{ay - 400}" rx="520" ry="260" fill="url(#s2-fireg)"/>')
    o.append(f'<g class="s2-hover mv"><g transform="translate({ax} {ay}) scale({S2_SCALE})">'
             f'{VARGA.draw("s2-v-", open_mouth=True, fire_cls="s2-fire", wing_cls="s2-wing mv", head_cls="s2-head mv")}</g></g>')
    # 手前：再建した神殿の大屋根（竜の火の色を受ける）。棟が画面の下の中ほどに来るように置く
    k = S2_ROOF
    o.append(f'<g transform="translate({n(800 - 800 * k)} {n(660 - T.RIDGE_Y * k)}) scale({k})">{T.temple_rebuilt("s2-t-", R, T.REBUILT_DAY)}</g>')
    o.append('<rect x="0" y="600" width="1600" height="300" fill="#3a1418" opacity=".45"/>')
    o.append(f'<g class="s2-emberset mv">{embers(R, "s2-ember mv", 30, 300, 1300, 500, 880)}</g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：名乗り（タイトルに名前）
# ---------------------------------------------------------------------------
S3_CSS = """
.is-active .s3-push{animation:s3-push 3s ease-out both}
.is-active .s3-head{animation:s3-head 1.3s ease-in-out infinite alternate}
.s3-ember{opacity:0}
.is-active .s3-ember{animation:s3-ember 3s ease-out infinite}
.is-active .s3-glow{animation:s3-glow 1.6s ease-in-out infinite alternate}
@keyframes s3-push{from{transform:translateY(60px)}to{transform:translateY(0)}}
@keyframes s3-head{from{transform:translateY(-5px)}to{transform:translateY(6px)}}
@keyframes s3-ember{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s3-glow{from{opacity:.5}to{opacity:.9}}
"""
S3_AT, S3_SCALE = (800, 1420), 2.05


def scene3():
    R = random.Random(1203)
    o = [HEAD.format(label="暗い空を背に、三つ首の竜の三つの頭が迫る。名前の表示「三頭魔竜　ヴァルガ」")]
    o.append(f"<style>{S3_CSS}</style>")
    o.append('<defs><radialGradient id="s3-sky" cx=".5" cy=".75" r=".9"><stop offset="0" stop-color="#5a2228"/>'
             '<stop offset=".55" stop-color="#2a1420"/><stop offset="1" stop-color="#0c0810"/></radialGradient>'
             '<radialGradient id="s3-fireg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a4a" stop-opacity=".45"/>'
             '<stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>'
             + VARGA.defs("s3-v-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append('<ellipse class="s3-glow" cx="800" cy="820" rx="900" ry="420" fill="url(#s3-fireg)"/>')
    o.append(f'<g class="s3-emberset mv">{embers(R, "s3-ember mv", 40, 0, 1600, 500, 900)}</g>')
    ax, ay = S3_AT
    o.append(f'<g class="s3-push mv"><g transform="translate({ax} {ay}) scale({S3_SCALE})">'
             f'{VARGA.draw("s3-v-", head_cls="s3-head mv", spread=1.15)}</g></g>')
    o.append('<rect width="1600" height="900" fill="#000" opacity=".12"/>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3]
