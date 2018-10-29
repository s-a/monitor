var restify = require('restify');
var path = require('path');
var http = require('http');

var WebSocketServer = require('websocket').server;
var fs = require('fs');
var index = fs.readFileSync('./lib/index.html').toString()
var browserJs = fs.readFileSync('./node_modules/websocket/lib/browser.js').toString()
var browserJsx = fs.readFileSync('./lib/browser.jsx').toString()


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
}

SocketMaster.prototype.start = function (port) {
  var self = this


  function respond(req, res, next) {
    res.send('hello ' + req.params.name);
    next();
  }

  this.publicServer = restify.createServer();
  this.publicServer.get('*', restify.plugins.serveStatic({
    directory: path.join(__dirname, '../frontend/monitor/build')
  }));

  this.publicServer.listen(5040, function () {
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

    /* connection.on('message', function (message) {
      if (message.type === 'binary') {
        var temp = JSON.parse(message.binaryData.toString());
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        console.log(temp);
        connection.sendBytes(message.binaryData);
        self.publicBroadcast(temp)
      }
    }); */
    connection.on('close', function (reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });

  this.server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url)
  });
  this.server.listen(port || 5060, function () {
    console.log((new Date()) + ' Server is listening on port ' + (port || 5060));
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
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function (message) {
      if (message.type === 'binary') {
        var temp = JSON.parse(message.binaryData.toString());
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        connection.sendBytes(message.binaryData);
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
socketMaster.start()