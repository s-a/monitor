var os = require('os');
var http = require('http');
var path = require('path');
var WebSocketClient = require('websocket').client;
const Log = require('./log.js')

function SocketSlave(addons) {
  this.log = new Log()
  this.init(addons.split(';'))
  return this
}

SocketSlave.prototype.init = function (addons) {
  this.addons = []
  if (!process.env.REFRESH_INTERVAL) {
    process.env.REFRESH_INTERVAL = 60
  }
  for (let a = 0; a < addons.length; a++) {
    const addonPath = addons[a]
    this.log.info('Load Addon: ', addonPath)
    const Addon = require(addonPath)
    const addon = new Addon()
    addon.start(this)
    this.addons.push({
      addonPath,
      addon: addon
    })
  }
}

SocketSlave.prototype.onAddonMessage = function (error, data) {
  const message = (error ? error : data)
  try {
    this.broadcast(message)
  } catch (e) {
    self.log.error(e)
  }
}

SocketSlave.prototype.onConnectionFailed = function (error) {
  const self = this
  setTimeout(() => {
    self.log.warn('Connect Error: ' + error.toString(), 'Try reconnect in 5...');
    self.connect()
  }, 5000);
}

SocketSlave.prototype.broadcast = function (message) {
  const data = {
    hostname: os.hostname(),
    details: message,
    version: require(path.join(__dirname, '../package.json')).version
  }

  data.details.computername = data.hostname

  this.log.debug('sending', data)
  var buf = Buffer.from(JSON.stringify(data));
  if (this.connection) {
    this.connection.sendBytes(buf)
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


  this.connection.on('message', function (message) {
    if (message.type === 'binary') {
      var temp = JSON.parse(message.binaryData.toString());
      if (temp.system === 'init') {
        self.log.debug('Received Binary Message from Master of ' + message.binaryData.length + ' bytes [INIT]');
        for (let a = 0; a < self.addons.length; a++) {
          const addon = self.addons[a];
          addon.addon.init()
        }
      }
    }
  });
}

SocketSlave.prototype.start = function (port) {
  const self = this
  this.server = http.createServer();
  this.server.listen(port, function () {
    self.log.info('Slave Server is listening on port ' + (port))
  });

  this.client = new WebSocketClient();

  this.client.on('connectFailed', this.onConnectionFailed.bind(this));
  this.client.on('connect', this.onConnect.bind(this));

  this.connect()
}

SocketSlave.prototype.connect = function () {
  const masterUri = process.env.MASTER_URI || 'ws://localhost:5060/'
  this.log.info('Connecting', masterUri);
  this.client.connect(masterUri, 'echo-protocol');
}

SocketSlave.prototype.stop = function () {

}

const socketSlave = new SocketSlave(process.env.ADDONS || './addon/pm2.js;./addon/cpu.js;./addon/pm2.js;./addon/memory.js;./addon/storage.js;./addon/mongodb.js;./addon/elastic-search.js')
// process.env.MASTER_URI = 'ws://monitor.vicoach.io:5060/'
socketSlave.start(process.env.PORT || 5080)