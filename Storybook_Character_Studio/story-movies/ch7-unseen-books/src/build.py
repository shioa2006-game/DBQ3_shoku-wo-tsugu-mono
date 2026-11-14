"""ダーマ再興編・完「まだ見ぬ書へ」SVGストーリームービー（M14）の組み立てスクリプト。

6場面のSVG（scenes14.py、小道具は props14.py。船・ジパングの村はM4の props.py、空・海の部品はM4の scenes.py、火山はM5の
props5.py、鍛冶場・社・鳥居・桟橋はM7の props7.py、再建した神殿は ../../shared/temple.py）と、ストーリーデータ・パネルの
文言（このファイル）を、共通の再生エンジン（../../shared/engine.py）で1つの自己完結HTMLにまとめて書き出す。
人物の頭・胴は ../parts/cast.json を読む。通常は Studio ルートの npm.cmd run build:movie -- ch7-unseen-books から呼ばれる。

第6～7章はゲームより先にムービーを作るので、字幕は計画（docs/story/planned/chapter6-7-movies.md の M14）に沿って書く。
⑤⑥は第7章の台詞の方向性の例文（職業の書・シオン・結びの一文）、①～④は新しく書いた。
最後の表示は「ダーマ再興編・完」の後に、作品名「職をつぐ者」と「完」を続けて出す（タイトルの中で時間差を付ける）。

使い方:
    python build.py                     # ../index.html（Studioの /story-movies/ch7-unseen-books/）を出力
    python build.py 出力先.html          # 出力先を指定
"""
import os
import sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_MOVIES = os.path.join(_HERE, "..", "..")
sys.path.insert(0, os.path.join(_MOVIES, "shared"))                 # 共通部品（engine.py・helpers.py・figures.py・temple.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch5-return", "src"))      # 鍛冶場・社・鳥居・桟橋（props7.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch4-arrival", "src"))     # 火山（props5.py）
sys.path.insert(0, os.path.join(_MOVIES, "ch3-departure", "src"))   # 船・村と空・海の部品（props.py・scenes.py）
sys.path.insert(0, _HERE)
import engine
from scenes14 import SCENES

# ストーリーデータ（JavaScript）。camera: s=倍率、x/y=移動量（%）。captions の in/out はミリ秒。
STORY = r"""{
    id: 'ch7-unseen-books',
    title: 'ダーマ再興編・完',
    fadeIn: 1000,
    crossfade: 900,
    quickCrossfade: 500,
    finalFade: 1400,
    scenes: [
      {
        id: 'temple', label: '再開した神殿', asset: 'tpl-scene-1', duration: 5400,
        camera: { from: { s: 1.08, x: 0, y: 3 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: 'ダーマ神殿は、ふたたび 職を授ける場所になった。', in: 400, out: 5100 }
        ]
      },
      {
        id: 'farewell', label: 'ダーマの船出', asset: 'tpl-scene-2', duration: 5200,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.05, x: -2, y: 0 } },
        captions: [
          { text: 'ピノとベルクを、それぞれの島へ送り届ける 最後の航海。', in: 400, out: 4900 }
        ]
      },
      {
        id: 'zipangu', label: 'ジパング', asset: 'tpl-scene-3', duration: 5200,
        camera: { from: { s: 1.06, x: 2, y: 1 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: 'ジパングでは、田が実り、食堂に 今日も湯気が立つ。', in: 600, out: 4900 }
        ]
      },
      {
        id: 'volcano', label: '火山島', asset: 'tpl-scene-4', duration: 5200,
        camera: { from: { s: 1.06, x: 2, y: 1 }, to: { s: 1.0, x: 0, y: 0 } },
        captions: [
          { text: '火山島では、炉に火が燃え、鉄を打つ音が 響く。', in: 600, out: 4900 }
        ]
      },
      {
        id: 'onward', label: 'その先の海', asset: 'tpl-scene-5', duration: 6600,
        camera: { from: { s: 1.04, x: 1, y: 1 }, to: { s: 1.0, x: -1, y: 0 } },
        captions: [
          { text: '世界は広いぞ。まだ出会っておらぬ職業の書が、おぬしらを待っておる。', in: 300, out: 3400 },
          { text: '探しに行こう。世界中の、まだ知らない職を。', in: 3600, out: 6400 }
        ]
      },
      {
        id: 'horizon', label: '水平線', asset: 'tpl-scene-6', duration: 7200,
        camera: { from: { s: 1.0, x: 0, y: 0 }, to: { s: 1.05, x: -1, y: 1 } },
        captions: [
          { text: '――職業の書を探す旅は、これからも続いていく。', in: 300, out: 2900 }
        ],
        cues: [{ at: 3100, action: 'title', stop: true }]
      }
    ]
  }"""

