// 第4～5章の新しい人型（段階2）の比較ページ。左は以前の画像と以前の手足の色、右はStudioでコードから
// 描いた頭・胴の分離画像とリグ設定・手足の色。同じ3Dリグ・照明・道具で並べる。
import * as THREE from 'three';
import { HumanoidRig } from '../../../games/ch4-5/src/entities/rig.js';
import { BELK_RIG_PROFILE } from '../../../prototypes/belk-8dir/rig-profile.mjs';
import { ROKU_RIG_PROFILE } from '../../../prototypes/roku-8dir/rig-profile.mjs';
import { KAYA_RIG_PROFILE } from '../../../prototypes/kaya-8dir/rig-profile.mjs';
import { NAGI_RIG_PROFILE } from '../../../prototypes/nagi-8dir/rig-profile.mjs';
import { YOMOGI_RIG_PROFILE } from '../../../prototypes/yomogi-8dir/rig-profile.mjs';
import { SUMI_RIG_PROFILE } from '../../../prototypes/sumi-8dir/rig-profile.mjs';
import { TERU_RIG_PROFILE } from '../../../prototypes/teru-8dir/rig-profile.mjs';
import { HERO2_RIG_PROFILE } from '../../../prototypes/hero2-8dir/rig-profile.mjs';
import { ADVENTURER_RIG_PROFILE } from '../../../prototypes/adventurer-8dir/rig-profile.mjs';
import { HERO2_V02_RIG_PROFILE } from '../../../prototypes/hero2-8dir/v02/rig-profile.mjs';
import { ASAGI_RIG_PROFILE, ASAGI_RIG_COLORS } from '../../../prototypes/asagi-8dir/rig-profile.mjs';

const asset = file => new URL(`../../../games/ch4-5/assets/humanoids/${file}`, import.meta.url).href;
const reference = file => new URL(`../../../references/humanoids/${file}`, import.meta.url).href;
// The code-drawn designs are read from their Studio output, so a change shows here before it is exported to
// the game (tests/node/game-targets.test.mjs checks the game uses the same files).
const studio = id => { const out = file => new URL(`../../../prototypes/${id}-8dir/output/${file}`, import.meta.url).href;
  return { generated: out(`${id}_code_body_8dir.png`), head: out(`${id}_code_head_layer_8dir.png`), torso: out(`${id}_code_torso_layer_8dir.png`) }; };
// A saved earlier prototype (head/torso layers kept in prototypes/<id>-8dir/<version>/).
const saved = (id, version) => { const out = file => new URL(`../../../prototypes/${id}-8dir/${version}/${file}`, import.meta.url).href;
  return { original: out(`${id}_code_body_8dir.png`), originalHead: out(`${id}_code_head_layer_8dir.png`), originalTorso: out(`${id}_code_torso_layer_8dir.png`) }; };
