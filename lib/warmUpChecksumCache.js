"use strict";
var fs = require("fs");

/*

 Ability to warm-up the checksum cache before the server start
 getting client requests (good in multi-node clustered environments)

*/

var count;

function warmUpChecksumCache(baseDirs, bustFn, callback) {
  count = baseDirs.length;

  baseDirs.forEach(bustFiles.bind(null, bustFn, callback));
}

function bustFiles (bustFn, callback, baseDir) {
  fs.readdir(baseDir, function (err, files) {
    if (err) {
      throw err;
    }

    for (var i = 0; i < files.length; i++) {
      bustFn(files[i]);
    }

    if (--count < 1) {
      callback();
    }
  });
}

module.exports = warmUpChecksumCache;
