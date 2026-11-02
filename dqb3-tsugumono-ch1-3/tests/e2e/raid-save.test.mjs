// D01: real save serialization and reload, including the victory-dialogue boundary.
import { launchBrowser, openGame, newGame, expect, waitForCond, advanceToChoice, SAVE_KEY } from "../helpers.mjs";

const browser = await launchBrowser();
const errors = [];
try {
  const page = await browser.newPage();
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  for (const [savedStage, won, expected] of [
    ["DEFENSE", false, "PREPARE"],
    ["PADDY_DEFENSE", false, "PADDY_PREP"],
    ["CH3_RITE", false, "CH3_RITE"],
    ["CH3_DEFENSE", false, "CH3_RITE"],
    ["CH3_DEFENSE", true, "CH3_FAREWELL"],
    ["CH3_FAREWELL", true, "CH3_FAREWELL"],
  ]) {
    await page.evaluate(({ savedStage, won }) => {
      const g = window.__game;
      g.quests.stage = savedStage;
      g.quests.flags.riteDone = true;
      g.quests.flags.ch3RaidWon = false;
      g.spawnVillager("watari", 33, 52);
      g.defense.active = savedStage.endsWith("DEFENSE");
      if (won && savedStage === "CH3_DEFENSE") {
        g.defense.active = false;
        g.defense.onEnd(true); // includes the actual autosave before dialogue completion
      } else {
        g.quests.flags.ch3RaidWon = won;
      }
    }, { savedStage, won });
    if (!(won && savedStage === "CH3_DEFENSE")) {
      await page.keyboard.press("Escape");
      await page.click(".btn-save");
    }
    expect(await page.evaluate(({ key, savedStage }) => JSON.parse(localStorage.getItem(key)).stage.stage === savedStage, { key: SAVE_KEY, savedStage }), `saved ${savedStage} (won=${won})`);
    await page.reload({ waitUntil: "networkidle" });
    await page.click(".btn-continue");
    await waitForCond(page, () => window.__game.started);
    const state = await page.evaluate(() => ({ stage: window.__game.quests.stage, active: window.__game.defense.active, rite: window.__game.quests.flags.riteDone }));
    expect(state.stage === expected && !state.active && state.rite, `${savedStage} won=${won} restores ${expected}, keeps offerings paid`);
    if (expected === "CH3_RITE") {
      expect(await page.evaluate(() => window.__game.quests.onTalk("watari")), "Watari still offers departure/retry");
      await advanceToChoice(page);
      await page.locator(".choice-panel button").first().click();
      await waitForCond(page, () => window.__game.defense.active);
      expect(await page.evaluate(() => window.__game.quests.flags.riteDone), "retry does not repeat the offering ritual");
      await page.evaluate(() => { window.__game.defense.active = false; });
    }
    if (expected === "CH3_FAREWELL") {
      expect(await page.evaluate(() => window.__game.quests.onTalk("watari")), "victory can continue to farewell");
      // Reload next iteration instead of completing the ending animation here.
      await page.reload({ waitUntil: "networkidle" });
      await page.click(".btn-continue");
      await waitForCond(page, () => window.__game.started);
    }
  }
  expect(errors.length === 0, `no runtime errors: ${JSON.stringify(errors)}`);
  console.log("raid-save.test: PASS");
} finally { await browser.close(); }
