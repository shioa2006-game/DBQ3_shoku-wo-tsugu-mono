"""書の復活（共通の型）SVGストーリームービーの組み立てスクリプト。

1つの型（scene_book.py）に、5冊の書の意匠（../../shared/books.py の表紙の色・紋章・道具）を差し替えて、
5本のページを書き出す。最初に復活する農民の書をフォルダの index.html に、ほかの4冊を <書>/index.html に置く。
通常は Studio ルートの npm.cmd run build:movie -- book-revival から呼ばれる。人物は登場しない。

字幕は、すでにある文だけを使う:
  1行目 ゲームの今の復活の小窓の文（dqb3-tsugumono-ch1-3/src/ui/ui.js の showBookRevival）
  2行目 その書の復活後の説明（jobs.js の revivedDesc。農民・料理人・船乗りは第1～3章、鍛冶屋・僧侶は第4～5章）
タイトルは書の名前（jobs.js の name）。

使い方:
    python build.py                 # ../index.html と ../<書>/index.html の5本を出力
    python build.py 出力先フォルダ   # 出力先を指定（同じ並びで5本）
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_HERE, "..", "..", "shared"))   # 共通部品（engine.py・helpers.py・books.py）
sys.path.insert(0, _HERE)
import engine
import books as B
from scene_book import scene

REVIVAL_LINE = "白紙のページに 光の文字が もどっていく……"
REVIVED = {
    "farmer": "ミナの手で よみがえった。土と水と、まごころの書。",
    "cook": "イナホの手で よみがえった。湯気とまごころ、おいしいの書。",
    "sailor": "ワタリの手で よみがえった。潮風と羅針盤、海をゆく者の書。",
    "blacksmith": "ベルクの手で よみがえった。鉄に暮らしの役割を与える者の書。",
    "priest": "ナギの手で よみがえった。傷ついた人を、再び暮らしへ戻す者の書。",
}
WHERE = {"farmer": "第1章", "cook": "第2章", "sailor": "第3章", "blacksmith": "第4章", "priest": "第5章"}


def story(book_id):
    return f"""{{
    id: 'book-revival-{book_id}',
    title: '{B.BOOKS[book_id]["name"]}',
    fadeIn: 700,
    crossfade: 950,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {{
        id: 'revival', label: '{B.BOOKS[book_id]["name"]}の復活', asset: 'tpl-scene-1', duration: 7000,
        camera: {{ from: {{ s: 1.04, x: 0, y: 1 }}, to: {{ s: 1.0, x: 0, y: 0 }} }},
        captions: [
          {{ text: '{REVIVAL_LINE}', in: 400, out: 3600 }},
          {{ text: '{REVIVED[book_id]}', in: 4300, out: 6700, group: 1 }}
        ],
        cues: [{{ at: 4000, action: 'title', stop: true }}]
      }}
    ]
  }}"""


EXTRA_CSS = """
.movie .title-main{font-size:calc(var(--sw) * .062)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
.end-note a{color:var(--gold)}
"""

COMMENT = """  『職をつぐ者』書の復活（共通の型）SVGストーリームービー試作：{name}
  - 生成物：Storybook_Character_Studio/story-movies/book-revival/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 5冊とも同じ型。表紙の色・紋章・道具の絵だけを story-movies/shared/books.py から差し替える。
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?still=1&t=3000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def links(book_id):
    """終了画面の、ほかの4冊へのリンク（農民の書はフォルダの直下、ほかは <書>/）。"""
    here_root = book_id == "farmer"
    out = []
    for other in B.ORDER:
        name = B.BOOKS[other]["name"]
        if other == book_id:
            out.append(f"<strong>{name}</strong>")
            continue
        if other == "farmer":
            href = "../"
        else:
            href = f"{other}/" if here_root else f"../{other}/"
        out.append(f"<a href='{href}'>{name}</a>")
    return "　".join(out)


def build_one(book_id, path):
    name = B.BOOKS[book_id]["name"]
    title_html = f"""      <h1 class="title-main">{name}</h1>
      {engine.title_ornament()}"""
    body = engine.body(
        "movie", title_html=title_html, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker=f"書の復活　{WHERE[book_id]}", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title=name,
        end_note=f"5冊とも同じ型で、表紙・紋章・道具だけが変わります。<br>{links(book_id)}",
        hint="クリック・タップ・Space・Enter で書の名前まで進む<br>Esc でスキップ")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=story(book_id),
                       title=f"職をつぐ者 書の復活 ― {name}（SVG試作）", comment=COMMENT.format(name=name), body_html=body,
                       scenes=[scene(book_id)], extra_css=EXTRA_CSS)


def build(out_dir):
    sizes = {}
    for book_id in B.ORDER:
        sub = out_dir if book_id == "farmer" else os.path.join(out_dir, book_id)
        os.makedirs(sub, exist_ok=True)
        sizes[book_id] = build_one(book_id, os.path.join(sub, "index.html"))
    return sizes


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(_HERE, "..")
    for book_id, size in build(out).items():
        print(f"書き出し完了: {B.BOOKS[book_id]['name']}（{size:,} 文字）")
