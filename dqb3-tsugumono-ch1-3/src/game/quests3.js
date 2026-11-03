import { PLACES } from "../world/world.js";
import { SFX } from "./sfx.js";
import { CH3 } from "../content/chapter3.js";

// 第3章「旅立ちの港」の進行エンジン。台詞・目標文は content/chapter3.js を参照する。
// 本章はジパング復興編の最終章。QuestManager から CH3 ステージのあいだ委譲される。

const DECK_Y = 4; // 桟橋・船の桁の高さ（水面+1）。地形からは求めない。

export class Chapter3 {
  constructor(quests) {
    this.quests = quests;
    this.game = quests.game;
  }

  get stage() {
    return this.quests.stage;
  }

  objectiveText() {
    return CH3.objectives[this.stage]?.(this.game) ?? "";
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
  // 新しい持ち場へ歩いて戻る（橋ルーティング＋水没マス回避があるので安全）。
  rehome(id, x, z) {
    const v = this.game.villager(id);
    if (!v) return;
    v.home.set(x + 0.5, this.game.world.terrainSurfaceY(x, z) + 0.1, z + 0.5);
    v.moveTarget = null;
  }

  // CH2_DONE の翌朝に第3章が始まる（Chapter2.update から毎フレーム呼ばれる）。
  // 会話は自動再生しない。浜に倒れたワタリに！を付け、村人たちを浜へ集めて
  // 「見に行って話しかけたら始まる」方式（開幕の会話は登場人物が全員その場にいる）。
  maybeStart() {
    const { flags } = this.quests;
    const { day, hour } = this.game.daynight;
    if (flags.ch3Day == null) {
      flags.ch3Day = day; // CH2_DONE を迎えた日を記録
      return;
    }
    if (day > flags.ch3Day && hour >= 6 && hour < 19) {
      // 浜にボロ船とワタリが打ち上がり、気づいた村人が介抱に集まっている。
      const g = this.game;
      g.spawnVillager("watari", PLACES.spawn.x + 1, PLACES.spawn.z);
      this.relocate("pino", PLACES.spawn.x - 1, PLACES.spawn.z - 2); // 第一発見者
      this.relocate("inaho", PLACES.spawn.x + 2, PLACES.spawn.z - 1); // 介抱役（お茶とおにぎり）
      this.relocate("mina", PLACES.spawn.x - 2, PLACES.spawn.z + 1);
      this.relocate("gonta", PLACES.spawn.x + 4, PLACES.spawn.z - 1);
      this.relocate("jinbei", PLACES.base.x + 1, PLACES.base.z + 3);
      this.quests.setStage("CH3_INTRO"); // ！マーカーは updateQuestMarkers が導出
    }
  }

  update() {
    this.game.ui.setObjective(this.objectiveText());
  }

  onBlueprintComplete(id) {
    const g = this.game;
    if (id === "pier" && this.stage === "CH3_DOCK") {
      SFX.levelup();
      this.play(CH3.dialogues.dockDone, () => {
        g.blueprints.activate("lighthouse", PLACES.lighthouse, g.world.pristineSurfaceY(PLACES.lighthouse.x, PLACES.lighthouse.z));
        this.quests.flags.squidWaters = true; // 夜、海峡にイカが湧き始める
        this.quests.setStage("CH3_LIGHTHOUSE");
        // 以後、ワタリの持ち場は自分の桟橋（船乗りが港に立つ。桟橋の床は
        // terrainSurfaceY が床高を返すため、水没マス回避の徘徊でも歩ける）。
        this.rehome("watari", PLACES.pier.x, PLACES.pier.z + 3);
      });
      return true;
    }
    if (id === "lighthouse" && this.stage === "CH3_LIGHTHOUSE") {
      this.play(CH3.dialogues.lighthouseDone, () => {
        g.blueprints.activate("ship_hull", PLACES.ship, DECK_Y);
        this.quests.setStage("CH3_HULL");
      });
      return true;
    }
    if (id === "ship_hull" && this.stage === "CH3_HULL") {
      this.play(CH3.dialogues.hullDone, () => {
        g.blueprints.activate("ship_mast", PLACES.ship, DECK_Y);
        this.quests.setStage("CH3_MAST");
      });
      return true;
    }
    if (id === "ship_mast" && this.stage === "CH3_MAST") {
      this.play(CH3.dialogues.mastDone, () => {
        g.blueprints.activate("ship_sail", PLACES.ship, DECK_Y);
        this.quests.setStage("CH3_SAIL");
      });
      return true;
    }
    if (id === "ship_sail" && this.stage === "CH3_SAIL") {
      this.reviveSailorBook();
      return true;
    }
    return false;
  }

  reviveSailorBook() {
    const g = this.game;
    this.quests.busy = true;
    g.jobs.revive("sailor", () => {
      SFX.levelup();
      g.setBaseLevel(5);
      this.quests.busy = false;
      this.play(CH3.dialogues.sailorBookRevived, () => {
        this.quests.setStage("CH3_RITE"); // ！（ジンベエ）は updateQuestMarkers が導出
      });
    });
  }

  // 授職の儀の供物（板材5・米5・ごちそう膳1）。
  offeringsReady() {
    const inv = this.game.inventory;
    return inv.count("plank") >= 5 && inv.count("rice") >= 5 && inv.count("feast") >= 1;
  }

  onTalk(villagerId) {
    const g = this.game;
    // 章の開幕: 浜に倒れたワタリに話しかけると始まる。
    if (this.stage === "CH3_INTRO" && villagerId === "watari") {
      this.play(CH3.dialogues.intro, () => {
        g.blueprints.activate("pier", PLACES.pier, DECK_Y);
        this.quests.setStage("CH3_DOCK");
        // 介抱の集まりは解散。それぞれの持ち場へ歩いて戻る（浜が home のままだと
        // 波打ち際を徘徊し続けてしまう）。ワタリだけは浜で桟橋の完成を待つ。
        this.rehome("pino", PLACES.base.x - 3, PLACES.base.z + 2);
        this.rehome("gonta", PLACES.base.x + 3, PLACES.base.z - 3);
        this.rehome("mina", PLACES.farm.x, PLACES.farm.z + 4);
        this.rehome("inaho", PLACES.village.x, PLACES.village.z);
      });
      return true;
    }
    // 授職の儀: ジンベエに供物を捧げる。
    if (this.stage === "CH3_RITE" && villagerId === "jinbei" && !this.quests.flags.riteDone) {
      this.quests.busy = true;
      if (!this.offeringsReady()) {
        g.ui.dialogue.play(CH3.dialogues.riteNotReady, () => {
          this.quests.busy = false;
        });
        return true;
      }
      g.inventory.remove("plank", 5);
      g.inventory.remove("rice", 5);
      g.inventory.remove("feast", 1);
      SFX.quest();
      g.ui.dialogue.play(CH3.dialogues.riteScene, () => {
        this.quests.busy = false;
        this.quests.flags.riteDone = true;
        g.onStageChanged(); // 目標と！マーカー（→ワタリ）を更新
      });
      return true;
    }
    // 出航: 勝利後（CH3_FAREWELL）は船上のワタリへ旅立ちを告げるとエンディング。
    // 後日談（CH3_DONE）でも同じ会話からいつでも再演できる。
    if ((this.stage === "CH3_FAREWELL" || this.stage === "CH3_DONE") && villagerId === "watari") {
      const talk = this.stage === "CH3_DONE" ? CH3.dialogues.departAgainTalk : CH3.dialogues.farewellTalk;
      this.quests.busy = true;
      g.ui.dialogue.play(talk, () => {
        g.ui.dialogue.choice(CH3.dialogues.farewellChoice, CH3.dialogues.farewellOptions, (i) => {
          if (i !== 0) {
            this.quests.busy = false;
            return; // 「まだ島でやることがある」→ 自由行動へ戻る
          }
          SFX.gong(); // 出航の銅鑼 → 出航エンディング（第1章と対になる演出）
          g.ui.playEnding(() => {
            this.quests.busy = false;
            this.quests.setStage("CH3_DONE");
            g.autosave();
          }, { lines: CH3.ending });
        });
      });
      return true;
    }
    // 船出（授職後にワタリへ）→ クラーケン襲撃。
    if (this.stage === "CH3_RITE" && villagerId === "watari" && this.quests.flags.riteDone) {
      this.quests.busy = true;
      g.ui.dialogue.play(CH3.dialogues.departTalk, () => {
        g.ui.dialogue.choice(CH3.dialogues.departChoice, CH3.dialogues.departOptions, (i) => {
          this.quests.busy = false;
          if (i === 0) {
            this.quests.setStage("CH3_DEFENSE", true);
            g.startDefense("kraken");
          }
        });
      });
      return true;
    }
    return false;
  }

  onRaidEnd(win) {
    if (this.stage !== "CH3_DEFENSE") return false;
    if (win) {
      // 共通の勝利オートセーブは会話終了より先に走る。勝利を先に永続化する。
      this.quests.flags.ch3RaidWon = true;
      // 勝どき → CH3_FAREWELL: 旅立つ組（ミナ・ゴンタ・ワタリ）は船へ乗り込み、
      // 見送る組は浜に並ぶ（持ち場は updateQuestMarkers がステージから導出）。
      // 出航はプレイヤーが船上のワタリへ旅立ちを告げたときに始まる。
      this.quests.busy = true;
      SFX.quest();
      this.game.ui.dialogue.play(CH3.dialogues.defenseWin, () => {
        this.quests.busy = false;
        this.quests.setStage("CH3_FAREWELL");
        this.game.autosave();
      });
    } else {
      this.play(CH3.dialogues.defenseLose, () => {
        this.quests.setStage("CH3_RITE"); // riteDone 済みなので！はワタリに戻る
      });
    }
    return true;
  }
}

// クラーケン防衛戦の構成（DefenseEvent.start に渡す）。守る対象＝船。
// 船は 5×9（x34-38 × z59-67）で桟橋の西舷に横付け。中心は (s.x+2, s.z+4)。
// 戦いの舞台は水上の船ではなく、浜の汀線と桟橋（地上戦）。船は係留したまま
// 「守る対象」で、触手が港をつかんで船をかじり、イカは守り手を狙って上陸する。
// 帆・船体壁に囲まれた甲板上で戦うと移動も視認もままならず、水へ落ちやすい
// （プレイ動画で確認された不具合）ための再設計。
export function krakenDefenseConfig() {
  const s = PLACES.ship;
  const cx = s.x + 2, cz = s.z + 4;
  return {
    label: "⛵ 船",
    targetHp: 140, // 触手のかじりに耐えるだけの船体HP
    waves: [
      { label: "第1波", spawns: [["squid", 5]] },
      { label: "第2波", spawns: [["squid", 6]] },
      { label: "最終波", spawns: [["kraken", 1], ["kraken_arm", 4]] },
    ],
    // 海峡の水面の湧き口（イカ用）。岸の近くに置き、上陸までを短くする。
    gates: [
      { x: 33, z: 63 },
      { x: 43, z: 59 },
      { x: 38, z: 66 },
    ],
    target: { x: cx, y: DECK_Y, z: cz, halfW: 3.2 },
    // 住民の集合位置（桟橋の付け根の浜）。bannerPos（船の中心＝水上）のままだと
    // 非戦闘員が海へ入ってしまう。戦闘員も敵がいない間はここで待つ。
    rally: { x: PLACES.pier.x + 1.5, z: PLACES.pier.z + 1.5 },
    // クラーケンの配置。本体は沖の海中（触手が残るあいだ無敵・無攻撃）、
    // 触手4本は浜の汀線と桟橋の先端に沿った水際＝陸の縁から剣が届く距離。
    // 東の浜(41,55)・浜の中央(36,58)・西の岸(33,59)・桟橋の先端(z61)の各縁に
    // 1本ずつ這わせ、平らな浜と桟橋を走って部位破壊する導線にする。
    // 触手を全て折ると本体が surface（桟橋の先端そば）へ浮上し、叩けるようになる。
    kraken: {
      body: { x: cx, y: DECK_Y + 0.4, z: cz + 6 },
      arms: {
        y: DECK_Y + 0.4,
        spots: [
          { x: 41.5, z: 56.5 }, // 東の浜の汀線
          { x: 37.5, z: 58.5 }, // 浜の中央の汀線
          { x: 33.5, z: 60.5 }, // 西の岸（船の西舷そば）
          { x: 39.5, z: 62.5 }, // 桟橋の先端の南
        ],
      },
      surface: { x: 39.5, z: 63 },
      // 浮上後の本体が潜航して移り歩く浮上ポイント（触手と同じ、陸から届く水際）。
      // 据え置きだと張り付いて殴るだけになるため、プレイヤーが浜を追う戦いにする。
      surfacePoints: [
        { x: 39.5, z: 63 }, // 桟橋の先端の南
        { x: 41.5, z: 56.5 }, // 東の浜の汀線
        { x: 33.5, z: 60.5 }, // 西の岸（船の西舷そば）
      ],
    },
  };
}
