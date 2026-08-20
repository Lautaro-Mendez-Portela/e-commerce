const { spawnSync } = require("node:child_process");

const compose = (args) => {
  return spawnSync("docker", ["compose", "--profile", "test", ...args], {
    stdio: "inherit",
  });
};

let exitCode = 1;

try {
  const result = compose([
    "up",
    "--build",
    "--abort-on-container-exit",
    "--exit-code-from",
    "backend-test",
    "backend-test",
  ]);

  exitCode = result.status ?? 1;
} finally {
  compose(["stop", "postgres-test", "backend-test"]);
}

process.exit(exitCode);
