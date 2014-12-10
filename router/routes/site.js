var express = require("express");
var router = express.Router();
  
module.exports = function (passport) {
  var authController = require("../../controllers/auth")(passport);
  var siteController = require("../../controllers/site")(passport);

  router.route("/")
    .get(siteController.getIndex);

  router.route("/browse")
    .get(siteController.getBrowse);

  router.route("/building/:building_id")
    .get(siteController.getBuilding);

  router.route("/search")
    .post(siteController.postSearch);

  router.route("/search/:search_term")
    .get(siteController.getSearchTerm);
  
  router.route("/add")
    .get(authController.isAuthenticated, siteController.getAdd);

  router.route("/add/location/:building_id")
    .get(authController.isAuthenticated, siteController.getAddLocation);

  return router;
};