# 最後の表示：「ダーマ再興編・完」→ 作品名「職をつぐ者」→「完」（タイトルが出てから時間差で続ける）
TITLE_HTML = f"""      <p class="title-arc">ダーマ再興編・完</p>
      {engine.title_ornament()}
      <h1 class="title-main title-work">職をつぐ者</h1>
      <p class="title-fin">完</p>"""

EXTRA_CSS = """
.title-arc{margin:0;font-weight:900;font-size:calc(var(--sw) * .046);letter-spacing:.2em;padding-left:.2em;
  color:#ffd94a;text-shadow:0 .048em 0 #8a5a00,0 .095em .286em rgba(0,0,0,.8)}
.movie .title-work{margin-top:calc(var(--sw) * .024);font-size:calc(var(--sw) * .072);opacity:0;
  transition:opacity 1.6s ease 2.4s,letter-spacing 2.6s cubic-bezier(.2,.7,.2,1) 2.4s,padding-left 2.6s cubic-bezier(.2,.7,.2,1) 2.4s}
.title-fin{margin:calc(var(--sw) * .004) 0 0;font-weight:900;font-size:calc(var(--sw) * .056);letter-spacing:.3em;padding-left:.3em;
  color:#fff4dc;text-shadow:0 .048em 0 #8a5a00,0 .095em .286em rgba(0,0,0,.8);opacity:0;transition:opacity 1.6s ease 3.6s}
.title-card.is-shown .title-work,.title-card.is-shown .title-fin{opacity:1}
.is-still .title-work,.is-still .title-fin{transition:none !important}
.movie .end-title{font-size:clamp(30px,6vw,60px)}
"""

COMMENT = """  『職をつぐ者』ダーマ再興編・完「まだ見ぬ書へ」SVGストーリームービー試作
  - 生成物：Storybook_Character_Studio/story-movies/ch7-unseen-books/src/build.py が書き出す。直接編集しない。
  - 完全自己完結（外部ファイル・ライブラリ・通信なし）。再生エンジンは story-movies/shared/engine.py（プロローグと共通）
  - 構成：①CSS ②HTML（ステージ/字幕/HUD/パネル） ③SVGアセット（<template>×6） ④JS（ストーリーデータ＋再生エンジン）
  - 非公式ファン企画用。イラストはすべてコードで描いたオリジナルSVG。人物の頭・胴はStudioの正式デザインの作画コードから。
  - URLパラメータ：?autoplay=1（ボタンなしで再生） ?from=5（第5場面から再生） ?still=6&t=6000（その時刻で静止） ?reduced=1（モーション軽減を強制）"""


def build(path):
    body = engine.body(
        "movie", title_html=TITLE_HTML, progress_label="ムービーの進行",
        start_label="ムービーの開始", kicker="第7章　結末", play_label="ムービーを見る",
        end_label="ムービーの終了", end_title="ダーマ再興編・完",
        end_note="試作版はここまで。第6～7章のゲームは未実装です。ゲームでは、スズハへの継承の後の最後の出航でこの場面が流れ、全7章の物語を締めくくる予定です。")
    return engine.page(path, root="movie", story_const="STORY", global_name="ShokuMovie", story_data=STORY,
                       title="職をつぐ者 まだ見ぬ書へ ― ダーマ再興編・完（SVG試作）", comment=COMMENT, body_html=body,
                       scenes=[s() for s in SCENES], extra_css=EXTRA_CSS)


if __name__ == "__main__":
    default = os.path.join(_HERE, "..", "index.html")
    out = sys.argv[1] if len(sys.argv) > 1 else default
    size = build(out)
    print(f"書き出し完了: {out}（{size:,} 文字）")
