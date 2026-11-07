import { JobBooks } from "../../../game-shared/job-books.mjs";
import { SFX } from "./sfx.js";

// 職業の書のデータ定義とマネージャ。
//
// 火山島編はジパング復興編の正史（持ち出した職業の書と、農民・料理人・船乗りの書の復活）を組み込んだ
// 固定状態から始まる。本章で復活させるのは鍛冶屋の書、第5章で僧侶の書。
// ロードデータが無い場合はこの固定状態をそのまま使い、ステージ名から復活状態を
// 推測する処理は持たない（実装ガイド 5 章）。
//
// 各職業の定義:
//   name          書の名前（UI表示・復活演出で使用）
//   lockedDesc    未復活時の説明文
//   revivedDesc   復活後の説明文
//   startRevived  ニューゲーム時点で復活済みか
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
      const built = [bp.has("coast_camp"), bp.has("mine_entrance"), bp.has("kiln_site"), bp.has("forge"), bp.has("canteen")];
      return built.filter(Boolean).length / built.length;
    },
  },
  farmer: {
    name: "農民の書",
    lockedDesc: "",
    revivedDesc: "ジパングでミナがよみがえらせた書。火山灰の畑でも土は生きている。",
    startRevived: true,
    progress() {
      return 1;
    },
  },
  cook: {
    name: "料理人の書",
    lockedDesc: "",
    revivedDesc: "イナホがよみがえらせた書。その火は、海を渡って鉄鍋へ受け継がれる。",
    startRevived: true,
    progress() {
      return 1;
    },
  },
  sailor: {
    name: "船乗りの書",
    lockedDesc: "",
    revivedDesc: "ワタリがよみがえらせた書。島と人と資材を、船がつなぐ。",
    startRevived: true,
    progress() {
      return 1;
    },
  },
  blacksmith: {
    name: "鍛冶屋の書",
    lockedDesc: "白紙のページ……。炉に火を戻し、暮らしの鉄を打てば 文字は戻るはず。",
    revivedDesc: "ベルクの手で よみがえった。鉄に暮らしの役割を与える者の書。",
    startRevived: false,
    progress(game) {
      const bp = game.blueprints.completed;
      const f = game.quests.flags;
      const steps = [
        bp.has("mine_entrance"),
        bp.has("kiln_site"),
        bp.has("forge"),
        !!f.forgedHammer,
        !!f.forgedFitting,
        !!f.forgedPot,
        bp.has("canteen"), // 鉄鍋を据えた食堂＝暮らしの鉄の完成形
      ];
      return steps.filter(Boolean).length / steps.length;
    },
  },
  priest: {
    name: "僧侶の書",
    lockedDesc: "白紙のページ……。癒やしと休息が町へ戻る時、文字は戻るはず。",
    revivedDesc: "ナギの手で よみがえった。傷ついた人を、再び暮らしへ戻す者の書。",
    startRevived: false,
    progress(game) {
      const bp = game.blueprints.completed;
      const f = game.quests.flags;
      const steps = [
        bp.has("bamboo_gate"),
        bp.has("lodge"),
        bp.has("herb_garden"),
        !!f.teaBrewed, // 薬草の煎じ湯
        bp.has("outer_shrine"),
        !!f.priestRevivalSeen, // 看護イベント
      ];
      return steps.filter(Boolean).length / steps.length;
    },
  },
};

export class JobManager extends JobBooks {
  constructor(game) {
    super(game, JOBS, SFX);
  }

  // ロード: セーブの復活状態をそのまま使う。jobs キーの無い異常データは
  // ニューゲームの固定状態（builder/farmer/cook/sailor 復活済み）に落とす。
  load(data) {
    if (data?.revived) {
      for (const id of data.revived) {
        if (JOBS[id]) this.revived.add(id);
      }
    }
  }
}
