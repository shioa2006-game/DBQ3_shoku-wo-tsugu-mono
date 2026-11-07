"""シーン3（ダーマ神殿の崩壊）・シーン4（シオンの脱出）・シーン5（ジパングへの漂着）のSVG。

命名規則は scenes_a.py と同じ。舞い散るページや火の粉などの粒子は、
変数 --p（0〜1）で「飛行途中の位置」を静止状態として持たせ、モーション軽減時にも空中に散って見えるようにしている。
シーン4・5のシオンは src/shion.py（正式デザインの頭・胴＋ムービー用の手足）で描く。
"""
import math
import random
from helpers import *
from scenes_a import HEAD, BAT
import shion

# 職の紋（オリジナル意匠：開いた書と導きの星）
EMBLEM_BOOK = "M-18,8 Q-9,1 0,5 Q9,1 18,8 L18,-4 Q9,-11 0,-7 Q-9,-11 -18,-4Z"


# ---------------------------------------------------------------------------
# シーン3：ダーマ神殿の崩壊（赤・橙・黒）
# ---------------------------------------------------------------------------
S3_CSS = """
.s3-fl{transform-box:fill-box;transform-origin:50% 100%}
.is-active .s3-fl{animation:s3-fl 1.2s ease-in-out infinite alternate}
.is-active .s3-heat{animation:s3-heat 1.9s ease-in-out infinite}
.is-active .s3-plume{animation:s3-plume 8s linear both}
.is-active .s3-page{animation:s3-page 4.6s linear infinite}
.is-active .s3-ember{animation:s3-ember 3.6s linear infinite}
.is-active .s3-bat{animation:s3-bat 6s ease-in-out both}
.is-active .s3-flap{animation:s3-flap .6s ease-in-out infinite alternate}
.s3-flap{transform-box:fill-box;transform-origin:50% 45%}
.s3-page{transform:translate(calc(var(--dx)*var(--p)),calc(var(--dy)*var(--p))) rotate(calc(400deg*var(--p)))}
.s3-ember{transform:translate(calc(var(--dx)*var(--p)),calc(var(--dy)*var(--p)));opacity:calc(1 - var(--p))}
@keyframes s3-fl{0%{transform:scale(1,1) skewX(0)}50%{transform:scale(.93,1.08) skewX(-3deg)}100%{transform:scale(1.05,.9) skewX(2.5deg)}}
@keyframes s3-heat{0%,100%{opacity:.75}40%{opacity:1}70%{opacity:.85}}
@keyframes s3-plume{to{transform:translate(-40px,-26px) scale(1.04)}}
@keyframes s3-page{0%{transform:translate(0,0) rotate(0) scale(.5,.5);opacity:0}8%{opacity:1}
 35%{transform:translate(calc(var(--dx)*.3),calc(var(--dy)*.22 - 40px)) rotate(140deg) scale(.95,.35)}
 65%{transform:translate(calc(var(--dx)*.62),calc(var(--dy)*.58)) rotate(290deg) scale(.85,.95)}
 88%{opacity:.9}100%{transform:translate(var(--dx),var(--dy)) rotate(430deg) scale(.7,.3);opacity:0}}
@keyframes s3-ember{0%{transform:translate(0,0);opacity:0}12%{opacity:1}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s3-bat{to{transform:translate(-60px,-24px)}}
@keyframes s3-flap{to{transform:scaleY(.68)}}
"""


def _flames(R, specs, cls="s3-fl mv"):
    """specs: (x, y, w, h, lean)。外炎・中炎・内炎を重ねる。"""
    out = []
    for x, y, w, h, lean in specs:
        dur = n(R.uniform(.9, 1.6))
        dl = n(R.uniform(0, 1.2))
        out.append(f'<g transform="translate({n(x)} {n(y)})"><g class="{cls}" style="animation-duration:{dur}s;animation-delay:-{dl}s">'
                   f'<path d="{flame(w, h, lean)}" fill="url(#s3-flo)"/>'
                   f'<path d="{flame(w * .66, h * .7, lean * 1.1)}" fill="#ff9d2e"/>'
                   f'<path d="{flame(w * .34, h * .42, lean * 1.2)}" fill="#ffe28a"/></g></g>')
    return "".join(out)


def _pillar(c, top=318, bottom=506, broken=None):
    o = []
    if broken:
        b = broken
        jag = [(c - 21, b + 16), (c - 14, b - 2), (c - 6, b + 10), (c + 3, b - 7), (c + 11, b + 8), (c + 21, b + 1)]
        shaft = [(c - 22, bottom)] + jag + [(c + 22, bottom)]
        o.append(f'<path d="{poly_d(shaft)}" fill="#170605" stroke="#070101" stroke-width="3" stroke-linejoin="round"/>')
        o.append(f'<path d="{poly_d(jag, close=False)}" fill="none" stroke="#ffb050" stroke-width="2.5" opacity=".9"/>')
        ty = b + 12
    else:
        shaft = [(c - 22, bottom), (c - 19, top), (c + 19, top), (c + 22, bottom)]
        o.append(f'<path d="{poly_d(shaft)}" fill="#170605" stroke="#070101" stroke-width="3" stroke-linejoin="round"/>')
        o.append(f'<path d="M{c - 30},{top} L{c + 30},{top} L{c + 24},{top - 12} L{c - 24},{top - 12}Z '
                 f'M{c - 34},{top - 12} L{c + 34},{top - 12} L{c + 34},{top - 20} L{c - 34},{top - 20}Z" '
                 'fill="#1d0807" stroke="#070101" stroke-width="2.5" stroke-linejoin="round"/>')
        ty = top
    o.append(f'<path d="M{c - 9},{ty + 4} L{c - 10},{bottom - 4} M{c},{ty + 4} L{c},{bottom - 4} M{c + 9},{ty + 4} L{c + 10},{bottom - 4}" '
             'stroke="#311009" stroke-width="2.2" fill="none"/>')
    o.append(f'<path d="M{c - 19.5},{ty + 6} L{c - 21.5},{bottom - 2} M{c + 19.5},{ty + 6} L{c + 21.5},{bottom - 2}" '
             'stroke="#ff8a3a" stroke-width="2.4" opacity=".78" fill="none"/>')
    o.append(f'<path d="M{c - 28},{bottom} L{c + 28},{bottom} L{c + 28},{bottom + 10} L{c - 28},{bottom + 10}Z" '
             'fill="#1d0807" stroke="#070101" stroke-width="2.5"/>')
    return "".join(o)


