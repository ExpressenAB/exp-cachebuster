var request = require("supertest");
var cheerio = require("cheerio");

describe("Example App", function () {
  var exampleApp, originalCwd;

  before(function () {
    originalCwd = process.cwd();

    // The example application must be started from its own directory
    process.chdir(__dirname + "/example-app");
    exampleApp = require("./example-app/app.js");
  });

  after(function () {
    process.chdir(originalCwd);
  });

  it("Serves busted client side resources", function (done) {
    request(exampleApp)
      .get("/")
      .expect(/\/css\/main__c[0-9a-f]{32}\.css/)
      .expect(/\/js\/main__c[0-9a-f]{32}\.js/)
      .end(done);
  });

  it("Serves the client side resources with long cache headers", function (done) {
    request(exampleApp)
      .get("/")
      .end(function (err, response) {
        if (err) return done(err);

        return request(exampleApp)
          .get(getStylesheetPath(response))
          .expect("Cache-Control", /max-age=31536000/)
          .end(done);
      });
  });

});

function getStylesheetPath(response) {
  var $ = cheerio.load(response.text);

  return $("link[rel=stylesheet]").attr("href");
}
