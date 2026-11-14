// 三頭魔竜の襲来「三つ首の影」（SVGストーリームービー試作・M12）を生成する。
// Studioのルートで npm.cmd run build:movie -- ch7-three-heads。
// ヴァルガの頭・開口頭・胴（Studioの作画コード）を parts/varga.json へ書き出し、Python（src/build.py）で index.html を組み立てる。
import { writeFile, mkdir } from 'node:fs/promises';
import { buildMovie } from '../shared/build-movie.mjs';
import { vargaPartsJson } from '../shared/varga.mjs';
import { CAST, VARGA } from './cast.mjs';

const here = new URL('./', import.meta.url);
await mkdir(new URL('./parts/', here), { recursive: true });
await writeFile(new URL('./parts/varga.json', here), vargaPartsJson(VARGA));
console.log('parts/varga.json を書き出しました');
await buildMovie(here, CAST);
