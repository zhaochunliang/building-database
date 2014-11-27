var path = require("path");

var express = require("express");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var passport = require("passport");
var session = require("express-session")
var flash = require("connect-flash");

var authController = require("./controllers/auth")(passport);

var dbConfig = require("./config/db.js");
var mongoose = require("mongoose");


// --------------------------------------------------------------------
// SET UP MONGOOSE
// --------------------------------------------------------------------

mongoose.connect(dbConfig.url);


// --------------------------------------------------------------------
// SET UP EXPRESS
// --------------------------------------------------------------------

var app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, "/public/favicon.ico")));

app.use(logger("dev"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());

// Session handler
app.use(session({
  secret: "m@pzen&v1ziciti3s",
  resave: true,
  saveUninitialized: true
}));

// Configuring Passport
app.use(passport.initialize());
app.use(passport.session());

// Handle file uploads
// app.use(multer({dest: "./tmp/"}));

// Serve static files from directory
app.use(express.static(path.join(__dirname, "public")));

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
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err
    });
  });
} else {
  // Production error handler
  // No stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: {}
    });
  });
}

module.exports = app;