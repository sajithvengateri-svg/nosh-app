import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { useGameProfile } from "@/hooks/useGameProfile";
import { useHaptics } from "../engine/useHaptics";
import { getCatGrade } from "../data/levels";
import ScoreCard from "../components/ScoreCard";
import { cn } from "@/lib/utils";

const GAME_DURATION = 40;
const TICK_MS = 100;
const CALM_GAIN = 2.0;
const CALM_PENALTY = -1;
const CALM_DECAY = -0.1;
const SPEED_MIN = 0.5;
const SPEED_MAX = 80;

type Phase = "idle" | "playing" | "ended";
type Mood = "nervous" | "calm" | "purring" | "sleeping";
interface Heart { id: number; x: number; y: number }

/* ── Synthetic sounds (Web Audio API, no files) ──────────── */

function useSyntheticSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const purrOscRef = useRef<OscillatorNode | null>(null);
  const purrGainRef = useRef<GainNode | null>(null);
  const mutedRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const startPurr = useCallback(() => {
    if (mutedRef.current || purrOscRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 80;
    gain.gain.value = 0.12;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    purrOscRef.current = osc;
    purrGainRef.current = gain;
  }, [getCtx]);

  const stopPurr = useCallback(() => {
    if (purrOscRef.current) {
      try { purrOscRef.current.stop(); } catch {}
      purrOscRef.current = null;
    }
    purrGainRef.current = null;
  }, []);

  const playHiss = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const len = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    src.connect(g).connect(ctx.destination);
    src.start();
  }, [getCtx]);

  const playGameOver = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.6);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  }, [getCtx]);

  const setMuted = useCallback((m: boolean) => { mutedRef.current = m; if (m) stopPurr(); }, [stopPurr]);
  const cleanup = useCallback(() => { stopPurr(); ctxRef.current?.close().catch(() => {}); ctxRef.current = null; }, [stopPurr]);

  return { startPurr, stopPurr, playHiss, playGameOver, setMuted, cleanup };
}

/* ── Mood helpers ────────────────────────────────────────── */

function getMood(calm: number): Mood {
  if (calm >= 65) return "sleeping";
  if (calm >= 35) return "purring";
  if (calm >= 15) return "calm";
  return "nervous";
}

const MOOD_LABELS: Record<Mood, string> = { sleeping: "Sleeping", purring: "Purring", calm: "Calm", nervous: "Nervous" };
const MOOD_GLOWS: Record<Mood, string> = {
  sleeping: "rgba(139,92,246,0.25)", purring: "rgba(34,197,94,0.25)",
  calm: "rgba(59,130,246,0.2)", nervous: "rgba(239,68,68,0.15)",
};
const MOOD_BAR: Record<Mood, string> = { sleeping: "#8b5cf6", purring: "#22c55e", calm: "#3b82f6", nervous: "#ef4444" };

function getGuidance(calm: number, mood: Mood, fast: boolean): string {
  if (fast && mood === "nervous") return "Too rough! Slow down...";
  if (mood === "sleeping") return "*zzz...*";
  if (mood === "purring") return "*purrrrrr...*";
  if (calm < 30) return mood === "nervous" ? "Pat gently to calm..." : "Rub slowly to soothe...";
  return "Keep going... nice and steady";
}

/* ── Component ───────────────────────────────────────────── */

