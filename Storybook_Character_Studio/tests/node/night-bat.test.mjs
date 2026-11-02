import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildBatSheet,batMarkup,DIRECTIONS} from '../../prototypes/night-bat-8dir/character.mjs';
test('Bat preserves body and feet while flapping, with directional face visibility',async()=>{
 for(const direction of DIRECTIONS){
  const a=batMarkup(direction,'a'),b=batMarkup(direction,'b');
  assert.notEqual(a,b);
  for(const part of ['body','feet']){
   const pattern=new RegExp(`<g data-part="${part}">.*?</g>`);
   assert.equal(a.match(pattern)[0],b.match(pattern)[0],`${direction}: stable ${part}`);
  }
  const eyes=(a.match(/data-part="eye"/g)||[]).length;
  assert.equal(eyes,direction.startsWith('back')?0:['left','right'].includes(direction)?1:2);
 }
 for(const frame of ['a','b'])assert.equal(buildBatSheet({frame}),await readFile(new URL(`../../prototypes/night-bat-8dir/output/night_bat_code_idle_${frame}_8dir.svg`,import.meta.url),'utf8'));
 assert.throws(()=>batMarkup('bad'),/Unknown direction/);
 assert.throws(()=>buildBatSheet({frame:'bad'}),/Unknown frame/);
 assert.throws(()=>buildBatSheet({palette:{body:'bad'}}),/Invalid palette/);
 assert.throws(()=>buildBatSheet({cellSize:32}),/cellSize/);
 const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');
 assert.match(html,/night-bat-8dir\/output\/night_bat_code_idle_a_8dir.png/);
});
