"""ダーマ再興編の始まり「始まりの場所」の小道具。

  temple_remains   崩れた神殿跡（共通部品 ../../shared/temple.py。M7の最後の場面の影と同じ形）。ここから使えるように取り込む。
  isle             ダーマの島：左で海に接し、右の奥へ山が重なって続く島影。山腹に神殿跡を小さく置く。
  isle_foot        神殿跡の真下の麓：浜、麓の集落、島を左右に横切る谷、神殿跡の正面へまっすぐ上る坂道。
  old_pier         古い桟橋（板の欠けた、潮で白っぽくなった木の桟橋。焼けてはいない）。浜から手前の沖へ伸びる。
  stair_path       神殿跡へ上る古い水運びの坂道（石段）。
  terrace          基壇を載せた古い石積みの台。terrace_steps はその正面の中央の石段。
  broken_bridge    谷に架かっていた橋の残り（渡る向きに見る）。

島の並びは、第6～7章のゲームの地形（dqb3-tsugumono-ch6-7/docs/DESIGN.md の「2. マップ」）に合わせる：
海の側（南）から見て、浜の中央から手前へ桟橋、船は桟橋の左、浜のすぐ奥に集落、その奥に島を横切る谷と橋、
坂道は神殿跡の正面へまっすぐ上る。

座標は viewBox="0 0 1600 900"。乱数は呼び出し側の固定シード。
"""
from helpers import n, poly_d, subdivide, smooth_d
from temple import INK, DAY, FAR, temple_remains, place_remains  # 神殿跡は共通部品（../../shared/temple.py）

WOOD = "#b49a74"          # 潮で白っぽくなった板
WOOD_DARK = "#6f5a40"
WOOD_INK = "#3b2a1c"


def isle(p, R, x0, sea_y, ranges, shore_cls="", clip_id=None):
    """ダーマの島：左（x0 付近）で海に接し、右の奥へ山が重なって続く。
    ranges: [(稜線のキーポイント, 色, 稜線の明るい縁の色, 縁の不透明度)] を奥から手前へ。
    返り値は (描画, 手前の山の稜線の点)。稜線の点は ridge_y() で、道や神殿跡を山の斜面の内側に置くのに使う。
    clip_id を渡すと、手前の山の形の切り抜き（clipPath）も描画に入れる（道がはみ出さないように）。"""
    o, front = [], None
    for keys, color, rim, rim_op in ranges:
        ridge = subdivide(keys, R, 3, .12)          # helpers.mountain と同じ作り方（点も使うので展開）
        body = poly_d([(ridge[0][0], sea_y + 2)] + ridge + [(ridge[-1][0], sea_y + 2)])
        front = (body, ridge)
        o.append(f'<path d="{body}" fill="{color}"/>')
        if rim:
            o.append(f'<path d="{poly_d(ridge, close=False)}" fill="none" stroke="{rim}" stroke-width="2.4" opacity="{rim_op}" stroke-linejoin="round"/>')
    if clip_id:
        o.append(f'<defs><clipPath id="{clip_id}"><path d="{front[0]}"/></clipPath></defs>')
    # 波打ち際（左の浜）
    o.append(f'<path class="{shore_cls}" d="M{n(x0 - 20)},{n(sea_y + 1)} Q{n(x0 + 80)},{n(sea_y - 3)} {n(x0 + 200)},{n(sea_y + 1)}" '
             f'fill="none" stroke="#fff8e6" stroke-width="3" opacity=".75"/>')
    return "".join(o), front[1]


