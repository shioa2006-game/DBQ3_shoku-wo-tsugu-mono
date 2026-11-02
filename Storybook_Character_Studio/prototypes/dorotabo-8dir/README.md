# どろたぼうの8方向コード生成・試作01

CH2の `MONSTER_TYPES.dorotabo`。参照画像はゲームの `assets/nonhumanoids/dorotabo_idle_a_8dir.png` と `dorotabo_idle_b_8dir.png`。泥の塊、垂れた目と口、流れ落ちるしずく、頭と足元の草、地面へ広がる泥だまりをコードで描きます。元画像の画素は比較用にだけ使用します。

[制作ガイド](../../docs/CHARACTER_AUTHORING.md)の全身シート方式です。独立した腕・脚は作りません。正面・斜め前は2眼、真横は1眼、斜め後ろ・背面は顔なし。瞳はまぶたの下でクリップします。左右は反転しますが、陰影の明るい側は画面左に保ちます。

## 原本と出力

- `character.mjs`: 方向別の泥の輪郭、しずく、目、草、色と2ポーズ。
- `export.mjs`: 公式ヘルパーによるSVG描画・正規化・比較画像。
- `output/dorotabo_code_idle_a_8dir.png`・`dorotabo_code_idle_b_8dir.png`: 全身シート2枚。
- 同名 `.svg`・`.src.png`: SVGと正規化前PNG。
- `output/comparison.png`: 元画像／生成画像の同倍率比較。
- `output/manifest.json`: 方向順、正規化量、参照元、移植先、実際の表示条件。

512×256px、4列×2行、128pxセル、透明背景。公式 `normalize` で中心63px付近・下端121pxに揃え、画素欠落を検査します。床の影は別メッシュで、画像には描きません。

Aは通常姿勢、Bは接地位置を基準に幅1.025・高さ0.91へ変形し、泥が沈み込む姿勢です。草の根元もしずくも体と一緒に動きます。画像切り替えとゲーム本編の移動・攻撃は別の処理です。

## 再生成・比較

Studioルートで実行（同じ親フォルダにゲームとその依存関係が必要）:

```powershell
npm.cmd run export:dorotabo
npm.cmd run export:dorotabo -- --preview-game
npm.cmd test
```

`--preview-game` は専用の `dorotabo_code_idle_*` 原画・画像だけをゲーム側へ書き出します。

[どろたぼうの比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/dorotabo/)で8方向・A/B固定・交互再生・水中色を確認できます。本編の `MonsterSprite` を倍率1.15、着色0xffffff、`yOffset=0`、切り替え間隔0.38秒で使います。

ゲーム側で実行:

```powershell
node tests/authoring/dorotabo.test.mjs
npm.cmd run test:ci
```

全16セルの接地・境界・孤立した部品・正規化による画素欠落、ポーズ差、クラスのUV・倍率・同期再生、水中色、狭い画面を確認します。ゲーム側の `prototypes/dorotabo/preview.png`、`rig-8dir-a.png`・`rig-8dir-b.png` に比較結果を保存します。

初回試作です。元画像の泥の凹凸、草の細かい形や自然な左右差は簡略化しています。本編の画像・モンスター定義はまだ置き換えていません。「泥田の主」も同じシートを倍率2.4・色0xd08a6aで使用するため、最終移植時にボスの拡大・着色と泥はね攻撃も確認します。
