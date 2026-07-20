import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import {
  ArrowRight,
  Crosshair,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  Zap
} from "lucide-react";

import { GameCanvas } from "./components/GameCanvas";
import { Leaderboard } from "./components/Leaderboard";
import { MobileControls } from "./components/MobileControls";
import { ResultOverlay } from "./components/ResultOverlay";
import { StartOverlay } from "./components/StartOverlay";

import type {
  LeaderboardEntry,
  RunStats
} from "./game/types";

const WHITELIST_SCORE = 10000;
const LOGO_SRC = "/assets/logo.png";
const GHOST_SRC = "/assets/ghost.png";

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

type Page = "home" | "game" | "leaderboard";

function resolvePage(): Page {
  if (window.location.hash === "#game") {
    return "game";
  }

  if (window.location.hash === "#leaderboard") {
    return "leaderboard";
  }

  return "home";
}

export default function App(): ReactElement {
  const [page, setPage] = useState<Page>(resolvePage);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [live, setLive] =
    useState<LiveStats>(initialLiveStats);

  const [lastStats, setLastStats] =
    useState<RunStats | null>(null);

  const [lastScore, setLastScore] = useState(0);

  const [bestScore, setBestScore] = useState(() => {
    return (
      Number(
        window.localStorage.getItem(
          "h00dle-best-score"
        )
      ) || 0
    );
  });

  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    const onHashChange = (): void => {
      setPage(resolvePage());
    };

    const onLive = (event: Event): void => {
      const detail = (
        event as CustomEvent<LiveStats>
      ).detail;

      setLive(detail);
    };

    const onResult = (event: Event): void => {
      const detail = (
        event as CustomEvent<{
          stats: RunStats;
          score: number;
        }>
      ).detail;

      setLastStats(detail.stats);
      setLastScore(detail.score);

      setBestScore((current) => {
        const next = Math.max(
          current,
          detail.score
        );

        window.localStorage.setItem(
          "h00dle-best-score",
          String(next)
        );

        return next;
      });
    };

    window.addEventListener(
      "hashchange",
      onHashChange
    );

    window.addEventListener(
      "ghostlist-live",
      onLive
    );

    window.addEventListener(
      "ghostlist-result",
      onResult
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        onHashChange
      );

      window.removeEventListener(
        "ghostlist-live",
        onLive
      );

      window.removeEventListener(
        "ghostlist-result",
        onResult
      );
    };
  }, []);

  const navigate = (nextPage: Page): void => {
    if (nextPage === "home") {
      window.location.hash = "";
    } else {
      window.location.hash = nextPage;
    }

    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleReset = (): void => {
    setLive(initialLiveStats);
    setLastStats(null);
    setLastScore(0);
    setResetToken((value) => value + 1);

    window.dispatchEvent(
      new Event("ghostlist-reset")
    );
  };

  const progress = Math.min(
    100,
    Math.round(
      (live.score / WHITELIST_SCORE) * 100
    )
  );

  const remaining = Math.max(
    0,
    WHITELIST_SCORE - live.score
  );

  return (
    <main className="site-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => navigate("home")}
          aria-label="Open h00dle homepage"
        >
          <img
            className="brand-logo"
            src={LOGO_SRC}
            alt=""
            aria-hidden="true"
          />

          <span>h00dle</span>
        </button>

        <nav
          className="main-nav"
          aria-label="Main navigation"
        >
          <button
            className={
              page === "home" ? "active" : ""
            }
            type="button"
            onClick={() => navigate("home")}
          >
            Home
          </button>

          <button
            className={
              page === "game" ? "active" : ""
            }
            type="button"
            onClick={() => navigate("game")}
          >
            Game
          </button>

          <button
            className={
              page === "leaderboard"
                ? "active"
                : ""
            }
            type="button"
            onClick={() =>
              navigate("leaderboard")
            }
          >
            Leaderboard
          </button>
        </nav>

        <button
          className="topbar-play"
          type="button"
          onClick={() => navigate("game")}
        >
          PLAY NOW
        </button>
      </header>

      {page === "home" && (
        <LandingPage
          bestScore={bestScore}
          onPlay={() => navigate("game")}
          onLeaderboard={() =>
            navigate("leaderboard")
          }
        />
      )}

      {page === "game" && (
        <GamePage
          bestScore={bestScore}
          live={live}
          lastStats={lastStats}
          lastScore={lastScore}
          progress={progress}
          remaining={remaining}
          resetToken={resetToken}
          onReset={handleReset}
        />
      )}

      {page === "leaderboard" && (
        <LeaderboardPage
          entries={entries}
          onPlay={() => navigate("game")}
        />
      )}
    </main>
  );
}

