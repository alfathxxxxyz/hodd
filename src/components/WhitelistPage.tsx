import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";

type MissionStatus = "open" | "locked";
type WhitelistPhase = "door" | "loading" | "ready";

const missionProgressStorageKey = "h00dle-whitelist-mission-progress";
const whitelistEntryStorageKey = "h00dle-whitelist-entry";
const postTweetId = "2079608701280038945";
const likeMissionHref = `https://twitter.com/intent/like?tweet_id=${postTweetId}`;
const replyMissionHref = `https://twitter.com/intent/tweet?in_reply_to=${postTweetId}`;
const repostMissionHref = `https://twitter.com/intent/retweet?tweet_id=${postTweetId}`;

interface WhitelistMission {
  id: string;
  number: string;
  title: string;
  description: string;
  status: MissionStatus;
  href?: string;
}

interface WhitelistPageProps {
  logoSrc: string;
  ghostSrc: string;
}

const missions: WhitelistMission[] = [
  {
    id: "follow-twitter",
    number: "01",
    title: "FOLLOW @H00DLE",
    description: "Join the community",
    status: "open",
    href: "https://x.com/h00dle_"
  },
  {
    id: "like-post",
    number: "02",
    title: "LIKE THE POST",
    description: "Show h00dle some love",
    status: "open",
    href: likeMissionHref
  },
  {
    id: "reply-post",
    number: "03",
    title: "REPLY TO THE POST",
    description: "Leave your h00dle reply",
    status: "open",
    href: replyMissionHref
  },
  {
    id: "repost-post",
    number: "04",
    title: "REPOST THE POST",
    description: "Spread the signal",
    status: "open",
    href: repostMissionHref
  }
];