const profiles = {
  asagi: { name: 'アサギ', title: '第6〜7章・大工見習い', chapter: 'ダーマ再興編・制作中',
    original: new URL('../../../prototypes/asagi-8dir/output/reference-normalized.png', import.meta.url).href,
    ...studio('asagi'), tuning: ASAGI_RIG_PROFILE, originalTuning: ASAGI_RIG_PROFILE, colors: ASAGI_RIG_COLORS,
    note: '承認済みの元画像v2から制作。細い目、面長の輪郭、鼻筋と鼻先、黒縁の眼鏡、中央で分けた波打つ髪。浅葱色の作業着と左腰の道具入れ。',
    leftLabel: '元画像v2（合成シート）', rightLabel: 'アサギ・SVG作画（頭と胴を分離）',
    gridLabels: { generated: 'アサギ（SVG）', original: '元画像v2' },
    status: '第6〜7章向けにStudioで制作中です。頭と胴のSVG・PNGと配置設定を保存しています。元画像の合成シートは見た目の比較用です。',
  },
  belk: { name: 'ベルク', title: '鍛冶職人', original: reference('blacksmith_body_8dir.png'), ...studio('belk'), tuning: BELK_RIG_PROFILE,
    note: 'くせのある茶髪、短いあごひげ、えんじの立ち襟、使い込んだ革の胴着と鉄の留め金。',
    colors: { sleeve: 0x6b3a26, hand: 0xc98f66, pants: 0x4a4440, boot: 0x2e2a26, headBack: 0x3a332e, bodyBack: 0x54301f } },
  roku: { name: 'ロク', title: '鉱夫兼炭焼き', original: reference('miner_body_8dir.png'), ...studio('roku'), tuning: ROKU_RIG_PROFILE,
    note: '逆立つ黒髪、無精ひげと小さなあごひげ、黒い立ち襟のシャツに錆色の縁取りの革ベスト。',
    colors: { sleeve: 0x5c5a52, hand: 0xd0a074, pants: 0x4f4436, boot: 0x332b20, headBack: 0x44403a, bodyBack: 0x4a483f } },
  kaya: { name: 'カヤ', title: '町へ帰る住民', original: reference('volcano_villager_body_8dir.png'), ...studio('kaya'), tuning: KAYA_RIG_PROFILE,
    note: '真ん中分けの茶髪と低いまとめ髪、からし色の上着に青い着物、生成りの襟と帯の結び目。',
    colors: { sleeve: 0x8a4a3a, hand: 0xeec39a, pants: 0x6b5233, boot: 0x4a3320, headBack: 0x3c2c22, bodyBack: 0x6e392c },
    generatedColors: { sleeve: 0x4d6d98, headBack: 0x3e2618, bodyBack: 0xa7782a } },
  nagi: { name: 'ナギ', title: '竹林の社守り', original: reference('shrine_keeper_body_8dir.png'), ...studio('nagi'), tuning: NAGI_RIG_PROFILE,
    note: '巫女として描き直し。長い黒髪と切りそろえた前髪、白衣に赤い半襟、赤い袴。元画像は水色の着物で、台詞・手足の色と合っていなかった。',
    colors: { sleeve: 0xf2ecdc, hand: 0xeec39a, pants: 0xa03024, boot: 0x3a2f26, headBack: 0x2b2b33, bodyBack: 0xd8d2c2 } },
  yomogi: { name: 'ヨモギ', title: '薬草の知恵を持つ住民', original: reference('herbalist_body_8dir.png'), ...studio('yomogi'), tuning: YOMOGI_RIG_PROFILE,
    note: '銀髪のまとめ髪、葉の刺繍の緑の頭巾、丸い眼鏡、生成りのベストに緑の立ち襟。',
    colors: { sleeve: 0x6a7a4a, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x5a6a42, bodyBack: 0xcfc4a4 } },
  sumi: { name: 'スミ', title: '鉱山町の住民', original: reference('volcano_villager_body_8dir.png'), ...studio('sumi'), tuning: SUMI_RIG_PROFILE,
    note: '新しくデザイン（元はカヤと同じ画像）。白髪まじりの髪を上でまとめて櫛を挿し、青鼠の着物に藍の帯と前掛け。',
    colors: { sleeve: 0x4a5a6b, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x3c2c22, bodyBack: 0x3c4a58 },
    generatedColors: { sleeve: 0x4b5c6e, headBack: 0x3c2e26 } },
  teru: { name: 'テル', title: '鉱山町の住民', original: reference('volcano_villager_body_8dir.png'), ...studio('teru'), tuning: TERU_RIG_PROFILE,
    note: '新しくデザイン（元はカヤと同じ画像）。炭焼き小屋に隠れていた娘。茶色のおかっぱに錆色の鉢巻き、そばかすと煤、オリーブの作業着。',
    colors: { sleeve: 0x6b6b3a, hand: 0xeec39a, pants: 0x4f4436, boot: 0x332b20, headBack: 0x3c2c22, bodyBack: 0x565626 },
    generatedColors: { headBack: 0x3c2618 } },
  // 主人公シオン（試作03、2026-11-07から両編の主人公）。左は以前の主人公（合成シート・手足の色・リグ設定）。
  hero2: { name: 'シオン', title: '主人公・試作03', original: asset('adventurer_code_body_8dir.png'), originalTuning: ADVENTURER_RIG_PROFILE, ...studio('hero2'), tuning: HERO2_RIG_PROFILE,
    note: '主人公シオン・試作03（2026-11-07から第1～3章・第4～5章の主人公）。頭は試作02のまま（ふわふわの金髪とアホ毛、大きな青い瞳）。生成りの服＋紺のベスト、背中の小さな革のホルダーに深緑の職業の書（金の「開いた本」の紋章）。設定画は references/hero-redesign-8dir-v3.png。左は以前の主人公。試作02との比較は「シオン案02→03」。',
    leftLabel: '以前の主人公', rightLabel: 'シオン（本編の主人公）・頭胴分離とリグ設定', gridLabels: { generated: 'シオン（本編）', original: '以前の主人公' },
    colors: { sleeve: 0x2856a8, hand: 0x7b4a22, pants: 0xc9b78e, boot: 0x6b3f1d, headBack: 0x203f74, bodyBack: 0x24467e },
    generatedColors: { sleeve: 0x293d75, hand: 0xf3c9a4, pants: 0x3b2a22, boot: 0x8a5428, headBack: 0xe1a432, bodyBack: 0x293d75 } },
  // 試作02（v02/ に保存した頭・胴とリグ設定・手足の色）と試作03を同じ3Dリグで並べる。
  hero2v02: { name: 'シオン案02→03', title: '試作02と試作03', ...saved('hero2', 'v02'), originalTuning: HERO2_V02_RIG_PROFILE, ...studio('hero2'), tuning: HERO2_RIG_PROFILE,
    note: 'シオンの試作02（左：生成りの肩掛け・紺のチュニック・紺の本、Studioだけの試作）と試作03（右：生成りの服＋紺のベスト・深緑の本、2026-11-07から本編の主人公）。頭は同じ。',
    leftLabel: 'シオン案・試作02', rightLabel: 'シオン案・試作03', gridLabels: { generated: '試作03', original: '試作02' },
    colors: { sleeve: 0x2c3b7e, hand: 0xf3c9a4, pants: 0x3b2a22, boot: 0x8a5428, headBack: 0xe1a432, bodyBack: 0x2c3b7e },
    generatedColors: { sleeve: 0x293d75, bodyBack: 0x293d75 } },
};
const ids = Object.keys(profiles);
const character = ids.includes(new URLSearchParams(location.search).get('c')) ? new URLSearchParams(location.search).get('c') : 'belk';
const p = profiles[character];
const directions = ['front', 'front_left', 'left', 'back_left', 'back', 'back_right', 'right', 'front_right'];
const labels = ['正面', '左斜め前', '左', '左斜め後', '背面', '右斜め後', '右', '右斜め前'];
const $ = id => document.getElementById(id);
document.title = `${p.name}の8方向試作｜職をつぐ者 ${p.chapter ?? '火山島編'}`;
if (p.chapter) document.querySelector('.eyebrow').textContent = `CHARACTER STUDY / ${p.chapter}`;
if (p.status) $('production-note').textContent = p.status;
$('title').textContent = `${p.name}（${p.title}）を、コードから。`;
$('note').textContent = p.note;
const stageLabels = document.querySelectorAll('.labels>span');
if (p.leftLabel) stageLabels[0].firstChild.textContent = p.leftLabel;
if (p.rightLabel) stageLabels[1].firstChild.textContent = p.rightLabel;
for (const id of ids) {
  const a = document.createElement('a'); a.href = `?c=${id}`; a.textContent = profiles[id].name;
  if (id === character) a.setAttribute('aria-current', 'page');
  $('characters').append(a);
}
$('original-sheet').src = p.original; $('generated-sheet').src = p.generated;
$('head-sheet').src = p.head; $('torso-sheet').src = p.torso;
if (p.leftLabel) {
  $('original-sheet').previousElementSibling.textContent = p.leftLabel;
  $('original-sheet').alt = `${p.name}の元画像・8方向`;
}

