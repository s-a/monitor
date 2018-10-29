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

PM2Client.prototype.start = function () {
  var self = this
  this.pm2.launchBus(function (err, bus) {
    bus.on('log:err', function (exception) {
      // Send emails
      pm2.list(exception.process.name, function (err, processList) {
        console.log('error', exception)
        const root = findRoot(processList[0].pm2_env.pm_exec_path)
        const pkg = require(path.join(root, 'package.json'))
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
        console.log(error)
        self.message(error, null)
      })
    });
    bus.on('process:*', function (a, b) {
      // Send emails
      var e = b.process
      pm2.list(e.name, function (err, info) {
        const root = findRoot(info[0].pm2_env.pm_exec_path)
        console.log(path.join(root, 'package.json'))
        const data = {
          computername: e.COMPUTERNAME,
          sender: 'PM2',
          name: e.name,
          status: e.status,
          up_since: moment(e.pm_uptime).calendar(),
          restarts: e.restart_time,
          valid_state: e.status === 'online' ? 'success' : 'danger'
        }
        console.log('process', data)
        self.message(null, data)
      })
    });
  });
}

PM2Client.prototype.init = function () {
  var self = this
  pm2.list(function (err, processList) {
    const root = findRoot(processList[0].pm2_env.pm_exec_path)
    const pkg = require(path.join(root, 'package.json'))
    const info = {
      sender: 'PM2',
      computername: os.hostname(),
      status: processList[0].pm2_env.status,
      name: pkg.name,
      pm_id: processList[0].pm2_env.pm_id,
      package: pkg,
      valid_state: processList[0].pm2_env.status === 'online' ? 'success' : 'danger'
    }
    self.message(info, null)
  })
}

PM2Client.prototype.stop = function () {
  this.pm2.close()
}

module.exports = PM2Client