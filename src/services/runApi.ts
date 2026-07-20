import { LeaderboardEntry, RunStats } from "../game/types";
import { ScoreSystem } from "../game/systems/ScoreSystem";

export interface StartRunResponse {
  runId: string;
  seed: number;
  levelId: string;
  expiresAt: string;
  signature: string;
}

export interface SubmitRunResponse {
  accepted: boolean;
  score: number;
  errors: string[];
}

const submittedRuns = new Set<string>();

export async function startRun(): Promise<StartRunResponse> {
  const seed = Math.floor(Date.now() % 100000);
  return {
    runId: `mock-${seed}`,
    seed,
    levelId: "haunted-arcade-01",
    expiresAt: new Date(Date.now() + 1000 * 60 * 8).toISOString(),
    signature: `mock-signature-${seed}`
  };
}

export async function submitRun(stats: RunStats, claimedScore: number): Promise<SubmitRunResponse> {
  const errors = validateRun(stats, claimedScore);
  if (errors.length === 0) submittedRuns.add(stats.runId);
  return {
    accepted: errors.length === 0,
    score: ScoreSystem.calculate(stats).finalScore,
    errors
  };
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return [
    { rank: 1, player: "0xA91...7F2", score: 13920, completionTime: "82s", completed: true },
    { rank: 2, player: "minty.hunter", score: 12880, completionTime: "96s", completed: true },
    { rank: 3, player: "0x77C...B10", score: 12100, completionTime: "101s", completed: true },
    { rank: 4, player: "lantern_404", score: 9900, completionTime: "DNF", completed: false },
    { rank: 5, player: "0xF00...BAD", score: 8740, completionTime: "DNF", completed: false }
  ];
}

export function validateRun(stats: RunStats, claimedScore: number): string[] {
  const errors: string[] = [];
  const recalculated = ScoreSystem.calculate(stats).finalScore;
  if (submittedRuns.has(stats.runId)) errors.push("Duplicate run submission.");
  if (stats.durationMs < 1000 || stats.durationMs > 125000) errors.push("Impossible duration.");
  if (stats.sparksCollected + stats.rareSparksCollected > 140) errors.push("Shard count above map maximum.");
  if (
    stats.sparksCollected < 0 ||
    stats.rareSparksCollected < 0 ||
    stats.ghostsCaptured < 0 ||
    stats.captureScore < 0 ||
    stats.damageTaken < 0 ||
    stats.remainingLives < 0 ||
    stats.remainingSeconds < 0
  ) {
    errors.push("Negative values are not allowed.");
  }
  if (stats.ghostsCaptured > 16) errors.push("Impossible hunter capture total.");
  if (stats.remainingSeconds > 120) errors.push("Impossible remaining time.");
  if (claimedScore !== recalculated) errors.push("Final score mismatch.");
  return errors;
}
