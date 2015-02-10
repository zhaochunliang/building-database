var config = require("../config/config.js");
var gravatar = require("gravatar");

var Building = require("../models/building");
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

  // Endpoint /admin/users for GET
  var getUsers = function(req, res) {
    var sortBy = {};

    if (!req.query.sort || req.query.sort == "date") {
      sortBy["date"] = -1
    } else if (req.query.sort == "name") {
      sortBy["name"] = 1
    } else if (req.query.sort == "downloads") {
      sortBy["stats.downloads"] = -1
    }

    User.paginate({}, req.query.page, req.query.limit, function(err, pageCount, siteUsers) {
      if (err) {
        res.send(err);
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
    getUsers: getUsers,
    getUser: getUser,
    postUser: postUser
  };
};