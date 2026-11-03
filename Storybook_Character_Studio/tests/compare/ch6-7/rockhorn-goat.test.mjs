import assert from 'node:assert/strict';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('/compare/ch4-5/monsters/?c=volcano_lizard', process.env.STUDIO_URL).href);
  await page.getByRole('link', {name:'岩角ヤギ'}).click();
  await page.waitForFunction(() => window.__monsterPreview?.ready());
  const drawings = new Set();
  for (const direction of DIRECTIONS) {
    await page.click(`[data-direction="${direction}"]`);
    for (const pose of ['a','b']) {
      await page.selectOption('#pose',pose);
      const result = await page.evaluate(() => {
        const preview = window.__monsterPreview;
        preview.draw();
        // 右側だけを読み取り、参照画や方向ボタンの変化を描画の差として数えない。
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const scene = document.querySelector('#scene');
        ctx.drawImage(scene,scene.width/2,0,scene.width/2,scene.height,0,0,128,128);
        return { image: canvas.toDataURL(), directions: preview.rigs.map(r=>r.direction),
          poses: preview.rigs.map(r=>r.usingA), size: preview.rigs.map(r=>r.material.map.image.width) };
      });
      assert.deepEqual(result.size,[512,512]);
      assert.deepEqual(result.directions,[direction,direction]);
      assert.deepEqual(result.poses,[pose==='a',pose==='a']);
      drawings.add(result.image);
    }
  }
  assert.equal(drawings.size,16);
  await page.check('#water');
  assert.ok(await page.evaluate(() => window.__monsterPreview.rigs.every(r=>r.material.color.getHex()!==0xffffff)));
  await page.selectOption('#pose','auto');
  const initial = await page.evaluate(() => window.__monsterPreview.rigs[1].usingA);
  await page.waitForFunction(a => window.__monsterPreview.rigs[1].usingA !== a, initial);
  await page.click('#rotate');
  await page.waitForFunction(() => window.__monsterPreview.state.direction !== 'front_right');
  await page.goto(new URL('/compare/ch6-7/rockhorn-goat/',process.env.STUDIO_URL).href);
  await page.waitForFunction(() => window.__monsterPreview?.id === 'rockhorn_goat' && window.__monsterPreview.ready());
  assert.deepEqual(errors,[]);
} finally { await browser.close(); }
