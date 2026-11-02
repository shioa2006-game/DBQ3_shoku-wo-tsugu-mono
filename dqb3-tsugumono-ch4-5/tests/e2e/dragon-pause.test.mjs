// D01/D10: DragonHead implements the paused-visual contract of a monster target.
import { launchBrowser, openGame, newGame, expect, waitForCond } from "../helpers.mjs";
const browser=await launchBrowser(), errors=[];
try {
 const page=await browser.newPage();
 await openGame(page,{collectErrors:errors});await newGame(page);
 await page.evaluate(()=>{const g=window.__game;g.quests.stage="CH5_DRAGON";g.quests.flags.bambooPassOpen=true;g.startGromBattle();});
 await page.keyboard.press("Escape");
 await page.waitForSelector(".btn-save",{state:"visible"});
 await page.click(".btn-save");
 await page.locator(".btn-resume").click();
 await waitForCond(page,()=>!window.__game.ui.modalOpen);
 expect(errors.length===0,JSON.stringify(errors.slice(0,4)));
 expect(await page.evaluate(()=>window.__game.gromBattle.active && window.__game.gromBattle.heads.length===2),"pause/save/resume keeps both heads and battle");
 console.log("dragon-pause.test: PASS");
}finally{await browser.close();}
