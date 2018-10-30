var restify = require('restify');
var path = require('path');
var http = require('http');
var os = require('os');

var WebSocketServer = require('websocket').server;
var fs = require('fs');


function SocketMaster() {
  return this
}

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

SocketMaster.prototype.publicBroadcast = function (message) {
  for (let i = 0; i < this.publicWebsocketServer.connections.length; i++) {
    const connection = this.publicWebsocketServer.connections[i];
    connection.sendUTF(JSON.stringify(message));
  }
  if (message.details && message.details.valid_state && message.details.valid_state !== "success") {
    const {
      IncomingWebhook
    } = require('@slack/client');
    const url = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/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';
    const webhook = new IncomingWebhook(url);

    const symbols = {
      danger: ':hamburger:',
      warning: ':japanese_goblin:',
      success: ':feet:'
    }
    const symbol = symbols[message.details.valid_state] || ':feet:'
    // Send simple text to the webhook channel
    webhook.send({
      "text": symbol + " " + message.hostname + '/' + message.details.computername + '/' + message.details.name,
      "attachments": [{
        "text": JSON.stringify(message)
      }]
    }, function (err, res) {
      if (err) {
        console.log('Error:', err);
      }
    });
  }
}

SocketMaster.prototype.triggerSlaves = function (message) {
  for (let i = 0; i < this.wsServer.connections.length; i++) {
    const connection = this.wsServer.connections[i];
    var buf = Buffer.from(JSON.stringify(message));
    connection.sendBytes(buf);
  }
}

SocketMaster.prototype.start = function (webserverPort, slaveListenerPort) {
  var self = this


  function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
  }

  this.publicServer = restify.createServer();
  this.publicServer.get('*', restify.plugins.serveStatic({
    directory: path.join(__dirname, '../frontend/monitor/build')
  }));

  this.publicServer.listen(webserverPort, function () {
    console.log('%s listening at %s', self.publicServer.name, self.publicServer.url);
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
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.')

    connection.on('close', function (reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
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

      }
    }

    self.triggerSlaves({
      system: 'init'
    })
  });

  this.server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url)
  });
  this.server.listen(slaveListenerPort, function () {
    console.log((new Date()) + ' Server is listening on port ' + (slaveListenerPort));
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
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Slave Connection accepted.');
    connection.on('message', function (message) {
      if (message.type === 'binary') {
        var temp = JSON.parse(message.binaryData.toString());
        // console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        // connection.sendBytes(message.binaryData);
        self.publicBroadcast(temp)
      }
    });
    connection.on('close', function (reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

  }).bind(this));

}

SocketMaster.prototype.stop = function () {

}

const socketMaster = new SocketMaster()
socketMaster.start(process.env.WEBSERVER_PORT || 5040, process.env.SLAVE_LISTENER_PORT || 5060)