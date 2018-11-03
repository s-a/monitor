var restify = require('restify');
var path = require('path');
var http = require('http');
var fs = require('fs');
var os = require('os');
const cheerio = require('cheerio')
const Handlebars = require('handlebars')
var WebSocketServer = require('websocket').server;
const Log = require('./log.js')
const envObject = require('./env-object.js')

const Mail = require('./mail.js')

function SocketMaster() {
  this.vipMessageStack = []
  const emailInterval = (process.env.EMAIL_REFRESH_INTERVAL || process.env.DEFAULT_REFRESH_INTERVAL || 60) * 1000
  this.emailIntervalPointer = setInterval(this.email.bind(this), emailInterval)
  this.log = new Log()
  return this
}

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

SocketMaster.prototype.readFile = function readFile(filename) {
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

SocketMaster.prototype.getHTML = async function renderHTML() {
  const templateFilename = path.join(__dirname, 'message-template.html')
  const context = this.vipMessageStack
  const source = await this.readFile(templateFilename)
  const template = Handlebars.compile(source.toString())
  const result = template(context)
  return result
}

SocketMaster.prototype.email = async function () {
  if (this.vipMessageStack.length !== 0) {
    const html = await this.getHTML()
    const $ = cheerio.load(html)
    const subject = $('h1.title').text()
    const mailOptions = {
      from: `no-reply@example.com`, // sender address
      to: 'stephan.ahl@gmail.com',
      subject: subject,
      html: html
    }

    const mailConfig = envObject('EMAIL_CONFIG')
    try {
      const mail = new Mail()
      const mailReport = await mail.send(mailOptions, mailConfig)
      this.log.info('mail report', mailReport)
    } catch (error) {
      this.log.error('mail report failed', mailOptions, mailConfig)
    }
    this.vipMessageStack = []
  }
}

SocketMaster.prototype.refreshVipStack = function (message) {
  if (message && message.details && message.details.valid_state && message.details.valid_state.toLowerCase() !== 'success') {
    for (let index = this.vipMessageStack.length - 1; index > -1; index--) {
      const msg = this.vipMessageStack[index];
      if (msg.details.text === message.details.text && msg.details.valid_state === message.details.valid_state) {
        this.vipMessageStack.splice(index, 1)
      }
    }
    this.vipMessageStack.push(message)
  }
}

SocketMaster.prototype.publicBroadcast = function (message) {
  this.log.debug('publicBroadcast', message);

  const self = this
  this.refreshVipStack(message)
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

SocketMaster.prototype.start = function (webserverPort, slaveListenerPort) {
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

    initialDataSlots = require(path.join(__dirname, '/../initialDataSlots.json'))
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

}

const socketMaster = new SocketMaster()
socketMaster.start(process.env.WEBSERVER_PORT || 5040, process.env.SLAVE_LISTENER_PORT || 5060)