// Runtime copy of Storybook Character Studio: prototypes/asagi-8dir/rig-profile.mjs.
export const ASAGI_RIG_PROFILE = Object.freeze({
  bodyTopV: .54, armSep: .14, armRestTilt: .28, shoulderLift: .008,
  sleeveY: -.105, headForward: .012, headDepth: .025, headOffsetY: -.005,
  headLiftByDirection: Object.freeze({
    front: .012, front_left: .018, left: .016, back_left: .016,
    back: .012, back_right: .016, right: .016, front_right: .018,
  }),
  bodyDepth: -.008,
  toolOverHead: Object.freeze(['front_right']),
});
export const ASAGI_RIG_COLORS = Object.freeze({
  sleeve: 0x536d70, hand: 0xf4c99d, pants: 0x4c4337,
  boot: 0x614733, headBack: 0x423730, bodyBack: 0x536d70,
});
