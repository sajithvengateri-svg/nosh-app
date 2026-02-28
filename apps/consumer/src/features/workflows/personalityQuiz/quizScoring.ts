type PersonalityType =
  | "humpday_nosher"
  | "weekend_warrior"
  | "thrill_seeker"
  | "ocd_planner";

interface QuizResult {
  primary: PersonalityType;
  primaryScore: number;
  secondary: PersonalityType | null;
  secondaryScore: number;
  confidence: number;
  allScores: Record<PersonalityType, number>;
}

export function scoreQuiz(answers: Record<string, string>): QuizResult {
  const scores: Record<PersonalityType, number> = {
    humpday_nosher: 0,
    weekend_warrior: 0,
    thrill_seeker: 0,
    ocd_planner: 0,
  };

  // Each answer value IS the personality type
  for (const [key, value] of Object.entries(answers)) {
    if (key.startsWith("q") && value in scores) {
      scores[value as PersonalityType] += 3;
    }
  }

  // Sort by score descending
  const sorted = (
    Object.entries(scores) as [PersonalityType, number][]
  ).sort((a, b) => b[1] - a[1]);

  const primary = sorted[0][0];
  const primaryScore = sorted[0][1];
  const secondary = sorted[1][1] > 0 ? sorted[1][0] : null;
  const secondaryScore = sorted[1][1];

  // Confidence: how dominant is the primary type
  const totalPoints = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence =
    totalPoints > 0
      ? Math.min(0.95, 0.4 + (primaryScore / totalPoints) * 0.5)
      : 0.4;

  return {
    primary,
    primaryScore,
    secondary,
    secondaryScore,
    confidence,
    allScores: scores,
  };
}
