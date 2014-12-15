var debug = require("debug")("buildingDatabase");
var _ = require("underscore");
var Q = require("q");
var mv = require("mv");
var modelConverter = require("model-converter");
var UUID = require("uuid");
var LineByLineReader = require("line-by-line");
var JXON = require("jxon");
var fs = require("fs");

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

    console.log(convertQueue);

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

      var pathID = UUID.v4();
      var movePromises = [];
      var moveFiles = [];

      // Move model files to permanent path
      // Also, extract model data from .obj file
      _.each(tmpFiles, function(file, index) {
        var splitPath = file.split("tmp/");
        var permPath = "model-files/" + pathID + "/" + splitPath[1];
        var ext = permPath.split(".").pop();

        moveFiles.push([permPath, ext]);
        movePromises.push(Q.nfcall(mv, file, permPath, {mkdirp: true}));
      });

      var vertexRegex = /^v /;
      var faceRegex = /^f /;

      var structurePath;
      
      Q.all(movePromises).done(function() {
        debug("Moved files");

        // Add model paths to building entry
        _.each(moveFiles, function(file, index) {
          var type = file[1];
          var path = file[0];

          // Get file size
          var stats = fs.statSync(path);
          var fileSize = (stats.size) ? stats.size : 0;

          if (type === "obj") {
            structurePath = path;
          }

          building.models.push({
            type: type,
            path: "/" + path,
            fileSize: fileSize
          });
        });

        // Attach user to building entry
        building.userId = req.user._id;

        // Find model structure by manually counting lines in the .obj
        // TODO: Make into a promise
        if (structurePath) {
          // Pull vertex, face and material counts from the model files
          var vertices = 0;
          var faces = 0;

          var lr = new LineByLineReader(structurePath);

          lr.on("line", function (line) {
            var vertexResult = vertexRegex.exec(line);
            var faceResult = faceRegex.exec(line);
            
            if (!vertexResult && !faceResult) {
              return;
            }

            if (vertexResult) {
              vertices++;
            } else if (faceResult) {
              faces++;
            }
          });

          lr.on("end", function() {
            building.structure.vertices = vertices;
            building.structure.faces = faces;

            building.save(function(err, savedBuilding) {
              if (err) {
                res.send(err);
                return;
              }

              res.json({message: "Building added", building: savedBuilding});
            });
          });
        }
      }, function(err) {
        // TODO: Remove temporary files on error
        debug(err);
      });
    }, function(error) {
      // TODO: Remove temporary files on error
      debug(error);
    });
  };

  // Endpoint /api/buildings for PUT
  var putBuildings = function(req, res, next) {
    // TODO: Check that user has access to this building
    Building.findById(req.params.building_id, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (req.body.scale) {
        building.scale = req.body.scale;
      }

      if (req.body.angle) {
        building.angle = req.body.angle;
      }

      if (req.body.latitude && req.body.longitude) {
        building.location = {
          type : "Point",
          coordinates : [req.body.longitude, req.body.latitude]
        };
      }

      building.save(function(err, savedBuilding) {
        if (err) {
          res.send(err);
          return;
        }

        res.json({message: "Building updated", building: savedBuilding});
      });
    });
  };

  // Endpoint /api/building/ for GET
  var getBuilding = function(req, res) {
    Building.findById(req.params.building_id, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      res.json(building);
    });
  };

  // Endpoint /api/building/:building_id.kml for GET
  var getBuildingKML = function(req, res) {
    Building.findById(req.params.building_id, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      var daeModel = _.find(building.models, function(model) {
        return (model.type === "dae");
      });

      var kmlObj = {
        "kml": {
          "@xmlns": "http://www.opengis.net/kml/2.2",
          "Placemark": {
            "name": building.name,
            "Model": {
              "@id": building._id,
              "altitudeMode": "relativeToGround",
              "Location": {
                "longitude": building.location.coordinates[0] || -0.01924,
                "latitude": building.location.coordinates[1] || 51.50358,
                "altitude": 0
              },
              "Orientation": {
                "heading": building.angle || 0,
                "tilt": 0,
                "roll": 0
              },
              "Scale": {
                "x": building.scale || 1,
                "y": building.scale || 1,
                "z": building.scale || 1
              },
              "Link": {
                "href": daeModel.path
              }
            }
          }
        }
      };

      res.set("content-Type", "text/xml");
      res.send("<?xml version='1.0' encoding='UTF-8'?>" + JXON.stringify(kmlObj));
    });
  };

  return {
    getBuildings: getBuildings,
    postBuildings: postBuildings,
    putBuildings: putBuildings,
    getBuilding: getBuilding,
    getBuildingKML: getBuildingKML
  };
};