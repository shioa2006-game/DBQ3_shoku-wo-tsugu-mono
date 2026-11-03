// Studioの出力を、prototypes/shared/game-targets.mjs に書いた各ゲームへ写す。
//   画像   prototypes/<folder>/output/<name>.png     → <game>/assets/<dir>/<name>.png
//   原画   prototypes/<folder>/output/<name>.src.png → <game>/art_src/<name>.src.png
//   リグ   prototypes/<folder>/rig-profile.mjs       → <game>/src/content/rig-profiles/<id>.mjs
// 作画を直したら、各キャラクターの export を実行してから、これで全ゲームへ配る。
// 使い方: npm.cmd run sync:games            すべて
//         npm.cmd run sync:games -- mina    指定したキャラクターだけ
import { readFile } from 'node:fs/promises';
import { CHARACTERS, runtimeRigProfile, writeToGames } from '../prototypes/shared/game-targets.mjs';

const only = process.argv.slice(2);
const unknown = only.filter((id) => !CHARACTERS.some((c) => c.id === id));
if (unknown.length) throw Error(`Unknown characters: ${unknown.join(', ')}`);

const studio = (c, path) => new URL(`../prototypes/${c.folder}/${path}`, import.meta.url);
for (const c of CHARACTERS) {
  if (only.length && !only.includes(c.id)) continue;
  for (const name of c.files) {
    await writeToGames(c, `assets/${c.dir}/${name}.png`, await readFile(studio(c, `output/${name}.png`)));
    await writeToGames(c, `art_src/${name}.src.png`, await readFile(studio(c, `output/${name}.src.png`)));
  }
  if (c.rigProfile) {
    await writeToGames(c, `src/content/rig-profiles/${c.id}.mjs`, runtimeRigProfile(c, await readFile(studio(c, 'rig-profile.mjs'), 'utf8')));
  }
  console.log(`${c.id}: ${c.targets.join(', ')}`);
}
