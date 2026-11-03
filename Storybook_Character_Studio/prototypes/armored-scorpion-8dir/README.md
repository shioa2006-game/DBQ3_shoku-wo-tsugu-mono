# 鉄甲サソリの8方向コード生成・試作01

第4～5章の「鉄甲サソリ」（モンスターID `armored_scorpion` ほか）を、第4～5章で使っていた `references/nonhumanoids/armored_scorpion_idle_{a,b}_8dir.png` を参照して制作しました。赤い継ぎ目の鉄色の甲殻、三日月のはさみ、節のある尾と毒針。Aははさみを低く、Bは振り上げて開く。

全身をA・B 2枚の8方向シートに描き、本編の `MonsterSprite` が0.38秒ごとに切り替えます。人型の頭胴分離は使いません。5方向を描き、右側の3方向は反転します。共通の書き出しは `../shared/monster-export.mjs`、細長い体・脚・溶岩のひびの部品は `../shared/monster-kit.mjs` にあります。

## 原本と出力

- `character.mjs`: 方向別・ポーズ別の形と模様。
- `export.mjs`: SVG、原画PNG、正規化PNG（セルごとに中心 u=.494、下端121px）、比較画像とマニフェスト。
- `output/armored_scorpion_code_idle_{a,b}_8dir.png`: 本編用のA・Bシート。
- `output/comparison.png`: 以前の画像との同倍率比較。

## 再生成と比較

```powershell
npm.cmd run export:scorpion
npm.cmd run export:scorpion -- --preview-game
npm.cmd test
```

`--preview-game` は第4～5章の `assets/nonhumanoids/armored_scorpion_code_idle_{a,b}_8dir.png` と `art_src/` の原画を更新します。本編のモンスター設定（`src/entities/monsters.js`）は変えません。比較は第4～5章の `prototypes/monsters/?c=armored_scorpion`（Studioのサーバーでは `games/ch4-5/prototypes/monsters/`）。
