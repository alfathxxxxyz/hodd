export enum TileType {
  Wall = "#",
  Floor = " ",
  Spark = ".",
  RareSpark = "r",
  SoulFlare = "o",
  PlayerSpawn = "P",
  GhostSpawn = "G",
  Portal = "X",
  Tunnel = "T"
}

export enum Direction {
  None = "none",
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right"
}

export enum RunState {
  Menu = "MENU",
  Countdown = "COUNTDOWN",
  Playing = "PLAYING",
  Paused = "PAUSED",
  Respawning = "RESPAWNING",
  Won = "WON",
  GameOver = "GAME_OVER"
}

export enum GhostState {
  Patrol = "PATROL",
  Chase = "CHASE",
  Frightened = "FRIGHTENED",
  Stunned = "STUNNED",
  Returning = "RETURNING"
}

export enum GhostKind {
  Chaser = "CHASER",
  Ambusher = "AMBUSHER",
  Warden = "WARDEN",
  Drifter = "DRIFTER"
}

export interface GridPoint {
  col: number;
  row: number;
}

export interface LevelTheme {
  id: string;
  name: string;
  wall: number;
  wallGlow: number;
  floor: number;
  spark: number;
  rareSpark: number;
  flare: number;
  portal: number;
}

export interface LevelData {
  id: string;
  name: string;
  width: number;
  height: number;
  rows: string[];
  theme: LevelTheme;
  futureThemes: string[];
}

export interface RunStats {
  runId: string;
  durationMs: number;
  sparksCollected: number;
  rareSparksCollected: number;
  ghostsCaptured: number;
  captureScore: number;
  damageTaken: number;
  remainingLives: number;
  remainingSeconds: number;
  completed: boolean;
  events: RunEvent[];
}

export interface RunEvent {
  atMs: number;
  type:
    | "spark"
    | "rareSpark"
    | "flare"
    | "capture"
    | "damage"
    | "portalOpen"
    | "completed"
    | "failed";
  value?: number;
}

export interface ScoreBreakdown {
  sparkScore: number;
  rareSparkScore: number;
  captureScore: number;
  portalScore: number;
  completionScore: number;
  lifeScore: number;
  timeScore: number;
  noDamageBonus: number;
  finalScore: number;
}

export interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  completionTime: string;
  completed: boolean;
}
