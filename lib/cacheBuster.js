"use strict";
var calculateFileChecksum = require("./calculateFileChecksum");
var validateChecksumMiddleware = require("./validateChecksumMiddleware");

// Very simple cache buster that uses a query parameter with the file checksum
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

      return fileName + "?c=" + checksum;
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
      return validateChecksumMiddleware(checksums, useCachedChecksums);
    }
  };

  return cacheBuster;
};
