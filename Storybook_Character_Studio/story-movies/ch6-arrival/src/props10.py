"""ダーマ再興編の始まり「始まりの場所」の小道具。

  temple_remains   崩れた神殿跡（共通部品 ../../shared/temple.py。M7の最後の場面の影と同じ形）。ここから使えるように取り込む。
  isle             ダーマの島：左で海に接し、右の奥へ山が重なって続く島影。山腹に神殿跡を小さく置く。
  old_pier         古い桟橋（板の欠けた、潮で白っぽくなった木の桟橋。焼けてはいない）。
  stair_path       神殿跡へ上る古い水運びの坂道（石段）と、谷に架かっていた橋の残り。

座標は viewBox="0 0 1600 900"。乱数は呼び出し側の固定シード。
"""
from helpers import n, mountain, smooth_d
from temple import INK, DAY, FAR, temple_remains, place_remains  # 神殿跡は共通部品（../../shared/temple.py）

WOOD = "#b49a74"          # 潮で白っぽくなった板
WOOD_DARK = "#6f5a40"
WOOD_INK = "#3b2a1c"


def isle(p, R, x0, sea_y, ranges, shore_cls=""):
    """ダーマの島：左（x0 付近）で海に接し、右の奥へ山が重なって続く。
    ranges: [(稜線のキーポイント, 色, 稜線の明るい縁の色, 縁の不透明度)] を奥から手前へ。返り値は描画。"""
    o = []
    for keys, color, rim, rim_op in ranges:
        body, ridge = mountain(keys, sea_y + 2, R, depth=3, rough=.12)
        o.append(f'<path d="{body}" fill="{color}"/>')
        if rim:
            o.append(f'<path d="{ridge}" fill="none" stroke="{rim}" stroke-width="2.4" opacity="{rim_op}" stroke-linejoin="round"/>')
    # 波打ち際（左の浜）
    o.append(f'<path class="{shore_cls}" d="M{n(x0 - 20)},{n(sea_y + 1)} Q{n(x0 + 80)},{n(sea_y - 3)} {n(x0 + 200)},{n(sea_y + 1)}" '
             f'fill="none" stroke="#fff8e6" stroke-width="3" opacity=".75"/>')
    return "".join(o)


def old_pier(R, x_shore, x_end, y, depth=28, posts=6, missing=(2, 5)):
    """古い桟橋：右の浜（x_shore）から左の沖（x_end）へ伸びる板の道。板が所々欠け、杭に潮の跡。"""
    o = []
    span = (x_shore - x_end) / posts
    # 杭（手前と奥の2列）
    for j in range(posts + 1):
        x = x_end + span * j
        for dy, op in ((-6, .7), (depth, 1)):
            o.append(f'<path d="M{n(x - 6)},{n(y + dy - 4)} L{n(x + 6)},{n(y + dy - 4)} L{n(x + 5)},{n(y + dy + 58)} L{n(x - 5)},{n(y + dy + 58)}Z" '
                     f'fill="{WOOD_DARK}" stroke="{WOOD_INK}" stroke-width="2.4" opacity="{op}"/>'
                     f'<path d="M{n(x - 5)},{n(y + dy + 40)} L{n(x + 5)},{n(y + dy + 40)}" stroke="#e8e2d0" stroke-width="5" opacity="{op * .6}"/>')
    # 板（欠けたところは隙間）
    o.append(f'<path d="M{n(x_end)},{n(y)} L{n(x_shore)},{n(y)} L{n(x_shore + 10)},{n(y + depth)} L{n(x_end - 6)},{n(y + depth)}Z" '
             f'fill="{WOOD}" stroke="{WOOD_INK}" stroke-width="3" stroke-linejoin="round"/>')
    for j in range(posts * 3):
        x = x_end + span / 3 * j
        if j // 3 in missing and j % 3 == 1:
            o.append(f'<path d="M{n(x)},{n(y + 1)} L{n(x + span / 3)},{n(y + 1)} L{n(x + span / 3 + 3)},{n(y + depth - 1)} L{n(x + 2)},{n(y + depth - 1)}Z" '
                     f'fill="#3d5f78" opacity=".85"/>')
        o.append(f'<path d="M{n(x)},{n(y + 1)} L{n(x + 2)},{n(y + depth - 1)}" stroke="#8a7656" stroke-width="2" opacity=".8"/>')
    o.append(f'<path d="M{n(x_end)},{n(y)} L{n(x_shore)},{n(y)}" stroke="#ece2c8" stroke-width="3" opacity=".7"/>')
    # 係船柱と、ほどけた綱
    o.append(f'<path d="M{n(x_end + 18)},{n(y - 22)} L{n(x_end + 30)},{n(y - 22)} L{n(x_end + 30)},{n(y + 4)} L{n(x_end + 18)},{n(y + 4)}Z" '
             f'fill="{WOOD_DARK}" stroke="{WOOD_INK}" stroke-width="2.4"/>'
             f'<path d="M{n(x_end + 24)},{n(y - 14)} q-18,10 -6,22 q10,8 -4,18" fill="none" stroke="#c8b48a" stroke-width="3"/>')
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


def broken_bridge(x0, x1, y, pal=DAY):
    """谷に架かっていた木の橋の残り（両岸に板の端が残り、中ほどは落ちている）。"""
    mid0, mid1 = x0 + (x1 - x0) * .32, x0 + (x1 - x0) * .7
    return (f'<path d="M{n(x0)},{n(y)} L{n(mid0)},{n(y + 4)} L{n(mid0 - 6)},{n(y + 18)} L{n(x0)},{n(y + 14)}Z" fill="{WOOD}" stroke="{WOOD_INK}" stroke-width="2.4"/>'
            f'<path d="M{n(mid1)},{n(y + 6)} L{n(x1)},{n(y)} L{n(x1)},{n(y + 14)} L{n(mid1 + 8)},{n(y + 20)}Z" fill="{WOOD}" stroke="{WOOD_INK}" stroke-width="2.4"/>'
            f'<path d="M{n(mid0 - 2)},{n(y + 8)} L{n(mid0 + 18)},{n(y + 70)}" stroke="{WOOD_DARK}" stroke-width="7" stroke-linecap="round"/>'
            f'<path d="M{n(x0 + 6)},{n(y - 30)} L{n(x0 + 6)},{n(y + 12)} M{n(x1 - 6)},{n(y - 30)} L{n(x1 - 6)},{n(y + 12)}" '
            f'stroke="{WOOD_DARK}" stroke-width="6" stroke-linecap="round"/>'
            f'<path d="M{n(x0 + 6)},{n(y - 28)} Q{n(mid0)},{n(y - 8)} {n(mid0 + 10)},{n(y + 30)} M{n(x1 - 6)},{n(y - 28)} Q{n(mid1)},{n(y - 6)} '
            f'{n(mid1 - 6)},{n(y + 26)}" fill="none" stroke="#c8b48a" stroke-width="2.6"/>')
