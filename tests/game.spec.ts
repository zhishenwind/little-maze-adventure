import { test, expect } from "@playwright/test";
import { center, keys, labels, readBoard } from "./helpers/maze";

test("settings, hints, restart, themes and animal rewards work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/迷路小森林/);
  await page.getByRole("button", { name: /勇敢探索/ }).click();
  await expect(page.getByTestId("maze")).toHaveAttribute("data-cols", "8");
  await page.getByRole("button", { name: "蓝色海洋" }).click();
  await page.getByRole("button", { name: "小猫布丁", exact: true }).click();
  await expect(page.locator(".mission")).toContainText("毛线球");
  await expect(page.locator(".app")).toHaveClass(/theme-ocean/);
  await page.getByRole("button", { name: "梦幻星空" }).click();
  await page.getByRole("button", { name: "小熊多多", exact: true }).click();
  await expect(page.locator(".mission")).toContainText("蜂蜜");
  await page.getByRole("button", { name: "小牛伊一", exact: true }).click();
  await expect(page.locator(".mission")).toContainText("蝴蝶");
  await page.getByRole("button", { name: /迷宫高手/ }).click();
  await expect(page.getByTestId("maze")).toHaveAttribute("data-cols", "10");
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
  await cdp.detach();
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

test("Yiyi uses the same photo in settings, mission, maze and victory", async ({
  page,
}) => {
  await page.goto("/");
  const option = page.getByRole("button", { name: "小牛伊一", exact: true });
  await option.click();
  const avatar = await option.locator("image").getAttribute("href");
  expect(avatar).toContain("yiyi-avatar");
  await expect(page.locator(".mission image")).toHaveAttribute("href", avatar!);
  await expect(page.locator(".player image")).toHaveAttribute("href", avatar!);
  await expect(page.locator(".mission")).toContainText("小牛伊一");
  await page.evaluate(async (url) => {
    const image = new Image();
    image.src = url!;
    await image.decode();
  }, avatar);
  await page.getByTestId("player").scrollIntoViewIfNeeded();
  const { size, route } = await readBoard(page);
  const start = await center(page, 0, size);
  const next = await center(page, route[0].cell, size);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(next.x, next.y);
  await page.mouse.up();
  await page.getByRole("button", { name: "蓝色海洋", exact: true }).click();
  await expect(page.getByTestId("maze")).toHaveAttribute(
    "data-position",
    String(route[0].cell),
  );
  await page.screenshot({ path: "test-results/yiyi-game.png", fullPage: true });
  for (const edge of route.slice(1))
    await page.keyboard.press(keys[edge.direction]);
  await expect(page.getByRole("dialog")).toContainText("小牛伊一");
  await expect(page.getByRole("dialog")).toContainText("找到蝴蝶啦");
  await expect(page.locator(".win-character image")).toHaveAttribute(
    "href",
    avatar!,
  );
  const clips = await page
    .locator('svg[data-character="yiyi"] clipPath')
    .evaluateAll((elements) => elements.map((e) => e.id));
  expect(new Set(clips).size).toBe(clips.length);
  await page.locator(".win-dialog").evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  await page.screenshot({ path: "test-results/yiyi-win.png", fullPage: true });
});

for (const viewport of [
  { width: 320, height: 568 }, { width: 375, height: 812 },
  { width: 390, height: 844 }, { width: 430, height: 932 },
]) {
  test(`adaptive grid fits ${viewport.width}×${viewport.height} and keeps distinct levels`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
    try {
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:5173/");
      for (const [name, maxCols, maxRows, cellTarget] of [
        ["轻松出发", 6, 8, 56], ["勇敢探索", 8, 10, 44], ["迷宫高手", 10, 12, 35],
      ] as const) {
        await page.getByRole("button", { name: new RegExp(name) }).tap();
        const board = page.getByTestId("maze");
        const cols = Number(await board.getAttribute("data-cols"));
        const rows = Number(await board.getAttribute("data-rows"));
        expect(cols).toBeLessThanOrEqual(maxCols);
        expect(rows).toBeLessThanOrEqual(maxRows);
        await expect(page.getByTestId("grid-summary")).toContainText(`${cols} × ${rows}`);
        await page.getByRole("button", { name: "开始冒险", exact: true }).tap();
        await expect(page.getByRole("complementary", { name: "冒险设置" })).toBeHidden();
        const cell = await board.evaluate((element) => 52 * (element as unknown as SVGSVGElement).getScreenCTM()!.a);
        expect(cell).toBeGreaterThanOrEqual(cellTarget - 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
        const buttons = await page.locator('.touch-controls button').evaluateAll((elements) =>
          elements.map((e) => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height })));
        expect(buttons.every((b) => b.width >= 44 && b.height >= 44)).toBe(true);
        if (viewport.width === 390) {
          expect(cols).toBe(maxCols); expect(rows).toBe(maxRows);
          await page.screenshot({ path: `test-results/phone-${maxCols}x${maxRows}.png`, fullPage: true });
        }
        await page.getByRole("button", { name: "返回设置", exact: true }).tap();
      }
      await page.getByRole("button", { name: /先练习拖动/ }).tap();
      await expect(page.getByTestId("maze")).toHaveAttribute("data-cols", "4");
      await expect(page.getByTestId("maze")).toHaveAttribute("data-rows", "4");
      await page.getByRole("button", { name: /轻松出发/ }).tap();
      await expect(page.getByRole("button", { name: /轻松出发/ })).toHaveAttribute("aria-pressed", "true");
    } finally { await context.close(); }
  });
}

