var fs = require("fs");
var path = require("path");
var sinon = require("sinon");
var assert = require("assert");
var expect = require("chai").expect;

var tmpPath = path.join(__dirname, "../tmp");
var tmpCss = "foo.css";

describe("CacheBuster", function () {
  before(createTempFiles);

  it("caches checksums by default", function (done) {
    var cacheBuster = require("../")(["tmp"]);
    var spy = sinon.spy(fs, "readFileSync");
    var checksum = cacheBuster.checksum(tmpCss);

    sinon.assert.calledOnce(spy);
    assert.equal(checksum, cacheBuster.checksum(tmpCss));
    sinon.assert.calledOnce(spy);

    fs.readFileSync.restore();
    done();
  });

  it("does not cache checksums when cacheChecksums is set to false", function (done) {
    var cacheBuster = require("../")(["tmp"], false);
    var spy = sinon.spy(fs, "readFileSync");
    var checksum = cacheBuster.checksum(tmpCss);

    sinon.assert.calledOnce(spy);
    assert.equal(checksum, cacheBuster.checksum(tmpCss));
    sinon.assert.calledTwice(spy);

    fs.readFileSync.restore();
    done();
  });

  it("returns undefined if file is missing", function () {
    var cacheBuster = require("../")(["tmp"]);
    expect(cacheBuster.checksum("does-not-exist")).to.eql(undefined);
  });

  it("renames file and adds checksum to file when bust is called", function (done) {
    var cacheBuster = require("../")(["tmp"]);
    var checksum = cacheBuster.checksum(tmpCss);
    expect(cacheBuster.bust(tmpCss)).to.equal("foo__c" + checksum + ".css");
    done();
  });

  it("renames file and adds checksum to file when bust is called and file is in subfolder", function (done) {
    var cacheBuster = require("../")(["test/example-app/public"]);
    var tmpCssSub = "css/main.css";
    var checksum = cacheBuster.checksum(tmpCssSub);
    expect(cacheBuster.bust(tmpCssSub)).to.equal("css/main__c" + checksum + ".css");
    done();
  });

  it("throws Error when trying to bust file that doesn't exist", function (done) {
    var cacheBuster = require("../")(["tmp"]);
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
