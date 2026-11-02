import { SFX } from "../game/sfx.js";
import { PLACES } from "../world/world.js";

// 料理システム: かまど料理・満腹バフ・1日1回の食事シーン。
//
// 満腹バフ（Q4-B: バフ型）: 空腹ペナルティは無い。buff 付きの食べ物を食べると
// 一定時間 HP自動回復＋攻撃ボーナスが付く。バフは重ねがけで上書き（強い方優先
// ではなくシンプルに直近優先）。
//
// 食事シーン: 台所（kitchen 設計図）完成後、毎日 18 時に住民が食堂のちゃぶ台へ
// 集まる（1日1回・自動）。演出のみで、集まった住民は全回復する。

const MEAL_HOUR = 18;
const MEAL_DURATION = 24; // 実秒

export class CookingSystem {
  constructor(game) {
    this.game = game;
    this.buff = { t: 0, atk: 0, regen: 0 };
    this.mealTimer = 0; // >0 の間は食事シーン中
  }

  // 攻撃計算から参照される現在の攻撃ボーナス。
  get atkBonus() {
    return this.buff.t > 0 ? this.buff.atk : 0;
  }

  get mealActive() {
    return this.mealTimer > 0;
  }

  // 食べ物を食べた時（回復処理は呼び出し元）。buff 付きなら満腹バフを付与。
  applyFood(def) {
    if (!def.buff) return;
    this.buff = { ...def.buff };
    const parts = [];
    if (def.buff.atk) parts.push(`攻撃+${def.buff.atk}`);
    if (def.buff.regen) parts.push("HPかいふく");
    this.game.ui.toast(`😋 おなかいっぱい！（${parts.join("・")} ${Math.round(def.buff.t)}秒）`);
  }

  // かまど料理が作られた（quests.onCrafted から呼ばれる）。書の進捗を進める。
  onCooked() {
    const c = this.game.quests.counters;
    c.cooked = (c.cooked ?? 0) + 1;
  }

  update(dt) {
    const g = this.game;

    // 満腹バフの残り時間と自動回復。
    if (this.buff.t > 0) {
      this.buff.t -= dt;
      if (this.buff.regen > 0 && g.player.hp < g.player.maxHp) {
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + this.buff.regen * dt);
      }
      if (this.buff.t <= 0) g.ui.toast("おなかが こなれてきた（バフ終了）");
    }
    g.ui.setBuff(this.buff.t > 0 ? `😋 満腹 ${Math.ceil(this.buff.t)}s` : null);

    // 食事シーン: 台所完成＆イナホ加入後、毎日18時に一度だけ。
    if (this.mealTimer > 0) {
      this.mealTimer -= dt;
      return;
    }
    const flags = g.quests.flags;
    const ready = g.blueprints.completed.has("kitchen") && g.villager("inaho") && !g.defense.active;
    if (!ready) return;
    const { hour, day } = g.daynight;
    if (hour >= MEAL_HOUR && hour < MEAL_HOUR + 1 && (flags.lastMealDay ?? 0) < day) {
      flags.lastMealDay = day;
      this.mealTimer = MEAL_DURATION;
      SFX.quest();
      g.ui.toast("🍚 ごはんの時間だ！ みんなが食堂に集まってきた");
      for (const v of g.villagers) {
        if (!v.down) v.hp = v.maxHp;
      }
    }
  }

  // 食事シーン中に住民が向かう場所（ちゃぶ台のまわり）。
  mealPos() {
    if (!this.mealActive) return null;
    const k = PLACES.kitchen;
    return { x: k.x + 2.5, z: k.z + 2.5 };
  }
}