def scene3():
    R = random.Random(303)
    o = [HEAD.format(label="山上の巨大な石造りのダーマ神殿が炎に包まれ、柱と大屋根が崩れ、焼ける職業の書のページが風に舞っている")]
    o.append(f"<style>{S3_CSS}</style>")
    roof = ("M296,252 Q332,268 382,266 L1218,266 Q1268,268 1304,252 Q1252,250 1200,236 C1130,210 1080,172 1040,150 "
            "L560,150 C520,172 470,210 400,236 Q348,250 296,252Z")
    hole = [(926, 266), (940, 238), (920, 212), (946, 188), (938, 162), (968, 150), (996, 164), (1022, 148),
            (1050, 168), (1088, 186), (1110, 212), (1140, 234), (1152, 266)]
    o.append(f"""<defs>
<linearGradient id="s3-sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#080103"/><stop offset=".33" stop-color="#22050a"/><stop offset=".62" stop-color="#5c140c"/>
 <stop offset=".85" stop-color="#a8360e"/><stop offset="1" stop-color="#c9511a"/></linearGradient>
<radialGradient id="s3-glow" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#ffb35a" stop-opacity=".65"/><stop offset=".45" stop-color="#ff6a1f" stop-opacity=".25"/>
 <stop offset="1" stop-color="#ff4a10" stop-opacity="0"/></radialGradient>
<radialGradient id="s3-fire" cx=".5" cy=".95" r=".85">
 <stop offset="0" stop-color="#fff2b8"/><stop offset=".25" stop-color="#ffb84c"/><stop offset=".6" stop-color="#ff641c"/>
 <stop offset="1" stop-color="#9a200c"/></radialGradient>
<radialGradient id="s3-fire2" cx=".5" cy=".9" r=".8">
 <stop offset="0" stop-color="#fff4c0"/><stop offset=".4" stop-color="#ffa040"/><stop offset="1" stop-color="#d0400f"/></radialGradient>
<linearGradient id="s3-flo" x1="0" y1="1" x2="0" y2="0">
 <stop offset="0" stop-color="#ff7a1c"/><stop offset=".7" stop-color="#e0320f"/><stop offset="1" stop-color="#a81a0c"/></linearGradient>
<linearGradient id="s3-smoke" x1="0" y1="420" x2="0" y2="-60" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#9a3a16"/><stop offset=".3" stop-color="#4a160c"/><stop offset="1" stop-color="#1c0707"/></linearGradient>
<linearGradient id="s3-mtn" x1="0" y1="200" x2="0" y2="700" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#1a0507"/><stop offset="1" stop-color="#2e0b0b"/></linearGradient>
<linearGradient id="s3-stair" x1="0" y1="592" x2="0" y2="900" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#3a140c"/><stop offset="1" stop-color="#120504"/></linearGradient>
<linearGradient id="s3-page" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0" stop-color="#f8e6b8"/><stop offset=".55" stop-color="#f0c983"/><stop offset=".82" stop-color="#ff8f2a"/>
 <stop offset="1" stop-color="#4a1406"/></linearGradient>
<radialGradient id="s3-bookglow" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#ffc560" stop-opacity=".75"/><stop offset="1" stop-color="#ff6a1f" stop-opacity="0"/></radialGradient>
<radialGradient id="s3-stairglow" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#ff7a2a" stop-opacity=".32"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient>
<clipPath id="s3-roofclip"><path d="{roof}"/></clipPath>
<path id="s3-bat" d="{BAT}"/>
<path id="s3-pg" d="M-17,-12 Q0,-17 17,-10 L15,12 Q0,8 -17,13Z"/>
</defs>""")
    o.append('<rect width="1600" height="900" fill="url(#s3-sky)"/>')
    o.append('<ellipse class="s3-heat" cx="820" cy="380" rx="780" ry="430" fill="url(#s3-glow)"/>')
    # 山
    fd, fr = mountain([(-20, 470), (80, 420), (200, 440), (330, 392), (460, 430), (600, 404), (760, 432), (900, 408),
                       (1040, 424), (1180, 384), (1320, 418), (1450, 392), (1620, 432)], 720, R, rough=.14)
    o.append(f'<path d="{fd}" fill="#3e0f0e"/><path d="{fr}" fill="none" stroke="#ff7a3a" stroke-width="1.8" opacity=".35"/>')
    ld, lr = mountain([(-20, 250), (60, 214), (130, 258), (200, 186), (272, 248), (332, 300), (392, 364), (452, 430),
                       (520, 520), (560, 610)], 760, R, rough=.16)
    rd, rr = mountain([(1040, 610), (1100, 522), (1170, 432), (1232, 372), (1300, 302), (1370, 250), (1440, 282),
                       (1510, 206), (1570, 238), (1620, 214)], 760, R, rough=.16)
    o.append(f'<path d="{ld} {rd}" fill="url(#s3-mtn)" stroke="#080102" stroke-width="2.5" stroke-linejoin="round"/>'
             f'<path d="{lr} {rr}" fill="none" stroke="#ff6a2a" stroke-width="2" opacity=".45"/>')
    o.append('<path d="M-20,690 L1620,690 L1620,900 L-20,900Z" fill="#120404"/>')
    # 煙（神殿の背後から立ち上る）
    plumes = []
    for (p0, p1, p2, p3, r0, r1, cnt) in [((1040, 230), (1010, 40), (620, 10), (160, -70), 46, 150, 20),
                                         ((800, 80), (760, -10), (560, -40), (380, -110), 40, 110, 10),
                                         ((420, 330), (360, 240), (260, 170), (90, 110), 30, 90, 10)]:
        cs = []
        for k in range(cnt):
            t = k / (cnt - 1)
            x, y = bezier(p0, p1, p2, p3, t)
            r = r0 + (r1 - r0) * t
            cs.append((x + R.uniform(-r * .3, r * .3), y + R.uniform(-r * .3, r * .3), r * R.uniform(.85, 1.1)))
            if t > .25:
                cs.append((x + R.uniform(-r * .6, r * .6), y + R.uniform(-r * .5, r * .5), r * R.uniform(.55, .8)))
        plumes.append(lobes_union(cs, "#a3401a", 6, "url(#s3-smoke)"))
    curls = " ".join([spiral(900, 120, 44, start=1), spiral(640, 40, 60, cw=False, start=2), spiral(330, 10, 70, start=.5),
                      spiral(300, 190, 38, cw=False)])
    o.append(f'<g class="s3-plume mv">{"".join(plumes)}<path d="{curls}" fill="none" stroke="#5a1c10" stroke-width="3" '
             'stroke-linecap="round" opacity=".8"/></g>')
    # 空を舞う魔物の影
    bats = []
    for x, y, sc in [(420, 120, .42), (530, 170, .3), (650, 92, .36), (300, 210, .28), (1260, 130, .38), (1380, 190, .26)]:
        bats.append(f'<g transform="translate({x} {y}) scale({sc})"><g class="s3-bat mv"><use class="s3-flap mv" href="#s3-bat" '
                    f'fill="#0c0303" style="animation-delay:-{n(R.uniform(0, .6))}s"/></g></g>')
    o.append("".join(bats))
    # 中央の塔（屋根の奥、上部が崩れている）
    o.append('<path d="M735,172 L735,64 L752,50 L770,60 L784,32 L800,46 L812,26 L830,54 L846,42 L865,62 L865,172Z" '
             'fill="#1e0908" stroke="#070101" stroke-width="3" stroke-linejoin="round"/>'
             '<path d="M752,50 L770,60 L784,32 L800,46 L812,26 L830,54 L846,42" fill="none" stroke="#ffae50" stroke-width="2.4" opacity=".8"/>'
             '<path class="s3-heat" d="M766,128 L766,100 A12,12 0 0 1 790,100 L790,128Z M810,128 L810,100 A12,12 0 0 1 834,100 L834,128Z" '
             'fill="url(#s3-fire2)" stroke="#070101" stroke-width="2"/>')
    o.append(_flames(R, [(800, 52, 70, 120, -.1), (772, 62, 40, 70, -.2), (834, 58, 44, 84, .05)]))
    # 岩盤と大階段
    o.append('<path d="M180,900 L214,760 L236,690 L262,618 L270,592 L650,592 L500,900Z M950,592 L1330,592 L1342,624 '
             'L1374,700 L1396,780 L1420,900 L1100,900Z" fill="#170606" stroke="#070101" stroke-width="3" stroke-linejoin="round"/>'
             '<path d="M180,900 L214,760 L236,690 L262,618 L270,592 M1330,592 L1342,624 L1374,700 L1396,780 L1420,900" '
             'fill="none" stroke="#ff7a3a" stroke-width="2" opacity=".35"/>')
    o.append('<path d="M650,592 L950,592 L1100,900 L500,900Z" fill="url(#s3-stair)"/>')
    steps = []
    K = 17
    for k in range(1, K + 1):
        u = (k / K) ** 1.35
        y = 592 + 308 * u
        xl, xr = 650 - 150 * u, 950 + 150 * u
        steps.append(f"M{n(xl)},{n(y)} L{n(xr)},{n(y)}")
    o.append(f'<path d="{" ".join(steps)}" stroke="#0e0403" stroke-width="2.5" fill="none"/>'
             f'<path d="{" ".join(steps)}" stroke="#b4481c" stroke-width="1.4" fill="none" opacity=".45" transform="translate(0 -3)"/>')
    o.append('<path d="M650,592 L628,592 L470,900 L500,900Z M950,592 L972,592 L1130,900 L1100,900Z" fill="#240b08" '
             'stroke="#070101" stroke-width="2.5"/>')
    # 基壇
    o.append('<g stroke="#070101" stroke-width="2.5">'
             '<rect x="270" y="566" width="1060" height="26" fill="#250c09"/>'
             '<rect x="300" y="542" width="1000" height="24" fill="#2a0e0b"/>'
             '<rect x="330" y="516" width="940" height="26" fill="#2e100c"/></g>'
             '<path d="M272,567 L1328,567 M302,543 L1298,543 M332,517 L1268,517" stroke="#ff9a4a" stroke-width="2" opacity=".7"/>')
    # 神殿内部の炎
    o.append('<rect x="356" y="296" width="888" height="222" fill="url(#s3-fire)" class="s3-heat"/>')
    arches = "M356,330 L1244,330 L1244,518 L356,518Z " + " ".join(
        f"M{c + 22},518 L{c + 22},408 A30,30 0 0 1 {c + 82},408 L{c + 82},518Z" for c in [380 + 105 * i for i in range(8)])
    o.append(f'<path d="{arches}" fill="#6e1a0b" fill-rule="evenodd" opacity=".55"/>')
    inner = [(x, 518, R.uniform(46, 80), R.uniform(70, 170), R.uniform(-.15, .15)) for x in range(400, 1220, 46)]
    o.append(_flames(R, inner))
    # 柱
    pil = []
    for i in range(9):
        c = 380 + 105 * i
        if i == 2:
            pil.append(_pillar(c, broken=402))
        elif i == 6:
            pil.append(_pillar(c, broken=356))
        elif i == 7:
            pil.append(f'<g transform="rotate(6 {c} 516)">{_pillar(c, top=330)}</g>')
        else:
            pil.append(_pillar(c))
    o.append("".join(pil))
    # 梁（崩落部で途切れる）
    o.append('<path d="M344,266 L948,266 L960,280 L944,290 L956,298 L344,298Z M1140,266 L1256,266 L1256,298 L1132,298 '
             'L1144,286 L1130,276Z" fill="#2a0e0b" stroke="#070101" stroke-width="3" stroke-linejoin="round"/>')
    tri = " ".join(f"M{x},272 L{x},292 M{x + 8},272 L{x + 8},292" for x in range(360, 940, 36)) + " " + \
          " ".join(f"M{x},272 L{x},292 M{x + 8},272 L{x + 8},292" for x in range(1150, 1250, 36))
    o.append(f'<path d="{tri}" stroke="#120403" stroke-width="3"/><path d="M346,267 L946,267 M1142,267 L1254,267" '
             'stroke="#ff9a4a" stroke-width="1.6" opacity=".6"/>')
    # 大屋根
    tiles = " ".join(f"M{x},266 L{n(800 + (x - 800) * .62)},150" for x in range(318, 1290, 20))
    o.append(f'<path d="{roof}" fill="#2a0e0c" stroke="#070101" stroke-width="3.5" stroke-linejoin="round"/>'
             f'<g clip-path="url(#s3-roofclip)"><path d="{tiles}" stroke="#41160f" stroke-width="2.2"/>'
             '<path d="M300,252 Q352,250 404,236 C474,210 524,172 562,150 M1300,252 Q1250,250 1198,236 C1128,210 1078,172 1040,150" '
             'fill="none" stroke="#ff8a3a" stroke-width="3" opacity=".55"/></g>'
             '<path d="M548,140 L1052,140 L1052,152 L548,152Z" fill="#200a08" stroke="#070101" stroke-width="2.5"/>'
             '<path d="M548,146 C532,140 526,126 538,114 C540,126 548,132 560,136Z M1052,146 C1068,140 1074,126 1062,114 '
             'C1060,126 1052,132 1040,136Z" fill="#200a08" stroke="#070101" stroke-width="2.5"/>')
    o.append(f'<path class="s3-heat" d="{poly_d(hole)}" fill="url(#s3-fire2)" stroke="#070101" stroke-width="3" stroke-linejoin="round"/>'
             f'<path d="{poly_d(hole, close=False)}" fill="none" stroke="#ffd27a" stroke-width="2" opacity=".75"/>'
             '<path d="M948,200 L1014,264 M1062,172 L1040,252 M1100,212 L1134,262 M972,160 L962,224" stroke="#140504" stroke-width="7" stroke-linecap="square"/>')
    o.append(_flames(R, [(972, 250, 80, 190, -.12), (1030, 236, 96, 230, -.05), (1092, 250, 84, 180, .06),
                         (1130, 262, 50, 110, .1), (940, 262, 46, 100, -.15), (1060, 290, 60, 90, 0)]))
    # 紋章
    o.append('<g transform="translate(728 210)"><circle r="31" fill="#3a1410" stroke="#ffa050" stroke-width="2.5" opacity=".95"/>'
             '<circle r="24" fill="none" stroke="#ffa050" stroke-width="1.2" opacity=".6"/>'
             f'<path d="{EMBLEM_BOOK}" fill="#ffb860" opacity=".9" transform="translate(0 6)"/>'
             f'<path d="{SPARK}" fill="#ffd890" transform="translate(0 -11) scale(.7)"/></g>')
    # 基壇の端の石塔（右は折れている）
    o.append('<path d="M286,566 L292,452 L304,432 L316,452 L322,566Z M1278,566 L1284,488 L1292,476 L1300,492 L1308,480 L1316,566Z" '
             'fill="#1c0807" stroke="#070101" stroke-width="3" stroke-linejoin="round"/>'
             '<path d="M318,456 L322,562 M1312,486 L1316,562" stroke="#ff8a3a" stroke-width="2" opacity=".6"/>')
    # 階段の瓦礫と倒れた柱
    o.append('<ellipse cx="800" cy="640" rx="420" ry="150" fill="url(#s3-stairglow)"/>')
    o.append('<g transform="translate(720 690) rotate(17)"><rect x="-96" y="-24" width="192" height="48" fill="#1a0706" '
             'stroke="#070101" stroke-width="3"/><path d="M-90,-10 L90,-10 M-90,4 L90,4 M-90,16 L90,16" stroke="#2e0f0a" stroke-width="2"/>'
             '<ellipse cx="96" cy="0" rx="12" ry="24" fill="#3a1610" stroke="#070101" stroke-width="2.5"/>'
             '<path d="M-96,-24 L96,-24" stroke="#ff8a3a" stroke-width="2" opacity=".6"/></g>')
    rub = []
    for x, y, s in [(612, 640, 22), (884, 620, 16), (960, 700, 26), (560, 760, 30), (1010, 800, 20), (680, 820, 18),
                    (900, 860, 34), (1040, 660, 14)]:
        pts = [(x + math.cos(a) * s * R.uniform(.6, 1.1), y + math.sin(a) * s * R.uniform(.45, .8))
               for a in [i * math.pi * 2 / 6 + R.uniform(-.3, .3) for i in range(6)]]
        rub.append(poly_d(pts))
    o.append(f'<path d="{" ".join(rub)}" fill="#1c0806" stroke="#070101" stroke-width="2.5" stroke-linejoin="round"/>')
    o.append(_flames(R, [(970, 696, 30, 54, .1), (566, 752, 34, 62, -.1), (888, 616, 22, 40, 0)]))
    # 前景：右の瓦礫
    o.append('<path d="M1250,900 L1268,800 L1320,752 L1400,744 L1452,770 L1500,732 L1580,724 L1620,744 L1620,900Z" '
             'fill="#0d0303" stroke="#050101" stroke-width="3" stroke-linejoin="round"/>'
             '<path d="M1268,800 L1320,752 L1400,744 L1452,770 L1500,732 L1580,724" fill="none" stroke="#ff7a3a" stroke-width="2" opacity=".5"/>')
    # 前景：折れた柱の根元
    o.append('<path d="M-40,900 L-40,584 L-10,570 L14,590 L40,562 L66,584 L92,572 L118,600 L130,900Z" fill="#110404" '
             'stroke="#050101" stroke-width="3.5" stroke-linejoin="round"/>'
             '<path d="M8,600 L10,900 M42,588 L44,900 M76,596 L80,900" stroke="#240a07" stroke-width="3"/>'
             '<path d="M120,604 L130,900 M-10,570 L14,590 L40,562 L66,584 L92,572 L118,600" fill="none" stroke="#ff8a3a" '
             'stroke-width="2.4" opacity=".7"/>')
    # 前景：瓦礫の山と燃える職業の書
    o.append('<ellipse cx="300" cy="640" rx="210" ry="120" fill="url(#s3-bookglow)" class="s3-heat"/>')
    blocks = ["M140,770 L152,722 L206,704 L246,716 L254,770Z", "M232,770 L240,708 L294,694 L334,700 L344,770Z",
              "M326,770 L336,706 L380,694 L420,704 L430,770Z", "M410,770 L418,712 L458,702 L490,726 L502,770Z",
              "M196,770 L206,740 L250,734 L262,770Z", "M356,770 L366,738 L414,732 L424,770Z"]
    tops = "M152,722 L206,704 L246,716 M240,708 L294,694 L334,700 M336,706 L380,694 L420,704 M418,712 L458,702 L490,726"
    o.append(f'<path d="{" ".join(blocks)}" fill="#170606" stroke="#050101" stroke-width="3" stroke-linejoin="round"/>'
             f'<path d="{tops}" fill="none" stroke="#ff9a4a" stroke-width="2.2" opacity=".65"/>'
             '<path d="M180,740 L196,756 M300,724 L312,744 M440,730 L452,752" stroke="#050101" stroke-width="2"/>')
    book = ('<g transform="translate(310 650) rotate(-6)">'
            '<path d="M-118,-12 L-124,32 C-78,22 -34,26 0,40 C34,26 78,20 124,26 L116,-18 C78,-26 34,-22 0,-8 C-34,-24 -78,-24 -118,-12Z" '
            'fill="#4a0c10" stroke="#0a0202" stroke-width="3" stroke-linejoin="round"/>'
            '<path d="M-124,32 C-78,22 -34,26 0,40 C34,26 78,20 124,26" fill="none" stroke="#d9a04a" stroke-width="2.4"/>'
            '<path d="M0,-6 C-30,-22 -70,-24 -106,-14 L-110,22 C-72,12 -32,14 0,30Z" fill="#f2d9a2" stroke="#3a1206" stroke-width="2"/>'
            '<path d="M0,-6 C30,-22 70,-26 106,-18 L110,18 C72,8 32,12 0,30Z" fill="#f2d9a2" stroke="#3a1206" stroke-width="2"/>'
            '<path d="M-14,-4 C-40,-14 -70,-16 -96,-10 M-14,4 C-40,-6 -70,-8 -96,-2 M-14,12 C-40,2 -70,0 -96,6 '
            'M-14,20 C-40,10 -70,8 -96,14 M14,-4 C30,-12 44,-14 54,-14 M14,4 C30,-4 44,-6 54,-6 M14,12 C30,4 44,2 52,2" '
            'fill="none" stroke="#8a5a30" stroke-width="1.6" opacity=".6"/>'
            '<path d="M50,-21 C62,-10 52,4 66,12 L110,18 L106,-18 C88,-22 68,-24 50,-21Z" fill="#2a0804"/>'
            '<path d="M50,-21 C62,-10 52,4 66,12 L110,18" fill="none" stroke="#ff9a3a" stroke-width="3"/>'
            '</g>')
    o.append(book)
    o.append(_flames(R, [(380, 640, 70, 150, -.08), (338, 646, 50, 100, -.15), (414, 650, 44, 86, .08), (300, 652, 30, 54, -.1)]))
    # 舞い散るページ
    pg = []
    for i in range(14):
        sc = R.uniform(.9, 1.7)
        dx, dy = R.uniform(700, 1250), R.uniform(-560, -300)
        pg.append(f'<g transform="translate({n(R.uniform(300, 400))} {n(R.uniform(600, 640))}) scale({n(sc)})">'
                  f'<g class="s3-page mv" style="--dx:{n(dx / sc)}px;--dy:{n(dy / sc)}px;--p:{n(R.uniform(.1, .9))};'
                  f'animation-duration:{n(R.uniform(3.8, 5.6))}s;animation-delay:-{n(R.uniform(0, 5))}s">'
                  '<use href="#s3-pg" fill="url(#s3-page)" stroke="#4a1406" stroke-width="1.2"/></g></g>')
    o.append("".join(pg))
    # 火の粉
    em = ['<g fill="#ffc35a">']
    for i in range(44):
        if i < 14:
            x, y = R.uniform(280, 440), R.uniform(560, 640)
        else:
            x, y = R.uniform(360, 1240), R.uniform(240, 560)
        em.append(f'<circle class="s3-ember mv" cx="{n(x)}" cy="{n(y)}" r="{n(R.uniform(1.4, 3.6))}" '
                  f'style="--dx:{n(R.uniform(-80, 120))}px;--dy:{n(R.uniform(-380, -180))}px;--p:{n(R.random())};'
                  f'animation-duration:{n(R.uniform(2.6, 4.6))}s;animation-delay:-{n(R.uniform(0, 4))}s"/>')
    em.append('</g>')
    o.append("".join(em))
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# シーン4：シオンの脱出（暗い青と金色）
#   正式デザインのシオン（src/shion.py）が、職業の書を背負って夜の山道を駆け下りる。
#   夜の色調でも金髪・紺の服・背中の書が分かるよう、人物は暗く沈めすぎず、
#   右奥の炎（橙）と月明かり（青）の縁の光、背中の書の金色の光で形を起こす。
# ---------------------------------------------------------------------------
S4_CSS = """
.s4-bob,.s4-dust{transform-box:fill-box}
.s4-dust{transform-origin:50% 100%}
.is-active .s4-mid{animation:s4-pan 7.6s linear both}
.is-active .s4-far{animation:s4-panf 7.6s linear both}
.is-active .s4-fg{animation:s4-pang 7.6s linear both}
.is-active .s4-smoke{animation:s4-smoke 7.6s linear both}
.is-active .s4-bob{animation:s4-bob .42s ease-in-out infinite alternate}
.is-active .s4-book{animation:s4-book 2.2s ease-in-out infinite}
.is-active .s4-tglow{animation:s4-tglow 1.7s ease-in-out infinite}
.is-active .s4-mote{animation:s4-mote 2.8s ease-out infinite}
.is-active .s4-ember{animation:s4-ember 4s linear infinite}
.is-active .s4-fl{animation:s4-fl 1.1s ease-in-out infinite alternate}
.is-active .s4-dust{animation:s4-dust .84s ease-out infinite}
.s4-fl{transform-box:fill-box;transform-origin:50% 100%}
.s4-mote{transform:translate(calc(var(--dx)*var(--p)),calc(var(--dy)*var(--p)));opacity:calc(1 - var(--p))}
.s4-ember{transform:translate(calc(var(--dx)*var(--p)),calc(var(--dy)*var(--p)));opacity:calc(1 - var(--p))}
.s4-dust{opacity:.35}
@keyframes s4-pan{to{transform:translateX(64px)}}
@keyframes s4-panf{to{transform:translateX(16px)}}
@keyframes s4-pang{to{transform:translateX(120px)}}
@keyframes s4-smoke{to{transform:translateX(-70px)}}
@keyframes s4-bob{to{transform:translateY(-6px)}}
@keyframes s4-book{0%,100%{opacity:.62}18%{opacity:.95}32%{opacity:.75}55%{opacity:1}75%{opacity:.68}}
@keyframes s4-tglow{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes s4-mote{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s4-ember{0%{transform:translate(0,0);opacity:0}10%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
@keyframes s4-fl{0%{transform:scale(1,1) skewX(0)}50%{transform:scale(.93,1.08) skewX(-3deg)}100%{transform:scale(1.05,.9) skewX(2.5deg)}}
@keyframes s4-dust{0%{transform:translate(0,0) scale(.4);opacity:.55}100%{transform:translate(46px,-14px) scale(1.4);opacity:0}}
.s4-shotb{opacity:0}
.is-active .s4-shotb{animation:s4-in .6s 4.05s ease-out both}
.is-active .s4-shota{animation:s4-out .05s 4.7s linear both}
@keyframes s4-in{from{opacity:0}to{opacity:1}}
@keyframes s4-out{to{opacity:0}}
"""

