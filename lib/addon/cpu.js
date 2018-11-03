const si = require('systeminformation')
const Addon = require('./../Addon.js');

class CPU extends Addon {
  constructor(slave) {
    super(slave, 'CPU');
  }
}

CPU.prototype.report = function () {
  var self = this
  return new Promise(async function (resolve, reject) {
    const result = []
    const data = await si.currentLoad()
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

    result.push(data)

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

      result.push(cpu)
    }

    resolve(result)
  });
}

module.exports = CPU