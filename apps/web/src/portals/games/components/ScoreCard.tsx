import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCcw, Home, Share2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScoreCardProps {
  gameName: string;
  score: number;
  grade: string;
  xpEarned: number;
  /** Additional stats to display */
  stats?: { label: string; value: string }[];
  onPlayAgain: () => void;
}

export default function ScoreCard({
  gameName,
  score,
  grade,
  xpEarned,
  stats,
  onPlayAgain,
}: ScoreCardProps) {
  const navigate = useNavigate();

  const gradeColor =
    grade.startsWith("A") || grade === "Razor Edge"
      ? "text-emerald-400"
      : grade.startsWith("B") || grade === "Sharp"
      ? "text-blue-400"
      : grade.startsWith("C") || grade === "Dull"
      ? "text-amber-400"
      : "text-red-400";

  const handleShare = async () => {
    const text = `I just scored ${grade} on ${gameName} in ChefOS! Can you beat my score of ${score}?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "ChefOS Mastery Suite", text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
            Health Inspection Report
          </p>
          <p className="text-sm text-zinc-400">{gameName}</p>
        </div>

        {/* Grade */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className={`text-7xl font-black ${gradeColor}`}
          >
            {grade}
          </motion.div>
        </div>

        {/* Score & XP */}
        <div className="flex justify-center gap-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-2xl font-bold text-white">{score}</p>
            <p className="text-[11px] text-zinc-500 uppercase">Score</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <p className="text-2xl font-bold text-emerald-400">+{xpEarned}</p>
            <p className="text-[11px] text-zinc-500 uppercase">XP</p>
          </motion.div>
        </div>

        {/* Extra stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {stats.map(({ label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-lg bg-zinc-800/50 px-3 py-2 text-center"
              >
                <p className="text-sm font-semibold text-white">{value}</p>
                <p className="text-[10px] text-zinc-500 uppercase">{label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onPlayAgain}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" /> Again
          </Button>
          <Button
            onClick={() => navigate("/games")}
            variant="outline"
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Home className="w-4 h-4 mr-1.5" /> Hub
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-3"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
