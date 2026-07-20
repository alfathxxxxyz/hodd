import { Direction, GridPoint, LevelData, TileType } from "../types";

export const TILE_SIZE = 24;

export const directionVectors: Record<Direction, GridPoint> = {
  [Direction.None]: { col: 0, row: 0 },
  [Direction.Up]: { col: 0, row: -1 },
  [Direction.Down]: { col: 0, row: 1 },
  [Direction.Left]: { col: -1, row: 0 },
  [Direction.Right]: { col: 1, row: 0 }
};

export function oppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.Up:
      return Direction.Down;
    case Direction.Down:
      return Direction.Up;
    case Direction.Left:
      return Direction.Right;
    case Direction.Right:
      return Direction.Left;
    default:
      return Direction.None;
  }
}

export function tileCenter(point: GridPoint): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(
    point.col * TILE_SIZE + TILE_SIZE / 2,
    point.row * TILE_SIZE + TILE_SIZE / 2
  );
}

export function pixelToGrid(x: number, y: number): GridPoint {
  return {
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE)
  };
}

export function getTile(level: LevelData, point: GridPoint): TileType {
  if (point.row < 0 || point.row >= level.height) return TileType.Wall;
  const wrappedCol = wrapColumn(level, point.col);
  return level.rows[point.row][wrappedCol] as TileType;
}

export function wrapColumn(level: LevelData, col: number): number {
  if (col < 0) return level.width - 1;
  if (col >= level.width) return 0;
  return col;
}

export function isWalkable(level: LevelData, point: GridPoint): boolean {
  return getTile(level, point) !== TileType.Wall;
}

export function canMove(level: LevelData, point: GridPoint, direction: Direction): boolean {
  if (direction === Direction.None) return false;
  const vector = directionVectors[direction];
  return isWalkable(level, { col: point.col + vector.col, row: point.row + vector.row });
}

export function isNearTileCenter(x: number, y: number, tolerance = 3): boolean {
  const center = tileCenter(pixelToGrid(x, y));
  return Math.abs(x - center.x) <= tolerance && Math.abs(y - center.y) <= tolerance;
}

export function snapToTileAxis(
  x: number,
  y: number,
  direction: Direction
): { x: number; y: number } {
  const center = tileCenter(pixelToGrid(x, y));
  if (direction === Direction.Left || direction === Direction.Right) return { x, y: center.y };
  if (direction === Direction.Up || direction === Direction.Down) return { x: center.x, y };
  return { x: center.x, y: center.y };
}

export function availableDirections(level: LevelData, point: GridPoint): Direction[] {
  return [Direction.Up, Direction.Down, Direction.Left, Direction.Right].filter((direction) =>
    canMove(level, point, direction)
  );
}
