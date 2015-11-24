"use strict";
var fs = require("fs");
var path = require("path");

/*

 Ability to warm-up the checksum cache before the server start
 getting client requests (good in multi-node clustered environments)

*/

var count;

function warmUpChecksumCache(baseDirs, bustFn, callback) {
  count = baseDirs.length;

  baseDirs.forEach(bustFilesInFolder.bind(null, bustFn, callback));
}

function bustFilesInFolder (bustFn, callback, baseDir) {
  fs.readdir(baseDir, function (err, files) {
    if (err) {
      throw err;
    }

    bustFiles(files, baseDir, bustFn);

    if (--count < 1) {
      callback();
    }
  });
}

function bustFiles (files, baseDir, bustFn) {
  for (var i = 0; i < files.length; i++) {
    var completePath = path.join(baseDir, files[i]);

    if (!fs.statSync(completePath).isFile()) {
      continue;
    }

    bustFn(files[i]);
  }
}

module.exports = warmUpChecksumCache;
