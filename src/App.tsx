import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Crosshair, RotateCcw, Sparkles, Timer, Zap } from "lucide-react";
import { GameCanvas } from "./components/GameCanvas";
import { Leaderboard } from "./components/Leaderboard";
import { MobileControls } from "./components/MobileControls";
import { StartOverlay } from "./components/StartOverlay";
import { ResultOverlay } from "./components/ResultOverlay";
import type { LeaderboardEntry, RunStats } from "./game/types";

const WHITELIST_SCORE = 10000;
const LOGO_SRC = "/assets/logo.png";

interface LiveStats {
  score: number;
  sparks: number;
  captures: number;
  lives: number;
  seconds: number;
}

const initialLiveStats: LiveStats = {
  score: 0,
  sparks: 0,
  captures: 0,
  lives: 5,
  seconds: 120
};

type Page = "game" | "leaderboard";

function resolvePage(): Page {
  return window.location.hash === "#leaderboard" ? "leaderboard" : "game";
}

export default function App(): ReactElement {
  const [page, setPage] = useState<Page>(resolvePage);
  const [entries] = useState<LeaderboardEntry[]>([]);
  const [live, setLive] = useState<LiveStats>(initialLiveStats);
  const [lastStats, setLastStats] = useState<RunStats | null>(null);
  const [lastScore, setLastScore] = useState(0);
  const [bestScore, setBestScore] = useState(
    () => Number(window.localStorage.getItem("h00dle-best-score")) || 0
  );
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    const onHashChange = (): void => setPage(resolvePage());
    const onLive = (event: Event): void => {
      setLive((event as CustomEvent<LiveStats>).detail);
    };
    const onResult = (event: Event): void => {
      const detail = (event as CustomEvent<{ stats: RunStats; score: number }>).detail;
      setLastStats(detail.stats);
      setLastScore(detail.score);
      setBestScore((current) => {
        const next = Math.max(current, detail.score);
        window.localStorage.setItem("h00dle-best-score", String(next));
        return next;
      });
    };

    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("ghostlist-live", onLive);
    window.addEventListener("ghostlist-result", onResult);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("ghostlist-live", onLive);
      window.removeEventListener("ghostlist-result", onResult);
    };
  }, []);

  const navigate = (nextPage: Page): void => {
    window.location.hash = nextPage === "leaderboard" ? "leaderboard" : "game";
    setPage(nextPage);
  };

  const handleReset = (): void => {
    setLive(initialLiveStats);
    setLastStats(null);
    setLastScore(0);
    setResetToken((value) => value + 1);
    window.dispatchEvent(new Event("ghostlist-reset"));
  };

  const progress = Math.min(100, Math.round((live.score / WHITELIST_SCORE) * 100));
  const remaining = Math.max(0, WHITELIST_SCORE - live.score);

  return (
    <main className="site-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => navigate("game")}
          aria-label="Open H00dle game"
        >
          <img className="brand-logo" src={LOGO_SRC} alt="" aria-hidden="true" />
          <span>H00dle</span>
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          <button
            className={page === "game" ? "active" : ""}
            type="button"
            onClick={() => navigate("game")}
          >
            Game
          </button>
          <button
            className={page === "leaderboard" ? "active" : ""}
            type="button"
            onClick={() => navigate("leaderboard")}
          >
            Leaderboard
          </button>
        </nav>
      </header>

      {page === "game" ? (
        <div className="game-page">
          <section className="cabinet" aria-label="H00dle arcade game">
            <div className="cabinet-marquee">
              <span>
                HI-SCORE <b>{bestScore.toLocaleString()}</b>
              </span>
              <div className="life-bar" aria-label={`${live.lives} lives remaining`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <i
                    className={index < live.lives ? "pixel-heart" : "pixel-heart empty"}
                    key={index}
                  />
                ))}
              </div>
            </div>

            <div className="screen-bezel">
              <GameCanvas />
              <StartOverlay key={resetToken} />
              {lastStats && (
                <ResultOverlay stats={lastStats} score={lastScore} onPlayAgain={handleReset} />
              )}
              <div className="screen-glare" />
            </div>

            <MobileControls />
          </section>

          <aside className="stats-sidebar">
            <button
              className="reset-button"
              type="button"
              onClick={handleReset}
              aria-label="Reset run"
              title="Reset run"
            >
              <RotateCcw aria-hidden="true" />
            </button>

            <section className="pixel-panel mission-panel">
              <p className="panel-kicker">WHITELIST MISSION</p>
              <div className="target-score">
                <span>MINIMUM SCORE</span>
                <strong>{WHITELIST_SCORE.toLocaleString()}</strong>
              </div>
              <div className="progress-label">
                <span>RUN PROGRESS</span>
                <b>{progress}%</b>
              </div>
              <div className="pixel-progress">
                <i style={{ width: `${progress}%` }} />
              </div>
              <p className={remaining === 0 ? "qualified status-copy" : "status-copy"}>
                {remaining === 0
                  ? "ACCESS UNLOCKED"
                  : `${remaining.toLocaleString()} POINTS TO UNLOCK`}
              </p>
            </section>

            <section className="pixel-panel live-panel">
              <div className="panel-heading">
                <Zap size={18} />
                <h2>LIVE RUN</h2>
                <span>REC</span>
              </div>
              <div className="live-score">
                <small>SCORE</small>
                <strong>{String(live.score).padStart(6, "0")}</strong>
              </div>
              <div className="stat-grid compact">
                <div>
                  <Sparkles />
                  <span>SPARKS</span>
                  <b>{live.sparks}/80</b>
                </div>
                <div>
                  <Crosshair />
                  <span>CAPTURES</span>
                  <b>{live.captures}</b>
                </div>
                <div>
                  <Timer />
                  <span>TIME</span>
                  <b>{live.seconds}s</b>
                </div>
              </div>
            </section>

            {lastStats && (
              <section className="last-run-strip">
                <span>LAST RUN</span>
                <b>{lastScore.toLocaleString()}</b>
                <em>{lastScore >= WHITELIST_SCORE ? "QUALIFIED" : "TRY AGAIN"}</em>
              </section>
            )}
          </aside>
        </div>
      ) : (
        <section className="leaderboard-page">
          <div className="leaderboard-intro">
            <p className="panel-kicker">GLOBAL RANKING</p>
            <h1>HALL OF HUNTERS</h1>
            <p>
              Score at least <strong>{WHITELIST_SCORE.toLocaleString()} points</strong> in a
              single run to unlock whitelist access.
            </p>
          </div>
          <Leaderboard entries={entries} minimumScore={WHITELIST_SCORE} />
          <button className="play-cta" type="button" onClick={() => navigate("game")}>
            PLAY H00dle
          </button>
        </section>
      )}
    </main>
  );
}