// Studioで生成したSVGストーリームービーを、story-movies/game-targets.mjs に書いた各ゲームへ写す。
//   story-movies/<slug>/index.html → <game>/assets/movies/<name>.html
// 使い方: npm.cmd run sync:movies               すべて
//         npm.cmd run sync:movies -- ch1-shrine  指定したムービーだけ（ゲームでの名前）
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { MOVIE_FILES, gameMovieUrl, studioMovieUrl } from '../story-movies/game-targets.mjs';

const only = process.argv.slice(2);
const unknown = only.filter((name) => !MOVIE_FILES.some((f) => f.name === name));
if (unknown.length) throw Error(`Unknown movies: ${unknown.join(', ')}`);

for (const file of MOVIE_FILES) {
  if (only.length && !only.includes(file.name)) continue;
  const url = gameMovieUrl(file);
  await mkdir(new URL('./', url), { recursive: true });
  await writeFile(url, await readFile(studioMovieUrl(file)));
  console.log(`${file.name}: ${file.game}`);
}
