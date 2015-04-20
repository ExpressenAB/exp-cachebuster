var fs = require("fs");
var path = require("path");
var sinon = require("sinon");
var assert = require("assert");
var expect = require("chai").expect;

var cacheBuster;
var tmpPath = path.join(__dirname, "../tmp");
var tmpCss = "foo.css";

describe("CacheBuster", function () {
  before(createTempFiles);

  beforeEach(function () {
    cacheBuster = require("../")(["tmp"]);
  });

  it("caches checksums", function (done) {
    var spy = sinon.spy(fs, "readFileSync");
    var checksum = cacheBuster.checksum(tmpCss);

    sinon.assert.calledOnce(spy);
    assert.equal(checksum, cacheBuster.checksum(tmpCss));
    sinon.assert.calledOnce(spy);

    fs.readFileSync.restore();
    done();
  });

  it("returns undefined if file is missing", function () {
    expect(cacheBuster.checksum("does-not-exist")).to.eql(undefined);
  });

  it("appends query parameter with checksum to file when bust is called", function (done) {
    var checksum = cacheBuster.checksum(tmpCss);
    assert.equal(tmpCss + "?c=" + checksum, cacheBuster.bust(tmpCss));
    done();
  });

  it("throws Error when trying to bust file that doesn't exist", function (done) {
    try {
      cacheBuster.bust("foo.bar");
      done(new Error("Should have thrown!"));
    } catch (e) {
      done();
    }
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
