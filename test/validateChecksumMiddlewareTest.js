var fs = require("fs");
var path = require("path");
var express = require("express");
var request = require("supertest");

// In a real application you would use require("exp-cacheBuster")({baseDirs: ...})
var cacheBuster = require("../")({baseDirs: ["tmp"]});

var tmpPath = path.join(__dirname, "../tmp");
var tmpFileName = "/foo.css";
var tmpFilePath = path.join(tmpPath, tmpFileName);

describe("ValidateChecksumMiddleware", function () {

  before(createTempFiles);

  afterEach(function () {
    cacheBuster.clearChecksumCache();
  });

  it("does nothing to Cache-Control header when checksum matches", function (done) {
    var checksum = cacheBuster.checksum(tmpFileName);
    var server = express();
    server.use(cacheBuster.validateChecksumMiddleware());
    server.get(tmpFileName, function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendFile(tmpFilePath);
    });

    request(server)
      .get(tmpFileName + "?c=" + checksum)
      .expect("Cache-Control", "public, max-age=100")
      .expect(200, done);
  });

  it("sets the Cache-Control header to no-cache when checksums doesn't match", function (done) {
    var server = express();
    server.use(cacheBuster.validateChecksumMiddleware());
    server.get(tmpFileName, function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendFile(tmpFilePath);
    });

    request(server)
      .get(tmpFileName + "?c=invalid-checksum")
      .expect("Cache-Control", "no-cache, no-store, must-revalidate")
      .expect(200, done);
  });

  it("does nothing when the file is missing", function (done) {
    var server = express();
    server.use(cacheBuster.validateChecksumMiddleware());
    server.get("/missing-file", function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendStatus(404);
    });

    request(server)
      .get("/missing-file" + "?c=some-checksum")
      .expect("Cache-Control", "public, max-age=100")
      .expect(404, "Not Found", done);
  });
});

function createTempFiles() {
  try {
    fs.mkdirSync(tmpPath);
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }

  fs.writeFileSync(tmpFilePath, ".bar {}");
}
