// 最終決戦の決着「灯は消えず」（story-movies/ch7-flame-holds/・M13）の生成物の検査。
// ブラウザーでの再生は npm.cmd run test:movie -- ch7-flame-holds。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castPartsJson } from '../../story-movies/shared/cast.mjs';
import { vargaParts, vargaPartsJson } from '../../story-movies/shared/varga.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST, VARGA } from '../../story-movies/ch7-flame-holds/cast.mjs';

const movies = fileURLToPath(new URL('../../story-movies/', import.meta.url));
const dir = path.join(movies, 'ch7-flame-holds');
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const templates = text => [...text.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const scenes = templates(html);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const sceneCaptions = [...storyText.matchAll(/captions: \[([\s\S]*?)\]/g)].map(m => [...m[1].matchAll(/text: '([^']+)'/g)].map(c => c[1]));
const PEOPLE = ['hero2', 'mina', 'gonta', 'watari', 'pino', 'belk', 'suzuha', 'asagi', 'ganzou'];

test('Varga and the nine people are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/varga.json'), 'utf8'), vargaPartsJson(VARGA), 'npm.cmd run build:movie -- ch7-flame-holds で書き出し直す');
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST));
  assert.deepEqual(Object.keys(CAST).sort(), [...PEOPLE].sort());
  for (const id of PEOPLE) assert.deepEqual(CAST[id], ['front'], id);
});

test("Varga's last words and the Book's lines are recorded in the plan; the title closes the movie", async () => {
  assert.deepEqual(sceneCaptions.map(c => c.length), [1, 1, 1]);
  assert.ok(sceneCaptions[0][0].includes('職をつぐ者'), sceneCaptions[0][0]);
  assert.ok(sceneCaptions[1][0].includes('灯') && sceneCaptions[2][0].includes('灯'));
  const plan = await readFile(path.join(repo, 'docs/story/planned/chapter6-7-movies.md'), 'utf8');
  const m13 = plan.slice(plan.indexOf('### M13'), plan.indexOf('### M14'));
  for (const c of sceneCaptions.flat()) assert.ok(m13.includes(`「${c}」`), `chapter6-7-movies.md の M13: ${c}`);
  assert.ok(html.includes('<p class="title-sub">最終決戦の決着</p>') && html.includes('<h1 class="title-main">灯は消えず</h1>'));
  assert.match(storyText, /id: 'morning'[\s\S]*cues: \[\{ at: \d+, action: 'title', stop: true \}\]/);
  assert.equal(scenes.length, 3);
  // 戦後の修復と、スズハ・アサギへの継承は描かない（ゲームで描き、M14へつなぐ）
  for (const kept of ['修復', '修理', '継承', '託']) assert.ok(!sceneCaptions.flat().join('').includes(kept), kept);
});

test('the grounded Varga: three closed heads from the Studio sheets, torn wings, a bolt, and black mist', () => {
  const parts = vargaParts(VARGA);
  const sig = svg => svg.match(/<path d="([^"]{40,})"/)[1];
  const teeth = svg => [...svg.matchAll(/<path d="(M[^"]+)" fill="#faf1de"/g)].map(m => m[1]);
  for (const d of VARGA) {
    assert.ok(scenes[0].includes(sig(parts.head[d])), `head ${d}`);
    for (const t of teeth(parts.open[d])) assert.ok(!scenes.join('').includes(t), `no open mouth (${d}): the fire has stopped`);
  }
  assert.ok(scenes[0].includes(sig(parts.body.front)), 'the body');
  assert.ok(scenes[0].includes('filter="url(#s1-v-dead)"'), 'the two fallen heads are darkened');
  assert.match(scenes[0], /class="s1-chead mv"[^>]*style="transform-origin/, 'the third head falls (stopped under reduced motion)');
  assert.ok((scenes[0].match(/class="s1-mist"/g) ?? []).length >= 8, 'black mist');
  assert.ok(scenes[0].includes('class="s1-varga"'), 'the body fades into the mist (opacity, kept under reduced motion)');
  // 爪痕の印の黒鱗は残さない。ガーゴイルも描かない
  for (const kept of ['黒鱗', 'ガーゴイル', 'gargoyle']) assert.ok(!(scenes.join('') + storyText).includes(kept), kept);
});

test('the altar light still burns and the selection pillar carries all four marks', () => {
  // M11の祭壇（青みの要石）と、四つの枠すべての印（下の大工の印はM11、上の三つは建築・食料・防衛）
  assert.ok(scenes[1].includes('fill="#9fb0bf"'), 'the keystone');
  assert.equal((scenes[1].match(/<rect [^>]*stroke="#8a8070" stroke-width="2.4" opacity="0?\.9"\/>/g) ?? []).length, 4, 'four marked frames');
  assert.equal((scenes[1].match(/class="s2-mark"/g) ?? []).length, 4, 'four glowing marks');
  assert.ok(scenes[1].includes('class="s2-smoke"') && scenes[1].includes('class="s2-shaft"'), 'the smoke clears and the morning light comes in');
});

test('morning: the damaged temple stays damaged, the ballista platform, and the nine gather', () => {
  assert.ok(scenes[2].includes('s3-t-roofclip') && scenes[2].includes('url(#s3-t-soot)'), 'the rebuilt temple with the battle damage');
  assert.ok(scenes[2].includes('#59606c') && scenes[2].includes('#9a6a3c'), "Belk's iron and Pino's wood");
  for (const id of PEOPLE) assert.ok(scenes[2].includes(`s3-${id}-front-`), id);
  assert.ok(scenes[2].includes('class="s3-from-right mv"'), 'people walk in');
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch7-flame-holds-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch7-flame-holds で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
