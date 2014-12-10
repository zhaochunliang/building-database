var debug = require("debug")("buildingDatabase");
var _ = require("underscore");
var Q = require("q");
var mv = require("mv");
var modelConverter = require("model-converter");
var UUID = require("uuid");
var LineByLineReader = require("line-by-line");
var JXON = require("jxon");

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
        var permPath = "/model-files/" + pathID + "/" + splitPath[1];
        var ext = permPath.split(".").pop();

        moveFiles.push([permPath, ext]);
        movePromises.push(Q.nfcall(mv, file, permPath, {mkdirp: true}));
      });

      var structureRegex = /(Vertices|Faces|Materials)+:\s(\d+)/;
      var structurePath;
      
      Q.all(movePromises).done(function() {
        debug("Moved files");

        // Add model paths to building entry
        _.each(moveFiles, function(file, index) {
          var type = file[1];
          var path = file[0];

          if (type === "obj") {
            structurePath = path;
          }

          building.models.push({
            type: type,
            path: path
          });
        });

        // Attach user to building entry
        building.userId = req.user._id;

        // Find model structure
        // TODO: Make into a promise
        if (structurePath) {
          // Pull vertex, face and material counts from the model files
          var vertices = false;
          var faces = false;
          var materials = false;

          var lr = new LineByLineReader(structurePath);

          lr.on("line", function (line) {
            var result = structureRegex.exec(line);
            
            if (!result) {
              return;
            }

            if (result[1] === "Vertices") {
              vertices = Number(result[2]);
            } else if (result[1] === "Faces") {
              faces = Number(result[2]);
            } else if (result[1] === "Materials") {
              materials = Number(result[2]);
            }

            // All structure gathered
            if (vertices !== false && faces !== false && materials !== false) {
              building.structure.vertices = vertices;
              building.structure.faces = faces;
              building.structure.materials = materials;

              building.save(function(err, savedBuilding) {
                if (err) {
                  res.send(err);
                }

                res.json({message: "Building added", building: savedBuilding});
              });

              lr.close();
            }
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
      }

      building.location = {
        type : "Point",
        coordinates : [req.body.centerLatitude, req.body.centerLongitude]
      };

      building.save(function(err, savedBuilding) {
        if (err) {
          res.send(err);
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
      }

      res.json(building);
    });
  };

  // Endpoint /api/building/:building_id.kml for GET
  var getBuildingKML = function(req, res) {
    Building.findById(req.params.building_id, function(err, building) {
      if (err) {
        res.send(err);
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
                "longitude": -0.01924,
                "latitude": 51.50358,
                "altitude": 0
              },
              "Orientation": {
                "heading": 0,
                "tilt": 0,
                "roll": 0
              },
              "Scale": {
                "x": 1,
                "y": 1,
                "z": 1
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