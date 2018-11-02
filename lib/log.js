var path = require('path');

function Log() {
  const bunyan = require('bunyan')
  const bformat = require('bunyan-format')
  const formatOut = bformat({
    outputMode: 'long'
  })
  const pkg = require(path.join(__dirname, '../package.json'))

  const logOptions = {
    level: process.env.LOG_LEVEL || 'info',
    name: `Monitor slave v${pkg.version}`,
    src: true,
    stream: formatOut
  }
  return bunyan.createLogger(logOptions)
}

module.exports = Log