import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSlimeSheet,slimeMarkup,DIRECTIONS} from '../../prototypes/slime-8dir/character.mjs';
test('Slime reproduces both whole-body sheets and only shows face on front-facing views',async()=>{
 for(const frame of ['a','b']){
  assert.equal(buildSlimeSheet({frame}),await readFile(new URL(`../../prototypes/slime-8dir/output/slime_code_idle_${frame}_8dir.svg`,import.meta.url),'utf8'));
  for(const direction of DIRECTIONS){const text=slimeMarkup(direction,frame);if(direction.startsWith('back'))assert.doesNotMatch(text,/clip-path="url\(#slime-eye\)"/);else assert.match(text,/clip-path="url\(#slime-eye\)"/);}
 }
 assert.notEqual(buildSlimeSheet({frame:'a'}),buildSlimeSheet({frame:'b'}));
 assert.throws(()=>buildSlimeSheet({frame:'c'}),/Unknown frame/);assert.throws(()=>slimeMarkup('bad'),/Unknown direction/);assert.throws(()=>buildSlimeSheet({cellSize:127}),/cellSize/);assert.throws(()=>buildSlimeSheet({palette:{body:'bad'}}),/Invalid palette/);
 const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');assert.match(html,/slime-8dir\/output\/slime_code_idle_a_8dir.png/);
});
