# CH6～CH7のキャラクター・素材の移植

Storybook Character Studio でコードから描いた人物・敵・ヴァルガ・ムービー・設置物・アイコンを、この編へ写した記録です（2026-11-14）。既存2編の記録は [CH1～CH3](../../dqb3-tsugumono-ch1-3/docs/CHARACTER_ART.md)・[CH4～CH5](../../dqb3-tsugumono-ch4-5/docs/CHARACTER_ART.md)。

原本はStudioです。ゲーム側の画像・リグ設定・`prop-models.js`・ムービーを直接編集せず、Studioで直してから写してください。

## 写したもの

| 種類 | 内容 | Studioの原本 | ゲーム側 | 写し方（Studioで実行） |
|---|---|---|---|---|
| 人物9人 | シオン（`hero2`）・ミナ・ゴンタ・ワタリ・ピノ・ベルク・スズハ・アサギ・ガンゾウ | `prototypes/*-8dir/` | `assets/humanoids/*_code_{head,torso}_layer_8dir.png`、`src/content/rig-profiles/*.mjs` | `npm.cmd run sync:games` |
| 通常の敵 | 岩角ヤギ・小岩ガニ・おおねずみ（山ねずみ）・おおこうもり（洞窟こうもり） | `prototypes/{rockhorn-goat,small-rock-crab,field-rat,night-bat}-8dir/` | `assets/nonhumanoids/*_code_idle_{a,b}_8dir.png` | `npm.cmd run sync:games` |
| ガーゴイル | 通常（飛行・地上）と岩砕き（飛行・地上・攻撃）の5組 | `prototypes/gargoyle-8dir/` | `assets/nonhumanoids/gargoyle_*` | `npm.cmd run sync:games` |
| ヴァルガ | 頭・開口頭・胴の8方向と、首・翼・尾の3D、動作 | `prototypes/varuga-8dir/`（`rig.js`・`motion.mjs`・`rig-profile.mjs`） | `assets/dragons/varuga_code_*`、`src/entities/varuga-rig.js`・`varuga-motion.mjs`・`dragon-configs.js` | 画像は `sync:games`。リグと動作は同じ内容を保つ（Studioの `tests/node/varuga.test.mjs` が一致を確かめる） |
| ムービー5本 | M10～M14 | `story-movies/{ch6-arrival,ch6-roof-light,ch7-three-heads,ch7-flame-holds,ch7-unseen-books}/` | `assets/movies/*.html`、`src/content/movies.js` | `npm.cmd run sync:movies` |
| 設置物の3D | 既存の設置物と、この編の提灯・授職の灯・選択の柱（印0～4）・門・ボウガン（4方向）・大型対空ボウガン・くさびの印 | `prototypes/props-3d/models.mjs` | `src/world/prop-models.js` | `npm.cmd run export:props -- --preview-game` |
| アイテムアイコン | 全72件（この編だけの29件を追加） | `prototypes/item-icons/` | `assets/items/item_icons_16.{png,json}` | `npm.cmd run export:items -- --preview-game`（3つの編の共通画像） |

## ゲーム側で決めていること

- `src/entities/rig.js` は既存2編と同じ内容（Studioの `tests/node/game-targets.test.mjs` が一致を確かめる）。この編だけを直さない。
- 肩書きと手足の色は `src/entities/villagers.js` の `VILLAGER_DEFS`。大工の3人（アサギ・ガンゾウ・ピノ）は `builder` で、工事場で槌を振る。
- 山ねずみ・洞窟こうもりは、おおねずみ・おおこうもりの画像に色を掛けて使う（`src/entities/monster-types.js` の `tint`）。大岩ガニは小岩ガニを3倍に拡大する。
- ガーゴイルは、飛来中は飛行の絵、着地後は地上の絵へ切り替える。岩砕きは、振りかぶりと振り下ろしで攻撃の絵のA・Bを保つ（`src/entities/monsters.js` の `setSprite`・`setPose`）。
- ヴァルガの戦い用の重ね（降りる首、倒れた頭、被弾の色、黒い霧へ消える）は `src/entities/varuga-battle-rig.js`。Studioのリグを継承し、造形と動作は変えない。戦いの数値は `dragon-configs.js` の `battle`。
- 設置物の3Dは、この編だけ原本の版が5（既存2編は4のまま。共通の設置物の形は同じ）。大型対空ボウガンは、名前 `turret` の部分をゲームが狙いの向きへ回す。

## 確認

- `tests/e2e/sheets.test.mjs`: 8方向シートの大きさ・余白・中心。
- `tests/e2e/character-art.test.mjs`: 人物の分離層・リグ設定・8方向・歩行・道具。
- `tests/e2e/prop-models.test.mjs`・`item-icons.test.mjs`・`movies.test.mjs`: 設置物・アイコン・ムービーの読み込み。
- Studioの `npm.cmd test`: ゲーム側の写しがStudioの出力と一致すること。
