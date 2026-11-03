# CH4～CH5のコード生成キャラクター移植

第1～3章と同じく、Storybook Character Studioでコードから描いた8方向キャラクターを本編へ移植する作業の記録です。第1～3章の記録は [CH1～CH3の移植記録](../../dqb3-tsugumono-ch1-3/docs/CHARACTER_ART.md) を参照してください。

## 進め方と状況

| 段階 | 内容 | 状況 |
|---|---|---|
| 0 | 仕組みをそろえる（リグ・書き出し先・テスト） | 2026-11-03 完了 |
| 1 | 第1～3章で作ったキャラクターの流用（主人公・ミナ・ゴンタ・ワタリ、おおこうもり・どろたぼう） | 2026-11-03 完了 |
| 2 | 新しい人型7人（ベルク・ロク・カヤ・ナギ・ヨモギ・スミ・テル） | 2026-11-03 完了（試作はf8d29a3、本編へ移植） |
| 3 | 新しいモンスター3種（鬼火・火山トカゲ・鉄甲サソリ） | 2026-11-03 完了（本編へ移植） |
| 4 | 竜グロムの頭と胴 | 未着手 |

## 段階0でそろえたもの

- `src/entities/rig.js` は第1～3章と同じ内容にした。頭・胴の分離画像（`headSheetUrl`・`bodySheetUrl`）と、リグの個別設定（`headOffsetY`・`headLiftByDirection`・`bodyTopV`・`armSep`・`armRestTilt`・`shoulderLift`・`sleeveY`・`headForward`・`headDepth`・`bodyDepth`）、剣の刃の向きの補正が使える。設定を渡さない住民は従来と同じ姿勢のまま。第4～5章の道具（鉄のハンマー・山刀・鉄の剣）も同じファイルにあり、第1～3章側でも使える。
- 両編の `rig.js` は同じ内容に保つ。Studioのテスト（`tests/node/game-targets.test.mjs`）が一致を確かめる。
- Studioの `prototypes/shared/game-targets.mjs` に、各キャラクターの書き出し先のゲームを書く。Studioのテストは、書き出し先のゲームの画像（`assets/`）・原画（`art_src/`）・リグ設定（`src/content/rig-profiles/`）がStudioの出力と同じであることを確かめる。

## 段階1で流用したもの

- Studioの `game-targets.mjs` で、主人公・ミナ・ゴンタ・ワタリ・おおこうもり・どろたぼうの書き出し先を両編にした。Studioの `npm.cmd run sync:games`（`tools/sync-game-targets.mjs`）が、出力画像を `assets/`、原画を `art_src/`、リグ設定を `src/content/rig-profiles/` へ写す。作画を直したら、そのキャラクターを書き出してから `sync:games` で両編へ配る。
- 主人公（`player.js`）は `adventurer_code_body_8dir.png` と `ADVENTURER_RIG_PROFILE`。
- ミナ・ゴンタ・ワタリ（`villagers.js`）は頭・胴の分離画像（`*_code_head_layer_8dir.png`・`*_code_torso_layer_8dir.png`）とリグ設定。肩書きと手足の色はこの編のまま。
- こうもり・どろたぼうの色替え（`monsters.js`）は `*_code_idle_{a,b}_8dir.png` を使う。Studioのどろたぼうは以前の画像より明るい茶色で、灰どろたぼう・瘴気どろたぼうが普通の茶色に見えたため、灰どろたぼうを `0x98a8c0`（灰色寄り）、瘴気どろたぼうを `0x7a6ac8`（紫寄り）に変えた。火喰いこうもり（`0xff9a66`）と瘴気こうもり（`0x9a7ab8`）は今の色のままで見え方がそろう。
- `tests/e2e/character-art.test.mjs`（`test:e2e` に含む）で、画像・分離層・リグ設定・8方向の頭の間隔と向き・歩行・道具（鉄のハンマー・山刀・鉄の剣）の振り・A/B切替・色替えを確かめる。`CHARACTER_ART_SCREENSHOTS=1` を付けると `work/character-migration/` に8方向の一覧画像を書き出す。

## 段階2で作ったもの

- 2026-11-03の決定: ナギは巫女の少女として描き直す（元画像は水色の着物の少年風で、台詞「わたし」「ナギちゃん」と手足の色＝白い袖・赤い袴に合っていなかった）。スミ・テルはカヤの画像の共用をやめ、別々に描く。
- Studioの `prototypes/<名前>-8dir/` に7人の原本がある。共通の描画の土台は `prototypes/shared/humanoid-kit.mjs`、書き出しは `prototypes/shared/humanoid-export.mjs`（`npm.cmd run export:<名前> -- --preview-game`）。
- 画像は `assets/humanoids/<名前>_code_{head_layer,torso_layer,body}_8dir.png`、リグ設定は `src/content/rig-profiles/<名前>.mjs`。`src/entities/villagers.js` の7人は頭・胴の分離画像（`headSheet`・`torsoSheet`）とリグ設定（`rig`）を使う。
- 3Dリグでの比較は開発サーバー、またはStudioのサーバー（`/games/ch4-5/`）で `prototypes/characters/?c=<名前>`（左が以前の画像、右がコード生成）。左右それぞれ専用のカメラで描くので、立ち位置による見え方の差は出ない。
- 移植では、カヤ・スミ・テルの手足の色（袖・頭と胴の裏の色）を新しい服に合わせた。ベルク・ロク・ナギ・ヨモギの色はそのまま。`character-art.test.mjs` が11人の画像・分離層・リグ設定・8方向・歩行・道具を確かめる。`texture-retry.test.mjs` は、ベルクの頭の画像の読み込み失敗からの復旧を確かめる。