// One stage = renderer + scene (same lights and floor) + camera at the gameplay camera's angle.
function makeStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6df, 0x72827e, 2.5));
  const light = new THREE.DirectionalLight(0xfff1d2, 3); light.position.set(-3, 6, 5); scene.add(light);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
  // Same vertical/radial ratio as the gameplay camera (8.2 / 11.5).
  camera.position.set(0, .45 + 3.1 * 8.2 / 11.5, 3.1); camera.lookAt(0, .45, 0);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: 0xdce4de }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.13; scene.add(floor);
  return { renderer, scene, camera };
}
// kind 'original': the earlier image, its limb colours and rig settings; 'generated': the code-drawn
// head/torso layers with this design's rig settings and limb colours.
function makeRig(kind, scene) {
  const rig = kind === 'original'
    ? new HumanoidRig({ sheetUrl: p.original, headSheetUrl: p.originalHead ?? p.original, bodySheetUrl: p.originalTorso ?? p.original, colors: p.colors, tuning: p.originalTuning })
    : new HumanoidRig({ sheetUrl: p.generated, headSheetUrl: p.head, bodySheetUrl: p.torso, colors: { ...p.colors, ...p.generatedColors }, tuning: p.tuning });
  rig.animTime = 0; scene.add(rig.group);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.32, 48), new THREE.MeshBasicMaterial({ color: 0x657966, transparent: true, opacity: .2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.125; shadow.scale.y = .8; scene.add(shadow); rig.shadow = shadow;
  return rig;
}
const { renderer, scene, camera } = makeStage($('scene'));
const rigs = ['original', 'generated'].map(kind => makeRig(kind, scene));

// 8 directions at once: one rig per direction for each side, drawn in a 4 x 2 grid (2 x 4 on a phone).
const sideLabels = p.gridLabels ?? { generated: `${p.name}（コード生成）`, original: p.leftLabel ?? '以前の画像' };
const grid = { ...makeStage($('grid')), side: 'generated' };
grid.sets = Object.fromEntries(['generated', 'original'].map(kind => [kind, directions.map(direction => {
  const rig = makeRig(kind, grid.scene); rig.setDirection(direction); return rig;
})]));
for (const side of ['generated', 'original']) {
  const button = document.createElement('button'); button.textContent = sideLabels[side]; button.dataset.gridSide = side;
  button.onclick = () => setState({ gridSide: side }); $('grid-sides').append(button);
}
$('grid-labels').innerHTML = labels.map(label => `<span>${label}</span>`).join('');
const gridColumns = () => matchMedia('(max-width:650px)').matches ? 2 : 4;
const state = { direction: 'front', action: 'idle', auto: false, tool: '', water: false, paused: false, gridSide: 'generated' };
for (let i = 0; i < directions.length; i++) {
  const button = document.createElement('button'); button.textContent = labels[i]; button.dataset.direction = directions[i];
  button.onclick = () => setState({ direction: directions[i], auto: false }); $('directions').append(button);
}
function setState(next) {
  Object.assign(state, next);
  for (const rig of rigs) { rig.setDirection(state.direction); rig.setTool(state.tool || null); rig.setSubmersion(state.water ? 1 : 0); }
  grid.side = state.gridSide;
  for (const rig of Object.values(grid.sets).flat()) { rig.setTool(state.tool || null); rig.setSubmersion(state.water ? 1 : 0); }
  document.querySelectorAll('[data-grid-side]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.gridSide === state.gridSide)));
  $('grid-tool').value = state.tool;
  document.querySelectorAll('[data-direction]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.direction === state.direction)));
  document.querySelectorAll('[data-action]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.action === state.action)));
  $('rotate').setAttribute('aria-pressed', String(state.auto));
  $('tool').value = state.tool; $('water').checked = state.water;
}
document.querySelectorAll('[data-action]').forEach(b => b.onclick = () => setState({ action: b.dataset.action }));
$('rotate').onclick = () => setState({ auto: !state.auto }); $('tool').onchange = () => setState({ tool: $('tool').value }); $('water').onchange = () => setState({ water: $('water').checked });
$('grid-tool').onchange = () => setState({ tool: $('grid-tool').value });
let last = 0, rotationTime = 0, attackTime = 1;
const loaded = r => r.headTexture.image?.width && r.bodyTexture.image?.width;
const ready = () => rigs.every(loaded) && Object.values(grid.sets).flat().every(loaded);
// Each half of the canvas has its own view centred on its model. With one camera for both,
// the left model was seen slightly from its right and the right one from its left, so the
// same boots looked turned differently. Both are now seen from the same angle, as in the game.
function resize() {
  const c = $('scene'); renderer.setSize(c.clientWidth, c.clientHeight, false);
  camera.aspect = c.clientWidth / 2 / c.clientHeight;
  camera.zoom = camera.aspect < .78 ? .76 : 1; camera.updateProjectionMatrix();
  const g = $('grid'), cols = gridColumns(); grid.renderer.setSize(g.clientWidth, g.clientHeight, false);
  grid.camera.aspect = g.clientWidth / cols / (g.clientHeight / (8 / cols));
  // Larger than the two-figure stage: one figure per cell, with room left for a raised tool.
  grid.camera.zoom = grid.camera.aspect < .78 ? 1.25 : 1.5; grid.camera.updateProjectionMatrix();
}
function draw() {
  const { width, height } = renderer.getSize(new THREE.Vector2());
  renderer.setScissorTest(true);
  rigs.forEach((rig, i) => {
    rigs.forEach((r, j) => { r.group.visible = r.shadow.visible = i === j; });
    renderer.setViewport(i * width / 2, 0, width / 2, height); renderer.setScissor(i * width / 2, 0, width / 2, height);
    renderer.render(scene, camera);
  });
  renderer.setScissorTest(false);
  rigs.forEach(r => { r.group.visible = r.shadow.visible = true; });
  drawGrid();
}
function drawGrid() {
  const { width, height } = grid.renderer.getSize(new THREE.Vector2());
  const cols = gridColumns(), rows = 8 / cols, w = width / cols, h = height / rows, all = Object.values(grid.sets).flat();
  grid.renderer.setScissorTest(true);
  grid.sets[grid.side].forEach((rig, i) => {
    all.forEach(r => { r.group.visible = r.shadow.visible = r === rig; });
    const x = (i % cols) * w, y = (rows - 1 - Math.floor(i / cols)) * h;
    grid.renderer.setViewport(x, y, w, h); grid.renderer.setScissor(x, y, w, h);
    grid.renderer.render(grid.scene, grid.camera);
  });
  grid.renderer.setScissorTest(false);
}
function renderFrame(now) {
  const dt = state.paused ? 0 : Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
  if (state.auto && (rotationTime += dt) > 1.1) { rotationTime = 0; setState({ direction: directions[(directions.indexOf(state.direction) + 1) % 8] }); }
  const gridRigs = Object.values(grid.sets).flat();
  if (state.action === 'attack' && (attackTime += dt) > .85) { attackTime = 0; rigs.forEach(r => r.startAttack()); gridRigs.forEach(r => r.startAttack()); }
  rigs.forEach(r => r.update(dt, state.action === 'walk'));
  gridRigs.forEach(r => r.update(dt, state.action === 'walk'));
  draw();
  $('status').textContent = ready() ? `${labels[directions.indexOf(state.direction)]} / ${state.action === 'walk' ? '歩行' : state.action === 'attack' ? '攻撃' : '待機'} · 同じ照明・同じ3D手足 / 右：頭・胴の分離画像とリグ設定` : '画像を読み込んでいます…';
  requestAnimationFrame(renderFrame);
}
// Only exposed by this dedicated prototype page for visual checks.
window.__heroPreview = { setState, ready, rigs, renderer, scene, camera, state, character,
  grid: { sets: grid.sets, renderer: grid.renderer, camera: grid.camera, get side() { return grid.side; },
    snapshot: () => ({ side: grid.side, directions: grid.sets[grid.side].map(r => r.direction), tools: grid.sets[grid.side].map(r => r.toolKind), columns: gridColumns() }) },
  pose(time = 0) { [...rigs, ...Object.values(grid.sets).flat()].forEach(r => { r.walkTime = time; r.animTime = time; r.attackT = state.action === 'attack' ? .6 : 0; r.update(0, state.action === 'walk'); }); draw(); },
  snapshot() { return { ...state, character, ready: ready(), textureSizes: rigs.map(r => [r.headTexture.image?.width, r.headTexture.image?.height]), directions: rigs.map(r => r.direction), tools: rigs.map(r => r.toolKind) }; },
};
window.addEventListener('error', event => $('error').textContent = event.message);
const observer = new ResizeObserver(resize); observer.observe($('scene')); observer.observe($('grid'));
setState({}); resize(); requestAnimationFrame(renderFrame);
