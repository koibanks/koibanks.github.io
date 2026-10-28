/** Motion and input knobs. Colors and sizes live at the top of src/styles.css. */

/** Seconds. */
export const TIMING = {
  switchOut: 0.32, // home: current file leaves
  switchIn: 0.7, // home: next file arrives
  overshoot: 1.35, // back.out() strength on arrival; 0 = none
  flip: 0.75, // folder morph between home and project page
  crossfade: 0.3, // reduced-motion fade
};

/** Input handling on the home page. */
export const INPUT = {
  wheelThreshold: 24, // accumulated deltaY needed to count as a gesture
  lockMs: 750, // ignore input this long after each step
  gestureGapMs: 180, // a pause this long means a new trackpad gesture
  swipeMin: 40, // px for a touch swipe
};
