"use strict";
var calculateFileChecksum = require("./calculateFileChecksum");
var validateChecksumMiddleware = require("./validateChecksumMiddleware");

// Very simple cache buster that uses a query parameter with the file checksum to make sure the latest file is used.
// It does use fs.existsSync and fs.readFileSync which looks kind of scary but since the checksums are cached these
// functions will only be called on the first page request which is OK.

module.exports = function (options) {
  options = options || {};
  options.cacheChecksums = options.cacheChecksums !== false;
  options.baseDirs = options.baseDirs || [];

  var cacheBuster = {
    addBaseDir: function (baseDir) {
      options.baseDirs.push(baseDir);
    },
    setCacheChecksums: function (cacheChecksums) {
      options.cacheChecksums = cacheChecksums;
    },
    bust: function (fileName) {
      var checksum = cacheBuster.checksum(fileName);

      if (!checksum) {
        throw new Error("Could not bust file " + fileName + " in baseDirs " + options.baseDirs.join(", "));
      }

      return fileName + "?c=" + checksum;
    },
    checksum: function (fileName) {
      return calculateFileChecksum(fileName, options);
    },
    validateChecksumMiddleware: function (middlewareOptions) {
      middlewareOptions = middlewareOptions || options;
      middlewareOptions.cacheChecksums = middlewareOptions.cacheChecksums !== false;
      middlewareOptions.baseDirs = middlewareOptions.baseDirs || [];

      return validateChecksumMiddleware(middlewareOptions);
    },
    clearChecksumCache: function () {
      calculateFileChecksum.clearChecksumCache();
    }
  };

  return cacheBuster;
};
