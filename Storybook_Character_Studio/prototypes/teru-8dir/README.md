# テルの8方向コード生成・試作01

第4～5章の「テル」（鉱山町の住民、NPC ID `teru`）を、第4～5章の `assets/humanoids/volcano_villager_body_8dir.png` を参照して制作しました。茶色のおかっぱ、錆色の鉢巻き、そばかすと煤、オリーブの作業着。

専用の元画像はなく、以前はカヤの画像を色違いで使っていました。2026-11-03のユーザーの判断で新しくデザインしています（炭焼き小屋に隠れていた娘）。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)の頭・胴の分離と出力方式に従います。第4～5章の新しい人型に共通する描画の土台（顔の部品、胴の外形、ベルト、ぼさぼさ髪の輪郭、左右反転）は `../shared/humanoid-kit.mjs`、書き出しは `../shared/humanoid-export.mjs` にあります。

## 原本と出力

- `character.mjs`: 方向別の髪・顔の特徴・服。顔の輪郭と目・眉・鼻・口は共通部品を指定の形で使う。
- `rig-profile.mjs`: 肩・袖の接続、頭の前後位置と方向別の高さ。
- `export.mjs`: SVG、原画PNG、正規化PNG、比較画像とマニフェストの再生成。
- `output/teru_code_head_layer_8dir.png`: 頭（顔・耳・髪・頭の装飾）。首と襟は含めない。
- `output/teru_code_torso_layer_8dir.png`: 胴（首・襟・服・帯・ベルト）。
- `output/teru_code_body_8dir.png`: 比較用の合成。リグ用2枚の代わりにはしない。
- `output/comparison.png`: 元画像との同倍率（2倍）比較。

## 再生成と比較

```powershell
npm.cmd run export:teru
npm.cmd run export:teru -- --preview-game
npm.cmd test
```

`--preview-game` は第4～5章の `assets/humanoids/teru_code_*.png`、`art_src/teru_code_*.src.png`、`src/content/rig-profiles/teru.mjs` を更新します。本編の住民の設定（`src/entities/villagers.js`）は変えません。3Dリグでの比較は、第4～5章の開発サーバーで `prototypes/characters/?c=teru` を開きます。
