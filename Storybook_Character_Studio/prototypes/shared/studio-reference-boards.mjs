import { LABELS } from './sheet-format.mjs';
const uri=bytes=>`data:image/png;base64,${bytes.toString('base64')}`;
// 承認済み1774×887原画を共通倍率・胴中心で配置。方向ごとの自動拡大はしない。
export function referenceSheet(reference, scale=.277){
 return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256">${LABELS.map((_,i)=>referenceCell(reference,i,i%4*128,Math.floor(i/4)*128,1,scale)).join('')}</svg>`;
}
function referenceCell(reference,i,x=0,y=0,k=1,scale=.277){
 const cell=443.5,size=cell*scale;
 return `<svg x="${x+(63.232-size/2)*k}" y="${y+4*k}" width="${size*k}" height="${size*k}" viewBox="${i%4*cell} ${Math.floor(i/4)*cell} ${cell} ${cell}" overflow="hidden"><image href="${uri(reference)}" width="1774" height="887"/></svg>`;
}
export function studioBoards({name,build,referenceScale=.277},{reference,normalized,layers}){
 const vector=`data:image/svg+xml;base64,${Buffer.from(build({cellSize:512})).toString('base64')}`;
 const comparison=`<svg xmlns="http://www.w3.org/2000/svg" width="2144" height="676"><rect width="100%" height="100%" fill="#eee9df"/>
 <text x="24" y="34" font-family="sans-serif" font-size="24" fill="#203344">${name} / 8方向SVG・試作01</text>
 <text x="24" y="60" font-family="sans-serif" font-size="16" fill="#60717b">各方向の左：承認済み元画像v2　右：SVG。同じ倍率・原点で比較。</text>
 ${LABELS.map((label,i)=>{const x=16+i%4*528,y=80+Math.floor(i/4)*298;return `<rect x="${x}" y="${y}" width="512" height="256" rx="10" fill="#dce4df"/>${referenceCell(reference,i,x,y,2,referenceScale)}<svg x="${x+256}" y="${y}" width="256" height="256" viewBox="${i%4*128} ${Math.floor(i/4)*128} 128 128"><image href="${vector}" width="512" height="256"/></svg><text x="${x+10}" y="${y+281}" font-family="sans-serif" font-size="16" fill="#203344">${label}　元画像 ／ SVG</text>`;}).join('')}</svg>`;
 const rows=[['頭：髪・顔・耳',layers.head],['胴：首・襟・服・腰の小物',layers.torso],['合成（比較用）',normalized]];
 const layerBoard=`<svg xmlns="http://www.w3.org/2000/svg" width="1072" height="1740"><rect width="100%" height="100%" fill="#eee9df"/>${rows.map(([label,bytes],i)=>`<text x="24" y="${35+i*578}" font-family="sans-serif" font-size="21" fill="#203344">${label}</text><rect x="24" y="${48+i*578}" width="1024" height="512" fill="#dce4df"/><image href="${uri(bytes)}" x="24" y="${48+i*578}" width="1024" height="512"/>`).join('')}</svg>`;
 return {'comparison.png':comparison,'layers.png':layerBoard,'preview.png':build({cellSize:384}),'reference-normalized.png':referenceSheet(reference,referenceScale)};
}
