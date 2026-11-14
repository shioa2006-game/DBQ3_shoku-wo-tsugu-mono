import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

const output = new URL('../../../work/varuga/motions/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(new URL('/compare/ch6-7/varuga/', process.env.STUDIO_URL).href);
  await page.waitForFunction(() => window.__dragonPreview?.ready());
  const cases = { ground: [0, 1.2], landing: [0, .8, 1.6, 2.6], bite: [.4, .72, 1.77, 2.82, 4.6], flame: [.6, 1.7, 3.8, 4.5], air_flame: [.6, 1.7, 4.5] };
  for (const [mode, times] of Object.entries(cases)) {
    await page.selectOption('#mode', mode);
    for (const direction of DIRECTIONS) {
      await page.click(`[data-direction="${direction}"]`);
      for (const time of times) {
        const result = await page.evaluate(async ({ mode, time }) => {
          const p = window.__dragonPreview;
          p.setState({ mode, paused: true }); p.pose(time);
          const r = p.rigs[1];
          const THREE = await import('/games/ch4-5/node_modules/three/build/three.module.js');
          const before = document.querySelector('canvas').toDataURL(); p.step(0);
          return {
            frozen: before === document.querySelector('canvas').toDataURL(),
            feet: r.body.group.position.y + r.body.mesh.scale.y * .032,
            ground: r.poseState.grounded,
            wingBottom: Math.min(...r.wings.map(w => new THREE.Box3().setFromObject(w.pivot).min.y)),
            tailBottom: Math.min(...r.tail.map(s => s.position.y - s.geometry.parameters.radius)),
            connected: r.heads.every(h => h.neck.every((s, i) => !i || s.position.distanceTo(h.neck[i-1].position) < s.geometry.parameters.radius + h.neck[i-1].geometry.parameters.radius)),
            behindHead: r.heads.every(h => h.neck.slice(Math.ceil(h.neck.length * .65)).every(s =>
              h.sprite.group.position.z - s.position.z - s.geometry.parameters.radius >= .059)),
            flame: r.heads.map(h => h.flame.particles.some(p => p.sprite.visible)),
            open: r.heads.map(h => h.sprite.material.map === h.openTexture),
          };
        }, { mode, time });
        assert.ok(result.frozen, `${mode}/${direction}/${time}: 停止中は炎も静止`);
        assert.ok(result.connected, `${mode}/${direction}/${time}: 首が連続する`);
        assert.ok(result.behindHead, `${mode}/${direction}/${time}: 首先が頭の手前に突き出さない`);
        if (result.ground === 1) {
          assert.ok(Math.abs(result.feet) < .001, '足が床に接地する');
          assert.ok(result.wingBottom >= -.02, `畳んだ翼が床に入らない ${result.wingBottom}`);
          assert.ok(result.tailBottom >= 0, '尾が床に入らない');
        }
        if (['flame', 'air_flame'].includes(mode) && time === 1.7) {
          assert.deepEqual(result.flame, [true, true, true]);
          assert.deepEqual(result.open, [true, true, true]);
        }
        if (['flame', 'air_flame'].includes(mode) && time === 4.5) {
          assert.deepEqual(result.flame, [false, false, false]);
          assert.deepEqual(result.open, [false, false, false]);
        }
        if (['front', 'front_left', 'left', 'back'].includes(direction)) {
          await page.locator('.stage').screenshot({ path: fileURLToPath(new URL(`${mode}-${direction}-${time}.png`, output)) });
        }
      }
    }
  }
  await page.selectOption('#mode', 'bite');
  await page.locator('#time').fill('4.55'); await page.locator('#time').dispatchEvent('input');
  await page.click('#motion');
  await page.waitForFunction(() => window.__dragonPreview.state.paused && window.__dragonPreview.rigs[1].motionTime >= 4.6);
  await page.click('#restart');
  assert.ok(await page.evaluate(() => window.__dragonPreview.rigs[1].motionTime < .5));
  await page.selectOption('#mode', 'ground');
  assert.equal(await page.locator('#timeline').isVisible(), false);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
