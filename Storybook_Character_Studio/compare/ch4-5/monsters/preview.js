// 第4～5章の新しいモンスター（段階3）の比較ページ。左は以前の画像、右はStudioでコードから描いた画像（本編はこちらを使う）。
// 本編と同じ MonsterSprite（倍率・色替え・飛行の高さ・0.38秒ごとのA/B切替）で、左右それぞれ専用のカメラで描く。
import * as THREE from 'three';
import { MonsterSprite } from '../../../games/ch4-5/src/entities/rig.js';
import { fourViewReference } from './four-view-reference.js';

const asset = file => new URL(`../../../games/ch4-5/assets/nonhumanoids/${file}`, import.meta.url).href;
const reference = file => new URL(`../../../references/nonhumanoids/${file}`, import.meta.url).href;
const sheets = (art, code) => ['a', 'b'].map(f => code ? asset(`${art}_code_idle_${f}_8dir.png`) : reference(`${art}_idle_${f}_8dir.png`));
// Same scale, tint and flying lift as src/entities/monsters.js. Variants share the sheets.
const MONSTERS = {
  will_o_wisp: { name: '鬼火', art: 'will_o_wisp', note: '紫の縁から橙・白い芯へ変わる炎。Aは縦長、Bは低く広がって火の粉を散らす。瘴気の鬼火・炉喰らいの大鬼火も同じ画像の色替え・拡大。',
    variants: [['鬼火', .85, 0xffffff, true], ['瘴気の鬼火', .9, 0xb08ad0, true], ['炉喰らいの大鬼火', 2.6, 0xff6a3a, true]] },
  armored_scorpion: { name: '鉄甲サソリ', art: 'armored_scorpion', note: '赤い継ぎ目の鉄色の甲殻、大きな三日月のはさみ、節のある尾と毒針。Aははさみを低く、Bは振り上げて開く。',
    variants: [['鉄甲サソリ', 1.05, 0xffffff, false]] },
  volcano_lizard: { name: '火山トカゲ', art: 'volcano_lizard', note: '炭色の鱗に溶岩のひびの網目、背中へ反る長い尾、細い脚と長い指。Aは低く伏せ、Bは脚を伸ばして頭を上げる。',
    variants: [['火山トカゲ', .95, 0xffffff, false]] },
  rockhorn_goat: { name: '岩角ヤギ', art: 'rockhorn_goat', chapter: 'ダーマ再興編',
    design: new URL('../../../references/rockhorn-goat-4dir-v1.png', import.meta.url),
    output: new URL('../../../prototypes/rockhorn-goat-8dir/output/', import.meta.url),
    note: '第6章の山道に登場予定。Aは通常姿勢、Bは頭を下げて踏ん張る姿勢。左は4方向の参照画で、斜め後ろには背面、右向きには左向きの反転を表示します。',
    variants: [['岩角ヤギ', 1, 0xffffff, false]] },
  small_rock_crab: { name: '小岩ガニ', art: 'small_rock_crab', chapter: 'ダーマ再興編',
    design: new URL('../../../references/small-rock-crab-4dir-v2.png', import.meta.url),
    output: new URL('../../../prototypes/small-rock-crab-8dir/output/', import.meta.url),
    note: '採石洞の岩に紛れるカニ。Aは通常姿勢、Bは両方のハサミを構える姿勢。斜め後ろの参照には背面を使います。大岩ガニは同じ造形を拡大した試作です。',
    variants: [['小岩ガニ', 1, 0xffffff, false], ['大岩ガニ（拡大試作）', 2, 0xffffff, false]] },
  gargoyle: { name: 'ガーゴイル', chapter: 'ダーマ再興編', art: 'gargoyle_flight',
    design: new URL('../../../references/gargoyle-flight-4dir-v1.png', import.meta.url),
    // 背面の左翼が原画の中央線をまたぐので、下段は翼間の余白で区切る。
    regions: [[0,0,625,620],[625,0,636,620],[0,620,550,627],[550,620,711,627]],
    landed: new URL('../../../references/gargoyle-landed-v2.png', import.meta.url),
    output: new URL('../../../prototypes/gargoyle-8dir/output/', import.meta.url),
    note: '第7章の神殿防衛。飛行は翼を広げて羽ばたき、地上は翼を背中に畳んで歩きます。',
    variants: [['飛行',1,0xffffff,true], ['地上',1,0xffffff,false]] },
  gargoyle_heavy: { name:'岩砕きのガーゴイル', chapter:'ダーマ再興編', art:'gargoyle_heavy_ground',
    output:new URL('../../../prototypes/gargoyle-8dir/output/',import.meta.url),
    referenceArt:'gargoyle_ground', referenceScale:1, modes:['ground','flight','attack'],
    note:'体は1.3倍、頭は通常型と同じ大きさ。飛行は翼の上げ下げ、攻撃は両腕の振りかぶりと振り下ろしです。左の通常型と比較できます。',
    variants:[['静止',1.3,0xffffff,false],['飛行',1.3,0xffffff,true],['攻撃',1.3,0xffffff,false]] },
};
const ids = Object.keys(MONSTERS);
const params = new URLSearchParams(location.search);
const id = ids.includes(params.get('c')) ? params.get('c') : ids[0], m = MONSTERS[id];
const directions = ['front', 'front_left', 'left', 'back_left', 'back', 'back_right', 'right', 'front_right'];
const labels = ['正面', '左斜め前', '左', '左斜め後', '背面', '右斜め後', '右', '右斜め前'];
const facing = [[0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]];
const $ = el => document.getElementById(el);
document.title = `${m.name}の8方向試作｜職をつぐ者 ${m.chapter ?? '火山島編'}`;
$('title').textContent = `${m.name}を、コードから。`;
$('note').textContent = m.note;
for (const other of ids) {
  const a = document.createElement('a'); a.href = `?c=${other}`; a.textContent = MONSTERS[other].name;
  if (other === id) a.setAttribute('aria-current', 'page');
  $('characters').append(a);
}
m.variants.forEach(([label], i) => { const o = document.createElement('option'); o.value = i; o.textContent = label; $('variant').append(o); });
const designSheet = m.design && await fourViewReference(m.design,{regions:m.regions});
const studioSheets = art => ['a','b'].map(f => new URL(`${art}_code_idle_${f}_8dir.png`,m.output).href);
const ref = m.referenceArt ? [studioSheets(m.referenceArt)[0],studioSheets(m.referenceArt)[0]] : designSheet ? [designSheet, designSheet] : sheets(m.art, false);
const code = m.output ? studioSheets(m.art) : sheets(m.art, true);
const landedSheet = m.landed && await fourViewReference(m.landed,{singleView:true});
const ground = landedSheet && [[landedSheet,landedSheet],studioSheets('gargoyle_ground')];
if (m.design) {
  document.querySelector('.eyebrow').textContent = `MONSTER STUDY / ${m.chapter}`;
  $('reference-label').textContent = '4方向の参照画';
  for (const f of ['a','b']) {
    const image = $('ref-' + f);
    image.previousElementSibling.textContent = '参照画（通常姿勢）';
    image.alt = '4方向の参照画を比較用に配置したシート';
  }
  $('production-note').textContent = '第6章に向けてStudioで制作中。左は通常姿勢の参照画、右はコードで描いた8方向・2姿勢です。';
}
if(m.modes) {
  document.querySelector('.eyebrow').textContent = `MONSTER STUDY / ${m.chapter}`;
  $('reference-label').textContent = '通常ガーゴイル（1倍）';
  $('scene').setAttribute('aria-label','通常型1倍と岩砕き1.3倍の姿勢と動作を比較');
}


const renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0xdce4de })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const grid = new THREE.GridHelper(16, 64, 0xc1cfc4, 0xcbd6cc); grid.position.y = .001; scene.add(grid);
const state = { direction: 'front', pose: m.modes?'a':'auto', variant: 0, auto: false, water: false, paused: false };
const heavyMode = () => m.modes?.[state.variant];
let rigs = [], shadows = [], elapsed = 0, turn = 0, last = 0;
function build() {
  for (const r of rigs) scene.remove(r.group);
  for (const s of shadows) scene.remove(s);
  const [, scale, tint, flying] = m.variants[state.variant];
  const mode=heavyMode();
  const normal = mode==='flight' ? studioSheets('gargoyle_flight') : ref;
  const [original, drawn] = mode ? [normal,studioSheets('gargoyle_heavy_'+mode)] : ground && !flying ? ground : [ref, code];
  if(mode) {
    const names=mode==='attack'?['振りかぶり','振り下ろし']:mode==='flight'?['翼を上げる','翼を下げる']:['静止姿勢','静止姿勢'];
    $('pose').replaceChildren(...(mode==='ground' ? [new Option('静止姿勢','a')] : [new Option('A/Bを交互に','auto'),new Option('A：'+names[0],'a'),new Option('B：'+names[1],'b')]));
    $('pose').disabled=mode==='ground';
    for(const [i,f] of ['a','b'].entries()) {
      $('ref-'+f).previousElementSibling.textContent='通常型・'+(mode==='flight'?'飛行'+f.toUpperCase():'地上A');
      $('code-'+f).previousElementSibling.textContent='岩砕き・'+names[i];
      $('code-'+f).alt='岩砕きのガーゴイル・'+names[i]+'の8方向';
      $('ref-'+f).alt='通常ガーゴイルの8方向';
      $('ref-'+f).parentElement.hidden=f==='b'&&mode==='ground';
      $('code-'+f).parentElement.hidden=f==='b'&&mode==='ground';
    }
    document.querySelector('section h2').textContent=mode==='ground'?'静止造形の8方向シート':'8方向シート（A・B）';
    document.querySelector('section > p').textContent='4列 × 2行、1セル128px、透明背景。体1.3倍、頭部は通常型と同じ表示サイズ。';
    $('production-note').textContent=mode==='attack'?'両腕を上げて力をため、体を前へ倒して振り下ろします。左は通常型の静止姿勢。壁への命中判定はゲーム制作時に接続します。':mode==='flight'?'翼を上げ下げし、足を後ろへ引いた飛行姿勢です。':'地上の静止姿勢です。「種類」で飛行・攻撃へ切り替えられます。';
  }
  for (const [i, frame] of ['a','b'].entries()) {
    $(`ref-${frame}`).src = original[i]; $(`code-${frame}`).src = drawn[i];
  }
  if (ground) {
    const caption = flying ? '飛行の4方向参照画' : '着地の参照画（左斜め前・固定）';
    $('reference-label').textContent = caption;
    for (const f of ['a','b']) $('ref-'+f).previousElementSibling.textContent = caption;
    $('production-note').textContent = flying ? '第7章の制作素材。斜め後ろの参照には背面を表示します。' : '第7章の制作素材。左は着地修正版の1方向、右はコードで描いた8方向です。';
  }
  const scales = [m.referenceScale ?? scale, scale];
  rigs = [original, drawn].map((s,i) => { const r = new MonsterSprite({ sheetAUrl: s[0], sheetBUrl: s[1], scale:scales[i], tint, yOffset: flying ? .4 : 0 }); scene.add(r.group); return r; });
  shadows = rigs.map((_,i) => {
    const s = new THREE.Mesh(new THREE.CircleGeometry(.3 * scales[i], 48), new THREE.MeshBasicMaterial({ color: 0x657966, transparent: true, opacity: .2, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.y = .002; s.scale.y = .8; scene.add(s); return s;
  });
  // Frame the camera on the sprite's size, at the gameplay camera's angle (8.2 / 11.5).
  const d = 3.1 * Math.max(1, scale * .95), look = .45 * Math.max(1, scale * .8) + (flying ? .4 : 0);
  camera.position.set(0, look + d * 8.2 / 11.5, d); camera.lookAt(0, look, 0);
}
const ready = () => rigs.every(r => r.texA.image?.width && r.texB.image?.width);
function pose(time = 0) {
  const b = state.pose === 'b' || (state.pose === 'auto' && (heavyMode()==='attack' ? (time+1e-9)%1.1>=.75 : Math.floor((time + 1e-9) / .38) % 2 === 1));
  for (const r of rigs) { r.usingA = true; r.material.map = r.texA; r.flipTimer = 0; r.update(b ? .38 : 0); r.flipTimer = time % .38; }
  draw();
}
function draw() {
  const { width, height } = renderer.getSize(new THREE.Vector2());
  renderer.setScissorTest(true);
  rigs.forEach((rig, i) => {
    rigs.forEach((r, j) => { r.group.visible = shadows[j].visible = i === j; });
    renderer.setViewport(i * width / 2, 0, width / 2, height); renderer.setScissor(i * width / 2, 0, width / 2, height);
    renderer.render(scene, camera);
  });
  renderer.setScissorTest(false);
}
function setState(next) {
  const rebuild = next.variant !== undefined && +next.variant !== state.variant;
  Object.assign(state, next, next.variant !== undefined ? { variant: +next.variant } : {});
  if(heavyMode()==='ground') state.pose='a';
  else if(m.modes && rebuild) state.pose='auto';
  if(rebuild) elapsed=0;
  if (rebuild || !rigs.length) build();
  const i = directions.indexOf(state.direction);
  const [, , tint] = m.variants[state.variant];
  for (const r of rigs) { r.faceWorld(...facing[i], 0); r.mesh.rotation.y = 0; r.setVisualTint(tint, state.water ? 1 : 0); }
  document.querySelectorAll('[data-direction]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.direction === state.direction)));
  $('pose').value = state.pose; $('variant').value = String(state.variant); $('water').checked = state.water; $('rotate').setAttribute('aria-pressed', String(state.auto));
  pose(elapsed);
}
directions.forEach((d, i) => { const b = document.createElement('button'); b.textContent = labels[i]; b.dataset.direction = d; b.onclick = () => setState({ direction: d, auto: false }); $('directions').append(b); });
$('pose').onchange = () => { elapsed = 0; setState({ pose: $('pose').value }); };
$('variant').onchange = () => setState({ variant: $('variant').value });
$('water').onchange = () => setState({ water: $('water').checked }); $('rotate').onclick = () => setState({ auto: !state.auto });
function resize() {
  const c = $('scene'); renderer.setSize(c.clientWidth, c.clientHeight, false);
  camera.aspect = c.clientWidth / 2 / c.clientHeight; camera.zoom = camera.aspect < .78 ? .76 : 1; camera.updateProjectionMatrix(); pose(elapsed);
}
function frame(now) {
  const dt = state.paused ? 0 : Math.min(.05, last ? (now - last) / 1000 : 0); last = now; elapsed += dt;
  if (state.auto && (turn += dt) > 1.1) { turn = 0; setState({ direction: directions[(directions.indexOf(state.direction) + 1) % 8] }); }
  pose(elapsed);
  $('status').textContent = ready() ? (m.modes ? `${labels[directions.indexOf(state.direction)]} / ${m.variants[state.variant][0]} · ${rigs[1].usingA?'A':'B'} · 通常型1倍 / 岩砕き1.3倍 · Studio試作` : `${labels[directions.indexOf(state.direction)]} / ポーズ${rigs[0].usingA ? 'A' : 'B'} · ${m.variants[state.variant][0]} · 本編と同じ倍率・色・表示方式`) : '読み込み中…';
  requestAnimationFrame(frame);
}
// Only exposed by this dedicated prototype page for visual checks.
window.__monsterPreview = { get rigs() { return rigs; }, scene, camera, renderer, state, ready, setState, pose, draw, id };
window.addEventListener('error', e => $('error').textContent = e.message);
setState({}); new ResizeObserver(resize).observe($('scene')); resize(); requestAnimationFrame(frame);
