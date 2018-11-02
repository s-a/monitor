var os = require('os')
var pm2 = require('pm2')
const si = require('systeminformation')
const SlaveMessage = require('../slave-message.js')

function Memory(message) {
  this.message = message
  this.pm2 = pm2
  return this
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};

Memory.prototype.init = function () {
  this.fetchData()
}

Memory.prototype.fetchData = function () {
  var self = this
  si.mem().then(data => {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key]
        if (typeof element === 'number') {
          data[key] = formatBytes(data[key])
        }
      }
    }

    data.name = 'MEMORY'
    data.icon = 'fas fa-memory'
    data.text = (data.free) + ' free'
    const free_in_percent = data.available / data.used * 100
    data.valid_state = 'success'
    if (free_in_percent < 50) {
      data.valid_state = 'warning'
    }
    if (free_in_percent < 30) {
      data.valid_state = 'danger'
    }
    self.slave.broadcast(data)
  })
}


Memory.prototype.start = function (slave) {
  this.slave = slave
  var self = this
  this.interval = setInterval(function () {
    self.fetchData()
  }, (process.env.MEMORY_REFRESH_INTERVAL || process.env.REFRESH_INTERVAL) * 1000)
  self.fetchData()
}

Memory.prototype.stop = function () {
  clearInterval(this.interval)
}

module.exports = Memory