const si = require('systeminformation')
const Addon = require('./../Addon.js');

class Memory extends Addon {
  constructor(slave) {
    super(slave, 'MEMORY');
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};

Memory.prototype.report = async function () {
  const data = await si.mem()

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const element = data[key]
      if (typeof element === 'number') {
        data[key] = formatBytes(data[key])
      }
    }
  }

  data.name = 'MEMORY'
  data.icon = 'fas fa-memory'
  data.text = (data.free) + ' free'
  const free_in_percent = data.available / data.used * 100
  data.valid_state = 'success'
  if (free_in_percent < 50) {
    data.valid_state = 'warning'
  }
  if (free_in_percent < 30) {
    data.valid_state = 'danger'
  }
  return data
}

module.exports = Memory