"""最終決戦の決着「灯は消えず」SVGストーリームービー（M13）の組み立てスクリプト。

3場面のSVG（scenes13.py、小道具は props13.py。ヴァルガの部品の読み込みはM12の props12.py、祭壇・炎・選択の柱・共同台所は
M11の props11.py、再建した神殿は ../../shared/temple.py、場面の枠は第3章の結末の scenes.py）と、ストーリーデータ・パネルの
文言（このファイル）を、共通の再生エンジン（../../shared/engine.py）で1つの自己完結HTMLにまとめて書き出す。
ヴァルガの頭・胴は ../parts/varga.json、人物の頭・胴は ../parts/cast.json を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch7-flame-holds から呼ばれる。

第6～7章はゲームより先にムービーを作るので、字幕は計画（docs/story/planned/chapter6-7-movies.md の M13）に沿って新しく書く。
ヴァルガの最後の短い言葉（場面1）と、職業の書の言葉（場面2・3）だけにする。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch7-flame-holds/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                     # 共通部品（engine.py・helpers.py・figures.py・temple.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))       # 場面の枠（scenes.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch6-roof-light", "src"))      # 祭壇・炎・選択の柱・共同台所（props11.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch7-three-heads", "src"))     # ヴァルガの部品の読み込み（props12.py）
sys.path.insert(0, _HERE)
import engine
from scenes13 import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
STORY = r"""{
    id: 'ch7-flame-holds',
    title: '灯は消えず',
    fadeIn: 900,
    crossfade: 800,
    quickCrossfade: 500,
    finalFade: 1000,
    scenes: [
      {
        id: 'last-head', label: '最後の頭', asset: 'tpl-scene-1', duration: 5000,
        camera: { from: { s: 1.06, x: 0, y: 3 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: 'おのれ……職をつぐ者ども……。', in: 400, out: 2700 }
        ]
      },
      {
        id: 'altar-light', label: '消えない灯', asset: 'tpl-scene-2', duration: 5000,
        camera: { from: { s: 1.08, x: 2, y: 2 }, to: { s: 1.0, x: -1, y: 0 } },
        captions: [
          { text: '灯は、消えておらぬ。', in: 1400, out: 4700 }
        ]
      },
      {
        id: 'morning', label: '朝の光', asset: 'tpl-scene-3', duration: 6400,
        camera: { from: { s: 1.28, x: 12, y: 4 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '皆の仕事が、この灯を守ったのじゃ。', in: 600, out: 3700 }
        ],
        cues: [{ at: 3900, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">最終決戦の決着</p>
      <h1 class="title-main">灯は消えず</h1>
      {engine.title_ornament()}"""

EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.4em;padding-left:.4em;
  color:#fff4dc;text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.movie .title-main{font-size:calc(var(--sw) * .066)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』最終決戦の決着「灯は消えず」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch7-flame-holds/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×3） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。ヴァルガと人物の頭・胴はStudioの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=2（第2場面から再生） ?still=2&t=3000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第7章　決着", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="灯は消えず",
        end_note="試作版はここまで。第6～7章のゲームは未実装です。ゲームでは、最終決戦で三つ目の頭を倒した直後にこの場面が流れ、神殿の修復へ続く予定です。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 灯は消えず ― 最終決戦の決着（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