# 人物の配置：セル座標 S4_ANCHOR（前傾の回転の中心＝足もと）を場面の S4_AT へ、S4_SCALE 倍で置く。
S4_AT, S4_SCALE, S4_ANCHOR = (786, 664), .8, (200, 430)
# 後半の近い画（字幕「その背には…」）：背中の書（セル座標 S4B_ANCHOR）を S4B_AT へ、S4B_SCALE 倍で置く。
S4B_AT, S4B_SCALE, S4B_ANCHOR = (812, 470), 1.5, (121, 240)


def _night(c):
    return shion.mix(c, "#15204c", .3)


def scene4():
    R = random.Random(404)
    o = [HEAD.format(label="夜の山道を、職業の書を背負った金髪の少年シオンが駆け下りていく。遠くの峰で神殿が燃えている。"
                     "近づくと、走る背中で深緑の職業の書が金色に光っている")]
    o.append(f"<style>{S4_CSS}</style>")
    sdefs, srim, sbody, book = shion.figure(shion.run_left, "s4-sh-", tone=_night,
                                            rims=(("#ff9a4a", 5, -2, 1), ("#8fb0ff", -4, -3, .75)))
    bx = S4_AT[0] + S4_SCALE * (book[0] - S4_ANCHOR[0])
    by = S4_AT[1] + S4_SCALE * (book[1] - S4_ANCHOR[1])
    bdefs, brim, bbody, bbook = shion.figure(shion.run_away, "s4-sb-", tone=_night,
                                             rims=(("#ff9a4a", 4, -1.5, 1), ("#8fb0ff", -3, -2, .55)))
    cx = S4B_AT[0] + S4B_SCALE * (bbook[0] - S4B_ANCHOR[0])
    cy = S4B_AT[1] + S4B_SCALE * (bbook[1] - S4B_ANCHOR[1])
    o.append(f"""<defs>
<linearGradient id="s4-sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#03071a"/><stop offset=".45" stop-color="#0a1534"/><stop offset=".8" stop-color="#142659"/>
 <stop offset="1" stop-color="#1c3268"/></linearGradient>
<radialGradient id="s4-tg" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#ff9a45" stop-opacity=".85"/><stop offset=".4" stop-color="#ff6a28" stop-opacity=".3"/>
 <stop offset="1" stop-color="#ff4a18" stop-opacity="0"/></radialGradient>
<radialGradient id="s4-bg" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#fff2c4" stop-opacity=".95"/><stop offset=".22" stop-color="#ffd877" stop-opacity=".55"/>
 <stop offset="1" stop-color="#ffb640" stop-opacity="0"/></radialGradient>
<linearGradient id="s4-smk" x1="1600" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#3e2220"/><stop offset=".35" stop-color="#1a1a30"/><stop offset="1" stop-color="#0b1228"/></linearGradient>
<radialGradient id="s4-fire" cx=".5" cy="1" r="1">
 <stop offset="0" stop-color="#ffe7a0"/><stop offset=".45" stop-color="#ff8a32"/><stop offset="1" stop-color="#b8300e"/></radialGradient>
<linearGradient id="s4-ground" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#0f1a3c"/><stop offset="1" stop-color="#060b1e"/></linearGradient>
</defs>{sdefs}{bdefs}""")
    o.append('<g class="s4-shota">')   # 前半：山道を駆け下りる全身（後半の画が重なったら描かない）
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append('<g fill="#cfdcff">' + "".join(
        f'<circle cx="{n(R.uniform(0, 1600))}" cy="{n(380 * R.random() ** 1.4)}" r="{n(R.uniform(.5, 1.5))}" opacity="{n(R.uniform(.2, .7))}"/>'
        for _ in range(70)) + '</g>')
    # 空を流れる煙
    sm = []
    for y0, y1, r0, r1, cnt, ph in [(110, 70, 54, 18, 70, 0), (210, 196, 42, 14, 60, 2), (290, 300, 28, 10, 50, 4)]:
        for k in range(cnt):
            t = k / (cnt - 1)
            x = 1180 - t * 1420
            y = y0 + (y1 - y0) * t + math.sin(t * 6 + ph) * 22
            sm.append((x + R.uniform(-12, 12), y + R.uniform(-8, 8), (r0 + (r1 - r0) * t) * R.uniform(.75, 1.2)))
    o.append(f'<g class="s4-smoke mv" opacity=".9">{lobes_union(sm, "#2a2440", 4, "url(#s4-smk)")}</g>')
    # 燃える神殿の峰（右奥）
    pd, pr = mountain([(980, 720), (1080, 600), (1150, 470), (1206, 384), (1240, 346), (1340, 342), (1384, 368),
                       (1450, 436), (1530, 502), (1620, 540)], 780, R, rough=.1)
    o.append('<ellipse class="s4-tglow" cx="1290" cy="300" rx="300" ry="230" fill="url(#s4-tg)"/>')
    tcs = []
    for k in range(9):
        t = k / 8
        x, y = bezier((1300, 300), (1290, 180), (1200, 120), (1050, 90), t)
        tcs.append((x, y, 18 + 40 * t))
    o.append(lobes_union(tcs, "#060a18", 4, "#1e1626"))
    tp = []
    for i, x in enumerate(range(-52, 60, 21)):
        top = -40 if i not in (2, 4) else (-26 if i == 2 else -18)
        tp.append(f"M{x - 3},0 L{x - 3},{top} L{x},{top - 4} L{x + 3},{top} L{x + 3},0Z")
    o.append('<g transform="translate(1290 344)"><path class="s4-tglow" d="M-58,0 L-58,-44 L58,-44 L58,0Z" fill="url(#s4-fire)"/>'
             f'<path d="{" ".join(tp)}" fill="#0a0d1e"/>'
             '<path d="M-64,-40 L10,-40 L14,-46 L-64,-46Z M36,-40 L64,-40 L64,-46 L32,-46Z" fill="#0a0d1e"/>'
             '<path d="M-76,-46 Q-54,-48 -42,-60 Q-22,-72 4,-74 L12,-66 L4,-58 L14,-52 L10,-46Z M36,-46 L30,-54 L42,-62 Q56,-50 76,-46Z '
             'M-14,-72 L-14,-94 L-6,-88 L0,-100 L6,-90 L12,-72Z" fill="#0a0d1e"/>'
             '<path d="M-80,0 L80,0 L84,8 L-84,8Z" fill="#0a0d1e"/></g>')
    fl = []
    for x, h in [(1268, 40), (1300, 56), (1324, 34)]:
        fl.append(f'<g transform="translate({x} 290)"><g class="s4-fl mv" style="animation-delay:-{n(R.uniform(0, 1))}s">'
                  f'<path d="{flame(24, h, -.1)}" fill="#ff7a28"/><path d="{flame(12, h * .6, -.1)}" fill="#ffd27a"/></g></g>')
    o.append("".join(fl))
    o.append(f'<path d="{pd}" fill="#0c1534" stroke="#050915" stroke-width="2.5"/>'
             f'<path d="{pr}" fill="none" stroke="#ff8a45" stroke-width="2" opacity=".5"/>')
    # 遠景の山並み（ゆっくり流れる）
    fd, fr = mountain([(-120, 520), (0, 482), (110, 500), (240, 446), (360, 486), (500, 452), (640, 494), (780, 470),
                       (900, 510), (1010, 548), (1080, 600)], 780, R, rough=.14)
    o.append(f'<g class="s4-far mv"><path d="{fd}" fill="#101c42" stroke="#050915" stroke-width="2"/>'
             f'<path d="{fr}" fill="none" stroke="#6d8fe0" stroke-width="1.6" opacity=".3"/>'
             f'<g fill="#2a3d7a" opacity=".35"><path d="{kasumi(-60, 520, 620, 22)}"/><path d="{kasumi(640, 556, 520, 20)}"/></g></g>')
    # 中景：駆け下りる山道（右へ流れて疾走感を出す）
    ground = "M-200,706 C160,694 480,668 760,652 C1000,638 1250,610 1800,566 L1800,900 L-200,900Z"
    trees = ("M300,676 C296,630 300,590 286,548 M292,600 C270,590 254,574 246,552 M290,572 C306,560 316,544 318,526 "
             "M288,560 C278,546 276,532 280,518 M1150,628 C1146,584 1154,548 1146,506 M1148,570 C1170,560 1186,544 1190,522 "
             "M1150,540 C1132,530 1122,514 1120,496")
    rocks = []
    for x in [-60, 120, 420, 560, 980, 1080, 1320, 1460, 1600]:
        y = 706 - (x + 200) / 2000 * 140 + 4
        s = R.uniform(18, 34)
        rocks.append(poly_d([(x - s, y), (x - s * .6, y - s * .7), (x + s * .1, y - s * .9), (x + s * .8, y - s * .4), (x + s, y)]))
    gr = grass(R, -180, 1780, lambda x: 706 - (x + 200) / 2000 * 140, 26, 12, 30, lean=-12, width=4)
    o.append(f'<g class="s4-mid mv"><path d="{ground}" fill="url(#s4-ground)" stroke="#040817" stroke-width="3"/>'
             '<path d="M-200,706 C160,694 480,668 760,652 C1000,638 1250,610 1800,566" fill="none" stroke="#4d6cc0" stroke-width="2" opacity=".45"/>'
             '<path d="M-200,720 C160,708 480,684 760,668 C1000,654 1250,628 1800,584 L1800,600 C1250,644 1000,672 760,686 '
             'C480,702 160,726 -200,738Z" fill="#18264f" opacity=".7"/>'
             f'<path d="{" ".join(rocks)}" fill="#09102a" stroke="#040817" stroke-width="2.5"/>'
             f'<path d="{trees}" fill="none" stroke="#070d22" stroke-width="6" stroke-linecap="round"/>'
             f'<path d="{gr}" fill="#09102a"/></g>')
    # 書の光が足元の道を照らす
    o.append(f'<g opacity=".42"><ellipse class="s4-book" cx="{n(S4_AT[0] - 30)}" cy="{n(S4_AT[1] - 6)}" rx="230" ry="34" fill="url(#s4-bg)"/></g>')
    # 蹴り上げた土ぼこり（後ろ足のかかと）
    dust = []
    for i, (dx, dy, r) in enumerate([(70, -14, 12), (58, -4, 9), (84, -2, 8)]):
        dust.append(f'<circle class="s4-dust mv" cx="{n(S4_AT[0] + dx)}" cy="{n(S4_AT[1] + dy)}" r="{r}" fill="#5a6c9c" '
                    f'style="animation-delay:-{n(i * .28)}s"/>')
    o.append("".join(dust))
    # 光の粒（背中の書から後ろへ流れる）
    mo = ['<g fill="#ffe39a">']
    for i in range(16):
        mo.append(f'<circle class="s4-mote mv" cx="{n(bx + R.uniform(-10, 10))}" cy="{n(by + R.uniform(-20, 20))}" r="{n(R.uniform(1.4, 3.4))}" '
                  f'style="--dx:{n(R.uniform(140, 340))}px;--dy:{n(R.uniform(-90, 30))}px;--p:{n(R.random())};'
                  f'animation-duration:{n(R.uniform(2, 3.4))}s;animation-delay:-{n(R.uniform(0, 3))}s"/>')
    mo.append('</g>')
    o.append("".join(mo))
    # シオン：背中の書の光（後ろ）→ 縁の光と人物 → 書の上の淡い光
    o.append(f'<g class="s4-book"><circle cx="{n(bx)}" cy="{n(by)}" r="190" fill="url(#s4-bg)" opacity=".6"/></g>')
    o.append(f'<g class="s4-bob mv">{shion.place(srim + sbody, S4_AT, S4_SCALE, S4_ANCHOR)}'
             f'<g class="s4-book"><circle cx="{n(bx)}" cy="{n(by)}" r="34" fill="url(#s4-bg)" opacity=".16"/></g></g>')
    # 火の粉（左へ流れる）
    em = ['<g fill="#ffa24a">']
    for i in range(30):
        em.append(f'<circle class="s4-ember mv" cx="{n(R.uniform(700, 1600))}" cy="{n(R.uniform(160, 560))}" r="{n(R.uniform(1.2, 3))}" '
                  f'style="--dx:{n(R.uniform(-520, -260))}px;--dy:{n(R.uniform(-140, 40))}px;--p:{n(R.random())};'
                  f'animation-duration:{n(R.uniform(3, 5))}s;animation-delay:-{n(R.uniform(0, 4))}s"/>')
    em.append('</g>')
    o.append("".join(em))
    # 前景の岩（最も速く流れる）
    fgr = ("M-260,900 L-240,780 L-160,758 L-80,770 L0,752 L80,776 L150,800 L210,846 L240,900Z "
           "M1200,900 L1236,800 L1300,760 L1380,748 L1450,724 L1530,736 L1600,712 L1700,730 L1720,900Z")
    gr2 = grass(R, -240, 200, lambda x: 770 + max(0, x - 60) * .4, 8, 20, 54, lean=-16) + \
          grass(R, 1240, 1700, lambda x: 760 - (x - 1240) * .07, 8, 22, 60, lean=-16)
    o.append(f'<g class="s4-fg mv"><path d="{fgr}" fill="#5c7cd0" opacity=".45" transform="translate(2 -3)"/>'
             f'<path d="{fgr}" fill="#040817" stroke="#020409" stroke-width="3" stroke-linejoin="round"/>'
             f'<path d="{gr2}" fill="#040817"/></g>')
    o.append('</g>')
    o.append(_scene4_back(R, brim, bbody, cx, cy))
    o.append("</svg>")
    return "".join(o)


