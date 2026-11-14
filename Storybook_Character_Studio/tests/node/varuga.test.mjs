import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { VARUGA_PROFILE } from '../../prototypes/varuga-8dir/rig-profile.mjs';

test('ヴァルガの生成設定は三頭の原本と一致し、ゲームへの未登録の書き出しを拒否する', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../prototypes/varuga-8dir/output/manifest.json', import.meta.url), 'utf8'));
  for (const [key, value] of Object.entries(VARUGA_PROFILE)) assert.deepEqual(manifest.runtime[key], value, key);
  assert.equal(manifest.runtime.heads.length, 3);
  assert.deepEqual(manifest.targets, []);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../../prototypes/varuga-8dir/export.mjs', import.meta.url)), '--preview-game'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ゲームへの移植先は未登録/);
});
