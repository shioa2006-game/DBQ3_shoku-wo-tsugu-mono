# 第2章「荒れた田の村」— 実装に基づく記録

[資料の入口](../README.md) / [前章](chapter1.md) / [次章](chapter3.md)

2026-11-03整理。出典: [進行](../../../dqb3-tsugumono-ch1-3/src/game/quests2.js)、[会話・目標](../../../dqb3-tsugumono-ch1-3/src/content/chapter2.js)、[共通ステージ定義](../../../dqb3-tsugumono-ch1-3/src/game/quests.js)。

## 物語

第1章の翌日、南へつながる橋を直し、荒れた田の村でイナホに出会います。田とかまど・食堂を復旧し、食材を料理にする仕事を取り戻します。料理人の書が復活した後、泥田の主たちから田を守ります。

## 進行と成立条件

| ステージ | 主な操作・結果 |
|---|---|
| `CH2_INTRO` | 第1章 `POSTGAME` の翌日の日中に移行。ジンベエに話す |
| `FIX_BRIDGE` | 橋を完成させ、南部への道を開く |
| `REACH_VILLAGE` | イナホと話し、田の復旧へ |
| `REPAIR_PADDY` | 田を完成させ、食堂の建築へ |
| `BUILD_KITCHEN` | 食堂を完成させ、料理へ |
| `COOK_TOGETHER` | 料理カウンター `counters.cooked >= 3` で料理人の書を復活。拠点レベル4 |
| `PADDY_PREP` | ゴンタと話し、防衛開始を選ぶ |
| `PADDY_DEFENSE` | 田を守る。敗北時は `PADDY_PREP` に戻る |
| `CH2_DONE` | 勝利後の会話を経て自由行動。翌日の日中に第3章へ |

書の復活は `COOK_TOGETHER` 内から行う処理で、`REVIVE_COOK_BOOK` という独立ステージはありません。防衛準備のIDも旧資料の `PADDY_DEFENSE_PREP` ではなく `PADDY_PREP` です。料理回数の判定と、台詞で描かれる食卓の意味を区別します。

## 引き継ぐこと

新たに復活するのは料理人の書です。農民の書は第1章で復活済み。イナホが加わり、作る・育てる・料理する役割がつながります。第3章への遷移は[quests3.js](../../../dqb3-tsugumono-ch1-3/src/game/quests3.js)の `maybeStart()` が処理し、浜のワタリへの会話が入口となります。

章末の予告は「職をつぐ旅」とし、第1章と同様、島への本神殿建立を予告しません。第3章の船出へ続きます。

2026-11-07更新: 相棒の話者名を「職業の書」に統一しました。章末では農民・料理人の「二冊」が復活したと数えます。シオンが神殿から持ち出した一冊を含め、読める書は計三冊です。

## 既存の確認対象

[第2章通しテスト](../../../dqb3-tsugumono-ch1-3/tests/e2e/chapter2.test.mjs)。台詞反映後の確認結果は[不整合一覧](../inconsistencies.md#implementation-2026-11-03)を参照してください。旧脚本は[原文保存](../../../archive/story/2026-11-03/dqb3-tsugumono-ch1-3/assets/chapter2_story.md)を参照。
