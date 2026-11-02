import { WATARI_RIG_PROFILE } from '../watari/rig-profile.mjs';
import { JINBEI_RIG_PROFILE } from '../jinbei/rig-profile.mjs';
import * as THREE from 'three';
import { HumanoidRig } from '../../src/entities/rig.js';
import { MINA_RIG_PROFILE } from '../mina/rig-profile.mjs';
import { PINO_RIG_PROFILE } from '../pino/rig-profile.mjs';
import { ADVENTURER_RIG_PROFILE } from './rig-profile.mjs';
import { INAHO_RIG_PROFILE } from '../inaho/rig-profile.mjs';
import { GONTA_RIG_PROFILE } from '../gonta/rig-profile.mjs';

const profiles = {
  watari: {
    tuning: WATARI_RIG_PROFILE,
    original: new URL('../../assets/humanoids/sailor_body_8dir.png', import.meta.url).href,
    generated: new URL('../../assets/humanoids/watari_code_body_8dir.png', import.meta.url).href,
    head: new URL('../../assets/humanoids/watari_code_head_layer_8dir.png', import.meta.url).href,
    torso: new URL('../../assets/humanoids/watari_code_torso_layer_8dir.png', import.meta.url).href,
    colors: { sleeve:0x24506b, hand:0xcaa079, pants:0x2f2a24, boot:0x38302a, headBack:0x3a3630, bodyBack:0x1d3b50 },
  },
  jinbei: {
    tuning: JINBEI_RIG_PROFILE,
    generatedColors: { headBack:0xa1aaa9 },
    original: new URL('../../assets/humanoids/middle_aged_male_villager_body_8dir.png', import.meta.url).href,
    generated: new URL('../../assets/humanoids/jinbei_code_body_8dir.png', import.meta.url).href,
    head: new URL('../../assets/humanoids/jinbei_code_head_layer_8dir.png', import.meta.url).href,
    torso: new URL('../../assets/humanoids/jinbei_code_torso_layer_8dir.png', import.meta.url).href,
    colors: { sleeve:0x4a6440, hand:0xcfa070, pants:0x57503f, boot:0x3a2f26, headBack:0x4c4038, bodyBack:0x3a4f33 },
  },
  gonta: {
    tuning: GONTA_RIG_PROFILE,
    original: new URL('../../assets/humanoids/adult_male_villager_body_8dir.png', import.meta.url).href,
    generated: new URL('../../assets/humanoids/gonta_code_body_8dir.png', import.meta.url).href,
    head: new URL('../../assets/humanoids/gonta_code_head_layer_8dir.png', import.meta.url).href,
    torso: new URL('../../assets/humanoids/gonta_code_torso_layer_8dir.png', import.meta.url).href,
    colors: { sleeve:0x55703c, hand:0xd9a878, pants:0x6b5233, boot:0x4a3320, headBack:0x5d4326, bodyBack:0x435a2f },
  },
  inaho: {
    tuning: INAHO_RIG_PROFILE,
    original: new URL('../../assets/humanoids/cook_body_8dir.png', import.meta.url).href,
    generated: new URL('../../assets/humanoids/inaho_code_body_8dir.png', import.meta.url).href,
    head: new URL('../../assets/humanoids/inaho_code_head_layer_8dir.png', import.meta.url).href,
    torso: new URL('../../assets/humanoids/inaho_code_torso_layer_8dir.png', import.meta.url).href,
    colors: { sleeve:0xf2e6d0, hand:0xeec39a, pants:0x8a4a2a, boot:0x5a3a24, headBack:0x1c1a18, bodyBack:0xb5832e },
  },
  adventurer: {
    tuning: ADVENTURER_RIG_PROFILE,
    original: new URL('../../assets/adventurer_boy_body_8dir.png', import.meta.url).href,
    generated: new URL('../../assets/humanoids/adventurer_code_body_8dir.png', import.meta.url).href,
    colors: { sleeve:0x2856a8, hand:0x7b4a22, pants:0xc9b78e, boot:0x6b3f1d, headBack:0x203f74, bodyBack:0x24467e },
  },
  mina: {
    tuning: MINA_RIG_PROFILE,
    original: new URL('../../assets/humanoids/village_girl_body_8dir.png', import.meta.url).href,
    generated: new URL('../../assets/humanoids/mina_code_body_8dir.png', import.meta.url).href,
    head: new URL('../../assets/humanoids/mina_code_head_layer_8dir.png', import.meta.url).href,
    torso: new URL('../../assets/humanoids/mina_code_torso_layer_8dir.png', import.meta.url).href,
    colors: { sleeve:0x2f6f6d, hand:0xeec39a, pants:0x8a5a33, boot:0x5a3a24, headBack:0x8a5a33, bodyBack:0x265755 },
  },
  pino: {
    tuning: PINO_RIG_PROFILE,
    original: new URL('../../assets/humanoids/village_apprentice_body_8dir.png', import.meta.url).href,
    generated: new URL('../../assets/humanoids/pino_code_body_8dir.png', import.meta.url).href,
    head: new URL('../../assets/humanoids/pino_code_head_layer_8dir.png', import.meta.url).href,
    torso: new URL('../../assets/humanoids/pino_code_torso_layer_8dir.png', import.meta.url).href,
    colors: { sleeve:0x9c3b22, hand:0xe6b285, pants:0x6b5233, boot:0x40301d, headBack:0x2b3a66, bodyBack:0x7c2d1a },
  },
};
const character = document.documentElement.dataset.character || 'adventurer';
const { original, generated, colors } = profiles[character];
const directions = ['front','front_left','left','back_left','back','back_right','right','front_right'];
const labels = ['正面','左斜め前','左','左斜め後','背面','右斜め後','右','右斜め前'];
const $ = id => document.getElementById(id);
$('original-sheet').src = original; $('generated-sheet').src = generated; $('download').href = generated;
if(profiles[character].head) {
  $('download-head').href=profiles[character].head;
  $('download-torso').href=profiles[character].torso;
}
const renderer = new THREE.WebGLRenderer({ canvas:$('scene'), antialias:true, alpha:true, preserveDrawingBuffer:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff6df, 0x72827e, 2.5));
const light = new THREE.DirectionalLight(0xfff1d2, 3); light.position.set(-3,6,5); scene.add(light);
const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
// Same vertical/radial ratio as the gameplay camera (8.2 / 11.5).
camera.position.set(0, .45 + 3.1 * 8.2 / 11.5, 3.1); camera.lookAt(0,.45,0);
const rigs = [original, generated].map((sheetUrl, index) => {
  const tuning = index === 1 ? profiles[character].tuning ?? {} : {};
  const parts = profiles[character].head && index === 1
    ? { headSheetUrl:profiles[character].head, bodySheetUrl:profiles[character].torso } : {};
  const rig = new HumanoidRig({ sheetUrl, colors:index === 1 ? {...colors,...profiles[character].generatedColors} : colors, tuning, ...parts });
  rig.group.position.x = index === 0 ? -.76 : .76;
  rig.animTime = 0; scene.add(rig.group);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.32,48), new THREE.MeshBasicMaterial({ color:0x657966, transparent:true, opacity:.2, depthWrite:false }));
  shadow.rotation.x = -Math.PI/2; shadow.position.set(rig.group.position.x,-.125,0); shadow.scale.y=.8; scene.add(shadow);
  return rig;
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.MeshBasicMaterial({ color:0xdce4de }));
floor.rotation.x=-Math.PI/2; floor.position.y=-.13; scene.add(floor);
const grid = new THREE.GridHelper(8,32,0xc1cfc4,0xcbd6cc); grid.position.y=-.129; scene.add(grid);
const state={ direction:'front', action:'idle', auto:false, tool:'', water:false, paused:false };
for (let i=0;i<directions.length;i++) {
  const button=document.createElement('button'); button.textContent=labels[i]; button.dataset.direction=directions[i];
  button.onclick=()=>setState({direction:directions[i],auto:false}); $('directions').append(button);
}
function setState(next) {
  Object.assign(state,next);
  for (const rig of rigs) { rig.setDirection(state.direction); rig.setTool(state.tool || null); rig.setSubmersion(state.water?1:0); }
  document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===state.direction)));
  document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===state.action)));
  $('rotate').setAttribute('aria-pressed',String(state.auto));
  $('tool').value=state.tool; $('water').checked=state.water;
}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>setState({action:b.dataset.action}));
$('rotate').onclick=()=>setState({auto:!state.auto}); $('tool').onchange=()=>setState({tool:$('tool').value}); $('water').onchange=()=>setState({water:$('water').checked});
let last=0,rotationTime=0,attackTime=1;
function ready() { return rigs.every(r=>r.headTexture.image?.width && r.bodyTexture.image?.width); }
function resize() {
  const c=$('scene'); renderer.setSize(c.clientWidth,c.clientHeight,false); camera.aspect=c.clientWidth/c.clientHeight;
  // Keep both models centered under their labels as the viewport changes.
  const offset=Math.max(.56,Math.min(.92,camera.aspect*.36)); rigs[0].group.position.x=-offset; rigs[1].group.position.x=offset;
  const shadows=scene.children.filter(o=>o.geometry?.type==='CircleGeometry'); shadows.forEach((s,i)=>s.position.x=rigs[i].group.position.x);
  if(camera.aspect<1.55) camera.zoom=.76; else camera.zoom=1;
  camera.updateProjectionMatrix();
}
function renderFrame(now) {
  const dt=state.paused?0:Math.min(.05,last?(now-last)/1000:0); last=now;
  if(state.auto && (rotationTime+=dt)>1.1) { rotationTime=0; setState({direction:directions[(directions.indexOf(state.direction)+1)%8]}); }
  if(state.action==='attack' && (attackTime+=dt)>.85) { attackTime=0; rigs.forEach(r=>r.startAttack()); }
  rigs.forEach(r=>r.update(dt,state.action==='walk'));
  renderer.render(scene,camera);
  const layout = profiles[character].tuning ? '同じ照明・手足 / 右：肩と頭の位置を調整' : '同じ寸法・同じ照明・同じ3D手足で表示';
  $('status').textContent=ready()?`${labels[directions.indexOf(state.direction)]} / ${state.action==='walk'?'歩行':state.action==='attack'?'攻撃':'待機'} · ${layout}`:'画像を読み込んでいます…';
  requestAnimationFrame(renderFrame);
}
// Only exposed by this dedicated prototype page for the repository's visual test.
window.__heroPreview={ setState, ready, rigs, renderer, scene, camera, state,
  pose(time=0){ rigs.forEach(r=>{r.walkTime=time;r.animTime=time;r.attackT=state.action==='attack'?.6:0;r.update(0,state.action==='walk');});renderer.render(scene,camera); },
  snapshot(){return { ...state, character, ready:ready(), textureSizes:rigs.map(r=>[r.headTexture.image?.width,r.headTexture.image?.height]), directions:rigs.map(r=>r.direction), tools:rigs.map(r=>r.toolKind) };}
};
window.addEventListener('error',event=>$('error').textContent=event.message);
new ResizeObserver(resize).observe($('scene')); setState({}); resize(); requestAnimationFrame(renderFrame);
