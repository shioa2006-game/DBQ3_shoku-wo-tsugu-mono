// SVGストーリームービーを1本生成する。Studioのルートで npm.cmd run build:movie -- <フォルダ名>（例: ch3-departure）。
// 各ムービーの <フォルダ名>/build.mjs を実行する。プロローグは npm.cmd run build:prologue。
import { readdir, stat } from 'node:fs/promises';

const slug = process.argv[2];
const here = new URL('./', import.meta.url);
const exists = url => stat(url).then(() => true, () => false);
if (!slug || !/^[a-z0-9-]+$/.test(slug) || !(await exists(new URL(`./${slug}/build.mjs`, here)))) {
  const all = [];
  for (const d of await readdir(here, { withFileTypes: true })) if (d.isDirectory() && await exists(new URL(`./${d.name}/build.mjs`, here))) all.push(d.name);
  console.error(`使い方: npm.cmd run build:movie -- <フォルダ名>（${all.join(' / ')}）`);
  process.exit(2);
}
await import(new URL(`./${slug}/build.mjs`, here));
