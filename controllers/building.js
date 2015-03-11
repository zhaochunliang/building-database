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
var sphericalmercator = new(require("sphericalmercator"));
var AWS = require("aws-sdk");
var rimraf = require("rimraf");

var Building = require("../models/building");

var config = require("../config/config.js");


AWS.config.update({accessKeyId: config.s3.accessId, secretAccessKey: config.s3.accessKey});
AWS.config.update({region: config.s3.region});

module.exports = function (passport) {
  // Endpoint /api/buildings for GET
  var getBuildings = function(req, res) {
    Building.find({hidden: false}, function(err, buildings) {
      if (err) {
        debug(err);
        res.send(err);
        return;
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

    // If any of the tasks pass an error to their own callback, the next function is not executed, and the main callback is immediately called with the error.
    async.waterfall([function(done) {
      var uploadPath = req.files.model.path;
      var uploadExt = req.files.model.extension;

      // Zip upload detection
      // TODO: There's probably a better way to detect a zip file
      if (uploadExt === "zip") {
        tmpName = uploadPath.split("." + uploadExt)[0];

        async.waterfall([function(zipDone) {
          // Create temporary directory
          mkdirp(tmpName, function(err) {
            if (err) {
              zipDone(err);
              return;
            }

            zipDone(null);
          });
        }, function(zipDone) {
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
            // TODO: Make async
            zip.extractEntryTo(entry.entryName, tmpName, true, true);
          });

          // Delete zip file
          fs.unlink(uploadPath, function(err) {
            if (err) {
              zipDone(err);
              return;
            }

            zipDone(null);
          });
        }], function (err, result) {
          // Result of last callback
          if (err) {
            done(err);
            return;
          }

          done(null);
        });
      } else {
        if (!uploadExt.match("obj|dae|ply|dxf")) {
          done(null);
          return;
        }

        tmpName = uploadPath.split("." + uploadExt)[0];
        
        var newPath = tmpName + "/" + uploadPath.split("tmp/")[1];

        mkdirp(tmpName, function(err) {
          if (err) {
            done(err);
            return;
          }

          fs.rename(uploadPath, newPath, function(err) {
            if (err) {
              done(err);
              return;
            }

            tmpModelFiles.push(newPath);

            done(null);
          });
        });
      }
    }, function(done) {
      // TODO: Find a better way to quit out of the waterfall
      if (tmpModelFiles.length < 1) {
        done(new Error("No model files to process"));
        return;
      }

      done(null);
    }, function(done) {
      // TODO: Probably worth splitting the coversion logic into a function
      var convertQueue = [];

      // TODO: Work out a better way than just grabbing the first file
      var tmpModelPath = tmpModelFiles[0];
      var tmpModelExt = tmpModelPath.split(".").pop();

      // Convert / fix the original file
      modelConverter.convert(tmpModelPath, tmpModelPath).done(function() {
        // Convert to other formats

        // Convert to Collada
        if (tmpModelExt !== "dae") {
          convertQueue.push([modelConverter.convert, [tmpModelPath, tmpModelPath.split("." + tmpModelExt)[0] + ".dae"]]);
        }

        // Convert to Wavefront Object
        if (tmpModelExt !== "obj") {
          convertQueue.push([modelConverter.convert, [tmpModelPath, tmpModelPath.split("." + tmpModelExt)[0] + ".obj"]]);
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
        }, function(err) {
          done(err);
        });
      });
    }, function(done) {
      building = new Building();

      building.name = req.body.name;
      building.slug = {
        id: shortId.generate(),
        name: building.name.replace(/([^a-z0-9]+)/gi, "-").substring(0, 100)
      };

      building.method = req.body.method;

      if (req.body.creator) {
        building.creator.name = req.body.creator;
      }

      if (req.body.creatorURL) {
        building.creator.url = req.body.creatorURL;
      }

      if (req.body.description) {
        building.description = req.body.description.substr(0, 500);
      }

      done(null);
    }, function(done) {
      var movePromises = [];
      var moveFiles = [];
      var moveAssetFiles = [];

      var uploadPromises = [];

      var uploadFile = function(file, index, moveFilesRef) {
        var deferred = Q.defer();

        var splitPath = file.split(tmpName + "/");
        //var permPath = "model-files/" + pathID + "/raw/" + splitPath[1];
        var s3PathKey = "model-files/" + pathID + "/raw/" + splitPath[1];
        var ext = s3PathKey.split(".").pop();
        var stats = fs.stat(file, function(err, stats) {
          if (err) {
            deferred.reject(err);
            return;
          }

          moveFilesRef.push([s3PathKey, ext, stats, file]);
          //movePromises.push(Q.nfcall(mv, file, permPath, {mkdirp: true}));
          movePromises.push([uploadFileS3, [file, s3PathKey]]);

          deferred.resolve();
        });

        return deferred.promise;
      };

      // Move model files to permanent path
      // TODO: Move files created by conversion, like .mtl
      _.each(tmpModelFiles, function(file, index) {
        // Add to promise
        uploadPromises.push([uploadFile, [file, index, moveFiles]]);
      });

      // Move asset files to permanent path
      _.each(tmpAssetFiles, function(file, index) {
        // Add to promise
        uploadPromises.push([uploadFile, [file, index, moveAssetFiles]]);
      });

      Q.all(uploadPromises.map(function(promiseFunc) {
        return promiseFunc[0].apply(this, promiseFunc[1]).done();
      })).done(function() {
        done(null, movePromises, moveFiles, moveAssetFiles);
      }, function(err) {
        done(err);
      });
    }, function(movePromises, moveFiles, moveAssetFiles, done) {
      Q.all(movePromises.map(function(promiseFunc) {
        return promiseFunc[0].apply(this, promiseFunc[1]).then(function(data) {
          debug("File uploaded to S3", data);
        });
      })).done(function() {
        debug("Moved files");
        done(null, moveFiles, moveAssetFiles);
      }, function(err) {
        // Delete temporary directories
        deleteFolderRecursive(tmpName).done(function() {
          done(err);
        }, function(deleteErr) {
          done(deleteErr);
        });
      });  
    }, function(moveFiles, moveAssetFiles, done) {
      var archiveQueue = [];
      var structurePath;

      // Add model paths to building entry
      _.each(moveFiles, function(file, index) {
        var type = file[1];
        var path = file[0];
        var stats = file[2];
        var tmpPath = file[3];

        debug(file);

        // Get file size
        var fileSize = (stats.size) ? stats.size : 0;

        if (type === "obj") {
          structurePath = tmpPath;
        }

        building.models.raw.push({
          type: type,
          path: "//" + config.s3.bucket + ".s3.amazonaws.com/" + path,
          fileSize: fileSize
        });

        // Generate a zip archive for model
        // var outputPath = "./model-files/" + pathID + "/" + pathID + "_" + type + ".zip";
        var outputPath = tmpName + "/" + pathID + "_" + type + ".zip";

        archiveQueue.push([createArchive, [outputPath, type, tmpPath, moveAssetFiles, pathID]]);
      });

      Q.all(archiveQueue.map(function(promiseFunc) {
        return promiseFunc[0].apply(this, promiseFunc[1]).then(function(output) {
          var deferred = Q.defer();

          // Upload archive to S3
          uploadFileS3(output.path, "model-files/" + pathID + "/zip/" + output.path.split("/")[2]).done(function(data) {
            debug("File uploaded to S3", data);

            var path = data["Location"].split("amazonaws.com/")[1];

            // Store reference to model archive
            building.models.zip.push({
              type: output.type,
              path: "//" + config.s3.bucket + ".s3.amazonaws.com/" + path,
              fileSize: output.size
            });

            deferred.resolve();
          }, function(err) {
            deferred.reject(err);
          });

          return deferred.promise;
        });
      })).done(function() {
        // All archives have been created
        // TODO: Fix random crash where structurePath is undefined
        // - Seems to happen rarely, on first start. Restart fixes.
        done(null, structurePath);
      }, function(err) {
        // Delete temporary directories
        deleteFolderRecursive(tmpName).done(function() {
          done(err);
        }, function(deleteErr) {
          done(deleteErr);
        });
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
            
            // Delete temporary directories
            // Delay to prevent random LR "error" events after recursive delete
            setTimeout(function() {
              deleteFolderRecursive(tmpName).done(function() {
                debug("Building added successfully, deleting temporary files:", savedBuilding._id);
                done(null);
              }, function(deleteErr) {
                debug("Problem deleting building files:", savedBuilding._id);
                done(deleteErr);
              });
            }, 500);
          });
        });

        // TODO: Enable this when a method can be worked out to not trigger when the LR process has ended and the file has been deleted.
        lr.on("error", function(err) {
          debug("Problem reading lines:", structurePath);
          res.json({"error": "Problem reading lines"});
          // done(err);
          done(null);
        });
      }
    }], function (err, result) {
      // Result of last callback
      // TODO: Return something to the user and crash
      if (err) {
        debug(err);

        res.json({error: err.message});
        
        // TODO: Only throw on specific errors, or throw before getting here
        //throw err;
      }
    });
  };

  // Endpoint /api/buildings for PUT
  var putBuildings = function(req, res, next) {
    // Check that user has access to this building

    var query = {$and: [{_id: req.params.building_id}, {userId: req.user._id}]};

    if (req.user.group && req.user.group === "admin") {
      query = {_id: req.params.building_id};
    }

    Building.findOne(query, function(err, building) {
      if (err) {
        debug(err);
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

      if (req.user.group === "admin" && req.body.highlight) {
        building.highlight = req.body.highlight;
      }

      if (req.user.group === "admin" && req.body.name) {
        building.name = req.body.name;
      }

      if (req.user.group === "admin" && req.body.description) {
        building.description = req.body.description;
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
        // var url = "http://pelias.mapzen.com/reverse?lat=" + req.body.latitude + "&lon=" + req.body.longitude
        var url = "http://open.mapquestapi.com/nominatim/v1/reverse.php?format=json&lat=" + req.body.latitude + "&lon=" + req.body.longitude;
        
        // Find location country and admin
        request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var locationResult = JSON.parse(body);
            
            // var featureProperties = locationResult.features[0].properties;

            // var countryCode = featureProperties.alpha3;
            // var country = featureProperties.admin0;
            // var district = featureProperties.admin1;

            var featureProperties = locationResult.address;

            var countryCode = featureProperties.country_code;
            var country = featureProperties.country;
            var district = featureProperties.city;

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
          } else if (error) {
            debug(error);
            res.json({message: "Failed to update building."});
          }
        });
      } else {
        building.save(function(err, savedBuilding) {
          if (err) {
            debug(err);
            res.json({message: "Failed to save updated building."});
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
        debug(err);
        res.json({message: "Failed to retrieve building."});
        return;
      }

      res.json(building);
    });
  };

  // Endpoint /api/buildings/bbox/:west,:south,:east,:north/:kml for GET
  // TODO: Limit bounding box size, or cap results
  var getBuildingsBbox = function(req, res) {
    var w = req.params.west;
    var s = req.params.south;
    var e = req.params.east;
    var n = req.params.north;

    var sortBy = {
      highlight: -1
    };

    Building.find({$and: [{
      "location": {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: [[[w, s],[w, n],[e, n],[e, s],[w, s]]]
          }
        }
      } }, {
        hidden: false
      }]
    }).sort(sortBy).exec(function(err, buildings) {
      if (err) {
        debug(err);
        res.json({message: "Failed to retrieve buildings."});
        return;
      }

      if (!req.params.kml) {
        res.json(buildings);
      } else {
        var kmlObj = {
          "kml": {
            "@xmlns": "http://www.opengis.net/kml/2.2",
            "Placemark": []
          }
        };

        _.each(buildings, function(building) {
          var daeModel = _.find(building.models.raw, function(model) {
            return (model.type === "dae");
          });

          kmlObj["kml"]["Placemark"].push({
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
          });
        });
        
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.set("content-Type", "text/xml");
        res.send("<?xml version='1.0' encoding='UTF-8'?>" + JXON.stringify(kmlObj));
      }
    });
  };

  // Endpoint /api/buildings/tile/:x,:y,:z for GET
  var getBuildingsTile = function(req, res) {
    var x = req.params.x;
    var y = req.params.y;
    var z = req.params.z;

    var bbox = sphericalmercator.bbox(x, y, z);

    var w = bbox[0];
    var s = bbox[1];
    var e = bbox[2];
    var n = bbox[3]; 

    var sortBy = {
      highlight: -1
    };

    Building.find({$and: [{
      "location": {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: [[[w, s],[w, n],[e, n],[e, s],[w, s]]]
          }
        }
      } }, {
        hidden: false
      }]
    }).sort(sortBy).exec(function(err, buildings) {
      if (err) {
        debug(err);
        res.json({message: "Failed to retrieve buildings."});
        return;
      }

      res.json(buildings);
    });
  };

  // Endpoint /api/buildings/near/:lon,:lat,:distance for GET
  var getBuildingsNear = function(req, res) {
    var lon = req.params.lon;
    var lat = req.params.lat;
    var distance = Number(req.params.distance);

    var sortBy = {
      highlight: -1
    };

    Building.find({$and: [{
      "location": {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat]
          },
          $maxDistance: distance || 1000
        }
      } }, {
        hidden: false
      }]
    }).sort(sortBy).exec(function(err, buildings) {
      if (err) {
        debug(err);
        res.json({message: "Failed to retrieve buildings."});
        return;
      }

      res.json(buildings);
    });
  };

  // Endpoint /api/building/:building_id/download/:file_type/:model_type for GET
  var getBuildingDownload = function(req, res) {
    Building.findOne({$and: [{_id: req.params.building_id}, {hidden: false}]}, function(err, building) {
      if (err) {
        debug(err);
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

      // var options = {
      //   headers: {
      //     "Content-Disposition": "attachment; filename=" + building._id + "." + ((fileType === "raw") ? modelType : fileType)
      //   }
      // }

      // Increment statistics
      building.stats.downloads += 1;

      building.save(function(err) {
        if (err) {
          debug(err);
          res.send(err);
          return;
        }
        
        // res.sendFile(path.resolve("." + file.path), options);
        res.redirect(file.path);
      });
    });
  };

  // Endpoint /api/building/:building_id.kml for GET
  var getBuildingKML = function(req, res) {
    Building.findOne({$and: [{_id: req.params.building_id}, {hidden: false}]}, function(err, building) {
      if (err) {
        debug(err);
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(404);
        return;
      }

      var daeModel = _.find(building.models.raw, function(model) {
        return (model.type === "dae");
      });

      var objModel = _.find(building.models.raw, function(model) {
        return (model.type === "obj");
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
                "href": daeModel.path,
                "hrefobj": objModel.path
              }
            }
          }
        }
      };

      // Increment statistics
      building.stats.downloads += 1;

      building.save(function(err) {
        if (err) {
          debug(err);
          res.send(err);
          return;
        }
        
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
        // path: outputPath.split("./")[1],
        path: outputPath,
        size: archive.pointer(),
        type: type
      });
    });

    archive.on("error", function(err) {
      deffered.reject(err);
    });

    archive.pipe(output);
    
    archive.append(fs.createReadStream("./" + path), { name: path.split("tmp/")[1] });

    _.each(moveAssetFiles, function(assetFile) {
      var assetPath = assetFile[3];

      archive.append(fs.createReadStream("./" + assetPath), { name: assetPath.split("tmp/")[1] });
    });

    archive.finalize();

    return deferred.promise;
  };

  // From: http://www.geedew.com/2012/10/24/remove-a-directory-that-is-not-empty-in-nodejs/
  // TODO: Sometimes the files are already deleted - need to detect that
  var deleteFolderRecursive = function(path) {
    var deferred = Q.defer();

    debug("Recursive delete:", path);

    rimraf(path, function(err) {
      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve();
    });

    return deferred.promise;
  };

  var uploadFileS3 = function(path, s3PathKey) {
    var deferred = Q.defer();

    var fileStream = fs.createReadStream(path);
    
    fileStream.on("error", function(err) {
      deferred.reject(err);
    });

    fileStream.on("open", function() {
      var s3 = new AWS.S3();
      
      s3.upload({
        Bucket: config.s3.bucket,
        Key: s3PathKey,
        ACL: "public-read",
        Body: fileStream
      }).on("httpUploadProgress", function(evt) {
        // console.log(evt);
      }).send(function(err, data) {
        if (err) {
          deferred.reject(err);
          return;
        }

        deferred.resolve(data);
      });

    });

    return deferred.promise;
  };

  return {
    getBuildings: getBuildings,
    postBuildings: postBuildings,
    putBuildings: putBuildings,
    getBuildingsBbox: getBuildingsBbox,
    getBuildingsNear: getBuildingsNear,
    getBuildingsTile: getBuildingsTile,
    getBuilding: getBuilding,
    getBuildingDownload: getBuildingDownload,
    getBuildingKML: getBuildingKML
  };
};