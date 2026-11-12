const { CoverageReport } = require('monocart-coverage-reports')
const options = require('./coverage-options.cjs')

module.exports = async () => {
  await new CoverageReport(options).generate()
}
