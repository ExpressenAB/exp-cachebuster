"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

function calculateFileChecksum(fileName, baseDirs) {
  if (fileName[0] === "/") {
    fileName = fileName.substr(1);
  }

  for (var i = 0; i < baseDirs.length; i++) {
    var baseDir = baseDirs[i];
    var completePath = path.join(baseDir, fileName);
    if (fs.existsSync(completePath)) {
      var checkSum = crypto.createHash("md5");
      checkSum.update(fs.readFileSync(completePath));
      return checkSum.digest("hex");
    }
  }
  throw new Error("Cannot find: " + fileName + " in dirs: " + baseDirs.join(", "));
}

module.exports = calculateFileChecksum;
