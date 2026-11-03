import * as THREE from 'three';
import {MonsterSprite} from '../../../games/ch1-3/src/entities/rig.js';
const urls={
 reference:[new URL('../../../references/nonhumanoids/squid_idle_a_8dir.png',import.meta.url).href,new URL('../../../references/nonhumanoids/squid_idle_b_8dir.png',import.meta.url).href],
 code:[new URL('../../../games/ch1-3/assets/nonhumanoids/squid_code_idle_a_8dir.png',import.meta.url).href,new URL('../../../games/ch1-3/assets/nonhumanoids/squid_code_idle_b_8dir.png',import.meta.url).href],
};
const directions=['front','front_left','left','back_left','back','back_right','right','front_right'];
const labels=['正面','左斜め前','左','左斜め後','背面','右斜め後','右','右斜め前'];
const facing=[[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]];
const $=id=>document.getElementById(id);
for(const [i,frame] of ['a','b'].entries()){
 $('ref-'+frame).src=urls.reference[i];$('code-'+frame).src=urls.code[i];$('download-'+frame).href=urls.code[i];
}
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,30);
camera.position.set(0,.875+3.1*8.2/11.5,3.1);camera.lookAt(0,.875,0);
const rigs=[urls.reference,urls.code].map((s,i)=>{
 const rig=new MonsterSprite({sheetAUrl:s[0],sheetBUrl:s[1],scale:.95,tint:0xffffff,yOffset:.4});
 rig.group.position.x=i===0?-.76:.76;scene.add(rig.group);return rig;
});
const shadows=rigs.map(r=>{
 const s=new THREE.Mesh(new THREE.CircleGeometry(.27,48),new THREE.MeshBasicMaterial({color:0x657966,transparent:true,opacity:.2,depthWrite:false}));
 s.rotation.x=-Math.PI/2;s.position.set(r.group.position.x,.002,0);s.scale.y=.8;scene.add(s);return s;
});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({color:0xdce4de}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const grid=new THREE.GridHelper(8,32,0xc1cfc4,0xcbd6cc);grid.position.y=.001;scene.add(grid);
const state={direction:'front',pose:'auto',auto:false,water:false,paused:false};
let elapsed=0,turn=0,last=0;
function ready(){return rigs.every(r=>r.texA.image?.width&&r.texB.image?.width);}
function pose(time=0){
 const b=state.pose==='b'||state.pose==='auto'&&Math.floor((time+1e-9)/.38)%2===1;
 // Arms pull inward in A as the body rises, then spread in B as it settles.
 // Fixed poses stay at the baseline for inspecting the arm attachment.
 const bob=state.pose==='auto'?.045*Math.sin(2*Math.PI*time/.76):0;
 for(const [i,r] of rigs.entries()){
  r.group.position.y=bob;
  const size=1-bob*.7;
  shadows[i].scale.set(size,size*.8,1);
  shadows[i].material.opacity=.2-bob*.35;
  r.usingA=true;r.material.map=r.texA;r.flipTimer=0;
  // Use the production flip operation, including texture selection.
  r.update(b?.38:0);r.flipTimer=time%.38;
 }
 renderer.render(scene,camera);
}
function setState(next){
 Object.assign(state,next);
 const i=directions.indexOf(state.direction);
 if(i<0||!['auto','a','b'].includes(state.pose))throw Error('Invalid preview state');
 for(const r of rigs){r.faceWorld(...facing[i],0);r.mesh.rotation.y=0;r.setVisualTint(0xffffff,state.water?1:0);}
 document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===state.direction)));
 $('pose').value=state.pose;$('water').checked=state.water;$('rotate').setAttribute('aria-pressed',String(state.auto));pose(elapsed);
}
for(const [i,d] of directions.entries()){
 const b=document.createElement('button');b.textContent=labels[i];b.dataset.direction=d;b.onclick=()=>setState({direction:d,auto:false});$('directions').append(b);
}
$('pose').onchange=()=>{elapsed=0;setState({pose:$('pose').value});};
$('water').onchange=()=>setState({water:$('water').checked});$('rotate').onclick=()=>setState({auto:!state.auto});
function resize(){
 const c=$('scene');renderer.setSize(c.clientWidth,c.clientHeight,false);camera.aspect=c.clientWidth/c.clientHeight;
 const x=Math.max(.56,Math.min(.92,camera.aspect*.36));
 rigs.forEach((r,i)=>{r.group.position.x=i?x:-x;shadows[i].position.x=r.group.position.x;});
 camera.zoom=camera.aspect<1.55?.76:1;camera.updateProjectionMatrix();pose(elapsed);
}
function frame(now){
 const dt=state.paused?0:Math.min(.05,last?(now-last)/1000:0);last=now;elapsed+=dt;
 if(state.auto&&(turn+=dt)>1.1){turn=0;setState({direction:directions[(directions.indexOf(state.direction)+1)%8]});}
 pose(elapsed);$('status').textContent=ready()?`${labels[directions.indexOf(state.direction)]} / ポーズ${rigs[0].usingA?'A':'B'}${state.pose==='auto'?' · 触腕の動き＋上下動':' · 静止比較'}`:'読み込み中…';requestAnimationFrame(frame);
}
window.__squidPreview={rigs,scene,camera,renderer,state,ready,setState,pose};
window.addEventListener('error',e=>$('error').textContent=e.message);
new ResizeObserver(resize).observe($('scene'));setState({});resize();requestAnimationFrame(frame);