interface LandingPageProps {
  bestScore: number;
  onPlay: () => void;
  onLeaderboard: () => void;
}

function LandingPage({
  bestScore,
  onPlay,
  onLeaderboard
}: LandingPageProps): ReactElement {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-grid-overlay" />

        <div className="hero-copy">

          <h1>
            HUNT THE
            <br />
            <span>H00D.</span>
          </h1>

          <p className="hero-description">
            Enter the maze, collect sparks,
            capture corrupted ghosts and escape
            before the clock hits zero.
          </p>

          <div className="hero-actions">
            <button
              className="hero-play-button"
              type="button"
              onClick={onPlay}
            >
              <span>PLAY h00dle</span>
              <ArrowRight aria-hidden="true" />
            </button>

            <button
              className="hero-secondary-button"
              type="button"
              onClick={onLeaderboard}
            >
              VIEW LEADERBOARD
            </button>
          </div>

          <div className="hero-status">
            <div>
              <small>MISSION</small>
              <strong>
                SCORE{" "}
                {WHITELIST_SCORE.toLocaleString()}
              </strong>
            </div>

            <div>
              <small>BEST SCORE</small>
              <strong>
                {bestScore
                  .toLocaleString()
                  .padStart(5, "0")}
              </strong>
            </div>

            <div>
              <small>TIME LIMIT</small>
              <strong>120 SEC</strong>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-machine">
            <div className="machine-top">
              <span>h00dle</span>`r`n            </div>

            <div className="machine-screen">
              <div className="screen-grid" />

              <p className="screen-score">
                SCORE 010000
              </p>

              <div className="ghost-stage">
                <div className="ghost-pulse ghost-pulse-one" />
                <div className="ghost-pulse ghost-pulse-two" />

                <img
                  src={GHOST_SRC}
                  alt="h00dle ghost"
                  className="hero-ghost"
                />

                <div className="ghost-target">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <p className="screen-message">
                TARGET DETECTED
              </p>
            </div>

            <div className="machine-controls">
              <div className="machine-stick">
                <i />
              </div>

              <div className="machine-buttons">
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="score-section">
        <div className="score-card">
          <div className="score-card-copy">
            <p className="panel-kicker">
              WHITELIST MISSION
            </p>

            <h2>
              ONE RUN.
              <br />
              <span>10,000 POINTS.</span>
            </h2>

            <p>
              Learn the maze, collect every spark,
              build capture combos and prove that
              you belong among the top hunters.
            </p>

            <button
              type="button"
              onClick={onPlay}
              className="score-cta"
            >
              START MISSION
              <ArrowRight aria-hidden="true" />
            </button>
          </div>

          <div className="score-terminal">
            <div className="terminal-header">
              <span>MISSION_STATUS.EXE</span>
              <i>LIVE</i>
            </div>

            <div className="terminal-target">
              <small>TARGET SCORE</small>
              <strong>010000</strong>
            </div>

            <div className="terminal-row">
              <span>TIME LIMIT</span>
              <b>120 SEC</b>
            </div>

            <div className="terminal-row">
              <span>STARTING LIVES</span>
              <b>05</b>
            </div>

            <div className="terminal-row">
              <span>SPARK REQUIREMENT</span>
              <b>80</b>
            </div>

            <div className="terminal-progress">
              <i />
            </div>

            <p>
              &gt; WAITING FOR HUNTER...
            </p>
          </div>
        </div>
      </section>

      <section className="landing-final">
        <img
          src={LOGO_SRC}
          alt=""
          aria-hidden="true"
        />

        <p>THE MAZE IS WAITING.</p>

        <h2>READY TO HUNT?</h2>

        <button
          type="button"
          onClick={onPlay}
        >
          ENTER h00dle
        </button>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand">
          <img
            src={LOGO_SRC}
            alt=""
            aria-hidden="true"
          />

          <span>h00dle</span>
        </div>

        <p>
          ARCADE HUNTING PROTOCOL // 2026
        </p>

        <button
          type="button"
          onClick={onLeaderboard}
        >
          LEADERBOARD
        </button>
      </footer>
    </div>
  );
}

