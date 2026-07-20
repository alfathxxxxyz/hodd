import Phaser from "phaser";
import { HunterAI } from "../systems/HunterAI";
import {
  directionVectors,
  isNearTileCenter,
  pixelToGrid,
  snapToTileAxis,
  tileCenter,
  TILE_SIZE,
  wrapColumn
} from "../systems/GridMovement";
import { Direction, GhostKind, GhostState, GridPoint, LevelData } from "../types";

const ghostColors: Record<GhostKind, number> = {
  [GhostKind.Chaser]: 0xff3156,
  [GhostKind.Ambusher]: 0x2bd9ff,
  [GhostKind.Warden]: 0xffb000,
  [GhostKind.Drifter]: 0x6eff78
};

export class Hunter {
  public readonly sprite: Phaser.GameObjects.Container;
  public gridPosition: GridPoint;
  public direction = Direction.Left;
  public state = GhostState.Patrol;
  public active = false;
  private readonly body: Phaser.GameObjects.Rectangle;
  private recalcAt = 0;
  private stunnedUntil = 0;

  public constructor(
    scene: Phaser.Scene,
    public readonly kind: GhostKind,
    public readonly spawn: GridPoint,
    public readonly patrolTarget: GridPoint,
    private readonly level: LevelData,
    spawnDelayMs: number
  ) {
    const center = tileCenter(spawn);
    this.gridPosition = { ...spawn };
    const color = ghostColors[kind];
    const crown = scene.add.rectangle(0, -7, 10, 3, color);
    const templeA = scene.add.rectangle(-6, -4, 3, 7, color);
    const templeB = scene.add.rectangle(6, -4, 3, 7, color);
    this.body = scene.add.rectangle(0, 1, 15, 13, color);
    const footA = scene.add.rectangle(-5, 8, 5, 4, color);
    const footB = scene.add.rectangle(1, 8, 4, 4, color);
    const footC = scene.add.rectangle(6, 8, 3, 4, color);
    const eyeWhiteA = scene.add.rectangle(-4, -2, 4, 5, 0xf3f7df);
    const eyeWhiteB = scene.add.rectangle(4, -2, 4, 5, 0xf3f7df);
    const eyeA = scene.add.rectangle(-3, -1, 2, 3, 0x050708);
    const eyeB = scene.add.rectangle(5, -1, 2, 3, 0x050708);
    const accessory = scene.add.rectangle(0, -11, 12, 3, kind === GhostKind.Warden ? 0x4deeea : 0xffd84d);
    this.sprite = scene.add.container(center.x, center.y, [crown, templeA, templeB, this.body, footA, footB, footC, eyeWhiteA, eyeWhiteB, eyeA, eyeB, accessory]);
    this.sprite.setDepth(18);
    scene.time.delayedCall(spawnDelayMs, () => {
      this.active = true;
    });
  }

  public frighten(): void {
    if (this.state !== GhostState.Returning && this.state !== GhostState.Stunned) {
      this.state = GhostState.Frightened;
      this.body.setFillStyle(0x223bff);
    }
  }

  public capture(now: number): void {
    this.state = GhostState.Stunned;
    this.stunnedUntil = now + 600;
    this.body.setFillStyle(0xffffff);
  }

  public returnHome(): void {
    if (this.state === GhostState.Stunned) return;
    this.state = GhostState.Returning;
    this.body.setFillStyle(ghostColors[this.kind]);
    this.recalcAt = 0;
  }

  public reset(): void {
    const center = tileCenter(this.spawn);
    this.sprite.setPosition(center.x, center.y);
    this.gridPosition = { ...this.spawn };
    this.direction = Direction.Left;
    this.state = GhostState.Patrol;
    this.body.setFillStyle(ghostColors[this.kind]);
  }

  public update(
    deltaMs: number,
    now: number,
    playerGrid: GridPoint,
    playerDirection: Direction,
    portalOpen: boolean,
    speedBoost: number
  ): void {
    if (!this.active) return;
    this.sprite.setScale(1, 1 + Math.sin((now + this.spawnDelayOffset()) / 120) * 0.035);
    if (this.state === GhostState.Stunned) {
      if (now >= this.stunnedUntil) this.state = GhostState.Returning;
      return;
    }

    const grid = pixelToGrid(this.sprite.x, this.sprite.y);
    this.gridPosition = { col: wrapColumn(this.level, grid.col), row: grid.row };

    const nearCenter = isNearTileCenter(this.sprite.x, this.sprite.y, 4);
    if (nearCenter && now >= this.recalcAt) {
      const snapped = snapToTileAxis(this.sprite.x, this.sprite.y, this.direction);
      this.sprite.setPosition(snapped.x, snapped.y);
      this.direction = HunterAI.chooseDirection(
        this.level,
        this.gridPosition,
        this.direction,
        playerGrid,
        playerDirection,
        this.spawn,
        this.patrolTarget,
        this.kind,
        this.state,
        portalOpen
      );
      this.recalcAt = now + 220;
    }

    if (this.state === GhostState.Returning && this.gridPosition.col === this.spawn.col && this.gridPosition.row === this.spawn.row) {
      this.state = GhostState.Patrol;
      this.body.setFillStyle(ghostColors[this.kind]);
    }

    const vector = directionVectors[this.direction];
    const stateSpeed = this.state === GhostState.Frightened ? 50 : this.state === GhostState.Returning ? 92 : 66 + speedBoost;
    this.sprite.x += vector.col * stateSpeed * (deltaMs / 1000);
    this.sprite.y += vector.row * stateSpeed * (deltaMs / 1000);
    if (this.sprite.x < -TILE_SIZE / 2) this.sprite.x = this.level.width * TILE_SIZE - TILE_SIZE / 2;
    if (this.sprite.x > this.level.width * TILE_SIZE + TILE_SIZE / 2) this.sprite.x = TILE_SIZE / 2;
  }

  private spawnDelayOffset(): number {
    return Object.values(GhostKind).indexOf(this.kind) * 170;
  }
}
