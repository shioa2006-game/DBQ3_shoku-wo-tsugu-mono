import * as THREE from "three";
import { cellInReach, pickBlueprintCell } from "../../game-shared/blueprint-target.mjs";
import { buildCellBlockers, clearVillagersFromCell } from "../../game-shared/build-clearance.mjs";
import { StoryMovies } from "../../game-shared/story-movies.mjs";
import { Input } from "./core/input.js";
import { cellKey } from "./core/utils.js";
import { B, BLOCK_DEFS, isSolidFor } from "./world/blocks.js";
import { VoxelWorld, WORLD, PLACES, FISH_SPOTS } from "./world/world.js";
import { ChunkRenderer } from "./world/mesher.js";
import { PropRenderer } from "./world/props.js";
import { ITEMS, Inventory, itemForBlock, onItemIconsReady, itemIconReport, itemIcon } from "./game/items.js";
import { QuestManager, stageIndex } from "./game/quests.js";
import { paddyDefenseConfig } from "./game/quests2.js";
import { krakenDefenseConfig } from "./game/quests3.js";
import { JobManager } from "./game/jobs.js";
import { FarmingSystem } from "./systems/farming.js";
import { TreeSystem } from "./systems/trees.js";
import { MushroomSystem } from "./systems/mushrooms.js";
import { StorageSystem } from "./systems/storage.js";
import { CookingSystem } from "./systems/cooking.js";
import { CombatSystem } from "./systems/combat.js";
import { WaterSystem } from "./systems/water.js";
import { SMALL_TALK, SMALL_TALK_FALLBACK, SMALL_TALK_FAREWELL } from "./content/smalltalk.js";
import { DayNight } from "./game/daynight.js";
import { BlueprintManager } from "./game/blueprints.js";
import { DefenseEvent } from "./game/defense.js";
import { SFX } from "./game/sfx.js";
import { BGM } from "./game/bgm.js";
import { hasSave, writeSave, readSave } from "./game/save.js";
import { Player } from "./entities/player.js";
import { Villager, VILLAGER_FOOTING } from "./entities/villagers.js";
import { findStandCell, seatsAround } from "../../game-shared/villager-footing.mjs";
import { MonsterManager } from "./entities/monsters.js";
import { ItemDrop } from "./entities/entity.js";
import { UI, BUILD_ID } from "./ui/ui.js";
import { MOVIES } from "./content/movies.js";

const CAMERA_HEIGHT = 8.2;
const CAMERA_RADIUS = 11.5;
const CAMERA_ROTATE_STEP = Math.PI / 4;
const CAMERA_FOLLOW_RATE = 7.7;
const REACH = 5.6;

