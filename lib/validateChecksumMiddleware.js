"use strict";
var onHeaders = require("on-headers");

function validateChecksumMiddleware(checksums) {
  return function (req, res, next) {
    onHeaders(res, function () {
      var fileName = req.path;
      var clientChecksum = req.query.c;

      if (fileName[0] === "/") {
        fileName = fileName.substr(1);
      }

      if (clientChecksum && checksums[fileName] !== clientChecksum) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "-1");
      }
    });
    return next();
  };
}

module.exports = validateChecksumMiddleware;
