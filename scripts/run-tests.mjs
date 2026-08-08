import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outputDirectory = ".test-dist";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

rmSync(outputDirectory, { recursive: true, force: true });

let status = 1;
try {
  status = run("tsc", ["-p", "tsconfig.test.json"]);
  if (status !== 0) process.exitCode = status;
  else {
    const testDirectory = join(outputDirectory, "src", "lib");
    const testFiles = readdirSync(testDirectory)
      .filter((file) => file.endsWith(".test.js"))
      .map((file) => join(testDirectory, file));
    status = run(process.execPath, ["--test", ...testFiles]);
    process.exitCode = status;
  }
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
}
