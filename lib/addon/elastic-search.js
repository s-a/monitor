var os = require('os')
var elasticsearch = require('elasticsearch')

function ElasticSearch(message) {
  this.message = message
  return this
}

ElasticSearch.prototype.init = function () {
  this.init2()
}

ElasticSearch.prototype.init2 = function () {
  var self = this
  const ELASTICSEARCH_URIS = ((process.env.ELASTICSEARCH_URIS) || 'http://localhost:9200').split(';')

  for (let i = 0; i < ELASTICSEARCH_URIS.length; i++) {
    const ELASTICSEARCH_URI = ELASTICSEARCH_URIS[i]

    var client = new elasticsearch.Client({
      host: ELASTICSEARCH_URI
    });

    const c = client.info(function (err) {
      let info = {}
      if (err) {
        info = err
        info.computername = os.hostname()
        info.sender = 'SYSTEM-ELASTIC_SEARCH'
        info.name = 'ELASTIC_SEARCH'
        info.valid_state = 'danger'
        info.message = `elasticsearch cluster ${ELASTICSEARCH_URI} is down!`
      } else {
        info.computername = os.hostname()
        info.sender = 'SYSTEM-ELASTIC_SEARCH'
        info.name = 'ELASTIC_SEARCH'
        info.valid_state = 'success'
      }
      self.message(null, info)
    });
  }
}

ElasticSearch.prototype.start = function () {
  var self = this
  setInterval(function () {
    self.init2()
  }, 10 * 1000)
}

ElasticSearch.prototype.stop = function () {
  this.pm2.close()
}

module.exports = ElasticSearch