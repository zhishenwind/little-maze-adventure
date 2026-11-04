import { test as base, expect } from "@playwright/test";
import { offlineServer } from "./helpers/offline-server";
import { center, keys, readBoard } from "./helpers/maze";

const test = base.extend<{
  pagesServer: Awaited<ReturnType<typeof offlineServer>>;
}>({
  pagesServer: async ({}, use) => {
    const server = await offlineServer({
      directory: "dist-pages",
      base: "/little-maze-adventure/",
    });
    try { await use(server); } finally { await server.close(); }
  },
});

test("Pages build loads compiled resources, photo and manifest under the repository path", async ({ page, pagesServer }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const response = await page.goto(pagesServer.url);
  const html = await response!.text();
  expect(html).not.toContain("/src/main.tsx");
  expect(html).toContain('/little-maze-adventure/assets/');
  await expect(page.getByRole("heading", { level: 1 })).toContainText("小小迷宫");
  await expect(page.getByTestId("offline-status")).toHaveAttribute("data-stage", "ready");
  await page.getByRole("button", { name: "小牛伊一", exact: true }).click();
  const photo = await page.locator(".player image").getAttribute("href");
  expect(new URL(photo!, pagesServer.url).pathname).toMatch(/^\/little-maze-adventure\/assets\/yiyi-avatar/);
  await page.evaluate(async (url) => { const image = new Image(); image.src = url!; await image.decode(); }, photo);
  const manifestUrl = await page.locator('link[rel="manifest"]').evaluate((e) => (e as HTMLLinkElement).href);
  const manifest = await (await page.request.get(manifestUrl)).json();
  for (const field of ["id", "start_url", "scope"])
    expect(new URL(manifest[field], manifestUrl).href).toBe(pagesServer.url);
  expect(new URL(manifest.icons[0].src, manifestUrl).href).toBe(pagesServer.url + "favicon.svg");
  const resources = await page.locator('script[src], link[rel="stylesheet"], link[rel="icon"]').evaluateAll((elements) =>
    elements.map((e) => e.getAttribute("src") ?? e.getAttribute("href")));
  expect(resources.every((url) => url!.startsWith("/little-maze-adventure/"))).toBe(true);
  expect(errors).toEqual([]);
});

test("Pages offline scope stays within its directory and an offline new tab can finish a maze", async ({ page, context, pagesServer }) => {
  await page.goto(pagesServer.url);
  await expect(page.getByTestId("offline-status")).toHaveAttribute("data-stage", "ready");
  const scopes = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((r) => r.scope));
  expect(scopes).toEqual([pagesServer.url]);
  const outside = await page.evaluate(async () => {
    const response = await fetch("/another-app/");
    return { status: response.status, text: await response.text() };
  });
  expect(outside).toEqual({ status: 404, text: "Outside application path" });
  const other = await context.newPage();
  const otherResponse = await other.goto(new URL("/another-app/", pagesServer.url).href);
  expect(otherResponse!.status()).toBe(404);
  await expect(other.getByTestId("maze")).toHaveCount(0);
  await other.close();
  const entries = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (name) =>
    (await (await caches.open(name)).keys()).map((request) => request.url)))).flat());
  expect(entries.length).toBe(pagesServer.manifest.length);
  expect(entries.every((url) => url.startsWith(pagesServer.url))).toBe(true);
  await context.setOffline(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(pagesServer.url);
  await expect(reopened.getByTestId("offline-status")).toContainText("正在离线游玩");
  await reopened.getByRole("button", { name: /勇敢探索/ }).click();
  await reopened.getByRole("button", { name: "梦幻星空", exact: true }).click();
  await reopened.getByRole("button", { name: "小牛伊一", exact: true }).click();
  const { route } = await readBoard(reopened);
  await reopened.getByRole("button", { name: "给我一点提示" }).click();
  await expect(reopened.locator(".hint-line")).toBeAttached();
  for (const edge of route) await reopened.keyboard.press(keys[edge.direction]);
  await expect(reopened.getByRole("dialog")).toContainText("找到蝴蝶啦");
  await expect(reopened.locator(".collection strong")).toHaveText("3");
});

test("Pages mobile cached build supports touch walls, release and resume through victory", async ({ browser, pagesServer }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto(pagesServer.url);
    await expect(page.getByTestId("offline-status")).toHaveAttribute("data-stage", "ready");
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: "小牛伊一", exact: true }).tap();
    await page.getByRole("button", { name: "开始冒险", exact: true }).tap();
    const { size, route } = await readBoard(page);
    const cdp = await context.newCDPSession(page);
    let previous = await center(page, 0, size);
    const cellPixels = await page.getByTestId("maze").evaluate((e) => 52 * (e as unknown as SVGSVGElement).getScreenCTM()!.a);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...previous, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: previous.x, y: previous.y - cellPixels, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByTestId("maze")).toHaveAttribute("data-position", "0");
    for (const edge of route) {
      const next = await center(page, edge.cell, size);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...previous, id: 1 }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...next, id: 1 }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect(page.getByTestId("maze")).toHaveAttribute("data-position", String(edge.cell));
      previous = next;
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await expect(page.getByRole("dialog")).toContainText("找到蝴蝶啦");
    await page.screenshot({ path: "test-results/pages-mobile.png", fullPage: true });
  } finally { await context.close(); }
});
