import { JobBooks } from "../../../game-shared/job-books.mjs";
import { stageIndex } from "./quests.js";
import { SFX } from "./sfx.js";

// 職業の書のデータ定義とマネージャ。
//
// 職業を追加するときは JOBS にエントリを足すだけで、職業の書UI・復活演出・
// セーブ/ロードのすべてが追従する。物語側の演出（住民の加入・会話・ステージ
// 遷移）は QuestManager が revive() の完了コールバックで行う。
//
// 各職業の定義:
//   name          書の名前（UI表示・復活演出で使用）
//   lockedDesc    未復活時の説明文
//   revivedDesc   復活後の説明文
//   startRevived  最初から読める状態か（シオンが持ち出した職業の書のみ true）
//   progress(game) 復活までの進捗 0..1（職業の書UIのゲージ）
export const JOBS = {
  // 既存セーブとの互換性のため、話す職業の書の内部IDは builder を維持する。
  builder: {
    name: "職業の書",
    lockedDesc: "",
    revivedDesc: "シオンがダーマ神殿から守り抜いた、話す書。暮らしを築き、職をつなぐ旅の相棒。",
    startRevived: true,
    progress(game) {
      const bp = game.blueprints.completed;
      const built = [game.workbenches.size > 0, bp.has("hut"), bp.has("farm"), bp.has("shrine")];
      return built.filter(Boolean).length / built.length;
    },
  },
  farmer: {
    name: "農民の書",
    lockedDesc: "白紙のページ……。畑を作り、共に働けば 文字は戻るはず。",
    revivedDesc: "ミナの手で よみがえった。土と水と、まごころの書。",
    progress(game) {
      const c = game.quests.counters;
      return Math.min(1, (Math.min(8, c.planted) / 8) * 0.5 + (Math.min(8, c.harvested) / 8) * 0.5);
    },
  },
  cook: {
    name: "料理人の書",
    lockedDesc: "白紙のページ……。かまどに火を入れ、料理をふるまえば 文字は戻るはず。",
    revivedDesc: "イナホの手で よみがえった。湯気とまごころ、おいしいの書。",
    progress(game) {
      return Math.min(1, (game.quests.counters.cooked ?? 0) / 3);
    },
  },
  sailor: {
    name: "船乗りの書",
    lockedDesc: "白紙のページ……。船を直し、帆を上げれば 文字は戻るはず。",
    revivedDesc: "ワタリの手で よみがえった。潮風と羅針盤、海をゆく者の書。",
    progress(game) {
      const bp = game.blueprints.completed;
      const done = [bp.has("ship_hull"), bp.has("ship_mast"), bp.has("ship_sail")];
      return done.filter(Boolean).length / done.length;
    },
  },
};

export class JobManager extends JobBooks {
  constructor(game) {
    super(game, JOBS, SFX);
  }

  // 旧セーブ（jobs キーなし）は、当時の暗黙ルール
  // 「ステージが PREPARE 以降なら農民の書は復活済み」から導出する。
  load(data, stage) {
    if (data?.revived) {
      for (const id of data.revived) this.revived.add(id);
    } else if (stage && stageIndex(stage) >= stageIndex("PREPARE")) {
      this.revived.add("farmer");
    }
  }
}
