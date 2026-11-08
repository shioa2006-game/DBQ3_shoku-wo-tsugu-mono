"""火山島編の始まり「海を越えて」SVGストーリームービーの組み立てスクリプト。

5場面のSVG（scenes5.py、小道具は props5.py。船は第3章の結末の props.py、思い出の額はプロローグと第3章の結末の
場面をそのまま使う）と、ストーリーデータ・パネルの文言（このファイル）を、共通の再生エンジン
（../../shared/engine.py）で1つの自己完結HTMLにまとめて書き出す。人物の頭・胴は ../parts/cast.json
（Studioの正式デザインから ../../shared/cast.mjs が書き出したもの）を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch4-arrival から呼ばれる。

字幕は、すでにある文だけを使う（新しい台詞は作らない）:
  場面1 プロローグの字幕（../../prologue/src/build.py）
  場面2 第4章の導入会話で職業の書が振り返る2行（dqb3-tsugumono-ch4-5/src/content/chapter4.js の intro。
        呼びかけの「思い出すのう。」と、つなぎの「……次は、この島の番じゃ」は除いた）
  場面3 第3章の結末文の最後の行（dqb3-tsugumono-ch1-3/src/content/chapter3.js の ending）
  場面4 第4章の導入会話の地の文（chapter4.js の intro の1行目を2行に分けた）
  場面5 火山島編のタイトル画面の一文（dqb3-tsugumono-ch4-5/src/ui/ui.js の title-copy）

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch4-arrival/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                 # 共通部品（engine.py・helpers.py・figures.py）
sys.path.insert(0, os.path.join(_MOVIES, "prologue", "src"))        # 思い出の額：プロローグの場面
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))   # 船と思い出の額：第3章の結末の場面
sys.path.insert(0, _HERE)
import engine
from scenes5 import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
# group が違う字幕は同じ場所に重ねて表示する（前の組が消えてから次の組）。
STORY = r"""{
    id: 'ch4-arrival',
    title: '火山島編',
    fadeIn: 1200,
    crossfade: 950,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {
        id: 'apprentice', label: '神殿からの見習い', asset: 'tpl-scene-1', duration: 5200,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.05, x: 0, y: -1 } },
        captions: [
          { text: 'ただ一人、神殿から逃れた見習いがいた。', in: 500, out: 4800 },
          { text: '少年の名は、シオン。', in: 1900, out: 4800 }
        ]
      },
      {
        id: 'zipangu', label: 'ジパングの復興', asset: 'tpl-scene-2', duration: 6800,
        camera: { from: { s: 1.02, x: 1, y: 0 }, to: { s: 1.06, x: -1.5, y: -1 } },
        captions: [
          { text: 'ジパングでは 農民・料理人・船乗り、三つの書がよみがえった。', in: 400, out: 3100 },
          { text: '本島は 大工のピノ、料理人で農民のイナホ、神官のジンベエに任せてきた。', in: 3400, out: 6400, group: 1 }
        ]
      },
      {
        id: 'voyage', label: '長い航海', asset: 'tpl-scene-3', duration: 5000,
        camera: { from: { s: 1.06, x: 2, y: 1 }, to: { s: 1.0, x: -1, y: 0 } },
        captions: [
          { text: '職をつぐ旅は、海の向こうへ続いていく。', in: 500, out: 4600 }
        ]
      },
      {
        id: 'ash-wind', label: '灰の風', asset: 'tpl-scene-4', duration: 5800,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.1, x: -5, y: -2 } },
        captions: [
          { text: '……潮風が、変わった。灰の匂いをふくんだ風。', in: 400, out: 5400 },
          { text: '黒い島影が、ゆっくりと近づいてくる。', in: 2100, out: 5400 }
        ]
      },
      {
        id: 'burnt-pier', label: '焼けた船着き場', asset: 'tpl-scene-5', duration: 6000,
        camera: { from: { s: 1.1, x: 3, y: 2 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '炉は冷え、鉄は眠る。', in: 400, out: 3200 },
          { text: '——それでも人は、火を戻すことを選んだ。', in: 1500, out: 3200 }
        ],
        cues: [{ at: 3400, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">職をつぐ者</p>
      <h1 class="title-main">火山島編</h1>
      <p class="title-chapter">第4章　鬼火の山</p>
      {engine.title_ornament()}"""

# タイトル（3行）とパネルの大きさ。
EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.5em;padding-left:.5em;
  color:var(--gold);text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.title-chapter{margin:calc(var(--sw) * .008) 0 0;font-weight:700;font-size:calc(var(--sw) * .02);letter-spacing:.3em;padding-left:.3em;
  color:#f6e7c8;text-shadow:0 .08em .3em rgba(0,0,0,.8)}
.movie .title-main{font-size:calc(var(--sw) * .064)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』火山島編の始まり「海を越えて」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch4-arrival/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×5） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=3（第3場面から再生） ?still=3&t=3000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="火山島編　はじまり", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="火山島編",
        end_note="試作版はここまで。本編では、ここから第4章の導入会話（「——だれか、いるの……？」とカヤとの出会い）へ続きます。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 海を越えて ― 火山島編のはじまり（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
