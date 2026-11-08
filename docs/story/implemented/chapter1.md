# 第1章「漂着の浜」— 実装に基づく記録

[資料の入口](../README.md) / [次章](chapter2.md)

2026-11-03整理。主な出典は[quests.js](../../../dqb3-tsugumono-ch1-3/src/game/quests.js)と[UI](../../../dqb3-tsugumono-ch1-3/src/ui/ui.js)（章末の文は2026-11-08に削除し、[削除した文字の章末](../reference/removed-text-endings.md)に記録）。第1章の主要台詞は進行コード内にあり、独立した `chapter1.js` はありません。

## 物語

ゾーマ討伐後、上の世界に再び魔物があふれ、ダーマ神殿も襲撃されます。多くの職業の書が焼かれ、散り散りになる中、神官見習いの少年シオンは一冊の職業の書を携えて脱出します。襲撃時に神殿にいた人々の中で唯一生き残ったシオンは、書とともにジパングへ漂着します。

浜でシオンが脱出の経緯を振り返ると、持ち出した書が話しかけます。書に導かれてビルダーの技を学び、暮らしの場所を作ります。小屋に人が集まり、ミナと稲を育てる中で農民の書が復活します。魔物から拠点の旗を守った後、ジンベエと職業の社を建て、祭壇に祈ります。

2026-11-07に世界観・書の持ち出しを導入会話と章末説明へ反映しました。2026-11-08に、「はじめから」の後のプロローグと、祭壇で祈った後の第1章の結び（文字の章末を置き換え）をSVGストーリームービーとして組み込みました（[ストーリームービーの挿入計画](../planned/story-movies.md#integration)）。プロローグを最後まで見たときは導入会話の冒頭3行を省きます（[STORY-008](../inconsistencies.md#story-008)）。同日、文字の章末は削除し、章末はムービーだけになりました。

## 進行と成立条件

| ステージ | 主な操作・結果 |
|---|---|
| `INTRO` → `GATHER_WOOD` | 世界の異変と、書を携えた脱出を語る。漂着した浜で職業の書が話し始め、木材集めへ |
| `GATHER_WOOD` → `CRAFT_BENCH` → `PLACE_BENCH` | 丸太を5本集め、作業台を作って設置 |
| `BUILD_HUT` → `MEET_MINA` | 小屋を完成。職業の旗が立ち、拠点レベル1。ピノとミナが加わる |
| `MEET_MINA` → `BUILD_FARM` | ミナと話して畑作りへ |
| `BUILD_FARM` → `FARMING` → `HARVEST` | 畑完成で種を受け取り、8回の種まき・8回の収穫で進行 |
| `HARVEST` → `PREPARE` | 農民の書が復活。拠点レベル2、ゴンタが加入 |
| `PREPARE` → `DEFENSE` | ゴンタと話して防衛戦を開始。旗を守る |
| `DEFENSE` → `BUILD_SHRINE` | 勝利後にジンベエが加入。北の山の社を建築 |
| `BUILD_SHRINE` → `SHRINE_DONE` | 社完成、拠点レベル3。祭壇での祈りを待つ |
| `SHRINE_DONE` → `POSTGAME` | 祭壇で祈り、章末のムービー（M1）の後に自由行動へ |

収穫の判定は進行用カウンターです。農民の書の復活は第2章ではありません。シオンが持ち出した職業の書は最初から読めるため、システム上は復活済みの扱いです。内部IDはセーブ互換性のため `builder` を維持します（[jobs.js](../../../dqb3-tsugumono-ch1-3/src/game/jobs.js)）。

防衛の構成・失敗時の処理は[defense.js](../../../dqb3-tsugumono-ch1-3/src/game/defense.js)と `quests.js` を参照してください。

## 章末と次章

`POSTGAME` は第1～3章ゲームの最終状態ではありません。[quests2.js](../../../dqb3-tsugumono-ch1-3/src/game/quests2.js) の `maybeStart()` が翌日の日中（6時以上19時未満）に第2章を開始し、ジンベエに話しかける導線を作ります。

社はこの島で人から人へ職を受け継ぐ場所です。章末にはシオンがビルダーとして認められ、料理人・船乗り・鍛冶屋・僧侶の書へ旅が続くと予告します。神官としては見習いのままです。島の山頂に本神殿を建立する予告と、商人の書の予告は削除しました（[STORY-002](../inconsistencies.md#story-002)、[STORY-003](../inconsistencies.md#story-003)、[STORY-005](../inconsistencies.md#story-005)）。

## 既存の確認対象

[第1章通しテスト](../../../dqb3-tsugumono-ch1-3/tests/e2e/story.test.mjs)、[職業の書テスト](../../../dqb3-tsugumono-ch1-3/tests/e2e/jobs.test.mjs)。台詞反映後の確認結果は[不整合一覧](../inconsistencies.md#implementation-2026-11-03)を参照してください。
