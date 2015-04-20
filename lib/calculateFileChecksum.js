"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

function calculateChecksum(fileName, baseDirs) {
  if (fileName[0] === "/") {
    fileName = fileName.substr(1);
  }

  for (var i = 0; i < baseDirs.length; i++) {
    var baseDir = baseDirs[i];
    var completePath = path.join(baseDir, fileName);

    if (fs.existsSync(completePath)) {
      var hash = crypto.createHash("md5");
      hash.update(fs.readFileSync(completePath));
      return hash.digest("hex");
    }
  }

  return undefined;
}

module.exports = calculateChecksum;
