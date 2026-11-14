// SVGストーリームービーの書き出し先。Studioの生成物（story-movies/<slug>/index.html）を、
// 各ゲームの assets/movies/<name>.html へ写す（npm.cmd run sync:movies）。
// ゲーム側は src/content/movies.js がこの名前で読み込み、game-shared/story-movies.mjs が再生する。
// ムービーを作り直したら、build:movie（プロローグは build:prologue）の後にこれで各編へ配る。
import { GAMES } from '../prototypes/shared/game-targets.mjs';

export { GAMES };

/** name: ゲームでの名前（assets/movies/<name>.html、movies.js の鍵） / from: Studioの生成物 / game: 書き出し先 */
export const MOVIE_FILES = Object.freeze([
  { name: 'prologue', from: 'prologue/index.html', game: 'ch1-3' },
  { name: 'ch1-shrine', from: 'ch1-shrine/index.html', game: 'ch1-3' },
  { name: 'ch2-harvest', from: 'ch2-harvest/index.html', game: 'ch1-3' },
  { name: 'ch3-departure', from: 'ch3-departure/index.html', game: 'ch1-3' },
  { name: 'book-farmer', from: 'book-revival/index.html', game: 'ch1-3' },
  { name: 'book-cook', from: 'book-revival/cook/index.html', game: 'ch1-3' },
  { name: 'book-sailor', from: 'book-revival/sailor/index.html', game: 'ch1-3' },
  { name: 'ch4-arrival', from: 'ch4-arrival/index.html', game: 'ch4-5' },
  { name: 'ch5-return', from: 'ch5-return/index.html', game: 'ch4-5' },
  { name: 'book-blacksmith', from: 'book-revival/blacksmith/index.html', game: 'ch4-5' },
  { name: 'book-priest', from: 'book-revival/priest/index.html', game: 'ch4-5' },
  // 第6～7章（ダーマ再興編）: 編の始まり・第6章の結び・ヴァルガの初襲来・最終決戦の決着・エンディング
  { name: 'ch6-arrival', from: 'ch6-arrival/index.html', game: 'ch6-7' },
  { name: 'ch6-roof-light', from: 'ch6-roof-light/index.html', game: 'ch6-7' },
  { name: 'ch7-three-heads', from: 'ch7-three-heads/index.html', game: 'ch6-7' },
  { name: 'ch7-flame-holds', from: 'ch7-flame-holds/index.html', game: 'ch6-7' },
  { name: 'ch7-unseen-books', from: 'ch7-unseen-books/index.html', game: 'ch6-7' },
]);

export const studioMovieUrl = (file) => new URL(`./${file.from}`, import.meta.url);
export const gameMovieUrl = (file) => new URL(`../../${GAMES[file.game]}/assets/movies/${file.name}.html`, import.meta.url);
