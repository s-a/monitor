const io = require('@pm2/io')
const Server = require('./lib/server.js')
/* io.configureModule({
  human_info: [
    ['Status', 'Module ready'],
    ['Comment', 'This is a superb comment the user should see'],
    ['IP', 'my machine ip!']
  ]
}) */

const conf = io.initModule({}, (err, conf) => {
  // Now the module is initialized
  const server = new Server(conf)
})