import { WATARI_RIG_PROFILE } from '../../../prototypes/watari-8dir/rig-profile.mjs';
import { JINBEI_RIG_PROFILE } from '../../../prototypes/jinbei-8dir/rig-profile.mjs';
import * as THREE from 'three';
import { HumanoidRig } from '../../../games/ch1-3/src/entities/rig.js';
import { MINA_RIG_PROFILE } from '../../../prototypes/mina-8dir/rig-profile.mjs';
import { PINO_RIG_PROFILE } from '../../../prototypes/pino-8dir/rig-profile.mjs';
import { ADVENTURER_RIG_PROFILE } from '../../../prototypes/adventurer-8dir/rig-profile.mjs';
import { INAHO_RIG_PROFILE } from '../../../prototypes/inaho-8dir/rig-profile.mjs';
import { GONTA_RIG_PROFILE } from '../../../prototypes/gonta-8dir/rig-profile.mjs';

// The code-drawn sheets are read from the Studio output (prototypes/<id>-8dir/output/), so a change shows
// here before it is exported to the game. tests/node/game-targets.test.mjs checks the game uses the same files.
const studio = (id, part) => new URL(`../../../prototypes/${id}-8dir/output/${id}_code_${part}_8dir.png`, import.meta.url).href;
const profiles = {
  watari: {
    tuning: WATARI_RIG_PROFILE,
    original: new URL('../../../references/humanoids/sailor_body_8dir.png', import.meta.url).href,
    generated: studio('watari', 'body'),
    head: studio('watari', 'head_layer'),
    torso: studio('watari', 'torso_layer'),
    colors: { sleeve:0x24506b, hand:0xcaa079, pants:0x2f2a24, boot:0x38302a, headBack:0x3a3630, bodyBack:0x1d3b50 },
  },
  jinbei: {
    tuning: JINBEI_RIG_PROFILE,
    generatedColors: { headBack:0xa1aaa9 },
    original: new URL('../../../references/humanoids/middle_aged_male_villager_body_8dir.png', import.meta.url).href,
    generated: studio('jinbei', 'body'),
    head: studio('jinbei', 'head_layer'),
    torso: studio('jinbei', 'torso_layer'),
    colors: { sleeve:0x4a6440, hand:0xcfa070, pants:0x57503f, boot:0x3a2f26, headBack:0x4c4038, bodyBack:0x3a4f33 },
  },
  gonta: {
    tuning: GONTA_RIG_PROFILE,
    original: new URL('../../../references/humanoids/adult_male_villager_body_8dir.png', import.meta.url).href,
    generated: studio('gonta', 'body'),
    head: studio('gonta', 'head_layer'),
    torso: studio('gonta', 'torso_layer'),
    colors: { sleeve:0x55703c, hand:0xd9a878, pants:0x6b5233, boot:0x4a3320, headBack:0x5d4326, bodyBack:0x435a2f },
  },
  inaho: {
    tuning: INAHO_RIG_PROFILE,
    original: new URL('../../../references/humanoids/cook_body_8dir.png', import.meta.url).href,
    generated: studio('inaho', 'body'),
    head: studio('inaho', 'head_layer'),
    torso: studio('inaho', 'torso_layer'),
    colors: { sleeve:0xf2e6d0, hand:0xeec39a, pants:0x8a4a2a, boot:0x5a3a24, headBack:0x1c1a18, bodyBack:0xb5832e },
  },
  adventurer: {
    tuning: ADVENTURER_RIG_PROFILE,
    original: new URL('../../../references/humanoids/adventurer_boy_body_8dir.png', import.meta.url).href,
    generated: studio('adventurer', 'body'),
    colors: { sleeve:0x2856a8, hand:0x7b4a22, pants:0xc9b78e, boot:0x6b3f1d, headBack:0x203f74, bodyBack:0x24467e },
  },
  mina: {
    tuning: MINA_RIG_PROFILE,
    original: new URL('../../../references/humanoids/village_girl_body_8dir.png', import.meta.url).href,
    generated: studio('mina', 'body'),
    head: studio('mina', 'head_layer'),
    torso: studio('mina', 'torso_layer'),
    colors: { sleeve:0x2f6f6d, hand:0xeec39a, pants:0x8a5a33, boot:0x5a3a24, headBack:0x8a5a33, bodyBack:0x265755 },
  },
  pino: {
    tuning: PINO_RIG_PROFILE,
    original: new URL('../../../references/humanoids/village_apprentice_body_8dir.png', import.meta.url).href,
    generated: studio('pino', 'body'),
    head: studio('pino', 'head_layer'),
    torso: studio('pino', 'torso_layer'),
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
// One stage = renderer + scene (same lights and floor) + camera at the gameplay camera's angle.
function makeStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, preserveDrawingBuffer:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6df, 0x72827e, 2.5));
  const light = new THREE.DirectionalLight(0xfff1d2, 3); light.position.set(-3,6,5); scene.add(light);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
  // Same vertical/radial ratio as the gameplay camera (8.2 / 11.5).
  camera.position.set(0, .45 + 3.1 * 8.2 / 11.5, 3.1); camera.lookAt(0,.45,0);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.MeshBasicMaterial({ color:0xdce4de }));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.13; scene.add(floor);
  const lines = new THREE.GridHelper(8,32,0xc1cfc4,0xcbd6cc); lines.position.y=-.129; scene.add(lines);
  return { renderer, scene, camera };
}
// kind 'original': the reference image on the unmodified rig; 'generated': the code-drawn sheet(s) with
// this character's rig settings and limb colours.
function makeRig(kind, scene) {
  const p = profiles[character], generatedSide = kind === 'generated';
  const parts = p.head && generatedSide ? { headSheetUrl:p.head, bodySheetUrl:p.torso } : {};
  const rig = new HumanoidRig({ sheetUrl:generatedSide ? generated : original, colors:generatedSide ? {...colors,...p.generatedColors} : colors,
    tuning:generatedSide ? p.tuning ?? {} : {}, ...parts });
  // Every model stands at the origin; each viewport of the canvas draws one of them (see draw()).
  rig.animTime = 0; scene.add(rig.group);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.32,48), new THREE.MeshBasicMaterial({ color:0x657966, transparent:true, opacity:.2, depthWrite:false }));
  shadow.rotation.x = -Math.PI/2; shadow.position.set(0,-.125,0); shadow.scale.y=.8; scene.add(shadow); rig.shadow = shadow;
  return rig;
}
const { renderer, scene, camera } = makeStage($('scene'));
const rigs = ['original','generated'].map(kind => makeRig(kind, scene));

