import { PLACES, WORLD } from "../world/world.js";
import { SFX } from "./sfx.js";
import { CH2 } from "../content/chapter2.js";

// 第2章「荒れた田の村」の進行エンジン。台詞・目標文は content/chapter2.js の
// 脚本データを参照する（シナリオのデータ駆動化・段階式の第一歩）。
// QuestManager から CH2 ステージのあいだ委譲される。

const BRIDGE_DECK_Y = 4; // 橋の桁の高さ（水面+1）。地形からは求めない。

export class Chapter2 {
  constructor(quests) {
    this.quests = quests;
    this.game = quests.game;
  }

  get stage() {
    return this.quests.stage;
  }

  objectiveText() {
    return CH2.objectives[this.stage]?.(this.game) ?? "";
  }

  play(lines, done) {
    this.quests.busy = true;
    this.game.ui.dialogue.play(lines, () => {
      this.quests.busy = false;
      if (done) done();
    });
  }

  // POSTGAME 中、社に祈った翌朝に第2章が始まる（QuestManager.update から毎フレーム）。
  // 会話を自動再生せず、ジンベエに！を付けて「話しかけたら始まる」方式
  //（時間経過トリガーだと、プレイヤーがどこにいても話者不在のまま会話が進んでしまう）。
  maybeStart() {
    const { flags } = this.quests;
    const { day, hour } = this.game.daynight;
    if (flags.postgameDay == null) return;
    if (day > flags.postgameDay && hour >= 6 && hour < 19) {
      this.quests.setStage("CH2_INTRO"); // ！マーカーは updateQuestMarkers がステージから導出
    }
  }

  update() {
    const g = this.game;
    g.ui.setObjective(this.objectiveText());
    // 第2章クリア（CH2_DONE）の翌朝、第3章「旅立ちの港」が始まる。
    if (this.stage === "CH2_DONE") {
      this.quests.ch3.maybeStart();
      return;
    }
    // 料理3回で料理人の書が復活。
    if (this.stage === "COOK_TOGETHER" && (this.quests.counters.cooked ?? 0) >= 3) {
      this.reviveCookBook();
    }
  }

  relocate(id, x, z) {
    const v = this.game.villager(id);
    if (!v) return;
    const y = this.game.world.terrainSurfaceY(x, z) + 0.1;
    v.pos.set(x + 0.5, y, z + 0.5);
    v.home.set(x + 0.5, y, z + 0.5);
  }

  onBlueprintComplete(id) {
    const g = this.game;
    if (id === "bridge" && this.stage === "FIX_BRIDGE") {
      this.quests.flags.southOpen = true;
      SFX.levelup();
      this.play(CH2.dialogues.bridgeDone, () => {
        // イナホは村に姿を見せ（！付き）、ミナとゴンタは先に村へ渡って待つ。
        // 出会いの会話は「話しかけたら始まる」（旧: 座標 z>76 で自動再生され、
        // 橋を渡っている途中に姿も見えないまま会話が始まっていた）。
        g.spawnVillager("inaho", PLACES.village.x, PLACES.village.z);
        this.relocate("mina", PLACES.village.x - 3, PLACES.village.z + 2);
        this.relocate("gonta", PLACES.village.x + 2, PLACES.village.z + 4);
        this.quests.setStage("REACH_VILLAGE");
      });
      return true;
    }
    if (id === "paddy" && this.stage === "REPAIR_PADDY") {
      this.play(CH2.dialogues.paddyDone, () => {
        g.blueprints.activate(
          "kitchen",
          PLACES.kitchen,
          g.world.pristineSurfaceY(PLACES.kitchen.x + 2, PLACES.kitchen.z + 1),
        );
        this.quests.setStage("BUILD_KITCHEN");
      });
      return true;
    }
    if (id === "kitchen" && this.stage === "BUILD_KITCHEN") {
      this.play(CH2.dialogues.kitchenDone, () => {
        this.quests.setStage("COOK_TOGETHER");
      });
      return true;
    }
    return false;
  }

  reviveCookBook() {
    const g = this.game;
    this.quests.busy = true;
    g.jobs.revive("cook", () => {
      SFX.levelup();
      g.setBaseLevel(4);
      this.quests.busy = false;
      this.play(CH2.dialogues.cookBookRevived, () => {
        this.quests.setStage("PADDY_PREP");
        const gonta = g.villager("gonta");
        if (gonta) gonta.marker.visible = true;
      });
    });
  }

  onTalk(villagerId) {
    const g = this.game;
    // 章の開幕: ジンベエに話しかけると南の村の話が始まる。
    if (this.stage === "CH2_INTRO" && villagerId === "jinbei") {
      this.play(CH2.dialogues.intro, () => {
        g.blueprints.activate("bridge", PLACES.bridge, BRIDGE_DECK_Y);
        this.quests.setStage("FIX_BRIDGE");
      });
      return true;
    }
    // 村での出会い: イナホに話しかけると田んぼ復旧へ。
    if (this.stage === "REACH_VILLAGE" && villagerId === "inaho") {
      this.play(CH2.dialogues.meetInaho, () => {
        g.blueprints.activate(
          "paddy",
          PLACES.waterway,
          g.world.pristineSurfaceY(PLACES.paddy.x + 2, PLACES.paddy.z + 1),
        );
        this.quests.setStage("REPAIR_PADDY");
      });
      return true;
    }
    if (this.stage === "PADDY_PREP" && villagerId === "gonta") {
      const g = this.game;
      this.quests.busy = true;
      const v = g.villager("gonta");
      if (v) v.marker.visible = false;
      g.ui.dialogue.play(CH2.dialogues.prepTalk, () => {
        g.ui.dialogue.choice(CH2.dialogues.prepChoice, CH2.dialogues.prepOptions, (i) => {
          this.quests.busy = false;
          if (i === 0) {
            this.quests.setStage("PADDY_DEFENSE", true);
            g.startDefense("paddy");
          } else if (v) {
            v.marker.visible = true;
          }
        });
      });
      return true;
    }
    return false;
  }

  onRaidEnd(win) {
    if (this.stage !== "PADDY_DEFENSE") return false;
    if (win) {
      this.quests.busy = true;
      SFX.quest();
      this.game.ui.dialogue.play(CH2.dialogues.paddyDefenseWin, () => {
        this.quests.busy = false;
        this.quests.setStage("CH2_DONE");
      });
    } else {
      this.play(CH2.dialogues.paddyDefenseLose, () => {
        this.quests.setStage("PADDY_PREP");
        const gonta = this.game.villager("gonta");
        if (gonta) gonta.marker.visible = true;
      });
    }
    return true;
  }
}

// 田んぼ防衛戦の構成（DefenseEvent.start に渡す）。
export function paddyDefenseConfig() {
  const p = PLACES.paddy;
  return {
    label: "🌾 田んぼ",
    waves: [
      { label: "第1波", spawns: [["field_rat", 6]] },
      { label: "第2波", spawns: [["field_rat", 5], ["dorotabo", 2]] },
      { label: "最終波", spawns: [["paddy_boss", 1], ["field_rat", 3]] },
    ],
    gates: [
      { x: 20, z: 100 },
      { x: 44, z: 98 },
      { x: PLACES.bossPool.x + 1, z: PLACES.bossPool.z + 2 },
    ],
    target: { x: p.x + 4.5, y: 4, z: p.z + 2, halfW: 2.4 },
  };
}
