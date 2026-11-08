"""『職をつぐ者』プロローグ SVGストーリームービーの組み立てスクリプト。

5シーンのSVG（scenes_a.py / scenes_b.py、シオンは shion.py）と、ストーリーデータ・パネルの文言（このファイル）を、
共通の再生エンジン（../../shared/engine.py）で1つの自己完結HTMLにまとめて書き出す。シオンの頭・胴は
../parts/shion-parts.json（Studioの正式デザインから src/shion_parts.mjs が書き出したもの）を読む。
通常は Studio ルートの npm.cmd run build:prologue から呼ばれる。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/prologue/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_HERE, "..", "..", "shared"))   # 共通部品（engine.py・helpers.py）
sys.path.insert(0, _HERE)
import engine
from scenes_a import scene1, scene2
from scenes_b import scene3, scene4, scene5

# ストーリーデータ（JavaScript）。演出（表示時間・字幕・カメラ・キュー）と、SVGアセットの参照だけを持つ。
#   camera: s=倍率（1=全景）、x/y=ステージ幅・高さに対する移動量（%）
#   captions: in/out はシーン開始からの時刻（ミリ秒）。group が違う字幕は同じ場所に重ねて表示する。
STORY = r"""{
    id: 'prologue',
    title: '職をつぐ者',
    fadeIn: 1200,        // 最初のシーンの黒からのフェード
    crossfade: 950,      // 自動進行時のクロスフェード
    quickCrossfade: 550, // 手動で進めたときのクロスフェード
    finalFade: 900,      // 終了時の暗転
    scenes: [
      {
        id: 'peace-ends', label: '平和の終わり', asset: 'tpl-scene-1', duration: 4800,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.14, x: 0, y: -6 } },
        captions: [
          { text: '勇者がゾーマを倒した。', in: 500, out: 4300 },
          { text: '世界には、平和が訪れるはずだった。', in: 1900, out: 4300 }
        ]
      },
      {
        id: 'monsters-return', label: '異変', asset: 'tpl-scene-2', duration: 5000,
        camera: { from: { s: 1.14, x: 0, y: -6 }, to: { s: 1.03, x: 0, y: 1 } },
        captions: [
          { text: 'しかし、平和は長く続かなかった。', in: 600, out: 4450 },
          { text: '上の世界に、再び魔物があふれ出した。', in: 2100, out: 4450 }
        ]
      },
      {
        id: 'dharma-falls', label: 'ダーマ神殿の崩壊', asset: 'tpl-scene-3', duration: 5800,
        camera: { from: { s: 1.1, x: -1, y: 4.5 }, to: { s: 1.17, x: 3.5, y: -4.5 } },
        captions: [
          { text: '職を授けるダーマ神殿も、襲われた。', in: 600, out: 5250 },
          { text: '多くの職業の書が焼かれ、人々は職を受け継ぐ道を失った。', in: 2300, out: 5250 }
        ]
      },
      {
        id: 'sion-escapes', label: 'シオンの脱出', asset: 'tpl-scene-4', duration: 7000,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.14, x: -1.5, y: -3 } },
        captions: [
          { text: 'ただ一人、神殿から逃れた見習いがいた。', in: 500, out: 4000 },
          { text: '少年の名は、シオン。', in: 2000, out: 4000 },
          { text: 'その背には、守り抜いた一冊の職業の書があった。', in: 4250, out: 6500, group: 1 }
        ]
      },
      {
        id: 'zipangu-dawn', label: 'ジパングへの漂着', asset: 'tpl-scene-5', duration: 7400,
        camera: { from: { s: 1.12, x: 3.5, y: -5.5 }, to: { s: 1.02, x: 0, y: 0.8 } },
        captions: [
          { text: 'そして、遠い島ジパングへ。', in: 600, out: 4300 },
          { text: 'ここから、失われた職を取り戻す旅が始まる。', in: 2100, out: 4300 }
        ],
        // stop: true のキューは「手動で次へ」を押したときの停止点になる（タイトルを飛ばさない）
        cues: [{ at: 4500, action: 'title', stop: true }]
      }
    ]
  }"""

TITLE_HTML = f"""      <h1 class="title-main">職をつぐ者</h1>
      {engine.title_ornament()}"""

COMMENT = """  『職をつぐ者』プロローグ SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/prologue/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×5） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。シオンの頭・胴はStudioの正式デザイン（hero2）の作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=4（第4場面から再生） ?still=4&t=3500（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "prologue", title_html=TITLE_HTML, progress_label="プロローグの進行",
        start_label="プロローグの開始", kicker="序章", play_label="プロローグを見る",
        end_label="プロローグの終了", end_title="職をつぐ者",
        end_note="試作版はここまで。本編では、このジパングの浜から第1章が始まります。")
    return engine.page(path, root="prologue", story_const="PROLOGUE_STORY", global_name="ShokuPrologue",
                       story_data=STORY, title="職をつぐ者 プロローグ（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[scene1(), scene2(), scene3(), scene4(), scene5()])


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
