"use strict";
var calculateFileChecksum = require("./calculateFileChecksum");
var validateChecksumMiddleware = require("./validateChecksumMiddleware");

// Very simple cache buster that uses a query parameter with the file checksum to make sure the latest file is used.
// It does use fs.existsSync and fs.readFileSync which looks kind of scary but since the checksums are cached these
// functions will only be called on the first page request which is OK.

module.exports = function (baseDirs, dontCacheFileChecksums) {
  var cache = {};

  var cacheBuster = {
    addBaseDir: function (baseDir) {
      baseDirs.push(baseDir);
    },
    bust: function (fileName) {
      return fileName + "?c=" + cacheBuster.checksum(fileName);
    },
    checksum: function (fileName) {
      if (dontCacheFileChecksums || !cache[fileName]) {
        cache[fileName] = calculateFileChecksum(fileName, baseDirs);
      }

      return cache[fileName];
    },
    validateChecksumMiddleware: validateChecksumMiddleware
  };

  return cacheBuster;
};