def _scene4_back(R, rim, body, cx, cy):
    """第4場面の後半：走る背中に近づき、深緑の表紙と金の紋章の職業の書を見せる（字幕「その背には…」）。"""
    o = ['<g class="s4-shotb">']
    o.append('<rect width="1600" height="900" fill="url(#s4-sky)"/>')
    o.append('<g fill="#cfdcff">' + "".join(
        f'<circle cx="{n(R.uniform(0, 1600))}" cy="{n(420 * R.random() ** 1.3)}" r="{n(R.uniform(.5, 1.6))}" opacity="{n(R.uniform(.2, .7))}"/>'
        for _ in range(50)) + '</g>')
    # 画面の右の外で燃える神殿の明かり
    o.append('<ellipse class="s4-tglow" cx="1640" cy="360" rx="560" ry="440" fill="url(#s4-tg)"/>')
    sm = []
    for k in range(40):
        t = k / 39
        x = 1700 - t * 1500
        sm.append((x + R.uniform(-14, 14), 120 + math.sin(t * 5) * 30 + R.uniform(-8, 8), (60 - 36 * t) * R.uniform(.8, 1.15)))
    o.append(f'<g class="s4-smoke mv" opacity=".85">{lobes_union(sm, "#2a2440", 4, "url(#s4-smk)")}</g>')
    # これから向かう、奥の暗い尾根と山道
    rd, rr = mountain([(-40, 600), (120, 560), (300, 586), (480, 548), (640, 590), (820, 620), (1000, 640), (1240, 660),
                       (1640, 700)], 900, R, rough=.12)
    o.append(f'<g class="s4-far mv"><path d="{rd}" fill="#0c1534" stroke="#050915" stroke-width="2.5"/>'
             f'<path d="{rr}" fill="none" stroke="#6d8fe0" stroke-width="1.6" opacity=".3"/></g>')
    o.append('<g class="s4-mid mv"><path d="M-200,820 C200,782 640,760 1000,770 C1300,778 1600,800 1800,812 L1800,900 L-200,900Z" '
             'fill="#060b1e" stroke="#040817" stroke-width="3"/>'
             '<path d="M-200,820 C200,782 640,760 1000,770 C1300,778 1600,800 1800,812" fill="none" stroke="#4d6cc0" '
             'stroke-width="2" opacity=".4"/></g>')
    # 背中の書の光（後ろ）→ 人物 → 紋章の上の淡い光、書から後ろ（手前）へ流れる光の粒
    o.append(f'<g class="s4-book"><circle cx="{n(cx)}" cy="{n(cy)}" r="280" fill="url(#s4-bg)" opacity=".55"/></g>')
    mo = ['<g fill="#ffe39a">']
    for i in range(14):
        mo.append(f'<circle class="s4-mote mv" cx="{n(cx + R.uniform(-30, 30))}" cy="{n(cy + R.uniform(-30, 30))}" r="{n(R.uniform(2, 4.4))}" '
                  f'style="--dx:{n(R.uniform(160, 420))}px;--dy:{n(R.uniform(-60, 120))}px;--p:{n(R.random())};'
                  f'animation-duration:{n(R.uniform(2, 3.4))}s;animation-delay:-{n(R.uniform(0, 3))}s"/>')
    mo.append('</g>')
    o.append("".join(mo))
    o.append(f'<g class="s4-bob mv">{shion.place(rim + body, S4B_AT, S4B_SCALE, S4B_ANCHOR)}'
             f'<g class="s4-book"><circle cx="{n(cx)}" cy="{n(cy)}" r="70" fill="url(#s4-bg)" opacity=".22"/></g></g>')
    em = ['<g fill="#ffa24a">']
    for i in range(22):
        em.append(f'<circle class="s4-ember mv" cx="{n(R.uniform(900, 1600))}" cy="{n(R.uniform(140, 620))}" r="{n(R.uniform(1.4, 3.4))}" '
                  f'style="--dx:{n(R.uniform(-620, -320))}px;--dy:{n(R.uniform(-160, 40))}px;--p:{n(R.random())};'
                  f'animation-duration:{n(R.uniform(3, 5))}s;animation-delay:-{n(R.uniform(0, 4))}s"/>')
    em.append('</g>')
    o.append("".join(em))
    o.append('</g>')
    return "".join(o)


