import * as Speech from "expo-speech";

/**
 * Make NOSH speak out loud. Uses expo-speech which works on web + native.
 * Strips emoji and markdown for cleaner speech output.
 */
export function noshSpeak(text: string) {
  // Clean text for natural speech
  const clean = text
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, "") // strip emoji
    .replace(/[*_~`#]/g, "") // strip markdown
    .replace(/\s{2,}/g, " ") // collapse whitespace
    .trim();

  if (!clean) return;

  // Stop any ongoing speech first
  Speech.stop();

  Speech.speak(clean, {
    language: "en-AU",
    pitch: 1.05,
    rate: 0.95,
  });
}

export function noshStopSpeaking() {
  Speech.stop();
}
