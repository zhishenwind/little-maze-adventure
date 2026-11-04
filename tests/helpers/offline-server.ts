import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";

/** Real HTTP server: Playwright routing cannot simulate fetch failures made by a Service Worker. */
export async function offlineServer(options: { directory?: string; base?: string } = {}) {
  const root = resolve(options.directory ?? "dist");
  const base = options.base ?? "/";
  if (!base.startsWith("/") || !base.endsWith("/"))
    throw new Error("Fixture base must start and end with a slash");
  const originalWorker = await readFile(resolve(root, "sw.js"), "utf8");
  const start = originalWorker.indexOf('[{"url":');
  const end = originalWorker.indexOf("}]", start) + 2;
  if (start < 0 || end <= start)
    throw new Error("Build the production offline package before these tests.");
  const manifestText = originalWorker.slice(start, end);
  const manifest = JSON.parse(manifestText) as {
    url: string;
    revision: string;
  }[];
  const state = { version: 1, failResource: false, requests: [] as string[] };
  const types: Record<string, string> = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webmanifest": "application/manifest+json",
  };
  const server = createServer(async (request, response) => {
    const url = new URL(request.url!, "http://localhost");
    state.requests.push(`${request.method} ${url.pathname}`);
    response.setHeader("Cache-Control", "no-store"); // Only the Worker, not HTTP cache, may make tests pass.
    if (!url.pathname.startsWith(base)) {
      response.writeHead(404);
      response.end("Outside application path");
      return;
    }
    const pathname = "/" + url.pathname.slice(base.length);
    if (pathname.startsWith("/api/") || pathname === "/sdk.json") {
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({ source: "network", method: request.method }),
      );
      return;
    }
    if (state.failResource && pathname === "/favicon.svg") {
      response.writeHead(503);
      response.end("Offline package download interrupted");
      return;
    }
    const name =
      pathname === "/"
        ? "index.html"
        : decodeURIComponent(pathname).slice(1);
    const file = resolve(root, name);
    if (!file.startsWith(root + "/")) {
      response.writeHead(403);
      response.end();
      return;
    }
    try {
      let data: string | Buffer = await readFile(file);
      if (name === "sw.js" && state.version > 1) {
        const next = manifest.map((entry) => ({
          ...entry,
          revision: `${entry.revision}-release-${state.version}`,
        }));
        data = originalWorker.replace(manifestText, JSON.stringify(next));
      } else if (name === "index.html") {
        data = data
          .toString()
          .replace(
            "</head>",
            `<meta name="test-release" content="${state.version}"></head>`,
          );
      }
      response.setHeader(
        "Content-Type",
        types[extname(file)] ?? "application/octet-stream",
      );
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing fixture server address");
  return {
    url: `http://127.0.0.1:${address.port}${base === "/" ? "" : base}`,
    state,
    manifest,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