# ---------------------------------------------------------------------------
# シーン5：ジパングへの漂着（夜の名残りの青紫 → 夜明けの金色）
#   浜に立つシオンを右斜め後ろから見る。朝日（画面右）を見つめる背中に、深緑の表紙と金の紋章の
#   職業の書。夜の名残りが晴れるにつれ、朝日の縁の光で姿がはっきりする。最後にタイトル。
# ---------------------------------------------------------------------------
S5_CSS = """
.s5-gull{transform-box:fill-box;transform-origin:50% 50%}
.is-active .s5-night{animation:s5-night 4.8s .2s ease-in-out both}
.is-active .s5-stars{animation:s5-night 4.2s .2s ease-in both}
.is-active .s5-bloom{animation:s5-bloom 5.2s .8s ease-in-out both}
.is-active .s5-sun{animation:s5-sun 6.6s cubic-bezier(.3,.1,.3,1) both}
.is-active .s5-rays{animation:s5-rays 7s linear both}
.is-active .s5-rayfade{animation:s5-bloom 4s 1.4s ease-out both}
.is-active .s5-cl-a{animation:s5-drift 8s linear both}
.is-active .s5-cl-b{animation:s5-drift2 8s linear both}
.is-active .s5-gl{animation:s5-gl 1.8s ease-in-out infinite}
.is-active .s5-wave{animation:s5-wave 3.4s ease-in-out infinite alternate}
.is-active .s5-foam{animation:s5-foam 3.4s ease-in-out infinite alternate}
.is-active .s5-book{animation:s5-book 2.6s ease-in-out infinite}
.is-active .s5-bookfade{animation:s5-bookfade 5s 1s ease-in both}
.is-active .s5-rim{animation:s5-bloom 4.4s .8s ease-out both}
.is-active .s5-birds{animation:s5-birds 6.6s 1.6s ease-out both}
.is-active .s5-birdfade{animation:s5-bloom 1.6s 1.6s ease-out both}
.is-active .s5-gull{animation:s5-flap .7s ease-in-out infinite alternate}
.is-active .s5-ripple{animation:s5-ripple 6s linear both}
.s5-night{opacity:0}.s5-stars{opacity:0}
@keyframes s5-night{from{opacity:.94}to{opacity:0}}
@keyframes s5-bloom{from{opacity:0}}
@keyframes s5-sun{from{transform:translateY(96px)}to{transform:none}}
@keyframes s5-rays{from{transform:rotate(-5deg)}to{transform:none}}
@keyframes s5-drift{from{transform:translateX(-40px)}}
@keyframes s5-drift2{from{transform:translateX(30px)}}
@keyframes s5-gl{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes s5-wave{from{transform:translateY(-16px)}to{transform:translateY(6px)}}
@keyframes s5-foam{from{transform:translateY(-16px);opacity:.95}to{transform:translateY(6px);opacity:.55}}
@keyframes s5-book{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes s5-bookfade{to{opacity:.4}}
@keyframes s5-birds{from{transform:translate(-120px,30px)}}
@keyframes s5-flap{to{transform:scaleY(.55)}}
@keyframes s5-ripple{from{transform:translateX(-30px)}}
"""

