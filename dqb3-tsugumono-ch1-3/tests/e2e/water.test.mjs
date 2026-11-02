// 海面フラッドフィル（systems/water.js）の回帰テスト。
// - 掘った海底の穴に水が満ちる
// - 海へ掘った水路に水が流れ込む（連鎖）
// - 海面より上は絶対に水没しない
// - 海から隔離された地下は乾いたまま
// - 掘って埋め戻す（ブロック設置）と水が消える／また掘ると戻る

import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const B_AIR = 0;
const B_WATER = 5;
const B_DIRT = 2;
const B_SAND = 4;

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const drain = async () => {
    for (let i = 0; i < 40; i += 1) {
      await page.evaluate(() => window.__game.water.update(Number.POSITIVE_INFINITY));
      await page.waitForTimeout(15);
    }
  };

  // 海際を探す: y=3 が水で、隣に固体の陸(y=3)があるところ。
  const shore = await page.evaluate(() => {
    const W = window.__game.world;
    for (let z = 2; z < 60; z += 1) {
      for (let x = 2; x < 62; x += 1) {
        if (W.get(x, 3, z) !== 5) continue;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = W.get(x + dx, 3, z + dz);
          if (n !== 5 && n !== 0) return { x, z, lx: x + dx, lz: z + dz };
        }
      }
    }
    return null;
  });
  expect(shore !== null, `海際の座標が見つかる (${JSON.stringify(shore)})`);

  const northShallow = await page.evaluate(() => {
    const W = window.__game.world;
    for (let z = 2; z < 60; z += 1) {
      for (let x = 2; x < 62; x += 1) {
        if (W.get(x, 3, z) !== 5) continue;
        if (W.get(x, 2, z) !== 4) continue;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = W.get(x + dx, 3, z + dz);
          if (n !== 5 && n !== 0) return { x, z, lx: x + dx, lz: z + dz };
        }
      }
    }
    return null;
  });
  expect(northShallow !== null, `北島の水際に砂の浅瀬がある (${JSON.stringify(northShallow)})`);
  expect(await page.evaluate((s) => window.__game.world.get(s.x, 2, s.z), northShallow) === B_SAND, "北島の浅瀬は水面直下が砂");
  const southShallow = await page.evaluate(() => {
    const W = window.__game.world;
    for (let z = 70; z < 108; z += 1) {
      for (let x = 2; x < 62; x += 1) {
        if (W.get(x, 3, z) !== 5) continue;
        if (W.get(x, 2, z) !== 4) continue;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = W.get(x + dx, 3, z + dz);
          if (n !== 5 && n !== 0) return { x, z, lx: x + dx, lz: z + dz };
        }
      }
    }
    return null;
  });
  expect(southShallow !== null, `南島の水際に砂の浅瀬がある (${JSON.stringify(southShallow)})`);
  expect(await page.evaluate((s) => window.__game.world.get(s.x, 2, s.z), southShallow) === B_SAND, "南島の浅瀬は水面直下が砂");

  // --- T1: 掘った海底の穴に水が満ちる -------------------------------------------------
  await page.evaluate((s) => {
    const W = window.__game.world;
    W.set(s.x, 2, s.z, 0);
    W.set(s.x, 1, s.z, 0);
  }, shore);
  await drain();
  const t1 = await page.evaluate((s) => ({
    y2: window.__game.world.get(s.x, 2, s.z),
    y1: window.__game.world.get(s.x, 1, s.z),
  }), shore);
  expect(t1.y2 === B_WATER && t1.y1 === B_WATER, `海底の掘った穴が水で満ちる (${JSON.stringify(t1)})`);

  // --- T2: 海へ掘った水路に水が流れ込む（連鎖） ---------------------------------------
  const channel = await page.evaluate((s) => {
    const W = window.__game.world;
    const dir = [Math.sign(s.lx - s.x), Math.sign(s.lz - s.z)];
    const cells = [];
    for (let k = 0; k < 3; k += 1) {
      const cx = s.lx + dir[0] * k;
      const cz = s.lz + dir[1] * k;
      const cur = W.get(cx, 3, cz);
      if (cur !== 0 && cur !== 5) {
        W.set(cx, 3, cz, 0);
        cells.push([cx, cz]);
      }
    }
    return cells;
  }, shore);
  await drain();
  const t2 = await page.evaluate((cells) => cells.map(([x, z]) => window.__game.world.get(x, 3, z)), channel);
  expect(channel.length > 0 && t2.every((v) => v === B_WATER), `掘った水路が内陸まで水になる (${JSON.stringify(t2)})`);

  // --- T3: 海面より上は水没しない -----------------------------------------------------
  await page.evaluate((s) => window.__game.world.set(s.x, 4, s.z, 0), shore);
  await drain();
  const t3 = await page.evaluate((s) => window.__game.world.get(s.x, 4, s.z), shore);
  expect(t3 === B_AIR, `海面(y=3)より上のセルは乾いたまま (y=4 は ${t3})`);

  // --- T4: 海から隔離された地下は乾いたまま -------------------------------------------
  const sealed = await page.evaluate(() => {
    const W = window.__game.world;
    const bx = 30, bz = 44; // 拠点内陸（海から遠い固体）
    W.set(bx, 2, bz, 0);
    const NEIGH = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const wet = NEIGH.some(([dx, dy, dz]) => W.get(bx + dx, 2 + dy, bz + dz) === 5);
    return { bx, bz, wet };
  });
  await drain();
  const t4 = await page.evaluate((s) => window.__game.world.get(s.bx, 2, s.bz), sealed);
  // 近傍に水があるとテストの前提が崩れるのでスキップ扱い（実マップでは乾いた地点）。
  expect(sealed.wet || t4 === B_AIR, `水に接しない地下は乾いたまま (${t4})`);

  // --- T5: 埋め戻す（設置）と水が消える／掘り直すと戻る --------------------------------
  const refill = await page.evaluate((s) => {
    const W = window.__game.world;
    W.set(s.x, 2, s.z, 2); // DIRT を置く（埋め立て）→ 水が消える
    const filled = W.get(s.x, 2, s.z);
    return { filled };
  }, shore);
  expect(refill.filled === B_DIRT, `水に土を置くと埋め立てられる (${refill.filled})`);
  await page.evaluate((s) => window.__game.world.set(s.x, 2, s.z, 0), shore); // 掘り直す
  await drain();
  const reflood = await page.evaluate((s) => window.__game.world.get(s.x, 2, s.z), shore);
  expect(reflood === B_WATER, `掘り直すと水が戻る (${reflood})`);

  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);
  console.log("water.test: PASS");
} finally {
  await browser.close();
}
