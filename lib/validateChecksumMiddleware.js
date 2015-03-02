"use strict";
var onHeaders = require("on-headers");
var calculateFileChecksum = require("../lib/calculateFileChecksum");

var fileChecksumCache = {};

function validateChecksumMiddleware(baseDir, dontCacheFileChecksums) {
  return function (req, res, next) {
    onHeaders(res, function () {
      if (!checksumsMatch(baseDir, req.baseUrl + req.path, req.query.c, dontCacheFileChecksums)) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    });
    return next();
  };
}

function checksumsMatch(baseDir, filePath, checksumFromClient, dontCacheFileChecksums) {
  if (!checksumFromClient) return false;

  return checksumFromClient === checksumForFile(baseDir, filePath, dontCacheFileChecksums);
}

function checksumForFile(basedir, filePath, dontCacheFileChecksums) {
  if (dontCacheFileChecksums || !fileChecksumCache[filePath]) {
    fileChecksumCache[filePath] = calculateFileChecksum(filePath, [basedir]);
  }

  return fileChecksumCache[filePath];
}

module.exports = validateChecksumMiddleware;

