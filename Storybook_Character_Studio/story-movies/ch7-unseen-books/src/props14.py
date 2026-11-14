"""ダーマ再興編・完「まだ見ぬ書へ」の小道具。

  traveler      神殿を訪れた人（後ろ姿。フードの外套・背負い袋・杖）。名前を持たない人として、顔を描かない
  stone_block   ガンゾウが運ぶ切り石（人物のセル座標で、手の位置に重ねる）
  dharma_isle   船から振り返るダーマの島（左で海に接し、奥へ山が続く。山の肩の平らなところに再建した神殿）
  pier          奥へすぼまる板張りの桟橋（ジパング・火山島の船着き場。人が立つ）
  book_light    船の上の職業の書の光（シオンが背に負う原本。深緑と金の光）

船はM4の props.py、ジパングの小屋・食堂・社・田はM4の props.py、火山島はM5の props5.py、鍛冶場・社・鳥居はM7の
props7.py、再建した神殿は ../../shared/temple.py のものを使う。座標は呼び出し側で置く。
"""
from helpers import n, SPARK
import temple as T

INK = "#3b2a1c"


def traveler(cloak="#6a7a5a", hood="#55644a", staff=True, bag="#8a6436"):
    """訪れた人の後ろ姿（原点は両足の間の地面。背丈は約170）。"""
    o = ['<ellipse cx="0" cy="2" rx="40" ry="8" fill="#000" opacity=".18"/>',
         f'<path d="M-16,0 L-14,-36 L-4,-36 L-4,0Z M4,0 L4,-36 L14,-36 L16,0Z" fill="#4a3a2c" stroke="{INK}" stroke-width="2.4"/>',
         f'<path d="M-30,-30 Q-34,-90 -24,-122 Q0,-134 24,-122 Q34,-90 30,-30 Q0,-22 -30,-30Z" fill="{cloak}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>',
         f'<path d="M-8,-118 Q-12,-80 -10,-34 M10,-118 Q12,-80 10,-34" fill="none" stroke="{INK}" stroke-width="1.6" opacity=".35"/>',
         f'<path d="M-16,-108 L16,-108 L18,-66 L-18,-66Z" fill="{bag}" stroke="{INK}" stroke-width="2.6" stroke-linejoin="round"/>'
         f'<path d="M-16,-96 L18,-96" stroke="{INK}" stroke-width="2" opacity=".5"/>',
         f'<path d="M-24,-148 Q-26,-170 0,-174 Q26,-170 24,-148 Q22,-126 0,-122 Q-22,-126 -24,-148Z" fill="{hood}" stroke="{INK}" stroke-width="3"/>',
         f'<path d="M-18,-150 Q0,-160 18,-150" fill="none" stroke="{INK}" stroke-width="1.6" opacity=".35"/>']
    if staff:
        o.append(f'<path d="M36,4 L28,-176" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>'
                 f'<path d="M36,4 L28,-176" stroke="#a8743f" stroke-width="4" stroke-linecap="round"/>'
                 f'<circle cx="29" cy="-118" r="7" fill="{cloak}" stroke="{INK}" stroke-width="2.4"/>')
    return "".join(o)


def stone_block(cx, cy, w=40, h=26):
    """切り石（中心 (cx, cy)。人物のセル座標）。"""
    x0, y0 = cx - w / 2, cy - h / 2
    return (f'<path d="M{n(x0)},{n(y0 + 5)} L{n(x0 + 6)},{n(y0)} L{n(x0 + w)},{n(y0)} L{n(x0 + w)},{n(y0 + h - 5)} L{n(x0 + w - 6)},{n(y0 + h)} '
            f'L{n(x0)},{n(y0 + h)}Z" fill="#b4ab9a" stroke="#3a3228" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<path d="M{n(x0 + 6)},{n(y0)} L{n(x0 + 6)},{n(y0 + h - 2)} M{n(x0 + w * .55)},{n(y0 + 3)} L{n(x0 + w * .5)},{n(y0 + h * .55)}" '
            f'stroke="#8a8272" stroke-width="1.2"/>')


