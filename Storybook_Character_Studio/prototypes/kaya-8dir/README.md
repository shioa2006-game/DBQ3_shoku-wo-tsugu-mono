# カヤの8方向コード生成・試作01

第4～5章の「カヤ」（町へ帰る住民、NPC ID `kaya`）を、第4～5章で使っていた `references/humanoids/volcano_villager_body_8dir.png` を参照して制作しました。真ん中分けの茶髪と低いまとめ髪、からし色の上着、青い着物、帯の結び目。

鉱山町の生き残り。まとめ髪は前向きでは頭の後ろ、後ろ向きでは髪の上に描きます。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)の頭・胴の分離と出力方式に従います。第4～5章の新しい人型に共通する描画の土台（顔の部品、胴の外形、ベルト、ぼさぼさ髪の輪郭、左右反転）は `../shared/humanoid-kit.mjs`、書き出しは `../shared/humanoid-export.mjs` にあります。

## 原本と出力

- `character.mjs`: 方向別の髪・顔の特徴・服。顔の輪郭と目・眉・鼻・口は共通部品を指定の形で使う。
- `rig-profile.mjs`: 肩・袖の接続、頭の前後位置と方向別の高さ。
- `export.mjs`: SVG、原画PNG、正規化PNG、比較画像とマニフェストの再生成。
- `output/kaya_code_head_layer_8dir.png`: 頭（顔・耳・髪・頭の装飾）。首と襟は含めない。
- `output/kaya_code_torso_layer_8dir.png`: 胴（首・襟・服・帯・ベルト）。
- `output/kaya_code_body_8dir.png`: 比較用の合成。リグ用2枚の代わりにはしない。
- `output/comparison.png`: 元画像との同倍率（2倍）比較。

## 再生成と比較

```powershell
npm.cmd run export:kaya
npm.cmd run export:kaya -- --preview-game
npm.cmd test
```

`--preview-game` は第4～5章の `assets/humanoids/kaya_code_*.png`、`art_src/kaya_code_*.src.png`、`src/content/rig-profiles/kaya.mjs` を更新します。本編の住民の設定（`src/entities/villagers.js`）は変えません。3Dリグでの比較は、第4～5章の開発サーバーで `prototypes/characters/?c=kaya` を開きます。
