import {
  useState,
  type FormEvent,
  type ReactElement
} from "react";

import type { RunStats } from "../game/types";

const WHITELIST_SCORE = 10000;

interface ResultOverlayProps {
  stats: RunStats;
  score: number;
  onPlayAgain: () => void;
}

interface SubmitResponse {
  success?: boolean;
  qualified?: boolean;
  bestScore?: number;
  error?: string;
}

export function ResultOverlay({
  stats,
  score,
  onPlayAgain
}: ResultOverlayProps): ReactElement {
  const [walletAddress, setWalletAddress] =
    useState("");

  const [twitterHandle, setTwitterHandle] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [submitStatus, setSubmitStatus] =
    useState<
      "idle" | "success" | "error"
    >("idle");

  const [message, setMessage] =
    useState("");

  const qualified =
    score >= WHITELIST_SCORE;

  const submitWhitelist = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (
      !/^0x[a-fA-F0-9]{40}$/.test(
        walletAddress.trim()
      )
    ) {
      setSubmitStatus("error");
      setMessage(
        "ENTER A VALID EVM WALLET ADDRESS"
      );
      return;
    }

    setSubmitting(true);
    setSubmitStatus("idle");
    setMessage("");

    try {
      const response = await fetch(
        "/api/submit-run",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            runId: stats.runId,
            walletAddress:
              walletAddress.trim(),
            twitterHandle:
              twitterHandle.trim(),
            score,
            sparks:
              stats.sparksCollected,
            rareSparks:
              stats.rareSparksCollected,
            captures:
              stats.ghostsCaptured,
            damageTaken:
              stats.damageTaken,
            durationMs:
              stats.durationMs
          })
        }
      );

      const result =
        (await response.json()) as SubmitResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Submission failed"
        );
      }

      setSubmitStatus("success");
      setMessage(
        "WHITELIST ACCESS SECURED"
      );

      window.dispatchEvent(
        new Event(
          "ghostlist-leaderboard-refresh"
        )
      );
    } catch (error) {
      setSubmitStatus("error");

      setMessage(
        error instanceof Error
          ? error.message.toUpperCase()
          : "SUBMISSION FAILED"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="result-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Run result"
    >
      <p
        className={
          stats.completed
            ? "result-status sealed"
            : "result-status"
        }
      >
        {stats.completed
          ? "RUN SEALED"
          : "RUN ENDED"}
      </p>

      <strong className="result-score">
        {score.toLocaleString()}
      </strong>

      <div className="result-stats">
        <span>
          SPARKS{" "}
          <b>{stats.sparksCollected}</b>
        </span>

        <span>
          CAPTURED{" "}
          <b>{stats.ghostsCaptured}</b>
        </span>

        <span>
          TIME{" "}
          <b>
            {stats.remainingSeconds}s
          </b>
        </span>
      </div>

      {qualified &&
        submitStatus !== "success" && (
          <form
            className="whitelist-form"
            onSubmit={submitWhitelist}
          >
            <p className="whitelist-unlocked">
              WHITELIST UNLOCKED
            </p>

            <input
              type="text"
              value={walletAddress}
              onChange={(event) =>
                setWalletAddress(
                  event.target.value
                )
              }
              placeholder="0x WALLET ADDRESS"
              autoComplete="off"
              required
            />

            <input
              type="text"
              value={twitterHandle}
              onChange={(event) =>
                setTwitterHandle(
                  event.target.value
                )
              }
              placeholder="@X HANDLE"
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "SUBMITTING..."
                : "CLAIM WHITELIST"}
            </button>
          </form>
        )}

      {submitStatus !== "idle" && (
        <p
          className={`whitelist-message ${submitStatus}`}
        >
          {message}
        </p>
      )}

      {!qualified && (
        <p className="whitelist-locked">
          SCORE 10,000 TO UNLOCK
        </p>
      )}

      <button
        className="result-play-again"
        type="button"
        onClick={onPlayAgain}
      >
        PLAY AGAIN
      </button>
    </div>
  );
}
