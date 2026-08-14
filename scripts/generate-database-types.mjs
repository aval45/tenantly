import { spawnSync } from "node:child_process";
import { renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const outputPath = resolve("src/shared/api/database.types.ts");
const temporaryPath = resolve(dirname(outputPath), ".database.types.ts.tmp");
const executable = process.platform === "win32" ? "supabase.cmd" : "supabase";
const result = spawnSync(
  executable,
  ["gen", "types", "typescript", "--local"],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  },
);

if (result.status !== 0 || !result.stdout.includes("export type Json")) {
  rmSync(temporaryPath, { force: true });
  process.stderr.write(
    result.stderr ||
      result.stdout ||
      "Supabase did not return database types.\n",
  );
  process.exit(result.status ?? 1);
}

writeFileSync(temporaryPath, result.stdout, "utf8");
renameSync(temporaryPath, outputPath);
process.stdout.write(`Generated ${outputPath}\n`);