ISLE_BACK = "M980,432 C900,380 780,300 640,236 C500,176 340,124 180,96 C100,84 30,80 -20,82 L-20,432Z"
ISLE_FRONT = ("M800,432 C740,416 680,392 620,362 C580,342 540,328 500,322 L250,320 C210,312 170,292 130,262 "
              "C90,232 40,206 -20,192 L-20,432Z")
ISLE_TEMPLE_AT, ISLE_TEMPLE_SCALE = (372, 321), .19


def dharma_isle(p, R):
    """船から振り返るダーマの島（海面 y=432）。山の肩（250～500）に再建した神殿。"""
    o = [f'<path d="{ISLE_BACK}" fill="#9fb6c6"/><path d="{ISLE_BACK}" fill="none" stroke="#c8d8e4" stroke-width="2" opacity=".6"/>',
         f'<path d="{ISLE_FRONT}" fill="#7ea486" stroke="#557a62" stroke-width="2"/>',
         # 浜から神殿へ上る坂道
         '<path d="M720,428 C680,418 640,404 650,392 C660,380 610,370 580,358 C560,350 590,340 540,330 C520,326 500,324 480,322" '
         'fill="none" stroke="#e8dcc0" stroke-width="4" stroke-linecap="round" opacity=".85"/>',
         # 浜と小さな桟橋
         '<path d="M640,432 C700,426 760,426 800,432Z" fill="#efdcab"/>'
         '<path d="M742,431 L806,438" stroke="#7c5730" stroke-width="4"/>']
    o.append(T.place_remains(T.temple_rebuilt(p, R, T.REBUILT_DAY), ISLE_TEMPLE_AT, ISLE_TEMPLE_SCALE))
    return "".join(o)


def pier(p, top_y, x0, x1, bot_x0, bot_x1, color="#c99c5f", dark="#8a6436", ink=INK):
    """奥（top_y）へすぼまる板張りの桟橋。手前は画面の下端（900）。返り値は (defs, 描画)。"""
    d = f"M{x0},{top_y} L{x1},{top_y} L{bot_x1},900 L{bot_x0},900Z"
    defs = (f'<linearGradient id="{p}pier" x1="0" y1="{top_y}" x2="0" y2="900" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{dark}"/><stop offset=".35" stop-color="{color}"/><stop offset="1" stop-color="{color}"/></linearGradient>')
    o = [f'<path d="{d}" fill="url(#{p}pier)" stroke="{ink}" stroke-width="3"/>']
    planks = []
    y = top_y + 10.0
    while y < 900:
        t = (y - top_y) / (900 - top_y)
        planks.append(f"M{n(x0 + (bot_x0 - x0) * t)},{n(y)} L{n(x1 + (bot_x1 - x1) * t)},{n(y)}")
        y += 8 + (y - top_y) * .1
    o.append(f'<path d="{" ".join(planks)}" stroke="{dark}" stroke-width="2" opacity=".7"/>')
    mid0, mid1 = (x0 + x1) / 2, (bot_x0 + bot_x1) / 2
    o.append(f'<path d="M{n(mid0)},{top_y} L{n(mid1)},900" stroke="{dark}" stroke-width="1.6" opacity=".5"/>')
    return defs, "".join(o)


def book_light(cls_glow="", cls_spark=""):
    """職業の書の光（原点が光の中心）。深緑の光と金のきらめき。"""
    return (f'<circle class="{cls_glow}" cx="0" cy="0" r="40" fill="#9ad6a0" opacity=".5"/>'
            f'<circle class="{cls_glow}" cx="0" cy="0" r="22" fill="#ffe7a0" opacity=".75"/>'
            f'<g transform="translate(30 -30)"><path class="{cls_spark}" d="{SPARK}" fill="#fff4c8" transform="scale(1.3)"/></g>')
