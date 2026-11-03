import assert from 'node:assert/strict';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await page.goto(new URL('/',process.env.STUDIO_URL).href);
  await page.locator('article').filter({has:page.getByRole('heading',{name:'ガーゴイル'})})
    .getByRole('link',{name:'参照画とゲーム表示を比較'}).click();
  const designs = new Set();
  for (const [label,mode] of [['飛行','flight'],['地上','ground'],['飛行','flight']]) {
    await page.selectOption('#variant',{label});
    await page.waitForFunction(() => window.__monsterPreview?.ready());
    designs.add(await page.locator('#ref-a').getAttribute('src'));
    for (const direction of DIRECTIONS) {
      await page.click(`[data-direction="${direction}"]`);
      for (const pose of ['a','b']) {
        await page.selectOption('#pose',pose);
        const displayed = await page.evaluate(() => {
          const rig = window.__monsterPreview.rigs[1];
          return {url:rig.material.map.image.src,direction:rig.direction,y:rig.mesh.position.y};
        });
        assert.ok(displayed.url.endsWith(`gargoyle_${mode}_code_idle_${pose}_8dir.png`));
        assert.equal(displayed.direction,direction);
        assert.equal(displayed.y,mode==='flight'?.9:.5);
      }
    }
    await page.selectOption('#pose','auto');
    const initial = await page.evaluate(() => window.__monsterPreview.rigs[1].usingA);
    await page.waitForFunction(a=>window.__monsterPreview.rigs[1].usingA!==a,initial);
  }
  assert.equal(designs.size,2,'飛行と地上で参照画も切り替わる');
} finally { await browser.close(); }
