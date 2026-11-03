# 火山トカゲの8方向コード生成・試作01

第4～5章の「火山トカゲ」（モンスターID `volcano_lizard` ほか）を、第4～5章の `assets/nonhumanoids/volcano_lizard_idle_{a,b}_8dir.png` を参照して制作しました。炭色の鱗に溶岩のひびの網目、背中へ反る尾、細い脚と長い指。Aは伏せ、Bは脚を伸ばして頭を上げる。

全身をA・B 2枚の8方向シートに描き、本編の `MonsterSprite` が0.38秒ごとに切り替えます。人型の頭胴分離は使いません。5方向を描き、右側の3方向は反転します。共通の書き出しは `../shared/monster-export.mjs`、細長い体・脚・溶岩のひびの部品は `../shared/monster-kit.mjs` にあります。

## 原本と出力

- `character.mjs`: 方向別・ポーズ別の形と模様。
- `export.mjs`: SVG、原画PNG、正規化PNG（セルごとに中心 u=.494、下端121px）、比較画像とマニフェスト。
- `output/volcano_lizard_code_idle_{a,b}_8dir.png`: 本編用のA・Bシート。
- `output/comparison.png`: 以前の画像との同倍率比較。

## 再生成と比較

```powershell
npm.cmd run export:lizard
npm.cmd run export:lizard -- --preview-game
npm.cmd test
```

`--preview-game` は第4～5章の `assets/nonhumanoids/volcano_lizard_code_idle_{a,b}_8dir.png` と `art_src/` の原画を更新します。本編のモンスター設定（`src/entities/monsters.js`）は変えません。比較は第4～5章の `prototypes/monsters/?c=volcano_lizard`（Studioのサーバーでは `games/ch4-5/prototypes/monsters/`）。
