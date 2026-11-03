# 第1章「漂着の浜」— 実装に基づく記録

[資料の入口](../README.md) / [次章](chapter2.md)

2026-11-03整理。主な出典は[quests.js](../../../dqb3-tsugumono-ch1-3/src/game/quests.js)と[UI・章末演出](../../../dqb3-tsugumono-ch1-3/src/ui/ui.js)。第1章の主要台詞は進行コード内にあり、独立した `chapter1.js` はありません。

## 物語

神殿から逃れたシオンはジパングへ漂着し、ビルダーの書に導かれて暮らしの場所を作ります。小屋に人が集まり、ミナと稲を育てる中で農民の書が復活します。魔物から拠点の旗を守った後、ジンベエと職業の社を建て、祭壇に祈ります。

## 進行と成立条件

| ステージ | 主な操作・結果 |
|---|---|
| `INTRO` → `GATHER_WOOD` | 漂着とビルダーの書との出会い。木材集めへ |
| `GATHER_WOOD` → `CRAFT_BENCH` → `PLACE_BENCH` | 丸太を5本集め、作業台を作って設置 |
| `BUILD_HUT` → `MEET_MINA` | 小屋を完成。職業の旗が立ち、拠点レベル1。ピノとミナが加わる |
| `MEET_MINA` → `BUILD_FARM` | ミナと話して畑作りへ |
| `BUILD_FARM` → `FARMING` → `HARVEST` | 畑完成で種を受け取り、8回の種まき・8回の収穫で進行 |
| `HARVEST` → `PREPARE` | 農民の書が復活。拠点レベル2、ゴンタが加入 |
| `PREPARE` → `DEFENSE` | ゴンタと話して防衛戦を開始。旗を守る |
| `DEFENSE` → `BUILD_SHRINE` | 勝利後にジンベエが加入。北の山の社を建築 |
| `BUILD_SHRINE` → `SHRINE_DONE` | 社完成、拠点レベル3。祭壇での祈りを待つ |
| `SHRINE_DONE` → `POSTGAME` | 祭壇で祈り、章末演出の後に自由行動へ |

収穫の判定は進行用カウンターです。農民の書の復活は第2章ではありません。ビルダーの書は最初から復活済みの扱いです（[jobs.js](../../../dqb3-tsugumono-ch1-3/src/game/jobs.js)）。

防衛の構成・失敗時の処理は[defense.js](../../../dqb3-tsugumono-ch1-3/src/game/defense.js)と `quests.js` を参照してください。

## 章末と次章

`POSTGAME` は第1～3章ゲームの最終状態ではありません。[quests2.js](../../../dqb3-tsugumono-ch1-3/src/game/quests2.js) の `maybeStart()` が翌日の日中（6時以上19時未満）に第2章を開始し、ジンベエに話しかける導線を作ります。

社は島の暮らしの中で職を継ぐ場となります。ただし章末台詞には島の山頂への「新ダーマ神殿」建立と「商人の書」の予告が残ります。後続章・計画との関係は [STORY-002](../inconsistencies.md#story-002)、[STORY-003](../inconsistencies.md#story-003) を参照。今回は台詞を変更していません。

## 既存の確認対象

[第1章通しテスト](../../../dqb3-tsugumono-ch1-3/tests/e2e/story.test.mjs)、[職業の書テスト](../../../dqb3-tsugumono-ch1-3/tests/e2e/jobs.test.mjs)。今回の整理では実行していません。
