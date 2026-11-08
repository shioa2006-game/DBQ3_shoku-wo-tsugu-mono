"""職業の書の5冊（農民・料理人・船乗り・鍛冶屋・僧侶）の意匠。SVGストーリームービーで共通に使う（M2・M9）。

各書の表紙の色と紋章、復活のときに光の中に浮かぶ道具の絵。シオンの「職業の書」（深緑の表紙に金の開いた本の紋章）と
見分けがつくよう、表紙の色をそれぞれの職の色にし、紋章は職の道具や印を金（僧侶だけは朱）で描く。
2026-11-08、書の復活（M2）の試作で決めた案（ユーザー確認前）。

座標：紋章は中心 (0, 0)・半径およそ50の枠、道具は中心 (0, 0)・およそ200四方。呼び出し側で位置と倍率を決める。
"""
from helpers import n

INK = "#2a1f16"

BOOKS = {
    # id: 書の名前、表紙（明・中・暗）、紋章の色、道具の名前
    "farmer": {"name": "農民の書", "cover": ("#a37c40", "#7a5a2a", "#4e3818"), "emblem": "#f0cf78", "tool": "鍬"},
    "cook": {"name": "料理人の書", "cover": ("#c4523a", "#9a3324", "#5e1c14"), "emblem": "#f4cf7c", "tool": "鍋"},
    "sailor": {"name": "船乗りの書", "cover": ("#3a72a6", "#1f4f7c", "#12304d"), "emblem": "#ead06c", "tool": "舵輪"},
    "blacksmith": {"name": "鍛冶屋の書", "cover": ("#6a6d74", "#45474d", "#25262a"), "emblem": "#ee9a5e", "tool": "槌"},
    "priest": {"name": "僧侶の書", "cover": ("#fbf7ee", "#e8e1d0", "#b9b09c"), "emblem": "#c8402c", "tool": "薬草", "glow": "#fff0d4"},
}
# 復活の光の色（指定がなければ紋章の色）。僧侶の書は朱の紋章だが、光は癒やしの白にする。
glow = lambda book_id: BOOKS[book_id].get("glow", BOOKS[book_id]["emblem"])
ORDER = ["farmer", "cook", "sailor", "blacksmith", "priest"]


def defs(p, book_id):
    """表紙のグラデーション（id: {p}cover）と、紋章の光（{p}eglow）。"""
    light, mid, dark = BOOKS[book_id]["cover"]
    e = BOOKS[book_id]["emblem"]
    return (f'<linearGradient id="{p}cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{light}"/>'
            f'<stop offset=".55" stop-color="{mid}"/><stop offset="1" stop-color="{dark}"/></linearGradient>'
            f'<radialGradient id="{p}eglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{e}" stop-opacity=".7"/>'
            f'<stop offset="1" stop-color="{e}" stop-opacity="0"/></radialGradient>')


