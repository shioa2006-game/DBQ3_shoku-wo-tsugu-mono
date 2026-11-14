"""最終決戦の決着「灯は消えず」の3場面のSVG。

  1. 最後の頭    夜明け前。大型対空ボウガンで地上へ落とされたヴァルガ。左右の二つの頭はすでに倒れ、三つ目の頭が最後の
                 言葉を残して手前へ倒れる。巨体は黒い霧へ崩れていく（第5章のグロムと同じ崩れ方。爪痕の印の黒鱗は残さない）。
  2. 消えない灯  再建した本堂の中（M11の第1場面と同じ祭壇と選択の柱）。煙が晴れると、屋根の穴とすすけた壁の奥で、
                 祭壇の灯がともり続けている。屋根の穴から朝の光が差し、選択の柱の四つの印を照らす。
  3. 朝の光      朝の神殿の前。屋根と壁に戦いの傷が残る神殿、左に大型対空ボウガンの射台。ベルク・ピノ・ガンゾウ・アサギ・
                 シオン・ミナ・ゴンタ・ワタリ・スズハが集まる。タイトル「灯は消えず」。

ヴァルガは ../parts/varga.json（Studioの作画コードの頭・胴。../../shared/varga.mjs が書き出す）を、M12の props12.Varga で読み、
props13.fallen_varga で地上へ落ちた姿に組み立てる。祭壇・炎・選択の柱はM11の props11、再建した神殿は共通部品
（../../shared/temple.py）。戦いの傷は直さずに残す（修理はゲームで行う）。戦後の修復と、スズハ・アサギへの継承は描かない。
座標は viewBox="0 0 1600 900"。位置が動くアニメーションには .mv を付け、モーション軽減時に止める。
現れ方・消え方（不透明度）は .mv の付かない組に分けて、止めても絵の変化が残るようにする。
"""
import math
import os
import random

from helpers import n, cloud
from figures import Cast, place
import scenes as M4        # 第3章の結末の空・海の部品（../../ch3-departure/src/scenes.py）
import temple as T         # 再建した神殿（../../shared/temple.py）
import props11 as Q11      # 祭壇・炎・共同台所（../../ch6-roof-light/src/props11.py）
import props12 as Q12      # ヴァルガ（../../ch7-three-heads/src/props12.py）
import props13 as Q

HEAD = M4.HEAD
_PARTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "parts")
VARGA = Q12.Varga(os.path.join(_PARTS, "varga.json"))
CAST = Cast(os.path.join(_PARTS, "cast.json"))


def figure(cid, direction, arms, at, scale, prefix, tone=None, rims=()):
    f = CAST.figure(cid, direction, f"{prefix}{cid}-{direction}-", arms=arms, tone=tone, rims=rims, arms_over=True)
    return f.defs, place(f.rim, at, scale, f.foot) + place(f.body, at, scale, f.foot)


def sparks(R, cls, count, x0, x1, y0, y1, color="#ffb24a", rise=(-200, -90), dur=3.0):
    return "".join(f'<circle class="{cls}" cx="{n(R.uniform(x0, x1))}" cy="{n(R.uniform(y0, y1))}" r="{n(R.uniform(1.4, 3.2))}" fill="{color}" '
                   f'style="--dx:{n(R.uniform(-40, 40))}px;--dy:{n(R.uniform(*rise))}px;animation-delay:-{n(R.uniform(0, dur))}s"/>'
                   for _ in range(count))


