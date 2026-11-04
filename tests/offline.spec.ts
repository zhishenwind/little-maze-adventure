import { test as base, expect } from "@playwright/test";
import { offlineServer } from "./helpers/offline-server";
import { center, keys, readBoard } from "./helpers/maze";

const test = base.extend<{
  releaseServer: Awaited<ReturnType<typeof offlineServer>>;
}>({
  releaseServer: async ({}, use) => {
    const server = await offlineServer();
    try {
      await use(server);
    } finally {
      await server.close();
    }
  },
});
const status = (page: import("@playwright/test").Page) =>
  page.getByTestId("offline-status");

async function ready(page: import("@playwright/test").Page) {
  await expect(status(page)).toHaveAttribute("data-stage", "ready", {
    timeout: 15000,
  });
}

test("first visit saves every asset; later visits use cache and a fresh offline tab can finish a game", async ({
  page,
  context,
  releaseServer,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(releaseServer.url);
  await ready(page);
  expect(
    releaseServer.manifest.some((entry) => entry.url.endsWith(".css")),
  ).toBe(true);
  expect(
    releaseServer.manifest.some((entry) => entry.url.endsWith(".js")),
  ).toBe(true);
  expect(
    releaseServer.manifest.some((entry) => entry.url === "favicon.svg"),
  ).toBe(true);
  expect(
    releaseServer.manifest.some(
      (entry) => entry.url === "manifest.webmanifest",
    ),
  ).toBe(true);
  releaseServer.state.requests.length = 0;
  await page.reload();
  await ready(page);
  expect(
    releaseServer.state.requests.filter((request) => request !== "GET /sw.js"),
  ).toEqual([]);
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  reopened.on("pageerror", (error) => errors.push(error.message));
  await reopened.goto(releaseServer.url);
  await ready(reopened);
  await expect(status(reopened)).toContainText("正在离线游玩");
  for (const name of ["奇妙森林", "蓝色海洋", "梦幻星空"])
    await reopened.getByRole("button", { name, exact: true }).click();
  for (const [name, treat] of [
    ["小兔米米", "胡萝卜"],
    ["小猫布丁", "毛线球"],
    ["小熊多多", "蜂蜜"],
    ["青蛙呱呱", "蝴蝶"],
  ]) {
    await reopened.getByRole("button", { name, exact: true }).click();
    await expect(reopened.locator(".mission")).toContainText(treat);
  }
  for (const [name, size] of [
    ["勇敢出发", "6"],
    ["迷宫高手", "8"],
    ["小小探索", "4"],
  ]) {
    await reopened.getByRole("button", { name: new RegExp(name) }).click();
    await expect(reopened.getByTestId("maze")).toHaveAttribute(
      "data-size",
      size,
    );
  }
  await reopened.getByRole("button", { name: "给我一点提示" }).click();
  await expect(reopened.locator(".hint-line")).toBeAttached();
  await reopened.keyboard.press("ArrowUp");
  await expect(reopened.getByTestId("maze")).toHaveAttribute(
    "data-position",
    "0",
  );
  const { route } = await readBoard(reopened);
  for (const edge of route) await reopened.keyboard.press(keys[edge.direction]);
  await expect(reopened.getByRole("dialog")).toContainText("找到蝴蝶啦");
  await reopened.getByRole("button", { name: "再来一次冒险" }).click();
  await reopened.getByRole("button", { name: "关闭音效" }).click();
  await reopened.reload();
  await ready(reopened);
  await expect(reopened.locator(".collection strong")).toHaveText("3");
  await expect(
    reopened.getByRole("button", { name: "开启音效" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("interrupted first download never claims ready and retry repairs it", async ({
  page,
  releaseServer,
}) => {
  releaseServer.state.failResource = true;
  await page.goto(releaseServer.url);
  await expect(status(page)).toHaveAttribute("data-stage", "error", {
    timeout: 15000,
  });
  await expect(status(page)).not.toContainText("离线可用");
  const { route } = await readBoard(page);
  await page.keyboard.press(keys[route[0].direction]);
  await expect(page.getByTestId("maze")).toHaveAttribute(
    "data-position",
    String(route[0].cell),
  );
  releaseServer.state.failResource = false;
  await page.getByRole("button", { name: "重试保存" }).click();
  await ready(page);
  await expect(page.getByTestId("maze")).toHaveAttribute(
    "data-position",
    String(route[0].cell),
  );
});

test("missing caches are detected and can be saved again without losing stars", async ({
  page,
  releaseServer,
}) => {
  await page.goto(releaseServer.url);
  await ready(page);
  await page.evaluate(async () => {
    localStorage.setItem("little-maze-completed", "2");
    await Promise.all((await caches.keys()).map((name) => caches.delete(name)));
  });
  await page.reload();
  await expect(status(page)).toHaveAttribute("data-stage", "error", {
    timeout: 15000,
  });
  await expect(page.locator(".collection strong")).toHaveText("6");
  await page.getByRole("button", { name: "重试保存" }).click();
  await ready(page);
  await expect(page.locator(".collection strong")).toHaveText("6");
});

test("new release waits through gameplay and only user action reloads; stale revisions are removed", async ({
  page,
  releaseServer,
}) => {
  await page.goto(releaseServer.url);
  await ready(page);
  await page.evaluate(() => localStorage.setItem("little-maze-completed", "2"));
  await page.reload();
  await ready(page);
  const { route } = await readBoard(page);
  await page.keyboard.press(keys[route[0].direction]);
  const cacheKeys = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((r) => r.url),
        ),
      )
    ).flat(),
  );
  releaseServer.state.version = 2;
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  await expect(
    page.getByRole("button", { name: "更新并重新打开" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("maze")).toHaveAttribute(
    "data-position",
    String(route[0].cell),
  );
  await expect(page.locator('meta[name="test-release"]')).toHaveAttribute(
    "content",
    "1",
  );
  await page.getByRole("button", { name: "更新并重新打开" }).click();
  await expect(page.locator('meta[name="test-release"]')).toHaveAttribute(
    "content",
    "2",
  );
  await ready(page);
  await expect(page.locator(".collection strong")).toHaveText("6");
  const newKeys = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((r) => r.url),
        ),
      )
    ).flat(),
  );
  expect(newKeys.some((key) => cacheKeys.includes(key))).toBe(false);
});

