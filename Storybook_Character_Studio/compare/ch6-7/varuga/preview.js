// グロムとヴァルガを同じ倍率・カメラで比較。ゲームの既存リグを読み取り専用で利用。
import * as THREE from 'three';
import { DragonRig } from '../../../games/ch4-5/src/entities/dragon.js';
import { GROM_CONFIG } from '../../../games/ch4-5/src/entities/dragon-configs.js';

import { VARUGA_CONFIG } from '../../../prototypes/varuga-8dir/rig-profile.mjs';
import { MOTIONS } from '../../../prototypes/varuga-8dir/motion.mjs';
import { VarugaRig } from '../../../prototypes/varuga-8dir/rig.js';
const gromAsset = file => new URL(`../../../prototypes/grom-8dir/output/${file}`, import.meta.url).href;
const configs = [
  { ...GROM_CONFIG, headUrl: gromAsset('grom_code_head_8dir.png'), bodyUrl: gromAsset('grom_code_body_8dir.png') },
  VARUGA_CONFIG,
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
const rigs = configs.map((c, i) => { const r = i === 0 ? new DragonRig(c) : new VarugaRig(c); scene.add(r.group); return r; });
const origin = new THREE.Vector3(0, GROM_CONFIG.hover, 0);
// The gameplay camera's angle (8.2 / 11.5), pulled back to fit the wings.
const d = 18.5; camera.position.set(0, 4 + d * 8.2 / 11.5, d); camera.lookAt(0, 4, 0);
const state = { direction: 'front', auto: false, paused: true, mode: 'flight' };
let turn = 0, last = 0;
function setState(next) {
  if (next.mode && next.mode !== state.mode) {
    rigs[1].setMotion(next.mode);
    rigs.forEach(r => { r.time = 0; });
  }
  Object.assign(state, next);
  $('mode').value = state.mode;
  const duration = MOTIONS[state.mode].duration;
  $('timeline').hidden = !duration;
  $('time').max = duration || 1;
  const [x, z] = facing[directions.indexOf(state.direction)];
  for (const r of rigs) r.facing.set(x, z);
  document.querySelectorAll('[data-direction]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.direction === state.direction)));
  $('motion').setAttribute('aria-pressed', String(!state.paused));
  $('motion').textContent = state.paused ? (state.mode === 'flight' ? '浮遊を再生' : '再生する') : '静止する';
  $('rotate').setAttribute('aria-pressed', String(state.auto));
}
directions.forEach((dir, i) => { const b = document.createElement('button'); b.textContent = labels[i]; b.dataset.direction = dir; b.onclick = () => setState({ direction: dir, auto: false }); $('directions').append(b); });
$('mode').onchange = () => { setState({ mode: $('mode').value, paused: $('mode').value === 'ground' }); step(0); };
$('restart').onclick = () => { pose(0); setState({ paused: false }); };
$('time').oninput = () => { setState({ paused: true }); pose(Number($('time').value)); };
$('motion').onclick = () => {
  if (state.paused && rigs[1].poseState.done) pose(0);
  setState({ paused: !state.paused });
};
$('rotate').onclick = () => setState({ auto: !state.auto });
const ready = () => rigs.every(r => [r.body, ...r.heads.map(h => h.sprite)].every(s => s.texA.image?.width)) && !!rigs[1].openHeadTexture.image?.width;
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
function step(dt) {
  const duration = MOTIONS[state.mode].duration;
  const delta = duration ? Math.min(dt, Math.max(0, duration - rigs[1].motionTime)) : dt;
  for (const r of rigs) r.update(delta, origin, 0, false);
  if (duration && rigs[1].motionTime >= duration && !state.paused) setState({ paused: true });
  $('time').value = Math.min(rigs[1].motionTime, duration || 0);
  $('time-label').textContent = `${rigs[1].motionTime.toFixed(2)}秒`;
  draw();
}
function resize() {
  const c = $('scene'); renderer.setSize(c.clientWidth, c.clientHeight, false);
  camera.aspect = c.clientWidth / 2 / c.clientHeight; camera.zoom = Math.min(1, camera.aspect / .95); camera.updateProjectionMatrix(); step(0);
}
function frame(now) {
  const elapsed = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
  const dt = state.paused ? 0 : elapsed;
  if (state.auto && (turn += elapsed) > 1.4) { turn = 0; setState({ direction: directions[(directions.indexOf(state.direction) + 1) % 8] }); }
  step(dt);
  $('status').textContent = ready() ? `${labels[directions.indexOf(state.direction)]} · ${MOTIONS[state.mode].label} · ${rigs[1].poseState.phase} · 同じ倍率` : '読み込み中…';
  requestAnimationFrame(frame);
}
function pose(time = 0) { rigs.forEach(r => { r.time = time; }); rigs[1].motionTime = time; step(0); }
pose();
// Only exposed by this dedicated prototype page for visual checks.
window.__dragonPreview = { rigs, scene, camera, renderer, state, ready, setState, step, draw, pose };
window.addEventListener('error', e => $('error').textContent = e.message);
setState({}); new ResizeObserver(resize).observe($('scene')); resize(); requestAnimationFrame(frame);
