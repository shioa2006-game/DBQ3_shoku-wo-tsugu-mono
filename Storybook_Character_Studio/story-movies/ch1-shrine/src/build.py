"""第1章の結び「小さな社」SVGストーリームービーの組み立てスクリプト。

3場面のSVG（scenes1.py。村の小道具は第3章の結末の props.py、書の表紙は ../../shared/books.py）と、
ストーリーデータ・パネルの文言（このファイル）を、共通の再生エンジン（../../shared/engine.py）で
1つの自己完結HTMLにまとめて書き出す。人物の頭・胴は ../parts/cast.json を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch1-shrine から呼ばれる。

字幕は、今の第1章の章末の文（dqb3-tsugumono-ch1-3/src/ui/ui.js の playEnding() の既定の文）のうち、
第1章の出来事の行だけを、順番どおりそのまま使う。勇者・魔物・神殿の崩壊を語る前半の行は、
プロローグ（M0）と重なるので使わない。最後の「― 職をつぐ旅は、ここから続いていく ―」は前後の線を外して使う。
タイトルの「漂着の浜」は第1章の章名（docs/story/implemented/chapter1.md）。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch1-shrine/）を出力
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
from scenes1 import SCENES

STORY = r"""{
    id: 'ch1-shrine',
    title: '第1章・完',
    fadeIn: 1100,
    crossfade: 900,
    quickCrossfade: 550,
    finalFade: 900,
    scenes: [
      {
        id: 'altar', label: '祭壇の二冊', asset: 'tpl-scene-1', duration: 5200,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.08, x: 0, y: -2 } },
        captions: [
          { text: 'その書に導かれ、流れ着いたジパングで槌を取った。', in: 400, out: 4800 },
          { text: '家を建て、田を耕し、柵をめぐらせ、祈りの場を作った。', in: 1800, out: 4800 }
        ]
      },
      {
        id: 'looking-up', label: '社を見上げる人々', asset: 'tpl-scene-2', duration: 4200,
        camera: { from: { s: 1.04, x: 0, y: 2 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '人々が働き始めた時、白紙の職業の書に文字が戻った。', in: 300, out: 3900 }
        ]
      },
      {
        id: 'morning', label: '朝の村', asset: 'tpl-scene-3', duration: 5600,
        camera: { from: { s: 1.08, x: 3, y: 2 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '職をつぐ旅は、ここから続いていく', in: 400, out: 2600 }
        ],
        cues: [{ at: 2800, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">職をつぐ者　ジパング復興編</p>
      <h1 class="title-main">第1章・完</h1>
      <p class="title-chapter">漂着の浜</p>
      {engine.title_ornament()}"""

EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .022);letter-spacing:.4em;padding-left:.4em;
  color:var(--gold);text-shadow:0 .08em .3em rgba(0,0,0,.75)}
.title-chapter{margin:calc(var(--sw) * .008) 0 0;font-weight:700;font-size:calc(var(--sw) * .024);letter-spacing:.4em;padding-left:.4em;
  color:#fff4dc;text-shadow:0 .08em .3em rgba(0,0,0,.8)}
.movie .title-main{font-size:calc(var(--sw) * .06)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』第1章の結び「小さな社」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch1-shrine/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×3） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=2（第2場面から再生） ?still=3&t=3000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第1章　結び", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="第1章・完",
        end_note="試作版はここまで。本編では、社の祭壇で祈った会話の後にこの結びが流れ、自由行動を経て第2章へ続きます。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 小さな社 ― 第1章の結び（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
