"""三頭魔竜の襲来「三つ首の影」SVGストーリームービー（M12）の組み立てスクリプト。

3場面のSVG（scenes12.py、ヴァルガの組み立ては props12.py。再建した神殿は ../../shared/temple.py、空・海の部品は
第3章の結末の scenes.py）と、ストーリーデータ・パネルの文言（このファイル）を、共通の再生エンジン（../../shared/engine.py）で
1つの自己完結HTMLにまとめて書き出す。ヴァルガの頭・胴は ../parts/varga.json を読む。
通常は Studio ルートの npm.cmd run build:movie -- ch7-three-heads から呼ばれる。

第6～7章はゲームより先にムービーを作るので、字幕は計画（docs/story/planned/chapter6-7-movies.md の M12）に沿って新しく書く。
ヴァルガの言葉は短くし、職と技術が再び広まるのを許さない意思（場面2）と、記録から削られた名を自ら告げ、ダーマを焼いたと
告げる名乗り（場面3）だけにする。名前は字幕のほか、タイトルの位置に「三頭魔竜　ヴァルガ」と表示する。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch7-three-heads/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                 # 共通部品（engine.py・helpers.py・figures.py・temple.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))   # 空・海の部品（scenes.py）
sys.path.insert(0, _HERE)
import engine
from scenes12 import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
STORY = r"""{
    id: 'ch7-three-heads',
    title: 'ヴァルガ',
    fadeIn: 900,
    crossfade: 700,
    quickCrossfade: 450,
    finalFade: 900,
    scenes: [
      {
        id: 'darkening', label: '暗くなる空', asset: 'tpl-scene-1', duration: 2400,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.08, x: -4, y: 1 } },
        captions: []
      },
      {
        id: 'looking-down', label: '見下ろす三つの頭', asset: 'tpl-scene-2', duration: 2800,
        camera: { from: { s: 1.06, x: 0, y: 3 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '職をつぐ灯など、二度と ともさせぬ。', in: 400, out: 2600 }
        ]
      },
      {
        id: 'name', label: '名乗り', asset: 'tpl-scene-3', duration: 3000,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.05, x: 0, y: -1 } },
        captions: [
          { text: '我が名は ヴァルガ。ダーマを焼いた者だ。', in: 300, out: 2800 }
        ],
        cues: [{ at: 1000, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <p class="title-sub">三頭魔竜</p>
      <h1 class="title-main">ヴァルガ</h1>
      {engine.title_ornament()}"""

EXTRA_CSS = """
.title-sub{margin:0 0 calc(var(--sw) * .006);font-weight:700;font-size:calc(var(--sw) * .026);letter-spacing:.5em;padding-left:.5em;
  color:#f3c08a;text-shadow:0 .08em .3em rgba(0,0,0,.85)}
.movie .title-main{font-size:calc(var(--sw) * .07);color:#ff8a5c;text-shadow:0 .048em 0 #5a1410,0 .1em .35em rgba(0,0,0,.9)}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』三頭魔竜の襲来「三つ首の影」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch7-three-heads/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×3） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。ヴァルガの頭・胴はStudioの作画コード（試作色）から。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=2（第2場面から再生） ?still=2&t=2000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第7章　襲来", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="ヴァルガ",
        end_note="試作版はここまで。第6～7章のゲームは未実装です。ゲームでは、先兵のガーゴイル軍を退けた後にこの場面が流れ、初襲来の戦いへ続く予定です。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 三つ首の影 ― 三頭魔竜の襲来（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
