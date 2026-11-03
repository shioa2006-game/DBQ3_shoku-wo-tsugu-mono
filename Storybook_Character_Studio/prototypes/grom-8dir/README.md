# 瘴泉竜グロムの8方向コード生成・試作01

第5章の章ボス「瘴泉竜グロム」を、第4～5章で使っていた `references/dragons/grom_{head,body}_8dir.png` を参照して制作しました。紺の鱗、黄土色のあごと腹板、灰色の角（大角2本と中央の角）と背中のとげ、琥珀色の目。

本編の `DragonRig`（`src/entities/dragon.js`）は、頭（2つの頭で同じ画像を使う）と胴の2枚の8方向ビルボードを、3Dの首・翼・尾でつなぎます。この原本は頭と胴の2枚だけを描き、首・翼・尾は描きません。1枚につきポーズは1つです。5方向を描き、右側の3方向は反転します。書き出しは `../shared/dragon-export.mjs`（正規化はモンスターと同じくセルごとに中心 u=.494・下端121px）。

## 再生成と比較

```powershell
npm.cmd run export:grom
npm.cmd run export:grom -- --preview-game
npm.cmd test
```

`--preview-game` は第4～5章の `assets/dragons/grom_code_{head,body}_8dir.png` と `art_src/` の原画を更新します。本編の設定（`src/entities/dragon-configs.js`）は変えません。比較は第4～5章の `prototypes/dragon/`（Studioのサーバーでは `games/ch4-5/prototypes/dragon/`）。
