import { PLACES } from "../world/world.js";
import { SFX } from "./sfx.js";
import { CH4 } from "../content/chapter4.js";

// 第4章「鬼火の山」の進行エンジン。台詞・目標文は content/chapter4.js を参照する。
// QuestManager から CH4 ステージのあいだ委譲される。
//
// 章の流れ:
//   上陸・海岸拠点 → ベルクの拒絶 → 住民集め・拠点移転 → 廃鉱 → 炭焼き窯と鍛冶場
//   → 暮らしの鉄3種の共同鍛造 → 鍛冶屋の書の復活（黒い爪痕）→ 炉の防衛戦 → ナギの発見

export class Chapter4 {
  constructor(quests) {
    this.quests = quests;
    this.game = quests.game;
  }

  get stage() {
    return this.quests.stage;
  }

  get flags() {
    return this.quests.flags;
  }

  objectiveText() {
    return CH4.objectives[this.stage]?.(this.game) ?? "";
  }

  play(lines, done) {
    this.quests.busy = true;
    this.game.ui.dialogue.play(lines, () => {
      this.quests.busy = false;
      if (done) done();
    });
  }

  relocate(id, x, z) {
    const v = this.game.villager(id);
    if (!v) return;
    const y = this.game.world.terrainSurfaceY(x, z) + 0.1;
    v.pos.set(x + 0.5, y, z + 0.5);
    v.home.set(x + 0.5, y, z + 0.5);
    v.mealSeat = null;
  }

  // 持ち場(home)だけを差し替える。テレポートせず、住民は自分の足で
  // 新しい持ち場へ歩いて戻る。
  rehome(id, x, z) {
    const v = this.game.villager(id);
    if (!v) return;
    v.home.set(x + 0.5, this.game.world.terrainSurfaceY(x, z) + 0.1, z + 0.5);
    v.moveTarget = null;
  }

  // New Game の開幕。仲間と船で上陸し、浜でカヤを見つける。
  startIntro() {
    const g = this.game;
    const s = PLACES.spawn;
    g.spawnVillager("mina", s.x - 2, s.z + 1);
    g.spawnVillager("gonta", s.x + 3, s.z);
    g.spawnVillager("watari", s.x + 1, s.z - 2);
    g.spawnVillager("kaya", 36, 8); // 船の入り江・壊れた船着き場のそば
    this.play(CH4.dialogues.intro, () => {
      this.quests.setStage("CH4_ARRIVAL"); // ！マーカーは updateQuestMarkers が導出
    });
  }

  update() {
    const g = this.game;
    g.ui.setObjective(this.objectiveText());

    // 鉄鉱石がそろった → 炭と炉へ（CH4_MINE → CH4_FORGE）。
    if (
      this.stage === "CH4_MINE" &&
      this.flags.mineOpen &&
      !this.flags.oreDoneSeen &&
      g.inventory.count("iron_ore") >= 6 &&
      !g.ui.menuOpen
    ) {
      this.flags.oreDoneSeen = true;
      this.play(CH4.dialogues.oreDone, () => {
        g.blueprints.activate("kiln_site", PLACES.kiln, g.world.pristineSurfaceY(PLACES.kiln.x + 1, PLACES.kiln.z + 1));
        this.quests.setStage("CH4_FORGE");
      });
      return;
    }

    // 共同鍛造の演出（クラフト直後はメニューが開いているので、閉じてから流す）。
    if (this.stage === "CH4_WORK_TOGETHER" && !g.ui.menuOpen) {
      if (this.flags.forgedHammer && !this.flags.hammerSceneSeen) {
        this.flags.hammerSceneSeen = true;
        this.flags.rokuMining = true; // ロクが採掘を再開する
        this.play(CH4.dialogues.workHammer, () => this.maybeReviveBlacksmith());
        return;
      }
      if (this.flags.forgedFitting && !this.flags.fittingSceneSeen) {
        this.flags.fittingSceneSeen = true;
        this.play(CH4.dialogues.workFitting, () => this.maybeReviveBlacksmith());
        return;
      }
      if (this.flags.forgedPot && !this.flags.potSceneSeen) {
        this.flags.potSceneSeen = true;
        // 鉄鍋の使用場面＝食堂。打った鉄鍋そのものを設計図へ据える。
        this.play(CH4.dialogues.workPot, () => {
          g.blueprints.activate(
            "canteen",
            PLACES.canteen,
            g.world.pristineSurfaceY(PLACES.canteen.x + 2, PLACES.canteen.z + 1),
          );
          g.onStageChanged();
        });
        return;
      }
    }
  }

