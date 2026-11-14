import { PLACES, FLOOR_Y, CAVE_LOWER_Y, CAVE_UPPER_Y, inCave } from "../world/world.js";
import { B, SELECT_PILLARS } from "../world/blocks.js";
import { SFX } from "./sfx.js";
import { BGM } from "./bgm.js";
import { CH6 } from "../content/chapter6.js";
import { stageIndex } from "./quests.js";

// 第6章「よみがえるダーマ神殿」の進行エンジン。台詞・目標文は content/chapter6.js を参照する。
//
// 章の流れ:
//   着岸・スズハ・水運びの橋 → 神殿跡と共同小屋 → 基壇 → ワタリの出航と採石洞
//   → 足場・橋・大岩ガニ → 要石の切り出しと搬出（帰港）→ 柱と壁・大屋根（ピノ）
//   → 要石の祭壇 → 横の入口・書庫・共同台所 → 最初の授職（アサギ）→ 結び

// くさびを打つ印（要石の岩盤の手前のマス）。
export const WEDGE_CELLS = [
  [8, CAVE_LOWER_Y + 1, 3],
  [9, CAVE_LOWER_Y + 2, 3],
  [10, CAVE_LOWER_Y + 1, 3],
];
const BOULDER_CELLS = [];
for (let z = 33; z <= 35; z += 1) for (let y = CAVE_UPPER_Y; y <= CAVE_UPPER_Y + 3; y += 1) BOULDER_CELLS.push([15, y, z]);

const HALL = { tp: true, y: FLOOR_Y };

export class Chapter6 {
  constructor(quests) {
    this.quests = quests;
    this.game = quests.game;
    this.crab = null; // 大岩ガニ（実行時のみ。セーブしない）
  }

  get stage() {
    return this.quests.stage;
  }

  get flags() {
    return this.quests.flags;
  }

  objectiveText() {
    return CH6.objectives[this.stage]?.(this.game) ?? "";
  }

  play(lines, done) {
    this.quests.play(lines, done);
  }

  at(stage) {
    return this.quests.at(stage);
  }

  // --- 住民の居場所（ステージとフラグから導く） ---------------------------------------
  homes() {
    const f = this.flags;
    const at = (s) => this.at(s);
    const before = (s) => !at(s);
    const h = {};
    // 旅の仲間。
    h.mina = before("CH6_RUINS") ? { x: 30, z: 99 } : { x: 34, z: 46 };
    h.gonta = before("CH6_RUINS") ? { x: 34, z: 98 } : { x: 31, z: 48 };
    if (!f.shipAway) {
      // ワタリは船番。基壇の相談のあいだだけ神殿へ上がる。
      h.watari = this.stage === "CH6_FOUNDATION" ? { x: 36, z: 48 } : { ...PLACES.watariPost };
    }
    // ダーマの住民。
    h.suzuha = before("CH6_RUINS") ? { ...PLACES.suzuhaHome } : { x: 30, z: 44 };
    if (at("CH6_FOUNDATION")) {
      h.asagi = { x: 28, z: 42, spawn: { x: 32, z: 51 } };
      h.ganzou = { x: 26, z: 40, spawn: { x: 33, z: 52 } };
    }
    if (this.stage === "CH6_VOYAGE") h.ganzou = { x: 17, z: 34 };
    if (this.stage === "CH6_QUARRY" || this.stage === "CH6_CRAB") {
      const done = this.game.blueprints.completed;
      h.ganzou = done.has("quarry_bridge")
        ? { x: 8, z: 18, y: CAVE_LOWER_Y, tp: true }
        : done.has("quarry_scaffold")
          ? { x: 8, z: 22, y: CAVE_LOWER_Y, tp: true }
          : { x: 11, z: 34, y: CAVE_UPPER_Y, tp: true };
    }
    if (this.stage === "CH6_KEYSTONE" || this.stage === "CH6_HAULING") {
      h.ganzou = { x: 6, z: 5, y: CAVE_LOWER_Y, tp: true };
    }
    if (f.pinoArrived) h.pino = { x: 30, z: 41 };
    if (this.stage === "CH6_ORDINATION") {
      h.asagi = { x: 30, z: 31, ...HALL };
      h.suzuha = { x: 34, z: 31, ...HALL };
    }
    return h;
  }

  // ゴンタが採石洞へ同行するか（入口が開いてから、要石を運び出すまで）。
  get escort() {
    const i = stageIndex(this.stage);
    return !!this.flags.caveOpen && i >= stageIndex("CH6_QUARRY") && i <= stageIndex("CH6_HAULING");
  }

  // --- 開幕 ---------------------------------------------------------------------------

