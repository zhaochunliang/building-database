// var Q = require("q");
// var modelConverter = require("model-converter");

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

    var building = new Building();

    building.name = "Testing";
    building.location = {
      type : "Point",
      coordinates : [51, 0]
    };

    building.save(function(err) {
      if (err) {
        res.send(err);
      }

      res.json({message: "Building added", data: building});
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