import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Hunter } from "../entities/Hunter";
import { gameHeight, gameWidth } from "../config";
import { level01 } from "../maps/level01";
import { Direction, GhostKind, GhostState, GridPoint, RunStats, TileType } from "../types";
import { ScoreSystem } from "../systems/ScoreSystem";
import { RunRecorder } from "../systems/RunRecorder";
import { SeededRandom } from "../systems/SeededRandom";
import { TILE_SIZE, pixelToGrid, tileCenter } from "../systems/GridMovement";

interface Collectible {
  kind: TileType.Spark | TileType.RareSpark | TileType.SoulFlare;
  point: GridPoint;
  sprite: Phaser.GameObjects.GameObject;
}

function pointKey(point: GridPoint): string {
  return `${point.col},${point.row}`;
}

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private hunters: Hunter[] = [];
  private collectibles = new Map<string, Collectible>();
  private portal!: Phaser.GameObjects.Container;
  private portalOpen = false;
  private recorder!: RunRecorder;
  private score = 0;
  private sparksCollected = 0;
  private rareSparksCollected = 0;
  private ghostsCaptured = 0;
  private captureScore = 0;
  private captureCombo = 0;
  private damageTaken = 0;
  private remainingSeconds = 120;
  private countdown = 3;
  private countdownText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private state: "countdown" | "playing" | "respawning" | "ended" = "countdown";
  private flareUntil = 0;
  private startedAt = 0;
  private lastLiveSignature = "";
  private readonly inputHandler = (event: Event): void => {
    const detail = (event as CustomEvent<{ direction: Direction }>).detail;
    this.player?.setRequestedDirection(detail.direction);
  };
  private readonly resetHandler = (): void => {
    this.scene.start("MenuScene");
  };

  public constructor() {
    super("GameScene");
  }

  public create(): void {
    this.recorder = new RunRecorder(`run-${Date.now()}`);
    this.hunters = [];
    this.collectibles.clear();
    this.portalOpen = false;
    this.score = 0;
    this.sparksCollected = 0;
    this.rareSparksCollected = 0;
    this.ghostsCaptured = 0;
    this.captureScore = 0;
    this.captureCombo = 0;
    this.damageTaken = 0;
    this.remainingSeconds = 120;
    this.countdown = 3;
    this.state = "countdown";
    this.flareUntil = 0;
    this.startedAt = 0;
    this.lastLiveSignature = "";

    this.drawBoard();
    const playerSpawn = this.findTiles(TileType.PlayerSpawn)[0] ?? { col: 1, row: 1 };
    this.player = new Player(this, playerSpawn, level01);
    this.spawnHunters();
    this.spawnCollectibles();
    this.createHud();
    this.configureControls();
    window.addEventListener("ghostlist-direction", this.inputHandler);
    window.addEventListener("ghostlist-reset", this.resetHandler);

    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdown -= 1;
        this.countdownText.setText(this.countdown > 0 ? String(this.countdown) : "GO");
        if (this.countdown === 0) {
          this.time.delayedCall(450, () => {
            this.state = "playing";
            this.startedAt = performance.now();
            this.countdownText.setVisible(false);
          });
        }
      }
    });
  }

  public update(time: number, delta: number): void {
    if (this.state === "ended") return;
    this.animatePortal(time);
    if (this.state !== "playing") return;

    this.remainingSeconds = Math.max(0, 120 - Math.floor((performance.now() - this.startedAt) / 1000));
    if (this.remainingSeconds <= 0) {
      this.finish(false);
      return;
    }

    this.player.update(delta, time);
    const speedBoost = Math.min(16, (120 - this.remainingSeconds) * 0.04);
    for (const hunter of this.hunters) {
      hunter.update(delta, time, this.player.gridPosition, this.player.currentDirection, this.portalOpen, speedBoost);
    }

    if (this.flareUntil > 0 && time >= this.flareUntil) {
      this.flareUntil = 0;
      this.captureCombo = 0;
      for (const hunter of this.hunters) {
        if (hunter.state === GhostState.Frightened) hunter.returnHome();
      }
    }

    this.collectCurrentTile();
    this.handleHunterCollisions(time);
    this.handlePortal();
    this.updateHud();
  }

  public shutdown(): void {
    window.removeEventListener("ghostlist-direction", this.inputHandler);
    window.removeEventListener("ghostlist-reset", this.resetHandler);
  }

  private drawBoard(): void {
    this.add.rectangle(0, 0, gameWidth, gameHeight, level01.theme.floor).setOrigin(0);
    for (let row = 0; row < level01.height; row += 1) {
      for (let col = 0; col < level01.width; col += 1) {
        const tile = level01.rows[row][col] as TileType;
        if (tile === TileType.Wall) {
          const x = col * TILE_SIZE;
          const y = row * TILE_SIZE;
          this.add.rectangle(x + 12, y + 12, 22, 22, level01.theme.wall).setStrokeStyle(2, level01.theme.wallGlow);
          if ((row * 3 + col) % 5 === 0) {
            this.add.rectangle(x + 6, y + 6, 4, 4, level01.theme.wallGlow, 0.38);
          }
        }
      }
    }
  }

  private spawnCollectibles(): void {
    const sparkPoints: GridPoint[] = [];
    for (let row = 0; row < level01.height; row += 1) {
      for (let col = 0; col < level01.width; col += 1) {
        const tile = level01.rows[row][col] as TileType;
        if (tile === TileType.Spark) sparkPoints.push({ col, row });
        if (tile === TileType.RareSpark || tile === TileType.SoulFlare) this.addCollectible(tile, { col, row });
      }
    }
    const random = new SeededRandom(43110);
    const rareIndexes = new Set<number>();
    while (rareIndexes.size < 6 && rareIndexes.size < sparkPoints.length) {
      rareIndexes.add(Math.floor(random.next() * sparkPoints.length));
    }
    sparkPoints.forEach((point, index) => {
      this.addCollectible(rareIndexes.has(index) ? TileType.RareSpark : TileType.Spark, point);
    });
  }

  private addCollectible(kind: Collectible["kind"], point: GridPoint): void {
    const center = tileCenter(point);
    const sprite =
      kind === TileType.SoulFlare
        ? this.add.circle(center.x, center.y, 7, level01.theme.flare).setStrokeStyle(2, 0xffffff)
        : this.add.rectangle(center.x, center.y, kind === TileType.RareSpark ? 8 : 4, kind === TileType.RareSpark ? 8 : 4, kind === TileType.RareSpark ? level01.theme.rareSpark : level01.theme.spark);
    if (kind !== TileType.Spark) {
      this.tweens.add({ targets: sprite, scale: kind === TileType.SoulFlare ? 1.28 : 1.15, duration: 420, yoyo: true, repeat: -1, ease: "Stepped" });
    }
    this.collectibles.set(pointKey(point), { kind, point, sprite });
  }

  private spawnHunters(): void {
    const spawns = this.findTiles(TileType.GhostSpawn);
    const portal = this.findTiles(TileType.Portal)[0] ?? { col: 9, row: 11 };
    this.createPortal(portal);
    const specs: Array<{ kind: GhostKind; delay: number; target: GridPoint }> = [
      { kind: GhostKind.Chaser, delay: 500, target: { col: 1, row: 1 } },
      { kind: GhostKind.Ambusher, delay: 1500, target: { col: 17, row: 1 } },
      { kind: GhostKind.Warden, delay: 2500, target: portal },
      { kind: GhostKind.Drifter, delay: 3500, target: { col: 9, row: 21 } }
    ];
    specs.forEach((spec, index) => {
      const spawn = spawns[index % spawns.length] ?? portal;
      this.hunters.push(new Hunter(this, spec.kind, spawn, spec.target, level01, spec.delay));
    });
  }

  private createPortal(point: GridPoint): void {
    const center = tileCenter(point);
    const ring = this.add.circle(0, 0, 11, level01.theme.portal, 0.15).setStrokeStyle(3, 0x144c33);
    const core = this.add.rectangle(0, 0, 9, 14, 0x0d1617).setStrokeStyle(1, 0x38ff9c);
    this.portal = this.add.container(center.x, center.y, [ring, core]).setDepth(8);
  }

  private createHud(): void {
    this.messageText = this.add.text(gameWidth / 2, 48, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#d6fe50",
      stroke: "#050510",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(50);
    this.countdownText = this.add.text(gameWidth / 2, gameHeight / 2, "3", {
      fontFamily: "monospace",
      fontSize: "46px",
      color: "#d6fe50",
      stroke: "#050510",
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(60);
    this.updateHud();
  }

  private configureControls(): void {
    const keyboard = this.input.keyboard;
    keyboard?.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT");
    keyboard?.on("keydown", (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true;

      if (isTyping) {
        return;
      }

      const direction = this.directionFromKey(event.key);

      if (direction !== Direction.None) {
        event.preventDefault();
        this.player.setRequestedDirection(direction);
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      const dx = pointer.upX - pointer.downX;
      const dy = pointer.upY - pointer.downY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      this.player.setRequestedDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? Direction.Right : Direction.Left) : dy > 0 ? Direction.Down : Direction.Up);
    });
  }

  private directionFromKey(key: string): Direction {
    const normalized = key.toLowerCase();
    if (normalized === "arrowup" || normalized === "w") return Direction.Up;
    if (normalized === "arrowdown" || normalized === "s") return Direction.Down;
    if (normalized === "arrowleft" || normalized === "a") return Direction.Left;
    if (normalized === "arrowright" || normalized === "d") return Direction.Right;
    return Direction.None;
  }

  private collectCurrentTile(): void {
    const collectible = this.collectibles.get(pointKey(this.player.gridPosition));
    if (!collectible) return;
    collectible.sprite.destroy();
    this.collectibles.delete(pointKey(collectible.point));

    if (collectible.kind === TileType.Spark) {
      this.score += 25;
      this.sparksCollected += 1;
      this.recorder.record("spark", 25);
    }
    if (collectible.kind === TileType.RareSpark) {
      this.score += 100;
      this.rareSparksCollected += 1;
      this.recorder.record("rareSpark", 100);
      this.cameras.main.flash(55, 77, 238, 234, false);
    }
    if (collectible.kind === TileType.SoulFlare) {
      this.activateFlare();
    }

    if (!this.portalOpen && this.sparksCollected + this.rareSparksCollected >= 80) {
      this.portalOpen = true;
      this.score += 1200;
      this.recorder.record("portalOpen", 1200);
      this.flashMessage("MINT GATE OPEN");
    }
  }

  private activateFlare(): void {
    this.flareUntil = this.time.now + 7000;
    this.captureCombo = 0;
    this.recorder.record("flare");
    this.flashMessage("HUNT MODE");
    this.cameras.main.flash(110, 255, 79, 135, false);
    this.cameras.main.shake(90, 0.004);
    for (const hunter of this.hunters) hunter.frighten();
  }

  private handleHunterCollisions(now: number): void {
    for (const hunter of this.hunters) {
      const distance = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, hunter.sprite.x, hunter.sprite.y);
      if (distance > 14 || hunter.state === GhostState.Returning || hunter.state === GhostState.Stunned) continue;
      if (hunter.state === GhostState.Frightened) {
        const comboValues = [350, 700, 1400, 2400];
        const value = comboValues[Math.min(this.captureCombo, comboValues.length - 1)];
        this.captureCombo += 1;
        this.ghostsCaptured += 1;
        this.captureScore += value;
        this.score += value;
        const burstX = hunter.sprite.x;
        const burstY = hunter.sprite.y;
        hunter.capture(now);
        this.recorder.record("capture", value);
        this.showScoreBurst(burstX, burstY, value);
        this.cameras.main.shake(100, 0.007);
        this.flashMessage(`SEAL +${value}`);
        continue;
      }
      if (now >= this.player.invulnerableUntil) this.loseLife(now);
    }
  }

  private loseLife(now: number): void {
    this.player.lives -= 1;
    this.damageTaken += 1;
    this.recorder.record("damage");
    this.cameras.main.shake(180, 0.013);
    this.cameras.main.flash(90, 255, 49, 86, false);
    if (this.player.lives <= 0) {
      this.finish(false);
      return;
    }
    this.state = "respawning";
    this.flashMessage("CHARM BROKEN");
    this.time.delayedCall(700, () => {
      this.player.reset(now);
      for (const hunter of this.hunters) hunter.reset();
      this.state = "playing";
    });
  }

  private handlePortal(): void {
    if (!this.portalOpen) return;
    const portalGrid = pixelToGrid(this.portal.x, this.portal.y);
    if (portalGrid.col === this.player.gridPosition.col && portalGrid.row === this.player.gridPosition.row) {
      this.finish(true);
    }
  }

  private finish(completed: boolean): void {
    this.state = "ended";
    if (completed) {
      this.score += 1600 + this.player.lives * 350 + this.remainingSeconds * 18 + (this.damageTaken === 0 ? 1200 : 0);
      this.recorder.record("completed");
    } else {
      this.recorder.record("failed");
    }
    const stats = this.recorder.stats({
      sparksCollected: this.sparksCollected,
      rareSparksCollected: this.rareSparksCollected,
      ghostsCaptured: this.ghostsCaptured,
      captureScore: this.captureScore,
      damageTaken: this.damageTaken,
      remainingLives: this.player.lives,
      remainingSeconds: this.remainingSeconds,
      completed
    });
    const breakdown = ScoreSystem.calculate(stats);
    window.dispatchEvent(new CustomEvent<{ stats: RunStats; score: number }>("ghostlist-result", { detail: { stats, score: breakdown.finalScore } }));
    this.registry.set("lastStats", stats);
    this.registry.set("lastScore", breakdown.finalScore);
    this.scene.start("ResultScene");
  }

  private animatePortal(time: number): void {
    this.portal.setScale(this.portalOpen ? 1 + Math.sin(time / 140) * 0.08 : 0.9);
    this.portal.alpha = this.portalOpen ? 1 : 0.45;
  }

  private updateHud(): void {
    const flare = this.flareUntil > 0 ? Math.ceil((this.flareUntil - this.time.now) / 1000) : 0;
    const live = {
      score: this.score,
      sparks: this.sparksCollected + this.rareSparksCollected,
      captures: this.ghostsCaptured,
      lives: this.player?.lives ?? 3,
      seconds: this.remainingSeconds,
      flare: Math.max(0, flare)
    };
    const signature = Object.values(live).join(":");
    if (signature !== this.lastLiveSignature) {
      this.lastLiveSignature = signature;
      window.dispatchEvent(new CustomEvent("ghostlist-live", { detail: live }));
    }
  }

  private flashMessage(message: string): void {
    this.messageText.setText(message).setAlpha(1);
    this.tweens.add({ targets: this.messageText, alpha: 0, delay: 850, duration: 350 });
  }

  private showScoreBurst(x: number, y: number, value: number): void {
    const burst = this.add.text(x, y - 10, `+${value}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9px",
      color: "#d6fe50",
      stroke: "#050708",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(70);
    this.tweens.add({
      targets: burst,
      y: y - 30,
      alpha: 0,
      duration: 620,
      ease: "Stepped",
      onComplete: () => burst.destroy()
    });
  }

  private findTiles(tile: TileType): GridPoint[] {
    const points: GridPoint[] = [];
    for (let row = 0; row < level01.height; row += 1) {
      for (let col = 0; col < level01.width; col += 1) {
        if ((level01.rows[row][col] as TileType) === tile) points.push({ col, row });
      }
    }
    return points;
  }
}