  // 3つの生活道具がそろい、食堂で最初の食事を囲んだら、ベルクの回想 → 書の復活。
  maybeReviveBlacksmith() {
    const f = this.flags;
    if (this.stage !== "CH4_WORK_TOGETHER") return;
    if (!(f.hammerSceneSeen && f.fittingSceneSeen && f.potSceneSeen)) return;
    if (!this.game.blueprints.completed.has("canteen")) return; // 食卓の光景を見てから
    if (f.blacksmithRevivalSeen) return;
    f.blacksmithRevivalSeen = true;
    const g = this.game;
    this.play(CH4.dialogues.allWorks, () => {
      this.quests.busy = true;
      g.jobs.revive("blacksmith", () => {
        SFX.levelup();
        g.setBaseLevel(3);
        this.quests.busy = false;
        this.play(CH4.dialogues.bookRevived, () => {
          this.quests.setStage("CH4_BOOK"); // ！（ベルク）は updateQuestMarkers が導出
        });
      });
    });
  }

  onCrafted(itemId) {
    if (this.stage !== "CH4_WORK_TOGETHER") return;
    // 演出は update()（メニューを閉じた後）で流す。ここではフラグだけ立てる。
    if (itemId === "hammer_iron" && !this.flags.forgedHammer) {
      this.flags.forgedHammer = true;
    } else if (itemId === "iron_fitting" && !this.flags.forgedFitting) {
      this.flags.forgedFitting = true;
    } else if (itemId === "iron_pot" && !this.flags.forgedPot) {
      this.flags.forgedPot = true;
    }
  }

  onBlockPlaced() {}

  onMonsterKilled() {}

  onBlueprintComplete(id) {
    const g = this.game;
    if (id === "coast_camp" && this.stage === "CH4_ARRIVAL") {
      SFX.levelup();
      g.placeBanner(PLACES.coastBanner);
      g.setBaseLevel(1);
      g.spawnVillager("belk", PLACES.anvil.x, PLACES.anvil.z + 1);
      g.spawnVillager("roku", 35, 22);
      this.play(CH4.dialogues.campDone, () => {
        this.quests.setStage("CH4_COLD_FORGE");
      });
      return true;
    }
    if (id === "ash_farm" && this.stage === "CH4_GATHER_PEOPLE") {
      this.play(CH4.dialogues.farmDone, () => {
        // 基準高さは落石の山が乗っていない支柱の足元 (22,36) から取る
        //（口の前 (23,37) は落石が積んであり、そこを基準にすると設計図が1段浮く）。
        g.blueprints.activate("mine_entrance", PLACES.mine, g.world.pristineSurfaceY(PLACES.mine.x, PLACES.mine.z));
        this.quests.setStage("CH4_MINE");
      });
      return true;
    }
    if (id === "mine_entrance" && this.stage === "CH4_MINE") {
      this.flags.mineOpen = true;
      SFX.levelup();
      this.play(CH4.dialogues.mineDone, () => {
        this.quests.setStage("CH4_MINE", true); // 目標表示を採掘へ更新
      });
      return true;
    }
    if (id === "kiln_site" && this.stage === "CH4_FORGE") {
      this.play(CH4.dialogues.kilnDone, () => {
        g.blueprints.activate("forge", PLACES.forge, g.world.pristineSurfaceY(PLACES.forge.x + 2, PLACES.forge.z + 1));
        this.quests.setStage("CH4_FORGE", true);
      });
      return true;
    }
    if (id === "forge" && this.stage === "CH4_FORGE") {
      this.flags.forgeLit = true;
      SFX.levelup();
      this.play(CH4.dialogues.forgeDone, () => {
        this.quests.setStage("CH4_WORK_TOGETHER");
      });
      return true;
    }
    if (id === "canteen" && this.stage === "CH4_WORK_TOGETHER") {
      SFX.levelup();
      // その夜の初めての食事。住民が鉄鍋のまわりへ集まり、全回復する
      //（以後は毎日18時、この食堂で食事シーンが動く）。
      this.flags.lastMealDay = g.daynight.day;
      g.cooking.mealTimer = 30;
      for (const v of g.villagers) {
        if (!v.stayDown) v.hp = v.maxHp;
      }
      this.play(CH4.dialogues.canteenDone, () => this.maybeReviveBlacksmith());
      return true;
    }
    return false;
  }

