import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { useHaptics } from "../engine/useHaptics";
import { useGameStore } from "../engine/gameStore";
import { useGameProfile } from "@/hooks/useGameProfile";
import { getEdgeGrade } from "../data/levels";
import ScoreCard from "../components/ScoreCard";
import { cn } from "@/lib/utils";

const GAME_DURATION = 30; // seconds
const PERFECT_ANGLE = 15; // degrees
const ANGLE_TOLERANCE = 2; // ±2° for perfect zone
const FILL_RATE = 4; // sharpness %/sec when in zone
const DRAIN_RATE = 2; // sharpness %/sec when out of zone

export default function EdgeGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = useOrgId();
  const { addXP, profile } = useGameProfile();
  const haptics = useHaptics();
  const store = useGameStore();

  const [phase, setPhase] = useState<"idle" | "playing" | "ended">("idle");
  const [currentAngle, setCurrentAngle] = useState(22); // start slightly off
  const [sharpness, setSharpness] = useState(0);
  const [timeInZone, setTimeInZone] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; good: boolean }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const timeInZoneRef = useRef(0);
  const sharpnessRef = useRef(0);
  const angleRef = useRef(22);
  const sparkIdRef = useRef(0);

  const isInZone = Math.abs(currentAngle - PERFECT_ANGLE) <= ANGLE_TOLERANCE;

  // ── Game loop ──

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (phase !== "playing") return;

      const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05) : 0;
      lastTimeRef.current = timestamp;

      elapsedRef.current += dt;
      setElapsed(elapsedRef.current);

      if (elapsedRef.current >= GAME_DURATION) {
        setPhase("ended");
        setShowScore(true);
        return;
      }

      const inZone = Math.abs(angleRef.current - PERFECT_ANGLE) <= ANGLE_TOLERANCE;

      if (inZone) {
        timeInZoneRef.current += dt;
        setTimeInZone(timeInZoneRef.current);
        sharpnessRef.current = Math.min(100, sharpnessRef.current + FILL_RATE * dt);
      } else {
        sharpnessRef.current = Math.max(0, sharpnessRef.current - DRAIN_RATE * dt);
      }
      setSharpness(sharpnessRef.current);

      // Haptic feedback
      if (inZone && isDragging) {
        haptics.purr();
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [phase, haptics, isDragging]
  );

  useEffect(() => {
    if (phase === "playing") {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, gameLoop]);

  // ── Touch/mouse → angle mapping ──

  const handleMove = useCallback(
    (clientY: number) => {
      if (phase !== "playing") return;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeY = (clientY - rect.top) / rect.height; // 0 (top) to 1 (bottom)
      const angle = relativeY * 45; // map to 0-45 degrees
      const clamped = Math.max(0, Math.min(45, angle));
      setCurrentAngle(clamped);
      angleRef.current = clamped;

      // Spawn spark
      const inZone = Math.abs(clamped - PERFECT_ANGLE) <= ANGLE_TOLERANCE;
      setSparks((prev) => [
        ...prev.slice(-6),
        { id: sparkIdRef.current++, x: 50 + Math.random() * 20, y: relativeY * 100, good: inZone },
      ]);
    },
    [phase]
  );

  // ── Event handlers ──

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) handleMove(touch.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      setIsDragging(true);
      const touch = e.touches[0];
      if (touch) handleMove(touch.clientY);
    };
    const onTouchEnd = () => setIsDragging(false);

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientY);
    };
    const onMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      handleMove(e.clientY);
    };
    const onMouseUp = () => setIsDragging(false);

    container.addEventListener("touchstart", onTouchStart, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleMove, isDragging]);

  // ── Start ──

  const startGame = () => {
    setPhase("playing");
    setSharpness(0);
    setTimeInZone(0);
    setElapsed(0);
    setShowScore(false);
    setCurrentAngle(22);
    elapsedRef.current = 0;
    timeInZoneRef.current = 0;
    sharpnessRef.current = 0;
    angleRef.current = 22;
    lastTimeRef.current = 0;
  };

  // ── Save score ──

  useEffect(() => {
    if (!showScore) return;

    const precision = GAME_DURATION > 0 ? (timeInZoneRef.current / GAME_DURATION) * 100 : 0;
    const gradeInfo = getEdgeGrade(precision);

    if (user?.id && orgId) {
      supabase
        .from("game_scores" as any)
        .insert({
          user_id: user.id,
          org_id: orgId,
          game_key: "edge",
          score: Math.round(precision * 10),
          grade: gradeInfo.grade,
          league: profile?.league ?? "scullery",
          meta: {
            precision: Math.round(precision),
            time_in_zone: Math.round(timeInZoneRef.current * 10) / 10,
            sharpness: Math.round(sharpnessRef.current),
          },
        } as any)
        .then(() => {});

      addXP(gradeInfo.xp);
    }
  }, [showScore, user, orgId, addXP, profile]);

  // Computed
  const precision = GAME_DURATION > 0 ? (timeInZone / Math.max(elapsed, 0.01)) * 100 : 0;
  const gradeInfo = getEdgeGrade(precision);
  const remaining = Math.max(0, GAME_DURATION - elapsed);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80">
        <button onClick={() => navigate("/games")} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
          The 15° Edge
        </span>
        <button onClick={() => setMuted(!muted)} className="text-zinc-400 hover:text-white">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Game area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden select-none touch-none">
        {phase === "idle" ? (
          /* Start screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-emerald-400">THE 15° EDGE</h2>
              <p className="text-sm text-zinc-400 max-w-xs">
                Drag your finger across the whetstone. Keep the blade at a perfect 15° angle.
                Hold steady for 30 seconds.
              </p>
            </div>
            <Button
              onClick={startGame}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8"
            >
              SHARPEN
            </Button>
          </div>
        ) : (
          <>
            {/* HUD */}
            <div className="absolute top-3 left-4 right-4 z-10 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{Math.ceil(remaining)}s</span>
                <span className={cn("font-mono text-lg font-bold", isInZone ? "text-emerald-400" : "text-red-400")}>
                  {currentAngle.toFixed(1)}°
                </span>
                <span>{Math.round(precision)}% zone</span>
              </div>
              {/* Sharpness meter */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Sharpness</span>
                  <span>{Math.round(sharpness)}%</span>
                </div>
                <Progress
                  value={sharpness}
                  className="h-2 bg-zinc-800 [&>div]:transition-all [&>div]:duration-100"
                  style={{
                    ["--progress-color" as string]: isInZone ? "#10b981" : "#ef4444",
                  }}
                />
              </div>
            </div>

            {/* Whetstone visual */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Stone */}
              <div className="relative w-[80%] h-24 rounded-xl bg-gradient-to-b from-stone-600 to-stone-700 border border-stone-500/30 shadow-xl">
                {/* Stone texture lines */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 h-px bg-stone-500/20"
                    style={{ top: `${(i + 1) * 8}%` }}
                  />
                ))}

                {/* Perfect zone indicator */}
                <div
                  className="absolute left-0 right-0 h-6 opacity-20 pointer-events-none"
                  style={{
                    top: `${(PERFECT_ANGLE / 45) * 100 - 6}%`,
                    background: "linear-gradient(to bottom, transparent, #10b981, transparent)",
                  }}
                />
              </div>

              {/* Knife blade */}
              <motion.div
                className="absolute w-[70%] h-3 pointer-events-none"
                style={{
                  top: `${(currentAngle / 45) * 100}%`,
                  transformOrigin: "center",
                }}
                animate={{
                  rotate: currentAngle - 15,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div
                  className={cn(
                    "w-full h-full rounded-full transition-colors duration-150",
                    isInZone
                      ? "bg-gradient-to-r from-zinc-400 via-white to-zinc-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      : "bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                  )}
                />
              </motion.div>

              {/* Sparks */}
              {sparks.map((spark) => (
                <motion.div
                  key={spark.id}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "absolute w-1.5 h-1.5 rounded-full pointer-events-none",
                    spark.good ? "bg-emerald-400" : "bg-red-400"
                  )}
                  style={{
                    left: `${spark.x}%`,
                    top: `${spark.y}%`,
                  }}
                />
              ))}
            </div>

            {/* Zone glow border */}
            <div
              className={cn(
                "absolute inset-0 pointer-events-none border-2 rounded-none transition-colors duration-300",
                isInZone ? "border-emerald-500/30" : "border-transparent"
              )}
            />
          </>
        )}
      </div>

      {/* Score card */}
      {showScore && (
        <ScoreCard
          gameName="The 15° Edge"
          score={Math.round(precision * 10)}
          grade={gradeInfo.grade}
          xpEarned={gradeInfo.xp}
          stats={[
            { label: "Precision", value: `${Math.round(precision)}%` },
            { label: "Time in Zone", value: `${Math.round(timeInZone)}s` },
            { label: "Sharpness", value: `${Math.round(sharpness)}%` },
          ]}
          onPlayAgain={startGame}
        />
      )}
    </div>
  );
}
