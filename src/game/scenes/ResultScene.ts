import Phaser from "phaser";
import { gameHeight, gameWidth } from "../config";

export default class ResultScene extends Phaser.Scene {
  private readonly resetHandler = (): void => {
    this.scene.start("MenuScene");
  };
  public constructor() {
    super("ResultScene");
  }

  public create(): void {
    window.addEventListener("ghostlist-reset", this.resetHandler);
    this.add.rectangle(0, 0, gameWidth, gameHeight, 0x050510).setOrigin(0);
  }

  public shutdown(): void {
    window.removeEventListener("ghostlist-reset", this.resetHandler);
  }
}
