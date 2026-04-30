import type {
  CreateScoreEntryInput,
  ScoreBreakdown,
  ScoreEntry,
  ScoreMetrics,
  ScoreStore,
} from "./types";

const SCORE_STORE_VERSION = 1;
const COMPLETION_BONUS = 100_000;
const TIME_PENALTY_PER_SECOND = 1 / 6;
const LANDING_VELOCITY_PENALTY_PER_MPS = 1_200;
const FUEL_USAGE_PENALTY_PER_KG = 5;

export function createEmptyScoreStore(): ScoreStore {
  return {
    version: SCORE_STORE_VERSION,
    updatedAt: new Date(0).toISOString(),
    entries: [],
  };
}

export function scoreMission(metrics: ScoreMetrics): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const timePenalty = Math.round(Math.max(metrics.elapsedSeconds, 0) * TIME_PENALTY_PER_SECOND);
  const landingVelocityPenalty = Math.round(
    Math.max(metrics.landingVelocityMps, 0) * LANDING_VELOCITY_PENALTY_PER_MPS,
  );
  const fuelUsagePenalty =
    metrics.fuelUsedKg === null
      ? null
      : Math.round(Math.max(metrics.fuelUsedKg, 0) * FUEL_USAGE_PENALTY_PER_KG);
  const score = Math.max(
    Math.round(
      COMPLETION_BONUS -
        timePenalty -
        landingVelocityPenalty -
        (fuelUsagePenalty ?? 0),
    ),
    0,
  );

  return {
    score,
    breakdown: {
      completionBonus: COMPLETION_BONUS,
      timePenalty,
      landingVelocityPenalty,
      fuelUsagePenalty,
    },
  };
}

export function createScoreEntry(
  input: CreateScoreEntryInput & {
    id: string;
    createdAt?: string;
  },
): ScoreEntry {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const { score, breakdown } = scoreMission(input.metrics);

  return {
    id: input.id,
    createdAt,
    playerName: input.playerName?.trim() || "Anonymous",
    outcome: "soft-landing",
    metrics: input.metrics,
    breakdown,
    score,
  };
}

export function findTopScoreEntry(entries: ScoreEntry[]): ScoreEntry | null {
  let bestEntry: ScoreEntry | null = null;

  for (const entry of entries) {
    if (!bestEntry || entry.score > bestEntry.score) {
      bestEntry = entry;
      continue;
    }

    if (
      entry.score === bestEntry.score &&
      entry.metrics.landingVelocityMps < bestEntry.metrics.landingVelocityMps
    ) {
      bestEntry = entry;
      continue;
    }

    if (
      entry.score === bestEntry.score &&
      entry.metrics.landingVelocityMps === bestEntry.metrics.landingVelocityMps &&
      entry.metrics.elapsedSeconds < bestEntry.metrics.elapsedSeconds
    ) {
      bestEntry = entry;
    }
  }

  return bestEntry;
}
