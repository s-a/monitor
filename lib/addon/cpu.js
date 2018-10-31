var os = require('os')
var pm2 = require('pm2')
const si = require('systeminformation')

function CPU(message) {
  this.message = message
  this.pm2 = pm2
  return this
}

CPU.prototype.init = function () {
  this.init2()
}

CPU.prototype.init2 = function () {
  var self = this
  si.currentLoad().then(data => {
    /* for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const element = data[key]
        if (typeof element === 'number') {
          data[key] = formatBytes(data[key])
        }
      }
    } */
    data.computername = os.hostname()
    data.sender = 'SYSTEM'
    data.name = 'CPU'
    data.icon = 'fas fa-microchip'
    data.text = Math.round(data.currentload) + '% current load'
    data.valid_state = 'success'
    if (data.currentload > 60) {
      data.valid_state = 'warning'
    }
    if (data.currentload > 90) {
      data.valid_state = 'danger'
    }
    self.message(null, data)
  })
}

CPU.prototype.start = function () {
  var self = this
  setInterval(function () {
    self.init2()
  }, 30 * 1000)
  self.init2()
}

CPU.prototype.stop = function () {
  this.pm2.close()
}

module.exports = CPU