const {
  IncomingWebhook
} = require('@slack/client');
var schedule = require('node-schedule')
var cronstrue = require('cronstrue');
var path = require('path');
var os = require('os');
var fs = require('fs');
const Handlebars = require('handlebars')

function SlackTransporter(master) {
  this.master = master
  this.log = master.log
  return this
}

SlackTransporter.prototype.init = function () {
  this.cronExpression = (process.env.SLACK_REFRESH_INTERVAL || process.env.DEFAULT_REFRESH_INTERVAL || "0 */5 * * * *")
  this.cronExpressionHumanReadable = cronstrue.toString(this.cronExpression, {
    use24HourTimeFormat: true,
    dayOfWeekStartIndexZero: false
  })

  this.log.info('init slack', this.cronExpressionHumanReadable)
  this.vipMessageStack = []
  this.schedule = schedule.scheduleJob(this.cronExpression, (async function (cronExpressionHumanReadable) {
    this.log.info('run slack reporter', cronExpressionHumanReadable);
    this.send()
  }).bind(this, this.cronExpressionHumanReadable));
  const url = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
  this.webhook = new IncomingWebhook(url);
}


SlackTransporter.prototype.readFile = function readFile(filename) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filename, function (err, data) {
      if (err) {
        reject(err)
      }
      let result
      try {
        result = data.toString()
      } catch (error) {
        reject(new Error(`error loading ${filename}`))
      }
      resolve(result)
    })
  })
}

SlackTransporter.prototype.getHTML = async function renderHTML() {
  const templateFilename = path.join(__dirname, '../message-template.html')
  let context

  if (this.vipMessageStack.length > 50) {
    context = this.vipMessageStack.slice(Math.max(this.vipMessageStack.length - 50, 1))
  } else {
    context = this.vipMessageStack
  }
  const source = await this.readFile(templateFilename)
  const template = Handlebars.compile(source.toString())
  const result = template(context)
  return result
}

SlackTransporter.prototype.send = async function () {
  const icon = 'fab fa-slack'
  let error = false
  let textMessage
  let slackReport
  if (this.vipMessageStack.length !== 0) {
    const html = await this.getHTML()

    try {
      const symbols = {
        danger: ':hamburger:',
        warning: ':japanese_goblin:',
        success: ':feet:'
      }
      var TurndownService = require('turndown')

      var turndownService = new TurndownService()
      var markdown = turndownService.turndown(html)

      slackReport = await this.webhook.send({
        "text": markdown
      });
      textMessage = 'Notification sent'
      this.log.info('slack report', slackReport)
    } catch (error) {
      this.log.fatal('slack report failed', error)
      this.log.warn('reset slack message stack')
      textMessage = error.toString()
      error = true
    }
    this.vipMessageStack = []


    const data = {
      hostname: os.hostname(),
      version: require(path.join(__dirname, '../../package.json')).version,
      details: {
        CRON_EXPRESSION: this.cronExpression,
        CRON_EXPRESSION_TEXT: this.cronExpressionHumanReadable,
        timestamp: new Date(),
        name: 'SLACK',
        icon: icon,
        computername: os.hostname(),
        text: textMessage,
        valid_state: (error ? 'danger' : 'success'),
        slackReport
      }
    }
    this.master.publicBroadcast(data)
  }
}

SlackTransporter.prototype.stop = function () {
  this.schedule.cancel()
}

module.exports = SlackTransporter