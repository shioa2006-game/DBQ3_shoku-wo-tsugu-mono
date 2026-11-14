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


# ---------------------------------------------------------------------------
# 再建した神殿（第6章の完成後）。同じ三段の基壇と柱の並びの上に、石造りの本堂と木組みの大屋根。
# 残った二本の柱（3本目と5本目）は正面の入口の両脇に生かし、中央（4本目の位置）を入口にする。
# 座標はプロローグのまま（崩れた神殿跡と重ねると、基壇と柱の位置がそろう）。M11・M14 などで使い、ゲームの設計図の手本になる。
# ---------------------------------------------------------------------------
REBUILT_DAY = dict(stone="#d8cfbd", stone_light="#efe6d4", stone_shade="#a99e8c", old="#c4b89f", old_shade="#938670",
                   wood="#9a6a3c", wood_dark="#5e3e22", wood_light="#c4945c", roof="#7a4e2c", roof_light="#a8744a",
                   roof_dark="#4e301a", ink="#3e3226", window="#4a3a2e", door="#f6dfae", gold="#d9b545", lamp="#f3d9a0", glow=None)
REBUILT_NIGHT = dict(stone="#5d6378", stone_light="#7a8098", stone_shade="#43485c", old="#565a6c", old_shade="#3d4152",
                     wood="#4b3a33", wood_dark="#2a201c", wood_light="#6c5446", roof="#3a2c2a", roof_light="#5a4540",
                     roof_dark="#211816", ink="#121320", window="#ffcf7a", door="#ffd890", gold="#f0c860", lamp="#ffd98a",
                     glow="#ffb24a")
WALL_TOP, WALL_LEFT, WALL_RIGHT = 336, 340, 1260
EAVE_Y, RIDGE_Y = 278, 112
EAVE_D = "M190,262 Q222,276 300,278 L1300,278 Q1378,276 1410,262"
ROOF_D = "M190,262 Q222,276 300,278 L1300,278 Q1378,276 1410,262 Q1290,172 1140,122 L460,122 Q310,172 190,262Z"


def book_emblem(cx, cy, r, gold, ink):
    """職業の書の紋章（金の円に開いた本）。破風の飾りと祭壇の要石に使う。"""
    return (f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{gold}" stroke="{ink}" stroke-width="{n(max(1.2, r * .12))}"/>'
            f'<path d="M{n(cx)},{n(cy + r * .42)} Q{n(cx - r * .35)},{n(cy + r * .2)} {n(cx - r * .62)},{n(cy + r * .36)} L{n(cx - r * .62)},{n(cy - r * .32)} '
            f'Q{n(cx - r * .35)},{n(cy - r * .48)} {n(cx)},{n(cy - r * .26)} Q{n(cx + r * .35)},{n(cy - r * .48)} {n(cx + r * .62)},{n(cy - r * .32)} '
            f'L{n(cx + r * .62)},{n(cy + r * .36)} Q{n(cx + r * .35)},{n(cy + r * .2)} {n(cx)},{n(cy + r * .42)}Z M{n(cx)},{n(cy - r * .26)} L{n(cx)},{n(cy + r * .42)}" '
            f'fill="none" stroke="{ink}" stroke-width="{n(max(1, r * .1))}" stroke-linejoin="round"/>')