def ridge_y(ridge, x):
    """稜線の点（左から右）の、x での高さ（直線でつないだもの）。"""
    for (x0, y0), (x1, y1) in zip(ridge, ridge[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0 or 1)
    return ridge[0][1] if x < ridge[0][0] else ridge[-1][1]


def base_below_ridge(ridge, x, half, margin):
    """幅 2*half の基壇を x に置くとき、基壇の下端の高さ。基壇の幅全体で稜線より margin だけ下になるようにする。"""
    return max(ridge_y(ridge, x + half * (i / 4 - 1)) for i in range(9)) + margin


def isle_foot(cx, base_y, shore_y, u, clip_id):
    """神殿跡の真下の麓（海から見た並び。ゲームの地形に合わせる）：浜、麓の集落（かやぶきの小さな家が三軒と畑）、
    島を左右に横切る谷、浜から集落と谷の落ちた橋を経て、神殿跡の正面へまっすぐ上る水運びの坂道。
    cx は神殿跡の中央、base_y は基壇の下端、shore_y は波打ち際。u は場面3の 1px にあたる長さ（場面5は大きく置く）。
    山の斜面の内側だけに描く（clip_id は isle() の切り抜き）。"""
    X = lambda dx: n(cx + dx * u)
    Y = lambda y0, dy=0.0: n(y0 + dy * u)
    vy = base_y + (shore_y - base_y) * .5                      # 谷の高さ（集落と神殿跡の間）
    o = [f'<g clip-path="url(#{clip_id})">']
    # 浜（神殿跡の真下）
    o.append(f'<path d="M{X(-96)},{Y(shore_y, 2)} C{X(-60)},{Y(shore_y, -8)} {X(64)},{Y(shore_y, -9)} {X(108)},{Y(shore_y, 2)}Z" '
             f'fill="#e6d8b4" opacity=".92"/>')
    # 谷（島を左右に横切る。奥の岸に明るい縁）
    valley = (f'M{X(-340)},{Y(vy, 10)} C{X(-200)},{Y(vy, -3)} {X(-90)},{Y(vy, 3)} {X(0)},{Y(vy)} '
              f'C{X(90)},{Y(vy, -3)} {X(200)},{Y(vy, 2)} {X(430)},{Y(vy, -10)}')
    o.append(f'<path d="{valley}" fill="none" stroke="#486459" stroke-width="{n(5 * u)}" stroke-linecap="round"/>'
             f'<path d="{valley}" transform="translate(0 {n(-2.8 * u)})" fill="none" stroke="#cfe0c8" stroke-width="{n(.8 * u)}" opacity=".5"/>')
    # 坂道：浜 → 集落 → 谷の橋（落ちている）→ 神殿跡の正面
    lower = [(cx, shore_y - 4 * u), (cx + 3 * u, shore_y - 16 * u), (cx - 2 * u, vy + 12 * u), (cx, vy + 3.4 * u)]
    upper = [(cx, vy - 3.4 * u), (cx + 5 * u, vy - 14 * u), (cx - 4 * u, base_y + 13 * u), (cx, base_y + 1)]
    for pts in (lower, upper):
        o.append(stair_path(None, pts, w=2.6 * u, pal=FAR, steps=False, edge="#5f7f70"))
    for d0, d1 in ((3.6, 1.7), (-3.6, -1.9)):                  # 両岸に残った橋板の端
        o.append(f'<path d="M{X(0)},{Y(vy, d0)} L{X(0)},{Y(vy, d1)}" stroke="{WOOD_DARK}" stroke-width="{n(3.2 * u)}"/>')
    # 麓の集落：坂道の左に二軒、右に一軒と畑
    sw = n(max(.8, .5 * u))
    o.append(f'<path d="M{X(30)},{Y(shore_y, -9)} L{X(48)},{Y(shore_y, -9)} L{X(46)},{Y(shore_y, -14)} L{X(28)},{Y(shore_y, -14)}Z" fill="#b9b56a"/>'
             f'<path d="M{X(29)},{Y(shore_y, -11.5)} L{X(47)},{Y(shore_y, -11.5)}" stroke="#8f9a52" stroke-width="{sw}"/>')
    for dx, dy in ((-42, -21), (40, -20), (-29, -10)):
        x, y, w = cx + dx * u, shore_y + dy * u, 12 * u
        o.append(f'<path d="M{n(x - w * .5)},{n(y)} L{n(x + w * .5)},{n(y)} L{n(x + w * .5)},{n(y - w * .45)} L{n(x - w * .5)},{n(y - w * .45)}Z" '
                 f'fill="#cfc4a6" stroke="#5d6b62" stroke-width="{sw}"/>'
                 f'<path d="M{n(x - w * .1)},{n(y)} L{n(x - w * .1)},{n(y - w * .28)} L{n(x + w * .1)},{n(y - w * .28)} L{n(x + w * .1)},{n(y)}Z" fill="#5d5444"/>'
                 f'<path d="M{n(x - w * .64)},{n(y - w * .4)} L{n(x - w * .3)},{n(y - w * .98)} L{n(x + w * .3)},{n(y - w * .98)} L{n(x + w * .64)},{n(y - w * .4)}Z" '
                 f'fill="#a99766" stroke="#5d6b62" stroke-width="{sw}" stroke-linejoin="round"/>')
    o.append("</g>")
    return "".join(o)


def old_pier(top, end, w0, w1, posts=4, planks=12, missing=(4, 8)):
    """古い桟橋：浜（top）から手前の沖（end）へ伸びる板の道を、海の側から見る。幅は w0 から w1 へ広がる。
    板が所々欠け、杭に潮の跡。遠景（場面3）では小さく置く。"""
    (x0, y0), (x1, y1) = top, end
    at = lambda t: (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w0 + (w1 - w0) * t)
    sw = n(max(.8, w1 * .035))
    o = []
    for j in range(posts + 1):                                 # 杭（両側）
        x, y, w = at(j / posts)
        pw, h = max(1.2, w * .1), w * .5
        for side in (-1, 1):
            px = x + side * w * .5
            o.append(f'<path d="M{n(px - pw / 2)},{n(y - h * .3)} L{n(px + pw / 2)},{n(y - h * .3)} L{n(px + pw * .4)},{n(y + h * .7)} '
                     f'L{n(px - pw * .4)},{n(y + h * .7)}Z" fill="{WOOD_DARK}" stroke="{WOOD_INK}" stroke-width="{sw}"/>'
                     f'<path d="M{n(px - pw * .4)},{n(y + h * .45)} L{n(px + pw * .4)},{n(y + h * .45)}" stroke="#e8e2d0" stroke-width="{n(pw * .5)}" opacity=".6"/>')
    edge = lambda t, side: (at(t)[0] + side * at(t)[2] * .5, at(t)[1])
    quad = lambda t0, t1: poly_d([edge(t0, -1), edge(t0, 1), edge(t1, 1), edge(t1, -1)])
    o.append(f'<path d="{quad(0, 1)}" fill="{WOOD}" stroke="{WOOD_INK}" stroke-width="{sw}" stroke-linejoin="round"/>')
    for i in range(planks):
        t0, t1 = i / planks, (i + 1) / planks
        if i in missing:
            o.append(f'<path d="{quad(t0 + .012, t1 - .012)}" fill="#3d5f78" opacity=".85"/>')
        (ax, ay), (bx, by) = edge(t0, -1), edge(t0, 1)
        o.append(f'<path d="M{n(ax)},{n(ay)} L{n(bx)},{n(by)}" stroke="#8a7656" stroke-width="{n(max(.6, w1 * .022))}" opacity=".8"/>')
    (ax, ay), (bx, by) = edge(1, -1), edge(1, 1)                # 手前の端の厚み
    o.append(f'<path d="M{n(ax)},{n(ay)} L{n(bx)},{n(by)} L{n(bx)},{n(by + w1 * .1)} L{n(ax)},{n(ay + w1 * .1)}Z" fill="{WOOD_DARK}" '
             f'stroke="{WOOD_INK}" stroke-width="{sw}"/>')
    if w1 > 40:                                                # 係船柱と、ほどけた綱（近くで見るときだけ）
        mx, my = ax + w1 * .16, ay - w1 * .06
        o.append(f'<path d="M{n(mx - 6)},{n(my - 24)} L{n(mx + 6)},{n(my - 24)} L{n(mx + 6)},{n(my + 2)} L{n(mx - 6)},{n(my + 2)}Z" '
                 f'fill="{WOOD_DARK}" stroke="{WOOD_INK}" stroke-width="2.4"/>'
                 f'<path d="M{n(mx)},{n(my - 14)} q-18,8 -8,20 q8,8 -6,16" fill="none" stroke="#c8b48a" stroke-width="3"/>')
    return "".join(o)


def stair_path(R, pts, w=24, pal=DAY, steps=True, edge=None):
    """古い水運びの坂道：pts（下から上へ）を結ぶ石段。縁の線と、段の線（steps）。遠景では steps=False の細い道にする。"""
    d = smooth_d(pts)
    edge = pal["ink"] if edge is None else edge
    o = [f'<path d="{d}" fill="none" stroke="{edge}" stroke-width="{n(w + max(2, w * .18))}" stroke-linecap="round" stroke-linejoin="round"/>',
         f'<path d="{d}" fill="none" stroke="{pal["stone"]}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>']
    if steps:
        o.append(f'<path d="{d}" fill="none" stroke="{pal["shade"]}" stroke-width="{n(w * .7)}" stroke-dasharray="2 {n(w * .7)}" '
                 f'stroke-linecap="butt" opacity=".55"/>')
    return "".join(o)


def terrace(R, x0, x1, top, bottom, pal=DAY):
    """基壇を載せた古い石積みの台（山腹から張り出す）。不ぞろいな石と、上の縁の草。"""
    p = pal
    o = [f'<path d="M{n(x0)},{n(top)} L{n(x1)},{n(top)} L{n(x1 + 40)},{n(bottom)} L{n(x0 - 40)},{n(bottom)}Z" fill="{p["rock"]}" '
         f'stroke="{p["ink"]}" stroke-width="3" stroke-linejoin="round"/>']
    rows, y = [], top
    while y < bottom - 8:
        h = R.uniform(18, 28)
        rows.append((y, min(bottom, y + h)))
        y += h
    for i, (y0, y1) in enumerate(rows):
        t0, t1 = (y0 - top) / (bottom - top), (y1 - top) / (bottom - top)
        a0, b0 = x0 - 40 * t0, x1 + 40 * t0
        o.append(f'<path d="M{n(a0)},{n(y1)} L{n(x1 + 40 * t1)},{n(y1)}" stroke="{p["rock_dark"]}" stroke-width="2.2"/>')
        x = a0 + (R.uniform(10, 40) if i % 2 else R.uniform(40, 70))
        while x < b0 - 16:
            o.append(f'<path d="M{n(x)},{n(y0 + 1)} L{n(x + R.uniform(-3, 3))},{n(y1 - 1)}" stroke="{p["rock_dark"]}" stroke-width="2"/>')
            if R.random() < .25:
                o.append(f'<path d="M{n(x + 4)},{n(y0 + 3)} L{n(x + R.uniform(24, 46))},{n(y0 + 3)}" stroke="{p["rock_light"]}" stroke-width="3" opacity=".8"/>')
            x += R.uniform(44, 80)
    # 右の光と左の影、上の縁の草
    o.append(f'<path d="M{n(x1 - 120)},{n(top)} L{n(x1)},{n(top)} L{n(x1 + 40)},{n(bottom)} L{n(x1 - 90)},{n(bottom)}Z" fill="{p["rock_light"]}" opacity=".35"/>'
             f'<path d="M{n(x0)},{n(top)} L{n(x0 + 90)},{n(top)} L{n(x0 + 50)},{n(bottom)} L{n(x0 - 40)},{n(bottom)}Z" fill="{p["rock_dark"]}" opacity=".3"/>')
    for _ in range(14):
        x = R.uniform(x0 - 30, x1 + 30)
        h = R.uniform(10, 20)
        o.append(f'<path d="M{n(x - 6)},{n(top + 2)} Q{n(x - 4)},{n(top + h)} {n(x - 1)},{n(top + h * 1.2)} M{n(x + 2)},{n(top + 2)} '
                 f'Q{n(x + 3)},{n(top + h * .8)} {n(x + 7)},{n(top + h)}" fill="none" stroke="{p["moss"]}" stroke-width="2.6" stroke-linecap="round"/>')
    return "".join(o)


def terrace_steps(cx, top, bottom, w0, w1, pal=DAY, steps=7):
    """石積みの台の正面の中央を上る石段（坂道が神殿跡の正面へ着くところ）。"""
    p = pal
    o = [f'<path d="M{n(cx - w0 / 2)},{n(top)} L{n(cx + w0 / 2)},{n(top)} L{n(cx + w1 / 2)},{n(bottom)} L{n(cx - w1 / 2)},{n(bottom)}Z" '
         f'fill="{p["stone"]}" stroke="{p["ink"]}" stroke-width="3" stroke-linejoin="round"/>']
    for i in range(1, steps):
        y, w = top + (bottom - top) * i / steps, w0 + (w1 - w0) * i / steps
        o.append(f'<path d="M{n(cx - w / 2 + 2)},{n(y)} L{n(cx + w / 2 - 2)},{n(y)}" stroke="{p["shade"]}" stroke-width="2.6"/>'
                 f'<path d="M{n(cx - w / 2 + 3)},{n(y + 2.4)} L{n(cx + w / 2 - 3)},{n(y + 2.4)}" stroke="{p["light"]}" stroke-width="1.6" opacity=".8"/>')
    return "".join(o)


def broken_bridge(cx, y_far, y_near, w_far, w_near):
    """谷に架かっていた木の橋の残りを、渡る向き（手前から奥）に見る。両岸に板の端と親柱が残り、中ほどは落ちている。"""
    gap = y_near - y_far
    f2, n2 = y_far + gap * .2, y_near - gap * .3
    hf, hn = w_far / 2, w_near / 2
    o = [
        # 奥の岸に残った板
        f'<path d="M{n(cx - hf)},{n(y_far - 3)} L{n(cx + hf)},{n(y_far - 3)} L{n(cx + hf * 1.06)},{n(f2 - 4)} L{n(cx + hf * .3)},{n(f2 + 3)} '
        f'L{n(cx - hf * .2)},{n(f2 - 2)} L{n(cx - hf * 1.06)},{n(f2 + 2)}Z" fill="{WOOD}" stroke="{WOOD_INK}" stroke-width="2.4" stroke-linejoin="round"/>',
        f'<path d="M{n(cx - hf)},{n(y_far + 4)} L{n(cx + hf)},{n(y_far + 4)}" stroke="#8a7656" stroke-width="2"/>',
        # 垂れ下がった板と綱
        f'<path d="M{n(cx + hf * .5)},{n(f2)} L{n(cx + hf * .8)},{n(f2 + gap * .34)}" stroke="{WOOD_DARK}" stroke-width="7" stroke-linecap="round"/>',
        f'<path d="M{n(cx - hf)},{n(y_far - 26)} Q{n(cx - hf * 1.3)},{n(f2)} {n(cx - hf * .9)},{n(f2 + gap * .3)} '
        f'M{n(cx + hf)},{n(y_far - 26)} Q{n(cx + hf * 1.4)},{n(f2 - 4)} {n(cx + hf * 1.2)},{n(f2 + gap * .22)}" fill="none" stroke="#c8b48a" stroke-width="2.4"/>',
        # 手前の岸に残った板
        f'<path d="M{n(cx - hn)},{n(y_near + 4)} L{n(cx + hn)},{n(y_near + 4)} L{n(cx + hn * .94)},{n(n2 + 5)} L{n(cx + hn * .35)},{n(n2 - 4)} '
        f'L{n(cx - hn * .3)},{n(n2 + 6)} L{n(cx - hn * .94)},{n(n2)}Z" fill="{WOOD}" stroke="{WOOD_INK}" stroke-width="2.8" stroke-linejoin="round"/>',
        f'<path d="M{n(cx - hn * .97)},{n(y_near - gap * .14)} L{n(cx + hn * .97)},{n(y_near - gap * .14)}" stroke="#8a7656" stroke-width="2.4"/>',
        f'<path d="M{n(cx - hn)},{n(y_near - 44)} Q{n(cx - hn * 1.25)},{n(n2 - 6)} {n(cx - hn * .8)},{n(n2 - gap * .18)} '
        f'M{n(cx + hn)},{n(y_near - 44)} Q{n(cx + hn * 1.3)},{n(n2 - 10)} {n(cx + hn * 1.1)},{n(n2 - gap * .1)}" fill="none" stroke="#c8b48a" stroke-width="2.8"/>',
    ]
    # 親柱（奥は細く、手前は太く）
    for x, y, h, w in ((cx - hf, y_far, 30, 5), (cx + hf, y_far, 30, 5), (cx - hn, y_near, 50, 8), (cx + hn, y_near, 50, 8)):
        o.append(f'<path d="M{n(x)},{n(y - h)} L{n(x)},{n(y + h * .25)}" stroke="{WOOD_INK}" stroke-width="{w + 3}" stroke-linecap="round"/>'
                 f'<path d="M{n(x)},{n(y - h)} L{n(x)},{n(y + h * .25)}" stroke="{WOOD_DARK}" stroke-width="{w}" stroke-linecap="round"/>')
    return "".join(o)
