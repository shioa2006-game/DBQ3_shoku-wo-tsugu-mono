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
    g.inventory.slots[0] = { id: "volcano_grain_seed", count: 98 };
    g.giveItems([["volcano_grain_seed",10],["herb",3]]);
    return { seeds:g.inventory.count("volcano_grain_seed"), pending:g.pendingRewards };
  });
  expect(rewards.seeds === 99 && JSON.stringify(rewards.pending) === JSON.stringify([["volcano_grain_seed",9],["herb",3]]), "partial multi-item rewards stay pending");
  // Empty a slot using the actual storage action, while the menu pauses the world.
  await page.evaluate(() => {
    const g=window.__game;
    g.storage.open("1,1,1");
    g.ui.hooks.storeItem(1);
  });
  await waitForCond(page, () => window.__game.inventory.count("volcano_grain_seed") === 108);
  await page.evaluate(() => window.__game.ui.hideStorage());
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 1 && window.__game.pendingRewards[0][0] === "herb"), "freed slot receives only remaining seeds");
  await page.click(".btn-save");
  await page.reload({ waitUntil:"networkidle" });
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.__game.inventory.count("volcano_grain_seed") === 108 && window.__game.pendingRewards[0][1] === 3), "received and pending portions survive reload");
  await page.evaluate(() => { const g=window.__game; g.inventory.remove("stone",99); });
  await waitForCond(page, () => window.__game.inventory.count("herb") === 3);
  const once = await page.evaluate(() => {
    const g=window.__game;
    for(let i=0;i<5;i++)g.collectPendingRewards();
    return g.pendingRewards.length === 0 && g.inventory.count("volcano_grain_seed") === 108 && g.inventory.count("herb") === 3;
  });
  expect(once, "repeated claims never duplicate rewards");
  await page.click(".btn-save");
  await page.reload({ waitUntil:"networkidle" });
  await page.click(".btn-continue");
  await waitForCond(page, () => window.__game.started);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 0 && window.__game.inventory.count("herb") === 3), "fully claimed reward remains claimed after reload");


  // Actual chapter reward callbacks, with full inventory, then real save/reload.
  for(const reward of [
    {stage:"CH4_GATHER_PEOPLE",item:"volcano_grain_seed",n:6,npc:"kaya"},
    {stage:"CH5_INTRO",item:"machete",n:1,npc:"belk"},
    {stage:"CH5_HERB_GARDEN",item:"herb",n:8,bp:"herb_garden"},
  ]){
    await page.keyboard.press("Escape");
    await page.evaluate(r=>{
      const g=window.__game;g.pendingRewards=[];
      g.inventory.slots=Array.from({length:24},()=>({id:"stone",count:99}));
      g.quests.stage=r.stage;g.quests.busy=false;
      if(r.npc==="kaya"){g.quests.counters.rescued=2;g.quests.flags.townBaseActivated=false;}
      if(r.npc==="belk"){g.quests.flags.yomogiMet=true;g.quests.flags.macheteGiven=false;}
      if(r.npc)g.quests.onTalk(r.npc);
      else {g.blueprints.completed.add(r.bp);g.quests.onBlueprintComplete(r.bp);}
    },reward);
    await dlg(page);
    await waitForCond(page,()=>!window.__game.quests.busy);
    expect(await page.evaluate(r=>{
      const g=window.__game;
      if(r.npc)g.quests.onTalk(r.npc); // normal repeat conversation cannot grant again
      return g.inventory.count(r.item)===0 && JSON.stringify(g.pendingRewards)===JSON.stringify([[r.item,r.n]]);
    },reward),reward.item+": full inventory retains real chapter reward exactly once");
    await page.keyboard.press("Escape");await page.click(".btn-save");
    await page.reload({waitUntil:"networkidle"});await page.click(".btn-continue");
    await waitForCond(page,()=>window.__game.started);
    await page.keyboard.press("Escape");
    await page.evaluate(()=>window.__game.inventory.remove("stone",99));
    await waitForCond(page,r=>window.__game.inventory.count(r.item)===r.n,reward);
    expect(await page.evaluate(()=>window.__game.pendingRewards.length===0),reward.item+": pending reward survives reload and is collected once");
  }

  // The one-off proof of Grom's defeat is a quest reward, not a transient drop.
  await page.evaluate(()=>{
    const g=window.__game;g.inventory.slots=Array.from({length:24},()=>({id:"stone",count:99}));
    g.quests.stage="CH5_DRAGON";g.quests.flags.bambooPassOpen=true;
    g.startGromBattle();g.gromBattle.finish(true);
  });
  await dlg(page);
  expect(await page.evaluate(()=>JSON.stringify(window.__game.pendingRewards)===JSON.stringify([["black_scale",1]])),"full inventory retains Grom's black scale");
  await page.click(".btn-save");
  await page.reload({waitUntil:"networkidle"});await page.click(".btn-continue");
  await waitForCond(page,()=>window.__game.started);await page.keyboard.press("Escape");
  await page.evaluate(()=>window.__game.inventory.remove("stone",99));
  await waitForCond(page,()=>window.__game.inventory.count("black_scale")===1);
  expect(await page.evaluate(()=>window.__game.quests.flags.gromDefeated && window.__game.pendingRewards.length===0),"black scale and victory flag both survive reload");

  const mushroom = await page.evaluate(({ B, def }) => {
    const g=window.__game, w=g.world;
    const sites=[];
    for(let z=0;z<112;z++)for(let x=0;x<64;x++)for(let y=1;y<32;y++)
      if(w.get(x,y,z)===B.MUSHROOM){
        if(z<65 || w.pristine[w.idx(x,y,z)]!==B.MUSHROOM)throw Error("unexpected natural mushroom site");
        sites.push({x,y,z});
      }
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
    w.set(c.x,c.y-1,c.z,B.STONE);g.mushrooms.update(1);
    const newFloor=w.get(c.x,c.y,c.z)===B.AIR;
    w.set(c.x,c.y-1,c.z,w.pristine[w.idx(c.x,c.y-1,c.z)]);
    w.set(c.x,c.y,c.z,B.WATER);
    g.mushrooms.update(1);
    const water=w.get(c.x,c.y,c.z)===B.WATER;
    w.set(c.x,c.y,c.z,B.AIR);
    g.mushrooms.update(1);
    const regrown=w.get(c.x,c.y,c.z)===B.MUSHROOM;
    let total=0;
    for(let z=0;z<112;z++)for(let x=0;x<64;x++)for(let y=1;y<32;y++)if(w.get(x,y,z)===B.MUSHROOM)total++;
    return {left,blocked,occupied,farm,newFloor,water,regrown,total};
  }, { B, mushroom });
  expect(growth.left > 149 && growth.left <= 150, "regrowth countdown survives reload");
  expect(growth.blocked && growth.occupied && growth.farm && growth.newFloor && growth.water && growth.regrown, "no overwrite of buildings, people, farmland or water; retries when clear");
  expect(growth.total===mushroom.count,"all natural sites regrow, including the original stone-supported site");
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
  expect(await page.evaluate(B=>{
    const g=window.__game,w=g.world;
    w.set(15,10,15,B.MUSHROOM);w.set(15,10,15,B.AIR);
    return !g.mushrooms.regrow.has("15,10,15");
  },B),"player-placed mushroom outside natural sites never schedules regrowth");
  await page.reload({waitUntil:"networkidle"});
  await page.click(".btn-new");
  expect(await page.evaluate(() => window.__game.pendingRewards.length === 0 && window.__game.mushrooms.regrow.size === 0), "New Game starts without pending rewards or regrowth");
  expect(errors.length === 0, JSON.stringify(errors));
  console.log("quality-resources.test: PASS");
} finally { await browser.close(); }
