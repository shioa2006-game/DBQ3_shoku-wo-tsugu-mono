import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { CHARACTERS, GAMES, gameUrl, runtimeRigProfile } from '../../prototypes/shared/game-targets.mjs';

const studio = (character, path) => new URL(`../../prototypes/${character.folder}/${path}`, import.meta.url);
const lf = (text) => text.replace(/\r\n/g, '\n');

test('every character lists existing outputs and known games', async () => {
  for (const c of CHARACTERS) {
    assert.ok(c.targets.length > 0, `${c.id} has a target game`);
    for (const game of c.targets) assert.ok(GAMES[game], `${c.id}: unknown game ${game}`);
    for (const name of c.files) {
      await assert.doesNotReject(access(studio(c, `output/${name}.png`)), `${c.id}: output/${name}.png`);
      await assert.doesNotReject(access(studio(c, `output/${name}.src.png`)), `${c.id}: output/${name}.src.png`);
    }
    if (c.rigProfile) await assert.doesNotReject(access(studio(c, 'rig-profile.mjs')), `${c.id}: rig-profile.mjs`);
  }
});

test('each target game uses the same images and rig profile as the Studio output', async () => {
  for (const c of CHARACTERS) {
    for (const game of c.targets) {
      for (const name of c.files) {
        const image = await readFile(gameUrl(game, `assets/${c.dir}/${name}.png`));
        assert.ok(image.equals(await readFile(studio(c, `output/${name}.png`))), `${game}: assets/${c.dir}/${name}.png (run the export with --preview-game)`);
        const source = await readFile(gameUrl(game, `art_src/${name}.src.png`));
        assert.ok(source.equals(await readFile(studio(c, `output/${name}.src.png`))), `${game}: art_src/${name}.src.png`);
      }
      if (c.rigProfile) {
        const copy = await readFile(gameUrl(game, `src/content/rig-profiles/${c.id}.mjs`), 'utf8');
        assert.equal(lf(copy), runtimeRigProfile(c, await readFile(studio(c, 'rig-profile.mjs'), 'utf8')), `${game}: src/content/rig-profiles/${c.id}.mjs`);
      }
    }
  }
});

// キャラクターはどの編でも同じリグで動かす（第4～5章の道具も含めて1つの rig.js）。
test('every game runs characters on the same rig.js', async () => {
  const [first, ...rest] = await Promise.all(Object.keys(GAMES).map((game) => readFile(gameUrl(game, 'src/entities/rig.js'), 'utf8')));
  for (const other of rest) assert.equal(lf(other), lf(first), 'src/entities/rig.js must stay identical in every game');
});

// Studioのサーバー（tools/serve.mjs）は /games/<key>/ でゲームのフォルダを配る。単独でも動くよう同じ表を持つ。
test('the Studio server serves the same game folders', async () => {
  const source = await readFile(new URL('../../tools/serve.mjs', import.meta.url), 'utf8');
  const table = source.match(/const GAMES = (\{[^}]*\});/)[1].replace(/'/g, '"').replace(/([{,]\s*)"?([\w-]+)"?:/g, '$1"$2":');
  assert.deepEqual(JSON.parse(table), { ...GAMES });
});
