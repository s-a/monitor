const si = require('systeminformation')
const Addon = require('./../Addon.js');
var got = require('got')

class Online extends Addon {
  constructor(slave) {
    super(slave, 'ONLINE');
  }
}

Online.prototype.report = async function () {
  const result = []
  const uris = process.env.ONLINE_URIS.split(';')

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i]
    let data = {}
    try {
      httpResult = await got(uri)
      data.text = uri + ' ' + (httpResult.statusCode === 200 ? 'OK' : 'down')
      data.valid_state = httpResult.statusCode === 200 ? 'success' : 'danger'
    } catch (err) {
      data = err
      data.text = err.toString()
      data.valid_state = 'danger'
    }
    data.name = 'WWW #' + i
    data.icon = 'fas fa-mouse-pointer'
    result.push(data)
  }

  return result
}

module.exports = Online