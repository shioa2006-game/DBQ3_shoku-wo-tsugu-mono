import { Chapter6 } from "./quests6.js";
import { Chapter7 } from "./quests7.js";

// ダーマ再興編のステージ順序（第6章 → 第7章）。docs/DESIGN.md の「7. 章の進行」。
export const STAGE_ORDER = [
  // --- 第6章「よみがえるダーマ神殿」（進行は quests6.js、脚本は content/chapter6.js） ---
  "CH6_ARRIVAL",
  "CH6_RUINS",
  "CH6_FOUNDATION",
  "CH6_VOYAGE",
  "CH6_QUARRY",
  "CH6_CRAB",
  "CH6_KEYSTONE",
  "CH6_HAULING",
  "CH6_ROOF",
  "CH6_ALTAR",
  "CH6_LIVING",
  "CH6_ORDINATION",
  "CH6_DONE",
  // --- 第7章「三つ首の空」（進行は quests7.js、脚本は content/chapter7.js） ---
  "CH7_ALARM",
  "CH7_WAVE1",
  "CH7_PREP2",
  "CH7_WAVE2",
  "CH7_PREP3",
  "CH7_WAVE3",
  "CH7_OMEN",
  "CH7_VARUGA1",
  "CH7_REPAIR",
  "CH7_BALLISTA",
  "CH7_FINAL_PREP",
  "CH7_VARUGA2",
  "CH7_AFTERMATH",
  "CH7_SUCCESSION",
  "CH7_DEPARTURE",
  "CH7_DONE",
];

export const stageIndex = (s) => STAGE_ORDER.indexOf(s);

// 戦いの最中のステージ → ロード・敗北で戻る「準備のステージ」。
export const BATTLE_PREP_STAGE = {
  CH6_CRAB: "CH6_QUARRY",
  CH7_WAVE1: "CH7_ALARM",
  CH7_WAVE2: "CH7_PREP2",
  CH7_WAVE3: "CH7_PREP3",
  CH7_VARUGA1: "CH7_OMEN",
  CH7_VARUGA2: "CH7_FINAL_PREP",
};

export class QuestManager {
  constructor(game) {
    this.game = game; // facade provided by main.js
    this.stage = "CH6_ARRIVAL";
    this.counters = { planted: 0, harvested: 0, cooked: 0, wedges: 0, ch7Cooked: 0 };
    this.flags = {};
    this.busy = false; // a cutscene/dialogue is running
    this.ch6 = new Chapter6(this);
    this.ch7 = new Chapter7(this);
  }

  at(stage) {
    return stageIndex(this.stage) >= stageIndex(stage);
  }

  isCh7() {
    return stageIndex(this.stage) >= stageIndex("CH7_ALARM");
  }

  get chapter() {
    return this.isCh7() ? this.ch7 : this.ch6;
  }

  setStage(stage, silent = false) {
    this.stage = stage;
    this.applyHomes();
    this.game.onStageChanged();
    if (!silent) {
      const text = this.objectiveText();
      if (text) this.game.ui.toast(`🪶 ${text}`);
    }
  }

  objectiveText() {
    return this.chapter.objectiveText();
  }

  // 会話を流し、その間は進行を止める。
  play(lines, done) {
    this.busy = true;
    this.game.ui.dialogue.play(lines, () => {
      this.busy = false;
      if (done) done();
    });
  }

  // 選択肢（0 = はい）。
  choose(prompt, options, done) {
    this.busy = true;
    this.game.ui.dialogue.choice(prompt, options, (i) => {
      this.busy = false;
      done(i);
    });
  }

  // --- cutscenes -----------------------------------------------------------------

  startIntro() {
    this.ch6.startIntro();
  }

  // Called every frame by the game loop.
  update() {
    if (this.busy) return;
    this.game.ui.setObjective(this.objectiveText());
    this.chapter.update();
    if (this.stage === "CH6_DONE") this.ch7.maybeStart();
  }

