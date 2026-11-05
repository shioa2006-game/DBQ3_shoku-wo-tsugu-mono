// Separate head/torso sheets; the capelet widens the shoulders a little.
export const HERO2_RIG_PROFILE=Object.freeze({
  bodyTopV:.54, armSep:.142, armRestTilt:.22, shoulderLift:-.008,
  sleeveY:-.105, headForward:.020, headDepth:.024, headOffsetY:0,
  headLiftByDirection:Object.freeze({
    front:.02, front_left:.03, left:.024, back_left:.024,
    back:.02, back_right:.024, right:.024, front_right:.03,
  }),
  bodyDepth:-.008,
});
