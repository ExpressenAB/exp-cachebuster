var fs = require("fs");
var path = require("path");
var sinon = require("sinon");
var assert = require("assert");

var tmpPath = path.join(__dirname, "../tmp");
var tmpSubPath1 = path.join(__dirname, "../tmp/tmp1");
var tmpSubPath2 = path.join(__dirname, "../tmp/tmp2");
var tmp1Css = "foo1.css";
var tmp2Css = "foo2.css";

describe("Warm-up", function () {
  before(createTempFiles);

  it("pre-calculate checksums for file in static folders", function (done) {
    var cacheBuster = require("../")(["tmp/tmp1", "tmp/tmp2"]);
    var bustFn = sinon.spy(cacheBuster, "bust");

    cacheBuster.warmUpChecksumCache(function () {
      sinon.assert.calledTwice(bustFn);
      assert(bustFn.calledWith(tmp1Css));
      assert(bustFn.calledWith(tmp2Css));
      cacheBuster.bust.restore();
      done();
    });
  });
});

function createTempFiles() {
  [tmpPath, tmpSubPath1, tmpSubPath2].forEach(function (dir) {
    try {
      fs.mkdirSync(dir);
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
  });

  fs.writeFileSync(path.join(tmpSubPath1, tmp1Css), ".bar1 {}");
  fs.writeFileSync(path.join(tmpSubPath2, tmp2Css), ".bar2 {}");
}
