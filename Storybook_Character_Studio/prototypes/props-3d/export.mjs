// 設置物の3Dモデルの原本（models.mjs）を、--preview-game で本編の両ゲームへ写す。
// 比較ページ（Studioの compare/ch1-3/props-3d/・compare/ch4-5/props-3d/）は原本を直接読むので、写しは要らない。
//   dqb3-tsugumono-ch1-3/src/world/prop-models.js
//   dqb3-tsugumono-ch4-5/src/world/prop-models.js
// 写しは原本の先頭に生成ファイルの注記を付けるだけで、コードは変えない。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const here = (p) => new URL(p, import.meta.url);
const gameFile = (folder, p) => new URL(`../../../${folder}/${p}`, import.meta.url);

export const GAME_COPIES = Object.freeze([
  { folder: 'dqb3-tsugumono-ch1-3', path: 'src/world/prop-models.js' },
  { folder: 'dqb3-tsugumono-ch4-5', path: 'src/world/prop-models.js' },
]);

export const GENERATED_HEADER = [
  '// 生成ファイル。直接編集しない。',
  '// 原本: Storybook_Character_Studio/prototypes/props-3d/models.mjs',
  '// 更新: Storybook_Character_Studio で npm.cmd run export:props -- --preview-game',
  '',
].join('\n');

export async function generatedModule() {
  return GENERATED_HEADER + (await readFile(here('models.mjs'), 'utf8'));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const toGame = process.argv.includes('--preview-game');
  if (process.argv.slice(2).some((a) => a !== '--preview-game')) throw Error('Unknown argument');
  const code = await generatedModule();
  for (const { folder, path } of toGame ? GAME_COPIES : []) {
    await mkdir(gameFile(folder, path.slice(0, path.lastIndexOf('/') + 1)), { recursive: true });
    await writeFile(gameFile(folder, path), code);
  }
  console.log(toGame ? 'Prop models copied to both games src/world/prop-models.js.' : 'Nothing written: the comparison pages read models.mjs directly. Add --preview-game to update both games.');
}