# 人物の配置：セル座標 S5_ANCHOR（両足の間の地面）を場面の S5_AT へ、S5_SCALE 倍で置く。
S5_AT, S5_SCALE, S5_ANCHOR = (600, 728), .86, (122, 432)


def pagoda(x, base, h):
    d = ""
    th = h * 0.15
    y = base
    for i in range(5):
        bw = 30 - i * 3.4
        rw = 66 - i * 7
        ry = y - th * 0.55
        d += f"M{n(x - bw / 2)},{n(y)} L{n(x - bw / 2)},{n(ry)} L{n(x + bw / 2)},{n(ry)} L{n(x + bw / 2)},{n(y)}Z "
        d += (f"M{n(x - rw / 2)},{n(ry - 5)} Q{n(x - rw * .3)},{n(ry + 1)} {n(x - bw * .6)},{n(ry)} L{n(x + bw * .6)},{n(ry)} "
              f"Q{n(x + rw * .3)},{n(ry + 1)} {n(x + rw / 2)},{n(ry - 5)} Q{n(x + rw * .26)},{n(ry - th * .3)} {n(x + bw * .3)},{n(ry - th * .45)} "
              f"L{n(x - bw * .3)},{n(ry - th * .45)} Q{n(x - rw * .26)},{n(ry - th * .3)} {n(x - rw / 2)},{n(ry - 5)}Z ")
        y = ry - th * 0.45
    d += f"M{n(x - 2.2)},{n(y)} L{n(x - 1.4)},{n(y - h * .24)} L{n(x + 1.4)},{n(y - h * .24)} L{n(x + 2.2)},{n(y)}Z "
    for k in range(5):
        yy = y - 6 - k * h * .035
        d += f"M{n(x - 5)},{n(yy)} L{n(x + 5)},{n(yy)} L{n(x + 5)},{n(yy - 2)} L{n(x - 5)},{n(yy - 2)}Z "
    return d


