# ミナの8方向コード生成・試作05

第1～3章の農家の少女「ミナ」（NPC ID `mina`）を選び、`references/humanoids/village_girl_body_8dir.png` を参考に制作しました。茶色のボブヘア、茶色の目、白い襟、深緑の服、金色のボタンとベルトが特徴です。

## 原本と出力

- `character.mjs`: 方向別の顔・ボブヘア・襟・服・ベルトのSVG作画。元画像の画素は使いません。
- `../shared/`: 主人公と共用する目・鼻、SVG部品、方向順。目のサイズ・虹彩色はキャラクターごとに指定します。
- `export.mjs`: ブラウザーでのラスタライズと、ゲーム既存手順による正規化。
- `rig-profile.mjs`: ミナ用の腕の接続・頭と胴体の配置調整。最終移植時に画像と合わせて渡す原本。
- `output/mina-code.svg`: 再編集可能なベクター出力。
- `output/mina_code_body_8dir.src.png`: 未正規化の原画。
- `output/mina_code_body_8dir.png`: 比較用の合成PNG。3D表示には下記の2枚を使います。
- `output/mina_code_head_layer_8dir.png`: 頭専用（顔・耳・髪）。襟・首・服は含めません。
- `output/mina_code_torso_layer_8dir.png`: 胴体専用（首・襟・服・ベルト）。各レイヤーのSVG・未正規化 `.src.png` も保存します。
- `output/comparison.png`: 元画像とコード生成の比較。
- `output/manifest.json`: 方向順、正規化量、元のNPC ID、移植先候補、3D手足の色。

Studioルートから実行します。同じ親フォルダにゲームの第1～3章と、そのインストール済み依存関係が必要です。

```powershell
# 通常は制作フォルダ内だけに出力
node prototypes/mina-8dir/export.mjs

# 比較画面を更新するときだけ、ゲーム側の専用試作画像にも出力
node prototypes/mina-8dir/export.mjs --preview-game
```

`--preview-game` は合成画像と頭・胴体レイヤーの原画を `art_src/`、正規化済みPNGを `assets/humanoids/` に出力します。本編で使う `village_girl_body_8dir.png` とNPCの読込設定は変更しません。

## 表示と確認

Studioのサーバー（`start-studio.bat`）で [`compare/ch1-3/mina/`](../../compare/ch1-3/mina/) を開きます。主人公との切り替えリンクがあります。手足の色・寸法と照明を揃え、左側は元画像・従来の配置、右側はコード生成画像・調整済みの配置で比較します。

確認のコマンド:

```powershell
# Studioで実行（サーバーは自動で起動する）
npm.cmd run test:compare -- mina
# ゲームのルートで実行
npm.cmd run test:ci
```

8方向・待機・歩行・攻撃・道具・水中色、頭と胴のUV窓、正規化による画素欠落、390px幅での横溢れを確認します。配置の検査では動作の複数位相で袖上端と胴体の交差、胴の上下動への肩の追従、道具の手元への追従、頭と胴の前後関係も確認します。比較画面の `preview.png` と `rig-8dir.png` はゲーム側の Studioの `compare/ch1-3/mina/` に保存されます。

## 制作・移植の前提

顔・髪は頭用、首・襟・服は胴体用に分離し、`HumanoidRig` の `headSheetUrl` / `bodySheetUrl` に渡します。従来の合成画像からの切り出しでは約6.4pxの重複帯に襟が入り、二重に表示されていました。原因と今後の確認手順は [共通制作ガイド](../../docs/CHARACTER_AUTHORING.md) を参照してください。

頭と胴の正規化は別々に行わず、合成画像の正規化で得た移動量を共用します。`tuning.bodyTopV = .54` で胴の読込窓を首まで広げ、箱を上へ延長することで服の縮尺と裾の位置を維持します。移植には頭・胴の2枚と `rig-profile.mjs` が必要です。比較用の合成PNGだけでは修正が適用されません。検査では頭の襟帯が透明なこと、2枚の位置合わせと画素欠落、従来の画像共有、服の縮尺・裾位置を確認します。

512×256px、4列×2行、1セル128px。正面・左斜め前・左・左斜め後・背面を作画し、右側は反転します。長髪は顔より後ろに置き、髪の細線は髪の輪郭でクリップします。手足と道具はPNGに描き込みません。

`HumanoidRig` に任意の `tuning` 項目を追加しました。`armSep` は肩幅、`armRestTilt` は腕の開き、`shoulderLift` は肩の高さ補正、`sleeveY` は袖の中心位置、`headForward` は向いている方向への頭の横移動、`headDepth`・`bodyDepth` はカメラに対する奥行き、`headOffsetY` は頭の高さ補正です。値は `rig-profile.mjs` と生成マニフェストに記録しています。指定しない場合は従来の配置を維持します。現在は比較画面右側のミナだけに適用し、本編のNPC・主人公には適用していません。

元画像の細い前髪や髪の光沢、布の細かな陰影には差が残ります。顔・髪・衣装を比較画面で調整し、全キャラクターの制作が完了した段階で本編へ移植する運用を想定しています。
