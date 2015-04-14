"use strict";
var onHeaders = require("on-headers");
var calculateFileChecksum = require("../lib/calculateFileChecksum");

function validateChecksumMiddleware(options) {
  options = options || {};
  options.cacheChecksums = options.cacheChecksums !== false;
  options.baseDirs = options.baseDirs || [];

  return function (req, res, next) {
    onHeaders(res, function () {
      if (checksumsMismatch(req.path, req.query.c, options)) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    });
    return next();
  };
}

function checksumsMismatch(fileName, checksumFromClient, options) {
  if (!checksumFromClient) {
    return true;
  }

  var fileChecksum = calculateFileChecksum(fileName, options);
  return fileChecksum && checksumFromClient !== fileChecksum;
}

module.exports = validateChecksumMiddleware;
