"""崩れたダーマ神殿の跡（第6～7章のムービーで共通）。

  temple_remains      昼の神殿跡。プロローグ第3場面の神殿と同じ基壇（三段）と柱の並び（9本・間隔105）の、
                      屋根を失った姿。中央の左右の2本（0から数えて3本目と5本目）だけが柱頭まで立ち、
                      ほかは折れた根元。7本目は倒れて基壇の上に輪切りの石が並ぶ。
  remains_silhouette  同じ形の、夜の遠景の影（塗りつぶしと、月明かりの縁）。火山島編の結末（M7）の最後の場面で使う。
  place_remains       プロローグの座標の神殿跡を、基壇の中央の下端 (800, 592) が指定の位置に来るように縮めて置く。

座標はプロローグのまま（幅1600の場面いっぱい）。第6章の島・神殿の形の手本になるので、M7・M10などで同じものを使う。
"""
from helpers import n

INK = "#4a4236"           # 石の輪郭

# 神殿跡の色（昼の光）と、遠景の色（青みのある霞の中）
DAY = dict(stone="#d9d0be", light="#f2ead9", shade="#a69b8a", dark="#70675a", ink=INK, soot="#3b342d",
           rock="#8b8375", rock_light="#a69e8e", rock_dark="#5f584d", moss="#7f9a55", char="#2c241e")
FAR = dict(stone="#c9cbcf", light="#eef0f0", shade="#9aa2ad", dark="#7a8494", ink="#69728a", soot="#6a7082",
           rock="#7d8899", rock_light="#8f99a8", rock_dark="#6a7486", moss="#7f8f86", char="#5d6476")

COLS = [380 + 105 * i for i in range(9)]   # 柱の中心（プロローグと同じ）
STANDING = (3, 5)                          # 立っている2本
STUMPS = {0: 46, 1: 118, 2: 30, 4: 66, 6: 150, 8: 86}   # 折れた柱の根元の高さ（7本目は倒れて基壇に横たわる）
SHAFT_FOOT, SHAFT_TOP, CAP_TOP = 506, 318, 298
# 基壇の三段（プロローグ・M7と同じ外形）
PLATFORM = ("M270,592 L1330,592 L1330,566 L1300,566 L1300,542 L1270,542 L1270,516 L330,516 L330,542 L300,542 L300,566 "
            "L270,566Z")
BEDROCK = ("M180,900 L214,760 L236,690 L262,618 L270,592 L1330,592 L1342,624 L1374,700 L1396,780 L1420,900Z")


def _jag(R, x0, x1, top, k=10):
    """折れ口のぎざぎざ（左から右へ）。"""
    pts, steps = [], 5
    for j in range(steps + 1):
        x = x0 + (x1 - x0) * j / steps
        pts.append((x, top + R.uniform(-k, k)))
    return " ".join(f"L{n(x)},{n(y)}" for x, y in pts)


def _shaft(c, top, hw0=22, hw1=19):
    """柱の胴（下が太い）。"""
    t = (SHAFT_FOOT - top) / (SHAFT_FOOT - SHAFT_TOP)
    w1 = hw0 + (hw1 - hw0) * t
    return c - hw0, c + hw0, c - w1, c + w1


