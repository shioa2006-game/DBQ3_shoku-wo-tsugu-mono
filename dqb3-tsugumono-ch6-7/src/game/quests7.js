import { PLACES, FLOOR_Y } from "../world/world.js";
import { B } from "../world/blocks.js";
import { SFX } from "./sfx.js";
import { CH7 } from "../content/chapter7.js";
import { ENTRANCE_ARCH_CELLS, setRepairParts } from "./blueprints.js";
import { stageIndex } from "./quests.js";

// 第7章「三つ首の空」の進行エンジン。台詞・目標文は content/chapter7.js を参照する。
//
// 章の流れ:
//   沖のガーゴイル軍と防衛線 → 3波（合間に修理と補給。合図で次へ）→ ヴァルガの初襲来（M12）
//   → 神殿の修理・射台・ベルクの招聘 → 大型対空ボウガンと選択の柱 → 最終決戦（M13）
//   → 神殿の再開・アサギとスズハへの継承 → 最後の出航（M14）

const WAVE_STAGES = ["CH7_WAVE1", "CH7_WAVE2", "CH7_WAVE3"];
const PREP_STAGES = ["CH7_ALARM", "CH7_PREP2", "CH7_PREP3"];
const AFTER_WAVE = ["CH7_PREP2", "CH7_PREP3", "CH7_OMEN"];

// 第7章の3波（docs/DESIGN.md の「8. 第7章の防衛」）。
export const WAVES = [
  { label: "第1波", spawns: [["gargoyle", 8]] },
  { label: "第2波", spawns: [["gargoyle_crusher", 3], ["gargoyle", 4]] },
  { label: "第3波", spawns: [["gargoyle", 8], ["gargoyle_crusher", 4]] },
];

const HALL = { tp: true, y: FLOOR_Y };

