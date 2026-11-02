# スライムの8方向コード生成・試作01

元ゲームの `slime` を、`assets/nonhumanoids/slime_idle_a_8dir.png` と `slime_idle_b_8dir.png` を参照して制作しました。紫色のしずく形、つり気味の目、ピンクの頬、光沢をコードで描きます。元画像の画素は比較用だけに使用しています。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)のモンスター用手順に従い、人型の頭胴分離ではなく全身のA・Bシートを出力します。Aは通常、Bは接地基準から幅1.055・高さ0.9へ変形した姿です。

## 原本と出力

- `character.mjs`: 輪郭・目・口・頬・光沢とポーズの作画原本。
- `export.mjs`: ゲームの公式ヘルパーを使うSVG描画・正規化・比較出力。
- `output/slime_code_idle_a_8dir.png`、`output/slime_code_idle_b_8dir.png`: 全身の2ポーズ。
- 同名の `.svg` と `.src.png`: 作画SVGと未正規化PNG。
- `output/comparison.png`: 元画像と生成画像を同倍率で並べたA・B比較。
- `output/manifest.json`: 方向順、正規化量、表示倍率、切り替え間隔、参照画像と移植先候補。

512×256px、4列×2行、1セル128px、透明背景。両ポーズとも公式正規化でセル中央・下端121pxに揃えます。影はシートに描きません。左右の顔は反転し、光沢は画面左上の光として別に描きます。

## 再生成

同じ親フォルダにゲームとインストール済み依存関係が必要です。Studioで実行:

```powershell
npm.cmd run export:slime
npm.cmd run export:slime -- --preview-game
npm.cmd test
```

`--preview-game` はゲームの `art_src/slime_code_idle_*.src.png` と `assets/nonhumanoids/slime_code_idle_*.png` へ書き出します。元のシートと本編のモンスター定義は置き換えません。

## 比較・検証

[スライムの比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/slime/)で元画像／生成画像を並べ、A・B固定、自動切り替え、8方向、水中色を操作できます。ゲームの `MonsterSprite` を倍率0.9、着色0xffffff、切り替え間隔0.38秒で使っています。影はゲームと同じく別メッシュです。

ゲームのルートで実行:

```powershell
node tests/authoring/slime.test.mjs
npm.cmd run test:ci
```

全16セルの正規化・UV窓内への収まり、A/Bの接地位置と形状差、実際のクラスによる方向・テクスチャ切り替え、同じ位相での比較、水中色、狭い画面を確認します。`prototypes/slime/preview.png` と `rig-8dir-a.png`・`rig-8dir-b.png` に比較結果を保存します。

初版の試作です。元画像の柔らかな反射や表情には差が残ります。本編の移動・ジャンプ・攻撃AIはこの比較画面の検証対象に含めていません。最終移植には2枚とマニフェストの表示条件を揃え、同じシートを拡大・着色して使う「書喰いのスライム」も確認します。
