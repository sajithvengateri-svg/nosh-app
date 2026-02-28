import { useMemo } from "react";

const NOSH = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
  border: "rgba(232,221,226,0.5)",
};

const LEVELS = [
  { label: "Weak", color: "#EF4444" },
  { label: "Fair", color: "#F59E0B" },
  { label: "Good", color: "#3B82F6" },
  { label: "Strong", color: "#22C55E" },
];

function getStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  const level = LEVELS[strength - 1] || LEVELS[0];

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength ? level.color : NOSH.border,
            }}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color: level.color }}>
        {level.label}
      </p>
    </div>
  );
}
