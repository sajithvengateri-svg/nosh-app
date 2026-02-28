import { useEffect, useRef, useCallback } from "react";

/* eslint-disable @typescript-eslint/no-var-requires */
const SOUND_FILES = {
  knife_slice: require("../assets/sounds/knife_slice.wav"),
  stone_grind: require("../assets/sounds/stone_grind.wav"),
  spark: require("../assets/sounds/spark.wav"),
  cat_purr: require("../assets/sounds/cat_purr.wav"),
  cat_hiss: require("../assets/sounds/cat_hiss.wav"),
  score_pop: require("../assets/sounds/score_pop.wav"),
  combo: require("../assets/sounds/combo.wav"),
  game_over: require("../assets/sounds/game_over.wav"),
  level_up: require("../assets/sounds/level_up.wav"),
  cry: require("../assets/sounds/cry.wav"),
} as const;

type SoundKey = keyof typeof SOUND_FILES;

/**
 * Preloads and plays game sound effects.
 * Sounds are loaded once on mount and unloaded on unmount.
 */
export function useGameSounds() {
  const soundsRef = useRef<Partial<Record<SoundKey, any>>>({});
  const loadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { Audio } = require("expo-av");
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const entries = Object.entries(SOUND_FILES) as [SoundKey, any][];
        for (const [key, source] of entries) {
          if (cancelled) return;
          try {
            const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false, volume: 1.0 });
            soundsRef.current[key] = sound;
          } catch {
            // Silently skip individual sound load failures
          }
        }
        loadedRef.current = true;
      } catch {
        // Audio system unavailable (e.g. simulator)
      }
    };

    load();

    return () => {
      cancelled = true;
      Object.values(soundsRef.current).forEach((s) => {
        s?.unloadAsync().catch(() => {});
      });
      soundsRef.current = {};
      loadedRef.current = false;
    };
  }, []);

  const play = useCallback(async (key: SoundKey, volume = 1.0) => {
    const sound = soundsRef.current[key];
    if (!sound) return;
    try {
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(volume);
      await sound.playAsync();
    } catch {
      // Ignore playback errors
    }
  }, []);

  return {
    play,
    slice: useCallback(() => play("knife_slice", 0.7), [play]),
    grind: useCallback(() => play("stone_grind", 0.3), [play]),
    spark: useCallback(() => play("spark", 0.4), [play]),
    purr: useCallback(() => play("cat_purr", 0.5), [play]),
    hiss: useCallback(() => play("cat_hiss", 0.5), [play]),
    scorePop: useCallback(() => play("score_pop", 0.6), [play]),
    combo: useCallback(() => play("combo", 0.6), [play]),
    gameOver: useCallback(() => play("game_over", 0.5), [play]),
    levelUp: useCallback(() => play("level_up", 0.6), [play]),
    cry: useCallback(() => play("cry", 0.7), [play]),
  };
}
