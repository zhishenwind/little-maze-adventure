import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Use the lockfile-pinned local CLI on every platform, without changing global settings.
const cli = fileURLToPath(
  new URL(
    "../node_modules/@fission-ai/openspec/bin/openspec.js",
    import.meta.url,
  ),
);
const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    OPENSPEC_TELEMETRY: process.env.OPENSPEC_TELEMETRY ?? "0",
  },
});
child.on("error", (error) => {
  console.error(`OpenSpec 启动失败：${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
