// SVGストーリームービーの一覧（story-movies/）のブラウザーテスト。Studioのルートで npm.cmd run test:movie-list。
// 空いているポートでこのStudioのサーバーを新しく起動し、ゲーム（第1～3章）のテスト用ブラウザーで表示する。
// 一覧の並び（物語の順・作る順）、試作済みムービーの静止画と再生への移動、トップページからのリンク、スマートフォン幅を確かめ、
// 画面を story-movies/screenshots/ に保存する（Git管理しない）。
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { findOrStartStudio } from '../../tools/lib/studio-launch.mjs';
import { launchBrowser } from '../../../dqb3-tsugumono-ch1-3/tests/helpers.mjs';
import { MOVIES, SAGAS, BUILD_STEPS } from '../../story-movies/catalog.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const shots = fileURLToPath(new URL('../../story-movies/screenshots/', import.meta.url));

await mkdir(shots, { recursive: true });
const { url, child } = await findOrStartStudio(root, { ports: [0] });
const listUrl = new URL('story-movies/', url).href;
const browser = await launchBrowser();
const errors = [];
const results = [];
const ok = msg => { results.push(msg); console.log(`PASS: ${msg}`); };

async function open(target, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, ...options });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(target, { waitUntil: 'load' });
  return { context, page };
}
const ids = page => page.locator('.movie').evaluateAll(cards => cards.map(c => c.dataset.id));
const groupTitles = page => page.locator('.group-title').allInnerTexts();
const made = MOVIES.filter(m => m.status !== 'planned');

try {
  // ---- 1. トップページから一覧へ ----
  {
    const { context, page } = await open(url);
    await page.getByRole('link', { name: 'SVGストーリームービーの一覧' }).click();
    await page.waitForURL(listUrl);
    await page.waitForFunction(() => window.StoryMovieList);
    assert.equal(await page.locator('.movie').count(), MOVIES.length);
    ok(`studio top links to the list of ${MOVIES.length} movies`);
    await context.close();
  }

  // ---- 2. 物語の順：編ごとの見出し、試作済みの静止画、再生への移動 ----
  {
    const { context, page } = await open(listUrl);
    await page.waitForFunction(() => window.StoryMovieList);
    assert.deepEqual(await groupTitles(page), SAGAS.map(s => s.title));
    assert.deepEqual(await ids(page), MOVIES.map(m => m.id));
    assert.equal(await page.locator('[data-order="story"]').getAttribute('aria-pressed'), 'true');
    for (const m of made) {
      const frame = page.locator(`.movie[data-id="${m.id}"] .thumb iframe`);
      await page.locator(`.movie[data-id="${m.id}"] .thumb iframe.is-ready`).waitFor({ timeout: 15000 });
      const inner = page.frameLocator(`.movie[data-id="${m.id}"] .thumb iframe`);
      // プロローグのルートは #prologue、共通エンジンの2本目以降は #movie
      assert.equal(await inner.locator(m.slug === 'prologue' ? '#prologue' : '#movie').getAttribute('data-state'), 'still', `${m.id}: still picture`);
      // 1280×720で描いた静止画が、枠の幅に縮んで収まる
      const [box, thumb] = await Promise.all([frame.boundingBox(), page.locator(`.movie[data-id="${m.id}"] .thumb`).boundingBox()]);
      assert.ok(Math.abs(box.width - thumb.width) < 2 && Math.abs(box.height - thumb.height) < 2, `${m.id}: still fits ${box.width}x${box.height} in ${thumb.width}x${thumb.height}`);
    }
    for (const m of MOVIES.filter(m => m.status === 'planned'))
      assert.ok(await page.locator(`.movie[data-id="${m.id}"] .thumb.is-planned`).isVisible(), `${m.id}: placeholder`);
    await page.locator('.movie[data-id="M0"] details summary').click();
    assert.equal(await page.locator('.movie[data-id="M0"] details li').count(), MOVIES[0].scenes.length);
    await page.screenshot({ path: `${shots}list-story.png`, fullPage: true });
    ok(`story order: ${SAGAS.length} sagas, ${made.length} still(s) scaled into the card, placeholders for planned movies`);

    // 試作済みの絵をクリックすると、そのムービーの開始画面へ
    await page.locator('.movie[data-id="M0"] .thumb').click();
    await page.waitForURL(new URL(`story-movies/${MOVIES[0].slug}/`, url).href);
    await page.waitForFunction(() => window.ShokuPrologue);
    assert.equal(await page.locator('#prologue').getAttribute('data-state'), 'idle');
    await page.goBack();
    await page.waitForFunction(() => window.StoryMovieList);
    ok('clicking the still opens the movie');

    // ---- 3. 作る順：ボタンで切り替え、URLに残る ----
    await page.locator('[data-order="build"]').click();
    await page.waitForURL(/\?order=build$/);
    const steps = BUILD_STEPS.filter(s => MOVIES.some(m => m.buildStep === s.step));
    assert.equal((await groupTitles(page)).length, steps.length);
    for (const s of steps) {
      const inGroup = await page.locator(`.group[data-group="step-${s.step}"] .movie`).evaluateAll(cards => cards.map(c => c.dataset.id));
      assert.deepEqual(inGroup, MOVIES.filter(m => m.buildStep === s.step).map(m => m.id), `step ${s.step}`);
    }
    await page.reload();
    await page.waitForFunction(() => window.StoryMovieList);
    assert.equal(await page.locator('[data-order="build"]').getAttribute('aria-pressed'), 'true');
    for (const m of made) await page.locator(`.movie[data-id="${m.id}"] .thumb iframe.is-ready`).waitFor({ timeout: 15000 });
    await page.waitForTimeout(500);   // 静止画のフェードイン
    await page.screenshot({ path: `${shots}list-build.png`, fullPage: true });
    await page.locator('[data-order="story"]').click();
    assert.equal(new URL(page.url()).search, '');
    ok(`build order: ${steps.length} steps, kept after reload, back to story order`);
    await context.close();
  }

  // ---- 4. スマートフォン：1列、横にはみ出さない ----
  {
    const { context, page } = await open(listUrl, { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.waitForFunction(() => window.StoryMovieList);
    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth, width: innerWidth,
      lefts: [...new Set([...document.querySelectorAll('.movie')].map(c => Math.round(c.getBoundingClientRect().left)))],
      right: Math.max(...[...document.querySelectorAll('.movie')].map(c => c.getBoundingClientRect().right)),
    }));
    assert.ok(m.scroll <= m.width, `no horizontal scroll (${m.scroll} > ${m.width})`);
    assert.equal(m.lefts.length, 1, 'one column');
    assert.ok(m.lefts[0] >= 16 && m.width - m.right >= 16, `16px gutters (${m.lefts[0]}, ${m.width - m.right})`);
    const button = await page.locator('[data-order="build"]').boundingBox();
    assert.ok(button.height >= 36, `order button ${button.height}px`);
    await page.screenshot({ path: `${shots}list-mobile.png` });
    ok(`mobile: one column with ${m.lefts[0]}px gutters, no horizontal scroll`);
    await context.close();
  }

  assert.deepEqual(errors, []);
  ok('no page errors, console errors or failed requests');
} finally {
  await browser.close();
  if (child?.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
}
console.log(`\nPASS ${results.length} checks. Screenshots: ${shots}`);
