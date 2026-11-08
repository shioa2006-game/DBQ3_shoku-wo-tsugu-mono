# ヨモギの8方向コード生成・試作02

第4～5章の「ヨモギ」（薬草の知恵を持つ住民、NPC ID `yomogi`）を、第4～5章で使っていた `references/humanoids/herbalist_body_8dir.png` を参照して制作しました。銀髪のまとめ髪、葉の刺繍の緑の頭巾、丸い眼鏡、生成りのベスト。

薬師の老婆。頭巾は耳の高さで左右に張り出す三角の布として描き、眼鏡は頭に置きます。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)の頭・胴の分離と出力方式に従います。第4～5章の新しい人型に共通する描画の土台（顔の部品、胴の外形、ベルト、ぼさぼさ髪の輪郭、左右反転）は `../shared/humanoid-kit.mjs`、書き出しは `../shared/humanoid-export.mjs` にあります。

## 試作02（2026-11-08）

ムービーで拡大したときに腰から下がなく見えることと、胴に描いた腕の線が3Dの腕と重なることを直しました（ミナの試作06と同じ直し方。共通部品は `../shared/waist.mjs`）。

- ベルトを腰の位置（セルの100px付近。主人公と同じ高さ）へ上げ、その下にベストの裾を描きました。生成りのベストは胴の輪郭に沿ってベルトの下まで続きます。共通部品の `waistShell()`・`waistBelt()`（`../shared/humanoid-kit.mjs`）を使います。
- 胴の脇の腕のような線を消し、脇は輪郭の内側の陰影で丸みを出します。腕は3Dで付きます。
- 胴の下端（裾）・幅・首・襟は変えていないので、リグの設定とゲームの脚の付け根は今までどおりです。

## 原本と出力

- `character.mjs`: 方向別の髪・顔の特徴・服。顔の輪郭と目・眉・鼻・口は共通部品を指定の形で使う。
- `rig-profile.mjs`: 肩・袖の接続、頭の前後位置と方向別の高さ。
- `export.mjs`: SVG、原画PNG、正規化PNG、比較画像とマニフェストの再生成。
- `output/yomogi_code_head_layer_8dir.png`: 頭（顔・耳・髪・頭の装飾）。首と襟は含めない。
- `output/yomogi_code_torso_layer_8dir.png`: 胴（首・襟・服・帯・ベルト）。
- `output/yomogi_code_body_8dir.png`: 比較用の合成。リグ用2枚の代わりにはしない。
- `output/comparison.png`: 元画像との同倍率（2倍）比較。

## 再生成と比較

```powershell
npm.cmd run export:yomogi
npm.cmd run export:yomogi -- --preview-game
npm.cmd test
```

`--preview-game` は第4～5章の `assets/humanoids/yomogi_code_*.png`、`art_src/yomogi_code_*.src.png`、`src/content/rig-profiles/yomogi.mjs` を更新します。本編の住民の設定（`src/entities/villagers.js`）は変えません。3Dリグでの比較は、Studioのサーバーで `compare/ch4-5/characters/?c=yomogi` を開きます（Studioの出力を表示するので、ゲームへ移す前の変更も見られます）。
