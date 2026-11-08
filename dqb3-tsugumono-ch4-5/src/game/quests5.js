import { PLACES } from "../world/world.js";
import { SFX } from "./sfx.js";
import { CH5 } from "../content/chapter5.js";
import { GROM_CONFIG } from "../entities/dragon-configs.js";

// 第5章「眠る竹林の社」の進行エンジン。台詞・目標文は content/chapter5.js を参照する。
// QuestManager から CH5 ステージのあいだ委譲される。
//
// 章の流れ:
//   ヨモギと瘴熱 → 鉄の山刀と峠の開通 → 宿坊 → 薬草園と煎じ湯 → 外社と記録
//   → 夜通しの看護（僧侶の書）→ 穢れ石3か所の浄化 → 内社 → グロム討伐
//   → 泉の祭壇・水門・導水路 → 泉の浄化と「火山島編・完」

const GATE_BASE_Y = 8; // 竹林の門の基準高さ（巻き道 z58 の路面。封鎖の山から取らない）

// 宿坊ができるまで病人（スミ・テル）を寝かせ、ナギが付き添う場所（宿坊予約地からの相対）。
// 宿坊の設計図は予約地から x+0..4・z+0..3 を使い、倒れた住民はブロックの設置を妨げるので、
// 入り口（x+2, z+3）の南、火山灰畑の柵（x+0 の列）にも掛からない z+5 の列に並べる。
const SICK_SPOTS = { sumi: { dx: 1, dz: 5 }, teru: { dx: 4, dz: 5 } };
const NAGI_NURSE_SPOT = { dx: 2, dz: 5 };

export class Chapter5 {
  constructor(quests) {
    this.quests = quests;
    this.game = quests.game;
    this.stoneGuardsLeft = PLACES.taintStones.map(() => 0); // 実行時のみ（保存しない）
  }

  get stage() {
    return this.quests.stage;
  }

  get flags() {
    return this.quests.flags;
  }