# ---------------------------------------------------------------------------
# 場面1：最後の頭（三つ目の頭が倒れ、巨体が黒い霧へ崩れる）
# ---------------------------------------------------------------------------
S1_CSS = """
.is-active .s1-chead{animation:s1-chead 5s both}
.is-active .s1-cneck{animation:s1-cneck 5s both}
.is-active .s1-varga{animation:s1-gone 5s linear both}
.s1-mist{opacity:0}
.is-active .s1-mist{animation:s1-mist 2.2s ease-out both}
.is-active .s1-rise{animation:s1-rise 2s 3.1s ease-out both}
.s1-wisp{opacity:0;transform-box:fill-box;transform-origin:50% 100%}
.is-active .s1-wisp{animation:s1-wisp 2.6s ease-out infinite}
.s1-dust{opacity:0;transform-box:fill-box;transform-origin:50% 50%}
.is-active .s1-dust{animation:s1-dust 1.3s 3.15s ease-out both}
.is-active .s1-glow{animation:s1-glow 5s linear both}
.s1-dawn{opacity:.25}
.is-active .s1-dawn{animation:s1-dawn 5s ease-in both}
.s1-fire{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s1-fire{animation:s1-fire .4s ease-in-out infinite alternate}
.s1-ember{opacity:0}
.is-active .s1-ember{animation:s1-ember 3s ease-out infinite}
.is-active .s1-smoke{animation:s1-smoke 5s linear both}
@keyframes s1-chead{0%{transform:translate(0,0) rotate(0)}18%{transform:translate(0,-8px) rotate(3deg)}36%{transform:translate(0,4px) rotate(-3deg)}
  52%{transform:translate(0,-12px) rotate(4deg);animation-timing-function:cubic-bezier(.55,0,1,.6)}
  64%{transform:translate(0,290px) rotate(-16deg) scale(1.12)}68%{transform:translate(0,276px) rotate(-14deg) scale(1.12)}
  73%,100%{transform:translate(0,290px) rotate(-16deg) scale(1.12)}}
@keyframes s1-cneck{0%,52%{transform:scaleY(1);animation-timing-function:cubic-bezier(.55,0,1,.6)}64%{transform:scaleY(-.3)}
  68%{transform:scaleY(-.24)}73%,100%{transform:scaleY(-.3)}}
@keyframes s1-gone{0%,66%{opacity:1}94%,100%{opacity:0}}
@keyframes s1-mist{0%{opacity:0}35%{opacity:.94}100%{opacity:0}}
@keyframes s1-rise{from{transform:translateY(0)}to{transform:translateY(-110px)}}
@keyframes s1-wisp{0%{opacity:0;transform:translateY(0) scale(.6)}30%{opacity:.7}100%{opacity:0;transform:translateY(-70px) scale(1.4)}}
@keyframes s1-dust{0%{opacity:0;transform:scale(.3)}20%{opacity:.55}100%{opacity:0;transform:scale(1.6)}}
@keyframes s1-glow{0%,60%{opacity:1}100%{opacity:.3}}
@keyframes s1-dawn{from{opacity:.25}to{opacity:.85}}
@keyframes s1-fire{from{transform:scale(1,1)}to{transform:scale(.88,1.12)}}
@keyframes s1-ember{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s1-smoke{from{transform:translateX(30px)}to{transform:translateX(-30px)}}
"""
S1_AT, S1_SCALE = (800, 700), 1.3
S1_HORIZON = 512
S1_PLAZA = 590
S1_SKY_DARK = "#1c1220"     # 翼の穴から見える地面の色


