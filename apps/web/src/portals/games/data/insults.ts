/**
 * Parody chef insult bank.
 * These are ORIGINAL parody lines — no real chef names used.
 * Inspired by the archetype of the angry British kitchen mentor.
 */

export const MENTOR_INSULTS = {
  /** Shown when a hazard is missed */
  miss: [
    "It's RAW!",
    "Where is the lamb sauce?!",
    "You're a DONUT!",
    "Shut it DOWN!",
    "This is ROTTEN!",
    "Pathetic!",
    "My grandmother could run a safer kitchen!",
    "That fridge is a biohazard!",
    "You call yourself a chef?!",
    "The health inspector is WEEPING!",
    "I've seen cleaner skips!",
    "That cross-contamination could shut us down!",
    "Absolute DISASTER!",
    "Get out of my kitchen!",
    "This is a NIGHTMARE!",
    "You donkey!",
    "Wake UP!",
    "That's going to make someone SICK!",
    "Disgusting! Start OVER!",
    "The temp log is SCREAMING at you!",
  ],

  /** Shown when multiple hazards missed in a row */
  rage: [
    "SHUT IT ALL DOWN!",
    "This kitchen is FINISHED!",
    "I've never seen anything this bad!",
    "Health inspector just walked in. Good LUCK!",
    "We're done. DONE!",
    "Pack your knives and GO!",
  ],

  /** Shown on near-miss (hazard caught just in time) */
  nearMiss: [
    "Focus! FOCUS!",
    "That was too close!",
    "Sloppy work! Tighten up!",
    "You got lucky. Don't let it happen again.",
    "Come ON! Stay sharp!",
  ],

  /** Shown on perfect round (A+ grade) */
  praise: [
    "Finally... some GOOD food safety.",
    "Stunning. Simply stunning.",
    "Now THAT is how you run a kitchen!",
    "Michelin-star compliance. Beautiful.",
    "I'm... actually impressed. Well done.",
  ],
} as const;

/** Get a random insult from a category */
export function getRandomInsult(category: keyof typeof MENTOR_INSULTS): string {
  const pool = MENTOR_INSULTS[category];
  return pool[Math.floor(Math.random() * pool.length)];
}
