// SVGストーリームービーの一覧（story-movies/index.html・catalog.mjs）の検査。
// 一覧データが計画資料（親リポジトリの docs/story/planned/story-movies.md）の表・作る順番と一致し、
// 試作済みのムービーのフォルダと対応していることを確かめる。ブラウザーでの表示は npm.cmd run test:movie-list。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOVIES, SAGAS, STATUS, BUILD_STEPS, DECLINED, PLAN_DOC } from '../../story-movies/catalog.mjs';

const studio = fileURLToPath(new URL('../../', import.meta.url));
const movies = path.join(studio, 'story-movies');
const exists = file => stat(file).then(() => true, () => false);
const plan = await readFile(path.join(studio, '..', PLAN_DOC), 'utf8');

// 計画資料の「## 見出し」から次の「## 」までを取り出す
function section(heading) {
  const start = plan.indexOf(`\n## ${heading}`);
  assert.ok(start >= 0, `${PLAN_DOC}: 「${heading}」の節`);
  const end = plan.indexOf('\n## ', start + 1);
  return plan.slice(start, end < 0 ? undefined : end);
}
const rows = text => text.split('\n').filter(l => /^\| M\d+ \|/.test(l)).map(l => l.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*/g, '')));

test('the catalog lists every adopted movie of the plan with the same title, length and priority', () => {
  const adopted = rows(section('採用した'));
  assert.equal(adopted.length, MOVIES.length, 'adopted movies');
  for (const [id, title, , , length, , priority] of adopted) {
    const movie = MOVIES.find(m => m.id === id);
    assert.ok(movie, `${id} is in catalog.mjs`);
    assert.equal(movie.title, title, `${id} title`);
    assert.equal(movie.length, length, `${id} length`);
    if (/^[A-C]$/.test(priority)) assert.equal(movie.priority, priority, `${id} priority`);
    else assert.ok(movie.priority === null && movie.status !== 'planned', `${id}: ${priority}`);
  }
});

test('the build order follows the plan, and declined ideas are kept out of the list', () => {
  const steps = [...section('作る順番の提案').matchAll(/^(\d+)\. \*\*(.+?)\*\*/gm)].map(m => [Number(m[1]), m[2].match(/M\d+/g)]);
  assert.ok(steps.length >= 1);
  for (const [step, ids] of steps) for (const id of ids)
    assert.equal(MOVIES.find(m => m.id === id)?.buildStep, step, `${id} is step ${step}`);
  for (const m of MOVIES.filter(m => m.status === 'planned'))
    assert.ok(steps.some(([step, ids]) => step === m.buildStep && ids.includes(m.id)), `${m.id} has a step in the plan`);
  const declined = rows(section('見送ったもの'));
  assert.deepEqual(declined.map(([id, title]) => [id, title]), DECLINED.map(d => [d.id, d.title]));
  for (const d of DECLINED) assert.ok(!MOVIES.some(m => m.id === d.id), `${d.id} is not adopted`);
});

test('catalog entries are well formed', () => {
  const unique = key => assert.equal(new Set(MOVIES.map(m => m[key])).size, MOVIES.length, `unique ${key}`);
  unique('id'); unique('slug');
  for (const m of MOVIES) {
    assert.match(m.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, m.id);
    assert.ok(Object.hasOwn(STATUS, m.status), `${m.id} status`);
    assert.ok(SAGAS.some(s => s.id === m.saga), `${m.id} saga`);
    assert.ok(BUILD_STEPS.some(s => s.step === m.buildStep), `${m.id} build step`);
    assert.equal(m.buildStep === 0, m.status !== 'planned', `${m.id}: step 0 means already made`);
    assert.ok(m.tone.length === 2 && m.tone.every(c => /^#[0-9a-f]{6}$/.test(c)), `${m.id} tone`);
    for (const key of ['title', 'when', 'place', 'length', 'summary']) assert.ok(m[key], `${m.id} ${key}`);
    assert.ok(m.scenes.length >= 3, `${m.id} scenes`);
  }
  // 旧設定の名前を使わない
  const text = JSON.stringify({ MOVIES, DECLINED });
  for (const old of ['ビルダーの書', '原初の書', 'ギアガ']) assert.ok(!text.includes(old), old);
});

test('made movies have their folder and still, and every movie folder is listed', async () => {
  for (const m of MOVIES) {
    const page = path.join(movies, m.slug, 'index.html');
    if (m.status === 'planned') {
      assert.equal(await exists(page), false, `${m.id}: story-movies/${m.slug}/ exists — set its status in catalog.mjs`);
      assert.equal(m.thumb, undefined, `${m.id}: no still before it is made`);
      continue;
    }
    assert.ok(await exists(page), `${m.id}: story-movies/${m.slug}/index.html`);
    const html = await readFile(page, 'utf8');
    assert.ok(html.includes(`id="tpl-scene-${m.thumb.scene}"`), `${m.id}: the still's scene exists`);
    for (const link of m.links ?? []) assert.ok(await exists(path.join(movies, link.href)), `${m.id}: ${link.href}`);
  }
  // ムービーのページ（index.html）があるフォルダは一覧に載せる（screenshots/ や将来の shared/ は対象外）
  const folders = (await readdir(movies, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
  for (const name of folders) if (await exists(path.join(movies, name, 'index.html')))
    assert.ok(MOVIES.some(m => m.slug === name), `story-movies/${name}/ is listed in catalog.mjs`);
});

test('the list page reads the catalog and the studio top page links to it', async () => {
  const list = await readFile(path.join(movies, 'index.html'), 'utf8');
  assert.match(list, /from '\.\/catalog\.mjs'/);
  assert.match(list, /href="\.\.\/"/, 'back to the studio top');
  const top = await readFile(path.join(studio, 'index.html'), 'utf8');
  assert.match(top, /<a href="story-movies\/">SVGストーリームービーの一覧<\/a>/);
});
