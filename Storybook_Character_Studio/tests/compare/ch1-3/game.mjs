// 第1～3章の比較ページ（Studioの compare/ch1-3/）のテストで使う共通部品。
// 画像の検査とブラウザーの起動はゲームのものを使い、ページはStudioのサーバーで開く。
import { createRequire } from 'node:module';

export const gameRoot = new URL('../../../../dqb3-tsugumono-ch1-3/', import.meta.url);
// 比較ページのフォルダ。テストが撮るスクリーンショットもここへ保存する（Git管理しない）。
export const pages = new URL('../../../compare/ch1-3/', import.meta.url);
export const { PNG } = createRequire(new URL('package.json', gameRoot))('pngjs');
export { launchBrowser } from '../../../../dqb3-tsugumono-ch1-3/tests/helpers.mjs';
export { normalize } from '../../../../dqb3-tsugumono-ch1-3/tools/normalize_sheet.mjs';

// npm.cmd run test:compare は、空いているポートでStudioのサーバーを起動して STUDIO_URL に渡す。
// 単独で動かすときは、start-studio.bat が表示したURLを STUDIO_URL に入れる（未指定なら http://127.0.0.1:8081/）。
export const pageUrl = (name = '') => new URL(`compare/ch1-3/${name ? `${name}/` : ''}`, process.env.STUDIO_URL || 'http://127.0.0.1:8081/').href;
