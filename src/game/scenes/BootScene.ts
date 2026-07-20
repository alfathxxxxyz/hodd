import Phaser from "phaser";
import { level01 } from "../maps/level01";

export default class BootScene extends Phaser.Scene {
  public constructor() {
    super("BootScene");
  }

  public preload(): void {
    this.load.image("ghost-model", "/assets/ghost.png");
  }

  public create(): void {
    this.registry.set("level", level01);
    this.scene.start("MenuScene");
  }
}