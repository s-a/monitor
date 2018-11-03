const disk = require('diskusage');
const os = require('os');
const isWin = process.platform === "win32";
const drivelist = require('drivelist');
const Addon = require('./../Addon.js');

class Storage extends Addon {
  constructor(slave) {
    super(slave, 'STORAGE');
  }
}

Storage.prototype.getDriveInfo = function (path) {
  return new Promise(function (resolve, reject) {
    disk.check(path, function (err, data) {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

Storage.prototype.getDriveList = function () {
  return new Promise(function (resolve, reject) {
    drivelist.list((error, drives) => {
      if (error) {
        reject(error);
      }
      resolve(drives);
    });
  })
}

Storage.prototype.getDriveDetails = async function (drive) {
  const path = this.getMountName(drive)
  // if (path){ // os.platform() === 'win32' ? 'c:' : '/';
  const info = await this.getDriveInfo(path)
  const free_in_percent = info.total / (info.available - info.used) * 100 // e.status === 'online' ? 'success' : 'danger'

  info.name = path
  info.icon = 'fas fa-hdd'
  info.valid_state = 'success'
  info.total = formatBytes(info.total)
  info.free = formatBytes(info.free)
  info.text = info.free + ' free'
  info.available = formatBytes(info.available)
  if (free_in_percent < 50) {
    info.valid_state = 'warning'
  }
  if (free_in_percent < 20) {
    info.valid_state = 'danger'
  }
  info.drive = drive
  return info
}

Storage.prototype.getMountName = function (drive) {
  let result
  if (isWin) {
    result = drive.mountpoints[0].path
  } else {
    result = drive.raw
  }
  return result
}

Storage.prototype.report = async function (transporterChannel) {

  const driveList = await this.getDriveList()
  const result = []
  for (let d = 0; d < driveList.length; d++) {
    const drive = driveList[d];

    try {
      const driveDetails = await this.getDriveDetails(drive)
      result.push(driveDetails)
    } catch (e) {
      this.log.warn('error fetching drive list data')
    }
  }
  return result
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
  else return (bytes / 1073741824).toFixed(3) + " GB";
};

module.exports = Storage