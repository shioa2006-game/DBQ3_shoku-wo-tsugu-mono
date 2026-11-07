import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {launchBrowser,openGame,newGame,waitForCond} from '../helpers.mjs';
// The player is hero2 (the Studio hero, layered head/torso since 2026-11-07; previously adventurer).
const villagers=['mina','pino','inaho','gonta','jinbei','watari'];
const monsters=['slime','bat','field_rat','dorotabo','squid','boss','paddy_boss','kraken','kraken_arm'];
const artNames=['slime','night_bat','field_rat','dorotabo','squid','slime','dorotabo','squid','squid'];
const directions=['front','front_left','left','back_left','back','back_right','right','front_right'];
const profiles={};
for(const id of ['hero2',...villagers]) profiles[id]=(await import(`../../src/content/rig-profiles/${id}.mjs`))[`${id.toUpperCase()}_RIG_PROFILE`];
const browser=await launchBrowser(),errors=[];
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await openGame(page,{collectErrors:errors});await newGame(page);
 await page.evaluate(({villagers,monsters})=>{
  const g=window.__game;
  g.renderer.setAnimationLoop(null); // Test context only: deterministic poses, no combat during capture.
  for(const id of villagers)g.spawnVillager(id,30,40,4);
  for(const id of monsters)g.monsters.spawn(id,30,4,40);
 },{villagers,monsters});
 await waitForCond(page,({villagers,monsters})=>{
  const g=window.__game;
  const rigs=[g.player.rig,...villagers.map(id=>g.villager(id).rig)];
  return rigs.every(r=>[r.headTexture,r.bodyTexture].every(t=>t.image?.naturalWidth>0))&&monsters.every(id=>{
   const s=g.monsters.monsters.find(m=>m.type===id).sprite;
   return [s.texA,s.texB].every(t=>t.image?.naturalWidth>0);
  });
 },{villagers,monsters},{label:'all production character layers and A/B textures'});
 const result=await page.evaluate(({villagers,monsters,directions})=>{
  const g=window.__game;
  const people=[g.player,...villagers.map(id=>g.villager(id))];
  const human=people.map((e,i)=>{
   const r=e.rig;
   const poses=directions.map(direction=>{
    r.setDirection(direction);r.animTime=0;r.update(0,false);
    const rest=r.head.position.y;
    r.walkTime=0;r.update(.1,true);const leg=r.leftLeg.quaternion.toArray();
    r.update(.1,true);const walks=r.leftLeg.quaternion.toArray().some((v,j)=>Math.abs(v-leg[j])>1e-6);
    const attacks=['hammer_wood','sword_copper'].map(tool=>{
     r.setTool(tool);r.startAttack();r.update(.05,false);
     const pose=r.tool.quaternion.toArray();r.update(.15,false);
     return r.attacking&&pose.some((v,j)=>Math.abs(v-r.tool.quaternion.toArray()[j])>1e-6)&&r.tool.position.toArray().every(Number.isFinite);
    });
    r.setTool(null);r.attackT=0;r.animTime=0;r.update(0,false);
    return {direction,rest,walks,attacks,headUV:[...r.headTexture.offset,...r.headTexture.repeat],bodyUV:[...r.bodyTexture.offset,...r.bodyTexture.repeat]};
   });
   return {id:i?villagers[i-1]:'hero2',tuning:r.tuning,colors:r.colors,head:r.headTexture.image.src,body:r.bodyTexture.image.src,size:[r.headTexture.image.width,r.headTexture.image.height],poses};
  });
  const mobs=monsters.map(id=>{
   const m=g.monsters.monsters.find(m=>m.type===id),s=m.sprite;
   const poses=directions.map(direction=>{
    s.direction=direction;s.applyWindow();s.flipTimer=0;s.usingA=true;s.material.map=s.texA;
    s.update(.38);const b=s.material.map===s.texB;s.update(.38);
    return {direction,uv:[...s.texA.offset,...s.texA.repeat],cycle:b&&s.material.map===s.texA};
   });
   return {id,a:s.texA.image.src,b:s.texB.image.src,scale:s.mesh.scale.x,tint:s.material.color.getHex(),y:s.mesh.position.y,visible:s.group.visible,segments:m.tentacleSegs?.length??0,poses};
  });
  return {human,mobs};
 },{villagers,monsters,directions});
 for(const h of result.human){
  assert.deepEqual(h.tuning,profiles[h.id],`${h.id}: migrated rig profile`);
  assert.match(h.head,new RegExp(`${h.id}_code_head_layer_8dir`));
  assert.match(h.body,new RegExp(`${h.id}_code_torso_layer_8dir`));
  assert.deepEqual(h.size,[512,256]);
  const base=h.poses[0].rest-(profiles[h.id].headLiftByDirection.front??0);
  for(const [i,p] of h.poses.entries()){
   assert.ok(Math.abs(p.rest-base-profiles[h.id].headLiftByDirection[p.direction])<1e-8,`${h.id}/${p.direction}: head spacing`);
   assert.ok(p.walks&&p.attacks.every(Boolean),`${h.id}/${p.direction}: walking and tool swing`);
   assert.ok(p.headUV.every(Number.isFinite)&&p.bodyUV.every(Number.isFinite));
   assert.ok(Math.abs(p.headUV[0]-(i%4+.494-.34)/4)<1e-8,'head direction UV');
   assert.ok(Math.abs(p.bodyUV[3]-.245)<1e-8,'separate torso includes collar');
  }
 }
 assert.equal(result.human.find(h=>h.id==='jinbei').colors.headBack,0xa1aaa9);
 const scales=[.9,.85,.9,1.15,.95,2.6,2.4,2.8,1],tints=[0xffffff,0xffffff,0xffffff,0xffffff,0xffffff,0xff8f8f,0xd08a6a,0x6a4a7a,0x7a5a8a];
 for(const [i,m] of result.mobs.entries()){
  assert.match(m.a,new RegExp(`${artNames[i]}_code_idle_a_8dir`));assert.match(m.b,new RegExp(`${artNames[i]}_code_idle_b_8dir`));
  assert.equal(m.scale,scales[i]);assert.equal(m.tint,tints[i]);
  assert.equal(m.visible,m.id!=='kraken_arm');assert.equal(m.segments,m.id==='kraken_arm'?4:0);
  for(const [j,p] of m.poses.entries()){
   assert.ok(p.cycle);assert.ok(Math.abs(p.uv[0]-(j%4+.02)/4)<1e-8);assert.ok(Math.abs(p.uv[1]-(1-Math.floor(j/4)+.02)/2)<1e-8);
  }
 }
 if(process.env.CHARACTER_ART_SCREENSHOTS==='1'){
  const out=new URL('../../work/character-migration/',import.meta.url);await mkdir(out,{recursive:true});
  for(const group of ['humans','monsters','bosses']){
   const data=await page.evaluate(({group,villagers,directions})=>{
    const g=window.__game,board=document.createElement('canvas');board.width=1600;board.height=1440;
    const ctx=board.getContext('2d');ctx.fillStyle='#e6e9e2';ctx.fillRect(0,0,board.width,board.height);
    g.renderer.setPixelRatio(1);g.renderer.setSize(1280,540,false);
    for(const [i,direction] of directions.entries()){
     const scene=new g.scene.constructor();scene.background=g.scene.background.clone().setHex(0xdce4de);
     scene.add(g.hemiLight.clone(),g.sunLight.clone());
     const ids=group==='humans'?['hero2',...villagers]:group==='monsters'?['slime','bat','field_rat','dorotabo','squid']:['boss','paddy_boss','kraken','kraken_arm'];
     const spacing=group==='bosses'?3:group==='humans'?1:1.5;
     for(const [j,id] of ids.entries()){
      const e=id==='hero2'?g.player:villagers.includes(id)?g.villager(id):g.monsters.monsters.find(m=>m.type===id);
      if(e.rig){e.rig.setDirection(direction);e.rig.setTool(null);e.rig.attackT=0;e.rig.animTime=0;e.rig.update(0,false);}
      else {e.sprite.direction=direction;e.sprite.applyWindow();e.sprite.material.map=e.sprite.texA;}
      const clone=e.root.clone(true);clone.position.set((j-(ids.length-1)/2)*spacing,0,0);clone.rotation.set(0,0,0);
      // Entity groups may retain world camera yaw; this inspection camera faces Z.
      const visual=clone.children[0];visual.rotation.set(0,0,0);
      if(e.sprite)visual.children[0].rotation.set(0,0,0);
      if(e.nameLabel)clone.children[e.root.children.indexOf(e.nameLabel)].visible=false;
      scene.add(clone);
     }
     const camera=g.camera.clone(),distance=group==='bosses'?13:8;
     camera.aspect=1280/540;camera.fov=32;camera.position.set(0,(group==='bosses'?1.5:.5)+distance*8.2/11.5,distance);camera.lookAt(0,group==='bosses'?1.5:.5,0);camera.updateProjectionMatrix();
     g.renderer.render(scene,camera);
     const x=i%2*800,y=Math.floor(i/2)*360;
     ctx.fillStyle='#263f4e';ctx.font='20px sans-serif';ctx.fillText(`${group} / ${direction}`,x+14,y+24);
     ctx.drawImage(g.renderer.domElement,x,y+30,800,330);
    }
    return board.toDataURL().split(',')[1];
   },{group,villagers,directions});
   await writeFile(new URL(`${group}-8dir.png`,out),Buffer.from(data,'base64'));
  }
 }
 assert.deepEqual(errors,[]);
 console.log('character-art.test: PASS (7 humans, 5 base monsters, 3 bosses, 3D tentacle; all directions, layers, profiles and animation)');
}finally{await browser.close();}
