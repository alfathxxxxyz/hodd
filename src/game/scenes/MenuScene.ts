import Phaser from "phaser";
import { gameHeight, gameWidth } from "../config";

export default class MenuScene extends Phaser.Scene {
  private readonly overlayStartHandler = (): void => {
    this.scene.start("GameScene");
  };
  private readonly resetHandler = (): void => {
    this.scene.start("MenuScene");
  };

  public constructor() {
    super("MenuScene");
  }

  public create(): void {
    window.addEventListener("ghostlist-start", this.overlayStartHandler);
    window.addEventListener("ghostlist-reset", this.resetHandler);
    this.add.rectangle(0, 0, gameWidth, gameHeight, 0x050510).setOrigin(0);
    this.add.text(gameWidth / 2, 100, "H00dle", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "28px",
      color: "#d6fe50",
      stroke: "#20242a",
      strokeThickness: 2
    }).setOrigin(0.5);
    this.add.text(gameWidth / 2, 158, "Hunt drifters. Charge the Mint Gate.", {
      fontFamily: "'VT323', monospace",
      fontSize: "24px",
      color: "#c7d2ff",
      align: "center"
    }).setOrigin(0.5);
    const button = this.add.rectangle(gameWidth / 2, 252, 170, 44, 0xd6fe50).setStrokeStyle(3, 0x050510);
    const label = this.add.text(gameWidth / 2, 252, "START RUN", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "16px",
      color: "#050510"
    }).setOrigin(0.5);
    button.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.scene.start("GameScene"));
    label.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.scene.start("GameScene"));
    this.add.text(gameWidth / 2, 330, "Catch ghosts, open the gate, and claim the whitelist.", {
      fontFamily: "'VT323', monospace",
      fontSize: "18px",
      color: "#f7f7ff",
      align: "center",
      wordWrap: { width: gameWidth - 50 }
    }).setOrigin(0.5);
  }

  public shutdown(): void {
    window.removeEventListener("ghostlist-start", this.overlayStartHandler);
    window.removeEventListener("ghostlist-reset", this.resetHandler);
  }
}