# ---------------------------------------------------------------------------
# 紋章（表紙と、開いたページの中央に光る印）
# ---------------------------------------------------------------------------
def emblem(book_id, color=None, w=4.0):
    c = color or BOOKS[book_id]["emblem"]
    S = f'fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"'
    F = f'fill="{c}"'
    if book_id == "farmer":      # 稲穂
        grains = "".join(f'<ellipse cx="{n(x)}" cy="{n(y)}" rx="5.2" ry="8.4" transform="rotate({a} {n(x)} {n(y)})" {F}/>'
                         for x, y, a in ((6, -38, 30), (14, -28, 40), (20, -16, 52), (24, -3, 64), (-3, -30, -10), (4, -18, 10), (10, -6, 24)))
        return (f'<path d="M-6,46 Q-2,10 10,-26 Q16,-40 4,-48" {S}/>' + grains
                + f'<path d="M-6,40 Q-30,20 -36,-4 M-4,24 Q-22,14 -28,-10" {S}/>')
    if book_id == "cook":        # 湯気の立つ鍋
        return (f'<path d="M-36,0 L36,0 L32,30 Q0,44 -32,30Z" {F}/>'
                f'<path d="M-42,0 L42,0 M-44,6 L-36,6 M36,6 L44,6" {S}/>'
                f'<path d="M-30,-4 Q0,-16 30,-4" {S}/><path d="M-4,-12 L4,-12" {S}/>'
                f'<path d="M-16,-22 Q-24,-32 -16,-42 Q-8,-52 -16,-60 M0,-22 Q-8,-34 0,-44 Q8,-54 0,-62 M16,-22 Q8,-32 16,-42 Q24,-52 16,-60" {S}/>')
    if book_id == "sailor":      # 舵輪
        spokes = " ".join(f"M{n(28 * c_)},{n(28 * s_)} L{n(48 * c_)},{n(48 * s_)}" for c_, s_ in
                          ((1, 0), (.707, .707), (0, 1), (-.707, .707), (-1, 0), (-.707, -.707), (0, -1), (.707, -.707)))
        return (f'<circle r="28" {S}/><circle r="10" {F}/><path d="{spokes}" {S}/>'
                + "".join(f'<circle cx="{n(50 * c_)}" cy="{n(50 * s_)}" r="5" {F}/>' for c_, s_ in
                          ((1, 0), (.707, .707), (0, 1), (-.707, .707), (-1, 0), (-.707, -.707), (0, -1), (.707, -.707))))
    if book_id == "blacksmith":  # 金床と槌
        return (f'<path d="M-40,8 L28,8 Q46,8 48,-2 L18,-2 L18,-12 L-36,-12 L-36,-2 L-44,-2Z" {F}/>'
                f'<path d="M-18,8 L-24,30 L24,30 L18,8 M-30,30 L30,30" {S}/>'
                f'<path d="M-6,-24 L30,-58" {S}/><path d="M18,-66 L40,-44 L32,-36 L10,-58Z" {F}/>')
    if book_id == "priest":      # しずくと葉（癒やし）
        return (f'<path d="M0,-50 C14,-30 30,-12 30,8 C30,26 16,40 0,40 C-16,40 -30,26 -30,8 C-30,-12 -14,-30 0,-50Z" {S}/>'
                f'<path d="M-12,22 Q-2,-2 18,-14 Q14,12 -12,22Z" {F}/><path d="M-12,22 Q0,8 10,-4" fill="none" stroke="#fff6ea" stroke-width="2"/>'
                f'<circle r="58" {S} opacity=".55"/>')
    raise KeyError(book_id)


# ---------------------------------------------------------------------------
# 本（閉じた表紙・見開きのページ）。本の中心 (0, 0)、ページ1枚は幅 W・高さ H。
# ---------------------------------------------------------------------------
W, H = 300, 390


def cover(p, book_id):
    """閉じた本の表紙（右開き：背は左）。表紙の紋章つき。"""
    e = BOOKS[book_id]["emblem"]
    return (f'<rect x="{-W / 2 - 6}" y="{-H / 2 - 6}" width="{W + 12}" height="{H + 12}" rx="14" fill="{BOOKS[book_id]["cover"][2]}" stroke="{INK}" stroke-width="4"/>'
            f'<rect x="{-W / 2}" y="{-H / 2}" width="{W}" height="{H}" rx="10" fill="url(#{p}cover)" stroke="{INK}" stroke-width="3"/>'
            f'<rect x="{-W / 2 + 18}" y="{-H / 2 + 18}" width="{W - 36}" height="{H - 36}" rx="6" fill="none" stroke="{e}" stroke-width="3" opacity=".85"/>'
            f'<rect x="{-W / 2 + 26}" y="{-H / 2 + 26}" width="{W - 52}" height="{H - 52}" rx="4" fill="none" stroke="{e}" stroke-width="1.5" opacity=".6"/>'
            f'<path d="M{-W / 2 + 10},{-H / 2 + 4} L{-W / 2 + 10},{H / 2 - 4}" stroke="{INK}" stroke-width="3" opacity=".5"/>'
            f'<g transform="scale(1.85)">{emblem(book_id, w=3.4)}</g>')


