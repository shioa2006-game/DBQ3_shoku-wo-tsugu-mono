// Sailor jacket and cap; preserve the established tool swing.
export const WATARI_RIG_PROFILE=Object.freeze({
  // Lower the shoulder pivot and sleeve crown to the tunic's shoulder line.
  bodyTopV:.54, armSep:.145, armRestTilt:.22, shoulderLift:-.012,
  sleeveY:-.110, headForward:.020, headDepth:.024, headOffsetY:0,
  headLiftByDirection:Object.freeze({
    front:.018, front_left:.026, left:.022, back_left:.022,
    back:.018, back_right:.022, right:.022, front_right:.026,
  }),
  bodyDepth:-.008,
});
