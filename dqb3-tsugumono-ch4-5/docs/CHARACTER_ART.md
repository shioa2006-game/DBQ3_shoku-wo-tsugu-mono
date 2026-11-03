# CH4～CH5のコード生成キャラクター移植

第1～3章と同じく、Storybook Character Studioでコードから描いた8方向キャラクターを本編へ移植する作業の記録です。第1～3章の記録は [CH1～CH3の移植記録](../../dqb3-tsugumono-ch1-3/docs/CHARACTER_ART.md) を参照してください。

## 進め方と状況

| 段階 | 内容 | 状況 |
|---|---|---|
| 0 | 仕組みをそろえる（リグ・書き出し先・テスト） | 2026-11-03 完了 |
| 1 | 第1～3章で作ったキャラクターの流用（主人公・ミナ・ゴンタ・ワタリ、おおこうもり・どろたぼう） | 未着手 |
| 2 | 新しい人型5人（ベルク・カヤ・ナギ・ロク・ヨモギ） | 未着手 |
| 3 | 新しいモンスター3種（鬼火・火山トカゲ・鉄甲サソリ） | 未着手 |
| 4 | 竜グロムの頭と胴 | 未着手 |

## 段階0でそろえたもの

- `src/entities/rig.js` は第1～3章と同じ内容にした。頭・胴の分離画像（`headSheetUrl`・`bodySheetUrl`）と、リグの個別設定（`headOffsetY`・`headLiftByDirection`・`bodyTopV`・`armSep`・`armRestTilt`・`shoulderLift`・`sleeveY`・`headForward`・`headDepth`・`bodyDepth`）、剣の刃の向きの補正が使える。設定を渡さない住民は従来と同じ姿勢のまま。第4～5章の道具（鉄のハンマー・山刀・鉄の剣）も同じファイルにあり、第1～3章側でも使える。
- 両編の `rig.js` は同じ内容に保つ。Studioのテスト（`tests/node/game-targets.test.mjs`）が一致を確かめる。
- Studioの `prototypes/shared/game-targets.mjs` に、各キャラクターの書き出し先のゲームを書く。Studioのテストは、書き出し先のゲームの画像（`assets/`）・原画（`art_src/`）・リグ設定（`src/content/rig-profiles/`）がStudioの出力と同じであることを確かめる。

## 今のキャラクターと予定

| キャラクター | 今の画像（assets/以下） | 予定 |
|---|---|---|
| 主人公 | humanoids/adventurer_boy_body_8dir.png | 段階1: 第1～3章と同じ `adventurer_code_body_8dir.png` とリグ設定 |
| ミナ・ゴンタ・ワタリ | humanoids/village_girl・adult_male_villager・sailor_body_8dir.png | 段階1: 第1～3章と同じ頭・胴の分離画像とリグ設定 |
| ベルク（鍛冶屋） | humanoids/blacksmith_body_8dir.png | 段階2: 新規 |
| カヤ（火山の村人）・スミ・テル | humanoids/volcano_villager_body_8dir.png（スミ・テルは手足の色違い） | 段階2: 新規。スミ・テルを描き分けるかは相談 |
| ナギ（社の巫女） | humanoids/shrine_keeper_body_8dir.png | 段階2: 新規 |
| ロク（鉱夫・炭焼き） | humanoids/miner_body_8dir.png | 段階2: 新規 |
| ヨモギ（薬師） | humanoids/herbalist_body_8dir.png | 段階2: 新規 |
| 火喰いこうもり・瘴気こうもり | nonhumanoids/night_bat_idle_{a,b}（色替え） | 段階1: 第1～3章のコード画像。色替えの色は調整し直す |
| 灰どろたぼう・瘴気どろたぼう | nonhumanoids/dorotabo_idle_{a,b}（色替え） | 段階1: 同上 |
| 鬼火・瘴気の鬼火・炉喰らいの大鬼火 | nonhumanoids/will_o_wisp_idle_{a,b} | 段階3: 新規（色替え・拡大は共用） |
| 鉄甲サソリ | nonhumanoids/armored_scorpion_idle_{a,b} | 段階3: 新規 |
| 火山トカゲ | nonhumanoids/volcano_lizard_idle_{a,b} | 段階3: 新規 |
| 竜グロム | dragons/grom_head_8dir.png・grom_body_8dir.png ＋ 3Dの首・翼・尾（`dragon.js`） | 段階4: 新規。Studioに竜の仕組みを作る |

`assets/` にあるピノ・イナホ・ジンベエ・スライム・おおねずみ・イカの以前の画像は、この編では使っていません。比較用に残すか消すかは、移植の最後に決めます。

## 確認

- 段階0: 両編の `test:ci`・`test:e2e` と Studio の `npm.cmd test`。
- 段階1以降: 第1～3章の `tests/e2e/character-art.test.mjs` に相当するテストをこの編へ移し、移植したキャラクターの画像・分離層・リグ設定・8方向・歩行・道具・A/B切替・色替えを確かめる。
