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

  router.route("/building/:building_id/report")
    .get(siteController.getBuildingReport)
    .post(siteController.postBuildingReport);

  router.route("/search/near/:lon/:lat/:distance")
    .get(siteController.getSearchNear);

  router.route("/search/user/:user_id")
    .get(siteController.getSearchUser);

  router.route("/search/osm/:osm_type/:osm_id")
    .get(siteController.getSearchOSM);

  router.route("/search/:search_term")
    .get(siteController.getSearchTerm);

  router.route("/search")
    .get(siteController.getSearch)
    .post(siteController.postSearch);
  
  router.route("/add")
    .get(authController.isAuthenticated, siteController.getAdd);

  router.route("/add/location/:building_id")
    .get(authController.isAuthenticated, siteController.getAddLocation);

  router.route("/add/osm/:building_id")
    .get(authController.isAuthenticated, siteController.getAddOSM);

  return router;
};