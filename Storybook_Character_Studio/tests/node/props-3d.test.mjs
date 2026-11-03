import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../../../dqb3-tsugumono-ch1-3/node_modules/three/build/three.module.js';
import { createPropModels, PROP_MODEL_NAMES, PROP_REQUIREMENTS, PROP_LIMITS } from '../../prototypes/props-3d/models.mjs';
import { generatedModule, PREVIEW_COPY, GAME_COPIES } from '../../prototypes/props-3d/export.mjs';

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
    // 地面の下へは輪郭線の太さ（0.018）までしか出さない。
    assert.ok(box.min.y >= -0.02, `${name} does not sink below the floor (${box.min.y.toFixed(3)})`);
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
  const ch13 = await blockNames('dqb3-tsugumono-ch1-3'), ch45 = await blockNames('dqb3-tsugumono-ch4-5');
  for (const name of PROP_MODEL_NAMES) {
    assert.ok(ch13.has(name), `CH1-3 has B.${name}`);
    if (name !== 'SCARECROW') assert.ok(ch45.has(name), `CH4-5 has B.${name}`);
  }
});

const lf = (text) => text.replace(/\r\n/g, '\n');

test('the comparison page uses the current Studio source', async () => {
  const copy = await readFile(new URL(`../../../${PREVIEW_COPY.folder}/${PREVIEW_COPY.path}`, import.meta.url), 'utf8');
  assert.equal(lf(copy), lf(await generatedModule()), 'run npm.cmd run export:props');
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
