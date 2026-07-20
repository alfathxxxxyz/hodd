import { RunStats, ScoreBreakdown } from "../types";

export class ScoreSystem {
  public static calculate(stats: RunStats): ScoreBreakdown {
    const sparkScore = stats.sparksCollected * 25;
    const rareSparkScore = stats.rareSparksCollected * 100;
    const portalScore = stats.events.some((event) => event.type === "portalOpen") ? 1200 : 0;
    const completionScore = stats.completed ? 1600 : 0;
    const lifeScore = stats.completed ? stats.remainingLives * 350 : 0;
    const timeScore = stats.completed ? stats.remainingSeconds * 18 : 0;
    const noDamageBonus = stats.completed && stats.damageTaken === 0 ? 1200 : 0;
    const finalScore =
      sparkScore +
      rareSparkScore +
      stats.captureScore +
      portalScore +
      completionScore +
      lifeScore +
      timeScore +
      noDamageBonus;

    return {
      sparkScore,
      rareSparkScore,
      captureScore: stats.captureScore,
      portalScore,
      completionScore,
      lifeScore,
      timeScore,
      noDamageBonus,
      finalScore
    };
  }
}
