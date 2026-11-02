# ゴンタの8方向コード生成・試作01

元ゲームの「ゴンタ」（NPC ID `gonta`、役割「村の若者」）を、`assets/humanoids/adult_male_villager_body_8dir.png` を参照して制作しました。短く流した茶髪、太い眉、少し広い顎、生成りの襟と緑の服、金具付きの革ベルトを個別に描いています。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)に沿って、顔・耳・髪は頭、首・襟・服は胴へ分離しています。既存の子どもの顔をそのまま流用せず、共通の目・鼻とSVG部品からゴンタの比率を設計しました。元画像の画素は比較画像だけに使います。

## 原本と出力

- `character.mjs`: 方向別の輪郭、毛束、太い眉、顔、襟、服の作画原本。
- `rig-profile.mjs`: 肩の接続、頭と胴の前後位置、方向別の頭の高さ。
- `export.mjs`: SVG・PNG・比較画像とマニフェストの再生成。
- `output/gonta_code_head_layer_8dir.png`: 顔・耳・髪の頭用シート。
- `output/gonta_code_torso_layer_8dir.png`: 首・襟・服・ベルトの胴用シート。
- `output/gonta_code_body_8dir.png`: 比較用合成。分離した2枚の代わりにリグへ渡さない。
- `output/comparison.png`: 元画像との8方向比較。
- `output/manifest.json`: NPC ID・参照画像・正規化量・色・リグ設定・移植先候補。

各レイヤーのSVG・未正規化 `.src.png` も保存します。頭と胴は合成シートの正規化量を共用します。512×256px、4列×2行、セル128px。左右対称な髪・服なので5方向を描き、残る3方向は反転します。手足・道具・影は画像に含めません。

## 再生成・比較

同じ親フォルダにゲームとインストール済み依存関係が必要です。Studioルートで実行します。

```powershell
npm.cmd run export:gonta
# ゲームの専用比較画面も更新
npm.cmd run export:gonta -- --preview-game
npm.cmd test
```

`--preview-game` はゲーム側の `art_src/gonta_code_*.src.png`、`assets/humanoids/gonta_code_*.png`、`prototypes/gonta/rig-profile.mjs` を更新します。本編用の元画像とNPC設定は置き換えません。

[ゴンタの3D比較](http://127.0.0.1:5175/builder_sprite_lab/prototypes/gonta/)では、左に元画像・従来配置、右に生成画像・専用配置を表示します。ゲームの開発サーバーが必要です。本編で装備する石の剣も選択できます。ゲームのルートで実行:

```powershell
$env:PROTOTYPE_URL='http://127.0.0.1:5175/builder_sprite_lab/prototypes/gonta/'
node tests/authoring/gonta.test.mjs
node tests/authoring/head-spacing.test.mjs
node tests/authoring/sword-edge.test.mjs
npm.cmd run test:ci
```

頭・胴の画素欠落や襟の混入、8方向・待機／歩行／攻撃・水中色・狭い画面、袖と胴の接続、道具の手への追従を検査します。ゲームの `prototypes/gonta/` に全方向・真横・斜め前などの比較画像が保存されます。

## 初版の判断と残る差

元画像と同倍率で比べ、髪の外周が均一なトゲに見えないよう曲線で頭の丸みを作り、毛束の筋を輪郭内へ収めました。目はやや縦を抑え、眉と顎を子どものキャラクターよりしっかりさせています。衣装は少し広い胴に合わせて肩位置を設定し、首の高さは方向別に調整しました。

細かな髪の流れ、布の陰影、元画像の大人らしい表情には差が残る試作です。本編の地形・実戦での表示は最終移植時に検証します。移植には分離した2枚のPNG、配置設定、対応する `HumanoidRig` の読込処理が必要です。

### 肩の高さの修正

初版では袖上端が首元まで上がって見えたため、`shoulderLift` を `0.018` から `-0.012` へ、`sleeveY` を `-0.095` から `-0.110` へ変更しました。肩の支点を0.030、支点に対する袖の中心を0.015下げています。胴・頭の作画や配置は維持し、手と道具は下げた肩へ追従します。8方向の待機・歩行・攻撃で袖と胴の交差、肩の上下動、握り位置を確認します。
