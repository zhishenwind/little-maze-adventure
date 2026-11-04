import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

/** Compile the worker alongside the app, then inject revisions of the actual build output. */
export function offlineBuild(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "maze-offline-build",
    apply: "build",
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    buildStart() {
      this.emitFile({
        type: "chunk",
        id: resolve(config.root, "src/sw.js"),
        fileName: "sw.js",
      });
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const resources = new Map<string, string>();
        const revision = (data: string | Uint8Array) =>
          createHash("sha256").update(data).digest("hex");
        const allowed = /\.(?:html|js|css|svg|png|ico|webmanifest|woff2?)$/;
        for (const [name, file] of Object.entries(bundle)) {
          if (name === "sw.js" || !allowed.test(name)) continue;
          resources.set(
            name,
            revision(file.type === "chunk" ? file.code : file.source),
          );
        }
        // Vite copies public/ without putting these files in the bundle object.
        const publicFiles = (directory: string, prefix = "") => {
          for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const name = prefix + entry.name;
            if (entry.isDirectory())
              publicFiles(join(directory, entry.name), name + "/");
            else if (
              entry.isFile() &&
              allowed.test(name) &&
              !resources.has(name)
            )
              resources.set(
                name,
                revision(readFileSync(join(directory, entry.name))),
              );
          }
        };
        if (config.publicDir) publicFiles(config.publicDir);
        const worker = bundle["sw.js"];
        if (
          !worker ||
          worker.type !== "chunk" ||
          !worker.code.includes("__MAZE_PRECACHE_MANIFEST__")
        )
          this.error("Offline worker or precache injection point is missing");
        const manifest = [...resources]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([url, revision]) => ({ url, revision }));
        if (!resources.has("index.html"))
          this.error("Offline package is missing index.html");
        worker.code = worker.code.replace(
          "__MAZE_PRECACHE_MANIFEST__",
          JSON.stringify(manifest),
        );
      },
    },
  };
}
