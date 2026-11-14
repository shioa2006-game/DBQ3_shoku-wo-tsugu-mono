// ダーマ再興編・完「まだ見ぬ書へ」（story-movies/ch7-unseen-books/・M14）の生成物の検査。
// ブラウザーでの再生は npm.cmd run test:movie -- ch7-unseen-books。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch7-unseen-books/cast.mjs';

const movies = fileURLToPath(new URL('../../story-movies/', import.meta.url));
const dir = path.join(movies, 'ch7-unseen-books');
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const templates = text => [...text.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const scenes = templates(html);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const sceneCaptions = [...storyText.matchAll(/captions: \[([\s\S]*?)\]/g)].map(m => [...m[1].matchAll(/text: '([^']+)'/g)].map(c => c[1]));
const has = (i, prefix, ids) => ids.every(id => scenes[i].includes(`${prefix}${id}-`));

test('the fifteen people are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch7-unseen-books で書き出し直す');
  assert.equal(Object.keys(CAST).length, 15);
  for (const id of ['suzuha', 'asagi', 'ganzou']) assert.deepEqual(CAST[id], ['front', 'back'], id);
});

test('the lines follow the chapter 7 examples and are recorded in the plan; the arc ends before the work', async () => {
  assert.deepEqual(sceneCaptions.map(c => c.length), [1, 1, 1, 1, 2, 1]);
  const plan = await readFile(path.join(repo, 'docs/story/planned/chapter6-7-movies.md'), 'utf8');
  const m14 = plan.slice(plan.indexOf('### M14'), plan.indexOf('## 作る順番の提案'));
  for (const c of sceneCaptions.flat()) assert.ok(m14.includes(`「${c}」`), `chapter6-7-movies.md の M14: ${c}`);
  // ⑤⑥は第7章の台詞の方向性の例文のとおり
  const ch7 = await readFile(path.join(repo, 'docs/story/planned/chapter7.md'), 'utf8');
  for (const c of [...sceneCaptions[4], ...sceneCaptions[5]]) assert.ok(ch7.includes(c), `chapter7.md: ${c}`);
  // 「ダーマ再興編・完」の後に、作品名「職をつぐ者」と「完」（時間差で続ける）
  const arc = html.indexOf('<p class="title-arc">ダーマ再興編・完</p>');
  const work = html.indexOf('<h1 class="title-main title-work">職をつぐ者</h1>');
  const fin = html.indexOf('<p class="title-fin">完</p>');
  assert.ok(arc > 0 && arc < work && work < fin, 'title order');
  assert.match(html, /\.title-work\{[^}]*transition:opacity 1\.6s ease 2\.4s/);
  assert.match(html, /\.title-fin\{[^}]*transition:opacity 1\.6s ease 3\.6s/);
  assert.match(storyText, /id: 'horizon'[\s\S]*cues: \[\{ at: \d+, action: 'title', stop: true \}\]/);
  assert.equal(scenes.length, 6);
});

test('each scene shows the planned people; Pino and Belk leave the ship at their islands', () => {
  assert.ok(has(0, 's1-', ['suzuha-front', 'asagi-front', 'ganzou-front']), 'the reopened temple');
  assert.ok(has(1, 's2-b-', ['suzuha-back', 'asagi-back', 'ganzou-back']), 'seeing off from the pier');
  assert.ok(has(1, 's2-c-', ['watari-front', 'mina-front', 'pino-front', 'hero2-front', 'belk-front', 'gonta-front']), 'six on board');
  assert.ok(has(2, 's3-', ['pino-front', 'inaho-front', 'jinbei-front']), 'Zipangu');
  assert.ok(has(3, 's4-', ['belk-front', 'nagi-front', 'kaya-front', 'roku-front', 'yomogi-front']), 'the volcanic island');
  assert.ok(has(4, 's5-c-', ['watari-front', 'mina-front', 'hero2-front', 'gonta-front']), 'four on board');
  assert.ok(!scenes[4].includes('s5-c-pino-') && !scenes[4].includes('s5-c-belk-'), 'only the four sail on');
});

test('the same ship as M4, M5 and M7; the reopened temple is the repaired one; no land on the horizon', async () => {
  const props = await readFile(path.join(movies, 'ch3-departure/src/props.py'), 'utf8');
  const hull = props.match(/HULL = \("([^"]+)"/)[1];
  for (const i of [1, 2, 3, 4]) assert.ok(scenes[i].includes(hull), `scene ${i + 1}: the ship`);
  assert.ok(scenes[0].includes('s1-t-roofclip') && scenes[1].includes('s2-t-roofclip'), 'the rebuilt temple');
  assert.ok(!scenes.join('').includes('soot'), 'no battle damage left (repaired after M13)');
  // 次の行き先の土地は描かない：⑥の水平線に島を置かない（M4の水平線の島の色）
  assert.ok(!scenes[5].includes('#8fb0c8'), 'no islands on the horizon');
});

test('ids carry the scene prefix so two scenes can cross-fade', () => {
  for (const [i, svg] of scenes.entries()) {
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    for (const id of ids) assert.ok(id.startsWith(`s${i + 1}-`), `scene ${i + 1}: ${id}`);
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(m[1]), `scene ${i + 1}: url(#${m[1]}) is defined`);
    for (const m of svg.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(m[1].startsWith(`s${i + 1}-`), `scene ${i + 1}: @keyframes ${m[1]}`);
  }
});

test('building again from the sources gives the same page', async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch7-unseen-books-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch7-unseen-books で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
