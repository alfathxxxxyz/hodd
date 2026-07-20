import { useState } from "react";
import type { ReactElement } from "react";

export function StartOverlay(): ReactElement | null {
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState("ARE YOU READY?");

  if (!visible) return null;

  const start = (): void => {
    setVisible(false);
    window.dispatchEvent(new Event("ghostlist-start"));
  };

  return (
    <div className="start-overlay" role="dialog" aria-modal="true" aria-label="Start H00dle">
      <div className="overlay-center">
        <h1>START</h1>
        <p>{message}</p>
        <div className="overlay-actions">
          <button className="overlay-yes" type="button" onClick={start}>
            YES <span>&lt;</span>
          </button>
          <button className="overlay-no" type="button" onClick={() => setMessage("COME BACK WHEN READY")}>
            NO
          </button>
        </div>
      </div>
    </div>
  );
}
