// プロローグ（story-movies/prologue/）のブラウザーテスト。Studioのルートで npm.cmd run test:prologue。
// 空いているポートでこのStudioのサーバーを新しく起動し、ゲーム（第1～3章）のテスト用ブラウザーで実際に再生する。
// 自動再生の完走・手動送り・スキップ・再再生・モーション軽減・スマートフォンの縦横を確かめ、
// 各場面の静止画を story-movies/prologue/screenshots/ に保存する（Git管理しない）。
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { findOrStartStudio } from '../../tools/lib/studio-launch.mjs';
import { launchBrowser } from '../../../dqb3-tsugumono-ch1-3/tests/helpers.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const shots = fileURLToPath(new URL('../../story-movies/prologue/screenshots/', import.meta.url));
const SCENES = ['peace-ends', 'monsters-return', 'dharma-falls', 'sion-escapes', 'zipangu-dawn'];
// 撮影する場面と時刻（ミリ秒）。第4場面は前半（全身）と後半（背中の書）、第5場面は字幕とタイトル。
const STILLS = [[1, 2600], [2, 3000], [3, 3600], [4, 2600], [4, 6000], [5, 3200], [5, 6600]];

await mkdir(shots, { recursive: true });
const { url, child } = await findOrStartStudio(root, { ports: [0] });
const pageUrl = new URL('story-movies/prologue/', url).href;
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
  await page.waitForFunction(() => window.ShokuPrologue);
  return { context, page };
}
const state = page => page.locator('#prologue').getAttribute('data-state');
const still = (page, scene, t) => page.evaluate(([i, t]) => window.ShokuPrologue.player.still(i - 1, t), [scene, t]);
const captions = page => page.locator('.caption-line.is-shown').allInnerTexts();