def torii(x, base, w, h):
    px = w * 0.3
    ky = base - h
    d = ""
    for s in (-1, 1):
        cx = x + s * px
        d += f"M{n(cx - 3.5)},{n(base)} L{n(cx - 2.6)},{n(ky + 8)} L{n(cx + 2.6)},{n(ky + 8)} L{n(cx + 3.5)},{n(base)}Z "
    d += (f"M{n(x - w / 2)},{n(ky - 4)} Q{n(x)},{n(ky + 4)} {n(x + w / 2)},{n(ky - 4)} L{n(x + w / 2 - 3)},{n(ky + 3)} "
          f"Q{n(x)},{n(ky + 9)} {n(x - w / 2 + 3)},{n(ky + 3)}Z ")
    d += f"M{n(x - w * .42)},{n(ky + 6)} L{n(x + w * .42)},{n(ky + 6)} L{n(x + w * .42)},{n(ky + 10)} L{n(x - w * .42)},{n(ky + 10)}Z "
    ny = base - h * 0.62
    d += f"M{n(x - w * .4)},{n(ny)} L{n(x + w * .4)},{n(ny)} L{n(x + w * .4)},{n(ny + 4)} L{n(x - w * .4)},{n(ny + 4)}Z "
    d += f"M{n(x - 2)},{n(ky + 10)} L{n(x + 2)},{n(ky + 10)} L{n(x + 2)},{n(ny)} L{n(x - 2)},{n(ny)}Z"
    return d


def _dawn(c):
    return shion.mix(c, "#ffdcae", .07)