// 8 directions at once: one rig per direction for each side, drawn in a 4 x 2 grid (2 x 4 on a phone).
const grid = { ...makeStage($('grid')), side:'generated' };
grid.sets = Object.fromEntries(['generated','original'].map(kind => [kind, directions.map(direction => {
  const rig = makeRig(kind, grid.scene); rig.setDirection(direction); return rig;
})]));
for (const [side, label] of [['generated','コード生成'],['original','元の画像']]) {
  const button=document.createElement('button'); button.textContent=label; button.dataset.gridSide=side;
  button.onclick=()=>setState({gridSide:side}); $('grid-sides').append(button);
}
$('grid-labels').innerHTML = labels.map(label => `<span>${label}</span>`).join('');
const gridColumns = () => matchMedia('(max-width:650px)').matches ? 2 : 4;
const state={ direction:'front', action:'idle', auto:false, tool:'', water:false, paused:false, gridSide:'generated' };
for (let i=0;i<directions.length;i++) {
  const button=document.createElement('button'); button.textContent=labels[i]; button.dataset.direction=directions[i];
  button.onclick=()=>setState({direction:directions[i],auto:false}); $('directions').append(button);
}
function setState(next) {
  Object.assign(state,next);
  for (const rig of rigs) { rig.setDirection(state.direction); rig.setTool(state.tool || null); rig.setSubmersion(state.water?1:0); }
  grid.side = state.gridSide;
  for (const rig of Object.values(grid.sets).flat()) { rig.setTool(state.tool || null); rig.setSubmersion(state.water?1:0); }
  document.querySelectorAll('[data-grid-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gridSide===state.gridSide)));
  document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===state.direction)));
  document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===state.action)));
  $('rotate').setAttribute('aria-pressed',String(state.auto));
  $('tool').value=state.tool; $('grid-tool').value=state.tool; $('water').checked=state.water;
}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>setState({action:b.dataset.action}));
$('rotate').onclick=()=>setState({auto:!state.auto}); $('tool').onchange=()=>setState({tool:$('tool').value}); $('water').onchange=()=>setState({water:$('water').checked});
$('grid-tool').onchange=()=>setState({tool:$('grid-tool').value});
let last=0,rotationTime=0,attackTime=1;
const loaded = r => r.headTexture.image?.width && r.bodyTexture.image?.width;
function ready() { return rigs.every(loaded) && Object.values(grid.sets).flat().every(loaded); }
// Each half of the canvas has its own view centred on its model. With one camera for both,
// the left model was seen slightly from its right and the right one from its left, so the
// same boots looked turned differently. Both are now seen from the same angle, as in the game.
function resize() {
  const c=$('scene'); renderer.setSize(c.clientWidth,c.clientHeight,false); camera.aspect=c.clientWidth/2/c.clientHeight;
  if(camera.aspect<.78) camera.zoom=.76; else camera.zoom=1;
  camera.updateProjectionMatrix();
  const g=$('grid'), cols=gridColumns(); grid.renderer.setSize(g.clientWidth,g.clientHeight,false);
  grid.camera.aspect=g.clientWidth/cols/(g.clientHeight/(8/cols));
  // Larger than the two-figure stage: one figure per cell, with room left for a raised tool.
  grid.camera.zoom=grid.camera.aspect<.78?1.25:1.5; grid.camera.updateProjectionMatrix();
}
function draw() {
  const {width,height}=renderer.getSize(new THREE.Vector2());
  renderer.setScissorTest(true);
  rigs.forEach((rig,i)=>{
    rigs.forEach((r,j)=>{r.group.visible=r.shadow.visible=i===j;});
    renderer.setViewport(i*width/2,0,width/2,height); renderer.setScissor(i*width/2,0,width/2,height);
    renderer.render(scene,camera);
  });
  renderer.setScissorTest(false);
  rigs.forEach(r=>{r.group.visible=r.shadow.visible=true;});
  drawGrid();
}
function drawGrid() {
  const {width,height}=grid.renderer.getSize(new THREE.Vector2());
  const cols=gridColumns(), rows=8/cols, w=width/cols, h=height/rows, all=Object.values(grid.sets).flat();
  grid.renderer.setScissorTest(true);
  grid.sets[grid.side].forEach((rig,i)=>{
    all.forEach(r=>{r.group.visible=r.shadow.visible=r===rig;});
    const x=(i%cols)*w, y=(rows-1-Math.floor(i/cols))*h;
    grid.renderer.setViewport(x,y,w,h); grid.renderer.setScissor(x,y,w,h);
    grid.renderer.render(grid.scene,grid.camera);
  });
  grid.renderer.setScissorTest(false);
}
function renderFrame(now) {
  const dt=state.paused?0:Math.min(.05,last?(now-last)/1000:0); last=now;
  if(state.auto && (rotationTime+=dt)>1.1) { rotationTime=0; setState({direction:directions[(directions.indexOf(state.direction)+1)%8]}); }
  const gridRigs=Object.values(grid.sets).flat();
  if(state.action==='attack' && (attackTime+=dt)>.85) { attackTime=0; rigs.forEach(r=>r.startAttack()); gridRigs.forEach(r=>r.startAttack()); }
  rigs.forEach(r=>r.update(dt,state.action==='walk'));
  gridRigs.forEach(r=>r.update(dt,state.action==='walk'));
  draw();
  const layout = profiles[character].tuning ? '同じ照明・手足 / 右：肩と頭の位置を調整' : '同じ寸法・同じ照明・同じ3D手足で表示';
  $('status').textContent=ready()?`${labels[directions.indexOf(state.direction)]} / ${state.action==='walk'?'歩行':state.action==='attack'?'攻撃':'待機'} · ${layout}`:'画像を読み込んでいます…';
  requestAnimationFrame(renderFrame);
}
// Only exposed by this dedicated prototype page for the repository's visual test.
window.__heroPreview={ setState, ready, rigs, renderer, scene, camera, state, draw,
  grid:{ sets:grid.sets, renderer:grid.renderer, camera:grid.camera, get side(){ return grid.side; },
    snapshot:()=>({ side:grid.side, directions:grid.sets[grid.side].map(r=>r.direction), tools:grid.sets[grid.side].map(r=>r.toolKind), columns:gridColumns() }) },
  pose(time=0){ [...rigs,...Object.values(grid.sets).flat()].forEach(r=>{r.walkTime=time;r.animTime=time;r.attackT=state.action==='attack'?.6:0;r.update(0,state.action==='walk');});draw(); },
  snapshot(){return { ...state, character, ready:ready(), textureSizes:rigs.map(r=>[r.headTexture.image?.width,r.headTexture.image?.height]), directions:rigs.map(r=>r.direction), tools:rigs.map(r=>r.toolKind) };}
};
window.addEventListener('error',event=>$('error').textContent=event.message);
const observer=new ResizeObserver(resize); observer.observe($('scene')); observer.observe($('grid'));
setState({}); resize(); requestAnimationFrame(renderFrame);
