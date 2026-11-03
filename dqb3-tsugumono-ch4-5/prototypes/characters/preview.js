// 第4～5章の新しい人型（段階2）の比較ページ。左は以前の画像と以前の手足の色、右はStudioでコードから
// 描いた頭・胴の分離画像とリグ設定・手足の色。同じ3Dリグ・照明・道具で並べる。
import * as THREE from 'three';
import { HumanoidRig } from '../../src/entities/rig.js';
import { BELK_RIG_PROFILE } from '../../src/content/rig-profiles/belk.mjs';
import { ROKU_RIG_PROFILE } from '../../src/content/rig-profiles/roku.mjs';
import { KAYA_RIG_PROFILE } from '../../src/content/rig-profiles/kaya.mjs';
import { NAGI_RIG_PROFILE } from '../../src/content/rig-profiles/nagi.mjs';
import { YOMOGI_RIG_PROFILE } from '../../src/content/rig-profiles/yomogi.mjs';
import { SUMI_RIG_PROFILE } from '../../src/content/rig-profiles/sumi.mjs';
import { TERU_RIG_PROFILE } from '../../src/content/rig-profiles/teru.mjs';

const asset = file => new URL(`../../assets/humanoids/${file}`, import.meta.url).href;
const code = id => ({ generated: asset(`${id}_code_body_8dir.png`), head: asset(`${id}_code_head_layer_8dir.png`), torso: asset(`${id}_code_torso_layer_8dir.png`) });
const profiles = {
  belk: { name: 'ベルク', title: '鍛冶職人', original: asset('blacksmith_body_8dir.png'), ...code('belk'), tuning: BELK_RIG_PROFILE,
    note: 'くせのある茶髪、短いあごひげ、えんじの立ち襟、使い込んだ革の胴着と鉄の留め金。',
    colors: { sleeve: 0x6b3a26, hand: 0xc98f66, pants: 0x4a4440, boot: 0x2e2a26, headBack: 0x3a332e, bodyBack: 0x54301f } },
  roku: { name: 'ロク', title: '鉱夫兼炭焼き', original: asset('miner_body_8dir.png'), ...code('roku'), tuning: ROKU_RIG_PROFILE,
    note: '逆立つ黒髪、無精ひげと小さなあごひげ、黒い立ち襟のシャツに錆色の縁取りの革ベスト。',
    colors: { sleeve: 0x5c5a52, hand: 0xd0a074, pants: 0x4f4436, boot: 0x332b20, headBack: 0x44403a, bodyBack: 0x4a483f } },
  kaya: { name: 'カヤ', title: '町へ帰る住民', original: asset('volcano_villager_body_8dir.png'), ...code('kaya'), tuning: KAYA_RIG_PROFILE,
    note: '真ん中分けの茶髪と低いまとめ髪、からし色の上着に青い着物、生成りの襟と帯の結び目。',
    colors: { sleeve: 0x8a4a3a, hand: 0xeec39a, pants: 0x6b5233, boot: 0x4a3320, headBack: 0x3c2c22, bodyBack: 0x6e392c },
    generatedColors: { sleeve: 0x4d6d98, headBack: 0x3e2618, bodyBack: 0xa7782a } },
  nagi: { name: 'ナギ', title: '竹林の社守り', original: asset('shrine_keeper_body_8dir.png'), ...code('nagi'), tuning: NAGI_RIG_PROFILE,
    note: '巫女として描き直し。長い黒髪と切りそろえた前髪、白衣に赤い半襟、赤い袴。元画像は水色の着物で、台詞・手足の色と合っていなかった。',
    colors: { sleeve: 0xf2ecdc, hand: 0xeec39a, pants: 0xa03024, boot: 0x3a2f26, headBack: 0x2b2b33, bodyBack: 0xd8d2c2 } },
  yomogi: { name: 'ヨモギ', title: '薬草の知恵を持つ住民', original: asset('herbalist_body_8dir.png'), ...code('yomogi'), tuning: YOMOGI_RIG_PROFILE,
    note: '銀髪のまとめ髪、葉の刺繍の緑の頭巾、丸い眼鏡、生成りのベストに緑の立ち襟。',
    colors: { sleeve: 0x6a7a4a, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x5a6a42, bodyBack: 0xcfc4a4 } },
  sumi: { name: 'スミ', title: '鉱山町の住民', original: asset('volcano_villager_body_8dir.png'), ...code('sumi'), tuning: SUMI_RIG_PROFILE,
    note: '新しくデザイン（元はカヤと同じ画像）。白髪まじりの髪を上でまとめて櫛を挿し、青鼠の着物に藍の帯と前掛け。',
    colors: { sleeve: 0x4a5a6b, hand: 0xd8b08a, pants: 0x57503f, boot: 0x3a2f26, headBack: 0x3c2c22, bodyBack: 0x3c4a58 },
    generatedColors: { sleeve: 0x4b5c6e, headBack: 0x3c2e26 } },
  teru: { name: 'テル', title: '鉱山町の住民', original: asset('volcano_villager_body_8dir.png'), ...code('teru'), tuning: TERU_RIG_PROFILE,
    note: '新しくデザイン（元はカヤと同じ画像）。炭焼き小屋に隠れていた娘。茶色のおかっぱに錆色の鉢巻き、そばかすと煤、オリーブの作業着。',
    colors: { sleeve: 0x6b6b3a, hand: 0xeec39a, pants: 0x4f4436, boot: 0x332b20, headBack: 0x3c2c22, bodyBack: 0x565626 },
    generatedColors: { headBack: 0x3c2618 } },
};
const ids = Object.keys(profiles);
const character = ids.includes(new URLSearchParams(location.search).get('c')) ? new URLSearchParams(location.search).get('c') : ids[0];
const p = profiles[character];
const directions = ['front', 'front_left', 'left', 'back_left', 'back', 'back_right', 'right', 'front_right'];
const labels = ['正面', '左斜め前', '左', '左斜め後', '背面', '右斜め後', '右', '右斜め前'];
const $ = id => document.getElementById(id);
document.title = `${p.name}の8方向試作｜職をつぐ者 火山島編`;
$('title').textContent = `${p.name}（${p.title}）を、コードから。`;
$('note').textContent = p.note;
for (const id of ids) {
  const a = document.createElement('a'); a.href = `?c=${id}`; a.textContent = profiles[id].name;
  if (id === character) a.setAttribute('aria-current', 'page');
  $('characters').append(a);
}
$('original-sheet').src = p.original; $('generated-sheet').src = p.generated;
$('head-sheet').src = p.head; $('torso-sheet').src = p.torso;

