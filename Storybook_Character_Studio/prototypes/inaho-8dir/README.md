# イナホの8方向コード生成・試作01

元ゲームの料理見習い「イナホ」（NPC ID `inaho`、参照画像 `assets/humanoids/cook_body_8dir.png`）を制作しました。白いコック帽、黒いボブヘア、赤い首布、黄土色の服と生成りの前立てが特徴です。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)を基に、顔・髪・帽子は頭へ、首・首布・服は胴へ分離しています。参照画像の画素は比較画像だけに使い、生成シートはSVGのパス・グラデーションから描きます。

## 原本と出力

- `character.mjs`: イナホ独自の帽子の輪郭・ひだ、ボブ、顔、首布、服。共通の目・鼻・SVG部品を利用。
- `rig-profile.mjs`: 肩、頭と胴の前後位置、8方向の頭の高さ。移植時に画像と一緒に渡す設定。
- `export.mjs`: PNG・SVG・比較画像・マニフェストの生成。頭と胴には合成シートと同じ正規化量を適用。
- `output/inaho_code_head_layer_8dir.png`: 顔・耳・髪・帽子だけの頭用シート。
- `output/inaho_code_torso_layer_8dir.png`: 首・首布・服・ベルトの胴用シート。
- `output/inaho_code_body_8dir.png`: 比較用合成。リグ用の2枚の代わりには使わない。
- `output/comparison.png`: 元画像と生成画像の8方向比較。
- `output/manifest.json`: NPC ID、元画像、出力寸法、正規化、色、配置設定、移植先候補。

各レイヤーのSVG・未正規化 `.src.png` も保存します。512×256px、4列×2行、セル128px。正面・左斜め前・左・左斜め後ろ・背面を描き、対称な衣装の右側3方向は反転します。3D手足・道具・床の影は焼き込みません。

## 再生成と比較

同じ親フォルダにゲームとインストール済み依存関係が必要です。ゲームの公式ブラウザーヘルパーを使います。Studioルートで実行:

```powershell
npm.cmd run export:inaho
# ゲームの専用比較画面も更新
npm.cmd run export:inaho -- --preview-game
npm.cmd test
```

`--preview-game` はゲームの `art_src/inaho_code_*.src.png`、`assets/humanoids/inaho_code_*.png`、`prototypes/inaho/rig-profile.mjs` を更新します。本編の `cook_body_8dir.png` とNPC設定は置き換えません。

[イナホの3D比較](http://127.0.0.1:5175/builder_sprite_lab/prototypes/inaho/)を開きます。ゲームの開発サーバーが必要です。左は元画像・従来配置、右は生成画像・イナホ用配置です。ゲームのルートで実行:

```powershell
$env:PROTOTYPE_URL='http://127.0.0.1:5175/builder_sprite_lab/prototypes/inaho/'
node tests/authoring/inaho.test.mjs
node tests/authoring/head-spacing.test.mjs
node tests/authoring/sword-edge.test.mjs
npm.cmd run test:ci
```

8方向・待機／歩行／攻撃・道具・水中色・狭い画面、袖と胴の交差、肩と道具の追従、頭に赤い首布が混入しないことを確認します。横の後ろ髪は首布の高さまで届くため、その帯が完全に透明であることは要求しません。比較画像はゲーム側の `prototypes/inaho/` へ保存します。

## 今回の造形と残る差

帽子は方向別のふくらみ・折り目・帯を描き、後ろ姿にも首布の結び目と垂れ布を持たせました。左右・斜め前は同倍率で比較し、顔だけの幅と高さを別々に調整しました。首布・胴は縮めず、頭の高さは固有の配置設定で扱います。

元画像の柔らかな髪の毛先、帽子の細かな陰影、布の質感には差が残る初版です。本編の地形・実戦での表示は最終移植時に検証します。移植には頭・胴の2枚、配置設定、`HumanoidRig` の分離読込と方向別頭高さへの対応が必要です。
