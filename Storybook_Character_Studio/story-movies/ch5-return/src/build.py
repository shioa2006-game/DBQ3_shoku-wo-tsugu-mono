"""第5章の結末「帰るべき場所へ ― 火山島編・完」SVGストーリームービーの組み立てスクリプト。

4場面のSVG（scenes7.py、小道具は props7.py。船は第3章の結末の props.py、火山島は火山島編の始まりの props5.py）と、
ストーリーデータ・パネルの文言（このファイル）を、共通の再生エンジン（../../shared/engine.py）で
1つの自己完結HTMLにまとめて書き出す。人物の頭・胴は ../parts/cast.json（Studioの正式デザインから
../../shared/cast.mjs が書き出したもの）を読む。通常は Studio ルートの npm.cmd run build:movie -- ch5-return から呼ばれる。

字幕は、第5章の結末文（以前の chapter5.js の ending。2026-11-08にゲームから削除し、全文は docs/story/reference/removed-text-endings.md）の行をそのまま、順番どおりに使う。
最後の「―― 火山島編・完 ――」はタイトルで表す。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch5-return/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                 # 共通部品（engine.py・helpers.py・figures.py・temple.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch4-arrival", "src"))     # 火山島（props5.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))   # 船と空・海の部品（props.py・scenes.py）
sys.path.insert(0, _HERE)
import engine
from scenes7 import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
# group が違う字幕は同じ場所に重ねて表示する（前の組が消えてから次の組）。
STORY = r"""{
    id: 'ch5-return',
    title: '火山島編・完',
    fadeIn: 1200,
    crossfade: 950,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {
        id: 'spring', label: '清めの泉', asset: 'tpl-scene-1', duration: 7200,
        camera: { from: { s: 1.08, x: 2, y: -2 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '火を取り戻した者たちは、鉄を暮らしの形に変えた。', in: 500, out: 6800 },
          { text: '祈りを取り戻した者たちは、病める者のそばに立った。', in: 2000, out: 6800 }
        ]
      },
      {
        id: 'townsfolk', label: '町の人々', asset: 'tpl-scene-2', duration: 9600,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.06, x: 0, y: -2 } },
        captions: [
          { text: '鍛冶屋のベルク、僧侶のナギ、薬草のヨモギ。', in: 500, out: 4400 },
          { text: 'ロクとカヤと島の人々は、火と水のつながった町を守っていく。', in: 4700, out: 9200, group: 1 }
        ]
      },
      {
        id: 'set-sail', label: '船出', asset: 'tpl-scene-3', duration: 7000,
        camera: { from: { s: 1.06, x: -2, y: 0 }, to: { s: 1.0, x: 2, y: 0 } },
        captions: [
          { text: 'そして 職をつぐ者は、船に乗る。', in: 500, out: 6600 },
          { text: '農民ミナ、守り手ゴンタ、船乗りワタリと共に――', in: 1800, out: 6600 }
        ]
      },
      {
        id: 'to-the-beginning', label: '始まりの場所へ', asset: 'tpl-scene-4', duration: 8200,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.08, x: -4, y: -1 } },
        captions: [
          { text: 'すべてが失われた、始まりの場所へ。', in: 500, out: 3900 }
        ],
        cues: [{ at: 4100, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">職をつぐ者</p>
      <h1 class="title-main">火山島編・完</h1>
      {engine.title_ornament()}"""

# タイトル（2行）とパネルの大きさ。
EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.5em;padding-left:.5em;
  color:var(--gold);text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.movie .title-main{font-size:calc(var(--sw) * .06)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』第5章の結末「帰るべき場所へ ― 火山島編・完」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch5-return/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×4） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=3（第3場面から再生） ?still=3&t=3000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第5章　結末", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="火山島編・完",
        end_note="試作版はここまで。本編では、泉の完成でこの結末が流れ、復興した島で自由に暮らせます（旅路は旧ダーマ神殿へ続く）。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 帰るべき場所へ ― 火山島編・完（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
