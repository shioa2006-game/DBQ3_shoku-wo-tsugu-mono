import { SFX } from "../game/sfx.js";

// 料理システム: かまど・鉄鍋料理・満腹バフ・1日1回の食事シーン。
//
// 満腹バフ（バフ型）: 空腹ペナルティは無い。buff 付きの食べ物を食べると
// 一定時間 HP自動回復＋攻撃ボーナスが付く。バフは重ねがけで上書き。
//
// 食事シーン: 町に調理設備（かまど or 鉄鍋）が据えられた後、毎日 18 時に
// 住民が火のまわりへ集まる（1日1回・自動）。演出のみで、集まった住民は全回復する。

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

  // かまど・鉄鍋料理が作られた（quests.onCrafted から呼ばれる）。
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

    // 食事シーン: 調理設備（かまど・鉄鍋）があり、拠点が町へ移った後、毎日18時に一度だけ。
    if (this.mealTimer > 0) {
      this.mealTimer -= dt;
      return;
    }
    const flags = g.quests.flags;
    const ready = g.kamados.size > 0 && flags.townBaseActivated && !g.defense.active;
    if (!ready) return;
    const { hour, day } = g.daynight;
    if (hour >= MEAL_HOUR && hour < MEAL_HOUR + 1 && (flags.lastMealDay ?? 0) < day) {
      flags.lastMealDay = day;
      this.mealTimer = MEAL_DURATION;
      SFX.quest();
      g.ui.toast("🍚 ごはんの時間だ！ みんなが火のまわりに集まってきた");
      for (const v of g.villagers) {
        if (!v.down) v.hp = v.maxHp;
      }
    }
  }

  // 食事シーン中に住民が向かう場所（かまど・鉄鍋のまわり）。
  mealPos() {
    if (!this.mealActive) return null;
    return this.game.kitchenPos();
  }
}
