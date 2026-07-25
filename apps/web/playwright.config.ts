import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile-320-chromium", use: { ...devices["Desktop Chrome"],viewport:{width:320,height:700},isMobile:true,hasTouch:true } },
    { name: "mobile-360-webkit", use: { ...devices["iPhone 13"],viewport:{width:360,height:780} } },
    { name: "mobile-375-chromium", use: { ...devices["Pixel 7"],viewport:{width:375,height:800} } },
    { name: "mobile-390-webkit", use: { ...devices["iPhone 13"],viewport:{width:390,height:844} } },
    { name: "mobile-412-firefox", use: { ...devices["Desktop Firefox"],viewport:{width:412,height:915} } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});
