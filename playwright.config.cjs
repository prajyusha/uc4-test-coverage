const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3107',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  globalSetup: require.resolve('./tests/browser/global-setup.cjs'),
  globalTeardown: require.resolve('./tests/browser/global-teardown.cjs'),
  webServer: {
    command: 'node utils/browser-server.cjs',
    url: 'http://127.0.0.1:3107/api/health',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
