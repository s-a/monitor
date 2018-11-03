const disk = require('diskusage');
const os = require('os');
const Addon = require('./../Addon.js');

class Storage extends Addon {
  constructor(slave) {
    super(slave, 'STORAGE');
  }
}

Storage.prototype.getDiscInfo = async function (path) {
  return new Promise(function (resolve, reject) {
    disk.check(path, function (err, data) {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

Storage.prototype.report = async function (transporterChannel) {
  let path = os.platform() === 'win32' ? 'c:' : '/';
  const info = await this.getDiscInfo(path)
  const free_in_percent = info.total / (info.available - info.used) * 100 // e.status === 'online' ? 'success' : 'danger'

  info.name = 'STORAGE'
  info.icon = 'fas fa-hdd'
  info.valid_state = 'success'
  info.total = formatBytes(info.total)
  info.free = formatBytes(info.free)
  info.text = path + ' ' + info.free + ' free'
  info.available = formatBytes(info.available)
  if (free_in_percent < 50) {
    info.valid_state = 'warning'
  }
  if (free_in_percent < 20) {
    info.valid_state = 'danger'
  }
  return info
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};

module.exports = Storage