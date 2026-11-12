module.exports = {
  name: 'Common Ground browser coverage',
  outputDir: 'coverage/browser',
  reports: ['html', 'lcovonly', 'json', 'json-summary'],
  entryFilter: entry => entry.url.includes('/assets/') && entry.url.endsWith('.js'),
  sourcePath: filePath => {
    const normalized = filePath.replaceAll('\\', '/')
    const match = normalized.match(/(?:^|\/)src\/(.+)$/)
    return match ? `client/src/${match[1]}` : normalized
  },
  sourceFilter: filePath => /^client\/src\/.*\.[jt]sx?$/.test(filePath),
}
