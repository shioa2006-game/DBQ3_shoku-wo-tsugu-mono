// Studioの公式比較ページで8方向・歩行・道具動作を確認。既存のゲームサーバーは使わない。
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS, LABELS } from '../../../prototypes/shared/sheet-format.mjs';

export async function checkCharacter(id, name) {
const out = name => new URL(`../../../compare/ch4-5/characters/${name}`, import.meta.url);
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1120, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(new URL(`compare/ch4-5/characters/?c=${id}`, process.env.STUDIO_URL || 'http://127.0.0.1:8081/').href);
  await page.waitForFunction(() => window.__heroPreview?.ready());
  assert.match(await page.title(), new RegExp(`${name}.*ダーマ再興編`));
  assert.match(await page.locator('#production-note').textContent(), /制作中/);
  const sheets = await page.evaluate(() => window.__heroPreview.rigs.map(r => [r.headTexture.image.src, r.bodyTexture.image.src]));
  assert.ok(sheets[1][0].endsWith(`/${id}-8dir/output/${id}_code_head_layer_8dir.png`));
  assert.ok(sheets[1][1].endsWith(`/${id}-8dir/output/${id}_code_torso_layer_8dir.png`));
  assert.ok(sheets[0][0].endsWith(`/${id}-8dir/output/reference-normalized.png`));
  const shots = [];
  for (const [i, direction] of DIRECTIONS.entries()) {
    const result = await page.evaluate(({ direction }) => {
      const h = window.__heroPreview; h.state.paused = true;
      h.camera.zoom = 1.85; h.camera.updateProjectionMatrix();
      h.setState({ direction, action: 'idle', tool: '', auto: false }); h.pose(0);
      return { url: h.renderer.domElement.toDataURL('image/png'), snap: h.snapshot() };
    }, { direction });
    assert.deepEqual(result.snap.directions, [direction, direction]);
    assert.deepEqual(result.snap.textureSizes, [[512, 256], [512, 256]]);
    shots.push({ url: result.url, label: LABELS[i] });
  }
  const board = await page.evaluate(async ({shots, name}) => {
    const imgs = await Promise.all(shots.map(async s => { const im = new Image(); im.src = s.url; await im.decode(); return im; }));
    const c = document.createElement('canvas'); c.width = 1600; c.height = 800;
    const g = c.getContext('2d'); g.fillStyle = '#eee9df'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#203344'; g.font = 'bold 26px sans-serif'; g.fillText(`${name}・3Dリグ / 左：元画像　右：SVG`, 24, 38);
    imgs.forEach((im, i) => {
      const x = i % 4 * 400, y = 60 + Math.floor(i / 4) * 365;
      // それぞれの半画面の中央を切り出す。縦横別倍率で人物を細長くしない。
      const sh = im.height * .96, sw = sh * 200 / 320, half = im.width / 2;
      for (let side = 0; side < 2; side++) g.drawImage(im, side * half + (half - sw) / 2, im.height * .02, sw, sh, x + side * 200, y, 200, 320);
      g.font = '20px sans-serif'; g.fillText(shots[i].label, x + 16, y + 346);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, {shots, name});
  await writeFile(out(`${id}-rig-8dir.png`), Buffer.from(board, 'base64'));
  for (const [action, time, tool] of [['idle', 0, ''], ['walk', .35, ''], ['walk', .95, ''], ['attack', .4, 'hammer_stone'], ['attack', .4, 'sword_iron']]) {
    const result = await page.evaluate(({ action, time, tool }) => {
      const h = window.__heroPreview; h.state.paused = true;
      h.setState({ action, tool, gridSide: 'generated', auto: false }); h.pose(time);
      return { url: h.grid.renderer.domElement.toDataURL('image/png'), snap: h.grid.snapshot(),
        valid: h.grid.sets.generated.every(r => r.head.position.toArray().every(Number.isFinite) && r.body.position.toArray().every(Number.isFinite)) };
    }, { action, time, tool });
    assert.deepEqual(result.snap.directions, DIRECTIONS);
    assert.deepEqual(result.snap.tools, DIRECTIONS.map(() => tool || null));
    assert.ok(result.valid, '全方向の頭・胴の座標が有限');
    await writeFile(out(`${id}-rig-${action}-${time}-${tool || 'none'}.png`), Buffer.from(result.url.split(',')[1], 'base64'));
  }
  await page.click('[data-grid-side="original"]');
  assert.equal(await page.evaluate(() => window.__heroPreview.grid.side), 'original');
  await page.click('[data-grid-side="generated"]');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { const h = window.__heroPreview; h.setState({ action: 'idle', tool: '', water: true }); h.pose(0); });
  assert.equal(await page.evaluate(() => window.__heroPreview.grid.snapshot().columns), 2);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '狭い画面で横にはみ出さない');
  assert.deepEqual(errors, [], 'ブラウザーにエラーがない');
  console.log(`${name}: 8方向・待機・歩行2位相・ハンマーと剣・水中色・390px幅を確認しました。`);
} finally { await browser.close(); }

}
