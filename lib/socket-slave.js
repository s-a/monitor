var os = require('os');
var http = require('http');
var path = require('path');
var WebSocketClient = require('websocket').client;
var PM2Client = require('./addon/pm2.js');


function SocketSlave(addons) {
  this.init(addons.split(';'))
  return this
}

SocketSlave.prototype.init = function (addons) {
  this.addons = []
  for (let a = 0; a < addons.length; a++) {
    const addonPath = addons[a]
    const Addon = require(addonPath)
    const addon = new Addon(this.onAddonMessage.bind(this))
    addon.start()
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
    console.warn(e)
  }
}

SocketSlave.prototype.onConnectionFailed = function (error) {
  const self = this
  setTimeout(() => {
    console.log('Connect Error: ' + error.toString(), 'Try reconnect in 5...');
    self.connect()
  }, 5000);
}

SocketSlave.prototype.broadcast = function (message) {
  const data = {
    hostname: os.hostname(),
    details: message,
    version: require(path.join(__dirname, '../package.json')).version
  }
  console.log('send:')
  var buf = Buffer.from(JSON.stringify(data));
  if (this.connection) {
    this.connection.sendBytes(buf)
  }

}

SocketSlave.prototype.onConnect = function (connection) {
  var self = this
  console.log('socket as slave client connected to ' + (process.env.MASTER_URI || 'ws://localhost:5060/'));
  this.connection = connection
  this.connection.on('error', function (error) {
    console.log("Connection Error: " + error.toString())
  })

  this.connection.on('close', function () {
    console.log('echo-protocol Connection Closed');
    self.onConnectionFailed(new Error('echo-protocol Connection Closed'))
  })


  this.connection.on('message', function (message) {
    if (message.type === 'binary') {
      var temp = JSON.parse(message.binaryData.toString());
      if (temp.system === 'init') {
        // console.log('Received Binary Message of ' + message.binaryData.length + ' bytes [INIT]');
        for (let a = 0; a < self.addons.length; a++) {
          const addon = self.addons[a];
          addon.addon.init()
        }
      }
    }
  });
}

SocketSlave.prototype.start = function (port) {
  this.server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url)
  });
  this.server.listen(port, function () {
    console.log((new Date()) + ' Slave Server is listening on port ' + (port));
  });

  this.client = new WebSocketClient();

  this.client.on('connectFailed', this.onConnectionFailed.bind(this));
  this.client.on('connect', this.onConnect.bind(this));

  this.connect()
}

SocketSlave.prototype.connect = function () {
  console.log('Connecting...');
  this.client.connect(process.env.MASTER_URI || 'ws://localhost:5060/', 'echo-protocol');
}

SocketSlave.prototype.stop = function () {

}

const socketSlave = new SocketSlave(process.env.ADDONS || './addon/pm2.js;./addon/cpu.js;./addon/pm2.js;./addon/memory.js;./addon/storage.js;./addon/mongodb.js;./addon/elastic-search.js')
// process.env.MASTER_URI = 'ws://monitor.vicoach.io:5060/'
socketSlave.start(process.env.PORT || 5080)