// 共通の再生エンジン（story-movies/shared/engine.py）で作ったムービーのブラウザーテスト。
// Studioのルートで npm.cmd run test:movie -- <フォルダ名>（例: ch3-departure）。プロローグは test:prologue。
// 空いているポートでこのStudioのサーバーを新しく起動し、ゲーム（第1～3章）のテスト用ブラウザーで実際に再生する。
// 各場面の静止画、自動再生の完走（場面の順番・タイトル・所要時間）、クリックでの送りとタイトルの停止点、
// スキップ・Esc・再再生、モーション軽減、スマートフォンの縦・横、ページのエラーがないことを確かめ、
// 静止画を story-movies/<フォルダ名>/screenshots/ に保存する（Git管理しない）。
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { findOrStartStudio } from '../../tools/lib/studio-launch.mjs';
import { launchBrowser } from '../../../dqb3-tsugumono-ch1-3/tests/helpers.mjs';
import { MOVIES } from '../../story-movies/catalog.mjs';

const slug = process.argv[2];
const movie = MOVIES.find(m => m.slug === slug);
if (!movie || slug === 'prologue') {
  console.error(`使い方: npm.cmd run test:movie -- <フォルダ名>（${MOVIES.filter(m => m.status !== 'planned' && m.slug !== 'prologue').map(m => m.slug).join(' / ') || 'まだありません'}）`);
  process.exit(2);
}
const root = fileURLToPath(new URL('../../', import.meta.url));
const shots = fileURLToPath(new URL(`../../story-movies/${slug}/screenshots/`, import.meta.url));
// 計画の長さ（例「大・30～35秒」「中・約18秒」）から、自動再生の所要時間の許容範囲を作る
const nums = (movie.length.match(/\d+/g) || []).map(Number);
const [minSec, maxSec] = nums.length > 1 ? [nums[0] - 2, nums[1] + 3] : [nums[0] - 4, nums[0] + 4];

await mkdir(shots, { recursive: true });
const { url, child } = await findOrStartStudio(root, { ports: [0] });
const pageUrl = new URL(`story-movies/${slug}/`, url).href;
const browser = await launchBrowser();
const errors = [];
const results = [];
const ok = msg => { results.push(msg); console.log(`PASS: ${msg}`); };

async function open(options = {}, query = '') {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, ...options });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(pageUrl + query, { waitUntil: 'load' });
  await page.waitForFunction(() => window.ShokuMovie);
  return { context, page };
}
const state = page => page.locator('#movie').getAttribute('data-state');
const still = (page, scene, t) => page.evaluate(([i, t]) => window.ShokuMovie.player.still(i - 1, t), [scene, t]);
const current = page => page.evaluate(() => [...document.querySelectorAll('.scene')].at(-1)?.dataset.scene);

