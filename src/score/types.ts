export type ScoreMetrics = {
  elapsedSeconds: number;
  landingVelocityMps: number;
  fuelUsedKg: number | null;
};

export type ScoreBreakdown = {
  completionBonus: number;
  timePenalty: number;
  landingVelocityPenalty: number;
  fuelUsagePenalty: number | null;
};

export type ScoreEntry = {
  id: string;
  createdAt: string;
  playerName: string;
  outcome: "soft-landing";
  metrics: ScoreMetrics;
  breakdown: ScoreBreakdown;
  score: number;
};

export type ScoreStore = {
  version: 1;
  updatedAt: string;
  entries: ScoreEntry[];
};

export type CreateScoreEntryInput = {
  playerName?: string;
  metrics: ScoreMetrics;
};
