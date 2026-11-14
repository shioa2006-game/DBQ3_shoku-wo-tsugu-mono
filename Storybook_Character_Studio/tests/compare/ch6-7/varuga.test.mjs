import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

const output = new URL('../../../work/varuga/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(new URL('/', process.env.STUDIO_URL).href);
  await page.getByRole('link', { name: 'グロムと三頭の造形を比較' }).click();
  await page.waitForFunction(() => window.__dragonPreview?.ready());
  const images = new Set();
  for (const direction of DIRECTIONS) {
    await page.click(`[data-direction="${direction}"]`);
    const result = await page.evaluate(() => {
      const p = window.__dragonPreview;
      p.pose();
      const data = document.querySelector('canvas').toDataURL();
      p.step(0);
      return {
        data, frozen: data === document.querySelector('canvas').toDataURL(),
        counts: p.rigs.map(r => r.heads.length),
        directions: p.rigs.flatMap(r => [r.body, ...r.heads.map(h => h.sprite)].map(s => s.direction)),
        bounds: p.rigs[1].heads.map(h => {
          const v = h.sprite.group.position.clone(); v.y += p.rigs[1].config.headScale;
          return v.project(p.camera).toArray();
        }),
      };
    });
    assert.deepEqual(result.counts, [2, 3]);
    assert.ok(result.frozen);
    assert.ok(result.directions.every(d => d === direction));
    assert.ok(result.bounds.every(v => Math.abs(v[0]) < 1 && Math.abs(v[1]) < 1), '頭が画面内に収まる');
    images.add(result.data);
    await page.locator('.stage').screenshot({ path: fileURLToPath(new URL(`${direction}.png`, output)) });
  }
  assert.equal(images.size, 8);
  // 長い中央の首を含め、浮遊中も隣接する球が連続してつながる。
  for (const time of [0, .8, 1.6, 3.2, 5.4]) {
    const connected = await page.evaluate(time => {
      const p = window.__dragonPreview; p.pose(time);
      return p.rigs[1].heads.every(h => h.neck.every((s, i) => i === 0 ||
        s.position.distanceTo(h.neck[i - 1].position) < s.geometry.parameters.radius + h.neck[i - 1].geometry.parameters.radius));
    }, time);
    assert.ok(connected, `時刻${time}でも首が途切れない`);
  }
  await page.getByRole('button', { name: '浮遊を再生' }).click();
  const t = await page.evaluate(() => window.__dragonPreview.rigs[1].time);
  await page.waitForFunction(t => window.__dragonPreview.rigs[1].time > t + .3, t);
  await page.getByRole('button', { name: '静止する' }).click();
  await page.getByRole('button', { name: '8方向を順に見る' }).click();
  await page.waitForFunction(() => window.__dragonPreview.state.direction === 'front');
  await page.click('[data-direction="front_left"]');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('.stage').screenshot({ path: fileURLToPath(new URL('mobile.png', output)) });
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
