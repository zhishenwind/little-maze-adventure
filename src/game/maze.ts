export type Difficulty = "easy" | "explore" | "challenge" | "practice";
export type Maze = { cols: number; rows: number; walls: number[]; solution: number[] };
export const DIRECTIONS = [
  { dr: -1, dc: 0, wall: 1, opposite: 4 },
  { dr: 0, dc: 1, wall: 2, opposite: 8 },
  { dr: 1, dc: 0, wall: 4, opposite: 1 },
  { dr: 0, dc: -1, wall: 8, opposite: 2 },
] as const;

export function neighbor(maze: Maze, cell: number, direction: number): number | null {
  const d = DIRECTIONS[direction];
  if (!d || cell < 0 || cell >= maze.walls.length || maze.walls[cell] & d.wall) return null;
  const row = Math.floor(cell / maze.cols) + d.dr;
  const col = (cell % maze.cols) + d.dc;
  return row >= 0 && col >= 0 && row < maze.rows && col < maze.cols
    ? row * maze.cols + col : null;
}

export function solve(maze: Maze, from = 0, to = maze.cols * maze.rows - 1): number[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 ||
      from >= maze.walls.length || to >= maze.walls.length) return [];
  const parents = new Map<number, number>([[from, -1]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    if (cell === to) break;
    for (let d = 0; d < 4; d++) {
      const next = neighbor(maze, cell, d);
      if (next !== null && !parents.has(next)) {
        parents.set(next, cell);
        queue.push(next);
      }
    }
  }
  if (!parents.has(to)) return [];
  const route: number[] = [];
  for (let cell = to; cell !== -1; cell = parents.get(cell)!) route.push(cell);
  return route.reverse();
}

/** Only off-route branches at least two cells deep count as meaningful decisions. */
export function measureMaze(maze: Maze) {
  const path = new Set(maze.solution);
  let decisions = 0;
  const depths: number[] = [];
  for (const cell of maze.solution.slice(0, -1)) {
    let choice = false;
    for (let d = 0; d < 4; d++) {
      const next = neighbor(maze, cell, d);
      if (next === null || path.has(next)) continue;
      let depth = 0;
      const stack = [{ cell: next, parent: cell, distance: 1 }];
      while (stack.length) {
        const node = stack.pop()!;
        depth = Math.max(depth, node.distance);
        for (let direction = 0; direction < 4; direction++) {
          const child = neighbor(maze, node.cell, direction);
          if (child !== null && child !== node.parent)
            stack.push({ cell: child, parent: node.cell, distance: node.distance + 1 });
        }
      }
      if (depth >= 2) { choice = true; depths.push(depth); }
    }
    if (choice) decisions++;
  }
  return {
    steps: maze.solution.length - 1,
    decisions,
    wrongDepth: depths.length ? depths.reduce((sum, n) => sum + n, 0) / depths.length : 0,
  };
}

function growTree(cols: number, rows: number, bias: number, random: () => number): Maze {
  const walls = Array<number>(cols * rows).fill(15);
  const root = Math.floor(random() * walls.length);
  const visited = new Set([root]);
  const active = [root];
  while (active.length) {
    const index = random() < bias ? active.length - 1 : Math.floor(random() * active.length);
    const current = active[index];
    const row = Math.floor(current / cols), col = current % cols;
    const options = DIRECTIONS.filter((d) => {
      const r = row + d.dr, c = col + d.dc;
      return r >= 0 && c >= 0 && r < rows && c < cols && !visited.has(r * cols + c);
    });
    if (!options.length) { active.splice(index, 1); continue; }
    const d = options[Math.floor(random() * options.length)];
    const next = (row + d.dr) * cols + col + d.dc;
    walls[current] &= ~d.wall;
    walls[next] &= ~d.opposite;
    visited.add(next);
    active.push(next);
  }
  const maze: Maze = { cols, rows, walls, solution: [] };
  maze.solution = solve(maze);
  return maze;
}

/** Bounded candidate selection; every candidate is a connected, uniquely solvable tree. */
export function generateMaze(
  cols: number, rows: number, difficulty: Difficulty = "easy", random: () => number = Math.random,
): Maze {
  if ([cols, rows].some((n) => !Number.isInteger(n) || n < 2 || n > 32))
    throw new RangeError("Maze rows and columns must be integers between 2 and 32");
  const level = difficulty === "challenge" ? 2 : difficulty === "explore" ? 1 : 0;
  const capacity = Math.min(1.8, cols * rows / 48);
  const target = { decisions: [2, 3, 4][level] * capacity, depth: [2.5, 4, 5][level] * Math.sqrt(capacity), length: [1.15, 1.5, 1.8][level] };
  const direct = cols + rows - 2;
  let best: Maze | undefined;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < (difficulty === "practice" ? 12 : 64); attempt++) {
    const maze = growTree(cols, rows, random() * 0.95, random);
    const metrics = measureMaze(maze);
    const score = Math.abs(metrics.decisions - target.decisions) * 2.5 +
      Math.abs(metrics.wrongDepth - target.depth) * 2 +
      Math.abs(metrics.steps / direct - target.length) * 3;
    if (score < bestScore) { best = maze; bestScore = score; }
  }
  return best!;
}
