import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup/env.js"],
    testTimeout: 25000,
    hookTimeout: 25000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.js"],
      exclude: [
        "src/config/**",
        "src/server.js",
        "src/prisma.config.ts",
      ],
    },
  },
});
