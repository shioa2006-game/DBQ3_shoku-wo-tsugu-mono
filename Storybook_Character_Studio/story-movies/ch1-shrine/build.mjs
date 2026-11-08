// 第1章の結び「小さな社」（SVGストーリームービー試作）を生成する。Studioのルートで npm.cmd run build:movie -- ch1-shrine。
// 登場人物の頭・胴を parts/cast.json へ書き出し、Python（src/build.py）で index.html を組み立てる。
// 社・小屋・田などの小道具は第3章の結末（ch3-departure）、書の意匠は shared/books.py を使う。
import { buildMovie } from '../shared/build-movie.mjs';
import { CAST } from './cast.mjs';

await buildMovie(new URL('./', import.meta.url), CAST);