  startIntro() {
    const g = this.game;
    this.quests.applyHomes(true);
    // ダーマ再興編の始まりのムービー（M10）の後に導入会話。最後まで見たときは、字幕と同じ内容の行を省く。
    this.quests.busy = true;
    g.movies.play("ch6-arrival").then(({ shown, skipped }) => {
      const { intro, introCoveredByMovie } = CH6.dialogues;
      const lines = shown && !skipped ? intro.filter((_, i) => !introCoveredByMovie.includes(i)) : intro;
      this.play(lines, () => {
        this.quests.setStage("CH6_ARRIVAL");
      });
    });
  }

  update() {
    const g = this.game;
    // 橋を渡って採石場へ近づくと、積み石のふりをしていた大岩ガニが動き出す。
    if (this.stage === "CH6_QUARRY" && this.crab && this.crab.dormant && !g.ui.modalOpen) {
      const p = g.player.pos;
      if (p.z < 11.5 && inCave(p.x, p.y, p.z) && p.distanceTo(this.crab.pos) < 7) {
        this.play(CH6.dialogues.crabWakes, () => {
          // 戦いの最中のポーズのセーブが書く「開始直前の状態」（大岩ガニは積み石のまま）。
          g.saveCheckpoint();
          this.crab.awaken();
          BGM.play("boss");
          this.quests.setStage("CH6_CRAB", true);
          g.ui.toast("🦀 大岩ガニが 動き出した！");
        });
      }
    }
  }

  // 積み石のふりをした大岩ガニを採石場へ置く（橋の完成時と、ロード・再挑戦の復元時）。
  placeCrab() {
    const g = this.game;
    if (this.crab && !this.crab.dead && g.monsters.monsters.includes(this.crab)) g.monsters.remove(this.crab);
    const { x, z } = PLACES.quarry;
    this.crab = g.monsters.spawn("great_rock_crab", x + 0.5, CAVE_LOWER_Y + 0.1, z + 0.5);
    this.crab.persist = true;
    this.crab.dormant = true;
    this.crab.untargetable = true; // 積み石のふりをしている間は、攻撃も当たらない
    this.crab.facingDir.set(0, 1);
  }

  onMonsterKilled(m) {
    if (m.type !== "great_rock_crab" || this.stage !== "CH6_CRAB") return;
    const g = this.game;
    this.crab = null;
    this.flags.crabDefeated = true;
    BGM.play("field");
    SFX.quest();
    this.play(CH6.dialogues.crabWin, () => {
      for (const [x, y, z] of WEDGE_CELLS) g.world.set(x, y, z, B.WEDGE_MARK);
      g.giveItems([["wedge", 3]]);
      this.quests.counters.wedges = 0;
      this.quests.setStage("CH6_KEYSTONE");
      g.autosave();
    });
  }

  // 採石洞で倒れたとき。大岩ガニ戦なら、ボスを積み石へ戻して下の坑道から再挑戦。
  onPlayerDown() {
    const g = this.game;
    if (this.stage === "CH6_CRAB") {
      BGM.play("field");
      this.quests.stage = "CH6_QUARRY";
      this.placeCrab();
      g.onStageChanged();
      return { x: 8.5, y: CAVE_LOWER_Y + 0.1, z: 20.5, then: () => this.play(CH6.dialogues.crabRetry) };
    }
    const p = g.player.pos;
    if (inCave(p.x, p.y, p.z)) return { x: 11.5, y: CAVE_UPPER_Y + 0.1, z: 34.5 };
    return null;
  }

