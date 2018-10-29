var os = require('os');
var http = require('http');
var WebSocketClient = require('websocket').client;
var PM2Client = require('./addon/pm2.js');


function SocketSlave() {
  this.init()
  return this
}

SocketSlave.prototype.init = function () {
  this.pm2Client = new PM2Client(this.onAddonMessage.bind(this))
  this.pm2Client.start()
}

SocketSlave.prototype.onAddonMessage = function (error, data) {
  const message = (error ? error : data)
  this.broadcast(message)
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
    details: message
  }
  if (this.connection.connected) {
    var buf = Buffer.from(JSON.stringify(data));
    this.connection.sendBytes(buf)
  }
}

SocketSlave.prototype.onConnect = function (connection) {
  console.log('socket slave client connected');
  const self = this
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
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes [INIT]');
        self.pm2Client.init()
      }
    }
  });
  this.pm2Client.init()
}

SocketSlave.prototype.start = function (port) {
  this.server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url)
  });
  this.server.listen(port || 5080, function () {
    console.log((new Date()) + ' Server is listening on port ' + (port || 5080));
  });

  this.client = new WebSocketClient();

  this.client.on('connectFailed', this.onConnectionFailed.bind(this));
  this.client.on('connect', this.onConnect.bind(this));

  this.connect()
}

SocketSlave.prototype.connect = function () {
  console.log('Connecting...');
  this.client.connect('ws://localhost:5060/', 'echo-protocol');
  this.init()
}

SocketSlave.prototype.stop = function () {

}

const socketSlave = new SocketSlave()
socketSlave.start()