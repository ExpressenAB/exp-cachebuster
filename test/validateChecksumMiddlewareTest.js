var fs = require("fs");
var path = require("path");
var sinon = require("sinon");
var express = require("express");
var request = require("supertest");

var tmpFileChecksum;
var checksums;
var middleware;
var tmpPath = path.join(__dirname, "../tmp");
var tmpFileName = "/foo.css";
var tmpFilePath = path.join(tmpPath, tmpFileName);

var cacheBuster;

describe("ValidateChecksumMiddleware", function () {

  before(function () {
    createTempFiles();

    cacheBuster = require("../")(["tmp"]);
    tmpFileChecksum = cacheBuster.checksum(tmpFileName);
    checksums = {};
    checksums[tmpFilePath] = tmpFileChecksum;

    middleware = cacheBuster.validateChecksumMiddleware(checksums);
  });

  beforeEach(function () {
    cacheBuster = require("../")(["tmp"]);
  });

  describe("without checksum caching", function() {
    var cacheBusterWithoutCaching;

    beforeEach(function () {
      cacheBusterWithoutCaching = require("../")(["tmp"], false);
      cacheBusterWithoutCaching.bust(tmpFileName);
    });

    it ("returns headers for caching if checksum is correct", function(done) {
      var server = express();
      server.use(cacheBusterWithoutCaching.validateChecksumMiddleware());
      server.get(tmpFileName, function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendFile(tmpFilePath);
      });

      request(server)
          .get(tmpFileName + "?c=" + tmpFileChecksum)
          .expect("Cache-Control", "public, max-age=100")
          .expect(200, done);
    });
  });

  describe("Sets the Cache-Control header to no-cache", function () {
    it("when checksums doesn't match", function (done) {
      var server = express();
      server.use(middleware);
      server.get(tmpFileName, function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendFile(tmpFilePath);
      });

      request(server)
        .get(tmpFileName + "?c=invalid-checksum")
        .expect("Cache-Control", "no-cache, no-store, must-revalidate")
        .expect("Edge-control", "no-store")
        .expect("Pragma", "no-cache")
        .expect("Expires", "-1")
        .expect("max-age", "0")
        .expect(200, done);
    });

    it("when the requested checksum is not found", function (done) {
      var server = express();
      server.use(middleware);
      server.get("/missing-file?c=probably-valid-checksum", function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendStatus(404);
      });

      request(server)
        .get("/missing-file" + "?c=some-checksum")
        .expect("Cache-Control", "no-cache, no-store, must-revalidate")
        .expect("Edge-control", "no-store")
        .expect("Pragma", "no-cache")
        .expect("Expires", "-1")
        .expect("max-age", "0")
        .expect(404, done);
    });
  });

  describe("doesn't change Cache-Control header", function () {
    it("when checksum matches", function (done) {
      var server = express();
      server.use(middleware);
      server.get(tmpFileName, function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendFile(tmpFilePath);
      });

      request(server)
        .get(tmpFileName + "?c=" + tmpFileChecksum)
        .expect("Cache-Control", "public, max-age=100")
        .expect(200, done);
    });

    it("when query parameter c is missing", function (done) {
      var server = express();
      server.use(middleware);
      server.get(tmpFileName, function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendFile(tmpFilePath);
      });

      request(server)
        .get(tmpFileName)
        .expect("Cache-Control", "public, max-age=100")
        .expect(200, done);
    });
  });

  it("does not include the mounting point when resolving file path", function (done) {
    var server = express();
    server.use("static", middleware);
    server.get("/static" + tmpFileName, function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendFile(tmpFilePath);
    });

    request(server)
      .get("/static" + tmpFileName + "?c=" + tmpFileChecksum)
      .expect("Cache-Control", "public, max-age=100")
      .expect(200, done);
  });

  it("does not try to access the fs at any time", function (done) {
    var readSpy = sinon.spy(fs, "readFileSync");
    var existsSpy = sinon.spy(fs, "existsSync");

    var server = express();
    server.use("/", middleware);
    server.get(tmpFileName, function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendFile(tmpFilePath);
    });

    request(server)
      .get(tmpFileName + "?c=" + tmpFileChecksum)
      .expect(200, function (err) {
        if (err) {done(err);}
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    request(server)
      .get(tmpFileName + "?c=invalid-checksum")
      .expect(200, function (err) {
        if (err) {done(err);}
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    request(server)
      .get(tmpFileName)
      .expect(200, function (err) {
        if (err) {done(err);}
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    request(server)
      .get("/not-found")
      .expect(404, function (err) {
        if (err) {done(err);}
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    fs.readFileSync.restore();
    fs.existsSync.restore();
    done();
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
