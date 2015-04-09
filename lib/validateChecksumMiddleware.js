"use strict";
var onHeaders = require("on-headers");
var calculateFileChecksum = require("../lib/calculateFileChecksum");

function validateChecksumMiddleware(options) {
  options = options || {};
  options.cacheChecksums = options.cacheChecksums !== false;
  options.baseDirs = options.baseDirs || [];

  return function (req, res, next) {
    onHeaders(res, function () {
      try {
        if (!checksumsMatch(req.path, req.query.c, options)) {
          res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      } catch (e) {}
    });
    return next();
  };
}

function checksumsMatch(fileName, checksumFromClient, options) {
  if (!checksumFromClient) {
    return false;
  }

  return checksumFromClient === calculateFileChecksum(fileName, options);
}

module.exports = validateChecksumMiddleware;
