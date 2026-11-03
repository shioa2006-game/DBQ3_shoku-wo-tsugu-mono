import { buildWatariSheet } from '../../prototypes/watari-8dir/character.mjs';
import { buildJinbeiSheet } from '../../prototypes/jinbei-8dir/character.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { findOrStartStudio } from '../../tools/lib/studio-launch.mjs';
import { buildHeroSheet } from '../../prototypes/adventurer-8dir/character.mjs';
import { buildMinaSheet } from '../../prototypes/mina-8dir/character.mjs';
import { buildPinoSheet } from '../../prototypes/pino-8dir/character.mjs';
import { buildInahoSheet } from '../../prototypes/inaho-8dir/character.mjs';
import { buildGontaSheet } from '../../prototypes/gonta-8dir/character.mjs';
import { DIRECTIONS } from '../../prototypes/shared/sheet-format.mjs';
import { GAMES } from '../../prototypes/shared/game-targets.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
test('Studio serves the current character entry and all its local resources',async t=>{
  const {url,child}=await findOrStartStudio(root,{ports:[0]});
  t.after(async()=>{if(child?.exitCode===null){const ended=once(child,'exit');child.kill();await ended;}});
  const response=await fetch(url);assert.equal(response.status,200);
  const html=await response.text();assert.match(html,/人とモンスターの制作室/);
  for(const character of ['adventurer','mina','pino','inaho','gonta','jinbei','watari'])assert.ok(html.includes(`src="prototypes/${character}-8dir/output/${character}_code_body_8dir.png"`),`${character} is listed in Studio`);
  for(const [,target] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^[a-z]+:/i.test(target))continue;
    const resource=await fetch(new URL(target,url));
    assert.equal(resource.status,200,target);
    if(target.endsWith('.png'))assert.equal(resource.headers.get('content-type'),'image/png');
    await resource.arrayBuffer();
  }
});
test('current character SVGs reproduce exactly from retained authoring code',async()=>{
  for(const [file,svg] of [
    ['adventurer-8dir/output/adventurer-code.svg',buildHeroSheet()],
    ['mina-8dir/output/mina-code.svg',buildMinaSheet()],
    ['mina-8dir/output/mina_code_head_layer_8dir.svg',buildMinaSheet({part:'head'})],
    ['mina-8dir/output/mina_code_torso_layer_8dir.svg',buildMinaSheet({part:'torso'})],
    ['watari-8dir/output/watari-code.svg',buildWatariSheet()],
    ['watari-8dir/output/watari_code_head_layer_8dir.svg',buildWatariSheet({part:'head'})],
    ['watari-8dir/output/watari_code_torso_layer_8dir.svg',buildWatariSheet({part:'torso'})],
    ['jinbei-8dir/output/jinbei-code.svg',buildJinbeiSheet()],
    ['jinbei-8dir/output/jinbei_code_head_layer_8dir.svg',buildJinbeiSheet({part:'head'})],
    ['jinbei-8dir/output/jinbei_code_torso_layer_8dir.svg',buildJinbeiSheet({part:'torso'})],
    ['gonta-8dir/output/gonta-code.svg',buildGontaSheet()],
    ['gonta-8dir/output/gonta_code_head_layer_8dir.svg',buildGontaSheet({part:'head'})],
    ['gonta-8dir/output/gonta_code_torso_layer_8dir.svg',buildGontaSheet({part:'torso'})],
    ['inaho-8dir/output/inaho-code.svg',buildInahoSheet()],
    ['inaho-8dir/output/inaho_code_head_layer_8dir.svg',buildInahoSheet({part:'head'})],
    ['inaho-8dir/output/inaho_code_torso_layer_8dir.svg',buildInahoSheet({part:'torso'})],
    ['pino-8dir/output/pino-code.svg',buildPinoSheet()],
    ['pino-8dir/output/pino_code_head_layer_8dir.svg',buildPinoSheet({part:'head'})],
    ['pino-8dir/output/pino_code_torso_layer_8dir.svg',buildPinoSheet({part:'torso'})],
  ]) assert.equal(svg,await readFile(path.join(root,'prototypes',file),'utf8'),file);
  assert.deepEqual(DIRECTIONS,['front','front_left','left','back_left','back','back_right','right','front_right']);
});

