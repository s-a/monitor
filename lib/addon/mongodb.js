var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');

const Addon = require('./../Addon.js');

class MongoDb extends Addon {
  constructor(slave) {
    super(slave, 'MONGODB');
  }
}

MongoDb.prototype.report = async function () {
  const MONGODB_URIS = ((process.env.MONGODB_URIS) || 'mongodb://localhost:27017/').split(';')
  const result = []
  for (let i = 0; i < MONGODB_URIS.length; i++) {
    const MONGODB_URI = MONGODB_URIS[i]
    result.push(await this.validateDatabaseConnection(i, MONGODB_URI))
  }
  return result
}

MongoDb.prototype.validateDatabaseConnection = async function (index, MONGODB_URI) {
  const name = 'MongoDB #' + (index + 1)
  try {
    const cl = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true
    })
    var db = cl.db('admin');
    client = db.admin()

    const data = await client.serverStatus()
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
    result = info
    cl.close()
  } catch (e) {
    info = {
      stack: err.stack,
      message: err.message
    }
    info.name = name
    info.valid_state = 'danger'
    info.icon = 'fas fa-database'
    info.text = `server #${index} is down!`
    info.status = `server #${index} is down!`
    result = info
  }
  return result
}

module.exports = MongoDb