test("a failed update keeps the old release playable offline", async ({
  page,
  context,
  releaseServer,
}) => {
  await page.goto(releaseServer.url);
  await ready(page);
  releaseServer.state.version = 2;
  releaseServer.state.failResource = true;
  const installationFailed = page.evaluate(async () => {
    const reg = (await navigator.serviceWorker.getRegistration())!;
    const failed = new Promise<void>((resolve) => {
      reg.addEventListener(
        "updatefound",
        () => {
          const worker = reg.installing!;
          worker.addEventListener("statechange", () => {
            if (worker.state === "redundant") resolve();
          });
        },
        { once: true },
      );
    });
    await reg.update();
    await failed;
  });
  await installationFailed;
  await ready(page);
  await expect(
    page.getByRole("button", { name: "更新并重新打开" }),
  ).not.toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(page.locator('meta[name="test-release"]')).toHaveAttribute(
    "content",
    "1",
  );
  await expect(page.getByTestId("maze")).toBeVisible();
});

test("only app assets are cached; API navigation, posts and cross-origin fetches stay on the network", async ({
  page,
  releaseServer,
}) => {
  const thirdParty = await offlineServer();
  try {
    await page.goto(releaseServer.url);
    await ready(page);
    await page.evaluate(async (external) => {
      await fetch("/api/ping");
      await fetch("/api/ping", { method: "POST", body: "example" });
      await fetch(external + "/sdk.json", { mode: "no-cors" });
    }, thirdParty.url);
    const keys = await page.evaluate(async () =>
      (
        await Promise.all(
          (await caches.keys()).map(async (name) =>
            (await (await caches.open(name)).keys()).map((r) => r.url),
          ),
        )
      ).flat(),
    );
    expect(
      keys.some((key) => key.includes("/api/") || key.includes("/sdk.json")),
    ).toBe(false);
    await page.goto(releaseServer.url + "/api/ping");
    await expect(page.locator("body")).toContainText('"source":"network"');
  } finally {
    await thirdParty.close();
  }
});

test("mobile touch resumes and completes a cached maze offline without horizontal overflow", async ({
  browser,
  releaseServer,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto(releaseServer.url);
    await ready(page);
    await context.setOffline(true);
    await page.reload();
    await ready(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(375);
    await page.getByRole("button", { name: "开始冒险", exact: true }).tap();
    await page.waitForTimeout(500);
    const { size, route } = await readBoard(page);
    const cdp = await context.newCDPSession(page);
    let previous = await center(page, 0, size);
    for (const edge of route) {
      const next = await center(page, edge.cell, size);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ ...previous, id: 1 }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ ...next, id: 1 }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      previous = next;
    }
    await expect(page.getByRole("dialog")).toContainText("找到胡萝卜啦");
    await page.getByRole("button", { name: "再来一次冒险" }).tap();
    await page.screenshot({
      path: "test-results/offline-phone.png",
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test("insecure addresses and development previews report online-only mode", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(status(page)).toHaveAttribute("data-stage", "development");
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    ),
  ).toBe(0);
  const insecure = await context.newPage();
  await insecure.addInitScript(() =>
    Object.defineProperty(window, "isSecureContext", { value: false }),
  );
  await insecure.goto("/");
  await expect(status(insecure)).toHaveAttribute("data-stage", "unsupported");
  await expect(status(insecure)).toContainText("HTTPS 或 localhost");
});
