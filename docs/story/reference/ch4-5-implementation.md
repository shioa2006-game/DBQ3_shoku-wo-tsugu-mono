# 第4～5章の実装参照先

[資料の入口](../README.md) / [第4章](../implemented/chapter4.md) / [第5章](../implemented/chapter5.md)

2026-11-03整理。旧実装ガイドの計画と実装済みの内容を混同しないため、現在のコードの所在を案内します。ゲームの変更手順・必須テストは[対象AGENTS.md](../../../dqb3-tsugumono-ch4-5/AGENTS.md)に従ってください。

| 確認すること | 実装 |
|---|---|
| ステージの順序・共通状態 | [quests.js](../../../dqb3-tsugumono-ch4-5/src/game/quests.js) |
| 第4章の進行・復活条件 | [quests4.js](../../../dqb3-tsugumono-ch4-5/src/game/quests4.js) |
| 第4章の会話・目標 | [chapter4.js](../../../dqb3-tsugumono-ch4-5/src/content/chapter4.js) |
| 第5章の進行・章末 | [quests5.js](../../../dqb3-tsugumono-ch4-5/src/game/quests5.js) |
| 第5章の会話・結末 | [chapter5.js](../../../dqb3-tsugumono-ch4-5/src/content/chapter5.js) |
| 日常会話 | [smalltalk.js](../../../dqb3-tsugumono-ch4-5/src/content/smalltalk.js) |
| 固定初期状態・書の復活状態 | [newgame.js](../../../dqb3-tsugumono-ch4-5/src/game/newgame.js)、[jobs.js](../../../dqb3-tsugumono-ch4-5/src/game/jobs.js) |
| 建築とアイテム | [blueprints.js](../../../dqb3-tsugumono-ch4-5/src/game/blueprints.js)、[items.js](../../../dqb3-tsugumono-ch4-5/src/game/items.js) |
| 瘴気・穢れ石・泉 | [purification.js](../../../dqb3-tsugumono-ch4-5/src/systems/purification.js) |
| グロムの外観・戦闘 | [dragon-configs.js](../../../dqb3-tsugumono-ch4-5/src/entities/dragon-configs.js)、[dragon.js](../../../dqb3-tsugumono-ch4-5/src/entities/dragon.js)、[dragon-battle.js](../../../dqb3-tsugumono-ch4-5/src/game/dragon-battle.js) |
| 保存・復元 | [save.js](../../../dqb3-tsugumono-ch4-5/src/game/save.js)と各章の `restoreState()` |
| NPC配置・章システムの接続 | [main.js](../../../dqb3-tsugumono-ch4-5/src/main.js) |

上のゲーム側ファイルには火山島の定義と復元条件があります。動作を追う際は、[設計図の完成判定](../../../game-shared/blueprints.mjs)、[所持品・クラフト](../../../game-shared/inventory.mjs)、[防衛の波と勝敗](../../../game-shared/wave-defense.mjs)、[保存データの組み立て](../../../game-shared/save-slot.mjs)も参照してください。

第4～5章のセーブは第1～3章と独立しています。第6～7章のためにコードを再利用する場合も、現行の章・セーブ・相対パスを保つことが前提です。現在の共通ドラゴン基盤に設定が存在することと、第6～7章のボス戦が実装済みであることは別です。

旧ガイドの詳細設計・数値案・過去の作業項目は[原文保存](../../../archive/story/2026-11-03/dqb3-tsugumono-ch4-5/assets/chapter4_5_implementation_guide.md)を参照してください。そこにある仕様はコードとの照合なしに現行仕様として採用しません。
