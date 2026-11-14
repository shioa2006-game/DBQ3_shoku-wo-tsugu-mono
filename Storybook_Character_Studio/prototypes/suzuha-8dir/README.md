# スズハ：8方向SVG・試作02

第6〜7章向けのStudio試作です。承認済みの [元画像v2](../../references/suzuha-8dir-v2.png) を基準に、編集できるSVGのパス・楕円・グラデーションで制作しました。元水汲み役・神殿の世話役候補の設定で、こめかみの白髪・低いお団子、生成りの前掛けと青灰色の腰布を再現しています。

試作02ではカヤと同じ目の描画部品を使い、縦長の瞳孔と小さい反射光、左右の視線を調整しました。[目元の比較](output/eye-style-comparison.png)で確認できます。

## 原本と出力

- [character.mjs](character.mjs)：5方向の作画と右側への反転。左右非対称の小物は、身体の左腰として見える方向だけに描画。
- [rig-profile.mjs](rig-profile.mjs)：手足の色と頭・胴の配置。画像と一緒に扱う設定。
- [合成SVG](output/suzuha-code.svg)、[頭SVG](output/suzuha_code_head_layer_8dir.svg)、[胴SVG](output/suzuha_code_torso_layer_8dir.svg)。元画像の埋め込みはありません。
- [比較画像](output/comparison.png)、[頭・胴・合成](output/layers.png)、[拡大画像](output/preview.png)。
- [3D比較](../../compare/ch4-5/characters/?c=suzuha)：元画像とSVGを手足つきで比較し、8方向・歩行・道具動作を確認。

1セル128px、4列×2行。正面→左斜め前→左→左斜め後→背面→右斜め後→右→右斜め前です。頭は顔・髪・耳、胴は首・襟・衣服・腰の小物を担当し、手足はリグから付けます。胴中心は x=63.232、合成の裾は y=121 に統一しています。元画像はセル443.5pxを共通倍率.274で縮小し、同じ胴中心に配置します。

## 再生成と確認

Studioで実行します。

```powershell
npm.cmd run export:suzuha
npm.cmd test
npm.cmd run test:compare -- suzuha
npm.cmd start
```

起動後、表示されたURLの `compare/ch4-5/characters/?c=suzuha` を開きます。PNGとSVGは単体でも確認できます。比較ページはHTTPサーバー経由で開いてください。

第6〜7章は未実装のため、現時点の出力先はStudio内だけです。`game-targets.mjs` への追加や既存ゲームへの配布はしていません。
