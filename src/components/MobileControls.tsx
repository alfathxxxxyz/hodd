import type { ReactElement } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { Direction } from "../game/types";

function send(direction: Direction): void {
  window.dispatchEvent(new CustomEvent("ghostlist-direction", { detail: { direction } }));
}

export function MobileControls(): ReactElement {
  return (
    <div className="mobile-controls" aria-label="Mobile direction controls">
      <button aria-label="Move up" className="dpad up" onPointerDown={() => send(Direction.Up)}>
        <ArrowUp size={24} />
      </button>
      <button aria-label="Move left" className="dpad left" onPointerDown={() => send(Direction.Left)}>
        <ArrowLeft size={24} />
      </button>
      <button aria-label="Move right" className="dpad right" onPointerDown={() => send(Direction.Right)}>
        <ArrowRight size={24} />
      </button>
      <button aria-label="Move down" className="dpad down" onPointerDown={() => send(Direction.Down)}>
        <ArrowDown size={24} />
      </button>
    </div>
  );
}