  onCrafted(itemId, recipe) {
    this.chapter.onCrafted?.(itemId, recipe);
  }

  onBlockPlaced(itemId) {
    this.chapter.onBlockPlaced?.(itemId);
  }

  onBlueprintComplete(id) {
    if (this.ch7.onBlueprintComplete(id)) return;
    this.ch6.onBlueprintComplete(id);
  }

  onTalk(villagerId) {
    return this.chapter.onTalk(villagerId);
  }

  onRaidEnd(win) {
    this.ch7.onRaidEnd(win);
  }

  onVarugaEnd(kind, win) {
    this.ch7.onVarugaEnd(kind, win);
  }

  onMonsterKilled(m) {
    this.chapter.onMonsterKilled?.(m);
  }

  // 設置物を調べた（main.interact から）。処理したら true。
  onInteract(kind, cell) {
    return this.chapter.onInteract?.(kind, cell) ?? false;
  }

  // プレイヤーが倒れた。立ち上がる場所 {x, y, z, then?} を返す（null なら旗か上陸地点）。
  // then は、立ち上がった後に流す会話など。
  onPlayerDown() {
    return this.chapter.onPlayerDown?.() ?? null;
  }

  // --- 住民の居場所 -----------------------------------------------------------------
  // 誰が島にいて、どこが持ち場かは、ステージとフラグから導く（セーブ・ロードや敗北後の復元でも
  // 同じ結果になる）。teleport=true は、ロード直後など歩かせずに置き直すとき。
  applyHomes(teleport = false) {
    const g = this.game;
    const homes = { ...this.ch6.homes(), ...(this.isCh7() ? this.ch7.homes() : {}) };
    for (const v of [...g.villagers]) {
      if (!homes[v.id]) g.removeVillager(v.id);
    }
    for (const [id, h] of Object.entries(homes)) {
      const y = h.y ?? g.world.terrainSurfaceY(h.x, h.z);
      let v = g.villager(id);
      if (!v) {
        const at = h.spawn ?? h;
        v = g.spawnVillager(id, at.x + 0.5, at.z + 0.5, h.spawn ? (h.spawn.y ?? null) : y + 0.1);
        v.homeTp = !!h.tp;
      }
      const key = `${h.x},${y},${h.z}`;
      if (v.homeKey === key && !teleport) continue;
      // 洞窟や本堂の中の持ち場（tp）へは歩いて行けないので置き直す。出るときも同じ。
      const jump = teleport || h.tp || v.homeTp;
      v.homeKey = key;
      v.homeTp = !!h.tp;
      v.home.set(h.x + 0.5, y + 0.1, h.z + 0.5);
      v.moveTarget = null;
      v.mealSeat = null;
      // spawn（初登場の場所）付きの持ち場は、現れたときだけ歩いて向かう。置き直し（teleport）では持ち場へ。
      if (jump && (teleport || !h.spawn)) {
        v.pos.set(h.x + 0.5, y + 0.1, h.z + 0.5);
        v.vel.set(0, 0, 0);
      }
    }
  }

  serialize() {
    return { stage: this.stage, counters: this.counters, flags: this.flags };
  }

  load(data) {
    if (!data) return;
    this.stage = data.stage;
    this.counters = { planted: 0, harvested: 0, cooked: 0, wedges: 0, ch7Cooked: 0, ...data.counters };
    this.flags = { ...(data.flags ?? {}) };
  }

  // ロード後・敗北からの復元後の正規化: 戦いの最中のステージは準備の段階へ戻し、
  // 章の進行から導かれる状態（住民・ボス・修理の対象）を置き直す。
  normalizeAfterLoad() {
    const prep = BATTLE_PREP_STAGE[this.stage];
    if (prep) this.stage = prep;
    this.ch6.restoreState();
    if (this.isCh7()) this.ch7.restoreState();
    for (const v of this.game.villagers) v.homeKey = null; // 保存位置にいる住民の持ち場を、いまのステージへ
    this.applyHomes(false);
  }
}
