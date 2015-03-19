var debug = require("debug")("polygoncity");
var path = require("path");

var express = require("express");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var passport = require("passport");
var session = require("express-session")
var flash = require("connect-flash");
var multer = require("multer");
var paginate = require("express-paginate");

var authController = require("./controllers/auth")(passport);

var config = require("./config/config.js");
var mongoose = require("mongoose");


// --------------------------------------------------------------------
// SET UP MONGOOSE
// --------------------------------------------------------------------

if (!config.db || !config.db.url) {
  throw new Error("Database connection settings not found");
  return;
}

mongoose.connect(config.db.url);


// --------------------------------------------------------------------
// SET UP EXPRESS
// --------------------------------------------------------------------

var app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Uncomment after placing favicon in /public
//app.use(favicon(path.join(__dirname, "/public/favicon.ico")));

// Log errors (anything above HTTP 400)
app.use(logger("dev", {
  skip: function (req, res) { return res.statusCode < 400 }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());

// Session handler
if (!config.session.secret) {
  throw new Error("Session secret settings not found");
  return;
}

app.use(session({
  secret: config.session.secret,
  resave: true,
  saveUninitialized: true
}));

// Configuring Passport
app.use(passport.initialize());
app.use(passport.session());

// Handle file uploads
app.use(multer({dest: "./tmp/"}));

// Pagination defaults
app.use(paginate.middleware(7, 50));

// Serve static files from directory
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/model-files", express.static(path.join(__dirname, "model-files")));

// Pretty HTML output
if (app.get("env") === "development") {
  app.locals.pretty = true;
}

// Routes
var routes = require("./router")(app, passport);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error handlers

// Development error handler
// Will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    console.error(err.stack);

    res.status(err.status || 500);

    if (req.xhr) {
      res.json({error: {status: err.status, stack: err.stack, message: err.message}});
      return;
    } else {
      res.render("error", {
        bodyId: "error",
        status: err.status,
        message: err.message,
        error: err
      });
    }
  });
} else {
  // Production error handler
  // No stacktraces leaked to user
  app.use(function(err, req, res, next) {
    console.error(err.stack);

    res.status(err.status || 500);

    if (req.xhr) {
      res.json({status: err.status, message: err.message});
      return;
    } else {
      res.render("error", {
        bodyId: "error",
        status: err.status,
        message: err.message,
        error: {}
      });
    }
  });
}

module.exports = app;