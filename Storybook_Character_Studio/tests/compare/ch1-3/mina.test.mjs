import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkHumanoidPrototype } from './humanoid-prototype.mjs';
import { studioOutput, PNG, normalize } from './game.mjs';
const root=studioOutput('mina');
const head=PNG.sync.read(await readFile(new URL('mina_code_head_layer_8dir.png',root)));
const torso=PNG.sync.read(await readFile(new URL('mina_code_torso_layer_8dir.png',root)));
const combinedRaw=PNG.sync.read(await readFile(new URL('mina_code_body_8dir.src.png',root)));
const {report}=normalize(combinedRaw);
for(const [name,image] of [['head',head],['torso',torso]]) {
  const raw=PNG.sync.read(await readFile(new URL(`mina_code_${name}_layer_8dir.src.png`,root)));
  const expected=new PNG({width:512,height:256});
  for(const {row,col,dx,dy} of report)for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
    const si=((row*128+y)*512+col*128+x)*4;
    if(raw.data[si+3]<=24)continue;
    assert.ok(x+dx>=0&&x+dx<128&&y+dy>=0&&y+dy<128,'Part pixels stay in their cell');
    const di=((row*128+y+dy)*512+col*128+x+dx)*4;
    raw.data.copy(expected.data,di,si,si+4);
  }
  assert.deepEqual(image.data,expected.data,`${name} shares the composite normalization without pixel loss`);
}
for(const image of [head,torso])assert.deepEqual([image.width,image.height],[512,256]);
const alpha=(image,cell,x,y)=>image.data[((Math.floor(cell/4)*128+y)*512+(cell%4)*128+x)*4+3];
for(let cell=0;cell<8;cell++) {
  for(let y=80;y<128;y++)for(let x=0;x<128;x++)assert.equal(alpha(head,cell,x,y),0,'Head contains no clothing');
  for(let y=0;y<57;y++)for(let x=0;x<128;x++)assert.equal(alpha(torso,cell,x,y),0,'Torso contains no face/hair');
  assert.ok(alpha(torso,cell,63,80)>24,'Collar belongs to torso in every direction');
}
// The reported double-collar band must be transparent in the head texture.
for(const cell of [0,1,2,6,7])for(let y=72;y<=77;y++) {
  for(let x=54;x<=65;x++)assert.equal(alpha(head,cell,x,y),0,`No collar/neck on head: ${cell} ${x},${y}`);
}
console.log('PASS: separate head and torso textures; collar band absent from head');
await checkHumanoidPrototype({character:'mina',asset:'mina_code',verifyPose:()=>{
  const p=window.__heroPreview,[reference,rig]=p.rigs,errors=[];
  if(Object.keys(reference.tuning).length) errors.push('Reference layout changed');
  if(reference.headTexture.source!==reference.bodyTexture.source)errors.push('Legacy shared sheet behavior changed');
  if(!rig.headTexture.image.src.includes('mina_code_head_layer_8dir.png') || !rig.bodyTexture.image.src.includes('mina_code_torso_layer_8dir.png'))errors.push('Separate layer textures not loaded');
  const bodyBox=rig.body.children[0],height=bodyBox.geometry.parameters.height;
  if(Math.abs(bodyBox.position.y-height/2+.2)>1e-8)errors.push('Body bottom anchor changed');
  if(Math.abs(height/(rig.bodyTexture.repeat.y*2)-1)>1e-8)errors.push('Torso pixel scale changed');
  if(rig.head.position.z<=rig.body.position.z) errors.push('Torso in front of head');
  const facing={front:0,front_left:-.707,left:-1,back_left:-.707,back:0,back_right:.707,right:1,front_right:.707}[rig.direction];
  if(facing && rig.head.position.x*facing<=0) errors.push('Head leans behind torso');
  for(const arm of [rig.leftArm,rig.rightArm]) {
    // The upper sleeve cap must intersect the body volume even while swinging.
    const sleeve=arm.userData.tiltGroup.children[0],g=sleeve.geometry.parameters;
    const cap=sleeve.position.clone().set(0,g.length/2,0);
    sleeve.localToWorld(cap);bodyBox.worldToLocal(cap);
    const b=rig.body.children[0].geometry.parameters;
    const gap=Math.hypot(Math.max(Math.abs(cap.x)-b.width/2,0),Math.max(Math.abs(cap.y)-b.height/2,0),Math.max(Math.abs(cap.z)-b.depth/2,0));
    if(gap>g.radius+.001)errors.push('Sleeve separated from torso');
    const relativeY=arm.position.y-rig.body.position.y;
    if(Math.abs(relativeY-.158)>1e-8)errors.push('Shoulder does not follow body bob');
  }
  if(rig.tool){
    const tool=rig.tool.getWorldPosition(rig.tool.position.clone());
    const mount=rig.leftArm.userData.toolMount.getWorldPosition(rig.tool.position.clone());
    if(tool.distanceTo(mount)>1e-7)errors.push('Tool detached from hand');
  }
  return errors;
}});
