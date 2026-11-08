# スミの8方向コード生成・試作02

第4～5章の「スミ」（鉱山町の住民、NPC ID `sumi`）を、第4～5章で使っていた `references/humanoids/volcano_villager_body_8dir.png` を参照して制作しました。白髪まじりのまとめ髪と櫛、青鼠の着物、藍の帯、前掛け。

専用の元画像はなく、以前はカヤの画像を色違いで使っていました。2026-11-03のユーザーの判断で新しくデザインしています（面倒見のよい年配の住民）。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)の頭・胴の分離と出力方式に従います。第4～5章の新しい人型に共通する描画の土台（顔の部品、胴の外形、ベルト、ぼさぼさ髪の輪郭、左右反転）は `../shared/humanoid-kit.mjs`、書き出しは `../shared/humanoid-export.mjs` にあります。

## 試作02（2026-11-08）

ムービーで拡大したときに、胴に描いた腕のような線が3Dの腕と重なることを直しました。

- 藍の帯と前掛けで腰はもう描けているので、胴の脇の腕のような線だけを消し、脇は輪郭の内側の陰影で丸みを出しました（`../shared/humanoid-kit.mjs` の `sideShade()`）。腕は3Dで付きます。
- 胴の外形・帯から下・首・襟は変えていないので、リグの設定とゲームの脚の付け根は今までどおりです。

## 原本と出力

- `character.mjs`: 方向別の髪・顔の特徴・服。顔の輪郭と目・眉・鼻・口は共通部品を指定の形で使う。
- `rig-profile.mjs`: 肩・袖の接続、頭の前後位置と方向別の高さ。
- `export.mjs`: SVG、原画PNG、正規化PNG、比較画像とマニフェストの再生成。
- `output/sumi_code_head_layer_8dir.png`: 頭（顔・耳・髪・頭の装飾）。首と襟は含めない。
- `output/sumi_code_torso_layer_8dir.png`: 胴（首・襟・服・帯・ベルト）。
- `output/sumi_code_body_8dir.png`: 比較用の合成。リグ用2枚の代わりにはしない。
- `output/comparison.png`: 元画像との同倍率（2倍）比較。

## 再生成と比較

```powershell
npm.cmd run export:sumi
npm.cmd run export:sumi -- --preview-game
npm.cmd test
```

`--preview-game` は第4～5章の `assets/humanoids/sumi_code_*.png`、`art_src/sumi_code_*.src.png`、`src/content/rig-profiles/sumi.mjs` を更新します。本編の住民の設定（`src/entities/villagers.js`）は変えません。3Dリグでの比較は、Studioのサーバーで `compare/ch4-5/characters/?c=sumi` を開きます（Studioの出力を表示するので、ゲームへ移す前の変更も見られます）。
