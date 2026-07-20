import {
  availableDirections,
  directionVectors,
  isWalkable,
  oppositeDirection,
  wrapColumn
} from "./GridMovement";
import { Direction, GhostKind, GhostState, GridPoint, LevelData } from "../types";

function key(point: GridPoint): string {
  return `${point.col},${point.row}`;
}

function distance(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

export class HunterAI {
  public static chooseDirection(
    level: LevelData,
    from: GridPoint,
    current: Direction,
    player: GridPoint,
    playerDirection: Direction,
    spawn: GridPoint,
    patrolTarget: GridPoint,
    kind: GhostKind,
    state: GhostState,
    portalOpen: boolean
  ): Direction {
    const dirs = availableDirections(level, from).filter(
      (direction) => direction !== oppositeDirection(current) || state === GhostState.Returning
    );
    const choices = dirs.length > 0 ? dirs : availableDirections(level, from);
    if (choices.length === 0) return Direction.None;

    if (state === GhostState.Frightened) {
      return choices.sort((a, b) => {
        const pa = this.nextPoint(level, from, a);
        const pb = this.nextPoint(level, from, b);
        return distance(pb, player) - distance(pa, player);
      })[0];
    }

    const target = this.targetFor(kind, player, playerDirection, spawn, patrolTarget, state, portalOpen);
    const first = this.firstStep(level, from, target);
    if (first !== Direction.None && choices.includes(first)) return first;

    return choices.sort((a, b) => {
      const pa = this.nextPoint(level, from, a);
      const pb = this.nextPoint(level, from, b);
      const bias = kind === GhostKind.Chaser ? 0 : kind === GhostKind.Ambusher ? 0.2 : kind === GhostKind.Warden ? 0.35 : 0.15;
      const scoreA = distance(pa, target) + bias * distance(pa, player);
      const scoreB = distance(pb, target) + bias * distance(pb, player);
      return scoreA - scoreB;
    })[0];
  }

  private static targetFor(
    kind: GhostKind,
    player: GridPoint,
    playerDirection: Direction,
    spawn: GridPoint,
    patrolTarget: GridPoint,
    state: GhostState,
    portalOpen: boolean
  ): GridPoint {
    if (state === GhostState.Returning || state === GhostState.Stunned) return spawn;
    if (kind === GhostKind.Warden && !portalOpen) return patrolTarget;
    if (kind === GhostKind.Ambusher) {
      const vector = directionVectors[playerDirection];
      return { col: player.col + vector.col * 2, row: player.row + vector.row * 2 };
    }
    if (kind === GhostKind.Drifter) return patrolTarget;
    return player;
  }

  private static firstStep(level: LevelData, start: GridPoint, target: GridPoint): Direction {
    const queue: GridPoint[] = [start];
    const visited = new Set<string>([key(start)]);
    const firstByKey = new Map<string, Direction>();

    while (queue.length > 0) {
      const point = queue.shift();
      if (!point) break;
      if (point.col === wrapColumn(level, target.col) && point.row === target.row) {
        return firstByKey.get(key(point)) ?? Direction.None;
      }
      for (const direction of availableDirections(level, point)) {
        const next = this.nextPoint(level, point, direction);
        const nextKey = key(next);
        if (visited.has(nextKey) || !isWalkable(level, next)) continue;
        visited.add(nextKey);
        firstByKey.set(nextKey, firstByKey.get(key(point)) ?? direction);
        queue.push(next);
      }
    }

    return Direction.None;
  }

  private static nextPoint(level: LevelData, point: GridPoint, direction: Direction): GridPoint {
    const vector = directionVectors[direction];
    return { col: wrapColumn(level, point.col + vector.col), row: point.row + vector.row };
  }
}
