"""シーン1（平和の終わり）とシーン2（異変：あふれ出す魔物）のSVG。

各シーンは <svg> の中に <style>（そのシーンの動き）と <defs> を持ち、単独で完結する。
命名規則:
  - id・class はシーン番号の接頭辞（s1-, s2-）を付け、他シーンと衝突させない。
  - アニメーションは .is-active（プレイヤーがシーン開始時に付与）配下でだけ動く。
  - class="mv" は「位置が動くアニメーション」。モーション軽減時は止まり、静止状態でも絵が成立するようにしてある。
"""
import math
import random
from helpers import *

HEAD = ('<svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" '
        'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}">')


# ---------------------------------------------------------------------------
# シーン1：平和の終わり（朝の青・金色。地平に紫の兆し）
#   闇の名残りの雲が割れ、光が大地へ差す。右の岩の上で、剣を掲げる勇者の小さな影（オリジナルの意匠）。
#   田畑と村、遠くの城。平和が訪れた世界の中央、地平の向こうに紫の光がにじみ、終わりに少し陰る。
#   山並み・霞・松・草は以前の第1場面の部品を明るい色で使い、地平の紫は第2場面の裂け目と同じ位置に置く。
# ---------------------------------------------------------------------------
S1_CSS = """
.s1-grass,.s1-flap,.s1-smoke{transform-box:fill-box}
.s1-grass{transform-origin:50% 100%}
.s1-flap{transform-origin:50% 50%}
.s1-smoke{transform-origin:50% 100%}
.is-active .s1-part-l{animation:s1-left 7s cubic-bezier(.3,.1,.4,1) both}
.is-active .s1-part-r{animation:s1-right 7s cubic-bezier(.3,.1,.4,1) both}
.is-active .s1-rays{animation:s1-fadein 3.2s .2s ease-out both}
.is-active .s1-mist-l{animation:s1-mist-l 9s linear both}
.is-active .s1-mist-r{animation:s1-mist-r 9s linear both}
.is-active .s1-birds{animation:s1-birds 6s linear both}
.is-active .s1-flap{animation:s1-flap .5s ease-in-out infinite alternate}
.is-active .s1-tw{animation:s1-tw 2.2s ease-in-out infinite}
.is-active .s1-grass{animation:s1-sway 3.6s ease-in-out infinite alternate}
.is-active .s1-omen{animation:s1-omen 3.4s 1.4s ease-in both}
.is-active .s1-dusk{animation:s1-dusk 2.2s 2.8s ease-in both}
.is-active .s1-smoke{animation:s1-smoke 3.6s ease-out infinite}
.s1-dusk{opacity:0}
@keyframes s1-left{to{transform:translateX(-90px)}}
@keyframes s1-right{to{transform:translateX(90px)}}
@keyframes s1-fadein{from{opacity:0}}
@keyframes s1-mist-l{to{transform:translateX(-70px)}}
@keyframes s1-mist-r{to{transform:translateX(60px)}}
@keyframes s1-birds{from{transform:translate(-50px,12px)}to{transform:translate(90px,-14px)}}
@keyframes s1-flap{to{transform:scaleY(.45)}}
@keyframes s1-tw{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes s1-sway{to{transform:skewX(-5deg)}}
@keyframes s1-omen{from{opacity:0}to{opacity:.95}}
@keyframes s1-dusk{from{opacity:0}to{opacity:.32}}
@keyframes s1-smoke{0%{transform:translateY(0) scale(.6);opacity:0}30%{opacity:.7}100%{transform:translateY(-34px) scale(1.4);opacity:0}}
"""

# 勇者の影（右向き、足もとが原点）。誰とも分からない小さな影絵にする：短い髪、なびくマント、掲げた剣。
HERO_SIL = ("M-15,0 L-9,-44 L-13,-46 L-14,-78 Q-10,-86 0,-86 Q9,-86 12,-80 L20,-98 L26,-112 L31,-110 L27,-94 "
            "L16,-72 L13,-46 L9,-44 L16,0 L7,0 L1,-36 L-5,0Z "
            "M-12,-80 Q-36,-72 -54,-48 Q-62,-30 -70,-14 Q-52,-22 -42,-18 Q-34,-36 -16,-52Z "
            "M-9,-88 C-14,-96 -12,-108 -2,-111 C8,-113 15,-106 13,-97 C12,-91 8,-88 2,-87 C-3,-86 -7,-86 -9,-88Z "
            "M-6,-108 L-1,-118 L2,-110 L8,-116 L9,-106Z")
