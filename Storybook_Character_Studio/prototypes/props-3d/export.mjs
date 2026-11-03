// 設置物の3Dモデルの原本（models.mjs）を写す。
//   dqb3-tsugumono-ch1-3/prototypes/props-3d/prop-models.js   確認ページ用（右側の新しい形）
//   dqb3-tsugumono-ch4-5/prototypes/props-3d/prop-models.js   同上（第4～5章の設備を比べる）
// --preview-game で、本編の両ゲームにも書き出す。
//   dqb3-tsugumono-ch1-3/src/world/prop-models.js
//   dqb3-tsugumono-ch4-5/src/world/prop-models.js
// 写しは原本の先頭に生成ファイルの注記を付けるだけで、コードは変えない。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const here = (p) => new URL(p, import.meta.url);
const gameFile = (folder, p) => new URL(`../../../${folder}/${p}`, import.meta.url);

export const PREVIEW_COPIES = Object.freeze([
  { folder: 'dqb3-tsugumono-ch1-3', path: 'prototypes/props-3d/prop-models.js' },
  { folder: 'dqb3-tsugumono-ch4-5', path: 'prototypes/props-3d/prop-models.js' },
]);
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
  for (const { folder, path } of [...PREVIEW_COPIES, ...(toGame ? GAME_COPIES : [])]) {
    await mkdir(gameFile(folder, path.slice(0, path.lastIndexOf('/') + 1)), { recursive: true });
    await writeFile(gameFile(folder, path), code);
  }
  console.log(`Prop models copied to both comparison pages${toGame ? ' and both games src/world/prop-models.js' : ' (game src unchanged)'}.`);
}
