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
        neckAngles: p.rigs[1].heads.map(h => {
          const start = h.neck[0].position.clone().project(p.camera);
          const end = h.neck.at(-1).position.clone().project(p.camera);
          const canvas = document.querySelector('canvas');
          return Math.atan2(Math.abs(end.y - start.y) * canvas.clientHeight,
            Math.abs(end.x - start.x) * canvas.clientWidth / 2) * 180 / Math.PI;
        }),
      };
    });
    assert.deepEqual(result.counts, [2, 3]);
    assert.ok(result.frozen);
    assert.ok(result.directions.every(d => d === direction));
    assert.ok(result.bounds.every(v => Math.abs(v[0]) < 1 && Math.abs(v[1]) < 1), '頭が画面内に収まる');
    if (direction === 'front') for (const i of [0, 2]) {
      assert.ok(result.neckAngles[i] >= 35 && result.neckAngles[i] <= 60,
        `左右の首は正面で約45度に立ち上がる: ${result.neckAngles[i]}`);
    }
    images.add(result.data);
    await page.locator('.stage').screenshot({ path: fileURLToPath(new URL(`${direction}.png`, output)) });
  }
  assert.equal(images.size, 8);
  // 頭だけの描画と、接続する首を足した描画を比較する。
  // 頭の不透明な内部が変われば、首が頭の手前へ突き抜けている。
  for (const direction of DIRECTIONS) {
    const overwritten = await page.evaluate(async direction => {
      const p = window.__dragonPreview;
      p.setState({ direction, paused: true }); p.pose();
      const rig = p.rigs[1];
      const THREE = await import('/games/ch4-5/node_modules/three/build/three.module.js');
      // MSAAの境界サンプル混合を避け、頭の不透明画素の深度だけを検査する。
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      renderer.outputColorSpace = p.renderer.outputColorSpace;
      renderer.setSize(1072, 480, false);
      const visibility = [];
      p.scene.traverse(o => visibility.push([o, o.visible]));
      const width = renderer.domElement.width, height = renderer.domElement.height;
      const gl = renderer.getContext();
      const capture = () => {
        renderer.render(p.scene, p.camera);
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
      };
      let changed = 0, covered = 0, maxDelta = 0;
      try {
        renderer.setScissorTest(false); renderer.setViewport(0, 0, width, height);
        p.scene.children.forEach(o => { o.visible = o.isLight || o === rig.group; });
        for (const head of rig.heads) {
          rig.group.children.forEach(o => { o.visible = o === head.sprite.group; });
          const alone = capture();
          head.neck.forEach(s => { s.visible = true; });
          const joined = capture();
          for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            if ([-width - 1, -width, -width + 1, -1, 0, 1, width - 1, width, width + 1]
              .some(offset => alone[i + offset * 4 + 3] !== 255)) continue;
            covered++;
            const delta = Math.max(...[0, 1, 2].map(channel => Math.abs(alone[i + channel] - joined[i + channel])));
            maxDelta = Math.max(maxDelta, delta);
            if (delta > 2) changed++;
          }
        }
        return { changed, covered, maxDelta };
      } finally {
        visibility.forEach(([o, visible]) => { o.visible = visible; }); renderer.dispose(); p.draw();
      }
    }, direction);
    assert.ok(overwritten.covered > 300, `${direction}: 三頭の内部を検査できる`);
    assert.equal(overwritten.changed, 0, `${direction}: 首が頭の表面を覆わない ${JSON.stringify(overwritten)}`);
  }
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
