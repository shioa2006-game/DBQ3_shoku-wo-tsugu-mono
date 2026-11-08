// 書の復活（共通の型、story-movies/book-revival/）の生成物の検査。ブラウザーでの再生は npm.cmd run test:movie -- book-revival（農民の書）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPython } from '../../story-movies/shared/build-movie.mjs';

const dir = fileURLToPath(new URL('../../story-movies/book-revival/', import.meta.url));
const repo = fileURLToPath(new URL('../../../', import.meta.url));
// 書のID → ページ（農民の書はフォルダ直下）と、その書が復活するゲーム
const BOOKS = { farmer: ['', 'dqb3-tsugumono-ch1-3'], cook: ['cook', 'dqb3-tsugumono-ch1-3'], sailor: ['sailor', 'dqb3-tsugumono-ch1-3'],
  blacksmith: ['blacksmith', 'dqb3-tsugumono-ch4-5'], priest: ['priest', 'dqb3-tsugumono-ch4-5'] };
const pages = Object.fromEntries(await Promise.all(Object.entries(BOOKS).map(async ([id, [sub]]) =>
  [id, await readFile(path.join(dir, sub, 'index.html'), 'utf8')])));
const scenesOf = html => [...html.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const captionsOf = html => [...html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1].matchAll(/text: '([^']+)'/g)].map(m => m[1]);

// jobs.js の書の定義（name・revivedDesc）を取り出す
async function jobs(game) {
  const src = await readFile(path.join(repo, game, 'src/game/jobs.js'), 'utf8');
  const out = {};
  for (const m of src.matchAll(/^ {2}(\w+): \{\n([\s\S]*?)\n {2}\},/gm)) {
    const name = m[2].match(/name: "([^"]+)"/), desc = m[2].match(/revivedDesc: "([^"]+)"/);
    if (name && desc) out[m[1]] = { name: name[1], revivedDesc: desc[1] };
  }
  return out;
}

test('five pages share one template: one scene, the revival line, the book\'s own line and its name', async () => {
  const ui = await readFile(path.join(repo, 'dqb3-tsugumono-ch1-3/src/ui/ui.js'), 'utf8');
  const line = ui.match(/showBookRevival[\s\S]*?class="book-page">([^<]+)</)[1];
  for (const [id, [, game]] of Object.entries(BOOKS)) {
    const html = pages[id], book = (await jobs(game))[id];
    assert.ok(book, `${game} jobs.js: ${id}`);
    assert.equal(scenesOf(html).length, 1, `${id}: one scene`);
    assert.deepEqual(captionsOf(html), [line, book.revivedDesc], `${id}: captions`);
    assert.ok(html.includes(`<h1 class="title-main">${book.name}</h1>`), `${id}: title`);
    for (const other of Object.keys(BOOKS).filter(o => o !== id)) assert.ok(html.includes(`>${(await jobs(BOOKS[other][1]))[other].name}</a>`), `${id}: link to ${other}`);
  }
  // 型は同じ：動きのCSSは5冊で同じ
  const css = html => scenesOf(html)[0].match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const id of Object.keys(BOOKS)) assert.equal(css(pages[id]), css(pages.farmer), `${id}: same template`);
});

test('ids carry the scene prefix', () => {
  for (const [id, html] of Object.entries(pages)) {
    const svg = scenesOf(html)[0];
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    for (const x of ids) assert.ok(x.startsWith('s1-'), `${id}: ${x}`);
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(m[1]), `${id}: url(#${m[1]}) is defined`);
    for (const m of svg.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(m[1].startsWith('s1-'), `${id}: @keyframes ${m[1]}`);
  }
});

test('building again from the sources gives the same five pages', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'book-revival-'));
  try {
    const run = runPython(dir, 'src/build.py', [tmp], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    for (const [id, [sub]] of Object.entries(BOOKS))
      assert.equal(await readFile(path.join(tmp, sub, 'index.html'), 'utf8'), pages[id], `${id}: npm.cmd run build:movie -- book-revival で書き出し直す`);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
