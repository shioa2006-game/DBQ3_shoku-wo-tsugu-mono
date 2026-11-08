// 火山島編の始まり「海を越えて」（story-movies/ch4-arrival/）の生成物の検査。ブラウザーでの再生は npm.cmd run test:movie -- ch4-arrival。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { castParts, castPartsJson } from '../../story-movies/shared/cast.mjs';
import { runPython } from '../../story-movies/shared/build-movie.mjs';
import { CAST } from '../../story-movies/ch4-arrival/cast.mjs';
import { removedEnding } from './removed-endings.mjs';

const movies = fileURLToPath(new URL('../../story-movies/', import.meta.url));
const dir = path.join(movies, 'ch4-arrival');
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
const templates = text => [...text.matchAll(/<template id="tpl-scene-(\d)">([\s\S]*?)<\/template>/g)].map(m => m[2]);
const scenes = templates(html);
const storyText = html.match(/const STORY = (\{[\s\S]*?\n {2}\});/)[1];
const captions = [...storyText.matchAll(/text: '([^']+)'/g)].map(m => m[1]);
const source = file => readFile(path.join(repo, file), 'utf8');

test('character parts are exported unchanged from the Studio authoring code', async () => {
  assert.equal(await readFile(path.join(dir, 'parts/cast.json'), 'utf8'), castPartsJson(CAST), 'npm.cmd run build:movie -- ch4-arrival で書き出し直す');
  const parts = castParts(CAST);
  assert.deepEqual(Object.keys(parts.characters).sort(), ['gonta', 'hero2', 'mina', 'watari']);
  for (const [id, c] of Object.entries(parts.characters)) assert.deepEqual(Object.keys(c.views).sort(), ['back', 'front'], id);
});

test('captions are existing lines: the prologue, the chapter 4 intro, the chapter 3 ending and the title screen', async () => {
  const prologue = await source('Storybook_Character_Studio/story-movies/prologue/src/build.py');
  const chapter4 = await source('dqb3-tsugumono-ch4-5/src/content/chapter4.js');
  const intro = [...chapter4.match(/intro: \[([\s\S]*?)\n {4}\],/)[1].matchAll(/D\((?:BOOK|"")[^"]*"([^"]+)"\)/g)].map(m => m[1]);
  const ending = await removedEnding('第3章の結末'); // 文字の結末は2026-11-08に削除（docs/story/reference/removed-text-endings.md）
  const titleCopy = (await source('dqb3-tsugumono-ch4-5/src/ui/ui.js')).match(/class="title-copy">([^<]+)</)[1];
  assert.equal(captions.length, 9);
  // ① プロローグの字幕
  for (const c of captions.slice(0, 2)) assert.ok(prologue.includes(`text: '${c}'`), `prologue: ${c}`);
  // ② 職業の書の振り返り2行（呼びかけ・つなぎ・かぎかっこを除いたもの）
  assert.ok(intro.some(l => l.includes(captions[2].replace(/。$/, ''))), captions[2]);
  assert.ok(intro.some(l => l.includes(captions[3].replace(/。$/, ''))), captions[3]);
  // ③ 第3章の結末文の最後の行（M4の最後の字幕と同じ）
  assert.equal(captions[4], ending.filter(l => l !== '&nbsp;' && !l.includes('ジパング復興編・完')).at(-1));
  // ④ 導入会話の地の文を2行に分けたもの
  assert.equal(captions[5] + captions[6], intro[0]);
  // ⑤ タイトル画面の一文を2行に分けたもの
  assert.equal(captions[7] + captions[8], titleCopy);
  assert.ok(html.includes('<h1 class="title-main">火山島編</h1>'));
  assert.equal(scenes.length, 5);
  for (const old of ['ビルダーの書', '原初の書', 'ギアガ', 'ヴァルガ', '鍛冶屋の書']) assert.ok(!html.includes(old), old);
});

test('the memory frames hold the prologue and M4 scenes as they are', async () => {
  const body = svg => svg.slice(svg.indexOf('>', svg.indexOf('<svg class="scene-art"')) + 1);
  const prologue = templates(await readFile(path.join(movies, 'prologue/index.html'), 'utf8'));
  const m4 = templates(await readFile(path.join(movies, 'ch3-departure/index.html'), 'utf8'));
  // 元の接頭辞をこの場面の下に置き換えたものが、額の中にそのまま入っている（作画を変えたら両方を生成し直す）
  assert.ok(scenes[0].includes(body(prologue[3]).replaceAll('s4-', 's1-pa-').trim()), 'scene 1: prologue scene 4');
  assert.ok(scenes[1].includes(body(m4[0]).replaceAll('s1-', 's2-ma-').trim()), 'scene 2: M4 scene 1');
  assert.ok(scenes[1].includes(body(m4[1]).replaceAll('s2-', 's2-mb-').trim()), 'scene 2: M4 scene 2');
  assert.ok(scenes[0].includes('.s1-pa-shotb{display:none}'), 'the close back shot of the prologue is not shown in the frame');
});

test('the four on the ship are drawn from the formal designs', () => {
  const parts = castParts(CAST);
  const hair = (id, direction) => parts.characters[id].views[direction].head.match(/<path d="([^"]+)"/)[1];
  for (const id of ['hero2', 'mina', 'gonta', 'watari']) {
    assert.ok(scenes[2].includes(hair(id, 'front')), `scene 3: ${id} front`);
    assert.ok(scenes[3].includes(hair(id, 'back')), `scene 4: ${id} back`);
  }
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
  const tmp = await mkdtemp(path.join(tmpdir(), 'ch4-arrival-'));
  try {
    const out = path.join(tmp, 'index.html');
    const run = runPython(dir, 'src/build.py', [out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(await readFile(out, 'utf8'), html, 'npm.cmd run build:movie -- ch4-arrival で書き出し直す');
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
