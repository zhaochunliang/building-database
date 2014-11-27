var debug = require("debug")("buidingDatabase");
// var Q = require("q");
var modelConverter = require("model-converter");

var Building = require("../models/building");

module.exports = function (passport) {
  // Endpoint /api/buildings for GET
  var getBuildings = function(req, res) {
    Building.find(function(err, buildings) {
      if (err) {
        res.send(err);
      }

      res.json(buildings);
    });
  };

  // Endpoint /api/buildings for POST
  var postBuildings = function(req, res, next) {
    // TODO: Perform validation on received data
    // - http://mongoosejs.com/docs/validation.html
    // TODO: Delete tmp file if upload or conversion fails
    // TODO: Report back progress of upload and coversion (realtime with Pusher?)
    // TODO: Move tmp model files to a permanent location

    debug(req.session);
    debug(req.body);
    debug(req.files);

    var modelPath = req.files.model.path;
    var modelExt = req.files.model.extension;

    // TODO: Probably worth splitting the coversion logic into a function

    // Convert to Collada
    if (modelExt !== "dae") {
      // TODO: Use promise
      modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "dae").then(function() {
        debug("Upload promise complete");
      }, function(error) {
        debug(error);
      });
    }

    // Convert to Wavefront Object
    if (modelExt !== "obj") {
      modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "obj").then(function() {
        debug("Upload promise complete");
      }, function(error) {
        debug(error);
      });
    }

    var building = new Building();

    building.name = req.body.name;
    building.location = {
      type : "Point",
      coordinates : [req.body.centerLatitude, req.body.centerLongitude]
    };

    // TODO: Add model paths to building entry
    
    // TODO: Attach user to building entry
    building.userId = req.user._id;

    building.save(function(err) {
      if (err) {
        res.send(err);
      }

      res.json({message: "Building added", building: building});
    });
  };

  // Endpoint /api/building/ for GET
  var getBuilding = function(req, res) {
    Building.findById(req.params.building_id, function(err, building) {
      if (err) {
        res.send(err);
      }

      res.json(building);
    });
  };

  return {
    getBuildings: getBuildings,
    postBuildings: postBuildings,
    getBuilding: getBuilding
  };
};


// // Model upload endpoint
// // TODO: Link this to addId so it can be handled correctly on completion (filename added to DB, moved to right location, etc)
// // TODO: Delete tmp file if upload or conversion fails
// // TODO: Report back progress of upload and coversion (realtime with Pusher?)
// // TODO: Move tmp model files to a permanent location (uploaded and converted)
// // TODO: Handle situation where this completes before /add call is finished
// // TODO: Handle situation where this completes after /add call is finished
// app.post("/add", function(req, res) {
//   debug(req.session);
//   debug(req.body);
//   debug(req.files);

//   // Basic check of addID validity
//   if (_.indexOf(req.session.addIds, req.body.addId) < 0) {
//     debug("Add session ID is not valid");
//     res.sendStatus(400);
//     return;
//   }

//   var modelPath = req.files.model.path;
//   var modelExt = req.files.model.extension;

//   // Convert to Collada
//   if (modelExt !== "dae") {
//     // TODO: Use promise
//     modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "dae").then(function() {
//       debug("Upload promise complete");
//     }, function(error) {
//       debug(error);
//     });
//   }

//   // Convert to Wavefront Object
//   if (modelExt !== "obj") {
//     modelConverter.convert(modelPath, modelPath.split(modelExt)[0] + "obj").then(function() {
//       debug("Upload promise complete");
//     }, function(error) {
//       debug(error);
//     });
//   }

//   // TODO: Add metadata and model path to database

//   var dbEntry = {
//     title: req.body.title,
//     rawModel: modelPath,
//     modelFormats: {dae: false, obj: false, ply: false}
//   };

//   debug(dbEntry);

//   res.json({id: "building_id"});
// });