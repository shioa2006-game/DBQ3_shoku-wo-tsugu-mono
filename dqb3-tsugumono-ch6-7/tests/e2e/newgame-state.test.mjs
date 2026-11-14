// 固定 New Game 状態の回帰テスト（docs/DESIGN.md の「1. 開始状態」）。
// - 第5章までの正史を組み込んだ固定状態: 仲間3人と麓のスズハ、読める書6冊、火山島で打った鉄の装備と船荷
// - 開始ステージ CH6_ARRIVAL・朝9時、南の砂浜に配置、船は桟橋に停泊
// - 島は崩れた神殿跡のまま（谷の橋は落ち、採石洞の入口は大岩でふさがり、祭壇の中央は欠けている）

import { launchBrowser, openGame, newGame, stage, expect, activeBlueprint } from "../helpers.mjs";
import { B } from "../../src/world/blocks.js";

// [アイテム, 個数]。開始時の持ち物はこれで全部。
const START_ITEMS = [
  ["hammer_iron", 1], ["sword_iron", 1], ["iron_armor", 1],
  ["herb", 6], ["onigiri", 6], ["torch", 8], ["iron", 8], ["iron_fitting", 4],
];

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  expect((await stage(page)) === "CH6_ARRIVAL", "開始ステージは CH6_ARRIVAL");

  // 同行: シオン（プレイヤー）＋ミナ・ゴンタ・ワタリ、麓の集落にスズハ。ほかの人物はまだいない。
  const vill = await page.evaluate(() => window.__game.villagers.map((v) => v.id).sort());
  for (const id of ["mina", "gonta", "watari", "suzuha"]) {
    expect(vill.includes(id), `${id} が配置されている (${vill})`);
  }
  expect(vill.length === 4, `アサギ・ガンゾウ・ピノ・ベルクは まだ島にいない (${vill})`);

  // 書: 六冊とも最初から読める（この編で新しい書は復活しない）。
  const jobs = await page.evaluate(() => {
    const j = window.__game.jobs;
    return {
      revived: ["builder", "farmer", "cook", "sailor", "blacksmith", "priest"].filter((id) => j.isRevived(id)),
      count: j.bookData().length,
    };
  });
  expect(jobs.count === 6, `書は6冊 (${jobs.count})`);
  expect(jobs.revived.length === 6, `職業の書/農民/料理人/船乗り/鍛冶屋/僧侶は 六冊とも復活済み (${jobs.revived})`);

  // 固定の持ち物（鉄のハンマー・鉄の剣・鉄の胸あて・食料・たいまつ・ベルクの船荷）。
  const inv = await page.evaluate(() => {
    const g = window.__game;
    const held = {};
    for (const s of g.inventory.slots) if (s) held[s.id] = (held[s.id] ?? 0) + s.count;
    return { held, maxHp: g.player.maxHp, hp: g.player.hp, defense: g.player.defense(), pending: g.pendingRewards.length };
  });
  for (const [id, n] of START_ITEMS) {
    expect(inv.held[id] === n, `${id}×${n} (${inv.held[id] ?? 0})`);
  }
  expect(Object.keys(inv.held).length === START_ITEMS.length, `ほかの持ち物は無い (${Object.keys(inv.held)})`);
  expect(inv.pending === 0, "預かりの報酬は無い");
  expect(inv.maxHp === 28 && inv.hp === 28 && inv.defense === 3, `鉄の胸あては持っているだけで効く (HP${inv.hp}/${inv.maxHp}・防御${inv.defense})`);

  // 開始位置は南の砂浜（上陸地点）。朝9時・1日目。船は桟橋に停泊し、拠点レベルはまだ無い。
  const state = await page.evaluate(() => {
    const g = window.__game;
    const p = g.player.pos;
    return {
      x: p.x, y: p.y, z: p.z, ground: g.world.terrainSurfaceY(p.x, p.z),
      hour: g.daynight.hour, day: g.daynight.day,
      ship: g.shipPresent, baseLevel: g.baseLevel,
      suzuhaMarker: g.villager("suzuha").marker.visible,
    };
  });
  expect(Math.abs(state.x - 32.5) < 0.6 && Math.abs(state.z - 99.5) < 0.6, `開始位置は上陸地点の砂浜 (x=${state.x.toFixed(1)}, z=${state.z.toFixed(1)})`);
  expect(Math.abs(state.y - state.ground) < 0.3, `砂浜に立っている (y=${state.y.toFixed(2)}, 地面 ${state.ground})`);
  expect(state.day === 1 && state.hour >= 9 && state.hour < 9.5, `朝9時から始まる (${state.day}日目 ${state.hour.toFixed(2)}時)`);
  expect(state.ship === true, "ワタリの船は桟橋に停泊している");
  expect(state.baseLevel === 0, `拠点レベルはまだ無い (${state.baseLevel})`);
  expect(state.suzuhaMarker === true, "最初の用件はスズハ（！）");

  // 島は崩れた神殿跡のまま。設計図はまだ開かず、先へ進む道は閉じている。
  const island = await page.evaluate(() => {
    const g = window.__game;
    return {
      caveMouth: g.world.get(15, 16, 34), // 採石洞の入口の大岩
      bridgeMissing: g.missingCells("slope_bridge").length,
      altarCenter: g.world.get(32, 19, 28), // 祭壇の中央（要石の場所）
      oldPillars: [30, 34].map((x) => g.world.get(x, 19, 35)),
      done: g.blueprints.completed.size,
      flags: Object.keys(g.quests.flags).filter((k) => g.quests.flags[k]),
    };
  });
  expect((await activeBlueprint(page)) === null && island.done === 0, "設計図はまだ開いていない（完成済みも無い）");
  expect(island.bridgeMissing >= 20, `谷の橋は落ちている (欠け ${island.bridgeMissing}マス)`);
  expect(island.caveMouth === B.BOULDER, `採石洞の入口は大岩でふさがっている (block ${island.caveMouth})`);
  expect(island.altarCenter === B.AIR, `祭壇の中央の石は欠けている (block ${island.altarCenter})`);
  expect(island.oldPillars.every((id) => id === B.OLD_PILLAR), "入口の両脇に 古い柱が二本だけ残る");
  expect(island.flags.length === 0, `進行のフラグは立っていない (${island.flags})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("newgame-state.test: PASS");
} finally {
  await browser.close();
}
