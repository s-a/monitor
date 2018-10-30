var MongoClient = require('mongodb').MongoClient;
var os = require('os');

function MongoDb(message) {
  this.message = message
  return this
}

MongoDb.prototype.init = function () {
  this.init2()
}

MongoDb.prototype.init2 = function () {
  var self = this
  const MONGODB_URIS = ((process.env.MONGODB_URIS) || 'mongodb://localhost:27017/').split(';')

  for (let i = 0; i < MONGODB_URIS.length; i++) {
    const MONGODB_URI = MONGODB_URIS[i]
    MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true
    }, (err, cl) => {
      if (err) {
        info = cl || {}
        info.computername = os.hostname()
        info.sender = 'SYSTEM'
        info.name = 'MONGODB'
        info.valid_state = 'danger'
        self.message(null, info)
      } else {
        var db = cl.db('admin');
        client = db.admin()
        client.serverStatus().then(function (data) {
          const info = data
          info.computername = os.hostname()
          info.sender = 'SYSTEM'
          info.name = 'MONGODB'

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
          /* 
          info.valid_state = 'success' 
          if (free_in_percent < 50) {
            info.valid_state = 'warning'
          }
          if (free_in_percent < 20) {
            info.valid_state = 'danger'
          }
           */
          info.valid_state = 'success'
          self.message(null, info)
          cl.close()
        }).catch(function (err) {
          info = err || {}
          info.computername = os.hostname()
          info.sender = 'SYSTEM'
          info.name = 'MONGODB'
          info.valid_state = 'danger'
          self.message(info, null)
        });
      }
    });
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};

MongoDb.prototype.start = function () {
  var self = this
  setInterval(function () {
    self.init2()
  }, 60 * 1000)
  self.init2()
}

MongoDb.prototype.stop = function () {
  this.pm2.close()
}

module.exports = MongoDb