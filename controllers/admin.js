var config = require("../config/config.js");

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
      columns: {"username": 1, "email": 1},
      sortBy: sortBy
    });
  };

  return {
    getAdmin: getAdmin,
    getBuildings: getBuildings,
    getUsers: getUsers
  };
};