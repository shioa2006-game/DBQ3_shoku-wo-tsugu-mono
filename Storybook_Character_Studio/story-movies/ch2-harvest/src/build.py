"""第2章の結び「収穫祭の夜」SVGストーリームービーの組み立てスクリプト。

5場面のSVG（scenes9.py。村の小道具は第3章の結末の props.py、書の表紙は ../../shared/books.py）と、
ストーリーデータ・パネルの文言（このファイル）を、共通の再生エンジン（../../shared/engine.py）で
1つの自己完結HTMLにまとめて書き出す。人物の頭・胴は ../parts/cast.json を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch2-harvest から呼ばれる。

字幕は、田んぼ防衛戦の勝利会話（dqb3-tsugumono-ch1-3/src/content/chapter2.js の paddyDefenseWin）の台詞から、
語の順を変えずに一部を抜き出して使う（新しい台詞は作らない）:
  場面1 ジンベエ「……田がよみがえり、食が戻った。」
  場面2 イナホ「じゃあ、今夜は 収穫祭だね！」
  場面3・4 職業の書「農民、料理人……二冊の書が よみがえった。」「……む、潮の匂いが変わったの。今夜は 荒れるやもしれん」
  場面5 職業の書「職をつぐ旅は、まだ続くのじゃ！」を「職をつぐ旅は、まだ続く。」にした（M1の結びと聞き分けるため）。
タイトルの「荒れた田の村」は第2章の章名（docs/story/implemented/chapter2.md）。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch2-harvest/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                 # 共通部品（engine.py・helpers.py・figures.py・books.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))   # 村の小道具と空・海の部品（props.py・scenes.py）
sys.path.insert(0, _HERE)
import engine
from scenes9 import SCENES

STORY = r"""{
    id: 'ch2-harvest',
    title: '第2章・完',
    fadeIn: 1100,
    crossfade: 900,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {
        id: 'paddy', label: '守った田', asset: 'tpl-scene-1', duration: 3000,
        camera: { from: { s: 1.06, x: 0, y: 2 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '田がよみがえり、食が戻った。', in: 300, out: 2800 }
        ]
      },
      {
        id: 'feast', label: '収穫祭', asset: 'tpl-scene-2', duration: 5000,
        camera: { from: { s: 1.04, x: 2, y: 0 }, to: { s: 1.0, x: -1, y: 0 } },
        captions: [
          { text: '今夜は 収穫祭だね！', in: 400, out: 4600 }
        ]
      },
      {
        id: 'two-books', label: '二冊の書', asset: 'tpl-scene-3', duration: 3000,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.05, x: 0, y: -2 } },
        captions: [
          { text: '農民、料理人……二冊の書が よみがえった。', in: 300, out: 2800 }
        ]
      },
      {
        id: 'storm', label: '荒れる沖', asset: 'tpl-scene-4', duration: 5000,
        camera: { from: { s: 1.18, x: 9, y: -2 }, to: { s: 1.04, x: -3, y: 0 } },
        captions: [
          { text: '潮の匂いが変わったの。今夜は 荒れるやもしれん', in: 400, out: 4600 }
        ]
      },
      {
        id: 'still-continues', label: '結び', asset: 'tpl-scene-5', duration: 3600,
        camera: { from: { s: 1.04, x: 0, y: 0 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '職をつぐ旅は、まだ続く。', in: 300, out: 1900 }
        ],
        cues: [{ at: 2100, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">職をつぐ者　ジパング復興編</p>
      <h1 class="title-main">第2章・完</h1>
      <p class="title-chapter">荒れた田の村</p>
      {engine.title_ornament()}"""

EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .022);letter-spacing:.4em;padding-left:.4em;
  color:var(--gold);text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.title-chapter{margin:calc(var(--sw) * .008) 0 0;font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.4em;padding-left:.4em;
  color:#fff4dc;text-shadow:0 .08em .3em rgba(0,0,0,.8)}
.movie .title-main{font-size:calc(var(--sw) * .06)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』第2章の結び「収穫祭の夜」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch2-harvest/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×5） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=4（第4場面から再生） ?still=4&t=2500（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第2章　結び", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="第2章・完",
        end_note="試作版はここまで。本編では、田んぼ防衛戦の勝利会話の後にこの結びが流れ、翌朝、浜で船と船乗りが見つかる第3章へ続きます。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 収穫祭の夜 ― 第2章の結び（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
