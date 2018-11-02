 function Storage() {
   return this
 }

 Storage.prototype.init = function () {
   this.init2()
 }

 Storage.prototype.init2 = function () {
   var self = this
   const disk = require('diskusage');
   const os = require('os');

   let path = os.platform() === 'win32' ? 'c:' : '/';

   disk.check(path, function (err, info) {
     if (err) {
       console.log(err);
     } else {
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
       self.slave.broadcast(info)
     }
   });
 }

 function formatBytes(bytes) {
   if (bytes < 1024) return bytes + " Bytes";
   else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KB";
   else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MB";
   else return (bytes / 1073741824).toFixed(3) + " GB";
 };

 Storage.prototype.start = function (slave) {
   this.slave = slave
   var self = this
   this.interval = setInterval(function () {
     self.init2()
   }, (process.env.STORAGE_REFRESH_INTERVAL || process.env.REFRESH_INTERVAL) * 1000)
 }

 Storage.prototype.stop = function () {
   clearInterval(this.interval)
 }

 module.exports = Storage