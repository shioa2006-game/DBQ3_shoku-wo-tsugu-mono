import * as THREE from 'three';
import { MonsterSprite } from '../../../games/ch4-5/src/entities/rig.js';
import { DIRECTIONS, LABELS } from '../../../prototypes/shared/sheet-format.mjs';

const direction = document.querySelector('#direction');
const pose = document.querySelector('#pose');
LABELS.forEach((name,i) => direction.add(new Option(name, DIRECTIONS[i])));
const facing = [[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]];
const sheet = frame => new URL(`../../../prototypes/rockhorn-goat-8dir/output/rockhorn_goat_code_idle_${frame}_8dir.png`, import.meta.url).href;
const goat = new MonsterSprite({ sheetAUrl: sheet('a'), sheetBUrl: sheet('b') });
const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('#sprite'), alpha: true});
const scene = new THREE.Scene();
scene.add(goat.group);
const camera = new THREE.OrthographicCamera(-.5,.5,1,0,.1,5);
camera.position.z = 2;

const reference = new Image();
reference.src = new URL('../../../references/rockhorn-goat-4dir-v1.png', import.meta.url);
await reference.decode();
const ctx = document.querySelector('#reference').getContext('2d');
function turn() {
  const i = direction.selectedIndex;
  goat.faceWorld(...facing[i],0);
  const view = Math.min(i,8-i);
  const cell = Math.min(view,3);
  const w = reference.width/2, h = reference.height/2;
  ctx.clearRect(0,0,256,256);
  ctx.save();
  if (i > 4) { ctx.translate(256,0); ctx.scale(-1,1); }
  ctx.drawImage(reference,cell%2*w,Math.floor(cell/2)*h,w,h,0,0,256,256);
  ctx.restore();
  const label = view===3 || view===4 ? '背面' : LABELS[i];
  document.querySelector('#caption').textContent = `参照画（${label}）`;
}
direction.onchange = turn;
turn();
let last = performance.now();
renderer.setAnimationLoop(now => {
  if (pose.value === 'auto') goat.update(Math.min(.1,(now-last)/1000));
  else if (goat.usingA !== (pose.value === 'a')) goat.update(.38);
  last = now;
  renderer.render(scene,camera);
});
