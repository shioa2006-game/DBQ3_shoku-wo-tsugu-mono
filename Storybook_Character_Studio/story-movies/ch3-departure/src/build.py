"""第3章の結末「旅立ち ― ジパング復興編・完」SVGストーリームービーの組み立てスクリプト。

5場面のSVG（scenes.py、小道具は props.py、人物は ../../shared/figures.py）と、ストーリーデータ・パネルの文言
（このファイル）を、共通の再生エンジン（../../shared/engine.py）で1つの自己完結HTMLにまとめて書き出す。
人物の頭・胴は ../parts/cast.json（Studioの正式デザインから ../../shared/cast.mjs が書き出したもの）を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch3-departure から呼ばれる。

字幕は、第3章の結末文（dqb3-tsugumono-ch1-3/src/content/chapter3.js の ending）の行をそのまま使う。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch3-departure/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_HERE, "..", "..", "shared"))   # 共通部品（engine.py・helpers.py・figures.py）
sys.path.insert(0, _HERE)
import engine
from scenes import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
# group が違う字幕は同じ場所に重ねて表示する（前の組が消えてから次の組）。
STORY = r"""{
    id: 'ch3-departure',
    title: 'ジパング復興編・完',
    fadeIn: 1200,
    crossfade: 950,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {
        id: 'island-morning', label: '復興した島', asset: 'tpl-scene-1', duration: 5800,
        camera: { from: { s: 1.06, x: 3, y: 1.5 }, to: { s: 1.12, x: -4, y: -1 } },
        captions: [
          { text: '漂着した見習い神官は、', in: 500, out: 5300 },
          { text: '家を建て、田を起こし、港を灯した。', in: 1800, out: 5300 }
        ]
      },
      {
        id: 'those-who-stay', label: '島に残る三人', asset: 'tpl-scene-2', duration: 9000,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.08, x: 0, y: -2 } },
        captions: [
          { text: '白紙の書に文字が戻るたび、', in: 500, out: 4300 },
          { text: '島には ひとり、またひとりと 職をつぐ者が生まれた。', in: 1500, out: 4300 },
          { text: '大工のピノ、料理と畑のイナホ、島に職を遺す神官ジンベエ。', in: 4500, out: 8600, group: 1 },
          { text: '三人は島に残り、この地の暮らしを守っていく。', in: 5900, out: 8600, group: 1 }
        ]
      },
      {
        id: 'set-sail', label: '船出', asset: 'tpl-scene-3', duration: 6400,
        camera: { from: { s: 1.08, x: 1, y: 2 }, to: { s: 1.02, x: -1, y: 0 } },
        captions: [
          { text: 'そして シオンは船に乗る。', in: 500, out: 6000 },
          { text: '農民ミナ、狩人ゴンタ、船乗りワタリと共に――', in: 1800, out: 6000 }
        ]
      },
      {
        id: 'past-the-lighthouse', label: '灯台の先へ', asset: 'tpl-scene-4', duration: 6200,
        camera: { from: { s: 1.12, x: -4, y: 1 }, to: { s: 1.1, x: 3, y: -1 } },
        captions: [
          { text: '職を待つ、まだ見ぬ島々へ。', in: 500, out: 3100 },
          { text: '漂着した者は、船をつくる者になった。', in: 3300, out: 5800, group: 1 }
        ]
      },
      {
        id: 'beyond-the-sea', label: '海の向こうへ', asset: 'tpl-scene-5', duration: 6800,
        camera: { from: { s: 1.12, x: 2, y: 3 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '職をつぐ旅は、海の向こうへ続いていく。', in: 500, out: 3700 }
        ],
        // stop: true のキューは「手動で次へ」を押したときの停止点になる（タイトルを飛ばさない）
        cues: [{ at: 3800, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">職をつぐ者</p>
      <h1 class="title-main">ジパング復興編・完</h1>
      {engine.title_ornament()}"""

# タイトル（2行）とパネルの大きさ。題名が長いので、プロローグより少し小さくする。
EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.5em;padding-left:.5em;
  color:var(--gold);text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.movie .title-main{font-size:calc(var(--sw) * .058)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』第3章の結末「旅立ち ― ジパング復興編・完」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch3-departure/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×5） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=3（第3場面から再生） ?still=3&t=3000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第3章　結末", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="ジパング復興編・完",
        end_note="試作版はここまで。本編では、この出航で第3章が終わり、火山島編（第4～5章）へ続きます。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 旅立ち ― ジパング復興編・完（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
