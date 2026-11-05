# 主人公の新デザイン案・試作01

主人公の見た目の変更を検討するための案です。ユーザーの4方向デザイン画 [`references/hero-redesign-4dir-v1.png`](../../references/hero-redesign-4dir-v1.png) を基に、頭・胴を分けて8方向をコードで描きました。**本編の主人公（[adventurer-8dir](../adventurer-8dir/README.md)）は変えていません。** 出力はStudio内だけで、`game-targets.mjs` にも載せていません。

## デザイン

- 頭: ふわふわの金髪（大きな毛束、耳の高さで外へ跳ねる毛先、アホ毛）、青い瞳、薄い眉、頬の赤み。耳は髪の下から出す。
- 胴: 紺のチュニックと立ち襟、生成りのケープ（正面は中央で左右に分かれ、背面は一枚）、真鍮の留め金の革ベルト。
- 小物入れ: 左腰（正面では画面右）。左右非対称なので反転では作らない。右・右斜め後ろでは体の向こう側なので描かず、右斜め前は腰の後ろから少しだけ見せる。
- 本: 背中の小さめのかばんの上に、紺の表紙の厚い本を立てて革紐で留める。ユーザーの補足（2026-11-05）により、背面・斜め後ろではページではなく表紙（真鍮の角金具と菱形の紋章）と背を見せる。ページの小口が見えるのは横向きと左斜め前の後ろ側だけ。かばんは本より小さくし、本と区別できるようにした。
- 手足はリグが描く: 紺の袖、素手、焦げ茶のズボン、茶色のブーツ（`export.mjs` の `rigColors`）。

## 原本と出力

- `character.mjs`: 髪・顔・服・かばんと本の作画。顔の輪郭と目・眉・鼻・口は `../shared/humanoid-kit.mjs` の共通部品（`female` の丸い頬を少年の顔に使う）。
- `rig-profile.mjs`: 肩・袖の接続、頭の前後位置と方向別の高さ。
- `export.mjs`: SVG、原画PNG、正規化PNG、比較画像とマニフェストを再生成する。`studioOnly` のため `--preview-game` は使えない。
- `output/hero2_code_head_layer_8dir.png`: 頭（顔・耳・髪）。首と襟は含めない。
- `output/hero2_code_torso_layer_8dir.png`: 胴（首・襟・ケープ・服・ベルト・小物入れ・かばんと本）。
- `output/hero2_code_body_8dir.png`: 比較用の合成。
- `output/comparison.png`: デザイン画と生成画像の比較。

## 再生成と確認

```powershell
npm.cmd run export:hero2
npm.cmd test
```

3Dリグでの比較は、Studioのサーバーで [`compare/ch4-5/characters/?c=hero2`](../../compare/ch4-5/characters/?c=hero2) を開きます。左が今の主人公（本編の画像・手足の色・リグ設定）、右がこの案です。背面ではリグの頭が2Dの合成より胴へ重なるため、本は首元より下に置き、表紙の紋章と革紐が髪に隠れないようにしています。

## 採用する場合

本編へ移す段階はユーザーが決めます。採用時は次をまとめて行います。

1. `game-targets.mjs` に `humanoid('hero2', 'humanoid-layers', ['ch1-3', 'ch4-5'])` を追加し、`export.mjs` から `studioOnly` を外して `--preview-game` と `npm.cmd run sync:games` で両編へ書き出す。
2. 両編の `src/entities/player.js` を `headSheetUrl` / `bodySheetUrl` の分離読込とこの案のリグ設定・手足の色へ切り替える（今の主人公は合成シート1枚）。
3. 両編の `test:ci` と `test:e2e`、Studioの比較テストを実行し、道具を振る動作・水中色も確認する。

## 既知の差異

- デザイン画は4方向（正面・右向き・背面・左向き）だけなので、斜め4方向は推定で描いた。
- 髪は128pxセルで読める大きさの毛束にまとめており、デザイン画の細かな毛先の数は再現していない。
