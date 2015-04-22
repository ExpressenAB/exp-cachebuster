exp-cachebuster
===============

Yet another cache buster module. It consists of two parts:

1. A `bust` function that you use from your views to append a checksum parameter to your client side resources.
2. A `validateChecksumMiddleware` that verifies incoming checksums and, if it does not match the file's actual checksum, overwrites the `Cache-Control` header so that the file is not cached. 

The module is meant to be used in an environment where an express application is run on several servers with a load balancer in front and where the application is updated one server at a time. In this scenario a user can request a page and get the HTML from application version X but when the request for a stylesheet or javascript is made these requests can end up being served from application version Y on another server. 

When this particular situation happens it is very important to not serve these resources with long lived cache headers since this will pollute the CDN with client side resources _of the wrong version_. We could simply respond with a `404` in this situation but we prefer to actually serve the wrong resource version so that the user can at least see the site. On the next page navigation the user will most likely get the correct version. 


## Usage

```
npm install exp-cachebuster --save
```

Where you setup your express application:

```javascript
var express = require("express");
var app = express();

var cacheBuster = require("exp-cachebuster")(["public/css", "public/js"]);

// Expose bust function to views
app.locals.bust = cacheBuster.bust;

// Setup the checksum validation middleware
var validateChecksum = cacheBuster.validateChecksumMiddleware();

app.use("/css", validateChecksum, express.static("public/css", {maxAge: "365d"}));
app.use("/js", validateChecksum, express.static("public/js", {maxAge: "365d"}));
```

In a view you might use the bust function like this:

```jade
link(rel="stylesheet", href="/css/" + bust("main.css"))
```

See <https://github.com/ExpressenAB/exp-cachebuster/tree/master/test/example-app> for a complete example application.


### Usage during development

By default file checksums will be caches in memory since files are not expected to change during the lifetime of the started application. During development however you just want to reload the page and pick up any changes. The cache buster has the flag `useCachedChecksums` for this purpose.

The following snippet will make sure the file checksum is always calculated when bust is called if `NODE_ENV` is set to `development`:

```javascript
var cacheBuster = require("exp-cachebuster")(["public/css", "public/js"], process.env.NODE_ENV !== "development");
```

A advantage of using a cache buster during development is that any change to a client side resource will result in a new checksum which will lead to the browser fetching the new version.

Note that view or fragment caching can result in getting old client side resources. These should be disabled during development for the HTML that contains references to scripts, stylesheets etc. 
