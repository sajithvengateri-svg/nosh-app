import { Cherry, Cat } from "lucide-react";
import { useGameUnlock } from "@/hooks/useGameUnlock";
import { useGameProfile } from "@/hooks/useGameProfile";
import ComplianceGate from "../components/ComplianceGate";
import GameCard from "../components/GameCard";
import StreakBadge from "../components/StreakBadge";
import LeagueBadge from "../components/LeagueBadge";
import XPBar from "../components/XPBar";

export default function GameHub() {
  const { isUnlocked, progress } = useGameUnlock();
  const { profile } = useGameProfile();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <StreakBadge streak={profile?.current_streak ?? 0} />
        <LeagueBadge league={profile?.league ?? "scullery"} />
      </div>

      {/* XP Progress */}
      {profile && <XPBar xp={profile.xp_total} />}

      {/* Compliance gate */}
      <ComplianceGate progress={progress} isUnlocked={isUnlocked} />

      {/* Games grid */}
      <div className="grid grid-cols-2 gap-3">
        <GameCard
          title="Onion Blitz"
          subtitle="Cut the pink onions!"
          route="/games/onion-blitz"
          icon={<Cherry className="w-6 h-6" />}
          isUnlocked={isUnlocked}
          accentColor="pink"
        />
        <GameCard
          title="Alley Cat"
          subtitle="Calm a stray alley cat"
          route="/games/alley-cat"
          icon={<Cat className="w-6 h-6" />}
          isUnlocked={isUnlocked}
          accentColor="violet"
        />
      </div>

      {/* Motivational text */}
      {!isUnlocked && (
        <p className="text-center text-xs text-zinc-500">
          Complete your daily compliance tasks to unlock the games.
          <br />
          <span className="text-zinc-400">
            Safety first. Games second.
          </span>
        </p>
      )}
    </div>
  );
}
