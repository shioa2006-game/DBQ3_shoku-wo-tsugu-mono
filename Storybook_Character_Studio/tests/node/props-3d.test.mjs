import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import * as THREE from '../../../dqb3-tsugumono-ch1-3/node_modules/three/build/three.module.js';
import { createPropModels, PROP_MODEL_NAMES, PROP_REQUIREMENTS, PROP_LIMITS } from '../../prototypes/props-3d/models.mjs';
import { generatedModule, GAME_COPIES } from '../../prototypes/props-3d/export.mjs';
import { GAMES } from '../../prototypes/shared/game-targets.mjs';

const blockNames = async (folder) => {
  const source = await readFile(new URL(`../../../${folder}/src/world/blocks.js`, import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export const B = {'), source.indexOf('};', source.indexOf('export const B = {')));
  return new Set([...body.matchAll(/^\s+([A-Z_0-9]+):/gm)].map((m) => m[1]));
};

test('every prop model builds without three.js errors', (t) => {
  // three.js only logs (does not throw) when a non-Object3D is added to a group.
  const logged = [];
  t.mock.method(console, 'error', (...args) => logged.push(args.join(' ')));
  const models = createPropModels(THREE);
  for (const name of PROP_MODEL_NAMES) {
    models[name]();
    models[name]({ connects: () => true });
  }
  assert.deepEqual(logged, []);
});

test('every prop model builds and keeps the parts the game animates', () => {
  const models = createPropModels(THREE);
  assert.deepEqual(Object.keys(models).sort(), [...PROP_MODEL_NAMES].sort());
  for (const name of PROP_MODEL_NAMES) {
    const prop = models[name]();
    assert.ok(prop.isGroup, `${name} is a group`);
    const need = PROP_REQUIREMENTS[name] ?? { names: [], userData: [] };
    for (const part of need.names) assert.ok(prop.getObjectByName(part), `${name} has "${part}"`);
    for (const flag of need.userData) assert.equal(prop.userData[flag], true, `${name} userData.${flag}`);
  }
  for (const spikes of ['stone', 'iron']) assert.ok(createPropModels(THREE, { spikes }).SPIKES().isGroup);
});

test('prop models stay inside their cell (outline included)', () => {
  const models = createPropModels(THREE);
  for (const name of PROP_MODEL_NAMES) {
    const prop = models[name]();
    prop.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(prop);
    const limit = PROP_LIMITS[name] ?? PROP_LIMITS.default;
    const eps = 1e-6;
    // 地面の下へは輪郭線の太さ（0.018）までしか出さない（魚のかげは水の中まで）。
    const minY = (limit.minY ?? 0) - 0.02;
    assert.ok(box.min.y >= minY, `${name} does not sink below ${minY} (${box.min.y.toFixed(3)})`);
    assert.ok(box.max.y <= limit.y + eps, `${name} height ${box.max.y.toFixed(3)} <= ${limit.y}`);
    for (const k of ['x', 'z']) {
      assert.ok(Math.max(-box.min[k], box.max[k]) <= limit.xz + eps, `${name} ${k} half-width ${Math.max(-box.min[k], box.max[k]).toFixed(3)} <= ${limit.xz}`);
    }
  }
});

test('placing many props reuses geometry and materials', () => {
  const models = createPropModels(THREE);
  // 旗（flag）だけは、ゲームが頂点を波打たせるので置くたびに別の形状を作る。
  const geometries = (prop) => { const s = new Set(); prop.traverse((o) => o.isMesh && o.name !== 'flag' && s.add(o.geometry)); return s; };
  for (const name of PROP_MODEL_NAMES) {
    const a = geometries(models[name]()), b = geometries(models[name]());
    assert.deepEqual([...a], [...b], `${name} shares geometry between placements`);
  }
});

test('prop model names match the block ids of each game', async () => {
  const ch13 = await blockNames('dqb3-tsugumono-ch1-3'), ch45 = await blockNames('dqb3-tsugumono-ch4-5'), ch67 = await blockNames('dqb3-tsugumono-ch6-7');
  // 共通の設置物は第1～5章の両方に、かかしは第1～3章だけ、試作03の設備は第4～5章（一部は第6～7章も）、
  // 試作05の設置物は第6～7章だけにある。
  const only13 = new Set(['SCARECROW']);
  const only45 = new Set(['MINE_LAMP', 'KILN', 'FORGE', 'ANVIL', 'TROUGH', 'IRON_POT', 'TAINT_STONE', 'INCENSE_PLANT', 'PRAYER_PILLAR']);
  const only67 = new Set(['LANTERN', 'FLAME_BOWL', 'SELECT_PILLAR0', 'SELECT_PILLAR1', 'SELECT_PILLAR2', 'SELECT_PILLAR3', 'SELECT_PILLAR4',
    'GATE', 'CROSSBOW_N', 'CROSSBOW_E', 'CROSSBOW_S', 'CROSSBOW_W', 'GREAT_BALLISTA', 'WEDGE_MARK', 'WEDGE_SET']);
  // 第6～7章が使わない、前の編の設置物。
  const not67 = new Set(['SCARECROW', 'ALTAR', 'TORII', 'MINE_LAMP', 'IRON_POT', 'TAINT_STONE', 'INCENSE_PLANT', 'PRAYER_PILLAR']);
  for (const name of PROP_MODEL_NAMES) {
    if (!only45.has(name) && !only67.has(name)) assert.ok(ch13.has(name), `CH1-3 has B.${name}`);
    if (!only13.has(name) && !only67.has(name)) assert.ok(ch45.has(name), `CH4-5 has B.${name}`);
    if (!not67.has(name)) assert.ok(ch67.has(name), `CH6-7 has B.${name}`);
    else assert.ok(!ch67.has(name), `CH6-7 does not use B.${name}`);
  }
});

const lf = (text) => text.replace(/\r\n/g, '\n');

// 比較ページは compare/ に置き、原本の models.mjs を直接読む。ゲームのフォルダには比較用の写しを置かない。
test('both comparison pages read the Studio source through one shared page script', async () => {
  const script = await readFile(new URL('../../compare/shared/props-3d-preview.js', import.meta.url), 'utf8');
  assert.ok(script.includes("from '../../prototypes/props-3d/models.mjs'"), 'the page reads models.mjs');
  for (const [game, folder] of Object.entries(GAMES)) {
    const html = await readFile(new URL(`../../compare/${game}/props-3d/index.html`, import.meta.url), 'utf8');
    assert.match(html, new RegExp(`data-game="${game}"`));
    assert.ok(html.includes('src="../../shared/props-3d-preview.js"'), `${game} uses the shared page script`);
    await assert.rejects(access(new URL(`../../../${folder}/prototypes`, import.meta.url)), `${folder} keeps no comparison pages`);
  }
});

// 本編の写しは、確認ページで形が決まってから --preview-game で更新する。
// 原本と同じ版（PROP_MODEL_VERSION）なら中身も同じであること。古い版のままでもよい。
test('each game uses a released version of the Studio source', async () => {
  const expected = lf(await generatedModule());
  const versionOf = (text) => Number(/export const PROP_MODEL_VERSION = (\d+);/.exec(text)?.[1]);
  for (const { folder, path } of GAME_COPIES) {
    const file = new URL(`../../../${folder}/${path}`, import.meta.url);
    const copy = lf(await readFile(file, 'utf8'));
    assert.ok(copy.startsWith('// 生成ファイル。'), `${folder}/${path} is a generated copy`);
    assert.ok(versionOf(copy) <= versionOf(expected), `${folder} is not newer than the Studio source`);
    if (versionOf(copy) === versionOf(expected)) assert.equal(copy, expected, `${folder}/${path}: run npm.cmd run export:props -- --preview-game`);
    // 写しにある設置物は、本編の props.js に古い作り方を残さない。
    const { PROP_MODEL_NAMES: released } = await import(file.href);
    const source = await readFile(new URL(`../../../${folder}/src/world/props.js`, import.meta.url), 'utf8');
    assert.ok(source.includes('createPropModels(THREE'), `${folder} builds props with createPropModels`);
    for (const name of released) assert.ok(!source.includes(`[B.${name}]() {`) && !source.includes(`[B.${name}](world`), `${folder} has no legacy ${name} builder`);
  }
});

test('fences add rails only toward connected neighbours', () => {
  const models = createPropModels(THREE);
  const count = (prop) => { let n = 0; prop.traverse((o) => o.isMesh && !o.userData.outline && (n += 1)); return n; };
  const alone = count(models.FENCE({ connects: () => false }));
  const line = count(models.FENCE({ connects: (dx) => dx !== 0 }));
  const corner = count(models.FENCE({ connects: (dx, dz) => dx === 1 || dz === 1 }));
  assert.equal(line - alone, 4, 'two neighbours add two rails each');
  assert.equal(corner, line);
  assert.equal(count(models.FENCE()), alone, 'no ctx means no rails');
});
