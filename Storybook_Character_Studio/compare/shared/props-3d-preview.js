// 設置物の比較ページ。左は本編の PropRenderer が作る今の形、右は Studio 原本（prototypes/props-3d/models.mjs）の新しい形。
// 第1～3章と第4～5章で同じファイルを使う。編ごとの設定は index.html の body の data 属性
// （data-game・data-spikes・data-grain）で渡し、その編のブロックにある設置物だけを並べる。
// 本編のコードは、Studioのサーバーが配る games/<data-game>/ から読む。
import * as THREE from 'three';
import { createPropModels, PROP_MODEL_NAMES } from '../../prototypes/props-3d/models.mjs';

const gameModule = (path) => import(new URL(`../../games/${document.body.dataset.game}/src/${path}`, import.meta.url).href);
const [{ B, drawTileIcon }, { PropRenderer }] = await Promise.all([gameModule('world/blocks.js'), gameModule('world/props.js')]);

const LABELS = {
  SCARECROW: 'かかし', TORCH: 'たいまつ', BED: 'わらのベッド', TORII: '鳥居', DOOR: '木の扉', WORKBENCH: '作業台', ALTAR: '職業の祭壇', SPIKES: 'とげ罠',
  FENCE: '柵（3つ並べる）', CHEST: '収納箱', KAMADO: 'かまど', TABLE: 'ちゃぶ台', HELM: '舵輪', BANNER: '職業の旗',
  CROP1: '稲のなえ', CROP2: '育つ稲', CROP3: '実った稲', BUSH: 'わら草', MUSHROOM: 'きのこ',
  FISH_SPOT: '魚のかげ', MINE_LAMP: '坑道灯', KILN: '炭焼き窯', FORGE: '炉', ANVIL: '金床', TROUGH: '水桶', IRON_POT: '鉄鍋',
  TAINT_STONE: '穢れ石', INCENSE_PLANT: '清めの香草', PRAYER_PILLAR: '祈り柱',
};
const GAME = { spikes: document.body.dataset.spikes ?? 'stone', grain: document.body.dataset.grain ?? 'rice' };
const NAMES = PROP_MODEL_NAMES.filter((name) => B[name] !== undefined);
// 隣とつながる設置物は、同じものを x 方向に3つ並べて見せる。
const ROW = { FENCE: [-1, 0, 1] };
const DIRECTION_LABELS = ['初期', '+45°', '+90°', '+135°', '+180°', '+225°', '+270°', '+315°'];
// ゲームのカメラ（main.js）: 初期の向き atan2(6.5, 8.0)、45°刻み、高さ8.2・半径11.5、画角40°。
const YAW0 = Math.atan2(6.5, 8.0), CAMERA_HEIGHT = 8.2, CAMERA_RADIUS = 11.5;
const $ = (id) => document.getElementById(id);

// ブロックの16px模様を、繰り返し貼れるテクスチャにする（本編と同じ Nearest）。
const tiles = new Map();
function tile(name) {
  if (!tiles.has(name)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    drawTileIcon(canvas.getContext('2d'), name, 0, 0, 16);
    const t = new THREE.CanvasTexture(canvas);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    tiles.set(name, t);
  }
  return tiles.get(name);
}
const models = createPropModels(THREE, { tile, ...GAME });

// 足もとの草地（3×3マス）。上面は草、横は草の側面の模様。
function ground() {
  const mats = ['grass_side', 'grass_side', 'grass_top', 'dirt', 'grass_side', 'grass_side'].map((n) => {
    const t = tile(n).clone();
    t.repeat.set(3, n === 'grass_top' ? 3 : 1);
    t.needsUpdate = true;
    return new THREE.MeshLambertMaterial({ map: t });
  });
  const g = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), mats);
  g.position.y = -0.5;
  return g;
}

// 魚のかげ用の足もと: 砂の底と、ゲームと同じ高さ（0.12 下げた）の半透明の水面。
function seabed() {
  const g = new THREE.Group();
  const sandTex = tile('sand').clone();
  sandTex.repeat.set(3, 3);
  sandTex.needsUpdate = true;
  const sand = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), new THREE.MeshLambertMaterial({ map: sandTex }));
  sand.position.y = -1.5;
  const waterTex = tile('water').clone();
  waterTex.repeat.set(3, 3);
  waterTex.needsUpdate = true;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.66, depthWrite: false, side: THREE.DoubleSide }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.12;
  water.renderOrder = 2;
  g.add(sand, water);
  g.visible = false;
  return g;
}

function makeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fb5c9);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x63724f, 2.4);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(20, 30, 14);
  const torchLight = new THREE.PointLight(0xffa54f, 0, 7, 1.6);
  torchLight.position.set(0, 0.8, 0);
  const land = ground(), sea = seabed();
  scene.add(hemi, sun, torchLight, land, sea);
  return { scene, hemi, sun, torchLight, land, sea, holder: new THREE.Group() };
}
const views = [makeScene(), makeScene()];
for (const v of views) v.scene.add(v.holder);

// 今の本編の形: 小さな仮の世界で PropRenderer に作らせる（柵は隣とつながった状態）。
function currentProp(name) {
  const offsets = ROW[name] ?? [0];
  const cells = new Set(offsets.map((dx) => `${2 + dx},1,1`));
  const world = { get: (x, y, z) => (cells.has(`${x},${y},${z}`) ? B[name] : 0), onChange() {} };
  const renderer = new PropRenderer(world, new THREE.Scene());
  const g = new THREE.Group();
  for (const prop of [...renderer.props.values()]) {
    prop.position.set(prop.userData.cell.x - 2, 0, 0);
    g.add(prop);
  }
  return g;
}
function newProp(name) {
  const offsets = ROW[name] ?? [0];
  const g = new THREE.Group();
  for (const dx of offsets) {
    const prop = models[name]({ connects: (ox, oz) => oz === 0 && offsets.includes(dx + ox) });
    prop.position.x = dx;
    g.add(prop);
  }
  return g;
}

