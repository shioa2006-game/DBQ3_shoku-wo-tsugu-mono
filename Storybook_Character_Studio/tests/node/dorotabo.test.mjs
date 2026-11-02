import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildDorotaboSheet,dorotaboMarkup,DIRECTIONS} from '../../prototypes/dorotabo-8dir/character.mjs';
test('Dorotabo reproduces both poses with grounded mud, attached grass and directional eyes',async()=>{
 for(const direction of DIRECTIONS){
  const a=dorotaboMarkup(direction,'a'),b=dorotaboMarkup(direction,'b');
  assert.notEqual(a,b);
  for(const text of [a,b]){
   const eyes=(text.match(/data-part="eye"/g)||[]).length;
   assert.equal(eyes,direction.startsWith('back')?0:['left','right'].includes(direction)?1:2);
   assert.equal((text.match(/data-part="pool"/g)||[]).length,1);
   assert.equal((text.match(/data-part="body"/g)||[]).length,1);
   assert.equal((text.match(/data-part="grass"/g)||[]).length,4);
   assert.doesNotMatch(text,/data-part="(?:feet|paw|tail)"/);
  }
 }
 for(const frame of ['a','b'])assert.equal(buildDorotaboSheet({frame}),await readFile(new URL(`../../prototypes/dorotabo-8dir/output/dorotabo_code_idle_${frame}_8dir.svg`,import.meta.url),'utf8'));
 assert.throws(()=>dorotaboMarkup('bad'),/Unknown direction/);
 assert.throws(()=>buildDorotaboSheet({frame:'bad'}),/Unknown frame/);
 assert.throws(()=>buildDorotaboSheet({cellSize:32}),/cellSize/);
 assert.throws(()=>buildDorotaboSheet({palette:{mud:'bad'}}),/Invalid palette/);
 const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');
 assert.match(html,/dorotabo-8dir\/output\/dorotabo_code_idle_a_8dir.png/);
});
