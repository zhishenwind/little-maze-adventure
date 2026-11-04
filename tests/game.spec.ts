import { test, expect } from "@playwright/test";
import { center, keys, labels, readBoard } from "./helpers/maze";

test("settings, hints, restart, themes and animal rewards work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/迷路小森林/);
  await page.getByRole("button", { name: /勇敢出发/ }).click();
  await expect(page.getByTestId("maze")).toHaveAttribute("data-size", "6");
  await page.getByRole("button", { name: "蓝色海洋" }).click();
  await page.getByRole("button", { name: "小猫布丁", exact: true }).click();
  await expect(page.locator(".mission")).toContainText("毛线球");
  await expect(page.locator(".app")).toHaveClass(/theme-ocean/);
  await page.getByRole("button", { name: "梦幻星空" }).click();
  await page.getByRole("button", { name: "小熊多多", exact: true }).click();
  await expect(page.locator(".mission")).toContainText("蜂蜜");
  await page.getByRole("button", { name: "青蛙呱呱", exact: true }).click();
  await expect(page.locator(".mission")).toContainText("蝴蝶");
  await page.getByRole("button", { name: /迷宫高手/ }).click();
  await expect(page.getByTestId("maze")).toHaveAttribute("data-size", "8");
  await page.getByRole("button", { name: "开始冒险", exact: true }).click();
  await page.getByRole("button", { name: "给我一点提示" }).click();
  await expect(page.locator(".hint-line")).toBeAttached();
  await expect(page.locator(".hint-line")).toHaveAttribute("points", /.+ .+/);
  const { route } = await readBoard(page);
  await page.keyboard.press(keys[route[0].direction]);
  await expect(page.getByTestId("maze")).toHaveAttribute(
    "data-position",
    String(route[0].cell),
  );
  await page.getByRole("button", { name: "重新开始当前迷宫" }).click();
  await expect(page.getByTestId("maze")).toHaveAttribute("data-position", "0");
  await expect(page.locator(".movement-status")).toContainText("0");
  await page.getByRole("button", { name: "怎么玩" }).click();
  await expect(page.getByRole("dialog")).toContainText("一起出发");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "关闭音效" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "开启音效" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("keyboard blocks walls, solves a maze, celebrates and persists earned stars", async ({
  page,
}) => {
  await page.goto("/");
  const { route } = await readBoard(page);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("maze")).toHaveAttribute("data-position", "0");
  for (const edge of route) await page.keyboard.press(keys[edge.direction]);
  await expect(page.getByRole("dialog")).toContainText("找到胡萝卜啦");
  await expect(page.locator(".collection strong")).toHaveText("3");
  // Further movement must not award the same completion twice.
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".collection strong")).toHaveText("3");
  await page.getByRole("button", { name: "再来一次冒险" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByTestId("maze")).toHaveAttribute("data-position", "0");
  await page.reload();
  await expect(page.locator(".collection strong")).toHaveText("3");
});

test("fast mouse drags respect internal walls and reach the goal", async ({
  page,
}) => {
  await page.goto("/");
  const { size, route, adjacency } = await readBoard(page);
  const start = await center(page, 0, size);
  const blockedDirection = [1, 2].find(
    (d) => !adjacency[0].some((e) => e.direction === d),
  );
  if (blockedDirection !== undefined) {
    const blocked = await center(page, blockedDirection === 1 ? 1 : size, size);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(blocked.x, blocked.y);
    await expect(page.getByTestId("maze")).toHaveAttribute(
      "data-position",
      "0",
    );
    await page.mouse.up();
  }
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const edge of route) {
    const p = await center(page, edge.cell, size);
    await page.mouse.move(p.x, p.y, { steps: 1 });
    await expect(page.getByTestId("maze")).toHaveAttribute(
      "data-position",
      String(edge.cell),
    );
  }
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("phone layout fits, touch drag resumes and direction buttons finish the maze", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    375,
  );
  await page.getByRole("button", { name: "开始冒险", exact: true }).tap();
  await page.waitForTimeout(500); // Allow the requested mobile scroll to settle.
  const { size, route } = await readBoard(page);
  const cdp = await context.newCDPSession(page);
  const start = await center(page, 0, size),
    first = await center(page, route[0].cell, size);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...start, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...first, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByTestId("maze")).toHaveAttribute(
    "data-position",
    String(route[0].cell),
  );
  const second = await center(page, route[1].cell, size);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...first, id: 2 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...second, id: 2 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByTestId("maze")).toHaveAttribute(
    "data-position",
    String(route[1].cell),
  );
  for (const edge of route.slice(2))
    await page
      .getByRole("button", { name: labels[edge.direction], exact: true })
      .tap();
  await expect(page.getByRole("dialog")).toContainText("找到胡萝卜啦");
  await page.getByRole("button", { name: "再来一次冒险" }).tap();
  await page.getByTestId("maze").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/phone.png", fullPage: true });
  await context.close();
});

test("desktop scene has no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    1440,
  );
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
