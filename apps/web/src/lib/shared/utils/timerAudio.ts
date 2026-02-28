// Smart Timer Audio Engine — Web Audio API synthesised sounds (no external files)

import type { AlertType } from '../types/timer.types';

let audioContext: AudioContext | null = null;
let isInitialised = false;

/** Must be called from a user interaction event (tap/click) to satisfy browser policy */
export const initAudio = (): boolean => {
  if (isInitialised && audioContext) return true;
  try {
    audioContext = new AudioContext();
    isInitialised = true;
    return true;
  } catch {
    return false;
  }
};

export const isAudioReady = () => isInitialised && audioContext?.state === 'running';

const ensureResumed = async () => {
  if (audioContext?.state === 'suspended') {
    await audioContext.resume();
  }
};

// ── Synthesised tone generators ──

const playTone = (freq: number, duration: number, startTime: number, type: OscillatorType = 'sine', gain = 0.3) => {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const g = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(g).connect(audioContext.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

const playChime = () => {
  if (!audioContext) return;
  const t = audioContext.currentTime;
  // Two-tone ascending chime × 3
  for (let i = 0; i < 3; i++) {
    const offset = i * 1.5;
    playTone(880, 0.3, t + offset, 'sine', 0.25);
    playTone(1100, 0.3, t + offset + 0.15, 'sine', 0.25);
  }
};

const playBell = () => {
  if (!audioContext) return;
  const t = audioContext.currentTime;
  // Classic pass-bell ring × 5
  for (let i = 0; i < 5; i++) {
    playTone(1200, 0.15, t + i * 0.5, 'sine', 0.3);
  }
};

const playBuzzer = () => {
  if (!audioContext) return;
  const t = audioContext.currentTime;
  // Low buzz × 2
  for (let i = 0; i < 2; i++) {
    playTone(220, 1.2, t + i * 1.8, 'square', 0.15);
  }
};

const playCritical = () => {
  if (!audioContext) return;
  const t = audioContext.currentTime;
  // Rapid three-tone alarm, repeats 4×
  for (let r = 0; r < 4; r++) {
    const offset = r * 1.0;
    playTone(1000, 0.12, t + offset, 'square', 0.35);
    playTone(1400, 0.12, t + offset + 0.15, 'square', 0.35);
    playTone(1800, 0.12, t + offset + 0.3, 'square', 0.35);
  }
};

/** Play a timer alert sound by type */
export const playAlert = async (type: AlertType, critical = false) => {
  if (!audioContext) return;
  await ensureResumed();

  if (critical) {
    playCritical();
    return;
  }

  switch (type) {
    case 'CHIME': playChime(); break;
    case 'BELL': playBell(); break;
    case 'BUZZER': playBuzzer(); break;
    case 'SILENT': break;
  }
};

// Snooze interval handle
let snoozeIntervals = new Map<string, ReturnType<typeof setInterval>>();

export const startSnoozeAlert = (timerId: string, alertType: AlertType, intervalMs = 30000) => {
  stopSnoozeAlert(timerId);
  const handle = setInterval(() => {
    playAlert(alertType);
  }, intervalMs);
  snoozeIntervals.set(timerId, handle);
};

export const stopSnoozeAlert = (timerId: string) => {
  const handle = snoozeIntervals.get(timerId);
  if (handle) {
    clearInterval(handle);
    snoozeIntervals.delete(timerId);
  }
};

export const stopAllSnoozeAlerts = () => {
  snoozeIntervals.forEach((handle) => clearInterval(handle));
  snoozeIntervals.clear();
};
