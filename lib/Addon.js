class Addon {
  constructor(slave, addonName) {
    this.name = addonName.toUpperCase();
    this.slave = slave
    this.log = slave.log
  }

  env(transporterName, addonName) {
    const superDefault = 60
    const result = (process.env[`REFRESH_INTERVAL_${addonName}`] || process.env.DEFAULT_REFRESH_INTERVAL || superDefault) * 1000
    return result
  }

  broadcast(message) {
    this.slave.broadcast(message)
  }

  async launchTransporter() {
    const self = this
    if (this.report) {
      this.intervalPointer = setInterval(async function () {
        const rpt = await self.report('TIMER')
        self.broadcast(rpt)
      }, self.env('WEB', self.name))
    }
  }

  destroy() {
    this.log.info('Teardown addon', this.name)
    clearInterval(this.intervalPointer)
    if (this.stop) {
      this.stop()
    }
  }
}

module.exports = Addon