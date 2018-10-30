var os = require('os')
var pm2 = require('pm2')
var moment = require('moment')
const path = require('path')
const findRoot = require('find-root')

function PM2Client(message) {
  this.message = message
  this.pm2 = pm2
  return this
}

PM2Client.prototype.init = function () {
  var self = this
  pm2.list('', function (err, info) {
    for (let i = 0; i < info.length; i++) {
      const nfo = info[i]

      const data = {
        computername: os.hostname(),
        sender: 'PM2',
        name: nfo.pm2_env.name,
        status: nfo.pm2_env.status,
        up_since: moment(nfo.pm2_env.pm_uptime).calendar(),
        restarts: nfo.pm2_env.restart_time,
        valid_state: nfo.pm2_env.status === 'online' ? 'success' : 'danger'
      }
      self.message(null, data)
    }
  })
}

PM2Client.prototype.start = function () {
  var self = this
  if (self.busLaunched) {
    return
  }
  self.busLaunched = true
  this.pm2.launchBus(function (err, bus) {
    bus.on('log:err', function (exception) {
      // Send emails
      pm2.list(exception.process.name, function (err, processList) {
        const root = null
        const pkg = null
        try {
          root = findRoot(processList[0].pm2_env.pm_exec_path)
          pkg = require(path.join(root, 'package.json'))
        } catch (e) {
          pkg = {}
        }
        const error = {
          sender: 'PM2',
          computername: os.hostname(),
          status: 'error',
          name: pkg.name,
          pm_id: exception.process.pm_id,
          package: pkg,
          exception: exception,
          err: err,
          valid_state: 'danger'
        }
        self.message(error, null)
      })
    });
    bus.on('process:*', function (a, b) {
      // Send emails
      var e = b.process
      pm2.list(e.name, function (err, info) {
        const data = {
          computername: os.hostname(),
          sender: 'PM2',
          name: e.name,
          status: e.status,
          up_since: moment(e.pm_uptime).calendar(),
          restarts: e.restart_time,
          valid_state: e.status === 'online' ? 'success' : 'danger'
        }
        self.message(null, data)
      })
    });
  });
}

PM2Client.prototype.stop = function () {
  this.pm2.close()
}

module.exports = PM2Client