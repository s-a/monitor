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


PM2Client.prototype.bundleMessage = function (pm2Process) {
  const pm2_env = pm2Process.pm2_env
  const monit = pm2Process.monit
  let pkg
  try {
    root = findRoot(pm2_env.pm_exec_path)
    pkg = require(path.join(root, 'package.json'))
  } catch (e) {}

  let name = pm2_env.name
  const data = {
    computername: os.hostname(),
    sender: 'PM2',
    name: name,
    icon: 'fas fa-paper-plane',
    up: moment(pm2_env.pm_uptime).calendar(),
    cpu: monit.cpu + '%',
    memory: formatBytes(monit.memory),
    text: (pkg ? `v${pkg.version}` : '') + ' ' + pm2_env.status + ' - MEM: ' + formatBytes(monit.memory),
    restarts: pm2_env.restart_time,
    valid_state: pm2_env.status === 'online' ? 'success' : 'danger',
    process: pm2Process,
    package_json: pkg
  }
  return data
}

PM2Client.prototype.init = function () {
  var self = this
  pm2.list('', function (err, info) {
    for (let i = 0; i < info.length; i++) {
      const pm2Process = info[i]
      const data = self.bundleMessage(pm2Process)
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
        const data = self.bundleMessage(processList[0])
        self.slave.broadcast(data)
      })
    });
    bus.on('process:*', function (a, b) {
      // Send emails
      var e = b.process
      pm2.list(e.name, function (err, processList) {
        const data = self.bundleMessage(processList[0])
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