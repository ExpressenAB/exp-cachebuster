"use strict";
var calculateFileChecksum = require("./calculateFileChecksum");
var validateChecksumMiddleware = require("./validateChecksumMiddleware");
var warmUpChecksumCacheFn = require("./warmUpChecksumCache");
var path = require("path");

// Very simple cache buster that use checksum in file name (sufix)
// to make sure the latest file is used.

module.exports = function (baseDirs, useCachedChecksums) {
  var checksums = {};
  useCachedChecksums = useCachedChecksums !== false;

  var cacheBuster = {
    addBaseDir: function (baseDir) {
      baseDirs.push(baseDir);
    },
    bust: function (fileName) {
      var checksum = cacheBuster.checksum(fileName);

      if (!checksum) {
        throw new Error("Could not bust file " + fileName + " in baseDirs " + baseDirs.join(", "));
      }

      var extname = path.extname(fileName);
      var basename = fileName.substr(0, fileName.length - extname.length);

      return basename + "__c" + checksum + extname;
    },
    checksum: function (fileName) {
      if (fileName[0] === "/") {
        fileName = fileName.substr(1);
      }

      if (useCachedChecksums && checksums[fileName]) {
        return checksums[fileName];
      }

      checksums[fileName] = calculateFileChecksum(fileName, baseDirs);
      return checksums[fileName];
    },
    validateChecksumMiddleware: function () {
      return validateChecksumMiddleware(checksums);
    },
    warmUpChecksumCache: function (optionalDoneCallback) {
      optionalDoneCallback = optionalDoneCallback || function () { };
      warmUpChecksumCacheFn(baseDirs, cacheBuster.bust, optionalDoneCallback);
    }
  };

  return cacheBuster;
};
