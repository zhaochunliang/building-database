var nodemailer = require("nodemailer");

module.exports = function (passport) {
  var Building = require("../models/building");

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
    Building.paginate({"location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("browse_new", {
        bodyId: "browse",
        user: req.user,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {sortBy: {createdAt: -1}});
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
          building: building
        });
      });
    });
  };

  // Endpoint /building/:building_id/report for GET
  var getBuildingReport = function(req, res) {
    res.render("building-report", {
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
    res.render("search-form", {
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
      
      res.render("search", {
        bodyId: "search",
        user: req.user,
        near: [req.params.lon, req.params.lat],
        pageCount: pageCount,
        buildings: buildings
      });
    });
  };

  // Endpoint /search/user/:user_id for GET
  var getSearchUser = function(req, res) {
    Building.paginate({"location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        console.log(err);
        res.send(err);
      }
      
      res.render("search", {
        bodyId: "search",
        user: req.user,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {sortBy: {createdAt: -1}});
  };

  // Endpoint /search/osm/:osm_type/:osm_id for GET
  var getSearchOSM = function(req, res) {
    Building.paginate({"osm.type": req.params.osm_type, "osm.id": req.params.osm_id, "location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("search", {
        bodyId: "search",
        user: req.user,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {sortBy: {createdAt: -1}});
  };

  // Endpoint /search/:search_term for GET
  var getSearchTerm = function(req, res) {
    Building.paginate({"name": new RegExp(req.params.search_term, "i"), "location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("search", {
        bodyId: "search",
        user: req.user,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {sortBy: {createdAt: -1}});
  };

  // Endpoint /add for GET
  var getAdd = function(req, res) {
    res.render("add", {
      user: req.user
    });
  };

  // Endpoint /add/location for GET
  var getAddLocation = function(req, res) {
    // Check that user owns this building
    // Check that location hasn't already been added
    Building.findOne({_id: req.params.building_id, userId: req.user._id, "location.coordinates": [0,0]}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      res.render("add-location", {
        user: req.user,
        building: building
      });
    });
  };

  // Endpoint /add/osm for GET
  var getAddOSM = function(req, res) {
    // Check that user owns this building
    // Check that OSM hasn't already been linked
    Building.findOne({_id: req.params.building_id, userId: req.user._id, osm: {$exists: false}}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      res.render("add-osm", {
        bodyId: "add-osm",
        user: req.user,
        building: building
      });
    });
  };

  return {
    getIndex: getIndex,
    getBrowse: getBrowse,
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
    getAddOSM: getAddOSM
  };
};