test('Mina head does not own the collar, and torso does not own hair or eyes',()=>{
  const head=buildMinaSheet({part:'head'}),torso=buildMinaSheet({part:'torso'});
  assert.doesNotMatch(head,/fill="url\(#(?:ivory|cloth)\)"/);
  assert.match(torso,/fill="url\(#ivory\)"/);
  assert.doesNotMatch(torso,/clip-path="url\(#(?:bob|fringe|eye)-/);
  assert.throws(()=>buildMinaSheet({part:'unknown'}),/Unknown part/);
});

async function filesIn(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    if(['.git','node_modules','exports'].includes(entry.name))continue;
    const file=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await filesIn(file));else files.push(file);
  }
  return files;
}
test('retained modules and documentation have no missing local imports or links',async()=>{
  for(const file of await filesIn(root)){
    const ext=path.extname(file);
    if(!['.mjs','.html','.md'].includes(ext))continue;
    const text=await readFile(file,'utf8');
    const pattern=ext==='.mjs'?/(?:from\s+|import\s*)['"]([^'"]+)['"]/g
      :ext==='.html'?/(?:href|src)="([^"]+)"/g:/\]\(([^)]+)\)/g;
    for(const match of text.matchAll(pattern)){
      const target=match[1];
      if(/^(?:[a-z]+:|#|\/)/i.test(target))continue;
      if(ext==='.mjs'&&!target.startsWith('.'))continue;
      let destination=path.resolve(path.dirname(file),target.split(/[?#]/)[0]);
      // games/<key>/ is served from the sibling game folder by tools/serve.mjs.
      const game=path.relative(root,destination).split(path.sep);
      if(game[0]==='games'&&GAMES[game[1]])destination=path.join(root,'..',GAMES[game[1]],...game.slice(2));
      await assert.doesNotReject(access(destination),`${path.relative(root,file)} -> ${target}`);
    }
  }
  const dirs=(await readdir(path.join(root,'prototypes'),{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>e.name).sort();
  assert.deepEqual(dirs,['adventurer-8dir','armored-scorpion-8dir','belk-8dir','dorotabo-8dir','field-rat-8dir','gonta-8dir','inaho-8dir','item-icons','jinbei-8dir','kaya-8dir','mina-8dir','nagi-8dir','night-bat-8dir','pino-8dir','props-3d','roku-8dir','shared','slime-8dir','squid-8dir','sumi-8dir','teru-8dir','volcano-lizard-8dir','watari-8dir','will-o-wisp-8dir','yomogi-8dir']);
});

test('Pino separates neck cloth from face and validates authoring inputs',()=>{
  assert.doesNotMatch(buildPinoSheet({part:'head'}),/fill="url\(#(?:ivory|cloth)\)"/);
  const torso=buildPinoSheet({part:'torso'});
  assert.match(torso,/fill="url\(#ivory\)"/);
  assert.doesNotMatch(torso,/clip-path="url\(#(?:pino-hair|pino-fringe|eye)-/);
  assert.throws(()=>buildPinoSheet({part:'other'}),/Unknown part/);
  assert.throws(()=>buildPinoSheet({cellSize:127}),/cellSize/);
  assert.throws(()=>buildPinoSheet({palette:{cap:'bad'}}),/Invalid palette/);
  assert.notEqual(buildPinoSheet(),buildMinaSheet());
});

test('Inaho assigns the toque to the head and the red kerchief to the torso',()=>{
  const head=buildInahoSheet({part:'head'}),torso=buildInahoSheet({part:'torso'});
  assert.match(head,/fill="url\(#cream\)"/);
  assert.doesNotMatch(head,/fill="url\(#(?:red|cloth)\)"/);
  assert.match(torso,/fill="url\(#red\)"/);
  assert.doesNotMatch(torso,/clip-path="url\(#(?:inaho-bob|inaho-fringe|eye)-/);
  assert.throws(()=>buildInahoSheet({part:'unknown'}),/Unknown part/);
  assert.throws(()=>buildInahoSheet({cellSize:127}),/cellSize/);
  assert.throws(()=>buildInahoSheet({palette:{cream:'bad'}}),/Invalid palette/);
  assert.notEqual(buildInahoSheet(),buildPinoSheet());
});

test('Gonta keeps the collar out of the head and hair out of the tunic',()=>{
  const head=buildGontaSheet({part:'head'}),torso=buildGontaSheet({part:'torso'});
  assert.doesNotMatch(head,/fill="url\(#(?:ivory|cloth|gold)\)"/);
  assert.match(torso,/fill="url\(#ivory\)"/);
  assert.doesNotMatch(torso,/clip-path="url\(#(?:gonta-hair|gonta-fringe|eye)-/);
  assert.throws(()=>buildGontaSheet({part:'unknown'}),/Unknown part/);
  assert.throws(()=>buildGontaSheet({cellSize:127}),/cellSize/);
  assert.throws(()=>buildGontaSheet({palette:{hair:'bad'}}),/Invalid palette/);
  assert.notEqual(buildGontaSheet(),buildPinoSheet());
});

test('Jinbei keeps the collar out of the head and hair out of the tunic',()=>{
  const head=buildJinbeiSheet({part:'head'}),torso=buildJinbeiSheet({part:'torso'});
  assert.doesNotMatch(head,/fill="url\(#(?:ivory|cloth|gold)\)"/);
  assert.match(torso,/fill="url\(#ivory\)"/);
  assert.doesNotMatch(torso,/clip-path="url\(#(?:jinbei-hair|jinbei-fringe|eye)-/);
  assert.throws(()=>buildJinbeiSheet({part:'unknown'}),/Unknown part/);
  assert.throws(()=>buildJinbeiSheet({cellSize:127}),/cellSize/);
  assert.throws(()=>buildJinbeiSheet({palette:{hair:'bad'}}),/Invalid palette/);
  assert.notEqual(buildJinbeiSheet(),buildGontaSheet());
});

test('Watari assigns the cap and moustache to the head, lapels and neckerchief to torso',()=>{
  const head=buildWatariSheet({part:'head'}),torso=buildWatariSheet({part:'torso'});
  assert.match(head,/fill="url\(#cap\)"/);
  assert.doesNotMatch(head,/fill="url\(#(?:ivory|cloth|red)\)"/);
  assert.match(torso,/fill="url\(#red\)"/);
  assert.doesNotMatch(torso,/clip-path="url\(#(?:watari-hair|eye)-/);
  assert.throws(()=>buildWatariSheet({part:'unknown'}),/Unknown part/);
  assert.throws(()=>buildWatariSheet({cellSize:127}),/cellSize/);
  assert.throws(()=>buildWatariSheet({palette:{cap:'bad'}}),/Invalid palette/);
  assert.notEqual(buildWatariSheet(),buildJinbeiSheet());
});