def inner_cover(p, book_id):
    """開いた表紙の内側（左のページの下に見える、表紙の裏）。"""
    light, mid, dark = BOOKS[book_id]["cover"]
    return (f'<rect x="{-W - 10}" y="{-H / 2 - 6}" width="{W + 10}" height="{H + 12}" rx="14" fill="{dark}" stroke="{INK}" stroke-width="4"/>'
            f'<rect x="{-W + 4}" y="{-H / 2 + 6}" width="{W - 10}" height="{H - 12}" rx="6" fill="{mid}" opacity=".55"/>')


def pages(p):
    """白紙の見開き（左右のページと、紙の重なり）。"""
    return (f'<path d="M0,{-H / 2 + 6} Q{-W * .5},{-H / 2 - 10} {-W + 8},{-H / 2 + 2} L{-W + 8},{H / 2 - 4} Q{-W * .5},{H / 2 - 16} 0,{H / 2} Z" '
            f'fill="#fbf6e6" stroke="{INK}" stroke-width="3"/>'
            f'<path d="M0,{-H / 2 + 6} Q{W * .5},{-H / 2 - 10} {W - 8},{-H / 2 + 2} L{W - 8},{H / 2 - 4} Q{W * .5},{H / 2 - 16} 0,{H / 2} Z" '
            f'fill="#fdf9ec" stroke="{INK}" stroke-width="3"/>'
            f'<path d="M0,{-H / 2 + 6} L0,{H / 2}" stroke="#c9bfa3" stroke-width="4"/>'
            f'<path d="M{-W + 14},{H / 2 - 2} Q{-W * .5},{H / 2 - 12} -4,{H / 2 + 4} M{W - 14},{H / 2 - 2} Q{W * .5},{H / 2 - 12} 4,{H / 2 + 4}" '
            f'fill="none" stroke="#d8ccae" stroke-width="2.4"/>')


def text_lines(cls, side, count=7, color="#d9a83a"):
    """ページに戻る光の文字（字ではなく、筆の線の並び）。side=-1 左のページ、1 右のページ。行ごとに cls と遅れ（--i）を付ける。"""
    o = []
    x0, x1 = (-W + 44, -30) if side < 0 else (30, W - 44)
    for i in range(count):
        y = -H / 2 + 60 + i * 42
        if side > 0 and 2 <= i <= 4:      # 右のページの中央は紋章の場所
            continue
        segs = []
        x = x0
        k = 0
        while x < x1 - 20:
            w = 18 + ((i * 7 + k * 13) % 5) * 7
            segs.append(f"M{n(x)},{n(y)} q{n(w / 2)},{n(-5 + (k % 3) * 3)} {n(w)},0")
            x += w + 9
            k += 1
        o.append(f'<path class="{cls}" d="{" ".join(segs)}" fill="none" stroke="{color}" stroke-width="4" stroke-linecap="round" '
                 f'pathLength="1" style="--i:{i + (0 if side < 0 else count)}"/>')
    return "".join(o)


# ---------------------------------------------------------------------------
# 道具（光の中に浮かぶ）
# ---------------------------------------------------------------------------
WOOD, WOOD_DARK, IRON, IRON_DARK, BRASS = "#c99c5f", "#7c5730", "#9aa0a6", "#4c5156", "#d9b545"