def scene1():
    R = random.Random(1301)
    o = [HEAD.format(label="夜明け前の神殿の前。地上へ落ちた三つ首の竜。二つの頭はすでに倒れ、三つ目の頭が最後の言葉を残して倒れる。"
                           "巨体は黒い霧へ崩れていく")]
    o.append(f"<style>{S1_CSS}</style>")
    o.append('<defs><linearGradient id="s1-sky" x1="0" y1="0" x2="0" y2="600" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#0c0a18"/><stop offset=".65" stop-color="#2a1a2c"/><stop offset="1" stop-color="#4a2a30"/></linearGradient>'
             '<linearGradient id="s1-dawng" x1="0" y1="430" x2="0" y2="520" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#8a6a8a" stop-opacity="0"/><stop offset="1" stop-color="#d8a88a"/></linearGradient>'
             f'<linearGradient id="s1-ground" x1="0" y1="{S1_PLAZA}" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#2e2228"/><stop offset="1" stop-color="#4a3432"/></linearGradient>'
             '<radialGradient id="s1-fireg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a4a" stop-opacity=".5"/>'
             '<stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>'
             '<filter id="s1-v-dead"><feColorMatrix type="matrix" values=".3 .2 .08 0 0  .15 .18 .08 0 0  .14 .13 .12 0 0  0 0 0 1 0"/></filter>'
             + VARGA.defs("s1-v-") + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    # 水平線に夜明けの兆し、暗い海
    o.append(f'<rect class="s1-dawn" x="0" y="430" width="1600" height="{S1_HORIZON - 430}" fill="url(#s1-dawng)"/>')
    o.append(f'<rect x="0" y="{S1_HORIZON}" width="1600" height="{S1_PLAZA - S1_HORIZON}" fill="#1e1828"/>'
             f'<path d="M0,{S1_HORIZON} L1600,{S1_HORIZON}" stroke="#c89a8a" stroke-width="2" opacity=".5"/>')
    # 立ちのぼる煙
    o.append(f'<g class="s1-smoke mv" opacity=".75">{M4_clouds(R, ((180, 300, 380, 120), (330, 200, 300, 100), (1300, 280, 420, 130), (1420, 170, 320, 100), (760, 120, 520, 110)))}</g>')
    # 広場（神殿の前の石畳）と、戦いの火
    o.append(f'<path d="M0,{S1_PLAZA} L1600,{S1_PLAZA} L1600,900 L0,900Z" fill="url(#s1-ground)"/>'
             f'<path d="M0,{S1_PLAZA} L1600,{S1_PLAZA}" stroke="#6a4a44" stroke-width="3"/>'
             + "".join(f'<path d="M{x},{S1_PLAZA} L{n(800 + (x - 800) * 2.2)},900" stroke="#1e1418" stroke-width="2" opacity=".6"/>' for x in range(-400, 2000, 130))
             + "".join(f'<path d="M0,{y} L1600,{y}" stroke="#1e1418" stroke-width="2" opacity=".55"/>' for y in (620, 664, 728, 812)))
    ax, ay = S1_AT
    o.append(f'<ellipse class="s1-glow" cx="{ax}" cy="{ay - 160}" rx="760" ry="380" fill="url(#s1-fireg)"/>')
    for x, y, k in ((150, 700, .55), (1460, 690, .5), (1270, 640, .32), (330, 630, .3)):
        o.append(f'<ellipse cx="{x}" cy="{y}" rx="{n(90 * k)}" ry="{n(18 * k)}" fill="#ff8a4a" opacity=".35"/>'
                 f'<g class="s1-fire mv">{Q11.flame("", "", x, y, k)}</g>')
    o.append(f'<g class="s1-emberset mv">{sparks(R, "s1-ember mv", 34, 60, 1540, 560, 860)}</g>')
    # ヴァルガ（黒い霧へ崩れる）
    v = Q.fallen_varga(VARGA, "s1-v-", S1_SKY_DARK, center_cls="s1-chead mv", neck_cls="s1-cneck mv")
    o.append(f'<g class="s1-varga"><g transform="translate({ax} {ay}) scale({S1_SCALE})">'
             f'<ellipse cx="0" cy="4" rx="420" ry="26" fill="#000" opacity=".4"/>{v}</g></g>')
    # 倒れた左右の頭から立ちのぼる黒い霧の筋と、三つ目の頭が倒れたときの土ぼこり
    wisps = "".join(f'<path class="s1-wisp" d="{cloud(x - 22, y, 44, 26, 3, R)}" fill="#140c18" style="animation-delay:-{n(R.uniform(0, 2.6))}s"/>'
                    for hx, hy, _ in Q.SIDE_HEADS for x, y in ((hx + R.uniform(-40, 40), hy - R.uniform(10, 40)) for _ in range(3)))
    cx, cy = Q.CENTER_FALLEN
    o.append(f'<g transform="translate({ax} {ay}) scale({S1_SCALE})"><g class="s1-wispset mv">{wisps}</g>'
             f'<ellipse class="s1-dust" cx="{cx}" cy="{cy + 34}" rx="150" ry="34" fill="#5a4646"/>'
             f'<ellipse class="s1-dust" cx="{cx - 60}" cy="{cy + 22}" rx="70" ry="30" fill="#66524e"/>'
             f'<ellipse class="s1-dust" cx="{cx + 70}" cy="{cy + 24}" rx="80" ry="28" fill="#66524e"/></g>')
    # 黒い霧（巨体を覆って立ちのぼり、消える）
    blobs = [(-320, -60, 260, 110, 0), (320, -70, 260, 110, .1), (-420, -20, 180, 80, .2), (420, -20, 180, 80, .25),
             (-170, -150, 220, 110, .15), (170, -150, 220, 110, .05), (0, -90, 260, 140, 0), (0, -30, 300, 110, .1),
             (-300, -10, 200, 80, .3), (300, -10, 200, 80, .3), (250, 0, 220, 70, .35), (0, -200, 160, 100, .2)]
    o.append(f'<g transform="translate({ax} {ay}) scale({S1_SCALE})"><g class="s1-rise mv">'
             + Q.mist(R, "s1-mist", [(x, y, w, h, 3.1 + dl) for x, y, w, h, dl in blobs]) + "</g></g>")
    # 手前：神殿の基壇のいちばん上の段
    o.append('<path d="M-20,858 L1620,858 L1620,920 L-20,920Z" fill="#2a2024" stroke="#120c10" stroke-width="3"/>'
             '<path d="M-20,862 L1620,862" stroke="#5a4646" stroke-width="3"/>')
    o.append("</svg>")
    return "".join(o)


def M4_clouds(R, items, color="#3a2e38", edge="#4c3e48"):
    return "".join(f'<path d="{cloud(x - w / 2, y + h / 2, w, h, R.randrange(4, 7), R)}" fill="{color}" stroke="{edge}" stroke-width="3"/>'
                   for x, y, w, h in items)


# ---------------------------------------------------------------------------
# 場面2：消えない灯（本堂の中。煙が晴れ、朝の光が差す）
# ---------------------------------------------------------------------------
S2_CSS = """
.s2-smoke{opacity:1}
.is-active .s2-smoke{animation:s2-smoke 2.6s .2s ease-in both}
.is-active .s2-drift{animation:s2-drift 5s linear both}
.s2-fl{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s2-fl{animation:s2-fl .45s ease-in-out infinite alternate}
.is-active .s2-halo{animation:s2-halo 1.6s ease-in-out infinite alternate}
.s2-morning,.s2-shaft,.s2-sunlit{opacity:0}
.is-active .s2-morning{animation:s2-in 1.6s 2.5s ease-out both}
.is-active .s2-shaft{animation:s2-shaft 1.8s 2.7s ease-out both}
.is-active .s2-sunlit{animation:s2-sunlit 1.8s 2.9s ease-out both}
.s2-mark{opacity:.1}
.is-active .s2-mark{animation:s2-mark 1.2s 3.2s ease-out both}
.s2-mote{opacity:0}
.is-active .s2-mote{animation:s2-mote 3.4s 2.8s ease-out infinite}
@keyframes s2-smoke{from{opacity:1}to{opacity:0}}
@keyframes s2-drift{from{transform:translate(0,0)}to{transform:translate(-140px,-70px)}}
@keyframes s2-fl{from{transform:scale(1,1)}to{transform:scale(.9,1.1)}}
@keyframes s2-halo{from{opacity:.7}to{opacity:1}}
@keyframes s2-in{to{opacity:1}}
@keyframes s2-shaft{to{opacity:.42}}
@keyframes s2-sunlit{to{opacity:.12}}
@keyframes s2-mark{from{opacity:.1}to{opacity:.5}}
@keyframes s2-mote{0%{transform:translate(0,0);opacity:0}25%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
"""
S2_FLOOR = 716      # M11の第1場面と同じ床の高さ
S2_PILLAR = 1250
S2_HOLE = "M1036,-10 L1430,-10 L1440,40 L1398,96 L1352,70 L1306,128 L1246,98 L1188,142 L1126,98 L1080,112 L1050,62Z"


def scene2():
    R = random.Random(1302)
    o = [HEAD.format(label="再建した本堂の中。煙が晴れると、屋根の穴とすすけた壁の奥で、要石の祭壇の灯がともり続けている。"
                           "屋根の穴から朝の光が差し、選択の柱の四つの印を照らす")]
    o.append(f"<style>{S2_CSS}</style>")
    o.append('<defs><radialGradient id="s2-wall" cx=".44" cy=".7" r=".8"><stop offset="0" stop-color="#5e4a3c"/>'
             '<stop offset=".6" stop-color="#342824"/><stop offset="1" stop-color="#1a1412"/></radialGradient>'
             '<radialGradient id="s2-halog" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd88a" stop-opacity=".7"/>'
             '<stop offset=".45" stop-color="#ffb24a" stop-opacity=".22"/><stop offset="1" stop-color="#ffb24a" stop-opacity="0"/></radialGradient>'
             '<radialGradient id="s2-soot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0c0806" stop-opacity=".75"/>'
             '<stop offset="1" stop-color="#0c0806" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s2-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141c38"/><stop offset="1" stop-color="#3a3a5a"/></linearGradient>'
             '<linearGradient id="s2-morn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e8"/><stop offset="1" stop-color="#ffe0a0"/></linearGradient>'
             f'<linearGradient id="s2-shaftg" x1="0" y1="80" x2="0" y2="{S2_FLOOR}" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#fff0c8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe0a0" stop-opacity=".25"/></linearGradient></defs>')
    o.append('<rect width="1600" height="900" fill="url(#s2-wall)"/>')
    # 奥の石の壁（M11と同じ段積み）
    rows = []
    for k, y in enumerate(range(60, 880, 46)):
        rows.append(f'<path d="M0,{y} L1600,{y}" stroke="#1c1512" stroke-width="2.4" opacity=".55"/>')
        x = 40 if k % 2 else 100
        while x < 1600:
            rows.append(f'<path d="M{x},{y - 46} L{x},{y}" stroke="#1c1512" stroke-width="2" opacity=".45"/>')
            x += 120
    o.append("".join(rows))
    # すすとひび
    for x, y, rx, ry in ((1230, 170, 420, 260), (180, 320, 260, 220), (520, 120, 240, 140), (1500, 520, 200, 260)):
        o.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#s2-soot)"/>')
    for pts in (((420, 150), (408, 200), (430, 236), (414, 290), (428, 340)), ((1520, 260), (1534, 320), (1514, 360), (1530, 420), (1516, 470)),
                ((80, 420), (98, 470), (84, 510), (100, 560))):
        o.append('<path d="M' + " L".join(f"{x},{y}" for x, y in pts) + '" fill="none" stroke="#0c0806" stroke-width="3" opacity=".7"/>')
    # 屋根の穴（夜明け前の空 → 朝の空）
    o.append(f'<path d="{S2_HOLE}" fill="url(#s2-dawn)"/><path class="s2-morning" d="{S2_HOLE}" fill="url(#s2-morn)"/>'
             f'<path d="{S2_HOLE}" fill="none" stroke="#120d0a" stroke-width="6" stroke-linejoin="round"/>')
    o.append("".join(f'<path d="M{x},{y} L{x + dx},{y + dy}" stroke="#3a271b" stroke-width="7" stroke-linecap="round"/>'
                     for x, y, dx, dy in ((1352, 70, 6, 30), (1188, 142, -10, 26), (1080, 112, 14, 22), (1306, 128, -6, 20))))
    # 上の木の梁（穴のところで折れて垂れる）
    o.append('<path d="M0,40 L1030,40 L1046,58 L1026,74 L1040,92 L0,92Z" fill="#3a271b" stroke="#120d0a" stroke-width="3"/>'
             '<path d="M0,46 L1030,46" stroke="#6c4a2e" stroke-width="3"/>'
             '<path d="M1430,40 L1600,40 L1600,92 L1430,92 L1418,74 L1436,60Z" fill="#3a271b" stroke="#120d0a" stroke-width="3"/>'
             '<path d="M1028,58 L1094,74 L1150,208 L1120,216 L1066,92Z" fill="#2c1e15" stroke="#120d0a" stroke-width="3" stroke-linejoin="round"/>'
             + "".join(f'<path d="M{x},92 L{x},150 L{x + 34},150 L{x + 34},92Z" fill="#3a271b" stroke="#120d0a" stroke-width="2.4"/>' for x in (80, 320, 560, 800, 1520)))
    # 祭壇の灯の光と、選択の柱（四つの枠すべてに印）・床・祭壇
    altar_markup, (fx, fy) = Q11.altar(700, S2_FLOOR, glow_cls="s2-halo")
    o.append(f'<ellipse class="s2-halo" cx="{fx}" cy="{fy - 60}" rx="720" ry="500" fill="url(#s2-halog)"/>')
    o.append(Q.selection_pillar_done(S2_PILLAR, S2_FLOOR, 130, 128, mark_cls="s2-mark"))
    o.append(f'<path d="M0,{S2_FLOOR} L1600,{S2_FLOOR} L1600,900 L0,900Z" fill="#262019"/><path d="M0,{S2_FLOOR} L1600,{S2_FLOOR}" stroke="#5a4636" stroke-width="3"/>'
             + "".join(f'<path d="M{x},{S2_FLOOR} L{n(800 + (x - 800) * 1.8)},900" stroke="#362a22" stroke-width="2.4"/>' for x in range(-200, 1800, 160))
             + "".join(f'<path d="M0,{y} L1600,{y}" stroke="#362a22" stroke-width="2"/>' for y in (S2_FLOOR + 40, S2_FLOOR + 100, S2_FLOOR + 180)))
    o.append(altar_markup)
    o.append(f'<g>{Q11.flame("s2-fl", "s2-fl", fx, fy, 1.3)}</g>')
    # 床に落ちた板と石
    for x, y, w, rot in ((240, 742, 150, -8), (1020, 736, 120, 14), (1460, 760, 130, -16), (300, 790, 90, 22)):
        o.append(f'<rect x="{n(x - w / 2)}" y="{n(y - 9)}" width="{w}" height="18" fill="#3a271b" stroke="#120d0a" stroke-width="2.6" transform="rotate({rot} {x} {y})"/>')
    for x, y, rr in ((150, 724, 22), (1090, 718, 16), (1400, 730, 20), (960, 760, 14)):
        o.append(f'<path d="M{x - rr},{y + 8} L{x - rr * .7},{y - rr * .6} L{x + rr * .4},{y - rr} L{x + rr},{y - rr * .2} L{x + rr * .8},{y + 8}Z" '
                 f'fill="#6a6052" stroke="#120d0a" stroke-width="2.4"/>')
    # 朝の光（屋根の穴から選択の柱へ差す）と、光の中のほこり
    o.append(f'<path class="s2-shaft" d="M1070,90 L1420,40 L1520,{S2_FLOOR} L1130,{S2_FLOOR}Z" fill="url(#s2-shaftg)"/>')
    o.append(f'<rect class="s2-sunlit" x="{S2_PILLAR - 80}" y="100" width="160" height="{S2_FLOOR - 100}" fill="#ffe8b0"/>')
    o.append(f'<g class="s2-moteset mv">' + "".join(
        f'<circle class="s2-mote mv" cx="{n(R.uniform(1140, 1460))}" cy="{n(R.uniform(200, 680))}" r="{n(R.uniform(1.4, 3))}" fill="#fff4d0" '
        f'style="--dx:{n(R.uniform(-30, 30))}px;--dy:{n(R.uniform(60, 140))}px;animation-delay:-{n(R.uniform(0, 3.4))}s"/>' for _ in range(26)) + "</g>")
    # 晴れていく煙
    smoke = "".join(f'<path d="{cloud(x - w / 2, y + h / 2, w, h, R.randrange(4, 7), R)}" fill="{col}"/>'
                    for x, y, w, h, col in ((300, 300, 900, 360, "#4a4246"), (1200, 260, 900, 380, "#524a4e"), (700, 640, 1100, 360, "#463e42"),
                                            (200, 700, 700, 300, "#4e464a"), (1350, 700, 700, 320, "#4a4246"), (800, 160, 900, 300, "#3e383c")))
    o.append(f'<g class="s2-smoke"><g class="s2-drift mv" opacity=".96">{smoke}</g></g>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# 場面3：朝の光（射台と傷の残る神殿、集まる仲間と住民。タイトル）
# ---------------------------------------------------------------------------
S3_CSS = """
.is-active .s3-from-right{animation:s3-right 3.4s ease-out both}
.s3-wave{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s3-wave{animation:s3-wave 1s ease-in-out infinite alternate}
.s3-smoke{opacity:0;transform-box:fill-box;transform-origin:50% 100%}
.is-active .s3-smoke{animation:s3-smoke 3.3s ease-out infinite}
.is-active .s3-glow{animation:s3-glow 1.6s ease-in-out infinite alternate}
.is-active .s3-rays{animation:s3-rays 6.4s ease-in-out both}
.is-active .s3-gull{animation:s3-gull 6.4s linear both}
@keyframes s3-right{from{transform:translateX(320px)}to{transform:translateX(0)}}
@keyframes s3-wave{from{transform:rotate(-12deg)}to{transform:rotate(9deg)}}
@keyframes s3-smoke{0%{opacity:0;transform:translateY(0) scale(.6)}25%{opacity:.6}100%{opacity:0;transform:translateY(-60px) scale(1.5)}}
@keyframes s3-glow{from{opacity:.5}to{opacity:.95}}
@keyframes s3-rays{from{opacity:.4}to{opacity:.9}}
@keyframes s3-gull{from{transform:translate(0,0)}to{transform:translate(-260px,-40px)}}
"""
S3_TEMPLE_AT, S3_TEMPLE_SCALE = (880, 640), .64
S3_TOWER_AT, S3_TOWER_SCALE = (246, 690), 1.08
S3_FEET, S3_SCALE = 872, 1.42
# 集まる九人（左から）。1 は右から歩いてくる。ベルクとピノは射台のそばに立つ
S3_PEOPLE = (("belk", ("hip", "down"), 190, 0), ("pino", ("down", "wave"), 330, 0),
             ("ganzou", ("down", "down"), 500, 0), ("asagi", ("hip", "high"), 640, 0),
             ("hero2", ("down", "down"), 800, 0),
             ("mina", ("front", "front"), 960, 1), ("gonta", ("high", "hip"), 1100, 1),
             ("watari", ("hip", "down"), 1240, 1), ("suzuha", ("front", "front"), 1390, 1))


def scene3():
    R = random.Random(1303)
    o = [HEAD.format(label="朝の光の中の神殿。屋根と壁に戦いの傷が残る。左に大型対空ボウガンの射台。"
                           "ベルク・ピノ・ガンゾウ・アサギ・シオン・ミナ・ゴンタ・ワタリ・スズハが神殿の前に集まる")]
    o.append(f"<style>{S3_CSS}</style>")
    defs, groups = [], {0: [], 1: []}
    rim = (("#ffe6b0", 1.0, -.6, .7),)
    for cid, arms, x, side in S3_PEOPLE:
        d, m = figure(cid, "front", arms, (x, S3_FEET), S3_SCALE, "s3-", rims=rim)
        defs.append(d)
        groups[side].append(m.replace('class="wave"', 'class="s3-wave mv"'))
    o.append('<defs><linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="640" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#86b2dc"/><stop offset=".62" stop-color="#cfdcd8"/><stop offset="1" stop-color="#f6d38a"/></linearGradient>'
             '<radialGradient id="s3-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/>'
             '<stop offset=".3" stop-color="#ffe2a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s3-ground" x1="0" y1="630" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
             '<stop offset="0" stop-color="#c8b796"/><stop offset="1" stop-color="#a8946e"/></linearGradient>'
             '<radialGradient id="s3-warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd77a" stop-opacity=".8"/>'
             '<stop offset="1" stop-color="#ffd77a" stop-opacity="0"/></radialGradient>'
             + "".join(defs) + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    # 朝日（右上）と光の筋
    o.append('<circle cx="1440" cy="250" r="300" fill="url(#s3-sun)"/><circle cx="1440" cy="250" r="54" fill="#fff8e4"/>')
    o.append('<g class="s3-rays" opacity=".6">' + "".join(
        f'<path d="M1440,250 L{n(1440 + 1700 * math.cos(a - .035))},{n(250 + 1700 * math.sin(a - .035))} '
        f'L{n(1440 + 1700 * math.cos(a + .035))},{n(250 + 1700 * math.sin(a + .035))}Z" fill="#fff4d0" opacity=".22"/>'
        for a in (2.5, 2.75, 3.0, 2.25, 1.95)) + "</g>")
    o.append(M4_clouds(R, ((300, 140, 300, 60), (620, 90, 240, 50), (1120, 120, 280, 56)), color="#fbf6ee", edge="#e2d6c4"))
    o.append('<g class="s3-gull mv">' + "".join(
        f'<g transform="translate({x} {y}) scale({s})"><path d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" fill="none" stroke="#5a6070" stroke-width="2.6" stroke-linecap="round"/></g>'
        for x, y, s in ((1200, 200, 1.0), (1260, 170, .8), (1300, 226, .9))) + "</g>")
    # 奥の山と、神殿の立つ広場
    o.append('<path d="M-20,540 C160,470 360,430 560,420 C760,410 980,370 1180,384 C1360,396 1500,440 1640,470 L1640,700 L-20,700Z" fill="#9cb0b2"/>'
             '<path d="M-20,600 C200,560 420,548 640,556 C900,566 1180,540 1400,560 C1500,570 1580,584 1640,590 L1640,700 L-20,700Z" fill="#87a088"/>')
    o.append('<path d="M-20,630 L1620,630 L1620,900 L-20,900Z" fill="url(#s3-ground)"/>'
             '<path d="M-20,630 L1620,630" stroke="#9a8664" stroke-width="3"/>'
             + "".join(f'<path d="M{x},630 L{n(800 + (x - 800) * 2.4)},900" stroke="#a8946e" stroke-width="2" opacity=".7"/>' for x in range(-400, 2000, 120))
             + "".join(f'<path d="M-20,{y} L1620,{y}" stroke="#a8946e" stroke-width="2" opacity=".7"/>' for y in (652, 688, 742, 818)))
    # 傷の残る神殿（祭壇の灯は入口の奥にともる）
    tmarkup = T.temple_rebuilt("s3-t-", R, T.REBUILT_DAY) + Q.temple_damage("s3-t-", R, T.REBUILT_DAY, smoke_cls="s3-smoke mv")
    o.append(T.place_remains(tmarkup, S3_TEMPLE_AT, S3_TEMPLE_SCALE))
    tx, ty = S3_TEMPLE_AT
    o.append(f'<circle class="s3-glow" cx="{tx}" cy="{n(ty + (474 - 592) * S3_TEMPLE_SCALE)}" r="34" fill="url(#s3-warm)"/>')
    # 共同台所（右手前）
    o.append(Q11.kitchen(1470, 668, .5))
    # 広場の焦げ跡と、使った矢
    for x, y, rx in ((560, 700, 120), (1180, 690, 100), (380, 760, 90)):
        o.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{n(rx * .22)}" fill="#3a2a20" opacity=".25"/>')
    o.append(Q.bolt(1150, 652, 1232, 666, 6) + Q.bolt(620, 664, 530, 654, 6) + Q.bolt(1336, 640, 1300, 676, 6, head=False))
    # 大型対空ボウガンの射台（左）
    o.append(f'<g transform="translate({S3_TOWER_AT[0]} {S3_TOWER_AT[1]}) scale({S3_TOWER_SCALE})">{Q.ballista_tower()}</g>')
    # 集まる九人
    o.append("".join(groups[0]))
    o.append(f'<g class="s3-from-right mv">{"".join(groups[1])}</g>')
    o.append("</svg>")
    return "".join(o)


SCENES = [scene1, scene2, scene3]
