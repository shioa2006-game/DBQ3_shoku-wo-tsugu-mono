// Wider tunic and short nape hair; preserve the established tool swing.
export const GONTA_RIG_PROFILE=Object.freeze({
  // Lower the shoulder pivot and sleeve crown to the tunic's shoulder line.
  bodyTopV:.54, armSep:.148, armRestTilt:.22, shoulderLift:-.012,
  sleeveY:-.110, headForward:.022, headDepth:.024, headOffsetY:0,
  headLiftByDirection:Object.freeze({
    front:.018, front_left:.030, left:.022, back_left:.022,
    back:.018, back_right:.022, right:.022, front_right:.030,
  }),
  bodyDepth:-.008,
});
