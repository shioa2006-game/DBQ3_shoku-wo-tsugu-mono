# ピノの8方向コード生成・試作01

第1章の大工見習い「ピノ」（NPC ID `pino`）を、`references/humanoids/village_apprentice_body_8dir.png` を参考に制作しました。紺の帽子、短い黒髪、濃い瞳、生成りの首布、赤茶色の上着と真鍮の留め具が特徴です。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)に沿って、顔・耳・髪・帽子は頭へ、首・首布・上着・ベルトは胴へ分離しました。左右対称の衣装なので5つの向きを描き、右側3方向を反転しています。元画像の画素は比較画像にだけ使用し、キャラクターの出力はすべてコードによるSVG作画です。

## 作画上の判断

- 主人公のゴーグルや金髪、ミナのボブを流用せず、ピノの短い髪と帽子の輪郭を個別に設計。
- 正面・斜め前の手前と奥・横で目の輪郭と見える幅を変え、虹彩をまぶた内へクリップ。
- 頬から顎へ曲線をつなぎ、斜め前の鼻は顔の内側へ配置。横顔だけに鼻先の輪郭を持たせる。
- 耳前の髪を帽子の下の根元からつなぎ、正面の顎下に後ろ髪を描かない。
- 横・斜め後ろ・背面の帽子は専用の丸みと裾を持たせる。縫い目は曲面に沿わせる。
- 首布は襟周り・結び目・2枚の垂れ布を描き分け、胴体だけに含める。
- 頭と胴は合成画像の正規化量を共用し、服の縮尺と裾の位置を保つ。
- ピノの肩幅・腕の開き・頭の位置は独立した `rig-profile.mjs` に保存。

## 原本と出力

| ファイル | 用途 |
|---|---|
| `character.mjs` | 方向別の作画、パレット、頭と胴の担当 |
| `export.mjs` | SVG・PNG・比較画像・マニフェストの再生成 |
| `rig-profile.mjs` | ピノ固有のリグ配置設定 |
| `output/pino-code.svg` | 比較用の合成SVG |
| `output/pino_code_body_8dir.png` | 比較用の合成PNG |
| `output/pino_code_head_layer_8dir.png` | リグに渡す頭専用PNG |
| `output/pino_code_torso_layer_8dir.png` | リグに渡す胴専用PNG |
| `output/comparison.png` | 元画像と生成画像の8方向比較 |
| `output/manifest.json` | NPC ID、参照画像、方向順、正規化量、色、読込画像、リグ設定 |

各レイヤーのSVGと未正規化 `.src.png` も同じ出力フォルダに保存します。512×256px、4列×2行、セル128px。手足・道具・床の影は画像に含めません。

## 再生成

Studioルートで実行します。同じ親フォルダのゲームのインストール済み依存関係とブラウザー環境を利用します。

```powershell
# Studio内だけを更新
npm.cmd run export:pino
# ゲームの専用比較画像と配置設定も更新
npm.cmd run export:pino -- --preview-game
```

`--preview-game` は `art_src/pino_code_*.src.png`、`assets/humanoids/pino_code_*.png` を更新します。本編用の `village_apprentice_body_8dir.png` とNPC読込設定は置き換えません。

## 比較・検証

[ピノの3D比較](../../compare/ch1-3/pino/)で、左の元画像と右の生成画像を比べます。ゲーム側の開発サーバーが必要です。表示ポートが異なる場合はURLを読み替えてください。

```powershell
# Studioルート（比較テストはサーバーを自動で起動する）
npm.cmd test
npm.cmd run test:compare -- pino
# ゲームのルート
npm.cmd run test:ci
```

8方向・待機／歩行／攻撃・道具・水中色・狭い画面を確認します。頭に首布が混入しないこと、共通の正規化量、袖と胴の交差、肩・道具の追従、胴の縮尺と裾の位置も検査します。ゲーム側の Studioの `compare/ch1-3/pino/preview.png` と `rig-8dir.png` に確認画像を保存します。

## 移植時と残る差

移植には頭用PNG、胴用PNG、`rig-profile.mjs` が必要です。`HumanoidRig` の `headSheetUrl` / `bodySheetUrl` に2枚を渡します。合成PNGだけでは分離表示になりません。

初版では元画像の細かな布の陰影・髪の光沢を簡略化しています。本編の地形・実戦での確認は最終移植時に行います。専用比較画面での確認を、本編への移植完了と扱わないでください。
