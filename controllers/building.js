var debug = require("debug")("polygoncity");
var _ = require("underscore");
var Q = require("q");
var mv = require("mv");
var modelConverter = require("model-converter");
var UUID = require("uuid");
var LineByLineReader = require("line-by-line");
var JXON = require("jxon");
var fs = require("fs");
var mkdirp = require("mkdirp");
var AdmZip = require("adm-zip");
var archiver = require("archiver");
var async = require("async");
var path = require("path");
var request = require("request");
var shortId = require("shortid");

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
    // TODO: Report back progress of upload and coversion (realtime with Pusher?)
    // TODO: Validate uploaded materials (for dodgy stuff, etc)
    // TODO: Generally tidy things up and move logic out into external methods

    debug(req.session);
    debug(req.body);
    debug(req.files);

    // Record of temporary files created for this building
    var tmpModelFiles = [];
    var tmpAssetFiles = [];
    var tmpName;

    var pathID = UUID.v4();

    var building;

    async.waterfall([function(done) {
      var uploadPath = req.files.model.path;
      var uploadExt = req.files.model.extension;

      // Zip upload detection
      // TODO: There's probably a better way to detect a zip file
      if (uploadExt === "zip") {
        tmpName = uploadPath.split("." + uploadExt)[0];

        // Create temporary directory
        mkdirp.sync(tmpName);

        // TODO: Replace with archiver seeing as this doesn't work
        // for creating archives
        var zip = new AdmZip(uploadPath);
        var zipEntries = zip.getEntries();

        _.each(zipEntries, function(entry) {
          var entryExt = entry.name.split(".").pop();

          // Validate each file to ensure only accepted files are added
          // Accept: model files (dae, obj, etc), images (jpg, png, etc)
          if (entryExt.match("obj|dae|ply|dxf")) {
            // Store reference to the model file
            tmpModelFiles.push(tmpName + "/" + entry.entryName);
          } else if (entryExt.match("jpg|png")) {
            // Store reference to the assets (textures, etc)
            tmpAssetFiles.push(tmpName + "/" + entry.entryName);
          } else {
            debug("Zip entry file type not valid:", entryExt);
            return;
          }

          // Unzip file to temporary directory (keeping archive directories)
          zip.extractEntryTo(entry.entryName, tmpName, true, true);
        });

        // Delete zip file
        fs.unlinkSync(uploadPath);
      } else {
        tmpName = "tmp";
        tmpModelFiles.push(uploadPath);
      }

      if (tmpModelFiles.length < 1) {
        debug("No model files to process");
        return;
      }

      done(null);
    }, function(done) {
      // TODO: Probably worth splitting the coversion logic into a function
      var convertQueue = [];

      // TODO: Work out a better way than just grabbing the first file
      var tmpModelPath = tmpModelFiles[0];
      var tmpModelExt = tmpModelPath.split(".").pop();

      // Convert to Collada
      if (tmpModelExt !== "dae") {
        convertQueue.push([modelConverter.convert, [tmpModelPath, tmpModelPath.split(tmpModelExt)[0] + "dae"]]);
      }

      // Convert to Wavefront Object
      if (tmpModelExt !== "obj") {
        convertQueue.push([modelConverter.convert, [tmpModelPath, tmpModelPath.split(tmpModelExt)[0] + "obj"]]);
      }

      // Wait for all conversion promises to complete before adding to db
      Q.all(convertQueue.map(function(promiseFunc) {
        return promiseFunc[0].apply(this, promiseFunc[1]).then(function(path) {
          debug("Upload promise complete");
          debug(path);

          tmpModelFiles.push(path);
        });
      })).done(function() {
        done(null);
      });
    }, function(done) {
      building = new Building();

      building.name = req.body.name;
      building.slug = {
        id: shortId.generate(),
        name: building.name.replace(/([^a-z0-9]+)/gi, "-").substring(0, 100)
      };

      if (req.body.description) {
        building.description = req.body.description;
      }

      var movePromises = [];
      var moveFiles = [];
      var moveAssetFiles = [];

      // Move model files to permanent path
      // TODO: Move files created by conversion, like .mtl
      _.each(tmpModelFiles, function(file, index) {
        var splitPath = file.split(tmpName + "/");
        var permPath = "model-files/" + pathID + "/raw/" + splitPath[1];
        var ext = permPath.split(".").pop();

        moveFiles.push([permPath, ext]);
        movePromises.push(Q.nfcall(mv, file, permPath, {mkdirp: true}));
      });

      // Move asset files to permanent path
      _.each(tmpAssetFiles, function(file, index) {
        var splitPath = file.split(tmpName + "/");
        var permPath = "model-files/" + pathID + "/raw/" + splitPath[1];
        var ext = permPath.split(".").pop();

        moveAssetFiles.push([permPath, ext]);
        movePromises.push(Q.nfcall(mv, file, permPath, {mkdirp: true}));
      });
      
      Q.all(movePromises).done(function() {
        debug("Moved files");
        done(null, moveFiles, moveAssetFiles);
      }, function(err) {
        // Delete temporary directories
        deleteFolderRecursive(tmpName);

        done(err);
      });  
    }, function(moveFiles, moveAssetFiles, done) {
      var archiveQueue = [];

      // Add model paths to building entry
      _.each(moveFiles, function(file, index) {
        var type = file[1];
        var path = file[0];

        debug(file);

        // Get file size
        var stats = fs.statSync(path);
        var fileSize = (stats.size) ? stats.size : 0;

        if (type === "obj") {
          structurePath = path;
        }

        building.models.raw.push({
          type: type,
          path: "/" + path,
          fileSize: fileSize
        });

        // Generate a zip archive for model
        var outputPath = "./model-files/" + pathID + "/" + pathID + "_" + type + ".zip";

        archiveQueue.push([createArchive, [outputPath, type, path, moveAssetFiles, pathID]]);
      });

      Q.all(archiveQueue.map(function(promiseFunc) {
        return promiseFunc[0].apply(this, promiseFunc[1]).then(function(output) {
          // Store reference to model archive
          building.models.zip.push({
            type: output.type,
            path: "/" + output.path,
            fileSize: output.size
          });
        });
      })).done(function() {
        // All archives have been created
        done(null, structurePath);
      }, function(err) {
        // Delete temporary directories
        deleteFolderRecursive(tmpName);

        done(err);
      });
    }, function(structurePath, done) {
      // Attach user to building entry
      building.userId = req.user._id;

      // Set default location (to satisfy geo-search)
      // TODO: Remove this requirement or find a better way to detect
      // a building that has just been added
      building.location = {
        type : "Point",
        coordinates : [0, 0]
      };

      var vertexRegex = /^v /;
      var faceRegex = /^f /;

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
            done(null);
          });

          // Delete temporary directories
          deleteFolderRecursive(tmpName);
        });
      }
    }], function (err, result) {
      // Result of last callback
      if (err) debug(err);
    });
  };

  // Endpoint /api/buildings for PUT
  var putBuildings = function(req, res, next) {
    // Check that user has access to this building
    Building.findOne({$and: [{_id: req.params.building_id}, {userId: req.user._id}]}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      if (req.user.group === "admin" && req.body.hidden) {
        building.hidden = req.body.hidden;
      }

      if (req.body.scale) {
        building.scale = req.body.scale;
      }

      if (req.body.angle) {
        building.angle = req.body.angle;
      }

      if (req.body.osmType && req.body.osmID) {
        building.osm = {
          type: req.body.osmType,
          id: req.body.osmID
        }
      }

      if (req.body.latitude && req.body.longitude) {
        var url = "http://pelias.mapzen.com/reverse?lat=" + req.body.latitude + "&lon=" + req.body.longitude
        
        // Find location country and admin
        request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var pelias = JSON.parse(body);
            var featureProperties = pelias.features[0].properties;

            var countryCode = featureProperties.alpha3;
            var country = featureProperties.admin0;
            var district = featureProperties.admin1;

            building.locality = {
              countryCode: countryCode,
              country: country,
              district: district
            }

            building.location = {
              type : "Point",
              coordinates : [req.body.longitude, req.body.latitude]
            };

            building.save(function(err, savedBuilding) {
              if (err) {
                res.send(err);
                return;
              }

              res.json({message: "Building updated", building: savedBuilding});
            });
          }
        });
      } else {
        building.save(function(err, savedBuilding) {
          if (err) {
            res.send(err);
            return;
          }

          res.json({message: "Building updated", building: savedBuilding});
        });
      }
    });
  };

  // Endpoint /api/building/ for GET
  var getBuilding = function(req, res) {
    Building.findOne({$and: [{_id: req.params.building_id}, {hidden: false}]}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      res.json(building);
    });
  };

  // Endpoint /api/building/:building_id/download/:file_type/:model_type for GET
  var getBuildingDownload = function(req, res) {
    Building.findOne({$and: [{_id: req.params.building_id}, {hidden: false}]}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      var fileType = req.params.file_type;
      var modelType = req.params.model_type;

      if (!building.models[fileType]) {
        res.sendStatus(404);
        return;
      }

      var file = _.find(building.models[fileType], function(model) {
        return (model.type === modelType);
      });

      if (!file) {
        res.sendStatus(404);
        return;
      }

      var options = {
        headers: {
          "Content-Disposition": "attachment; filename=" + building._id + "." + ((fileType === "raw") ? modelType : fileType)
        }
      }

      // Increment statistics
      building.stats.downloads += 1;

      building.save(function(err) {
        if (err) {
          res.send(err);
          return;
        }
        
        res.sendFile(path.resolve("." + file.path), options);
      });
    });
  };

  // Endpoint /api/building/:building_id.kml for GET
  var getBuildingKML = function(req, res) {
    Building.findOne({$and: [{_id: req.params.building_id}, {hidden: false}]}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      var daeModel = _.find(building.models.raw, function(model) {
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

      // Increment statistics
      building.stats.downloads += 1;

      building.save(function(err) {
        if (err) {
          res.send(err);
          return;
        }
        
        res.set("content-Type", "text/xml");
        res.send("<?xml version='1.0' encoding='UTF-8'?>" + JXON.stringify(kmlObj));
      });
    });
  };

  var createArchive = function(outputPath, type, path, moveAssetFiles, pathID) {
    var deferred = Q.defer();

    var output = fs.createWriteStream(outputPath);
    var archive = archiver("zip");

    output.on("close", function() {
      deferred.resolve({
        path: outputPath.split("./")[1],
        size: archive.pointer(),
        type: type
      });
    });

    archive.on("error", function(err) {
      deffered.reject(err);
    });

    archive.pipe(output);
    
    // TODO: Tidy up paths
    archive.append(fs.createReadStream("./" + path), { name: pathID + "/" + path.split("model-files/" + pathID + "/raw")[1] });

    _.each(moveAssetFiles, function(assetFile) {
      var assetPath = assetFile[0];

      // TODO: Tidy up paths
      archive.append(fs.createReadStream("./" + assetPath), { name: pathID + "/" + assetPath.split("model-files/" + pathID + "/raw")[1] });
    });

    archive.finalize();

    return deferred.promise;
  };

  // From: http://www.geedew.com/2012/10/24/remove-a-directory-that-is-not-empty-in-nodejs/
  var deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
      fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      
      // Do not delete root directory
      // fs.rmdirSync(path);
    }
  };

  return {
    getBuildings: getBuildings,
    postBuildings: postBuildings,
    putBuildings: putBuildings,
    getBuilding: getBuilding,
    getBuildingDownload: getBuildingDownload,
    getBuildingKML: getBuildingKML
  };
};