  onTalk(villagerId) {
    const g = this.game;
    // カヤとの出会い → 海岸拠点の設計図。
    if (this.stage === "CH4_ARRIVAL" && villagerId === "kaya" && !this.flags.kayaMet) {
      this.play(CH4.dialogues.meetKaya, () => {
        this.flags.kayaMet = true;
        g.blueprints.activate(
          "coast_camp",
          PLACES.coastBase,
          g.world.pristineSurfaceY(PLACES.coastBase.x + 2, PLACES.coastBase.z + 1),
        );
        g.onStageChanged();
      });
      return true;
    }
    // ベルクの拒絶。
    if (this.stage === "CH4_COLD_FORGE" && villagerId === "belk" && !this.flags.belkMet) {
      this.play(CH4.dialogues.meetBelk, () => {
        this.flags.belkMet = true;
        g.onStageChanged(); // ！マーカーをロクへ
      });
      return true;
    }
    // ロクの説明 → 住民集めへ。
    if (this.stage === "CH4_COLD_FORGE" && villagerId === "roku" && this.flags.belkMet) {
      this.play(CH4.dialogues.meetRoku, () => {
        g.spawnVillager("sumi", PLACES.coastCave.x, PLACES.coastCave.z);
        g.spawnVillager("teru", PLACES.charcoalHut.x + 1, PLACES.charcoalHut.z + 1);
        this.quests.setStage("CH4_GATHER_PEOPLE");
      });
      return true;
    }
    // 住民の救出。
    if (this.stage === "CH4_GATHER_PEOPLE" && villagerId === "sumi" && !this.flags.sumiRescued) {
      this.play(CH4.dialogues.rescueSumi, () => {
        this.flags.sumiRescued = true;
        this.quests.counters.rescued += 1;
        this.rehome("sumi", 29, 24);
        g.onStageChanged();
      });
      return true;
    }
    if (this.stage === "CH4_GATHER_PEOPLE" && villagerId === "teru" && !this.flags.teruRescued) {
      this.play(CH4.dialogues.rescueTeru, () => {
        this.flags.teruRescued = true;
        this.quests.counters.rescued += 1;
        this.rehome("teru", 36, 20);
        g.onStageChanged();
      });
      return true;
    }
    // カヤの決意 → 拠点機能を鉱山町へ移転、火山灰畑の設計図。
    if (
      this.stage === "CH4_GATHER_PEOPLE" &&
      villagerId === "kaya" &&
      this.quests.counters.rescued >= 2 &&
      !this.flags.townBaseActivated
    ) {
      this.play(CH4.dialogues.moveTown, () => {
        this.flags.townBaseActivated = true;
        g.giveItems([["volcano_grain_seed", 6]]);
        SFX.levelup();
        g.placeBanner(PLACES.townBanner); // 旗（＝復活地点）を鉱山町へ
        g.setBaseLevel(2);
        // 住民の帰り先を町へ（自分の足で歩いて移る）。
        this.rehome("kaya", 33, 22);
        this.rehome("mina", PLACES.ashFarm.x + 1, PLACES.ashFarm.z + 4);
        this.rehome("gonta", 30, 18);
        this.rehome("sumi", 29, 24);
        this.rehome("teru", 36, 20);
        // ワタリは海岸の倉庫（船荷）を守る。入り江の西岸が持ち場。
        this.rehome("watari", 36, 6);
        g.blueprints.activate(
          "ash_farm",
          PLACES.ashFarm,
          g.world.pristineSurfaceY(PLACES.ashFarm.x + 1, PLACES.ashFarm.z + 1),
        );
        g.onStageChanged();
      });
      return true;
    }
    // 防衛準備 → 炉の防衛戦。
    if (this.stage === "CH4_BOOK" && villagerId === "belk") {
      this.quests.busy = true;
      g.ui.dialogue.play(CH4.dialogues.prepTalk, () => {
        // ベルクの打った鉄の剣をゴンタへ。
        if (!this.flags.gotIronSword) {
          this.flags.gotIronSword = true;
          const gonta = g.villager("gonta");
          if (gonta) gonta.weapon = "sword_iron";
        }
        g.ui.dialogue.choice(CH4.dialogues.prepChoice, CH4.dialogues.prepOptions, (i) => {
          this.quests.busy = false;
          if (i === 0) {
            this.quests.setStage("CH4_DEFENSE", true);
            g.startDefense("forge");
          }
        });
      });
      return true;
    }
    // 章末: 峠で倒れたままのナギ。
    if (this.stage === "CH4_DONE" && villagerId === "nagi") {
      this.play(CH4.dialogues.nagiRest);
      return true;
    }
    return false;
  }

