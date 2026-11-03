// 竜グロム（段階4）の比較ページ。左は以前の画像、右はStudioでコードから描いた頭・胴。どちらも本編と
// 同じ DragonRig（3Dの首・翼・尾、浮遊、首のうねり）と GROM_CONFIG で、左右それぞれ専用のカメラで描く。
import * as THREE from 'three';
import { DragonRig } from '../../../games/ch4-5/src/entities/dragon.js';
import { GROM_CONFIG } from '../../../games/ch4-5/src/entities/dragon-configs.js';

const asset = file => new URL(`../../../games/ch4-5/assets/dragons/${file}`, import.meta.url).href;
const reference = file => new URL(`../../../references/dragons/${file}`, import.meta.url).href;
const configs = [
  { ...GROM_CONFIG, headUrl: reference('grom_head_8dir.png'), bodyUrl: reference('grom_body_8dir.png') },
  { ...GROM_CONFIG, headUrl: asset('grom_code_head_8dir.png'), bodyUrl: asset('grom_code_body_8dir.png') },
];
const directions = ['front', 'front_left', 'left', 'back_left', 'back', 'back_right', 'right', 'front_right'];
const labels = ['正面', '左斜め前', '左', '左斜め後', '背面', '右斜め後', '右', '右斜め前'];
const facing = [[0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]];
const $ = id => document.getElementById(id);
$('ref-head').src = configs[0].headUrl; $('ref-body').src = configs[0].bodyUrl;
$('code-head').src = configs[1].headUrl; $('code-body').src = configs[1].bodyUrl;

const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff6df, 0x72827e, 2.4));
const sun = new THREE.DirectionalLight(0xfff1d2, 2.6); sun.position.set(-4, 8, 6); scene.add(sun);
const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0xdce4de })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const grid = new THREE.GridHelper(24, 48, 0xc1cfc4, 0xcbd6cc); grid.position.y = .001; scene.add(grid);
const rigs = configs.map(c => { const r = new DragonRig(c); scene.add(r.group); return r; });
const origin = new THREE.Vector3(0, GROM_CONFIG.hover, 0);
// The gameplay camera's angle (8.2 / 11.5), pulled back to fit the wings.
const d = 13; camera.position.set(0, 2.6 + d * 8.2 / 11.5, d); camera.lookAt(0, 2.6, 0);
const state = { direction: 'front', auto: false, paused: false };
let turn = 0, last = 0;
function setState(next) {
  Object.assign(state, next);
  const [x, z] = facing[directions.indexOf(state.direction)];
  for (const r of rigs) r.facing.set(x, z);
  document.querySelectorAll('[data-direction]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.direction === state.direction)));
  $('rotate').setAttribute('aria-pressed', String(state.auto));
}
directions.forEach((dir, i) => { const b = document.createElement('button'); b.textContent = labels[i]; b.dataset.direction = dir; b.onclick = () => setState({ direction: dir, auto: false }); $('directions').append(b); });
$('rotate').onclick = () => setState({ auto: !state.auto });
const ready = () => rigs.every(r => [r.body, ...r.heads.map(h => h.sprite)].every(s => s.texA.image?.width));
function draw() {
  const { width, height } = renderer.getSize(new THREE.Vector2());
  renderer.setScissorTest(true);
  rigs.forEach((rig, i) => {
    rigs.forEach((r, j) => { r.group.visible = i === j; });
    renderer.setViewport(i * width / 2, 0, width / 2, height); renderer.setScissor(i * width / 2, 0, width / 2, height);
    renderer.render(scene, camera);
  });
  renderer.setScissorTest(false);
}
// Advance both rigs by the same time so the neck sway stays in step on both sides.
function step(dt) { for (const r of rigs) r.update(dt, origin, 0, false); draw(); }
function resize() {
  const c = $('scene'); renderer.setSize(c.clientWidth, c.clientHeight, false);
  camera.aspect = c.clientWidth / 2 / c.clientHeight; camera.zoom = camera.aspect < .78 ? .76 : 1; camera.updateProjectionMatrix(); step(0);
}
function frame(now) {
  const dt = state.paused ? 0 : Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
  if (state.auto && (turn += dt) > 1.4) { turn = 0; setState({ direction: directions[(directions.indexOf(state.direction) + 1) % 8] }); }
  step(dt);
  $('status').textContent = ready() ? `${labels[directions.indexOf(state.direction)]} · 本編と同じリグ（3Dの首・翼・尾）と設定` : '読み込み中…';
  requestAnimationFrame(frame);
}
rigs.forEach(r => { r.time = 0; });
// Only exposed by this dedicated prototype page for visual checks.
window.__dragonPreview = { rigs, scene, camera, renderer, state, ready, setState, step, draw };
window.addEventListener('error', e => $('error').textContent = e.message);
setState({}); new ResizeObserver(resize).observe($('scene')); resize(); requestAnimationFrame(frame);
