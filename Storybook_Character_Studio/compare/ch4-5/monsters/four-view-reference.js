// 4方向の設定画を比較用にだけ8セルへ配置する。コード生成側の作画には使わない。
export async function fourViewReference(url) {
  const source = new Image();
  source.src = url;
  await source.decode();
  const sheet = document.createElement('canvas');
  sheet.width = 512;
  sheet.height = 256;
  const output = sheet.getContext('2d');
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const ctx = tile.getContext('2d', { willReadFrequently: true });
  const w = source.width / 2, h = source.height / 2;

  // 正面・斜め前・横・背面。斜め後ろには背面を表示する。
  for (const [i, view] of [0,1,2,3,3,3,2,1].entries()) {
    ctx.clearRect(0,0,128,128);
    ctx.save();
    if (i > 5) { ctx.translate(128,0); ctx.scale(-1,1); }
    ctx.drawImage(source, view%2*w, Math.floor(view/2)*h,w,h, 0,0,128,128);
    ctx.restore();
    const { data } = ctx.getImageData(0,0,128,128);
    let left = 128, right = -1, bottom = -1;
    for (let y=0; y<128; y++) for (let x=0; x<128; x++) {
      if (data[(128*y+x)*4+3] <= 24) continue;
      left = Math.min(left,x); right = Math.max(right,x); bottom = y;
    }
    // コード側と同じ接地基準。方向ごとに拡大縮小すると体格差が隠れるため、平行移動だけ行う。
    output.drawImage(tile, i%4*128 + 63-Math.round((left+right)/2), Math.floor(i/4)*128 + 121-bottom);
  }
  return sheet.toDataURL('image/png');
}
