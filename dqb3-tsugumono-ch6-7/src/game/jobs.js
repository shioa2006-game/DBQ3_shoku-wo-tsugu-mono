import { JobBooks } from "../../../game-shared/job-books.mjs";
import { SFX } from "./sfx.js";

// 職業の書のデータ定義とマネージャ。
//
// ダーマ再興編は、第5章までの正史（シオンが持ち出した職業の書と、旅で復活した五冊）を組み込んだ
// 固定状態から始まる。この編で新しい書は復活しない（主要人物の授職と継承は、物語のイベントで描く）。
// 世界にはまだ出会っていない職業の書が残る——それを探す旅が、結末の先に続く。
//
// 各職業の定義:
//   name          書の名前（UI表示）
//   lockedDesc    未復活時の説明文（この編では使わない）
//   revivedDesc   復活後の説明文
//   startRevived  ニューゲーム時点で復活済みか
//   progress(game) 職業の書UIのゲージ 0..1
export const JOBS = {
  // 既存セーブとの互換性のため、話す職業の書の内部IDは builder を維持する。
  builder: {
    name: "職業の書",
    lockedDesc: "",
    revivedDesc: "シオンがダーマ神殿から守り抜いた、話す書。暮らしを築き、職をつなぐ旅の相棒。",
    startRevived: true,
    progress(game) {
      const bp = game.blueprints.completed;
      const built = ["common_hut", "temple_base", "temple_frame", "temple_roof", "altar_keystone", "temple_living", "temple_library"];
      return built.filter((id) => bp.has(id)).length / built.length;
    },
  },
  farmer: {
    name: "農民の書",
    lockedDesc: "",
    revivedDesc: "ジパングでミナがよみがえらせた書。山の斜面でも、土は生きている。",
    startRevived: true,
    progress: () => 1,
  },
  cook: {
    name: "料理人の書",
    lockedDesc: "",
    revivedDesc: "イナホがよみがえらせた書。その火は、神殿の共同台所へ受け継がれる。",
    startRevived: true,
    progress: () => 1,
  },
  sailor: {
    name: "船乗りの書",
    lockedDesc: "",
    revivedDesc: "ワタリがよみがえらせた書。島と人と技を、船がつなぐ。",
    startRevived: true,
    progress: () => 1,
  },
  blacksmith: {
    name: "鍛冶屋の書",
    lockedDesc: "",
    revivedDesc: "火山島でベルクがよみがえらせた書。鉄に暮らしの役割を与える者の書。",
    startRevived: true,
    progress: () => 1,
  },
  priest: {
    name: "僧侶の書",
    lockedDesc: "",
    revivedDesc: "火山島でナギがよみがえらせた書。傷ついた人を、再び暮らしへ戻す者の書。",
    startRevived: true,
    progress: () => 1,
  },
};

export class JobManager extends JobBooks {
  constructor(game) {
    super(game, JOBS, SFX);
  }

  // ロード: セーブの復活状態をそのまま使う（この編では六冊とも最初から読める）。
  load(data) {
    if (data?.revived) {
      for (const id of data.revived) {
        if (JOBS[id]) this.revived.add(id);
      }
    }
  }
}
