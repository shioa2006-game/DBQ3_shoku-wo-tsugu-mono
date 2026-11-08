// D07/D09/D10/D11: component checks inside the real browser game.
import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";
import { B } from "../../src/world/blocks.js";
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

  const combat=await page.evaluate(()=>{
    const g=window.__game;
    const m=g.monsters.spawn("slime",15,10,15);m.hp=100;
    const ally={},hero={};
    g.hurtMonster(m,2,null,ally);
    g.hurtMonster(m,7,null,hero);
    const together=m.hp===91;
    g.hurtMonster(m,7,null,hero);
    const duplicate=m.hp===91;
    m.invuln=Math.max(0,m.invuln-0.42);
    g.hurtMonster(m,7,null,{});
    const cadence=m.hp===84;
    const boss=g.monsters.spawn("kraken",40,4,60);boss.hp=100;
    boss.shielded=true;g.hurtMonster(boss,7,null,{});
    const shield=boss.hp===100;
    boss.shielded=false;boss.diving=true;g.hurtMonster(boss,7,null,{});
    const dive=boss.hp===100;
    boss.diving=false;g.hurtMonster(boss,7,null,{});
    const exposed=boss.hp===93;
    g.player.hp=20;g.player.invuln=0;g.graceT=0;
    g.attackEntity(g.player,2,null);
    const h=g.player.hp;
    g.attackEntity(g.player,2,null);
    const protection=g.player.hp===h && h<20;
    return {together,duplicate,cadence,shield,dive,exposed,protection};
  });
  expect(Object.values(combat).every(Boolean),"independent swings, deduplication and existing defensive rules: "+JSON.stringify(combat));

  const placement=await page.evaluate(B=>{
    const g=window.__game,w=g.world,y=w.terrainSurfaceY(22.5,22.5),c={x:22,y,z:22,block:B.WALL};
    w.set(c.x,c.y,c.z,B.AIR);g.inventory.add("wall",10);
    const p=g.player.pos.clone(),v=g.spawnVillager("pino",22,22,y),m=g.monsters.spawn("slime",22.5,y,22.5);
    const entities=[g.player,v,m];
    const away=()=>{for(const e of entities)e.pos.set(40,y,40);};
    const results=[];
    // Hero and enemy occupancy still blocks placement without cost.
    for(const occupant of [g.player,m]){
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
  expect(placement.every(Boolean),"hero/enemy occupancy blocks placement without cost; an NPC steps aside; clear cell builds once: "+JSON.stringify(placement));
  expect(errors.length===0,JSON.stringify(errors));
  console.log("quality-mechanics.test: PASS");
}finally{await browser.close();}
