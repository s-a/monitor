const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const nodemailer = require('nodemailer')
const cheerio = require('cheerio')
const jwt = require('jsonwebtoken')

function Mail() {
	this.init()
	return this
}

Mail.prototype.init = function init() {
	const environment = (process.env.NODE_ENV || 'development')
	const settingsFilename = `./configuration/${environment}.mail.json`
	const config = require(settingsFilename)
	this.config = config
}

Mail.prototype.send = async function send(htmlTemplate, context, senderEmail, recipient) {
	const html = await this.getHTML(htmlTemplate, {
		context
	})
	const $ = cheerio.load(html)
	const subject = $('h1.title').text()
	const mailOptions = {
		from: `no-reply@${senderEmail}`,
		to: recipient,
		subject: subject,
		html: html
	}

	const transporter = nodemailer.createTransport(this.config.transport)
	const transport = await transporter.sendMail(mailOptions)
	return transport
}

Mail.prototype.readFile = function readFile(filename) {
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


Mail.prototype.getHTML = async function getHTML(filename, context) {
	const source = await this.readFile(filename)
	const template = Handlebars.compile(source.toString())
	const result = template(context)
	return result
}

module.exports = Mail