try {
  // ---- 1. デスクトップ：開始画面、各場面の静止画 ----
  {
    const { context, page } = await open();
    assert.equal(await state(page), 'idle');
    assert.ok(await page.locator('[data-action="play"]').isVisible());
    assert.equal(await page.locator('.pips li').count(), 5);
    await page.screenshot({ path: `${shots}start.png` });
    for (const [scene, t] of STILLS) {
      const r = await still(page, scene, t);
      assert.equal(r.scene, SCENES[scene - 1]);
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${shots}scene-${scene}-${t}.png` });
    }
    // 第4場面：前半の全身と後半の近い画は、どちらも正式デザインの部品で描かれる
    await still(page, 4, 2600);
    assert.ok(await page.locator('[id^="s4-sh-hero2-hm"]').count() > 0);
    assert.deepEqual(await captions(page), ['ただ一人、神殿から逃れた見習いがいた。', '少年の名は、シオン。']);
    await still(page, 4, 6000);
    assert.deepEqual(await captions(page), ['その背には、守り抜いた一冊の職業の書があった。']);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.s4-shotb')).opacity), '1');
    await still(page, 5, 6600);
    assert.ok(await page.locator('.title-card.is-shown').isVisible());
    ok('start panel and 7 stills of the 5 scenes (screenshots saved)');
    await context.close();
  }

  // ---- 2. 自動再生を最後まで（場面の順番・タイトル・所要時間・描画の滑らかさ） ----
  {
    const { context, page } = await open();
    await page.evaluate(() => {
      const root = document.getElementById('prologue');
      window.__log = { scenes: [], title: false, end: null, start: performance.now(), frames: [] };
      root.addEventListener('storyscene', e => window.__log.scenes.push([e.detail.scene, performance.now() - window.__log.start]));
      root.addEventListener('storyend', e => { window.__log.end = [e.detail.skipped, performance.now() - window.__log.start]; });
      new MutationObserver(() => { if (document.querySelector('.title-card.is-shown')) window.__log.title = true; })
        .observe(document.querySelector('.title-card'), { attributes: true });
      let last = performance.now();
      const frame = now => { const s = window.__log.scenes.at(-1); if (s) window.__log.frames.push([s[0], now - last]); last = now; if (!window.__log.end) requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    });
    await page.locator('[data-action="play"]').click();
    await page.waitForFunction(() => window.__log.end, null, { timeout: 60000 });
    const log = await page.evaluate(() => window.__log);
    assert.deepEqual(log.scenes.map(s => s[0]), SCENES);
    assert.equal(log.end[0], false);
    assert.ok(log.title, 'title shown');
    const seconds = log.end[1] / 1000;
    assert.ok(seconds > 28 && seconds < 34, `total ${seconds.toFixed(1)}s`);
    assert.equal(await state(page), 'ended');
    assert.ok(await page.locator('[data-action="replay"]').isVisible());
    const fps = SCENES.map(id => { const f = log.frames.filter(x => x[0] === id).map(x => x[1]); return `${id} ${(1000 / (f.reduce((a, b) => a + b, 0) / f.length)).toFixed(0)}fps`; });
    ok(`autoplay completes in ${seconds.toFixed(1)}s with the title (${fps.join(', ')}; headless software rendering)`);
    // 再再生 → スキップ（ボタン）
    await page.locator('[data-action="replay"]').click();
    await page.waitForFunction(() => document.querySelector('.scene')?.dataset.scene === 'peace-ends');
    assert.equal(await state(page), 'playing');
    await page.waitForTimeout(800);
    await page.locator('[data-action="skip"]').click();
    await page.waitForFunction(() => document.getElementById('prologue').dataset.state === 'ended', null, { timeout: 3000 });
    ok('replay starts from scene 1, the skip button ends it');
    await context.close();
  }

  // ---- 3. クリックで送る（タイトルの停止点）・Escでスキップ ----
  {
    const { context, page } = await open();
    await page.locator('[data-action="play"]').click();
    const current = () => page.evaluate(() => [...document.querySelectorAll('.scene')].at(-1)?.dataset.scene);
    for (let i = 1; i < 5; i++) {
      await page.waitForTimeout(450);
      await page.mouse.click(640, 400);
      await page.waitForFunction(id => [...document.querySelectorAll('.scene')].at(-1)?.dataset.scene === id, SCENES[i]);
    }
    await page.waitForTimeout(450);
    await page.mouse.click(640, 400);       // 第5場面の1回目：タイトルの停止点まで進む（タイトルを飛ばさない）
    await page.waitForSelector('.title-card.is-shown');
    assert.equal(await current(), 'zipangu-dawn');
    assert.equal(await state(page), 'playing');
    ok('click advances scene by scene and stops at the title');
    await page.waitForTimeout(450);
    await page.mouse.click(640, 400);
    await page.waitForFunction(() => document.getElementById('prologue').dataset.state === 'ended', null, { timeout: 5000 });
    await page.keyboard.press('Enter');     // 終了画面のボタンにフォーカスがある
    await page.waitForFunction(() => document.getElementById('prologue').dataset.state === 'playing');
    await page.waitForTimeout(600);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('prologue').dataset.state === 'ended', null, { timeout: 3000 });
    ok('last click finishes; Enter replays from the end panel; Esc skips');
    await context.close();
  }

  // ---- 4. モーション軽減：位置の動きを止め、字幕・フェード・夜明けは残る ----
  {
    const { context, page } = await open({ reducedMotion: 'reduce' });
    assert.ok(await page.locator('#prologue.is-reduced').count());
    await still(page, 4, 3000);
    const r = await page.evaluate(() => ({
      bob: getComputedStyle(document.querySelector('.s4-bob')).animationName,
      book: getComputedStyle(document.querySelector('.s4-book')).animationName,
    }));
    assert.equal(r.bob, 'none');
    assert.notEqual(r.book, 'none');
    await page.screenshot({ path: `${shots}reduced-scene-4-3000.png` });
    await page.evaluate(() => window.ShokuPrologue.player.destroy());
    await page.locator('[data-action="play"]').click();
    await page.waitForTimeout(1200);
    const cam = await page.evaluate(() => document.querySelector('.scene-cam').getAnimations().length);
    assert.equal(cam, 0, 'camera does not move');
    ok('reduced motion stops movement but keeps captions, fades and the book glow');
    await context.close();
  }

  // ---- 5. スマートフォン縦・横 ----
  for (const [name, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]]) {
    const { context, page } = await open({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const fit = async label => {
      const m = await page.evaluate(() => {
        const rect = el => el.getBoundingClientRect();
        const lines = [...document.querySelectorAll('.caption-line.is-shown')].map(rect);
        const skip = rect(document.querySelector('[data-action="skip"]'));
        return { overflow: document.documentElement.scrollWidth - innerWidth, w: innerWidth, h: innerHeight, stage: rect(document.querySelector('.stage')),
          lines: lines.map(r => [r.left, r.right, r.top, r.bottom]), font: parseFloat(getComputedStyle(document.querySelector('.captions')).fontSize), skip: [skip.width, skip.height] };
      });
      assert.ok(m.overflow <= 0, `${label}: no horizontal scroll`);
      for (const [l, r, t, b] of m.lines) assert.ok(l >= 0 && r <= m.w && t >= 0 && b <= m.h, `${label}: caption inside the screen`);
      assert.ok(m.font >= 14, `${label}: caption font ${m.font}px`);
      return m;
    };
    await still(page, 4, 2600);
    const m = await fit(`${name} scene 4`);
    if (name === 'portrait') for (const [, , t] of m.lines) assert.ok(t >= m.stage.bottom, 'portrait: captions below the picture');
    await page.screenshot({ path: `${shots}mobile-${name}-scene-4.png` });
    await still(page, 5, 6600);
    await fit(`${name} scene 5`);
    await page.screenshot({ path: `${shots}mobile-${name}-scene-5.png` });
    await page.evaluate(() => window.ShokuPrologue.player.destroy());
    await page.locator('[data-action="play"]').tap();
    await page.waitForTimeout(500);
    const skip = await page.locator('[data-action="skip"]').boundingBox();
    assert.ok(skip.height >= 44 && skip.width >= 44, `${name}: skip button ${skip.width}x${skip.height}`);
    await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
    await page.waitForFunction(() => [...document.querySelectorAll('.scene')].at(-1)?.dataset.scene === 'monsters-return');
    await page.locator('[data-action="skip"]').tap();
    await page.waitForFunction(() => document.getElementById('prologue').dataset.state === 'ended', null, { timeout: 3000 });
    ok(`mobile ${name}: fits the screen, readable captions, tap to advance, skip button ${skip.width.toFixed(0)}x${skip.height.toFixed(0)}`);
    await context.close();
  }

  assert.deepEqual(errors, []);
  ok('no page errors, console errors or failed requests');
} finally {
  await browser.close();
  if (child?.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
}
console.log(`\nPASS ${results.length} checks. Screenshots: ${shots}`);
