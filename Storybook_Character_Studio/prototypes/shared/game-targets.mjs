// 各キャラクターを本編のどのゲームへ書き出すか。Studioのテストは、ここに書いた
// ゲームの画像・原画・リグ設定が、このフォルダの出力と同じであることを確かめる。
// 共通のキャラクター（両編に登場する人・モンスター）は、両方のゲームへ書き出す。

import { mkdir, writeFile } from 'node:fs/promises';

export const GAMES = Object.freeze({
  'ch1-3': 'dqb3-tsugumono-ch1-3',
  'ch4-5': 'dqb3-tsugumono-ch4-5',
  'ch6-7': 'dqb3-tsugumono-ch6-7',
});

// kind: 'humanoid'（合成シート1枚）| 'humanoid-layers'（頭・胴の分離＋比較用合成）| 'monster'（A・Bの2枚）| 'dragon'（頭・胴の2枚）
// files: output/ にある画像の名前（拡張子なし）。本編は assets/<dir>/<name>.png、原画は art_src/<name>.src.png。
// rigProfile: リグ設定。本編の src/content/rig-profiles/<id>.mjs に、同じ値の写しを置く。
const humanoid = (id, kind, targets) => ({
  id, folder: `${id}-8dir`, kind, targets, dir: 'humanoids', rigProfile: true,
  files: kind === 'humanoid'
    ? [`${id}_code_body_8dir`]
    : [`${id}_code_head_layer_8dir`, `${id}_code_torso_layer_8dir`, `${id}_code_body_8dir`],
});
const monster = (folder, art, targets) => ({
  id: art, folder: `${folder}-8dir`, kind: 'monster', targets, dir: 'nonhumanoids', rigProfile: false,
  files: [`${art}_code_idle_a_8dir`, `${art}_code_idle_b_8dir`],
});

// Dragons: head and body billboards, one pose each (the game's DragonRig adds the 3D neck, wings and tail).
// extra: more sheets of the same dragon (Varuga's open-mouth head).
const dragon = (folder, id, targets, extra = []) => ({
  id, folder: `${folder}-8dir`, kind: 'dragon', targets, dir: 'dragons', rigProfile: false,
  files: [`${id}_code_head_8dir`, `${id}_code_body_8dir`, ...extra.map((part) => `${id}_code_${part}_8dir`)],
});

export const CHARACTERS = Object.freeze([
  // 以前の主人公（合成シート1枚）。2026-11-07に hero2 へ切り替えたが、比較用に両編へ残す。
  humanoid('adventurer', 'humanoid', ['ch1-3', 'ch4-5']),
  // 主人公シオン（2026-11-07から本編の主人公。頭・胴の分離、胴の中心を描いた位置のまま書き出す）。
  humanoid('hero2', 'humanoid-layers', ['ch1-3', 'ch4-5', 'ch6-7']),
  humanoid('mina', 'humanoid-layers', ['ch1-3', 'ch4-5', 'ch6-7']),
  humanoid('pino', 'humanoid-layers', ['ch1-3', 'ch6-7']), // 第6章で大屋根の棟梁として招聘
  humanoid('inaho', 'humanoid-layers', ['ch1-3']),
  humanoid('gonta', 'humanoid-layers', ['ch1-3', 'ch4-5', 'ch6-7']),
  humanoid('jinbei', 'humanoid-layers', ['ch1-3']),
  humanoid('watari', 'humanoid-layers', ['ch1-3', 'ch4-5', 'ch6-7']),
  // 第4～5章の新しい人型（段階2）。
  humanoid('belk', 'humanoid-layers', ['ch4-5', 'ch6-7']), // 第7章で大型対空ボウガンの機構を作る
  humanoid('roku', 'humanoid-layers', ['ch4-5']),
  humanoid('kaya', 'humanoid-layers', ['ch4-5']),
  humanoid('nagi', 'humanoid-layers', ['ch4-5']),
  humanoid('yomogi', 'humanoid-layers', ['ch4-5']),
  humanoid('sumi', 'humanoid-layers', ['ch4-5']),
  humanoid('teru', 'humanoid-layers', ['ch4-5']),
  // 第6～7章の新しい人型（ダーマの住民）。
  humanoid('suzuha', 'humanoid-layers', ['ch6-7']),
  humanoid('asagi', 'humanoid-layers', ['ch6-7']),
  humanoid('ganzou', 'humanoid-layers', ['ch6-7']),
  monster('slime', 'slime', ['ch1-3']),
  monster('night-bat', 'night_bat', ['ch1-3', 'ch4-5', 'ch6-7']), // 第4～5章は火喰いこうもり・瘴気こうもり、第6章は洞窟こうもり（色替え）
  monster('field-rat', 'field_rat', ['ch1-3', 'ch6-7']), // 第6章は山ねずみ（色替え）
  monster('dorotabo', 'dorotabo', ['ch1-3', 'ch4-5']), // 第4～5章は灰どろたぼう・瘴気どろたぼう（色替え）
  monster('squid', 'squid', ['ch1-3']),
  // 第4～5章の新しいモンスター（段階3）。鬼火は瘴気の鬼火・炉喰らいの大鬼火にも色替え・拡大で使う。
  monster('will-o-wisp', 'will_o_wisp', ['ch4-5']),
  monster('armored-scorpion', 'armored_scorpion', ['ch4-5']),
  monster('volcano-lizard', 'volcano_lizard', ['ch4-5']),
  // 第5章の章ボス（段階4）。
  dragon('grom', 'grom', ['ch4-5']),
  // 第6～7章のモンスター。小岩ガニは大岩ガニ（第6章ボス）にも拡大して使う。
  // ガーゴイルは飛行・地上の2組、岩砕きのガーゴイルは静止・飛行・攻撃の3組（同じ gargoyle-8dir から書き出す）。
  monster('rockhorn-goat', 'rockhorn_goat', ['ch6-7']),
  monster('small-rock-crab', 'small_rock_crab', ['ch6-7']),
  monster('gargoyle', 'gargoyle_flight', ['ch6-7']),
  monster('gargoyle', 'gargoyle_ground', ['ch6-7']),
  monster('gargoyle', 'gargoyle_heavy_ground', ['ch6-7']),
  monster('gargoyle', 'gargoyle_heavy_flight', ['ch6-7']),
  monster('gargoyle', 'gargoyle_heavy_attack', ['ch6-7']),
  // 第7章のボス（通常頭・胴・開口頭）。リグと動作は rig.js・motion.mjs をゲームへ移植する。
  dragon('varuga', 'varuga', ['ch6-7'], ['head_open']),
]);

export const gameUrl = (game, path) => new URL(`../../../${GAMES[game]}/${path}`, import.meta.url);
// 作り直す前の画像（比較用）。ゲームからは外し、Studioの references/ に置く。
export const referenceUrl = (path) => new URL(`../../references/${path}`, import.meta.url);

// ゲームのリグ設定の写し。先頭のコメントだけを書き換え、値は Studio の rig-profile.mjs のまま。
export function runtimeRigProfile(character, studioSource) {
  const body = studioSource.replace(/\r\n/g, '\n').replace(/^(\/\/.*\n)+/, '');
  return `// Runtime copy of Storybook Character Studio: prototypes/${character.folder}/rig-profile.mjs.\n${body}`;
}

// 書き出し（--preview-game）で、対象のゲームすべてへ同じファイルを置く。
export async function writeToGames(character, path, bytes) {
  for (const game of character.targets) {
    const url = gameUrl(game, path);
    await mkdir(new URL('./', url), { recursive: true });
    await writeFile(url, bytes);
  }
}
