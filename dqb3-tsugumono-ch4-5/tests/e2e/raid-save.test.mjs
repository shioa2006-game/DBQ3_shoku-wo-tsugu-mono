// D01: chapter fixtures skip gathering/combat, but save buttons, dialogues and reload are real.
import { launchBrowser, openGame, newGame, expect, waitForCond, advanceToChoice, advanceToStage, dlg, SAVE_KEY, completeActiveBlueprint } from "../helpers.mjs";
const browser = await launchBrowser(), errors = [];
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  async function save() {
    await page.keyboard.press("Escape");
    await page.click(".btn-save");
    await page.locator(".btn-resume").click();
    await waitForCond(page, () => !window.__game.ui.modalOpen);
  }
  async function reload(expected) {
    await page.reload({ waitUntil: "networkidle" });
    await page.click(".btn-continue");
    await waitForCond(page, () => window.__game.started);
    expect(await page.evaluate(() => window.__game.quests.stage) === expected, "reload → " + expected);
  }
  async function start(npc, dragon = false) {
    await page.evaluate(npc => window.__game.quests.onTalk(npc), npc);
    await advanceToChoice(page);
    await page.locator(".choice-panel button").first().click();
    await waitForCond(page, dragon => dragon ? window.__game.gromBattle.active : window.__game.defense.active, dragon);
  }
  async function guardedSave(label) {
    const protectedSave = await page.evaluate(key => {
      const before = localStorage.getItem(key);
      window.__game.autosave();
      return before === localStorage.getItem(key) && window.__game.quests.busy;
    }, SAVE_KEY);
    await page.keyboard.press("Escape");
    await waitForCond(page, () => !window.__game.input.pressedKeys.has("escape"));
    expect(protectedSave && await page.evaluate(() => window.__game.ui.pause.classList.contains("hidden")), label + ": auto/manual save cannot store an incomplete cutscene");
  }
  await page.evaluate(() => {
    const g = window.__game;
    g.quests.setStage("CH4_BOOK", true);
    g.spawnVillager("belk", 25, 21);
    g.setBaseLevel(3);
  });
  await save(); await reload("CH4_BOOK");
  await start("belk");
  await save(); await reload("CH4_BOOK");
  expect(await page.evaluate(() => !window.__game.defense.active && window.__game.quests.flags.gotIronSword && window.__game.villager("gonta").weapon === "sword_iron"), "raid reload restores preparation and Gonta's iron sword");
  await start("belk");
  await page.evaluate(() => window.__game.defense.finish(true));
  await guardedSave("CH4 victory dialogue");
  await reload("CH4_BOOK"); // pre-victory save remains recoverable
  await start("belk");
  await page.evaluate(() => window.__game.defense.finish(true));
  await advanceToStage(page, "CH4_DONE");
  await reload("CH4_DONE");
  expect(await page.evaluate(() => {
    const g=window.__game;
    return g.baseLevel===4 && g.villagers.filter(v=>v.id==="nagi").length===1 && g.villager("nagi").stayDown;
  }), "completed raid restores one Nagi and base level");
  await page.evaluate(() => { const g=window.__game;g.quests.ch5.maybeStart();g.daynight.day++;g.daynight.hour=9; });
  await waitForCond(page, () => window.__game.quests.stage==="CH5_INTRO");
  expect(true, "reloaded Ch4 victory advances to Ch5 next morning");

  await page.evaluate(() => {
    const g=window.__game;
    g.quests.setStage("CH5_INNER_SHRINE",true);
    Object.assign(g.quests.flags,{bambooPassOpen:true,yomogiMet:true});
    g.quests.ch5.restoreState();
  });
  await save(); await reload("CH5_INNER_SHRINE");
  await start("nagi",true);
  await save(); await reload("CH5_INNER_SHRINE");
  expect(await page.evaluate(() => !window.__game.gromBattle.active && !window.__game.monsters.monsters.some(m=>m.isDragonHead)), "dragon reload has no orphan heads");
  await start("nagi",true);
  await page.evaluate(() => window.__game.gromBattle.finish(true));
  await guardedSave("Grom victory dialogue");
  await reload("CH5_INNER_SHRINE");
  await start("nagi",true);
  await page.evaluate(() => window.__game.gromBattle.finish(true));
  await dlg(page);
  await waitForCond(page, () => window.__game.blueprints.active?.id==="spring_works");
  await save(); await reload("CH5_DRAGON");
  expect(await page.evaluate(() => {
    const g=window.__game;return g.quests.flags.gromDefeated && g.blueprints.active?.id==="spring_works" && !g.gromBattle.active;
  }), "post-victory save restores spring blueprint without restarting Grom");
  await completeActiveBlueprint(page);
  await guardedSave("spring purification dialogue");
  await reload("CH5_DRAGON"); // incomplete completion was not saved
  // The chapter end is now only the M7 movie (the text ending was removed), so play it here
  // and make sure saving while it plays cannot store an incomplete cutscene.
  await page.evaluate(() => { window.__SHOKU_SKIP_MOVIES__ = false; });
  await completeActiveBlueprint(page); await dlg(page);
  await waitForCond(page, () => window.__game.movies.open, undefined, { label: "ending movie shown" });
  await guardedSave("ending movie");
  await waitForCond(page, () => {
    const m = window.__game.movies;
    if (m.current?.player) m.skip();
    return !m.open;
  }, undefined, { label: "ending movie closed" });
  await advanceToStage(page,"CH5_DONE");
  await reload("CH5_DONE");
  expect(await page.evaluate(() => window.__game.purification.springPurified && window.__game.passOpen), "ending save preserves purification and open pass");
  expect(errors.length===0,JSON.stringify(errors));
  console.log("raid-save.test: PASS");
} finally { await browser.close(); }
