import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSquidSheet,squidMarkup,DIRECTIONS} from '../../prototypes/squid-8dir/character.mjs';
test('Squid keeps mantle stable while bending arms and shows only direction-visible eyes',async()=>{
 for(const direction of DIRECTIONS){
  const a=squidMarkup(direction,'a'),b=squidMarkup(direction,'b');
  assert.notEqual(a,b);
  for(const part of ['mantle','fins']){
   const pattern=new RegExp(`<g data-part="${part}">.*?</g>`);
   assert.equal(a.match(pattern)[0],b.match(pattern)[0],`${direction}: stable ${part}`);
  }
  for(const text of [a,b]){
   const eyes=(text.match(/data-part="eye"/g)||[]).length;
   assert.equal(eyes,direction.startsWith('back')?0:['left','right'].includes(direction)?1:2);
   assert.equal((text.match(/data-part="long-arm"/g)||[]).length,2);
   assert.equal((text.match(/data-part="arm"/g)||[]).length,6);
   assert.equal((text.match(/data-part="mask"/g)||[]).length,direction.startsWith('back')?0:1);
  }
 }
 for(const frame of ['a','b'])assert.equal(buildSquidSheet({frame}),await readFile(new URL(`../../prototypes/squid-8dir/output/squid_code_idle_${frame}_8dir.svg`,import.meta.url),'utf8'));
 assert.throws(()=>squidMarkup('bad'),/Unknown direction/);
 assert.throws(()=>buildSquidSheet({frame:'bad'}),/Unknown frame/);
 assert.throws(()=>buildSquidSheet({cellSize:32}),/cellSize/);
 assert.throws(()=>buildSquidSheet({palette:{skin:'bad'}}),/Invalid palette/);
 const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');
 assert.match(html,/squid-8dir\/output\/squid_code_idle_a_8dir.png/);
});
