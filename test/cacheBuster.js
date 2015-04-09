var fs = require("fs");
var path = require("path");
var sinon = require("sinon");
var assert = require("assert");

var calculateFileChecksum = require("../lib/calculateFileChecksum");

var tmpPath = path.join(__dirname, "../tmp");
var tmpCss = "foo.css";

describe("CacheBuster", function () {
  before(createTempFiles);

  afterEach(function () {
    calculateFileChecksum.clearCache();
  });

  it("caches checksums by default", function (done) {
    var cacheBuster = require("../")({baseDirs: ["tmp"]});
    var spy = sinon.spy(fs, "readFileSync");
    var checksum = cacheBuster.checksum(tmpCss);

    sinon.assert.calledOnce(spy);
    assert.equal(checksum, cacheBuster.checksum(tmpCss));
    sinon.assert.calledOnce(spy);

    fs.readFileSync.restore();
    done();
  });

  it("does not cache checksums when cacheChecksums is set to false", function (done) {
    var cacheBuster = require("../")({baseDirs: ["tmp"], cacheChecksums: false});
    var spy = sinon.spy(fs, "readFileSync");

    cacheBuster.checksum(tmpCss);
    sinon.assert.calledOnce(spy);
    cacheBuster.checksum(tmpCss);
    sinon.assert.calledTwice(spy);

    fs.readFileSync.restore();
    done();
  });

  it("supports dynamically disabling cache", function (done) {
    var cacheBuster = require("../")({baseDirs: ["tmp"]});
    var spy = sinon.spy(fs, "readFileSync");

    cacheBuster.checksum(tmpCss);
    sinon.assert.calledOnce(spy);
    cacheBuster.checksum(tmpCss);
    sinon.assert.calledOnce(spy);

    cacheBuster.setCacheChecksums(false);
    cacheBuster.checksum(tmpCss);
    sinon.assert.calledTwice(spy);

    cacheBuster.setCacheChecksums(true);
    cacheBuster.checksum(tmpCss);
    sinon.assert.calledTwice(spy);

    fs.readFileSync.restore();
    done();
  });

  it("throws Error if file is missing", function (done) {
    var cacheBuster = require("../")({baseDirs: ["tmp"]});
    try {
      cacheBuster.checksum("does-not-exist");
    } catch (e) {
      assert.equal("Cannot find: does-not-exist in dirs: tmp", e.message);
      done();
    }
  });

  it("appends query parameter with checksum to file when bust is called", function (done) {
    var cacheBuster = require("../")({baseDirs: ["tmp"]});
    var checksum = cacheBuster.checksum(tmpCss);
    assert.equal(tmpCss + "?c=" + checksum, cacheBuster.bust(tmpCss));
    done();
  });
});

function createTempFiles() {
  try {
    fs.mkdirSync(tmpPath);
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }

  fs.writeFileSync(path.join(tmpPath, tmpCss), ".bar {}");
}
