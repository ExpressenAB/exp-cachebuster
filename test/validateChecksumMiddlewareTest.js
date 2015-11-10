var fs = require("fs");
var path = require("path");
var sinon = require("sinon");
var express = require("express");
var request = require("supertest");

var tmpFileChecksum;
var checksums;
var middleware;
var tmpPath;
var tmpFileName;
var tmpFilePath;

var cacheBuster;

describe("ValidateChecksumMiddleware", function () {

  before(function () {
    setupFile("tmp", "/foo.css");
    createTempFiles();
    setupChecksums();
    setupMiddleware();
  });

  describe("Changes Cache-Control header", function () {
    it("sets the Cache-Control header to no-cache when checksums doesn't match", function (done) {
      var server = express();
      server.use(middleware);
      server.get(tmpFileName, function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendFile(tmpFilePath);
      });

      request(server)
        .get(generateFileWithChecksum(tmpFileName))
        .expect("Cache-Control", "no-cache, no-store, must-revalidate")
        .expect("Edge-control", "no-store")
        .expect("Pragma", "no-cache")
        .expect("Expires", "-1")
        .expect("max-age", "0")
        .expect(200, done);
    });

    it("sets the Cache-Control header to no-cache when the requested checksum is not found", function (done) {
      var server = express();
      server.use(middleware);
      server.get("/missing-file", function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendStatus(404);
      });

      request(server)
        .get(generateFileWithChecksum("missing-file", (new Array(33)).join("b")))
        .expect("Cache-Control", "no-cache, no-store, must-revalidate")
        .expect("Edge-control", "no-store")
        .expect("Pragma", "no-cache")
        .expect("Expires", "-1")
        .expect("max-age", "0")
        .expect(404, done);
    });
  });

  describe("Doesn't changes Cache-Control header", function () {
    it("does nothing to Cache-Control header when checksum matches", function (done) {

      var server = express();
      server.use(middleware);
      server.get(tmpFileName, function (req, res) {
        res.set("Cache-Control", "public, max-age=100");
        res.sendFile(tmpFilePath);
      });

      request(server)
        .get(generateFileWithChecksum(tmpFileName, tmpFileChecksum))
        .expect("Cache-Control", "public, max-age=100")
        .expect(200, done);
    });

    it("does nothing to the Cache-Control header when filename is missing checksum", function (done) {
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
    server.use("/static", middleware);
    server.get("/static" + tmpFileName, function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendFile(tmpFilePath);
    });

    request(server)
      .get("/static" + generateFileWithChecksum(tmpFileName, tmpFileChecksum))
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
      .get(generateFileWithChecksum(tmpFileName, tmpFileChecksum))
      .expect(200, function (err) {
        if (err) {
          done(err);
        }
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    request(server)
      .get(generateFileWithChecksum(tmpFileName))
      .expect(200, function (err) {
        if (err) {
          done(err);
        }
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    request(server)
      .get(tmpFileName)
      .expect(200, function (err) {
        if (err) {
          done(err);
        }
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    request(server)
      .get("/not-found")
      .expect(404, function (err) {
        if (err) {
          done(err);
        }
      });
    sinon.assert.notCalled(readSpy);
    sinon.assert.notCalled(existsSpy);

    fs.readFileSync.restore();
    fs.existsSync.restore();
    done();
  });

  it("does nothing to Cache-Control header when checksum matches and querystring is used", function (done) {

    var server = express();
    server.use(middleware);
    server.get(tmpFileName, function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendFile(tmpFilePath);
    });

    request(server)
      .get(generateFileWithChecksum(tmpFileName, tmpFileChecksum) + "?c=" + tmpFileChecksum)
      .expect("Cache-Control", "public, max-age=100")
      .expect(200, done);

  });

});

describe("Subfolders", function () {

  before(function () {
    setupFile("test/example-app/public", "/css/main.css");
    setupChecksums();
    setupMiddleware();
  });

  it("does handle files in subfolders", function (done) {
    var server = express();
    server.use(middleware);
    server.get(tmpFileName, function (req, res) {
      res.set("Cache-Control", "public, max-age=100");
      res.sendFile(tmpFilePath);
    });

    request(server)
      .get("/css" + generateFileWithChecksum(tmpFileName, tmpFileChecksum))
      .expect("Cache-Control", "public, max-age=100")
      .expect(200, done);
  });
});

function setupFile(filepath, filename) {
  tmpPath = filepath;
  tmpFileName = filename;
  tmpFilePath = path.join(__dirname, "../", tmpPath, tmpFileName);
}

function setupChecksums() {
  cacheBuster = require("../")([tmpPath]);
  tmpFileChecksum = cacheBuster.checksum(tmpFileName);

  checksums = {};
  checksums[tmpFileName] = tmpFileChecksum;
}

function setupMiddleware() {
  middleware = cacheBuster.validateChecksumMiddleware(checksums);
}

function generateFileWithChecksum(filename, checksum) {
  checksum = checksum || (new Array(33)).join("a");
  var extname = path.extname(filename);
  return "/" + path.basename(filename, extname) + "__c" + checksum + extname;
}

function createTempFiles() {
  try {
    fs.mkdirSync(path.join(__dirname, tmpPath));
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }

  fs.writeFileSync(tmpFilePath, ".bar {}");
}
