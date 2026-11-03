import assert from 'node:assert/strict';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await page.goto(new URL('/',process.env.STUDIO_URL).href);
  await page.locator('article').filter({has: page.getByRole('heading',{name:'小岩ガニ'})})
    .getByRole('link',{name:'参照画とゲーム表示を比較'}).click();
  await page.waitForFunction(() => window.__monsterPreview?.ready());
  for (const direction of DIRECTIONS) {
    await page.click(`[data-direction="${direction}"]`);
    for (const pose of ['a','b']) {
      await page.selectOption('#pose',pose);
      const state = await page.evaluate(() => {
        const [original,drawn] = window.__monsterPreview.rigs;
        return [original.direction,drawn.direction,drawn.material.map.image.src,drawn.usingA];
      });
      assert.deepEqual(state.slice(0,2),[direction,direction]);
      assert.ok(state[2].endsWith(`small_rock_crab_code_idle_${pose}_8dir.png`));
      assert.equal(state[3],pose==='a');
    }
  }
  await page.selectOption('#variant',{label:'大岩ガニ（拡大試作）'});
  await page.waitForFunction(() => window.__monsterPreview.ready());
  assert.equal(await page.evaluate(()=>window.__monsterPreview.rigs[1].mesh.scale.x),2);
} finally { await browser.close(); }
