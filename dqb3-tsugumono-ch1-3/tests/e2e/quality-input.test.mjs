// D06/D14/D20: real input; fixture setup never performs the action under test.
import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";
import { B } from "../../src/world/blocks.js";
import assert from "node:assert/strict";
import fs from "node:fs";
const browser=await launchBrowser(), errors=[];
try {
  const page=await browser.newPage({viewport:{width:960,height:640}});
  await openGame(page,{collectErrors:errors});
  await newGame(page);
  expect(await page.locator(".objective").innerText().then(s=>s.includes("長押し")),"first objective explains holding the button");
  await page.evaluate(B=>{
    const g=window.__game;
    for(let x=16;x<=32;x++)for(let z=16;z<=34;z++){
      for(let y=8;y<23;y++)g.world.set(x,y,z,B.AIR);
      g.world.set(x,7,z,B.STONE);
    }
    g.player.pos.set(24.5,8.01,26.5);g.player.vel.set(0,0,0);
    g.cameraYaw=0;g.cameraYawTarget=0;g.camZoom=1;
    g.inventory.slots.fill(null);g.inventory.add("hammer_wood",1);g.inventory.add("seed",3);
    g.inventory.add("club",1);g.inventory.add("wall",3);
    g.monsters.spawnTimer=1e6;
    for(const m of [...g.monsters.monsters])g.monsters.remove(m);
    g.world.set(24,8,24,B.LOG);
  },B);
  // Project a known target; wait until the real raycast agrees before clicking.
  async function aim(cell){
    let previous=null, stable=0;
    for(let n=0;n<60;n++){
      const current=await page.evaluate(()=>window.__game.camera.position.toArray());
      stable=previous && current.every((v,i)=>Math.abs(v-previous[i])<0.002) ? stable+1 : 0;
      if(stable>=3)break;
      previous=current;await page.waitForTimeout(100);
    }
    for(let i=0;i<30;i++){
      const p=await page.evaluate(c=>{
        const g=window.__game,v=g.player.pos.clone().set(c.x+0.5,c.y+0.7,c.z+0.5).project(g.camera);
        return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};
      },cell);
      await page.mouse.move(p.x,p.y);
      await page.waitForTimeout(100);
      if(await page.evaluate(c=>{const a=window.__game.aim?.cell;return a&&a.x===c.x&&a.y===c.y&&a.z===c.z;},cell))return p;
    }
    throw Error("could not aim at "+JSON.stringify(cell));
  }
  await aim({x:24,y:8,z:24});
  await page.mouse.down();
  await waitForCond(page,()=>window.__game.world.get(24,8,24)===0,undefined,{label:"held mouse mines the exact log",timeout:15000});
  await page.mouse.up();
  const mined=await page.evaluate(()=>{
    const g=window.__game;
    return g.inventory.count("log")+g.drops.filter(d=>d.itemId==="log").reduce((n,d)=>n+d.count,0);
  });
  expect(mined===1,"held input breaks the target and yields exactly one log");

  await page.evaluate(B=>{
    const g=window.__game;g.world.set(24,7,24,B.FARMLAND);
    g.inventory.selected=g.inventory.slots.findIndex(s=>s?.id==="seed");
  },B);
  await aim({x:24,y:7,z:24});
  const seeds=await page.evaluate(()=>window.__game.inventory.count("seed"));
  const unplanted=await page.evaluate(()=>window.__game.world.get(24,8,24));
  await page.mouse.click((await page.evaluate(()=>window.__game.input.mouse.x)),(await page.evaluate(()=>window.__game.input.mouse.y)));
  await waitForCond(page,()=>window.__game.world.get(24,8,24)===19,undefined,{label:"click plants the aimed farmland"});
  expect(await page.evaluate(()=>window.__game.inventory.count("seed"))===seeds-1,"plant click consumes one seed");
  const planted=await page.evaluate(()=>window.__game.world.get(24,8,24));
  const assertPlanted=observed=>assert.equal(observed,B.CROP1,"target must contain a seedling");
  assert.throws(()=>assertPlanted(unplanted),"no planting input must fail the same assertion");
  assertPlanted(planted);
  expect(planted===B.CROP1,"planting is not substituted with state injection");

  // Freeze only target movement to isolate input/hit detection from AI and knockback.
  await page.evaluate(()=>{
    const g=window.__game;
    g.inventory.selected=g.inventory.slots.findIndex(s=>s?.id==="club");
    const m=g.monsters.spawn("slime",24.5,8.01,25.3);m.hp=30;m.maxHp=30;m.update=()=>{};
    window.inputTestTarget=m;
    g.spawnDrop("stone",1,18,8,18); // pre-existing drops must not satisfy hit assertions
    g.player.facing.set(0,-1);
  });
  await aim({x:24,y:8,z:24});
  const before=await page.evaluate(()=>window.inputTestTarget.hp);
  await page.mouse.click(await page.evaluate(()=>window.__game.input.mouse.x),await page.evaluate(()=>window.__game.input.mouse.y));
  await waitForCond(page,()=>window.inputTestTarget.hp===28,undefined,{label:"real click damages the chosen enemy"});
  const after=await page.evaluate(()=>window.inputTestTarget.hp);
  const assertHit=(oldHp,newHp)=>assert.ok(newHp<oldHp,"chosen target HP must decrease");
  assert.throws(()=>assertHit(before,before),"old drops cannot hide an unsuccessful attack");
  assertHit(before,after);
  await waitForCond(page,()=>window.__game.player.attackCooldown<=0);
  await page.mouse.click(await page.evaluate(()=>window.__game.input.mouse.x),await page.evaluate(()=>window.__game.input.mouse.y));
  await waitForCond(page,()=>window.inputTestTarget.hp===26,undefined,{label:"next swing hits during enemy flash"});
  expect(after===28,"real attack and next cooldown-ready swing both hit");
  await page.evaluate(()=>{window.__game.monsters.remove(window.inputTestTarget);delete window.inputTestTarget;});

  // Verify every modal's wheel is discarded, while wheel over the canvas still works.
  for(const kind of ["inventory","storage","book","dialogue","pause","help"]){
    await page.evaluate(kind=>{
      const g=window.__game;g.inventory.selected=0;
      if(kind==="inventory")g.ui.openMenu(g.menuCtx());
      if(kind==="storage")g.storage.open("2,2,2");
      if(kind==="book")g.ui.showJobBook(g.jobBookData());
      if(kind==="dialogue")g.ui.dialogue.play([{speaker:"確認",text:"入力テスト"}],()=>{});
      if(kind==="pause")g.ui.showPause(()=>true,null);
      if(kind==="help")g.ui.showHelp();
    },kind);
    await waitForCond(page,()=>!window.__game.input.enabled);
    await page.mouse.move(480,320);await page.mouse.wheel(0,500);
    await page.evaluate(kind=>{
      const u=window.__game.ui;
      if(kind==="inventory")u.closeMenu();
      if(kind==="storage")u.hideStorage();
      if(kind==="book")u.hideJobBook();
      if(kind==="dialogue"){u.dialogue.typing=false;u.dialogue.advance();}
      if(kind==="pause")u.hidePause();
      if(kind==="help")u.help.classList.add("hidden");
    },kind);
    await waitForCond(page,()=>window.__game.input.enabled);
    expect(await page.evaluate(()=>window.__game.inventory.selected)===0,kind+" wheel does not change selected item");
  }
  await page.mouse.move(480,300);await page.mouse.wheel(0,100);
  await waitForCond(page,()=>window.__game.inventory.selected===1,undefined,{label:"canvas wheel changes hotbar normally"});
  await page.keyboard.press("e");
  await page.mouse.wheel(0,200);
  await page.keyboard.press("e");
  await waitForCond(page,()=>window.__game.input.enabled);
  expect(await page.evaluate(()=>window.__game.inventory.selected)===1,"real E/open/wheel/E/close preserves selection");
  await page.evaluate(()=>window.__game.ui.showHelp());
  expect(await page.locator(".help").innerText().then(s=>s.includes("左ボタン長押し")),"persistent help explains mining");
  if(process.env.QA_CAPTURE){fs.mkdirSync("docs/quality/2026-09-05/evidence/D20",{recursive:true});await page.screenshot({path:"docs/quality/2026-09-05/evidence/D20/help.png"});}
  expect(errors.length===0,JSON.stringify(errors));
  console.log("quality-input.test: PASS");
}finally{await browser.close();}
