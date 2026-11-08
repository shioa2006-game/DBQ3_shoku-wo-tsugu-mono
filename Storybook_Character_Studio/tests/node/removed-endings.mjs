// 削除した文字の章末（親リポジトリの docs/story/reference/removed-text-endings.md）を読む、ムービーのテスト用の部品。
// M1・M4・M5・M7 の字幕は、この文の行を語の順を変えずに使っている。章末の文は2026-11-08にゲームから削除した。
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DOC = new URL('../../../docs/story/reference/removed-text-endings.md', import.meta.url);

/** 見出し（例: '第1章の章末'）の節にある ```text の行（空行は記録していない）。 */
export async function removedEnding(heading) {
  const doc = (await readFile(fileURLToPath(DOC), 'utf8')).replace(/\r\n/g, '\n');
  const section = doc.split(`\n## ${heading}\n`)[1];
  if (!section) throw Error(`removed-text-endings.md: 「${heading}」の節がない`);
  return section.match(/```text\n([\s\S]*?)\n```/)[1].split('\n');
}
