"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");

/*

 This function makes synchronous file system operations which is usually
 considered to be bad practice in nodejs. However these operations will only
 be done when busting your client side resources from your templates and then
 cached which means the costly operations will only be done a few times
 during startup.

 It should not affect performance in real life usage unless your applications
 have thousands of client side resources that are busted.

 It is also worth noting that no file operations (synchronous or otherwise)
 are made in the middleware which means that an end user cannot slow the
 system down by requesting lots of static files.

*/

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
