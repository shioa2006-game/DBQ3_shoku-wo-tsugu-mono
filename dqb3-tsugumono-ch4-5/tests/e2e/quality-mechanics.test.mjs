// D07/D09/D10/D11: component checks inside the real browser game.
import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";
import { RECIPES } from "../../src/game/items.js";
import { B, BLOCK_DEFS } from "../../src/world/blocks.js";
import fs from "node:fs";
const browser=await launchBrowser(), errors=[];
try {
  const page=await browser.newPage({viewport:{width:960,height:540}});
  await openGame(page,{collectErrors:errors});
  await newGame(page);
  await page.keyboard.press("Escape");
  await page.waitForSelector(".btn-save",{state:"visible"});
  const hp=await page.evaluate(()=>{
    const g=window.__game, result=[];
    for(const n of [0,1,2,3,4,25,26]){
      g.ui.setHp(n,26);
      const cells=[...g.ui.hearts.children];
      result.push({n,label:g.ui.hearts.getAttribute("aria-label"),fills:cells.map(c=>c.style.getPropertyValue("--hp-fill")),classes:cells.map(c=>c.className),widths:cells.map(c=>c.getBoundingClientRect().width)});
    }
    g.player.hp=1;g.ui.setHp(1,26);
    return result;
  });
  expect(hp[0].classes.every(c=>c.includes("empty")) && hp[1].classes[0].includes("partial"),"HP1 differs visibly from HP0");
  expect(hp.slice(0,5).map(h=>h.fills[0]).join(",")==="0%,25%,50%,75%,100%","quarter-heart increments represent HP0..4");
  expect(hp.every(h=>h.widths.every(w=>w===24)) && hp[6].fills[6]==="50%" && hp[6].label==="HP 26 / 26","stable metrics and fractional maximum HP");
  if(process.env.QA_CAPTURE){fs.mkdirSync("docs/quality/2026-09-05/evidence/D07",{recursive:true});await page.screenshot({path:"docs/quality/2026-09-05/evidence/D07/hp1.png"});}

  const crops=await page.evaluate(B=>{
    const g=window.__game,w=g.world,f=g.farming,x=15,y=10,z=15,key=[x,y,z].join(",");
    w.set(x,y-1,z,B.FARMLAND);w.set(x,y,z,B.CROP1);
    f.update(69);const first=w.get(x,y,z)===B.CROP1;
    f.update(1.01);const middle=w.get(x,y,z)===B.CROP2;
    f.update(0.05);const stays=w.get(x,y,z)===B.CROP2;
    f.update(69);const late=w.get(x,y,z)===B.CROP2;
    f.update(1);const done=w.get(x,y,z)===B.CROP3 && !f.cropGrowth.has(key);
    w.set(x,y,z,B.AIR);w.set(x,y,z,B.CROP1);f.update(141);
    const big=w.get(x,y,z)===B.CROP3;
    w.set(x,y,z,B.AIR);w.set(x,y,z,B.CROP1);
    for(let i=0;i<20;i++){f.boostCropsNear({x:x+0.5,z:z+0.5},2,1);f.update(1);}
    const boost=w.get(x,y,z)===B.CROP2;
    w.set(x,y,z,B.AIR);w.set(x,y,z,B.CROP1);
    return {first,middle,stays,late,done,big,boost,reset:f.cropGrowth.get(key)===0};
  },B);
  expect(Object.values(crops).every(Boolean),"two timed crop stages, excess dt, ally boost and replant reset: "+JSON.stringify(crops));


  const harvest=await page.evaluate(({B,def,recipe})=>{
    const g=window.__game,w=g.world,x=15,y=10,z=15;
    w.set(x,y,z,B.CROP3);
    const count=g.quests.counters.harvested;
    const before=g.drops.length;
    g.breakBlock(x,y,z,def);
    const drops=g.drops.slice(before);
    const grain=drops.filter(d=>d.itemId==="volcano_grain").reduce((n,d)=>n+d.count,0);
    const ids=drops.every(d=>["volcano_grain","volcano_grain_seed"].includes(d.itemId));
    for(const d of drops)g.inventory.add(d.itemId,d.count);
    g.inventory.add("herb",1);
    const cooked=g.inventory.craft(recipe) && g.inventory.count("porridge")===1;
    return grain===2 && ids && cooked && g.quests.counters.harvested===count+1;
  },{B,def:BLOCK_DEFS[B.CROP3],recipe:RECIPES.find(r=>r.out==="porridge")});
  expect(harvest,"harvest still yields volcanic grain/seed and cooks into Ch5 porridge");

  const combat=await page.evaluate(()=>{
    const g=window.__game,result={};
    for(const type of ["lava_lizard","iron_scorpion"]){
      const m=g.monsters.spawn(type,15,10,15);m.hp=100;
      const ally={},hero={};
      g.hurtMonster(m,2,null,ally);g.hurtMonster(m,7,null,hero);
      result[type+"Together"]=m.hp===91;
      g.hurtMonster(m,7,null,hero);result[type+"Dedup"]=m.hp===91;
      m.invuln=Math.max(0,m.invuln-0.42);
      g.hurtMonster(m,7,null,{});result[type+"Cadence"]=m.hp===84;
      if(type==="iron_scorpion"){
        m.facingDir.set(0,1);
        g.hurtMonster(m,8,m.pos.clone().add({x:0,y:0,z:1}),{});
        result.armor=m.hp===82;
        g.hurtMonster(m,8,m.pos.clone().add({x:0,y:0,z:-1}),{});
        result.flank=m.hp===74;
      }
      g.monsters.remove(m);
    }
    g.startGromBattle();
    for(const h of g.gromBattle.heads){
      const n=h.hp, hero={},ally={};
      g.hurtMonster(h,7,null,hero);g.hurtMonster(h,2,null,ally);
      result["head"+h.index+"Together"]=h.hp===n-9;
      g.hurtMonster(h,7,null,hero);result["head"+h.index+"Dedup"]=h.hp===n-9;
      h.update(0.42);g.hurtMonster(h,7,null,{});
      result["head"+h.index+"Cadence"]=h.hp===n-16;
    }
    // Exercise the actual villager AI + Game context forwarding against each head.
    const v=g.villager("gonta"),battleUpdate=g.gromBattle.update;
    g.gromBattle.update=()=>{}; // fixed target positions only for this isolated AI check
    for(const h of g.gromBattle.heads){
      for(const other of g.gromBattle.heads)other.pos.set(50,10,100);
      h.pos.set(24.5,10,24.5);g.gromBattle.pos.copy(h.pos);
      v.pos.set(24.5,10,24);v.attackCd=0;v.setDown(false);
      const before=h.hp;g.simulate(0.01,0);
      result["head"+h.index+"RealAlly"]=h.hp===before-v.def.atk;
    }
    g.gromBattle.update=battleUpdate;
    g.graceT=0;
    for(const e of [g.player,v]){
      e.hp=20;e.invuln=0;g.attackEntity(e,3,null);const hp=e.hp;
      g.attackEntity(e,3,null);result[e.kind+"Protection"]=e.hp===hp && hp<20;
    }
    return result;
  });
  expect(Object.values(combat).every(Boolean),"swings/armor/heads/real ally AI/incoming protection: "+JSON.stringify(combat));

  const placement=await page.evaluate(B=>{
    const g=window.__game,w=g.world,y=w.terrainSurfaceY(22.5,22.5),c={x:22,y,z:22,block:B.WALL};
    w.set(c.x,c.y,c.z,B.AIR);g.inventory.add("wall",10);
    const p=g.player.pos.clone(),v=g.spawnVillager("belk",22,22,y),m=g.monsters.spawn("lava_lizard",22.5,y,22.5);
    const blockers=[g.player,m,...g.gromBattle.heads];
    const entities=[...blockers,v];
    const away=()=>{for(const e of entities)e.pos.set(40,y,40);};
    const results=[];
    // Hero, enemy and dragon-head occupancy still blocks placement without cost.
    for(const occupant of blockers){
      away();
      occupant.pos.set(22.5,y+0.001,22.5);
      const n=g.inventory.count("wall");
      g.fillGhostCell(c);
      results.push(w.get(c.x,c.y,c.z)===B.AIR && g.inventory.count("wall")===n);
    }
    // An NPC steps aside to nearby ground, then the cell builds once.
    away();
    v.pos.set(22.5,y+0.001,22.5);
    let n=g.inventory.count("wall");g.fillGhostCell(c);
    const off=Math.abs(v.pos.x-22.5)>=v.halfW+0.5||Math.abs(v.pos.z-22.5)>=v.halfW+0.5;
    results.push(w.get(c.x,c.y,c.z)===B.WALL && g.inventory.count("wall")===n-1 && off && !v.collides(w,v.pos.x,v.pos.y,v.pos.z));
    w.set(c.x,c.y,c.z,B.AIR);
    away();
    n=g.inventory.count("wall");g.fillGhostCell(c);
    results.push(w.get(c.x,c.y,c.z)===B.WALL && g.inventory.count("wall")===n-1);
    g.fillGhostCell(c);results.push(g.inventory.count("wall")===n-1);
    g.player.pos.copy(p);
    return results;
  },B);
  expect(placement.every(Boolean),"hero/enemy/dragon-head occupancy blocks placement without cost; an NPC steps aside; clear cell builds once: "+JSON.stringify(placement));
  expect(errors.length===0,JSON.stringify(errors));
  console.log("quality-mechanics.test: PASS");
}finally{await browser.close();}
