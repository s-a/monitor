var pm2 = require('pm2')
const si = require('systeminformation')

function CPU() {
  this.pm2 = pm2
  return this
}

CPU.prototype.init = function () {
  this.fetchData()
}

CPU.prototype.fetchData = function () {
  var self = this
  si.currentLoad().then(data => {
    data.name = 'CPU'
    data.icon = 'fas fa-microchip'
    data.text = Math.round(data.currentload) + '% load'
    data.valid_state = 'success'
    if (data.currentload > 60) {
      data.valid_state = 'warning'
    }
    if (data.currentload > 90) {
      data.valid_state = 'danger'
    }
    self.slave.broadcast(data)

    for (let i = 0; i < data.cpus.length; i++) {
      const cpu = data.cpus[i]
      cpu.name = 'CPU #' + (i + 1)
      cpu.icon = 'fas fa-microchip'
      cpu.text = Math.round(cpu.load) + '% load'
      cpu.valid_state = 'success'
      if (cpu.load > 60) {
        cpu.valid_state = 'warning'
      }
      if (cpu.load > 90) {
        cpu.valid_state = 'danger'
      }
      self.slave.broadcast(cpu)

    }
  })
}

CPU.prototype.start = function (slave) {
  this.slave = slave
  var self = this
  this.interval = setInterval(function () {
    self.fetchData()
  }, (process.env.CPU_REFRESH_INTERVAL || process.env.REFRESH_INTERVAL) * 1000)
  self.fetchData()
}

CPU.prototype.stop = function () {
  clearInterval(this.interval)
}

module.exports = CPU