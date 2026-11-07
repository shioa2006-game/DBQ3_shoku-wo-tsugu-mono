// 試作02の時点のリグ設定（保存用）。試作02の画像（このフォルダ）と組み合わせて比較ページで使う。
// Separate head/torso sheets. The arms are attached exactly as on the current hero (the rig defaults:
// shoulder pivot ±.14, rest tilt .34, sleeve -.12 below the pivot), so the arm length, the shoulder and the
// hands' place match the hero this design may replace.
export const HERO2_V02_RIG_PROFILE=Object.freeze({
  bodyTopV:.54, armSep:.14, armRestTilt:.34, shoulderLift:0,
  sleeveY:-.12, headForward:.012, headDepth:.024, headOffsetY:0,
  headLiftByDirection:Object.freeze({
    front:.012, front_left:.016, left:.014, back_left:.014,
    back:.012, back_right:.014, right:.014, front_right:.016,
  }),
  bodyDepth:-.008,
});