const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setScissorTest(true);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

const state = { prop: NAMES[0], direction: 0, auto: false, night: false, open: false, zoom: 'near' };
let props = [null, null], turn = 0, last = 0, time = 0;

function countMeshes(obj) {
  let meshes = 0, outlines = 0;
  obj.traverse((o) => { if (o.isMesh) { meshes += 1; if (o.userData.outline) outlines += 1; } });
  return { meshes, outlines };
}

function setState(next) {
  const prevProp = state.prop;
  Object.assign(state, next);
  if (!NAMES.includes(state.prop) || !(state.direction >= 0 && state.direction < 8)) throw Error('Invalid preview state');
  if (!props[0] || prevProp !== state.prop) {
    props = [currentProp(state.prop), newProp(state.prop)];
    views.forEach((v, i) => {
      v.holder.clear();
      v.holder.add(props[i]);
      v.land.visible = state.prop !== 'FISH_SPOT';
      v.sea.visible = state.prop === 'FISH_SPOT';
    });
  }
  for (const v of views) {
    v.hemi.intensity = state.night ? 0.55 : 2.4;
    v.sun.intensity = state.night ? 0.15 : 2.0;
    v.scene.background.set(state.night ? 0x1b2638 : 0x8fb5c9);
    v.torchLight.intensity = state.night ? 14 : 0;
  }
  for (const p of props) {
    const hinge = p.getObjectByName('hinge');
    if (hinge) hinge.rotation.y = state.open ? -Math.PI / 2.2 : 0;
  }
  document.querySelectorAll('[data-prop]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.prop === state.prop)));
  document.querySelectorAll('[data-direction]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.direction) === state.direction)));
  $('rotate').setAttribute('aria-pressed', String(state.auto));
  $('night').checked = state.night;
  $('open').checked = state.open;
  $('zoom').value = state.zoom;
  const [a, b] = props.map(countMeshes);
  $('status').textContent = `${LABELS[state.prop]} / カメラ ${DIRECTION_LABELS[state.direction]} · 部品数 今${a.meshes - a.outlines}→新${b.meshes - b.outlines}（輪郭線${b.outlines}）`;
  render();
}

function placeCamera() {
  const box = new THREE.Box3().setFromObject(props[1]);
  const height = Math.max(1, box.max.y);
  const target = new THREE.Vector3(0, state.zoom === 'game' ? 0.9 : height * 0.45, 0);
  const scale = state.zoom === 'game' ? 1 : (0.15 + height * 0.085);
  const yaw = YAW0 + state.direction * (Math.PI / 4);
  camera.position.set(target.x + Math.sin(yaw) * CAMERA_RADIUS * scale, target.y + CAMERA_HEIGHT * scale, target.z + Math.cos(yaw) * CAMERA_RADIUS * scale);
  camera.lookAt(target);
}

function render() {
  const canvas = $('scene');
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = (w / 2) / h;
  camera.updateProjectionMatrix();
  placeCamera();
  views.forEach((v, i) => {
    renderer.setViewport(i * w / 2, 0, w / 2, h);
    renderer.setScissor(i * w / 2, 0, w / 2, h);
    renderer.render(v.scene, camera);
  });
}

// ゲームの PropRenderer.update と同じ動き（炎のゆらぎ・旗のなびき・稲の揺れ）。
function animate(dt) {
  time += dt;
  for (const holder of props) {
    for (const p of holder?.children ?? []) {
      if (p.userData.torch) {
        const s = 1 + Math.sin(time * 9 + p.position.x * 7) * 0.18;
        p.getObjectByName('flame')?.scale.set(s, 1.15 - s * 0.15, s);
      }
      if (p.userData.banner) {
        const pos = p.getObjectByName('flag').geometry.attributes.position;
        for (let i = 0; i < pos.count; i += 1) pos.setZ(i, Math.sin(time * 4 + pos.getX(i) * 3.5) * 0.06 * (pos.getX(i) + 0.45));
        pos.needsUpdate = true;
      }
      if (p.userData.sway) p.rotation.z = Math.sin(time * 1.8 + p.position.x) * 0.05;
    }
  }
}

for (const name of NAMES) {
  const b = document.createElement('button');
  b.textContent = LABELS[name];
  b.dataset.prop = name;
  b.onclick = () => setState({ prop: name });
  $('props').append(b);
}
DIRECTION_LABELS.forEach((label, i) => {
  const b = document.createElement('button');
  b.textContent = label;
  b.dataset.direction = String(i);
  b.onclick = () => setState({ direction: i, auto: false });
  $('directions').append(b);
});
$('rotate').onclick = () => setState({ auto: !state.auto });
$('night').onchange = () => setState({ night: $('night').checked });
$('open').onchange = () => setState({ open: $('open').checked });
$('zoom').onchange = () => setState({ zoom: $('zoom').value });

function frame(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
  last = now;
  if (state.auto && (turn += dt) > 1.1) {
    turn = 0;
    setState({ direction: (state.direction + 1) % 8 });
  }
  animate(dt);
  render();
  requestAnimationFrame(frame);
}

window.__propsPreview = { models, views, camera, renderer, state, setState, currentProp, newProp, countMeshes, render };
window.addEventListener('error', (e) => { $('error').textContent = e.message; });
new ResizeObserver(() => render()).observe($('scene'));
setState({});
requestAnimationFrame(frame);
