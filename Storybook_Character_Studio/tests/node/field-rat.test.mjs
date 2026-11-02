import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRatSheet,ratMarkup,DIRECTIONS} from '../../prototypes/field-rat-8dir/character.mjs';
test('Field rat reproduces both poses, keeps feet grounded and assigns directional features',async()=>{
 for(const direction of DIRECTIONS){
  const a=ratMarkup(direction,'a'),b=ratMarkup(direction,'b');
  assert.notEqual(a,b);
  assert.equal(a.match(/<g data-part="feet">.*?<\/g>/)[0],b.match(/<g data-part="feet">.*?<\/g>/)[0]);
  assert.equal((a.match(/data-part="tail"/g)||[]).length,1,'Tail is owned by one layer');
  for(const pose of [a,b]){const feet=pose.match(/<g data-part="feet">.*?<\/g>/)[0];assert.equal((feet.match(/<ellipse /g)||[]).length,['left','right'].includes(direction)?1:2,'Profile hides the foot behind the rump');}
  const count=(a.match(/data-part="eye"/g)||[]).length;
  assert.equal(count,direction.startsWith('back')?0:['left','right'].includes(direction)?1:2);
  assert.equal(a.includes('data-part="teeth"'),!direction.startsWith('back'));
 }
 for(const frame of ['a','b'])assert.equal(buildRatSheet({frame}),await readFile(new URL(`../../prototypes/field-rat-8dir/output/field_rat_code_idle_${frame}_8dir.svg`,import.meta.url),'utf8'));
 assert.throws(()=>ratMarkup('bad'),/Unknown direction/);
 assert.throws(()=>buildRatSheet({frame:'bad'}),/Unknown frame/);
 assert.throws(()=>buildRatSheet({cellSize:64}),/cellSize/);
 assert.throws(()=>buildRatSheet({palette:{fur:'bad'}}),/Invalid palette/);
 const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');
 assert.match(html,/field-rat-8dir\/output\/field_rat_code_idle_a_8dir.png/);
});
