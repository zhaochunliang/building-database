var debug = require("debug")("polygoncity");
var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var gravatar = require("gravatar");

var config = require("../config/config.js");

module.exports = function (passport) {
  var Building = require("../models/building");
  var User = require("../models/user");

  // Endpoint / for GET
  var getIndex = function(req, res) {
    Building.find({$and: [{"location.coordinates": {$ne: [0,0]}}, {hidden: false}]}).limit(6).sort({createdAt: -1}).exec(function(err, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("index", {
        bodyId: "home",
        user: req.user,
        buildings: buildings,
      });
    });
  };

  // Endpoint /browse for GET
  var getBrowse = function(req, res) {

    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({$and: [{"location.coordinates": {$ne: [0,0]}}, {hidden: false}]}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("browse", {
        bodyId: "browse",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /browse/all for GET
  var getBrowseAll = function(req, res) {
    Building.find({$and: [{"location.coordinates": {$ne: [0,0]}}, {hidden: false}]}, function(err, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("browse_all", {
        bodyId: "browse",
        user: req.user,
        buildings: buildings
      });
    });
  };

  // Endpoint /building/:building_slugId/:building_name for GET
  var getBuilding = function(req, res) {
    Building.findOne({$and: [{"slug.id": req.params.building_slugId}, {hidden: false}]}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(404);
        return;
      }

      // Find uploading user
      User.findById(building.userId, function(err, user) {
        if (err) {
          res.send(err);
          return;
        }

        if (!user) {
          res.sendStatus(404);
          return;
        }

        buildingUser = {
          id: user._id,
          username: user.username
        };

        // Increment statistics
        building.stats.views += 1;

        building.save(function(err) {
          if (err) {
            res.send(err);
            return;
          }
          
          res.render("building", {
            bodyId: "building",
            user: req.user,
            building: building,
            buildingUser: buildingUser
          });
        });
      });
    });
  };

  // Endpoint /report/:building_id for GET
  var getBuildingReport = function(req, res) {
    res.render("building-report", {
      bodyId: "building-report",
      message: req.flash("message"),
      user: req.user
    });
  };

  // Endpoint /report/:building_id for POST
  var postBuildingReport = function(req, res) {
    // Skip if email hasn't been set up
    if (!config.email.report.fromAddress || !config.email.report.toAddress) {
      debug("Email report from or to address not found in configuration");
      res.sendStatus(500);
      return;
    }

    var transport = nodemailer.createTransport(smtpTransport(config.email.smtp));

    // TODO: Pull to email from server-side config file
    var mailOptions = {
      to: config.email.report.toAddress,
      from: config.email.report.fromAddress,
      subject: (config.email.report.subject) ? config.email.report.subject : "Building report",
      text: "The following building has been reported.\n\n" +
        "Building: " + req.params.building_id + "\n" +
        "Reason: " + req.body.reason + "\n" +
        "Details: " + req.body.details + "\n" +
        "From: " + req.body.email
    };

    transport.sendMail(mailOptions, function(err) {
      if (!err) {
        req.flash("message", "Report received, thank you.");
      }

      res.redirect("/building/" + req.params.building_id + "/report");
    });
  };

  // Endpoint /search for GET
  var getSearch = function(req, res) {
    res.render("search-form", {
      bodyId: "search-form",
      user: req.user,
      message: req.flash("message")
    });
  };

  // Endpoint /search for POST
  var postSearch = function(req, res) {
    // Search submitted from homepage
    if (req.body.search) {
      var search = req.body.search.toLowerCase();
      res.redirect("/search/" + search);
    // Search submitted from /search form
    } else {
      // Search for building by name
      if (req.body.name) {
        var name = req.body.name.toLowerCase();
        res.redirect("/search/" + name);
      } else if (req.body.longitude && req.body.latitude) {
        var longitude = req.body.longitude;
        var latitude = req.body.latitude;
        var distance = req.body.distance | 1000;

        res.redirect("/search/near/" + longitude + "/" + latitude + "/" + distance);
      } else {
        req.flash("message", "Please enter a search term");
        res.redirect("/search");
      }
    }
  };

  // Endpoint /search/near/:lon/:lat for GET
  var getSearchNear = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({$and: [{"location": {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [req.params.lon, req.params.lat]
        },
        $maxDistance: req.params.distance | 1000
      }
    }}, {hidden: false}]}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        console.log(err);
        res.send(err);
      }

      res.render("browse", {
        bodyId: "search",
        user: req.user,
        near: [req.params.lon, req.params.lat],
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /search/user/:username for GET
  var getSearchUser = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    User.findOne({$and: [{username: req.params.username}, {"verified": true}]}, function(err, user) {
      if (err) {
        console.log(err);
        res.send(err);
      }

      if (!user) {
        res.sendStatus(404);
        return;
      }

      Building.paginate({$and: [{"userId": user._id}, {"location.coordinates": {$ne: [0,0]}}, {hidden: false}]}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
        if (err) {
          console.log(err);
          res.send(err);
        }

        res.render("browse", {
          bodyId: "search",
          user: req.user,
          sort: (!req.query.sort) ? "date" : req.query.sort,
          pageCount: pageCount,
          buildings: buildings
        });
      }, {
        sortBy: sortBy
      });
    });
  };

  // Endpoint /search/osm/:osm_type/:osm_id for GET
  var getSearchOSM = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({$and: [{"osm.type": req.params.osm_type}, {"osm.id": req.params.osm_id}, {"location.coordinates": {$ne: [0,0]}}, {hidden: false}]}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }

      res.render("browse", {
        bodyId: "search",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /search/:search_term for GET
  var getSearchTerm = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({$and: [{$or: [{"name": new RegExp(req.params.search_term, "i")}, {"description": new RegExp(req.params.search_term, "i")}]}, {"location.coordinates": {$ne: [0,0]}}, {hidden: false}]}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }

      res.render("browse", {
        bodyId: "search",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /add for GET
  var getAdd = function(req, res) {
    res.render("add", {
      bodyId: "building-add",
      user: req.user
    });
  };

  // Endpoint /add/location for GET
  var getAddLocation = function(req, res) {
    // Check that user owns this building
    // Check that location hasn't already been added
    // Building.findOne({_id: req.params.building_id, userId: req.user._id, "location.coordinates": [0,0]}, function(err, building) {

    var query = {$and: [{_id: req.params.building_id}, {userId: req.user._id}]};

    if (req.user.group && req.user.group === "admin") {
      query = {_id: req.params.building_id};
    }

    Building.findOne(query, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      res.render("add-location", {
        bodyId: "building-add-location",
        user: req.user,
        building: building
      });
    });
  };

  // Endpoint /add/osm for GET
  var getAddOSM = function(req, res) {
    // Check that user owns this building
    // Check that OSM hasn't already been linked
    // Building.findOne({_id: req.params.building_id, userId: req.user._id, osm: {$exists: false}}, function(err, building) {

    var query = {$and: [{_id: req.params.building_id}, {userId: req.user._id}]};

    if (req.user.group && req.user.group === "admin") {
      query = {_id: req.params.building_id};
    }

    Building.findOne(query, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      res.render("add-osm", {
        bodyId: "building-add-osm",
        user: req.user,
        building: building
      });
    });
  };

  // Endpoint /user/:username for GET
  var getUser = function(req, res) {
    // Find uploading user
    User.findOne({$and: [{username: req.params.username}, {"verified": true}]}, function(err, user) {
      if (err) {
        res.send(err);
        return;
      }

      if (!user) {
        res.sendStatus(404);
        return;
      }

      if (user.banned === true) {
        res.render("user", {
          bodyId: "user",
          user: req.user,
          banned: true
        });
      }

      profile = {
        id: user._id,
        username: user.username,
        gravatar: user.gravatar,
        twitter: user.twitter,
        website: user.website
      };

      Building.paginate({$and: [{"userId": user._id}, {"location.coordinates": {$ne: [0,0]}}, {hidden: false}]}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
        if (err) {
          console.log(err);
          res.send(err);
        }

        res.render("user", {
          bodyId: "user",
          user: req.user,
          profile: profile,
          buildings: buildings,
          pageCount: pageCount
        });
      }, {sortBy: {createdAt: -1}});
    });
  };

  // Endpoint /user/edit/:username for GET
  var getUserEdit = function(req, res) {
    // Check user has access
    User.findOne({$and: [{username: req.params.username}, {_id: req.user._id}, {"verified": true}]}, function(err, user) {
      if (err) {
        res.send(err);
        return;
      }

      if (!user) {
        res.sendStatus(403);
        return;
      }

      var profile = {
        id: user._id,
        username: user.username,
        email: user.email,
        twitter: user.twitter,
        website: user.website
      };

      res.render("user-edit", {
        bodyId: "user-edit",
        user: req.user,
        profile: profile
      });
    });
  };

  // Endpoint /user/edit/:username for POST
  var postUserEdit = function(req, res) {
    // Check user has access
    User.findOne({$and: [{username: req.params.username}, {_id: req.user._id}, {"verified": true}]}, function(err, user) {
      if (err) {
        res.send(err);
        return;
      }

      if (!user) {
        res.sendStatus(403);
        return;
      }

      var msg = "";

      async.waterfall([
        function(asyncDone) {
          // Update Gravatar
          var grav = gravatar.url(user.email);
          user.gravatar = grav;

          // Check for updated details      
          if (req.body.website) {
            user.website = req.body.website;
          }

          if (req.body.twitter) {
            user.twitter = req.body.twitter;
          }

          asyncDone();
        }, function(asyncDone) {
          // User has updated their email
          if (req.body.email && req.body.email !== user.email) {
            async.waterfall([
              function(verifyDone) {
                User.findOne({email: req.body.email}, function(err, user) {
                  if (err) {
                    asyncDone(err);
                    return;
                  }

                  if (user) {
                    msg = "A user already exists with that email";
                    asyncDone(null, null);
                    return;
                  }

                  verifyDone();
                });
              }, function(verifyDone) {
                // Generate verify token
                crypto.randomBytes(20, function(err, buf) {
                  var token = buf.toString("hex");
                  verifyDone(err, token);
                });
              }, function(token, verifyDone) {
                // Store verify token
                user.verifiedToken = token;
                verifyDone(null, token);
              }, function(token, verifyDone) {
                // Store change email for after verification
                user.changeEmail = req.body.email;

                verifyDone(null, token);
              }
            ], function(err, token) {
              if (!err) {
                asyncDone(null, token);
                return;
              }

              debug("Error in creating verification details: " + err);
              throw err;
            });
          } else {
            asyncDone(null, null);
          }
        }, function(token, asyncDone) {
          // Save the user
          user.save(function(err, savedUser) {
            asyncDone(err, token, savedUser);
          });
        }, function(token, savedUser, asyncDone) {
          // Skip if no token
          if (!token) {
            asyncDone(null, null, savedUser);
            return;
          }

          // Skip if email hasn't been set up
          if (!config.email.verify.fromAddress) {
            debug("Email verify.fromAddress not found in configuration");
            asyncDone("Email verify.fromAddress not found in configuration");
            return;
          }

          // Check that user.changeEmail exists
          if (!user.changeEmail) {
            debug("Email user.changeEmail wasn't set");
            asyncDone("Email user.changeEmail wasn't set");
            return;
          }

          var transport = nodemailer.createTransport(smtpTransport(config.email.smtp));

          var mailOptions = {
            to: user.changeEmail,
            from: config.email.verify.fromAddress,
            subject: (config.email.verify.subject) ? config.email.verify.subject : "Please verify your change in email",
            text: "You are receiving this because a request has been received to change the email on your account to this one.\n\n" +
              "Please click on the following link, or paste this into your browser to complete the verification process:\n\n" +
              "http://" + req.headers.host + "/verify/" + token + "\n\n" +
              "If you did not request this, please ignore this email.\n"
          };
          
          transport.sendMail(mailOptions, function(err) {
            if (!err) {
              msg = "Profile updated, verification email sent.";
            }

            asyncDone(err, token, savedUser);
          });
        }
      ], function(err, token, savedUser) {
        if (!err) {
          var profile = {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            twitter: savedUser.twitter,
            website: savedUser.website
          };

          req.flash("message", msg);

          res.render("user-edit", {
            bodyId: "user-edit",
            user: req.user,
            profile: profile,
            message: req.flash("message")
          });

          return;
        }

        debug("Error in saving user: " + err);
        throw err;
      });
    });
  };

  return {
    getIndex: getIndex,
    getBrowse: getBrowse,
    getBrowseAll: getBrowseAll,
    getBuilding: getBuilding,
    getBuildingReport: getBuildingReport,
    postBuildingReport: postBuildingReport,
    getSearch: getSearch,
    postSearch: postSearch,
    getSearchNear: getSearchNear,
    getSearchUser: getSearchUser,
    getSearchOSM: getSearchOSM,
    getSearchTerm: getSearchTerm,
    getAdd: getAdd,
    getAddLocation: getAddLocation,
    getAddOSM: getAddOSM,
    getUser: getUser,
    getUserEdit: getUserEdit,
    postUserEdit: postUserEdit
  };
};