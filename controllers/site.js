var nodemailer = require("nodemailer");
var gravatar = require("gravatar");

module.exports = function (passport) {
  var Building = require("../models/building");
  var User = require("../models/user");

  // Endpoint / for GET
  var getIndex = function(req, res) {
    Building.find({"location.coordinates": {$ne: [0,0]}}).limit(6).sort({createdAt: -1}).exec(function(err, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("index_new", {
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
      sortBy["date"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({"location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("browse_new", {
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
    Building.find({"location.coordinates": {$ne: [0,0]}}, function(err, buildings) {
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

  // Endpoint /building/:building_id for GET
  var getBuilding = function(req, res) {
    Building.findById(req.params.building_id, function(err, building) {
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
          
          res.render("building_new", {
            bodyId: "building",
            user: req.user,
            building: building,
            buildingUser: buildingUser
          });
        });
      });
    });
  };

  // Endpoint /building/:building_id/report for GET
  var getBuildingReport = function(req, res) {
    res.render("building-report_new", {
      bodyId: "building-report",
      message: req.flash("message"),
      user: req.user
    });
  };

  // Endpoint /building/:building_id/report for POST
  var postBuildingReport = function(req, res) {
    // Skip if email hasn't been set up
    if (!config.email.report.fromAddress || !config.email.report.toAddress) {
      debug("Email report from or to address not found in configuration");
      res.sendStatus(500);
      return;
    }

    // TODO: Move to an external service for email
    // - https://github.com/andris9/Nodemailer
    var smtpTransport = nodemailer.createTransport();

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

    smtpTransport.sendMail(mailOptions, function(err) {
      req.flash("message", "Report received, thank you.");
      res.redirect("/building/" + req.params.building_id + "/report");
    });
  };

  // Endpoint /search for GET
  var getSearch = function(req, res) {
    res.render("search-form_new", {
      bodyId: "search-form",
      user: req.user
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
      }
    }
  };

  // Endpoint /search/near/:lon/:lat for GET
  var getSearchNear = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["date"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({"location": {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [req.params.lon, req.params.lat]
        },
        $maxDistance: req.params.distance | 1000
      }
    }}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        console.log(err);
        res.send(err);
      }

      res.render("browse_new", {
        bodyId: "search",
        user: req.user,
        near: [req.params.lon, req.params.lat],
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
      
      // res.render("search", {
      //   bodyId: "search",
      //   user: req.user,
      //   near: [req.params.lon, req.params.lat],
      //   pageCount: pageCount,
      //   buildings: buildings
      // });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /search/user/:user_id for GET
  var getSearchUser = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["date"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({"userId": req.params.user_id, "location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        console.log(err);
        res.send(err);
      }

      res.render("browse_new", {
        bodyId: "search",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
      
      // res.render("search", {
      //   bodyId: "search",
      //   user: req.user,
      //   pageCount: pageCount,
      //   buildings: buildings
      // });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /search/osm/:osm_type/:osm_id for GET
  var getSearchOSM = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["date"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({"osm.type": req.params.osm_type, "osm.id": req.params.osm_id, "location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }

      res.render("browse_new", {
        bodyId: "search",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
      
      // res.render("search", {
      //   bodyId: "search",
      //   user: req.user,
      //   pageCount: pageCount,
      //   buildings: buildings
      // });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /search/:search_term for GET
  var getSearchTerm = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["date"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    Building.paginate({"name": new RegExp(req.params.search_term, "i"), "location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }

      res.render("browse_new", {
        bodyId: "search",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
      
      // res.render("search", {
      //   bodyId: "search",
      //   user: req.user,
      //   pageCount: pageCount,
      //   buildings: buildings
      // });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /add for GET
  var getAdd = function(req, res) {
    res.render("add_new", {
      bodyId: "building-add",
      user: req.user
    });
  };

  // Endpoint /add/location for GET
  var getAddLocation = function(req, res) {
    // Check that user owns this building
    // Check that location hasn't already been added
    // Building.findOne({_id: req.params.building_id, userId: req.user._id, "location.coordinates": [0,0]}, function(err, building) {
    Building.findOne({_id: req.params.building_id, userId: req.user._id}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      res.render("add-location_new", {
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
    Building.findOne({_id: req.params.building_id, userId: req.user._id}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      res.render("add-osm_new", {
        bodyId: "building-add-osm",
        user: req.user,
        building: building
      });
    });
  };

  // Endpoint /user/:user_id for GET
  var getUser = function(req, res) {
    // Find uploading user
    User.findById(req.params.user_id, function(err, user) {
      if (err) {
        res.send(err);
        return;
      }

      if (!user) {
        res.sendStatus(404);
        return;
      }

      profile = {
        id: user._id,
        username: user.username,
        gravatar: user.gravatar,
        twitter: user.twitter,
        website: user.website
      };

      Building.paginate({"userId": req.params.user_id, "location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
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

  // Endpoint /user/edit/:user_id for GET
  var getUserEdit = function(req, res) {
    // Check user has access
    User.findOne({_id: req.params.user_id, _id: req.user._id}, function(err, user) {
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

  // Endpoint /user/edit/:user_id for POST
  var postUserEdit = function(req, res) {
    console.log(req.session);
    console.log(req.body);

    // Check user has access
    User.findOne({_id: req.params.user_id, _id: req.user._id}, function(err, user) {
      if (err) {
        res.send(err);
        return;
      }

      if (!user) {
        res.sendStatus(403);
        return;
      }

      // Update Gravatar
      var grav = gravatar.url(user.email);
      user.gravatar = grav;

      // Check for updated details
      // TODO: Support updating of username and email
      
      if (req.body.website) {
        user.website = req.body.website;
      }

      if (req.body.twitter) {
        user.twitter = req.body.twitter;
      }

      // Save user
      user.save(function(err, savedUser) {
        if (err) {
          res.send(err);
          return;
        }

        var profile = {
          id: savedUser._id,
          username: savedUser.username,
          email: savedUser.email,
          twitter: savedUser.twitter,
          website: savedUser.website
        };

        req.flash("message", "Profile updated");

        res.render("user-edit", {
          bodyId: "user-edit",
          user: req.user,
          profile: profile,
          message: req.flash("message")
        });
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