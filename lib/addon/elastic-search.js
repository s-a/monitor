var os = require('os')
var elasticsearch = require('elasticsearch')

function ElasticSearch() {
  return this
}

ElasticSearch.prototype.init = function () {
  this.fetchAllData()
}

ElasticSearch.prototype.fetchAllData = function () {
  const ELASTICSEARCH_URIS = ((process.env.ELASTICSEARCH_URIS) || 'http://localhost:9200').split(';')

  for (let i = 0; i < ELASTICSEARCH_URIS.length; i++) {
    const ELASTICSEARCH_URI = ELASTICSEARCH_URIS[i]
    this.fetchData(i, ELASTICSEARCH_URI)
  }
}

ElasticSearch.prototype.fetchData = function (index, ELASTICSEARCH_URI) {
  var self = this
  var client = new elasticsearch.Client({
    host: ELASTICSEARCH_URI
  });

  client.info(function (err, infos) {
    let info = {}
    if (err) {
      info = err
      info.name = 'Elasticsearch #' + (index + 1)
      info.valid_state = 'danger'
      info.icon = 'fas fa-database'
      info.text = `Elasticsearch #${(index+1)} down!`
    } else {
      info = infos
      info.name = 'Elasticsearch #' + (index + 1)
      info.valid_state = 'success'
      info.icon = 'fas fa-database'
      info.text = `Elasticsearch #${(index+1)} up`
    }
    self.slave.broadcast(info)
  });

}

ElasticSearch.prototype.start = function (slave) {
  this.slave = slave
  var self = this
  this.interval = setInterval(function () {
    self.fetchAllData()
  }, (process.env.ELASTICSEARCH_REFRESH_INTERVAL || process.env.REFRESH_INTERVAL) * 1000)
  self.fetchAllData()
}

ElasticSearch.prototype.stop = function () {
  clearInterval(this.interval)
}

module.exports = ElasticSearch