def scene5():
    R = random.Random(505)
    o = [HEAD.format(label="夜明けの海。ジパングの島に朝日が昇り、浜辺に立つ金髪の少年シオンの背で、深緑の職業の書が朝日を受けている")]
    o.append(f"<style>{S5_CSS}</style>")
    # 縁の光（朝日側）は、夜の名残りが晴れるのに合わせて現れる（.s5-rim）。
    sdefs, srim, sbody, book = shion.figure(shion.stand_dawn, "s5-sh-", tone=_dawn,
                                            rims=(("#ffe6ad", 5, -1, 1), ("#fff4d6", 1, -5, .6)))
    bx = S5_AT[0] + S5_SCALE * (book[0] - S5_ANCHOR[0])
    by = S5_AT[1] + S5_SCALE * (book[1] - S5_ANCHOR[1])
    o.append("""<defs>
<linearGradient id="s5-sky" x1="0" y1="0" x2="0" y2="490" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#22306c"/><stop offset=".3" stop-color="#4a5fa6"/><stop offset=".56" stop-color="#a493c2"/>
 <stop offset=".76" stop-color="#f0b98a"/><stop offset=".9" stop-color="#ffd99a"/><stop offset="1" stop-color="#fff0c8"/></linearGradient>
<radialGradient id="s5-sunglow" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#fff6d6" stop-opacity=".95"/><stop offset=".2" stop-color="#ffdc8a" stop-opacity=".6"/>
 <stop offset=".55" stop-color="#ffb870" stop-opacity=".18"/><stop offset="1" stop-color="#ffb870" stop-opacity="0"/></radialGradient>
<radialGradient id="s5-sun" cx=".45" cy=".4" r=".6">
 <stop offset="0" stop-color="#fffbea"/><stop offset=".7" stop-color="#ffe7a2"/><stop offset="1" stop-color="#ffd070"/></radialGradient>
<linearGradient id="s5-sea" x1="0" y1="480" x2="0" y2="720" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#9aa2d2"/><stop offset=".25" stop-color="#5f79b8"/><stop offset=".7" stop-color="#3a5d9a"/>
 <stop offset="1" stop-color="#2b4b84"/></linearGradient>
<linearGradient id="s5-ray" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#fff2c8" stop-opacity="0"/><stop offset="1" stop-color="#fff2c8" stop-opacity=".55"/></linearGradient>
<linearGradient id="s5-sand" x1="0" y1="620" x2="0" y2="900" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#8f8aa0"/><stop offset=".12" stop-color="#c7ab8e"/><stop offset=".5" stop-color="#dcbc90"/>
 <stop offset="1" stop-color="#b8916c"/></linearGradient>
<linearGradient id="s5-isle" x1="0" y1="220" x2="0" y2="480" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#4c5294"/><stop offset="1" stop-color="#7d7cb4"/></linearGradient>
<linearGradient id="s5-nightg" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#090e33"/><stop offset=".5" stop-color="#1f1d5c"/><stop offset="1" stop-color="#2c2b6c"/></linearGradient>
<radialGradient id="s5-bookg" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#fff0bc" stop-opacity=".95"/><stop offset=".3" stop-color="#ffd468" stop-opacity=".45"/>
 <stop offset="1" stop-color="#ffb640" stop-opacity="0"/></radialGradient>
<radialGradient id="s5-shadow" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#5d4a62" stop-opacity=".5"/><stop offset=".7" stop-color="#5d4a62" stop-opacity=".22"/>
 <stop offset="1" stop-color="#5d4a62" stop-opacity="0"/></radialGradient>
<clipPath id="s5-horizon"><rect x="0" y="0" width="1600" height="481"/></clipPath>
</defs>""" + sdefs)
    o.append('<rect width="1600" height="900" fill="url(#s5-sky)"/>')
    o.append('<g class="s5-bloom"><circle cx="1000" cy="476" r="520" fill="url(#s5-sunglow)"/></g>')
    rays = " ".join(
        f"M1000,476 L{n(1000 + math.cos(a - .025) * 1100)},{n(476 + math.sin(a - .025) * 1100)} "
        f"L{n(1000 + math.cos(a + .025) * 1100)},{n(476 + math.sin(a + .025) * 1100)}Z"
        for a in [math.radians(d) for d in range(-170, -5, 13)])
    o.append(f'<g clip-path="url(#s5-horizon)"><g class="s5-rayfade"><g class="s5-rays mv" style="transform-origin:1000px 476px">'
             f'<path d="{rays}" fill="url(#s5-ray)" opacity=".26"/></g></g></g>')
    # 雲（下面が金色に照る）
    def cl(rows, body="#8a8fcc"):
        d = " ".join(kasumi(x, y, w, h) for x, y, w, h in rows)
        return (f'<path d="{d}" fill="#ffd58e" transform="translate(0 6)"/>'
                f'<path d="{d}" fill="{body}"/>')
    o.append(f'<g class="s5-cl-a mv">{cl([(40, 96, 560, 34), (1010, 60, 520, 30), (-60, 330, 380, 24)], "#7d82c4")}</g>')
    o.append(f'<g class="s5-cl-b mv">{cl([(880, 196, 600, 30), (130, 228, 470, 26), (1180, 300, 380, 20)], "#9194d0")}</g>')
    o.append(f'<g fill="#fff0c8" opacity=".45"><path d="{kasumi(560, 380, 380, 14)}"/><path d="{kasumi(1150, 340, 300, 12)}"/></g>')
    # 朝日
    o.append('<g clip-path="url(#s5-horizon)"><g class="s5-sun mv"><circle cx="1000" cy="446" r="96" fill="#ffe3a0" opacity=".35"/>'
             '<circle cx="1000" cy="446" r="66" fill="url(#s5-sun)"/></g></g>')
    # 遠い島々とジパング
    o.append('<path d="M60,481 C90,470 130,466 170,474 C190,470 214,472 236,481Z M420,481 C440,474 470,473 490,481Z" fill="#6f72aa"/>')
    isle = ("M1060,481 C1120,470 1180,452 1240,410 C1290,372 1334,300 1376,240 L1394,232 L1414,242 C1460,300 1520,370 1600,402 "
            "L1600,481Z")
    o.append(f'<path d="{isle}" fill="url(#s5-isle)"/>'
             '<path d="M1356,268 L1376,240 L1394,232 L1414,242 L1432,266 L1418,262 L1406,274 L1394,260 L1382,274 L1370,262Z" fill="#d8d6f0"/>'
             '<path d="M1240,410 C1290,372 1334,300 1376,240 L1394,232" fill="none" stroke="#ffd79a" stroke-width="2.4" opacity=".7"/>')
    hills = cloud(1040, 482, 560, 56, 16, R)
    o.append(f'<path d="{hills}" fill="#565a98"/>')
    pines = []
    for x in range(1060, 1600, 34):
        y = 476 - R.uniform(18, 40)
        pines.append(cloud(x - 16, y, 34, 14, 3, R, zig=6) + f" M{x - 1.5},{n(y)} L{x + 1.5},{n(y)} L{x + 2},{n(y + 18)} L{x - 2},{n(y + 18)}Z")
    o.append(f'<path d="{" ".join(pines)}" fill="#4b4f8e"/>')
    o.append(f'<path d="{pagoda(1232, 470, 132)}" fill="#3c4080" stroke="#2a2d66" stroke-width="1"/>'
             '<path d="M1214,468 L1214,452 M1218,432 L1218,418" stroke="#ffd79a" stroke-width="1.6" opacity=".6"/>')
    # 海
    o.append('<rect x="0" y="480" width="1600" height="260" fill="url(#s5-sea)"/>'
             '<path d="M640,481 L1360,481" stroke="#fff3cf" stroke-width="2.5" opacity=".8"/>')
    gl = ['<g stroke="#ffe6a6" stroke-linecap="round">']
    y = 486
    while y < 650:
        spread = 18 + (y - 480) * 1.05
        for _ in range(1 + int((y - 480) / 50)):
            x = 1000 + R.gauss(0, spread * .5)
            w = R.uniform(8, 18) + (y - 480) * .12
            gl.append(f'<path class="s5-gl" d="M{n(x - w / 2)},{n(y)} L{n(x + w / 2)},{n(y)}" stroke-width="{n(1.4 + (y - 480) / 70)}" '
                      f'style="animation-delay:-{n(R.uniform(0, 1.8))}s;animation-duration:{n(R.uniform(1.4, 2.4))}s"/>')
        y += 5 + (y - 480) * .05
    gl.append('</g>')
    o.append("".join(gl))
    rip = []
    for _ in range(26):
        x, y = R.uniform(0, 1600), R.uniform(500, 640)
        w = 20 + (y - 480) * .5
        rip.append(f"M{n(x - w / 2)},{n(y)} Q{n(x)},{n(y - 3 - (y - 480) * .02)} {n(x + w / 2)},{n(y)}")
    o.append(f'<path class="s5-ripple mv" d="{" ".join(rip)}" fill="none" stroke="#c3cdf0" stroke-width="2" opacity=".55"/>')
    # 鳥居の立つ岩
    o.append('<path d="M1086,532 C1092,516 1110,510 1126,512 C1142,508 1158,516 1164,532Z" fill="#373a72"/>'
             f'<path d="{torii(1125, 516, 64, 58)}" fill="#7a3f5a"/>'
             '<path d="M1092,534 L1160,534" stroke="#ffe6a6" stroke-width="2" opacity=".55"/>')
    # 左の岬と松（序盤の松と呼応）
    cape = ("M-20,560 L-20,372 L20,350 L52,342 L84,352 L110,346 L138,364 L160,392 L176,388 L204,420 L236,446 L262,452 "
            "L300,480 L330,496 L372,516 L420,538 L470,560Z")
    o.append(f'<path d="{cape}" fill="#ffd38a" opacity=".85" transform="translate(4 -2)"/>'
             f'<path d="{cape}" fill="#2b305f" stroke="#1a1d42" stroke-width="2.5" stroke-linejoin="round"/>'
             '<path d="M10,384 L60,374 L104,384 M24,426 L90,414 L140,424 L178,436 M34,474 L120,462 L200,474 L262,494 M60,520 L180,510 L300,520" '
             'fill="none" stroke="#3c4380" stroke-width="3" stroke-linecap="round"/>'
             '<path d="M-20,480 L470,560 L-20,560Z" fill="#232850" opacity=".5"/>')
    trunk = ("M84,326 C92,290 110,262 140,240 C164,222 188,214 214,208 L218,218 C194,226 170,234 150,252 C126,274 110,300 100,330Z "
             "M156,246 C190,250 226,262 262,282 L258,290 C224,272 188,262 158,258Z")
    o.append(f'<g transform="translate(-6 22)"><path d="{trunk}" fill="#262a55" stroke="#1a1d42" stroke-width="2"/>')
    pads = [(150, 214, 140, 36, 5), (220, 284, 110, 30, 4), (96, 250, 96, 30, 4), (190, 186, 90, 26, 3)]
    pd = " ".join(cloud(x, y, w, h, l, R, zig=8) for x, y, w, h, l in pads)
    o.append(f'<path d="{pd}" fill="#ffd38a" transform="translate(2 -3)"/><path d="{pd}" fill="#2a2f5e" stroke="#1a1d42" stroke-width="1.8"/></g>')
    # 砂浜と寄せる波
    shore = "M-20,652 C300,624 600,612 900,618 C1200,626 1400,640 1620,632"
    o.append(f'<path d="{shore} L1620,900 L-20,900Z" fill="url(#s5-sand)"/>')
    o.append(f'<path d="{shore} L1620,664 C1400,672 1200,660 900,652 C600,646 300,656 -20,686Z" fill="#9c95b0" opacity=".7"/>')
    shore_pts = [bezier((-20, 652), (300, 624), (600, 612), (900, 618), t / 20) for t in range(21)] + \
                [bezier((900, 618), (1200, 626), (1400, 640), (1620, 632), t / 20) for t in range(1, 21)]

    def shore_y(x):
        for (x0, y0), (x1, y1) in zip(shore_pts, shore_pts[1:]):
            if x0 <= x <= x1:
                return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
        return shore_pts[-1][1]
    xs = list(range(1620, -21, -40)) + [-20]
    edge = f"L1620,{n(shore_y(1620) + 22)} "
    for xa, xb in zip(xs, xs[1:]):
        edge += f"Q{n((xa + xb) / 2)},{n(shore_y((xa + xb) / 2) + 34)} {n(xb)},{n(shore_y(xb) + 22)} "
    o.append(f'<g class="s5-wave mv"><path d="{shore} {edge}Z" fill="#b4cbef" opacity=".5"/></g>')
    foam = []
    for xa, xb in zip(xs, xs[1:]):
        foam.append(f"M{n(xa)},{n(shore_y(xa) + 22)} Q{n((xa + xb) / 2)},{n(shore_y((xa + xb) / 2) + 34)} {n(xb)},{n(shore_y(xb) + 22)}")
    o.append(f'<path class="s5-foam mv" d="{" ".join(foam)}" fill="none" stroke="#f4f7ff" stroke-width="3" stroke-linecap="round"/>')
    # 砂の点描・流木・貝
    dots = "".join(f'<circle cx="{n(R.uniform(0, 1600))}" cy="{n(R.uniform(690, 900))}" r="{n(R.uniform(1, 2.4))}"/>' for _ in range(110))
    o.append(f'<g fill="#a8825e" opacity=".5">{dots}</g>')
    o.append('<g transform="translate(318 694) rotate(-8)"><path d="M-70,-8 L64,-14 L72,-2 L-64,6Z" fill="#6a4e3e" stroke="#2e2230" stroke-width="2"/>'
             '<path d="M-52,-4 L46,-9 M-30,1 L20,-2" stroke="#4a3630" stroke-width="2"/></g>'
             '<g transform="translate(902 686) rotate(6)"><path d="M-44,-6 L40,-10 L46,-1 L-40,4Z" fill="#5e4636" stroke="#2e2230" stroke-width="2"/>'
             '<path d="M-30,-2 L28,-6" stroke="#463228" stroke-width="2"/></g>'
             '<path d="M1180,760 q8,-12 16,0Z M1240,800 q6,-9 12,0Z M260,820 q8,-12 16,0Z" fill="#f0dcc8" stroke="#a8825e" stroke-width="1.2"/>')
    # 波打ち際から続く足あと
    steps = []
    for i, (x, y) in enumerate([(820, 664), (782, 672), (748, 680), (712, 690), (680, 698), (648, 706)]):
        s = 1 + i * .06
        steps.append(f'<ellipse cx="{n(x)}" cy="{n(y + (5 if i % 2 else 0))}" rx="{n(7 * s)}" ry="{n(3.2 * s)}" '
                     f'transform="rotate(-14 {n(x)} {n(y)})"/>')
    o.append(f'<g fill="#8c6c58" opacity=".42">{"".join(steps)}</g>')
    # シオン：朝日と反対（左手前）へ伸びる影 → 縁の光 → 人物 → 背中の書の淡い光
    o.append(f'<ellipse cx="{n(S5_AT[0] - 130)}" cy="{n(S5_AT[1] + 22)}" rx="190" ry="26" fill="url(#s5-shadow)" '
             f'transform="rotate(10 {n(S5_AT[0])} {n(S5_AT[1])})"/>')
    o.append(f'<g class="s5-rim">{shion.place(srim, S5_AT, S5_SCALE, S5_ANCHOR)}</g>')
    o.append(shion.place(sbody, S5_AT, S5_SCALE, S5_ANCHOR))
    o.append(f'<g class="s5-bookfade"><circle class="s5-book" cx="{n(bx)}" cy="{n(by)}" r="58" fill="url(#s5-bookg)" opacity=".5"/></g>')
    # かもめ
    o.append('<g class="s5-birdfade"><g class="s5-birds mv">'
             + "".join(f'<g transform="translate({x} {y}) scale({s})"><path class="s5-gull mv" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" '
                       f'fill="none" stroke="#3a3f74" stroke-width="2.6" stroke-linecap="round" style="animation-delay:-{d}s"/></g>'
                       for x, y, s, d in [(1150, 318, 1.0, 0), (1196, 298, .8, .3), (1232, 326, .66, .5)])
             + '</g></g>')
    # 夜の名残り（青紫→金色へ）
    o.append('<rect class="s5-night" width="1600" height="900" fill="url(#s5-nightg)"/>')
    o.append('<g class="s5-stars" fill="#e8ecff">' + "".join(
        f'<circle cx="{n(R.uniform(0, 1600))}" cy="{n(320 * R.random() ** 1.3)}" r="{n(R.uniform(.6, 1.7))}" opacity="{n(R.uniform(.3, .9))}"/>'
        for _ in range(60)) + '</g>')
    o.append("</svg>")
    return "".join(o)
