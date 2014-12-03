var debug = require("debug")("buildingDatabase");
var _ = require("underscore");
var Q = require("q");
var mv = require("mv");
var modelConverter = require("model-converter");
var UUID = require("uuid");

var Building = require("../models/building");

module.exports = function (passport) {
  // Endpoint /api/buildings for GET
  var getBuildings = function(req, res) {
    Building.find(function(err, buildings) {
      if (err) {
        res.send(err);
      }

      res.json({buildings: buildings});
    });
  };

  // Endpoint /api/buildings for POST
  var postBuildings = function(req, res, next) {
    // TODO: Perform validation on received data
    // - http://mongoosejs.com/docs/validation.html
    // TODO: Delete tmp file if upload or conversion fails
    // TODO: Report back progress of upload and coversion (realtime with Pusher?)

    debug(req.session);
    debug(req.body);
    debug(req.files);

    var modelPath = req.files.model.path;
    var modelExt = req.files.model.extension;

    // Record of files created for this building
    var tmpFiles = [];
    tmpFiles.push(modelPath);

    // TODO: Probably worth splitting the coversion logic into a function

    var convertQueue = [];

    // Convert to Collada
    if (modelExt !== "dae") {
      convertQueue.push([modelConverter.convert, [modelPath, modelPath.split(modelExt)[0] + "dae"]]);
    }

    // Convert to Wavefront Object
    if (modelExt !== "obj") {
      convertQueue.push([modelConverter.convert, [modelPath, modelPath.split(modelExt)[0] + "obj"]]);
    }

    // TODO: Wait for all conversion promises to complete before adding to db
    Q.all(convertQueue.map(function(promiseFunc) {
      return promiseFunc[0].apply(this, promiseFunc[1]).then(function(path) {
        debug("Upload promise complete");
        debug(path);

        tmpFiles.push(path);
      });
    })).done(function() {
      var building = new Building();

      building.name = req.body.name;
      building.location = {
        type : "Point",
        coordinates : [req.body.centerLatitude, req.body.centerLongitude]
      };

      var pathID = UUID.v4();
      var movePromises = [];
      var moveFiles = [];

      // Move model files to permanent path
      _.each(tmpFiles, function(file, index) {
        var splitPath = file.split("tmp/");
        var permPath = "model-files/" + pathID + "/" + splitPath[1];
        var ext = permPath.split(".").pop();

        moveFiles.push([permPath, ext]);
        movePromises.push(Q.nfcall(mv, file, permPath, {mkdirp: true}));
      });

      Q.all(movePromises).done(function() {
        debug("Moved files");

        // Add model paths to building entry
        _.each(moveFiles, function(file, index) {
          building.models.push({
            type: file[1],
            path: file[0]
          });
        });

        // Attach user to building entry
        building.userId = req.user._id;

        building.save(function(err, savedBuilding) {
          if (err) {
            res.send(err);
          }

          res.json({message: "Building added", building: savedBuilding});
        });
      }, function(err) {
        // TODO: Remove temporary files on error
        debug(err);
      });
    }, function(error) {
      // TODO: Remove temporary files on error
      debug(error);
    });
  };

  // Endpoint /api/building/ for GET
  var getBuilding = function(req, res) {
    Building.findById(req.params.building_id, function(err, building) {
      if (err) {
        res.send(err);
      }

      res.json({building: building});
    });
  };

  return {
    getBuildings: getBuildings,
    postBuildings: postBuildings,
    getBuilding: getBuilding
  };
};