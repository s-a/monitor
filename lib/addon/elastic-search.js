var elasticsearch = require('elasticsearch')
const Addon = require('./../Addon.js');

class ElasticSearch extends Addon {
  constructor(slave) {
    super(slave, 'ELASTICSEARCH');
  }
}

ElasticSearch.prototype.report = async function () {
  const ELASTICSEARCH_URIS = ((process.env.ELASTICSEARCH_URIS) || 'http://localhost:9200').split(';')
  const result = []
  for (let i = 0; i < ELASTICSEARCH_URIS.length; i++) {
    const ELASTICSEARCH_URI = ELASTICSEARCH_URIS[i]
    result.push(await this.fetchData(i, ELASTICSEARCH_URI))
  }
  return result
}

ElasticSearch.prototype.fetchData = async function (index, ELASTICSEARCH_URI) {
  let info = {}

  try {
    var client = new elasticsearch.Client({
      host: ELASTICSEARCH_URI
    });
    const infos = await client.info()
    info = infos
    info.name = 'Elasticsearch #' + (index + 1)
    info.valid_state = 'success'
    info.icon = 'fas fa-database'
    info.text = `Elasticsearch #${(index+1)} up`
  } catch (e) {
    info = err
    info.name = 'Elasticsearch #' + (index + 1)
    info.valid_state = 'danger'
    info.icon = 'fas fa-database'
    info.text = `Elasticsearch #${(index+1)} down!`
  }

  return info
}

module.exports = ElasticSearch