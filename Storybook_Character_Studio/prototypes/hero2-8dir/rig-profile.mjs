// Separate head/torso sheets. The arms are attached exactly as on the previous hero, adventurer (the rig
// defaults: shoulder pivot ±.14, rest tilt .34, sleeve -.12 below the pivot), so the arm length, the shoulder
// and the hands' place did not change when this design became the hero (2026-11-07).
export const HERO2_RIG_PROFILE=Object.freeze({
  bodyTopV:.54, armSep:.14, armRestTilt:.34, shoulderLift:0,
  sleeveY:-.12, headForward:.012, headDepth:.024, headOffsetY:0,
  headLiftByDirection:Object.freeze({
    front:.012, front_left:.016, left:.014, back_left:.014,
    back:.012, back_right:.014, right:.014, front_right:.016,
  }),
  bodyDepth:-.008,
  // Front-right: the tool hand is the near one and the swing crosses the face, so the swinging tool is
  // drawn over the flat head card (rig.js, tuning.toolOverHead). The swing itself is the current hero's.
  toolOverHead:Object.freeze(['front_right']),
});
