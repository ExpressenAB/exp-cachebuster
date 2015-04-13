"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

var checksumCache = {};

function calculateChecksum(fileName, options) {
  var baseDirs = options.baseDirs;

  if (fileName[0] === "/") {
    fileName = fileName.substr(1);
  }

  for (var i = 0; i < baseDirs.length; i++) {
    var baseDir = baseDirs[i];
    var completePath = path.join(baseDir, fileName);

    if (options.cacheChecksums && checksumCache[completePath]) {
      return checksumCache[completePath];
    }

    if (fs.existsSync(completePath)) {
      var hash = crypto.createHash("md5");
      hash.update(fs.readFileSync(completePath));
      var checksum = hash.digest("hex");

      if (options.cacheChecksums) {
        checksumCache[completePath] = checksum;
      }

      return checksum;
    }
  }

  return undefined;
}

calculateChecksum.clearCache = function() {
  checksumCache = {};
};

module.exports = calculateChecksum;
