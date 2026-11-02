import { Chapter4 } from "./quests4.js";
import { Chapter5 } from "./quests5.js";

// 火山島編のステージ順序（第4章 → 第5章）。
export const STAGE_ORDER = [
  // --- 第4章「鬼火の山」（進行は quests4.js、脚本は content/chapter4.js） ---
  "CH4_ARRIVAL",
  "CH4_COLD_FORGE",
  "CH4_GATHER_PEOPLE",
  "CH4_MINE",
  "CH4_FORGE",
  "CH4_WORK_TOGETHER",
  "CH4_BOOK",
  "CH4_DEFENSE",
  "CH4_DONE",
  // --- 第5章「眠る竹林の社」（進行は quests5.js、脚本は content/chapter5.js） ---
  "CH5_INTRO",
  "CH5_BAMBOO_GATE",
  "CH5_LODGE",
  "CH5_HERB_GARDEN",
  "CH5_OUTER_SHRINE",
  "CH5_VIGIL",
  "CH5_PURIFY_PATH",
  "CH5_INNER_SHRINE",
  "CH5_DRAGON",
  "CH5_DONE",
];

export const stageIndex = (s) => STAGE_ORDER.indexOf(s);

export class QuestManager {
  constructor(game) {
    this.game = game; // facade provided by main.js
    this.stage = "CH4_ARRIVAL";
    this.counters = { planted: 0, harvested: 0, cooked: 0, rescued: 0, teaBrewed: 0 };
    this.flags = {};
    this.busy = false; // a cutscene/dialogue is running
    this.ch4 = new Chapter4(this);
    this.ch5 = new Chapter5(this);
  }

  // 第4章のステージか（CH4_ARRIVAL..CH4_DONE を quests4.js に委譲）。
  isCh4() {
    const i = stageIndex(this.stage);
    return i >= stageIndex("CH4_ARRIVAL") && i <= stageIndex("CH4_DONE");
  }

  // 第5章のステージか（CH5_INTRO 以降は quests5.js に委譲する）。
  isCh5() {
    return stageIndex(this.stage) > stageIndex("CH4_DONE");
  }

  setStage(stage, silent = false) {
    this.stage = stage;
    this.game.onStageChanged();
    if (!silent) {
      const text = this.objectiveText();
      if (text) this.game.ui.toast(`🪶 ${text}`);
    }
  }

  objectiveText() {
    if (this.isCh5()) return this.ch5.objectiveText();
    return this.ch4.objectiveText();
  }

  // --- cutscenes -----------------------------------------------------------------

  // New Game の開幕。第3章までの正史を短い回想で示し、火山島へ上陸する。
  startIntro() {
    this.ch4.startIntro();
  }

  // Called every frame by the game loop.
  update() {
    if (this.busy) return;
    if (this.isCh5()) {
      this.ch5.update();
      return;
    }
    this.ch4.update();
    // 第4章クリア後の翌朝、第5章「眠る竹林の社」が始まる。
    if (this.stage === "CH4_DONE") this.ch5.maybeStart();
  }

  onCrafted(itemId) {
    if (this.isCh5()) this.ch5.onCrafted(itemId);
    else this.ch4.onCrafted(itemId);
  }

  onBlockPlaced(itemId) {
    if (this.isCh5()) this.ch5.onBlockPlaced(itemId);
    else this.ch4.onBlockPlaced(itemId);
  }

  onBlueprintComplete(id) {
    if (this.ch5.onBlueprintComplete(id)) return;
    if (this.ch4.onBlueprintComplete(id)) return;
  }

  onTalk(villagerId) {
    if (this.ch5.onTalk(villagerId)) return true;
    return this.ch4.onTalk(villagerId);
  }

  onRaidEnd(win) {
    if (this.ch4.onRaidEnd(win)) return;
  }

  onMonsterKilled(m) {
    if (this.isCh5()) this.ch5.onMonsterKilled(m);
    else this.ch4.onMonsterKilled(m);
  }

  // グロム討伐戦の決着（main.gromBattle.onEnd から）。
  onGromEnd(win) {
    this.ch5.onGromEnd(win);
  }

  // 穢れ石を調べた（main.interact の "taint" から）。
  onTaintStone(x, z) {
    this.ch5.onTaintStone(x, z);
  }

  // 社の祭壇に祈った。専用イベントは無く、雰囲気の台詞だけ返す。
  onAltarPrayed() {
    return false;
  }

  serialize() {
    return { stage: this.stage, counters: this.counters, flags: this.flags };
  }

  load(data) {
    if (!data) return;
    this.stage = data.stage;
    this.counters = { ...this.counters, ...data.counters };
    this.flags = data.flags ?? {};
  }

  // ロード後の正規化: 防衛戦・グロム戦の最中のセーブは準備段階へ戻し、
  // 章の進行から導出される住民の状態を復元する。
  normalizeAfterLoad() {
    if (this.stage === "CH4_DEFENSE") this.setStage("CH4_BOOK", true);
    this.ch4.restoreState();
    if (this.isCh5()) this.ch5.restoreState();
  }
}
