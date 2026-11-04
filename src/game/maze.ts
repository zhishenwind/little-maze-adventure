export type Maze = { size: number; walls: number[]; solution: number[] };
export const DIRECTIONS = [
  { dr: -1, dc: 0, wall: 1, opposite: 4 },
  { dr: 0, dc: 1, wall: 2, opposite: 8 },
  { dr: 1, dc: 0, wall: 4, opposite: 1 },
  { dr: 0, dc: -1, wall: 8, opposite: 2 },
] as const;

export function neighbor(
  maze: Maze,
  cell: number,
  direction: number,
): number | null {
  const d = DIRECTIONS[direction];
  if (!d || maze.walls[cell] & d.wall) return null;
  const row = Math.floor(cell / maze.size) + d.dr;
  const col = (cell % maze.size) + d.dc;
  return row >= 0 && col >= 0 && row < maze.size && col < maze.size
    ? row * maze.size + col
    : null;
}

export function solve(maze: Maze, from = 0, to = maze.size ** 2 - 1): number[] {
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

/** A randomized spanning tree: all cells are reachable, with one unique route between any pair. */
export function generateMaze(
  size: number,
  random: () => number = Math.random,
): Maze {
  if (!Number.isInteger(size) || size < 2 || size > 32)
    throw new RangeError("Maze size must be an integer between 2 and 32");
  let result: Maze = { size, walls: [], solution: [] };
  for (let attempt = 0; attempt < 60; attempt++) {
    const walls = Array<number>(size * size).fill(15);
    const visited = new Set([0]);
    const stack = [0];
    while (stack.length) {
      const current = stack[stack.length - 1];
      const row = Math.floor(current / size),
        col = current % size;
      const options = DIRECTIONS.map((d, i) => ({
        ...d,
        i,
        row: row + d.dr,
        col: col + d.dc,
      })).filter(
        (d) =>
          d.row >= 0 &&
          d.col >= 0 &&
          d.row < size &&
          d.col < size &&
          !visited.has(d.row * size + d.col),
      );
      if (!options.length) {
        stack.pop();
        continue;
      }
      const d = options[Math.floor(random() * options.length)];
      const next = d.row * size + d.col;
      walls[current] &= ~d.wall;
      walls[next] &= ~d.opposite;
      visited.add(next);
      stack.push(next);
    }
    result = { size, walls, solution: [] };
    result.solution = solve(result);
    // Keep the first adventure approachable, and larger mazes reasonably short for preschoolers.
    if (
      result.solution.length >= size * 1.5 &&
      result.solution.length <= size * size * 0.72
    )
      break;
  }
  return result;
}
