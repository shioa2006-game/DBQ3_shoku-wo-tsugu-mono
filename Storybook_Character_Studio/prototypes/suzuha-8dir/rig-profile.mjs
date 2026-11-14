// 頭と胴の分離画像に対応するStudio試作設定。
export const SUZUHA_RIG_PROFILE = Object.freeze({
  bodyTopV: .54, armSep: .14, armRestTilt: .28, shoulderLift: .008,
  sleeveY: -.105, headForward: .012, headDepth: .025, headOffsetY: -.005,
  headLiftByDirection: Object.freeze({
    front: .012, front_left: .018, left: .016, back_left: .016,
    back: .012, back_right: .016, right: .016, front_right: .018,
  }),
  bodyDepth: -.008, toolOverHead: Object.freeze(['front_right']),
});
export const SUZUHA_RIG_COLORS = Object.freeze({
  sleeve: 0x8e656c, hand: 0xf5c796, pants: 0x514b42, boot: 0x624633,
  headBack: 0x735041, bodyBack: 0xead7b9,
});