def temple_remains(R, pal=DAY, grass=True, bedrock=False):
    """崩れた神殿跡（プロローグの座標）。pal は DAY（昼）か FAR（遠景）。
    bedrock=True でプロローグ・M7と同じ岩盤（基壇の下の崖）も描く。山腹に置くときは呼び出し側が地面を描く。"""
    p = pal
    o = []
    if bedrock:
        o += [f'<path d="{BEDROCK}" fill="{p["rock"]}"/>',
              f'<path d="M262,618 L236,690 L214,760 L180,900 L330,900 L300,760 L290,660Z" fill="{p["rock_dark"]}" opacity=".55"/>',
              f'<path d="M1342,624 L1374,700 L1396,780 L1420,900 L1250,900 L1300,760 L1320,660Z" fill="{p["rock_light"]}" opacity=".5"/>']
    # 基壇（三段）：石の目地、上面の光、欠けと割れ
    o.append(f'<path d="{PLATFORM}" fill="{p["stone"]}" stroke="{p["ink"]}" stroke-width="3" stroke-linejoin="round"/>')
    for y0, y1, x0, x1 in ((566, 592, 270, 1330), (542, 566, 300, 1300), (516, 542, 330, 1270)):
        o.append(f'<path d="M{x0},{y0 + 2} L{x1},{y0 + 2}" stroke="{p["light"]}" stroke-width="4" opacity=".9"/>'
                 f'<path d="M{x0},{y1 - 3} L{x1},{y1 - 3}" stroke="{p["shade"]}" stroke-width="5" opacity=".7"/>')
        x = x0 + R.uniform(30, 60)
        while x < x1 - 20:
            o.append(f'<path d="M{n(x)},{y0 + 3} L{n(x)},{y1 - 2}" stroke="{p["shade"]}" stroke-width="2"/>')
            x += R.uniform(58, 86)
    # 欠けた角（左手前・右奥）と、割れ目
    o.append(f'<path d="M270,566 L300,566 L300,574 L288,580 L282,592 L270,592Z" fill="{p["rock"]}" stroke="{p["ink"]}" stroke-width="2.4"/>'
             f'<path d="M1270,516 L1270,530 L1250,526 L1240,516Z" fill="{p["shade"]}"/>'
             f'<path d="M612,542 L622,552 L616,560 L626,566" fill="none" stroke="{p["dark"]}" stroke-width="2.4"/>'
             f'<path d="M1010,566 L1004,576 L1014,584 L1008,592" fill="none" stroke="{p["dark"]}" stroke-width="2.4"/>')
    # 柱：立っている2本と、折れた根元
    for i, c in enumerate(COLS):
        if i in STANDING:
            l0, r0, l1, r1 = _shaft(c, SHAFT_TOP)
            o.append(f'<path d="M{n(l0)},{SHAFT_FOOT} L{n(l1)},{SHAFT_TOP} L{n(r1)},{SHAFT_TOP} L{n(r0)},{SHAFT_FOOT}Z" fill="{p["stone"]}" '
                     f'stroke="{p["ink"]}" stroke-width="3" stroke-linejoin="round"/>'
                     f'<path d="M{n(c + 6)},{SHAFT_FOOT} L{n(c + 5)},{SHAFT_TOP} L{n(r1)},{SHAFT_TOP} L{n(r0)},{SHAFT_FOOT}Z" fill="{p["shade"]}" opacity=".75"/>'
                     f'<path d="M{n(c - 8)},{SHAFT_FOOT - 4} L{n(c - 7)},{SHAFT_TOP + 4} M{n(c - 15)},{SHAFT_FOOT - 4} L{n(c - 13)},{SHAFT_TOP + 4}" '
                     f'stroke="{p["light"]}" stroke-width="2" opacity=".8"/>'
                     # 柱頭（プロローグの柱頭と同じ外形）と、上面の欠け
                     f'<path d="M{c - 34},{CAP_TOP} L{c + 34},{CAP_TOP} L{c + 34},{CAP_TOP + 8} L{c + 30},{SHAFT_TOP} L{c - 30},{SHAFT_TOP} '
                     f'L{c - 34},{CAP_TOP + 8}Z" fill="{p["stone"]}" stroke="{p["ink"]}" stroke-width="3" stroke-linejoin="round"/>'
                     f'<path d="M{c + 12},{CAP_TOP} L{c + 22},{CAP_TOP + 7} L{c + 34},{CAP_TOP + 4} L{c + 34},{CAP_TOP}Z" fill="{p["shade"]}"/>'
                     f'<path d="M{c - 34},{CAP_TOP + 1} L{c + 10},{CAP_TOP + 1}" stroke="{p["light"]}" stroke-width="2.4"/>'
                     # すす（火の跡）と、根元の苔
                     f'<path d="M{n(c - 4)},{SHAFT_FOOT - 120} Q{n(c + 12)},{SHAFT_FOOT - 70} {n(c + 4)},{SHAFT_FOOT - 10} '
                     f'L{n(c + 18)},{SHAFT_FOOT - 10} Q{n(c + 20)},{SHAFT_FOOT - 80} {n(c + 10)},{SHAFT_FOOT - 128}Z" fill="{p["soot"]}" opacity=".32"/>'
                     f'<path d="M{n(l0)},{SHAFT_FOOT} Q{n(c - 10)},{SHAFT_FOOT - 18} {n(c + 4)},{SHAFT_FOOT - 6} Q{n(c + 14)},{SHAFT_FOOT - 14} {n(r0)},{SHAFT_FOOT}Z" '
                     f'fill="{p["moss"]}" opacity=".8"/>')
        elif i in STUMPS:
            top = SHAFT_FOOT - STUMPS[i]
            l0, r0, l1, r1 = _shaft(c, top)
            o.append(f'<path d="M{n(l0)},{SHAFT_FOOT} L{n(l1)},{top} {_jag(R, l1, r1, top - 6, 9)} L{n(r0)},{SHAFT_FOOT}Z" '
                     f'fill="{p["stone"]}" stroke="{p["ink"]}" stroke-width="3" stroke-linejoin="round"/>'
                     f'<path d="M{n(c + 6)},{SHAFT_FOOT} L{n(c + 5)},{top + 4} L{n(r1)},{top + 2} L{n(r0)},{SHAFT_FOOT}Z" fill="{p["shade"]}" opacity=".7"/>'
                     f'<path d="M{n(l0 + 4)},{SHAFT_FOOT} Q{n(c)},{SHAFT_FOOT - 12} {n(r0 - 4)},{SHAFT_FOOT}Z" fill="{p["moss"]}" opacity=".7"/>')
    # 倒れた柱（7本目）：基壇の上に横たわる3つの石の輪切り
    for k, (x, y, w) in enumerate(((1082, 500, 64), (1150, 503, 70), (1224, 498, 58))):
        o.append(f'<path d="M{x},{y - 21} L{x + w},{y - 21} A9,21 0 0 1 {x + w},{y + 21} L{x},{y + 21}Z" fill="{p["stone"]}" '
                 f'stroke="{p["ink"]}" stroke-width="3"/>'
                 f'<ellipse cx="{x}" cy="{y}" rx="9" ry="21" fill="{p["light"]}" stroke="{p["ink"]}" stroke-width="3"/>'
                 f'<path d="M{x + 4},{y + 10} L{x + w},{y + 10}" stroke="{p["shade"]}" stroke-width="5" opacity=".7"/>')
    # 焼け焦げた梁の残り（屋根の木組み）。左の根元に立てかかり、右は基壇から地面へ落ちている
    o.append(f'<path d="M488,388 L500,382 L560,512 L546,516Z" fill="{p["char"]}" stroke="{p["ink"]}" stroke-width="2"/>'
             f'<path d="M1286,520 L1300,512 L1372,600 L1356,608Z" fill="{p["char"]}" stroke="{p["ink"]}" stroke-width="2"/>'
             f'<path d="M760,512 L860,508 L862,516 L758,520Z" fill="{p["char"]}" opacity=".9"/>')
    # 瓦礫（基壇の上と、両端の足元）
    for x0, x1, y, count, big in ((340, 640, 512, 9, 11), (930, 1060, 512, 5, 10), (220, 330, 610, 6, 14), (1300, 1400, 612, 6, 14)):
        for _ in range(count):
            x = R.uniform(x0, x1)
            s = R.uniform(.5, 1) * big
            yy = y + R.uniform(-4, 6)
            o.append(f'<path d="M{n(x - s)},{n(yy)} L{n(x - s * .6)},{n(yy - s * .8)} L{n(x + s * .5)},{n(yy - s)} L{n(x + s)},{n(yy - s * .2)} '
                     f'L{n(x + s * .7)},{n(yy)}Z" fill="{p["stone"] if R.random() < .6 else p["shade"]}" stroke="{p["ink"]}" stroke-width="2"/>')
    if grass:
        for x0, x1, y in ((272, 1328, 592), (302, 1298, 566), (332, 1268, 542)):
            for _ in range(10):
                x = R.uniform(x0, x1)
                h = R.uniform(8, 18)
                o.append(f'<path d="M{n(x - 6)},{y} Q{n(x - 4)},{n(y - h)} {n(x - 1)},{n(y - h * 1.1)} M{n(x)},{y} Q{n(x + 2)},{n(y - h * .9)} '
                         f'{n(x + 6)},{n(y - h)}" fill="none" stroke="{p["moss"]}" stroke-width="2.4" stroke-linecap="round"/>')
    return "".join(o)