def temple_rebuilt(p, R, pal=REBUILT_DAY, lamp_cls="", window_cls=""):
    """再建した神殿（プロローグの座標）。p は id の接頭辞（屋根の切り抜きに使う）。夜は REBUILT_NIGHT（窓と灯りが光る）。"""
    c = pal
    o = []
    # 基壇（崩れた神殿跡と同じ三段。石を継ぎ直してきれいにした）
    o.append(f'<path d="{PLATFORM}" fill="{c["stone"]}" stroke="{c["ink"]}" stroke-width="3" stroke-linejoin="round"/>')
    for y0, y1, x0, x1 in ((566, 592, 270, 1330), (542, 566, 300, 1300), (516, 542, 330, 1270)):
        o.append(f'<path d="M{x0},{y0 + 2} L{x1},{y0 + 2}" stroke="{c["stone_light"]}" stroke-width="4"/>'
                 f'<path d="M{x0},{y1 - 3} L{x1},{y1 - 3}" stroke="{c["stone_shade"]}" stroke-width="4"/>')
    # 本堂の石の壁（段積み）
    o.append(f'<rect x="{WALL_LEFT}" y="{WALL_TOP}" width="{WALL_RIGHT - WALL_LEFT}" height="{516 - WALL_TOP}" fill="{c["stone"]}" '
             f'stroke="{c["ink"]}" stroke-width="3"/>')
    for k, y in enumerate(range(WALL_TOP + 22, 516, 22)):
        o.append(f'<path d="M{WALL_LEFT},{y} L{WALL_RIGHT},{y}" stroke="{c["stone_shade"]}" stroke-width="1.8"/>')
        x = WALL_LEFT + (24 if k % 2 else 48)
        while x < WALL_RIGHT - 10:
            o.append(f'<path d="M{x},{y - 22} L{x},{y}" stroke="{c["stone_shade"]}" stroke-width="1.6"/>')
            x += 50
    # 窓（入口の左右三つずつの柱の間）。夜は灯りがもれる
    for b in (0, 1, 2, 5, 6, 7):
        cx = (COLS[b] + COLS[b + 1]) / 2
        o.append(f'<path class="{window_cls}" d="M{n(cx - 17)},452 L{n(cx - 17)},398 A17,17 0 0 1 {n(cx + 17)},398 L{n(cx + 17)},452Z" '
                 f'fill="{c["window"]}" stroke="{c["wood_dark"]}" stroke-width="4"/>'
                 f'<path d="M{n(cx)},382 L{n(cx)},452 M{n(cx - 17)},420 L{n(cx + 17)},420" stroke="{c["wood_dark"]}" stroke-width="3"/>')
    # 正面の入口（4本目の位置）と、開いた木の扉。奥に祭壇の灯
    o.append(f'<path d="M736,516 L736,410 A64,64 0 0 1 864,410 L864,516Z" fill="{c["door"]}" stroke="{c["ink"]}" stroke-width="3"/>'
             f'<path d="M736,516 L736,412 L700,404 L700,520Z M864,516 L864,412 L900,404 L900,520Z" fill="{c["wood"]}" stroke="{c["ink"]}" stroke-width="2.6"/>'
             f'<path d="M786,516 L786,488 L814,488 L814,516Z" fill="{c["stone_shade"]}" opacity=".7"/>'
             f'<path d="M800,486 Q792,474 800,462 Q808,474 800,486Z" fill="{c["gold"]}"/>')
    # 柱（壁から少し張り出す）。入口の両脇の2本は、崩れずに残った古い柱（色が少し違い、すすの跡が残る）
    for i, cx in enumerate(COLS):
        if i == 4:
            continue
        old = i in STANDING
        body, shade = (c["old"], c["old_shade"]) if old else (c["stone_light"], c["stone_shade"])
        o.append(f'<path d="M{cx - 22},516 L{cx - 20},{WALL_TOP} L{cx + 20},{WALL_TOP} L{cx + 22},516Z" fill="{body}" stroke="{c["ink"]}" stroke-width="3"/>'
                 f'<path d="M{cx + 6},516 L{cx + 5},{WALL_TOP} L{cx + 20},{WALL_TOP} L{cx + 22},516Z" fill="{shade}" opacity=".7"/>'
                 f'<path d="M{cx - 30},{WALL_TOP - 16} L{cx + 30},{WALL_TOP - 16} L{cx + 30},{WALL_TOP - 8} L{cx + 26},{WALL_TOP} L{cx - 26},{WALL_TOP} '
                 f'L{cx - 30},{WALL_TOP - 8}Z" fill="{body}" stroke="{c["ink"]}" stroke-width="3" stroke-linejoin="round"/>')
        if old:
            o.append(f'<path d="M{cx - 4},{516 - 130} Q{cx + 10},{516 - 80} {cx + 2},{516 - 12} L{cx + 16},{516 - 12} Q{cx + 18},{516 - 90} {cx + 8},{516 - 136}Z" '
                     f'fill="{c["ink"]}" opacity=".18"/>')
    # 頭貫（壁の上の木の梁）と、柱の上の組物
    o.append(f'<rect x="{WALL_LEFT - 10}" y="{WALL_TOP - 34}" width="{WALL_RIGHT - WALL_LEFT + 20}" height="18" fill="{c["wood"]}" stroke="{c["ink"]}" stroke-width="3"/>'
             f'<path d="M{WALL_LEFT - 10},{WALL_TOP - 32} L{WALL_RIGHT + 10},{WALL_TOP - 32}" stroke="{c["wood_light"]}" stroke-width="2.4"/>')
    for cx in COLS:
        o.append(f'<path d="M{cx - 18},{WALL_TOP - 34} L{cx - 18},{EAVE_Y + 6} L{cx + 18},{EAVE_Y + 6} L{cx + 18},{WALL_TOP - 34}Z" '
                 f'fill="{c["wood"]}" stroke="{c["ink"]}" stroke-width="2.4"/>'
                 f'<path d="M{cx - 26},{EAVE_Y + 6} L{cx + 26},{EAVE_Y + 6}" stroke="{c["wood_dark"]}" stroke-width="5"/>')
    # 軒下の垂木（木口の並び）
    o.append(f'<path d="M230,{EAVE_Y - 2} L1370,{EAVE_Y - 2} L1370,{EAVE_Y + 8} L230,{EAVE_Y + 8}Z" fill="{c["wood_dark"]}"/>'
             + "".join(f'<rect x="{x}" y="{EAVE_Y}" width="7" height="7" fill="{c["wood_light"]}"/>' for x in range(240, 1364, 18)))
    # 大屋根（木の板葺き）：四隅の反り、葺き板の段、棟と両端の飾り
    clip = f"{p}roofclip"
    o.append(f'<defs><clipPath id="{clip}"><path d="{ROOF_D}"/></clipPath></defs>')
    o.append(f'<path d="{ROOF_D}" fill="{c["roof"]}" stroke="{c["ink"]}" stroke-width="3.4" stroke-linejoin="round"/>')
    courses = "".join(f'<path d="M150,{y} L1450,{y}" stroke="{c["roof_dark"]}" stroke-width="2" opacity=".6"/>' for y in range(138, 276, 14))
    seams = "".join(f'<path d="M{x},122 L{n(x + (x - 800) * .62)},280" stroke="{c["roof_light"]}" stroke-width="1.4" opacity=".35"/>'
                    for x in range(480, 1130, 40))
    o.append(f'<g clip-path="url(#{clip})">{courses}{seams}'
             f'<path d="M460,122 Q310,172 190,262 L232,262 Q336,180 480,130Z M1140,122 Q1290,172 1410,262 L1368,262 Q1264,180 1120,130Z" '
             f'fill="{c["roof_light"]}" opacity=".45"/></g>')
    o.append(f'<path d="{EAVE_D}" fill="none" stroke="{c["roof_dark"]}" stroke-width="10" stroke-linecap="round"/>'
             f'<path d="{EAVE_D}" fill="none" stroke="{c["roof_light"]}" stroke-width="3" transform="translate(0 -4)"/>')
    o.append(f'<path d="M450,{RIDGE_Y + 12} L1150,{RIDGE_Y + 12} L1150,{RIDGE_Y - 8} L450,{RIDGE_Y - 8}Z" fill="{c["roof_dark"]}" stroke="{c["ink"]}" stroke-width="3"/>'
             f'<path d="M440,{RIDGE_Y + 14} L422,{RIDGE_Y - 30} L456,{RIDGE_Y - 10}Z M1160,{RIDGE_Y + 14} L1178,{RIDGE_Y - 30} L1144,{RIDGE_Y - 10}Z" '
             f'fill="{c["roof_dark"]}" stroke="{c["ink"]}" stroke-width="2.6" stroke-linejoin="round"/>')
    # 正面の破風（入口の上）と、職業の書の紋章
    o.append(f'<path d="M666,266 L800,150 L934,266Z" fill="{c["roof_light"]}" stroke="{c["ink"]}" stroke-width="3" stroke-linejoin="round"/>'
             f'<path d="M692,258 L800,166 L908,258Z" fill="{c["wood"]}" stroke="{c["wood_dark"]}" stroke-width="2"/>'
             + "".join(f'<path d="M{x},258 L{x},{n(258 - (108 - abs(x - 800)) * .85)}" stroke="{c["wood_dark"]}" stroke-width="1.6"/>'
                       for x in range(716, 888, 16))
             + book_emblem(800, 220, 20, c["gold"], c["ink"]))
    # 軒の提灯（夜は灯る）
    for x in [COLS[0] - 60] + [(COLS[b] + COLS[b + 1]) / 2 for b in (0, 1, 2, 5, 6, 7)] + [COLS[-1] + 60]:
        if c["glow"]:
            o.append(f'<circle class="{lamp_cls}" cx="{n(x)}" cy="{EAVE_Y + 30}" r="26" fill="{c["glow"]}" opacity=".35"/>')
        o.append(f'<path d="M{n(x)},{EAVE_Y + 8} L{n(x)},{EAVE_Y + 16}" stroke="{c["ink"]}" stroke-width="2"/>'
                 f'<ellipse cx="{n(x)}" cy="{EAVE_Y + 30}" rx="10" ry="14" fill="{c["lamp"]}" stroke="{c["ink"]}" stroke-width="2"/>')
    return "".join(o)
