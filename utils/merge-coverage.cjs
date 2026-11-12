const fs = require('node:fs')
const path = require('node:path')
const { createCoverageMap } = require('istanbul-lib-coverage')
const { createContext } = require('istanbul-lib-report')
const reports = require('istanbul-reports')

const root = path.resolve(__dirname, '..')
const coverage = createCoverageMap({})
for (const suite of ['unit', 'browser']) {
  const filename = path.join(root, 'coverage', suite, 'coverage-final.json')
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'))
  if (!Object.keys(data).length) throw new Error(`No ${suite} coverage was collected`)
  for (const [filename, entry] of Object.entries(data)) {
    const absolute = path.resolve(root, filename)
    coverage.addFileCoverage({ ...entry, path: absolute })
  }
}
const expected = [
  ...fs.readdirSync(path.join(root, 'server')).filter(file => file.endsWith('.js')).map(file => `server/${file}`),
  ...fs.readdirSync(path.join(root, 'client/src')).filter(file => /\.jsx?$/.test(file)).map(file => `client/src/${file}`),
]
for (const file of expected) {
  if (!coverage.files().includes(path.join(root, file))) {
    throw new Error(`Application source missing from coverage: ${file}`)
  }
}
const context = createContext({ dir: path.join(root, 'coverage/merged'), coverageMap: coverage })
for (const name of ['html', 'lcovonly', 'json', 'json-summary', 'text-summary']) {
  reports.create(name).execute(context)
}
console.log('Merged coverage includes every server module and client JavaScript source.')
