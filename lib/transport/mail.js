var schedule = require('node-schedule')
var cronstrue = require('cronstrue');
var path = require('path');
var os = require('os');
var fs = require('fs');
const cheerio = require('cheerio')
const Handlebars = require('handlebars')
const MailMessage = require('./../mail-message.js')
const envObject = require('./../env-object.js')

function MailTransporter(master) {
  this.master = master
  this.log = master.log
  return this
}

MailTransporter.prototype.init = function () {
  this.cronExpression = (process.env.EMAIL_REFRESH_INTERVAL || process.env.DEFAULT_REFRESH_INTERVAL || "0 */20 * * * *")
  this.cronExpressionHumanReadable = cronstrue.toString(this.cronExpression, {
    use24HourTimeFormat: true,
    dayOfWeekStartIndexZero: false
  })

  this.log.info('init mail', this.cronExpressionHumanReadable)
  this.vipMessageStack = []
  this.schedule = schedule.scheduleJob(this.cronExpression, (async function (cronExpressionHumanReadable) {
    this.log.info('run mail reporter', cronExpressionHumanReadable);
    this.send()
  }).bind(this, this.cronExpressionHumanReadable));
}


MailTransporter.prototype.readFile = function readFile(filename) {
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

MailTransporter.prototype.getHTML = async function renderHTML() {
  const templateFilename = path.join(__dirname, '../message-template.html')
  let context

  if (this.vipMessageStack.length > 200) {
    context = this.vipMessageStack.slice(Math.max(this.vipMessageStack.length - 200, 1))
  } else {
    context = this.vipMessageStack
  }
  const source = await this.readFile(templateFilename)
  const template = Handlebars.compile(source.toString())
  const result = template(context)
  return result
}

MailTransporter.prototype.send = async function () {
  const self = this
  let error = false
  let icon = 'fas fa-envelope'
  let textMessage = 'Notification skiped  (no errors)'
  if (this.vipMessageStack.length !== 0) {
    const html = await this.getHTML()
    const $ = cheerio.load(html)
    const subject = $('h1.title').text()

    const mailOptions = envObject('EMAIL_OPTIONS')
    mailOptions.subject = subject
    mailOptions.html = html

    const mailConfig = envObject('EMAIL_CONFIG')
    try {
      const mailMessage = new MailMessage()
      const mailReport = await mailMessage.send(mailOptions, mailConfig)
      this.log.info('mail report', mailReport)
      textMessage = 'Notification sent'
      icon = 'fas fa-envelope-open'
    } catch (err) {
      icon = 'fas fa-exclamation-triangle'
      this.log.fatal('mail report failed', mailOptions, mailConfig, err)
      this.log.warn('reset mail message stack')
      textMessage = err.toString()
      error = true
    }
    this.vipMessageStack = []
  }

  const data = {
    hostname: os.hostname(),
    version: require(path.join(__dirname, '../../package.json')).version,
    details: {
      timestamp: new Date(),
      CRON_EXPRESSION: this.cronExpression,
      CRON_EXPRESSION_TEXT: this.cronExpressionHumanReadable,
      name: 'EMAIL',
      icon: icon,
      computername: os.hostname(),
      text: textMessage,
      valid_state: (error ? 'danger' : 'success'),
    }
  }

  self.master.publicBroadcast(data)
}

MailTransporter.prototype.stop = function () {
  this.schedule.cancel()
}

module.exports = MailTransporter