// D02/D05: real world callbacks, inventory and persistence. Time is advanced explicitly.
import { launchBrowser, openGame, newGame, expect, waitForCond, dlg, SAVE_KEY } from "../helpers.mjs";
import { B, BLOCK_DEFS } from "../../src/world/blocks.js";
const browser = await launchBrowser();
const errors = [];
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  await page.keyboard.press("Escape");
  await page.waitForSelector(".btn-save", { state: "visible" });
  const rewards = await page.evaluate(() => {
    const g = window.__game;
    g.inventory.slots.fill(null);
    for (let i=0;i<24;i++) g.inventory.slots[i] = { id: "stone", count: 99 };
    g.inventory.slots[0] = { id: "seed", count: 98 };
    g.giveItems([["seed",10],["herb",3]]);
    return { seeds:g.inventory.count("seed"), pending:g.pendingRewards };
  });
  expect(rewards.seeds === 99 && JSON.stringify(rewards.pending) === JSON.stringify([["seed",9],["herb",3]]), "partial multi-item rewards stay pending");
  // Empty a slot using the actual storage action, while the menu pauses the world.
  await page.evaluate(() => {
    const g=window.__game;
    g.storage.open("1,1,1");
    g.ui.hooks.storeItem(1);
  });
  await waitForCond(page, () => window.__game.inventory.count("seed") === 108);
  await page.evaluate(() => window.__game.ui.hideStorage());
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 1 && window.__game.pendingRewards[0][0] === "herb"), "freed slot receives only remaining seeds");
  await page.click(".btn-save");
  await page.reload({ waitUntil:"networkidle" });
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.__game.inventory.count("seed") === 108 && window.__game.pendingRewards[0][1] === 3), "received and pending portions survive reload");
  await page.evaluate(() => { const g=window.__game; g.inventory.remove("stone",99); });
  await waitForCond(page, () => window.__game.inventory.count("herb") === 3);
  const once = await page.evaluate(() => {
    const g=window.__game;
    for(let i=0;i<5;i++)g.collectPendingRewards();
    return g.pendingRewards.length === 0 && g.inventory.count("seed") === 108 && g.inventory.count("herb") === 3;
  });
  expect(once, "repeated claims never duplicate rewards");
  await page.click(".btn-save");
  await page.reload({ waitUntil:"networkidle" });
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 0 && window.__game.inventory.count("herb") === 3), "fully claimed reward remains claimed after reload");

  // The actual farm-completion callback must retain its one-time seed reward.
  await page.keyboard.press("Escape");
  await page.evaluate(()=>{
    const g=window.__game;
    g.inventory.slots=Array.from({length:24},()=>({id:"stone",count:99}));
    g.quests.stage="BUILD_FARM";
    g.quests.onBlueprintComplete("farm");
  });
  await dlg(page);
  await waitForCond(page,()=>window.__game.quests.stage==="FARMING");
  expect(await page.evaluate(()=>{
    const g=window.__game;
    g.quests.onBlueprintComplete("farm"); // already completed: no second grant
    return g.inventory.count("seed")===0 && JSON.stringify(g.pendingRewards)===JSON.stringify([["seed",10]]);
  }),"full inventory retains actual one-time farm reward, without a duplicate completion grant");
  await page.keyboard.press("Escape");
  await page.click(".btn-save");
  await page.reload({waitUntil:"networkidle"});
  await page.click(".btn-continue");
  await waitForCond(page,()=>window.__game.started);
  await page.keyboard.press("Escape");
  await page.evaluate(()=>window.__game.inventory.remove("stone",99));
  await waitForCond(page,()=>window.__game.inventory.count("seed")===10);
  expect(await page.evaluate(()=>window.__game.quests.stage==="FARMING" && window.__game.pendingRewards.length===0),"farm progression and seed reward both survive reload");

  const mushroom = await page.evaluate(({ B, def }) => {
    const g=window.__game, w=g.world;
    const sites=[];
    for(let z=0;z<112;z++)for(let x=0;x<64;x++)for(let y=1;y<24;y++)
      if(w.get(x,y,z)===B.MUSHROOM)sites.push({x,y,z});
    for(const c of sites)g.breakBlock(c.x,c.y,c.z,def);
    const c=sites[0], key=[c.x,c.y,c.z].join(",");
    g.mushrooms.update(150);
    return { c, key, count:sites.length, waiting:g.mushrooms.regrow.size, left:g.mushrooms.regrow.get(key), drops:g.drops.filter(d=>d.itemId==="mushroom").length };
  }, { B, def:BLOCK_DEFS[B.MUSHROOM] });
  expect(mushroom.count > 0 && mushroom.waiting === mushroom.count && mushroom.drops === mushroom.count && mushroom.left === 150, "all natural mushrooms harvested exactly once, half-day remaining");
  await page.click(".btn-save");
  await page.reload({ waitUntil:"networkidle" });
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started);
  await page.keyboard.press("Escape");
  const growth = await page.evaluate(({ B, mushroom }) => {
    const g=window.__game, w=g.world, c=mushroom.c;
    const left=g.mushrooms.regrow.get(mushroom.key);
    // A building blocks regrowth; removing it allows the overdue site to retry.
    w.set(c.x,c.y,c.z,B.WALL);
    g.mushrooms.update(151);
    const blocked=w.get(c.x,c.y,c.z)===B.WALL && g.mushrooms.regrow.has(mushroom.key);
    w.set(c.x,c.y,c.z,B.AIR);
    const pos=g.player.pos.clone();
    g.player.pos.set(c.x+0.5,c.y,c.z+0.5);
    g.mushrooms.update(1);
    const occupied=w.get(c.x,c.y,c.z)===B.AIR;
    g.player.pos.copy(pos);
    w.set(c.x,c.y-1,c.z,B.FARMLAND);
    g.mushrooms.update(1);
    const farm=w.get(c.x,c.y,c.z)===B.AIR;
    w.set(c.x,c.y-1,c.z,w.pristine[w.idx(c.x,c.y-1,c.z)]);
    w.set(c.x,c.y,c.z,B.WATER);
    g.mushrooms.update(1);
    const water=w.get(c.x,c.y,c.z)===B.WATER;
    w.set(c.x,c.y,c.z,B.AIR);
    g.mushrooms.update(1);
    const regrown=w.get(c.x,c.y,c.z)===B.MUSHROOM;
    return {left,blocked,occupied,farm,water,regrown};
  }, { B, mushroom });
  expect(growth.left > 149 && growth.left <= 150, "regrowth countdown survives reload");
  expect(growth.blocked && growth.occupied && growth.farm && growth.water && growth.regrown, "no overwrite of buildings, people, farmland or water; retries when clear");
  const second = await page.evaluate(({B,def,c}) => {
    const g=window.__game;
    const before=g.drops.filter(d=>d.itemId==="mushroom").length;
    g.breakBlock(c.x,c.y,c.z,def);
    g.mushrooms.update(299);
    const notYet=g.world.get(c.x,c.y,c.z)===B.AIR;
    g.mushrooms.update(1.01);
    return {notYet, regrown:g.world.get(c.x,c.y,c.z)===B.MUSHROOM, drops:g.drops.filter(d=>d.itemId==="mushroom").length-before};
  }, {B,def:BLOCK_DEFS[B.MUSHROOM],c:mushroom.c});
  expect(second.notYet && second.regrown && second.drops === 1, "second cycle waits a full day, gives one drop");
  await page.reload({waitUntil:"networkidle"});
  await page.click(".btn-new");
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 0 && window.__game.mushrooms.regrow.size === 0), "New Game starts without pending rewards or regrowth");
  expect(errors.length === 0, JSON.stringify(errors));
  console.log("quality-resources.test: PASS");
} finally { await browser.close(); }
