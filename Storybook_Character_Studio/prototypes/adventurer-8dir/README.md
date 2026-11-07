# 主人公の8方向コード生成・試作07

> 2026-11-07に本編の主人公は新しいデザイン [hero2-8dir](../hero2-8dir/README.md) へ切り替えた。この主人公の画像とリグ設定は、Studioの比較ページで以前の主人公として使うため、両編の `assets/` にも残している。

第1～3章の主人公の以前の画像 `references/humanoids/adventurer_boy_body_8dir.png` を参考に、青い帽子・真鍮のゴーグル・金髪・赤いスカーフ・青い上着をコードで制作した試作です。

## 原本と生成物

- `character.mjs`: SVGのパス・グラデーションによる造形の原本。入力画像の画素は使用しません。
- `rig-profile.mjs`: 方向別の頭の高さ。画像と合わせて移植する配置設定の原本。
- `export.mjs`: 透明Canvasへのラスタライズ、既存ゲームの正規化、PNG・比較画像・マニフェストの出力。
- `output/adventurer-code.svg`: コードから生成したベクター画像。
- `output/adventurer_code_body_8dir.png`: 正規化済みのゲーム向けPNG。
- `output/adventurer_code_body_8dir.src.png`: 未正規化の原画PNG。
- `output/comparison.png`: 元画像と生成画像の比較。
- `output/manifest.json`: 方向順・出力寸法・正規化量。

同じ親フォルダに `dqb3-tsugumono-ch1-3` があり、その依存関係がインストールされている環境で、Studioルートから実行します。

```powershell
node prototypes/adventurer-8dir/export.mjs
# ゲーム側の専用比較画像も更新するときだけ指定
node prototypes/adventurer-8dir/export.mjs --preview-game
```

ゲーム側の `tests/helpers.mjs` のブラウザー解決と `tools/normalize_sheet.mjs` を利用します。通常はStudio内だけへ出力します。`--preview-game` を付けるとゲーム側の以下の専用ファイルも更新します。既存主人公の画像や読込設定は変更しません。

```text
dqb3-tsugumono-ch1-3/
  art_src/adventurer_code_body_8dir.src.png
  assets/humanoids/adventurer_code_body_8dir.png
```

## 描画仕様

修正の経緯と次の制作へ生かす判断基準は [共通制作ガイド](../../docs/CHARACTER_AUTHORING.md) にまとめています。過去版PNGへの依存はなく、現在のコードから再生成できます。

512×256px、4列×2行、1セル128×128px。方向順は `front, front_left, left, back_left, back, back_right, right, front_right`。頭・胴だけを描き、手足・道具・影は焼き込みません。人型の固定UV窓に合わせ、頭と胴の境界をセル上端から約70～78pxの帯へ置いています。

正面・左斜め前・左・左斜め後・背面の5種類を描き分け、右側3方向は左右対称な衣装を反転して作ります。左右非対称の髪飾り・装備を追加する場合は、その部品の左右対応を別途実装してください。ゲームの3D道具はPNGに含まれず、反転の影響を受けません。

これは身体の3D形状から全方向を自動投影する方式ではありません。方向別に設計した形を共通パーツから組み立てる、コードによる2D作画です。色は `DEFAULT_PALETTE`、形は `torso / scarf / face / fringe / cap` で調整できます。元画像の精密な陰影・髪の量感を再現しきった完成版ではありません。

## 3Dリグとの比較

Studioのサーバー（`start-studio.bat`）で [`compare/ch1-3/adventurer/`](../../compare/ch1-3/adventurer/) を開きます。

元画像と生成画像を同じ `HumanoidRig`・照明・寸法で表示し、8方向、待機・歩行・攻撃、木のハンマー・銅の剣、水中の色を切り替えられます。この画面はStudioの比較用で、ゲームには含まれません。

右側の生成画像には `rig-profile.mjs` の方向別頭高さを適用します。頭と胴の食い込みを減らし、合成シートに含まれるスカーフが分断しない範囲に抑えています。左側の元画像は従来の配置です。

```powershell
# Studioで実行（サーバーは自動で起動する）
npm.cmd run test:compare -- adventurer
# ゲームのルートで実行
npm.cmd run test:ci
```

専用テストはセル数・透明余白・中心・頭胴のUV窓・正規化による欠落がないことを検査します。ブラウザーでは8方向、歩行と攻撃の代表姿勢、道具の取付、水中色、画面幅390pxでの横溢れ、読込エラーを確認し、Studioの `compare/ch1-3/adventurer/` に `preview.png` と `rig-8dir.png` を保存します。

本編の地形・水面・実戦での見え方、全アニメーション位相、左右非対称な装備、他のキャラクターへの汎用化はこの試作の検証範囲に含みません。
