import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export const keys = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
export const labels = ["向上走", "向右走", "向下走", "向左走"];

/** Reconstruct passages from the rendered SVG, independent of application state and its solver. */
export async function readBoard(page: Page) {
  const maze = page.getByTestId("maze");
  const size = Number(await maze.getAttribute("data-size"));
  const path = await maze.locator(".hedge").getAttribute("d");
  const walls = [
    ...path!.matchAll(/M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)/g),
  ].map((m) => m.slice(1).map(Number));
  const unit = 520 / size;
  const adjacency: { cell: number; direction: number }[][] = Array.from(
    { length: size * size },
    () => [],
  );
  for (let cell = 0; cell < size * size; cell++) {
    const row = Math.floor(cell / size),
      col = cell % size;
    for (const [d, dr, dc] of [
      [0, -1, 0],
      [1, 0, 1],
      [2, 1, 0],
      [3, 0, -1],
    ]) {
      const nr = row + dr,
        nc = col + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      const x = 100 + (col + 0.5 + dc * 0.5) * unit,
        y = 55 + (row + 0.5 + dr * 0.5) * unit;
      const blocked = walls.some(([x1, y1, x2, y2]) =>
        Math.abs(x1 - x2) < 0.01
          ? Math.abs(x - x1) < 0.01 &&
            y >= Math.min(y1, y2) &&
            y <= Math.max(y1, y2)
          : Math.abs(y - y1) < 0.01 &&
            x >= Math.min(x1, x2) &&
            x <= Math.max(x1, x2),
      );
      if (!blocked)
        adjacency[cell].push({ cell: nr * size + nc, direction: d });
    }
  }
  const route: { cell: number; direction: number }[] = [];
  function search(cell: number, previous: number): boolean {
    if (cell === size * size - 1) return true;
    for (const edge of adjacency[cell]) {
      if (edge.cell === previous) continue;
      route.push(edge);
      if (search(edge.cell, cell)) return true;
      route.pop();
    }
    return false;
  }
  expect(search(0, -1)).toBe(true);
  return { size, route, adjacency };
}

export async function center(page: Page, cell: number, size: number) {
  return page.getByTestId("maze").evaluate(
    (element, args) => {
      const unit = 520 / args.size;
      const point = new DOMPoint(
        100 + ((args.cell % args.size) + 0.5) * unit,
        55 + (Math.floor(args.cell / args.size) + 0.5) * unit,
      );
      const screen = point.matrixTransform(
        (element as unknown as SVGSVGElement).getScreenCTM()!,
      );
      return { x: screen.x, y: screen.y };
    },
    { cell, size },
  );
}
