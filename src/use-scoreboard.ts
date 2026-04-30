import { useEffect, useState } from "react";
import { fetchTopScore, submitScore } from "./score/api";
import type { CreateScoreEntryInput, ScoreEntry } from "./score/types";

export function useScoreboard() {
  const [topScore, setTopScore] = useState<ScoreEntry | null>(null);

  useEffect(() => {
    let canceled = false;

    void fetchTopScore()
      .then((nextTopScore) => {
        if (!canceled) {
          setTopScore(nextTopScore);
        }
      })
      .catch((error) => {
        console.error("Failed to load top score.", error);
      });

    return () => {
      canceled = true;
    };
  }, []);

  async function recordScore(input: CreateScoreEntryInput) {
    const payload = await submitScore(input);
    setTopScore(payload.topScore);
    return payload;
  }

  return {
    topScore,
    recordScore,
  };
}
