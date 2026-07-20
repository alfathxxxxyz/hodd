import type { ReactElement } from "react";
import { RunStats } from "../game/types";

interface ResultOverlayProps {
  stats: RunStats;
  score: number;
  onPlayAgain: () => void;
}

export function ResultOverlay({ stats, score, onPlayAgain }: ResultOverlayProps): ReactElement {
  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-label="Run result">
      <p className={stats.completed ? "result-status sealed" : "result-status"}>{stats.completed ? "RUN SEALED" : "RUN ENDED"}</p>
      <strong className="result-score">{score.toLocaleString()}</strong>
      <div className="result-stats">
        <span>SPARKS <b>{stats.sparksCollected}</b></span>
        <span>CAPTURED <b>{stats.ghostsCaptured}</b></span>
        <span>TIME <b>{stats.remainingSeconds}s</b></span>
      </div>
      <button type="button" onClick={onPlayAgain}>PLAY AGAIN</button>
    </div>
  );
}
