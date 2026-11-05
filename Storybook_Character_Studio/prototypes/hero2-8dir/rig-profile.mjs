// Separate head/torso sheets. Arms as in the design sheet's front view: the shoulder sits under the
// capelet, the short sleeve shows below the capelet's corner, and the fists hang straight down beside
// the tunic at belt height (sleeve centre about x ±.18, fists about y .20 in rig units).
export const HERO2_RIG_PROFILE=Object.freeze({
  bodyTopV:.54, armSep:.18, armRestTilt:.03, shoulderLift:0,
  sleeveY:-.21, headForward:.012, headDepth:.024, headOffsetY:0,
  headLiftByDirection:Object.freeze({
    front:.012, front_left:.016, left:.014, back_left:.014,
    back:.012, back_right:.014, right:.014, front_right:.016,
  }),
  bodyDepth:-.008,
});
