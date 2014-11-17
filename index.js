var silent = false;

var express = require("express");
var errorHandler = require("errorhandler");
var multer  = require("multer")
var modelConverter = require("model-converter");

var app = express();
var root = __dirname + "/public";

// --------------------------------------------------------------------
// SET UP EXPRESS
// --------------------------------------------------------------------

// Simple logger
app.use(function(req, res, next){
  console.log("%s %s", req.method, req.url);
  next();
});

// Error handler
app.use(errorHandler({
  dumpExceptions: true,
  showStack: true
}));

// Serve static files from directory
app.use(express.static(root));

// Handle file uploads
app.use(multer({dest: "./tmp/"}));

// Upload endpoint
// TODO: Delete tmp file if upload or conversion fails
app.post("/upload", function(req, res) {
  console.log("Upload file");
  console.log(req.body);
  console.log(req.files);

  var modelPath = req.files.model.path;
  var modelExt = req.files.model.extension;

  if (modelExt !== "dae") {
    modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "dae");
  }

  if (modelExt !== "obj") {
    modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "obj");
  }

  res.sendStatus(200);
});

// Open server on specified port
if (!silent) console.log("Starting Express server");
app.listen(process.env.PORT || 5001);