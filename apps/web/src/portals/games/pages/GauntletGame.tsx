import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { useCanvas } from "../engine/useCanvas";
import { useGameLoop } from "../engine/useGameLoop";
import { useHaptics } from "../engine/useHaptics";
import { useGameStore, GamePhase } from "../engine/gameStore";
import { useGameProfile } from "@/hooks/useGameProfile";
import { getGauntletGrade } from "../data/levels";
import MentorPopup from "../components/MentorPopup";
import ScoreCard from "../components/ScoreCard";
import { clamp } from "../engine/physics";

// ── Types ───────────────────────────────────────────────────────

type HazardType = "contamination" | "temp_danger" | "expired";

interface Hazard {
  id: number;
  type: HazardType;
  lane: number; // 0, 1, 2
  y: number;
  speed: number;
  active: boolean;
  cleared: boolean;
}

const HAZARD_CONFIG: Record<HazardType, { emoji: string; color: string; label: string }> = {
  contamination: { emoji: "☣", color: "#ef4444", label: "Cross-contamination" },
  temp_danger: { emoji: "🌡", color: "#f97316", label: "Temp Danger" },
  expired: { emoji: "⏰", color: "#eab308", label: "Expired Stock" },
};

const HAZARD_TYPES: HazardType[] = ["contamination", "temp_danger", "expired"];
const GAME_DURATION = 60; // seconds
const BASE_SPEED = 120; // pixels/sec
const HAZARD_RADIUS = 28;

// ── Component ───────────────────────────────────────────────────