interface GamePageProps {
  bestScore: number;
  live: LiveStats;
  lastStats: RunStats | null;
  lastScore: number;
  progress: number;
  remaining: number;
  resetToken: number;
  onReset: () => void;
}

function GamePage({
  bestScore,
  live,
  lastStats,
  lastScore,
  progress,
  remaining,
  resetToken,
  onReset
}: GamePageProps): ReactElement {
  return (
    <div className="game-page">
      <section
        className="cabinet"
        aria-label="h00dle arcade game"
      >
        <div className="cabinet-marquee">
          <span>
            HI-SCORE{" "}
            <b>{bestScore.toLocaleString()}</b>
          </span>

          <div
            className="life-bar"
            aria-label={`${live.lives} lives remaining`}
          >
            {Array.from(
              { length: 5 },
              (_, index) => (
                <i
                  className={
                    index < live.lives
                      ? "pixel-heart"
                      : "pixel-heart empty"
                  }
                  key={index}
                />
              )
            )}
          </div>
        </div>

        <div className="screen-bezel">
          <GameCanvas />
          <StartOverlay key={resetToken} />

          {lastStats && (
            <ResultOverlay
              stats={lastStats}
              score={lastScore}
              onPlayAgain={onReset}
            />
          )}

          <div className="screen-glare" />
        </div>

        <MobileControls />
      </section>

      <aside className="stats-sidebar">
        <button
          className="reset-button"
          type="button"
          onClick={onReset}
          aria-label="Reset run"
          title="Reset run"
        >
          <RotateCcw aria-hidden="true" />
        </button>

        <section className="pixel-panel mission-panel">
          <p className="panel-kicker">
            WHITELIST MISSION
          </p>

          <div className="target-score">
            <span>MINIMUM SCORE</span>

            <strong>
              {WHITELIST_SCORE.toLocaleString()}
            </strong>
          </div>

          <div className="progress-label">
            <span>RUN PROGRESS</span>
            <b>{progress}%</b>
          </div>

          <div className="pixel-progress">
            <i
              style={{
                width: `${progress}%`
              }}
            />
          </div>

          <p
            className={
              remaining === 0
                ? "qualified status-copy"
                : "status-copy"
            }
          >
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

            <strong>
              {String(live.score).padStart(
                6,
                "0"
              )}
            </strong>
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

            <em>
              {lastScore >= WHITELIST_SCORE
                ? "QUALIFIED"
                : "TRY AGAIN"}
            </em>
          </section>
        )}
      </aside>
    </div>
  );
}

interface LeaderboardPageProps {
  entries: LeaderboardEntry[];
  onPlay: () => void;
}

function LeaderboardPage({
  entries,
  onPlay
}: LeaderboardPageProps): ReactElement {
  return (
    <section className="leaderboard-page">
      <div className="leaderboard-intro">
        <p className="panel-kicker">
          GLOBAL RANKING
        </p>

        <h1>HALL OF HUNTERS</h1>

        <p>
          Score at least{" "}
          <strong>
            {WHITELIST_SCORE.toLocaleString()}{" "}
            points
          </strong>{" "}
          in a single run to complete the mission.
        </p>
      </div>

      <Leaderboard
        entries={entries}
        minimumScore={WHITELIST_SCORE}
      />

      <button
        className="play-cta"
        type="button"
        onClick={onPlay}
      >
        <Trophy aria-hidden="true" />
        PLAY h00dle
      </button>
    </section>
  );
}