export function WhitelistPage({
  logoSrc,
  ghostSrc
}: WhitelistPageProps): ReactElement {
  const [phase, setPhase] = useState<WhitelistPhase>("door");
  const [twitterUsername, setTwitterUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [entrySubmitted, setEntrySubmitted] = useState(() => {
    return window.localStorage.getItem(whitelistEntryStorageKey) !== null;
  });
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [completedMissionIds, setCompletedMissionIds] =
    useState<Set<string>>(() => {
      const saved = window.localStorage.getItem(missionProgressStorageKey);
      if (!saved) return new Set<string>();

      try {
        return new Set<string>(JSON.parse(saved) as string[]);
      } catch {
        return new Set<string>();
      }
    });

  useEffect(() => {
    if (phase !== "loading") return undefined;

    const timer = window.setTimeout(() => {
      setPhase("ready");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [phase]);

  function markMissionDone(missionId: string): void {
    setCompletedMissionIds((current) => {
      const next = new Set(current);
      next.add(missionId);
      window.localStorage.setItem(
        missionProgressStorageKey,
        JSON.stringify([...next])
      );
      return next;
    });
  }

  async function submitWhitelistEntry(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (!twitterUsername.trim() || !walletAddress.trim()) return;

    setSubmittingEntry(true);
    setEntryError("");

    try {
      const response = await fetch("/api/submit-whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          twitterUsername: twitterUsername.trim(),
          walletAddress: walletAddress.trim(),
          completedMissions: [...completedMissionIds]
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Failed to submit entry"
        );
      }

      window.localStorage.setItem(
        whitelistEntryStorageKey,
        JSON.stringify({
          twitterUsername: twitterUsername.trim(),
          walletAddress: walletAddress.trim(),
          submittedAt: new Date().toISOString()
        })
      );
      setEntrySubmitted(true);
    } catch (error) {
      setEntryError(
        error instanceof Error
          ? error.message
          : "Failed to submit entry"
      );
    } finally {
      setSubmittingEntry(false);
    }
  }

  const allMissionsDone = missions.every((mission) =>
    completedMissionIds.has(mission.id)
  );

  if (phase === "door") {
    return (
      <main className="whitelist-door" aria-label="h00dle whitelist entry">
        <button
          className="whitelist-door-button"
          type="button"
          onClick={() => setPhase("loading")}
          aria-label="Open h00dle whitelist missions"
        >
          <img src={ghostSrc} alt="" aria-hidden="true" />
        </button>

        <a
          className="whitelist-twitter-link"
          href="https://x.com/h00dle_"
          target="_blank"
          rel="noreferrer"
        >
          TWITTER
        </a>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main
        className="whitelist-loader"
        aria-label="h00dle whitelist loading"
      >
        <section className="whitelist-loader-scene" aria-hidden="true">
          <img
            className="whitelist-loader-center-ghost"
            src={ghostSrc}
            alt=""
          />

          <div className="whitelist-chase-track">
            <div className="whitelist-track-grid" />
          <div className="whitelist-hunter-sprite">
            <span className="hunter-pixel shadow" />
            <span className="hunter-pixel boot left" />
            <span className="hunter-pixel boot right" />
            <span className="hunter-pixel body" />
            <span className="hunter-pixel coat" />
            <span className="hunter-pixel face" />
            <span className="hunter-pixel eye" />
            <span className="hunter-pixel hat" />
            <span className="hunter-pixel hat-band" />
            <span className="hunter-pixel brim" />
            <span className="hunter-pixel lamp" />
            <span className="hunter-pixel handle" />
            <span className="hunter-pixel net" />
          </div>
          <img
            className="whitelist-load-ghost"
            src={ghostSrc}
            alt=""
          />
          </div>
        </section>

        <p className="whitelist-loader-copy">
          HUNTER IS CLOSING IN
        </p>
      </main>
    );
  }

  return (
    <main className="whitelist-world" aria-label="h00dle whitelist missions">
      <header className="whitelist-brand">
        <img src={logoSrc} alt="" aria-hidden="true" />
        <span>h00dle</span>
      </header>

      <section className="whitelist-stage">
        <div className="whitelist-mascot-wrap">
          <img
            className="whitelist-mascot"
            src={ghostSrc}
            alt="h00dle mascot"
          />
        </div>

        <section className="whitelist-mission-card" aria-label="Mission list">
          <h1>{allMissionsDone ? "Final step" : "Join h00dle"}</h1>
          <p>
            {allMissionsDone
              ? "Add your X username and wallet to join the whitelist."
              : "Complete four X missions in order to claim your whitelist spot."}
          </p>

          {allMissionsDone ? (
            <form
              className="whitelist-final-form"
              onSubmit={submitWhitelistEntry}
            >
              <label className="whitelist-field">
                <span>TWITTER USERNAME</span>
                <input
                  value={twitterUsername}
                  onChange={(event) => setTwitterUsername(event.target.value)}
                  placeholder="@username"
                  autoComplete="off"
                />
              </label>

              <label className="whitelist-field">
                <span>WALLET ADDRESS</span>
                <input
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                  placeholder="0x..."
                  autoComplete="off"
                />
              </label>

              <small className="whitelist-form-note">
                No wallet connection required. Your address is saved directly.
              </small>

              {entryError && (
                <p className="whitelist-form-error">
                  {entryError}
                </p>
              )}

              <button
                className="whitelist-submit"
                disabled={
                  entrySubmitted ||
                  submittingEntry ||
                  !twitterUsername.trim() ||
                  !walletAddress.trim()
                }
                type="submit"
              >
                {entrySubmitted
                  ? "ENTRY SAVED"
                  : submittingEntry
                    ? "SAVING..."
                    : "SUBMIT ENTRY"}
                <span aria-hidden="true">/</span>
              </button>
            </form>
          ) : (
            <div className="whitelist-task-list">
              {missions.map((mission) => (
                <MissionItem
                  completed={completedMissionIds.has(mission.id)}
                  mission={mission}
                  key={mission.id}
                  onOpenMission={markMissionDone}
                />
              ))}
            </div>
          )}
        </section>
      </section>

      <a
        className="whitelist-twitter-link on-green"
        href="https://x.com/h00dle_"
        target="_blank"
        rel="noreferrer"
      >
        TWITTER
      </a>
    </main>
  );
}

function MissionItem({
  completed,
  mission,
  onOpenMission
}: {
  completed: boolean;
  mission: WhitelistMission;
  onOpenMission: (missionId: string) => void;
}): ReactElement {
  const displayStatus = completed ? "done" : mission.status;
  const content = (
    <>
      <span className="whitelist-task-number">{mission.number}</span>
      <span className="whitelist-task-copy">
        <strong>{mission.title}</strong>
        <small>{mission.description}</small>
      </span>
      <span className={`whitelist-task-status ${displayStatus}`}>
        {completed ? "DONE" : mission.status === "open" ? "OPEN /" : "LOCKED"}
      </span>
    </>
  );

  if (mission.status === "open" && mission.href) {
    return (
      <a
        className={`whitelist-task ${completed ? "done" : "open"}`}
        href={mission.href}
        onClick={() => onOpenMission(mission.id)}
        target="_blank"
        rel="noreferrer"
        data-mission-id={mission.id}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className="whitelist-task locked"
      data-mission-id={mission.id}
      aria-disabled="true"
    >
      {content}
    </div>
  );
}