export default function GauntletGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = useOrgId();
  const { addXP, profile } = useGameProfile();
  const haptics = useHaptics();

  const { canvasRef, getCtx, dimensions, resize } = useCanvas();
  const store = useGameStore();

  const hazardsRef = useRef<Hazard[]>([]);
  const nextIdRef = useRef(1);
  const spawnTimerRef = useRef(0);
  const elapsedRef = useRef(0);
  const [mentorTrigger, setMentorTrigger] = useState(0);
  const [mentorCategory, setMentorCategory] = useState<"miss" | "rage" | "praise">("miss");
  const [showScore, setShowScore] = useState(false);
  const [muted, setMuted] = useState(false);

  // Spawn interval decreases over time (gets harder)
  const getSpawnInterval = (elapsed: number) => {
    return Math.max(0.4, 2 - elapsed * 0.025);
  };

  const getSpeed = (elapsed: number) => {
    return BASE_SPEED + elapsed * 2.5;
  };

  // ── Update ──

  const update = useCallback(
    (dt: number) => {
      const state = useGameStore.getState();
      if (state.phase !== "playing") return;

      elapsedRef.current += dt;
      const remaining = GAME_DURATION - elapsedRef.current;
      store.setTimeRemaining(remaining);

      if (remaining <= 0) {
        store.setPhase("ended");
        setShowScore(true);
        return;
      }

      const { width, height } = dimensions.current;
      const laneWidth = width / 3;
      const speed = getSpeed(elapsedRef.current);

      // Spawn new hazards
      spawnTimerRef.current += dt;
      const interval = getSpawnInterval(elapsedRef.current);
      if (spawnTimerRef.current >= interval) {
        spawnTimerRef.current = 0;
        const lane = Math.floor(Math.random() * 3);
        const type = HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)];
        hazardsRef.current.push({
          id: nextIdRef.current++,
          type,
          lane,
          y: -HAZARD_RADIUS * 2,
          speed,
          active: true,
          cleared: false,
        });
      }

      // Move hazards
      for (const h of hazardsRef.current) {
        if (!h.active) continue;
        h.y += h.speed * dt;

        // Missed — fell past bottom
        if (h.y > height + HAZARD_RADIUS) {
          h.active = false;
          store.missHazard();
          haptics.impact();

          const missed = useGameStore.getState().hazardsMissed;
          if (missed >= 10) {
            store.setPhase("ended");
            setMentorCategory("rage");
            setMentorTrigger((t) => t + 1);
            setTimeout(() => setShowScore(true), 2000);
          } else {
            setMentorCategory("miss");
            setMentorTrigger((t) => t + 1);
          }
        }
      }

      // Cleanup inactive
      hazardsRef.current = hazardsRef.current.filter((h) => h.active || h.cleared);
    },
    [dimensions, store, haptics]
  );

  // ── Render ──

  const render = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { width, height } = dimensions.current;
    const state = useGameStore.getState();

    // Background — gets redder with heat
    const heatPct = state.heatLevel / 100;
    const r = Math.round(10 + heatPct * 40);
    ctx.fillStyle = `rgb(${r}, 10, 15)`;
    ctx.fillRect(0, 0, width, height);

    // Lane dividers
    const laneWidth = width / 3;
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(laneWidth, 0);
    ctx.lineTo(laneWidth, height);
    ctx.moveTo(laneWidth * 2, 0);
    ctx.lineTo(laneWidth * 2, height);
    ctx.stroke();

    // Draw hazards
    for (const h of hazardsRef.current) {
      if (!h.active) continue;
      const cfg = HAZARD_CONFIG[h.type];
      const cx = h.lane * laneWidth + laneWidth / 2;

      // Glow
      ctx.beginPath();
      ctx.arc(cx, h.y, HAZARD_RADIUS + 4, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color + "30";
      ctx.fill();

      // Circle
      ctx.beginPath();
      ctx.arc(cx, h.y, HAZARD_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color + "20";
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Emoji
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(cfg.emoji, cx, h.y);
    }

    // Timer
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(state.timeRemaining)}s`, width / 2, 30);

    // Score
    ctx.textAlign = "left";
    ctx.font = "bold 14px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#a3e635";
    ctx.fillText(`${state.score}`, 12, 28);

    // Heat meter
    const meterW = 60;
    const meterH = 6;
    const meterX = width - meterW - 12;
    ctx.fillStyle = "#27272a";
    ctx.fillRect(meterX, 22, meterW, meterH);
    ctx.fillStyle = heatPct > 0.7 ? "#ef4444" : heatPct > 0.4 ? "#f97316" : "#eab308";
    ctx.fillRect(meterX, 22, meterW * heatPct, meterH);
  }, [getCtx, dimensions]);

  // ── Tap handler ──

  const handleTap = useCallback(
    (clientX: number, clientY: number) => {
      const state = useGameStore.getState();
      if (state.phase !== "playing") return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const laneWidth = dimensions.current.width / 3;

      // Find closest active hazard near tap
      let closest: Hazard | null = null;
      let closestDist = Infinity;

      for (const h of hazardsRef.current) {
        if (!h.active) continue;
        const cx = h.lane * laneWidth + laneWidth / 2;
        const dx = x - cx;
        const dy = y - h.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HAZARD_RADIUS * 2 && dist < closestDist) {
          closestDist = dist;
          closest = h;
        }
      }

      if (closest) {
        closest.active = false;
        closest.cleared = true;
        store.clearHazard();
        haptics.tap();
      }
    },
    [canvasRef, dimensions, store, haptics]
  );

  // ── Touch/mouse events ──

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) handleTap(touch.clientX, touch.clientY);
    };
    const onClick = (e: MouseEvent) => handleTap(e.clientX, e.clientY);

    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("click", onClick);
    };
  }, [canvasRef, handleTap]);

  // ── Game loop ──

  const { start, stop } = useGameLoop({ update, render });

  // ── Start game ──

  const startGame = useCallback(() => {
    store.resetGame();
    hazardsRef.current = [];
    nextIdRef.current = 1;
    spawnTimerRef.current = 0;
    elapsedRef.current = 0;
    setShowScore(false);
    resize();
    store.setPhase("playing");
    start();
  }, [store, resize, start]);

  // ── Save score on end ──

  useEffect(() => {
    if (!showScore) return;
    stop();

    const state = useGameStore.getState();
    const total = state.hazardsCleared + state.hazardsMissed;
    const accuracy = total > 0 ? (state.hazardsCleared / total) * 100 : 0;
    const gradeInfo = getGauntletGrade(accuracy);

    // Save score to Supabase
    if (user?.id && orgId) {
      supabase
        .from("game_scores" as any)
        .insert({
          user_id: user.id,
          org_id: orgId,
          game_key: "gauntlet",
          score: state.score,
          grade: gradeInfo.grade,
          league: profile?.league ?? "scullery",
          meta: {
            accuracy: Math.round(accuracy),
            cleared: state.hazardsCleared,
            missed: state.hazardsMissed,
          },
        } as any)
        .then(() => {});

      addXP(gradeInfo.xp);
    }
  }, [showScore, stop, user, orgId, addXP, profile]);

  // ── Cleanup ──

  useEffect(() => {
    return () => {
      stop();
      store.resetGame();
    };
  }, [stop, store]);

  // Computed for score card
  const state = useGameStore();
  const total = state.hazardsCleared + state.hazardsMissed;
  const accuracy = total > 0 ? (state.hazardsCleared / total) * 100 : 0;
  const gradeInfo = getGauntletGrade(accuracy);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80">
        <button onClick={() => navigate("/games")} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-red-400 uppercase tracking-wider">
          The Kitchen Gauntlet
        </span>
        <button onClick={() => setMuted(!muted)} className="text-zinc-400 hover:text-white">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{ display: state.phase === "idle" ? "none" : "block" }}
        />

        {/* Start screen */}
        {state.phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-red-400">THE GAUNTLET</h2>
              <p className="text-sm text-zinc-400 max-w-xs">
                Tap hazards before they reach the bottom. Miss 10 and the Health Inspector shuts you
                down. Survive 60 seconds.
              </p>
            </div>
            <Button
              onClick={startGame}
              size="lg"
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-lg px-8"
            >
              START SHIFT
            </Button>
          </div>
        )}
      </div>

      {/* Mentor popup */}
      <MentorPopup trigger={mentorTrigger} category={mentorCategory} />

      {/* Score card */}
      {showScore && state.phase === "ended" && (
        <ScoreCard
          gameName="The Kitchen Gauntlet"
          score={state.score}
          grade={gradeInfo.grade}
          xpEarned={gradeInfo.xp}
          stats={[
            { label: "Accuracy", value: `${Math.round(accuracy)}%` },
            { label: "Cleared", value: `${state.hazardsCleared}` },
            { label: "Missed", value: `${state.hazardsMissed}` },
            { label: "Heat Level", value: `${state.heatLevel}%` },
          ]}
          onPlayAgain={startGame}
        />
      )}
    </div>
  );
}
