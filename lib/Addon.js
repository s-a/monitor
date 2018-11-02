class Addon {
  constructor(slave, addonName) {
    this.name = addonName.toUpperCase();
    this.slave = slave
    this.log = slave.log
    this.transporters = {
      'WEB': {
        interval: this.env('WEB', addonName),
        intervalPointer: null
      }
    }
  }

  env(transporterName, addonName) {
    const result = (process.env[`${transporterName}_REFRESH_INTERVAL_${addonName}`] || process.env[`DEFAULT_REFRESH_INTERVAL_${addonName}`] || process.env[`DEFAULT_REFRESH_INTERVAL`] || 60) * 1000
    return result
  }

  broadcast(message) {
    this.slave.broadcast(message)
  }

  launchTransporter(name, fn) {
    this.transporters[name].intervalPointer = setInterval(fn.bind(this), this.transporters[name].interval)
  }

  destroy() {
    this.log.info('Teardown addon', this.name)
    clearInterval(this.transporters.WEB.intervalPointer)
    if (this.stop) {
      this.stop()
    }
  }
}

module.exports = Addon