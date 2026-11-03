# おおねずみの8方向コード生成・試作01

CH2の `MONSTER_TYPES.field_rat`。以前の画像 `references/nonhumanoids/field_rat_idle_a_8dir.png` と `field_rat_idle_b_8dir.png` を参照し、丸い灰色の体、大きな前歯、黄色い目、ピンクの耳・鼻・手足、節のあるしっぽをコードで描きます。元画像の画素は比較用にだけ使用します。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)の全身シート方式です。正面・斜め前は2眼、真横は1眼、斜め後ろ・背面に顔や前歯は描きません。手前の耳は体の前、奥の耳は体の後ろに置き、しっぽも方向によって前後を切り替えます。同じしっぽを二重に描きません。

## 原本と出力

- `character.mjs`: 方向別の体・耳・顔・手足・しっぽ、色、2ポーズ。
- `export.mjs`: ゲームの公式ヘルパーによるSVG描画・正規化・比較画像出力。
- `output/field_rat_code_idle_a_8dir.png`・`field_rat_code_idle_b_8dir.png`: 全身のA/Bシート。
- 同名 `.svg`・`.src.png`: SVGと正規化前PNG。
- `output/comparison.png`: 元画像と生成画像の同倍率比較。
- `output/manifest.json`: 方向順、配置、参照元、移植先と表示条件。

512×256px、4列×2行、128pxセル、透明背景。地上モンスターとして公式 `normalize` で中央63px付近・下端121pxに揃えます。影は別メッシュで、画像には描きません。

Aは通常姿勢、Bは軽くかがむ姿勢です。Bの体・顔・耳を足元付近から幅1.045・高さ0.92へ変形し、しっぽの曲線も描き替えます。足は変形せず接地を保ちます。飛行モンスターの上下動は加えません。これは待機の2ポーズで、歩行の足運びや攻撃AIの再現ではありません。

## 再生成・比較

Studioルートで実行（同じ親フォルダにゲームとその依存関係が必要）:

```powershell
npm.cmd run export:rat
npm.cmd run export:rat -- --preview-game
npm.cmd test
```

`--preview-game` は専用の `field_rat_code_idle_*` 原画と画像だけをゲーム側に書き出します。本編の元画像とモンスター定義は変更しません。

[おおねずみの比較ページ](../../compare/ch1-3/field-rat/)で8方向・A/B固定・自動再生・水中色を確認します。本編の `MonsterSprite` を倍率0.9、着色0xffffff、`yOffset=0`、切り替え間隔0.38秒で使用します。

ゲーム側で実行:

```powershell
# Studioで実行（サーバーは自動で起動する）
npm.cmd run test:compare -- field-rat
# ゲームのルートで実行
npm.cmd run test:ci
```

16セルの切れ・孤立した部品・正規化による画素欠落、接地位置、ポーズ差、クラスのUV・倍率・同期再生、水中色、狭い画面を検査します。ゲーム側の Studioの `compare/ch1-3/field-rat/preview.png`、`rig-8dir-a.png`・`rig-8dir-b.png` に比較結果を保存します。

初回試作です。元画像の毛並み、左右で異なる細かな姿勢や表情には差が残ります。全キャラクターの制作・調整後に本編へ移植し、田んぼの防衛戦などで移動・攻撃時の見え方も確認します。

## 横向きの目と足の修正

左右の横向きは、目を輪郭から顔の内側へ移し、瞳を鼻側へ向けます。胴体の後ろ側の足は隠れるため描かず、見える接地足は手前の1本だけとします。前足（手）は別部品です。A/Bと左右の両方で確認し、正面・斜め・背面の6方向は維持します。
