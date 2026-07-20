import { LevelData } from "../types";

export const level01: LevelData = {
  id: "haunted-arcade-01",
  name: "Haunted Arcade",
  width: 19,
  height: 23,
  theme: {
    id: "haunted-arcade",
    name: "Haunted Arcade",
    wall: 0x182014,
    wallGlow: 0xd6fe50,
    floor: 0x050705,
    spark: 0xd6fe50,
    rareSpark: 0x52fff3,
    flare: 0xff4df2,
    portal: 0xd6fe50
  },
  futureThemes: [
    "Neon Graveyard",
    "Crypt Circuit",
    "Moonlit Mansion",
    "Mint Gate Lab"
  ],
  rows: [
    "###################",
    "#P......#......o..#",
    "#.###.#.#.#.###.#.#",
    "#r#...#...#...#r#.#",
    "#.#.#.#####.#.#.#.#",
    "#...#...#...#...#.#",
    "###.###.#.###.###.#",
    "T.......G.......T.#",
    "###.#.#####.#.###.#",
    "#...#...#...#...#.#",
    "#.#####.#.#####.#.#",
    "#o....G...X...G..o#",
    "#.#####.#.#####.#.#",
    "#...#...#...#...#.#",
    "###.#.#####.#.###.#",
    "T.......G.......T.#",
    "###.###.#.###.###.#",
    "#...#...#...#...#.#",
    "#.#.#.#####.#.#.#.#",
    "#r#...#...#...#r#.#",
    "#.###.#.#.#.###.#.#",
    "#..o...#...#...o..#",
    "###################"
  ]
};
