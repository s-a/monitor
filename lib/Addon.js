var schedule = require('node-schedule')
var cronstrue = require('cronstrue');

class Addon {
  constructor(slave, addonName) {
    this.name = addonName.toUpperCase();
    this.slave = slave
    this.log = slave.log
  }

  env(addonName) {
    const superDefault = '0 */5 * * * *'
    const result = (process.env[`MONITOR_REFRESH_CRON_EXPRESSION_${addonName}`] || process.env.DEFAULT_MONITOR_REFRESH_CRON_EXPRESSION || superDefault)
    return result
  }

  humanReadableCronExpression() {
    const cronExpression = this.env(this.name)
    const cronExpressionHumanReadable = cronstrue.toString(cronExpression, {
      use24HourTimeFormat: true,
      dayOfWeekStartIndexZero: false
    })
    return cronExpressionHumanReadable
  }

  cronExpression() {
    return this.env(this.name)
  }

  broadcast(message) {
    for (let i = 0; i < message.length; i++) {
      message[i].CRON_EXPRESSION = this.cronExpression()
      message[i].CRON_EXPRESSION_TEXT = this.humanReadableCronExpression()
    }
    this.slave.broadcast(message)
  }

  async launchTransporter() {
    const self = this

    const cronExpression = this.cronExpression()
    const cronExpressionHumanReadable = cronstrue.toString(cronExpression, {
      use24HourTimeFormat: true,
      dayOfWeekStartIndexZero: false
    })
    this.log.info('Schedule', self.name, cronExpressionHumanReadable);
    this.schedule = schedule.scheduleJob(cronExpression, (async function () {
      this.log.info('run', self.name, 'report', cronExpressionHumanReadable);
      const rpt = await self.report('TIMER')
      self.broadcast(rpt)
    }).bind(this));
  }

  destroy() {
    this.log.info('Teardown addon', this.name)
    this.schedule.cancel()
    if (this.stop) {
      this.stop()
    }
  }
}

module.exports = Addon