## 段階3で作ったもの

- Studioの `prototypes/{will-o-wisp,armored-scorpion,volcano-lizard}-8dir/` に原本がある。書き出しは `prototypes/shared/monster-export.mjs`（`npm.cmd run export:{wisp,scorpion,lizard} -- --preview-game`）。火の粉のように離れた部品があっても崩れないよう、正規化はセルごとに測る（規則は公式ツールと同じ中心 u=.494・下端121px）。
- 画像は `assets/nonhumanoids/<名前>_code_idle_{a,b}_8dir.png`。`src/entities/monsters.js` の鬼火・瘴気の鬼火・炉喰らいの大鬼火・鉄甲サソリ・火山トカゲがこれを使う（倍率・色替え・飛行の高さは以前のまま）。
- ユーザー確認での主な決定: 鬼火は炎アイコンのように、丸い底から伸びる主炎と内側へ巻く左右の舌で描く。鉄甲サソリの斜め前は正面寄り、背面はAでもはさみを下げて見せる。火山トカゲの正面・背面は頭を体から出し、Bで頭が上下する。
- `tests/e2e/character-art.test.mjs` が新しい3種と鬼火の色替え2種の画像・倍率・色・A/B切替・8方向を確かめる。
- 比較は `prototypes/monsters/?c=<名前>`。本編と同じ倍率・色替え・飛行の高さで、左右それぞれ専用のカメラで描く。鬼火は「種類」で瘴気の鬼火・炉喰らいの大鬼火の色替えも見られる。

## 今のキャラクターと予定

| キャラクター | 今の画像（assets/以下） | 予定 |
|---|---|---|
| 主人公 | humanoids/adventurer_code_body_8dir.png ＋ リグ設定 | 段階1で移植済み |
| ミナ・ゴンタ・ワタリ | humanoids/{mina,gonta,watari}_code_{head,torso}_layer_8dir.png ＋ リグ設定 | 段階1で移植済み |
| ベルク（鍛冶屋） | humanoids/belk_code_{head,torso}_layer_8dir.png ＋ リグ設定 | 段階2で移植済み |
| カヤ・スミ・テル | humanoids/{kaya,sumi,teru}_code_{head,torso}_layer_8dir.png ＋ リグ設定（3人を別々に描いた） | 段階2で移植済み |
| ナギ（社の巫女） | humanoids/nagi_code_{head,torso}_layer_8dir.png ＋ リグ設定（巫女として描き直し） | 段階2で移植済み |
| ロク（鉱夫・炭焼き） | humanoids/roku_code_{head,torso}_layer_8dir.png ＋ リグ設定 | 段階2で移植済み |
| ヨモギ（薬師） | humanoids/yomogi_code_{head,torso}_layer_8dir.png ＋ リグ設定 | 段階2で移植済み |
| 火喰いこうもり・瘴気こうもり | nonhumanoids/night_bat_code_idle_{a,b}（色替え） | 段階1で移植済み |
| 灰どろたぼう・瘴気どろたぼう | nonhumanoids/dorotabo_code_idle_{a,b}（色替え） | 段階1で移植済み（色替えの色を調整） |
| 鬼火・瘴気の鬼火・炉喰らいの大鬼火 | nonhumanoids/will_o_wisp_code_idle_{a,b}（色替え・拡大は共用） | 段階3で移植済み |
| 鉄甲サソリ | nonhumanoids/armored_scorpion_code_idle_{a,b} | 段階3で移植済み |
| 火山トカゲ | nonhumanoids/volcano_lizard_code_idle_{a,b} | 段階3で移植済み |
| 竜グロム | dragons/grom_head_8dir.png・grom_body_8dir.png ＋ 3Dの首・翼・尾（`dragon.js`） | 段階4: 新規。Studioに竜の仕組みを作る |

`assets/` にあるピノ・イナホ・ジンベエ・スライム・おおねずみ・イカの以前の画像と、段階1・2で置き換えた以前の画像（adventurer_boy・village_girl・adult_male_villager・sailor・night_bat_idle・dorotabo_idle・blacksmith・miner・volcano_villager・shrine_keeper・herbalist）は、この編では使っていません（比較ページの左側だけが使う）。比較用に残すか消すかは、移植の最後に決めます。

## 確認

- 段階0: 両編の `test:ci`・`test:e2e` と Studio の `npm.cmd test`。
- 段階1以降: 第1～3章の `tests/e2e/character-art.test.mjs` に相当するテストをこの編へ移し、移植したキャラクターの画像・分離層・リグ設定・8方向・歩行・道具・A/B切替・色替えを確かめる。
