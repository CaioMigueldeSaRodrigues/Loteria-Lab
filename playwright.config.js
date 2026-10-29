import {defineConfig} from "@playwright/test";

export default defineConfig({
  testDir:"./tests",
  testMatch:"**/*.e2e.js",
  timeout:30_000,
  expect:{timeout:10_000},
  use:{baseURL:"http://127.0.0.1:5173",browserName:"chromium",trace:"retain-on-failure",screenshot:"only-on-failure"},
  reporter:[["list"],["html",{open:"never",outputFolder:"playwright-report"}]],
  webServer:{command:"npm run dev",url:"http://127.0.0.1:5173",reuseExistingServer:!process.env.CI,timeout:30_000},
  workers:process.env.CI?2:undefined
});
