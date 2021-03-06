var express = require("express");
var router = express.Router();

module.exports = function (passport) {
  var authController = require("../../controllers/auth")(passport);
  var siteController = require("../../controllers/site")(passport);

  router.route("/")
    .get(siteController.getIndex);

  router.route("/browse")
    .get(siteController.getBrowse);

  router.route("/browse/all")
    .get(siteController.getBrowseAll);

  router.route("/building/:building_slugId/:building_name?")
    .get(siteController.getBuilding);

  router.route("/report/:building_id")
    .get(siteController.getBuildingReport)
    .post(siteController.postBuildingReport);

  router.route("/search/near/:lon,:lat,:distance")
    .get(siteController.getSearchNear);

  router.route("/search/user/:username")
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

  router.route("/user/:username")
    .get(siteController.getUser);

  router.route("/user/edit/:username")
    .get(authController.isAuthenticated, siteController.getUserEdit)
    .post(authController.isAuthenticated, siteController.postUserEdit);

  router.route("/terms")
    .get(siteController.getTerms);

  router.route("/contributing")
    .get(siteController.getContributing);

  return router;
};
