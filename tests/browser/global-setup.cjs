const fs = require('node:fs')
module.exports = async () => {
  fs.rmSync('coverage/browser', { recursive: true, force: true })
}