try {
  const story = await (async () => { const { context, page } = await open(); const s = await page.evaluate(() => window.ShokuMovie.story); await context.close(); return s; })();
  const ids = story.scenes.map(s => s.id);
  const last = story.scenes.at(-1);
  const titleCue = (last.cues || []).find(c => c.action === 'title');

  // ---- 1. デスクトップ：開始画面、各場面の静止画（字幕の出ている時刻と、終わり近く） ----
  {
    const { context, page } = await open();
    assert.equal(await state(page), 'idle');
    assert.ok(await page.locator('[data-action="play"]').isVisible());
    assert.equal(await page.locator('.pips li').count(), ids.length);
    await page.screenshot({ path: `${shots}start.png` });
    for (const [i, scene] of story.scenes.entries()) {
      const times = [...new Set([Math.min(scene.duration, (scene.captions[0]?.in ?? 0) + 1600), scene.duration - 400])];
      for (const t of times) {
        const r = await still(page, i + 1, t);
        assert.equal(r.scene, scene.id);
        await page.waitForTimeout(200);
        await page.screenshot({ path: `${shots}scene-${i + 1}-${t}.png` });
      }
      // 字幕の出る時刻には、その字幕が表示される
      const c = scene.captions[0];
      await still(page, i + 1, c.in + 100);
      assert.ok((await page.locator('.caption-line.is-shown').allInnerTexts()).includes(c.text), `${scene.id}: caption "${c.text}"`);
    }
    if (titleCue) {
      await still(page, ids.length, last.duration - 200);
      assert.ok(await page.locator('.title-card.is-shown').isVisible(), 'title card');
    }
    ok(`start panel and stills of ${ids.length} scenes (screenshots saved)`);
    await context.close();
  }

  // ---- 2. 自動再生を最後まで ----
  {
    const { context, page } = await open();
    await page.evaluate(() => {
      const root = document.getElementById('movie');
      window.__log = { scenes: [], title: false, end: null, start: performance.now(), frames: [] };
      root.addEventListener('storyscene', e => window.__log.scenes.push([e.detail.scene, performance.now() - window.__log.start]));
      root.addEventListener('storyend', e => { window.__log.end = [e.detail.skipped, performance.now() - window.__log.start]; });
      new MutationObserver(() => { if (document.querySelector('.title-card.is-shown')) window.__log.title = true; })
        .observe(document.querySelector('.title-card'), { attributes: true });
      let prev = performance.now();
      const frame = now => { const s = window.__log.scenes.at(-1); if (s) window.__log.frames.push([s[0], now - prev]); prev = now; if (!window.__log.end) requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    });
    await page.locator('[data-action="play"]').click();
    await page.waitForFunction(() => window.__log.end, null, { timeout: 90000 });
    const log = await page.evaluate(() => window.__log);
    assert.deepEqual(log.scenes.map(s => s[0]), ids);
    assert.equal(log.end[0], false);
    if (titleCue) assert.ok(log.title, 'title shown');
    const seconds = log.end[1] / 1000;
    assert.ok(seconds > minSec && seconds < maxSec, `total ${seconds.toFixed(1)}s (plan: ${movie.length})`);
    assert.equal(await state(page), 'ended');
    const fps = ids.map(id => { const f = log.frames.filter(x => x[0] === id).map(x => x[1]); return `${id} ${(1000 / (f.reduce((a, b) => a + b, 0) / f.length)).toFixed(0)}fps`; });
    ok(`autoplay completes in ${seconds.toFixed(1)}s (${fps.join(', ')}; headless software rendering)`);
    await page.locator('[data-action="replay"]').click();
    await page.waitForFunction(id => document.querySelector('.scene')?.dataset.scene === id, ids[0]);
    await page.waitForTimeout(800);
    await page.locator('[data-action="skip"]').click();
    await page.waitForFunction(() => document.getElementById('movie').dataset.state === 'ended', null, { timeout: 3000 });
    ok('replay starts from scene 1, the skip button ends it');
    await context.close();
  }

  // ---- 3. クリックで送る（タイトルの停止点）・Enterで再再生・Escでスキップ ----
  {
    const { context, page } = await open();
    await page.locator('[data-action="play"]').click();
    for (let i = 1; i < ids.length; i++) {
      await page.waitForTimeout(450);
      await page.mouse.click(640, 400);
      await page.waitForFunction(id => [...document.querySelectorAll('.scene')].at(-1)?.dataset.scene === id, ids[i]);
    }
    if (titleCue) {
      await page.waitForTimeout(450);
      await page.mouse.click(640, 400);
      await page.waitForSelector('.title-card.is-shown');
      assert.equal(await current(page), ids.at(-1));
      assert.equal(await state(page), 'playing');
    }
    await page.waitForTimeout(450);
    await page.mouse.click(640, 400);
    await page.waitForFunction(() => document.getElementById('movie').dataset.state === 'ended', null, { timeout: 5000 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.getElementById('movie').dataset.state === 'playing');
    await page.waitForTimeout(600);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('movie').dataset.state === 'ended', null, { timeout: 3000 });
    ok(`click advances scene by scene${titleCue ? ' and stops at the title' : ''}; Enter replays; Esc skips`);
    await context.close();
  }

  // ---- 4. モーション軽減：カメラと .mv の動きを止める ----
  {
    const { context, page } = await open({ reducedMotion: 'reduce' });
    assert.ok(await page.locator('#movie.is-reduced').count());
    for (let i = 1; i <= ids.length; i++) {
      await still(page, i, 2000);
      const moving = await page.evaluate(() => [...document.querySelectorAll('.scene.is-active .mv')].filter(e => getComputedStyle(e).animationName !== 'none').length);
      assert.equal(moving, 0, `scene ${i}: .mv stopped`);
    }
    await page.evaluate(() => window.ShokuMovie.player.destroy());
    await page.locator('[data-action="play"]').click();
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => document.querySelector('.scene-cam').getAnimations().length), 0, 'camera does not move');
    ok('reduced motion stops the camera and moving elements');
    await context.close();
  }

  // ---- 5. スマートフォン縦・横 ----
  for (const [name, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
    const { context, page } = await open({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    for (let i = 1; i <= ids.length; i++) {
      const longest = story.scenes[i - 1].captions.reduce((a, c) => Math.max(a, c.in + 200), 0);
      await still(page, i, Math.min(longest, story.scenes[i - 1].duration - 100));
      const m = await page.evaluate(() => {
        const rect = el => el.getBoundingClientRect();
        const lines = [...document.querySelectorAll('.caption-line.is-shown')].map(rect);
        return { overflow: document.documentElement.scrollWidth - innerWidth, w: innerWidth, h: innerHeight, stage: rect(document.querySelector('.stage')),
          lines: lines.map(r => [r.left, r.right, r.top, r.bottom]), font: parseFloat(getComputedStyle(document.querySelector('.captions')).fontSize) };
      });
      assert.ok(m.overflow <= 0, `${name} scene ${i}: no horizontal scroll`);
      for (const [l, r, t, b] of m.lines) assert.ok(l >= 0 && r <= m.w && t >= 0 && b <= m.h, `${name} scene ${i}: caption inside the screen`);
      if (name === 'portrait') for (const [, , t] of m.lines) assert.ok(t >= m.stage.bottom, `${name} scene ${i}: captions below the picture`);
      assert.ok(m.font >= 14, `${name}: caption font ${m.font}px`);
      if (i === 2 || i === 3) await page.screenshot({ path: `${shots}mobile-${name}-scene-${i}.png` });
    }
    await page.evaluate(() => window.ShokuMovie.player.destroy());
    await page.locator('[data-action="play"]').tap();
    await page.waitForTimeout(500);
    const skip = await page.locator('[data-action="skip"]').boundingBox();
    assert.ok(skip.height >= 44 && skip.width >= 44, `${name}: skip button ${skip.width}x${skip.height}`);
    // タップで次の場面へ（1場面だけのムービー＝書の復活は、送る先がないので省く）
    if (ids.length > 1) {
      await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
      await page.waitForFunction(id => [...document.querySelectorAll('.scene')].at(-1)?.dataset.scene === id, ids[1]);
    }
    await page.locator('[data-action="skip"]').tap();
    await page.waitForFunction(() => document.getElementById('movie').dataset.state === 'ended', null, { timeout: 3000 });
    ok(`mobile ${name}: fits the screen with readable captions in every scene, tap to advance, skip button`);
    await context.close();
  }

  assert.deepEqual(errors, []);
  ok('no page errors, console errors or failed requests');
} finally {
  await browser.close();
  if (child?.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
}
console.log(`\nPASS ${results.length} checks. Screenshots: ${shots}`);
