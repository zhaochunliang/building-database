var debug = require("debug")("polygoncity");
var _ = require("underscore");
var config = require("../config/config.js");
var gravatar = require("gravatar");

var Building = require("../models/building");
var BuildingReport = require("../models/building-report");
var User = require("../models/user");

module.exports = function (passport) {
  var authController = require("./auth")(passport);

  // Endpoint /admin for GET
  var getAdmin = function(req, res) {
    res.render("admin", {
      bodyId: "admin",
      user: req.user
    });
  };

  // Endpoint /admin/buildings for GET
  var getBuildings = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1;
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1;
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1;
    }

    Building.paginate({"location.coordinates": {$ne: [0,0]}}, req.query.page, req.query.limit, function(err, pageCount, buildings) {
      if (err) {
        debug(err);
        res.send(err);
        return;
      }
      
      res.render("admin-buildings", {
        bodyId: "admin-buildings",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        buildings: buildings
      });
    }, {
      sortBy: sortBy
    });
  };

  // Endpoint /admin/building/:building_id for GET
  var getBuilding = function(req, res) {
    Building.findOne({_id: req.params.building_id}, function(err, building) {
      if (err) {
        debug(err);
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(404);
        return;
      }

      res.render("admin-building", {
        bodyId: "admin-building",
        user: req.user,
        building: building
      });
    });
  };

  // Endpoint /admin/building-reports for GET
  var getBuildingReports = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1;
    }  else if (req.query.sort == "building") {
      sortBy["building.name"] = 1;
    } else if (req.query.sort == "email") {
      sortBy["email"] = 1;
    } else if (req.query.sort == "reason") {
      sortBy["reason"] = 1;
    }

    BuildingReport.paginate({}, req.query.page, req.query.limit, function(err, pageCount, reports) {
      if (err) {
        debug(err);
        res.send(err);
        return;
      }

      res.render("admin-building-reports", {
        bodyId: "admin-building-reports",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        reports: reports
      });
    }, {
      populate: "building",
      sortBy: sortBy
    });
  };

  // Endpoint /admin/users for GET
  var getUsers = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["createdAt"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    User.paginate({}, req.query.page, req.query.limit, function(err, pageCount, siteUsers) {
      if (err) {
        debug(err);
        res.send(err);
        return;
      }
      
      res.render("admin-users", {
        bodyId: "admin-users",
        user: req.user,
        sort: (!req.query.sort) ? "date" : req.query.sort,
        pageCount: pageCount,
        siteUsers: siteUsers
      });
    }, {
      columns: {"username": 1, "email": 1, "banned": 1},
      sortBy: sortBy
    });
  };

  // Endpoint /admin/user/:username for GET
  var getUser = function(req, res) {
    User.findOne({username: req.params.username}, function(err, user) {
      if (err) {
        debug(err);
        res.send(err);
        return;
      }

      if (!user) {
        res.sendStatus(404);
        return;
      }

      var profile = {
        id: user._id,
        username: user.username,
        email: user.email,
        twitter: user.twitter,
        website: user.website
      };

      res.render("admin-user", {
        bodyId: "admin-user",
        user: req.user,
        profile: profile
      });
    });
  };

  // Endpoint /admin/user/:username for POST
  var postUser = function(req, res) {
    User.findOne({username: req.params.username}, function(err, user) {
      if (err) {
        debug(err);
        res.send(err);
        return;
      }

      if (!user) {
        res.sendStatus(404);
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

      if (req.body.ban) {
        user.banned = req.body.ban;
      }

      // Save user
      user.save(function(err, savedUser) {
        if (err) {
          debug(err);
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

        res.render("admin-user", {
          bodyId: "admin-user",
          user: req.user,
          profile: profile,
          message: req.flash("message")
        });
      });
    });
  };

  return {
    getAdmin: getAdmin,
    getBuildings: getBuildings,
    getBuilding: getBuilding,
    getBuildingReports: getBuildingReports,
    getUsers: getUsers,
    getUser: getUser,
    postUser: postUser
  };
};