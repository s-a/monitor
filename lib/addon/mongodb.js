var MongoClient = require('mongodb').MongoClient;
var os = require('os');
var moment = require('moment');

function MongoDb() {
  return this
}

MongoDb.prototype.init = function () {
  this.initAll()
}

MongoDb.prototype.initAll = function () {
  const MONGODB_URIS = ((process.env.MONGODB_URIS) || 'mongodb://localhost:27017/').split(';')

  for (let i = 0; i < MONGODB_URIS.length; i++) {
    const MONGODB_URI = MONGODB_URIS[i]
    this.validateDatabaseConnection(i, MONGODB_URI)
  }
}

MongoDb.prototype.validateDatabaseConnection = function (index, MONGODB_URI) {
  var self = this
  const sender = 'MongoDB'
  const name = 'MongoDB #' + (index + 1)
  MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true
  }, (err, cl) => {
    if (err) {
      info = {
        stack: err.stack,
        message: err.message
      }
      info.name = name
      info.valid_state = 'danger'
      info.icon = 'fas fa-database'
      info.text = `server #${index} is down!`
      info.status = `server #${index} is down!`
      self.slave.broadcast(info)
    } else {
      var db = cl.db('admin');
      client = db.admin()
      client.serverStatus().then(function (data) {
        const info = data
        info.name = name

        info.mem_mapped = data.mem.mapped
        info.mem_virtual = data.mem.virtual
        info.connections_current = data.connections.current
        if (typeof lastInsert != 'undefined') {
          info.insert = (Math.round((data.opcounters.insert - lastInsert) * 1000 / refresh_rate));
          info.query = (Math.round((data.opcounters.query - lastQuery) * 1000 / refresh_rate));
          info.update = (Math.round((data.opcounters.update - lastUpdate) * 1000 / refresh_rate));
          info.deleted = (Math.round((data.opcounters.delete - lastDelete) * 1000 / refresh_rate));
          info.command = (Math.round((data.opcounters.command - lastCommand) * 1000 / refresh_rate));
          info.netIn = (Math.round((data.network.bytesIn - lastBytesIn) * 1000 / refresh_rate));
          info.netOut = (Math.round((data.network.bytesOut - lastBytesOut) * 1000 / refresh_rate));
        }
        info.lastInsert = data.opcounters.insert;
        info.lastQuery = data.opcounters.query;
        info.lastUpdate = data.opcounters.update;
        info.lastDelete = data.opcounters.delete;
        info.lastCommand = data.opcounters.command;
        info.lastBytesIn = data.network.bytesIn;
        info.lastBytesOut = data.network.bytesOut;

        if (data.repl) {
          info.replName = data.repl.setName;
          if (data.repl.ismaster)
            info.replStatus = "PRIMARY";
          else if (data.repl.secondary)
            info.replStatus = "SECONDARY";
          else
            info.replStatus = "UNKNOWN";
        }

        info.icon = 'fas fa-database'
        info.text = data.connections.current + ' connection(s), Up since ' + moment().milliseconds(info.uptimeMillis).toNow()
        info.status = ``
        info.valid_state = 'success'
        self.slave.broadcast(info)
        cl.close()
      }).catch(function (err) {
        info = err || {}
        info.name = name
        info.valid_state = 'danger'
        info.icon = 'fas fa-database'
        info.text = `server #${index} is down!`
        info.status = `server #${index} is down!`
        self.slave.broadcast(info)
        cl.close()
      });
    }
  });
}

MongoDb.prototype.start = function (slave) {
  this.slave = slave
  var self = this
  this.interval = setInterval(function () {
    self.initAll()
  }, (process.env.MONGODB_REFRESH_INTERVAL || process.env.REFRESH_INTERVAL) * 1000)
  self.initAll()
}

MongoDb.prototype.stop = function () {
  clearInterval(this.interval)
}

module.exports = MongoDb