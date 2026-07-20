import Phaser from "phaser";
import {
  canMove,
  directionVectors,
  isNearTileCenter,
  pixelToGrid,
  snapToTileAxis,
  tileCenter,
  TILE_SIZE,
  wrapColumn
} from "../systems/GridMovement";
import { Direction, GridPoint, LevelData } from "../types";

export class Player {
  public readonly sprite: Phaser.GameObjects.Container;
  public gridPosition: GridPoint;
  public currentDirection = Direction.Left;
  public requestedDirection = Direction.Left;
  public lives = 5;
  public invulnerableUntil = 0;
  public readonly trail: GridPoint[] = [];
  private readonly body: Phaser.GameObjects.Rectangle;
  private readonly net: Phaser.GameObjects.Rectangle;
  private bobTime = 0;

  public constructor(
    scene: Phaser.Scene,
    public readonly spawn: GridPoint,
    private readonly level: LevelData,
    public speed = 92
  ) {
    const center = tileCenter(spawn);
    this.gridPosition = { ...spawn };
    const shadow = scene.add.rectangle(0, 9, 14, 3, 0x020303, 0.65);
    const leftBoot = scene.add.rectangle(-4, 7, 4, 5, 0x101612);
    const rightBoot = scene.add.rectangle(4, 7, 4, 5, 0x101612);
    this.body = scene.add.rectangle(0, 1, 13, 12, 0xd6fe50);
    const coatShade = scene.add.rectangle(-5, 2, 3, 8, 0x91b52b);
    const face = scene.add.rectangle(0, -7, 9, 7, 0xf4f0c9);
    const eye = scene.add.rectangle(3, -7, 2, 2, 0x050708);
    const hatTop = scene.add.rectangle(-1, -13, 13, 5, 0x171c18);
    const hatBand = scene.add.rectangle(-1, -11, 13, 2, 0xd6fe50);
    const brim = scene.add.rectangle(1, -9, 19, 3, 0x171c18);
    const lamp = scene.add.rectangle(8, -13, 4, 4, 0x4deeea);
    const handle = scene.add.rectangle(-10, 1, 2, 12, 0xf3f7df).setAngle(-18);
    this.net = scene.add.rectangle(-13, -5, 8, 8, 0x050708, 0.2).setStrokeStyle(2, 0xf3f7df);
    this.sprite = scene.add.container(center.x, center.y, [shadow, leftBoot, rightBoot, this.body, coatShade, face, eye, hatTop, hatBand, brim, lamp, handle, this.net]);
    this.sprite.setDepth(20);
  }

  public setRequestedDirection(direction: Direction): void {
    this.requestedDirection = direction;
  }

  public reset(now: number): void {
    const center = tileCenter(this.spawn);
    this.sprite.setPosition(center.x, center.y);
    this.currentDirection = Direction.Left;
    this.requestedDirection = Direction.Left;
    this.invulnerableUntil = now + 2000;
    this.gridPosition = { ...this.spawn };
  }

  public update(deltaMs: number, now: number): void {
    this.bobTime += deltaMs;
    this.sprite.setScale(now < this.invulnerableUntil && Math.floor(now / 110) % 2 === 0 ? 0.75 : 1);
    this.body.y = -2 + Math.sin(this.bobTime / 145) * 1.4;

    const nearCenter = isNearTileCenter(this.sprite.x, this.sprite.y);
    const grid = pixelToGrid(this.sprite.x, this.sprite.y);
    this.gridPosition = { col: wrapColumn(this.level, grid.col), row: grid.row };

    if (nearCenter && canMove(this.level, this.gridPosition, this.requestedDirection)) {
      const snapped = snapToTileAxis(this.sprite.x, this.sprite.y, this.requestedDirection);
      this.sprite.setPosition(snapped.x, snapped.y);
      this.currentDirection = this.requestedDirection;
    }

    if (nearCenter && !canMove(this.level, this.gridPosition, this.currentDirection)) {
      const center = tileCenter(this.gridPosition);
      this.sprite.setPosition(center.x, center.y);
      return;
    }

    const vector = directionVectors[this.currentDirection];
    const distance = this.speed * (deltaMs / 1000);
    this.sprite.x += vector.col * distance;
    this.sprite.y += vector.row * distance;

    if (this.sprite.x < -TILE_SIZE / 2) this.sprite.x = this.level.width * TILE_SIZE - TILE_SIZE / 2;
    if (this.sprite.x > this.level.width * TILE_SIZE + TILE_SIZE / 2) this.sprite.x = TILE_SIZE / 2;

    if (this.trail.length === 0 || this.trail[this.trail.length - 1].col !== this.gridPosition.col || this.trail[this.trail.length - 1].row !== this.gridPosition.row) {
      this.trail.push({ ...this.gridPosition });
      if (this.trail.length > 24) this.trail.shift();
    }
  }
}
