var os = require('os')
var pm2 = require('pm2')
var moment = require('moment')
const path = require('path')
const findRoot = require('find-root')
const readLastLines = require('read-last-lines')
const Addon = require('./../Addon.js');

class PM2Client extends Addon {

  constructor(slave) {
    super(slave, 'PM2');
    this.pm2 = pm2
  }

}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};


PM2Client.prototype.bundleMessage = async function (pm2Process) {
  const pm2_env = pm2Process.pm2_env
  const monit = pm2Process.monit
  const logPath = pm2Process.pm2_env.pm_out_log_path
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

  const errorLog = await readLastLines.read(logPath, 50)
  var justText = errorLog.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  data.log = justText.split('\n')
  return data
}

PM2Client.prototype.report = function ( /* state */ ) {
  var self = this
  return new Promise(function (resolve, reject) {
    pm2.list('', async function (err, processList) {
      if (err) {
        reject(err)
      }
      const result = []
      for (let i = 0; i < processList.length; i++) {
        const pm2Process = processList[i]
        const data = await self.bundleMessage(pm2Process)
        result.push(data)
      }
      resolve(result)
    })
  });
}

PM2Client.prototype.start = async function () {
  var self = this
  this.pm2.launchBus(function (err, bus) {
    bus.on('log:err', function (exception) {
      // Send emails
      pm2.list(exception.process.name, async function (err, processList) {
        const data = await self.bundleMessage(processList[0])
        self.broadcast(data)
      })
    });
    bus.on('process:*', function (a, b) {
      // Send emails
      var e = b.process
      pm2.list(e.name, async function (err, processList) {
        const data = await self.bundleMessage(processList[0])
        self.broadcast(data)
      })
    });
  });
  /*   const rpt = await self.report()
    await self.broadcast(rpt) */
}

PM2Client.prototype.stop = function () {
  this.pm2.close()
}

module.exports = PM2Client