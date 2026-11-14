"""第6章の結び「大屋根の灯」SVGストーリームービー（M11）の組み立てスクリプト。

5場面のSVG（scenes11.py、小道具は props11.py。再建した神殿は ../../shared/temple.py、膳の料理と提灯は
第2章の結びの scenes9.py、空・海の部品は第3章の結末の scenes.py）と、ストーリーデータ・パネルの文言（このファイル）を、
共通の再生エンジン（../../shared/engine.py）で1つの自己完結HTMLにまとめて書き出す。人物の頭・胴は ../parts/cast.json を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch6-roof-light から呼ばれる。

第6～7章はゲームより先にムービーを作るので、字幕は計画（docs/story/planned/chapter6-7-movies.md の M11：
「祝いの言葉と、職業の書の短い言葉。④は字幕を置かないか、ごく短くする」）に沿って新しく書く。
タイトルの「第6章・完」「よみがえるダーマ神殿」は第6章の章名、「ダーマ再興編」は編名。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch6-roof-light/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                 # 共通部品（engine.py・helpers.py・figures.py・temple.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))   # 空・海の部品と村の小道具（scenes.py・props.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch2-harvest", "src"))     # 膳の料理と提灯（scenes9.py）
sys.path.insert(0, _HERE)
import engine
from scenes11 import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
STORY = r"""{
    id: 'ch6-roof-light',
    title: '第6章・完',
    fadeIn: 1100,
    crossfade: 900,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {
        id: 'altar', label: '灯のともる祭壇', asset: 'tpl-scene-1', duration: 3600,
        camera: { from: { s: 1.1, x: 2, y: 2 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '要石の祭壇に、授職の灯がともった。', in: 300, out: 3300 },
          { text: '職は、ここから また受け継がれていくのじゃ。', in: 1500, out: 3300 }
        ]
      },
      {
        id: 'feast', label: '祝いの夜', asset: 'tpl-scene-2', duration: 4800,
        camera: { from: { s: 1.05, x: 2, y: 1 }, to: { s: 1.0, x: -1, y: 0 } },
        captions: [
          { text: '神殿の完成と、はじめての授職に――乾杯！', in: 400, out: 4500 }
        ]
      },
      {
        id: 'roof-light', label: '海岸から望む神殿', asset: 'tpl-scene-3', duration: 3400,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.08, x: 0, y: -2 } },
        captions: [
          { text: '大屋根の灯が、海まで照らしておる。', in: 300, out: 3100 }
        ]
      },
      {
        id: 'roar', label: '遠い咆哮', asset: 'tpl-scene-4', duration: 4600,
        camera: { from: { s: 1.06, x: -2, y: 0 }, to: { s: 1.0, x: 1, y: 0 } },
        captions: [
          { text: '――海の向こうから、遠い咆哮。', in: 300, out: 2300 }
        ]
      },
      {
        id: 'end', label: '結び', asset: 'tpl-scene-5', duration: 3400,
        camera: { from: { s: 1.04, x: 0, y: 1 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [],
        cues: [{ at: 1000, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">職をつぐ者　ダーマ再興編</p>
      <h1 class="title-main">第6章・完</h1>
      <p class="title-chapter">よみがえるダーマ神殿</p>
      {engine.title_ornament()}"""

EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .022);letter-spacing:.4em;padding-left:.4em;
  color:var(--gold);text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.title-chapter{margin:calc(var(--sw) * .008) 0 0;font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.4em;padding-left:.4em;
  color:#fff4dc;text-shadow:0 .08em .3em rgba(0,0,0,.8)}
.movie .title-main{font-size:calc(var(--sw) * .06)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』第6章の結び「大屋根の灯」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch6-roof-light/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×5） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=4（第4場面から再生） ?still=4&t=2500（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第6章　結び", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="第6章・完",
        end_note="試作版はここまで。第6～7章のゲームは未実装です。ゲームでは、神殿の完成と最初の授職を祝った後にこの結びが流れ、第7章へ続く予定です。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 大屋根の灯 ― 第6章の結び（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
