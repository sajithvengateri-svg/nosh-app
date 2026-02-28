import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
      teardown: "teardown",
    },
    {
      name: "teardown",
      testMatch: /global-teardown\.ts/,
    },
    {
      name: "chrome-desktop",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "chrome-mobile",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },
    {
      name: "safari",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run dev:web",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    cwd: "../..",
    timeout: 60_000,
  },
});