  onRaidEnd(win) {
    if (this.stage !== "CH4_DEFENSE") return false;
    const g = this.game;
    if (win) {
      this.quests.busy = true;
      SFX.quest();
      g.ui.dialogue.play(CH4.dialogues.defenseWin, () => {
        // 峠の手前に倒れたナギ。
        const nagi = g.spawnVillager("nagi", PLACES.nagiFound.x, PLACES.nagiFound.z);
        nagi.setDown(true);
        nagi.stayDown = true;
        g.ui.dialogue.play(CH4.dialogues.nagiFound, () => {
          this.quests.busy = false;
          // 町へ運び、宿坊の予約地（のちの寝床の位置）で寝かせる。
          this.relocate("nagi", PLACES.lodgePlot.x + 2, PLACES.lodgePlot.z + 1);
          nagi.setDown(true);
          SFX.levelup();
          g.setBaseLevel(4);
          this.quests.setStage("CH4_DONE");
          g.autosave();
        });
      });
    } else {
      this.play(CH4.dialogues.defenseLose, () => {
        this.quests.setStage("CH4_BOOK"); // ！（ベルク）は updateQuestMarkers が導出
      });
    }
    return true;
  }

  // ロード後の正規化: 章の進行から導出される住民の状態を復元する。
  restoreState() {
    const g = this.game;
    const idx = (s) => ["CH4_ARRIVAL", "CH4_COLD_FORGE", "CH4_GATHER_PEOPLE", "CH4_MINE", "CH4_FORGE", "CH4_WORK_TOGETHER", "CH4_BOOK", "CH4_DEFENSE", "CH4_DONE"].indexOf(s);
    // ナギは章末から昏倒したまま（第5章のヨモギの手当てまで）。
    if (idx(this.stage) >= idx("CH4_DONE")) {
      const nagi = g.villager("nagi") ?? g.spawnVillager("nagi", PLACES.lodgePlot.x + 2, PLACES.lodgePlot.z + 1);
      nagi.setDown(true);
      nagi.stayDown = true;
    }
    // ベルクの打った剣。
    if (this.flags.gotIronSword) {
      const gonta = g.villager("gonta");
      if (gonta) gonta.weapon = "sword_iron";
    }
  }
}

// 第4章防衛戦の構成（DefenseEvent.start に渡す）。守る対象＝鍛冶場の炉。
// 炉は forge 設計図 (アンカー 25,21) の (dx2,dz1) = (27,22)、床は y6。
export function forgeDefenseConfig() {
  const f = PLACES.forge;
  return {
    label: "🔥 鍛冶場の炉",
    targetHp: 120,
    waves: [
      { label: "第1波", spawns: [["lava_lizard", 4], ["will_o_wisp", 3]] },
      { label: "第2波", spawns: [["iron_scorpion", 3], ["will_o_wisp", 4]] },
      { label: "最終波", spawns: [["great_will_o_wisp", 1], ["will_o_wisp", 3], ["fire_bat", 2]] },
    ],
    // 湧き口: 火山斜面側と町の東西の外れから炉へ寄せる。
    gates: [
      { x: 16, z: 27 },
      { x: 46, z: 29 },
      { x: 32, z: 33 },
    ],
    target: { x: f.x + 2.5, y: 6, z: f.z + 1.5, halfW: 2.4 },
  };
}
