import test from "node:test";
import assert from "node:assert/strict";
import { generateMaze, neighbor, solve, DIRECTIONS } from "./maze.ts";

for (const size of [4, 6, 8]) {
  test(`${size}×${size}: 100 random mazes are connected, symmetric, bounded and acyclic`, () => {
    const signatures = new Set<string>();
    let seed = 7919 + size;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    for (let run = 0; run < 100; run++) {
      const maze = generateMaze(size, random);
      signatures.add(maze.walls.join(","));
      let openings = 0;
      for (let cell = 0; cell < size * size; cell++) {
        assert.ok(solve(maze, 0, cell).length > 0);
        for (let d = 0; d < 4; d++) {
          const next = neighbor(maze, cell, d);
          if (next !== null) {
            openings++;
            assert.equal(neighbor(maze, next, (d + 2) % 4), cell);
          }
          const row = Math.floor(cell / size) + DIRECTIONS[d].dr;
          const col = (cell % size) + DIRECTIONS[d].dc;
          if (row < 0 || col < 0 || row >= size || col >= size)
            assert.equal(next, null);
        }
      }
      assert.equal(openings / 2, size * size - 1);
      assert.equal(maze.solution[0], 0);
      assert.equal(maze.solution.at(-1), size * size - 1);
      for (let i = 1; i < maze.solution.length; i++) {
        assert.ok(
          [0, 1, 2, 3].some(
            (d) => neighbor(maze, maze.solution[i - 1], d) === maze.solution[i],
          ),
        );
      }
    }
    assert.ok(
      signatures.size > 30,
      "fresh games should have different layouts",
    );
  });
}
test("invalid sizes are rejected", () => {
  for (const size of [0, 1, 4.5, 33])
    assert.throws(() => generateMaze(size), RangeError);
});