test("rotation and returning to settings preserve a rectangular adventure", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5173/");
    await page.getByRole("button", { name: /勇敢探索/ }).tap();
    await page.getByRole("button", { name: "开始冒险", exact: true }).tap();
    const { size, rows, route } = await readBoard(page);
    const path = await page.locator(".hedge").getAttribute("d");
    await page.getByRole("button", { name: labels[route[0].direction], exact: true }).tap();
    await page.getByRole("button", { name: "返回设置", exact: true }).tap();
    await page.getByRole("button", { name: "蓝色海洋", exact: true }).tap();
    await page.getByRole("button", { name: "继续当前冒险", exact: true }).tap();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.getByTestId("maze")).toHaveAttribute("data-cols", String(size));
    await expect(page.getByTestId("maze")).toHaveAttribute("data-rows", String(rows));
    await expect(page.locator(".hedge")).toHaveAttribute("d", path!);
    await expect(page.getByTestId("maze")).toHaveAttribute("data-position", String(route[0].cell));
    await expect(page.locator(".movement-status")).toContainText("1");
    await page.setViewportSize({ width: 390, height: 844 });
    const cdp = await context.newCDPSession(page);
    // Grab just outside the visible avatar: the logical target stays at least 44px wide.
    const from = await center(page, route[0].cell, size);
    const to = await center(page, route[1].cell, size);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x + 20, y: from.y, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...to, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByTestId("maze")).toHaveAttribute("data-position", String(route[1].cell));
    await cdp.detach();
    for (const edge of route.slice(2)) await page.getByRole("button", { name: labels[edge.direction], exact: true }).tap();
    await expect(page.getByRole("dialog")).toContainText("找到胡萝卜啦");
  } finally { await context.close(); }
});

test("direct mobile drag enters focused play after release without losing the gesture", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5173/");
    await page.getByTestId("maze").scrollIntoViewIfNeeded();
    const { size, route } = await readBoard(page);
    const path = await page.locator(".hedge").getAttribute("d");
    const from = await center(page, 0, size), to = await center(page, route[0].cell, size);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...to, id: 1 }] });
    await expect(page.locator(".app")).not.toHaveClass(/game-focused/);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.locator(".app")).toHaveClass(/game-focused/);
    await expect(page.getByTestId("maze")).toHaveAttribute("data-position", String(route[0].cell));
    await expect(page.locator(".hedge")).toHaveAttribute("d", path!);
    await cdp.detach();
    await page.getByRole("button", { name: "重新开始当前迷宫" }).tap();
    await expect(page.getByTestId("maze")).toHaveAttribute("data-position", "0");
    await expect(page.locator(".hedge")).toHaveAttribute("d", path!);
  } finally { await context.close(); }
});

test("rapid direction taps and restart remain responsive after a touch drag", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      const log: Record<string, unknown>[] = [];
      (window as typeof window & { mazeTouchDiagnostics: typeof log }).mazeTouchDiagnostics = log;
      for (const type of ["pointerdown", "pointerup", "pointercancel", "gotpointercapture", "lostpointercapture", "touchstart", "touchend", "click"]) {
        document.addEventListener(type, (event) => {
          const pointer = event as PointerEvent;
          const target = event.target as Element;
          log.push({
            type, target: target.tagName,
            button: target.closest("button")?.getAttribute("aria-label"),
            pointerId: pointer.pointerId, pointerType: pointer.pointerType,
            x: pointer.clientX, y: pointer.clientY, trusted: event.isTrusted,
            position: document.querySelector('[data-testid="maze"]')?.getAttribute("data-position"),
          });
          if (log.length > 80) log.shift();
        }, { capture: true, passive: true });
      }
    });
    await page.goto("http://127.0.0.1:5173/");
    await page.getByRole("button", { name: "开始冒险", exact: true }).tap();
    const { size, route } = await readBoard(page);
    const cdp = await context.newCDPSession(page);
    const from = await center(page, 0, size), to = await center(page, route[0].cell, size);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...from, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...to, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByTestId("maze")).toHaveAttribute("data-position", String(route[0].cell));
    await cdp.detach();
    await page.getByRole("button", { name: "重新开始当前迷宫" }).tap();
    try {
      await expect(page.getByTestId("maze")).toHaveAttribute("data-position", "0");
    } catch (error) {
      console.log("Touch event diagnostics", await page.evaluate(() =>
        (window as typeof window & { mazeTouchDiagnostics: unknown }).mazeTouchDiagnostics));
      throw error;
    }
    const direction = route[0].direction;
    for (let n = 0; n < 6; n++) {
      await page.getByRole("button", { name: labels[direction], exact: true }).tap();
      await expect(page.getByTestId("maze")).toHaveAttribute("data-position", String(route[0].cell));
      await page.getByRole("button", { name: labels[(direction + 2) % 4], exact: true }).tap();
      await expect(page.getByTestId("maze")).toHaveAttribute("data-position", "0");
    }
    await expect(page.locator(".movement-status")).toContainText("12");
    for (const edge of route) {
      await page.getByRole("button", { name: labels[edge.direction], exact: true }).tap();
      await expect(page.getByTestId("maze")).toHaveAttribute("data-position", String(edge.cell));
    }
    await expect(page.getByRole("dialog")).toContainText("找到胡萝卜啦");
  } finally { await context.close(); }
});
