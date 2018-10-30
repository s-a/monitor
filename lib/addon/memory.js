var os = require('os')
var pm2 = require('pm2')
var moment = require('moment')
const path = require('path')
const findRoot = require('find-root')
const si = require('systeminformation')

function Memory(message) {
  this.message = message
  this.pm2 = pm2
  return this
}

Memory.prototype.init = function () {
  this.init2()
}

Memory.prototype.init2 = function () {
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
    data.computername = os.hostname()
    data.sender = 'SYSTEM-MEMORY'
    data.name = 'MEMORY'
    const free_in_percent = data.available / data.used * 100 // e.status === 'online' ? 'success' : 'danger'
    data.valid_state = 'success'
    if (free_in_percent < 50) {
      data.valid_state = 'warning'
    }
    if (free_in_percent < 30) {
      data.valid_state = 'danger'
    }
    self.message(null, data)
  })
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};

Memory.prototype.start = function () {
  var self = this
  setInterval(function () {
    self.init2()
  }, 30 * 1000)
}

Memory.prototype.stop = function () {
  this.pm2.close()
}

module.exports = Memory