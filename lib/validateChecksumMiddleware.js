"use strict";
var onHeaders = require("on-headers");
var url = require("url");

var checksumRegex = /__c([0-9a-f]{32})/;

function parseFile(req) {

  var obj = {};
  obj.url = req.url;
  obj.url = obj.url.replace(checksumRegex, function (match, matchChecksum) {
    obj.checksum = matchChecksum;
    return "";
  });

  obj.filename = url.parse(obj.url).pathname;
  obj.filename = obj.filename[0] === "/" ? obj.filename.substr(1) : obj.filename;

  return obj;

}

function validateChecksumMiddleware(checksums) {
  return function (req, res, next) {

    var parsedFile = parseFile(req);
    req.url = parsedFile.url;

    onHeaders(res, function () {
      if (parsedFile.checksum && checksums[parsedFile.filename] !== parsedFile.checksum) {
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
