module.exports = function (passport) {
  var Building = require("../models/building");

  // Endpoint / for GET
  var getIndex = function(req, res) {
    Building.find().sort({createdAt: -1}).limit(6).exec(function(err, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("index", {
        user: req.user,
        buildings: buildings
      });
    });
  };

  // Endpoint /browse for GET
  var getBrowse = function(req, res) {
    Building.find().sort({createdAt: -1}).limit(24).exec(function(err, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("browse", {
        user: req.user,
        buildings: buildings
      });
    });
  };

  // Endpoint /building/:id for GET
  var getBuilding = function(req, res) {
    Building.findById(req.params.building_id, function(err, building) {
      if (err) {
        res.send(err);
      }

      res.render("building", {
        user: req.user,
        building: building
      });
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
    Building.find({}).near("location", {
      center: {
        type: "Point",
        coordinates: [req.params.lon, req.params.lat]
      },
      maxDistance: req.params.distance | 1000,
      spherical: true
    }).exec(function(err, buildings) {
      if (err) {
        console.log(err);
        res.send(err);
      }

      console.log(buildings);
      
      res.render("search", {
        user: req.user,
        buildings: buildings
      });
    });
  };

  // Endpoint /search/user/:user_id for GET
  var getSearchUser = function(req, res) {
    Building.find({userId: req.params.user_id}).exec(function(err, buildings) {
      if (err) {
        console.log(err);
        res.send(err);
      }

      console.log(buildings);
      
      res.render("search", {
        user: req.user,
        buildings: buildings
      });
    });
  };

  // Endpoint /search/:search_term for GET
  var getSearchTerm = function(req, res) {
    Building.find({"name": new RegExp(req.params.search_term, "i")}, function(err, buildings) {
      if (err) {
        res.send(err);
      }
      
      res.render("search", {
        user: req.user,
        buildings: buildings
      });
    });
  };

  // Endpoint /add for GET
  var getAdd = function(req, res) {
    res.render("add", {
      user: req.user
    });
  };

  // Endpoint /add/location for GET
  var getAddLocation = function(req, res) {
    // TODO: Check that location hasn't already been added
    Building.findOne({_id: req.params.building_id, userId: req.user._id}, function(err, building) {
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
    // TODO: Check that OSM ID hasn't already been added
    Building.findOne({_id: req.params.building_id, userId: req.user._id}, function(err, building) {
      if (err) {
        res.send(err);
        return;
      }

      if (!building) {
        res.sendStatus(403);
        return;
      }

      res.render("add-osm", {
        user: req.user,
        building: building
      });
    });
  };

  return {
    getIndex: getIndex,
    getBrowse: getBrowse,
    getBuilding: getBuilding,
    getSearch: getSearch,
    postSearch: postSearch,
    getSearchNear: getSearchNear,
    getSearchUser: getSearchUser,
    getSearchTerm: getSearchTerm,
    getAdd: getAdd,
    getAddLocation: getAddLocation,
    getAddOSM: getAddOSM
  };
};