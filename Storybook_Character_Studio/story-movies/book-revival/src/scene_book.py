"""書の復活（共通の型）の場面のSVG。5冊とも同じ型で、表紙・紋章・道具の絵だけを差し替える（../../shared/books.py）。

1つの場面（約7秒）の中で、次の順に進む（時刻は場面の始まりから）:
  0.0  暗がりに、閉じた白紙の書が浮かぶ（表紙の色と紋章）
  0.9  表紙が開く（背を軸に左へ。本は中央へ寄る）
  1.7  白紙のページに、光の文字（筆の線）が一行ずつ戻る
  2.6  右のページの中央に、紋章が光って現れる
  3.0  本から光の柱が立ち、その職の道具が浮かび上がる
  3.8  光がはじける（白い閃光）→ 4.0 書の名前（タイトル）
座標は viewBox="0 0 1600 900"。id・クラス・アニメーション名の接頭辞は s1-。位置が動くものには .mv を付ける
（モーション軽減では、本は最初から開いた位置、道具は浮かんだ位置で止まる。現れ方の不透明度は残る）。
"""
import math
import random

from helpers import n, SPARK
import books as B

HEAD = ('<svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" '
        'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{label}">')
BOOK_AT, BOOK_SCALE = (800, 640), .84
TOOL_AT, TOOL_SCALE = (800, 432), 1.2

CSS = """
.s1-shift{transform:translateX(0)}
.is-active .s1-shift{animation:s1-shift .9s .9s cubic-bezier(.4,0,.2,1) both}
.s1-cover{transform-box:view-box;transform-origin:0 0}
.is-active .s1-cover{animation:s1-cover .45s .9s ease-in both}
.s1-open{transform-box:view-box;transform-origin:0 0}
.is-active .s1-open{animation:s1-open .45s 1.35s ease-out both}
.is-active .s1-float{animation:s1-float 2.4s ease-in-out infinite alternate}
.s1-line{stroke-dasharray:1;stroke-dashoffset:0}
.is-active .s1-line{animation:s1-line .5s calc(1.7s + var(--i) * .11s) ease-out both}
.s1-pemblem{opacity:1}
.is-active .s1-pemblem{animation:s1-in .7s 2.6s ease-out both}
.is-active .s1-eglow{animation:s1-pulse 1.4s 2.6s ease-in-out infinite alternate both}
.s1-beam{opacity:.8}
.is-active .s1-beam{animation:s1-beam 4s 3s ease-out both}
.s1-toolin{opacity:1}
.is-active .s1-toolin{animation:s1-in .5s 3.1s ease-out both}
.is-active .s1-rise{animation:s1-rise 1.1s 3.1s cubic-bezier(.2,.7,.3,1) both}
.is-active .s1-bob{animation:s1-bob 2.2s 4.2s ease-in-out infinite alternate}
.s1-flash{opacity:0}
.is-active .s1-flash{animation:s1-flash .9s 3.7s ease-out both}
.is-active .s1-rays{animation:s1-rays 7s linear both}
.s1-raysin{opacity:.85}
.is-active .s1-raysin{animation:s1-in 1.2s 3s ease-out both}
.is-active .s1-spark{animation:s1-tw 1.6s ease-in-out infinite alternate}
.s1-mote{opacity:0}
.is-active .s1-mote{animation:s1-mote 3.2s ease-out infinite}
@keyframes s1-shift{from{transform:translateX(-150px)}to{transform:translateX(0)}}
@keyframes s1-cover{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes s1-open{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes s1-float{from{transform:translateY(-6px)}to{transform:translateY(6px)}}
@keyframes s1-line{from{stroke-dashoffset:1;opacity:.2}to{stroke-dashoffset:0;opacity:1}}
@keyframes s1-in{from{opacity:0}to{opacity:1}}
@keyframes s1-pulse{from{opacity:.45}to{opacity:1}}
@keyframes s1-beam{0%{opacity:0}25%{opacity:1}100%{opacity:.75}}
@keyframes s1-rise{from{transform:translateY(150px) scale(.4)}to{transform:none}}
@keyframes s1-bob{from{transform:translateY(-5px)}to{transform:translateY(5px)}}
@keyframes s1-flash{0%{opacity:0}25%{opacity:.85}100%{opacity:0}}
@keyframes s1-rays{from{transform:rotate(0)}to{transform:rotate(14deg)}}
@keyframes s1-tw{from{opacity:.25}to{opacity:1}}
@keyframes s1-mote{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
"""


