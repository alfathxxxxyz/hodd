import type { ReactElement } from "react";
import { Crown, ShieldCheck } from "lucide-react";
import { LeaderboardEntry } from "../game/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  minimumScore: number;
}

export function Leaderboard({ entries, minimumScore }: LeaderboardProps): ReactElement {
  return (
    <div className="ranking-board">
      <div className="ranking-head">
        <span>RANK</span><span>HUNTER</span><span>SCORE</span><span>TIME</span><span>ACCESS</span>
      </div>
      <div className="ranking-list">
        {entries.map((entry) => {
          const qualified = entry.score >= minimumScore;
          return (
            <div className={`ranking-row rank-${entry.rank}`} key={entry.rank}>
              <span className="ranking-number">{entry.rank === 1 ? <Crown size={22} /> : `#${String(entry.rank).padStart(2, "0")}`}</span>
              <span className="hunter-name"><i />{entry.player}</span>
              <strong className="ranking-score">{entry.score.toLocaleString()}</strong>
              <span className="ranking-time">{entry.completed ? entry.completionTime : "DNF"}</span>
              <span className={qualified ? "access qualified" : "access locked"}>{qualified && <ShieldCheck size={15} />}{qualified ? "QUALIFIED" : "LOCKED"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
