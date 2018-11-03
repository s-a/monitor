var restify = require('restify');
var path = require('path');
var http = require('http');

var os = require('os');
var WebSocketServer = require('websocket').server;
const Log = require('./log.js')
const envObject = require('./env-object.js')

const MailTransport = require('./transport/mail.js')

function SocketMaster() {
  const self = this
  this.log = new Log()
  this.vipMessageStack = []

  const transport = new MailTransport(this)
  transport.init()
  this.transports = [{
    name: 'email',
    instance: transport
  }]

  return this
}

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

SocketMaster.prototype.transportMessage = function transportMessage(filename) {

}


SocketMaster.prototype.refreshVipStack = function (stack, message) {
  if (message && message.details && message.details.valid_state && message.details.valid_state.toLowerCase() !== 'success') {
    for (let index = stack.length - 1; index > -1; index--) {
      const msg = stack[index];
      if (msg.details.text === message.details.text && msg.details.valid_state === message.details.valid_state) {
        stack.splice(index, 1)
      }
    }
    stack.push(message)
  }
}

SocketMaster.prototype.publicBroadcast = function (message) {
  this.log.debug('publicBroadcast', message);

  const self = this
  for (let s = 0; s < this.transports.length; s++) {
    const transport = this.transports[s];
    this.refreshVipStack(transport.instance.vipMessageStack, message)
  }
  for (let i = 0; i < this.publicWebsocketServer.connections.length; i++) {
    const connection = this.publicWebsocketServer.connections[i];
    connection.sendUTF(JSON.stringify(message));
  }
}

SocketMaster.prototype.triggerSlaves = function (message, connection) {
  this.log.debug('trigger all slave(s) to initialize')
  var buf = Buffer.from(JSON.stringify(message));
  if (connection) {
    connection.sendBytes(buf);
  } else {
    for (let i = 0; i < this.wsServer.connections.length; i++) {
      const connection = this.wsServer.connections[i];
      connection.sendBytes(buf);
    }
  }
}

SocketMaster.prototype.start = async function (webserverPort, slaveListenerPort) {
  var self = this

  this.publicServer = restify.createServer();
  this.publicServer.get('*', restify.plugins.serveStatic({
    directory: path.join(__dirname, '../frontend/monitor/build')
  }));

  this.publicServer.listen(webserverPort, function () {
    self.log.info('%s listening at %s', self.publicServer.name, self.publicServer.url);
  });

  this.publicWebsocketServer = new WebSocketServer({
    httpServer: this.publicServer,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
  });



  this.publicWebsocketServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      self.log.debug('Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    self.log.debug('browser Connection accepted.')

    connection.on('close', function (reasonCode, description) {
      self.log.debug('browser Peer ' + connection.remoteAddress + ' disconnected.');
    });

    initialDataSlots = envObject('INITIAL_DATA_SLOTS') || [] // require(path.join(__dirname, '/../initialDataSlots.json'))
    for (let i = 0; i < initialDataSlots.length; i++) {
      const slot = initialDataSlots[i];
      for (let n = 0; n < slot.names.length; n++) {
        const name = slot.names[n];
        const data = {
          hostname: os.hostname(),
          details: {
            sender: 'SOCKET_MASTER',
            computername: slot.computername,
            status: 'APPLICATION_STATE_UNKNOWN',
            text: 'Application state unknown',
            name: name,
            valid_state: 'danger'
          }
        }
        connection.sendUTF(JSON.stringify(data));
        self.log.debug('send data to browser client')
      }
    }

    self.triggerSlaves({
      system: 'init'
    })
  });

  this.server = http.createServer(function (request, response) {
    self.log.debug('Received request for ' + request.url)
  });
  this.server.listen(slaveListenerPort, function () {
    self.log.info('Master Server is listening on port ' + slaveListenerPort)
  });

  this.wsServer = new WebSocketServer({
    httpServer: this.server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
  });

  this.wsServer.on('request', (function (request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      self.log.info('Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    self.log.info('Slave Connection accepted.')
    connection.on('message', function (message) {
      if (message.type === 'binary') {
        var temp = JSON.parse(message.binaryData.toString());
        self.log.debug('Received Binary Message of ' + message.binaryData.length + ' bytes');
        connection.sendBytes(message.binaryData);
        self.publicBroadcast(temp)
      }
    });
    connection.on('close', function (reasonCode, description) {
      console.log('Slave Peer ' + connection.remoteAddress + ' disconnected.');
    });


  }).bind(this));

}

SocketMaster.prototype.stop = function () {
  for (let t = 0; t < this.transports.length; t++) {
    const transport = this.transports[t];
    transport.instance.stop()
  }
  this.server.close()
  this.publicServer.close()
}

const socketMaster = new SocketMaster()


const gracefullShutDown = function gracefullShutDown() {
  socketMaster.log.error('got SIGTERM or SIGINT. startGraceful shutdown...')
  socketMaster.stop()
  process.exit(0)
}
process.on('SIGTERM', gracefullShutDown)
process.on('SIGINT', gracefullShutDown)

async function go() {
  await socketMaster.start(process.env.WEBSERVER_PORT || 5040, process.env.SLAVE_LISTENER_PORT || 5060)
}

(async function () {
  await go()
})()