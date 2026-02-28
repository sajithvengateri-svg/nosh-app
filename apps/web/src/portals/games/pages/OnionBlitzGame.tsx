import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { useGameProfile } from "@/hooks/useGameProfile";
import { useCanvas } from "../engine/useCanvas";
import { useGameLoop } from "../engine/useGameLoop";
import { useHaptics } from "../engine/useHaptics";
import {
  lineIntersectsCircle,
  createLaunchedParticle,
  applyGravity,
  integrate,
  Particle,
  Vec2,
} from "../engine/physics";
import { getOnionGrade } from "../data/levels";
import ScoreCard from "../components/ScoreCard";

// ── Constants ─────────────────────────────────────────────────────

const GAME_DURATION = 45;
const ONION_RADIUS = 30;
const SLASH_FADE_DURATION = 0.3;

type OnionType = "pink" | "white" | "red";

const ONION_COLORS: Record<OnionType, string> = {
  pink: "#ec4899",
  white: "#d1d5db",
  red: "#dc2626",
};

const ONION_POINTS: Record<OnionType, number> = {
  pink: 15,
  white: -5,
  red: 0,
};

// Weighted spawn pool: 6 pink, 5 white, 1 red
const SPAWN_POOL: OnionType[] = [
  "pink", "pink", "pink", "pink", "pink", "pink",
  "white", "white", "white", "white", "white",
  "red",
];

interface Onion extends Particle {
  id: number;
  type: OnionType;
  sliced: boolean;
}

interface SlashTrail {
  start: Vec2;
  end: Vec2;
  birth: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  birth: number;
}

type Phase = "idle" | "playing" | "ended";

// ── Synthetic Sound Hook ──────────────────────────────────────────

function useSyntheticSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const slice = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, [getCtx]);

  const combo = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, [getCtx]);

  const scorePop = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [getCtx]);

  const gameOver = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }, [getCtx]);

  const cry = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const masterGain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.8);

    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(6, ctx.currentTime);
    vibratoGain.gain.setValueAtTime(30, ctx.currentTime);

    vibrato.connect(vibratoGain).connect(osc.frequency);

    masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
    masterGain.gain.setValueAtTime(0.2, ctx.currentTime + 0.5);
    masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(masterGain).connect(ctx.destination);
    vibrato.start(ctx.currentTime);
    osc.start(ctx.currentTime);
    vibrato.stop(ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  }, [getCtx]);

  const setMuted = useCallback((val: boolean) => {
    mutedRef.current = val;
  }, []);

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, []);

  return { slice, combo, scorePop, gameOver, cry, setMuted, mutedRef };
}

// ── Main Component ────────────────────────────────────────────────

