var express = require("express");
var app = express();

var cacheBuster = require("../../")(["public/css", "public/js"]);

// Expose bust function to views
app.locals.bust = cacheBuster.bust;

// Use cacheBuster middleware, set cacheChecksums to false in development config. Defaults to true.
var validateChecksum = cacheBuster.validateChecksumMiddleware();

// Set up serving of static files using the middleware.
// Note that the middleware does NOT include the mounting point when resolving the file path.
// This means that the path used with the bust() function must exactly match the path after
// the mounting point and the file path after any baseDir.
app.use("/css", validateChecksum, express.static("public/css", {maxAge: "365d"}));
app.use("/js", validateChecksum, express.static("public/js", {maxAge: "365d"}));

app.get("/", function (req, res) {
  return res.render("index.jade");
});

// Don't start listener when required from tests
if (require.main === module) {
  var server = app.listen(1337, function () {
    console.log("Server listening on", server.address().port);
  });
}

// Expose app to tests
module.exports = app;
