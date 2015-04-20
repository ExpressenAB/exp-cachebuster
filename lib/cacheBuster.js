"use strict";
var calculateFileChecksum = require("./calculateFileChecksum");
var validateChecksumMiddleware = require("./validateChecksumMiddleware");

// Very simple cache buster that uses a query parameter with the file checksum to make sure the latest file is used.
// It does use fs.existsSync and fs.readFileSync which looks kind of scary but since the checksums are cached these
// functions will only be called on the first page request which is OK.

module.exports = function (baseDirs) {
  var checksums = {};

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

      if (checksums[fileName]) {
        return checksums[fileName];
      }

      checksums[fileName] = calculateFileChecksum(fileName, baseDirs);
      return checksums[fileName];
    },
    validateChecksumMiddleware: function () {
      return validateChecksumMiddleware(checksums);
    }
  };

  return cacheBuster;
};
