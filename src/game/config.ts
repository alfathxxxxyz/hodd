import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import GameScene from "./scenes/GameScene";
import MenuScene from "./scenes/MenuScene";
import ResultScene from "./scenes/ResultScene";
import { level01 } from "./maps/level01";
import { TILE_SIZE } from "./systems/GridMovement";

export const gameWidth = level01.width * TILE_SIZE;
export const gameHeight = level01.height * TILE_SIZE;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: gameWidth,
    height: gameHeight,
    backgroundColor: "#050510",
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: gameWidth,
      height: gameHeight
    },
    scene: [BootScene, MenuScene, GameScene, ResultScene]
  };
}
