// ゲームへ組み込んだSVGストーリームービー（story-movies/game-targets.mjs）の写しの検査。
// 各編の assets/movies/ が Studio の生成物と同じで、各編の src/content/movies.js が全部を読み込むことを確かめる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { GAMES, MOVIE_FILES, gameMovieUrl, studioMovieUrl } from '../../story-movies/game-targets.mjs';
import { MOVIES } from '../../story-movies/catalog.mjs';

const gameFile = (game, path) => new URL(`../../../${GAMES[game]}/${path}`, import.meta.url);

test('game copies are the same as the Studio movies', async () => {
  for (const file of MOVIE_FILES) {
    const [studio, game] = await Promise.all([readFile(studioMovieUrl(file)), readFile(gameMovieUrl(file))]);
    assert.ok(studio.equals(game), `${file.game}/${file.name}: npm.cmd run sync:movies で写し直す`);
  }
});

test('each game reads exactly its movies, and nothing else is left in assets/movies', async () => {
  for (const game of Object.keys(GAMES)) {
    const names = MOVIE_FILES.filter((f) => f.game === game).map((f) => f.name).sort();
    const files = (await readdir(fileURLToPath(gameFile(game, 'assets/movies/')))).map((f) => f.replace(/\.html$/, '')).sort();
    assert.deepEqual(files, names, `${game}: assets/movies/`);
    const table = await readFile(gameFile(game, 'src/content/movies.js'), 'utf8');
    const read = [...table.matchAll(/^\s+"?([\w-]+)"?: new URL\("\.\.\/\.\.\/assets\/movies\/([\w-]+)\.html", import\.meta\.url\)\.href,/gm)];
    assert.deepEqual(read.map((m) => m[1]).sort(), names, `${game}: src/content/movies.js の名前`);
    for (const m of read) assert.equal(m[1], m[2], `${game}: ${m[1]} は同じ名前のファイルを読む`);
  }
});

test('every movie marked as in the game has a copy, and the copies come from those movies', () => {
  const sources = new Set(MOVIE_FILES.map((f) => f.from.split('/')[0]));
  for (const m of MOVIES) {
    if (m.status === 'game') assert.ok(sources.has(m.slug), `${m.id}: game-targets.mjs に書き出し先がない`);
    else assert.ok(!sources.has(m.slug), `${m.id}: 書き出し先があるのに status が '${m.status}'`);
  }
  // 書の復活は5冊すべて
  const books = MOVIE_FILES.filter((f) => f.from.startsWith('book-revival/')).map((f) => f.name).sort();
  assert.deepEqual(books, ['book-blacksmith', 'book-cook', 'book-farmer', 'book-priest', 'book-sailor']);
});