export class Chapter7 {
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
    return CH7.objectives[this.stage]?.(this.game) ?? "";
  }

  play(lines, done) {
    this.quests.play(lines, done);
  }

  at(stage) {
    return this.quests.at(stage);
  }

  // --- 住民の居場所（第6章の持ち場へ上書きする） ---------------------------------------
  homes() {
    const f = this.flags;
    const h = {};
    // 防衛のあいだ、ゴンタは門の内側で見張る。
    if (!this.at("CH7_AFTERMATH")) h.gonta = { x: 32, z: 48 };
    h.mina = { x: 34, z: 45 };
    h.suzuha = { x: 33, z: 31, ...HALL };
    if (f.belkArrived) h.belk = { x: 24, z: 46 };
    if (this.at("CH7_SUCCESSION") && !this.at("CH7_DONE")) h.pino = { x: 30, z: 39 };
    if (this.stage === "CH7_DEPARTURE") {
      // 見送りと出航の支度。旅の4人とピノ・ベルクは桟橋へ、ダーマの3人は浜で見送る。
      h.mina = { x: 31, z: 100 };
      h.gonta = { x: 33, z: 99 };
      h.pino = { x: 30, z: 99 };
      h.belk = { x: 34, z: 100 };
      h.suzuha = { x: 31, z: 97 };
      h.asagi = { x: 33, z: 97 };
      h.ganzou = { x: 29, z: 98 };
    }
    return h;
  }

  // --- 第7章の始まり -------------------------------------------------------------------

  // CH6_DONE の翌日の日中に、沖のガーゴイル軍の知らせで始まる（QuestManager.update から毎フレーム）。
  maybeStart() {
    const g = this.game;
    const f = this.flags;
    const { day, hour } = g.daynight;
    if (f.ch6DoneDay == null) f.ch6DoneDay = day;
    if (day <= f.ch6DoneDay || hour < 6 || hour >= 19 || g.ui.modalOpen) return;
    this.play(CH7.dialogues.alarm, () => {
      g.giveItems([["iron", 6], ["iron_fitting", 4], ["hide", 3], ["bolt", 30]]);
      g.dharma.resetAltar();
      g.activateBlueprint("defense_line");
      this.quests.setStage("CH7_ALARM");
      g.autosave();
    });
  }

  update() {
    const g = this.game;
    // 選択の柱の完成: 大型対空ボウガンと炊き出しがそろったら、守りの印を刻んで最後の準備へ。
    if (
      this.stage === "CH7_BALLISTA" &&
      g.blueprints.completed.has("great_ballista") &&
      this.flags.markFood &&
      !g.ui.modalOpen
    ) {
      g.quests.ch6.setPillarMarks(4);
      SFX.book();
      this.play([...CH7.dialogues.ballistaDone, ...CH7.dialogues.pillarDone], () => {
        this.quests.setStage("CH7_FINAL_PREP");
        this.showRepair(); // 防衛線などに壊れた場所が残っていれば、任意の修理の枠を出す
        g.autosave();
      });
    }
  }

  onCrafted(itemId, recipe) {
    if (recipe?.station === "kamado" && this.at("CH7_BALLISTA")) {
      this.quests.counters.ch7Cooked = (this.quests.counters.ch7Cooked ?? 0) + 1;
    }
  }

  // 修理（修復ガイド）に含める建物を、進行から決める。
  repairParts() {
    const done = this.game.blueprints.completed;
    const parts = ["frame", "roof", "altar"];
    // 初襲来の後の修理（物語で必ず要る）は、神殿の本体だけ。門・ボウガン・とげ罠は鉄を使うので
    // 必須にしない（鉄が尽きても先へ進める）。防衛線の枠は、後の準備の段階でまた出す。
    if (this.stage === "CH7_REPAIR" && !this.flags.repairDone) return parts;
    if (done.has("defense_line")) parts.push("defense");
    if (done.has("ballista_tower")) parts.push("tower");
    if (done.has("great_ballista")) parts.push("ballista");
    return parts;
  }

  // 壊れた場所があれば「神殿の修理」の設計図を出す（無ければ何もしない）。
  showRepair() {
    const g = this.game;
    setRepairParts(this.repairParts());
    if (g.blueprints.active && g.blueprints.active.id !== "temple_repair") return false;
    g.blueprints.completed.delete("temple_repair");
    if (!g.missingRepairCells().length) {
      g.blueprints.clear();
      return false;
    }
    this.silentRepair = false;
    g.activateBlueprint("temple_repair");
    return true;
  }

  // --- 設計図 -------------------------------------------------------------------------

  onBlueprintComplete(id) {
    const g = this.game;
    const d = CH7.dialogues;
    if (!this.quests.isCh7()) return false;
    if (id === "defense_line" && this.stage === "CH7_ALARM") {
      SFX.levelup();
      this.flags.defenseBuilt = true;
      this.play(d.defenseReady, () => g.onStageChanged());
      return true;
    }
    if (id === "temple_repair") {
      SFX.levelup();
      if (this.stage === "CH7_REPAIR" && !this.flags.repairDone) {
        this.flags.repairDone = true;
        g.quests.ch6.setPillarMarks(2);
        this.play(d.repairDone, () => {
          g.activateBlueprint("ballista_tower");
          g.onStageChanged();
        });
      } else {
        g.ui.toast("🔨 壊れた場所を すべて直した！");
      }
      return true;
    }
    if (id === "ballista_tower" && this.stage === "CH7_REPAIR") {
      SFX.levelup();
      this.play(d.towerDone, () => g.onStageChanged());
      return true;
    }
    if (id === "great_ballista" && this.stage === "CH7_BALLISTA") {
      SFX.levelup();
      g.onStageChanged(); // 柱の完成は update() が、炊き出しとそろったときに流す
      return true;
    }
    if (id === "reopen_repair" && this.stage === "CH7_AFTERMATH") {
      SFX.levelup();
      this.flags.reopenDone = true;
      this.play(d.reopenDone, () => g.onStageChanged());
      return true;
    }
    return false;
  }

  // --- 会話 ---------------------------------------------------------------------------

  onTalk(villagerId) {
    const g = this.game;
    const d = CH7.dialogues;
    const f = this.flags;
    // ゴンタへの合図: 3波。
    const waveIndex = PREP_STAGES.indexOf(this.stage);
    if (villagerId === "gonta" && waveIndex >= 0) {
      if (waveIndex === 0 && !f.defenseBuilt) return false;
      this.play(d.waveTalk[waveIndex], () => {
        this.quests.choose(d.waveChoice[waveIndex], d.waveOptions, (i) => {
          if (i === 0) this.beginWave(waveIndex);
        });
      });
      return true;
    }
    // ゴンタへの合図: 初襲来。
    if (villagerId === "gonta" && this.stage === "CH7_OMEN") {
      this.play(d.omenTalk, () => {
        this.quests.choose(d.omenChoice, d.waveOptions, (i) => {
          if (i === 0) this.beginAssault();
        });
      });
      return true;
    }
    // ゴンタへの合図: 最終決戦。
    if (villagerId === "gonta" && this.stage === "CH7_FINAL_PREP") {
      this.play(d.finalTalk, () => {
        this.quests.choose(d.finalChoice, d.finalOptions, (i) => {
          if (i === 0) this.beginFinal();
        });
      });
      return true;
    }
    // ピノ: ワタリの帰りを待つ（数日が過ぎ、ベルクが着く）。
    if (
      villagerId === "pino" && this.stage === "CH7_REPAIR" &&
      f.repairDone && g.blueprints.completed.has("ballista_tower")
    ) {
      this.play(d.waitTalk, () => {
        this.quests.choose(d.waitChoice, d.waitOptions, (i) => {
          if (i === 0) this.belkArrives();
        });
      });
      return true;
    }
    // ミナ: 炊き出し（食の印）。
    if (villagerId === "mina" && this.stage === "CH7_BALLISTA" && !f.markFood) {
      if ((this.quests.counters.ch7Cooked ?? 0) < 3) {
        this.play(d.mealNotYet);
        return true;
      }
      this.play(d.mealDone, () => {
        f.markFood = true;
        g.quests.ch6.setPillarMarks(3);
        SFX.book();
        g.onStageChanged();
      });
      return true;
    }
    // ベルク: 大矢が足りなければ、打っておいた分を渡す（鉄が尽きても最終決戦に挑めるように）。
    if (villagerId === "belk" && (this.stage === "CH7_BALLISTA" || this.stage === "CH7_FINAL_PREP")) {
      const have = g.inventory.count("great_bolt");
      if (have >= 5) return false;
      this.play(d.belkBolts, () => g.giveItems([["great_bolt", 6 - have]]));
      return true;
    }
    // ピノがアサギの屋根を確かめ、仕事を託す。
    if (villagerId === "pino" && this.stage === "CH7_AFTERMATH" && f.reopenDone) {
      this.play(d.pinoEntrusts, () => {
        f.asagiEntrusted = true;
        this.quests.setStage("CH7_SUCCESSION");
        g.autosave();
      });
      return true;
    }
    // スズハが神殿を引き受ける。
    if (villagerId === "suzuha" && this.stage === "CH7_SUCCESSION" && !f.copyGiven) {
      this.play(d.succession, () => {
        f.copyGiven = true;
        g.giveItems([["book_copy", 1]]);
        g.onStageChanged();
      });
      return true;
    }
    // 最後の出航。
    if (villagerId === "watari" && this.stage === "CH7_DEPARTURE") {
      this.quests.choose(d.departChoice, d.departOptions, (i) => {
        if (i === 0) this.depart();
      });
      return true;
    }
    return false;
  }

  // 祭壇（授職の灯）を調べた。写しを納める／灯の守りを繕う。
  onInteract(kind) {
    if (kind !== "altar") return false;
    const g = this.game;
    if (this.stage === "CH7_SUCCESSION" && this.flags.copyGiven && g.inventory.has("book_copy", 1)) {
      g.inventory.remove("book_copy", 1);
      SFX.book();
      this.flags.templeReopened = true;
      this.play(CH7.dialogues.copyPlaced, () => {
        SFX.levelup();
        g.setBaseLevel(6);
        this.quests.setStage("CH7_DEPARTURE");
        g.autosave();
      });
      return true;
    }
    if (!this.at("CH7_AFTERMATH") && g.dharma.altarHp < g.dharma.altarMax) {
      if (g.inventory.has("dharma_stone", 2)) {
        g.inventory.remove("dharma_stone", 2);
        g.dharma.repairAltar(40);
        SFX.place();
        g.ui.toast(`🔥 祭壇を繕った（灯の守り ${Math.round(g.dharma.altarHp)}/${g.dharma.altarMax}）`);
      } else {
        g.ui.toast(`🔥 灯の守り ${Math.round(g.dharma.altarHp)}/${g.dharma.altarMax}…神殿の石2つで 繕える`);
      }
      return true;
    }
    return false;
  }

  // --- 戦いの開始 -----------------------------------------------------------------------

  beginWave(index) {
    const g = this.game;
    g.saveCheckpoint(); // 開始直前の状態（敗北・中断ロードで戻る場所）
    g.blueprints.clear();
    this.quests.setStage(WAVE_STAGES[index], true);
    g.startWave(index);
  }

  async beginAssault() {
    const g = this.game;
    const first = !this.flags.m12Seen;
    this.flags.m12Seen = true; // 再挑戦ではムービーを流し直さない
    g.saveCheckpoint();
    g.blueprints.clear();
    const d = CH7.dialogues;
    const start = () => {
      this.quests.setStage("CH7_VARUGA1", true);
      g.startVaruga("assault");
    };
    if (!first) {
      this.play(d.varuga1Retry, start);
      return;
    }
    // 三頭魔竜の襲来のムービー（M12）。名乗りは、最後まで見なかったときだけ会話で流す。
    this.quests.busy = true;
    const { shown, skipped } = await g.movies.play("ch7-three-heads");
    const lines = shown && !skipped ? d.varugaArrives : [...d.varugaNameFallback, ...d.varugaArrives];
    this.play(lines, start);
  }

  beginFinal() {
    const g = this.game;
    const first = !this.flags.finalSeen;
    this.flags.finalSeen = true;
    g.saveCheckpoint();
    g.blueprints.clear();
    this.play(first ? CH7.dialogues.varugaReturns : CH7.dialogues.varuga2Retry, () => {
      this.quests.setStage("CH7_VARUGA2", true);
      g.startVaruga("final");
    });
  }

  // --- 戦いの決着 -----------------------------------------------------------------------

  // 3波の勝敗（main.defense.onEnd → quests 経由）。
  onRaidEnd(win) {
    const g = this.game;
    const index = WAVE_STAGES.indexOf(this.stage);
    if (index < 0) return;
    if (!win) {
      this.play(CH7.dialogues.waveLose, () => g.restoreCheckpoint());
      return;
    }
    this.flags.wavesCleared = index + 1;
    SFX.quest();
    this.quests.setStage(AFTER_WAVE[index], true);
    this.play(CH7.dialogues.waveWin[index], () => {
      this.showRepair();
      this.quests.setStage(AFTER_WAVE[index]);
      g.autosave();
    });
  }

  // ヴァルガ戦の勝敗（main.varuga.onEnd → quests 経由）。
  onVarugaEnd(kind, win) {
    const g = this.game;
    const d = CH7.dialogues;
    if (kind === "assault") {
      if (!win) {
        this.play(d.varuga1Lose, () => g.restoreCheckpoint());
        return;
      }
      SFX.quest();
      this.play(d.gontaShot, () => {
        // 傷ついた屋根へアサギが取りかかり、ワタリはベルクを迎えに出る（神殿からは海岸が見えない）。
        this.flags.varuga1Done = true;
        g.setShip(false);
        this.flags.shipAway = true;
        this.quests.setStage("CH7_REPAIR", true);
        this.play(d.afterVaruga1, () => {
          g.giveItems([["roof", 40], ["log", 30], ["dharma_stone", 30]]);
          this.showRepair();
          if (!g.blueprints.active) this.onBlueprintComplete("temple_repair");
          this.quests.setStage("CH7_REPAIR");
          g.autosave();
        });
      });
      return;
    }
    if (!win) {
      this.play(d.varuga2Lose, () => g.restoreCheckpoint());
      return;
    }
    this.finalVictory();
  }

  // 最終決戦の勝利: 決着のムービー（M13）→ 戦後の修復へ。損傷はそのまま残る。
  async finalVictory() {
    const g = this.game;
    const d = CH7.dialogues;
    this.flags.varugaDefeated = true;
    SFX.quest();
    this.quests.busy = true;
    const { shown, skipped } = await g.movies.play("ch7-flame-holds");
    // 神殿の再開に要る場所（祭壇と入口）が無傷なら、竜の最期のあがきで入口のアーチが崩れている。
    setRepairParts(this.repairParts());
    if (!g.missingCells("reopen_repair").length) {
      for (const [x, y, z] of ENTRANCE_ARCH_CELLS) g.world.set(x, y, z, B.AIR);
    }
    this.quests.setStage("CH7_AFTERMATH", true);
    const lines = shown && !skipped ? d.aftermath : [...d.varugaFallFallback, ...d.aftermath];
    this.play(lines, () => {
      g.activateBlueprint("reopen_repair");
      this.quests.setStage("CH7_AFTERMATH");
      g.autosave();
    });
  }

  // ワタリの帰港とベルクの到着（数日後へ暗転。海岸は見えない）。
  async belkArrives() {
    const g = this.game;
    this.quests.busy = true;
    await g.ui.fade(true, 800);
    g.daynight.day += 2;
    g.daynight.hour = 9;
    g.setShip(true);
    this.flags.shipAway = false;
    this.flags.belkArrived = true;
    this.quests.counters.ch7Cooked = 0;
    this.quests.setStage("CH7_BALLISTA", true);
    await g.ui.fade(false, 800);
    this.quests.busy = false;
    this.play(CH7.dialogues.belkArrives, () => {
      g.giveItems([["great_ballista", 1], ["great_bolt", 6]]);
      g.activateBlueprint("great_ballista");
      this.quests.setStage("CH7_BALLISTA");
      g.autosave();
    });
  }

  // 最後の出航: 見送りの会話 → エンディングのムービー（M14）→ ダーマ再興編・完。
  depart() {
    const g = this.game;
    const d = CH7.dialogues;
    this.play(d.departure, async () => {
      this.quests.busy = true;
      const { shown, skipped } = await g.movies.play("ch7-unseen-books");
      const finish = () => {
        SFX.levelup();
        g.setBaseLevel(7);
        this.quests.setStage("CH7_DONE");
        g.autosave();
      };
      this.quests.busy = false;
      if (shown && !skipped) finish();
      else this.play(d.endingFallback, finish);
    });
  }

  // 翼を射抜かれたヴァルガが前庭へ降りた（main.varuga.onGrounded から）。
  onVarugaGrounded() {
    this.play(CH7.dialogues.varugaGrounded);
  }

  // 第7章の戦いで倒れたら、祭壇の前で立ち上がる（戦いは続く）。
  onPlayerDown() {
    const g = this.game;
    if (g.defense.active || g.varuga.active) return { x: PLACES.altar.x + 0.5, y: FLOOR_Y + 0.1, z: PLACES.altar.z + 3.5 };
    return null;
  }

  // ロード後・復元後: 章の進行から導かれる状態を置き直す。
  restoreState() {
    const i = stageIndex(this.stage);
    setRepairParts(this.repairParts());
    // 準備の段階では、壊れた場所の修復ガイドを出し直す（別の設計図が出ていれば、そちらを優先）。
    const prep = ["CH7_PREP2", "CH7_PREP3", "CH7_OMEN", "CH7_FINAL_PREP"].includes(this.stage) ||
      (this.stage === "CH7_REPAIR" && !this.flags.repairDone);
    if (prep && !this.game.blueprints.active) this.showRepair();
    void i;
  }
}