  onBlueprintComplete(id) {
    const g = this.game;
    const d = CH6.dialogues;
    if (id === "slope_bridge" && this.stage === "CH6_ARRIVAL") {
      SFX.levelup();
      this.play(d.bridgeDone, () => this.quests.setStage("CH6_RUINS"));
      return true;
    }
    if (id === "common_hut" && this.stage === "CH6_RUINS") {
      SFX.levelup();
      g.placeBanner(PLACES.banner);
      g.setBaseLevel(1);
      this.quests.setStage("CH6_FOUNDATION", true); // アサギとガンゾウが坂を登ってくる
      this.play(d.hutDone, () => {
        g.giveItems([["dharma_stone", 16]]);
        g.activateBlueprint("temple_base");
        this.quests.setStage("CH6_FOUNDATION");
      });
      return true;
    }
    if (id === "temple_base" && this.stage === "CH6_FOUNDATION") {
      SFX.levelup();
      g.setBaseLevel(2);
      this.play(d.baseDone, () => this.quests.setStage("CH6_VOYAGE"));
      return true;
    }
    if (id === "quarry_scaffold" && this.stage === "CH6_QUARRY") {
      this.quests.applyHomes();
      this.play(d.scaffoldDone, () => {
        g.activateBlueprint("quarry_bridge");
        g.onStageChanged();
      });
      return true;
    }
    if (id === "quarry_bridge" && this.stage === "CH6_QUARRY") {
      this.flags.caveBridgeDone = true;
      this.quests.applyHomes();
      this.placeCrab();
      this.play(d.caveBridgeDone, () => g.onStageChanged());
      return true;
    }
    if (id === "haul_road" && this.stage === "CH6_HAULING") {
      this.haulOut();
      return true;
    }
    if (id === "temple_frame" && this.stage === "CH6_ROOF") {
      SFX.levelup();
      this.play(d.frameDone, () => {
        g.activateBlueprint("temple_roof");
        g.onStageChanged();
      });
      return true;
    }
    if (id === "temple_roof" && this.stage === "CH6_ROOF") {
      SFX.levelup();
      g.setBaseLevel(3);
      this.play(d.roofDone, () => {
        g.giveItems([["keystone", 1]]);
        g.activateBlueprint("altar_keystone");
        this.quests.setStage("CH6_ALTAR");
      });
      return true;
    }
    if (id === "altar_keystone" && this.stage === "CH6_ALTAR") {
      SFX.book();
      this.flags.altarLit = true;
      g.setBaseLevel(4);
      this.play(d.altarDone, () => {
        g.activateBlueprint("temple_living");
        this.quests.setStage("CH6_LIVING");
      });
      return true;
    }
    if (id === "temple_living" && this.stage === "CH6_LIVING") {
      SFX.levelup();
      this.play(d.livingDone, () => {
        g.giveItems([["barley_seed", 6]]);
        g.activateBlueprint("temple_library");
        g.onStageChanged();
      });
      return true;
    }
    if (id === "temple_library" && this.stage === "CH6_LIVING") {
      SFX.levelup();
      this.play(d.libraryDone, () => this.quests.setStage("CH6_ORDINATION"));
      return true;
    }
    return false;
  }

  // 搬出: 住民と要石を運び出す（暗転）。この間に、ワタリとピノの帰港を反映する。
  async haulOut() {
    const g = this.game;
    this.quests.busy = true;
    SFX.levelup();
    await g.ui.fade(true, 700);
    // 採石場の要石は運び出され、船が戻る。日が傾く。
    g.world.set(PLACES.quarry.x, CAVE_LOWER_Y, 4, B.AIR);
    g.setShip(true);
    this.flags.shipAway = false;
    this.flags.pinoArrived = true;
    this.flags.keystoneHauled = true;
    this.quests.stage = "CH6_ROOF";
    this.quests.applyHomes(true);
    g.player.pos.set(PLACES.caveMouth.x + 1.5, g.world.terrainSurfaceY(PLACES.caveMouth.x + 1, PLACES.caveMouth.z) + 0.1, PLACES.caveMouth.z + 0.5);
    g.player.vel.set(0, 0, 0);
    if (g.daynight.hour < 16 || g.daynight.hour > 19) g.daynight.hour = 16.2;
    // 暗転は会話欄も覆うため、画面を戻してから会話の入力待ちに入る。
    await g.ui.fade(false, 700);
    this.quests.busy = false;
    this.play(CH6.dialogues.haulDone, () => {
      this.quests.setStage("CH6_ROOF");
      g.autosave();
    });
  }

  onTalk(villagerId) {
    const g = this.game;
    const d = CH6.dialogues;
    const f = this.flags;
    // スズハとの出会い → 水運びの橋。
    if (this.stage === "CH6_ARRIVAL" && villagerId === "suzuha" && !f.suzuhaMet) {
      this.play(d.meetSuzuha, () => {
        f.suzuhaMet = true;
        g.activateBlueprint("slope_bridge");
        g.onStageChanged();
      });
      return true;
    }
    // 神殿跡: 祭壇を急ぐシオンと、共同小屋。
    if (this.stage === "CH6_RUINS" && villagerId === "suzuha" && !f.ruinsTalked) {
      this.play(d.ruins, () => {
        f.ruinsTalked = true;
        g.giveItems([["straw", 24], ["clay", 4]]);
        g.activateBlueprint("common_hut");
        g.onStageChanged();
      });
      return true;
    }
    // 採石洞の入口: 大岩をどけ、ワタリの出航を反映する（海岸は見えない）。
    if (this.stage === "CH6_VOYAGE" && villagerId === "ganzou") {
      this.play(d.caveGate, () => {
        for (const [x, y, z] of BOULDER_CELLS) g.world.set(x, y, z, B.AIR);
        f.caveOpen = true;
        g.setShip(false);
        f.shipAway = true;
        g.activateBlueprint("quarry_scaffold");
        this.quests.setStage("CH6_QUARRY");
        g.autosave();
      });
      return true;
    }
    // ピノとの再会 → 柱と壁。
    if (this.stage === "CH6_ROOF" && villagerId === "pino" && !f.pinoMet) {
      this.play(d.meetPino, () => {
        f.pinoMet = true;
        g.giveItems([["roof", 200], ["log", 70], ["lantern", 8], ["emblem", 1], ["dharma_stone", 120], ["dharma_pillar", 24]]);
        g.activateBlueprint("temple_frame");
        g.onStageChanged();
      });
      return true;
    }
    // 最初の授職 → 結びのムービー（M11）→ 第6章・完。
    if (this.stage === "CH6_ORDINATION" && villagerId === "asagi") {
      this.play(d.ordination, () => {
        this.setPillarMarks(1);
        f.markCarpenter = true;
        SFX.book();
        this.finishChapter();
      });
      return true;
    }
    return false;
  }

