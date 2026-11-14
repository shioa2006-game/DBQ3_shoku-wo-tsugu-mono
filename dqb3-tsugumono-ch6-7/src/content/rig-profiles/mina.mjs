// Runtime copy of Storybook Character Studio: prototypes/mina-8dir/rig-profile.mjs.
export const MINA_RIG_PROFILE = Object.freeze({
  // Separate torso sheet includes the neck; extend upward without rescaling it.
  bodyTopV: .54,
  armSep: .145,
  armRestTilt: .22,
  shoulderLift: .018,
  sleeveY: -.095,
  headForward: .024,
  headDepth: .025,
  headOffsetY: -.008,
  headLiftByDirection: Object.freeze({
    front:.025, front_left:.040, left:.028, back_left:.035,
    back:.030, back_right:.035, right:.028, front_right:.040,
  }),
  bodyDepth: -.01,
});
