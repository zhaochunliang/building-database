module.exports = function (passport) {
  var Building = require("../models/building");

  // Endpoint / for GET
  var getIndex = function(req, res) {
    res.render("index", {
      user: req.user
    });
  };

  // Endpoint /browse for GET
  var getBrowse = function(req, res) {
    Building.find(function(err, buildings) {
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

  // Endpoint /search for POST
  var postSearch = function(req, res) {
    var keyword = req.body.keyword.toLowerCase();
    res.redirect("/search/" + keyword);
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

  return {
    getIndex: getIndex,
    getBrowse: getBrowse,
    getBuilding: getBuilding,
    postSearch: postSearch,
    getSearchTerm: getSearchTerm,
    getAdd: getAdd
  };
};