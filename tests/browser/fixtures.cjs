const base = require('@playwright/test')
const { CoverageReport } = require('monocart-coverage-reports')
const options = require('./coverage-options.cjs')

const test = base.test.extend({
  browserCoverage: [async ({ page }, use) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false })
    try {
      await use()
    } finally {
      const coverage = await page.coverage.stopJSCoverage()
      await new CoverageReport(options).add(coverage)
    }
  }, { auto: true }],
})
module.exports = { test, expect: base.expect }
