import * as THREE from "three";
import { InteractionTargets } from "../../game-shared/interactions.mjs";
import "../../game-shared/interactions.css";
import { cellInReach, pickBlueprintCell } from "../../game-shared/blueprint-target.mjs";
import { buildCellBlockers, clearVillagersFromCell } from "../../game-shared/build-clearance.mjs";
import { StoryMovies } from "../../game-shared/story-movies.mjs";
import { Input } from "./core/input.js";
import { cellKey } from "./core/utils.js";
import { B, BLOCK_DEFS, isSolidFor } from "./world/blocks.js";
import { VoxelWorld, WORLD, PLACES, FISH_SPOTS, RAID_ROUTE, FLOOR_Y, TERRACE_Y, inCave, shipCells } from "./world/world.js";
import { ChunkRenderer } from "./world/mesher.js";
import { PropRenderer } from "./world/props.js";
import { ITEMS, RECIPES, Inventory, itemForBlock, onItemIconsReady, itemIconReport, itemIcon } from "./game/items.js";
import { QuestManager, stageIndex } from "./game/quests.js";
import { WAVES } from "./game/quests7.js";
import { JobManager } from "./game/jobs.js";
import { NEW_GAME_STATE } from "./game/newgame.js";
import { FarmingSystem } from "./systems/farming.js";
import { TreeSystem } from "./systems/trees.js";
import { MushroomSystem } from "./systems/mushrooms.js";
import { StorageSystem } from "./systems/storage.js";
import { CookingSystem } from "./systems/cooking.js";
import { CombatSystem } from "./systems/combat.js";
import { WaterSystem } from "./systems/water.js";
import { DharmaDefense } from "./systems/defenses.js";
import { BuildCrew } from "./systems/crew.js";
import { Ballista } from "./systems/ballista.js";
import { VarugaBattle } from "./game/varuga-battle.js";
import { SMALL_TALK, SMALL_TALK_FALLBACK } from "./content/smalltalk.js";
import { DayNight } from "./game/daynight.js";
import { BlueprintManager, BLUEPRINTS, BLUEPRINT_ORIGIN, CREW_BLUEPRINTS } from "./game/blueprints.js";
import { DefenseEvent } from "./game/defense.js";
import { SFX } from "./game/sfx.js";
import { BGM } from "./game/bgm.js";
import { hasSave, writeSave, readSave, SAVE_KEY } from "./game/save.js";
import { Player } from "./entities/player.js";
import { Villager, VILLAGER_FOOTING } from "./entities/villagers.js";
import { findStandCell, seatsAround } from "../../game-shared/villager-footing.mjs";
import { MonsterManager } from "./entities/monsters.js";
import { pickAmbientType } from "./entities/monster-types.js";
import { ItemDrop } from "./entities/entity.js";
import { UI, BUILD_ID } from "./ui/ui.js";
import { MOVIES } from "./content/movies.js";

const CAMERA_HEIGHT = 8.2;
const CAMERA_RADIUS = 11.5;
const CAMERA_ROTATE_STEP = Math.PI / 4;
const CAMERA_FOLLOW_RATE = 7.7;
const REACH = 5.6;
const CAVE_SKY = 0x1c1814;
// 第7章の戦いのあいだ、戦わない住民が身を寄せるマス（本堂の床。ミナは門の内側の旗のそば）。
const SHELTERS = {
  suzuha: { x: 33, y: FLOOR_Y, z: 30 },
  asagi: { x: 29, y: FLOOR_Y, z: 31 },
  ganzou: { x: 30, y: FLOOR_Y, z: 33 },
  pino: { x: 34, y: FLOOR_Y, z: 33 },
  mina: { x: 33, y: TERRACE_Y, z: 46 },
};

