// Separate head/torso sheets. The sleeves hang just outside the tunic and start below the capelet's
// shoulder, as in the design sheet (the capelet stays readable over the upper arm).
export const HERO2_RIG_PROFILE=Object.freeze({
  bodyTopV:.54, armSep:.19, armRestTilt:.16, shoulderLift:-.045,
  sleeveY:-.105, headForward:.012, headDepth:.024, headOffsetY:0,
  headLiftByDirection:Object.freeze({
    front:.012, front_left:.016, left:.014, back_left:.014,
    back:.012, back_right:.014, right:.014, front_right:.016,
  }),
  bodyDepth:-.008,
});
