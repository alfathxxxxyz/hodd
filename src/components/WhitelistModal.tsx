import type { ReactElement } from "react";

interface WhitelistModalProps {
  score: number;
  minimumScore: number;
  name: string;
  address: string;
  submitting: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onSubmit: () => void;
}

export function WhitelistModal({
  score,
  minimumScore,
  name,
  address,
  submitting,
  error,
  onNameChange,
  onAddressChange,
  onSubmit
}: WhitelistModalProps): ReactElement {
  return (
    <div className="whitelist-modal" role="dialog" aria-modal="true" aria-label="Whitelist submission">
      <div className="whitelist-panel">
        <p className="panel-kicker">WHITELIST UNLOCKED</p>
        <strong className="whitelist-score">{score.toLocaleString()}</strong>
        <p className="whitelist-copy">
          Minimum {minimumScore.toLocaleString()} reached. Lock in your hunter name and address.
        </p>
        <label className="whitelist-field">
          <span>USERNAME</span>
          <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="mint.hunter" autoComplete="off" />
        </label>
        <label className="whitelist-field">
          <span>ADDRESS</span>
          <input value={address} onChange={(event) => onAddressChange(event.target.value)} placeholder="0x..." autoComplete="off" />
        </label>
        {error && <p className="whitelist-error">{error}</p>}
        <button type="button" className="whitelist-submit" onClick={onSubmit} disabled={submitting}>
          {submitting ? "SAVING..." : "SUBMIT CLAIM"}
        </button>
      </div>
    </div>
  );
}