class Game {
  constructor() {
    // --- renderer / scene ---------------------------------------------------------
    this.app = document.querySelector("#app");
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9aa4b5);
    this.scene.fog = new THREE.Fog(0x9aa4b5, 30, 55);
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.app.appendChild(this.renderer.domElement);
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x6a635a, 2.4);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sunLight.position.set(20, 30, 14);
    this.scene.add(this.hemiLight, this.sunLight);

    // --- world ---------------------------------------------------------------------
    this.world = new VoxelWorld();
    this.world.generate();
    this.input = new Input(this.renderer.domElement);
    this.ui = new UI();
    // SVGストーリームービー。再生中は ui.modalOpen が true になり、入力と世界が止まる。
    this.movies = new StoryMovies(MOVIES);
    this.ui.movies = this.movies;
    this.inventory = new Inventory();
    this.pendingRewards = [];
    this.daynight = new DayNight();
    this.baseLevel = 0;

    // Gameplay systems + runtime cell indexes. World changes are dispatched to
    // each system from onWorldChange.
    this.workbenches = new Set();
    this.kamados = new Set();
    this.kilns = new Set(); // 炭焼き窯
    this.forges = new Set(); // 炉
    this.farming = new FarmingSystem(this);
    this.trees = new TreeSystem(this);
    this.mushrooms = new MushroomSystem(this);
    this.storage = new StorageSystem(this);
    this.combat = new CombatSystem(this);
    this.cooking = new CookingSystem(this);
    this.water = new WaterSystem(this);
    this.dharma = new DharmaDefense(this); // 祭壇の耐久・矢倉・ボウガン・罠
    this.crew = new BuildCrew(this); // 大工たちの手伝い
    this.ballista = new Ballista(this); // 大型対空ボウガン
    this.world.onChange((x, y, z, id, prev) => this.onWorldChange(x, y, z, id, prev));

    this.chunks = new ChunkRenderer(this.world, this.scene);
    this.props = new PropRenderer(this.world, this.scene);
    this.blueprints = new BlueprintManager(this.world, this.scene);
    this.blueprints.onComplete = (id) => {
      SFX.quest();
      this.ui.toast("✅ 設計図が完成した！");
      this.quests.onBlueprintComplete(id);
    };

    // --- entities --------------------------------------------------------------------
    this.player = new Player(this.scene);
    const sp = PLACES.spawn;
    this.player.pos.set(sp.x + 0.5, this.world.terrainSurfaceY(sp.x, sp.z) + 0.1, sp.z + 0.5);
    this.villagers = [];
    this.monsters = new MonsterManager(this.scene);
    this.drops = [];
    this.bgm = BGM; // 回帰テストとデバッグから曲の状態を見えるようにする
    this.checkpoint = null; // 戦いの「開始直前の状態」（敗北・中断ロードで戻る）
    // 第7章の地上防衛（ガーゴイル軍の3波。1波ごとに1回の防衛）。
    this.defense = new DefenseEvent(this.monsters, this.world);
    this.defense.onEnd = (win) => {
      for (const v of this.villagers) {
        v.setDown(false);
        v.hp = v.maxHp;
        v.rig.setTool(null);
      }
      BGM.play("field"); // 勝敗にかかわらず通常曲へ戻す
      if (win) this.dharma.altarHp = Math.max(1, this.defense.bannerHp); // 耐久は次の波へ引き継ぐ
      this.quests.applyHomes(true); // 避難していた住民を持ち場へ戻す
      this.quests.onRaidEnd(win);
    };
    this.bannerEntity = { pos: new THREE.Vector3(), halfW: 0.55, dead: false, isBanner: true };
    // 第7章のヴァルガ戦（初襲来・最終決戦）。
    this.varuga = new VarugaBattle(this);
    this.varuga.onEnd = (kind, win) => {
      for (const v of this.villagers) {
        v.setDown(false);
        v.hp = v.maxHp;
        v.rig.setTool(null);
      }
      BGM.play("field");
      this.daynight.frozen = false;
      this.quests.applyHomes(true);
      this.quests.onVarugaEnd(kind, win);
    };
    this.varuga.onGrounded = () => this.quests.ch7.onVarugaGrounded();

    // --- camera / aim -----------------------------------------------------------------
    this.cameraYaw = Math.atan2(6.5, 8.0);
    this.cameraYawTarget = this.cameraYaw;
    this.camZoom = 1; // occlusion auto-zoom (1 = full orbit radius)
    this.raycaster = new THREE.Raycaster();
    this.highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);
    this.aim = null; // {cell:{x,y,z}, place:{x,y,z}, id}
    this.breakTarget = null;
    this.breakProgress = 0;
    this.swingTick = 0;

    // --- quests / UI hooks --------------------------------------------------------------
    this.quests = new QuestManager(this);
    this.jobs = new JobManager(this);
    this.inventory.onChange(() => {
      this.ui.setHotbar(this.inventory);
      this.player.updateEquipmentBonuses(this.inventory);
    });
    // Redraw icons shown with the fallback before the icon atlas finished loading.
    onItemIconsReady(() => {
      this.ui.setHotbar(this.inventory);
      if (this.ui.menuOpen) this.ui.renderMenu();
    });
    this.ui.hooks = {
      selectHotbar: (i) => {
        this.inventory.selected = i;
        this.ui.setHotbar(this.inventory);
      },
      craft: (recipe) => {
        if (!this.inventory.craft(recipe)) return false;
        this.quests.onCrafted(recipe.out, recipe);
        if (recipe.station === "kamado") this.cooking.onCooked();
        this.ui.toast(`✨ ${ITEMS[recipe.out].name} を作った！`);
        return true;
      },
      swapSlots: (a, b) => {
        const t = this.inventory.slots[a];
        this.inventory.slots[a] = this.inventory.slots[b];
        this.inventory.slots[b] = t;
        this.inventory.emit();
      },
      storeItem: (i) => this.storage.storeItem(i),
      takeStoredItem: (i) => this.storage.takeStoredItem(i),
    };

    this.toastCooldowns = new Map();
    this.autosaveTimer = 30;
    this.started = false;
    this.wasPaused = false; // 前フレームにモーダルUIが開いていたか
    this.graceT = 0; // 会話・メニューを閉じた直後の被弾猶予（秒）
    this.interactions = new InteractionTargets({ THREE, game: this, blockDefs: BLOCK_DEFS, reach: REACH });
    this.clock = new THREE.Clock();

    // Title screen over the live scene.
    this.showTitleScreen();

    this.loopFn = () => this.frame(Math.min(0.05, this.clock.getDelta()));
    this.renderer.setAnimationLoop(this.loopFn);

    // Debug / automation hook.
    this.itemIcons = { report: itemIconReport, icon: itemIcon };
    // 自動テスト用: アイテム・レシピ・設計図の定義（資材が足りない状態からの復帰の確認に使う）。
    this.defs = { ITEMS, RECIPES, BLUEPRINTS, BLOCK_DEFS, itemForBlock };
    window.__game = this;
    console.info(`職をつぐ者 ダーマ再興編 build ${BUILD_ID}`);
  }

  // 自動テスト用: 実時間のループを止める／戻す。止めている間は frame(dt) を直接回して、
  // 戦いの経過を決まった時間で確かめられる。
  setLoopPaused(paused) {
    this.renderer.setAnimationLoop(paused ? null : this.loopFn);
    if (!paused) this.clock.getDelta();
  }

  // --- lifecycle -------------------------------------------------------------------

  showTitleScreen() {
    this.ui.showTitle({
      hasSave: hasSave(),
      onNew: () => this.startNewGame(),
      onContinue: () => this.loadGame(),
    });
  }

  startNewGame() {
    this.pendingRewards = [];
    this.mushrooms.load([]);
    // 固定 New Game 状態（第5章までを踏まえた装備と船荷）。
    for (const [id, n] of NEW_GAME_STATE.items) this.inventory.add(id, n);
    this.daynight.hour = NEW_GAME_STATE.hour;
    // タイトル画面でゆっくり回っていたカメラを既定の向きへ戻し、
    // 開幕の会話が毎回同じ構図で始まるようにする。
    this.cameraYawTarget = Math.atan2(6.5, 8.0);
    this.cameraYaw = this.cameraYawTarget;
    this.rescanWorld();
    this.started = true;
    this.ui.setHp(this.player.hp, this.player.maxHp);
    this.ui.fade(false, 900);
    // タイトルは無音。ここ（ボタン押下という操作の直後）から鳴らし始める
    // ことで、ブラウザの自動再生制限にかからない。
    BGM.play("field");
    this.quests.startIntro();
  }

  loadGame() {
    const data = readSave();
    if (!data) return this.startNewGame();
    // ワールド生成の世代チェック。セーブは生成直後の地形との差分（flat index）
    // なので、生成が変わった後に黙って読むと地形と建物がずれる。不一致は
    // プレイヤーに明示して選んでもらう（セーブ自体は消さない）。
    const savedWorld = data.world ?? { version: 0, size: [WORLD.W, WORLD.D, WORLD.H] };
    if (savedWorld.version !== WORLD.GEN_VERSION) {
      this.ui.dialogue.choice(
        "⚠️ アップデートで島の生成が変わりました。このセーブを読み込むと、地形と建物の位置がずれる可能性があります。",
        ["それでも読み込む", "やめる（タイトルへ）"],
        (i) => {
          if (i === 0) this.applyLoad(data);
          else this.showTitleScreen();
        },
      );
      return;
    }
    this.applyLoad(data);
  }

  applyLoad(data) {
    this.applyData(data);
    this.started = true;
    this.ui.fade(false, 900);
    // 戦闘中はオートセーブしないため、ロード直後は必ず通常曲でよい。
    BGM.play("field");
    this.ui.toast("💾 つづきから はじめます");
  }

  // セーブデータの内容へ、ゲームの状態をそっくり合わせる。
  // 「つづきから」と、敗北時の「開始直前の状態」への復元の両方で使う。
  applyData(data) {
    // 進行中のものを片づける（復元のときだけ意味がある）。
    this.defense.active = false;
    this.defense.targetEntity = null;
    this.varuga.abort();
    this.ballista.dismount();
    this.ballista.clearBolts();
    for (const m of [...this.monsters.monsters]) this.monsters.remove(m);
    for (const drop of this.drops) this.scene.remove(drop.sprite);
    this.drops = [];
    this.blueprints.clear();

    this.world.resetToEdits(data.edits ?? []);
    this.chunks.buildAll();
    this.props.rebuildAll();
    this.inventory.load(data.inventory);
    this.pendingRewards = (data.pendingRewards ?? []).map(([id, n]) => [id, n]);
    this.storage.load(data.storages ?? []);
    this.quests.load(data.stage);
    this.jobs.load(data.jobs);
    this.trees.load(data.trees ?? []);
    this.mushrooms.load(data.mushrooms ?? []);
    this.daynight.hour = data.time?.hour ?? 9;
    this.daynight.day = data.time?.day ?? 1;
    this.daynight.frozen = false;
    this.setBaseLevel(data.baseLevel ?? 0);
    this.player.pos.set(...data.player.pos);
    this.player.vel.set(0, 0, 0);
    this.player.hp = data.player.hp;
    // 住民: セーブにいる人は保存した位置へ。いない人は外す（居場所は、あとで進行から導き直す）。
    const saved = new Map((data.villagers ?? []).map((v) => [v.id, v.pos]));
    for (const v of [...this.villagers]) {
      if (!saved.has(v.id)) this.removeVillager(v.id);
    }
    for (const [id, pos] of saved) {
      const v = this.villager(id) ?? this.spawnVillager(id, pos[0], pos[2], pos[1]);
      v.pos.set(pos[0], pos[1], pos[2]);
      v.vel.set(0, 0, 0);
      v.setDown(false);
      v.hp = v.maxHp;
      v.moveTarget = null;
    }
    this.blueprints.completed = new Set(data.blueprintsDone ?? []);
    this.rescanWorld();
    this.dharma.load(data.dharma);
    // 過去に掘られて乾いたままの穴に水を満たす一回きりの補修。
    this.water.floodAll();
    // 戦いの最中のセーブは準備段階へ戻し、章進行から導出される状態を復元する。
    this.quests.normalizeAfterLoad();
    if (data.blueprint && BLUEPRINTS[data.blueprint.id] && !this.blueprints.active) {
      this.activateBlueprint(data.blueprint.id);
    }
    this.updateQuestMarkers();
    this.ui.setHp(this.player.hp, this.player.maxHp);
    this.ui.setHotbar(this.inventory);
    this.ui.setAim(false);
  }

  // 戦いの「開始直前の状態」を覚える（セーブにも書く）。合図で戦いを始める直前に呼ぶ。
  saveCheckpoint() {
    writeSave(this);
    this.checkpoint = readSave();
  }

  // 敗北: 開始直前の状態へ戻す（建物・資材・装備・矢倉・祭壇の耐久・時刻）。突破済みの波はそのまま。
  async restoreCheckpoint() {
    const data = this.checkpoint ?? readSave();
    if (!data) return;
    this.quests.busy = true;
    await this.ui.fade(true, 700);
    this.applyData(data);
    this.quests.busy = false;
    BGM.play("field");
    await this.ui.fade(false, 700);
    this.ui.toast("🔥 戦いの前の そなえに戻った。もう一度 迎え撃とう");
  }

  // ポーズのセーブ。戦いの最中は「開始直前の状態」を書く（ロードすると準備の段階から始まる）。
  saveNow() {
    if (this.battleActive) {
      if (!this.checkpoint) return false;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.checkpoint));
        this.ui.toast("⚔️ 戦いの最中は、開始直前の状態を保存します");
        return true;
      } catch {
        return false;
      }
    }
    return writeSave(this);
  }

  rescanWorld() {
    this.workbenches.clear();
    this.kamados.clear();
    this.kilns.clear();
    this.forges.clear();
    this.farming.clearIndex();
    this.dharma.clearIndex();
    this.ballista.clearIndex();
    for (let z = 0; z < WORLD.D; z += 1) {
      for (let x = 0; x < WORLD.W; x += 1) {
        for (let y = 0; y < WORLD.H; y += 1) {
          const id = this.world.get(x, y, z);
          if (id === B.AIR) continue;
          const key = cellKey(x, y, z);
          if (id === B.WORKBENCH) this.workbenches.add(key);
          if (id === B.KAMADO) this.kamados.add(key);
          if (id === B.KILN) this.kilns.add(key);
          if (id === B.FORGE) this.forges.add(key);
          if (id === B.BANNER) this.bannerEntity.pos.set(x + 0.5, y, z + 0.5);
          this.farming.indexCell(key, id);
          this.dharma.indexCell(key, id, x, y, z);
          this.ballista.indexCell(id, x, y, z);
        }
      }
    }
  }

  onWorldChange(x, y, z, id, prev) {
    const key = cellKey(x, y, z);
    if (id === B.WORKBENCH) this.workbenches.add(key);
    else if (prev === B.WORKBENCH) this.workbenches.delete(key);
    if (id === B.KAMADO) this.kamados.add(key);
    else if (prev === B.KAMADO) this.kamados.delete(key);
    if (id === B.KILN) this.kilns.add(key);
    else if (prev === B.KILN) this.kilns.delete(key);
    if (id === B.FORGE) this.forges.add(key);
    else if (prev === B.FORGE) this.forges.delete(key);
    if (id === B.BANNER) this.bannerEntity.pos.set(x + 0.5, y, z + 0.5);
    this.farming.onWorldChange(key, id, prev);
    this.storage.onWorldChange(key, id, prev);
    this.water.onWorldChange(x, y, z, id, prev);
    this.mushrooms.onWorldChange(x, y, z, id, prev);
    this.dharma.onWorldChange(x, y, z, id, prev);
    this.ballista.onWorldChange(x, y, z, id, prev);
  }

  // 戦いの最中か（大岩ガニ・3波・ヴァルガ）。オートセーブと建築の手伝いを止める。
  get battleActive() {
    return this.defense.active || this.varuga.active || this.quests.stage === "CH6_CRAB";
  }

  autosave() {
    if (!this.started || this.quests.busy || this.battleActive) return;
    writeSave(this);
  }

  // 持ちもの・預かり・すべての収納箱を合わせた数（物語の品を渡し直すかどうかの判断に使う）。
  ownedCount(id) {
    let n = this.inventory.count(id);
    for (const [rid, rn] of this.pendingRewards) if (rid === id) n += rn;
    for (const chest of this.storage.storages.values()) n += chest.count(id);
    return n;
  }

  // --- quest facade ------------------------------------------------------------------

  onStageChanged() {
    this.updateQuestMarkers();
    this.autosaveTimer = Math.min(this.autosaveTimer, 2);
  }

  setVillagerMarker(id, visible) {
    const v = this.villager(id);
    if (v?.marker) v.marker.visible = visible;
  }

  // ！マーカーは全てここでステージ（＋フラグ）から導出する。個別の場所で
  // 命令的に点けるとセーブ→ロードで消える（ロード時はここしか走らないため）。
  updateQuestMarkers() {
    for (const v of this.villagers) {
      if (v.marker) v.marker.visible = false;
    }
    const f = this.quests.flags;
    const done = this.blueprints.completed;
    switch (this.quests.stage) {
      case "CH6_ARRIVAL":
        if (!f.suzuhaMet) this.setVillagerMarker("suzuha", true);
        break;
      case "CH6_RUINS":
        if (!f.ruinsTalked) this.setVillagerMarker("suzuha", true);
        break;
      case "CH6_VOYAGE":
        this.setVillagerMarker("ganzou", true);
        break;
      case "CH6_ROOF":
        if (!f.pinoMet) this.setVillagerMarker("pino", true);
        break;
      case "CH6_ORDINATION":
        this.setVillagerMarker("asagi", true);
        break;
      case "CH7_ALARM":
        if (f.defenseBuilt) this.setVillagerMarker("gonta", true);
        break;
      case "CH7_PREP2":
      case "CH7_PREP3":
      case "CH7_OMEN":
      case "CH7_FINAL_PREP":
        this.setVillagerMarker("gonta", true);
        break;
      case "CH7_REPAIR":
        if (f.repairDone && done.has("ballista_tower")) this.setVillagerMarker("pino", true);
        break;
      case "CH7_BALLISTA":
        if (!f.markFood) this.setVillagerMarker("mina", true);
        break;
      case "CH7_AFTERMATH":
        if (f.reopenDone) this.setVillagerMarker("pino", true);
        break;
      case "CH7_SUCCESSION":
        if (!f.copyGiven) this.setVillagerMarker("suzuha", true);
        break;
      case "CH7_DEPARTURE":
        this.setVillagerMarker("watari", true);
        break;
      default:
        break;
    }
  }

  // 祭壇の位置（第7章の戦いで住民が集まる・魔物が狙う場所）。
  altarPos() {
    return new THREE.Vector3(PLACES.altar.x + 0.5, FLOOR_Y, PLACES.altar.z + 0.5);
  }

  // 住民の1フレームぶんの行動に渡す文脈（テストからも同じものを使う）。
  villagerContext(time = 0) {
    const crabFight = this.quests.stage === "CH6_CRAB";
    return {
      world: this.world,
      cameraYaw: this.cameraYaw,
      // 第7章の戦いは全員が持ち場へ。大岩ガニ戦は、同行しているゴンタだけが戦う。
      raidActive: this.defense.active || this.varuga.active,
      fightAlong: (v) => crabFight && v.id === "gonta",
      shelterFor: (v) => this.shelterFor(v),
      monsters: this.monsters.monsters.filter((m) => !m.untargetable && !m.dormant),
      bannerPos: this.varuga.active
        ? this.altarPos()
        : crabFight
          ? this.player.pos
          : (this.defense.targetEntity ?? this.bannerEntity).pos,
      farmWork: this.farming.farmland.size > 0 && this.quests.at("CH6_LIVING"),
      mealPos: this.cooking.mealPos(),
      mealSeatFor: (v) => this.mealSeatFor(v),
      workPost: (v) => this.workPost(v),
      time,
      hurtMonster: (m, dmg, from, attack) => this.hurtMonster(m, dmg, from, attack),
      healAlliesNear: (pos, r, n) => this.healAlliesNear(pos, r, n),
      pickFarmCell: () => this.pickFarmCell(),
      boostCropsNear: (pos, r, d) => this.boostCropsNear(pos, r, d),
    };
  }

  // 第7章の戦いのあいだ、戦わない住民が身を寄せる場所。本堂の中でばらけて立つ
  // （全員が祭壇の1点へ集まると重なり、要石へ乗ってしまう）。ミナだけは門の内側で、
  // 近くの仲間を励まして回復する。攻めてくる軍勢は、戦わない住民を狙わない。
  shelterFor(v) {
    const spot = SHELTERS[v.id];
    return spot ? new THREE.Vector3(spot.x + 0.5, spot.y, spot.z + 0.5) : null;
  }

  // 戦いの始まりに、戦わない住民を避難場所へ置く（本堂の中へは歩いて入れないため）。
  placeShelters() {
    for (const v of this.villagers) {
      if (v.def.fighter) continue;
      const spot = SHELTERS[v.id];
      if (!spot) continue;
      v.pos.set(spot.x + 0.5, spot.y + 0.1, spot.z + 0.5);
      v.vel.set(0, 0, 0);
      v.moveTarget = null;
      v.mealSeat = null;
    }
  }

  // 住民の持ち場の仕事（工事場の大工たち・採石洞へ同行するゴンタ・台所のミナ・炉の前のベルク）。
  workPost(v) {
    const crew = this.crew.workPost(v);
    if (crew) return crew;
    if (v.id === "gonta" && this.quests.ch6.escort) {
      // 採石洞では、プレイヤーの少し後ろをついてくる。
      const p = this.player.pos;
      const d = Math.hypot(p.x - v.pos.x, p.z - v.pos.z);
      return d > 2.6 ? { x: p.x, z: p.z, y: p.y } : { x: v.pos.x, z: v.pos.z, y: v.pos.y };
    }
    if (v.id === "mina" && this.kamados.size > 0 && !this.cooking.mealActive && this.quests.at("CH6_FOUNDATION") && this.quests.stage !== "CH7_DEPARTURE") {
      const s = this.cookStandPos();
      if (s) return { x: s.x, z: s.z, swing: true, face: this.kitchenStoveCenter() };
    }
    if (v.id === "belk" && this.forges.size > 0 && this.quests.stage !== "CH7_DEPARTURE") {
      const [x, y, z] = [...this.forges][0].split(",").map(Number);
      return { x: x + 0.5, z: z + 1.5, y, tool: v.weapon, swing: true, face: { x: x + 0.5, z: z + 0.5 } };
    }
    return null;
  }

  // 食事の席: ちゃぶ台のまわりの空いた床（家具の上でないマス）を近い順に、住民1人に1マスずつ。
  mealSeatFor(v) {
    const mp = this.cooking.mealPos();
    if (!mp) return null;
    const key = `${mp.x},${mp.z}`;
    if (this.mealSeating?.key !== key) {
      const y = this.world.terrainSurfaceY(mp.x, mp.z) - 1;
      this.mealSeating = { key, seats: seatsAround(this.world, mp, y, VILLAGER_FOOTING), byId: new Map() };
    }
    const s = this.mealSeating;
    if (!s.byId.has(v.id)) s.byId.set(v.id, s.seats[s.byId.size] ?? null);
    return s.byId.get(v.id);
  }

  spawnVillager(id, x, z, y = null) {
    if (this.villager(id)) return this.villager(id);
    const gy = y ?? this.world.terrainSurfaceY(x, z) + 0.1;
    const v = new Villager(id, x, gy, z);
    // 家具などに体が食い込む位置なら、近くの床のマスの中央へ。
    if (v.collides(this.world, v.pos.x, v.pos.y, v.pos.z)) {
      const s = findStandCell(this.world, v.pos.x, v.pos.z, v.pos.y, VILLAGER_FOOTING);
      if (s) v.pos.set(s.x, s.y + 0.001, s.z);
    }
    this.villagers.push(v);
    this.scene.add(v.root);
    return v;
  }

  villager(id) {
    return this.villagers.find((v) => v.id === id) ?? null;
  }

  // 島を離れた人を外す（船の出航など。海岸とその人が見えない場面で呼ぶ）。
  removeVillager(id) {
    const v = this.villager(id);
    if (!v) return;
    this.scene.remove(v.root);
    this.villagers.splice(this.villagers.indexOf(v), 1);
  }

  // 職業の旗を loc へ立てる（既存の旗は回収）。
  placeBanner(loc) {
    const bp = this.bannerEntity.pos;
    if (bp.lengthSq() > 0) {
      const bx = Math.floor(bp.x);
      const bz = Math.floor(bp.z);
      for (let y = 0; y < WORLD.H; y += 1) {
        if (this.world.get(bx, y, bz) === B.BANNER) this.world.set(bx, y, bz, B.AIR);
      }
    }
    const y = this.world.terrainSurfaceY(loc.x, loc.z);
    this.world.set(loc.x, y, loc.z, B.BANNER);
  }

  giveItems(list) {
    this.pendingRewards.push(...list.map(([id, n]) => [id, n]));
    this.collectPendingRewards();
    if (this.pendingRewards.length) this.ui.toast("📦 受け取りきれない分を預かっています。持ちものに空きを作ると受け取れます");
  }

  collectPendingRewards() {
    let received = false;
    for (const reward of this.pendingRewards) {
      const [id, n] = reward;
      if (!this.inventory.canAdd(id, 1)) continue;
      const before = this.inventory.count(id);
      this.inventory.add(id, n); // add may only accept part of a stack
      const added = this.inventory.count(id) - before;
      reward[1] -= added;
      received ||= added > 0;
    }
    this.pendingRewards = this.pendingRewards.filter(([, n]) => n > 0);
    if (received && this.ui.menuOpen) this.ui.renderMenu();
    return received;
  }

  setBaseLevel(level) {
    this.baseLevel = level;
    this.ui.setBaseLevel(level);
  }

  // 設計図を広げる（マスは絶対座標で書いてあるので、アンカーと基準高さは固定）。
  activateBlueprint(id) {
    return this.blueprints.activate(id, BLUEPRINT_ORIGIN, 0);
  }

  // 設計図 id のうち、まだ合っていないマス。
  missingCells(id) {
    return BLUEPRINTS[id].build()
      .map((c) => ({ x: c.dx, y: c.dy, z: c.dz, block: c.block }))
      .filter((c) => this.world.get(c.x, c.y, c.z) !== c.block);
  }

  missingRepairCells() {
    return this.missingCells("temple_repair");
  }

  // ワタリの船を外す／戻す（出航・帰港。海岸が見えない場面で呼ぶ）。
  setShip(present) {
    for (const c of shipCells()) this.world.set(c.x, c.y, c.z, present ? c.block : B.AIR);
  }

  get shipPresent() {
    const c = shipCells()[0];
    return this.world.get(c.x, c.y, c.z) === c.block;
  }

  // 第7章の地上防衛: index 番目の波（0〜2）を始める。
  startWave(index) {
    this.daynight.forceNight();
    BGM.play("boss");
    this.mealBeforeBattle();
    this.placeShelters();
    this.defense.startWave(WAVES[index], this.dharma.altarHp, this.dharma.altarMax);
    this.ui.toast(`⚠️ ${WAVES[index].label}: 石の翼の群れが 海を越えてくる！`);
  }

  // 第7章のヴァルガ戦（kind: "assault" 初襲来 / "final" 最終決戦）。
  startVaruga(kind) {
    this.daynight.forceNight();
    this.daynight.frozen = true;
    BGM.play("boss");
    this.mealBeforeBattle();
    this.placeShelters();
    this.varuga.start(kind);
    this.ui.toast(kind === "assault" ? "🐉 三頭魔竜ヴァルガが 空から襲いかかる！" : "🐉 ヴァルガが 戻ってきた！ 射台へ急げ！");
  }

  // ミナの炊き出し: かまどがあれば、戦いの始めに全員を回復し、満腹バフを付ける。
  mealBeforeBattle() {
    if (!this.kamados.size || !this.villager("mina")) return;
    this.player.hp = this.player.maxHp;
    for (const v of this.villagers) v.hp = v.maxHp;
    this.cooking.applyFood({ buff: { t: 90, atk: 1, regen: 0.8 } }, "🍲 ミナの炊き出しで 力がわいた！");
  }

  // --- system facade (ctx) -----------------------------------------------------------
  // モンスターAI・住民AI・save.js・テストは game を ctx として受け取り、この
  // ファサード経由で各システムに触れる（実装は src/systems/ 参照）。

  hurtMonster(m, dmg, fromPos, attack = null) {
    this.combat.hurtMonster(m, dmg, fromPos, attack);
  }

  attackEntity(e, dmg, fromPos) {
    this.combat.attackEntity(e, dmg, fromPos);
  }

  healAlliesNear(pos, radius, amount) {
    this.combat.healAlliesNear(pos, radius, amount);
  }

  damageBlock(x, y, z, amount, siege = false) {
    this.combat.damageBlock(x, y, z, amount, siege);
  }

  pickFarmCell() {
    return this.farming.pickFarmCell();
  }

  boostCropsNear(pos, radius, dt) {
    this.farming.boostCropsNear(pos, radius, dt);
  }

  harvestCrop(cx, cy, cz) {
    this.farming.harvestCrop(cx, cy, cz);
  }

  get farmland() {
    return this.farming.farmland;
  }

  get cropGrowth() {
    return this.farming.cropGrowth;
  }

  get storages() {
    return this.storage.storages;
  }

  // 神殿の調理設備のマス: 前庭の共同台所のかまどを優先し、無ければ最初のかまど。まだ無ければ null。
  kitchenStove() {
    let first = null;
    for (const key of this.kamados) {
      const [x, y, z] = key.split(",").map(Number);
      if (Math.hypot(x - PLACES.hut.x, z - PLACES.hut.z) < 8) return { x, y, z };
      first ??= { x, y, z };
    }
    return first;
  }

  kitchenStoveCenter() {
    const s = this.kitchenStove();
    return s ? { x: s.x + 0.5, z: s.z + 0.5 } : null;
  }

  // 食事で囲む場所（かまどの前）。まだ無ければ null。
  kitchenPos() {
    const s = this.kitchenStove();
    return s ? { x: s.x + 0.5, z: s.z + 2.5 } : null;
  }

  // ミナ（かまどの火の番）の持ち場: かまどの南隣の床。まだ無ければ null。
  cookStandPos() {
    const s = this.kitchenStove();
    return s ? { x: s.x + 0.5, z: s.z + 1.5 } : null;
  }

  // 魚のかげは毎朝わき直す（獲った分だけ）。
  respawnFishSpots() {
    for (const spot of FISH_SPOTS) {
      const y = WORLD.WATER_LEVEL + 1;
      if (this.world.get(spot.x, y, spot.z) === B.AIR && this.world.get(spot.x, y - 1, spot.z) === B.WATER) {
        this.world.set(spot.x, y, spot.z, B.FISH_SPOT);
      }
    }
  }

  throttledToast(kind, text) {
    const now = performance.now();
    if ((this.toastCooldowns.get(kind) ?? 0) > now) return;
    this.toastCooldowns.set(kind, now + 4000);
    this.ui.toast(text);
  }

  spawnDrop(item, count, x, y, z) {
    const drop = new ItemDrop(item, count, x, y, z);
    this.drops.push(drop);
    this.scene.add(drop.sprite);
  }

  // --- aiming / primary action ---------------------------------------------------------

  updateAim() {
    this.raycaster.setFromCamera({ x: this.input.mouse.ndcX, y: this.input.mouse.ndcY }, this.camera);
    const origin = this.raycaster.ray.origin;
    const dir = this.raycaster.ray.direction;
    const hit = this.world.raycast(origin, dir, 80);
    this.aim = null;
    if (hit && cellInReach(hit, this.player.pos, REACH)) {
      this.aim = {
        cell: { x: hit.x, y: hit.y, z: hit.z },
        place: { x: hit.x + hit.nx, y: hit.y + hit.ny, z: hit.z + hit.nz },
        id: hit.id,
      };
    }
    const held = this.inventory.held();
    const kind = held ? ITEMS[held.id].kind : null;

    // Blueprint build target: the empty ghost cell directly under the cursor. Any
    // non-tool held item works (auto-snap places the block that cell needs), so
    // building is just "click the glowing outlines". When a tool (hammer) is
    // selected, auto-snap is disabled so left-click always breaks the aimed block.
    this.aimGhost = kind === "tool" ? null : this.pickGhostCell();

    if (this.aimGhost) {
      this.highlight.visible = true;
      const c = this.aimGhost;
      this.highlight.position.set(c.x + 0.5, c.y + 0.5, c.z + 0.5);
      this.highlight.material.color.setHex(0xffe08a);
      return;
    }

    const showHighlight = !!this.aim && (kind === "tool" || kind === "block" || kind === "seed" || !kind);
    this.highlight.visible = showHighlight;
    if (this.aim) {
      const c = kind === "block" ? this.aim.place : this.aim.cell;
      this.highlight.position.set(c.x + 0.5, c.y + 0.5, c.z + 0.5);
      const breaking = this.breakTarget && this.breakProgress > 0;
      this.highlight.material.color.setHex(breaking ? 0xffb347 : kind === "block" ? 0x9fd8ff : 0xffffff);
    }
  }

  // The nearest still-empty blueprint ghost cell under the cursor, within reach.
  pickGhostCell() {
    const bp = this.blueprints.active;
    if (!bp) return null;
    this.raycaster.setFromCamera({ x: this.input.mouse.ndcX, y: this.input.mouse.ndcY }, this.camera);
    return pickBlueprintCell({
      cells: bp.cells, raycaster: this.raycaster, world: this.world,
      blocks: B, playerPos: this.player.pos, reach: REACH,
    });
  }

  // Place the block a ghost cell requires, consumed from anywhere in the inventory.
  // 主人公・魔物がいるマスには置けない。住民が立っているだけなら、材料があるときに
  // 近くへよけてもらってから置く。
  fillGhostCell(cell) {
    if (!cell || !this.world.inBounds(cell.x, cell.y, cell.z)) return;
    const current = this.world.get(cell.x, cell.y, cell.z);
    if (current !== B.AIR && current !== B.WATER) return;
    const blockers = buildCellBlockers(cell, {
      player: this.player,
      villagers: this.villagers,
      monsters: this.monsters.monsters,
      villagersPassThrough: !isSolidFor(cell.block, "villager"),
    });
    if (blockers.hard.length) {
      this.throttledToast("bpoccupied", "人や魔物がいる場所には置けません");
      return;
    }
    const itemId = itemForBlock(cell.block);
    if (!itemId) return;
    if (!this.inventory.has(itemId)) {
      this.throttledToast("bpmat", `📦 ${ITEMS[itemId].name} が足りない`);
      return;
    }
    if (blockers.villagers.length && !clearVillagersFromCell(blockers.villagers, cell, this.stepAsideOptions())) {
      this.throttledToast("bpoccupied", "人や魔物がいる場所には置けません");
      return;
    }
    this.inventory.remove(itemId, 1);
    this.world.set(cell.x, cell.y, cell.z, cell.block);
    SFX.place();
    this.player.faceToward(cell.x + 0.5, cell.z + 0.5);
    this.quests.onBlockPlaced(itemId);
  }

  // ボウガンは、置いたときにプレイヤーが向いていた方角（4方向）へ向ける。
  crossbowBlockForFacing() {
    const f = this.player.facing;
    if (Math.abs(f.x) > Math.abs(f.y)) return f.x > 0 ? B.CROSSBOW_E : B.CROSSBOW_W;
    return f.y > 0 ? B.CROSSBOW_S : B.CROSSBOW_N;
  }

  primaryAction(dt) {
    const held = this.inventory.held();
    const def = held ? ITEMS[held.id] : null;
    const pressed = this.input.buttonPressed(0);
    const down = this.input.buttonDown(0);

    // Blueprint auto-snap: clicking a glowing ghost cell fills it with exactly the
    // block that cell needs, taken from anywhere in the inventory.
    if (this.aimGhost) {
      if (pressed) this.fillGhostCell(this.aimGhost);
      return; // don't also attack / place while targeting a build ghost
    }

    // Weapon swing (and bare-hand slap).
    if (pressed && (!def || def.kind === "weapon" || def.kind === "tool")) {
      const atk = (def?.kind === "weapon" ? def.atk : 1) + this.cooking.atkBonus;
      if (this.player.attackCooldown <= 0) {
        this.player.attackCooldown = 0.42;
        this.player.rig.startAttack();
        SFX.swing();
        if (this.aim) this.player.faceToward(this.aim.cell.x + 0.5, this.aim.cell.z + 0.5);
        // One identity per swing, shared by all targets in this arc.
        const attack = {};
        const f = this.player.facing.clone().normalize();
        for (const m of this.monsters.monsters) {
          if (m.dead || m.untargetable) continue;
          const dx = m.pos.x - this.player.pos.x;
          const dz = m.pos.z - this.player.pos.z;
          const d = Math.hypot(dx, dz);
          const reach = 1.9 + (m.def.boss ? 1.0 : 0); // 大型ボスは届きやすく
          // ドラゴンの頭は高い位置にあるため、高さの許容だけ広げる（跳んで斬り上げる体）。
          const yReach = m.isDragonHead ? 5.0 : 1.6 + (m.def.boss ? 1.0 : 0);
          if (d < reach && Math.abs(m.pos.y - this.player.pos.y) < yReach) {
            const dot = (dx * f.x + dz * f.y) / (d || 1);
            if (dot > 0.25) this.hurtMonster(m, atk, this.player.pos, attack);
          }
        }
      }
    }

    // Hammer: hold to break blocks.
    if (def?.kind === "tool") {
      if (down && this.aim) {
        const { x, y, z } = this.aim.cell;
        const key = cellKey(x, y, z);
        const bdef = BLOCK_DEFS[this.aim.id];
        if (bdef && bdef.hardness !== Infinity) {
          if (bdef.tier > def.tier) {
            this.throttledToast("tier", bdef.tier >= 2 ? "🪨 かたすぎる！ 鉄のハンマーが 必要だ" : "🪨 かたすぎる！ 石のハンマーが 必要だ");
          } else {
            if (this.breakTarget !== key) {
              this.breakTarget = key;
              this.breakProgress = 0;
            }
            this.breakProgress += dt * def.speed;
            this.player.faceToward(x + 0.5, z + 0.5);
            this.swingTick -= dt;
            if (this.swingTick <= 0) {
              this.swingTick = 0.32;
              this.player.rig.startAttack();
              SFX.hitBlock();
            }
            if (this.breakProgress >= bdef.hardness) {
              this.breakBlock(x, y, z, bdef);
              this.breakTarget = null;
              this.breakProgress = 0;
            }
          }
        }
      } else {
        this.breakTarget = null;
        this.breakProgress = 0;
      }
    }

    // Place a block.
    if (pressed && def?.kind === "block" && this.aim) {
      const p = this.aim.place;
      const cur = this.world.get(p.x, p.y, p.z);
      if ((cur === B.AIR || cur === B.WATER) && this.world.inBounds(p.x, p.y, p.z) && !this.placeBlockedByEntity(p)) {
        this.player.faceToward(p.x + 0.5, p.z + 0.5);
        const block = held.id === "crossbow" ? this.crossbowBlockForFacing() : def.block;
        this.world.set(p.x, p.y, p.z, block);
        this.inventory.removeFromSlot(this.inventory.selected, 1);
        SFX.place();
        this.quests.onBlockPlaced(held.id);
      }
    }

    // Plant seeds on farmland.
    if (pressed && def?.kind === "seed" && this.aim) {
      const c = this.aim.cell;
      if (this.aim.id === B.FARMLAND && this.world.get(c.x, c.y + 1, c.z) === B.AIR) {
        this.world.set(c.x, c.y + 1, c.z, B.CROP1);
        this.inventory.removeFromSlot(this.inventory.selected, 1);
        SFX.place();
        this.quests.counters.planted += 1;
      }
    }

    // Eat. バフ付き料理は満タンでも食べられる（満腹バフの掛け直し）。
    if (pressed && def?.kind === "food") {
      if (this.player.hp < this.player.maxHp || def.buff) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.heal);
        this.inventory.removeFromSlot(this.inventory.selected, 1);
        SFX.eat();
        this.ui.toast(`🍽️ ${def.name}を食べた（HP+${def.heal}）`);
        this.cooking.applyFood(def);
      } else {
        this.throttledToast("full", "おなかは すいていない");
      }
    }
  }

  placeBlockedByEntity(p) {
    for (const e of [this.player, ...this.villagers, ...this.monsters.monsters]) {
      if (
        Math.abs(e.pos.x - (p.x + 0.5)) < e.halfW + 0.5 &&
        Math.abs(e.pos.z - (p.z + 0.5)) < e.halfW + 0.5 &&
        e.pos.y < p.y + 1 &&
        e.pos.y + e.height > p.y
      ) {
        return true;
      }
    }
    return false;
  }

  // 設計図のマスからよける住民の行き先の条件: 水の中には行かせず、
  // まだ埋まっていない設計図のマスにはできるだけ掛からない場所を選ぶ。
  stepAsideOptions() {
    const remaining = new Set();
    for (const c of this.blueprints.active?.cells ?? []) {
      if (this.world.get(c.x, c.y, c.z) !== c.block) remaining.add(cellKey(c.x, c.y, c.z));
    }
    return {
      world: this.world,
      reserved: (x, y, z) => remaining.has(cellKey(x, y, z)),
      unsafe: (x, y, z) => this.world.get(x, y, z) === B.WATER,
    };
  }

  breakBlock(x, y, z, bdef) {
    if (!this.world.inBounds(x, y, z)) return; // 世界外の仮想ブロックは壊せない（最終保険）
    const id = this.world.get(x, y, z);
    const key = cellKey(x, y, z);
    const storage = id === B.CHEST ? this.storages.get(key) : null;
    this.world.set(x, y, z, B.AIR);
    SFX.breakBlock();
    // 木を伐ったら根元に再生を予約（数日で自然に育て直す）。
    if (id === B.LOG) this.trees.onLogBroken(x, y, z);
    const cx = x + 0.5, cy = y + 0.4, cz = z + 0.5;
    if (storage) this.storage.dropInventory(storage, cx, cy, cz);
    if (id === B.CROP3) {
      this.harvestCrop(cx, cy, cz);
      return;
    }
    if (bdef.drops) this.spawnDrop(bdef.drops, 1, cx, cy, cz);
    if (bdef.bonusDrops) {
      for (const [item, p] of bdef.bonusDrops) {
        if (Math.random() < p) this.spawnDrop(item, 1, cx, cy, cz);
      }
    }
  }

  // --- interact ---------------------------------------------------------------------

  interact(source = "pointer") {
    this.interactions.update();
    const target = source === "facing" ? this.interactions.facingTarget : this.interactions.pointerTarget;
    if (!target) return;
    if (target.kind === "villager") {
      const v = target.villager;
      v.facePlayer(this.player.pos);
      this.player.faceToward(v.pos.x, v.pos.z);
      if (!this.quests.onTalk(v.id)) this.smallTalk(v);
      return;
    }
    const { x, y, z } = target.cell;
    const def = BLOCK_DEFS[target.id];
    switch (def?.interact) {
      case "craft":
        this.ui.openMenu(this.menuCtx({ bench: true }));
        break;
      case "cook":
        this.ui.openMenu(this.menuCtx({ kamado: true }));
        break;
      case "kiln":
        this.ui.openMenu(this.menuCtx({ kiln: true }));
        break;
      case "forge":
        this.ui.openMenu(this.menuCtx({ forge: true }));
        break;
      case "sleep":
        this.trySleep();
        break;
      case "storage":
        this.storage.open(cellKey(x, y, z));
        break;
      case "harvest":
        this.world.set(x, y, z, B.AIR);
        this.harvestCrop(x + 0.5, y + 0.4, z + 0.5);
        break;
      case "altar":
        if (!this.quests.onInteract("altar", { x, y, z })) {
          this.ui.toast(this.quests.flags.templeReopened ? "🔥 授職の灯。祭壇の写しが、静かに光っている" : "🔥 授職の灯が、静かに燃えている");
        }
        break;
      case "pillar": {
        const n = this.quests.flags.pillarMarks ?? 0;
        this.ui.toast(n ? `🗿 選択の柱。仕事の印が ${n}つ 刻まれている` : "🗿 選択の柱。まだ 印は刻まれていない");
        break;
      }
      case "wedge":
      case "keystone_rock":
        this.quests.onInteract(def.interact, { x, y, z });
        break;
      case "crossbow":
        this.dharma.loadBolts();
        break;
      case "ballista":
        this.ballista.mount();
        break;
      case "banner":
        this.ui.toast(`🚩 拠点レベル${this.baseLevel}　この旗が 神殿の暮らしのしるしだ`);
        break;
      default:
        break;
    }
  }

  smallTalk(v) {
    const pool = SMALL_TALK[v.id] ?? SMALL_TALK_FALLBACK;
    const text = pool[Math.floor(Math.random() * pool.length)];
    this.quests.busy = true;
    this.ui.dialogue.play([{ speaker: v.def.name, text }], () => {
      this.quests.busy = false;
    });
  }

  async trySleep() {
    if (this.battleActive) {
      this.ui.toast("⚔️ 戦いの最中に 眠れるわけがない！");
      return;
    }
    if (!this.daynight.isEvening && !this.daynight.isNight) {
      this.ui.toast("☀️ まだ眠くない。夕方になったら休もう");
      return;
    }
    SFX.sleep();
    await this.ui.fade(true, 700);
    this.daynight.sleep();
    this.player.hp = this.player.maxHp;
    for (const v of this.villagers) v.hp = v.maxHp;
    // A fresh morning: clear ambient monsters.
    for (const m of [...this.monsters.monsters]) {
      if (!m.raid && !m.persist) this.monsters.remove(m);
    }
    this.autosave();
    await this.ui.fade(false, 700);
    this.ui.toast("🌅 朝になった（HP全回復・セーブしました）");
  }

  menuCtx(force = {}) {
    const near = (cells) => {
      for (const key of cells) {
        const [x, y, z] = key.split(",").map(Number);
        if (Math.hypot(x + 0.5 - this.player.pos.x, z + 0.5 - this.player.pos.z) < 3.5 && Math.abs(y - this.player.pos.y) < 3) {
          return true;
        }
      }
      return false;
    };
    return {
      inventory: this.inventory,
      nearBench: force.bench || near(this.workbenches),
      nearKamado: force.kamado || near(this.kamados),
      nearKiln: force.kiln || near(this.kilns),
      nearForge: force.forge || near(this.forges),
      stageIdx: stageIndex(this.quests.stage),
      stageIndexOf: stageIndex,
    };
  }

  jobBookData() {
    return this.jobs.bookData();
  }

  // --- per-frame ---------------------------------------------------------------------

  handleInput(dt) {
    const { input } = this;
    input.enabled = !this.ui.modalOpen && this.started;

    // Global keys that work with menus open.
    if (input.rawPressed("escape")) {
      if (this.ui.menuOpen) this.ui.closeMenu();
      else if (this.ui.storageOpen) this.ui.hideStorage();
      else if (!this.ui.pause.classList.contains("hidden")) this.ui.hidePause();
      else if (this.ballista.mounted) this.ballista.dismount();
      else if (this.started && !this.quests.busy && !this.ui.dialogue.open) this.ui.showPause(() => this.saveNow(), null);
    }
    if (input.rawPressed("e") && this.started && !this.ui.dialogue.open && !this.ballista.mounted) {
      if (this.ui.menuOpen) this.ui.closeMenu();
      else if (!this.ui.modalOpen) this.ui.openMenu(this.menuCtx());
    }
    if (input.rawPressed("b") && this.started && !this.ui.dialogue.open) {
      if (this.ui.bookOverlay.classList.contains("hidden")) this.ui.showJobBook(this.jobBookData());
      else this.ui.hideJobBook();
    }
    if (input.rawPressed("m")) {
      const muted = SFX.toggleMute();
      BGM.setMuted(muted); // 効果音とBGMをまとめてON/OFFする
      this.ui.toast(muted ? "🔇 サウンドOFF" : "🔊 サウンドON");
    }

    const wasEnabled = input.enabled;
    input.enabled = !this.ui.modalOpen && this.started;
    if (!input.enabled || input.enabled !== wasEnabled) {
      input.consumeWheel();
      return;
    }

    // 大型対空ボウガンに乗っている間は、向き・発射・降りるだけ。
    if (this.ballista.mounted) {
      input.consumeWheel();
      this.ballista.handleInput(dt, input);
      return;
    }

    // Camera rotation (8 directions).
    if (input.pressed("q") || input.pressed("[")) this.cameraYawTarget += CAMERA_ROTATE_STEP;
    if (input.pressed("]")) this.cameraYawTarget -= CAMERA_ROTATE_STEP;

    // Hotbar.
    for (let i = 0; i < 8; i += 1) {
      if (input.pressed(String(i + 1))) {
        this.inventory.selected = i;
        this.ui.setHotbar(this.inventory);
      }
    }
    const wheel = input.consumeWheel();
    if (wheel !== 0) {
      this.inventory.selected = (this.inventory.selected + wheel + 8) % 8;
      this.ui.setHotbar(this.inventory);
    }

    if (input.rawButtonPressed(2)) this.interact("pointer");
    else if (input.pressed("f")) this.interact("facing");

    this.primaryAction(dt);
  }

  updateCamera(dt) {
    if (this.ballista.mounted) {
      this.ballista.placeCamera(this.camera);
      return;
    }
    // Shortest-path smooth rotation toward the stepped target yaw.
    let diff = this.cameraYawTarget - this.cameraYaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.cameraYaw += diff * Math.min(1, dt * 10);

    const target = this.player.pos.clone();
    target.y += 0.9;
    const full = target.clone().add(
      new THREE.Vector3(
        Math.sin(this.cameraYaw) * CAMERA_RADIUS,
        CAMERA_HEIGHT,
        Math.cos(this.cameraYaw) * CAMERA_RADIUS,
      ),
    );
    // Occlusion auto-zoom: if terrain blocks the view line, pull the camera in
    // front of the blocker; ease back out when clear.
    // 遮蔽物が近い（坑道や本堂の中など）ときは壁の8割地点まで寄り、カメラを壁の中に残さない。
    const viewDir = full.clone().sub(target);
    const viewLen = viewDir.length();
    viewDir.normalize();
    const hit = this.world.raycast(target, viewDir, viewLen);
    const wantZoom = hit
      ? Math.min(1, Math.max(hit.dist - 0.7, hit.dist * 0.8, 0.45) / viewLen)
      : 1;
    const zoomRate = wantZoom < this.camZoom ? 14 : 2.2; // snap in, ease out
    this.camZoom += (wantZoom - this.camZoom) * Math.min(1, dt * zoomRate);
    const desired = target.clone().addScaledVector(viewDir, viewLen * this.camZoom);
    const alpha = 1 - Math.exp(-CAMERA_FOLLOW_RATE * dt);
    this.camera.position.lerp(desired, alpha);
    this.camera.lookAt(target);
  }

  // プレイヤーが採石洞の中にいるか。
  get playerInCave() {
    const p = this.player.pos;
    return this.started && inCave(p.x, p.y, p.z);
  }

  applySky() {
    const s = this.daynight.sample();
    // 採石洞の中は、空と光を暗くする（たいまつの灯りが効く）。
    const cave = this.playerInCave;
    this.caveMix = (this.caveMix ?? 0) + ((cave ? 1 : 0) - (this.caveMix ?? 0)) * 0.08;
    const k = this.caveMix;
    const sky = new THREE.Color(s.sky).lerp(new THREE.Color(CAVE_SKY), k);
    this.scene.background.copy(sky);
    this.scene.fog.color.copy(sky);
    this.scene.fog.near = 30 - 18 * k;
    this.scene.fog.far = 55 - 27 * k;
    this.hemiLight.intensity = s.hemi * (1 - 0.6 * k);
    this.sunLight.intensity = s.sun * (1 - 0.85 * k);
  }

  frame(dt) {
    const time = performance.now() / 1000;

    if (this.started) {
      if (this.pendingRewards.length && this.collectPendingRewards()) {
        this.ui.toast("📦 預かっていた分を受け取りました");
      }
      this.handleInput(dt);

      // 会話・選択肢・メニュー・収納箱・職業の書・ポーズ・ムービー中は世界を完全停止する。
      const paused = this.ui.modalOpen;
      // 閉じた直後は短い被弾猶予（graceT）を与え、隣まで来ていた敵からの
      // 「開幕タコ殴り」を防ぐ（判定は combat.attackEntity が graceT を見る）。
      if (!paused && this.wasPaused) this.graceT = 1.5;
      this.wasPaused = paused;
      if (!paused) this.simulate(dt, time);
      else this.syncVisualsWhilePaused(dt);
    } else {
      // Title: slow orbit around the island.
      this.cameraYawTarget += dt * 0.05;
    }

    this.applySky();
    this.props.ballistaYaw = this.ballista.yaw;
    this.props.update(dt, this.player.pos, this.daynight.isNight || this.playerInCave);
    this.blueprints.update(time);
    this.chunks.flushDirty();
    this.updateCamera(dt);
    this.interactions.update();
    this.input.endFrame();
    // ムービーは不透明な全画面の iframe で覆うので、その間は3Dを描かない。
    // skipRender は自動テストの早送り用（時間だけ進める。大量の描画がたまると、実時間のループが滞る）。
    if (!this.movies.open && !this.skipRender) this.renderer.render(this.scene, this.camera);
  }

  // 世界停止中（会話・メニュー）の見た目だけの同期。
  syncVisualsWhilePaused(dt) {
    this.player.root.position.copy(this.player.pos);
    this.player.rig.group.rotation.y = this.cameraYaw;
    this.player.rig.faceWorld(this.player.facing.x, this.player.facing.y, this.cameraYaw);
    this.player.rig.update(dt, false);
    for (const v of this.villagers) v.syncVisual(dt, this.cameraYaw, this.world);
    for (const m of this.monsters.monsters) m.syncVisual(dt, this.cameraYaw, this.world);
  }

  // 1フレームぶんのシミュレーション。モーダルUIが開いている間は frame() から
  // 呼ばれない（＝ゲーム内の時間・戦闘・AIが完全に止まる）。
  simulate(dt, time) {
    this.graceT = Math.max(0, this.graceT - dt);

    // Player movement（大型対空ボウガンに乗っている間は、その場に立つ）。
    let move = null;
    const mounted = this.ballista.mounted;
    if (this.input.enabled && !mounted) {
      const x = (this.input.down("d") || this.input.down("arrowright") ? 1 : 0) - (this.input.down("a") || this.input.down("arrowleft") ? 1 : 0);
      const z = (this.input.down("s") || this.input.down("arrowdown") ? 1 : 0) - (this.input.down("w") || this.input.down("arrowup") ? 1 : 0);
      if (x !== 0 || z !== 0) move = { x, z };
    }
    const wantJump = this.input.down(" ") && !mounted;
    this.player.update(dt, this.world, move, this.cameraYaw, wantJump);

    // Show the held hammer / weapon in the hero's hand (other items = bare hands).
    const heldSlot = this.inventory.held();
    const heldDef = heldSlot ? ITEMS[heldSlot.id] : null;
    this.player.rig.setTool(
      heldDef && (heldDef.kind === "tool" || heldDef.kind === "weapon") ? (heldDef.model ?? heldSlot.id) : null,
    );

    if (mounted) {
      this.aim = null;
      this.aimGhost = null;
      this.highlight.visible = false;
    } else {
      this.updateAim();
    }
    this.daynight.update(dt);
    if (this.daynight.day !== this.lastFishDay) {
      this.lastFishDay = this.daynight.day;
      this.respawnFishSpots();
    }
    this.farming.update(dt);
    this.trees.update(dt);
    this.mushrooms.update(dt);
    this.cooking.update(dt);
    this.water.update();
    this.crew.update(dt);
    this.dharma.update(dt);
    this.ballista.update(dt);
    this.varuga.update(dt);

    // Monsters.
    const mctx = {
      world: this.world,
      player: this.player,
      villagers: this.villagers,
      bannerEntity: this.defense.targetEntity ?? this.bannerEntity,
      bannerPos: (this.defense.targetEntity ?? this.bannerEntity).pos,
      cameraYaw: this.cameraYaw,
      isNight: this.daynight.isNight,
      time,
      route: RAID_ROUTE,
      onRaiderLost: (m) => this.defense.relaunch(m),
      // 第7章の戦いの間と結末の前後は、山道の通常の敵を出さない。
      surfaceSpawns: !this.battleActive && !this.quests.busy,
      pickAmbient: (zone) => pickAmbientType(zone, this.daynight.isNight),
      attackEntity: (e, dmg, from) => this.attackEntity(e, dmg, from),
      hurtMonster: (m, dmg, from, attack) => this.hurtMonster(m, dmg, from, attack),
      damageBlock: (x, y, z, n, siege) => this.damageBlock(x, y, z, n, siege),
      onSpike: (x, y, z) => this.dharma.onSpike(x, y, z),
      onSlam: () => SFX.breakBlock(),
      onSmash: () => SFX.breakBlock(),
      onBossTelegraph: () => this.throttledToast("slam", "🦀 爪を振り上げた！ 離れろ！"),
    };
    if (!this.defense.active && !this.varuga.active) this.monsters.updateAmbient(dt, mctx);
    this.monsters.update(dt, mctx);
    this.defense.update(dt, this.ui);

    // Villagers.
    const vctx = this.villagerContext(time);
    for (const v of this.villagers) v.update(dt, vctx);
    this.keepEscortNear();

    // Drops.
    for (const drop of [...this.drops]) {
      drop.update(dt, this.world, this.player.pos);
      if (drop.collected) {
        if (!this.inventory.canAdd(drop.itemId, drop.count)) {
          drop.collected = false;
          continue;
        }
        if (!this.inventory.add(drop.itemId, drop.count)) {
          drop.collected = false;
          continue;
        }
        SFX.pickup();
        this.scene.remove(drop.sprite);
        this.drops.splice(this.drops.indexOf(drop), 1);
      }
    }

    this.quests.update();

    // Underwater tint: on when the player's head is below the water surface.
    let submerged = false;
    if (this.player.inWater) {
      const surf = this.world.waterSurfaceY(this.player.pos.x, this.player.pos.z);
      if (surf != null && this.player.pos.y + 1.0 < surf - 0.05) submerged = true;
    }
    this.ui.setUnderwater(submerged);

    // HUD.
    this.ui.setHp(this.player.hp, this.player.maxHp);
    this.ui.setClock(this.daynight.clockText());
    if (this.varuga.active) {
      this.ui.setRaid(false);
      this.ui.setBossBars(this.varuga.hudBars());
    } else if (this.defense.active) {
      this.ui.setBossBars(null);
      this.ui.setRaid(true, this.defense.bannerHp, this.defense.bannerMaxHp, undefined, undefined, this.defense.cfg.label);
    } else if (this.quests.stage === "CH6_CRAB" && this.quests.ch6.crab && !this.quests.ch6.crab.dead) {
      const crab = this.quests.ch6.crab;
      this.ui.setRaid(false);
      this.ui.setBossBars([{ label: "🦀 大岩ガニ", hp: Math.max(0, crab.hp), max: crab.maxHp }]);
    } else {
      this.ui.setRaid(false);
      this.ui.setBossBars(null);
    }
    this.ui.setSupply(this.quests.isCh7() && !this.quests.at("CH7_AFTERMATH") ? { bolts: this.dharma.bolts, altarHp: this.dharma.altarHp, altarMax: this.dharma.altarMax } : null);
    const bp = this.blueprints.active;
    if (bp) {
      const remaining = this.blueprints.remainingMaterials();
      const total = bp.cells.length;
      const done = bp.cells.filter((c) => !c.ghost.visible).length;
      const crew = CREW_BLUEPRINTS.has(bp.id) && this.crew.members().length > 0;
      this.ui.setBlueprint(bp.name, remaining, done, total, crew ? "🔨 資材置き場の箱の資材は、大工たちが組む" : null);
    } else {
      this.ui.setBlueprint(null);
    }

    // Autosave.
    this.autosaveTimer -= dt;
    if (this.autosaveTimer <= 0) {
      this.autosaveTimer = 30;
      this.autosave();
    }
  }

  // 採石洞へ同行するゴンタが、段差や裂け目で離されたら、プレイヤーのそばへ呼び寄せる。
  keepEscortNear() {
    if (!this.quests.ch6.escort) return;
    const v = this.villager("gonta");
    if (!v || v.down) return;
    const p = this.player.pos;
    const far = Math.hypot(p.x - v.pos.x, p.z - v.pos.z) > 9 || Math.abs(p.y - v.pos.y) > 3.5;
    const playerInside = inCave(p.x, p.y, p.z);
    const escortInside = inCave(v.pos.x, v.pos.y, v.pos.z);
    if (!playerInside && !escortInside) return; // 外では歩いてついてくる
    this.escortFarT = far || playerInside !== escortInside ? (this.escortFarT ?? 0) + 1 / 60 : 0;
    if (this.escortFarT > 2.5 && this.player.onGround) {
      this.escortFarT = 0;
      const s = findStandCell(this.world, p.x - this.player.facing.x * 1.2, p.z - this.player.facing.y * 1.2, p.y, VILLAGER_FOOTING, 3);
      if (s) {
        v.pos.set(s.x, s.y + 0.05, s.z);
        v.vel.set(0, 0, 0);
        v.moveTarget = null;
      }
    }
  }
}

new Game();