def place_remains(markup, at, scale):
    """神殿跡（プロローグの座標）を、基壇の中央の下端 (800, 592) が at に来るように縮めて置く。"""
    x, y = at
    # 倍率は丸めない（n() は小数第1位までなので、0.085 が 0.1 になり、位置と大きさがずれる）
    return f'<g transform="translate({n(x - 800 * scale)} {n(y - 592 * scale)}) scale({round(scale, 4):g})">{markup}</g>'


def remains_silhouette(R, color="#1a2138", rim="#8fa3cf", rim_op=.45, bedrock=True):
    """神殿跡の夜の影（プロローグの座標）。月は左にあるので、縁の光は上面と左の辺に置く。"""
    o = []
    if bedrock:
        o.append(f'<path d="{BEDROCK}" fill="{color}"/>')
    o.append(f'<path d="{PLATFORM}" fill="{color}"/>'
             f'<path d="M270,566 L270,592 M270,566 L300,566 L300,542 L330,542 L330,516 L1270,516" fill="none" stroke="{rim}" '
             f'stroke-width="4" opacity="{rim_op}"/>')
    for i, c in enumerate(COLS):
        if i in STANDING:
            l0, r0, l1, r1 = _shaft(c, SHAFT_TOP)
            o.append(f'<path d="M{n(l0)},{SHAFT_FOOT} L{n(l1)},{SHAFT_TOP} L{n(r1)},{SHAFT_TOP} L{n(r0)},{SHAFT_FOOT}Z" fill="{color}"/>'
                     f'<path d="M{c - 34},{CAP_TOP} L{c + 34},{CAP_TOP} L{c + 34},{CAP_TOP + 8} L{c + 30},{SHAFT_TOP} L{c - 30},{SHAFT_TOP} '
                     f'L{c - 34},{CAP_TOP + 8}Z" fill="{color}"/>'
                     f'<path d="M{n(l0)},{SHAFT_FOOT} L{n(l1)},{SHAFT_TOP} M{c - 34},{CAP_TOP + 8} L{c - 34},{CAP_TOP} L{c + 34},{CAP_TOP}" '
                     f'fill="none" stroke="{rim}" stroke-width="4" opacity="{rim_op}"/>')
        elif i in STUMPS:
            top = SHAFT_FOOT - STUMPS[i]
            l0, r0, l1, r1 = _shaft(c, top)
            o.append(f'<path d="M{n(l0)},{SHAFT_FOOT} L{n(l1)},{top} {_jag(R, l1, r1, top - 6, 9)} L{n(r0)},{SHAFT_FOOT}Z" fill="{color}"/>'
                     f'<path d="M{n(l0)},{SHAFT_FOOT} L{n(l1)},{top}" fill="none" stroke="{rim}" stroke-width="3" opacity="{rim_op * .8}"/>')
    for x, y, w in ((1082, 500, 64), (1150, 503, 70), (1224, 498, 58)):
        o.append(f'<path d="M{x},{y - 21} L{x + w},{y - 21} A9,21 0 0 1 {x + w},{y + 21} L{x},{y + 21} A9,21 0 0 1 {x},{y - 21}Z" fill="{color}"/>')
    o.append(f'<path d="M488,388 L500,382 L560,512 L546,516Z M1286,520 L1300,512 L1372,600 L1356,608Z" fill="{color}"/>')
    return "".join(o)