HERO_SWORD = "M27.4,-112 L31,-111 L44,-176 L41.5,-182 L39,-177Z M21,-109 L37,-105 L36.2,-102 L20.2,-106Z"
HERO_RIM = "M12,-80 L20,-98 L26,-112 M44,-176 L31,-111 M13,-46 L16,0 M13,-97 C12,-91 8,-88 2,-87"


def scene1():
    R = random.Random(7)
    o = [HEAD.format(label="朝の光が雲の切れ間から平和な大地へ差し、岩の上で勇者が剣を掲げている。地平の向こうに紫の光がにじむ")]
    o.append(f"<style>{S1_CSS}</style>")
    far_d, far_r = mountain([(-20, 452), (90, 400), (180, 418), (262, 352), (340, 386), (432, 330), (520, 372),
                             (610, 398), (700, 412), (800, 428), (900, 410), (1000, 366), (1090, 318), (1172, 352),
                             (1250, 300), (1335, 346), (1420, 374), (1505, 336), (1620, 380)], 600, R, rough=0.16)
    midl_d, midl_r = mountain([(-20, 486), (70, 448), (150, 462), (232, 416), (320, 452), (400, 482), (470, 506),
                               (560, 528), (640, 548)], 640, R, rough=0.14)
    midr_d, midr_r = mountain([(960, 550), (1060, 524), (1130, 494), (1210, 456), (1290, 472), (1370, 420),
                               (1450, 446), (1530, 410), (1620, 432)], 640, R, rough=0.14)
    o.append("""<defs>
<linearGradient id="s1-sky" x1="0" y1="0" x2="0" y2="620" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#24407e"/><stop offset=".34" stop-color="#5a7fc0"/><stop offset=".6" stop-color="#a9bde2"/>
 <stop offset=".82" stop-color="#ffe2b0"/><stop offset="1" stop-color="#fff2d4"/></linearGradient>
<radialGradient id="s1-gap" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#fffbe8" stop-opacity=".95"/><stop offset=".3" stop-color="#ffe9b0" stop-opacity=".55"/>
 <stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient>
<linearGradient id="s1-ray" x1="0" y1="0" x2="0" y2="720" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset=".7" stop-color="#fff0c8" stop-opacity=".22"/>
 <stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></linearGradient>
<linearGradient id="s1-far" x1="0" y1="300" x2="0" y2="600" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#8496cc"/><stop offset="1" stop-color="#b3bfe3"/></linearGradient>
<linearGradient id="s1-mid" x1="0" y1="410" x2="0" y2="640" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#46679e"/><stop offset="1" stop-color="#5f8a9c"/></linearGradient>
<linearGradient id="s1-ground" x1="0" y1="540" x2="0" y2="900" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#a9c98a"/><stop offset=".3" stop-color="#7ea764"/><stop offset=".7" stop-color="#4d7f4c"/>
 <stop offset="1" stop-color="#2c5638"/></linearGradient>
<linearGradient id="s1-river" x1="0" y1="560" x2="0" y2="900" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#f4f2e6"/><stop offset=".3" stop-color="#9fc0ea"/><stop offset="1" stop-color="#5f8ccc"/></linearGradient>
<radialGradient id="s1-omen" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#7434c8" stop-opacity=".95"/><stop offset=".45" stop-color="#6a36b4" stop-opacity=".42"/>
 <stop offset="1" stop-color="#4a2a90" stop-opacity="0"/></radialGradient>
<linearGradient id="s1-cloud" x1="0" y1="-60" x2="0" y2="240" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#1c1838"/><stop offset=".7" stop-color="#3a3466"/><stop offset="1" stop-color="#5a4f86"/></linearGradient>
<clipPath id="s1-groundclip"><path d="M0,620 C300,566 520,548 800,546 C1080,548 1300,566 1600,620 L1600,900 L0,900Z"/></clipPath>
</defs>""".replace("</defs>", f'<path id="s1-spark" d="{SPARK}"/></defs>'))
    o.append('<rect width="1600" height="900" fill="url(#s1-sky)"/>')
    # 雲の切れ間から差す光
    o.append('<ellipse cx="800" cy="40" rx="560" ry="300" fill="url(#s1-gap)"/>')
    rays = []
    for a in [-62, -47, -35, -24, -14, -5, 4, 13, 23, 34, 46, 60]:
        a0, a1 = math.radians(90 + a - 2.2), math.radians(90 + a + 2.2)
        rays.append(f"M800,-60 L{n(800 + math.cos(a0) * 1000)},{n(-60 + math.sin(a0) * 1000)} "
                    f"L{n(800 + math.cos(a1) * 1000)},{n(-60 + math.sin(a1) * 1000)}Z")
    o.append(f'<g class="s1-rays"><path d="{" ".join(rays)}" fill="url(#s1-ray)" opacity=".32"/></g>')
    # 割れていく闇の名残りの雲（下側が金色に照る）
    for cls, cx0, cx1, seed_y in [("s1-part-l", -160, 640, 0), ("s1-part-r", 960, 1760, 1)]:
        cs = []
        for k in range(16):
            t = k / 15
            x = cx0 + (cx1 - cx0) * t
            edge = t if cls == "s1-part-l" else 1 - t   # 切れ間に近いほど低く薄い
            cs.append((x + R.uniform(-20, 20), R.uniform(-20, 40) + 60 * (1 - edge), R.uniform(70, 120) * (1.1 - .5 * edge)))
            cs.append((x + R.uniform(-30, 30), R.uniform(90, 150) - 70 * edge, R.uniform(40, 70) * (1 - .4 * edge)))
        o.append(f'<g class="{cls} mv">' + lobes_union(cs, "#ffd98e", 5, "url(#s1-cloud)") + '</g>')
    # 遠くを渡る白い鳥
    birds = []
    for x, y, s, d in [(980, 250, 1.0, 0), (1022, 232, .8, .2), (1060, 262, .7, .35), (1100, 244, .6, .1), (1140, 270, .5, .4)]:
        birds.append(f'<g transform="translate({x} {y}) scale({s})"><path class="s1-flap mv" d="M-14,0 Q-7,-8 0,0 Q7,-8 14,0" '
                     f'fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" style="animation-delay:-{d}s"/></g>')
    o.append(f'<g class="s1-birds mv">{"".join(birds)}</g>')
    # 遠景の山（光を受けた稜線）
    o.append(f'<path d="{far_d}" fill="url(#s1-far)"/>'
             f'<path d="{far_r}" fill="none" stroke="#fff3cf" stroke-width="2" opacity=".6"/>')
    # 地平の向こうの紫の兆し（第2場面の裂け目と同じ位置）
    wisp = [(800 + math.sin(k * .9) * 10 * k / 9, 560 - k * 13, 9 + k * 2.2) for k in range(10)]
    o.append('<g class="s1-omen"><ellipse cx="800" cy="560" rx="380" ry="120" fill="url(#s1-omen)"/>'
             '<ellipse cx="800" cy="600" rx="150" ry="22" fill="#5a2aa0" opacity=".35"/>'
             + lobes_union(wisp, "#a77af0", 3, "#2a1a4a", 'opacity=".85"') + '</g>')
    o.append(f'<g class="s1-mist-l mv" fill="#fff6e0" opacity=".6"><path d="{kasumi(120, 432, 520, 22)}"/>'
             f'<path d="{kasumi(990, 412, 560, 20)}"/></g>')
    # 中景の山
    o.append(f'<path d="{midl_d}" fill="url(#s1-mid)" stroke="#2b456a" stroke-width="2.5" stroke-linejoin="round"/>'
             f'<path d="{midr_d}" fill="url(#s1-mid)" stroke="#2b456a" stroke-width="2.5" stroke-linejoin="round"/>'
             f'<path d="{midl_r}" fill="none" stroke="#ffe7b0" stroke-width="2" opacity=".7"/>'
             f'<path d="{midr_r}" fill="none" stroke="#ffe7b0" stroke-width="2" opacity=".7"/>')
    # 遠くの城（右の丘）
    castle = ("M1196,474 L1196,438 L1190,438 L1200,420 L1210,438 L1204,438 L1204,452 L1222,452 L1222,430 L1216,430 L1229,404 "
              "L1242,430 L1236,430 L1236,452 L1252,452 L1252,440 L1246,440 L1256,424 L1266,440 L1260,440 L1260,474Z")
    o.append(f'<path d="{castle}" fill="#3c5a86" stroke="#2b456a" stroke-width="1.5" stroke-linejoin="round"/>'
             '<path d="M1229,404 L1229,392 L1240,396 L1229,400" fill="#ffe0a0"/>'
             '<path d="M1210,438 L1210,452 M1242,430 L1242,452" stroke="#ffe7b0" stroke-width="1.6" opacity=".7"/>')
    o.append(f'<g class="s1-mist-r mv" fill="#fff6e0" opacity=".45"><path d="{kasumi(400, 520, 420, 18)}"/>'
             f'<path d="{kasumi(1120, 500, 380, 16)}"/></g>')
    # 平原・田畑・川
    o.append('<path d="M0,620 C300,566 520,548 800,546 C1080,548 1300,566 1600,620 L1600,900 L0,900Z" fill="url(#s1-ground)"/>')
    fields = ['<g clip-path="url(#s1-groundclip)" fill="none" stroke="#c9e2a0" stroke-width="2" opacity=".55">']
    for rx, ry, da in [(360, 100, "90 40 140 50"), (470, 135, "160 60 80 40"), (610, 178, "200 70 120 60"),
                       (780, 232, "260 90 160 70"), (980, 300, "300 120 200 80")]:
        fields.append(f'<ellipse cx="800" cy="616" rx="{rx}" ry="{ry}" stroke-dasharray="{da}"/>')
    fields.append('</g>')
    o.append("".join(fields))
    river = ("M610,548 C640,566 700,574 720,592 C744,614 690,636 640,660 C560,700 500,742 470,800 C450,840 446,870 444,900 "
             "L560,900 C560,866 572,836 600,800 C640,750 720,716 770,684 C820,650 836,616 800,592 C776,576 700,566 640,548Z")
    o.append(f'<path d="{river}" fill="url(#s1-river)" opacity=".85"/>'
             '<path d="M640,660 C560,700 500,742 470,800 M770,684 C720,716 640,750 600,800" fill="none" stroke="#ffffff" '
             'stroke-width="2" opacity=".45"/>')
    # 村（小さな家と炊事の煙）
    houses, smoke = [], []
    for x, y, s in [(520, 600, 1), (556, 608, .85), (588, 596, .9), (1010, 606, 1), (1046, 598, .8), (1080, 610, .9)]:
        w, h = 22 * s, 14 * s
        houses.append(f'<path d="M{n(x - w / 2)},{n(y)} L{n(x - w / 2)},{n(y - h)} L{n(x)},{n(y - h - 11 * s)} '
                      f'L{n(x + w / 2)},{n(y - h)} L{n(x + w / 2)},{n(y)}Z"/>')
        if s > .88:
            smoke.append(f'<circle class="s1-smoke mv" cx="{n(x + 4)}" cy="{n(y - h - 14 * s)}" r="{n(6 * s)}" '
                         f'style="animation-delay:-{n(R.uniform(0, 3.6))}s"/>')
    o.append(f'<g fill="#3e5a4e" stroke="#2a4038" stroke-width="1.4" stroke-linejoin="round">{"".join(houses)}</g>'
             f'<g fill="#fff8ea" opacity=".8">{"".join(smoke)}</g>')
    # かすかな地割れ（紫の兆しとともに現れる）
    cr = []
    for ang, L in [(178, 220), (196, 160), (163, 180), (5, 240), (-14, 160), (22, 200)]:
        a = math.radians(ang)
        x, y = 800 + math.cos(a) * 110, 604 + math.sin(a) * 18
        pts = [(x, y)]
        for i in range(6):
            x += math.cos(a) * L / 6 + R.uniform(-10, 10)
            y += math.sin(a) * L / 6 * 0.4 + R.uniform(-4, 4)
            pts.append((x, y))
        cr.append(poly_d(pts, close=False))
    o.append(f'<g class="s1-omen" fill="none" stroke-linejoin="round" stroke-linecap="round">'
             f'<path d="{" ".join(cr)}" stroke="#6a34c0" stroke-width="5" opacity=".3"/>'
             f'<path d="{" ".join(cr)}" stroke="#b78aff" stroke-width="1.6" opacity=".75"/></g>')
    o.append(f'<g class="s1-mist-l mv" fill="#f4f8ff" opacity=".35"><path d="{kasumi(-60, 712, 640, 26)}"/>'
             f'<path d="{kasumi(1040, 760, 640, 24)}"/></g>')
    # 前景：左の崖と松（光を受けた縁）
    cliff = "M-10,650 L60,636 L120,652 L176,646 L232,672 L292,694 L340,736 L362,790 L378,900 L-10,900Z"
    o.append(f'<path d="{cliff}" fill="#ffe0a0" opacity=".8" transform="translate(3 -3)"/>'
             f'<path d="{cliff}" fill="#1e3a36" stroke="#10221f" stroke-width="3" stroke-linejoin="round"/>')
    trunk = ("M96,662 C112,612 128,562 168,530 C196,508 214,488 238,472 C262,458 286,452 304,444 L312,456 "
             "C290,466 266,474 248,488 C226,506 206,528 190,552 C168,588 150,628 140,666Z "
             "M250,480 C300,470 360,474 424,490 L420,499 C360,488 300,486 254,492Z "
             "M214,502 C206,470 212,440 234,416 L242,423 C224,446 220,472 226,502Z")
    o.append(f'<path d="{trunk}" fill="#2e2a26" stroke="#141210" stroke-width="2.5" stroke-linejoin="round"/>')
    pads = [(222, 458, 176, 46, 6), (356, 498, 140, 40, 5), (178, 428, 116, 38, 4), (106, 552, 104, 32, 4),
            (292, 418, 118, 34, 4), (420, 500, 70, 26, 3)]
    pd = " ".join(cloud(x, y, w, h, l, R, zig=9) for x, y, w, h, l in pads)
    o.append(f'<path d="{pd}" fill="#ffe0a0" opacity=".85" transform="translate(1 -3)"/>'
             f'<path d="{pd}" fill="#24443a" stroke="#10221f" stroke-width="2"/>')
    # 前景：右の岩と、剣を掲げる勇者の影
    rock = "M1610,712 L1528,700 L1462,720 L1404,716 L1344,748 L1296,796 L1276,900 L1610,900Z"
    o.append(f'<path d="{rock}" fill="#ffe0a0" opacity=".75" transform="translate(-3 -3)"/>'
             f'<path d="{rock}" fill="#1e3a36" stroke="#10221f" stroke-width="3" stroke-linejoin="round"/>')
    o.append('<g transform="translate(1486 712) scale(-1.05 1.05)">'
             f'<path d="{HERO_SIL} {HERO_SWORD}" fill="#ffe7a8" opacity=".9" transform="translate(-2.5 -1.5)"/>'
             f'<path d="{HERO_SIL}" fill="#16213a" stroke="#0c1424" stroke-width="2" stroke-linejoin="round"/>'
             f'<path d="{HERO_SWORD}" fill="#dfe7f4" stroke="#0c1424" stroke-width="1.4" stroke-linejoin="round"/>'
             f'<path d="{HERO_RIM}" fill="none" stroke="#ffe7a8" stroke-width="1.6" opacity=".55"/>'
             '<g transform="translate(43 -180) scale(1.5)"><use href="#s1-spark" class="s1-tw" fill="#ffffff"/></g></g>')
    gr = grass(R, 1300, 1600, lambda x: 712 + (1600 - x) * 0.05 if x > 1400 else 760 - (x - 1300) * 0.4, 9, 26, 64, lean=-10)
    gl = grass(R, 0, 300, lambda x: 648 + max(0, x - 180) * 0.4, 10, 20, 52, lean=8)
    o.append(f'<g fill="#1e3a36"><path class="s1-grass mv" d="{gr}"/><path class="s1-grass mv" d="{gl}" '
             'style="animation-delay:-1.4s"/></g>')
    # 終わりに世界が少し陰る（「訪れるはずだった」）
    o.append('<rect class="s1-dusk" width="1600" height="900" fill="#2a1850"/>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------------------
# シーン2：異変（紫・黒）。大地の裂け目から影が立ち上り、魔物の群れが空へ広がる。
#   以前の試作の「大穴」の絵を使う。原因の説明は字幕に加えない（世界観の設定にないため）。
# ---------------------------------------------------------------------------
BAT = ("M0,-14 L4,-21 L6.5,-11 C10,-10 14,-8 16,-6 C28,-18 44,-24 60,-20 C54,-14 52,-8 54,-2 "
       "C47,-6 41,-6 37,0 C32,-5 26,-4 22,4 C17,0 12,2 8,10 C5,16 2,20 0,25 C-2,20 -5,16 -8,10 "
       "C-12,2 -17,0 -22,4 C-26,-4 -32,-5 -37,0 C-41,-6 -47,-6 -54,-2 C-52,-8 -54,-14 -60,-20 "
       "C-44,-24 -28,-18 -16,-6 C-14,-8 -10,-10 -6.5,-11 L-4,-21Z")
WYVERN = ("M-116,-32 L-98,-44 L-72,-74 L-84,-46 L-58,-64 L-70,-40 C-58,-34 -48,-22 -30,-10 "
          "C-20,-30 -5,-70 20,-108 L30,-114 C34,-92 48,-72 70,-54 C58,-52 50,-42 46,-31 C38,-39 28,-33 22,-21 "
          "C16,-27 8,-21 4,-11 C30,-7 60,-1 92,7 C120,13 142,5 158,-8 C152,8 130,26 96,25 C70,23 44,27 26,29 "
          "L30,46 L20,40 L14,49 L8,31 C-8,31 -22,25 -34,11 C-50,1 -66,-11 -84,-21 C-92,-23 -100,-25 -106,-23Z "
          "M-26,-9 C-40,-42 -60,-72 -72,-94 L-62,-60 C-52,-50 -46,-36 -40,-17Z")

S2_CSS = """
.s2-flap,.s2-eye{transform-box:fill-box;transform-origin:50% 45%}
.s2-wisp{transform-origin:800px 420px}
.is-active .s2-fly{animation:s2-fly 3.6s cubic-bezier(.2,.75,.3,1) both}
.is-active .s2-flap{animation:s2-flap .55s ease-in-out infinite alternate}
.is-active .s2-eye{animation:s2-blink 3.2s ease-in-out infinite}
.is-active .s2-erupt{animation:s2-erupt 5.4s cubic-bezier(.2,.6,.3,1) both}
.is-active .s2-wisp{animation:s2-wisp 6s ease-out both}
.is-active .s2-ceil{animation:s2-left 8s linear both}
.is-active .s2-cloud-l{animation:s2-left 8s linear both}
.is-active .s2-cloud-r{animation:s2-right 8s linear both}
.is-active .s2-bolt{animation:s2-bolt .9s 2.7s ease-out both}
.is-active .s2-glow{animation:s2-glow 2.4s ease-in-out infinite}
.is-active .s2-quake{animation:s2-quake 1.1s .15s ease-out both}
.s2-bolt{opacity:0}
@keyframes s2-fly{from{transform:translate(var(--fx),var(--fy)) scale(.3);opacity:0}30%{opacity:1}to{transform:none;opacity:1}}
@keyframes s2-flap{to{transform:scaleY(.7)}}
@keyframes s2-blink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(.1)}}
@keyframes s2-erupt{from{transform:scale(.82,.62)}to{transform:none}}
@keyframes s2-wisp{from{transform:scale(.9)}to{transform:scale(1.04)}}
@keyframes s2-left{to{transform:translateX(-90px)}}
@keyframes s2-right{to{transform:translateX(90px)}}
@keyframes s2-bolt{0%{opacity:0}6%{opacity:1}16%{opacity:.15}26%{opacity:.85}100%{opacity:0}}
@keyframes s2-glow{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes s2-quake{0%,100%{transform:none}12%{transform:translate(-5px,3px)}26%{transform:translate(5px,-2px)}40%{transform:translate(-4px,2px)}56%{transform:translate(3px,-1px)}72%{transform:translate(-2px,1px)}}
"""


def scene2():
    R = random.Random(21)
    o = [HEAD.format(label="地響きとともに大地の裂け目から黒い影が立ち上り、翼をもつ魔物の群れが暗い空へ広がっていく")]
    o.append(f"<style>{S2_CSS}</style>")
    o.append(f"""<defs>
<linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#05020b"/><stop offset=".32" stop-color="#1a0a2a"/>
 <stop offset=".7" stop-color="#3c1658"/><stop offset="1" stop-color="#55206e"/></linearGradient>
<radialGradient id="s2-back" cx=".5" cy=".62" r=".55">
 <stop offset="0" stop-color="#c58cff" stop-opacity=".9"/><stop offset=".35" stop-color="#8a48d8" stop-opacity=".55"/>
 <stop offset=".75" stop-color="#4a1f86" stop-opacity=".15"/><stop offset="1" stop-color="#2a0f50" stop-opacity="0"/></radialGradient>
<radialGradient id="s2-base" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#e2b8ff" stop-opacity=".9"/><stop offset=".4" stop-color="#a45cff" stop-opacity=".4"/>
 <stop offset="1" stop-color="#4a1a7a" stop-opacity="0"/></radialGradient>
<radialGradient id="s2-open" cx=".5" cy=".5" r=".5">
 <stop offset="0" stop-color="#fbe8ff"/><stop offset=".35" stop-color="#c88bff"/><stop offset="1" stop-color="#4a1d7a"/></radialGradient>
<linearGradient id="s2-shadow" x1="0" y1="660" x2="0" y2="40" gradientUnits="userSpaceOnUse">
 <stop offset="0" stop-color="#1c0a2a"/><stop offset=".25" stop-color="#0b0412"/><stop offset="1" stop-color="#07030b"/></linearGradient>
<path id="s2-bat" d="{BAT}"/>
<path id="s2-wyv" d="{WYVERN}"/>
</defs>""")
    o.append('<g class="s2-quake mv">')   # 地響き（始めに少しだけ揺れる）
    o.append('<rect width="1600" height="900" fill="url(#s2-sky)"/>')
    o.append('<rect class="s2-glow" width="1600" height="900" fill="url(#s2-back)"/>')
    o.append('<g fill="#e6d6ff">' + "".join(
        f'<circle cx="{n(R.uniform(0, 1600))}" cy="{n(R.uniform(0, 240))}" r="{n(R.uniform(.5, 1.4))}" opacity="{n(R.uniform(.15, .5))}"/>'
        for _ in range(36)) + '</g>')
    # 遠景の丘
    ld, lr = mountain([(-20, 650), (0, 604), (120, 586), (240, 604), (330, 574), (420, 612), (520, 632), (620, 646)], 720, R, rough=.12)
    rd, rr = mountain([(980, 646), (1080, 622), (1180, 590), (1270, 612), (1360, 570), (1460, 602), (1560, 580), (1620, 600)], 720, R, rough=.12)
    o.append(f'<path d="{ld} {rd}" fill="#1c0c2c" stroke="#08030e" stroke-width="2"/>'
             f'<path d="{lr} {rr}" fill="none" stroke="#b67cf0" stroke-width="2" opacity=".5"/>')
    o.append('<ellipse class="s2-glow" cx="800" cy="650" rx="460" ry="120" fill="url(#s2-base)"/>'
             '<ellipse cx="800" cy="654" rx="380" ry="24" fill="url(#s2-open)"/>')
    # 稲光
    o.append('<g class="s2-bolt mv"><rect width="1600" height="900" fill="#b98aff" opacity=".1"/>'
             '<path d="M1250,10 L1216,80 L1236,88 L1190,166 L1210,174 L1152,256" fill="none" stroke="#c9a0ff" stroke-width="12" opacity=".3" stroke-linejoin="round"/>'
             '<path d="M1250,10 L1216,80 L1236,88 L1190,166 L1210,174 L1152,256 M1216,80 L1282,132" fill="none" stroke="#f3e6ff" stroke-width="3" stroke-linejoin="round"/></g>')
    # 大穴から渦を巻いて立ち上る影の柱（上空の暗雲へつながる）
    col, aura = [], []
    P = ((800, 668), (880, 470), (690, 300), (790, 40))
    for k in range(24):
        t = k / 23
        x, y = bezier(*P, t)
        r = 34 + 92 * t ** 1.15
        side = 1 if k % 2 else -1
        col.append((x + side * r * R.uniform(.3, .55), y + R.uniform(-10, 10), r * R.uniform(.8, 1.05)))
        col.append((x - side * r * R.uniform(.1, .3), y + R.uniform(-14, 14), r * R.uniform(.55, .8)))
        aura.append((x + R.uniform(-20, 20), y, r * 1.45))
    wisps, curl_d = [], []
    for (q0, q1, q2, q3, ra, rb, cw) in [((830, 520), (900, 510), (950, 460), (970, 420), 34, 14, False),
                                        ((760, 400), (680, 400), (630, 350), (610, 310), 38, 14, True),
                                        ((850, 260), (950, 260), (1020, 220), (1040, 180), 44, 16, False)]:
        for k in range(12):
            t = k / 11
            x, y = bezier(q0, q1, q2, q3, t)
            wisps.append((x + R.uniform(-6, 6), y + R.uniform(-6, 6), (ra + (rb - ra) * t) * R.uniform(.75, 1.2)))
        ex, ey = q3
        curl_d.append(spiral(ex, ey, rb * 2.4, turns=1.2, start=(3.4 if cw else 0.2), cw=cw))
    ceiling = [(x, R.uniform(10, 90), R.uniform(70, 125)) for x in range(-80, 1700, 95)]
    ceiling += [(760 + R.uniform(-160, 160), R.uniform(60, 150), R.uniform(80, 120)) for _ in range(5)]
    inner = " ".join([spiral(760, 560, 30, start=.4), spiral(820, 430, 40, cw=False, start=2.2), spiral(740, 330, 50, start=3.1),
                      spiral(820, 200, 60, cw=False, start=1), spiral(420, 60, 50, start=.8), spiral(1220, 70, 56, cw=False)])
    eyes = []
    for _ in range(10):
        t = R.uniform(.05, .55)
        ex, ey = bezier(*P, t)
        ex += R.uniform(-40, 40)
        sc = R.uniform(.7, 1.3)
        eyes.append(f'<g transform="translate({n(ex)} {n(ey)}) scale({n(sc)})"><g class="s2-eye" style="animation-delay:-{n(R.uniform(0, 3))}s">'
                    '<path d="M-11,-1 L-3,1 L-4,3 L-11,1Z M11,-1 L3,1 L4,3 L11,1Z" fill="#ff7ae0"/></g></g>')
    o.append('<g class="s2-ceil mv">' + lobes_union(ceiling, "#9a5ae6", 7, "#0b0513") + '</g>')
    o.append('<g class="s2-erupt mv" style="transform-origin:800px 668px">'
             + '<g fill="#3a1758" opacity=".55">' + "".join(f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(r)}"/>' for x, y, r in aura) + '</g>'
             + '<g class="s2-wisp mv">' + lobes_union(wisps, "#a56af0", 7, "#0d0616")
             + f'<path d="{" ".join(curl_d)}" fill="none" stroke="#0d0616" stroke-width="9" stroke-linecap="round"/>'
             + f'<path d="{" ".join(curl_d)}" fill="none" stroke="#a56af0" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>'
             + lobes_union(col, "#a56af0", 8, "url(#s2-shadow)")
             + f'<path d="{inner}" fill="none" stroke="#3c1a5a" stroke-width="3" stroke-linecap="round"/>'
             + "".join(eyes)
             + '<ellipse class="s2-glow" cx="800" cy="640" rx="110" ry="40" fill="url(#s2-base)"/>'
             + '</g>')
    # 飛び立つ魔物の群れ（明るい空を背景にした影絵）
    groups = [
        (0.15, [("bat", 600, 380, .8, 0), ("bat", 690, 300, .6, 0), ("bat", 960, 330, .7, 0), ("bat", 1010, 430, .55, 0)]),
        (1.0, [("wyv", 330, 250, .95, 0), ("bat", 1110, 250, .8, 0), ("bat", 1240, 360, .7, 0), ("bat", 470, 420, .65, 0),
               ("bat", 1330, 470, .5, 0)]),
        (1.9, [("bat", 210, 390, .7, 0), ("bat", 1400, 250, .7, 0), ("bat", 1470, 410, .55, 0), ("bat", 470, 150, .6, 0),
               ("bat", 1180, 120, .55, 0), ("bat", 250, 470, .5, 0)]),
        (2.8, [("wyv", 1320, 150, .6, 1)] + [("bat", R.uniform(80, 1520), R.uniform(70, 330), R.uniform(.22, .4), 0)
                                              for _ in range(18)]),
    ]
    fl = []
    for delay, items in groups:
        for kind, x, y, sc, flip in items:
            fx, fy = (800 - x) * 0.55, (560 - y) * 0.55
            eyes_ = ""
            if kind == "bat" and sc > .5:
                eyes_ = '<circle cx="-3.5" cy="-9" r="1.8" fill="#ff8ae4"/><circle cx="3.5" cy="-9" r="1.8" fill="#ff8ae4"/>'
            ref = {"bat": "s2-bat", "wyv": "s2-wyv"}[kind]
            flap = ' class="s2-flap mv"' if kind == "bat" else ""
            fl.append(f'<g transform="translate({n(x)} {n(y)}) scale({n(sc * (-1 if flip else 1))} {n(sc)})">'
                      f'<g class="s2-fly mv" style="--fx:{n(fx / sc)}px;--fy:{n(fy / sc)}px;animation-delay:{n(delay + R.uniform(0, .5))}s">'
                      f'<g{flap} style="animation-delay:-{n(R.uniform(0, .5))}s"><use href="#{ref}" fill="#07030c" stroke="#b67cf0" '
                      f'stroke-opacity=".5" stroke-width="{n(2 / sc)}"/>{eyes_}</g></g></g>')
    o.append("".join(fl))
    o.append('<g transform="translate(1300 250) scale(-1.75 1.75)"><g class="s2-fly mv" style="--fx:120px;--fy:60px;animation-delay:2.1s">'
             '<use href="#s2-wyv" fill="#040208" stroke="#b67cf0" stroke-opacity=".45" stroke-width="1"/>'
             '<circle cx="-100" cy="-36" r="2.4" fill="#ff8ae4"/></g></g>')
    # 瘴気
    o.append(f'<g class="s2-cloud-r mv" fill="#4a1d62" opacity=".6"><path d="{kasumi(60, 682, 560, 24)}"/>'
             f'<path d="{kasumi(940, 694, 620, 22)}"/></g>')
    # 前景
    fg = "M-10,712 L120,700 L260,708 C420,684 600,674 800,676 C1000,674 1160,688 1330,704 L1480,700 L1610,716 L1610,900 L-10,900Z"
    o.append(f'<path d="{fg}" fill="#07030c" stroke="#050208" stroke-width="2"/>'
             '<path d="M260,708 C420,684 600,674 800,676 C1000,674 1160,688 1330,704" fill="none" stroke="#b67cf0" stroke-width="2.5" opacity=".55"/>')
    rk = ("M-20,900 L-20,744 L40,730 L96,742 L150,736 L206,764 L248,812 L262,900Z "
          "M1620,900 L1620,742 L1560,734 L1500,752 L1440,750 L1390,786 L1362,840 L1350,900Z")
    o.append(f'<path d="{rk}" fill="#9a5ae6" opacity=".35" transform="translate(0 -3)"/>'
             f'<path d="{rk}" fill="#040207" stroke="#020103" stroke-width="3" stroke-linejoin="round"/>')
    o.append(f'<g class="s2-cloud-l mv" fill="#2a1038" opacity=".7"><path d="{kasumi(260, 790, 520, 30)}"/>'
             f'<path d="{kasumi(1000, 820, 480, 26)}"/></g>')
    o.append("</g></svg>")
    return "".join(o)
