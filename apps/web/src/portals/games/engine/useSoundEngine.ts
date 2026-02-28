import { useRef, useCallback, useEffect } from "react";

/**
 * Lightweight sound engine. Lazily loads audio via the Web Audio API.
 * Falls back gracefully if audio is blocked.
 */

interface SoundConfig {
  src: string;
  volume?: number;
  loop?: boolean;
}

interface SoundInstance {
  audio: HTMLAudioElement;
  config: SoundConfig;
}

export function useSoundEngine() {
  const soundsRef = useRef<Map<string, SoundInstance>>(new Map());
  const mutedRef = useRef(false);

  const load = useCallback((key: string, config: SoundConfig) => {
    if (soundsRef.current.has(key)) return;

    const audio = new Audio(config.src);
    audio.volume = config.volume ?? 0.5;
    audio.loop = config.loop ?? false;
    audio.preload = "auto";

    soundsRef.current.set(key, { audio, config });
  }, []);

  const play = useCallback((key: string) => {
    if (mutedRef.current) return;
    const sound = soundsRef.current.get(key);
    if (!sound) return;

    // Clone for overlapping plays (e.g. rapid taps)
    if (!sound.config.loop) {
      const clone = sound.audio.cloneNode() as HTMLAudioElement;
      clone.volume = sound.audio.volume;
      clone.play().catch(() => {});
    } else {
      sound.audio.currentTime = 0;
      sound.audio.play().catch(() => {});
    }
  }, []);

  const stop = useCallback((key: string) => {
    const sound = soundsRef.current.get(key);
    if (!sound) return;
    sound.audio.pause();
    sound.audio.currentTime = 0;
  }, []);

  const setVolume = useCallback((key: string, volume: number) => {
    const sound = soundsRef.current.get(key);
    if (sound) sound.audio.volume = Math.max(0, Math.min(1, volume));
  }, []);

  const mute = useCallback(() => {
    mutedRef.current = true;
    soundsRef.current.forEach((s) => {
      s.audio.pause();
    });
  }, []);

  const unmute = useCallback(() => {
    mutedRef.current = false;
  }, []);

  const toggleMute = useCallback(() => {
    if (mutedRef.current) unmute();
    else mute();
    return !mutedRef.current;
  }, [mute, unmute]);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      soundsRef.current.forEach((s) => {
        s.audio.pause();
        s.audio.src = "";
      });
      soundsRef.current.clear();
    };
  }, []);

  return { load, play, stop, setVolume, mute, unmute, toggleMute, isMuted: mutedRef };
}
