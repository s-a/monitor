var os = require('os');
var http = require('http');
var path = require('path');
var WebSocketClient = require('websocket').client;
const Log = require('./log.js')

function SocketSlave(addonPath) {
  this.addonPath = addonPath
  this.log = new Log()

  return this
}

SocketSlave.prototype.init = async function (addons) {
  this.addons = []

  for (let a = 0; a < addons.length; a++) {
    const addonPath = addons[a]
    this.log.info('Load Addon: ', addonPath)
    const Addon = require(addonPath)
    const addon = new Addon(this)
    if (addon.start) {
      await addon.start(this)
    }
    this.addons.push({
      addonPath,
      addon: addon
    })
    if (addon.report) {
      const rpt = await addon.report('INITIAL')
      this.broadcast(rpt)
      if (addon.launchTransporter) {
        await addon.launchTransporter()
      } else {
        this.log.error(`${addonPath} does not implement .launchTransporter() function. Maybe you missed to extend your addon as follows "class MyAddon extends Addon"`)
      }
    }
  }
}

SocketSlave.prototype.onConnectionFailed = function (error) {
  const self = this
  setTimeout(() => {
    self.log.warn('Connect Error: ' + error.toString(), 'Try reconnect in 5...');
    self.connect()
  }, 5000);
}

SocketSlave.prototype.broadcast = function (msg) {
  let m = []
  if (Array.isArray(msg)) {
    m = msg
  } else {
    m = [msg]
  }

  for (let i = 0; i < m.length; i++) {
    const message = m[i];

    const data = {
      hostname: os.hostname(),
      details: message,
      version: require(path.join(__dirname, '../package.json')).version
    }

    data.details.timestamp = new Date()
    data.details.computername = data.hostname

    this.log.debug('sending', data)
    var buf = Buffer.from(JSON.stringify(data));
    if (this.connection) {
      this.connection.sendBytes(buf)
    }
  }
}

SocketSlave.prototype.onConnect = function (connection) {
  var self = this
  const masterUri = (process.env.MASTER_URI || 'ws://localhost:5060/')
  self.log.info('socket as slave client connected to ' + masterUri);
  this.connection = connection
  this.connection.on('error', function (error) {
    self.log.error("Error connecting " + masterUri + ': ' + error.toString())
  })

  this.connection.on('close', function () {
    self.log.error(masterUri + ': echo-protocol Connection Closed')
    self.onConnectionFailed(new Error('echo-protocol Connection Closed'))
  })


  this.connection.on('message', async function (message) {
    if (message.type === 'binary') {
      var temp = JSON.parse(message.binaryData.toString());
      if (temp.system === 'init') {
        self.log.debug('Received Binary [INIT] Message from Master of ' + message.binaryData.length + ' bytes [INIT]');
        for (let a = 0; a < self.addons.length; a++) {
          const addon = self.addons[a];
          if (addon.addon.report) {
            rpt = await addon.addon.report('WEB')
            self.broadcast(rpt)
          }
        }
      }
    }
  });
}

SocketSlave.prototype.start = async function (port) {
  const self = this
  this.server = http.createServer();
  this.server.listen(port, function () {
    self.log.info('Slave Server is listening on port ' + (port))
  });

  this.client = new WebSocketClient();

  this.client.on('connectFailed', this.onConnectionFailed.bind(this));
  this.client.on('connect', this.onConnect.bind(this));

  this.connect()
  await self.init(this.addonPath.split(';'))
}

SocketSlave.prototype.connect = function () {
  const masterUri = process.env.MASTER_URI || 'ws://localhost:5060/'
  this.log.info('Connecting', masterUri);
  this.client.connect(masterUri, 'echo-protocol');
}

SocketSlave.prototype.stop = function () {
  for (let a = 0; a < this.addons.length; a++) {
    const addon = this.addons[a]
    addon.addon.destroy()
  }
}

const socketSlave = new SocketSlave(process.env.ADDONS || './addon/pm2.js;./addon/cpu.js;./addon/memory.js;./addon/storage.js;./addon/mongodb.js;./addon/elastic-search.js')
const gracefullShutDown = function gracefullShutDown() {
  socketSlave.log.error(socketSlave.addons.length, 'got SIGTERM or SIGINT. startGraceful shutdown...')
  socketSlave.stop()
  socketSlave.server.close()
  process.exit(0)
}
process.on('SIGTERM', gracefullShutDown)
process.on('SIGINT', gracefullShutDown)

async function go() {
  await socketSlave.start(process.env.PORT || 5080)
}

(async function () {
  await go()
})()