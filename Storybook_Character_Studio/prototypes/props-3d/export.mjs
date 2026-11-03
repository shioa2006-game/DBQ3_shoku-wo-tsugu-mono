// 設置物の3Dモデルの原本（models.mjs）を、ゲーム側の確認ページへ写す。
//   dqb3-tsugumono-ch1-3/prototypes/props-3d/prop-models.js
// 本編への移植（src/world/prop-models.js）は、ユーザーが決めた段階で別に行う。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const here = (p) => new URL(p, import.meta.url);
const game = (p) => new URL(`../../../dqb3-tsugumono-ch1-3/${p}`, import.meta.url);

export const GENERATED_HEADER = [
  '// 生成ファイル。直接編集しない。',
  '// 原本: Storybook_Character_Studio/prototypes/props-3d/models.mjs',
  '// 更新: Storybook_Character_Studio で npm.cmd run export:props',
  '',
].join('\n');

// 写しの中身。原本の先頭に生成ファイルの注記を付けるだけで、コードは変えない。
export async function generatedModule() {
  return GENERATED_HEADER + (await readFile(here('models.mjs'), 'utf8'));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length > 2) throw Error('Unknown argument');
  await mkdir(game('prototypes/props-3d/'), { recursive: true });
  await writeFile(game('prototypes/props-3d/prop-models.js'), await generatedModule());
  console.log('Prop models copied to dqb3-tsugumono-ch1-3/prototypes/props-3d/prop-models.js (game src unchanged).');
}
