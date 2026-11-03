import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pages, pageUrl, launchBrowser } from './game.mjs';

const base=process.env.PROTOTYPE_BASE||pageUrl();
const browser=await launchBrowser();
try{
  const page=await browser.newPage({viewport:{width:1120,height:980},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const character of ['adventurer','mina','pino','inaho','gonta','jinbei','watari']){
    await page.goto(`${base}${character}/`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.__heroPreview?.ready());
    const result=await page.evaluate(async()=>{
      const THREE=await import('../../../games/ch1-3/node_modules/three/build/three.module.js');
      const p=window.__heroPreview,[reference,rig]=p.rigs,profile=rig.tuning;
      const directions=['front','front_left','left','back_left','back','back_right','right','front_right'];
      const failures=[],shifts={};
      const snapshot=r=>({head:r.head.position.toArray(),body:r.body.position.toArray(),arms:[r.leftArm,r.rightArm].map(a=>[...a.position.toArray(),...a.quaternion.toArray()]),tool:r.tool?[...r.tool.position.toArray(),...r.tool.quaternion.toArray()]:null});
      const pose=(action,phase)=>{
        p.pose(phase);
        if(action==='attack')p.rigs.forEach(r=>{r.attackT=1-phase;r.update(0,false);});
        p.scene.updateMatrixWorld(true);
      };
      for(const direction of directions){
        const lift=profile.headLiftByDirection[direction];shifts[direction]=lift;
        if(!(lift>0&&lift<=.04))failures.push(`${direction}: excessive or absent lift`);
        p.setState({direction,paused:true,water:false,tool:'sword_copper'});
        // A direction change must update immediately and must not accumulate.
        p.pose(0);const y=rig.head.position.y;
        rig.setDirection('back');rig.setDirection(direction);
        if(Math.abs(rig.head.position.y-y)>1e-10)failures.push(`${direction}: direction-change drift`);
        for(const action of ['idle','walk','attack'])for(const phase of [0,.15,.35,.5,.7,.9]){
          p.setState({action});rig.tuning={...profile,headLiftByDirection:undefined};pose(action,phase);
          const before=snapshot(rig),original=snapshot(reference);
          rig.tuning=profile;pose(action,phase);const after=snapshot(rig);
          if(Math.abs(after.head[1]-before.head[1]-lift)>1e-9)failures.push(`${direction}/${action}: lift lost during animation`);
          if(after.head[0]!==before.head[0]||after.head[2]!==before.head[2])failures.push(`${direction}: horizontal/depth changed`);
          for(const key of ['body','arms','tool'])if(JSON.stringify(after[key])!==JSON.stringify(before[key]))failures.push(`${direction}: ${key} changed`);
          if(JSON.stringify(snapshot(reference))!==JSON.stringify(original))failures.push(`${direction}: reference changed`);
        }
      }
      const board=document.createElement('canvas');board.width=1200;board.height=1220;
      const c=board.getContext('2d');c.fillStyle='#efeee6';c.fillRect(0,0,1200,1220);c.fillStyle='#263f4e';c.font='bold 24px sans-serif';c.fillText('HEAD / TORSO SPACING — BEFORE → AFTER',24,35);
      for(const [i,direction] of directions.entries()){
        p.setState({direction,action:'idle',tool:''});rig.tuning=profile;p.pose(0);
        const bounds=new THREE.Box3().setFromObject(rig.head).union(new THREE.Box3().setFromObject(rig.body));
        let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
        for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
          const point=new THREE.Vector3(x,y,z).project(p.camera);
          minX=Math.min(minX,(point.x+1)/2);maxX=Math.max(maxX,(point.x+1)/2);
          minY=Math.min(minY,(1-point.y)/2);maxY=Math.max(maxY,(1-point.y)/2);
        }
        const source=p.renderer.domElement,w=source.width,h=source.height;
        const sx=minX*w-12,sy=minY*h-12,sw=(maxX-minX)*w+24,sh=(maxY-minY)*h+24;
        const bx=i%2*600,by=65+Math.floor(i/2)*285;
        c.font='16px sans-serif';c.fillStyle='#263f4e';c.fillText(`${direction} / +${shifts[direction].toFixed(3)}`,bx+20,by);
        for(const revised of [false,true]){
          rig.tuning=revised?profile:{...profile,headLiftByDirection:undefined};p.pose(0);
          const dw=230*sw/sh;
          c.drawImage(source,sx,sy,sw,sh,bx+(revised?300:0)+(300-dw)/2,by+24,dw,230);
          c.font='12px sans-serif';c.fillText(revised?'AFTER':'BEFORE',bx+(revised?320:20),by+18);
        }
      }
      rig.tuning=profile;
      return {failures,shifts,image:board.toDataURL('image/png').split(',')[1]};
    });
    assert.deepEqual(result.failures,[],character);
    await writeFile(new URL(`${character}/head-spacing.png`,pages),Buffer.from(result.image,'base64'));
    console.log(`PASS ${character}: direction-specific spacing; unchanged torso, arms, tools and reference. ${JSON.stringify(result.shifts)}`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