const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff6df, 0x72827e, 2.5));
const light = new THREE.DirectionalLight(0xfff1d2, 3); light.position.set(-3, 6, 5); scene.add(light);
const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
// Same vertical/radial ratio as the gameplay camera (8.2 / 11.5).
camera.position.set(0, .45 + 3.1 * 8.2 / 11.5, 3.1); camera.lookAt(0, .45, 0);
const rigs = [0, 1].map(index => {
  const rig = index === 0
    ? new HumanoidRig({ sheetUrl: p.original, colors: p.colors })
    : new HumanoidRig({ sheetUrl: p.generated, headSheetUrl: p.head, bodySheetUrl: p.torso, colors: { ...p.colors, ...p.generatedColors }, tuning: p.tuning });
  rig.animTime = 0; scene.add(rig.group);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.32, 48), new THREE.MeshBasicMaterial({ color: 0x657966, transparent: true, opacity: .2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.125; shadow.scale.y = .8; scene.add(shadow); rig.shadow = shadow;
  return rig;
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: 0xdce4de }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -.13; scene.add(floor);
const state = { direction: 'front', action: 'idle', auto: false, tool: '', water: false, paused: false };
for (let i = 0; i < directions.length; i++) {
  const button = document.createElement('button'); button.textContent = labels[i]; button.dataset.direction = directions[i];
  button.onclick = () => setState({ direction: directions[i], auto: false }); $('directions').append(button);
}
function setState(next) {
  Object.assign(state, next);
  for (const rig of rigs) { rig.setDirection(state.direction); rig.setTool(state.tool || null); rig.setSubmersion(state.water ? 1 : 0); }
  document.querySelectorAll('[data-direction]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.direction === state.direction)));
  document.querySelectorAll('[data-action]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.action === state.action)));
  $('rotate').setAttribute('aria-pressed', String(state.auto));
  $('tool').value = state.tool; $('water').checked = state.water;
}
document.querySelectorAll('[data-action]').forEach(b => b.onclick = () => setState({ action: b.dataset.action }));
$('rotate').onclick = () => setState({ auto: !state.auto }); $('tool').onchange = () => setState({ tool: $('tool').value }); $('water').onchange = () => setState({ water: $('water').checked });
let last = 0, rotationTime = 0, attackTime = 1;
const ready = () => rigs.every(r => r.headTexture.image?.width && r.bodyTexture.image?.width);
// Each half of the canvas has its own view centred on its model. With one camera for both,
// the left model was seen slightly from its right and the right one from its left, so the
// same boots looked turned differently. Both are now seen from the same angle, as in the game.
function resize() {
  const c = $('scene'); renderer.setSize(c.clientWidth, c.clientHeight, false);
  camera.aspect = c.clientWidth / 2 / c.clientHeight;
  camera.zoom = camera.aspect < .78 ? .76 : 1; camera.updateProjectionMatrix();
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
}
function renderFrame(now) {
  const dt = state.paused ? 0 : Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
  if (state.auto && (rotationTime += dt) > 1.1) { rotationTime = 0; setState({ direction: directions[(directions.indexOf(state.direction) + 1) % 8] }); }
  if (state.action === 'attack' && (attackTime += dt) > .85) { attackTime = 0; rigs.forEach(r => r.startAttack()); }
  rigs.forEach(r => r.update(dt, state.action === 'walk'));
  draw();
  $('status').textContent = ready() ? `${labels[directions.indexOf(state.direction)]} / ${state.action === 'walk' ? '歩行' : state.action === 'attack' ? '攻撃' : '待機'} · 同じ照明・同じ3D手足 / 右：頭・胴の分離画像とリグ設定` : '画像を読み込んでいます…';
  requestAnimationFrame(renderFrame);
}
// Only exposed by this dedicated prototype page for visual checks.
window.__heroPreview = { setState, ready, rigs, renderer, scene, camera, state, character,
  pose(time = 0) { rigs.forEach(r => { r.walkTime = time; r.animTime = time; r.attackT = state.action === 'attack' ? .6 : 0; r.update(0, state.action === 'walk'); }); draw(); },
  snapshot() { return { ...state, character, ready: ready(), textureSizes: rigs.map(r => [r.headTexture.image?.width, r.headTexture.image?.height]), directions: rigs.map(r => r.direction), tools: rigs.map(r => r.toolKind) }; },
};
window.addEventListener('error', event => $('error').textContent = event.message);
new ResizeObserver(resize).observe($('scene')); setState({}); resize(); requestAnimationFrame(renderFrame);
