"""ダーマ再興編の始まり「始まりの場所」SVGストーリームービー（M10）の組み立てスクリプト。

5場面のSVG（scenes10.py、小道具は props10.py。船は第3章の結末の props.py、思い出の額はプロローグ・第3章の結末・
火山島編の結末の場面をそのまま使う）と、ストーリーデータ・パネルの文言（このファイル）を、共通の再生エンジン
（../../shared/engine.py）で1つの自己完結HTMLにまとめて書き出す。人物の頭・胴は ../parts/cast.json
（Studioの正式デザインから ../../shared/cast.mjs が書き出したもの）を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch6-arrival から呼ばれる。

第6～7章はゲームより先にムービーを作るので、字幕の一部は新しく書く（docs/story/planned/chapter6-7-movies.md の M10）。
  場面1 すでにある文：プロローグの字幕、第3章と第5章の結末文の行（全文は docs/story/reference/removed-text-endings.md）
  場面2 すでにある文：第5章の結末文（M7の字幕）の行。M7の夜の海の続きとして
  場面3・4 新しく書いた字幕：帰ってきたシオンと、神殿跡を見上げる場面だけ
  場面5 字幕なし。タイトル「職をつぐ者／ダーマ再興編／第6章　よみがえるダーマ神殿」

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch6-arrival/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                 # 共通部品（engine.py・helpers.py・figures.py）
sys.path.insert(0, os.path.join(_MOVIES, "prologue", "src"))        # 思い出の額：プロローグの場面
sys.path.insert(0, os.path.join(_MOVIES, "ch4-arrival", "src"))     # 思い出の額の縁・星（props5.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch5-return", "src"))      # 思い出の額：火山島編の結末の場面
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))   # 船と思い出の額：第3章の結末の場面
sys.path.insert(0, _HERE)
import engine
from scenes10 import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
# group が違う字幕は同じ場所に重ねて表示する（前の組が消えてから次の組）。
STORY = r"""{
    id: 'ch6-arrival',
    title: 'ダーマ再興編',
    fadeIn: 1200,
    crossfade: 950,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {
        id: 'journey', label: 'これまでの旅', asset: 'tpl-scene-1', duration: 7200,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.04, x: 0, y: -1 } },
        captions: [
          { text: 'ただ一人、神殿から逃れた見習いがいた。', in: 400, out: 2400 },
          { text: '漂着した者は、船をつくる者になった。', in: 2800, out: 4700, group: 1 },
          { text: '祈りを取り戻した者たちは、病める者のそばに立った。', in: 5100, out: 6900, group: 2 }
        ]
      },
      {
        id: 'dawn', label: '夜明けの海', asset: 'tpl-scene-2', duration: 5200,
        camera: { from: { s: 1.06, x: 2, y: 1 }, to: { s: 1.0, x: -1, y: 0 } },
        captions: [
          { text: 'そして 職をつぐ者は、船に乗る。', in: 400, out: 4900 },
          { text: 'すべてが失われた、始まりの場所へ。', in: 1800, out: 4900 }
        ]
      },
      {
        id: 'island', label: '海から山へ続く島', asset: 'tpl-scene-3', duration: 5200,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.1, x: -4, y: -2 } },
        captions: [
          { text: 'あの夜、炎の中から逃れた島。', in: 400, out: 4900 },
          { text: 'シオンは、帰ってきた。', in: 1900, out: 4900 }
        ]
      },
      {
        id: 'ruins', label: '神殿跡', asset: 'tpl-scene-4', duration: 5600,
        camera: { from: { s: 1.16, x: 3, y: -7 }, to: { s: 1.02, x: 0, y: 2 } },
        captions: [
          { text: '屋根を失った神殿に、二本の柱だけが残っていた。', in: 400, out: 5300 },
          { text: '職を授ける場所を、もう一度 ここに。', in: 2300, out: 5300 }
        ]
      },
      {
        id: 'landing', label: '着岸', asset: 'tpl-scene-5', duration: 5800,
        camera: { from: { s: 1.08, x: 3, y: 1 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [],
        cues: [{ at: 2600, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">職をつぐ者</p>
      <h1 class="title-main">ダーマ再興編</h1>
      <p class="title-chapter">第6章　よみがえるダーマ神殿</p>
      {engine.title_ornament()}"""

# タイトル（3行）とパネルの大きさ。
EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.5em;padding-left:.5em;
  color:var(--gold);text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.title-chapter{margin:calc(var(--sw) * .008) 0 0;font-weight:700;font-size:calc(var(--sw) * .02);letter-spacing:.3em;padding-left:.3em;
  color:#f6e7c8;text-shadow:0 .08em .3em rgba(0,0,0,.8)}
.movie .title-main{font-size:calc(var(--sw) * .062)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』ダーマ再興編の始まり「始まりの場所」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch6-arrival/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×5） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=4（第4場面から再生） ?still=4&t=3000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="ダーマ再興編　はじまり", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="ダーマ再興編",
        end_note="試作版はここまで。第6～7章のゲームは未実装です。ゲームでは、ここから第6章の導入会話（着岸とスズハとの出会い）へ続く予定です。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 始まりの場所 ― ダーマ再興編のはじまり（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
