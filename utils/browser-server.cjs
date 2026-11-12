const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createApp } = require('../server')
const { createShop } = require('../server/shop')

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'common-ground-browser-'))
const server = createApp(createShop(path.join(directory, 'shop.json'))).listen(3107, '127.0.0.1')
function close() {
  server.close(() => {
    fs.rmSync(directory, { recursive: true, force: true })
    process.exit(0)
  })
}
process.on('SIGTERM', close)
process.on('SIGINT', close)