  // 設置物を調べた（くさびの印・要石の岩盤）。
  onInteract(kind, cell) {
    const g = this.game;
    const d = CH6.dialogues;
    if (kind === "wedge") {
      if (this.stage !== "CH6_KEYSTONE") return true;
      if (!g.inventory.has("wedge", 1)) {
        // なくしたときだけ渡し直す。預かり分や収納箱にあるなら渡さない（調べるたびに増えてしまう）。
        const lacking = 3 - (this.quests.counters.wedges ?? 0) - g.ownedCount("wedge");
        if (lacking <= 0) {
          g.throttledToast("wedgekept", "🔺 くさびは 収納箱か預かりにある。持ちものへ入れてから 打とう");
          return true;
        }
        this.play(d.wedgeNeed, () => g.giveItems([["wedge", lacking]]));
        return true;
      }
      g.inventory.remove("wedge", 1);
      g.world.set(cell.x, cell.y, cell.z, B.WEDGE_SET);
      this.quests.counters.wedges = (this.quests.counters.wedges ?? 0) + 1;
      SFX.hitBlock();
      g.player.rig.startAttack();
      g.ui.toast(`🔺 くさびを打った（${this.quests.counters.wedges}/3）`);
      if (this.quests.counters.wedges === 1) this.play(d.wedgeSet);
      return true;
    }
    if (kind === "keystone_rock") {
      if (this.stage !== "CH6_KEYSTONE") {
        g.ui.toast("🪨 青い筋の入った、かたい岩盤だ");
        return true;
      }
      if ((this.quests.counters.wedges ?? 0) < 3) {
        this.play(d.rockNotYet);
        return true;
      }
      SFX.breakBlock();
      g.player.rig.startAttack();
      this.play(d.keystoneCut, () => {
        // 岩盤から要石が離れ、採石場の床に置かれる。くさびは外す。
        for (const [x, y, z] of WEDGE_CELLS) g.world.set(x, y, z, B.AIR);
        for (let x = 8; x <= 10; x += 1) for (let y = CAVE_LOWER_Y; y <= CAVE_LOWER_Y + 2; y += 1) g.world.set(x, y, PLACES.keystoneRock.z, B.AIR);
        g.world.set(PLACES.quarry.x, CAVE_LOWER_Y, 4, B.KEYSTONE_RAW);
        this.flags.keystoneCut = true;
        SFX.levelup();
        g.activateBlueprint("haul_road");
        this.quests.setStage("CH6_HAULING");
        g.autosave();
      });
      return true;
    }
    return false;
  }

  // 選択の柱の印の数（0〜4）を、柱のブロックへ反映する。
  setPillarMarks(n) {
    const g = this.game;
    const { x, z } = PLACES.pillar;
    if (SELECT_PILLARS.includes(g.world.get(x, FLOOR_Y, z))) g.world.set(x, FLOOR_Y, z, SELECT_PILLARS[n]);
    this.flags.pillarMarks = n;
  }

  // 第6章の結び: ムービー（M11）→ 影を見た反応 → 第6章・完。
  finishChapter() {
    const g = this.game;
    this.quests.busy = true;
    g.movies.play("ch6-roof-light").then(({ shown, skipped }) => {
      const d = CH6.dialogues;
      const lines = shown && !skipped ? d.ending : [...d.endingFallback, ...d.ending];
      this.play(lines, () => {
        SFX.levelup();
        g.setBaseLevel(5);
        this.flags.ch6DoneDay = g.daynight.day;
        this.quests.setStage("CH6_DONE");
        g.autosave();
      });
    });
  }

  // ロード後・復元後: 章の進行から導かれる状態を置き直す。
  restoreState() {
    const g = this.game;
    // 大岩ガニ（魔物はセーブしない）: 橋ができてから倒すまで、採石場で積み石のふりをしている。
    this.crab = null;
    if (this.stage === "CH6_QUARRY" && this.flags.caveBridgeDone && !this.flags.crabDefeated) this.placeCrab();
    // 選択の柱の印。
    if (this.flags.pillarMarks) this.setPillarMarks(this.flags.pillarMarks);
    void g;
  }
}