def tool(book_id):
    if book_id == "farmer":      # 鍬
        return (f'<path d="M-70,80 L54,-64" stroke="{INK}" stroke-width="20" stroke-linecap="round"/>'
                f'<path d="M-70,80 L54,-64" stroke="{WOOD}" stroke-width="13" stroke-linecap="round"/>'
                f'<path d="M36,-78 L70,-48 L96,-2 L64,8 L46,-34 L24,-56Z" fill="{IRON}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
                f'<path d="M64,8 L96,-2" stroke="#e9eef2" stroke-width="4"/>')
    if book_id == "cook":        # 鉄鍋とふた
        return (f'<path d="M-92,-6 L92,-6 L80,54 Q0,86 -80,54Z" fill="{IRON_DARK}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
                f'<path d="M-86,10 Q0,26 86,10" fill="none" stroke="#7d848a" stroke-width="4"/>'
                f'<path d="M-104,-6 L-92,-6 M92,-6 L104,-6" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
                f'<path d="M-84,-10 Q0,-56 84,-10Z" fill="{WOOD}" stroke="{INK}" stroke-width="5"/>'
                f'<path d="M-14,-46 L14,-46 L10,-36 L-10,-36Z" fill="{WOOD_DARK}" stroke="{INK}" stroke-width="4"/>')
    if book_id == "sailor":      # 舵輪
        spokes = "".join(f'<path d="M{n(30 * c)},{n(30 * s)} L{n(96 * c)},{n(96 * s)}" stroke="{INK}" stroke-width="14" stroke-linecap="round"/>'
                         f'<path d="M{n(30 * c)},{n(30 * s)} L{n(96 * c)},{n(96 * s)}" stroke="{WOOD}" stroke-width="8" stroke-linecap="round"/>'
                         for c, s in ((1, 0), (.707, .707), (0, 1), (-.707, .707), (-1, 0), (-.707, -.707), (0, -1), (.707, -.707)))
        return (spokes + f'<circle r="70" fill="none" stroke="{INK}" stroke-width="20"/><circle r="70" fill="none" stroke="{WOOD}" stroke-width="13"/>'
                f'<circle r="26" fill="{BRASS}" stroke="{INK}" stroke-width="5"/><circle r="9" fill="#fff0b0"/>')
    if book_id == "blacksmith":  # 槌
        return (f'<path d="M-60,84 L40,-36" stroke="{INK}" stroke-width="20" stroke-linecap="round"/>'
                f'<path d="M-60,84 L40,-36" stroke="{WOOD}" stroke-width="13" stroke-linecap="round"/>'
                f'<g transform="rotate(40 40 -36)"><rect x="-6" y="-66" width="92" height="56" rx="8" fill="{IRON}" stroke="{INK}" stroke-width="5"/>'
                f'<rect x="-6" y="-66" width="18" height="56" rx="4" fill="{IRON_DARK}"/><rect x="68" y="-66" width="18" height="56" rx="4" fill="{IRON_DARK}"/></g>')
    if book_id == "priest":      # 薬草の束（ひもで結ぶ）
        leaves = "".join(f'<path d="M{n(x)},{n(y)} q{n(18 * d)},-14 {n(34 * d)},-4 q-{n(14 * d)},14 -{n(34 * d)},4Z" fill="#6aa35a" stroke="#2f5a2a" stroke-width="3"/>'
                         for x, y, d in ((-14, -20, -1), (-10, -48, -1), (-4, -74, -1), (12, -30, 1), (16, -58, 1), (8, -86, 1), (-22, 4, -1), (20, -4, 1)))
        return (f'<path d="M-8,90 Q-12,10 -4,-90 M4,90 Q8,0 10,-96 M0,90 Q-20,30 -26,-40" fill="none" stroke="#3f6e3a" stroke-width="7" stroke-linecap="round"/>'
                + leaves + f'<path d="M-22,52 Q0,62 24,52" fill="none" stroke="#c8402c" stroke-width="9" stroke-linecap="round"/>'
                f'<path d="M0,58 q-14,16 -8,30 M0,58 q14,16 8,30" fill="none" stroke="#c8402c" stroke-width="5" stroke-linecap="round"/>')
    raise KeyError(book_id)
