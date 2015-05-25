"use strict";
var onHeaders = require("on-headers");

function validateChecksumMiddleware(checksums, useCachedChecksums) {
  return function (req, res, next) {
    onHeaders(res, function () {
      var fileName = req.path;
      var clientChecksum = req.query.c;

      if (fileName[0] === "/") {
        fileName = fileName.substr(1);
      }

      if (useCachedChecksums && clientChecksum && checksums[fileName] !== clientChecksum) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Edge-control", "no-store");
        res.set("Pragma", "no-cache");
        res.set("Expires", "-1");
        res.set("max-age", "0");
      }
    });
    return next();
  };
}

module.exports = validateChecksumMiddleware;