class Game {
  constructor() {
    // --- renderer / scene ---------------------------------------------------------
    this.app = document.querySelector("#app");
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fb5c9);
    this.scene.fog = new THREE.Fog(0x8fb5c9, 30, 55);
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

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x63724f, 2.4);
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
    // each system from onWorldChange (see the delegate getters/methods below —
    // entities and quests reach these through the game "ctx" facade).
    this.workbenches = new Set();
    this.kamados = new Set();
    this.farming = new FarmingSystem(this);
    this.trees = new TreeSystem(this);
    this.mushrooms = new MushroomSystem(this);
    this.storage = new StorageSystem(this);
    this.combat = new CombatSystem(this);
    this.cooking = new CookingSystem(this);
    this.water = new WaterSystem(this);
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
    this.defense = new DefenseEvent(this.monsters, this.world);
    this.defense.onEnd = (win) => {
      for (const v of this.villagers) {
        if (!v.stayDown) { // ストーリーで倒れたままのNPCは戦闘終了でも起こさない
          v.setDown(false);
          v.hp = v.maxHp;
        }
        v.rig.setTool(null);
      }
      BGM.play("field"); // 勝敗にかかわらず通常曲へ戻す
      this.quests.onRaidEnd(win);
      if (win) this.autosave();
    };
    this.bannerEntity = { pos: new THREE.Vector3(), halfW: 0.55, dead: false, isBanner: true };

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
        this.quests.onCrafted(recipe.out);
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
    this.clock = new THREE.Clock();

    // Title screen over the live scene.
    this.showTitleScreen();

    this.renderer.setAnimationLoop(() => this.frame(Math.min(0.05, this.clock.getDelta())));

    // Debug / automation hook.
    this.itemIcons = { report: itemIconReport, icon: itemIcon };
    window.__game = this;
    console.info(`職をつぐ者 build ${BUILD_ID}`);
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
    this.inventory.add("hammer_wood", 1);
    this.inventory.add("herb", 2);
    // タイトル画面でゆっくり回っていたカメラを既定の向きへ戻し、
    // 開幕の会話が毎回同じ構図で始まるようにする。
    this.cameraYawTarget = Math.atan2(6.5, 8.0);
    this.cameraYaw = this.cameraYawTarget;
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
    // 例外＝非破壊移行: 旧版から W/H が同じで D だけ増えた場合、flat index
    // (z*W+x)*H+y は既存セルで並びが変わらず、旧マップ(z<旧D)の生成も
    // 据え置いているため、無警告でそのまま読み込める（v1→v2 の南拡張）。
    const savedWorld = data.world ?? { version: 1, size: [64, 64, 24] };
    const savedSize = savedWorld.size ?? [64, 64, 24];
    const nonDestructive =
      savedWorld.version < WORLD.GEN_VERSION &&
      savedSize[0] === WORLD.W &&
      savedSize[2] === WORLD.H &&
      savedSize[1] <= WORLD.D;
    if (savedWorld.version !== WORLD.GEN_VERSION && !nonDestructive) {
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
    this.world.applyEdits(data.edits ?? []);
    this.chunks.buildAll();
    this.props.rebuildAll();
    this.inventory.load(data.inventory);
    this.pendingRewards = (data.pendingRewards ?? []).map(([id, n]) => [id, n]);
    this.storage.load(data.storages ?? []);
    this.quests.load(data.stage);
    this.jobs.load(data.jobs, this.quests.stage);
    this.trees.load(data.trees ?? []);
    this.mushrooms.load(data.mushrooms ?? []);
    this.daynight.hour = data.time?.hour ?? 8;
    this.daynight.day = data.time?.day ?? 1;
    this.setBaseLevel(data.baseLevel ?? 0);
    this.player.pos.set(...data.player.pos);
    this.player.hp = data.player.hp;
    for (const v of data.villagers ?? []) {
      this.spawnVillager(v.id, v.pos[0], v.pos[2], v.pos[1]);
    }
    for (const done of data.blueprintsDone ?? []) this.blueprints.completed.add(done);
    if (data.blueprint) {
      const anchors = {
        hut: PLACES.hut,
        farm: PLACES.farm,
        shrine: PLACES.shrine,
        bridge: PLACES.bridge,
        paddy: PLACES.waterway,
        kitchen: PLACES.kitchen,
        // 第3章。ここに無い設計図IDを建造中にセーブすると、ロード時に
        // anchor が undefined になり復元が壊れる（潜在バグだった）。
        pier: PLACES.pier,
        lighthouse: PLACES.lighthouse,
        ship_hull: PLACES.ship,
        ship_mast: PLACES.ship,
        ship_sail: PLACES.ship,
      };
      const anchor = anchors[data.blueprint.id];
      const anchorOff = data.blueprint.id === "shrine" ? 2 : 1;
      // Prefer the exact baseY recorded in the save; fall back to the pristine
      // (as-generated) ground for saves written before baseY was persisted.
      // Never derive it from current terrain — a partially built structure would
      // raise its own blueprint.
      this.blueprints.activate(
        data.blueprint.id,
        anchor,
        data.blueprint.baseY ?? this.world.pristineSurfaceY(anchor.x + 2, anchor.z + anchorOff),
      );
    }
    this.rescanWorld();
    // 過去に掘られて乾いたままの穴（旧版のセーブ）に水を満たす一回きりの補修。
    this.water.floodAll();
    // Restore stage-dependent markers and reset active defense stages to their prep state.
    if (this.quests.stage === "DEFENSE") this.quests.setStage("PREPARE", true);
    if (this.quests.stage === "PADDY_DEFENSE") this.quests.setStage("PADDY_PREP", true);
    if (this.quests.stage === "CH3_DEFENSE") {
      this.quests.setStage(this.quests.flags.ch3RaidWon ? "CH3_FAREWELL" : "CH3_RITE", true);
    }
    this.updateQuestMarkers();
    // 旧セーブ(第2章実装前)が POSTGAME のまま読み込まれた場合も「翌朝」に
    // 第2章が始まるように、社に祈った日を過去日として補完する。
    if (this.quests.stage === "POSTGAME" && this.quests.flags.postgameDay == null) {
      this.quests.flags.postgameDay = this.daynight.day - 1;
    }
    this.started = true;
    this.ui.setHp(this.player.hp, this.player.maxHp);
    this.ui.setHotbar(this.inventory);
    this.ui.fade(false, 900);
    // 手動保存された戦闘中の状態も上で準備／勝利後へ正規化する。
    BGM.play("field");
    this.ui.toast("💾 つづきから はじめます");
  }

  rescanWorld() {
    this.workbenches.clear();
    this.kamados.clear();
    this.farming.clearIndex();
    for (let z = 0; z < WORLD.D; z += 1) {
      for (let x = 0; x < WORLD.W; x += 1) {
        for (let y = 0; y < WORLD.H; y += 1) {
          const id = this.world.get(x, y, z);
          if (id === B.AIR) continue;
          const key = cellKey(x, y, z);
          if (id === B.WORKBENCH) this.workbenches.add(key);
          if (id === B.KAMADO) this.kamados.add(key);
          if (id === B.BANNER) this.bannerEntity.pos.set(x + 0.5, y, z + 0.5);
          this.farming.indexCell(key, id);
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
    if (id === B.BANNER) this.bannerEntity.pos.set(x + 0.5, y, z + 0.5);
    this.farming.onWorldChange(key, id, prev);
    this.mushrooms.onWorldChange(x, y, z, id, prev);
    this.storage.onWorldChange(key, id, prev);
    this.water.onWorldChange(x, y, z, id, prev);
  }

  autosave() {
    if (!this.started || this.quests.stage === "INTRO" || this.defense.active) return;
    writeSave(this);
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
    switch (this.quests.stage) {
      case "MEET_MINA":
        this.setVillagerMarker("mina", true);
        break;
      case "PREPARE":
      case "PADDY_PREP":
        this.setVillagerMarker("gonta", true);
        break;
      case "CH2_INTRO": // 第2章の開幕: ジンベエに話しかける
        this.setVillagerMarker("jinbei", true);
        break;
      case "REACH_VILLAGE": // 橋を渡り、村のイナホに話しかける
        this.setVillagerMarker("inaho", true);
        break;
      case "CH3_INTRO": // 第3章の開幕: 浜に倒れたワタリに話しかける
        this.setVillagerMarker("watari", true);
        break;
      case "CH3_RITE": // 授職の儀（ジンベエ）→ 済んだら船出（ワタリ）
        this.setVillagerMarker(this.quests.flags.riteDone ? "watari" : "jinbei", true);
        break;
      case "CH3_FAREWELL": // 勝利後: 船上のワタリに旅立ちを告げる
        this.setVillagerMarker("watari", true);
        break;
      default:
        break;
    }
    // 第3章の結び: 乗船・見送り（CH3_FAREWELL）と後日談（CH3_DONE）の持ち場を
    // ステージから導出する。home はセーブされないため、ロード後もここで再現される。
    // 旅立つ組は桟橋→乗船口を自分の足で歩いて船に乗る（routeViaDock）。
    const farewellHomes = {
      CH3_FAREWELL: {
        watari: [35.5, 60.5], // 船尾楼・舵輪のそば
        mina: [37.5, 62.5], // 甲板
        gonta: [34.5, 62.5], // 甲板
        jinbei: [39.5, 50.5], // 桟橋の付け根の浜（見送り）
        inaho: [41.5, 50.5],
        pino: [37.5, 50.5],
      },
      // 後日談: ワタリは船で待ち（話すと出航を再演）、他は日常の持ち場へ戻る。
      CH3_DONE: {
        watari: [35.5, 60.5],
        mina: [36.5, 48.5], // 畑
        gonta: [35.5, 41.5], // 拠点の北
        jinbei: [33.5, 47.5], // 拠点
        inaho: [38.5, 84.5], // 南の村（食堂）
        pino: [29.5, 46.5], // 拠点の西
      },
    }[this.quests.stage];
    if (farewellHomes) {
      for (const [id, [hx, hz]] of Object.entries(farewellHomes)) {
        const v = this.villager(id);
        if (!v) continue;
        v.home.set(hx, this.world.terrainSurfaceY(hx, hz) + 0.1, hz);
        v.moveTarget = null;
      }
    }
    // 第3章開幕、浜のワタリは嵐で打ち上げられ倒れている。話しかけて会話が終わり
    // CH3_DOCK へ進むと起き上がる。ステージから導出することで、CH3_INTRO 中に
    // セーブ→ロードしても倒れ姿勢が復元される（住民セーブは id/pos のみ）。
    const watari = this.villager("watari");
    if (watari) {
      const collapsed = this.quests.stage === "CH3_INTRO";
      watari.stayDown = collapsed;
      watari.setDown(collapsed);
    }
  }

  // 住民の1フレームぶんの行動に渡す文脈（テストからも同じものを使う）。
  villagerContext(time = 0) {
    return {
      world: this.world,
      completedBlueprints: this.blueprints.completed,
      cameraYaw: this.cameraYaw,
      raidActive: this.defense.active,
      monsters: this.monsters.monsters,
      bannerPos: (this.defense.targetEntity ?? this.bannerEntity).pos,
      rallyPos: this.defense.rallyPos, // 水上防衛（クラーケン戦）の集合位置
      // 出航前の別れ（CH3_FAREWELL）は、食事・かまど・畑仕事の日常行動を止め、
      // 全員が乗船・見送りの持ち場（home）へ向かう。
      farmWork: this.blueprints.completed.has("farm") && this.quests.stage !== "CH3_FAREWELL",
      mealPos: this.quests.stage === "CH3_FAREWELL" ? null : this.cooking.mealPos(),
      mealSeatFor: (v) => this.mealSeatFor(v),
      kitchenPos: this.quests.stage === "CH3_FAREWELL" ? null : this.kitchenPos(),
      time,
      hurtMonster: (m, dmg, from, attack) => this.hurtMonster(m, dmg, from, attack),
      healAlliesNear: (pos, r, n) => this.healAlliesNear(pos, r, n),
      pickFarmCell: () => this.pickFarmCell(),
      boostCropsNear: (pos, r, d) => this.boostCropsNear(pos, r, d),
    };
  }

  // 食事の席: ちゃぶ台のまわりの空いた床（家具の上でないマス）を近い順に、住民1人に1マスずつ。
  // 以前はちゃぶ台を中心にした円の上に置いていて、北側の席がかまどのマスの中に入っていた。
  mealSeatFor(v) {
    const mp = this.cooking.mealPos();
    if (!mp) return null;
    const key = `${mp.x},${mp.z}`;
    if (this.mealSeating?.key !== key) {
      const y = this.world.terrainSurfaceY(mp.x, mp.z) - 1; // ちゃぶ台のマス＝住民が床に立つ高さ
      this.mealSeating = { key, seats: seatsAround(this.world, mp, y, VILLAGER_FOOTING), byId: new Map() };
    }
    const s = this.mealSeating;
    if (!s.byId.has(v.id)) s.byId.set(v.id, s.seats[s.byId.size] ?? null);
    return s.byId.get(v.id);
  }

  spawnVillager(id, x, z, y = null) {
    if (this.villager(id)) return this.villager(id);
    const gy = y ?? this.world.terrainSurfaceY(x, z) + 0.1;
    const v = new Villager(id, x + 0.001, gy, z + 0.001);
    // 家具などに体が食い込む位置なら、近くの床のマスの中央へ（食い込んだまま家具の上へ押し出されないように）。
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

  placeBanner() {
    const { x, z } = PLACES.banner;
    const y = this.world.terrainSurfaceY(x, z);
    this.world.set(x, y, z, B.BANNER);
  }

  giveItems(list) {
    this.pendingRewards.push(...list.map(([id, n]) => [id, n]));
    this.collectPendingRewards();
    if (this.pendingRewards.length) this.ui.toast("📦 報酬を預かっています。持ちものに空きを作ると受け取れます");
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

  startDefense(kind = "banner") {
    this.daynight.forceNight();
    BGM.play("boss"); // 防衛戦のあいだはボス曲（ザコの波も含め、終了まで）
    if (kind === "paddy") {
      this.defense.start(paddyDefenseConfig());
      this.ui.toast("⚠️ 魔物の群れが 田んぼにせまっている！");
    } else if (kind === "kraken") {
      this.defense.start(krakenDefenseConfig());
      this.ui.toast("🌊 海が黒く泡立つ……クラーケンが 船を狙っている！");
    } else {
      this.defense.start();
      this.ui.toast("⚠️ 魔物の大群が 拠点にせまっている！");
    }
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

  damageBlock(x, y, z, amount) {
    this.combat.damageBlock(x, y, z, amount);
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

  // 南の島へ渡れるか（第2章で橋の設計図が完成すると true。セーブに永続化）。
  get southOpen() {
    return !!this.quests.flags.southOpen;
  }

  // イナホの持ち場: 最初のかまどの東隣の床。まだ無ければ null。
  // かまどの前（南）は食堂の設計図ではちゃぶ台のマスで、そこに立つと建築中に
  // ちゃぶ台を置けず、完成後はちゃぶ台の上に乗ってしまう。
  kitchenPos() {
    for (const key of this.kamados) {
      const [x, , z] = key.split(",").map(Number);
      return { x: x + 1.5, z: z + 0.5 };
    }
    return null;
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
    // selected, auto-snap is disabled so left-click always breaks the aimed block
    // — you can chop a tree that sits inside/behind the blueprint instead of the
    // fill taking priority.
    this.aimGhost = kind === "tool" ? null : this.pickGhostCell();

    if (this.aimGhost) {
      // Highlight the ghost we'd fill, in a build colour.
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
  // Returns the cell {x,y,z,block} or null. Obstacle cells (occupied by a wrong
  // block, e.g. a tree) are skipped here — they must be cleared with the hammer.
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
  // 近くへよけてもらってから置く（住民は設計図を知らずに歩き回り、持ち場で立ち止まる）。
  // 住民が通り抜けられるブロック（たいまつ・ベッドなど）は、住民がいてもそのまま置く。
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

  primaryAction(dt) {
    const held = this.inventory.held();
    const def = held ? ITEMS[held.id] : null;
    const pressed = this.input.buttonPressed(0);
    const down = this.input.buttonDown(0);

    // Blueprint auto-snap: clicking a glowing ghost cell fills it with exactly the
    // block that cell needs, taken from anywhere in the inventory. No need to
    // select the right item or aim precisely — just click the outlines.
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
        const attack = {}; // One identity per swing, shared across its target checks.
        // Arc hit check.
        const f = this.player.facing.clone().normalize();
        for (const m of this.monsters.monsters) {
          if (m.dead) continue;
          const dx = m.pos.x - this.player.pos.x;
          const dz = m.pos.z - this.player.pos.z;
          const d = Math.hypot(dx, dz);
          const reach = 1.9 + (m.def.boss || m.def.tentacle ? 1.0 : 0); // 大型ボスと触手は届きやすく
          if (d < reach && Math.abs(m.pos.y - this.player.pos.y) < 1.6) {
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
            this.throttledToast("tier", "🪨 かたすぎる！ 石のハンマーが 必要だ");
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
      // 見えない壁: southOpen まで海峡より南には手動でブロックを置けない
      //（水上に足場を積んで渡る抜け道の封じ。設計図のオートスナップは対象外）。
      if (!this.southOpen && p.z > WORLD.GATE_Z) {
        this.throttledToast("gate", "📖「その先に 手を出すのは まだ早い」");
        return;
      }
      const cur = this.world.get(p.x, p.y, p.z);
      if ((cur === B.AIR || cur === B.WATER) && this.world.inBounds(p.x, p.y, p.z) && !this.placeBlockedByEntity(p)) {
        this.world.set(p.x, p.y, p.z, def.block);
        this.inventory.removeFromSlot(this.inventory.selected, 1);
        SFX.place();
        this.player.faceToward(p.x + 0.5, p.z + 0.5);
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

  // 設計図のマスからよける住民の行き先の条件: 水の中には入れず、
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
    if (id === B.CROP1 || id === B.CROP2) {
      this.spawnDrop("seed", 1, cx, cy, cz);
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

  interact() {
    // Villagers first.
    let nearest = null;
    let nearestD = 2.6;
    for (const v of this.villagers) {
      const d = v.pos.distanceTo(this.player.pos);
      if (d < nearestD) {
        nearestD = d;
        nearest = v;
      }
    }
    if (nearest) {
      nearest.facePlayer(this.player.pos);
      this.player.faceToward(nearest.pos.x, nearest.pos.z);
      if (!this.quests.onTalk(nearest.id)) this.smallTalk(nearest);
      return;
    }
    // Props under the cursor.
    if (!this.aim) return;
    const { x, y, z } = this.aim.cell;
    const def = BLOCK_DEFS[this.aim.id];
    switch (def?.interact) {
      case "craft":
        this.ui.openMenu(this.menuCtx({ bench: true }));
        break;
      case "cook":
        this.ui.openMenu(this.menuCtx({ kamado: true }));
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
        if (!this.quests.onAltarPrayed()) this.ui.toast("🙏 しずかな気配がする……");
        break;
      case "banner":
        this.ui.toast(`🚩 拠点レベル${this.baseLevel}　この旗が 町のしるしだ`);
        break;
      default:
        break;
    }
  }

  smallTalk(v) {
    // 出航前（CH3_FAREWELL）は別れの言葉に差し替える。
    const farewell = this.quests.stage === "CH3_FAREWELL" ? SMALL_TALK_FAREWELL[v.id] : null;
    const pool = farewell ?? SMALL_TALK[v.id] ?? SMALL_TALK_FALLBACK;
    const text = pool[Math.floor(Math.random() * pool.length)];
    this.quests.busy = true;
    this.ui.dialogue.play([{ speaker: v.def.name, text }], () => {
      this.quests.busy = false;
    });
  }

  async trySleep() {
    if (this.defense.active) {
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
      if (!m.raid) this.monsters.remove(m);
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
      else if (this.started && !this.ui.dialogue.open) this.ui.showPause(() => writeSave(this), null);
    }
    if (input.rawPressed("e") && this.started && !this.ui.dialogue.open) {
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

    if (input.pressed("f") || input.rawButtonPressed(2)) this.interact();

    this.primaryAction(dt);
  }

  updateCamera(dt) {
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
    // Occlusion auto-zoom: if terrain (e.g. tree canopy) blocks the view line,
    // pull the camera in front of the blocker; ease back out when clear.
    // 遮蔽物が近い（掘った穴の中など）ときは壁の8割地点まで寄り、カメラを
    // 壁の中に残さない。穴の中でもキャラクターが大写しで見え続け、黒幕や
    // 地中の虚空を見せずに済む（最低距離0.45で頭の中までは寄らない）。
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

  applySky() {
    const s = this.daynight.sample();
    this.scene.background.setHex(s.sky);
    this.scene.fog.color.setHex(s.sky);
    this.hemiLight.intensity = s.hemi;
    this.sunLight.intensity = s.sun;
  }

  frame(dt) {
    const time = performance.now() / 1000;

    if (this.started) {
      if (this.pendingRewards.length && this.collectPendingRewards()) {
        this.ui.toast("📦 預かっていた報酬を受け取りました");
      }
      this.handleInput(dt);

      // 会話・選択肢・メニュー・収納箱・職業の書・ポーズ中は世界を完全停止する。
      // モンスターの移動と攻撃、防衛戦の進行、時間・作物・住民・ドロップまで
      // すべて止まり、会話中に一方的に殴られることがなくなる。
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
    this.props.update(dt, this.player.pos, this.daynight.isNight);
    this.blueprints.update(time);
    this.chunks.flushDirty();
    this.updateCamera(dt);
    this.input.endFrame();
    // ムービーは不透明な全画面の iframe で覆うので、その間は3Dを描かない。
    if (!this.movies.open) this.renderer.render(this.scene, this.camera);
  }

  // 世界停止中（会話・メニュー）の見た目だけの同期。スプライトのビルボードを
  // カメラへ向け続け、待機アニメと影を保つ。これが無いと、停止中にカメラだけが
  // 動いてキャラの板ポリゴンが斜めから見え、「ペラペラ」に見えてしまう。
  syncVisualsWhilePaused(dt) {
    // 実体(root)の位置も pos へ同期する。ニューゲームでは導入会話が最初の
    // 1フレームより先に世界を止めるため、これが無いとプレイヤーの見た目が
    // 原点(0,0,0)に取り残され、開幕の会話中にキャラクターが表示されない
    //（住民の syncVisual は従来から位置を同期しており、住民は正しく見えていた）。
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
    {
      this.graceT = Math.max(0, this.graceT - dt);

      // Player movement.
      let move = null;
      if (this.input.enabled) {
        const x = (this.input.down("d") || this.input.down("arrowright") ? 1 : 0) - (this.input.down("a") || this.input.down("arrowleft") ? 1 : 0);
        const z = (this.input.down("s") || this.input.down("arrowdown") ? 1 : 0) - (this.input.down("w") || this.input.down("arrowup") ? 1 : 0);
        if (x !== 0 || z !== 0) move = { x, z };
      }
      const wantJump = this.input.down(" ");
      this.player.update(dt, this.world, move, this.cameraYaw, wantJump);

      // 見えない壁: 橋が架かる(southOpen)まで南の島へは渡れない。水上を
      // ブロックで渡る・泳ぐ抜け道もここで塞ぐ（設置側は primaryAction）。
      if (!this.southOpen && this.player.pos.z > WORLD.GATE_Z) {
        this.player.pos.z = WORLD.GATE_Z;
        this.player.vel.z = Math.min(0, this.player.vel.z);
        this.throttledToast("gate", "📖「この先へ渡るすべが無い。今は戻るのじゃ」");
      }

      // Show the held hammer / weapon in the hero's hand (other items = bare hands).
      const heldSlot = this.inventory.held();
      const heldDef = heldSlot ? ITEMS[heldSlot.id] : null;
      this.player.rig.setTool(
        heldDef && (heldDef.kind === "tool" || heldDef.kind === "weapon") ? heldSlot.id : null,
      );

      this.updateAim();
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
        basePos: { x: PLACES.base.x, z: PLACES.base.z },
        ch3: !!this.quests.flags.squidWaters, // 第3章: 夜の海峡にイカが湧く
        attackEntity: (e, dmg, from) => this.attackEntity(e, dmg, from),
        hurtMonster: (m, dmg, from, attack) => this.hurtMonster(m, dmg, from, attack),
        damageBlock: (x, y, z, n) => this.damageBlock(x, y, z, n),
      };
      if (stageIndex(this.quests.stage) >= stageIndex("BUILD_HUT") && !this.defense.active) {
        this.monsters.updateAmbient(dt, mctx);
      }
      this.monsters.update(dt, mctx);
      this.defense.update(dt, this.ui);

      // Villagers.
      const vctx = this.villagerContext(time);
      for (const v of this.villagers) v.update(dt, vctx);

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
      if (this.defense.active) {
        const boss = this.defense.boss && !this.defense.boss.dead ? this.defense.boss : null;
        this.ui.setRaid(
          true,
          this.defense.bannerHp,
          this.defense.bannerMaxHp,
          boss?.hp,
          boss?.maxHp,
          this.defense.cfg.label,
          boss ? `👑 ${boss.def.name}` : undefined,
        );
      } else {
        this.ui.setRaid(false);
      }
      const bp = this.blueprints.active;
      if (bp) {
        const remaining = this.blueprints.remainingMaterials();
        const total = bp.cells.length;
        const done = bp.cells.filter((c) => !c.ghost.visible).length;
        this.ui.setBlueprint(bp.name, remaining, done, total);
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
  }
}

new Game();
