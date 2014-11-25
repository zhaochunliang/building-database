// var _ = require("underscore");
var path = require("path");

var express = require("express");
var favicon = require("serve-favicon");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var passport = require("passport");
var session = require("express-session")
var errorHandler = require("errorhandler");
var multer = require("multer");
var flash = require("connect-flash");

var initPassport = require("./passport/init");
var dbConfig = require("./config/db.js");
var mongoose = require("mongoose");

// Move to relevant route
// var Q = require("q");
// var UUID = require("uuid");
// var modelConverter = require("model-converter");
// var pendingUploads = {};
// var pendingMetadata = {};

var app = express();


// --------------------------------------------------------------------
// SET UP MONGOOSE
// --------------------------------------------------------------------

mongoose.connect(dbConfig.url);


// --------------------------------------------------------------------
// SET UP EXPRESS
// --------------------------------------------------------------------

// View engine setup
app.set("views", __dirname + "/views");
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Session handler
app.use(session({
  secret: "m@pzen&v1ziciti3s",
  resave: true,
  saveUninitialized: true
}));

// Configuring Passport
app.use(passport.initialize());
app.use(passport.session());

// Initialise Passport
initPassport(passport);

app.use(flash());

// Handle file uploads
app.use(multer({dest: "./tmp/"}));

// Serve static files from directory
app.use(express.static(path.join(__dirname, "public")));

// Routes
var routes = require("./routes/index")(passport);

app.use("/", routes);

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
}

// Production error handler
// No stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {}
  });
});

// app.get("/browse", function(req, res) {});
// app.get("/search", function(req, res) {});
// app.get("/building/:id", function(req, res) {});
// app.get("/register", function(req, res) {});

// // Add model form
// // TODO: Remove addId from user session after a certain period (a few days?)
// app.get("/add", function(req, res) {
//   // Generate unique identifier to track add progress
//   var id = UUID.v4();

//   if (!req.session.addIds) {
//     req.session.addIds = [];
//   }

//   // Store identifier in the user session
//   // Using an array to handle situation where user has multiple add tabs open
//   req.session.addIds.push(id);

//   res.render("add", {addId: id});
// });

// app.post("/login", function(req, res) {});

// // Model upload endpoint
// // TODO: Link this to addId so it can be handled correctly on completion (filename added to DB, moved to right location, etc)
// // TODO: Delete tmp file if upload or conversion fails
// // TODO: Report back progress of upload and coversion (realtime with Pusher?)
// // TODO: Move tmp model files to a permanent location (uploaded and converted)
// // TODO: Handle situation where this completes before /add call is finished
// // TODO: Handle situation where this completes after /add call is finished
// app.post("/add", function(req, res) {
//   console.log(req.session);
//   console.log(req.body);
//   console.log(req.files);

//   // Basic check of addID validity
//   if (_.indexOf(req.session.addIds, req.body.addId) < 0) {
//     console.log("Add session ID is not valid");
//     res.sendStatus(400);
//     return;
//   }

//   var modelPath = req.files.model.path;
//   var modelExt = req.files.model.extension;

//   // Convert to Collada
//   if (modelExt !== "dae") {
//     // TODO: Use promise
//     modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "dae").then(function() {
//       console.log("Upload promise complete");
//     }, function(error) {
//       console.log(error);
//     });
//   }

//   // Convert to Wavefront Object
//   if (modelExt !== "obj") {
//     modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "obj").then(function() {
//       console.log("Upload promise complete");
//     }, function(error) {
//       console.log(error);
//     });
//   }

//   // TODO: Add metadata and model path to database

//   var dbEntry = {
//     title: req.body.title,
//     rawModel: modelPath,
//     modelFormats: {dae: false, obj: false, ply: false}
//   };

//   console.log(dbEntry);

//   res.json({id: "building_id"});
// });

// Add model metadata to database
// TODO: Remove addId from user session when finished
// TODO: Link this up with files added through the /upload endpoint
// TODO: Handle situation where this completes before /upload call is finished
// TODO: Handle situation where this completes after /upload call is finished
// app.post("/add", function(req, res) {
//   console.log(req.session);
//   console.log(req.body);

//   // Basic check of addID validity
//   if (_.indexOf(req.session.addIds, req.body.addId) < 0) {
//     console.log("Add session ID is not valid");
//     res.sendStatus(400);
//     return;
//   }

//   // Check if upload has finished
//   // If so, move files to permanent folder and grab file paths

//   // Else, add to database, mark as incomplete, add to pending metadata and wait for upload to be completed
//   pendingMetadata[req.body.addId] = "database_row_id";

//   res.sendStatus(200);
// });

module.exports = app;