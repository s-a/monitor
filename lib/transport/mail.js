var schedule = require('node-schedule')
var cronstrue = require('cronstrue');
var path = require('path');
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
  const cronExpression = (process.env.EMAIL_REFRESH_INTERVAL || process.env.DEFAULT_REFRESH_INTERVAL || "0 */20 * * * *")
  const cronExpressionHumanReadable = cronstrue.toString(cronExpression, {
    use24HourTimeFormat: true,
    dayOfWeekStartIndexZero: false
  })

  this.log.info('init mail', cronExpressionHumanReadable)
  this.vipMessageStack = []
  this.schedule = schedule.scheduleJob(cronExpression, (async function (cronExpressionHumanReadable) {
    this.log.info('run mail reporter', cronExpressionHumanReadable);
    this.send()
  }).bind(this, cronExpressionHumanReadable));
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
    } catch (error) {
      this.log.fatal('mail report failed', mailOptions, mailConfig, error)
      this.log.warn('reset mail message stack')
    }
    this.vipMessageStack = []
  }
}

MailTransporter.prototype.stop = function () {
  this.schedule.cancel()
}

module.exports = MailTransporter