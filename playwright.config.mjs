import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";
const frontendUrl = new URL(baseURL);
const frontendPort = frontendUrl.port || "5173";
const shouldStartWebServer = process.env.E2E_SKIP_WEB_SERVER !== "true";

const config = {
  testDir: "./e2e",
  timeout: 30000,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
};

if (shouldStartWebServer) {
  config.webServer = {
    command:
      `node frontend/node_modules/vite/bin/vite.js frontend --host 127.0.0.1 --port ${frontendPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_URL: process.env.E2E_API_URL || "http://127.0.0.1:3000",
    },
  };
}

export default defineConfig(config);
