import type { ReactElement } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { RunStats } from "../game/types";

interface ResultPanelProps {
  stats: RunStats | null;
  score: number;
  onSubmit: () => void;
  submitMessage: string;
}

export function ResultPanel({ stats, score, onSubmit, submitMessage }: ResultPanelProps): ReactElement {
  return (
    <section className="panel result-panel">
      <div className="panel-title">
        <CheckCircle2 size={18} />
        <h2>Last Run</h2>
      </div>
      {stats ? (
        <>
          <div className="score-card">
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className="mini-grid">
            <span>Sparks {stats.sparksCollected}</span>
            <span>Rare {stats.rareSparksCollected}</span>
            <span>Captures {stats.ghostsCaptured}</span>
            <span>Damage {stats.damageTaken}</span>
          </div>
          <button className="submit-button" type="button" onClick={onSubmit}>
            <Upload size={16} />
            <span>Submit Score</span>
          </button>
          <p className="submit-message">{submitMessage}</p>
        </>
      ) : (
        <p className="muted">Finish a run to preview score submission.</p>
      )}
    </section>
  );
}