export default function AlleyCatGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = useOrgId();
  const { addXP, profile } = useGameProfile();
  const haptics = useHaptics();
  const sounds = useSyntheticSounds();

  const [phase, setPhase] = useState<Phase>("idle");
  const [calmMeter, setCalmMeter] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [tooFast, setTooFast] = useState(false);

  const calmRef = useRef(0);
  const elapsedRef = useRef(0);
  const speedRef = useRef(0);
  const lastPtrRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const isPettingRef = useRef(false);
  const heartIdRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<number[]>([]);

  const mood = getMood(calmMeter);

  const toggleMute = useCallback(() => {
    setMuted((p) => { sounds.setMuted(!p); return !p; });
  }, [sounds]);

  // Pointer tracking
  const handlePointerMove = useCallback((cx: number, cy: number) => {
    if (phase !== "playing") return;
    const now = performance.now();
    const last = lastPtrRef.current;
    if (last) {
      const dx = cx - last.x, dy = cy - last.y;
      const dt = Math.max(now - last.t, 1);
      speedRef.current = (Math.sqrt(dx * dx + dy * dy) / dt) * 16;
    }
    lastPtrRef.current = { x: cx, y: cy, t: now };
    isPettingRef.current = true;
  }, [phase]);

  const handlePointerLeave = useCallback(() => {
    isPettingRef.current = false;
    lastPtrRef.current = null;
    speedRef.current = 0;
  }, []);

  // Bind touch/mouse on cat area
  useEffect(() => {
    const el = catRef.current;
    if (!el || phase !== "playing") return;
    const onTM = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; if (t) handlePointerMove(t.clientX, t.clientY); };
    const onTS = (e: TouchEvent) => { const t = e.touches[0]; if (t) handlePointerMove(t.clientX, t.clientY); };
    const onTE = () => handlePointerLeave();
    const onMM = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onML = () => handlePointerLeave();
    el.addEventListener("touchstart", onTS, { passive: false });
    el.addEventListener("touchmove", onTM, { passive: false });
    el.addEventListener("touchend", onTE);
    el.addEventListener("mousemove", onMM);
    el.addEventListener("mouseleave", onML);
    return () => {
      el.removeEventListener("touchstart", onTS);
      el.removeEventListener("touchmove", onTM);
      el.removeEventListener("touchend", onTE);
      el.removeEventListener("mousemove", onMM);
      el.removeEventListener("mouseleave", onML);
    };
  }, [phase, handlePointerMove, handlePointerLeave]);

  // Game tick
  useEffect(() => {
    if (phase !== "playing") return;
    tickRef.current = setInterval(() => {
      elapsedRef.current += TICK_MS / 1000;
      setElapsed(elapsedRef.current);

      if (elapsedRef.current >= GAME_DURATION) {
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
        setPhase("ended");
        setShowScore(true);
        sounds.stopPurr();
        sounds.playGameOver();
        return;
      }

      const speed = speedRef.current;
      let delta = CALM_DECAY;
      let wasTooFast = false;
      if (isPettingRef.current && speed > SPEED_MIN) {
        if (speed >= SPEED_MAX) { delta = CALM_PENALTY; wasTooFast = true; haptics.error(); }
        else { delta = CALM_GAIN; }
      }

      calmRef.current = Math.max(0, Math.min(100, calmRef.current + delta));
      setCalmMeter(calmRef.current);
      setTooFast(wasTooFast);
      samplesRef.current.push(calmRef.current);

      const curMood = getMood(calmRef.current);
      if (curMood === "purring" || curMood === "sleeping") { sounds.startPurr(); haptics.purr(); }
      else { sounds.stopPurr(); }
      if (wasTooFast) sounds.playHiss();

      // Spawn heart on good petting
      if (delta === CALM_GAIN && isPettingRef.current && lastPtrRef.current && catRef.current) {
        const rect = catRef.current.getBoundingClientRect();
        const lp = lastPtrRef.current;
        setHearts((prev) => [...prev.slice(-8), {
          id: heartIdRef.current++,
          x: ((lp.x - rect.left) / rect.width) * 100,
          y: ((lp.y - rect.top) / rect.height) * 100,
        }]);
      }
      speedRef.current *= 0.85;
    }, TICK_MS);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, haptics, sounds]);

  // Cleanup
  useEffect(() => () => sounds.cleanup(), [sounds]);

  // Start / restart
  const startGame = useCallback(() => {
    calmRef.current = 0; elapsedRef.current = 0; speedRef.current = 0;
    isPettingRef.current = false; lastPtrRef.current = null; samplesRef.current = [];
    setCalmMeter(0); setElapsed(0); setShowScore(false); setHearts([]); setTooFast(false);
    setPhase("playing");
  }, []);

  // Save score
  useEffect(() => {
    if (!showScore) return;
    const s = samplesRef.current;
    const avg = s.length > 0 ? s.reduce((a, b) => a + b, 0) / s.length : 0;
    const gi = getCatGrade(avg);
    if (user?.id && orgId) {
      supabase.from("game_scores" as any).insert({
        user_id: user.id, org_id: orgId, game_key: "alley_cat",
        score: Math.round(avg * 10), grade: gi.grade, league: profile?.league ?? "scullery",
        meta: { avg_calm: Math.round(avg), final_calm: Math.round(calmRef.current) },
      } as any).then(() => {});
      addXP(gi.xp);
    }
  }, [showScore, user, orgId, addXP, profile]);

  // Computed
  const remaining = Math.max(0, GAME_DURATION - elapsed);
  const s = samplesRef.current;
  const avgCalm = s.length > 0 ? s.reduce((a, b) => a + b, 0) / s.length : 0;
  const gradeInfo = getCatGrade(avgCalm);
  const guidance = getGuidance(calmMeter, mood, tooFast);

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]" style={{
      background: "linear-gradient(180deg, #0a0c0f 0%, #111518 30%, #0d1015 60%, #0a0b0d 100%)",
    }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{
        background: "rgba(10,12,15,0.85)",
        backdropFilter: "blur(8px)",
      }}>
        <button onClick={() => navigate("/games")} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">The Alley Cat</span>
        <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 relative overflow-hidden select-none touch-none">
        {/* Alley background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Brick wall rows */}
          {Array.from({ length: 28 }, (_, i) => (
            <div key={`row-${i}`} className="absolute left-0 right-0" style={{ top: `${i * 3.6}%` }}>
              <div className="h-px w-full" style={{ background: "rgba(120,80,50,0.20)" }} />
              {/* Staggered brick joins */}
              {Array.from({ length: 8 }, (_, j) => (
                <div key={j} className="absolute h-[3.6%]" style={{
                  left: `${(j * 12.5) + (i % 2 ? 6.25 : 0)}%`,
                  width: "1px",
                  top: 0,
                  background: "rgba(100,70,40,0.15)",
                }} />
              ))}
            </div>
          ))}
          {/* Damp stain patches */}
          <div className="absolute rounded-full" style={{
            bottom: "10%", left: "5%", width: "35%", height: "25%",
            background: "radial-gradient(ellipse, rgba(40,60,50,0.30) 0%, transparent 70%)",
          }} />
          <div className="absolute rounded-full" style={{
            bottom: "5%", right: "10%", width: "25%", height: "20%",
            background: "radial-gradient(ellipse, rgba(30,50,40,0.25) 0%, transparent 70%)",
          }} />
          {/* Dim overhead light glow */}
          <div className="absolute" style={{
            top: "0%", left: "30%", width: "40%", height: "50%",
            background: "radial-gradient(ellipse at 50% 0%, rgba(180,160,120,0.10) 0%, transparent 70%)",
          }} />
          {/* Ground line */}
          <div className="absolute left-0 right-0" style={{
            bottom: "8%", height: "1px",
            background: "linear-gradient(90deg, transparent 5%, rgba(100,80,60,0.25) 30%, rgba(100,80,60,0.25) 70%, transparent 95%)",
          }} />
          {/* Vignette */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)",
          }} />
        </div>

        {phase === "idle" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
            <div className="w-48 h-48 overflow-hidden rounded-xl">
              <img src="/images/cat_main.jpg" alt="Alley Cat" className="w-full h-full object-cover" draggable={false} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-violet-400">The Alley Cat</h2>
              <p className="text-sm text-zinc-500 max-w-xs">
                A stray cat appeared behind the kitchen. Pet it gently to calm it down. You have 40 seconds.
              </p>
            </div>
            <Button onClick={startGame} size="lg"
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg px-8">
              START PETTING
            </Button>
          </div>
        ) : (
          <>
            {/* HUD */}
            <div className="absolute top-3 left-4 right-4 z-20 space-y-2">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span className="font-mono">{Math.ceil(remaining)}s</span>
                <span className={cn("font-bold text-sm uppercase tracking-wide",
                  mood === "sleeping" && "text-violet-400", mood === "purring" && "text-emerald-400",
                  mood === "calm" && "text-blue-400", mood === "nervous" && "text-red-400")}>
                  {MOOD_LABELS[mood]}
                </span>
                <span className="font-mono">{Math.round(calmMeter)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: MOOD_BAR[mood] }}
                  animate={{ width: `${calmMeter}%` }} transition={{ duration: 0.15, ease: "linear" }} />
              </div>
            </div>

            {/* Cat container */}
            <div ref={catRef} className="absolute inset-0 flex items-center justify-center cursor-pointer">
              {/* Mood glow */}
              <div className="absolute w-64 h-64 rounded-full blur-3xl transition-all duration-700 pointer-events-none"
                style={{ background: MOOD_GLOWS[mood] }} />

              {/* Cat image: breathing + purr shake */}
              <motion.div className="relative z-10"
                animate={{
                  scale: [1, 1.015, 1],
                  x: mood === "purring" ? [0, 1.2, -1.2, 0.8, -0.8, 0]
                    : mood === "sleeping" ? [0, 0.5, -0.5, 0] : 0,
                }}
                transition={{
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  x: { duration: mood === "purring" ? 0.3 : 0.5, repeat: Infinity, ease: "easeInOut" },
                }}>
                <img src="/images/cat_main.jpg" alt="Alley Cat" draggable={false}
                  className="w-56 h-56 object-cover pointer-events-none rounded-xl" />
                {/* Dark overlay when nervous */}
                {mood === "nervous" && (
                  <div className="absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-xl"
                    style={{ background: "rgba(0,0,0,0.35)" }} />
                )}
                {/* Zzz overlay when sleeping */}
                {mood === "sleeping" && (
                  <motion.div className="absolute -top-4 -right-4 text-2xl font-bold text-violet-300 pointer-events-none"
                    animate={{ opacity: [0.4, 1, 0.4], y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}>
                    Zzz
                  </motion.div>
                )}
              </motion.div>

              {/* Floating hearts */}
              <AnimatePresence>
                {hearts.map((h) => (
                  <motion.div key={h.id}
                    initial={{ opacity: 1, y: 0, scale: 0.8 }}
                    animate={{ opacity: 0, y: -60, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute text-pink-400 text-lg pointer-events-none z-20"
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                    &#x2764;
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Gesture guidance */}
            <div className="absolute bottom-6 left-0 right-0 text-center z-20">
              <motion.p key={guidance} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={cn("text-sm italic", tooFast && mood === "nervous" ? "text-red-400" : "text-zinc-500")}>
                {guidance}
              </motion.p>
            </div>
          </>
        )}
      </div>

      {/* Score card */}
      {showScore && (
        <ScoreCard gameName="The Alley Cat" score={Math.round(avgCalm * 10)} grade={gradeInfo.grade}
          xpEarned={gradeInfo.xp} stats={[
            { label: "Avg Calm", value: `${Math.round(avgCalm)}%` },
            { label: "Final Calm", value: `${Math.round(calmRef.current)}%` },
            { label: "Mood", value: MOOD_LABELS[getMood(calmRef.current)] },
          ]} onPlayAgain={startGame} />
      )}
    </div>
  );
}
