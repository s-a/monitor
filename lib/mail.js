 const nodemailer = require('nodemailer')

 function Mail() {
 	return this
 }

 Mail.prototype.send = async function send(options, config) {
 	const transporter = nodemailer.createTransport(config)
 	const transport = await transporter.sendMail(options)
 	return transport
 }

 module.exports = Mail