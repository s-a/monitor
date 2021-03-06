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
    const result = (process.env[`REFRESH_INTERVAL_${addonName}`] || process.env.DEFAULT_REFRESH_INTERVAL || superDefault)
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

  async renderReport(sender) {
    const needRefresh = (sender === 'TIMER' || (this.cache === undefined || this.cache === null))
    if (needRefresh) {
      this.log.info('execute', this.name, 'by', sender)
      this.cache = await this.report(sender)
    }
    return this.cache
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
      const rpt = await self.renderReport('TIMER')
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