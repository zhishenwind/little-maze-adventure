import test from "node:test";
import assert from "node:assert/strict";
import { generateMaze, measureMaze, neighbor, solve, DIRECTIONS } from "./maze.ts";
import type { Difficulty } from "./maze.ts";
import { fitMaze } from "./difficulty.ts";

function seeded(initial: number) {
  let seed = initial;
  return () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
}

for (const [cols, rows, level] of [
  [4, 4, "practice"], [6, 8, "easy"], [8, 10, "explore"],
  [10, 12, "challenge"], [4, 6, "challenge"], [9, 4, "explore"], [2, 3, "easy"],
] as const) {
  test(`${cols}×${rows} ${level}: 100 mazes connected, symmetric, bounded and acyclic`, () => {
    const signatures = new Set<string>();
    const random = seeded(7919 + cols * 100 + rows);
    for (let run = 0; run < 100; run++) {
      const maze = generateMaze(cols, rows, level, random);
      signatures.add(maze.walls.join(","));
      let openings = 0;
      for (let cell = 0; cell < cols * rows; cell++) {
        assert.ok(solve(maze, 0, cell).length > 0);
        for (let d = 0; d < 4; d++) {
          const next = neighbor(maze, cell, d);
          if (next !== null) {
            openings++;
            assert.equal(neighbor(maze, next, (d + 2) % 4), cell);
          }
          const row = Math.floor(cell / cols) + DIRECTIONS[d].dr;
          const col = (cell % cols) + DIRECTIONS[d].dc;
          if (row < 0 || col < 0 || row >= rows || col >= cols) {
            assert.equal(next, null);
            assert.ok(maze.walls[cell] & DIRECTIONS[d].wall);
          }
        }
      }
      assert.equal(openings / 2, cols * rows - 1);
      assert.equal(maze.solution[0], 0);
      assert.equal(maze.solution.at(-1), cols * rows - 1);
      for (let i = 1; i < maze.solution.length; i++)
        assert.ok([0, 1, 2, 3].some((d) => neighbor(maze, maze.solution[i - 1], d) === maze.solution[i]));
      const from = Math.floor(random() * cols * rows);
      assert.equal(solve(maze, from)[0], from);
    }
    assert.ok(signatures.size > (cols === 2 ? 1 : 30));
  });
}

test("invalid dimensions rejected and invalid route endpoints return no path", () => {
  for (const n of [0, 1, 4.5, 33, NaN, Infinity]) {
    assert.throws(() => generateMaze(n, 8), RangeError);
    assert.throws(() => generateMaze(6, n), RangeError);
  }
  const maze = generateMaze(6, 8);
  assert.deepEqual(solve(maze, -1), []);
  assert.deepEqual(solve(maze, 0, 48), []);
});

test("screen capacity caps size and preserves usable cell targets", () => {
  assert.deepEqual(fitMaze("easy", 350, 470), { cols: 6, rows: 8 });
  assert.deepEqual(fitMaze("explore", 352, 470), { cols: 8, rows: 10 });
  assert.deepEqual(fitMaze("challenge", 350, 470), { cols: 10, rows: 12 });
  assert.deepEqual(fitMaze("easy", 280, 380), { cols: 5, rows: 6 });
  assert.deepEqual(fitMaze("explore", 280, 380), { cols: 6, rows: 8 });
  assert.deepEqual(fitMaze("challenge", 280, 380), { cols: 8, rows: 10 });
  assert.deepEqual(fitMaze("challenge", 1000, 1000), { cols: 10, rows: 12 });
  assert.deepEqual(fitMaze("easy", 200, 100), { cols: 4, rows: 4 });
  assert.deepEqual(fitMaze("practice", 350, 470), { cols: 4, rows: 4 });
});

for (const [cols, rows] of [[6, 8], [4, 6]]) {
  test(`${cols}×${rows}: structural difficulty increases even with identical screen capacity`, () => {
    const averages = (["easy", "explore", "challenge"] as Difficulty[]).map((level) => {
      const random = seeded(20261104);
      const metrics = Array.from({ length: 100 }, () => measureMaze(generateMaze(cols, rows, level, random)));
      return {
        decisions: metrics.reduce((sum, m) => sum + m.decisions, 0) / metrics.length,
        depth: metrics.reduce((sum, m) => sum + m.wrongDepth, 0) / metrics.length,
        steps: metrics.reduce((sum, m) => sum + m.steps, 0) / metrics.length,
      };
    });
    console.log(`${cols}×${rows} difficulty averages`, averages);
    for (let i = 1; i < averages.length; i++) {
      assert.ok(averages[i].decisions > averages[i - 1].decisions);
      assert.ok(averages[i].depth > averages[i - 1].depth);
      assert.ok(averages[i].steps > averages[i - 1].steps);
    }
  });
}