export default function OnionBlitzGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const orgId = useOrgId();
  const { addXP, profile } = useGameProfile();
  const haptics = useHaptics();
  const sounds = useSyntheticSounds();

  const { canvasRef, getCtx, dimensions, resize } = useCanvas();

  // Game state
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [muted, setMuted] = useState(false);
  const [redSliced, setRedSliced] = useState(false);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Refs for game loop
  const phaseRef = useRef<Phase>("idle");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const elapsedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const onionsRef = useRef<Onion[]>([]);
  const nextIdRef = useRef(1);
  const slashTrailsRef = useRef<SlashTrail[]>([]);
  const popupIdRef = useRef(1);
  const pinkSlicedRef = useRef(0);
  const whiteSlicedRef = useRef(0);
  const totalSlicedRef = useRef(0);
  const redSlicedRef = useRef(false);

  // Pointer tracking for swipe detection
  const pointerDownRef = useRef(false);
  const prevPosRef = useRef<Vec2 | null>(null);

  // Sync React state to refs for game loop access
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = comboCount; }, [comboCount]);

  // ── Spawn interval (progressive difficulty) ──

  const getSpawnInterval = (elapsed: number): number => {
    return Math.max(0.35, 1.2 - elapsed * 0.015);
  };

  // ── Multiplier from combo ──

  const getMultiplier = (c: number): number => {
    if (c >= 5) return 2;
    if (c >= 3) return 1.5;
    return 1;
  };

  // ── Slice an onion ──

  const sliceOnion = useCallback(
    (onion: Onion, hitX: number, hitY: number) => {
      if (onion.sliced) return;
      onion.sliced = true;
      onion.active = false;
      totalSlicedRef.current += 1;

      if (onion.type === "red") {
        redSlicedRef.current = true;
        setRedSliced(true);
        sounds.cry();
        haptics.impact();
        phaseRef.current = "ended";
        stopRef.current();
        setPhase("ended");
        return;
      }

      if (onion.type === "pink") {
        pinkSlicedRef.current += 1;
        const newCombo = comboRef.current + 1;
        comboRef.current = newCombo;
        setComboCount(newCombo);
        const mult = getMultiplier(newCombo);
        const pts = Math.round(ONION_POINTS.pink * mult);
        scoreRef.current = Math.max(0, scoreRef.current + pts);
        setScore(scoreRef.current);
        sounds.slice();
        if (newCombo === 3 || newCombo === 5) sounds.combo();
        haptics.tap();
        setPopups((prev) => [
          ...prev,
          {
            id: popupIdRef.current++,
            x: hitX,
            y: hitY,
            text: mult > 1 ? `+${pts} x${mult}` : `+${pts}`,
            color: "#ec4899",
            birth: Date.now(),
          },
        ]);
      } else {
        // white onion
        whiteSlicedRef.current += 1;
        comboRef.current = 0;
        setComboCount(0);
        scoreRef.current = Math.max(0, scoreRef.current + ONION_POINTS.white);
        setScore(scoreRef.current);
        sounds.scorePop();
        haptics.error();
        setPopups((prev) => [
          ...prev,
          {
            id: popupIdRef.current++,
            x: hitX,
            y: hitY,
            text: `${ONION_POINTS.white}`,
            color: "#d1d5db",
            birth: Date.now(),
          },
        ]);
      }
    },
    [sounds, haptics]
  );

  // ── Pointer event handlers ──

  const getCanvasPos = useCallback(
    (clientX: number, clientY: number): Vec2 | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [canvasRef]
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      if (phaseRef.current !== "playing") return;
      pointerDownRef.current = true;
      const pos = getCanvasPos(clientX, clientY);
      prevPosRef.current = pos;
    },
    [getCanvasPos]
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!pointerDownRef.current || phaseRef.current !== "playing") return;
      const pos = getCanvasPos(clientX, clientY);
      if (!pos || !prevPosRef.current) {
        prevPosRef.current = pos;
        return;
      }

      const prev = prevPosRef.current;

      // Add slash trail
      slashTrailsRef.current.push({
        start: { ...prev },
        end: { ...pos },
        birth: performance.now() / 1000,
      });

      // Check intersections with active onions
      for (const onion of onionsRef.current) {
        if (!onion.active || onion.sliced) continue;
        if (lineIntersectsCircle(prev, pos, onion.pos, onion.radius)) {
          sliceOnion(onion, onion.pos.x, onion.pos.y);
        }
      }

      prevPosRef.current = pos;
    },
    [getCanvasPos, sliceOnion]
  );

  const handlePointerUp = useCallback(() => {
    pointerDownRef.current = false;
    prevPosRef.current = null;
  }, []);

  // ── Attach pointer events ──

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handlePointerDown(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) handlePointerMove(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handlePointerUp();
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [canvasRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  // ── Update loop ──

  const update = useCallback(
    (dt: number) => {
      if (phaseRef.current !== "playing") return;

      elapsedRef.current += dt;
      const remaining = GAME_DURATION - elapsedRef.current;
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        phaseRef.current = "ended";
        stopRef.current();
        setPhase("ended");
        sounds.gameOver();
        return;
      }

      const { width, height } = dimensions.current;

      // Spawn onions
      spawnTimerRef.current += dt;
      const interval = getSpawnInterval(elapsedRef.current);
      if (spawnTimerRef.current >= interval) {
        spawnTimerRef.current = 0;
        const type = SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
        const base = createLaunchedParticle(width, height, ONION_RADIUS);
        const onion: Onion = {
          ...base,
          id: nextIdRef.current++,
          type,
          sliced: false,
        };
        onionsRef.current.push(onion);
      }

      // Physics
      for (const onion of onionsRef.current) {
        if (!onion.active) continue;
        applyGravity(onion, dt);
        integrate(onion, dt);

        // Deactivate if fallen below screen
        if (onion.pos.y > height + onion.radius * 2) {
          onion.active = false;
        }
      }

      // Cleanup inactive and sliced onions that have fallen off
      onionsRef.current = onionsRef.current.filter(
        (o) => o.active || (o.sliced && o.pos.y < height + 100)
      );

      // Cleanup old slash trails
      const now = performance.now() / 1000;
      slashTrailsRef.current = slashTrailsRef.current.filter(
        (s) => now - s.birth < SLASH_FADE_DURATION
      );

      // Cleanup old popups
      setPopups((prev) => prev.filter((p) => Date.now() - p.birth < 800));
    },
    [dimensions, sounds]
  );

  // ── Render loop ──

  const render = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const { width, height } = dimensions.current;

    // Background: dark wood counter gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#2a1f15");
    bgGrad.addColorStop(1, "#1a130d");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Cutting board rectangle
    const boardMargin = width * 0.08;
    const boardTop = height * 0.1;
    const boardBottom = height * 0.92;
    const boardGrad = ctx.createLinearGradient(0, boardTop, 0, boardBottom);
    boardGrad.addColorStop(0, "#3d2e1e");
    boardGrad.addColorStop(0.5, "#4a3828");
    boardGrad.addColorStop(1, "#3d2e1e");
    ctx.fillStyle = boardGrad;
    ctx.beginPath();
    ctx.roundRect(boardMargin, boardTop, width - boardMargin * 2, boardBottom - boardTop, 12);
    ctx.fill();

    // Board edge highlight
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boardMargin, boardTop, width - boardMargin * 2, boardBottom - boardTop, 12);
    ctx.stroke();

    // Draw onions
    for (const onion of onionsRef.current) {
      if (!onion.active && !onion.sliced) continue;
      const { x, y } = onion.pos;
      const r = onion.radius;
      const color = ONION_COLORS[onion.type];

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(onion.rotation);

      // Radial gradient fill
      const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
      grad.addColorStop(0, color + "ff");
      grad.addColorStop(0.7, color + "cc");
      grad.addColorStop(1, color + "88");
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Layer arc lines for onion look
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.2;
      for (let i = 1; i <= 3; i++) {
        const layerR = r * (0.3 + i * 0.2);
        ctx.beginPath();
        ctx.arc(0, 0, layerR, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.stroke();
      }

      // Highlight
      ctx.beginPath();
      ctx.arc(-r * 0.25, -r * 0.25, r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fill();

      ctx.restore();
    }

    // Draw slash trails
    const now = performance.now() / 1000;
    for (const trail of slashTrailsRef.current) {
      const age = now - trail.birth;
      const alpha = Math.max(0, 1 - age / SLASH_FADE_DURATION);
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trail.start.x, trail.start.y);
      ctx.lineTo(trail.end.x, trail.end.y);
      ctx.stroke();
    }
  }, [getCtx, dimensions]);

  // ── Game loop ──

  const { start, stop } = useGameLoop({ update, render });
  const stopRef = useRef(stop);
  stopRef.current = stop;

  // ── Start game ──

  const startGame = useCallback(() => {
    onionsRef.current = [];
    slashTrailsRef.current = [];
    nextIdRef.current = 1;
    popupIdRef.current = 1;
    spawnTimerRef.current = 0;
    elapsedRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    pinkSlicedRef.current = 0;
    whiteSlicedRef.current = 0;
    totalSlicedRef.current = 0;
    redSlicedRef.current = false;

    setScore(0);
    setComboCount(0);
    setTimeRemaining(GAME_DURATION);
    setRedSliced(false);
    setPopups([]);
    setScoreSaved(false);

    resize();
    setPhase("playing");
    start();
  }, [resize, start]);

  // ── Save score on end ──

  useEffect(() => {
    if (phase !== "ended" || scoreSaved) return;
    stop();
    setScoreSaved(true);

    const finalScore = scoreRef.current;
    const totalSliced = totalSlicedRef.current;
    const pinkSliced = pinkSlicedRef.current;
    const accuracy = totalSliced > 0 ? (pinkSliced / totalSliced) * 100 : 0;
    const gradeInfo = getOnionGrade(accuracy);

    if (user?.id && orgId) {
      supabase
        .from("game_scores" as any)
        .insert({
          user_id: user.id,
          org_id: orgId,
          game_key: "onion_blitz",
          score: finalScore,
          grade: gradeInfo.grade,
          league: profile?.league ?? "scullery",
          meta: {
            accuracy: Math.round(accuracy),
            pink_sliced: pinkSliced,
            white_sliced: whiteSlicedRef.current,
            red_sliced: redSlicedRef.current,
            total_sliced: totalSliced,
          },
        } as any)
        .then(() => {});

      addXP(gradeInfo.xp);
    }
  }, [phase, scoreSaved, stop, user, orgId, addXP, profile]);

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // ── Computed values for score card ──

  const totalSliced = totalSlicedRef.current;
  const pinkSliced = pinkSlicedRef.current;
  const accuracy = totalSliced > 0 ? (pinkSliced / totalSliced) * 100 : 0;
  const gradeInfo = getOnionGrade(accuracy);

  // ── Toggle mute ──

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      sounds.setMuted(!prev);
      return !prev;
    });
  }, [sounds]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 shrink-0">
        <button onClick={() => navigate("/games")} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          {phase === "playing" && (
            <>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Pink Onion Blitz
              </span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {Math.ceil(timeRemaining)}s
              </span>
              <span className="text-sm font-bold text-pink-400">{score}</span>
              {comboCount >= 3 && (
                <span className="text-xs font-bold text-yellow-300">
                  x{getMultiplier(comboCount)} ({comboCount})
                </span>
              )}
            </>
          )}
          {phase !== "playing" && (
            <span className="text-sm font-bold text-pink-400 uppercase tracking-wider">
              Pink Onion Blitz
            </span>
          )}
        </div>
        <button onClick={toggleMute} className="text-zinc-400 hover:text-white">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{ display: phase === "idle" ? "none" : "block" }}
        />

        {/* Score popups (DOM overlay) */}
        <AnimatePresence>
          {popups.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -60 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute pointer-events-none font-black text-lg"
              style={{
                left: p.x - 30,
                top: p.y - 20,
                color: p.color,
                textShadow: "0 0 8px rgba(0,0,0,0.8)",
              }}
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Start screen */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-pink-400">Pink Onion Blitz</h2>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                Swipe to slice the pink onions! Avoid white onions (-5 pts, combo break).
                Slice a red onion and it is game over — tears everywhere.
                Build combos for multiplied points. You have 45 seconds.
              </p>
            </div>
            <Button
              onClick={startGame}
              size="lg"
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-lg px-8"
            >
              START CHOPPING
            </Button>
          </div>
        )}

        {/* Red onion tears overlay */}
        {phase === "ended" && redSliced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-red-950/80 backdrop-blur-sm z-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center space-y-3"
            >
              <div className="text-6xl">😭</div>
              <h2 className="text-4xl font-black text-red-400">RED ONION!</h2>
              <p className="text-lg text-red-300">Tears everywhere!</p>
              <p className="text-sm text-zinc-400">Final score: {score}</p>
            </motion.div>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={startGame}
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold"
              >
                Try Again
              </Button>
              <Button
                onClick={() => navigate("/games")}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Back to Hub
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Score card (normal end — timer ran out) */}
      {phase === "ended" && !redSliced && (
        <ScoreCard
          gameName="Pink Onion Blitz"
          score={score}
          grade={gradeInfo.grade}
          xpEarned={gradeInfo.xp}
          stats={[
            { label: "Accuracy", value: `${Math.round(accuracy)}%` },
            { label: "Pink Sliced", value: `${pinkSliced}` },
            { label: "White Sliced", value: `${whiteSlicedRef.current}` },
            { label: "Best Combo", value: `${comboCount}` },
          ]}
          onPlayAgain={startGame}
        />
      )}
    </div>
  );
}