  objectiveText() {
    return CH5.objectives[this.stage]?.(this.game) ?? "";
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

  rehome(id, x, z) {
    const v = this.game.villager(id);
    if (!v) return;
    v.home.set(x + 0.5, this.game.world.terrainSurfaceY(x, z) + 0.1, z + 0.5);
    v.moveTarget = null;
  }

  // CH4_DONE の翌朝に第5章が始まる（Chapter4.update から毎フレーム呼ばれる）。
  // 会話は自動再生せず、鉱山町へ戻ってきたヨモギに！を付けて「話しかけたら始まる」方式。
  maybeStart() {
    const { flags } = this.quests;
    const { day, hour } = this.game.daynight;
    if (flags.ch5Day == null) {
      flags.ch5Day = day; // CH4_DONE を迎えた日を記録
      return;
    }
    if (day > flags.ch5Day && hour >= 6 && hour < 19) {
      this.game.spawnVillager("yomogi", 34, 24);
      this.quests.setStage("CH5_INTRO"); // ！マーカーは updateQuestMarkers が導出
    }
  }

  update() {
    const g = this.game;
    g.ui.setObjective(this.objectiveText());

    // 煎じ湯が2杯そろった → 外社へ（CH5_HERB_GARDEN → CH5_OUTER_SHRINE）。
    if (
      this.stage === "CH5_HERB_GARDEN" &&
      g.blueprints.completed.has("herb_garden") &&
      (this.quests.counters.teaBrewed ?? 0) >= 2 &&
      !this.flags.teaBrewed &&
      !g.ui.menuOpen
    ) {
      this.flags.teaBrewed = true;
      this.play(CH5.dialogues.teaDone, () => {
        g.blueprints.activate(
          "outer_shrine",
          PLACES.outerShrine,
          g.world.pristineSurfaceY(PLACES.outerShrine.x + 2, PLACES.outerShrine.z + 1),
        );
        this.quests.setStage("CH5_OUTER_SHRINE");
      });
    }
  }

  onCrafted(itemId) {
    if (this.stage === "CH5_HERB_GARDEN" && itemId === "herb_tea") {
      this.quests.counters.teaBrewed = (this.quests.counters.teaBrewed ?? 0) + 1;
    }
  }

  onBlockPlaced() {}

  // 穢れ石の番の魔物を倒した数を数える（combat.hurtMonster → quests 経由）。
  onMonsterKilled(m) {
    if (m.guardStone == null) return;
    const i = m.guardStone;
    if (this.stoneGuardsLeft[i] > 0) {
      this.stoneGuardsLeft[i] -= 1;
      if (this.stoneGuardsLeft[i] === 0) {
        this.game.purification.taintStones[i].guardsDown = true;
        SFX.quest();
        this.game.ui.toast("💥 穢れ石の守りが崩れた！ 祈り柱を立て直そう（板材1・石1）");
      }
    }
  }

  // 穢れ石のまわりに番の魔物を放つ（ステージ開始時とロード復元時）。
  spawnStoneGuards() {
    const g = this.game;
    for (let i = 0; i < PLACES.taintStones.length; i += 1) {
      const st = g.purification.taintStones[i];
      if (st.purified || st.guardsDown) continue;
      if (this.stoneGuardsLeft[i] > 0) continue; // すでに出ている
      const s = PLACES.taintStones[i];
      const types = ["taint_dorotabo", "taint_wisp", "taint_bat"];
      this.stoneGuardsLeft[i] = types.length;
      types.forEach((type, k) => {
        const a = (k / types.length) * Math.PI * 2;
        const x = s.x + Math.cos(a) * 2.2;
        const z = s.z + Math.sin(a) * 2.2;
        const y = g.world.terrainSurfaceY(x, z);
        const m = g.monsters.spawn(type, x, y + (k > 0 ? 2 : 0.1), z);
        m.guardStone = i;
        m.persist = true; // 遠距離デスポーンの対象外（石の番を続ける）
      });
    }
  }

  // 穢れ石を調べた（main.interact の "taint" から）。
  onTaintStone(x, z) {
    const g = this.game;
    const i = PLACES.taintStones.findIndex((s) => s.x === x && s.z === z);
    if (i < 0) return;
    if (this.stage !== "CH5_PURIFY_PATH") {
      g.ui.toast("🟣 穢れ石が、鈍く脈打っている……（今は祓えない）");
      return;
    }
    const st = g.purification.taintStones[i];
    if (st.purified) return;
    if (!st.guardsDown) {
      this.play(CH5.dialogues.stoneGuarded);
      return;
    }
    if (!st.pillarBuilt) {
      if (!(g.inventory.has("plank", 1) && g.inventory.has("stone", 1))) {
        this.play(CH5.dialogues.stoneNeedPillar);
        return;
      }
      g.inventory.remove("plank", 1);
      g.inventory.remove("stone", 1);
      st.pillarBuilt = true;
      SFX.place();
      g.ui.toast("🪵 倒れていた祈り柱を立て直した！");
      return;
    }
    if (!g.inventory.has("incense_herb", 1)) {
      this.play(CH5.dialogues.stoneNeedIncense);
      return;
    }
    g.inventory.remove("incense_herb", 1);
    SFX.book();
    this.play(CH5.dialogues.stonePurified, () => {
      g.purification.purifyStone(i);
      SFX.quest();
      const n = g.purification.purifiedCount();
      g.ui.toast(`⛩️ 穢れ石を清めた（${n}/3）。このあたりは安全な中継点になった`);
      if (g.purification.allStonesPurified()) {
        this.relocate("nagi", PLACES.innerShrine.x + 1, PLACES.innerShrine.z + 1);
        this.play(CH5.dialogues.pathDone, () => {
          this.quests.setStage("CH5_INNER_SHRINE");
        });
      } else {
        // ナギが次の穢れ石へ先回りして待つ。
        const next = g.purification.taintStones.findIndex((s) => !s.purified);
        if (next >= 0) this.relocate("nagi", PLACES.taintStones[next].x + 2, PLACES.taintStones[next].z + 1);
        g.onStageChanged();
      }
    });
  }

  onBlueprintComplete(id) {
    const g = this.game;
    if (id === "bamboo_gate" && this.stage === "CH5_BAMBOO_GATE") {
      // 峠の開通。保護ボリューム（座標制限）を解除し、竹林側を有効化する。
      this.flags.bambooPassOpen = true;
      SFX.levelup();
      g.ui.toast("⛰️ 峠が開通した！ 竹林側と自由に行き来できる");
      this.play(CH5.dialogues.gateDone, () => {
        g.blueprints.activate(
          "lodge",
          PLACES.lodgePlot,
          g.world.pristineSurfaceY(PLACES.lodgePlot.x + 2, PLACES.lodgePlot.z + 1),
        );
        this.quests.setStage("CH5_LODGE");
      });
      return true;
    }
    if (id === "lodge" && this.stage === "CH5_LODGE") {
      SFX.levelup();
      // 病人（スミ・テル）を宿坊の寝床へ。
      this.relocate("sumi", PLACES.lodgePlot.x + 1, PLACES.lodgePlot.z + 1);
      this.relocate("teru", PLACES.lodgePlot.x + 3, PLACES.lodgePlot.z + 1);
      for (const pid of ["sumi", "teru"]) {
        const v = g.villager(pid);
        if (v) {
          v.setDown(true);
          v.stayDown = true;
        }
      }
      this.rehome("nagi", PLACES.lodgePlot.x + 2, PLACES.lodgePlot.z + 2);
      this.play(CH5.dialogues.lodgeDone, () => {
        g.blueprints.activate(
          "herb_garden",
          PLACES.herbPlot,
          g.world.pristineSurfaceY(PLACES.herbPlot.x + 1, PLACES.herbPlot.z + 1),
        );
        this.quests.setStage("CH5_HERB_GARDEN");
      });
      return true;
    }
    if (id === "herb_garden" && this.stage === "CH5_HERB_GARDEN") {
      this.rehome("yomogi", PLACES.herbPlot.x + 1, PLACES.herbPlot.z + 4);
      this.play(CH5.dialogues.gardenDone, () => {
        g.giveItems([["herb", 8]]);
        this.quests.setStage("CH5_HERB_GARDEN", true); // 目標を煎じ湯へ更新
      });
      return true;
    }
    if (id === "outer_shrine" && this.stage === "CH5_OUTER_SHRINE") {
      SFX.levelup();
      this.play(CH5.dialogues.shrineDone, () => {
        // 病人の急変。ナギと宿坊へ戻る。
        this.relocate("nagi", PLACES.lodgePlot.x + 2, PLACES.lodgePlot.z + 2);
        this.quests.setStage("CH5_VIGIL");
      });
      return true;
    }
    if (id === "spring_works" && this.stage === "CH5_DRAGON" && this.flags.gromDefeated) {
      SFX.levelup();
      // ナギの祈り（持っていれば清めの香草を焚く）。
      if (this.game.inventory.has("incense_herb", 1)) this.game.inventory.remove("incense_herb", 1);
      this.play(CH5.dialogues.springDone, () => {
        this.finishChapter();
      });
      return true;
    }
    return false;
  }

  onTalk(villagerId) {
    const g = this.game;
    // ヨモギとの出会い → ナギの目覚めと瘴熱。
    if (this.stage === "CH5_INTRO" && villagerId === "yomogi" && !this.flags.yomogiMet) {
      this.quests.busy = true;
      // ナギが目を覚ます（会話中の演出に合わせて起こす）。
      const nagi = g.villager("nagi");
      g.ui.dialogue.play(CH5.dialogues.meetYomogi, () => {
        this.quests.busy = false;
        this.flags.yomogiMet = true;
        if (nagi) {
          nagi.stayDown = false;
          nagi.setDown(false);
          this.rehome("nagi", PLACES.lodgePlot.x + NAGI_NURSE_SPOT.dx, PLACES.lodgePlot.z + NAGI_NURSE_SPOT.dz);
        }
        // 住民が瘴熱に倒れる（宿坊の予定地のそばへ）。
        for (const pid of ["sumi", "teru"]) {
          this.relocate(pid, PLACES.lodgePlot.x + SICK_SPOTS[pid].dx, PLACES.lodgePlot.z + SICK_SPOTS[pid].dz);
          const v = g.villager(pid);
          if (v) {
            v.setDown(true);
            v.stayDown = true;
          }
        }
        g.onStageChanged(); // ！マーカーをベルクへ
      });
      return true;
    }
    // ベルクの鉄の山刀 → 峠へ。
    if (this.stage === "CH5_INTRO" && villagerId === "belk" && this.flags.yomogiMet && !this.flags.macheteGiven) {
      this.play(CH5.dialogues.macheteForged, () => {
        this.flags.macheteGiven = true;
        g.giveItems([["machete", 1]]);
        g.blueprints.activate("bamboo_gate", PLACES.bambooGate, GATE_BASE_Y);
        this.quests.setStage("CH5_BAMBOO_GATE");
      });
      return true;
    }
    // 夜通しの看護 → 僧侶の書。
    if (this.stage === "CH5_VIGIL" && villagerId === "nagi") {
      if (!(g.inventory.has("herb_tea", 1) && g.inventory.has("porridge", 1))) {
        this.play(CH5.dialogues.vigilNotReady);
        return true;
      }
      g.inventory.remove("herb_tea", 1);
      g.inventory.remove("porridge", 1);
      this.play(CH5.dialogues.vigilScene, () => {
        this.quests.busy = true;
        g.jobs.revive("priest", () => {
          SFX.levelup();
          g.setBaseLevel(5);
          this.flags.priestRevivalSeen = true;
          this.quests.busy = false;
          this.play(CH5.dialogues.priestRevived, () => {
            this.quests.setStage("CH5_PURIFY_PATH");
            this.spawnStoneGuards();
            // ナギが最初の穢れ石へ先導する。
            const next = g.purification.taintStones.findIndex((s) => !s.purified);
            if (next >= 0) this.relocate("nagi", PLACES.taintStones[next].x + 2, PLACES.taintStones[next].z + 1);
          });
        });
      });
      return true;
    }
    // 内社での合流 → グロム戦。
    if (this.stage === "CH5_INNER_SHRINE" && villagerId === "nagi") {
      this.quests.busy = true;
      g.ui.dialogue.play(CH5.dialogues.innerShrine, () => {
        g.ui.dialogue.choice(CH5.dialogues.dragonChoice, CH5.dialogues.dragonOptions, (i) => {
          this.quests.busy = false;
          if (i === 0) {
            this.quests.setStage("CH5_DRAGON", true);
            g.startGromBattle();
          }
        });
      });
      return true;
    }
    return false;
  }

  // グロム戦の決着（main.gromBattle.onEnd → quests 経由）。
  onGromEnd(win) {
    if (this.stage !== "CH5_DRAGON") return false;
    const g = this.game;
    if (win) {
      this.flags.gromDefeated = true;
      SFX.quest();
      this.play(CH5.dialogues.gromWin, () => {
        g.blueprints.activate(
          "spring_works",
          PLACES.springWorks,
          g.world.pristineSurfaceY(PLACES.springWorks.x + 2, PLACES.springWorks.z + 5),
        );
        g.onStageChanged();
      });
    }
    return true;
  }

  // 泉の浄化 → 住民の回復 → 出航エンディング → クリア後の自由建築。
  finishChapter() {
    const g = this.game;
    g.purification.purifySpring();
    // 病人の全快。
    for (const pid of ["sumi", "teru"]) {
      const v = g.villager(pid);
      if (v) {
        v.stayDown = false;
        v.setDown(false);
        v.hp = v.maxHp;
      }
    }
    this.rehome("sumi", 29, 24);
    this.rehome("teru", 36, 20);
    // 章末の持ち場: ナギは社と宿坊、ヨモギは薬草園。
    this.rehome("nagi", PLACES.outerShrine.x + 2, PLACES.outerShrine.z + 2);
    this.rehome("yomogi", PLACES.herbPlot.x + 1, PLACES.herbPlot.z + 4);
    SFX.levelup();
    g.setBaseLevel(6);
    this.quests.busy = true;
    // 火山島編の結びのムービー（M7）。流せないときは、そのまま CH5_DONE へ（文字の結末は2026-11-08に削除）。
    g.movies.play("ch5-return").then(() => {
      this.quests.busy = false;
      this.quests.setStage("CH5_DONE");
      g.autosave();
    });
  }

  // ロード後の正規化: 章の進行から導出される状態を復元する。
  restoreState() {
    const g = this.game;
    const order = [
      "CH5_INTRO", "CH5_BAMBOO_GATE", "CH5_LODGE", "CH5_HERB_GARDEN", "CH5_OUTER_SHRINE",
      "CH5_VIGIL", "CH5_PURIFY_PATH", "CH5_INNER_SHRINE", "CH5_DRAGON", "CH5_DONE",
    ];
    const idx = order.indexOf(this.stage);
    if (idx < 0) return;
    // ヨモギは第5章開始から常駐。
    if (!g.villager("yomogi")) g.spawnVillager("yomogi", 34, 24);
    // ナギ: CH5_INTRO でヨモギに会う前は昏倒したまま。以後は起きている。
    const nagi = g.villager("nagi");
    if (nagi) {
      if (this.flags.yomogiMet) {
        nagi.stayDown = false;
        nagi.setDown(false);
      } else {
        nagi.setDown(true);
        nagi.stayDown = true;
      }
    }
    // 病人: ヨモギに会ってから泉の浄化まで、スミとテルは倒れている。
    const sick = this.flags.yomogiMet && !g.purification.springPurified;
    for (const pid of ["sumi", "teru"]) {
      const v = g.villager(pid);
      if (v) {
        v.setDown(sick);
        v.stayDown = sick;
      }
    }
    // 宿坊の完成前: 以前のセーブでは病人とナギが宿坊の予定地の中にいて建てられないことがある。
    // 予定地の外の寝かせ場所へ移す。
    if (sick && idx <= order.indexOf("CH5_LODGE")) {
      for (const pid of ["sumi", "teru"]) {
        this.relocate(pid, PLACES.lodgePlot.x + SICK_SPOTS[pid].dx, PLACES.lodgePlot.z + SICK_SPOTS[pid].dz);
      }
      this.rehome("nagi", PLACES.lodgePlot.x + NAGI_NURSE_SPOT.dx, PLACES.lodgePlot.z + NAGI_NURSE_SPOT.dz);
    }
    // グロム戦中のセーブは戦闘前の準備状態へ戻す。
    if (this.stage === "CH5_DRAGON" && !this.flags.gromDefeated) {
      this.quests.setStage("CH5_INNER_SHRINE", true);
    }
    // 穢れ石の番の魔物（未討伐ぶんだけ再配置）。
    if (this.stage === "CH5_PURIFY_PATH") this.spawnStoneGuards();
  }
}
