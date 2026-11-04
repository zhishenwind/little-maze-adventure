import type { Difficulty } from "./maze.ts";

export const LEVELS = [
  { id: "easy", name: "轻松出发", label: "轻松", cols: 6, rows: 8, cell: 56, note: "短短小路，慢慢熟悉" },
  { id: "explore", name: "勇敢探索", label: "探索", cols: 8, rows: 10, cell: 44, note: "看看岔路，试着选择" },
  { id: "challenge", name: "迷宫高手", label: "挑战", cols: 10, rows: 12, cell: 35, note: "多想一步，发现出路" },
] as const;

/** Available board area in logical pixels; platform APIs stay in the UI adapter. */
export function fitMaze(difficulty: Difficulty, width: number, height: number) {
  if (difficulty === "practice") return { cols: 4, rows: 4 };
  const level = LEVELS.find((item) => item.id === difficulty)!;
  return {
    cols: Math.max(4, Math.min(level.cols, Math.floor(Math.max(0, width) / level.cell))),
    rows: Math.max(4, Math.min(level.rows, Math.floor(Math.max(0, height) / level.cell))),
  };
}
