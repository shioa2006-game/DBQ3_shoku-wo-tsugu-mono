import { launchBrowser, openGame, newGame, expect, waitForCond, dlg } from "../helpers.mjs";
import { B } from "../../src/world/blocks.js";
import { checkInteractions } from "../../../game-shared/tests/interaction-check.mjs";

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);
  await checkInteractions(page, { expect, waitForCond, dlg, blocks: { CHEST: B.CHEST, STONE: B.STONE, BED: B.BED } });
  expect(errors.length === 0, `コンソールエラーなし (${JSON.stringify(errors)})`);
  console.log("interaction.test: PASS");
} finally {
  await browser.close();
}
