import type { CreateScoreEntryInput, ScoreEntry, ScoreStore } from "./types";

export async function fetchTopScore(): Promise<ScoreEntry | null> {
  const response = await fetch("/api/scores/top");
  if (!response.ok) {
    throw new Error(`Failed to fetch top score (${response.status}).`);
  }

  const payload = (await response.json()) as { topScore: ScoreEntry | null };
  return payload.topScore;
}

export async function submitScore(
  input: CreateScoreEntryInput,
): Promise<{ entry: ScoreEntry; topScore: ScoreEntry | null; store: ScoreStore }> {
  const response = await fetch("/api/scores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to save score (${response.status}).`);
  }

  return (await response.json()) as {
    entry: ScoreEntry;
    topScore: ScoreEntry | null;
    store: ScoreStore;
  };
}
