var os = require('os')
var pm2 = require('pm2')
var moment = require('moment')
const path = require('path')
const findRoot = require('find-root')

function PM2Client() {
  this.pm2 = pm2
  return this
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};


PM2Client.prototype.init = function () {
  var self = this
  pm2.list('', function (err, info) {
    for (let i = 0; i < info.length; i++) {
      const nfo = info[i]
      const status = nfo.pm2_env.status
      const data = {
        computername: os.hostname(),
        sender: 'PM2',
        name: nfo.pm2_env.name,
        icon: 'fas fa-paper-plane',
        text: status + ': ' + moment(nfo.pm2_env.pm_uptime).calendar() + ' - MEM: ' + formatBytes(nfo.monit.memory) + ' - CPU: ' + nfo.monit.cpu + '%',
        up_since: moment(nfo.pm2_env.pm_uptime).calendar(),
        restarts: nfo.pm2_env.restart_time,
        valid_state: status === 'online' ? 'success' : 'danger'
      }
      self.slave.broadcast(data)
    }
  })
}

PM2Client.prototype.start = function (slave) {
  this.slave = slave
  var self = this
  if (self.busLaunched) {
    return
  }
  self.busLaunched = true
  this.pm2.launchBus(function (err, bus) {
    bus.on('log:err', function (exception) {
      // Send emails
      pm2.list(exception.process.name, function (err, processList) {
        let root = null
        let pkg = null
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
          text: err.toString(),
          valid_state: 'danger'
        }
        self.slave.broadcast(error)
      })
    });
    bus.on('process:*', function (a, b) {
      // Send emails
      var e = b.process
      pm2.list(e.name, function (err, info) {
        const status = e.status
        const nfo = info[0]
        const data = {
          computername: os.hostname(),
          sender: 'PM2',
          name: e.name,
          text: status + ': ' + moment(nfo.pm2_env.pm_uptime).calendar() + ' - MEM: ' + formatBytes(nfo.monit.memory) + ' - CPU: ' + nfo.monit.cpu + '%',
          up_since: moment(e.pm_uptime).calendar(),
          text: 'Last start ' + moment(e.pm_uptime).calendar(),
          restarts: e.restart_time,
          valid_state: e.status === 'online' ? 'success' : 'danger'
        }
        self.slave.broadcast(data)
      })
    });
  });

  this.interval = setInterval(function () {
    self.init()
  }, (process.env.PM2_REFRESH_INTERVAL || process.env.REFRESH_INTERVAL) * 1000)
}

PM2Client.prototype.stop = function () {
  clearInterval(this.interval)
  this.pm2.close()
}

module.exports = PM2Client