def scene(book_id):
    b = B.BOOKS[book_id]
    R = random.Random(800 + B.ORDER.index(book_id))
    e = B.glow(book_id)      # 光の色（筋・後光・道具の光）
    o = [HEAD.format(label=f"暗がりに浮かぶ白紙の{b['name']}が開き、ページに光の文字が戻る。光の柱の中に{b['tool']}が浮かび上がる")]
    o.append(f"<style>{CSS}</style>")
    o.append('<defs><radialGradient id="s1-bg" cx=".5" cy=".55" r=".75"><stop offset="0" stop-color="#3a2f2a"/>'
             '<stop offset=".6" stop-color="#1a1416"/><stop offset="1" stop-color="#0b090c"/></radialGradient>'
             f'<radialGradient id="s1-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{e}" stop-opacity=".55"/>'
             f'<stop offset=".5" stop-color="{e}" stop-opacity=".15"/><stop offset="1" stop-color="{e}" stop-opacity="0"/></radialGradient>'
             '<linearGradient id="s1-beamg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/>'
             '<stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>'
             + B.defs("s1-", book_id) + "</defs>")
    o.append('<rect width="1600" height="900" fill="url(#s1-bg)"/>')
    # 背後の光の筋（ゆっくり回る）
    bx, by = BOOK_AT
    rays = "".join(f'<path d="M0,0 L{n(900 * math.cos(a))},{n(900 * math.sin(a))} '
                   f'L{n(900 * math.cos(a + .09))},{n(900 * math.sin(a + .09))}Z" fill="{e}"/>'
                   for a in [i * .4488 for i in range(14)])
    o.append(f'<g class="s1-raysin"><g transform="translate({TOOL_AT[0]} {TOOL_AT[1]})"><g class="s1-rays mv" opacity=".14">{rays}</g></g></g>')
    o.append(f'<circle cx="{TOOL_AT[0]}" cy="{TOOL_AT[1] + 60}" r="520" fill="url(#s1-halo)"/>')
    # 星のようなきらめきと、立ちのぼる光の粒
    for _ in range(26):
        x, y, s = R.uniform(80, 1520), R.uniform(40, 820), R.uniform(.4, 1.0)
        o.append(f'<path class="s1-spark" d="{SPARK}" transform="translate({n(x)} {n(y)}) scale({n(s)})" fill="#fff3c8" '
                 f'style="animation-delay:-{n(R.uniform(0, 1.6))}s"/>')
    o.append('<g class="s1-motes mv">' + "".join(
        f'<circle class="s1-mote mv" cx="{n(R.uniform(560, 1040))}" cy="{n(R.uniform(520, 760))}" r="{n(R.uniform(2, 4.2))}" fill="#fff0b8" '
        f'style="--dx:{n(R.uniform(-60, 60))}px;--dy:{n(R.uniform(-260, -140))}px;animation-delay:-{n(R.uniform(0, 3.2))}s"/>'
        for _ in range(30)) + "</g>")
    # 光の柱（本から上へ）
    o.append(f'<path class="s1-beam" d="M{bx - 90},{by - 40} L{bx + 90},{by - 40} L{bx + 220},-40 L{bx - 220},-40Z" fill="url(#s1-beamg)"/>')
    # 本：見開き（左のページと表紙の裏は開くと現れる）、右のページの光の文字と紋章、閉じた表紙
    book = (f'<g class="s1-open">{B.inner_cover("s1-", book_id)}</g>'
            + f'<g clip-path="url(#s1-rightpage)">{B.pages("s1-")}</g>'
            + f'<g class="s1-open"><g clip-path="url(#s1-leftpage)">{B.pages("s1-")}</g></g>'
            + B.text_lines("s1-line", -1) + B.text_lines("s1-line", 1)
            + f'<g class="s1-pemblem"><circle cx="{B.W / 2}" cy="0" r="90" class="s1-eglow" fill="url(#s1-eglow)"/>'
              f'<g transform="translate({B.W / 2} -6) scale(1.05)">{B.emblem(book_id, "#d9a83a")}</g></g>'
            + f'<g class="s1-cover"><g transform="translate({B.W / 2} 0)">{B.cover("s1-", book_id)}</g></g>')
    o.append(f'<defs><clipPath id="s1-rightpage"><rect x="0" y="{-B.H}" width="{B.W + 20}" height="{B.H * 2}"/></clipPath>'
             f'<clipPath id="s1-leftpage"><rect x="{-B.W - 20}" y="{-B.H}" width="{B.W + 20}" height="{B.H * 2}"/></clipPath></defs>')
    o.append(f'<g transform="translate({bx} {by}) scale({BOOK_SCALE})"><g class="s1-float mv"><g class="s1-shift mv">{book}</g></g></g>')
    # 道具（光の中に浮かぶ）
    o.append(f'<g class="s1-toolin"><g transform="translate({TOOL_AT[0]} {TOOL_AT[1]})"><g class="s1-rise mv"><g class="s1-bob mv">'
             f'<circle r="200" fill="url(#s1-halo)"/><g transform="scale({TOOL_SCALE})">{B.tool(book_id)}</g></g></g></g></g>')
    o.append('<rect class="s1-flash" width="1600" height="900" fill="#fffbe8"/>')
    o.append("</svg>")
    return "".join(o)
