import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import Phaser from "phaser";
import { createGameConfig } from "../game/config";

export function GameCanvas(): ReactElement {
  const holderId = "ghostlist-phaser";
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) gameRef.current = new Phaser.Game(createGameConfig(holderId));
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id={holderId} className="game-canvas" aria-label="H00dle arcade game canvas" />;
}
